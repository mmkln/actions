import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACTION_CARD_LAYOUT,
  EDITORIAL_CARD_CSS_VARIABLES,
  EDITORIAL_CARD_LAYOUT,
  canvasCardGeometry,
} from './geometry.js';

test('exposes one editorial layout contract to geometry and CSS', () => {
  assert.equal(EDITORIAL_CARD_LAYOUT.paddingInline, 25);
  assert.equal(EDITORIAL_CARD_LAYOUT.contentGap, 13);
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--editorial-card-max-width'], '400px');
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--editorial-card-content-width'], '350px');
  assert.equal(ACTION_CARD_LAYOUT.maxWidth, 440);
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--action-card-max-width'], '440px');
  assert.equal(EDITORIAL_CARD_CSS_VARIABLES['--action-card-content-width'], '388px');
});

test('adapts action geometry to its title', () => {
  assert.deepEqual(canvasCardGeometry('action', 'Decide'), {
    width: 250,
    height: 135,
  });

  const longAction = canvasCardGeometry(
    'action',
    'Improve customer activation across the complete onboarding flow',
  );

  assert.ok(longAction.width > 250);
  assert.ok(longAction.width <= 440);
  assert.ok(longAction.height >= 135);
  assert.ok(longAction.height <= 232);
});

test('uses maximum action geometry as a safe fallback', () => {
  assert.deepEqual(canvasCardGeometry('action'), {
    width: 440,
    height: 232,
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

test('uses default geometry for regular cards', () => {
  assert.deepEqual(canvasCardGeometry('goal'), {
    width: 280,
    height: 96,
  });
});
