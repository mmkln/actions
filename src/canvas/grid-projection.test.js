import assert from 'node:assert/strict';
import test from 'node:test';

import { projectCanvasGrid } from './grid-projection.js';

test('projects grid geometry through the camera zoom', () => {
  const fullSize = projectCanvasGrid({ x: 0, y: 0, scale: 1 }, 2);
  const halfSize = projectCanvasGrid({ x: 0, y: 0, scale: 0.5 }, 2);

  assert.equal(fullSize.spacing, 24);
  assert.equal(halfSize.spacing, 12);
  assert.equal(halfSize.dotRadius, fullSize.dotRadius / 2);
  assert.equal(halfSize.dotEdge, fullSize.dotEdge / 2);
});

test('keeps the repeated grid aligned to physical pixels while panning', () => {
  assert.deepEqual(
    projectCanvasGrid({ x: -5.2, y: 7.2, scale: 0.88 }, 2),
    {
      spacing: 21,
      offsetX: 16,
      offsetY: 7,
      dotRadius: 0.616,
      dotEdge: 0.7040000000000001,
    },
  );
});
