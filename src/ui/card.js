import { CARD_TYPE_CONFIG, isCardType } from '../domain/card-types.js';
import { icon } from './icons.js';

export function cardView({ type, title, detail }) {
  if (!isCardType(type)) {
    throw new TypeError(`Unsupported card type: ${type}`);
  }

  const config = CARD_TYPE_CONFIG[type];

  return `
    <article class="canvas-card canvas-card--${type}" data-card-type="${type}">
      <div class="canvas-card__icon">${icon(config.icon)}</div>
      <div class="canvas-card__body">
        <span class="canvas-card__type">${config.label}</span>
        <p>${title}</p>
        ${detail ? `<span class="canvas-card__detail">${detail}</span>` : ''}
      </div>
    </article>
  `;
}

