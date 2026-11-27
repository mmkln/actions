export const RESOURCE_DELETE_PHASES = Object.freeze({
  CLOSED: 'closed',
  CONFIRMING: 'confirming',
  DELETING: 'deleting',
  FAILED: 'failed',
});

export function createResourceDeleteState() {
  return Object.freeze({
    resource: null,
    phase: RESOURCE_DELETE_PHASES.CLOSED,
    error: null,
  });
}

export function confirmResourceDeletion(resource) {
  return Object.freeze({
    resource,
    phase: RESOURCE_DELETE_PHASES.CONFIRMING,
    error: null,
  });
}

export function beginResourceDeletion(state) {
  return Object.freeze({
    ...state,
    phase: RESOURCE_DELETE_PHASES.DELETING,
    error: null,
  });
}

export function failResourceDeletion(state, error) {
  return Object.freeze({
    ...state,
    phase: RESOURCE_DELETE_PHASES.FAILED,
    error,
  });
}

export function canConfirmResourceDeletion(state) {
  return Boolean(
    state.resource
    && state.phase !== RESOURCE_DELETE_PHASES.DELETING
    && state.phase !== RESOURCE_DELETE_PHASES.CLOSED,
  );
}
