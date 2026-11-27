export function createResourcePlacementState() {
  return {
    pendingKey: null,
    recentKey: null,
    sessionKeys: [],
  };
}

export function beginResourcePlacement(state, key) {
  return {
    ...state,
    pendingKey: key,
    recentKey: null,
  };
}

export function completeResourcePlacement(state, key) {
  return {
    pendingKey: null,
    recentKey: key,
    sessionKeys: state.sessionKeys.includes(key)
      ? state.sessionKeys
      : [...state.sessionKeys, key],
  };
}

export function cancelResourcePlacement(state) {
  return {
    ...state,
    pendingKey: null,
  };
}

export function clearRecentPlacement(state, key) {
  if (state.recentKey !== key) return state;
  return {
    ...state,
    recentKey: null,
  };
}
