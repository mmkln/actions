import assert from 'node:assert/strict';
import test from 'node:test';

import { createLayoutUpdateQueue } from './layout-update-queue.js';

test('serializes writes without blocking newer drag results', async () => {
  const batches = [];
  let releaseFirst;
  const firstWrite = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const queue = createLayoutUpdateQueue({
    async persist(changes) {
      batches.push(changes);
      if (batches.length === 1) await firstWrite;
    },
  });

  queue.enqueue({ itemId: 'one', x: 10, y: 20 });
  queue.enqueue({ itemId: 'two', x: 30, y: 40 });
  queue.enqueue({ itemId: 'two', x: 50, y: 60 });
  releaseFirst();
  await queue.whenIdle();

  assert.deepEqual(batches, [
    [{ itemId: 'one', x: 10, y: 20 }],
    [{ itemId: 'two', x: 50, y: 60 }],
  ]);
});

test('reports busy state around the complete queue', async () => {
  const busyStates = [];
  const queue = createLayoutUpdateQueue({
    async persist() {},
    onBusyChange(value) {
      busyStates.push(value);
    },
  });

  await queue.enqueue({ itemId: 'one', x: 1, y: 2 });

  assert.deepEqual(busyStates, [true, false]);
});

