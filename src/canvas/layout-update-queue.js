function validChange(change) {
  return Boolean(change)
    && typeof change.itemId === 'string'
    && Number.isFinite(change.x)
    && Number.isFinite(change.y);
}

/**
 * Serializes revision-based layout writes while keeping drag interaction live.
 * Repeated moves of the same card collapse to its latest position.
 */
export function createLayoutUpdateQueue({
  persist,
  onBusyChange = null,
  onError = null,
}) {
  const pendingByItem = new Map();
  let activePromise = null;
  let closed = false;

  async function drain() {
    onBusyChange?.(true);
    try {
      while (!closed && pendingByItem.size > 0) {
        const changes = [...pendingByItem.values()];
        pendingByItem.clear();
        try {
          await persist(changes);
        } catch (error) {
          pendingByItem.clear();
          await onError?.(error);
          break;
        }
      }
    } finally {
      activePromise = null;
      onBusyChange?.(false);
      if (!closed && pendingByItem.size > 0) start();
    }
  }

  function start() {
    if (!activePromise && !closed) activePromise = drain();
    return activePromise;
  }

  return Object.freeze({
    enqueue(change) {
      if (closed || !validChange(change)) return Promise.resolve();
      pendingByItem.set(change.itemId, { ...change });
      return start();
    },
    isBusy() {
      return activePromise !== null;
    },
    async whenIdle() {
      while (activePromise) await activePromise;
    },
    clear() {
      pendingByItem.clear();
    },
    close() {
      closed = true;
      pendingByItem.clear();
    },
  });
}

