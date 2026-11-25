import { normalizeCanvasCamera } from './viewport-controller.js';


const CAMERA_STORAGE_PREFIX = 'actions:canvas-camera:v1:';

function keyFor(accountId) {
  return `${CAMERA_STORAGE_PREFIX}${accountId}`;
}

export function loadCanvasCamera(storage, accountId) {
  if (!accountId) return normalizeCanvasCamera(null);
  try {
    return normalizeCanvasCamera(JSON.parse(storage.getItem(keyFor(accountId))));
  } catch {
    return normalizeCanvasCamera(null);
  }
}

export function saveCanvasCamera(storage, accountId, camera) {
  if (!accountId) return false;
  try {
    storage.setItem(keyFor(accountId), JSON.stringify(normalizeCanvasCamera(camera)));
    return true;
  } catch {
    return false;
  }
}
