import assert from 'node:assert/strict';
import test from 'node:test';

import { ThemeMode, normalizeThemeMode, resolveTheme } from './theme.js';


test('unknown theme preferences fall back to the system', () => {
  assert.equal(normalizeThemeMode('sepia'), ThemeMode.SYSTEM);
  assert.equal(normalizeThemeMode(null), ThemeMode.SYSTEM);
});

test('system appearance resolves from the operating system preference', () => {
  assert.equal(resolveTheme(ThemeMode.SYSTEM, false), ThemeMode.LIGHT);
  assert.equal(resolveTheme(ThemeMode.SYSTEM, true), ThemeMode.DARK);
  assert.equal(resolveTheme(ThemeMode.LIGHT, true), ThemeMode.LIGHT);
  assert.equal(resolveTheme(ThemeMode.DARK, false), ThemeMode.DARK);
});
