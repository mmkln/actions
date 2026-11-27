const paths = {
  action: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h7M12 8l4 4-4 4"/>',
  thought: '<path d="M7.2 17.9C4.9 16.7 3.5 14.6 3.5 12.2 3.5 8.1 7.2 5 12 5s8.5 3.1 8.5 7.2-3.7 7.3-8.5 7.3c-.9 0-1.7-.1-2.5-.4L6.1 21l1.1-3.1Z"/>',
  spark: '<path d="M12 2.75c.46 4.86 2.39 6.79 7.25 7.25-4.86.46-6.79 2.39-7.25 7.25C11.54 12.39 9.61 10.46 4.75 10 9.61 9.54 11.54 7.61 12 2.75Z"/>',
  target: '<circle cx="12" cy="12" r="7.25"/><circle cx="12" cy="12" r="2.75"/><path d="m14.2 9.8 5.05-5.05M16.25 4.75h3v3"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.2 2.35 2.35 4.9-5.1"/>',
  achievement: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12 2.6 2.6L16.5 9"/>',
  requirement: '<path d="M9 6h10M9 12h10M9 18h10"/><path d="m4 6 1.3 1.3 2.5-2.5M4 12l1.3 1.3 2.5-2.5M4 18l1.3 1.3 2.5-2.5"/>',
  gap: '<path d="M4 12h6M14 12h6"/><path d="m7 9 3 3-3 3M17 9l-3 3 3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  checkmark: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  minus: '<path d="M5 12h14"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.83 2.83 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.25"/><path d="m15.2 15.2 4.05 4.05"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  'arrow-left': '<path d="m15 18-6-6 6-6"/>',
  fit: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
  chevronDown: '<path d="m7 10 5 5 5-5"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
};

export function icon(name, className = '') {
  const path = paths[name];
  if (!path) return '';

  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

