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

    replaceConnections({ sourceItemId, baseRevision, targetItemIds }) {
      return request(`/canvas/items/${sourceItemId}/connections/`, {
        method: 'PUT',
        body: JSON.stringify({
          base_revision: baseRevision,
          target_item_ids: targetItemIds,
        }),
      });
    },

    removeItem(itemId) {
      return request(`/canvas/items/${itemId}/`, { method: 'DELETE' });
    },

    restoreItem(undoToken) {
      return request('/canvas/items/restore/', {
        method: 'POST',
        body: JSON.stringify({ undo_token: undoToken }),
      });
    },
  });
}

