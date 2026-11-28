export function deriveAppSurface(sessionStatus) {
  const authenticated = sessionStatus === 'authenticated';

  return Object.freeze({
    authenticated,
    checking: sessionStatus === 'checking',
    showGuestLanding: !authenticated,
    showWorkspace: authenticated,
  });
}
