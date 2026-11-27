import assert from 'node:assert/strict';
import test from 'node:test';

import { canvasCardGeometry } from './geometry.js';

test('adapts thought geometry to its content within safe bounds', () => {
  assert.deepEqual(canvasCardGeometry('thought', 'i'), {
    width: 180,
    height: 109,
  });

  assert.deepEqual(canvasCardGeometry('thought', 'x'.repeat(120)), {
    width: 400,
    height: 186,
  });
});

test('uses the maximum thought geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('thought'), {
    width: 400,
    height: 203,
  });
});

test('adapts achievement geometry to its title within editorial bounds', () => {
  assert.deepEqual(canvasCardGeometry('achievement', 'Direction'), {
    width: 230,
    height: 130,
  });

  assert.deepEqual(
    canvasCardGeometry(
      'achievement',
      'Direction confirmed for the first product launch',
    ),
    {
      width: 300,
      height: 164,
    },
  );
});

test('uses maximum achievement geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('achievement'), {
    width: 300,
    height: 192,
  });
});

test('adapts task geometry to its action title', () => {
  assert.deepEqual(canvasCardGeometry('task', 'Run'), {
    width: 230,
    height: 130,
  });

  const longTask = canvasCardGeometry(
    'task',
    'Run five customer interviews and summarize all collected evidence',
  );

  assert.equal(longTask.width, 300);
  assert.ok(longTask.height > 130);
  assert.ok(longTask.height <= 192);
});

test('uses maximum task geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('task'), {
    width: 300,
    height: 192,
  });
});

test('uses default geometry for regular cards', () => {
  assert.deepEqual(canvasCardGeometry('goal'), {
    width: 280,
    height: 96,
  });
});
