import assert from 'node:assert/strict';
import test from 'node:test';

import { createCanvasRenderScheduler } from './render-scheduler.js';


test('coalesces item and connection invalidations into one frame', () => {
  let callback = null;
  const updates = [];
  const scheduler = createCanvasRenderScheduler({
    requestFrame(next) {
      callback = next;
      return 1;
    },
    cancelFrame() {},
    onFlush(update) {
      updates.push(update);
    },
  });

  scheduler.request({ items: ['one'] });
  scheduler.request({ items: ['two', 'one'], connections: true });
  callback();

  assert.equal(updates.length, 1);
  assert.deepEqual([...updates[0].itemIds], ['one', 'two']);
  assert.equal(updates[0].connections, true);
});
