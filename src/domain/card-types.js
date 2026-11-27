export const CARD_TYPES = Object.freeze({
  ACTION: 'action',
  THOUGHT: 'thought',
  GOAL: 'goal',
  TASK: 'task',
  ACHIEVEMENT: 'achievement',
  REQUIREMENT: 'requirement',
  GAP: 'gap',
});

export const CARD_TYPE_CONFIG = Object.freeze({
  [CARD_TYPES.ACTION]: Object.freeze({
    label: 'Action',
    pluralLabel: 'Actions',
    icon: 'action',
    source: 'actions',
    sourceLabel: 'Actions',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: false,
    parentKind: null,
    maximumTitleLength: 500,
  }),
  [CARD_TYPES.TASK]: Object.freeze({
    label: 'Task',
    pluralLabel: 'Tasks',
    icon: 'check',
    source: 'majom',
    sourceLabel: 'Majom',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: false,
    parentKind: null,
    maximumTitleLength: 200,
  }),
  [CARD_TYPES.THOUGHT]: Object.freeze({
    label: 'Thought',
    pluralLabel: 'Thoughts',
    icon: 'thought',
    source: 'flying-thoughts',
    sourceLabel: 'Flying Thoughts',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: true,
    parentKind: null,
    maximumTitleLength: 2000,
  }),
  [CARD_TYPES.ACHIEVEMENT]: Object.freeze({
    label: 'Achievement',
    pluralLabel: 'Achievements',
    icon: 'achievement',
    source: 'majom',
    sourceLabel: 'Majom',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: false,
    parentKind: null,
    maximumTitleLength: 255,
  }),
  [CARD_TYPES.REQUIREMENT]: Object.freeze({
    label: 'Requirement',
    pluralLabel: 'Requirements',
    icon: 'requirement',
    source: 'majom',
    sourceLabel: 'Majom',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: false,
    parentKind: CARD_TYPES.ACHIEVEMENT,
    maximumTitleLength: 255,
  }),
  [CARD_TYPES.GAP]: Object.freeze({
    label: 'Gap',
    pluralLabel: 'Gaps',
    icon: 'gap',
    source: 'majom',
    sourceLabel: 'Majom',
    searchable: true,
    creatable: true,
    editable: true,
    multiline: false,
    parentKind: CARD_TYPES.REQUIREMENT,
    maximumTitleLength: 255,
  }),
  [CARD_TYPES.GOAL]: Object.freeze({
    label: 'Goal',
    pluralLabel: 'Goals',
    icon: 'target',
    source: null,
    sourceLabel: null,
    searchable: false,
    creatable: false,
    editable: false,
    multiline: false,
    parentKind: null,
  }),
});

export const SEARCHABLE_CARD_TYPES = Object.freeze(
  Object.keys(CARD_TYPE_CONFIG).filter(
    (kind) => CARD_TYPE_CONFIG[kind].searchable,
  ),
);

export const CREATABLE_CARD_TYPES = Object.freeze(
  Object.keys(CARD_TYPE_CONFIG).filter(
    (kind) => CARD_TYPE_CONFIG[kind].creatable,
  ),
);

export function isCardType(value) {
  return Object.hasOwn(CARD_TYPE_CONFIG, value);
}

export function isExternalCardType(value) {
  return Boolean(CARD_TYPE_CONFIG[value]?.source);
}

