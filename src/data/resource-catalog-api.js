export function createResourceCatalogApi({ request }) {
  return Object.freeze({
    search({ query = '', kinds = [], limit = 20, signal } = {}) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (query) params.set('q', query);
      if (kinds.length) params.set('kinds', kinds.join(','));
      return request(
        `/catalog/search/?${params}`,
        signal ? { signal } : undefined,
      );
    },

    create({ kind, title, parent = null }) {
      return request('/catalog/resources/', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          title,
          ...(parent ? { parent } : {}),
        }),
      });
    },

    update({ kind, resourceId, title, version = null }) {
      return request(
        `/catalog/resources/${encodeURIComponent(kind)}/${encodeURIComponent(resourceId)}/`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title,
            ...(version != null ? { version } : {}),
          }),
        },
      );
    },

    delete({ kind, resourceId, version = null }) {
      const params = new URLSearchParams();
      if (version != null) params.set('version', String(version));
      const query = params.size ? `?${params}` : '';
      return request(
        `/catalog/resources/${encodeURIComponent(kind)}/${encodeURIComponent(resourceId)}/${query}`,
        { method: 'DELETE' },
      );
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
