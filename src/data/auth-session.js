import {
  parseIdentityResponse,
  parseRefreshResponse,
  parseSsoFragment,
  parseTokenSession,
} from '../auth/browser-session.js';


const ACCOUNT_STORAGE_KEY = 'actions:auth:v1';
const REFRESH_STORAGE_KEY = 'actions:refresh-token:v1';

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

async function responsePayload(response) {
  return response.json().catch(() => null);
}

function responseMessage(payload, fallback) {
  return typeof payload?.detail === 'string' ? payload.detail : fallback;
}

export function createAuthSession({
  apiBaseUrl,
  authMode = 'sso',
  frontendUrl = `${window.location.origin}${window.location.pathname}`,
  fetchImpl = globalThis.fetch,
  storage = globalThis.localStorage,
  location = globalThis.location,
  history = globalThis.history,
  documentTitle = globalThis.document?.title ?? '',
}) {
  let account = null;
  let accessToken = null;
  let refreshToken = storage.getItem(REFRESH_STORAGE_KEY);
  let refreshInFlight = null;

  function storeRefreshToken(token) {
    refreshToken = token;
    if (token) {
      storage.setItem(REFRESH_STORAGE_KEY, token);
    } else {
      storage.removeItem(REFRESH_STORAGE_KEY);
    }
  }

  function storeAccount(nextAccount) {
    account = nextAccount;
    if (nextAccount) {
      storage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccount));
    } else {
      storage.removeItem(ACCOUNT_STORAGE_KEY);
    }
  }

  function applyTokenSession(payload) {
    const session = parseTokenSession(payload);
    if (!session) {
      throw new Error('The server returned an invalid sign-in response.');
    }
    storeAccount(session.account);
    accessToken = session.accessToken;
    storeRefreshToken(session.refreshToken);
  }

  function clearSession() {
    account = null;
    accessToken = null;
    refreshInFlight = null;
    storeRefreshToken(null);
    storage.removeItem(ACCOUNT_STORAGE_KEY);
  }

  function clearSsoFragment() {
    history.replaceState(
      null,
      documentTitle,
      `${location.pathname}${location.search}`,
    );
  }

  async function exchangeSsoCallback() {
    const { code, error } = parseSsoFragment(location.hash);
    if (!code && !error) {
      return false;
    }
    clearSsoFragment();

    if (error) {
      if (error === 'access_denied') {
        return false;
      }
      throw new Error('Majom ID could not complete sign in.');
    }

    const response = await fetchImpl(`${apiBaseUrl}/auth/sso/exchange/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw new Error(responseMessage(payload, 'Could not complete sign in.'));
    }

    applyTokenSession(payload);
    return true;
  }

  async function requestDevelopmentSession() {
    const response = await fetchImpl(`${apiBaseUrl}/auth/dev-session/`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw new Error(
        responseMessage(payload, `Development authentication failed (${response.status}).`),
      );
    }
    applyTokenSession(payload);
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      throw new AuthenticationRequiredError();
    }
    if (refreshInFlight) {
      return refreshInFlight;
    }

    const tokenToRefresh = refreshToken;
    refreshInFlight = (async () => {
      const response = await fetchImpl(`${apiBaseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokenToRefresh }),
      });
      const payload = await responsePayload(response);
      if (!response.ok) {
        throw new AuthenticationRequiredError(
          responseMessage(payload, 'Your session has ended.'),
        );
      }

      const refreshed = parseRefreshResponse(payload);
      if (!refreshed) {
        throw new Error('The server returned an invalid token refresh.');
      }
      accessToken = refreshed.accessToken;
      if (refreshed.refreshToken) {
        storeRefreshToken(refreshed.refreshToken);
      }
      return accessToken;
    })();

    try {
      return await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }
  }

  async function loadIdentity() {
    const response = await fetchImpl(`${apiBaseUrl}/auth/sso/me/`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw new AuthenticationRequiredError(
        responseMessage(payload, 'Could not validate your session.'),
      );
    }

    const identity = parseIdentityResponse(payload);
    if (!identity) {
      throw new Error('The server returned an invalid account identity.');
    }
    storeAccount(identity);
  }

  return Object.freeze({
    async restore() {
      try {
        if (authMode === 'dev') {
          await requestDevelopmentSession();
          return { status: 'authenticated', user: account };
        }

        const completedLogin = await exchangeSsoCallback();
        if (!completedLogin) {
          if (!refreshToken) {
            clearSession();
            return { status: 'guest', user: null };
          }
          await refreshAccessToken();
          await loadIdentity();
        }
        return { status: 'authenticated', user: account };
      } catch (error) {
        clearSession();
        return { status: 'guest', user: null, error };
      }
    },

    async getAccessToken() {
      if (accessToken) {
        return accessToken;
      }
      try {
        return await refreshAccessToken();
      } catch (error) {
        clearSession();
        throw error;
      }
    },

    clear() {
      accessToken = null;
    },

    startLogin({ switchAccount = false } = {}) {
      const query = new URLSearchParams({ return_to: frontendUrl });
      if (switchAccount) {
        query.set('switch', '1');
      }
      location.assign(`${apiBaseUrl}/auth/sso/login/?${query}`);
    },

    async signOut() {
      const tokenToRevoke = refreshToken;
      try {
        if (tokenToRevoke) {
          await fetchImpl(`${apiBaseUrl}/auth/token/blacklist/`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: tokenToRevoke }),
          });
        }
      } finally {
        clearSession();
      }
    },
  });
}

