import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginResourcePlacement,
  cancelResourcePlacement,
  clearRecentPlacement,
  completeResourcePlacement,
  createResourcePlacementState,
} from './resource-placement-state.js';

test('tracks one pending resource without changing the session count', () => {
  const state = beginResourcePlacement(
    createResourcePlacementState(),
    'thought:one',
  );

  assert.equal(state.pendingKey, 'thought:one');
  assert.deepEqual(state.sessionKeys, []);
});

test('records each placed resource once and exposes recent feedback', () => {
  const first = completeResourcePlacement(
    createResourcePlacementState(),
    'thought:one',
  );
  const repeated = completeResourcePlacement(first, 'thought:one');

  assert.equal(repeated.pendingKey, null);
  assert.equal(repeated.recentKey, 'thought:one');
  assert.deepEqual(repeated.sessionKeys, ['thought:one']);
});

test('clears pending and recent feedback independently', () => {
  const pending = beginResourcePlacement(
    createResourcePlacementState(),
    'task:one',
  );
  const cancelled = cancelResourcePlacement(pending);
  const completed = completeResourcePlacement(cancelled, 'task:one');
  const cleared = clearRecentPlacement(completed, 'task:one');

  assert.equal(cancelled.pendingKey, null);
  assert.equal(cleared.recentKey, null);
  assert.deepEqual(cleared.sessionKeys, ['task:one']);
});
