const GRID_WORLD_SPACING = 24;
const GRID_WORLD_DOT_RADIUS = 0.7;
const GRID_WORLD_DOT_EDGE = 0.8;

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function snapToDevicePixel(value, pixelRatio) {
  return Math.round(value * pixelRatio) / pixelRatio;
}

export function projectCanvasGrid(camera, pixelRatio = 1) {
  const scale = Number.isFinite(camera?.scale) && camera.scale > 0
    ? camera.scale
    : 1;
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  const spacing = Math.max(
    1 / ratio,
    snapToDevicePixel(GRID_WORLD_SPACING * scale, ratio),
  );

  return {
    spacing,
    offsetX: snapToDevicePixel(
      positiveModulo(Number.isFinite(camera?.x) ? camera.x : 0, spacing),
      ratio,
    ),
    offsetY: snapToDevicePixel(
      positiveModulo(Number.isFinite(camera?.y) ? camera.y : 0, spacing),
      ratio,
    ),
    dotRadius: GRID_WORLD_DOT_RADIUS * scale,
    dotEdge: GRID_WORLD_DOT_EDGE * scale,
  };
}

export function syncCanvasGrid(viewport, camera, pixelRatio = globalThis.devicePixelRatio || 1) {
  const grid = projectCanvasGrid(camera, pixelRatio);

  viewport.style.setProperty('--canvas-grid-size', `${grid.spacing}px`);
  viewport.style.setProperty('--canvas-grid-x', `${grid.offsetX}px`);
  viewport.style.setProperty('--canvas-grid-y', `${grid.offsetY}px`);
  viewport.style.setProperty('--canvas-grid-dot-radius', `${grid.dotRadius}px`);
  viewport.style.setProperty('--canvas-grid-dot-edge', `${grid.dotEdge}px`);
}
