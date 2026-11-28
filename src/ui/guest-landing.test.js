import assert from 'node:assert/strict';
import test from 'node:test';

import { guestLandingView } from './guest-landing.js';

test('renders one focused sign-in action and a static product preview', () => {
  const markup = guestLandingView();

  assert.match(markup, /Your actions, in one place/);
  assert.match(markup, /Uses your Majom ID/);
  assert.equal((markup.match(/data-guest-sign-in/g) ?? []).length, 1);
  assert.equal((markup.match(/guest-preview__card is-/g) ?? []).length, 3);
  assert.match(markup, /class="guest-preview" aria-hidden="true"/);
  assert.doesNotMatch(markup, /type="search"/);
});
