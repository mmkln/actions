import assert from 'node:assert/strict';
import test from 'node:test';

import { createConnectionUpdateQueue } from './connection-update-queue.js';

test('serializes writes and collapses one source to its latest target set', async () => {
  const writes = [];
  let releaseFirst;
  const firstWrite = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const queue = createConnectionUpdateQueue({
    async persist(update) {
      writes.push(update);
      if (writes.length === 1) await firstWrite;
      return { revision: writes.length };
    },
    onCommit() {},
  });

  queue.enqueue({ sourceItemId: 'source', targetItemIds: ['one'] });
  queue.enqueue({ sourceItemId: 'source', targetItemIds: ['one', 'two'] });
  queue.enqueue({ sourceItemId: 'source', targetItemIds: ['two', 'three'] });
  releaseFirst();
  await queue.whenIdle();

  assert.deepEqual(writes, [
    { sourceItemId: 'source', targetItemIds: ['one'] },
    { sourceItemId: 'source', targetItemIds: ['two', 'three'] },
  ]);
});

test('serializes different sources through one canvas revision stream', async () => {
  const writes = [];
  const queue = createConnectionUpdateQueue({
    async persist(update) {
      writes.push(update);
      return { revision: writes.length };
    },
    onCommit() {},
  });

  queue.enqueue({ sourceItemId: 'one', targetItemIds: ['target-a'] });
  queue.enqueue({ sourceItemId: 'two', targetItemIds: ['target-b'] });
  await queue.whenIdle();

  assert.deepEqual(writes, [
    { sourceItemId: 'one', targetItemIds: ['target-a'] },
    { sourceItemId: 'two', targetItemIds: ['target-b'] },
  ]);
});

test('reports busy state around all queued writes', async () => {
  const busyStates = [];
  const queue = createConnectionUpdateQueue({
    async persist() {
      return { revision: 1 };
    },
    onCommit() {},
    onBusyChange(busy) {
      busyStates.push(busy);
    },
  });

  await queue.enqueue({ sourceItemId: 'source', targetItemIds: [] });

  assert.deepEqual(busyStates, [true, false]);
});

test('clears pending writes after a persistence failure', async () => {
  const writes = [];
  const errors = [];
  let releaseFirst;
  const firstWrite = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const queue = createConnectionUpdateQueue({
    async persist(update) {
      writes.push(update);
      await firstWrite;
      throw new Error('offline');
    },
    onCommit() {},
    onError(error, update) {
      errors.push({ error, update });
    },
  });

  queue.enqueue({ sourceItemId: 'one', targetItemIds: ['target-a'] });
  queue.enqueue({ sourceItemId: 'two', targetItemIds: ['target-b'] });
  releaseFirst();
  await queue.whenIdle();

  assert.equal(writes.length, 1);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].error.message, 'offline');
  assert.equal(errors[0].update.sourceItemId, 'one');
});
