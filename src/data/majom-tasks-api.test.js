import assert from 'node:assert/strict';
import test from 'node:test';

import { createMajomTasksApi } from './majom-tasks-api.js';

test('resolves task UUIDs with one batch request', async () => {
  const requests = [];
  const api = createMajomTasksApi({
    request(path, options) {
      requests.push({ path, options });
      return Promise.resolve({ results: [] });
    },
  });

  await api.resolve(['first-uuid', 'second-uuid']);

  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].path,
    '/sources/majom/tasks/?uuids=first-uuid%2Csecond-uuid',
  );
});

test('does not call the backend for an empty UUID batch', async () => {
  let called = false;
  const api = createMajomTasksApi({
    request() {
      called = true;
    },
  });

  const result = await api.resolve([]);

  assert.equal(called, false);
  assert.deepEqual(result.results, []);
});

test('only sends task changes through the Actions BFF', async () => {
  let captured;
  const api = createMajomTasksApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({});
    },
  });

  await api.update('task-uuid', { status: 'completed' });

  assert.equal(captured.path, '/sources/majom/tasks/task-uuid/');
  assert.equal(captured.options.method, 'PATCH');
  assert.deepEqual(JSON.parse(captured.options.body), {
    status: 'completed',
  });
});
