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

test('renders a thought as an editorial quote card', () => {
  const markup = cardView({
    type: CARD_TYPES.THOUGHT,
    title: 'We need evidence.',
  });

  assert.match(markup, /thought-card__header/);
  assert.match(markup, /thought-card__label/);
  assert.match(markup, />Thought</);
  assert.match(markup, /thought-card__quote/);
  assert.match(markup, /“We need evidence\.”/);
  assert.doesNotMatch(markup, /canvas-card__body/);
});

test('renders an achievement as an editorial outcome card', () => {
  const markup = cardView({
    type: CARD_TYPES.ACHIEVEMENT,
    title: 'Direction confirmed.',
  });

  assert.match(markup, /canvas-card--achievement/);
  assert.match(markup, /achievement-card__header/);
  assert.match(markup, /achievement-card__label/);
  assert.match(markup, />Achievement</);
  assert.match(markup, /achievement-card__title/);
  assert.match(markup, /Direction confirmed\./);
  assert.doesNotMatch(markup, /canvas-card__body/);
});

test('renders a task as an editorial action card', () => {
  const markup = cardView({
    type: CARD_TYPES.TASK,
    title: 'Run five customer interviews',
  });

  assert.match(markup, /canvas-card--task/);
  assert.match(markup, /task-card__header/);
  assert.match(markup, /task-card__icon/);
  assert.match(markup, /task-card__label/);
  assert.match(markup, />Task</);
  assert.match(markup, /task-card__title/);
  assert.match(markup, />Run five customer interviews</);
  assert.doesNotMatch(markup, /task-card__(?:verb|remainder)/);
  assert.doesNotMatch(markup, /canvas-card__body/);
});

test('renders an action as a directional editorial card', () => {
  const markup = cardView({
    type: CARD_TYPES.ACTION,
    title: 'Improve customer activation',
    canOpen: true,
  });

  assert.match(markup, /canvas-card--action/);
  assert.match(markup, /action-card__content/);
  assert.match(markup, /action-card__label/);
  assert.match(markup, />Action</);
  assert.match(markup, /action-card__title/);
  assert.match(markup, /Improve customer activation/);
  assert.match(markup, /data-card-open/);
  assert.match(markup, /aria-label="Open action"/);
  assert.doesNotMatch(markup, /action-card__icon/);
  assert.doesNotMatch(markup, /data-card-open[^>]*disabled/);
  assert.doesNotMatch(markup, /canvas-card__body/);
});

test('disables action navigation until the resource is available', () => {
  const markup = cardView({
    type: CARD_TYPES.ACTION,
    title: 'Loading…',
  });

  assert.match(markup, /data-card-open[^>]*disabled/);
});

test('escapes the complete task title', () => {
  const markup = cardView({
    type: CARD_TYPES.TASK,
    title: '<Run> five & more',
  });

  assert.match(markup, /&lt;Run&gt;/);
  assert.match(markup, /five &amp; more/);
  assert.doesNotMatch(markup, /<Run>/);
});

test('does not render a legacy edit button on the card', () => {
  const markup = cardView({
    type: CARD_TYPES.THOUGHT,
    title: 'Editable thought',
  });

  assert.doesNotMatch(markup, /canvas-card-edit/);
  assert.match(markup, /canvas-card-remove/);
});

