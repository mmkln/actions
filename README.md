# Actions

A focused single-board canvas for three first-class card types:

- thoughts;
- goals;
- Majom tasks.

The frontend now persists canvas resource references and positions through the
Actions Django BFF. Source hydration from Flying Thoughts and Majom remains a
separate integration step.

## Development

```bash
npm install
npm run dev
```

Run Majom ID on port `9000` and `actions-backend` on port `8002` before
starting Vite. The default authentication mode uses the same authorization-code
flow as Flying Thoughts: Majom ID redirects back with a one-time code, Actions
exchanges it for its own short-lived access token and rotating refresh token.

Set `VITE_ACTIONS_AUTH_MODE=dev` only when the backend has
`ENABLE_DEV_AUTH=true` and an isolated passwordless development session is
explicitly wanted.

## Deployment

The frontend uses `http://127.0.0.1:8002/api/v1` on `localhost` and
`127.0.0.1`. On any deployed hostname it uses the Actions backend at
`https://mxllactions.pythonanywhere.com/api/v1`, matching the production URL
selection used by Flying Thoughts. `VITE_ACTIONS_API_URL` remains available as
an explicit build-time override for staging or other environments.

## Structure

- `src/domain` — shared card types and future domain rules;
- `src/auth` — framework-free parsing of Majom ID callback/session payloads;
- `src/canvas` — world coordinates, camera, collision-free insertion, serialized layout persistence, minimap, and frame scheduling;
- `src/data` — Actions API and authenticated session boundaries;
- `src/ui` — reusable visual components;
- `src/app.js` — application state and orchestration of rendering and persistence;
- `src/main.js` — application bootstrap.

