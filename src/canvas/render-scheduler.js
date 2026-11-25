export function createCanvasRenderScheduler({
  requestFrame,
  cancelFrame,
  onFlush,
}) {
  let frameId = null;
  let renderAllItems = false;
  let minimapDirty = false;
  let connectionsDirty = false;
  const itemIds = new Set();

  function reset() {
    renderAllItems = false;
    minimapDirty = false;
    connectionsDirty = false;
    itemIds.clear();
  }

  function flush() {
    frameId = null;
    const update = {
      allItems: renderAllItems,
      itemIds: new Set(itemIds),
      minimap: minimapDirty,
      connections: connectionsDirty,
    };
    reset();
    onFlush(update);
  }

  function request({
    allItems = false,
    items = [],
    minimap = false,
    connections = false,
  } = {}) {
    renderAllItems ||= allItems;
    minimapDirty ||= minimap;
    connectionsDirty ||= connections;
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
