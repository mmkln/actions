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

function thoughtArticleView({ title, config }) {
  return `
    <article class="canvas-card canvas-card--thought" data-card-type="thought">
      <header class="thought-card__header">
        <span class="thought-card__icon" aria-hidden="true">${icon(config.icon)}</span>
        <span class="thought-card__label">${escapeHtml(config.label)}</span>
      </header>
      <blockquote class="thought-card__quote">“${escapeHtml(title)}”</blockquote>
    </article>
  `;
}

function regularArticleView({ type, title, config }) {
  return `
    <article class="canvas-card canvas-card--${type}" data-card-type="${type}">
      <div class="canvas-card__icon">${icon(config.icon)}</div>
      <div class="canvas-card__body">
        <p>${escapeHtml(title)}</p>
      </div>
    </article>
  `;
}

function cardControlsView({ editable }) {
  return `
    <button class="connection-button connection-action-button" type="button"></button>
    ${editable ? `
      <button class="canvas-card-edit" type="button" title="Edit item" aria-label="Edit item">
        ${icon('edit')}
      </button>
    ` : ''}
    <button class="canvas-card-remove" type="button" title="Remove from this Board" aria-label="Remove from this Board">
      ${icon('minus')}
    </button>
  `;
}

export function cardView({ type, title, editable = false }) {
  if (!isCardType(type)) {
    throw new TypeError(`Unsupported card type: ${type}`);
  }

  const config = CARD_TYPE_CONFIG[type];
  const article = type === 'thought'
    ? thoughtArticleView({ title, config })
    : regularArticleView({ type, title, config });

  return `${article}${cardControlsView({ editable })}`;
}

