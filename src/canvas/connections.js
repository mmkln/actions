export const MAX_CONNECTIONS_PER_ITEM = 32;

export const ConnectionKind = Object.freeze({
  RELATED: 'related',
});

export const ConnectionSpacing = Object.freeze({
  TIGHT: 'tight',
  NORMAL: 'normal',
  LOOSE: 'loose',
});

export function normalizeConnection(connection) {
  return Object.freeze({
    id: String(connection.id),
    sourceId: String(connection.source_item_id ?? connection.sourceId),
    targetId: String(connection.target_item_id ?? connection.targetId),
    kind: connection.kind ?? ConnectionKind.RELATED,
    spacing: connection.spacing ?? ConnectionSpacing.NORMAL,
  });
}

export function getOutgoingTargetIds(connections, sourceId) {
  return connections
    .filter((connection) => connection.sourceId === sourceId)
    .map((connection) => connection.targetId);
}
