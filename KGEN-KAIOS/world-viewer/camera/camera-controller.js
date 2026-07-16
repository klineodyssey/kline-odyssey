export const DEFAULT_WORLD_BOUNDS = Object.freeze([0, 0, 1200, 760]);

const DEFAULT_VIEWPORT = Object.freeze({ width: 800, height: 600, dpr: 1 });
const EPSILON = 1e-9;

export function createCameraController(options = {}) {
  const listeners = new Set();
  let worldBounds = normalizeBounds(options.worldBounds ?? DEFAULT_WORLD_BOUNDS);
  let viewport = normalizeViewport(options.viewport ?? DEFAULT_VIEWPORT);
  const minZoom = positiveNumber(options.minZoom, 0.25);
  const maxZoom = Math.max(minZoom, positiveNumber(options.maxZoom, 8));
  const worldCenter = boundsCenter(worldBounds);

  let state = clampState({
    camera_x: finiteNumber(options.center?.x ?? options.cameraX, worldCenter.x),
    camera_y: finiteNumber(options.center?.y ?? options.cameraY, worldCenter.y),
    zoom_level: clamp(positiveNumber(options.zoom, 1), minZoom, maxZoom),
    min_zoom: minZoom,
    max_zoom: maxZoom,
    viewport_width: viewport.width,
    viewport_height: viewport.height,
    device_pixel_ratio: viewport.dpr,
    world_bounds: boundsToArray(worldBounds),
    focus_target: options.focusTarget ?? null,
    animation_state: "IDLE",
    input_mode: options.inputMode ?? "POINTER"
  });

  const initialState = cloneState(state);

  function getState() {
    return cloneState(state);
  }

  function update(type, producer) {
    const previous = state;
    const candidate = clampState(producer(cloneState(previous)));
    if (sameState(previous, candidate)) return getState();
    state = candidate;
    const snapshot = getState();
    for (const listener of listeners) {
      try {
        listener(snapshot, { type, previous: cloneState(previous) });
      } catch (error) {
        globalThis.console?.error?.("Camera subscriber failed", error);
      }
    }
    return snapshot;
  }

  function clampState(candidate) {
    const zoom = clamp(
      positiveNumber(candidate.zoom_level, minZoom),
      minZoom,
      maxZoom
    );
    const center = clampCenter(
      {
        x: finiteNumber(candidate.camera_x, boundsCenter(worldBounds).x),
        y: finiteNumber(candidate.camera_y, boundsCenter(worldBounds).y)
      },
      zoom,
      viewport,
      worldBounds
    );

    return {
      ...candidate,
      camera_x: center.x,
      camera_y: center.y,
      zoom_level: zoom,
      min_zoom: minZoom,
      max_zoom: maxZoom,
      viewport_width: viewport.width,
      viewport_height: viewport.height,
      device_pixel_ratio: viewport.dpr,
      world_bounds: boundsToArray(worldBounds)
    };
  }

  function resizeViewport(width, height, dpr = viewport.dpr) {
    viewport = normalizeViewport({ width, height, dpr });
    return update("VIEWPORT_RESIZED", (next) => next);
  }

  function resize(width, height, options = {}) {
    return resizeViewport(width, height, options.devicePixelRatio ?? options.dpr ?? viewport.dpr);
  }

  function setWorldBounds(bounds, { fit = false, padding = 32 } = {}) {
    worldBounds = normalizeBounds(bounds);
    if (fit) return fitBounds(bounds, padding, "WORLD_BOUNDS_FITTED");
    return update("WORLD_BOUNDS_CHANGED", (next) => next);
  }

  function screenToWorld(point, sourceState = state) {
    assertPoint(point, "screen point");
    const zoom = positiveNumber(sourceState.zoom_level, state.zoom_level);
    const width = positiveNumber(sourceState.viewport_width, viewport.width);
    const height = positiveNumber(sourceState.viewport_height, viewport.height);
    return {
      x: finiteNumber(sourceState.camera_x, state.camera_x) + (point.x - width / 2) / zoom,
      y: finiteNumber(sourceState.camera_y, state.camera_y) + (point.y - height / 2) / zoom
    };
  }

  function worldToScreen(point, sourceState = state) {
    assertPoint(point, "world point");
    const zoom = positiveNumber(sourceState.zoom_level, state.zoom_level);
    const width = positiveNumber(sourceState.viewport_width, viewport.width);
    const height = positiveNumber(sourceState.viewport_height, viewport.height);
    return {
      x: (point.x - finiteNumber(sourceState.camera_x, state.camera_x)) * zoom + width / 2,
      y: (point.y - finiteNumber(sourceState.camera_y, state.camera_y)) * zoom + height / 2
    };
  }

  function panByScreenDelta(deltaX, deltaY) {
    const dx = finiteNumber(deltaX, 0);
    const dy = finiteNumber(deltaY, 0);
    return update("CAMERA_PANNED", (next) => ({
      ...next,
      camera_x: next.camera_x - dx / next.zoom_level,
      camera_y: next.camera_y - dy / next.zoom_level,
      focus_target: null,
      input_mode: "PAN"
    }));
  }

  // InputController uses the concise API while legacy callers keep the explicit name.
  function panBy(deltaX, deltaY) {
    return panByScreenDelta(deltaX, deltaY);
  }

  function setCenter(point, focusTarget = null) {
    assertPoint(point, "camera center");
    return update("CAMERA_CENTERED", (next) => ({
      ...next,
      camera_x: point.x,
      camera_y: point.y,
      focus_target: focusTarget
    }));
  }

  function setZoomAtScreenPoint(zoomLevel, screenPoint) {
    assertPoint(screenPoint, "zoom anchor");
    const anchorWorld = screenToWorld(screenPoint);
    const nextZoom = clamp(positiveNumber(zoomLevel, state.zoom_level), minZoom, maxZoom);

    return update("CAMERA_ZOOMED", (next) => ({
      ...next,
      zoom_level: nextZoom,
      camera_x: anchorWorld.x - (screenPoint.x - viewport.width / 2) / nextZoom,
      camera_y: anchorWorld.y - (screenPoint.y - viewport.height / 2) / nextZoom,
      input_mode: "ZOOM"
    }));
  }

  function zoomAtScreenPoint(factor, screenPoint = viewportCenter(viewport)) {
    const safeFactor = positiveNumber(factor, 1);
    return setZoomAtScreenPoint(state.zoom_level * safeFactor, screenPoint);
  }

  function zoomAt(screenPoint, factor) {
    return zoomAtScreenPoint(factor, screenPoint);
  }

  function getVisibleBounds() {
    const snapshot = getState();
    return {
      x: snapshot.camera_x - snapshot.viewport_width / (2 * snapshot.zoom_level),
      y: snapshot.camera_y - snapshot.viewport_height / (2 * snapshot.zoom_level),
      width: snapshot.viewport_width / snapshot.zoom_level,
      height: snapshot.viewport_height / snapshot.zoom_level
    };
  }

  function fitBounds(bounds, padding = 32, eventType = "CAMERA_FITTED") {
    const target = normalizeBounds(bounds);
    const safePadding = clamp(finiteNumber(padding, 32), 0, Math.min(viewport.width, viewport.height) / 2);
    const availableWidth = Math.max(1, viewport.width - safePadding * 2);
    const availableHeight = Math.max(1, viewport.height - safePadding * 2);
    const fitZoom = Math.min(
      availableWidth / Math.max(target.width, EPSILON),
      availableHeight / Math.max(target.height, EPSILON)
    );
    const center = boundsCenter(target);

    return update(eventType, (next) => ({
      ...next,
      camera_x: center.x,
      camera_y: center.y,
      zoom_level: clamp(fitZoom, minZoom, maxZoom),
      focus_target: null,
      input_mode: "FIT"
    }));
  }

  function fitWorld(padding = 32) {
    return fitBounds(boundsToArray(worldBounds), padding, "WORLD_FITTED");
  }

  function reset() {
    return update("CAMERA_RESET", () => ({
      ...cloneState(initialState),
      world_bounds: boundsToArray(worldBounds)
    }));
  }

  function subscribe(listener, options = {}) {
    if (typeof listener !== "function") throw new TypeError("Camera subscriber must be a function.");
    const immediate = options.emitCurrent ?? options.immediate ?? true;
    listeners.add(listener);
    if (immediate) listener(getState(), { type: "CAMERA_SUBSCRIBED", previous: null });
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    getState,
    getVisibleBounds,
    resize,
    resizeViewport,
    setWorldBounds,
    screenToWorld,
    worldToScreen,
    panBy,
    panByScreenDelta,
    setCenter,
    setZoomAtScreenPoint,
    zoomAt,
    zoomAtScreenPoint,
    fitBounds,
    fitWorld,
    reset,
    subscribe
  });
}

function clampCenter(center, zoom, viewport, bounds) {
  const halfWidth = viewport.width / (2 * zoom);
  const halfHeight = viewport.height / (2 * zoom);
  const middle = boundsCenter(bounds);
  return {
    x: halfWidth * 2 >= bounds.width
      ? middle.x
      : clamp(center.x, bounds.x + halfWidth, bounds.x + bounds.width - halfWidth),
    y: halfHeight * 2 >= bounds.height
      ? middle.y
      : clamp(center.y, bounds.y + halfHeight, bounds.y + bounds.height - halfHeight)
  };
}

function normalizeBounds(value) {
  let x;
  let y;
  let width;
  let height;
  if (Array.isArray(value) && value.length === 4) {
    [x, y, width, height] = value;
  } else if (value && typeof value === "object") {
    x = value.x ?? value.minX;
    y = value.y ?? value.minY;
    width = value.width ?? value.w ?? (value.maxX - value.minX);
    height = value.height ?? value.h ?? (value.maxY - value.minY);
  }
  x = finiteNumber(x, 0);
  y = finiteNumber(y, 0);
  width = positiveNumber(width, 1);
  height = positiveNumber(height, 1);
  return { x, y, width, height };
}

function normalizeViewport(value) {
  return {
    width: positiveNumber(value?.width, DEFAULT_VIEWPORT.width),
    height: positiveNumber(value?.height, DEFAULT_VIEWPORT.height),
    dpr: clamp(positiveNumber(value?.dpr, 1), 1, 4)
  };
}

function boundsCenter(bounds) {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function boundsToArray(bounds) {
  return [bounds.x, bounds.y, bounds.width, bounds.height];
}

function viewportCenter(viewport) {
  return { x: viewport.width / 2, y: viewport.height / 2 };
}

function assertPoint(point, label) {
  if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
    throw new TypeError(`${label} must contain finite x and y values.`);
  }
}

function cloneState(value) {
  return { ...value, world_bounds: [...value.world_bounds] };
}

function sameState(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number > 0 ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
