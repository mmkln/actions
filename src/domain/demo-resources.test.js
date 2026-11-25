import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_TYPES } from './card-types.js';
import {
  DEMO_RESOURCES,
  demoPlacements,
  resolveResource,
} from './demo-resources.js';

test('demo resources have stable source references', () => {
  assert.equal(DEMO_RESOURCES.length, 3);
  assert.deepEqual(
    DEMO_RESOURCES.map(({ type }) => type),
    [CARD_TYPES.THOUGHT, CARD_TYPES.GOAL, CARD_TYPES.TASK],
  );
});

test('converts relative demo placements to canvas coordinates', () => {
  const placements = demoPlacements({ width: 1000, height: 800 });

  assert.deepEqual(
    placements.map(({ x, y }) => ({ x, y })),
    [
      { x: 250, y: 232 },
      { x: 550, y: 344 },
      { x: 360, y: 504 },
    ],
  );
});

test('falls back to an explicit reference when hydration is unavailable', () => {
  const resource = resolveResource({
    kind: CARD_TYPES.TASK,
    resource_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  });

  assert.equal(resource.title, 'Majom task reference');
  assert.equal(resource.detail, 'aaaaaaaa');
});

