const LOCAL_ACTIONS_API_URL = 'http://127.0.0.1:8002/api/v1';
const PRODUCTION_ACTIONS_API_URL = 'https://mxllactions.pythonanywhere.com/api/v1';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export function resolveActionsApiUrl({ configuredUrl, hostname }) {
  const normalizedConfiguredUrl = configuredUrl?.trim().replace(/\/+$/, '');
  if (normalizedConfiguredUrl) {
    return normalizedConfiguredUrl;
  }

  return LOCAL_HOSTNAMES.has(hostname)
    ? LOCAL_ACTIONS_API_URL
    : PRODUCTION_ACTIONS_API_URL;
}

