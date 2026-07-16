export const LOD_LEVELS = Object.freeze([
  "EARTH",
  "REGION",
  "CITY",
  "LAND_PARCEL",
  "BUILDING",
  "ROOM"
]);

export const WORLD_SCENE_BOUNDS = Object.freeze([0, 0, 1200, 760]);

const NEXT_LEVEL = Object.freeze({
  EARTH: "REGION",
  REGION: "CITY",
  CITY: "LAND_PARCEL",
  LAND_PARCEL: "BUILDING",
  BUILDING: "ROOM",
  ROOM: null
});

const COLLECTION_BY_TYPE = Object.freeze({
  EARTH: "earth",
  REGION: "regions",
  CITY: "cities",
  LAND_PARCEL: "parcels",
  BUILDING: "buildings",
  ROOM: "rooms",
  LIFE_PROFILE: "lifeProfiles"
});

export function createLodController(source = {}) {
  const listeners = new Set();
  let model = normalizeWorld(source);
  let path = [model.earth];
  let state = createState("LOD_INITIALIZED");

  function createState(reason) {
    const scene = buildScene(model, path);
    return {
      level: scene.level,
      level_index: LOD_LEVELS.indexOf(scene.level),
      current_id: scene.current?.id ?? null,
      path: scene.path,
      breadcrumb: scene.breadcrumb,
      can_back: path.length > 1,
      can_enter: NEXT_LEVEL[scene.level] != null && scene.items.length > 0,
      home_parcel_id: model.homeParcelId,
      reason,
      scene
    };
  }

  function getState() {
    return clone(state);
  }

  function getScene() {
    return clone(state.scene);
  }

  function getPath() {
    return clone(state.path);
  }

  function getBreadcrumb() {
    return state.breadcrumb;
  }

  function publish(type, detail = {}) {
    const previous = state;
    state = createState(type);
    const snapshot = getState();
    for (const listener of listeners) {
      try {
        listener(snapshot, { type, detail: clone(detail), previous: clone(previous) });
      } catch (error) {
        globalThis.console?.error?.("LOD subscriber failed", error);
      }
    }
    return snapshot;
  }

  function enter(target) {
    const id = typeof target === "object" ? target?.id : target;
    const expectedType = NEXT_LEVEL[state.level];
    if (!expectedType) return transitionFailure("DEEPEST_LEVEL", id);

    const candidate = state.scene.items.find((item) => String(item.id) === String(id));
    if (!candidate) return transitionFailure("ENTITY_NOT_IN_CURRENT_SCENE", id);
    if (candidate.type !== expectedType) return transitionFailure("INVALID_CHILD_TYPE", id);

    const canonical = model.index.get(String(candidate.id));
    if (!canonical) return transitionFailure("ENTITY_NOT_REGISTERED", id);
    path = [...path, canonical];
    return transitionSuccess("LOD_ENTERED", { entered_id: canonical.id });
  }

  function back() {
    if (path.length <= 1) return transitionFailure("ALREADY_AT_WORLD", model.earth.id);
    const exited = path[path.length - 1];
    path = path.slice(0, -1);
    return transitionSuccess("LOD_BACK", { exited_id: exited.id });
  }

  function world() {
    path = [model.earth];
    return transitionSuccess("LOD_WORLD", { world_id: model.earth.id });
  }

  function home() {
    if (!model.homeParcelId) return transitionFailure("HOME_NOT_CONFIGURED", null);
    const homePath = buildPathTo(model, model.homeParcelId);
    if (!homePath || homePath.at(-1)?.type !== "LAND_PARCEL") {
      return transitionFailure("HOME_PATH_UNAVAILABLE", model.homeParcelId);
    }
    path = homePath;
    return transitionSuccess("LOD_HOME", { home_parcel_id: model.homeParcelId });
  }

  function setHomeParcel(parcelId) {
    const entity = model.index.get(String(parcelId));
    if (!entity || entity.type !== "LAND_PARCEL") {
      return transitionFailure("INVALID_HOME_PARCEL", parcelId);
    }
    model.homeParcelId = entity.id;
    return transitionSuccess("HOME_PARCEL_CHANGED", { home_parcel_id: entity.id });
  }

  function replaceData(nextSource, { preservePath = true } = {}) {
    const previousIds = path.map((entity) => entity.id);
    model = normalizeWorld(nextSource);
    path = [model.earth];

    if (preservePath) {
      const candidatePath = [];
      for (const id of previousIds) {
        const entity = model.index.get(String(id));
        if (!entity) break;
        if (candidatePath.length > 0 && entity.parent_id !== candidatePath.at(-1).id) break;
        candidatePath.push(entity);
      }
      if (candidatePath[0]?.type === "EARTH") path = candidatePath;
    }
    return transitionSuccess("LOD_DATA_REPLACED", { preserve_path: preservePath });
  }

  function getEntity(id) {
    const entity = model.index.get(String(id));
    return entity ? clone(entity) : null;
  }

  function getContext() {
    return getEntity(state.current_id);
  }

  function getChildren(parentId = state.current_id, type = null) {
    const children = [...model.index.values()].filter((entity) => (
      entity.parent_id === String(parentId)
      && (type == null || entity.type === String(type).toUpperCase())
    ));
    return clone(children);
  }

  function subscribe(listener, options = {}) {
    if (typeof listener !== "function") throw new TypeError("LOD subscriber must be a function.");
    const immediate = options.emitCurrent ?? options.immediate ?? true;
    listeners.add(listener);
    if (immediate) listener(getState(), { type: "LOD_SUBSCRIBED", detail: {}, previous: null });
    return () => listeners.delete(listener);
  }

  function transitionSuccess(type, detail) {
    return { ok: true, reason: null, state: publish(type, detail) };
  }

  function transitionFailure(reason, targetId) {
    return { ok: false, reason, target_id: targetId == null ? null : String(targetId), state: getState() };
  }

  return Object.freeze({
    getState,
    getScene,
    getPath,
    getBreadcrumb,
    getContext,
    getEntity,
    getChildren,
    enter,
    back,
    world,
    home,
    setHomeParcel,
    replaceData,
    subscribe
  });
}

export function normalizeWorld(source = {}) {
  const earthSource = source.earth ?? {
    id: "earth-k280",
    label: "Earth K280",
    coordinate_frame: "K280_GEODETIC"
  };
  const earth = normalizeEntity(earthSource, "EARTH", 0, null);
  const regions = normalizeCollection(
    source.regions ?? (source.region ? [source.region] : []),
    "REGION",
    earth.id
  );
  const defaultRegionId = regions[0]?.id ?? null;
  const cities = normalizeCollection(
    source.cities ?? (source.cityOverlay ? [source.cityOverlay] : []),
    "CITY",
    defaultRegionId
  ).map((city) => ({ ...city, viewer_only: true }));
  const defaultCityId = cities[0]?.id ?? null;
  const parcels = normalizeCollection(source.parcels, "LAND_PARCEL", defaultCityId);
  const buildings = normalizeCollection(source.buildings, "BUILDING", null, (item) => (
    item.parent_id ?? item.parcel_id ?? null
  ));
  const rooms = normalizeCollection(source.rooms, "ROOM", null, (item) => (
    item.parent_id ?? item.building_id ?? null
  ));
  const lifeSources = [
    ...asArray(source.lifeProfiles),
    ...asArray(source.aiWorkers).map((item) => ({ ...item, life_kind: item.life_kind ?? "AI_WORKER" })),
    ...asArray(source.npcs).map((item) => ({ ...item, life_kind: item.life_kind ?? "NPC" }))
  ];
  const lifeProfiles = normalizeCollection(lifeSources, "LIFE_PROFILE", null, (item) => (
    item.parent_id ?? item.room_id ?? item.building_id ?? item.parcel_id ?? null
  ));

  const collections = { earth, regions, cities, parcels, buildings, rooms, lifeProfiles };
  const index = new Map();
  for (const entity of [earth, ...regions, ...cities, ...parcels, ...buildings, ...rooms, ...lifeProfiles]) {
    const key = String(entity.id);
    if (index.has(key)) throw new Error(`Duplicate World Viewer entity id: ${key}`);
    index.set(key, entity);
  }

  validateParentTypes(index);
  return {
    ...collections,
    index,
    homeParcelId: source.homeParcelId
      ?? source.home_parcel_id
      ?? source.player?.homeParcelId
      ?? source.player?.home_parcel_id
      ?? source.player?.starterParcelId
      ?? source.player?.starter_parcel_id
      ?? null
  };
}

function buildScene(model, path) {
  const current = path.at(-1) ?? model.earth;
  const level = current.type;
  const childType = NEXT_LEVEL[level];
  let items;

  if (childType) {
    const collectionName = COLLECTION_BY_TYPE[childType];
    items = model[collectionName].filter((entity) => entity.parent_id === current.id);
  } else {
    const lifeAtRoom = model.lifeProfiles.filter((profile) => profile.parent_id === current.id);
    items = [current, ...lifeAtRoom];
  }

  const decoratedItems = items.map((item) => decorateWithLife(item, model.lifeProfiles));
  const pathSummary = path.map((entity) => ({
    id: entity.id,
    label: entity.label,
    type: entity.type,
    viewer_only: entity.viewer_only === true
  }));

  return {
    id: `scene-${current.id}`,
    level,
    bounds: [...WORLD_SCENE_BOUNDS],
    coordinate_frame: level === "BUILDING" || level === "ROOM"
      ? "LOCAL_VIEWER_2D"
      : "K280_VIEWER_PROJECTION",
    current: clone(current),
    items: clone(decoratedItems),
    path: pathSummary,
    breadcrumb: pathSummary.map((entity) => entity.label).join(" / "),
    viewer_only: current.viewer_only === true,
    canonical_data_mutable: false
  };
}

function decorateWithLife(entity, lifeProfiles) {
  const attached = lifeProfiles.filter((profile) => profile.parent_id === entity.id);
  return {
    ...entity,
    life_count: attached.length,
    life_profiles: attached.map((profile) => ({
      id: profile.id,
      label: profile.label,
      life_kind: profile.life_kind ?? "LIFE"
    }))
  };
}

function buildPathTo(model, targetId) {
  const reversePath = [];
  const seen = new Set();
  let cursor = model.index.get(String(targetId));
  while (cursor) {
    if (seen.has(cursor.id)) return null;
    seen.add(cursor.id);
    reversePath.push(cursor);
    if (cursor.type === "EARTH") break;
    cursor = model.index.get(String(cursor.parent_id));
  }
  const result = reversePath.reverse();
  if (result[0]?.id !== model.earth.id) return null;
  for (let index = 1; index < result.length; index += 1) {
    if (NEXT_LEVEL[result[index - 1].type] !== result[index].type) return null;
  }
  return result;
}

function normalizeCollection(value, type, fallbackParentId, parentResolver = null) {
  return asArray(value).map((item, index) => {
    const parentId = parentResolver?.(item) ?? item?.parent_id ?? fallbackParentId;
    return normalizeEntity(item, type, index, parentId);
  });
}

function normalizeEntity(raw = {}, type, index, parentId) {
  const normalizedType = String(type).toUpperCase();
  const id = String(raw.id ?? `${normalizedType.toLowerCase()}-${String(index + 1).padStart(3, "0")}`);
  return {
    ...raw,
    id,
    label: String(raw.label ?? raw.name ?? id),
    type: normalizedType,
    parent_id: parentId == null ? null : String(parentId),
    viewer_only: normalizedType === "CITY" || raw.viewer_only === true,
    view: normalizeView(raw.view ?? raw.viewer, normalizedType, index)
  };
}

function normalizeView(value, type, index) {
  const source = value ?? {};
  const points = normalizePoints(source.points);
  const fallback = fallbackView(type, index);
  const shape = String(source.shape ?? (points.length >= 3 ? "polygon" : fallback.shape)).toLowerCase();
  const bounds = normalizeBounds(
    source.bounds ?? (
      hasLegacyRect(source)
        ? [source.x, source.y, source.w ?? source.width, source.h ?? source.height]
        : null
    ),
    points,
    fallback.bounds
  );
  return { shape, bounds, points };
}

function fallbackView(type, index) {
  if (type === "EARTH") return { shape: "circle", bounds: [260, 40, 680, 680] };
  if (type === "LIFE_PROFILE") {
    const column = index % 6;
    const row = Math.floor(index / 6);
    return { shape: "circle", bounds: [140 + column * 150, 140 + row * 120, 54, 54] };
  }

  const settings = {
    REGION: { columns: 3, width: 320, height: 240 },
    CITY: { columns: 3, width: 300, height: 210 },
    LAND_PARCEL: { columns: 4, width: 250, height: 150 },
    BUILDING: { columns: 3, width: 300, height: 220 },
    ROOM: { columns: 3, width: 300, height: 190 }
  }[type] ?? { columns: 4, width: 240, height: 150 };
  const gap = 24;
  const column = index % settings.columns;
  const row = Math.floor(index / settings.columns);
  return {
    shape: "rect",
    bounds: [
      50 + column * (settings.width + gap),
      50 + row * (settings.height + gap),
      settings.width,
      settings.height
    ]
  };
}

function validateParentTypes(index) {
  for (const entity of index.values()) {
    if (entity.type === "EARTH" || entity.type === "LIFE_PROFILE") continue;
    const parent = index.get(String(entity.parent_id));
    const expectedParent = LOD_LEVELS[LOD_LEVELS.indexOf(entity.type) - 1];
    if (!parent || parent.type !== expectedParent) {
      throw new Error(`${entity.type} ${entity.id} requires a ${expectedParent} parent.`);
    }
  }
}

function normalizeBounds(value, points, fallback) {
  if (Array.isArray(value) && value.length === 4) {
    return [
      finiteNumber(value[0], fallback[0]),
      finiteNumber(value[1], fallback[1]),
      positiveNumber(value[2], fallback[2]),
      positiveNumber(value[3], fallback[3])
    ];
  }
  if (value && typeof value === "object") {
    const minX = finiteNumber(value.x ?? value.minX, fallback[0]);
    const minY = finiteNumber(value.y ?? value.minY, fallback[1]);
    return [
      minX,
      minY,
      positiveNumber(value.width ?? value.w ?? (value.maxX - value.minX), fallback[2]),
      positiveNumber(value.height ?? value.h ?? (value.maxY - value.minY), fallback[3])
    ];
  }
  if (points.length > 0) {
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return [minX, minY, Math.max(1, Math.max(...xs) - minX), Math.max(1, Math.max(...ys) - minY)];
  }
  return [...fallback];
}

function normalizePoints(points) {
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => Array.isArray(point)
      ? [Number(point[0]), Number(point[1])]
      : [Number(point?.x), Number(point?.y)])
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
}

function hasLegacyRect(value) {
  return value && value.x != null && value.y != null
    && (value.w != null || value.width != null)
    && (value.h != null || value.height != null);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number > 0 ? number : fallback;
}
