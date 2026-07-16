const LEVEL_THEME = Object.freeze({
  EARTH: { background: "#dceff2", grid: "#8fb8bd", fill: "#8bc5a1", stroke: "#285d55" },
  REGION: { background: "#edf2e3", grid: "#b5c49b", fill: "#c7d695", stroke: "#4f6335" },
  CITY: { background: "#edf0f3", grid: "#bcc4cc", fill: "#c9d1d9", stroke: "#465460" },
  LAND_PARCEL: { background: "#f5f0df", grid: "#cfc2a0", fill: "#e3d5a7", stroke: "#6b5b34" },
  BUILDING: { background: "#ece8e3", grid: "#c7bbb0", fill: "#d2c1b5", stroke: "#5f4c42" },
  ROOM: { background: "#f2edf4", grid: "#c9b8cf", fill: "#d7c5dc", stroke: "#604968" }
});

const STATUS_STYLES = Object.freeze({
  UNKNOWN: { dash: [7, 5], pattern: "CROSS" },
  RESTRICTED: { dash: [3, 4], pattern: "DENSE_DIAGONAL" },
  STALE: { dash: [10, 4, 2, 4], pattern: "DOT" },
  DISABLED: { dash: [2, 5], pattern: "CROSS" }
});

export function createMapRenderer(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") {
    throw new TypeError("Map renderer requires a canvas element.");
  }
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas 2D is unavailable.");

  let lastScene = null;
  let lastCamera = null;
  let lastInteraction = {};
  let lastFrameStartedAt = null;
  let metrics = createEmptyMetrics();
  const maxVisibleItems = positiveNumber(options.maxVisibleItems, 1500);
  const onMetrics = typeof options.onMetrics === "function" ? options.onMetrics : null;

  function resize(width, height, dpr = globalThis.devicePixelRatio ?? 1) {
    const cssWidth = Math.max(1, Math.round(positiveNumber(width, canvas.clientWidth || 800)));
    const cssHeight = Math.max(1, Math.round(positiveNumber(height, canvas.clientHeight || 600)));
    const pixelRatio = clamp(positiveNumber(dpr, 1), 1, 4);
    const backingWidth = Math.round(cssWidth * pixelRatio);
    const backingHeight = Math.round(cssHeight * pixelRatio);

    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    return { width: cssWidth, height: cssHeight, dpr: pixelRatio };
  }

  function render(scene, cameraState, interaction = {}) {
    const startedAt = now();
    const camera = normalizeCamera(cameraState);
    const viewport = resize(camera.width, camera.height, camera.dpr);
    const theme = LEVEL_THEME[scene?.level] ?? LEVEL_THEME.EARTH;
    const items = orderItems(scene?.items ?? []);
    const visibleBounds = cameraVisibleBounds(camera);
    const visible = items.filter((item) => boundsIntersect(getItemBounds(item), visibleBounds));
    const limited = visible.slice(Math.max(0, visible.length - maxVisibleItems));
    const interactionState = normalizeInteraction(interaction);

    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);
    drawSemanticBackground(context, viewport, camera, theme, scene?.level ?? "EARTH");

    let labelCount = 0;
    let lifeMarkerCount = 0;
    for (const item of limited) {
      const screenGeometry = projectGeometry(item.view, camera);
      drawItem(context, item, screenGeometry, theme, interactionState, camera.zoom);
      if (drawItemLabel(context, item, screenGeometry, interactionState)) labelCount += 1;
      if (drawLifeMarker(context, item, screenGeometry)) lifeMarkerCount += 1;
    }

    const finishedAt = now();
    const frameDelta = lastFrameStartedAt == null ? 0 : startedAt - lastFrameStartedAt;
    lastFrameStartedAt = startedAt;
    metrics = Object.freeze({
      frame_count: metrics.frame_count + 1,
      render_ms: round(finishedAt - startedAt, 3),
      estimated_fps: frameDelta > 0 ? round(1000 / frameDelta, 1) : null,
      scene_items: items.length,
      visible_items: visible.length,
      drawn_items: limited.length,
      culled_items: items.length - visible.length,
      overflow_items: Math.max(0, visible.length - limited.length),
      labels_drawn: labelCount,
      life_markers_drawn: lifeMarkerCount,
      last_hit_test_ms: metrics.last_hit_test_ms,
      rendered_at: new Date().toISOString()
    });

    lastScene = scene;
    lastCamera = cameraState;
    lastInteraction = interaction;
    onMetrics?.(getFrameMetrics());
    return getFrameMetrics();
  }

  function hitTest(screenPoint, scene = lastScene, cameraState = lastCamera, options = {}) {
    assertPoint(screenPoint, "hit-test point");
    if (!scene || !cameraState) return null;
    const startedAt = now();
    const camera = normalizeCamera(cameraState);
    const worldPoint = screenToWorld(screenPoint, camera);
    const tolerance = Math.max(0, finiteNumber(options.tolerancePx, 4)) / camera.zoom;
    const hit = hitTestScene(scene, worldPoint, { tolerance });
    metrics = Object.freeze({
      ...metrics,
      last_hit_test_ms: round(now() - startedAt, 3)
    });
    return hit;
  }

  function rerender(interaction = lastInteraction) {
    if (!lastScene || !lastCamera) return getFrameMetrics();
    return render(lastScene, lastCamera, interaction);
  }

  function getFrameMetrics() {
    return { ...metrics };
  }

  function destroy() {
    lastScene = null;
    lastCamera = null;
    lastInteraction = {};
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  return Object.freeze({ resize, render, rerender, hitTest, getFrameMetrics, destroy });
}

export function hitTestScene(scene, worldPoint, { tolerance = 0 } = {}) {
  assertPoint(worldPoint, "world hit-test point");
  const ordered = orderItems(scene?.items ?? []);
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const item = ordered[index];
    if (item?.disabled === true || item?.selectable === false) continue;
    if (geometryContainsPoint(item.view, worldPoint, tolerance)) return item;
  }
  return null;
}

export function geometryContainsPoint(view, point, tolerance = 0) {
  if (!view || !view.shape) return false;
  const safeTolerance = Math.max(0, finiteNumber(tolerance, 0));
  const shape = String(view.shape).toLowerCase();
  const bounds = normalizeBounds(view.bounds, view.points);

  if (shape === "circle") {
    const radiusX = bounds.width / 2 + safeTolerance;
    const radiusY = bounds.height / 2 + safeTolerance;
    if (radiusX <= 0 || radiusY <= 0) return false;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const dx = (point.x - centerX) / radiusX;
    const dy = (point.y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
  }

  if (shape === "polygon") {
    const points = normalizePoints(view.points);
    if (points.length < 3) return false;
    if (pointOnPolygonEdge(point, points, safeTolerance)) return true;
    return pointInPolygon(point, points);
  }

  return point.x >= bounds.x - safeTolerance
    && point.x <= bounds.x + bounds.width + safeTolerance
    && point.y >= bounds.y - safeTolerance
    && point.y <= bounds.y + bounds.height + safeTolerance;
}

export function getItemBounds(item) {
  return normalizeBounds(item?.view?.bounds, item?.view?.points);
}

function drawSemanticBackground(ctx, viewport, camera, theme, level) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const gridStep = clamp(80 * camera.zoom, 28, 140);
  const origin = worldToScreen({ x: 0, y: 0 }, camera);
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1;
  for (let x = modulo(origin.x, gridStep); x < viewport.width; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, viewport.height);
    ctx.stroke();
  }
  for (let y = modulo(origin.y, gridStep); y < viewport.height; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(viewport.width, Math.round(y) + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(20, 32, 36, 0.72)";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillText(String(level).replaceAll("_", " "), 14, 22);
}

function drawItem(ctx, item, geometry, theme, interaction, zoom) {
  const statusStyle = STATUS_STYLES[item.status] ?? null;
  const selected = interaction.selected.has(String(item.id));
  const hovered = interaction.hovered === String(item.id);
  const focused = interaction.focused === String(item.id);
  const style = resolveItemStyle(item, theme);

  ctx.save();
  traceGeometry(ctx, geometry);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.setLineDash(statusStyle?.dash ?? []);
  ctx.stroke();
  ctx.setLineDash([]);

  traceGeometry(ctx, geometry);
  ctx.clip();
  drawPattern(ctx, geometry.bounds, statusStyle?.pattern ?? patternForItem(item), style.stroke);
  ctx.restore();

  if (hovered) drawOutline(ctx, geometry, "#0f6f8f", 2, [6, 4]);
  if (selected) {
    drawOutline(ctx, geometry, "#111827", 4, []);
    drawSelectionCorners(ctx, geometry.bounds, "#f4c542");
  }
  if (focused) drawOutline(ctx, geometry, "#ffffff", 2, [2, 3]);

  if (zoom < 0.18) return;
  drawTypeGlyph(ctx, item, geometry.bounds, style.stroke);
}

function drawItemLabel(ctx, item, geometry, interaction) {
  const bounds = geometry.bounds;
  if (bounds.width < 58 || bounds.height < 34) return false;
  const selected = interaction.selected.has(String(item.id));
  const padding = 8;
  const maxWidth = Math.max(30, bounds.width - padding * 2);
  const label = ellipsize(ctx, String(item.label ?? item.id ?? "UNKNOWN"), maxWidth, selected ? "700 13px" : "600 12px");
  ctx.save();
  ctx.font = `${selected ? "700 13px" : "600 12px"} system-ui, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
  const labelWidth = Math.min(maxWidth, ctx.measureText(label).width) + 10;
  ctx.fillRect(bounds.x + 5, bounds.y + 5, labelWidth, 22);
  ctx.fillStyle = "#182126";
  ctx.fillText(label, bounds.x + 10, bounds.y + 9, maxWidth);
  ctx.restore();
  return true;
}

function drawLifeMarker(ctx, item, geometry) {
  const count = lifeCount(item);
  if (count <= 0 || geometry.bounds.width < 22 || geometry.bounds.height < 22) return false;
  const x = geometry.bounds.x + geometry.bounds.width - 13;
  const y = geometry.bounds.y + 13;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#143f3b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + 4, y);
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y + 4);
  ctx.stroke();
  if (count > 1) {
    ctx.fillStyle = "#143f3b";
    ctx.font = "700 9px system-ui, sans-serif";
    ctx.fillText(String(count), x - 3, y + 18);
  }
  ctx.restore();
  return true;
}

function drawPattern(ctx, bounds, pattern, color) {
  if (!pattern) return;
  const step = pattern === "DENSE_DIAGONAL" ? 8 : 13;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;

  if (pattern === "DOT") {
    for (let y = bounds.y + 6; y < bounds.y + bounds.height; y += step) {
      for (let x = bounds.x + 6; x < bounds.x + bounds.width; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "HORIZONTAL" || pattern === "VERTICAL" || pattern === "GRID") {
    if (pattern !== "VERTICAL") {
      for (let y = bounds.y + step; y < bounds.y + bounds.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(bounds.x, y);
        ctx.lineTo(bounds.x + bounds.width, y);
        ctx.stroke();
      }
    }
    if (pattern !== "HORIZONTAL") {
      for (let x = bounds.x + step; x < bounds.x + bounds.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, bounds.y);
        ctx.lineTo(x, bounds.y + bounds.height);
        ctx.stroke();
      }
    }
  } else {
    const span = bounds.width + bounds.height;
    for (let offset = -bounds.height; offset < bounds.width; offset += step) {
      ctx.beginPath();
      ctx.moveTo(bounds.x + offset, bounds.y + bounds.height);
      ctx.lineTo(bounds.x + offset + bounds.height, bounds.y);
      ctx.stroke();
      if (pattern === "CROSS") {
        ctx.beginPath();
        ctx.moveTo(bounds.x + offset, bounds.y);
        ctx.lineTo(bounds.x + offset + bounds.height, bounds.y + bounds.height);
        ctx.stroke();
      }
    }
    void span;
  }
  ctx.restore();
}

function drawOutline(ctx, geometry, color, width, dash) {
  ctx.save();
  traceGeometry(ctx, geometry);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

function drawSelectionCorners(ctx, bounds, color) {
  const size = clamp(Math.min(bounds.width, bounds.height) * 0.16, 7, 15);
  const corners = [
    [bounds.x, bounds.y, 1, 1],
    [bounds.x + bounds.width, bounds.y, -1, 1],
    [bounds.x, bounds.y + bounds.height, 1, -1],
    [bounds.x + bounds.width, bounds.y + bounds.height, -1, -1]
  ];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * size);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTypeGlyph(ctx, item, bounds, color) {
  const type = String(item.type ?? "?");
  const landUse = String(item.land_use ?? "");
  const parcelGlyph = landUse === "RESIDENTIAL" ? "R"
    : landUse === "FARM" ? "F"
      : landUse === "FOREST" ? "T"
        : landUse === "FACTORY" || landUse === "INDUSTRIAL" ? "I"
          : landUse === "MARKETPLACE" || landUse === "COMMERCIAL" ? "M"
            : landUse === "TEMPLE" || landUse === "TEMPLE_SERVICE" ? "H"
              : landUse === "MINE" ? "N"
                : landUse === "ROAD" ? "D" : "P";
  const glyph = type === "REGION" ? "R"
    : type === "CITY" ? "C"
      : type === "LAND_PARCEL" ? parcelGlyph
        : type === "BUILDING" ? "B"
          : type === "ROOM" ? "#"
            : type === "LIFE_PROFILE" ? "+" : "E";
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 10px system-ui, sans-serif";
  ctx.fillText(glyph, bounds.x + 7, bounds.y + bounds.height - 7);
  ctx.restore();
}

function traceGeometry(ctx, geometry) {
  ctx.beginPath();
  if (geometry.shape === "circle") {
    ctx.ellipse(
      geometry.bounds.x + geometry.bounds.width / 2,
      geometry.bounds.y + geometry.bounds.height / 2,
      geometry.bounds.width / 2,
      geometry.bounds.height / 2,
      0,
      0,
      Math.PI * 2
    );
  } else if (geometry.shape === "polygon" && geometry.points.length > 2) {
    ctx.moveTo(geometry.points[0][0], geometry.points[0][1]);
    for (let index = 1; index < geometry.points.length; index += 1) {
      ctx.lineTo(geometry.points[index][0], geometry.points[index][1]);
    }
    ctx.closePath();
  } else {
    ctx.rect(geometry.bounds.x, geometry.bounds.y, geometry.bounds.width, geometry.bounds.height);
  }
}

function projectGeometry(view, camera) {
  const shape = String(view?.shape ?? "rect").toLowerCase();
  const worldBounds = normalizeBounds(view?.bounds, view?.points);
  const topLeft = worldToScreen({ x: worldBounds.x, y: worldBounds.y }, camera);
  const bottomRight = worldToScreen({
    x: worldBounds.x + worldBounds.width,
    y: worldBounds.y + worldBounds.height
  }, camera);
  return {
    shape,
    bounds: {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    },
    points: normalizePoints(view?.points).map((point) => {
      const projected = worldToScreen({ x: point[0], y: point[1] }, camera);
      return [projected.x, projected.y];
    })
  };
}

function resolveItemStyle(item, theme) {
  const use = String(item.land_use ?? item.semantic ?? "");
  const fill = use === "RESIDENTIAL" ? "#d7c5b4"
    : use === "FARM" ? "#b9d48c"
      : use === "FOREST" ? "#86b59a"
        : use === "COMMERCIAL" ? "#a9c9d8"
          : use === "INDUSTRIAL" ? "#c7bdba"
            : item.status === "UNKNOWN" ? "#d5d8dc" : theme.fill;
  return { fill, stroke: theme.stroke };
}

function patternForItem(item) {
  const type = String(item.type ?? "");
  const landUse = String(item.land_use ?? "");
  if (type === "BUILDING") return "CROSS";
  if (type === "ROOM") return "DOT";
  if (type === "LAND_PARCEL") {
    if (landUse === "FARM" || landUse === "ROAD") return "HORIZONTAL";
    if (landUse === "FOREST") return "DOT";
    if (landUse === "FACTORY" || landUse === "INDUSTRIAL" || landUse === "TEMPLE" || landUse === "TEMPLE_SERVICE") return "CROSS";
    if (landUse === "MARKETPLACE" || landUse === "COMMERCIAL") return "GRID";
    if (landUse === "MINE") return "DENSE_DIAGONAL";
    return "DIAGONAL";
  }
  return null;
}

function orderItems(items) {
  return items
    .filter((item) => item && item.id != null && item.view)
    .map((item) => ({ ...item }))
    .sort((left, right) => {
      const layerDelta = finiteNumber(left.z_index ?? left.zIndex, 0)
        - finiteNumber(right.z_index ?? right.zIndex, 0);
      return layerDelta || String(left.id).localeCompare(String(right.id));
    });
}

function normalizeInteraction(interaction) {
  const selectedValues = interaction.selectedIds
    ?? (interaction.selectedId == null ? [] : [interaction.selectedId]);
  return {
    selected: new Set(Array.from(selectedValues, String)),
    hovered: interaction.hoveredId == null ? null : String(interaction.hoveredId),
    focused: interaction.focusedId == null ? null : String(interaction.focusedId)
  };
}

function normalizeCamera(state) {
  if (!state) throw new TypeError("Renderer requires a camera state.");
  return {
    x: finiteNumber(state.camera_x ?? state.center?.x, 600),
    y: finiteNumber(state.camera_y ?? state.center?.y, 380),
    zoom: positiveNumber(state.zoom_level ?? state.zoom, 1),
    width: positiveNumber(state.viewport_width ?? state.viewport?.width, 800),
    height: positiveNumber(state.viewport_height ?? state.viewport?.height, 600),
    dpr: clamp(positiveNumber(state.device_pixel_ratio ?? state.viewport?.dpr, 1), 1, 4)
  };
}

function worldToScreen(point, camera) {
  return {
    x: (point.x - camera.x) * camera.zoom + camera.width / 2,
    y: (point.y - camera.y) * camera.zoom + camera.height / 2
  };
}

function screenToWorld(point, camera) {
  return {
    x: camera.x + (point.x - camera.width / 2) / camera.zoom,
    y: camera.y + (point.y - camera.height / 2) / camera.zoom
  };
}

function cameraVisibleBounds(camera) {
  return {
    x: camera.x - camera.width / (2 * camera.zoom),
    y: camera.y - camera.height / (2 * camera.zoom),
    width: camera.width / camera.zoom,
    height: camera.height / camera.zoom
  };
}

function normalizeBounds(value, points = []) {
  if (Array.isArray(value) && value.length === 4) {
    return {
      x: finiteNumber(value[0], 0),
      y: finiteNumber(value[1], 0),
      width: positiveNumber(value[2], 1),
      height: positiveNumber(value[3], 1)
    };
  }
  if (value && typeof value === "object") {
    return {
      x: finiteNumber(value.x ?? value.minX, 0),
      y: finiteNumber(value.y ?? value.minY, 0),
      width: positiveNumber(value.width ?? value.w ?? (value.maxX - value.minX), 1),
      height: positiveNumber(value.height ?? value.h ?? (value.maxY - value.minY), 1)
    };
  }
  const normalizedPoints = normalizePoints(points);
  if (normalizedPoints.length > 0) {
    const xs = normalizedPoints.map((point) => point[0]);
    const ys = normalizedPoints.map((point) => point[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(1, Math.max(...xs) - minX),
      height: Math.max(1, Math.max(...ys) - minY)
    };
  }
  return { x: 0, y: 0, width: 1, height: 1 };
}

function normalizePoints(points) {
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => Array.isArray(point)
      ? [Number(point[0]), Number(point[1])]
      : [Number(point?.x), Number(point?.y)])
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
}

function pointInPolygon(point, points) {
  let inside = false;
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current++) {
    const [xi, yi] = points[current];
    const [xj, yj] = points[previous];
    const crosses = (yi > point.y) !== (yj > point.y)
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointOnPolygonEdge(point, points, tolerance) {
  if (tolerance <= 0) return false;
  for (let current = 0; current < points.length; current += 1) {
    const start = points[current];
    const end = points[(current + 1) % points.length];
    if (distanceToSegment(point, start, end) <= tolerance) return true;
  }
  return false;
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start[0], point.y - start[1]);
  const ratio = clamp(
    ((point.x - start[0]) * dx + (point.y - start[1]) * dy) / (dx * dx + dy * dy),
    0,
    1
  );
  return Math.hypot(point.x - (start[0] + ratio * dx), point.y - (start[1] + ratio * dy));
}

function boundsIntersect(left, right) {
  return left.x <= right.x + right.width
    && left.x + left.width >= right.x
    && left.y <= right.y + right.height
    && left.y + left.height >= right.y;
}

function lifeCount(item) {
  if (Number.isFinite(Number(item.life_count))) return Number(item.life_count);
  const profiles = item.life_profiles ?? item.lifeProfiles ?? item.life_profile_ids;
  return Array.isArray(profiles) ? profiles.length : 0;
}

function ellipsize(ctx, value, maxWidth, fontPrefix) {
  ctx.save();
  ctx.font = `${fontPrefix} system-ui, sans-serif`;
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.restore();
    return value;
  }
  let result = value;
  while (result.length > 1 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  ctx.restore();
  return `${result}...`;
}

function createEmptyMetrics() {
  return Object.freeze({
    frame_count: 0,
    render_ms: 0,
    estimated_fps: null,
    scene_items: 0,
    visible_items: 0,
    drawn_items: 0,
    culled_items: 0,
    overflow_items: 0,
    labels_drawn: 0,
    life_markers_drawn: 0,
    last_hit_test_ms: null,
    rendered_at: null
  });
}

function assertPoint(point, label) {
  if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
    throw new TypeError(`${label} must contain finite x and y values.`);
  }
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
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

function round(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
