const DIRECTIONS = Object.freeze({
  ArrowLeft: Object.freeze({ x: -1, y: 0 }),
  ArrowRight: Object.freeze({ x: 1, y: 0 }),
  ArrowUp: Object.freeze({ x: 0, y: -1 }),
  ArrowDown: Object.freeze({ x: 0, y: 1 }),
});

function center(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function findSpatialNeighbor(elements, current, key) {
  const direction = DIRECTIONS[key];
  if (!direction || !current) return null;

  const origin = center(current.getBoundingClientRect());
  return elements
    .filter((element) => element !== current && !element.disabled)
    .map((element) => {
      const target = center(element.getBoundingClientRect());
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const primary = direction.x
        ? dx * direction.x
        : dy * direction.y;
      if (primary <= 0) return null;

      const secondary = direction.x ? Math.abs(dy) : Math.abs(dx);
      return {
        element,
        score: primary + secondary * 4,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.score - right.score)[0]?.element ?? null;
}
