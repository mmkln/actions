import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_TYPES } from './card-types.js';
import {
  DEMO_RESOURCES,
  resolveResource,
} from './demo-resources.js';

test('demo resources have stable source references', () => {
  assert.equal(DEMO_RESOURCES.length, 2);
  assert.deepEqual(
    DEMO_RESOURCES.map(({ type }) => type),
    [CARD_TYPES.THOUGHT, CARD_TYPES.GOAL],
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

