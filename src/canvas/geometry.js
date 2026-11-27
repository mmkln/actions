export const DEFAULT_CANVAS_CARD_GEOMETRY = Object.freeze({
  width: 280,
  height: 96,
});

export const CANVAS_CARD_GEOMETRY = Object.freeze({
  thought: Object.freeze({ width: 400, height: 203 }),
  achievement: Object.freeze({ width: 400, height: 192 }),
  task: Object.freeze({ width: 400, height: 192 }),
});

export const CANVAS_CARD_WIDTH = DEFAULT_CANVAS_CARD_GEOMETRY.width;
export const CANVAS_CARD_HEIGHT = DEFAULT_CANVAS_CARD_GEOMETRY.height;
export const CANVAS_CARD_GAP = 24;
export const CANVAS_INSERTION_GAP = 8;

const CONTENT_DRIVEN_CARD_GEOMETRY = Object.freeze({
  thought: Object.freeze({
    characterWidth: 11.2,
    horizontalPadding: 50,
    baseHeight: 77,
    lineHeight: 23 * 1.18,
    decorateTitle: (title) => `“${title}”`,
  }),
  achievement: Object.freeze({
    characterWidth: 12,
    horizontalPadding: 48,
    baseHeight: 79,
    lineHeight: 26 * 1.08,
  }),
  task: Object.freeze({
    characterWidth: 11.2,
    horizontalPadding: 48,
    baseHeight: 79,
    lineHeight: 24 * 1.08,
  }),
});

const CONTENT_DRIVEN_MIN_WIDTH = 180;
const CONTENT_DRIVEN_MAX_WIDTH = 400;
const CONTENT_DRIVEN_MIN_HEIGHT = 109;
const CONTENT_DRIVEN_MAX_LINES = 4;

function contentDrivenCardGeometry(kind, title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY[kind];

  const config = CONTENT_DRIVEN_CARD_GEOMETRY[kind];
  const normalizedTitle = String(title).trim();
  const measuredTitle = config.decorateTitle
    ? config.decorateTitle(normalizedTitle)
    : normalizedTitle;
  const characterCount = Array.from(measuredTitle).length;
  const estimatedTextWidth = Math.max(
    96,
    characterCount * config.characterWidth,
  );
  const maximumContentWidth = (
    CONTENT_DRIVEN_MAX_WIDTH - config.horizontalPadding
  );
  const contentWidth = Math.min(maximumContentWidth, estimatedTextWidth);
  const width = Math.ceil(Math.max(
    CONTENT_DRIVEN_MIN_WIDTH,
    contentWidth + config.horizontalPadding,
  ));
  const lineCount = Math.min(
    CONTENT_DRIVEN_MAX_LINES,
    Math.max(1, Math.ceil(
      estimatedTextWidth / Math.max(1, width - config.horizontalPadding),
    )),
  );

  return {
    width,
    height: Math.max(
      CONTENT_DRIVEN_MIN_HEIGHT,
      Math.ceil(config.baseHeight + (lineCount * config.lineHeight)),
    ),
  };
}

export function canvasCardGeometry(kind, title) {
  if (kind in CONTENT_DRIVEN_CARD_GEOMETRY) {
    return contentDrivenCardGeometry(kind, title);
  }
  return DEFAULT_CANVAS_CARD_GEOMETRY;
}

