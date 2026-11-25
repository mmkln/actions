export const ThemeMode = Object.freeze({
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
});

const THEME_ORDER = Object.freeze([
  ThemeMode.SYSTEM,
  ThemeMode.LIGHT,
  ThemeMode.DARK,
]);

export function normalizeThemeMode(value) {
  return THEME_ORDER.includes(value) ? value : ThemeMode.SYSTEM;
}

export function resolveTheme(mode, systemUsesDark) {
  const normalized = normalizeThemeMode(mode);
  if (normalized === ThemeMode.LIGHT) return ThemeMode.LIGHT;
  if (normalized === ThemeMode.DARK) return ThemeMode.DARK;
  return systemUsesDark ? ThemeMode.DARK : ThemeMode.LIGHT;
}
