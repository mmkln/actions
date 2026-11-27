import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginResourceCreation,
  changeResourceFilter,
  changeResourceQuery,
  chooseResourceKind,
  createResourcePaletteState,
  failResourceSearch,
  finishResourceSearch,
  refreshResourceSearch,
  returnFromResourceCreation,
  startResourceSearch,
} from './resource-palette-state.js';

test('selects a resource kind without opening another screen', () => {
  const choosing = beginResourceCreation(createResourcePaletteState());
  const selected = chooseResourceKind(choosing, 'achievement');

  assert.equal(choosing.screen, 'choose-type');
  assert.equal(selected.screen, 'choose-type');
  assert.equal(selected.draft.selectedKind, 'achievement');
});

test('returns from type selection to search', () => {
  const choosing = beginResourceCreation(createResourcePaletteState());
  const searching = returnFromResourceCreation(choosing);

  assert.equal(searching.screen, 'search');
  assert.equal(searching.draft.selectedKind, null);
});

test('makes the draft available immediately while search is debouncing', () => {
  const state = changeResourceQuery(
    createResourcePaletteState(),
    'Market direction',
  );

  assert.equal(state.draft.title, 'Market direction');
  assert.equal(state.search.status, 'debouncing');
  assert.equal(state.search.requestId, 1);
});

test('filters search without changing the current query', () => {
  const queried = changeResourceQuery(
    createResourcePaletteState(),
    'market',
  );
  const filtered = changeResourceFilter(queried, 'tasks');

  assert.equal(filtered.activeFilter, 'tasks');
  assert.equal(filtered.draft.title, 'market');
  assert.equal(filtered.search.requestId, queried.search.requestId + 1);
  assert.deepEqual(filtered.search.results, []);
});

test('keeps the active filter when the query changes', () => {
  const filtered = changeResourceFilter(
    createResourcePaletteState(),
    'skopos',
  );
  const queried = changeResourceQuery(filtered, 'launch');

  assert.equal(queried.activeFilter, 'skopos');
});

test('keeps the draft when search fails', () => {
  const debouncing = changeResourceQuery(
    createResourcePaletteState(),
    'Market direction',
  );
  const loading = startResourceSearch(
    debouncing,
    debouncing.search.requestId,
  );
  const failed = failResourceSearch(
    loading,
    loading.search.requestId,
    new Error('Search unavailable'),
  );

  assert.equal(failed.draft.title, 'Market direction');
  assert.equal(failed.search.status, 'error');
  assert.equal(beginResourceCreation(failed).screen, 'choose-type');
});

test('ignores a stale search response after the query changes', () => {
  const first = changeResourceQuery(createResourcePaletteState(), 'Market');
  const second = changeResourceQuery(first, 'Market direction');
  const stale = finishResourceSearch(first, first.search.requestId, {
    results: [{ kind: 'thought', resource_id: 'old' }],
  });
  const ignored = finishResourceSearch(second, first.search.requestId, {
    results: stale.search.results,
  });

  assert.equal(ignored, second);
  assert.deepEqual(ignored.search.results, []);
});

test('records when a resource search completes', () => {
  const initial = createResourcePaletteState();
  const completed = finishResourceSearch(initial, initial.search.requestId, {
    results: [{ kind: 'thought', resource_id: 'thought-id' }],
  }, 42_000);

  assert.equal(completed.search.status, 'success');
  assert.equal(completed.search.completedAt, 42_000);
  assert.equal(completed.search.refreshing, false);
});

test('refreshes cached results without clearing the visible search state', () => {
  const initial = createResourcePaletteState();
  const completed = finishResourceSearch(initial, initial.search.requestId, {
    results: [{ kind: 'task', resource_id: 'task-id' }],
  }, 42_000);
  const cached = {
    ...completed,
    scrollTop: 320,
  };
  const refreshing = refreshResourceSearch(cached);

  assert.equal(refreshing.search.requestId, cached.search.requestId + 1);
  assert.equal(refreshing.search.refreshing, true);
  assert.equal(refreshing.search.status, 'success');
  assert.deepEqual(refreshing.search.results, cached.search.results);
  assert.equal(refreshing.scrollTop, 320);
});

test('keeps cached results when a background refresh fails', () => {
  const initial = createResourcePaletteState();
  const completed = finishResourceSearch(initial, initial.search.requestId, {
    results: [{ kind: 'thought', resource_id: 'thought-id' }],
  }, 42_000);
  const refreshing = refreshResourceSearch(completed);
  const failed = failResourceSearch(
    refreshing,
    refreshing.search.requestId,
    new Error('Search unavailable'),
  );

  assert.equal(failed.search.status, 'success');
  assert.equal(failed.search.refreshing, false);
  assert.deepEqual(failed.search.results, completed.search.results);
  assert.equal(failed.search.completedAt, 42_000);
});
