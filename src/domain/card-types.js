export const CARD_TYPES = Object.freeze({
  THOUGHT: 'thought',
  GOAL: 'goal',
  TASK: 'task',
});

export const CARD_TYPE_CONFIG = Object.freeze({
  [CARD_TYPES.THOUGHT]: Object.freeze({ label: 'Thought', icon: 'spark' }),
  [CARD_TYPES.GOAL]: Object.freeze({ label: 'Goal', icon: 'target' }),
  [CARD_TYPES.TASK]: Object.freeze({ label: 'Majom task', icon: 'check' }),
});

export function isCardType(value) {
  return Object.hasOwn(CARD_TYPE_CONFIG, value);
}

