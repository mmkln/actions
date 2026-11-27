import assert from 'node:assert/strict';
import test from 'node:test';

import { projectCanvasGrid } from './grid-projection.js';

test('projects grid geometry through the camera zoom', () => {
  const fullSize = projectCanvasGrid({ x: 0, y: 0, scale: 1 }, 2);
  const halfSize = projectCanvasGrid({ x: 0, y: 0, scale: 0.5 }, 2);

  assert.equal(fullSize.spacing, 24);
  assert.equal(halfSize.spacing, 12);
  assert.equal(fullSize.dotRadius, 0.75);
  assert.equal(fullSize.dotEdge, 1);
  assert.equal(halfSize.dotRadius, 0.25);
  assert.equal(halfSize.dotEdge, 0.5);
});

test('keeps the repeated grid aligned to physical pixels while panning', () => {
  assert.deepEqual(
    projectCanvasGrid({ x: -5.2, y: 7.2, scale: 0.88 }, 2),
    {
      spacing: 21,
      offsetX: 16,
      offsetY: 7,
      dotRadius: 0.5,
      dotEdge: 0.75,
    },
  );
});

test('keeps every grid dot at least one physical pixel wide', () => {
  const scales = [0.3, 0.4, 0.5, 0.65, 0.8, 1];
  const pixelRatios = [1, 1.25, 1.5, 2, 3];

  for (const scale of scales) {
    for (const pixelRatio of pixelRatios) {
      const grid = projectCanvasGrid({ x: 0, y: 0, scale }, pixelRatio);
      const physicalDiameter = grid.dotRadius * 2 * pixelRatio;

      assert.ok(
        physicalDiameter >= 1,
        `scale=${scale}, pixelRatio=${pixelRatio}`,
      );
      assert.ok(grid.dotEdge > grid.dotRadius);
    }
  }
});
