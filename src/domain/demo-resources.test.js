import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_TYPES } from './card-types.js';
import {
  DEMO_RESOURCES,
  findDemoResource,
  resolveResource,
} from './demo-resources.js';

test('demo resources have stable source references', () => {
  assert.equal(DEMO_RESOURCES.length, 2);
  assert.deepEqual(
    DEMO_RESOURCES.map(({ type }) => type),
    [CARD_TYPES.THOUGHT, CARD_TYPES.GOAL],
  );
});

test('finds demo resources without inventing a fallback', () => {
  assert.equal(findDemoResource({
    kind: CARD_TYPES.TASK,
    resource_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  }), null);
});

test('falls back to an explicit unavailable state when hydration fails', () => {
  const resource = resolveResource({
    kind: CARD_TYPES.TASK,
    resource_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  });

  assert.equal(resource.title, 'Task unavailable');
  assert.equal(resource.detail, 'aaaaaaaa');
});

