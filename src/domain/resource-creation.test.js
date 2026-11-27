import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getResourceCreationOptions,
  getQuickActionProposal,
} from './resource-creation.js';

test('offers every creatable resource kind with hierarchy metadata', () => {
  const options = getResourceCreationOptions({
    title: 'Launch first version',
  });

  assert.equal(options[0].kind, 'action');
  assert.equal(options[0].canCreate, true);
  assert.equal(options[1].kind, 'task');
  assert.equal(options[1].canCreate, true);
  assert.equal(options[2].kind, 'thought');
  assert.equal(options[2].canCreate, true);
  assert.equal(options.find(({ kind }) => kind === 'achievement').parentKind, null);
  assert.equal(
    options.find(({ kind }) => kind === 'requirement').parentKind,
    'achievement',
  );
  assert.equal(
    options.find(({ kind }) => kind === 'gap').parentKind,
    'requirement',
  );
});

test('creation remains available independently of search state', () => {
  const options = getResourceCreationOptions({
    title: 'Launch first version',
    results: [{ kind: 'task', title: 'Launch first version' }],
    unavailableSources: ['majom', 'flying-thoughts'],
  });

  assert.equal(options.every(({ canCreate }) => canCreate), true);
});

test('uses source-specific title limits', () => {
  const options = getResourceCreationOptions({
    title: 'x'.repeat(201),
  });

  assert.equal(options.find(({ kind }) => kind === 'action').canCreate, true);
  assert.equal(options.find(({ kind }) => kind === 'task').tooLong, true);
  assert.equal(options.find(({ kind }) => kind === 'task').canCreate, false);
  assert.equal(options.find(({ kind }) => kind === 'thought').canCreate, true);
});

test('uses Action as the zero-configuration quick capture', () => {
  assert.deepEqual(
    getQuickActionProposal({ title: '  Decide what to do next  ' }),
    {
      kind: 'action',
      title: 'Decide what to do next',
      source: 'actions',
      parentKind: null,
      maximumLength: 500,
      tooLong: false,
      canCreate: true,
    },
  );
  assert.equal(getQuickActionProposal({ title: '   ' }), null);
});
