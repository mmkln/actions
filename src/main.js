import './styles.css';

import { mountApp } from './app.js';
import { createActionsApi } from './data/actions-api.js';
import { createAuthSession } from './data/auth-session.js';
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
const api = createActionsApi({ apiBaseUrl, authSession });
const themeController = createThemeController();

mountApp(root, { api, authSession, themeController });

