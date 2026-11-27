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

function achievementArticleView({ title, config }) {
  return `
    <article class="canvas-card canvas-card--achievement" data-card-type="achievement">
      <header class="achievement-card__header">
        <span class="achievement-card__icon" aria-hidden="true">${icon(config.icon)}</span>
        <span class="achievement-card__label">${escapeHtml(config.label)}</span>
      </header>
      <p class="achievement-card__title">${escapeHtml(title)}</p>
    </article>
  `;
}

function taskArticleView({ title, config }) {
  return `
    <article class="canvas-card canvas-card--task" data-card-type="task">
      <header class="task-card__header">
        <span class="task-card__icon" aria-hidden="true">${icon(config.icon)}</span>
        <span class="task-card__label">${escapeHtml(config.label)}</span>
      </header>
      <p class="task-card__title">${escapeHtml(title)}</p>
    </article>
  `;
}

function requirementArticleView({ title, config }) {
  return `
    <article class="canvas-card canvas-card--requirement" data-card-type="requirement">
      <span class="requirement-card__icon" aria-hidden="true">${icon(config.icon)}</span>
      <div class="requirement-card__content">
        <span class="requirement-card__label">${escapeHtml(config.label)}</span>
        <p class="requirement-card__title">${escapeHtml(title)}</p>
      </div>
    </article>
  `;
}

function gapArticleView({ title, config }) {
  return `
    <article class="canvas-card canvas-card--gap" data-card-type="gap">
      <header class="gap-card__header">
        <span class="gap-card__icon" aria-hidden="true"></span>
        <span class="gap-card__label">${escapeHtml(config.label)}</span>
      </header>
      <p class="gap-card__title">${escapeHtml(title)}</p>
    </article>
  `;
}

function actionArticleView({ title, config, canOpen }) {
  return `
    <article class="canvas-card canvas-card--action" data-card-type="action">
      <div class="action-card__content">
        <span class="action-card__label">${escapeHtml(config.label)}</span>
        <p class="action-card__title">${escapeHtml(title)}</p>
      </div>
      <button
        class="action-card__open"
        type="button"
        aria-label="Open action"
        data-card-open
        ${canOpen ? '' : 'disabled'}
      >
        ${icon('chevronRight')}
      </button>
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

function cardControlsView() {
  return `
    <button class="connection-button connection-action-button" type="button"></button>
    <button class="canvas-card-remove" type="button" title="Remove from this Board" aria-label="Remove from this Board">
      ${icon('minus')}
    </button>
  `;
}

export function cardView({ type, title, canOpen = false }) {
  if (!isCardType(type)) {
    throw new TypeError(`Unsupported card type: ${type}`);
  }

  const config = CARD_TYPE_CONFIG[type];
  const articleView = {
    action: actionArticleView,
    thought: thoughtArticleView,
    achievement: achievementArticleView,
    task: taskArticleView,
    requirement: requirementArticleView,
    gap: gapArticleView,
  }[type] ?? regularArticleView;
  const article = articleView({ type, title, config, canOpen });

  return `${article}${cardControlsView()}`;
}

