import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getResourceCreationOptions,
  normalizeResourceTitle,
} from './resource-creation.js';

test('normalizes resource titles for exact duplicate detection', () => {
  assert.equal(
    normalizeResourceTitle('  Launch\n  FIRST version '),
    'launch first version',
  );
});

test('offers task and thought creation while disabling an exact duplicate kind', () => {
  const options = getResourceCreationOptions({
    query: 'Launch first version',
    results: [{ kind: 'task', title: 'launch  first version' }],
  });

  assert.equal(options[0].kind, 'task');
  assert.equal(options[0].duplicate, true);
  assert.equal(options[0].canCreate, false);
  assert.equal(options[1].kind, 'thought');
  assert.equal(options[1].canCreate, true);
});

test('uses source availability and source-specific title limits', () => {
  const options = getResourceCreationOptions({
    query: 'x'.repeat(201),
    unavailableSources: ['flying-thoughts'],
  });

  assert.equal(options[0].tooLong, true);
  assert.equal(options[1].sourceUnavailable, true);
  assert.equal(options.every(({ canCreate }) => !canCreate), true);
});
