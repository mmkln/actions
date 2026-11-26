export const RESOURCE_CREATION_KINDS = Object.freeze(['task', 'thought']);

const SOURCE_BY_KIND = Object.freeze({
  task: 'majom',
  thought: 'flying-thoughts',
});

const TITLE_LIMIT_BY_KIND = Object.freeze({
  task: 200,
  thought: 2000,
});

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
  return RESOURCE_CREATION_KINDS.map((kind) => {
    const source = SOURCE_BY_KIND[kind];
    const maximumLength = TITLE_LIMIT_BY_KIND[kind];
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
