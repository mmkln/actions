import assert from 'node:assert/strict';
import test from 'node:test';

import { resourceEditorView } from './resource-editor.js';

test('keeps the resource editor focused on the title and primary action', () => {
  const view = resourceEditorView();

  assert.match(view, /aria-label="Title"/);
  assert.match(view, /data-resource-editor-save/);
  assert.doesNotMatch(view, /data-resource-editor-source/);
  assert.doesNotMatch(view, /data-resource-editor-cancel/);
  assert.doesNotMatch(view, />TITLE</);
});
