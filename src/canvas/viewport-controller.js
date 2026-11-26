import { clientPointToWorld, zoomCameraAtClientPoint } from './coordinate-space.js';


export const MINIMUM_CANVAS_SCALE = 0.3;
export const MAXIMUM_CANVAS_SCALE = 1;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function fitCameraToBounds(
  bounds,
  viewport,
  {
    padding = 96,
    minimumScale = MINIMUM_CANVAS_SCALE,
    maximumScale = MAXIMUM_CANVAS_SCALE,
  } = {},
) {
  const width = Math.max(1, Number.isFinite(bounds?.width) ? bounds.width : 1);
  const height = Math.max(1, Number.isFinite(bounds?.height) ? bounds.height : 1);
  const viewportWidth = Math.max(1, Number.isFinite(viewport?.width) ? viewport.width : 1);
  const viewportHeight = Math.max(1, Number.isFinite(viewport?.height) ? viewport.height : 1);
  const safePadding = Math.max(0, Number.isFinite(padding) ? padding : 0);
  const availableWidth = Math.max(1, viewportWidth - safePadding * 2);
  const availableHeight = Math.max(1, viewportHeight - safePadding * 2);
  const scale = clamp(
    Math.min(availableWidth / width, availableHeight / height),
    minimumScale,
    maximumScale,
  );
  const centerX = (Number.isFinite(bounds?.x) ? bounds.x : 0) + width / 2;
  const centerY = (Number.isFinite(bounds?.y) ? bounds.y : 0) + height / 2;

  return {
    x: viewportWidth / 2 - centerX * scale,
    y: viewportHeight / 2 - centerY * scale,
    scale,
  };
}

export function normalizeCanvasCamera(
  camera,
  { minimumScale = MINIMUM_CANVAS_SCALE, maximumScale = MAXIMUM_CANVAS_SCALE } = {},
) {
  return {
    x: Number.isFinite(camera?.x) ? camera.x : 0,
    y: Number.isFinite(camera?.y) ? camera.y : 0,
    scale: clamp(
      Number.isFinite(camera?.scale) ? camera.scale : maximumScale,
      minimumScale,
      maximumScale,
    ),
  };
}

export function createCanvasViewportController({
  viewport,
  world,
  zoomOutButton = null,
  zoomResetButton = null,
  zoomInButton = null,
  minimumScale = MINIMUM_CANVAS_SCALE,
  maximumScale = MAXIMUM_CANVAS_SCALE,
  shouldStartPan = (event) => event.button === 0,
  onRender = null,
  onCommit = null,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame,
}) {
  const camera = normalizeCanvasCamera(null, { minimumScale, maximumScale });
  let pan = null;
  let scaleAnimationId = null;

  function snapshot() {
    return { ...camera };
  }

  function render() {
    world.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`;
    if (zoomResetButton) zoomResetButton.textContent = `${Math.round(camera.scale * 100)}%`;
    if (zoomOutButton) zoomOutButton.disabled = camera.scale <= minimumScale;
    if (zoomInButton) zoomInButton.disabled = camera.scale >= maximumScale;
    onRender?.(snapshot());
  }

  function commit() {
    onCommit?.(snapshot());
  }

  function reset(nextCamera = null, { persist = false } = {}) {
    Object.assign(
      camera,
      normalizeCanvasCamera(nextCamera, { minimumScale, maximumScale }),
    );
    render();
    if (persist) commit();
  }

  function clientToWorld(point) {
    return clientPointToWorld(point, viewport.getBoundingClientRect(), camera);
  }

  function setScale(nextScale, point, { persist = true } = {}) {
    const scale = clamp(nextScale, minimumScale, maximumScale);
    if (scale === camera.scale) return;
    Object.assign(
      camera,
      zoomCameraAtClientPoint(
        camera,
        scale,
        point,
        viewport.getBoundingClientRect(),
      ),
    );
    render();
    if (persist) commit();
  }

  function viewportCenter() {
    const bounds = viewport.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
  }

  function animateScale(targetScale, point = viewportCenter()) {
    if (scaleAnimationId !== null) cancelFrame(scaleAnimationId);
    const startedAt = performance.now();
    const startScale = camera.scale;
    const finalScale = clamp(targetScale, minimumScale, maximumScale);

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / 150);
      const eased = 1 - (1 - progress) ** 3;
      setScale(startScale + (finalScale - startScale) * eased, point, {
        persist: progress === 1,
      });
      scaleAnimationId = progress < 1 ? requestFrame(frame) : null;
    }

    scaleAnimationId = requestFrame(frame);
  }

  function centerAtWorldPoint(point, { persist = true } = {}) {
    const bounds = viewport.getBoundingClientRect();
    camera.x = bounds.width / 2 - point.x * camera.scale;
    camera.y = bounds.height / 2 - point.y * camera.scale;
    render();
    if (persist) commit();
  }

  function fitBounds(bounds, { padding = 96, persist = true } = {}) {
    const viewportBounds = viewport.getBoundingClientRect();
    Object.assign(
      camera,
      fitCameraToBounds(
        bounds,
        { width: viewportBounds.width, height: viewportBounds.height },
        { padding, minimumScale, maximumScale },
      ),
    );
    render();
    if (persist) commit();
  }

  function handlePointerDown(event) {
    if (!shouldStartPan(event)) return;
    pan = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-panning');
  }

  function handlePointerMove(event) {
    if (!pan || event.pointerId !== pan.pointerId) return;
    camera.x = pan.cameraX + event.clientX - pan.startX;
    camera.y = pan.cameraY + event.clientY - pan.startY;
    render();
  }

  function finishPan(event) {
    if (!pan || event.pointerId !== pan.pointerId) return;
    pan = null;
    viewport.classList.remove('is-panning');
    commit();
  }

  function handleWheel(event) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    if (scaleAnimationId !== null) {
      cancelFrame(scaleAnimationId);
      scaleAnimationId = null;
    }
    setScale(
      camera.scale * Math.exp(-event.deltaY * 0.0015),
      { x: event.clientX, y: event.clientY },
    );
  }

  const handleZoomOut = () => animateScale(camera.scale * 0.88);
  const handleZoomReset = () => animateScale(maximumScale);
  const handleZoomIn = () => animateScale(camera.scale / 0.88);

  viewport.addEventListener('pointerdown', handlePointerDown);
  viewport.addEventListener('pointermove', handlePointerMove);
  viewport.addEventListener('pointerup', finishPan);
  viewport.addEventListener('pointercancel', finishPan);
  viewport.addEventListener('wheel', handleWheel, { passive: false });
  zoomOutButton?.addEventListener('click', handleZoomOut);
  zoomResetButton?.addEventListener('click', handleZoomReset);
  zoomInButton?.addEventListener('click', handleZoomIn);
  render();

  return Object.freeze({
    animateScale,
    centerAtWorldPoint,
    clientToWorld,
    fitBounds,
    getCamera: snapshot,
    render,
    reset,
    setScale,
    destroy() {
      if (scaleAnimationId !== null) cancelFrame(scaleAnimationId);
      viewport.removeEventListener('pointerdown', handlePointerDown);
      viewport.removeEventListener('pointermove', handlePointerMove);
      viewport.removeEventListener('pointerup', finishPan);
      viewport.removeEventListener('pointercancel', finishPan);
      viewport.removeEventListener('wheel', handleWheel);
      zoomOutButton?.removeEventListener('click', handleZoomOut);
      zoomResetButton?.removeEventListener('click', handleZoomReset);
      zoomInButton?.removeEventListener('click', handleZoomIn);
    },
  });
}
