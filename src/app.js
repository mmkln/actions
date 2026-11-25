import { loadCanvasCamera, saveCanvasCamera } from './canvas/camera-store.js';
import { dragPosition } from './canvas/coordinate-space.js';
import {
  CANVAS_CARD_HEIGHT,
  CANVAS_CARD_WIDTH,
  CANVAS_INSERTION_GAP,
} from './canvas/geometry.js';
import { createLayoutUpdateQueue } from './canvas/layout-update-queue.js';
import { createCanvasMinimap } from './canvas/minimap.js';
import { planCanvasInsertion } from './canvas/placement.js';
import { createCanvasRenderScheduler } from './canvas/render-scheduler.js';
import { createCanvasViewportController } from './canvas/viewport-controller.js';
import { resolveResource } from './domain/demo-resources.js';
import { cardView } from './ui/card.js';
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
        <canvas
          class="canvas-minimap"
          data-canvas-minimap
          tabindex="0"
          aria-label="Canvas minimap. Click or drag to navigate. Use arrow keys to pan."
        ></canvas>
        <div class="canvas-controls" role="group" aria-label="Canvas zoom">
          <button type="button" data-zoom-out aria-label="Zoom out" title="Zoom out">−</button>
          <button class="canvas-zoom-reset" type="button" data-zoom-reset aria-label="Reset zoom" title="Reset zoom">100%</button>
          <button type="button" data-zoom-in aria-label="Zoom in" title="Zoom in">+</button>
        </div>
      </aside>

      <div class="composer" role="search" aria-label="Search and add a Majom task">
        <div class="task-search-popover" data-task-search-popover hidden>
          <p class="task-search-popover__status" data-task-search-status></p>
          <div class="task-search-popover__results" id="task-search-results" role="listbox" aria-label="Majom tasks" data-task-results></div>
        </div>
        <div class="composer__search-icon" aria-hidden="true">${icon('search')}</div>
        <input class="composer__search" type="search" placeholder="Search Majom tasks…" autocomplete="off" aria-label="Search Majom tasks" aria-controls="task-search-results" aria-expanded="false" data-task-search disabled>
        <button class="composer__clear" type="button" aria-label="Clear task search" data-task-search-clear hidden>${icon('close')}</button>
      </div>
    </main>
  `;
}

export function mountApp(root, {
  api,
  majomTasksApi,
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
    canvasItems: root.querySelector('[data-canvas-items]'),
    navigationHud: root.querySelector('[data-navigation-hud]'),
    minimap: root.querySelector('[data-canvas-minimap]'),
    zoomOut: root.querySelector('[data-zoom-out]'),
    zoomReset: root.querySelector('[data-zoom-reset]'),
    zoomIn: root.querySelector('[data-zoom-in]'),
    emptyState: root.querySelector('[data-empty-state]'),
    emptyTitle: root.querySelector('[data-empty-title]'),
    emptyCopy: root.querySelector('[data-empty-copy]'),
    emptyAction: root.querySelector('[data-empty-action]'),
    taskSearchPopover: root.querySelector('[data-task-search-popover]'),
    taskSearch: root.querySelector('[data-task-search]'),
    taskSearchClear: root.querySelector('[data-task-search-clear]'),
    taskSearchStatus: root.querySelector('[data-task-search-status]'),
    taskResults: root.querySelector('[data-task-results]'),
  };

  const state = {
    canvas: null,
    loading: true,
    saving: false,
    error: null,
    sessionStatus: 'checking',
    user: null,
    taskResources: new Map(),
    taskResourcesLoading: false,
    taskSearchResults: [],
    taskSearchLoading: false,
    taskSearchError: null,
    selectedTaskUuid: null,
    taskSearchOpen: false,
  };

  const cardElements = new Map();
  let viewportController = null;
  let taskSearchTimer = null;
  let taskSearchGeneration = 0;
  let taskHydrationGeneration = 0;

  function itemById(itemId) {
    return (state.canvas?.items ?? []).find(({ id }) => id === itemId) ?? null;
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

  function renderMinimap() {
    if (elements.navigationHud.hidden || !viewportController) return;
    const bounds = elements.canvasViewport.getBoundingClientRect();
    canvasMinimap.render({
      camera: viewportController.getCamera(),
      viewport: { width: bounds.width, height: bounds.height },
      cards: (state.canvas?.items ?? []).map((item) => {
        const card = cardElements.get(item.id)?.querySelector('.canvas-card');
        return {
          id: item.id,
          x: item.x,
          y: item.y,
          width: card?.offsetWidth || 280,
          height: card?.offsetHeight || 96,
        };
      }),
    });
  }

  const renderScheduler = createCanvasRenderScheduler({
    requestFrame: window.requestAnimationFrame.bind(window),
    cancelFrame: window.cancelAnimationFrame.bind(window),
    onFlush({ allItems, itemIds, minimap }) {
      if (allItems) {
        (state.canvas?.items ?? []).forEach(({ id }) => renderItemPosition(id));
      } else {
        itemIds.forEach(renderItemPosition);
      }
      if (minimap) renderMinimap();
    },
  });

  const canvasMinimap = createCanvasMinimap({
    canvas: elements.minimap,
    onNavigate(point) {
      viewportController?.centerAtWorldPoint(point);
    },
  });

  viewportController = createCanvasViewportController({
    viewport: elements.canvasViewport,
    world: elements.canvasWorld,
    zoomOutButton: elements.zoomOut,
    zoomResetButton: elements.zoomReset,
    zoomInButton: elements.zoomIn,
    shouldStartPan(event) {
      return event.button === 0 && !event.target.closest(
        '.canvas-card-position, button, input, textarea, select, a',
      );
    },
    onRender() {
      renderScheduler.request({ minimap: true });
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
      syncTaskControls();
    },
    async onError(error) {
      state.error = error;
      await loadCanvas();
    },
  });

  function syncTaskControls() {
    const disabled = (
      state.sessionStatus !== 'authenticated'
      || state.loading
      || state.saving
      || layoutUpdates.isBusy()
    );
    elements.taskSearch.disabled = disabled;
    elements.taskSearchClear.hidden = !elements.taskSearch.value;
  }

  function planTaskInsertion(task) {
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
        id: `task:${task.uuid}`,
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
    renderScheduler.request({ minimap: true });
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
    if (event.button !== 0 || state.saving) return;
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
      renderScheduler.request({ items: [item.id], minimap: true });
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
      renderScheduler.request({ items: [item.id], minimap: true });
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
      renderScheduler.request({ items: [item.id], minimap: true });
    }

    position.addEventListener('pointermove', onPointerMove);
    position.addEventListener('pointerup', finishDrag);
    position.addEventListener('pointercancel', cancelDrag);
  }

  function taskIsOnCanvas(taskUuid) {
    return (state.canvas?.items ?? []).some(
      (item) => item.kind === 'task' && item.resource_id === taskUuid,
    );
  }

  function selectFirstAvailableTask() {
    const selectedIsAvailable = state.taskSearchResults.some(
      (task) => (
        task.uuid === state.selectedTaskUuid
        && !taskIsOnCanvas(task.uuid)
      ),
    );
    if (!selectedIsAvailable) {
      state.selectedTaskUuid = state.taskSearchResults.find(
        (task) => !taskIsOnCanvas(task.uuid),
      )?.uuid ?? null;
    }
  }

  function renderTaskSearch() {
    elements.taskResults.replaceChildren();
    elements.taskSearchPopover.hidden = !state.taskSearchOpen;
    elements.taskSearch.setAttribute(
      'aria-expanded',
      String(state.taskSearchOpen),
    );
    syncTaskControls();

    if (!state.taskSearchOpen) return;

    if (state.taskSearchLoading) {
      elements.taskSearchStatus.textContent = 'Loading Majom tasks…';
      return;
    }
    if (state.taskSearchError) {
      elements.taskSearchStatus.textContent = state.taskSearchError.message;
      return;
    }
    if (!state.taskSearchResults.length) {
      elements.taskSearchStatus.textContent = 'No matching tasks.';
      return;
    }

    selectFirstAvailableTask();
    elements.taskSearchStatus.textContent = '';
    const fragment = document.createDocumentFragment();
    state.taskSearchResults.forEach((task) => {
      const added = taskIsOnCanvas(task.uuid);
      const selected = task.uuid === state.selectedTaskUuid;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-search-popover__result';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(selected));
      button.setAttribute(
        'aria-label',
        added
          ? `${task.title}, on canvas`
          : `Add ${task.title} to canvas`,
      );
      button.classList.toggle('is-selected', selected);
      button.disabled = added || state.saving;

      const copy = document.createElement('span');
      copy.className = 'task-search-popover__result-copy';
      const title = document.createElement('strong');
      title.textContent = task.title;
      const meta = document.createElement('small');
      meta.textContent = task.is_completed
        ? 'Completed'
        : task.status;
      copy.append(title, meta);

      const action = document.createElement('span');
      action.className = 'task-search-popover__result-action';
      action.classList.toggle('is-added', added);
      if (added) {
        action.textContent = '✓ On canvas';
      } else {
        action.innerHTML = icon('plus');
      }

      button.append(copy, action);
      button.addEventListener('pointermove', () => {
        if (added || state.selectedTaskUuid === task.uuid) return;
        state.selectedTaskUuid = task.uuid;
        renderTaskSearch();
      });
      button.addEventListener('click', () => {
        state.selectedTaskUuid = task.uuid;
        void addMajomTask(task);
      });
      fragment.append(button);
    });
    elements.taskResults.append(fragment);
    syncTaskControls();
  }

  async function searchMajomTasks() {
    const generation = ++taskSearchGeneration;
    state.taskSearchLoading = true;
    state.taskSearchError = null;
    renderTaskSearch();
    try {
      const payload = await majomTasksApi.search({
        search: elements.taskSearch.value.trim(),
      });
      if (generation !== taskSearchGeneration) return;
      state.taskSearchResults = payload.results ?? [];
      selectFirstAvailableTask();
    } catch (error) {
      if (generation !== taskSearchGeneration) return;
      state.taskSearchResults = [];
      state.taskSearchError = error;
    } finally {
      if (generation === taskSearchGeneration) {
        state.taskSearchLoading = false;
        renderTaskSearch();
      }
    }
  }

  function scheduleTaskSearch() {
    window.clearTimeout(taskSearchTimer);
    state.taskSearchOpen = true;
    state.selectedTaskUuid = null;
    renderTaskSearch();
    taskSearchTimer = window.setTimeout(searchMajomTasks, 180);
  }

  function openTaskSearch() {
    if (state.sessionStatus !== 'authenticated') return;
    closeAccountMenu();
    state.taskSearchOpen = true;
    state.taskSearchError = null;
    renderTaskSearch();
    if (!state.taskSearchLoading) void searchMajomTasks();
    window.requestAnimationFrame(() => elements.taskSearch.focus());
  }

  function closeTaskSearch() {
    state.taskSearchOpen = false;
    state.taskSearchLoading = false;
    taskSearchGeneration += 1;
    window.clearTimeout(taskSearchTimer);
    renderTaskSearch();
  }

  function moveTaskSelection(direction) {
    const available = state.taskSearchResults.filter(
      (task) => !taskIsOnCanvas(task.uuid),
    );
    if (!available.length) return;
    const currentIndex = available.findIndex(
      (task) => task.uuid === state.selectedTaskUuid,
    );
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + available.length) % available.length;
    state.selectedTaskUuid = available[nextIndex].uuid;
    renderTaskSearch();
  }

  function selectedTask() {
    return state.taskSearchResults.find(
      (task) => task.uuid === state.selectedTaskUuid,
    ) ?? null;
  }

  async function addMajomTask(task) {
    if (state.saving || taskIsOnCanvas(task.uuid)) return;

    state.saving = true;
    state.taskSearchError = null;
    root.dataset.saving = 'true';
    syncTaskControls();
    renderTaskSearch();
    try {
      const insertion = planTaskInsertion(task);
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
        kind: 'task',
        resource_id: task.uuid,
        x: insertion.position.x,
        y: insertion.position.y,
      });
      state.canvas.revision = result.revision;
      state.canvas.items.push(result.item);
      state.taskResources.set(task.uuid, task);
      renderCanvas();
      elements.taskSearch.value = '';
      state.taskSearchResults = [];
      state.selectedTaskUuid = null;
      closeTaskSearch();
    } catch (error) {
      state.taskSearchError = error;
    } finally {
      state.saving = false;
      delete root.dataset.saving;
      syncTaskControls();
      renderTaskSearch();
    }
  }

  async function loadTaskResources() {
    const generation = ++taskHydrationGeneration;
    const taskIds = (state.canvas?.items ?? [])
      .filter((item) => item.kind === 'task')
      .map((item) => item.resource_id);

    state.taskResources = new Map();
    if (!taskIds.length) {
      state.taskResourcesLoading = false;
      return;
    }

    state.taskResourcesLoading = true;
    renderCanvas();
    try {
      const payload = await majomTasksApi.resolve(taskIds);
      if (generation !== taskHydrationGeneration) return;
      state.taskResources = new Map(
        (payload.results ?? []).map((task) => [task.uuid, task]),
      );
    } catch {
      if (generation !== taskHydrationGeneration) return;
      state.taskResources = new Map();
    } finally {
      if (generation === taskHydrationGeneration) {
        state.taskResourcesLoading = false;
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
      const resource = item.kind === 'task'
        ? state.taskResources.get(item.resource_id)
        : resolveResource(item);
      const title = resource?.title ?? (
        state.taskResourcesLoading
          ? 'Loading task…'
          : 'Task unavailable'
      );
      const position = document.createElement('div');
      position.className = 'canvas-card-position';
      position.dataset.itemId = item.id;
      position.style.zIndex = '2';
      position.innerHTML = cardView({
        type: item.kind,
        title,
      });
      position.addEventListener('pointerdown', (event) => {
        beginDrag(event, item, position);
      });
      cardElements.set(item.id, position);
      elements.canvasItems.append(position);
    }
    renderScheduler.request({ allItems: true, minimap: true });

    syncTaskControls();

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
      elements.emptyCopy.textContent = 'Add an existing Majom task to begin.';
      elements.emptyAction.textContent = 'Add Majom task';
      elements.emptyAction.dataset.action = 'task';
    }
  }

  async function loadCanvas() {
    if (state.sessionStatus !== 'authenticated') {
      return;
    }
    state.loading = true;
    state.error = null;
    try {
      state.canvas = await api.getCanvas();
      renderCanvas();
      void loadTaskResources();
    } catch (error) {
      state.error = error;
    } finally {
      state.loading = false;
      renderCanvas();
    }
  }

  elements.taskSearch.addEventListener('focus', () => {
    if (!state.taskSearchOpen) openTaskSearch();
  });
  elements.taskSearch.addEventListener('input', scheduleTaskSearch);
  elements.taskSearchClear.addEventListener('click', () => {
    elements.taskSearch.value = '';
    syncTaskControls();
    scheduleTaskSearch();
    elements.taskSearch.focus();
  });
  elements.taskSearch.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveTaskSelection(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const task = selectedTask();
      if (task) void addMajomTask(task);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeTaskSearch();
    }
  });
  elements.emptyAction.addEventListener('click', () => {
    if (elements.emptyAction.dataset.action === 'retry') {
      loadCanvas();
      return;
    }
    openTaskSearch();
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
    closeTaskSearch();
    state.canvas = null;
    state.taskResources = new Map();
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
      closeTaskSearch();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.taskSearchOpen) {
        closeTaskSearch();
        return;
      }
      closeAccountMenu();
      elements.accountButton.focus();
    }
  });

  themeController.subscribe(renderAppearance);
  window.addEventListener('resize', () => {
    renderScheduler.request({ minimap: true });
  });

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

