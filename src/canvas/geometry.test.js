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

test('uses default geometry for regular cards', () => {
  assert.deepEqual(canvasCardGeometry('task'), {
    width: 280,
    height: 96,
  });
});
