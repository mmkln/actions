import assert from 'node:assert/strict';
import test from 'node:test';

import {
  captureSelectionOrigins,
  createCanvasSelection,
  selectCardsInRectangle,
  selectionRectangle,
  setCanvasSelectionIds,
  toggleCanvasSelectionId,
  translateSelectionOrigins,
} from './selection.js';

test('normalizes a selection rectangle dragged in any direction', () => {
  assert.deepEqual(
    selectionRectangle({ x: 180, y: 120 }, { x: 20, y: 35 }),
    { left: 20, top: 35, right: 180, bottom: 120 },
  );
});

test('selects cards that partially intersect the rectangle', () => {
  const selected = selectCardsInRectangle([
    { id: 'inside', x: 20, y: 20, width: 80, height: 40 },
    { id: 'edge', x: 95, y: 50, width: 80, height: 40 },
    { id: 'outside', x: 220, y: 20, width: 80, height: 40 },
  ], { left: 0, top: 0, right: 120, bottom: 80 });

  assert.deepEqual([...selected], ['inside', 'edge']);
});

test('updates selection ids without mutating the previous selection', () => {
  const initial = createCanvasSelection(['first']);
  const added = toggleCanvasSelectionId(initial, 'second');
  const replaced = setCanvasSelectionIds(added, ['third']);

  assert.deepEqual([...initial.selectedIds], ['first']);
  assert.deepEqual([...added.selectedIds], ['first', 'second']);
  assert.deepEqual([...replaced.selectedIds], ['third']);
});

test('moves every selected card by the same world-space delta', () => {
  const origins = captureSelectionOrigins([
    { id: 'a', x: 10, y: 20 },
    { id: 'b', x: 90, y: 75 },
    { id: 'c', x: 400, y: 300 },
  ], new Set(['a', 'b']));

  const positions = translateSelectionOrigins(origins, { x: 35, y: -10 });

  assert.deepEqual(positions, [
    { id: 'a', x: 45, y: 10 },
    { id: 'b', x: 125, y: 65 },
  ]);
  assert.equal(positions[1].x - positions[0].x, 80);
  assert.equal(positions[1].y - positions[0].y, 55);
});
