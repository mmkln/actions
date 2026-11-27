import assert from 'node:assert/strict';
import test from 'node:test';

import { canvasCardGeometry } from './geometry.js';

test('uses a larger geometry for thought cards', () => {
  assert.deepEqual(canvasCardGeometry('thought'), {
    width: 400,
    height: 140,
  });
});

test('uses default geometry for regular cards', () => {
  assert.deepEqual(canvasCardGeometry('task'), {
    width: 280,
    height: 96,
  });
});
