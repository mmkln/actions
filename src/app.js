import { loadCanvasCamera, saveCanvasCamera } from './canvas/camera-store.js';
import { buildRenderableConnections } from './canvas/connection-render-state.js';
import { createConnectionRenderer } from './canvas/connection-renderer.js';
import {
  getOutgoingTargetIds,
  MAX_CONNECTIONS_PER_ITEM,
  normalizeConnection,
} from './canvas/connections.js';
import {
  CANVAS_INSERTION_GAP,
  CANVAS_CARD_CSS_VARIABLES,
  canvasCardGeometry,
} from './canvas/geometry.js';
import { syncCanvasGrid } from './canvas/grid-projection.js';
import { createLayoutUpdateQueue } from './canvas/layout-update-queue.js';
import { planCanvasInsertion } from './canvas/placement.js';
import { createCanvasRenderScheduler } from './canvas/render-scheduler.js';
import {
  captureSelectionOrigins,
  createCanvasSelection,
  selectCardsInRectangle,
  selectionRectangle,
  setCanvasSelectionIds,
  toggleCanvasSelectionId,
  translateSelectionOrigins,
} from './canvas/selection.js';
import { createCanvasViewportController } from './canvas/viewport-controller.js';
import {
  findDemoResource,
  resolveResource,
} from './domain/demo-resources.js';
import {
  CARD_TYPES,
  CARD_TYPE_CONFIG,
  SEARCHABLE_CARD_TYPES,
  isExternalCardType,
} from './domain/card-types.js';
import {
  getResourceCreationOptions,
} from './domain/resource-creation.js';
import {
  RESOURCE_PALETTE_SCREENS,
  beginResourceCreation,
  changeResourceFilter,
  changeResourceQuery,
  chooseResourceKind,
  completeResourceCreation,
  createResourcePaletteState,
  failResourceSearch,
  finishResourceSearch,
  refreshResourceSearch,
  returnFromResourceCreation,
  startResourceSearch,
} from './domain/resource-palette-state.js';
import {
  RESOURCE_SEARCH_FILTERS,
  resourceSearchFilter,
} from './domain/resource-search-filters.js';
import { deriveAppSurface } from './domain/app-surface.js';
import {
  beginResourcePlacement,
  cancelResourcePlacement,
  clearRecentPlacement,
  completeResourcePlacement,
  createResourcePlacementState,
} from './domain/resource-placement-state.js';
import {
  beginResourceEditorSave,
  canSaveResourceEditor,
  changeResourceEditorTitle,
  createResourceEditorState,
  failResourceEditorSave,
  openResourceEditor,
} from './domain/resource-editor-state.js';
import {
  RESOURCE_DELETE_PHASES,
  beginResourceDeletion,
  canConfirmResourceDeletion,
  confirmResourceDeletion,
  createResourceDeleteState,
  failResourceDeletion,
} from './domain/resource-delete-state.js';
import { cardView } from './ui/card.js';
import {
  getConnectionActionState,
  renderConnectionActionButton,
} from './ui/connection-action-button.js';
import { icon } from './ui/icons.js';
import { guestLandingView } from './ui/guest-landing.js';
import { resourceEditorView } from './ui/resource-editor.js';
import { resourceDeleteDialogView } from './ui/resource-delete-dialog.js';
import { findSpatialNeighbor } from './ui/spatial-focus.js';

const RESOURCE_SEARCH_TTL_MS = 60_000;
const CARD_DOUBLE_CLICK_WINDOW_MS = 400;

function shellView() {
  return `
    <main class="app-shell">
      <header class="topbar">
        <span class="topbar__brand" data-guest-brand hidden>Actions</span>
        <div class="topbar__actions" data-account-actions>
          <button class="account-trigger" type="button" aria-label="Account" aria-expanded="false" data-account-button disabled>
            <span class="account-avatar" data-account-avatar aria-hidden="true" hidden>M</span>
            <span data-account-label>Checking…</span>
          </button>
          <div class="account-popover" role="dialog" aria-label="Account" data-account-menu hidden>
            <div class="account-popover__identity">
              <span class="account-avatar account-popover__avatar" data-account-menu-avatar aria-hidden="true">M</span>
              <span class="account-popover__copy">
                <strong data-account-email></strong>
                <small>Majom ID</small>
              </span>
            </div>
            <div class="account-popover__divider"></div>
            <button type="button" data-switch-account>Switch Account</button>
            <div class="account-popover__divider"></div>
            <div class="account-appearance">
              <span>Appearance</span>
              <div class="appearance-picker" role="radiogroup" aria-label="Appearance" data-theme-picker>
                <button class="appearance-option" type="button" role="radio" data-theme-value="system" aria-checked="false" aria-label="Use system appearance" title="System">
                  ${icon('monitor')}
                </button>
                <button class="appearance-option" type="button" role="radio" data-theme-value="light" aria-checked="false" aria-label="Use light appearance" title="Light">
                  ${icon('sun')}
                </button>
                <button class="appearance-option" type="button" role="radio" data-theme-value="dark" aria-checked="false" aria-label="Use dark appearance" title="Dark">
                  ${icon('moon')}
                </button>
              </div>
            </div>
            <div class="account-popover__divider"></div>
            <button type="button" class="account-popover__sign-out" data-sign-out>Sign Out</button>
          </div>
        </div>
      </header>

      ${guestLandingView()}

      <section class="canvas" aria-label="Main canvas" data-canvas>
        <div class="board-viewport" data-canvas-viewport>
          <div class="canvas-world" data-canvas-world>
            <svg class="connection-layer" data-connection-layer aria-hidden="true"></svg>
            <div class="canvas-selection-marquee" data-canvas-selection-marquee aria-hidden="true" hidden></div>
            <div class="canvas__items" data-canvas-items></div>
          </div>
        </div>

        <div class="canvas__empty" data-empty-state hidden>
          <span class="canvas__empty-orbit canvas__empty-orbit--one" aria-hidden="true"></span>
          <span class="canvas__empty-orbit canvas__empty-orbit--two" aria-hidden="true"></span>
          <div class="canvas__empty-icon">${icon('spark')}</div>
          <h2 data-empty-title>Your Actions canvas is empty</h2>
          <p data-empty-copy>Add the local sample references to verify backend persistence.</p>
          <button type="button" class="canvas__empty-action" data-empty-action>
            Add sample cards
          </button>
        </div>

      </section>

      <aside class="navigation-hud" aria-label="Canvas navigation" data-navigation-hud hidden>
        <button class="canvas-fit-button" type="button" aria-label="Fit canvas content" title="Fit canvas content" data-fit-canvas>
          ${icon('fit')}
          <span>Fit</span>
        </button>
      </aside>

      <div class="connection-toolbar" role="toolbar" aria-label="Edit connections" data-connection-toolbar hidden>
        <button class="connection-toolbar__cancel" type="button" data-connection-cancel>Cancel</button>
        <span class="connection-toolbar__count" data-connection-count>0 selected</span>
        <button class="connection-toolbar__done" type="button" data-connection-done>Done</button>
      </div>

      <div class="connection-toolbar canvas-selection-toolbar" role="toolbar" aria-label="Selected canvas items" data-canvas-selection-toolbar hidden>
        <button class="connection-toolbar__cancel" type="button" data-canvas-selection-clear>Clear</button>
        <span class="connection-toolbar__count" data-canvas-selection-count>0 selected</span>
        <button class="connection-toolbar__done" type="button" data-canvas-selection-done>Done</button>
      </div>

      <div class="canvas-action-toast" role="status" data-canvas-action-toast hidden>
        <span data-canvas-action-message>Removed from canvas</span>
        <button type="button" data-canvas-action-undo>Undo</button>
      </div>

      ${resourceEditorView()}
      ${resourceDeleteDialogView()}

      <div class="resource-palette-backdrop" data-resource-palette-backdrop hidden></div>
      <div class="composer" role="search" aria-label="Search and add resources" data-composer data-screen="search">
        <section class="resource-search-popover" role="dialog" aria-modal="true" aria-label="Find or create a resource" data-resource-search-popover hidden>
          <div class="resource-palette__screen" data-resource-search-screen>
            <nav class="resource-search-filters" aria-label="Filter resources" data-resource-search-filters>
              ${RESOURCE_SEARCH_FILTERS.map((filter) => `
                <button class="resource-search-filter" type="button" data-resource-search-filter="${filter.id}" aria-pressed="${filter.id === 'all'}">${filter.label}</button>
              `).join('')}
            </nav>
            <p class="resource-search-popover__status" data-resource-search-status></p>
            <div class="resource-search-popover__results" id="resource-search-results" role="listbox" aria-label="Resources" data-resource-results></div>
            <button class="resource-palette__create-entry" type="button" data-resource-create-start hidden>
              <span class="resource-palette__create-entry-icon" aria-hidden="true">${icon('plus')}</span>
              <span>
                <strong data-resource-create-start-title></strong>
                <small>Enter creates an Action · click for other types</small>
              </span>
              <span class="resource-palette__chevron" aria-hidden="true">›</span>
            </button>
            <div class="resource-placement-summary" role="status" aria-live="polite" data-resource-placement-summary hidden>
              ${icon('checkmark')}
              <span data-resource-placement-summary-label></span>
            </div>
            <footer class="resource-search-shortcuts" aria-hidden="true" data-resource-search-shortcuts>
              <span>
                <span class="resource-search-shortcuts__keys"><kbd>↑</kbd><kbd>↓</kbd></span>
                Navigate
              </span>
              <span>
                <kbd data-resource-place-key>Enter</kbd>
                <span data-resource-primary-action-label>Place</span>
              </span>
            </footer>
          </div>

          <div class="resource-palette__screen" data-resource-type-screen hidden>
            <header class="resource-palette__header">
              <button type="button" aria-label="Back to search" data-resource-create-back>${icon('arrow-left')}</button>
              <div>
                <h2 data-resource-create-heading></h2>
                <p>Choose what this will become</p>
              </div>
              <kbd>Esc</kbd>
            </header>
            <div class="resource-kind-picker" data-resource-create-kinds>
              <section class="resource-kind-section" aria-labelledby="resource-kind-quick-heading">
                <h3 id="resource-kind-quick-heading">QUICK ITEMS</h3>
                <div class="resource-kind-grid is-quick">
                  <button class="resource-kind-card" type="button" data-resource-create-kind="action">
                    <span class="resource-search-popover__result-icon is-action">${icon('action')}</span>
                    <span><strong>Action</strong><small>Capture now · structure later</small></span><b>›</b>
                  </button>
                  <button class="resource-kind-card" type="button" data-resource-create-kind="task">
                    <span class="resource-search-popover__result-icon is-task">${icon('check')}</span>
                    <span><strong>Task</strong><small>A standalone action in Majom</small></span><b>›</b>
                  </button>
                  <button class="resource-kind-card" type="button" data-resource-create-kind="thought">
                    <span class="resource-search-popover__result-icon is-thought">${icon('spark')}</span>
                    <span><strong>Thought</strong><small>A standalone insight in Flying Thoughts</small></span><b>›</b>
                  </button>
                </div>
              </section>
              <section class="resource-kind-section" aria-labelledby="resource-kind-strategic-heading">
                <header class="resource-kind-section__heading">
                  <h3 id="resource-kind-strategic-heading">STRATEGIC ITEMS</h3>
                  <p>Create independently · connect later</p>
                </header>
                <div class="resource-kind-grid is-strategic">
                  <button class="resource-kind-card" type="button" data-resource-create-kind="achievement">
                    <span class="resource-search-popover__result-icon is-achievement">${icon('achievement')}</span>
                    <span><strong>Achievement</strong><small>An outcome to reach</small></span><b>›</b>
                  </button>
                  <button class="resource-kind-card" type="button" data-resource-create-kind="requirement">
                    <span class="resource-search-popover__result-icon is-requirement">${icon('requirement')}</span>
                    <span><strong>Requirement</strong><small>A condition or need</small></span><b>›</b>
                  </button>
                  <button class="resource-kind-card" type="button" data-resource-create-kind="gap">
                    <span class="resource-search-popover__result-icon is-gap">${icon('gap')}</span>
                    <span><strong>Gap</strong><small>Something currently missing</small></span><b>›</b>
                  </button>
                </div>
              </section>
            </div>
            <p class="resource-kind-picker__error" data-resource-create-note hidden></p>
            <footer class="resource-kind-shortcuts" aria-hidden="true">
              <span><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Navigate</span>
              <span><kbd data-resource-confirm-key>Return</kbd> Select</span>
              <span><kbd>Esc</kbd> Back</span>
            </footer>
          </div>
        </section>
        <div class="composer__bar">
          <div class="composer__search-icon" aria-hidden="true">${icon('search')}</div>
          <input class="composer__search" type="search" placeholder="Search resources…" autocomplete="off" aria-label="Search resources" aria-keyshortcuts="Control+K Meta+K" aria-controls="resource-search-results" aria-expanded="false" data-resource-search disabled>
          <kbd class="composer__shortcut" aria-hidden="true" data-resource-search-shortcut>
            <span data-resource-search-shortcut-modifier></span>
            <span>K</span>
          </kbd>
          <button class="composer__clear" type="button" aria-label="Clear resource search" data-resource-search-clear hidden>${icon('close')}</button>
        </div>
      </div>
    </main>
  `;
}

export function mountApp(root, {
  api,
  catalogApi,
  authSession,
  themeController,
}) {
  Object.entries(CANVAS_CARD_CSS_VARIABLES).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  root.innerHTML = shellView();

  const elements = {
    guestBrand: root.querySelector('[data-guest-brand]'),
    guestLanding: root.querySelector('[data-guest-landing]'),
    guestSignIn: root.querySelector('[data-guest-sign-in]'),
    guestStatus: root.querySelector('[data-guest-status]'),
    accountActions: root.querySelector('[data-account-actions]'),
    accountButton: root.querySelector('[data-account-button]'),
    accountAvatar: root.querySelector('[data-account-avatar]'),
    accountLabel: root.querySelector('[data-account-label]'),
    accountMenu: root.querySelector('[data-account-menu]'),
    accountMenuAvatar: root.querySelector('[data-account-menu-avatar]'),
    accountEmail: root.querySelector('[data-account-email]'),
    switchAccount: root.querySelector('[data-switch-account]'),
    signOut: root.querySelector('[data-sign-out]'),
    themePicker: root.querySelector('[data-theme-picker]'),
    themeOptions: [...root.querySelectorAll('[data-theme-value]')],
    canvas: root.querySelector('[data-canvas]'),
    canvasViewport: root.querySelector('[data-canvas-viewport]'),
    canvasWorld: root.querySelector('[data-canvas-world]'),
    connectionLayer: root.querySelector('[data-connection-layer]'),
    canvasSelectionMarquee: root.querySelector('[data-canvas-selection-marquee]'),
    canvasItems: root.querySelector('[data-canvas-items]'),
    navigationHud: root.querySelector('[data-navigation-hud]'),
    fitCanvas: root.querySelector('[data-fit-canvas]'),
    emptyState: root.querySelector('[data-empty-state]'),
    emptyTitle: root.querySelector('[data-empty-title]'),
    emptyCopy: root.querySelector('[data-empty-copy]'),
    emptyAction: root.querySelector('[data-empty-action]'),
    composer: root.querySelector('[data-composer]'),
    resourcePaletteBackdrop: root.querySelector('[data-resource-palette-backdrop]'),
    resourceSearchPopover: root.querySelector('[data-resource-search-popover]'),
    resourceSearchScreen: root.querySelector('[data-resource-search-screen]'),
    resourceSearchFilters: root.querySelector('[data-resource-search-filters]'),
    resourceSearchFilterButtons: [
      ...root.querySelectorAll('[data-resource-search-filter]'),
    ],
    resourceSearchShortcuts: root.querySelector('[data-resource-search-shortcuts]'),
    resourcePlaceKey: root.querySelector('[data-resource-place-key]'),
    resourcePrimaryActionLabel: root.querySelector('[data-resource-primary-action-label]'),
    resourceTypeScreen: root.querySelector('[data-resource-type-screen]'),
    resourceSearch: root.querySelector('[data-resource-search]'),
    resourceSearchShortcut: root.querySelector('[data-resource-search-shortcut]'),
    resourceSearchShortcutModifier: root.querySelector('[data-resource-search-shortcut-modifier]'),
    resourceSearchClear: root.querySelector('[data-resource-search-clear]'),
    resourceSearchStatus: root.querySelector('[data-resource-search-status]'),
    resourceResults: root.querySelector('[data-resource-results]'),
    resourcePlacementSummary: root.querySelector('[data-resource-placement-summary]'),
    resourcePlacementSummaryLabel: root.querySelector('[data-resource-placement-summary-label]'),
    resourceCreateStart: root.querySelector('[data-resource-create-start]'),
    resourceCreateStartTitle: root.querySelector('[data-resource-create-start-title]'),
    resourceCreateHeading: root.querySelector('[data-resource-create-heading]'),
    resourceCreateBack: root.querySelector('[data-resource-create-back]'),
    resourceCreateKinds: root.querySelector('[data-resource-create-kinds]'),
    resourceCreateKindButtons: [...root.querySelectorAll('[data-resource-create-kind]')],
    resourceConfirmKey: root.querySelector('[data-resource-confirm-key]'),
    resourceCreateNote: root.querySelector('[data-resource-create-note]'),
    connectionToolbar: root.querySelector('[data-connection-toolbar]'),
    connectionCancel: root.querySelector('[data-connection-cancel]'),
    connectionCount: root.querySelector('[data-connection-count]'),
    connectionDone: root.querySelector('[data-connection-done]'),
    canvasSelectionToolbar: root.querySelector('[data-canvas-selection-toolbar]'),
    canvasSelectionCount: root.querySelector('[data-canvas-selection-count]'),
    canvasSelectionClear: root.querySelector('[data-canvas-selection-clear]'),
    canvasSelectionDone: root.querySelector('[data-canvas-selection-done]'),
    canvasActionToast: root.querySelector('[data-canvas-action-toast]'),
    canvasActionMessage: root.querySelector('[data-canvas-action-message]'),
    canvasActionUndo: root.querySelector('[data-canvas-action-undo]'),
    resourceEditorBackdrop: root.querySelector('[data-resource-editor-backdrop]'),
    resourceEditorHeading: root.querySelector('[data-resource-editor-heading]'),
    resourceEditorClose: root.querySelector('[data-resource-editor-close]'),
    resourceEditorInput: root.querySelector('[data-resource-editor-input]'),
    resourceEditorTextarea: root.querySelector('[data-resource-editor-textarea]'),
    resourceEditorError: root.querySelector('[data-resource-editor-error]'),
    resourceEditorDelete: root.querySelector('[data-resource-editor-delete]'),
    resourceEditorSave: root.querySelector('[data-resource-editor-save]'),
    resourceDeleteBackdrop: root.querySelector('[data-resource-delete-backdrop]'),
    resourceDeleteHeading: root.querySelector('[data-resource-delete-heading]'),
    resourceDeleteMessage: root.querySelector('[data-resource-delete-message]'),
    resourceDeleteError: root.querySelector('[data-resource-delete-error]'),
    resourceDeleteCancel: root.querySelector('[data-resource-delete-cancel]'),
    resourceDeleteConfirm: root.querySelector('[data-resource-delete-confirm]'),
  };

  const state = {
    canvas: null,
    loading: true,
    saving: false,
    error: null,
    sessionStatus: 'checking',
    user: null,
    resources: new Map(),
    resourcesLoading: false,
    selectedSearchCommandKey: null,
    searchOpen: false,
    resourcePalette: createResourcePaletteState(),
    resourcePlacement: createResourcePlacementState(),
    resourceAction: null,
    connections: [],
    connectionEditor: null,
    connectionSaving: false,
    connectionError: null,
    canvasSelection: createCanvasSelection(),
    pendingRemoval: null,
    resourceEditor: createResourceEditorState(),
    resourceDeletion: createResourceDeleteState(),
  };

  const cardElements = new Map();
  let viewportController = null;
  let searchTimer = null;
  let searchAbortController = null;
  let hydrationGeneration = 0;
  let removalTimer = null;
  let placementFeedbackTimer = null;
  let previousCardClick = null;
  let canvasSelectionGesture = null;

  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';
  const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(platform);
  elements.resourceSearchShortcutModifier.textContent = (
    isApplePlatform ? '⌘' : 'Ctrl'
  );
  elements.resourceConfirmKey.textContent = isApplePlatform ? 'Return' : 'Enter';
  elements.resourcePlaceKey.textContent = isApplePlatform ? 'Return' : 'Enter';

  function resourceKey(kind, resourceId) {
    return `${kind}:${resourceId}`;
  }

  function resourceEditorField(resource = state.resourceEditor.resource) {
    if (!resource) return null;
    return CARD_TYPE_CONFIG[resource.kind].multiline
      ? elements.resourceEditorTextarea
      : elements.resourceEditorInput;
  }

  function renderResourceEditor() {
    const editor = state.resourceEditor;
    const resource = editor.resource;
    elements.resourceEditorBackdrop.hidden = (
      !resource || Boolean(state.resourceDeletion.resource)
    );
    if (!resource) return;

    const config = CARD_TYPE_CONFIG[resource.kind];
    elements.resourceEditorHeading.textContent = `Edit ${config.label}`;
    elements.resourceEditorDelete.textContent = `Delete ${config.label.toLowerCase()}`;
    elements.resourceEditorInput.hidden = config.multiline;
    elements.resourceEditorTextarea.hidden = !config.multiline;

    const field = resourceEditorField(resource);
    field.maxLength = config.maximumTitleLength;
    field.value = editor.draftTitle;
    field.disabled = editor.saving;
    elements.resourceEditorClose.disabled = editor.saving;
    elements.resourceEditorDelete.disabled = editor.saving;
    elements.resourceEditorSave.disabled = !canSaveResourceEditor(editor);
    elements.resourceEditorSave.textContent = editor.saving ? 'Saving…' : 'Save';
    elements.resourceEditorError.hidden = !editor.error;
    elements.resourceEditorError.textContent = editor.error?.message ?? '';
  }

  function resourceDeletionMessage(resource) {
    const title = `“${resource.title}”`;
    switch (resource.kind) {
      case CARD_TYPES.THOUGHT:
        return `${title} will be permanently deleted from Flying Thoughts, including its connections. This can’t be undone.`;
      case CARD_TYPES.TASK:
        return `${title} will be permanently deleted from Majom. Its subtasks and task relationships will also be deleted. This can’t be undone.`;
      case CARD_TYPES.ACHIEVEMENT:
        return `${title} will be permanently deleted from Majom. Its requirements will remain, but will no longer belong to this achievement. This can’t be undone.`;
      case CARD_TYPES.REQUIREMENT:
        return `${title} will be permanently deleted from Majom. Its gaps will remain, but will no longer belong to this requirement. This can’t be undone.`;
      case CARD_TYPES.GAP:
        return `${title} will be permanently deleted from Majom and removed from this canvas. This can’t be undone.`;
      default:
        return `${title} will be permanently deleted from Actions and removed from this canvas. This can’t be undone.`;
    }
  }

  function renderResourceDeletion() {
    const deletion = state.resourceDeletion;
    const resource = deletion.resource;
    const isDeleting = deletion.phase === RESOURCE_DELETE_PHASES.DELETING;
    elements.resourceDeleteBackdrop.hidden = !resource;
    if (!resource) return;

    const config = CARD_TYPE_CONFIG[resource.kind];
    elements.resourceDeleteHeading.textContent = `Delete ${config.label.toLowerCase()} permanently?`;
    elements.resourceDeleteMessage.textContent = resourceDeletionMessage(resource);
    elements.resourceDeleteError.hidden = !deletion.error;
    elements.resourceDeleteError.textContent = deletion.error?.message ?? '';
    elements.resourceDeleteCancel.disabled = isDeleting;
    elements.resourceDeleteConfirm.disabled = !canConfirmResourceDeletion(deletion);
    elements.resourceDeleteConfirm.textContent = isDeleting
      ? 'Deleting…'
      : 'Delete permanently';
  }

  function openResourceDeletion() {
    const resource = state.resourceEditor.resource;
    if (!resource || state.resourceEditor.saving) return;
    state.resourceDeletion = confirmResourceDeletion(resource);
    renderResourceEditor();
    renderResourceDeletion();
    window.requestAnimationFrame(() => elements.resourceDeleteCancel.focus());
  }

  function closeResourceDeletion() {
    if (state.resourceDeletion.phase === RESOURCE_DELETE_PHASES.DELETING) return;
    state.resourceDeletion = createResourceDeleteState();
    renderResourceDeletion();
    renderResourceEditor();
    window.requestAnimationFrame(() => elements.resourceEditorDelete.focus());
  }

  function resourceDeletionError(error) {
    if (error?.status === 409) {
      return new Error('This item changed elsewhere. Close the dialog and reopen it before deleting.');
    }
    const detail = error?.payload?.detail;
    return new Error(detail || error?.message || 'Couldn’t delete this item.');
  }

  async function deleteResourcePermanently() {
    if (!canConfirmResourceDeletion(state.resourceDeletion) || state.saving) return;

    await layoutUpdates.whenIdle();
    if (!canConfirmResourceDeletion(state.resourceDeletion) || state.saving) return;

    const resource = state.resourceDeletion.resource;
    state.resourceDeletion = beginResourceDeletion(state.resourceDeletion);
    state.saving = true;
    root.dataset.saving = 'true';
    syncResourceControls();
    renderResourceDeletion();

    try {
      const result = await catalogApi.delete({
        kind: resource.kind,
        resourceId: resource.resource_id,
        version: resource.version,
      });
      const removedIds = new Set(result.removed_item_ids ?? []);
      state.canvas.items = state.canvas.items.filter(
        ({ id }) => !removedIds.has(id),
      );
      state.connections = state.connections.filter((connection) => (
        !removedIds.has(connection.sourceItemId)
        && !removedIds.has(connection.targetItemId)
      ));
      if (result.canvas_revision != null) {
        state.canvas.revision = result.canvas_revision;
      }
      state.resources.delete(resourceKey(resource.kind, resource.resource_id));
      state.resourceEditor = createResourceEditorState();
      state.resourceDeletion = createResourceDeleteState();
      renderResourceEditor();
      renderResourceDeletion();
      renderCanvas();
      showCanvasActionToast('Deleted permanently');
    } catch (error) {
      state.resourceDeletion = failResourceDeletion(
        state.resourceDeletion,
        resourceDeletionError(error),
      );
      renderResourceDeletion();
    } finally {
      state.saving = false;
      delete root.dataset.saving;
      syncResourceControls();
    }
  }

  function openEditor(resource) {
    if (!CARD_TYPE_CONFIG[resource.kind]?.editable) return;
    state.resourceEditor = openResourceEditor(resource);
    renderResourceEditor();
    window.requestAnimationFrame(() => {
      const field = resourceEditorField();
      field?.focus();
      field?.select();
    });
  }

  function closeEditor() {
    if (state.resourceEditor.saving) return;
    state.resourceEditor = createResourceEditorState();
    renderResourceEditor();
  }

  function resourceUpdateError(error) {
    if (error?.status === 409) {
      return new Error('This item changed elsewhere. Close and reopen it to load the latest version.');
    }
    const titleError = error?.payload?.title;
    if (Array.isArray(titleError) && titleError[0]) {
      return new Error(titleError[0]);
    }
    return new Error(error?.message || 'Couldn’t save this item.');
  }

  async function saveResourceEditor() {
    if (!canSaveResourceEditor(state.resourceEditor)) return;
    const editor = state.resourceEditor;
    const resource = editor.resource;
    state.resourceEditor = beginResourceEditorSave(editor);
    renderResourceEditor();

    try {
      const payload = await catalogApi.update({
        kind: resource.kind,
        resourceId: resource.resource_id,
        title: editor.draftTitle.trim(),
        version: resource.version,
      });
      const updated = payload.resource;
      state.resources.set(
        resourceKey(updated.kind, updated.resource_id),
        updated,
      );
      state.resourceEditor = createResourceEditorState();
      renderResourceEditor();
      renderCanvas();
    } catch (error) {
      state.resourceEditor = failResourceEditorSave(
        state.resourceEditor,
        resourceUpdateError(error),
      );
      renderResourceEditor();
    }
  }

  function itemById(itemId) {
    return (state.canvas?.items ?? []).find(({ id }) => id === itemId) ?? null;
  }

  function itemResource(item) {
    return state.resources.get(
      resourceKey(item.kind, item.resource_id),
    ) ?? findDemoResource(item) ?? resolveResource(item);
  }

  function getCanvasSelectionCards() {
    return (state.canvas?.items ?? []).map((item) => {
      const card = cardElements.get(item.id)?.querySelector('.canvas-card');
      const geometry = canvasCardGeometry(
        item.kind,
        itemResource(item).title,
      );
      return {
        id: item.id,
        x: item.x,
        y: item.y,
        width: card?.offsetWidth || geometry.width,
        height: card?.offsetHeight || geometry.height,
      };
    });
  }

  function renderCanvasSelectionMarquee(rectangle) {
    const marquee = elements.canvasSelectionMarquee;
    root.classList.toggle('is-canvas-marquee-active', Boolean(rectangle));
    if (!rectangle) {
      marquee.hidden = true;
      return;
    }

    marquee.hidden = false;
    marquee.style.left = `${rectangle.left}px`;
    marquee.style.top = `${rectangle.top}px`;
    marquee.style.width = `${rectangle.right - rectangle.left}px`;
    marquee.style.height = `${rectangle.bottom - rectangle.top}px`;
  }

  function renderCanvasSelectionUi() {
    const availableIds = new Set(
      (state.canvas?.items ?? []).map(({ id }) => id),
    );
    state.canvasSelection = setCanvasSelectionIds(
      state.canvasSelection,
      [...state.canvasSelection.selectedIds].filter(
        (itemId) => availableIds.has(itemId),
      ),
    );

    const count = state.canvasSelection.selectedIds.size;
    root.classList.toggle('is-canvas-selection-active', count > 0);
    elements.canvasSelectionToolbar.hidden = count === 0;
    elements.canvasSelectionCount.textContent = `${count} selected`;
    cardElements.forEach((element, itemId) => {
      element.classList.toggle(
        'is-canvas-selected',
        state.canvasSelection.selectedIds.has(itemId),
      );
    });
  }

  function clearCanvasSelection() {
    state.canvasSelection = createCanvasSelection();
    canvasSelectionGesture = null;
    renderCanvasSelectionMarquee(null);
    renderCanvasSelectionUi();
  }

  function canvasContentBounds() {
    const items = state.canvas?.items ?? [];
    if (!items.length) return null;

    const boxes = items.map((item) => {
      const card = cardElements.get(item.id)?.querySelector('.canvas-card');
      const geometry = canvasCardGeometry(
        item.kind,
        itemResource(item).title,
      );
      return {
        x: item.x,
        y: item.y,
        width: card?.offsetWidth || geometry.width,
        height: card?.offsetHeight || geometry.height,
      };
    });
    const left = Math.min(...boxes.map(({ x }) => x));
    const top = Math.min(...boxes.map(({ y }) => y));
    const right = Math.max(...boxes.map(({ x, width }) => x + width));
    const bottom = Math.max(...boxes.map(({ y, height }) => y + height));

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  function fitCanvasContent() {
    const bounds = canvasContentBounds();
    if (bounds) {
      viewportController.fitBounds(bounds);
    } else {
      viewportController.reset(null, { persist: true });
    }
  }

  function renderItemPosition(itemId) {
    const item = itemById(itemId);
    const element = cardElements.get(itemId);
    if (!item || !element) return;
    element.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
  }

  function topCardZIndex() {
    return [...cardElements.values()].reduce(
      (maximum, element) => Math.max(
        maximum,
        Number(element.style.zIndex) || 2,
      ),
      2,
    );
  }

  function bringCardToFront(element) {
    element.style.zIndex = String(topCardZIndex() + 1);
  }

  const connectionRenderer = createConnectionRenderer({
    layer: elements.connectionLayer,
    getCardById(itemId) {
      const item = itemById(itemId);
      const card = cardElements.get(itemId)?.querySelector('.canvas-card');
      if (!item || !card) return null;
      const geometry = canvasCardGeometry(item.kind);
      return {
        x: item.x,
        y: item.y,
        width: card.offsetWidth || geometry.width,
        height: card.offsetHeight || geometry.height,
      };
    },
  });

  const renderScheduler = createCanvasRenderScheduler({
    requestFrame: window.requestAnimationFrame.bind(window),
    cancelFrame: window.cancelAnimationFrame.bind(window),
    onFlush({ allItems, itemIds, connections }) {
      if (allItems) {
        (state.canvas?.items ?? []).forEach(({ id }) => renderItemPosition(id));
      } else {
        itemIds.forEach(renderItemPosition);
      }
      if (connections || allItems || itemIds.size > 0) {
        connectionRenderer.update();
      }
    },
  });

  viewportController = createCanvasViewportController({
    viewport: elements.canvasViewport,
    world: elements.canvasWorld,
    shouldStartPan(event) {
      return event.button === 0 && !event.target.closest(
        '.canvas-card-position, button, input, textarea, select, a',
      );
    },
    onRender(camera) {
      syncCanvasGrid(elements.canvasViewport, camera);
    },
    onCommit(camera) {
      saveCanvasCamera(localStorage, state.user?.id, camera);
    },
  });

  const SELECTION_DRAG_THRESHOLD_PX = 6;

  function selectionInteractionBlocked() {
    return Boolean(
      state.saving
      || state.connectionEditor
      || state.connectionSaving
      || state.resourceEditor.resource
      || state.resourceDeletion.resource
    );
  }

  function beginCanvasSelection(event) {
    if (
      event.button !== 2
      || event.pointerType !== 'mouse'
      || selectionInteractionBlocked()
    ) return;
    if (
      event.target instanceof Element
      && event.target.closest('button, input, textarea, select, a')
    ) return;

    const cardId = event.target instanceof Element
      ? event.target.closest('.canvas-card-position')?.dataset.itemId ?? null
      : null;

    canvasSelectionGesture = {
      pointerId: event.pointerId,
      phase: 'pending',
      cardId,
      startClient: { x: event.clientX, y: event.clientY },
      startWorld: viewportController.clientToWorld({
        x: event.clientX,
        y: event.clientY,
      }),
      additive: event.shiftKey || event.ctrlKey || event.metaKey,
      previousIds: new Set(state.canvasSelection.selectedIds),
      baseIds: null,
    };

    elements.canvasViewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveCanvasSelection(event) {
    const gesture = canvasSelectionGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    if (gesture.phase === 'pending') {
      const distance = Math.hypot(
        event.clientX - gesture.startClient.x,
        event.clientY - gesture.startClient.y,
      );
      if (distance < SELECTION_DRAG_THRESHOLD_PX) return;

      // A right drag that starts on a card must not become a marquee.
      if (gesture.cardId) {
        canvasSelectionGesture = null;
        return;
      }

      gesture.phase = 'marquee';
      gesture.baseIds = gesture.additive
        ? new Set(gesture.previousIds)
        : new Set();
      state.canvasSelection = setCanvasSelectionIds(
        state.canvasSelection,
        gesture.baseIds,
      );
    }

    const rectangle = selectionRectangle(
      gesture.startWorld,
      viewportController.clientToWorld({
        x: event.clientX,
        y: event.clientY,
      }),
    );
    const intersectingIds = selectCardsInRectangle(
      getCanvasSelectionCards(),
      rectangle,
    );
    state.canvasSelection = setCanvasSelectionIds(
      state.canvasSelection,
      [...gesture.baseIds, ...intersectingIds],
    );
    renderCanvasSelectionMarquee(rectangle);
    renderCanvasSelectionUi();
  }

  function finishCanvasSelection(event, { cancelled = false } = {}) {
    const gesture = canvasSelectionGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    canvasSelectionGesture = null;
    renderCanvasSelectionMarquee(null);

    if (cancelled) {
      state.canvasSelection = setCanvasSelectionIds(
        state.canvasSelection,
        gesture.previousIds,
      );
    } else if (gesture.phase === 'pending' && gesture.cardId) {
      state.canvasSelection = toggleCanvasSelectionId(
        state.canvasSelection,
        gesture.cardId,
      );
    }

    renderCanvasSelectionUi();
  }

  elements.canvasViewport.addEventListener('pointerdown', beginCanvasSelection);
  elements.canvasViewport.addEventListener('pointermove', moveCanvasSelection);
  elements.canvasViewport.addEventListener('pointerup', (event) => {
    finishCanvasSelection(event);
  });
  elements.canvasViewport.addEventListener('pointercancel', (event) => {
    finishCanvasSelection(event, { cancelled: true });
  });
  elements.canvasViewport.addEventListener('contextmenu', (event) => {
    if (
      event.target instanceof Element
      && event.target.closest('button, input, textarea, select, a')
    ) return;
    event.preventDefault();
  });

  const layoutUpdates = createLayoutUpdateQueue({
    async persist(changes) {
      if (!state.canvas) return;
      const result = await api.updateLayout({
        baseRevision: state.canvas.revision,
        changes,
      });
      if (state.canvas) state.canvas.revision = result.revision;
    },
    onBusyChange(busy) {
      root.toggleAttribute('data-layout-saving', busy);
      renderConnectionUi();
    },
    async onError(error) {
      state.error = error;
      await loadCanvas();
    },
  });

  function syncResourceControls() {
    const disabled = (
      state.sessionStatus !== 'authenticated'
      || state.loading
      || state.saving
      || state.connectionSaving
      || Boolean(state.connectionEditor)
      || layoutUpdates.isBusy()
    );
    const query = state.resourcePalette.draft.title;

    if (elements.resourceSearch.value !== query) {
      elements.resourceSearch.value = query;
    }

    elements.resourceSearch.disabled = disabled;
    elements.resourceSearchClear.hidden = !query;
    elements.resourceSearchShortcut.hidden = Boolean(query);
  }

  function rebuildConnectionLayer() {
    const mountedItemIds = new Set((state.canvas?.items ?? []).map(({ id }) => id));
    const renderable = buildRenderableConnections(
      state.connections,
      state.connectionEditor,
    ).filter(({ sourceId, targetId }) => (
      mountedItemIds.has(sourceId) && mountedItemIds.has(targetId)
    ));
    connectionRenderer.setConnections(renderable);
    connectionRenderer.update();
  }

  function renderConnectionUi() {
    const editor = state.connectionEditor;
    root.classList.toggle('is-connection-editing', Boolean(editor));
    elements.connectionToolbar.hidden = !editor;

    if (editor) {
      const selectedCount = editor.selectedTargetIds.size;
      elements.connectionCount.textContent = state.connectionError
        ? 'Couldn’t save. Try again.'
        : `${selectedCount} selected`;
      elements.connectionDone.disabled = state.connectionSaving;
      elements.connectionCancel.disabled = state.connectionSaving;
      elements.connectionDone.textContent = state.connectionSaving ? 'Saving…' : 'Done';
    }

    cardElements.forEach((position, itemId) => {
      const button = position.querySelector('.connection-button');
      if (!button) return;
      const isSource = itemId === editor?.sourceId;
      const isSelected = editor?.selectedTargetIds.has(itemId) === true;
      position.classList.toggle('is-connection-source', isSource);
      position.classList.toggle('is-connection-selected', isSelected);
      button.disabled = state.connectionSaving || state.saving || layoutUpdates.isBusy();

      let title = 'Edit connections';
      if (isSource) title = 'Cancel connection editing';
      else if (editor && isSelected) title = 'Remove connection';
      else if (editor) title = 'Add connection';

      renderConnectionActionButton(button, {
        state: getConnectionActionState({
          editing: Boolean(editor),
          source: isSource,
          selected: isSelected,
        }),
        title,
      });
    });

    syncResourceControls();
    rebuildConnectionLayer();
  }

  function openConnectionEditor(item) {
    if (
      state.connectionEditor
      || state.connectionSaving
      || state.saving
      || layoutUpdates.isBusy()
    ) return;

    clearCanvasSelection();
    closeAccountMenu();
    closeResourceSearch();
    state.connectionError = null;
    state.connectionEditor = {
      sourceId: item.id,
      selectedTargetIds: new Set(
        getOutgoingTargetIds(state.connections, item.id),
      ),
    };
    renderConnectionUi();
  }

  function cancelConnectionEditor() {
    if (!state.connectionEditor || state.connectionSaving) return;
    state.connectionEditor = null;
    state.connectionError = null;
    renderConnectionUi();
  }

  function toggleConnectionCandidate(item) {
    const editor = state.connectionEditor;
    if (!editor || item.id === editor.sourceId || state.connectionSaving) return;
    state.connectionError = null;
    if (editor.selectedTargetIds.has(item.id)) {
      editor.selectedTargetIds.delete(item.id);
    } else if (editor.selectedTargetIds.size < MAX_CONNECTIONS_PER_ITEM) {
      editor.selectedTargetIds.add(item.id);
    }
    renderConnectionUi();
  }

  function handleConnectionButton(item) {
    if (!state.connectionEditor) {
      openConnectionEditor(item);
      return;
    }
    if (state.connectionEditor.sourceId === item.id) {
      cancelConnectionEditor();
      return;
    }
    toggleConnectionCandidate(item);
  }

  async function commitConnectionEditor() {
    const editor = state.connectionEditor;
    if (!editor || state.connectionSaving || !state.canvas) return;

    state.connectionSaving = true;
    state.connectionError = null;
    renderConnectionUi();
    try {
      const result = await api.replaceConnections({
        sourceItemId: editor.sourceId,
        baseRevision: state.canvas.revision,
        targetItemIds: [...editor.selectedTargetIds],
      });
      state.canvas.revision = result.revision;
      state.connections = [
        ...state.connections.filter(({ sourceId }) => sourceId !== editor.sourceId),
        ...(result.connections ?? []).map(normalizeConnection),
      ];
      state.connectionEditor = null;
    } catch (error) {
      state.connectionError = error;
      if (error.status === 409) {
        state.connectionEditor = null;
        await loadCanvas();
      }
    } finally {
      state.connectionSaving = false;
      renderConnectionUi();
    }
  }

  function planResourceInsertion(resource) {
    const bounds = elements.canvasViewport.getBoundingClientRect();
    const candidateGeometry = canvasCardGeometry(resource.kind, resource.title);
    const obstacles = (state.canvas?.items ?? []).map((item) => {
      const card = cardElements.get(item.id)?.querySelector('.canvas-card');
      const geometry = canvasCardGeometry(item.kind);
      return {
        id: item.id,
        x: item.x,
        y: item.y,
        width: card?.offsetWidth || geometry.width,
        height: card?.offsetHeight || geometry.height,
      };
    });
    const desired = viewportController.clientToWorld({
      x: bounds.left + (bounds.width / 2) - (candidateGeometry.width / 2),
      y: bounds.top + (bounds.height / 2) - (candidateGeometry.height / 2),
    });
    const insertion = planCanvasInsertion({
      candidate: {
        id: resourceKey(resource.kind, resource.resource_id),
        ...desired,
        width: candidateGeometry.width,
        height: candidateGeometry.height,
      },
      obstacles,
      gap: CANVAS_INSERTION_GAP,
    });

    return {
      position: insertion.position,
      movedExisting: insertion.moved.map((position) => ({
        itemId: position.id,
        x: position.x,
        y: position.y,
      })),
    };
  }

  function closeAccountMenu() {
    elements.accountMenu.hidden = true;
    elements.accountButton.setAttribute('aria-expanded', 'false');
  }

  function renderAppearance({ mode }) {
    elements.themeOptions.forEach((option) => {
      const selected = option.dataset.themeValue === mode;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-checked', String(selected));
    });
  }

  function renderSession() {
    const surface = deriveAppSurface(state.sessionStatus);
    const { authenticated, checking } = surface;
    const email = state.user?.email ?? '';

    elements.guestLanding.hidden = !surface.showGuestLanding;
    elements.guestBrand.hidden = !surface.showGuestLanding;
    elements.accountActions.hidden = !surface.showWorkspace;
    elements.canvas.hidden = !surface.showWorkspace;
    elements.composer.hidden = !surface.showWorkspace;
    elements.guestSignIn.disabled = checking;
    elements.guestSignIn.textContent = checking ? 'Checking…' : 'Sign in';
    elements.guestStatus.textContent = state.error?.message ?? 'Uses your Majom ID';
    elements.guestStatus.classList.toggle('is-error', Boolean(state.error));

    elements.accountButton.disabled = checking;
    elements.navigationHud.hidden = !authenticated;
    elements.accountButton.dataset.authenticated = String(authenticated);
    const initial = (email.trim().charAt(0) || 'M').toUpperCase();
    elements.accountAvatar.textContent = initial;
    elements.accountMenuAvatar.textContent = initial;
    elements.accountAvatar.hidden = !authenticated;
    elements.accountLabel.hidden = authenticated;
    elements.accountLabel.textContent = checking
      ? 'Checking…'
      : authenticated
        ? email
        : 'Sign in';
    elements.accountEmail.textContent = email;

    if (authenticated) {
      elements.accountButton.setAttribute('aria-haspopup', 'dialog');
      elements.accountButton.title = `Account: ${email}`;
    } else {
      elements.accountButton.removeAttribute('aria-haspopup');
      elements.accountButton.title = checking ? 'Checking your session' : 'Sign in';
    }

    if (!authenticated) {
      closeAccountMenu();
    }
  }

  function registerCardClick(itemId, timestamp) {
    const previous = previousCardClick;
    const isDoubleClick = Boolean(
      previous
      && previous.itemId === itemId
      && timestamp - previous.timestamp <= CARD_DOUBLE_CLICK_WINDOW_MS
    );

    previousCardClick = isDoubleClick
      ? null
      : { itemId, timestamp };
    return isDoubleClick;
  }

  function beginDrag(event, item, position, onDoubleClick = null) {
    if (
      event.button !== 0
      || state.saving
      || state.connectionEditor
      || state.resourceEditor.resource
      || state.resourceDeletion.resource
    ) return;
    if (event.target.closest('button, input, textarea, select, a')) return;

    event.preventDefault();
    const pointerStart = { x: event.clientX, y: event.clientY };
    const pointerStartWorld = viewportController.clientToWorld(pointerStart);
    const selectionIncludesItem = state.canvasSelection.selectedIds.has(item.id);
    const movingItems = selectionIncludesItem
      ? state.canvas.items.filter(({ id }) => (
          state.canvasSelection.selectedIds.has(id)
        ))
      : [item];
    const movingIds = movingItems.map(({ id }) => id);
    const origins = captureSelectionOrigins(
      state.canvas.items,
      new Set(movingIds),
    );
    let dragging = false;

    position.setPointerCapture(event.pointerId);

    function renderDraggingState(active) {
      movingIds.forEach((itemId) => {
        cardElements.get(itemId)?.classList.toggle('is-dragging', active);
      });
    }

    function onPointerMove(moveEvent) {
      if (moveEvent.pointerId !== event.pointerId) return;
      if (!dragging) {
        const distance = Math.hypot(
          moveEvent.clientX - pointerStart.x,
          moveEvent.clientY - pointerStart.y,
        );
        if (distance < 6) return;
        dragging = true;
        movingIds.forEach((itemId) => {
          const element = cardElements.get(itemId);
          if (element) bringCardToFront(element);
        });
        renderDraggingState(true);
      }

      const pointer = viewportController.clientToWorld({
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      });
      const positions = translateSelectionOrigins(
        origins,
        {
          x: pointer.x - pointerStartWorld.x,
          y: pointer.y - pointerStartWorld.y,
        },
      );
      positions.forEach(({ id, x, y }) => {
        const movedItem = itemById(id);
        if (!movedItem) return;
        movedItem.x = x;
        movedItem.y = y;
      });
      renderScheduler.request({
        items: movingIds,
        connections: true,
      });
    }

    function finishDrag(finishEvent) {
      if (finishEvent.pointerId !== event.pointerId) return;
      position.removeEventListener('pointermove', onPointerMove);
      position.removeEventListener('pointerup', finishDrag);
      position.removeEventListener('pointercancel', cancelDrag);
      renderDraggingState(false);

      if (!dragging) {
        if (
          registerCardClick(item.id, finishEvent.timeStamp)
          && onDoubleClick
        ) {
          onDoubleClick();
        }
        return;
      }

      previousCardClick = null;

      const changes = movingItems.map((movedItem) => {
        movedItem.x = Math.round(movedItem.x);
        movedItem.y = Math.round(movedItem.y);
        return {
          itemId: movedItem.id,
          x: movedItem.x,
          y: movedItem.y,
        };
      });
      renderScheduler.request({
        items: movingIds,
        connections: true,
      });
      layoutUpdates.enqueueMany(changes);
    }

    function cancelDrag(cancelEvent) {
      if (cancelEvent.pointerId !== event.pointerId) return;
      origins.forEach((origin, itemId) => {
        const movedItem = itemById(itemId);
        if (!movedItem) return;
        movedItem.x = origin.x;
        movedItem.y = origin.y;
      });
      position.removeEventListener('pointermove', onPointerMove);
      position.removeEventListener('pointerup', finishDrag);
      position.removeEventListener('pointercancel', cancelDrag);
      renderDraggingState(false);
      previousCardClick = null;
      renderScheduler.request({
        items: movingIds,
        connections: true,
      });
    }

    position.addEventListener('pointermove', onPointerMove);
    position.addEventListener('pointerup', finishDrag);
    position.addEventListener('pointercancel', cancelDrag);
  }

  function resourceIsOnCanvas(resource) {
    return (state.canvas?.items ?? []).some(
      (item) => (
        item.kind === resource.kind
        && item.resource_id === resource.resource_id
      ),
    );
  }

  const CREATE_SEARCH_COMMAND_KEY = 'create';

  function canCreateCurrentSearchQuery() {
    if (!state.resourcePalette.draft.title.trim()) return false;
    return resourceCreationOptions().some(({ canCreate }) => canCreate);
  }

  function resourceSearchCommands() {
    const commands = state.resourcePalette.search.results
      .filter((resource) => !resourceIsOnCanvas(resource))
      .map((resource) => ({
        key: resourceKey(resource.kind, resource.resource_id),
        type: 'resource',
        resource,
      }));

    if (canCreateCurrentSearchQuery()) {
      commands.push({
        key: CREATE_SEARCH_COMMAND_KEY,
        type: 'create',
        resource: null,
      });
    }

    return commands;
  }

  function selectFirstAvailableSearchCommand() {
    const commands = resourceSearchCommands();
    const selectionExists = commands.some(
      ({ key }) => key === state.selectedSearchCommandKey,
    );
    if (!selectionExists) {
      state.selectedSearchCommandKey = commands[0]?.key ?? null;
    }
  }

  function renderPlacementSummary() {
    const count = state.resourcePlacement.sessionKeys.length;
    elements.resourcePlacementSummary.hidden = count === 0;
    elements.resourcePlacementSummaryLabel.textContent = (
      `${count} ${count === 1 ? 'item' : 'items'} added`
    );
  }

  function showCompletedPlacement(key) {
    window.clearTimeout(placementFeedbackTimer);
    state.resourcePlacement = completeResourcePlacement(
      state.resourcePlacement,
      key,
    );
    placementFeedbackTimer = window.setTimeout(() => {
      state.resourcePlacement = clearRecentPlacement(
        state.resourcePlacement,
        key,
      );
      renderResourceSearch();
    }, 1_200);
  }

  function createResourceResult(resource) {
    const key = resourceKey(resource.kind, resource.resource_id);
    const added = resourceIsOnCanvas(resource);
    const selected = key === state.selectedSearchCommandKey;
    const pending = state.resourcePlacement.pendingKey === key;
    const recent = state.resourcePlacement.recentKey === key;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'resource-search-popover__result';
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(selected));
    button.setAttribute(
      'aria-label',
      added
        ? `${resource.title}, on canvas`
        : `Add ${resource.title} to canvas`,
    );
    button.classList.toggle('is-selected', selected);
    button.classList.toggle('is-added', added);
    button.classList.toggle('is-pending', pending);
    button.classList.toggle('is-recent', recent);
    button.disabled = added || state.saving;
    button.setAttribute('aria-busy', String(pending));

    const resourceIcon = document.createElement('span');
    resourceIcon.className = `resource-search-popover__result-icon is-${resource.kind}`;
    resourceIcon.innerHTML = icon(CARD_TYPE_CONFIG[resource.kind].icon);

    const copy = document.createElement('span');
    copy.className = 'resource-search-popover__result-copy';
    const title = document.createElement('strong');
    title.textContent = resource.title;
    const meta = document.createElement('small');
    meta.textContent = resource.detail;
    copy.append(title, meta);

    const action = document.createElement('span');
    action.className = 'resource-search-popover__result-action';
    action.classList.toggle('is-added', added);
    action.setAttribute('aria-hidden', 'true');
    if (added) {
      action.innerHTML = `${icon('checkmark')}<span>Added</span>`;
    } else if (pending) {
      action.innerHTML = '<span class="resource-placement-spinner"></span>';
    } else {
      action.innerHTML = icon('plus');
    }

    button.append(resourceIcon, copy, action);
    button.addEventListener('pointermove', () => {
      if (added || state.selectedSearchCommandKey === key) return;
      state.selectedSearchCommandKey = key;
      renderResourceSearch();
    });
    button.addEventListener('click', () => {
      state.selectedSearchCommandKey = key;
      void addResource(resource);
    });
    return button;
  }

  function resourceCreationOptions() {
    return getResourceCreationOptions({
      title: state.resourcePalette.draft.title,
    });
  }

  function renderResourceCreation() {
    const palette = state.resourcePalette;
    const options = resourceCreationOptions();
    const query = palette.draft.title.trim();
    const hasCreatableType = options.some(({ canCreate }) => canCreate);

    elements.composer.dataset.screen = palette.screen;
    elements.resourceSearchScreen.hidden = (
      palette.screen !== RESOURCE_PALETTE_SCREENS.SEARCH
    );
    elements.resourceTypeScreen.hidden = (
      palette.screen !== RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE
    );

    elements.resourceCreateStart.hidden = !(
      palette.screen === RESOURCE_PALETTE_SCREENS.SEARCH
      && query
      && hasCreatableType
    );
    const createSelected = (
      state.selectedSearchCommandKey === CREATE_SEARCH_COMMAND_KEY
    );
    elements.resourceCreateStart.classList.toggle('is-selected', createSelected);
    elements.resourceCreateStart.setAttribute(
      'aria-selected',
      String(createSelected),
    );
    elements.resourceCreateStartTitle.textContent = `Create “${query}”…`;
    elements.resourceCreateHeading.textContent = `Create “${query}”`;

    elements.resourceCreateKindButtons.forEach((button) => {
      const option = options.find(({ kind }) => kind === button.dataset.resourceCreateKind);
      const selected = (
        palette.draft.selectedKind === button.dataset.resourceCreateKind
      );
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-busy', String(selected && state.saving));
      button.disabled = state.saving || !option || !option.canCreate;
      button.title = option?.tooLong
        ? `Maximum ${option.maximumLength} characters.`
        : '';
    });

    const note = palette.actionError?.message ?? '';
    elements.resourceCreateNote.textContent = note;
    elements.resourceCreateNote.hidden = !note;
  }

  function renderResourceSearchFilters() {
    elements.resourceSearchFilterButtons.forEach((button) => {
      const active = (
        button.dataset.resourceSearchFilter
        === state.resourcePalette.activeFilter
      );
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function selectedSearchCommand() {
    return resourceSearchCommands().find(
      ({ key }) => key === state.selectedSearchCommandKey,
    ) ?? null;
  }

  function renderResourceSearchShortcuts() {
    const command = selectedSearchCommand();
    elements.resourcePrimaryActionLabel.textContent = (
      command?.type === 'create' ? 'Create' : 'Place'
    );
    elements.resourceSearchShortcuts.classList.toggle(
      'is-disabled',
      !command,
    );
  }

  function renderResourceSearch() {
    if (
      state.searchOpen
      && state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH
      && elements.resourceResults.childElementCount > 0
    ) {
      state.resourcePalette = {
        ...state.resourcePalette,
        scrollTop: elements.resourceResults.scrollTop,
      };
    }
    elements.resourceResults.replaceChildren();
    elements.resourceSearchPopover.hidden = !state.searchOpen;
    elements.resourcePaletteBackdrop.hidden = !state.searchOpen;
    elements.composer.classList.toggle('is-open', state.searchOpen);
    elements.resourceSearch.setAttribute(
      'aria-expanded',
      String(state.searchOpen),
    );
    syncResourceControls();
    renderPlacementSummary();

    if (!state.searchOpen) {
      elements.composer.dataset.screen = RESOURCE_PALETTE_SCREENS.SEARCH;
      return;
    }

    selectFirstAvailableSearchCommand();
    renderResourceSearchFilters();
    renderResourceCreation();
    renderResourceSearchShortcuts();
    if (state.resourcePalette.screen !== RESOURCE_PALETTE_SCREENS.SEARCH) {
      syncResourceControls();
      return;
    }

    const search = state.resourcePalette.search;
    if (state.resourcePalette.actionError) {
      elements.resourceSearchStatus.textContent = state.resourcePalette.actionError.message;
    } else if (search.status === 'debouncing' || search.status === 'loading') {
      elements.resourceSearchStatus.textContent = 'Searching…';
    } else if (search.status === 'error') {
      elements.resourceSearchStatus.textContent = search.error.message;
    } else {
      selectFirstAvailableSearchCommand();
      elements.resourceSearchStatus.textContent = search.unavailableSources.length
        ? 'Some sources are temporarily unavailable.'
        : !search.results.length
          ? 'No matching resources.'
          : '';
    }

    if (search.status === 'success') {
      const fragment = document.createDocumentFragment();
      SEARCHABLE_CARD_TYPES.forEach((kind) => {
        const config = CARD_TYPE_CONFIG[kind];
        const resources = search.results.filter(
          (resource) => resource.kind === kind,
        );
        if (!resources.length) return;
        const group = document.createElement('section');
        group.className = 'resource-search-popover__group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', config.pluralLabel);
        const heading = document.createElement('h3');
        heading.textContent = config.pluralLabel;
        group.append(heading, ...resources.map(createResourceResult));
        fragment.append(group);
      });
      elements.resourceResults.append(fragment);
      elements.resourceResults.scrollTop = state.resourcePalette.scrollTop;
    }
    syncResourceControls();
  }

  async function searchResources({
    requestId,
    query,
    kinds,
    signal,
    background = false,
  }) {
    if (state.resourcePalette.search.requestId !== requestId) return;
    if (!background) {
      state.resourcePalette = startResourceSearch(
        state.resourcePalette,
        requestId,
      );
      renderResourceSearch();
    }
    try {
      const payload = await catalogApi.search({
        query,
        kinds,
        signal,
      });
      if (state.resourcePalette.search.requestId !== requestId) return;
      state.resourcePalette = finishResourceSearch(
        state.resourcePalette,
        requestId,
        payload,
        Date.now(),
      );
      selectFirstAvailableSearchCommand();
    } catch (error) {
      if (signal.aborted || error.name === 'AbortError') return;
      if (state.resourcePalette.search.requestId !== requestId) return;
      state.resourcePalette = failResourceSearch(
        state.resourcePalette,
        requestId,
        error,
      );
    }
    renderResourceSearch();
  }

  function activeResourceSearchKinds() {
    return resourceSearchFilter(
      state.resourcePalette.activeFilter,
    ).kinds;
  }

  function revalidateResourceSearch() {
    window.clearTimeout(searchTimer);
    searchAbortController?.abort();
    state.resourcePalette = refreshResourceSearch(state.resourcePalette);
    const requestId = state.resourcePalette.search.requestId;
    const query = state.resourcePalette.draft.title.trim();
    const controller = new AbortController();
    searchAbortController = controller;
    renderResourceSearch();
    void searchResources({
      requestId,
      query,
      kinds: activeResourceSearchKinds(),
      signal: controller.signal,
      background: true,
    });
  }

  function queueCurrentResourceSearch({ immediate = false } = {}) {
    window.clearTimeout(searchTimer);
    searchAbortController?.abort();
    const requestId = state.resourcePalette.search.requestId;
    const query = state.resourcePalette.draft.title.trim();
    const controller = new AbortController();
    searchAbortController = controller;
    renderResourceSearch();
    const run = () => searchResources({
      requestId,
      query,
      kinds: activeResourceSearchKinds(),
      signal: controller.signal,
    });
    if (immediate) {
      void run();
      return;
    }
    searchTimer = window.setTimeout(() => void run(), 180);
  }

  function scheduleResourceSearch({ immediate = false } = {}) {
    state.searchOpen = true;
    state.selectedSearchCommandKey = null;
    state.resourcePalette = changeResourceQuery(
      state.resourcePalette,
      elements.resourceSearch.value,
    );
    queueCurrentResourceSearch({ immediate });
  }

  function openResourceSearch() {
    if (state.sessionStatus !== 'authenticated') return;
    closeAccountMenu();
    state.searchOpen = true;
    elements.resourceSearch.value = state.resourcePalette.draft.title;
    renderResourceSearch();

    const search = state.resourcePalette.search;
    const neverLoaded = search.status === 'idle';
    const failedWithoutResults = search.status === 'error' && !search.results.length;
    const stale = (
      search.completedAt !== null
      && Date.now() - search.completedAt > RESOURCE_SEARCH_TTL_MS
    );

    if (neverLoaded || failedWithoutResults) {
      scheduleResourceSearch({ immediate: true });
    } else if (stale && !search.refreshing) {
      revalidateResourceSearch();
    }

    window.requestAnimationFrame(() => {
      elements.resourceResults.scrollTop = state.resourcePalette.scrollTop;
      elements.resourceSearch.focus();
    });
  }

  function closeResourceSearch() {
    if (!state.searchOpen) return;
    if (
      state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH
      && elements.resourceResults.childElementCount > 0
    ) {
      state.resourcePalette = {
        ...state.resourcePalette,
        scrollTop: elements.resourceResults.scrollTop,
      };
    }
    state.searchOpen = false;
    renderResourceSearch();
  }

  function moveResourceSelection(direction) {
    const commands = resourceSearchCommands();
    if (!commands.length) return;
    const currentIndex = commands.findIndex(
      ({ key }) => key === state.selectedSearchCommandKey,
    );
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + commands.length) % commands.length;
    state.selectedSearchCommandKey = commands[nextIndex].key;
    renderResourceSearch();
    window.requestAnimationFrame(() => {
      elements.resourceSearchScreen
        .querySelector('.is-selected')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  function activateSelectedSearchCommand() {
    const command = selectedSearchCommand();
    if (!command) return;

    if (command.type === 'resource') {
      void addResource(command.resource);
      return;
    }

    state.resourcePalette = beginResourceCreation(state.resourcePalette);
    renderResourceSearch();
    window.requestAnimationFrame(() => {
      elements.resourceCreateKindButtons
        .find((button) => !button.disabled)
        ?.focus();
    });
  }

  function returnToPreviousResourceScreen() {
    state.resourcePalette = returnFromResourceCreation(state.resourcePalette);
    renderResourceSearch();
    window.requestAnimationFrame(() => {
      if (state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH) {
        elements.resourceSearch.focus();
      } else {
        elements.resourceCreateKindButtons.find((button) => !button.disabled)?.focus();
      }
    });
  }

  async function placeResource(
    resolveNextResource,
    operation,
    initialKey = null,
  ) {
    if (state.saving) return;

    state.saving = true;
    state.resourceAction = operation;
    state.resourcePlacement = beginResourcePlacement(
      state.resourcePlacement,
      initialKey,
    );
    state.resourcePalette = {
      ...state.resourcePalette,
      actionError: null,
    };
    root.dataset.saving = 'true';
    syncResourceControls();
    renderResourceSearch();
    let resource = null;
    let placementCompleted = false;
    let shouldRefreshSearch = false;
    try {
      resource = await resolveNextResource();
      if (!resource || resourceIsOnCanvas(resource)) return;
      const insertion = planResourceInsertion(resource);
      if (insertion.movedExisting.length > 0) {
        const layoutResult = await api.updateLayout({
          baseRevision: state.canvas.revision,
          changes: insertion.movedExisting,
        });
        state.canvas.revision = layoutResult.revision;
        insertion.movedExisting.forEach((change) => {
          const item = itemById(change.itemId);
          if (item) Object.assign(item, { x: change.x, y: change.y });
        });
      }

      const result = await api.addItem({
        kind: resource.kind,
        resource_id: resource.resource_id,
        x: insertion.position.x,
        y: insertion.position.y,
      });
      state.canvas.revision = result.revision;
      state.canvas.items.push(result.item);
      state.resources.set(
        resourceKey(resource.kind, resource.resource_id),
        resource,
      );
      const placedKey = resourceKey(resource.kind, resource.resource_id);
      showCompletedPlacement(placedKey);
      placementCompleted = true;
      if (operation === 'create') {
        state.resourcePalette = completeResourceCreation(
          state.resourcePalette,
        );
        state.selectedSearchCommandKey = null;
        shouldRefreshSearch = true;
      } else {
        state.resourcePalette = {
          ...state.resourcePalette,
          scrollTop: (
            state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH
            && elements.resourceResults.childElementCount > 0
          )
            ? elements.resourceResults.scrollTop
            : state.resourcePalette.scrollTop,
        };
      }
      renderCanvas();
      selectFirstAvailableSearchCommand();
    } catch (error) {
      if (resource && operation === 'create') {
        const key = resourceKey(resource.kind, resource.resource_id);
        state.resourcePalette = {
          ...state.resourcePalette,
          screen: RESOURCE_PALETTE_SCREENS.SEARCH,
          draft: {
            ...state.resourcePalette.draft,
            selectedKind: null,
          },
          search: {
            ...state.resourcePalette.search,
            status: 'success',
            results: [
              resource,
              ...state.resourcePalette.search.results.filter((item) => (
                resourceKey(item.kind, item.resource_id) !== key
              )),
            ],
            error: null,
          },
          actionError: new Error(
            `Created in ${CARD_TYPE_CONFIG[resource.kind].sourceLabel}, but couldn’t place it on the canvas. Try again.`,
          ),
        };
        state.selectedSearchCommandKey = key;
      } else {
        state.resourcePalette = {
          ...state.resourcePalette,
          actionError: error,
        };
      }
    } finally {
      if (!placementCompleted) {
        state.resourcePlacement = cancelResourcePlacement(
          state.resourcePlacement,
        );
      }
      state.saving = false;
      state.resourceAction = null;
      delete root.dataset.saving;
      syncResourceControls();
      if (shouldRefreshSearch) {
        queueCurrentResourceSearch({ immediate: true });
      } else {
        renderResourceSearch();
      }
    }
  }

  function addResource(resource) {
    if (resourceIsOnCanvas(resource)) return Promise.resolve();
    return placeResource(
      () => Promise.resolve(resource),
      'add',
      resourceKey(resource.kind, resource.resource_id),
    );
  }

  function createResourceAndPlace(kind) {
    const proposal = resourceCreationOptions().find(
      (option) => option.kind === kind,
    );
    if (!proposal?.canCreate) return Promise.resolve();

    return placeResource(async () => {
      const payload = await catalogApi.create({
        kind: proposal.kind,
        title: proposal.title,
        parent: null,
      });
      return payload.resource;
    }, 'create');
  }

  function hideCanvasActionToast() {
    window.clearTimeout(removalTimer);
    removalTimer = null;
    state.pendingRemoval = null;
    elements.canvasActionToast.hidden = true;
  }

  function showCanvasActionToast(message, {
    undoToken = null,
    duration = 4_000,
  } = {}) {
    window.clearTimeout(removalTimer);
    state.pendingRemoval = undoToken ? { undoToken } : null;
    elements.canvasActionMessage.textContent = message;
    elements.canvasActionUndo.hidden = !undoToken;
    elements.canvasActionUndo.disabled = false;
    elements.canvasActionToast.hidden = false;
    removalTimer = window.setTimeout(hideCanvasActionToast, duration);
  }

  async function removeItemFromCanvas(item) {
    if (
      !state.canvas
      || state.saving
      || state.connectionSaving
      || state.connectionEditor
    ) return;

    await layoutUpdates.whenIdle();
    if (!itemById(item.id) || state.saving) return;

    const previousItems = state.canvas.items;
    const previousConnections = state.connections;
    state.saving = true;
    root.dataset.saving = 'true';
    syncResourceControls();
    state.canvas.items = previousItems.filter(({ id }) => id !== item.id);
    state.connections = previousConnections.filter((connection) => (
      connection.sourceItemId !== item.id
      && connection.targetItemId !== item.id
    ));
    renderCanvas();

    try {
      const result = await api.removeItem(item.id);
      state.canvas.revision = result.revision;
      showCanvasActionToast('Removed from canvas', {
        undoToken: result.undo_token,
        duration: result.undo_expires_in * 1_000,
      });
    } catch (error) {
      state.canvas.items = previousItems;
      state.connections = previousConnections;
      renderCanvas();
      showCanvasActionToast(error.message || 'Couldn’t remove from canvas.');
    } finally {
      state.saving = false;
      delete root.dataset.saving;
      syncResourceControls();
    }
  }

  async function undoItemRemoval() {
    const removal = state.pendingRemoval;
    if (!state.canvas || !removal || state.saving) return;

    window.clearTimeout(removalTimer);
    removalTimer = null;
    state.pendingRemoval = null;
    state.saving = true;
    root.dataset.saving = 'true';
    elements.canvasActionUndo.disabled = true;
    syncResourceControls();

    try {
      const result = await api.restoreItem(removal.undoToken);
      state.canvas.revision = result.revision;
      state.canvas.items.push(result.item);
      state.connections.push(
        ...result.connections.map(normalizeConnection),
      );
      elements.canvasActionToast.hidden = true;
      renderCanvas();
    } catch (error) {
      await loadCanvas();
      showCanvasActionToast(error.message || 'Couldn’t restore the card.');
    } finally {
      state.saving = false;
      delete root.dataset.saving;
      elements.canvasActionUndo.disabled = false;
      syncResourceControls();
    }
  }

  async function loadResources() {
    const generation = ++hydrationGeneration;
    const references = [];
    const seen = new Set();
    (state.canvas?.items ?? [])
      .filter((item) => isExternalCardType(item.kind))
      .forEach((item) => {
        const key = resourceKey(item.kind, item.resource_id);
        if (seen.has(key)) return;
        seen.add(key);
        references.push({
          kind: item.kind,
          resource_id: item.resource_id,
        });
      });

    state.resources = new Map();
    if (!references.length) {
      state.resourcesLoading = false;
      return;
    }

    state.resourcesLoading = true;
    renderCanvas();
    try {
      const payload = await catalogApi.resolve(references);
      if (generation !== hydrationGeneration) return;
      state.resources = new Map(
        (payload.results ?? []).map((resource) => [
          resourceKey(resource.kind, resource.resource_id),
          resource,
        ]),
      );
    } catch {
      if (generation !== hydrationGeneration) return;
      state.resources = new Map();
    } finally {
      if (generation === hydrationGeneration) {
        state.resourcesLoading = false;
        renderCanvas();
      }
    }
  }

  function renderCanvas() {
    const items = state.canvas?.items ?? [];
    const authenticated = state.sessionStatus === 'authenticated';
    elements.canvasItems.replaceChildren();
    cardElements.clear();

    if (!authenticated) {
      elements.emptyState.hidden = true;
      return;
    }

    for (const item of items) {
      const isExternalResource = isExternalCardType(item.kind);
      const hydratedResource = state.resources.get(
        resourceKey(item.kind, item.resource_id),
      );
      const demoResource = findDemoResource(item);
      const resource = itemResource(item);
      const editable = Boolean(
        authenticated
        && hydratedResource
        && CARD_TYPE_CONFIG[item.kind]?.editable
      );
      const title = (
        state.resourcesLoading
        && isExternalResource
        && !hydratedResource
        && !demoResource
      ) ? 'Loading…' : resource.title;
      const canOpenAction = Boolean(
        item.kind === CARD_TYPES.ACTION
        && editable
        && hydratedResource
      );
      const position = document.createElement('div');
      position.className = 'canvas-card-position';
      position.dataset.cardType = item.kind;
      position.dataset.itemId = item.id;
      position.style.zIndex = '2';
      position.innerHTML = cardView({
        type: item.kind,
        title,
        canOpen: canOpenAction,
      });
      const connectionButton = position.querySelector('.connection-button');
      const removeButton = position.querySelector('.canvas-card-remove');
      const openButton = position.querySelector('[data-card-open]');
      if (openButton && canOpenAction) {
        openButton.addEventListener('click', (event) => {
          event.stopPropagation();
          openEditor(hydratedResource);
        });
      }
      connectionButton.addEventListener('click', (event) => {
        event.stopPropagation();
        handleConnectionButton(item);
      });
      removeButton.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      });
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void removeItemFromCanvas(item);
      });
      position.addEventListener('pointerdown', (event) => {
        beginDrag(
          event,
          item,
          position,
          editable ? () => openEditor(hydratedResource) : null,
        );
      });
      cardElements.set(item.id, position);
      elements.canvasItems.append(position);
    }
    renderConnectionUi();
    renderCanvasSelectionUi();
    renderScheduler.request({
      allItems: true,
      connections: true,
    });

    elements.emptyState.hidden = items.length > 0 && !state.error && !state.loading;
    elements.emptyAction.hidden = true;
    delete elements.emptyAction.dataset.action;
    if (state.loading) {
      elements.emptyTitle.textContent = 'Opening your Actions canvas';
      elements.emptyCopy.textContent = 'Loading your canvas…';
    } else if (state.error) {
      elements.emptyAction.hidden = false;
      elements.emptyTitle.textContent = 'Couldn’t reach Actions backend';
      elements.emptyCopy.textContent = state.error.message;
      elements.emptyAction.textContent = 'Try again';
      elements.emptyAction.dataset.action = 'retry';
    } else {
      elements.emptyAction.hidden = false;
      elements.emptyTitle.textContent = 'Your Actions canvas is empty';
      elements.emptyCopy.textContent = 'Search for a task or thought to begin.';
      elements.emptyAction.textContent = 'Search resources';
      elements.emptyAction.dataset.action = 'resource';
    }
  }

  async function loadCanvas() {
    if (state.sessionStatus !== 'authenticated') {
      return;
    }
    state.loading = true;
    state.error = null;
    state.connectionEditor = null;
    state.connectionError = null;
    state.canvasSelection = createCanvasSelection();
    canvasSelectionGesture = null;
    renderCanvasSelectionMarquee(null);
    try {
      state.canvas = await api.getCanvas();
      state.connections = (state.canvas.connections ?? []).map(normalizeConnection);
      renderCanvas();
      void loadResources();
    } catch (error) {
      state.error = error;
    } finally {
      state.loading = false;
      renderCanvas();
    }
  }

  elements.resourceSearch.addEventListener('focus', () => {
    if (!state.searchOpen) openResourceSearch();
  });
  elements.resourceSearch.addEventListener('input', scheduleResourceSearch);
  elements.resourceSearchClear.addEventListener('click', () => {
    elements.resourceSearch.value = '';
    syncResourceControls();
    scheduleResourceSearch();
    elements.resourceSearch.focus();
  });
  elements.resourceSearchFilters.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-resource-search-filter]')) {
      event.preventDefault();
    }
  });
  elements.resourceSearchFilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-resource-search-filter]');
    if (!button) return;

    const nextPalette = changeResourceFilter(
      state.resourcePalette,
      button.dataset.resourceSearchFilter,
    );
    if (nextPalette === state.resourcePalette) return;

    state.resourcePalette = nextPalette;
    state.selectedSearchCommandKey = null;
    queueCurrentResourceSearch({ immediate: true });
  });
  elements.resourceCreateStart.addEventListener('pointermove', () => {
    if (state.selectedSearchCommandKey === CREATE_SEARCH_COMMAND_KEY) return;
    state.selectedSearchCommandKey = CREATE_SEARCH_COMMAND_KEY;
    renderResourceSearch();
  });
  elements.resourceCreateStart.addEventListener('click', () => {
    state.selectedSearchCommandKey = CREATE_SEARCH_COMMAND_KEY;
    state.resourcePalette = beginResourceCreation(state.resourcePalette);
    renderResourceSearch();
    window.requestAnimationFrame(() => {
      elements.resourceCreateKindButtons.find((button) => !button.disabled)?.focus();
    });
  });
  elements.resourceCreateBack.addEventListener('click', returnToPreviousResourceScreen);
  elements.resourceCreateKinds.addEventListener('click', (event) => {
    const button = event.target.closest('[data-resource-create-kind]');
    if (!button || button.disabled || state.saving) return;
    const kind = button.dataset.resourceCreateKind;
    state.resourcePalette = chooseResourceKind(
      state.resourcePalette,
      kind,
    );
    renderResourceSearch();
    void createResourceAndPlace(kind).then(() => {
      if (state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH) {
        window.requestAnimationFrame(() => elements.resourceSearch.focus());
      }
    });
  });
  elements.resourceCreateKinds.addEventListener('keydown', (event) => {
    const next = findSpatialNeighbor(
      elements.resourceCreateKindButtons,
      document.activeElement,
      event.key,
    );
    if (!next) return;
    event.preventDefault();
    next.focus();
  });
  elements.resourceSearch.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveResourceSelection(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      activateSelectedSearchCommand();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeResourceSearch();
    }
  });
  elements.emptyAction.addEventListener('click', () => {
    if (elements.emptyAction.dataset.action === 'retry') {
      loadCanvas();
      return;
    }
    openResourceSearch();
  });
  [elements.resourceEditorInput, elements.resourceEditorTextarea].forEach((field) => {
    field.addEventListener('input', () => {
      state.resourceEditor = changeResourceEditorTitle(
        state.resourceEditor,
        field.value,
      );
      elements.resourceEditorSave.disabled = !canSaveResourceEditor(
        state.resourceEditor,
      );
      elements.resourceEditorError.hidden = true;
    });
  });
  elements.resourceEditorInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveResourceEditor();
    }
  });
  elements.resourceEditorTextarea.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void saveResourceEditor();
    }
  });
  elements.resourceEditorSave.addEventListener('click', () => {
    void saveResourceEditor();
  });
  elements.resourceEditorDelete.addEventListener('click', openResourceDeletion);
  elements.resourceEditorClose.addEventListener('click', closeEditor);
  elements.resourceEditorBackdrop.addEventListener('pointerdown', (event) => {
    if (event.target === elements.resourceEditorBackdrop) closeEditor();
  });
  elements.resourceDeleteCancel.addEventListener('click', closeResourceDeletion);
  elements.resourceDeleteConfirm.addEventListener('click', () => {
    void deleteResourcePermanently();
  });
  elements.resourceDeleteBackdrop.addEventListener('pointerdown', (event) => {
    if (event.target === elements.resourceDeleteBackdrop) closeResourceDeletion();
  });

  elements.accountButton.addEventListener('click', () => {
    if (state.sessionStatus !== 'authenticated') {
      return;
    }

    const isOpening = elements.accountMenu.hidden;
    elements.accountMenu.hidden = !isOpening;
    elements.accountButton.setAttribute('aria-expanded', String(isOpening));
  });

  elements.guestSignIn.addEventListener('click', () => {
    if (state.sessionStatus === 'guest') {
      authSession.startLogin();
    }
  });

  elements.switchAccount.addEventListener('click', () => {
    closeAccountMenu();
    authSession.startLogin({ switchAccount: true });
  });

  elements.themePicker.addEventListener('click', (event) => {
    const option = event.target.closest('[data-theme-value]');
    if (option) themeController.setMode(option.dataset.themeValue);
  });

  elements.signOut.addEventListener('click', async () => {
    closeAccountMenu();
    elements.accountButton.disabled = true;
    await authSession.signOut();
    closeResourceSearch();
    window.clearTimeout(searchTimer);
    window.clearTimeout(placementFeedbackTimer);
    placementFeedbackTimer = null;
    searchAbortController?.abort();
    searchAbortController = null;
    state.resourcePalette = createResourcePaletteState();
    state.resourcePlacement = createResourcePlacementState();
    state.selectedSearchCommandKey = null;
    elements.resourceSearch.value = '';
    renderResourceSearch();
    state.canvas = null;
    state.connections = [];
    state.connectionEditor = null;
    state.connectionError = null;
    state.canvasSelection = createCanvasSelection();
    canvasSelectionGesture = null;
    renderCanvasSelectionMarquee(null);
    state.resources = new Map();
    state.resourceEditor = createResourceEditorState();
    state.resourceDeletion = createResourceDeleteState();
    renderResourceEditor();
    renderResourceDeletion();
    hideCanvasActionToast();
    layoutUpdates.clear();
    state.error = null;
    state.user = null;
    state.sessionStatus = 'guest';
    state.loading = false;
    viewportController.reset();
    renderSession();
    renderCanvas();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.topbar__actions')) {
      closeAccountMenu();
    }
    if (!event.target.closest('.composer')) {
      closeResourceSearch();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (state.resourceDeletion.resource && event.key === 'Escape') {
      event.preventDefault();
      closeResourceDeletion();
      return;
    }
    if (state.resourceEditor.resource && event.key === 'Escape') {
      event.preventDefault();
      closeEditor();
      return;
    }
    if (
      (event.metaKey || event.ctrlKey)
      && event.key.toLowerCase() === 'k'
      && !elements.resourceSearch.disabled
    ) {
      event.preventDefault();
      elements.resourceSearch.focus();
      return;
    }
    if (state.connectionEditor && event.key === 'Escape') {
      event.preventDefault();
      cancelConnectionEditor();
      return;
    }
    if (
      state.connectionEditor
      && event.key === 'Enter'
      && !event.target.closest('button, input, textarea, select, a')
    ) {
      event.preventDefault();
      void commitConnectionEditor();
      return;
    }
    const typing = event.target instanceof Element
      && Boolean(event.target.closest('input, textarea, [contenteditable="true"]'));
    if (
      !state.searchOpen
      && state.canvasSelection.selectedIds.size > 0
      && !typing
      && (event.metaKey || event.ctrlKey)
      && event.key.toLowerCase() === 'a'
    ) {
      event.preventDefault();
      state.canvasSelection = setCanvasSelectionIds(
        state.canvasSelection,
        (state.canvas?.items ?? []).map(({ id }) => id),
      );
      renderCanvasSelectionUi();
      return;
    }
    if (
      !state.searchOpen
      && state.canvasSelection.selectedIds.size > 0
      && !typing
      && event.key === 'Escape'
    ) {
      event.preventDefault();
      clearCanvasSelection();
      return;
    }
    if (event.key === 'Escape') {
      if (state.searchOpen) {
        if (state.resourcePalette.screen === RESOURCE_PALETTE_SCREENS.SEARCH) {
          closeResourceSearch();
        } else {
          returnToPreviousResourceScreen();
        }
        return;
      }
      closeAccountMenu();
      elements.accountButton.focus();
    }
  });

  elements.connectionCancel.addEventListener('click', cancelConnectionEditor);
  elements.connectionDone.addEventListener('click', () => {
    void commitConnectionEditor();
  });
  elements.canvasSelectionClear.addEventListener('click', clearCanvasSelection);
  elements.canvasSelectionDone.addEventListener('click', clearCanvasSelection);
  elements.canvasActionUndo.addEventListener('click', () => {
    void undoItemRemoval();
  });
  elements.fitCanvas.addEventListener('click', fitCanvasContent);

  themeController.subscribe(renderAppearance);

  async function initialize() {
    renderSession();
    renderCanvas();
    const session = await authSession.restore();
    state.sessionStatus = session.status;
    state.user = session.user;
    state.error = session.error ?? null;
    state.loading = session.status === 'authenticated';
    viewportController.reset(
      session.status === 'authenticated'
        ? loadCanvasCamera(localStorage, session.user.id)
        : null,
    );
    renderSession();
    renderCanvas();

    if (session.status === 'authenticated') {
      await loadCanvas();
    }
  }

  initialize();
}

