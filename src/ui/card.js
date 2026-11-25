import { CARD_TYPE_CONFIG, isCardType } from '../domain/card-types.js';
import { icon } from './icons.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function cardView({ type, title }) {
  if (!isCardType(type)) {
    throw new TypeError(`Unsupported card type: ${type}`);
  }

  const config = CARD_TYPE_CONFIG[type];

  return `
    <article class="canvas-card canvas-card--${type}" data-card-type="${type}">
      <div class="canvas-card__icon">${icon(config.icon)}</div>
      <div class="canvas-card__body">
        <p>${escapeHtml(title)}</p>
      </div>
    </article>
    <button class="connection-button connection-action-button" type="button"></button>
  `;
}

