import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_TYPES } from '../domain/card-types.js';
import { cardView } from './card.js';

test('renders the card kind through its icon without a duplicate text label', () => {
  const markup = cardView({
    type: CARD_TYPES.GOAL,
    title: 'Launch the product',
  });

  assert.match(markup, /canvas-card--goal/);
  assert.match(markup, /Launch the product/);
  assert.doesNotMatch(markup, />Goal</i);
  assert.doesNotMatch(markup, /canvas-card__type/);
  assert.doesNotMatch(markup, /canvas-card__detail/);
  assert.match(markup, /connection-action-button/);
  assert.match(markup, /aria-label="Remove from this Board"/);
  assert.match(markup, /canvas-card-remove/);
});

test('renders each Skopos resource as a supported canvas card', () => {
  for (const type of [
    CARD_TYPES.ACHIEVEMENT,
    CARD_TYPES.REQUIREMENT,
    CARD_TYPES.GAP,
  ]) {
    const markup = cardView({
      type,
      title: `Example ${type}`,
    });

    assert.match(markup, new RegExp(`canvas-card--${type}`));
    assert.match(markup, new RegExp(`Example ${type}`));
  }
});

