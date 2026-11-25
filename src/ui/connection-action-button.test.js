import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ConnectionActionState,
  getConnectionActionState,
} from './connection-action-button.js';

test('maps editor context to one connection action state', () => {
  assert.equal(getConnectionActionState(), ConnectionActionState.IDLE);
  assert.equal(
    getConnectionActionState({ editing: true }),
    ConnectionActionState.AVAILABLE,
  );
  assert.equal(
    getConnectionActionState({ editing: true, source: true }),
    ConnectionActionState.SOURCE,
  );
  assert.equal(
    getConnectionActionState({ editing: true, selected: true }),
    ConnectionActionState.SELECTED,
  );
});
