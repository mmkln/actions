import { CARD_TYPES } from './domain/card-types.js';
import { cardView } from './ui/card.js';
import { icon } from './ui/icons.js';

const starterCards = [
  {
    type: CARD_TYPES.THOUGHT,
    title: 'Зібрати все важливе в одному просторі',
  },
  {
    type: CARD_TYPES.GOAL,
    title: 'Запустити першу версію продукту',
    detail: 'Goal',
  },
  {
    type: CARD_TYPES.TASK,
    title: 'Описати основний сценарій користувача',
    detail: 'Majom task',
  },
];

export function appView() {
  return `
    <main class="app-shell">
      <header class="topbar">
        <div>
          <span class="eyebrow">Majom</span>
          <h1>Canvas</h1>
        </div>
        <button class="icon-button" type="button" aria-label="Add card" disabled>
          ${icon('plus')}
        </button>
      </header>

      <section class="canvas" aria-label="Main canvas">
        <div class="canvas__grid" aria-hidden="true"></div>
        <div class="canvas__orbit canvas__orbit--one" aria-hidden="true"></div>
        <div class="canvas__orbit canvas__orbit--two" aria-hidden="true"></div>

        <div class="canvas-card-position canvas-card-position--thought">
          ${cardView(starterCards[0])}
        </div>
        <div class="canvas-card-position canvas-card-position--goal">
          ${cardView(starterCards[1])}
        </div>
        <div class="canvas-card-position canvas-card-position--task">
          ${cardView(starterCards[2])}
        </div>

        <div class="canvas__status">
          <span>One board</span>
          <span aria-hidden="true">·</span>
          <span>Thoughts, goals & tasks</span>
        </div>
      </section>

      <div class="composer" aria-label="Card composer preview">
        <div class="composer__type">${icon('spark')}<span>Thought</span></div>
        <span class="composer__placeholder">Add something to your canvas…</span>
        <button class="composer__button" type="button" disabled>${icon('plus')}<span>Add</span></button>
      </div>
    </main>
  `;
}

