import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clientPointToWorld,
  dragPosition,
  worldPointToClient,
  zoomCameraAtClientPoint,
} from './coordinate-space.js';


test('converts between client and stable world coordinates', () => {
  const bounds = { left: 30, top: 20 };
  const camera = { x: -100, y: 40, scale: 0.5 };
  const world = clientPointToWorld({ x: 180, y: 160 }, bounds, camera);

  assert.deepEqual(world, { x: 500, y: 200 });
  assert.deepEqual(worldPointToClient(world, bounds, camera), { x: 180, y: 160 });
});

test('keeps the world point beneath the pointer stable while zooming', () => {
  const bounds = { left: 10, top: 20 };
  const pointer = { x: 410, y: 320 };
  const before = { x: -100, y: 50, scale: 0.5 };
  const worldBefore = clientPointToWorld(pointer, bounds, before);
  const after = zoomCameraAtClientPoint(before, 0.8, pointer, bounds);

  assert.deepEqual(clientPointToWorld(pointer, bounds, after), worldBefore);
});

test('manual drag follows the pointer without snapping or bounds', () => {
  assert.deepEqual(
    dragPosition({ x: -20, y: 800 }, { x: 30, y: 45 }),
    { x: -50, y: 755 },
  );
});
