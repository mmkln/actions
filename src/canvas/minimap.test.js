import assert from 'node:assert/strict';
import test from 'node:test';

import { getCanvasViewport, getMinimapProjection } from './minimap.js';


test('calculates the visible canvas rectangle in world coordinates', () => {
  assert.deepEqual(
    getCanvasViewport(
      { x: -200, y: -100, scale: 0.5 },
      { width: 1000, height: 600 },
    ),
    { x: 400, y: 200, width: 2000, height: 1200 },
  );
});

test('converts world coordinates to minimap coordinates and back', () => {
  const projection = getMinimapProjection(
    [{ x: 100, y: 200, width: 200, height: 100 }],
    { x: 0, y: 0, scale: 1 },
    { width: 1000, height: 600 },
    180,
    110,
  );
  const mapped = projection.worldToMap(250, 300);
  const restored = projection.mapToWorld(mapped.x, mapped.y);

  assert.ok(Math.abs(restored.x - 250) < 0.001);
  assert.ok(Math.abs(restored.y - 300) < 0.001);
});

test('keeps the current viewport in the minimap with no cards', () => {
  const viewport = { width: 960, height: 640 };
  const camera = { x: -400, y: 150, scale: 0.8 };
  const projection = getMinimapProjection([], camera, viewport, 180, 110);
  const visible = getCanvasViewport(camera, viewport);
  const topLeft = projection.worldToMap(visible.x, visible.y);
  const bottomRight = projection.worldToMap(
    visible.x + visible.width,
    visible.y + visible.height,
  );

  assert.ok(topLeft.x >= 0 && topLeft.y >= 0);
  assert.ok(bottomRight.x <= 180 && bottomRight.y <= 110);
});
