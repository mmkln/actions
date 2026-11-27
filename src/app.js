import { loadCanvasCamera, saveCanvasCamera } from './canvas/camera-store.js';
import { dragPosition } from './canvas/coordinate-space.js';
import { buildRenderableConnections } from './canvas/connection-render-state.js';
import { createConnectionRenderer } from './canvas/connection-renderer.js';
import {
  getOutgoingTargetIds,
  MAX_CONNECTIONS_PER_ITEM,
  normalizeConnection,
} from './canvas/connections.js';
import {
  CANVAS_CARD_HEIGHT,
  CANVAS_CARD_WIDTH,
  CANVAS_INSERTION_GAP,
} from './canvas/geometry.js';
import { syncCanvasGrid } from './canvas/grid-projection.js';
import { createLayoutUpdateQueue } from './canvas/layout-update-queue.js';
import { planCanvasInsertion } from './canvas/placement.js';
import { createCanvasRenderScheduler } from './canvas/render-scheduler.js';
import { createCanvasViewportController } from './canvas/viewport-controller.js';
import {
  findDemoResource,
  resolveResource,
} from './domain/demo-resources.js';
import {
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
  canSubmitResourceDraft,
  changeResourceQuery,
  chooseResourceKind,
  chooseResourceParent,
  createResourcePaletteState,
  failResourceSearch,
  finishResourceSearch,
  returnFromResourceCreation,
  startResourceSearch,
} from './domain/resource-palette-state.js';
import {
  beginResourceEditorSave,
  canSaveResourceEditor,
  changeResourceEditorTitle,
  createResourceEditorState,
  failResourceEditorSave,
  openResourceEditor,
} from './domain/resource-editor-state.js';
import { cardView } from './ui/card.js';
import {
  getConnectionActionState,
  renderConnectionActionButton,
} from './ui/connection-action-button.js';
import { icon } from './ui/icons.js';
import { resourceEditorView } from './ui/resource-editor.js';

function shellView() {
  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="topbar__actions">
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

      <section class="canvas" aria-label="Main canvas" data-canvas>
        <div class="board-viewport" data-canvas-viewport>
          <div class="canvas-world" data-canvas-world>
            <svg class="connection-layer" data-connection-layer aria-hidden="true"></svg>
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

      <div class="canvas-action-toast" role="status" data-canvas-action-toast hidden>
        <span data-canvas-action-message>Removed from canvas</span>
        <button type="button" data-canvas-action-undo>Undo</button>
      </div>

      ${resourceEditorView()}

      <div class="resource-palette-backdrop" data-resource-palette-backdrop hidden></div>
      <div class="composer" role="search" aria-label="Search and add resources" data-composer data-screen="search">
        <section class="resource-search-popover" role="dialog" aria-modal="true" aria-label="Find or create a resource" data-resource-search-popover hidden>
          <div class="resource-palette__screen" data-resource-search-screen>
            <p class="resource-search-popover__status" data-resource-search-status></p>
            <div class="resource-search-popover__results" id="resource-search-results" role="listbox" aria-label="Resources" data-resource-results></div>
            <button class="resource-palette__create-entry" type="button" data-resource-create-start hidden>
              <span class="resource-palette__create-entry-icon" aria-hidden="true">${icon('plus')}</span>
              <span>
                <strong data-resource-create-start-title></strong>
                <small>Choose Task, Thought, or a Skopos item</small>
              </span>
              <span class="resource-palette__chevron" aria-hidden="true">›</span>
            </button>
          </div>

          <div class="resource-palette__screen" data-resource-type-screen hidden>
            <header class="resource-palette__header">
              <button type="button" aria-label="Back to search" data-resource-create-back>${icon('arrow-left')}</button>
              <div>
                <h2 data-resource-create-heading></h2>
                <p>What are you creating?</p>
              </div>
              <kbd>Esc</kbd>
            </header>
            <div class="resource-palette__kind-list" data-resource-create-kinds>
              <p>ACTIONS</p>
              <button type="button" data-resource-create-kind="task">
                <span class="resource-search-popover__result-icon is-task">${icon('check')}</span>
                <span><strong>Task</strong><small>Majom · Standalone action</small></span><b>›</b>
              </button>
              <button type="button" data-resource-create-kind="thought">
                <span class="resource-search-popover__result-icon is-thought">${icon('spark')}</span>
                <span><strong>Thought</strong><small>Flying Thoughts · Standalone insight</small></span><b>›</b>
              </button>
              <p>SKOPOS STRUCTURE</p>
              <button type="button" data-resource-create-kind="achievement">
                <span class="resource-search-popover__result-icon is-achievement">${icon('achievement')}</span>
                <span><strong>Achievement</strong><small>Top-level outcome</small></span><b>›</b>
              </button>
              <button type="button" data-resource-create-kind="requirement">
                <span class="resource-search-popover__result-icon is-requirement">${icon('requirement')}</span>
                <span><strong>Requirement</strong><small>Belongs to an Achievement</small></span><b>›</b>
              </button>
              <button type="button" data-resource-create-kind="gap">
                <span class="resource-search-popover__result-icon is-gap">${icon('gap')}</span>
                <span><strong>Gap</strong><small>Belongs to a Requirement</small></span><b>›</b>
              </button>
            </div>
          </div>

          <div class="resource-palette__screen" data-resource-configure-screen hidden>
            <header class="resource-palette__header">
              <button type="button" aria-label="Back to resource types" data-resource-configure-back>${icon('arrow-left')}</button>
              <div>
                <h2 data-resource-configure-heading></h2>
                <p data-resource-configure-subtitle></p>
              </div>
              <kbd>Esc</kbd>
            </header>
            <div class="resource-palette__draft">
              <label>TITLE</label>
              <div class="resource-palette__title" data-resource-configure-title></div>
              <section data-resource-parent-section hidden>
                <label data-resource-parent-label></label>
                <div class="resource-palette__parent-search">
                  ${icon('search')}
                  <input type="search" autocomplete="off" data-resource-parent-search>
                </div>
                <p class="resource-palette__parent-status" data-resource-parent-status></p>
                <div class="resource-palette__parent-results" role="listbox" data-resource-parent-results></div>
              </section>
              <p class="resource-create-panel__note" data-resource-create-note hidden></p>
            </div>
            <footer class="resource-palette__footer">
              <span><kbd>Esc</kbd> Back</span>
              <button class="resource-create-panel__action" type="button" data-resource-create-action>Create &amp; Place</button>
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
  root.innerHTML = shellView();

  const elements = {
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
    canvasViewport: root.querySelector('[data-canvas-viewport]'),
    canvasWorld: root.querySelector('[data-canvas-world]'),
    connectionLayer: root.querySelector('[data-connection-layer]'),
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
    resourceTypeScreen: root.querySelector('[data-resource-type-screen]'),
    resourceConfigureScreen: root.querySelector('[data-resource-configure-screen]'),
    resourceSearch: root.querySelector('[data-resource-search]'),
    resourceSearchShortcut: root.querySelector('[data-resource-search-shortcut]'),
    resourceSearchShortcutModifier: root.querySelector('[data-resource-search-shortcut-modifier]'),
    resourceSearchClear: root.querySelector('[data-resource-search-clear]'),
    resourceSearchStatus: root.querySelector('[data-resource-search-status]'),
    resourceResults: root.querySelector('[data-resource-results]'),
    resourceCreateStart: root.querySelector('[data-resource-create-start]'),
    resourceCreateStartTitle: root.querySelector('[data-resource-create-start-title]'),
    resourceCreateHeading: root.querySelector('[data-resource-create-heading]'),
    resourceCreateBack: root.querySelector('[data-resource-create-back]'),
    resourceCreateKinds: root.querySelector('[data-resource-create-kinds]'),
    resourceCreateKindButtons: [...root.querySelectorAll('[data-resource-create-kind]')],
    resourceConfigureBack: root.querySelector('[data-resource-configure-back]'),
    resourceConfigureHeading: root.querySelector('[data-resource-configure-heading]'),
    resourceConfigureSubtitle: root.querySelector('[data-resource-configure-subtitle]'),
    resourceConfigureTitle: root.querySelector('[data-resource-configure-title]'),
    resourceParentSection: root.querySelector('[data-resource-parent-section]'),
    resourceParentLabel: root.querySelector('[data-resource-parent-label]'),
    resourceParentSearch: root.querySelector('[data-resource-parent-search]'),
    resourceParentStatus: root.querySelector('[data-resource-parent-status]'),
    resourceParentResults: root.querySelector('[data-resource-parent-results]'),
    resourceCreateAction: root.querySelector('[data-resource-create-action]'),
    resourceCreateNote: root.querySelector('[data-resource-create-note]'),
    connectionToolbar: root.querySelector('[data-connection-toolbar]'),
    connectionCancel: root.querySelector('[data-connection-cancel]'),
    connectionCount: root.querySelector('[data-connection-count]'),
    connectionDone: root.querySelector('[data-connection-done]'),
    canvasActionToast: root.querySelector('[data-canvas-action-toast]'),
    canvasActionMessage: root.querySelector('[data-canvas-action-message]'),
    canvasActionUndo: root.querySelector('[data-canvas-action-undo]'),
    resourceEditorBackdrop: root.querySelector('[data-resource-editor-backdrop]'),
    resourceEditorHeading: root.querySelector('[data-resource-editor-heading]'),
    resourceEditorClose: root.querySelector('[data-resource-editor-close]'),
    resourceEditorInput: root.querySelector('[data-resource-editor-input]'),
    resourceEditorTextarea: root.querySelector('[data-resource-editor-textarea]'),
    resourceEditorError: root.querySelector('[data-resource-editor-error]'),
    resourceEditorSave: root.querySelector('[data-resource-editor-save]'),
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
    selectedResourceKey: null,
    searchOpen: false,
    resourcePalette: createResourcePaletteState(),
    resourceAction: null,
    connections: [],
    connectionEditor: null,
    connectionSaving: false,
    connectionError: null,
    pendingRemoval: null,
    resourceEditor: createResourceEditorState(),
  };

  const cardElements = new Map();
  let viewportController = null;
  let searchTimer = null;
  let searchAbortController = null;
  let parentSearchTimer = null;
  let parentSearchGeneration = 0;
  let hydrationGeneration = 0;
  let removalTimer = null;

  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';
  elements.resourceSearchShortcutModifier.textContent = (
    /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘' : 'Ctrl'
  );

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
    elements.resourceEditorBackdrop.hidden = !resource;
    if (!resource) return;

    const config = CARD_TYPE_CONFIG[resource.kind];
    elements.resourceEditorHeading.textContent = `Edit ${config.label}`;
    elements.resourceEditorInput.hidden = config.multiline;
    elements.resourceEditorTextarea.hidden = !config.multiline;

    const field = resourceEditorField(resource);
    field.maxLength = config.maximumTitleLength;
    field.value = editor.draftTitle;
    field.disabled = editor.saving;
    elements.resourceEditorClose.disabled = editor.saving;
    elements.resourceEditorSave.disabled = !canSaveResourceEditor(editor);
    elements.resourceEditorSave.textContent = editor.saving ? 'Saving…' : 'Save';
    elements.resourceEditorError.hidden = !editor.error;
    elements.resourceEditorError.textContent = editor.error?.message ?? '';
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

  function canvasContentBounds() {
    const items = state.canvas?.items ?? [];
    if (!items.length) return null;

    const boxes = items.map((item) => {
      const card = cardElements.get(item.id)?.querySelector('.canvas-card');
      return {
        x: item.x,
        y: item.y,
        width: card?.offsetWidth || CANVAS_CARD_WIDTH,
        height: card?.offsetHeight || CANVAS_CARD_HEIGHT,
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
      return {
        x: item.x,
        y: item.y,
        width: card.offsetWidth || CANVAS_CARD_WIDTH,
        height: card.offsetHeight || CANVAS_CARD_HEIGHT,
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
    elements.resourceSearch.disabled = disabled;
    elements.resourceSearchClear.hidden = !elements.resourceSearch.value;
    elements.resourceSearchShortcut.hidden = Boolean(elements.resourceSearch.value);
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
    const obstacles = (state.canvas?.items ?? []).map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        width: CANVAS_CARD_WIDTH,
        height: CANVAS_CARD_HEIGHT,
      }));
    const desired = viewportController.clientToWorld({
      x: bounds.left + (bounds.width / 2) - (CANVAS_CARD_WIDTH / 2),
      y: bounds.top + (bounds.height / 2) - (CANVAS_CARD_HEIGHT / 2),
    });
    const insertion = planCanvasInsertion({
      candidate: {
        id: resourceKey(resource.kind, resource.resource_id),
        ...desired,
        width: CANVAS_CARD_WIDTH,
        height: CANVAS_CARD_HEIGHT,
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
    const authenticated = state.sessionStatus === 'authenticated';
    const checking = state.sessionStatus === 'checking';
    const email = state.user?.email ?? '';

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

  function beginDrag(event, item, position) {
    if (
      event.button !== 0
      || state.saving
      || state.connectionEditor
      || state.resourceEditor.resource
    ) return;
    if (event.target.closest('button, input, textarea, select, a')) return;

    event.preventDefault();
    const pointerStart = { x: event.clientX, y: event.clientY };
    const itemStart = { x: item.x, y: item.y };
    const pointerWorld = viewportController.clientToWorld(pointerStart);
    const offset = {
      x: pointerWorld.x - item.x,
      y: pointerWorld.y - item.y,
    };
    let nextPosition = { ...itemStart };
    let dragging = false;

    position.setPointerCapture(event.pointerId);

    function onPointerMove(moveEvent) {
      if (moveEvent.pointerId !== event.pointerId) return;
      if (!dragging) {
        const distance = Math.hypot(
          moveEvent.clientX - pointerStart.x,
          moveEvent.clientY - pointerStart.y,
        );
        if (distance < 6) return;
        dragging = true;
        bringCardToFront(position);
        position.classList.add('is-dragging');
      }

      nextPosition = dragPosition(
        viewportController.clientToWorld({
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        }),
        offset,
      );
      item.x = nextPosition.x;
      item.y = nextPosition.y;
      renderScheduler.request({
        items: [item.id],
        connections: true,
      });
    }

    function finishDrag(finishEvent) {
      if (finishEvent.pointerId !== event.pointerId) return;
      position.removeEventListener('pointermove', onPointerMove);
      position.removeEventListener('pointerup', finishDrag);
      position.removeEventListener('pointercancel', cancelDrag);
      position.classList.remove('is-dragging');

      if (!dragging) return;

      item.x = Math.round(nextPosition.x);
      item.y = Math.round(nextPosition.y);
      renderScheduler.request({
        items: [item.id],
        connections: true,
      });
      layoutUpdates.enqueue({
        itemId: item.id,
        x: item.x,
        y: item.y,
      });
    }

    function cancelDrag(cancelEvent) {
      if (cancelEvent.pointerId !== event.pointerId) return;
      item.x = itemStart.x;
      item.y = itemStart.y;
      position.removeEventListener('pointermove', onPointerMove);
      position.removeEventListener('pointerup', finishDrag);
      position.removeEventListener('pointercancel', cancelDrag);
      position.classList.remove('is-dragging');
      renderScheduler.request({
        items: [item.id],
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

  function selectFirstAvailableResource() {
    const results = state.resourcePalette.search.results;
    const selectedIsAvailable = results.some(
      (resource) => (
        resourceKey(resource.kind, resource.resource_id)
          === state.selectedResourceKey
        && !resourceIsOnCanvas(resource)
      ),
    );
    if (!selectedIsAvailable) {
      const firstAvailable = results.find(
        (resource) => !resourceIsOnCanvas(resource),
      );
      state.selectedResourceKey = firstAvailable
        ? resourceKey(firstAvailable.kind, firstAvailable.resource_id)
        : null;
    }
  }

  function createResourceResult(resource) {
    const key = resourceKey(resource.kind, resource.resource_id);
    const added = resourceIsOnCanvas(resource);
    const selected = key === state.selectedResourceKey;
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
    button.disabled = added || state.saving;

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
    if (added) {
      action.textContent = '✓ On canvas';
    } else {
      action.textContent = 'Place';
    }

    button.append(resourceIcon, copy, action);
    button.addEventListener('pointermove', () => {
      if (added || state.selectedResourceKey === key) return;
      state.selectedResourceKey = key;
      renderResourceSearch();
    });
    button.addEventListener('click', () => {
      state.selectedResourceKey = key;
      void addResource(resource);
    });
    return button;
  }

  function resourceCreationOptions() {
    return getResourceCreationOptions({
      title: state.resourcePalette.draft.title,
    });
  }

  function selectedResourceCreationOption() {
    return resourceCreationOptions().find(
      ({ kind }) => kind === state.resourcePalette.draft.selectedKind,
    ) ?? null;
  }

  function renderResourceCreation() {
    const palette = state.resourcePalette;
    const options = resourceCreationOptions();
    const query = palette.draft.title.trim();
    const proposal = selectedResourceCreationOption();
    const hasCreatableType = options.some(({ canCreate }) => canCreate);

    elements.composer.dataset.screen = palette.screen;
    elements.resourceSearchScreen.hidden = (
      palette.screen !== RESOURCE_PALETTE_SCREENS.SEARCH
    );
    elements.resourceTypeScreen.hidden = (
      palette.screen !== RESOURCE_PALETTE_SCREENS.CHOOSE_TYPE
    );
    elements.resourceConfigureScreen.hidden = (
      palette.screen !== RESOURCE_PALETTE_SCREENS.CONFIGURE
    );

    elements.resourceCreateStart.hidden = !(
      palette.screen === RESOURCE_PALETTE_SCREENS.SEARCH
      && query
      && hasCreatableType
    );
    elements.resourceCreateStartTitle.textContent = `Create “${query}”…`;
    elements.resourceCreateHeading.textContent = `Create “${query}”`;

    elements.resourceCreateKindButtons.forEach((button) => {
      const option = options.find(({ kind }) => kind === button.dataset.resourceCreateKind);
      button.disabled = !option || !option.canCreate;
      button.title = option?.tooLong
        ? `Maximum ${option.maximumLength} characters.`
        : '';
    });

    if (palette.screen !== RESOURCE_PALETTE_SCREENS.CONFIGURE || !proposal) return;

    const proposalConfig = CARD_TYPE_CONFIG[proposal.kind];
    const parentConfig = proposalConfig.parentKind
      ? CARD_TYPE_CONFIG[proposalConfig.parentKind]
      : null;
    elements.resourceConfigureHeading.textContent = `New ${proposalConfig.label}`;
    elements.resourceConfigureSubtitle.textContent = proposalConfig.sourceLabel;
    elements.resourceConfigureTitle.textContent = proposal.title;
    elements.resourceParentSection.hidden = !parentConfig;

    if (parentConfig) {
      elements.resourceParentLabel.textContent = 'BELONGS TO';
      elements.resourceParentSearch.placeholder = `Search ${parentConfig.pluralLabel.toLowerCase()}…`;
      elements.resourceParentSearch.value = palette.parentQuery;
      elements.resourceParentStatus.textContent = palette.parentLoading
        ? 'Searching…'
        : palette.parentError?.message
          ?? (!palette.parentResults.length ? `No ${parentConfig.pluralLabel.toLowerCase()} found.` : '');
      elements.resourceParentResults.replaceChildren(
        ...palette.parentResults.map((resource) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'resource-palette__parent-result';
          const selected = (
            palette.draft.selectedParent?.kind === resource.kind
            && palette.draft.selectedParent?.resource_id === resource.resource_id
          );
          button.classList.toggle('is-selected', selected);
          button.setAttribute('role', 'option');
          button.setAttribute('aria-selected', String(selected));
          button.innerHTML = `
            <span class="resource-search-popover__result-icon is-${resource.kind}">${icon(parentConfig.icon)}</span>
            <span><strong></strong><small>${parentConfig.label} · Skopos</small></span>
            <b>${selected ? '✓' : ''}</b>
          `;
          button.querySelector('strong').textContent = resource.title;
          button.addEventListener('click', () => {
            state.resourcePalette = chooseResourceParent(
              state.resourcePalette,
              resource,
            );
            renderResourceSearch();
          });
          return button;
        }),
      );
    } else {
      elements.resourceParentStatus.textContent = '';
      elements.resourceParentResults.replaceChildren();
    }

    elements.resourceCreateAction.disabled = (
      state.saving
      || !proposal.canCreate
      || !canSubmitResourceDraft(palette, CARD_TYPE_CONFIG)
    );
    elements.resourceCreateAction.textContent = (
      state.resourceAction === 'create' ? 'Creating…' : 'Create & Place'
    );
    let note = palette.actionError?.message ?? '';
    if (!note && proposal.tooLong) {
      note = `${proposalConfig.pluralLabel} can contain up to ${proposal.maximumLength} characters.`;
    }
    elements.resourceCreateNote.textContent = note;
    elements.resourceCreateNote.hidden = !note;
  }

  function renderResourceSearch() {
    elements.resourceResults.replaceChildren();
    elements.resourceSearchPopover.hidden = !state.searchOpen;
    elements.resourcePaletteBackdrop.hidden = !state.searchOpen;
    elements.composer.classList.toggle('is-open', state.searchOpen);
    elements.resourceSearch.setAttribute(
      'aria-expanded',
      String(state.searchOpen),
    );
    syncResourceControls();

    if (!state.searchOpen) {
      elements.composer.dataset.screen = RESOURCE_PALETTE_SCREENS.SEARCH;
      return;
    }

    renderResourceCreation();
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
      selectFirstAvailableResource();
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
    }
    syncResourceControls();
  }

  async function searchResourceParents() {
    const parentKind = CARD_TYPE_CONFIG[
      state.resourcePalette.draft.selectedKind
    ]?.parentKind;
    if (!parentKind) return;

    const generation = ++parentSearchGeneration;
    state.resourcePalette = {
      ...state.resourcePalette,
      parentLoading: true,
      parentError: null,
    };
    renderResourceSearch();
    try {
      const payload = await catalogApi.search({
        query: state.resourcePalette.parentQuery.trim(),
        kinds: [parentKind],
      });
      if (generation !== parentSearchGeneration) return;
      state.resourcePalette = {
        ...state.resourcePalette,
        parentResults: payload.results ?? [],
        parentError: null,
      };
    } catch (error) {
      if (generation !== parentSearchGeneration) return;
      state.resourcePalette = {
        ...state.resourcePalette,
        parentResults: [],
        parentError: error,
      };
    } finally {
      if (generation === parentSearchGeneration) {
        state.resourcePalette = {
          ...state.resourcePalette,
          parentLoading: false,
        };
        renderResourceSearch();
      }
    }
  }

  function scheduleParentSearch() {
    window.clearTimeout(parentSearchTimer);
    state.resourcePalette = {
      ...state.resourcePalette,
      parentQuery: elements.resourceParentSearch.value,
      draft: {
        ...state.resourcePalette.draft,
        selectedParent: null,
      },
    };
    renderResourceSearch();
    parentSearchTimer = window.setTimeout(searchResourceParents, 180);
  }

  async function searchResources({ requestId, query, signal }) {
    if (state.resourcePalette.search.requestId !== requestId) return;
    state.resourcePalette = startResourceSearch(
      state.resourcePalette,
      requestId,
    );
    renderResourceSearch();
    try {
      const payload = await catalogApi.search({
        query,
        signal,
      });
      if (state.resourcePalette.search.requestId !== requestId) return;
      state.resourcePalette = finishResourceSearch(
        state.resourcePalette,
        requestId,
        payload,
      );
      selectFirstAvailableResource();
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

  function scheduleResourceSearch({ immediate = false } = {}) {
    window.clearTimeout(searchTimer);
    searchAbortController?.abort();
    state.searchOpen = true;
    state.selectedResourceKey = null;
    state.resourcePalette = changeResourceQuery(
      state.resourcePalette,
      elements.resourceSearch.value,
    );
    const requestId = state.resourcePalette.search.requestId;
    const query = state.resourcePalette.draft.title.trim();
    const controller = new AbortController();
    searchAbortController = controller;
    renderResourceSearch();
    const run = () => searchResources({
      requestId,
      query,
      signal: controller.signal,
    });
    if (immediate) {
      void run();
      return;
    }
    searchTimer = window.setTimeout(() => void run(), 180);
  }

  function openResourceSearch() {
    if (state.sessionStatus !== 'authenticated') return;
    closeAccountMenu();
    state.resourcePalette = createResourcePaletteState();
    state.searchOpen = true;
    scheduleResourceSearch({ immediate: true });
    window.requestAnimationFrame(() => elements.resourceSearch.focus());
  }

  function closeResourceSearch() {
    state.searchOpen = false;
    parentSearchGeneration += 1;
    window.clearTimeout(searchTimer);
    window.clearTimeout(parentSearchTimer);
    searchAbortController?.abort();
    searchAbortController = null;
    state.resourcePalette = createResourcePaletteState();
    renderResourceSearch();
  }

  function moveResourceSelection(direction) {
    const available = state.resourcePalette.search.results.filter(
      (resource) => !resourceIsOnCanvas(resource),
    );
    if (!available.length) return;
    const currentIndex = available.findIndex(
      (resource) => (
        resourceKey(resource.kind, resource.resource_id)
          === state.selectedResourceKey
      ),
    );
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + available.length) % available.length;
    state.selectedResourceKey = resourceKey(
      available[nextIndex].kind,
      available[nextIndex].resource_id,
    );
    renderResourceSearch();
  }

  function selectedResource() {
    return state.resourcePalette.search.results.find(
      (resource) => (
        resourceKey(resource.kind, resource.resource_id)
          === state.selectedResourceKey
      ),
    ) ?? null;
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

  async function placeResource(resolveNextResource, operation) {
    if (state.saving) return;

    state.saving = true;
    state.resourceAction = operation;
    state.resourcePalette = {
      ...state.resourcePalette,
      actionError: null,
    };
    root.dataset.saving = 'true';
    syncResourceControls();
    renderResourceSearch();
    let resource = null;
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
      renderCanvas();
      elements.resourceSearch.value = '';
      state.selectedResourceKey = null;
      closeResourceSearch();
    } catch (error) {
      if (resource && operation === 'create') {
        const key = resourceKey(resource.kind, resource.resource_id);
        state.resourcePalette = {
          ...state.resourcePalette,
          screen: RESOURCE_PALETTE_SCREENS.SEARCH,
          draft: {
            ...state.resourcePalette.draft,
            selectedKind: null,
            selectedParent: null,
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
            `Created in ${resource.source === 'majom' ? 'Majom' : 'Flying Thoughts'}, but couldn’t place it on the canvas. Try again.`,
          ),
        };
        state.selectedResourceKey = key;
      } else {
        state.resourcePalette = {
          ...state.resourcePalette,
          actionError: error,
        };
      }
    } finally {
      state.saving = false;
      state.resourceAction = null;
      delete root.dataset.saving;
      syncResourceControls();
      renderResourceSearch();
    }
  }

  function addResource(resource) {
    if (resourceIsOnCanvas(resource)) return Promise.resolve();
    return placeResource(() => Promise.resolve(resource), 'add');
  }

  function createResourceAndPlace() {
    const proposal = selectedResourceCreationOption();
    if (
      !proposal?.canCreate
      || !canSubmitResourceDraft(state.resourcePalette, CARD_TYPE_CONFIG)
    ) return Promise.resolve();

    const parentResource = state.resourcePalette.draft.selectedParent;
    const parent = parentResource
      ? {
          kind: parentResource.kind,
          resource_id: parentResource.resource_id,
        }
      : null;
    return placeResource(async () => {
      const payload = await catalogApi.create({
        kind: proposal.kind,
        title: proposal.title,
        parent,
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
    const checking = state.sessionStatus === 'checking';
    elements.canvasItems.replaceChildren();
    cardElements.clear();

    for (const item of items) {
      const isExternalResource = isExternalCardType(item.kind);
      const hydratedResource = state.resources.get(
        resourceKey(item.kind, item.resource_id),
      );
      const demoResource = findDemoResource(item);
      const resource = hydratedResource ?? demoResource ?? resolveResource(item);
      const title = (
        state.resourcesLoading
        && isExternalResource
        && !hydratedResource
        && !demoResource
      ) ? 'Loading…' : resource.title;
      const position = document.createElement('div');
      position.className = 'canvas-card-position';
      position.dataset.itemId = item.id;
      position.style.zIndex = '2';
      position.innerHTML = cardView({
        type: item.kind,
        title,
        editable: Boolean(
          authenticated
          && hydratedResource
          && CARD_TYPE_CONFIG[item.kind]?.editable
        ),
      });
      const connectionButton = position.querySelector('.connection-button');
      const editButton = position.querySelector('.canvas-card-edit');
      const removeButton = position.querySelector('.canvas-card-remove');
      connectionButton.addEventListener('click', (event) => {
        event.stopPropagation();
        handleConnectionButton(item);
      });
      editButton?.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      });
      editButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        openEditor(hydratedResource);
      });
      removeButton.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      });
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void removeItemFromCanvas(item);
      });
      position.addEventListener('pointerdown', (event) => {
        beginDrag(event, item, position);
      });
      cardElements.set(item.id, position);
      elements.canvasItems.append(position);
    }
    renderConnectionUi();
    renderScheduler.request({
      allItems: true,
      connections: true,
    });

    elements.emptyState.hidden = items.length > 0 && !state.error;
    elements.emptyAction.hidden = true;
    delete elements.emptyAction.dataset.action;
    if (checking) {
      elements.emptyTitle.textContent = 'Opening your Actions canvas';
      elements.emptyCopy.textContent = 'Checking your Majom ID session…';
    } else if (!authenticated) {
      elements.emptyTitle.textContent = 'Sign in to open Actions';
      elements.emptyCopy.textContent = state.error?.message
        ?? 'Your canvas and its layout are tied to your Majom ID.';
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
  elements.resourceCreateStart.addEventListener('click', () => {
    state.resourcePalette = beginResourceCreation(state.resourcePalette);
    renderResourceSearch();
    window.requestAnimationFrame(() => {
      elements.resourceCreateKindButtons.find((button) => !button.disabled)?.focus();
    });
  });
  elements.resourceCreateBack.addEventListener('click', returnToPreviousResourceScreen);
  elements.resourceConfigureBack.addEventListener('click', returnToPreviousResourceScreen);
  elements.resourceCreateKinds.addEventListener('click', (event) => {
    const button = event.target.closest('[data-resource-create-kind]');
    if (!button || button.disabled) return;
    state.resourcePalette = chooseResourceKind(
      state.resourcePalette,
      button.dataset.resourceCreateKind,
    );
    renderResourceSearch();
    const parentKind = CARD_TYPE_CONFIG[
      state.resourcePalette.draft.selectedKind
    ].parentKind;
    if (parentKind) {
      void searchResourceParents();
      window.requestAnimationFrame(() => elements.resourceParentSearch.focus());
    } else {
      window.requestAnimationFrame(() => elements.resourceCreateAction.focus());
    }
  });
  elements.resourceParentSearch.addEventListener('input', scheduleParentSearch);
  elements.resourceCreateAction.addEventListener('click', () => {
    void createResourceAndPlace();
  });
  elements.resourceSearch.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveResourceSelection(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const resource = selectedResource();
      if (resource) void addResource(resource);
      else if (!elements.resourceCreateStart.hidden) {
        elements.resourceCreateStart.click();
      }
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
  elements.resourceEditorClose.addEventListener('click', closeEditor);
  elements.resourceEditorBackdrop.addEventListener('pointerdown', (event) => {
    if (event.target === elements.resourceEditorBackdrop) closeEditor();
  });

  elements.accountButton.addEventListener('click', () => {
    if (state.sessionStatus !== 'authenticated') {
      authSession.startLogin();
      return;
    }

    const isOpening = elements.accountMenu.hidden;
    elements.accountMenu.hidden = !isOpening;
    elements.accountButton.setAttribute('aria-expanded', String(isOpening));
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
    state.canvas = null;
    state.connections = [];
    state.connectionEditor = null;
    state.connectionError = null;
    state.resources = new Map();
    state.resourceEditor = createResourceEditorState();
    renderResourceEditor();
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

