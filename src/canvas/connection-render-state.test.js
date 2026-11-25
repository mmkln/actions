import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRenderableConnections } from './connection-render-state.js';

test('replaces only the edited source with draft connections', () => {
  const persisted = [
    { id: 'one', sourceId: 'a', targetId: 'b', kind: 'related', spacing: 'normal' },
    { id: 'two', sourceId: 'c', targetId: 'd', kind: 'related', spacing: 'normal' },
  ];

  const rendered = buildRenderableConnections(persisted, {
    sourceId: 'a',
    selectedTargetIds: new Set(['b', 'e']),
  });

  assert.deepEqual(rendered, [
    { ...persisted[1], draft: false },
    { ...persisted[0], draft: true },
    {
      id: 'draft:a:e',
      sourceId: 'a',
      targetId: 'e',
      kind: 'related',
      spacing: 'normal',
      draft: true,
    },
  ]);
});
