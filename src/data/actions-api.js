export class ActionsApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = 'ActionsApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function createActionsApi({
  apiBaseUrl,
  authSession,
  fetchImpl = globalThis.fetch,
}) {
  const baseUrl = apiBaseUrl.replace(/\/$/, '');

  async function request(path, options = {}, retryAuthentication = true) {
    const accessToken = await authSession.getAccessToken();
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    if (response.status === 401 && retryAuthentication) {
      authSession.clear();
      return request(path, options, false);
    }

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new ActionsApiError(
        payload?.detail ?? `Actions API request failed (${response.status}).`,
        { status: response.status, payload },
      );
    }
    return payload;
  }

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

