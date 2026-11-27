const GRID_WORLD_SPACING = 24;
const GRID_WORLD_DOT_DIAMETER = 1.4;
const GRID_DOT_FEATHER_DEVICE_PIXELS = 0.5;

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function snapToDevicePixel(value, pixelRatio) {
  return Math.round(value * pixelRatio) / pixelRatio;
}

function projectDotGeometry(scale, pixelRatio) {
  const minimumDiameter = 1 / pixelRatio;
  const diameter = Math.max(
    minimumDiameter,
    snapToDevicePixel(GRID_WORLD_DOT_DIAMETER * scale, pixelRatio),
  );
  const radius = diameter / 2;

  return {
    radius,
    edge: radius + GRID_DOT_FEATHER_DEVICE_PIXELS / pixelRatio,
  };
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
  const dot = projectDotGeometry(scale, ratio);

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
    dotRadius: dot.radius,
    dotEdge: dot.edge,
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
