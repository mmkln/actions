import test from 'node:test';
import assert from 'node:assert/strict';

import { CARD_TYPES, isCardType } from './card-types.js';

test('recognizes every supported canvas card type', () => {
  assert.equal(isCardType(CARD_TYPES.THOUGHT), true);
  assert.equal(isCardType(CARD_TYPES.GOAL), true);
  assert.equal(isCardType(CARD_TYPES.TASK), true);
  assert.equal(isCardType('note'), false);
});

