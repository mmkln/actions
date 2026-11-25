import assert from 'node:assert/strict';
import test from 'node:test';

import { createActionsApi } from './actions-api.js';

test('loads the authenticated canvas from the BFF', async () => {
  const requests = [];
  const api = createActionsApi({
    apiBaseUrl: 'http://actions.test/api/v1',
    authSession: {
      getAccessToken: async () => 'access-token',
      clear() {},
    },
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ revision: 1, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const canvas = await api.getCanvas();

  assert.equal(canvas.revision, 1);
  assert.equal(requests[0].url, 'http://actions.test/api/v1/canvas/');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer access-token');
});

test('maps frontend layout fields to the backend contract', async () => {
  let requestBody;
  const api = createActionsApi({
    apiBaseUrl: 'http://actions.test/api/v1',
    authSession: {
      getAccessToken: async () => 'access-token',
      clear() {},
    },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ revision: 3 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  await api.updateLayout({
    baseRevision: 2,
    changes: [{ itemId: 'item-id', x: 120, y: 240 }],
  });

  assert.deepEqual(requestBody, {
    base_revision: 2,
    changes: [{ item_id: 'item-id', x: 120, y: 240 }],
  });
});

