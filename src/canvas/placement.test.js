import assert from 'node:assert/strict';
import test from 'node:test';

import {
  planCanvasInsertion,
  resolveCollisionFreePosition,
} from './placement.js';

test('keeps a programmatic placement when it is already free', () => {
  const candidate = { id: 'new', x: 40, y: 50, width: 280, height: 96 };

  assert.deepEqual(
    resolveCollisionFreePosition({
      candidate,
      obstacles: [{ id: 'other', x: 500, y: 50, width: 280, height: 96 }],
    }),
    candidate,
  );
});

test('moves a programmatic placement to the nearest free position', () => {
  const candidate = { id: 'new', x: 100, y: 100, width: 280, height: 96 };
  const obstacle = { id: 'other', x: 100, y: 100, width: 280, height: 96 };
  const result = resolveCollisionFreePosition({ candidate, obstacles: [obstacle], gap: 8 });

  assert.equal(
    result.x + result.width + 8 <= obstacle.x
      || obstacle.x + obstacle.width + 8 <= result.x
      || result.y + result.height + 8 <= obstacle.y
      || obstacle.y + obstacle.height + 8 <= result.y,
    true,
  );
});

test('manual drag coordinates remain outside automatic placement policy', () => {
  const candidate = { id: 'new', x: 100, y: 100, width: 280, height: 96 };

  assert.deepEqual(resolveCollisionFreePosition({ candidate, obstacles: [] }), candidate);
});

test('keeps a newly inserted card in place and displaces its blocker', () => {
  const candidate = { id: 'new', x: 100, y: 100, width: 280, height: 96 };
  const blocker = { id: 'old', x: 120, y: 110, width: 280, height: 96 };
  const result = planCanvasInsertion({ candidate, obstacles: [blocker], gap: 8 });

  assert.deepEqual(result.position, candidate);
  assert.equal(result.moved.length, 1);
  assert.equal(result.moved[0].id, 'old');
});

