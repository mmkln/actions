function positiveScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function clientPointToWorld(point, bounds, camera) {
  const scale = positiveScale(camera?.scale);
  return {
    x: (point.x - bounds.left - (camera?.x || 0)) / scale,
    y: (point.y - bounds.top - (camera?.y || 0)) / scale,
  };
}

export function worldPointToClient(point, bounds, camera) {
  const scale = positiveScale(camera?.scale);
  return {
    x: bounds.left + (camera?.x || 0) + point.x * scale,
    y: bounds.top + (camera?.y || 0) + point.y * scale,
  };
}

export function dragPosition(pointer, offset) {
  return {
    x: pointer.x - offset.x,
    y: pointer.y - offset.y,
  };
}

export function zoomCameraAtClientPoint(camera, nextScale, point, bounds) {
  const scale = positiveScale(nextScale);
  const worldPoint = clientPointToWorld(point, bounds, camera);
  return {
    x: point.x - bounds.left - worldPoint.x * scale,
    y: point.y - bounds.top - worldPoint.y * scale,
    scale,
  };
}
