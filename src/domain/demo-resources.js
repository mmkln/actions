import { CARD_TYPE_CONFIG, CARD_TYPES } from './card-types.js';

export const DEMO_RESOURCES = Object.freeze([
  Object.freeze({
    type: CARD_TYPES.THOUGHT,
    resourceId: '11111111-1111-4111-8111-111111111111',
    title: 'Зібрати все важливе в одному просторі',
    detail: 'Thought',
    placement: Object.freeze({ x: 0.25, y: 0.29 }),
  }),
  Object.freeze({
    type: CARD_TYPES.GOAL,
    resourceId: '22222222-2222-4222-8222-222222222222',
    title: 'Запустити першу версію продукту',
    detail: 'Goal',
    placement: Object.freeze({ x: 0.55, y: 0.43 }),
  }),
]);

const DEMO_RESOURCE_BY_KEY = new Map(
  DEMO_RESOURCES.map((resource) => [
    `${resource.type}:${resource.resourceId}`,
    resource,
  ]),
);

export function resolveResource(item) {
  const resource = DEMO_RESOURCE_BY_KEY.get(
    `${item.kind}:${item.resource_id}`,
  );
  if (resource) {
    return resource;
  }

  return Object.freeze({
    type: item.kind,
    resourceId: item.resource_id,
    title: `${CARD_TYPE_CONFIG[item.kind]?.label ?? 'Resource'} reference`,
    detail: item.resource_id.slice(0, 8),
  });
}

