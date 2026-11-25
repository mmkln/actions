import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveActionsApiUrl } from './config.js';


test('uses the local backend on local development hosts', () => {
  assert.equal(
    resolveActionsApiUrl({ hostname: '127.0.0.1' }),
    'http://127.0.0.1:8002/api/v1',
  );
  assert.equal(
    resolveActionsApiUrl({ hostname: 'localhost' }),
    'http://127.0.0.1:8002/api/v1',
  );
});

test('uses PythonAnywhere for a deployed frontend', () => {
  assert.equal(
    resolveActionsApiUrl({ hostname: 'actions.gomajom.com' }),
    'https://mxllactions.pythonanywhere.com/api/v1',
  );
});

test('lets an explicit Vite setting override either default', () => {
  assert.equal(
    resolveActionsApiUrl({
      configuredUrl: ' https://staging.example.com/api/v1/ ',
      hostname: 'actions.gomajom.com',
    }),
    'https://staging.example.com/api/v1',
  );
});

