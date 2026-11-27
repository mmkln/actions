import {
  CARD_TYPES,
  CARD_TYPE_CONFIG,
  CREATABLE_CARD_TYPES,
} from './card-types.js';

export function getResourceCreationOptions({
  title: rawTitle,
}) {
  const title = String(rawTitle ?? '').trim();
  if (!title) return [];

  return CREATABLE_CARD_TYPES.map((kind) => {
    const config = CARD_TYPE_CONFIG[kind];
    const source = config.source;
    const maximumLength = config.maximumTitleLength;
    const tooLong = title.length > maximumLength;

    return {
      kind,
      title,
      source,
      parentKind: config.parentKind,
      maximumLength,
      tooLong,
      canCreate: !tooLong,
    };
  });
}

export function getQuickActionProposal({ title }) {
  return getResourceCreationOptions({ title }).find(
    ({ kind }) => kind === CARD_TYPES.ACTION,
  ) ?? null;
}
