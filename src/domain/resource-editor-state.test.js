import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginResourceEditorSave,
  canSaveResourceEditor,
  changeResourceEditorTitle,
  createResourceEditorState,
  openResourceEditor,
} from './resource-editor-state.js';

test('opens an editor from a hydrated resource', () => {
  const resource = { kind: 'thought', resource_id: '1', title: 'Before' };
  const state = openResourceEditor(resource);

  assert.equal(state.resource, resource);
  assert.equal(state.draftTitle, 'Before');
  assert.equal(canSaveResourceEditor(state), false);
});

test('allows a non-empty changed title and blocks saves while busy', () => {
  const opened = openResourceEditor({ title: 'Before' });
  const changed = changeResourceEditorTitle(opened, 'After');

  assert.equal(canSaveResourceEditor(changed), true);
  assert.equal(canSaveResourceEditor(beginResourceEditorSave(changed)), false);
  assert.equal(
    canSaveResourceEditor(changeResourceEditorTitle(opened, '   ')),
    false,
  );
  assert.equal(createResourceEditorState().resource, null);
});
