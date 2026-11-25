import './styles.css';

import { mountApp } from './app.js';
import { resolveActionsApiUrl } from './config.js';
import { createApiClient } from './data/api-client.js';
import { createActionsApi } from './data/actions-api.js';
import { createAuthSession } from './data/auth-session.js';
import { createResourceCatalogApi } from './data/resource-catalog-api.js';
import { createThemeController } from './data/theme-controller.js';


const root = document.querySelector('#app');
if (!root) {
  throw new Error('App root was not found');
}

const apiBaseUrl = resolveActionsApiUrl({
  configuredUrl: import.meta.env.VITE_ACTIONS_API_URL,
  hostname: window.location.hostname,
});

const authSession = createAuthSession({
  apiBaseUrl,
  authMode: import.meta.env.VITE_ACTIONS_AUTH_MODE ?? 'sso',
});
const apiClient = createApiClient({ apiBaseUrl, authSession });
const api = createActionsApi({ request: apiClient.request });
const catalogApi = createResourceCatalogApi({ request: apiClient.request });
const themeController = createThemeController();

mountApp(root, {
  api,
  catalogApi,
  authSession,
  themeController,
});

