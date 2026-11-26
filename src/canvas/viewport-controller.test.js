import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fitCameraToBounds,
  MAXIMUM_CANVAS_SCALE,
  MINIMUM_CANVAS_SCALE,
  normalizeCanvasCamera,
} from './viewport-controller.js';


test('normalizes camera input to the Actions zoom range', () => {
  assert.deepEqual(normalizeCanvasCamera({ x: 12, y: -8, scale: 4 }), {
    x: 12,
    y: -8,
    scale: MAXIMUM_CANVAS_SCALE,
  });
  assert.deepEqual(normalizeCanvasCamera({ scale: 0.01 }), {
    x: 0,
    y: 0,
    scale: MINIMUM_CANVAS_SCALE,
  });
});

test('fits world bounds inside the viewport with screen-space padding', () => {
  assert.deepEqual(
    fitCameraToBounds(
      { x: 0, y: 0, width: 2000, height: 1000 },
      { width: 1000, height: 800 },
      { padding: 100 },
    ),
    { x: 100, y: 200, scale: 0.4 },
  );
});
