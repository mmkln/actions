import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCanvasCamera, saveCanvasCamera } from './camera-store.js';


test('stores camera state separately for each Majom account', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  saveCanvasCamera(storage, 'one', { x: 12, y: 24, scale: 0.7 });
  saveCanvasCamera(storage, 'two', { x: -30, y: 5, scale: 0.8 });

  assert.deepEqual(loadCanvasCamera(storage, 'one'), { x: 12, y: 24, scale: 0.7 });
  assert.deepEqual(loadCanvasCamera(storage, 'two'), { x: -30, y: 5, scale: 0.8 });
});
