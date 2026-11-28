import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveAppSurface } from './app-surface.js';

test('shows a pending guest surface while the session is being restored', () => {
  assert.deepEqual(deriveAppSurface('checking'), {
    authenticated: false,
    checking: true,
    showGuestLanding: true,
    showWorkspace: false,
  });
});

test('shows the guest surface when there is no authenticated session', () => {
  assert.deepEqual(deriveAppSurface('guest'), {
    authenticated: false,
    checking: false,
    showGuestLanding: true,
    showWorkspace: false,
  });
});

test('shows only the workspace for an authenticated session', () => {
  assert.deepEqual(deriveAppSurface('authenticated'), {
    authenticated: true,
    checking: false,
    showGuestLanding: false,
    showWorkspace: true,
  });
});
