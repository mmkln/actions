import {
  CARD_TYPE_CONFIG,
  CREATABLE_CARD_TYPES,
} from './card-types.js';

export function normalizeResourceTitle(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

export function getResourceCreationOptions({
  query,
  results = [],
  unavailableSources = [],
}) {
  const title = String(query ?? '').trim();
  if (!title) return [];

  const normalizedTitle = normalizeResourceTitle(title);
  return CREATABLE_CARD_TYPES.map((kind) => {
    const config = CARD_TYPE_CONFIG[kind];
    const source = config.source;
    const maximumLength = config.maximumTitleLength;
    const duplicate = results.some((resource) => (
      resource.kind === kind
      && normalizeResourceTitle(resource.title) === normalizedTitle
    ));
    const tooLong = title.length > maximumLength;
    const sourceUnavailable = unavailableSources.includes(source);

    return {
      kind,
      title,
      source,
      maximumLength,
      duplicate,
      tooLong,
      sourceUnavailable,
      canCreate: !duplicate && !tooLong && !sourceUnavailable,
    };
  });
}
