import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseIdentityResponse,
  parseRefreshResponse,
  parseSsoFragment,
  parseTokenSession,
} from './browser-session.js';

test('validates the complete SSO exchange contract', () => {
  assert.deepEqual(
    parseTokenSession({
      user: { id: 'user-id', email: 'person@example.com' },
      access: 'access-token',
      refresh: 'refresh-token',
    }),
    {
      account: { id: 'user-id', email: 'person@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
  );
  assert.equal(parseTokenSession({ user: {}, access: 'a', refresh: 'r' }), null);
});

test('validates refresh and identity responses', () => {
  assert.deepEqual(
    parseRefreshResponse({ access: 'next', refresh: 'rotated' }),
    { accessToken: 'next', refreshToken: 'rotated' },
  );
  assert.deepEqual(
    parseIdentityResponse({ user: { id: 'id', email: 'a@example.com' } }),
    { id: 'id', email: 'a@example.com' },
  );
});

test('reads the one-time SSO handoff from the URL fragment', () => {
  assert.deepEqual(parseSsoFragment('#sso_code=one-time-code'), {
    code: 'one-time-code',
    error: null,
  });
  assert.deepEqual(parseSsoFragment('#sso_error=access_denied'), {
    code: null,
    error: 'access_denied',
  });
});

