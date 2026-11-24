const paths = {
  spark: '<path d="M12 2.75c.46 4.86 2.39 6.79 7.25 7.25-4.86.46-6.79 2.39-7.25 7.25C11.54 12.39 9.61 10.46 4.75 10 9.61 9.54 11.54 7.61 12 2.75Z"/>',
  target: '<circle cx="12" cy="12" r="7.25"/><circle cx="12" cy="12" r="2.75"/><path d="m14.2 9.8 5.05-5.05M16.25 4.75h3v3"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.2 2.35 2.35 4.9-5.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};

export function icon(name, className = '') {
  const path = paths[name];
  if (!path) return '';

  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

