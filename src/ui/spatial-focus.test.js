import assert from 'node:assert/strict';
import test from 'node:test';

import { findSpatialNeighbor } from './spatial-focus.js';

function element(id, left, top, width = 100, height = 60) {
  return {
    id,
    disabled: false,
    getBoundingClientRect() {
      return { left, top, width, height };
    },
  };
}

test('moves through a responsive two-row card grid by geometry', () => {
  const task = element('task', 0, 0);
  const thought = element('thought', 120, 0);
  const achievement = element('achievement', 0, 90, 70);
  const requirement = element('requirement', 85, 90, 70);
  const gap = element('gap', 170, 90, 70);
  const elements = [task, thought, achievement, requirement, gap];

  assert.equal(
    findSpatialNeighbor(elements, task, 'ArrowRight'),
    thought,
  );
  assert.equal(
    findSpatialNeighbor(elements, task, 'ArrowDown'),
    achievement,
  );
  assert.equal(
    findSpatialNeighbor(elements, thought, 'ArrowDown'),
    gap,
  );
  assert.equal(
    findSpatialNeighbor(elements, requirement, 'ArrowRight'),
    gap,
  );
});

test('ignores disabled cards and unsupported keys', () => {
  const first = element('first', 0, 0);
  const disabled = element('disabled', 120, 0);
  const fallback = element('fallback', 240, 0);
  disabled.disabled = true;

  assert.equal(
    findSpatialNeighbor([first, disabled, fallback], first, 'ArrowRight'),
    fallback,
  );
  assert.equal(
    findSpatialNeighbor([first, fallback], first, 'Enter'),
    null,
  );
});
