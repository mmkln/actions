import assert from 'node:assert/strict';
import test from 'node:test';

import { createApiClient } from './api-client.js';
import { createActionsApi } from './actions-api.js';

test('loads the authenticated canvas from the BFF', async () => {
  const requests = [];
  const apiClient = createApiClient({
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
  const api = createActionsApi({ request: apiClient.request });

  const canvas = await api.getCanvas();

  assert.equal(canvas.revision, 1);
  assert.equal(requests[0].url, 'http://actions.test/api/v1/canvas/');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer access-token');
});

test('maps frontend layout fields to the backend contract', async () => {
  let requestBody;
  const apiClient = createApiClient({
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
  const api = createActionsApi({ request: apiClient.request });

  await api.updateLayout({
    baseRevision: 2,
    changes: [{ itemId: 'item-id', x: 120, y: 240 }],
  });

  assert.deepEqual(requestBody, {
    base_revision: 2,
    changes: [{ item_id: 'item-id', x: 120, y: 240 }],
  });
});

test('replaces one item’s connections with the backend revision contract', async () => {
  let requestUrl;
  let requestMethod;
  let requestBody;
  const api = createActionsApi({
    request: async (url, options) => {
      requestUrl = url;
      requestMethod = options.method;
      requestBody = JSON.parse(options.body);
      return { revision: 7, connections: [] };
    },
  });

  await api.replaceConnections({
    sourceItemId: 'source-id',
    baseRevision: 6,
    targetItemIds: ['target-one', 'target-two'],
  });

  assert.equal(requestUrl, '/canvas/items/source-id/connections/');
  assert.equal(requestMethod, 'PUT');
  assert.deepEqual(requestBody, {
    base_revision: 6,
    target_item_ids: ['target-one', 'target-two'],
  });
});

