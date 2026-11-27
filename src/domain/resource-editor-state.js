export function createResourceEditorState() {
  return Object.freeze({
    resource: null,
    draftTitle: '',
    saving: false,
    error: null,
  });
}

export function openResourceEditor(resource) {
  return Object.freeze({
    resource,
    draftTitle: resource.title,
    saving: false,
    error: null,
  });
}

export function changeResourceEditorTitle(state, draftTitle) {
  return Object.freeze({ ...state, draftTitle, error: null });
}

export function beginResourceEditorSave(state) {
  return Object.freeze({ ...state, saving: true, error: null });
}

export function failResourceEditorSave(state, error) {
  return Object.freeze({ ...state, saving: false, error });
}

export function canSaveResourceEditor(state) {
  const title = state.draftTitle.trim();
  return Boolean(
    state.resource
    && !state.saving
    && title
    && title !== state.resource.title,
  );
}
