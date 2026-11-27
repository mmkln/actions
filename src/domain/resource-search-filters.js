export const RESOURCE_SEARCH_FILTERS = Object.freeze([
  Object.freeze({
    id: 'all',
    label: 'All',
    kinds: Object.freeze([]),
  }),
  Object.freeze({
    id: 'tasks',
    label: 'Tasks',
    kinds: Object.freeze(['task']),
  }),
  Object.freeze({
    id: 'thoughts',
    label: 'Thoughts',
    kinds: Object.freeze(['thought']),
  }),
  Object.freeze({
    id: 'skopos',
    label: 'Skopos',
    kinds: Object.freeze(['achievement', 'requirement', 'gap']),
  }),
]);

export function resourceSearchFilter(id) {
  return RESOURCE_SEARCH_FILTERS.find(
    (filter) => filter.id === id,
  ) ?? RESOURCE_SEARCH_FILTERS[0];
}
