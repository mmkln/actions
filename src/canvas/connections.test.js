import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getOutgoingTargetIds,
  normalizeConnection,
} from './connections.js';

test('normalizes backend connection fields for the canvas engine', () => {
  const connection = normalizeConnection({
    id: 'connection-id',
    source_item_id: 'source-id',
    target_item_id: 'target-id',
  });

  assert.deepEqual(connection, {
    id: 'connection-id',
    sourceId: 'source-id',
    targetId: 'target-id',
    kind: 'related',
    spacing: 'normal',
  });
});

test('returns only outgoing targets for one source', () => {
  assert.deepEqual(getOutgoingTargetIds([
    { sourceId: 'a', targetId: 'b' },
    { sourceId: 'c', targetId: 'd' },
    { sourceId: 'a', targetId: 'e' },
  ], 'a'), ['b', 'e']);
});
