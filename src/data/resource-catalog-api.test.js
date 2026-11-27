import assert from 'node:assert/strict';
import test from 'node:test';

import { createResourceCatalogApi } from './resource-catalog-api.js';

test('searches the resource catalog through the Actions BFF', async () => {
  let captured;
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ results: [] });
    },
  });

  await api.search({ query: 'launch plan', limit: 12 });

  assert.equal(
    captured.path,
    '/catalog/search/?limit=12&q=launch+plan',
  );
  assert.equal(captured.options, undefined);
});

test('filters catalog searches to requested resource kinds', async () => {
  let captured;
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ results: [] });
    },
  });

  await api.search({
    query: 'launch',
    kinds: ['achievement', 'requirement'],
  });

  assert.equal(
    captured.path,
    '/catalog/search/?limit=20&q=launch&kinds=achievement%2Crequirement',
  );
});

test('forwards an abort signal to catalog search', async () => {
  let captured;
  const controller = new AbortController();
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ results: [] });
    },
  });

  await api.search({ query: 'launch', signal: controller.signal });

  assert.equal(captured.options.signal, controller.signal);
});

test('resolves mixed resource references with one batch request', async () => {
  let captured;
  const references = [
    { kind: 'task', resource_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    { kind: 'thought', resource_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
    { kind: 'achievement', resource_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' },
    { kind: 'requirement', resource_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' },
    { kind: 'gap', resource_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' },
  ];
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ results: [] });
    },
  });

  await api.resolve(references);

  assert.equal(captured.path, '/catalog/resolve/');
  assert.equal(captured.options.method, 'POST');
  assert.deepEqual(JSON.parse(captured.options.body), { references });
});

test('creates a source resource through the Actions BFF', async () => {
  let captured;
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ resource: {} });
    },
  });

  await api.create({ kind: 'thought', title: 'A useful thought' });

  assert.equal(captured.path, '/catalog/resources/');
  assert.equal(captured.options.method, 'POST');
  assert.deepEqual(JSON.parse(captured.options.body), {
    kind: 'thought',
    title: 'A useful thought',
  });
});

test('creates a dependent resource with a typed parent', async () => {
  let captured;
  const api = createResourceCatalogApi({
    request(path, options) {
      captured = { path, options };
      return Promise.resolve({ resource: {} });
    },
  });
  const parent = {
    kind: 'achievement',
    resource_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  };

  await api.create({
    kind: 'requirement',
    title: 'Clear product direction',
    parent,
  });

  assert.deepEqual(JSON.parse(captured.options.body), {
    kind: 'requirement',
    title: 'Clear product direction',
    parent,
  });
});

test('does not call the backend for an empty reference batch', async () => {
  let called = false;
  const api = createResourceCatalogApi({
    request() {
      called = true;
    },
  });

  const result = await api.resolve([]);

  assert.equal(called, false);
  assert.deepEqual(result, {
    results: [],
    unavailable_sources: [],
  });
});
