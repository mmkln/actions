import assert from 'node:assert/strict';
import test from 'node:test';

import { createAuthSession } from './auth-session.js';


function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    value: (key) => values.get(key) ?? null,
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('exchanges the one-time SSO code and clears the URL fragment', async () => {
  const storage = createStorage();
  const historyCalls = [];
  const session = createAuthSession({
    apiBaseUrl: 'http://actions.test/api/v1',
    frontendUrl: 'http://frontend.test/',
    storage,
    location: {
      hash: '#sso_code=one-time-code',
      pathname: '/',
      search: '',
      assign() {},
    },
    history: {
      replaceState: (...args) => historyCalls.push(args),
    },
    documentTitle: 'Actions',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://actions.test/api/v1/auth/sso/exchange/');
      assert.deepEqual(JSON.parse(options.body), { code: 'one-time-code' });
      return jsonResponse({
        user: { id: 'user-id', email: 'person@example.com' },
        access: 'access-token',
        refresh: 'refresh-token',
      });
    },
  });

  const restored = await session.restore();

  assert.deepEqual(restored, {
    status: 'authenticated',
    user: { id: 'user-id', email: 'person@example.com' },
  });
  assert.equal(storage.value('actions:refresh-token:v1'), 'refresh-token');
  assert.deepEqual(historyCalls[0], [null, 'Actions', '/']);
});

test('restores a persisted session through refresh and identity validation', async () => {
  const storage = createStorage({
    'actions:refresh-token:v1': 'stored-refresh',
  });
  const requestedUrls = [];
  const session = createAuthSession({
    apiBaseUrl: 'http://actions.test/api/v1',
    frontendUrl: 'http://frontend.test/',
    storage,
    location: { hash: '', pathname: '/', search: '', assign() {} },
    history: { replaceState() {} },
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      if (url.endsWith('/auth/token/refresh/')) {
        return jsonResponse({ access: 'new-access', refresh: 'rotated-refresh' });
      }
      return jsonResponse({
        user: { id: 'user-id', email: 'person@example.com' },
      });
    },
  });

  const restored = await session.restore();

  assert.equal(restored.status, 'authenticated');
  assert.deepEqual(requestedUrls, [
    'http://actions.test/api/v1/auth/token/refresh/',
    'http://actions.test/api/v1/auth/sso/me/',
  ]);
  assert.equal(storage.value('actions:refresh-token:v1'), 'rotated-refresh');
});

test('builds an allowlisted return target for sign in and account switching', () => {
  const assigned = [];
  const session = createAuthSession({
    apiBaseUrl: 'http://actions.test/api/v1',
    frontendUrl: 'http://127.0.0.1:5173/',
    storage: createStorage(),
    location: {
      hash: '',
      pathname: '/',
      search: '',
      assign: (url) => assigned.push(url),
    },
    history: { replaceState() {} },
  });

  session.startLogin({ switchAccount: true });

  const loginUrl = new URL(assigned[0]);
  assert.equal(loginUrl.pathname, '/api/v1/auth/sso/login/');
  assert.equal(loginUrl.searchParams.get('return_to'), 'http://127.0.0.1:5173/');
  assert.equal(loginUrl.searchParams.get('switch'), '1');
});

