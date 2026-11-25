import { ThemeMode, normalizeThemeMode, resolveTheme } from '../theme.js';


export const THEME_STORAGE_KEY = 'actions:theme:v1';

export function createThemeController({
  root = globalThis.document?.documentElement,
  themeColor = globalThis.document?.querySelector('meta[name="theme-color"]'),
  storage = globalThis.localStorage,
  systemQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)'),
} = {}) {
  const listeners = new Set();
  let mode = ThemeMode.SYSTEM;
  let resolvedTheme = ThemeMode.LIGHT;

  try {
    mode = normalizeThemeMode(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    mode = ThemeMode.SYSTEM;
  }

  function snapshot() {
    return Object.freeze({ mode, resolvedTheme });
  }

  function apply() {
    resolvedTheme = resolveTheme(mode, systemQuery?.matches === true);
    if (root) {
      root.dataset.themeMode = mode;
      root.dataset.theme = resolvedTheme;
    }
    themeColor?.setAttribute(
      'content',
      resolvedTheme === ThemeMode.DARK ? '#0e0d14' : '#f8f7fd',
    );
    const next = snapshot();
    listeners.forEach((listener) => listener(next));
    return next;
  }

  function handleSystemChange() {
    if (mode === ThemeMode.SYSTEM) apply();
  }

  systemQuery?.addEventListener?.('change', handleSystemChange);
  apply();

  return Object.freeze({
    getSnapshot: snapshot,

    setMode(nextMode) {
      const normalized = normalizeThemeMode(nextMode);
      if (normalized === mode) return snapshot();
      mode = normalized;
      try {
        storage?.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // The choice still applies to this session when storage is unavailable.
      }
      return apply();
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },

    destroy() {
      systemQuery?.removeEventListener?.('change', handleSystemChange);
      listeners.clear();
    },
  });
}
