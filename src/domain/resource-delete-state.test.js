import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RESOURCE_DELETE_PHASES,
  beginResourceDeletion,
  canConfirmResourceDeletion,
  confirmResourceDeletion,
  createResourceDeleteState,
  failResourceDeletion,
} from './resource-delete-state.js';

test('moves permanent deletion through explicit confirmation states', () => {
  const resource = { kind: 'thought', resource_id: '1', title: 'Delete me' };
  const closed = createResourceDeleteState();
  const confirming = confirmResourceDeletion(resource);
  const deleting = beginResourceDeletion(confirming);
  const error = new Error('Source unavailable');
  const failed = failResourceDeletion(deleting, error);

  assert.equal(closed.phase, RESOURCE_DELETE_PHASES.CLOSED);
  assert.equal(canConfirmResourceDeletion(closed), false);
  assert.equal(confirming.resource, resource);
  assert.equal(canConfirmResourceDeletion(confirming), true);
  assert.equal(deleting.phase, RESOURCE_DELETE_PHASES.DELETING);
  assert.equal(canConfirmResourceDeletion(deleting), false);
  assert.equal(failed.phase, RESOURCE_DELETE_PHASES.FAILED);
  assert.equal(failed.error, error);
  assert.equal(canConfirmResourceDeletion(failed), true);
});
