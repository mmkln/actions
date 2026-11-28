function normalizeUpdate(update) {
  if (!update || typeof update.sourceItemId !== 'string') return null;

  return {
    sourceItemId: update.sourceItemId,
    targetItemIds: [...new Set(
      (update.targetItemIds ?? []).filter((targetId) => (
        typeof targetId === 'string' && targetId !== update.sourceItemId
      )),
    )],
  };
}

/**
 * Serializes revision-based connection writes across the complete canvas.
 * Repeated edits of one source collapse to the latest requested target set.
 */
export function createConnectionUpdateQueue({
  persist,
  onCommit,
  onBusyChange = null,
  onError = null,
}) {
  const pendingBySource = new Map();
  let activePromise = null;
  let closed = false;

  async function drain() {
    onBusyChange?.(true);
    try {
      while (!closed && pendingBySource.size > 0) {
        const [sourceItemId, update] = pendingBySource.entries().next().value;
        pendingBySource.delete(sourceItemId);

        try {
          const result = await persist(update);
          await onCommit?.(result, update);
        } catch (error) {
          pendingBySource.clear();
          await onError?.(error, update);
          break;
        }
      }
    } finally {
      activePromise = null;
      onBusyChange?.(false);
      if (!closed && pendingBySource.size > 0) start();
    }
  }

  function start() {
    if (!activePromise && !closed) activePromise = drain();
    return activePromise;
  }

  return Object.freeze({
    enqueue(update) {
      if (closed) return Promise.resolve();
      const normalized = normalizeUpdate(update);
      if (!normalized) return Promise.resolve();

      pendingBySource.set(normalized.sourceItemId, normalized);
      return start();
    },

    isBusy() {
      return activePromise !== null;
    },

    async whenIdle() {
      while (activePromise) await activePromise;
    },

    clear() {
      pendingBySource.clear();
    },

    close() {
      closed = true;
      pendingBySource.clear();
    },
  });
}
