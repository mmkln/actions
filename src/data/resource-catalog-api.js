export function createResourceCatalogApi({ request }) {
  return Object.freeze({
    search({ query = '', limit = 20 } = {}) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (query) params.set('q', query);
      return request(`/catalog/search/?${params}`);
    },

    resolve(references) {
      if (!references.length) {
        return Promise.resolve({
          results: [],
          unavailable_sources: [],
        });
      }
      return request('/catalog/resolve/', {
        method: 'POST',
        body: JSON.stringify({ references }),
      });
    },
  });
}
