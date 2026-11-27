import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CARD_TYPES,
  CREATABLE_CARD_TYPES,
  SEARCHABLE_CARD_TYPES,
  isCardType,
  isExternalCardType,
} from './card-types.js';

test('recognizes every supported canvas card type', () => {
  assert.equal(isCardType(CARD_TYPES.THOUGHT), true);
  assert.equal(isCardType(CARD_TYPES.GOAL), true);
  assert.equal(isCardType(CARD_TYPES.TASK), true);
  assert.equal(isCardType(CARD_TYPES.ACHIEVEMENT), true);
  assert.equal(isCardType(CARD_TYPES.REQUIREMENT), true);
  assert.equal(isCardType(CARD_TYPES.GAP), true);
  assert.equal(isCardType('note'), false);
});

test('derives searchable, creatable, and external types from one registry', () => {
  assert.deepEqual(SEARCHABLE_CARD_TYPES, [
    CARD_TYPES.TASK,
    CARD_TYPES.THOUGHT,
    CARD_TYPES.ACHIEVEMENT,
    CARD_TYPES.REQUIREMENT,
    CARD_TYPES.GAP,
  ]);
  assert.deepEqual(CREATABLE_CARD_TYPES, [
    CARD_TYPES.TASK,
    CARD_TYPES.THOUGHT,
    CARD_TYPES.ACHIEVEMENT,
    CARD_TYPES.REQUIREMENT,
    CARD_TYPES.GAP,
  ]);
  assert.equal(isExternalCardType(CARD_TYPES.ACHIEVEMENT), true);
  assert.equal(isExternalCardType(CARD_TYPES.REQUIREMENT), true);
  assert.equal(isExternalCardType(CARD_TYPES.GAP), true);
  assert.equal(isExternalCardType(CARD_TYPES.GOAL), false);
});

