import assert from 'node:assert/strict';
import test from 'node:test';

import { resourceDeleteDialogView } from './resource-delete-dialog.js';

test('renders an explicit accessible permanent-delete confirmation', () => {
  const view = resourceDeleteDialogView();

  assert.match(view, /role="alertdialog"/);
  assert.match(view, /aria-modal="true"/);
  assert.match(view, /data-resource-delete-cancel/);
  assert.match(view, /data-resource-delete-confirm/);
  assert.match(view, /Delete permanently/);
});
