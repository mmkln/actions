const MAX_POSITION_CANDIDATES = 96;

function isFiniteRectangle(rectangle) {
  return Boolean(rectangle)
    && Number.isFinite(rectangle.x)
    && Number.isFinite(rectangle.y)
    && Number.isFinite(rectangle.width)
    && Number.isFinite(rectangle.height)
    && rectangle.width > 0
    && rectangle.height > 0;
}

function rectanglesOverlap(first, second, gap) {
  return !(
    first.x + first.width + gap <= second.x
    || second.x + second.width + gap <= first.x
    || first.y + first.height + gap <= second.y
    || second.y + second.height + gap <= first.y
  );
}

function positionKey({ x, y }) {
  return `${x}:${y}`;
}

function distanceSquared(first, second) {
  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;
  return deltaX * deltaX + deltaY * deltaY;
}

function addCandidate(queue, seen, candidate) {
  const key = positionKey(candidate);
  if (seen.has(key)) return;
  seen.add(key);
  queue.push(candidate);
}

function compareByDistanceFrom(candidate, first, second) {
  const candidateCenterX = candidate.x + candidate.width / 2;
  const candidateCenterY = candidate.y + candidate.height / 2;
  const firstX = first.x + first.width / 2 - candidateCenterX;
  const firstY = first.y + first.height / 2 - candidateCenterY;
  const secondX = second.x + second.width / 2 - candidateCenterX;
  const secondY = second.y + second.height / 2 - candidateCenterY;

  return firstX * firstX + firstY * firstY - (secondX * secondX + secondY * secondY)
    || String(first.id).localeCompare(String(second.id));
}

function pushedAwayFrom(candidate, obstacle, gap) {
  const candidateCenterX = candidate.x + candidate.width / 2;
  const candidateCenterY = candidate.y + candidate.height / 2;
  const obstacleCenterX = obstacle.x + obstacle.width / 2;
  const obstacleCenterY = obstacle.y + obstacle.height / 2;
  const deltaX = obstacleCenterX - candidateCenterX;
  const deltaY = obstacleCenterY - candidateCenterY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const moveRight = deltaX > 0 || (
      deltaX === 0 && String(obstacle.id) > String(candidate.id)
    );
    return {
      ...obstacle,
      x: moveRight
        ? candidate.x + candidate.width + gap
        : candidate.x - obstacle.width - gap,
    };
  }

  return {
    ...obstacle,
    y: deltaY > 0
      ? candidate.y + candidate.height + gap
      : candidate.y - obstacle.height - gap,
  };
}

/**
 * Finds the closest collision-free position for programmatic insertion.
 * Manual drag deliberately bypasses this function: the user's drop wins.
 */
export function resolveCollisionFreePosition({
  candidate,
  obstacles = [],
  gap = 8,
} = {}) {
  if (!isFiniteRectangle(candidate)) return candidate;

  const legalObstacles = obstacles.filter(isFiniteRectangle);
  const desired = { ...candidate };
  const queue = [desired];
  const seen = new Set([positionKey(desired)]);

  for (
    let processed = 0;
    queue.length > 0 && processed < MAX_POSITION_CANDIDATES;
    processed += 1
  ) {
    queue.sort(
      (first, second) => distanceSquared(first, desired) - distanceSquared(second, desired),
    );
    const next = queue.shift();
    const collisions = legalObstacles.filter(
      (obstacle) => rectanglesOverlap(next, obstacle, gap),
    );

    if (collisions.length === 0) return next;

    collisions.forEach((obstacle) => {
      addCandidate(queue, seen, {
        ...desired,
        x: obstacle.x - gap - desired.width,
        y: next.y,
      });
      addCandidate(queue, seen, {
        ...desired,
        x: obstacle.x + obstacle.width + gap,
        y: next.y,
      });
      addCandidate(queue, seen, {
        ...desired,
        x: next.x,
        y: obstacle.y - gap - desired.height,
      });
      addCandidate(queue, seen, {
        ...desired,
        x: next.x,
        y: obstacle.y + obstacle.height + gap,
      });
    });
  }

  const rightmost = legalObstacles.reduce(
    (edge, obstacle) => Math.max(edge, obstacle.x + obstacle.width),
    desired.x - gap - desired.width,
  );

  return {
    ...desired,
    x: rightmost + gap,
  };
}

/**
 * Preserves a newly inserted card's requested position and moves only the
 * existing cards that block it, matching Flying Thoughts Board insertion.
 */
export function planCanvasInsertion({
  candidate,
  obstacles = [],
  gap = 8,
} = {}) {
  if (!isFiniteRectangle(candidate)) return { position: candidate, moved: [] };

  const plannedById = new Map(
    obstacles
      .filter(isFiniteRectangle)
      .map((obstacle) => [obstacle.id, { ...obstacle }]),
  );
  const collidingIds = [...plannedById.values()]
    .filter((obstacle) => rectanglesOverlap(candidate, obstacle, gap))
    .sort((first, second) => compareByDistanceFrom(candidate, first, second))
    .map((obstacle) => obstacle.id);
  const moved = [];

  collidingIds.forEach((id) => {
    const obstacle = plannedById.get(id);
    if (!obstacle || !rectanglesOverlap(candidate, obstacle, gap)) return;

    const resolved = resolveCollisionFreePosition({
      candidate: pushedAwayFrom(candidate, obstacle, gap),
      obstacles: [candidate, ...plannedById.values()].filter((item) => item.id !== id),
      gap,
    });
    plannedById.set(id, resolved);
    moved.push({ id, x: resolved.x, y: resolved.y });
  });

  return { position: candidate, moved };
}

