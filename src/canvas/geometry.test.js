import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACTION_CARD_LAYOUT,
  CANVAS_CARD_CSS_VARIABLES,
  EDITORIAL_CARD_CSS_VARIABLES,
  EDITORIAL_CARD_LAYOUT,
  GAP_CARD_LAYOUT,
  canvasCardGeometry,
} from './geometry.js';

test('exposes one editorial layout contract to geometry and CSS', () => {
  assert.equal(EDITORIAL_CARD_LAYOUT.paddingInline, 25);
  assert.equal(EDITORIAL_CARD_LAYOUT.contentGap, 13);
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--editorial-card-max-width'], '400px');
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--editorial-card-content-width'], '350px');
  assert.equal(ACTION_CARD_LAYOUT.maxWidth, 340);
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--action-card-max-width'], '340px');
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--action-card-content-width'], '250px');
  assert.equal(GAP_CARD_LAYOUT.maxWidth, 320);
  assert.equal(CANVAS_CARD_CSS_VARIABLES['--gap-card-max-width'], '320px');
  assert.equal(CANVAS_CARD_CSS_VARIABLES['--gap-card-content-width'], '264px');
});

test('adapts action geometry to its title', () => {
  assert.deepEqual(canvasCardGeometry('action', 'Decide'), {
    width: 190,
    height: 84,
  });

  const longAction = canvasCardGeometry(
    'action',
    'Improve customer activation across the complete onboarding flow',
  );

  assert.ok(longAction.width > 190);
  assert.ok(longAction.width <= 340);
  assert.ok(longAction.height >= 84);
  assert.ok(longAction.height <= 96);
});

test('uses maximum action geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('action'), {
    width: 340,
    height: 96,
  });
});

test('adapts thought geometry to its content within safe bounds', () => {
  assert.deepEqual(canvasCardGeometry('thought', 'i'), {
    width: 180,
    height: 109,
  });

  assert.deepEqual(canvasCardGeometry('thought', 'x'.repeat(120)), {
    width: 400,
    height: 186,
  });
});

test('uses the maximum thought geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('thought'), {
    width: 400,
    height: 203,
  });
});

test('adapts achievement geometry to its title within editorial bounds', () => {
  assert.deepEqual(canvasCardGeometry('achievement', 'Direction'), {
    width: 180,
    height: 109,
  });

  assert.deepEqual(
    canvasCardGeometry(
      'achievement',
      'Direction confirmed for the first product launch',
    ),
    {
      width: 400,
      height: 134,
    },
  );
});

test('uses maximum achievement geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('achievement'), {
    width: 400,
    height: 192,
  });
});

test('adapts task geometry to its action title', () => {
  assert.deepEqual(canvasCardGeometry('task', 'Run'), {
    width: 180,
    height: 109,
  });

  const longTask = canvasCardGeometry(
    'task',
    'Run five customer interviews and summarize all collected evidence',
  );

  assert.equal(longTask.width, 400);
  assert.ok(longTask.height > 109);
  assert.ok(longTask.height <= 192);
});

test('uses maximum task geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('task'), {
    width: 400,
    height: 192,
  });
});

test('adapts gap geometry while preserving its missing-state treatment', () => {
  assert.deepEqual(canvasCardGeometry('gap', 'Missing'), {
    width: 240,
    height: 158,
  });

  const longGap = canvasCardGeometry(
    'gap',
    'Evidence is missing from the current customer validation process',
  );

  assert.equal(longGap.width, 320);
  assert.ok(longGap.height > 158);
  assert.ok(longGap.height <= 197);
});

test('uses maximum gap geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('gap'), {
    width: 320,
    height: 197,
  });
});

test('uses default geometry for regular cards', () => {
  assert.deepEqual(canvasCardGeometry('goal'), {
    width: 280,
    height: 96,
  });
});
