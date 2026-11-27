export const RESOURCE_PALETTE_SCREENS = Object.freeze({
  SEARCH: 'search',
  CHOOSE_TYPE: 'choose-type',
  CONFIGURE: 'configure',
});

export function createResourcePaletteState() {
  return {
    screen: RESOURCE_PALETTE_SCREENS.SEARCH,
    scrollTop: 0,
    draft: {
      title: '',
      selectedKind: null,
      selectedParent: null,
    },
    search: {
      requestId: 0,
      status: 'idle',
      results: [],
      unavailableSources: [],
      error: null,
      completedAt: null,
      refreshing: false,
    },
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
    actionError: null,
  };
}

export function changeResourceQuery(state, title) {
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.SEARCH,
    draft: {
      title,
      selectedKind: null,
      selectedParent: null,
    },
    search: {
      requestId: state.search.requestId + 1,
      status: 'debouncing',
      results: [],
      unavailableSources: [],
      error: null,
      completedAt: null,
      refreshing: false,
    },
    actionError: null,
  };
}

export function startResourceSearch(state, requestId) {
  if (state.search.requestId !== requestId) return state;
  return {
    ...state,
    search: {
      ...state.search,
      status: 'loading',
    },
  };
}

export function finishResourceSearch(
  state,
  requestId,
  payload,
  completedAt = Date.now(),
) {
  if (state.search.requestId !== requestId) return state;
  return {
    ...state,
    search: {
      ...state.search,
      status: 'success',
      results: payload.results ?? [],
      unavailableSources: payload.unavailable_sources ?? [],
      error: null,
      completedAt,
      refreshing: false,
    },
  };
}

export function failResourceSearch(state, requestId, error) {
  if (state.search.requestId !== requestId) return state;
  if (state.search.refreshing && state.search.results.length) {
    return {
      ...state,
      search: {
        ...state.search,
        status: 'success',
        refreshing: false,
      },
    };
  }
  return {
    ...state,
    search: {
      ...state.search,
      status: 'error',
      results: [],
      unavailableSources: error.payload?.unavailable_sources ?? [],
      error,
      refreshing: false,
    },
  };
}

export function refreshResourceSearch(state) {
  return {
    ...state,
    search: {
      ...state.search,
      requestId: state.search.requestId + 1,
      refreshing: true,
      error: null,
    },
  };
}

export function beginResourceCreation(state) {
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE,
    draft: {
      ...state.draft,
      selectedKind: null,
      selectedParent: null,
    },
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
    actionError: null,
  };
}

export function chooseResourceKind(state, kind) {
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.CONFIGURE,
    draft: {
      ...state.draft,
      selectedKind: kind,
      selectedParent: null,
    },
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
    actionError: null,
  };
}

export function chooseResourceParent(state, parent) {
  return {
    ...state,
    draft: {
      ...state.draft,
      selectedParent: parent,
    },
  };
}

export function returnFromResourceCreation(state) {
  if (state.screen === RESOURCE_PALETTE_SCREENS.CONFIGURE) {
    return {
      ...state,
      screen: RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE,
      draft: {
        ...state.draft,
        selectedKind: null,
        selectedParent: null,
      },
      parentQuery: '',
      parentResults: [],
      parentLoading: false,
      parentError: null,
      actionError: null,
    };
  }
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.SEARCH,
    draft: {
      ...state.draft,
      selectedKind: null,
      selectedParent: null,
    },
    actionError: null,
  };
}

export function canSubmitResourceDraft(state, cardTypeConfig) {
  if (state.screen !== RESOURCE_PALETTE_SCREENS.CONFIGURE) return false;
  if (!state.draft.selectedKind) return false;
  const parentKind = cardTypeConfig[state.draft.selectedKind]?.parentKind;
  const parent = state.draft.selectedParent;
  if (!parentKind || !parent) return true;
  return parent.kind === parentKind;
}
