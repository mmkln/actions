export function createCanvasRenderScheduler({
  requestFrame,
  cancelFrame,
  onFlush,
}) {
  let frameId = null;
  let renderAllItems = false;
  let minimapDirty = false;
  const itemIds = new Set();

  function reset() {
    renderAllItems = false;
    minimapDirty = false;
    itemIds.clear();
  }

  function flush() {
    frameId = null;
    const update = {
      allItems: renderAllItems,
      itemIds: new Set(itemIds),
      minimap: minimapDirty,
    };
    reset();
    onFlush(update);
  }

  function request({ allItems = false, items = [], minimap = false } = {}) {
    renderAllItems ||= allItems;
    minimapDirty ||= minimap;
    items.forEach((itemId) => itemIds.add(itemId));
    if (frameId !== null) return;
    frameId = requestFrame(flush);
  }

  function cancel() {
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
    reset();
  }

  return Object.freeze({ request, cancel });
}
