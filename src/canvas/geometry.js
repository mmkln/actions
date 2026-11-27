export const DEFAULT_CANVAS_CARD_GEOMETRY = Object.freeze({
  width: 280,
  height: 96,
});

export const CANVAS_CARD_GEOMETRY = Object.freeze({
  thought: Object.freeze({
    width: 400,
    height: 140,
  }),
});

export const CANVAS_CARD_WIDTH = DEFAULT_CANVAS_CARD_GEOMETRY.width;
export const CANVAS_CARD_HEIGHT = DEFAULT_CANVAS_CARD_GEOMETRY.height;
export const CANVAS_CARD_GAP = 24;
export const CANVAS_INSERTION_GAP = 8;

export function canvasCardGeometry(kind) {
  return CANVAS_CARD_GEOMETRY[kind] ?? DEFAULT_CANVAS_CARD_GEOMETRY;
}

