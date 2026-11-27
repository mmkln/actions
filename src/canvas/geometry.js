export const DEFAULT_CANVAS_CARD_GEOMETRY = Object.freeze({
  width: 280,
  height: 96,
});

export const EDITORIAL_CARD_LAYOUT = Object.freeze({
  minWidth: 180,
  maxWidth: 400,
  minHeight: 109,
  paddingInline: 25,
  paddingTop: 19,
  paddingBottom: 21,
  contentGap: 13,
  headerGap: 11,
  iconSize: 24,
  borderRadius: 17,
  maxLines: 4,
});

export const ACTION_CARD_LAYOUT = Object.freeze({
  minWidth: 190,
  maxWidth: 340,
  minHeight: 84,
  maxHeight: 96,
  paddingInline: 18,
  paddingTop: 13,
  paddingBottom: 14,
  headerHeight: 11,
  contentGap: 7,
  controlSize: 40,
  controlGap: 14,
  borderRadius: 15,
  maxLines: 2,
});

export const EDITORIAL_CARD_CSS_VARIABLES = Object.freeze({
  '--editorial-card-min-width': `${EDITORIAL_CARD_LAYOUT.minWidth}px`,
  '--editorial-card-max-width': `${EDITORIAL_CARD_LAYOUT.maxWidth}px`,
  '--editorial-card-min-height': `${EDITORIAL_CARD_LAYOUT.minHeight}px`,
  '--editorial-card-padding-inline': `${EDITORIAL_CARD_LAYOUT.paddingInline}px`,
  '--editorial-card-padding-top': `${EDITORIAL_CARD_LAYOUT.paddingTop}px`,
  '--editorial-card-padding-bottom': `${EDITORIAL_CARD_LAYOUT.paddingBottom}px`,
  '--editorial-card-content-gap': `${EDITORIAL_CARD_LAYOUT.contentGap}px`,
  '--editorial-card-header-gap': `${EDITORIAL_CARD_LAYOUT.headerGap}px`,
  '--editorial-card-icon-size': `${EDITORIAL_CARD_LAYOUT.iconSize}px`,
  '--editorial-card-radius': `${EDITORIAL_CARD_LAYOUT.borderRadius}px`,
  '--editorial-card-content-width': `${
    EDITORIAL_CARD_LAYOUT.maxWidth - (EDITORIAL_CARD_LAYOUT.paddingInline * 2)
  }px`,
  '--action-card-min-width': `${ACTION_CARD_LAYOUT.minWidth}px`,
  '--action-card-max-width': `${ACTION_CARD_LAYOUT.maxWidth}px`,
  '--action-card-min-height': `${ACTION_CARD_LAYOUT.minHeight}px`,
  '--action-card-padding-inline': `${ACTION_CARD_LAYOUT.paddingInline}px`,
  '--action-card-padding-top': `${ACTION_CARD_LAYOUT.paddingTop}px`,
  '--action-card-padding-bottom': `${ACTION_CARD_LAYOUT.paddingBottom}px`,
  '--action-card-content-gap': `${ACTION_CARD_LAYOUT.contentGap}px`,
  '--action-card-control-size': `${ACTION_CARD_LAYOUT.controlSize}px`,
  '--action-card-control-gap': `${ACTION_CARD_LAYOUT.controlGap}px`,
  '--action-card-radius': `${ACTION_CARD_LAYOUT.borderRadius}px`,
  '--action-card-content-width': `${
    ACTION_CARD_LAYOUT.maxWidth
    - (ACTION_CARD_LAYOUT.paddingInline * 2)
    - ACTION_CARD_LAYOUT.controlSize
    - ACTION_CARD_LAYOUT.controlGap
  }px`,
});

export const CANVAS_CARD_GEOMETRY = Object.freeze({
  action: Object.freeze({
    width: ACTION_CARD_LAYOUT.maxWidth,
    height: ACTION_CARD_LAYOUT.maxHeight,
  }),
  thought: Object.freeze({ width: EDITORIAL_CARD_LAYOUT.maxWidth, height: 203 }),
  achievement: Object.freeze({ width: EDITORIAL_CARD_LAYOUT.maxWidth, height: 192 }),
  task: Object.freeze({ width: EDITORIAL_CARD_LAYOUT.maxWidth, height: 192 }),
});

export const CANVAS_CARD_WIDTH = DEFAULT_CANVAS_CARD_GEOMETRY.width;
export const CANVAS_CARD_HEIGHT = DEFAULT_CANVAS_CARD_GEOMETRY.height;
export const CANVAS_CARD_GAP = 24;
export const CANVAS_INSERTION_GAP = 8;

const CONTENT_DRIVEN_CARD_GEOMETRY = Object.freeze({
  action: Object.freeze({
    characterWidth: 10.6,
    lineHeight: 24,
    layout: ACTION_CARD_LAYOUT,
  }),
  thought: Object.freeze({
    characterWidth: 11.2,
    lineHeight: 23 * 1.18,
    decorateTitle: (title) => `“${title}”`,
  }),
  achievement: Object.freeze({
    characterWidth: 12,
    lineHeight: 26 * 1.08,
  }),
  task: Object.freeze({
    characterWidth: 12,
    lineHeight: 26 * 1.08,
  }),
});

function contentDrivenCardGeometry(kind, title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY[kind];

  const config = CONTENT_DRIVEN_CARD_GEOMETRY[kind];
  const layout = config.layout ?? EDITORIAL_CARD_LAYOUT;
  const normalizedTitle = String(title).trim();
  const measuredTitle = config.decorateTitle
    ? config.decorateTitle(normalizedTitle)
    : normalizedTitle;
  const characterCount = Array.from(measuredTitle).length;
  const estimatedTextWidth = Math.max(
    96,
    characterCount * config.characterWidth,
  );
  const horizontalPadding = layout.paddingInline * 2;
  const controlWidth = layout.controlSize
    ? layout.controlSize + layout.controlGap
    : 0;
  const fixedWidth = horizontalPadding + controlWidth;
  const maximumContentWidth = (
    layout.maxWidth - fixedWidth
  );
  const contentWidth = Math.min(maximumContentWidth, estimatedTextWidth);
  const width = Math.ceil(Math.max(
    layout.minWidth,
    contentWidth + fixedWidth,
  ));
  const availableTextWidth = Math.max(1, width - fixedWidth);
  const lineCount = Math.min(
    layout.maxLines,
    Math.max(1, Math.ceil(
      estimatedTextWidth / availableTextWidth,
    )),
  );
  const headerHeight = layout.headerHeight ?? layout.iconSize;
  const baseHeight = (
    layout.paddingTop
    + headerHeight
    + layout.contentGap
    + layout.paddingBottom
  );

  return {
    width,
    height: Math.max(
      layout.minHeight,
      Math.ceil(baseHeight + (lineCount * config.lineHeight)),
    ),
  };
}

export function canvasCardGeometry(kind, title) {
  if (kind in CONTENT_DRIVEN_CARD_GEOMETRY) {
    return contentDrivenCardGeometry(kind, title);
  }
  return DEFAULT_CANVAS_CARD_GEOMETRY;
}

