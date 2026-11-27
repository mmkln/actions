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
  getResourceCreationOptions,
} from './domain/resource-creation.js';
import { cardView } from './ui/card.js';
import {
  getConnectionActionState,
  renderConnectionActionButton,
} from './ui/connection-action-button.js';
import { icon } from './ui/icons.js';

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

      <div class="composer" role="search" aria-label="Search and add resources">
        <div class="resource-search-popover" data-resource-search-popover hidden>
          <p class="resource-search-popover__status" data-resource-search-status></p>
          <div class="resource-search-popover__results" id="resource-search-results" role="listbox" aria-label="Tasks and thoughts" data-resource-results></div>
          <section class="resource-create-panel" data-resource-create hidden>
            <div class="resource-create-panel__main">
              <span class="resource-create-panel__icon" data-resource-create-icon aria-hidden="true"></span>
              <span class="resource-create-panel__copy">
                <small data-resource-create-label>New task</small>
                <strong data-resource-create-title></strong>
              </span>
            </div>
            <div class="resource-create-panel__footer">
              <div class="resource-create-kind" role="group" aria-label="New resource type" data-resource-create-kinds>
                <button type="button" data-resource-create-kind="task" aria-pressed="true">
                  ${icon('check')}<span>Task</span>
                </button>
                <button type="button" data-resource-create-kind="thought" aria-pressed="false">
                  ${icon('spark')}<span>Thought</span>
                </button>
              </div>
              <button class="resource-create-panel__action" type="button" data-resource-create-action>Create &amp; Place</button>
            </div>
            <p class="resource-create-panel__note" data-resource-create-note hidden></p>
          </section>
        </div>
        <div class="composer__search-icon" aria-hidden="true">${icon('search')}</div>
        <input class="composer__search" type="search" placeholder="Search resources…" autocomplete="off" aria-label="Search resources" aria-keyshortcuts="Control+K Meta+K" aria-controls="resource-search-results" aria-expanded="false" data-resource-search disabled>
        <kbd class="composer__shortcut" aria-hidden="true" data-resource-search-shortcut>
          <span data-resource-search-shortcut-modifier></span>
          <span>K</span>
        </kbd>
        <button class="composer__clear" type="button" aria-label="Clear resource search" data-resource-search-clear hidden>${icon('close')}</button>
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
    resourceSearchPopover: root.querySelector('[data-resource-search-popover]'),
    resourceSearch: root.querySelector('[data-resource-search]'),
    resourceSearchShortcut: root.querySelector('[data-resource-search-shortcut]'),
    resourceSearchShortcutModifier: root.querySelector('[data-resource-search-shortcut-modifier]'),
    resourceSearchClear: root.querySelector('[data-resource-search-clear]'),
    resourceSearchStatus: root.querySelector('[data-resource-search-status]'),
    resourceResults: root.querySelector('[data-resource-results]'),
    resourceCreate: root.querySelector('[data-resource-create]'),
    resourceCreateIcon: root.querySelector('[data-resource-create-icon]'),
    resourceCreateLabel: root.querySelector('[data-resource-create-label]'),
    resourceCreateTitle: root.querySelector('[data-resource-create-title]'),
    resourceCreateKinds: root.querySelector('[data-resource-create-kinds]'),
    resourceCreateKindButtons: [...root.querySelectorAll('[data-resource-create-kind]')],
    resourceCreateAction: root.querySelector('[data-resource-create-action]'),
    resourceCreateNote: root.querySelector('[data-resource-create-note]'),
    connectionToolbar: root.querySelector('[data-connection-toolbar]'),
    connectionCancel: root.querySelector('[data-connection-cancel]'),
    connectionCount: root.querySelector('[data-connection-count]'),
    connectionDone: root.querySelector('[data-connection-done]'),
    canvasActionToast: root.querySelector('[data-canvas-action-toast]'),
    canvasActionMessage: root.querySelector('[data-canvas-action-message]'),
    canvasActionUndo: root.querySelector('[data-canvas-action-undo]'),
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
    searchResults: [],
    searchLoading: false,
    searchError: null,
    unavailableSources: [],
    selectedResourceKey: null,
    searchOpen: false,
    resourceCreateKind: 'task',
    resourceAction: null,
    connections: [],
    connectionEditor: null,
    connectionSaving: false,
    connectionError: null,
    pendingRemoval: null,
  };

  const cardElements = new Map();
  let viewportController = null;
  let searchTimer = null;
  let searchGeneration = 0;
  let hydrationGeneration = 0;
  let removalTimer = null;

  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';
  elements.resourceSearchShortcutModifier.textContent = (
    /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘' : 'Ctrl'
  );

  function resourceKey(kind, resourceId) {
    return `${kind}:${resourceId}`;
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
    if (event.button !== 0 || state.saving || state.connectionEditor) return;
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
    const selectedIsAvailable = state.searchResults.some(
      (resource) => (
        resourceKey(resource.kind, resource.resource_id)
          === state.selectedResourceKey
        && !resourceIsOnCanvas(resource)
      ),
    );
    if (!selectedIsAvailable) {
      const firstAvailable = state.searchResults.find(
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
    resourceIcon.innerHTML = icon(resource.kind === 'task' ? 'check' : 'spark');

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
      action.innerHTML = icon('plus');
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
      query: elements.resourceSearch.value,
      results: state.searchResults,
      unavailableSources: state.unavailableSources,
    });
  }

  function reconcileResourceCreateKind(options = resourceCreationOptions()) {
    const selected = options.find(({ kind }) => kind === state.resourceCreateKind);
    if (selected?.canCreate) return;
    const fallback = options.find(({ canCreate }) => canCreate)
      ?? options.find(({ duplicate }) => !duplicate);
    if (fallback) state.resourceCreateKind = fallback.kind;
  }

  function selectedResourceCreationOption() {
    return resourceCreationOptions().find(
      ({ kind }) => kind === state.resourceCreateKind,
    ) ?? null;
  }

  function renderResourceCreation() {
    const options = resourceCreationOptions();
    reconcileResourceCreateKind(options);
    const proposal = options.find(
      ({ kind }) => kind === state.resourceCreateKind,
    );
    const hasCreatableType = options.some(({ duplicate }) => !duplicate);
    const visible = (
      state.searchOpen
      && !state.searchLoading
      && !state.searchError
      && Boolean(proposal)
      && hasCreatableType
    );
    elements.resourceCreate.hidden = !visible;
    if (!visible) return;

    const isTask = proposal.kind === 'task';
    elements.resourceCreate.dataset.kind = proposal.kind;
    elements.resourceCreateIcon.className = (
      `resource-create-panel__icon is-${proposal.kind}`
    );
    elements.resourceCreateIcon.innerHTML = icon(isTask ? 'check' : 'spark');
    elements.resourceCreateLabel.textContent = isTask ? 'New task' : 'New thought';
    elements.resourceCreateTitle.textContent = proposal.title;
    elements.resourceCreateAction.disabled = state.saving || !proposal.canCreate;
    elements.resourceCreateAction.textContent = (
      state.resourceAction === 'create' ? 'Creating…' : 'Create & Place'
    );

    elements.resourceCreateKindButtons.forEach((button) => {
      const option = options.find(({ kind }) => kind === button.dataset.resourceCreateKind);
      const selected = option?.kind === proposal.kind;
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = !option || option.duplicate || option.sourceUnavailable || option.tooLong;
    });

    let note = '';
    if (proposal.tooLong) {
      note = `${isTask ? 'Task titles' : 'Thoughts'} can contain up to ${proposal.maximumLength} characters.`;
    } else if (proposal.sourceUnavailable) {
      note = `${isTask ? 'Majom' : 'Flying Thoughts'} is temporarily unavailable.`;
    } else if (proposal.duplicate) {
      note = `This ${proposal.kind} already exists.`;
    }
    elements.resourceCreateNote.textContent = note;
    elements.resourceCreateNote.hidden = !note;
  }

  function renderResourceSearch() {
    elements.resourceResults.replaceChildren();
    elements.resourceSearchPopover.hidden = !state.searchOpen;
    elements.resourceSearch.setAttribute(
      'aria-expanded',
      String(state.searchOpen),
    );
    syncResourceControls();

    elements.resourceCreate.hidden = true;
    if (!state.searchOpen) return;

    if (state.searchLoading) {
      elements.resourceSearchStatus.textContent = 'Searching tasks and thoughts…';
    } else if (state.searchError) {
      elements.resourceSearchStatus.textContent = state.searchError.message;
    } else {
      selectFirstAvailableResource();
      const creationOptions = resourceCreationOptions();
      const hasCreationCandidate = creationOptions.some(({ duplicate }) => !duplicate);
      elements.resourceSearchStatus.textContent = state.unavailableSources.length
        ? 'Some sources are temporarily unavailable.'
        : !state.searchResults.length && !hasCreationCandidate
          ? 'No matching tasks or thoughts.'
          : '';
    }

    if (!state.searchLoading) {
      const fragment = document.createDocumentFragment();
      [
        ['task', 'Tasks'],
        ['thought', 'Thoughts'],
      ].forEach(([kind, label]) => {
        const resources = state.searchResults.filter(
          (resource) => resource.kind === kind,
        );
        if (!resources.length) return;
        const group = document.createElement('section');
        group.className = 'resource-search-popover__group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', label);
        const heading = document.createElement('h3');
        heading.textContent = label;
        group.append(heading, ...resources.map(createResourceResult));
        fragment.append(group);
      });
      elements.resourceResults.append(fragment);
    }
    renderResourceCreation();
    syncResourceControls();
  }

  async function searchResources() {
    const generation = ++searchGeneration;
    state.searchLoading = true;
    state.searchError = null;
    state.unavailableSources = [];
    renderResourceSearch();
    try {
      const payload = await catalogApi.search({
        query: elements.resourceSearch.value.trim(),
      });
      if (generation !== searchGeneration) return;
      state.searchResults = payload.results ?? [];
      state.unavailableSources = payload.unavailable_sources ?? [];
      reconcileResourceCreateKind();
      selectFirstAvailableResource();
    } catch (error) {
      if (generation !== searchGeneration) return;
      state.searchResults = [];
      state.unavailableSources = error.payload?.unavailable_sources ?? [];
      state.searchError = error;
    } finally {
      if (generation === searchGeneration) {
        state.searchLoading = false;
        renderResourceSearch();
      }
    }
  }

  function scheduleResourceSearch() {
    window.clearTimeout(searchTimer);
    state.searchOpen = true;
    state.selectedResourceKey = null;
    renderResourceSearch();
    searchTimer = window.setTimeout(searchResources, 180);
  }

  function openResourceSearch() {
    if (state.sessionStatus !== 'authenticated') return;
    closeAccountMenu();
    state.searchOpen = true;
    state.searchError = null;
    renderResourceSearch();
    if (!state.searchLoading) void searchResources();
    window.requestAnimationFrame(() => elements.resourceSearch.focus());
  }

  function closeResourceSearch() {
    state.searchOpen = false;
    state.searchLoading = false;
    searchGeneration += 1;
    window.clearTimeout(searchTimer);
    renderResourceSearch();
  }

  function moveResourceSelection(direction) {
    const available = state.searchResults.filter(
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
    return state.searchResults.find(
      (resource) => (
        resourceKey(resource.kind, resource.resource_id)
          === state.selectedResourceKey
      ),
    ) ?? null;
  }

  async function placeResource(resolveNextResource, operation) {
    if (state.saving) return;

    state.saving = true;
    state.resourceAction = operation;
    state.searchError = null;
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
      state.searchResults = [];
      state.selectedResourceKey = null;
      closeResourceSearch();
    } catch (error) {
      if (resource && operation === 'create') {
        const key = resourceKey(resource.kind, resource.resource_id);
        state.searchResults = [
          resource,
          ...state.searchResults.filter((item) => (
            resourceKey(item.kind, item.resource_id) !== key
          )),
        ];
        state.selectedResourceKey = key;
        state.searchError = new Error(
          `Created in ${resource.source === 'majom' ? 'Majom' : 'Flying Thoughts'}, but couldn’t place it on the canvas. Try again.`,
        );
      } else {
        state.searchError = error;
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
    if (!proposal?.canCreate) return Promise.resolve();
    return placeResource(async () => {
      const payload = await catalogApi.create({
        kind: proposal.kind,
        title: proposal.title,
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
      .filter((item) => item.kind === 'task' || item.kind === 'thought')
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
      const isExternalResource = item.kind === 'task' || item.kind === 'thought';
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
      });
      const connectionButton = position.querySelector('.connection-button');
      const removeButton = position.querySelector('.canvas-card-remove');
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
  elements.resourceCreateKinds.addEventListener('click', (event) => {
    const button = event.target.closest('[data-resource-create-kind]');
    if (!button || button.disabled) return;
    state.resourceCreateKind = button.dataset.resourceCreateKind;
    renderResourceSearch();
  });
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
      else void createResourceAndPlace();
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
        closeResourceSearch();
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

