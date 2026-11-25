import './styles.css';

import { mountApp } from './app.js';
import { createApiClient } from './data/api-client.js';
import { createActionsApi } from './data/actions-api.js';
import { createAuthSession } from './data/auth-session.js';
import { createMajomTasksApi } from './data/majom-tasks-api.js';
import { createThemeController } from './data/theme-controller.js';


const root = document.querySelector('#app');
if (!root) {
  throw new Error('App root was not found');
}

const apiBaseUrl = (
  import.meta.env.VITE_ACTIONS_API_URL ?? 'http://127.0.0.1:8002/api/v1'
).replace(/\/$/, '');

const authSession = createAuthSession({
  apiBaseUrl,
  authMode: import.meta.env.VITE_ACTIONS_AUTH_MODE ?? 'sso',
});
const apiClient = createApiClient({ apiBaseUrl, authSession });
const api = createActionsApi({ request: apiClient.request });
const majomTasksApi = createMajomTasksApi({ request: apiClient.request });
const themeController = createThemeController();

mountApp(root, {
  api,
  majomTasksApi,
  authSession,
  themeController,
});

