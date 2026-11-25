import assert from 'node:assert/strict';
import test from 'node:test';

import { getCardEndpoint, getConnectionPathData } from './connection-geometry.js';

test('places a horizontal connection at the card edges', () => {
  assert.deepEqual(
    getCardEndpoint(
      { x: 100, y: 100, width: 80, height: 40 },
      { x: 300, y: 100, width: 80, height: 40 },
    ),
    { x: 140, y: 100 },
  );
});

test('produces a stable curved SVG path', () => {
  const path = getConnectionPathData(
    { x: 100, y: 100, width: 80, height: 40 },
    { x: 300, y: 180, width: 80, height: 40 },
  );
  assert.match(path, /^M .+ C .+ C .+$/);
});
