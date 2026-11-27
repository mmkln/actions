import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_TYPE_CONFIG } from './card-types.js';
import {
  beginResourceCreation,
  canSubmitResourceDraft,
  chooseResourceKind,
  chooseResourceParent,
  createResourcePaletteState,
  returnFromResourceCreation,
} from './resource-palette-state.js';

test('moves from search through type selection to configuration', () => {
  const choosing = beginResourceCreation(createResourcePaletteState());
  const configuring = chooseResourceKind(choosing, 'achievement');

  assert.equal(choosing.screen, 'choose-type');
  assert.equal(configuring.screen, 'configure');
  assert.equal(configuring.selectedKind, 'achievement');
  assert.equal(canSubmitResourceDraft(configuring, CARD_TYPE_CONFIG), true);
});

test('requires the correct parent for dependent Skopos resources', () => {
  const configuring = chooseResourceKind(
    beginResourceCreation(createResourcePaletteState()),
    'gap',
  );
  const wrongParent = chooseResourceParent(configuring, {
    kind: 'achievement',
    resource_id: 'achievement-id',
  });
  const correctParent = chooseResourceParent(configuring, {
    kind: 'requirement',
    resource_id: 'requirement-id',
  });

  assert.equal(canSubmitResourceDraft(configuring, CARD_TYPE_CONFIG), false);
  assert.equal(canSubmitResourceDraft(wrongParent, CARD_TYPE_CONFIG), false);
  assert.equal(canSubmitResourceDraft(correctParent, CARD_TYPE_CONFIG), true);
});

test('backs out from configuration before returning to search', () => {
  const configuring = chooseResourceKind(
    beginResourceCreation(createResourcePaletteState()),
    'requirement',
  );

  const choosing = returnFromResourceCreation(configuring);
  const searching = returnFromResourceCreation(choosing);

  assert.equal(choosing.screen, 'choose-type');
  assert.equal(searching.screen, 'search');
});
