export const DEFAULT_CANVAS_CARD_GEOMETRY = Object.freeze({
  width: 280,
  height: 96,
});

export const CANVAS_CARD_GEOMETRY = Object.freeze({
  thought: Object.freeze({ width: 400, height: 203 }),
});

export const CANVAS_CARD_WIDTH = DEFAULT_CANVAS_CARD_GEOMETRY.width;
export const CANVAS_CARD_HEIGHT = DEFAULT_CANVAS_CARD_GEOMETRY.height;
export const CANVAS_CARD_GAP = 24;
export const CANVAS_INSERTION_GAP = 8;

function thoughtCardGeometry(title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY.thought;

  const characterCount = Array.from(`“${String(title).trim()}”`).length;
  const estimatedTextWidth = Math.max(96, characterCount * 14.5);
  const contentWidth = Math.min(350, estimatedTextWidth);
  const width = Math.ceil(Math.max(180, contentWidth + 50));
  const lineCount = Math.min(
    4,
    Math.max(1, Math.ceil(estimatedTextWidth / Math.max(1, width - 50))),
  );

  return {
    width,
    height: Math.ceil(77 + (lineCount * 31.32)),
  };
}

export function canvasCardGeometry(kind, title) {
  if (kind === 'thought') return thoughtCardGeometry(title);
  return DEFAULT_CANVAS_CARD_GEOMETRY;
}

