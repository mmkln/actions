import assert from 'node:assert/strict';
import test from 'node:test';

import {
  THEME_STORAGE_KEY,
  createThemeController,
} from './theme-controller.js';


function fixtures({ stored = null, systemDark = false } = {}) {
  const values = new Map(stored ? [[THEME_STORAGE_KEY, stored]] : []);
  const root = { dataset: {} };
  const themeColor = {
    value: null,
    setAttribute(_name, value) {
      this.value = value;
    },
  };
  const systemQuery = {
    matches: systemDark,
    listener: null,
    addEventListener(_event, listener) {
      this.listener = listener;
    },
    removeEventListener() {
      this.listener = null;
    },
  };
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
  return { root, themeColor, systemQuery, storage, values };
}

test('applies and persists an explicit appearance', () => {
  const input = fixtures();
  const controller = createThemeController(input);

  controller.setMode('dark');

  assert.deepEqual(controller.getSnapshot(), {
    mode: 'dark',
    resolvedTheme: 'dark',
  });
  assert.equal(input.root.dataset.theme, 'dark');
  assert.equal(input.values.get(THEME_STORAGE_KEY), 'dark');
  assert.equal(input.themeColor.value, '#0e0d14');
});

test('follows system changes only while system appearance is selected', () => {
  const input = fixtures({ stored: 'system' });
  const controller = createThemeController(input);

  input.systemQuery.matches = true;
  input.systemQuery.listener();
  assert.equal(controller.getSnapshot().resolvedTheme, 'dark');

  controller.setMode('light');
  input.systemQuery.matches = false;
  input.systemQuery.listener();
  assert.equal(controller.getSnapshot().resolvedTheme, 'light');
});
