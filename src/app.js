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
import { demoPlacements, resolveResource } from './domain/demo-resources.js';
import { cardView } from './ui/card.js';
import { icon } from './ui/icons.js';

function shellView() {
  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="topbar__actions">
          <button class="icon-button" type="button" aria-label="Add sample cards" data-add-samples disabled>
            ${icon('plus')}
          </button>
          <button class="account-trigger" type="button" aria-label="Account" aria-expanded="false" data-account-button disabled>
            <span class="account-avatar" data-account-avatar aria-hidden="true" hidden>M</span>
            <span data-account-label>Checking…</span>
            <span class="account-chevron" data-account-chevron hidden>${icon('chevronDown')}</span>
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

      <div class="composer" aria-label="Card composer preview">
        <div class="composer__type">${icon('spark')}<span>Thought</span></div>
        <span class="composer__placeholder">Source integrations are coming next…</span>
        <button class="composer__button" type="button" disabled>${icon('plus')}<span>Add</span></button>
      </div>
    </main>
  `;
}

export function mountApp(root, { api, authSession, themeController }) {
  root.innerHTML = shellView();

  const elements = {
    addSamples: root.querySelector('[data-add-samples]'),
    accountButton: root.querySelector('[data-account-button]'),
    accountAvatar: root.querySelector('[data-account-avatar]'),
    accountChevron: root.querySelector('[data-account-chevron]'),
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
  };

  const state = {
    canvas: null,
    loading: true,
    saving: false,
    error: null,
    sessionStatus: 'checking',
    user: null,
  };

  const cardElements = new Map();
  let viewportController = null;

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
      elements.addSamples.disabled = (
        busy
        || state.sessionStatus !== 'authenticated'
        || state.loading
        || state.saving
        || planMissingDemoInsertions().additions.length === 0
      );
    },
    async onError(error) {
      state.error = error;
      await loadCanvas();
    },
  });

  function planMissingDemoInsertions() {
    const existing = new Set(
      (state.canvas?.items ?? []).map(
        (item) => `${item.kind}:${item.resource_id}`,
      ),
    );
    const placements = demoPlacements({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const bounds = elements.canvasViewport.getBoundingClientRect();
    const occupiedById = new Map(
      (state.canvas?.items ?? []).map((item) => [item.id, {
        id: item.id,
        x: item.x,
        y: item.y,
        width: CANVAS_CARD_WIDTH,
        height: CANVAS_CARD_HEIGHT,
      }]),
    );
    const existingItemIds = new Set(occupiedById.keys());
    const additions = [];
    const movedExistingById = new Map();

    placements.filter(
      (item) => !existing.has(`${item.kind}:${item.resource_id}`),
    ).forEach((item) => {
      const desired = viewportController.clientToWorld({
        x: bounds.left + item.x,
        y: bounds.top + item.y,
      });
      const candidateId = `${item.kind}:${item.resource_id}`;
      const insertion = planCanvasInsertion({
        candidate: {
          id: candidateId,
          ...desired,
          width: CANVAS_CARD_WIDTH,
          height: CANVAS_CARD_HEIGHT,
        },
        obstacles: [...occupiedById.values()],
        gap: CANVAS_INSERTION_GAP,
      });

      insertion.moved.forEach((position) => {
        const occupied = occupiedById.get(position.id);
        if (!occupied) return;
        Object.assign(occupied, position);
        if (existingItemIds.has(position.id)) {
          movedExistingById.set(position.id, {
            itemId: position.id,
            x: position.x,
            y: position.y,
          });
        } else {
          const plannedAddition = additions.find(
            (addition) => addition.planId === position.id,
          );
          if (plannedAddition) Object.assign(plannedAddition, position);
        }
      });

      occupiedById.set(candidateId, insertion.position);
      additions.push({
        ...item,
        planId: candidateId,
        x: insertion.position.x,
        y: insertion.position.y,
      });
    });

    return {
      additions: additions.map(({ planId: _planId, ...addition }) => addition),
      movedExisting: [...movedExistingById.values()],
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
    elements.accountChevron.hidden = !authenticated;
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

  function renderCanvas() {
    const items = state.canvas?.items ?? [];
    const authenticated = state.sessionStatus === 'authenticated';
    const checking = state.sessionStatus === 'checking';
    elements.canvasItems.replaceChildren();
    cardElements.clear();

    for (const item of items) {
      const resource = resolveResource(item);
      const position = document.createElement('div');
      position.className = 'canvas-card-position';
      position.dataset.itemId = item.id;
      position.style.zIndex = '2';
      position.innerHTML = cardView({
        type: item.kind,
        title: resource.title,
        detail: resource.detail,
      });
      position.addEventListener('pointerdown', (event) => {
        beginDrag(event, item, position);
      });
      cardElements.set(item.id, position);
      elements.canvasItems.append(position);
    }
    renderScheduler.request({ allItems: true, minimap: true });

    const insertionPlan = planMissingDemoInsertions();
    elements.addSamples.disabled = (
      !authenticated
      || state.loading
      || state.saving
      || layoutUpdates.isBusy()
      || insertionPlan.additions.length === 0
    );

    elements.emptyState.hidden = items.length > 0 && !state.error;
    if (checking) {
      elements.emptyTitle.textContent = 'Opening your Actions canvas';
      elements.emptyCopy.textContent = 'Checking your Majom ID session…';
      elements.emptyAction.hidden = true;
    } else if (!authenticated) {
      elements.emptyTitle.textContent = 'Sign in to open Actions';
      elements.emptyCopy.textContent = state.error?.message
        ?? 'Your canvas and its layout are tied to your Majom ID.';
      elements.emptyAction.hidden = false;
      elements.emptyAction.textContent = 'Continue with Majom ID';
      elements.emptyAction.dataset.action = 'sign-in';
    } else if (state.error) {
      elements.emptyAction.hidden = false;
      elements.emptyTitle.textContent = 'Couldn’t reach Actions backend';
      elements.emptyCopy.textContent = state.error.message;
      elements.emptyAction.textContent = 'Try again';
      elements.emptyAction.dataset.action = 'retry';
    } else {
      elements.emptyAction.hidden = false;
      elements.emptyTitle.textContent = 'Your Actions canvas is empty';
      elements.emptyCopy.textContent = 'Add the local sample references to verify backend persistence.';
      elements.emptyAction.textContent = 'Add sample cards';
      elements.emptyAction.dataset.action = 'samples';
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
    } catch (error) {
      state.error = error;
    } finally {
      state.loading = false;
      renderCanvas();
    }
  }

  async function addSamples() {
    if (
      state.sessionStatus !== 'authenticated'
      || state.saving
      || state.loading
      || layoutUpdates.isBusy()
    ) {
      return;
    }

    state.saving = true;
    root.dataset.saving = 'true';
    elements.addSamples.disabled = true;
    elements.emptyAction.disabled = true;
    try {
      const insertionPlan = planMissingDemoInsertions();
      if (insertionPlan.movedExisting.length > 0) {
        const result = await api.updateLayout({
          baseRevision: state.canvas.revision,
          changes: insertionPlan.movedExisting,
        });
        state.canvas.revision = result.revision;
      }
      for (const placement of insertionPlan.additions) {
        await api.addItem(placement);
      }
      await loadCanvas();
    } catch (error) {
      state.error = error;
      renderCanvas();
    } finally {
      state.saving = false;
      delete root.dataset.saving;
      elements.emptyAction.disabled = false;
    }
  }

  elements.addSamples.addEventListener('click', addSamples);
  elements.emptyAction.addEventListener('click', () => {
    if (elements.emptyAction.dataset.action === 'sign-in') {
      authSession.startLogin();
      return;
    }
    if (elements.emptyAction.dataset.action === 'retry') {
      loadCanvas();
      return;
    }
    addSamples();
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
    state.canvas = null;
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
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
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

