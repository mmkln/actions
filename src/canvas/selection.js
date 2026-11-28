function finitePoint(point) {
  return Boolean(point)
    && Number.isFinite(point.x)
    && Number.isFinite(point.y);
}

export function createCanvasSelection(selectedIds = []) {
  return {
    selectedIds: new Set(selectedIds),
  };
}

export function setCanvasSelectionIds(selection, selectedIds) {
  if (!selection) return createCanvasSelection(selectedIds);
  return {
    ...selection,
    selectedIds: new Set(selectedIds),
  };
}

export function toggleCanvasSelectionId(selection, itemId) {
  if (!itemId) return selection;

  const selectedIds = new Set(selection?.selectedIds ?? []);
  if (selectedIds.has(itemId)) selectedIds.delete(itemId);
  else selectedIds.add(itemId);

  return {
    ...(selection ?? createCanvasSelection()),
    selectedIds,
  };
}

export function selectionRectangle(start, end) {
  if (!finitePoint(start) || !finitePoint(end)) return null;
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x),
    bottom: Math.max(start.y, end.y),
  };
}

export function cardIntersectsRectangle(card, rectangle) {
  if (!card || !rectangle) return false;
  return (
    card.x < rectangle.right
    && card.x + card.width > rectangle.left
    && card.y < rectangle.bottom
    && card.y + card.height > rectangle.top
  );
}

export function selectCardsInRectangle(cards, rectangle) {
  return new Set(
    cards
      .filter((card) => cardIntersectsRectangle(card, rectangle))
      .map(({ id }) => id),
  );
}

export function captureSelectionOrigins(items, selectedIds) {
  const selected = new Set(selectedIds ?? []);
  return new Map(
    items
      .filter(({ id }) => selected.has(id))
      .map(({ id, x, y }) => [id, { x, y }]),
  );
}

export function translateSelectionOrigins(origins, delta) {
  if (!finitePoint(delta)) return [];
  return [...(origins ?? new Map())].map(([id, origin]) => ({
    id,
    x: origin.x + delta.x,
    y: origin.y + delta.y,
  }));
}
