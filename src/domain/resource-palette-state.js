export const RESOURCE_PALETTE_SCREENS = Object.freeze({
  SEARCH: 'search',
  CHOOSE_TYPE: 'choose-type',
  CONFIGURE: 'configure',
});

export function createResourcePaletteState() {
  return {
    screen: RESOURCE_PALETTE_SCREENS.SEARCH,
    selectedKind: null,
    selectedParent: null,
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
  };
}

export function beginResourceCreation(state) {
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE,
    selectedKind: null,
    selectedParent: null,
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
  };
}

export function chooseResourceKind(state, kind) {
  return {
    ...state,
    screen: RESOURCE_PALETTE_SCREENS.CONFIGURE,
    selectedKind: kind,
    selectedParent: null,
    parentQuery: '',
    parentResults: [],
    parentLoading: false,
    parentError: null,
  };
}

export function chooseResourceParent(state, parent) {
  return {
    ...state,
    selectedParent: parent,
  };
}

export function returnFromResourceCreation(state) {
  if (state.screen === RESOURCE_PALETTE_SCREENS.CONFIGURE) {
    return {
      ...createResourcePaletteState(),
      screen: RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE,
    };
  }
  return createResourcePaletteState();
}

export function canSubmitResourceDraft(state, cardTypeConfig) {
  if (state.screen !== RESOURCE_PALETTE_SCREENS.CONFIGURE) return false;
  if (!state.selectedKind) return false;
  const parentKind = cardTypeConfig[state.selectedKind]?.parentKind;
  if (!parentKind) return true;
  return state.selectedParent?.kind === parentKind;
}
