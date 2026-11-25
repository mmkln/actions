export function createActionsApi({ request }) {
  return Object.freeze({
    getCanvas() {
      return request('/canvas/');
    },

    addItem(item) {
      return request('/canvas/items/', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },

    updateLayout({ baseRevision, changes }) {
      return request('/canvas/layout/', {
        method: 'PATCH',
        body: JSON.stringify({
          base_revision: baseRevision,
          changes: changes.map(({ itemId, x, y }) => ({
            item_id: itemId,
            x,
            y,
          })),
        }),
      });
    },

    removeItem(itemId) {
      return request(`/canvas/items/${itemId}/`, { method: 'DELETE' });
    },
  });
}

