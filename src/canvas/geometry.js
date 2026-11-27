export const DEFAULT_CANVAS_CARD_GEOMETRY = Object.freeze({
  width: 280,
  height: 96,
});

export const CANVAS_CARD_GEOMETRY = Object.freeze({
  thought: Object.freeze({ width: 400, height: 203 }),
  achievement: Object.freeze({ width: 300, height: 192 }),
  task: Object.freeze({ width: 300, height: 192 }),
});

export const CANVAS_CARD_WIDTH = DEFAULT_CANVAS_CARD_GEOMETRY.width;
export const CANVAS_CARD_HEIGHT = DEFAULT_CANVAS_CARD_GEOMETRY.height;
export const CANVAS_CARD_GAP = 24;
export const CANVAS_INSERTION_GAP = 8;

function thoughtCardGeometry(title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY.thought;

  const characterCount = Array.from(`“${String(title).trim()}”`).length;
  const estimatedTextWidth = Math.max(96, characterCount * 11.2);
  const contentWidth = Math.min(350, estimatedTextWidth);
  const width = Math.ceil(Math.max(180, contentWidth + 50));
  const lineCount = Math.min(
    4,
    Math.max(1, Math.ceil(estimatedTextWidth / Math.max(1, width - 50))),
  );

  return {
    width,
    height: Math.max(109, Math.ceil(77 + (lineCount * 23 * 1.18))),
  };
}

function achievementCardGeometry(title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY.achievement;

  const characterCount = Array.from(String(title).trim()).length;
  const estimatedTextWidth = Math.max(130, characterCount * 12);
  const contentWidth = Math.min(252, estimatedTextWidth);
  const width = Math.ceil(Math.max(230, contentWidth + 48));
  const lineCount = Math.min(
    4,
    Math.max(1, Math.ceil(estimatedTextWidth / Math.max(1, width - 48))),
  );

  return {
    width,
    height: Math.max(130, Math.ceil(79 + (lineCount * 26 * 1.08))),
  };
}

function taskCardGeometry(title) {
  if (title === undefined) return CANVAS_CARD_GEOMETRY.task;

  const characterCount = Array.from(String(title).trim()).length;
  const estimatedTextWidth = Math.max(130, characterCount * 11.2);
  const contentWidth = Math.min(252, estimatedTextWidth);
  const width = Math.ceil(Math.max(230, contentWidth + 48));
  const lineCount = Math.min(
    4,
    Math.max(1, Math.ceil(estimatedTextWidth / Math.max(1, width - 48))),
  );

  return {
    width,
    height: Math.max(130, Math.ceil(79 + (lineCount * 24 * 1.08))),
  };
}

export function canvasCardGeometry(kind, title) {
  if (kind === 'thought') return thoughtCardGeometry(title);
  if (kind === 'achievement') return achievementCardGeometry(title);
  if (kind === 'task') return taskCardGeometry(title);
  return DEFAULT_CANVAS_CARD_GEOMETRY;
}

