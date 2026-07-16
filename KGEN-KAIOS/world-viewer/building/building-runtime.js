const UNKNOWN_VALUE = "UNKNOWN";

export const BUILDING_TEMPLATE_TYPES = Object.freeze([
  "RESIDENTIAL",
  "FARM_HOUSE",
  "SHOP",
  "FACTORY",
  "TEMPLE",
  "WAREHOUSE",
  "OFFICE",
  "PUBLIC_FACILITY"
]);

const TEMPLATE_DEFINITIONS = Object.freeze({
  RESIDENTIAL: createTemplate("RESIDENTIAL", "Residential", "HOUSING"),
  FARM_HOUSE: createTemplate("FARM_HOUSE", "Farm House", "AGRICULTURE"),
  SHOP: createTemplate("SHOP", "Shop", "COMMERCE"),
  FACTORY: createTemplate("FACTORY", "Factory", "PRODUCTION"),
  TEMPLE: createTemplate("TEMPLE", "Temple", "CIVIC"),
  WAREHOUSE: createTemplate("WAREHOUSE", "Warehouse", "STORAGE"),
  OFFICE: createTemplate("OFFICE", "Office", "WORK"),
  PUBLIC_FACILITY: createTemplate("PUBLIC_FACILITY", "Public Facility", "PUBLIC_SERVICE")
});

const TEMPLATE_ALIASES = Object.freeze({
  HOUSE: "RESIDENTIAL",
  APARTMENT: "RESIDENTIAL",
  VILLA: "RESIDENTIAL",
  FARMHOUSE: "FARM_HOUSE",
  MARKET: "SHOP",
  MARKETPLACE: "SHOP",
  MALL: "SHOP",
  PUBLIC_INFRASTRUCTURE: "PUBLIC_FACILITY"
});

function createTemplate(templateType, label, category) {
  return Object.freeze({
    id: `template-${templateType.toLowerCase().replaceAll("_", "-")}`,
    templateType,
    label,
    category,
    runtimeMode: "READ_ONLY_SYNTHETIC_PROJECTION"
  });
}

function invariant(condition, message) {
  if (!condition) throw new Error(`Building runtime validation failed: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isKnown(value) {
  return value !== undefined && value !== null && value !== "";
}

function firstKnown(...values) {
  return values.find(isKnown);
}

function normalizeWorld(world) {
  invariant(isRecord(world), "world must be an object");
  const source = isRecord(world.world) && !Array.isArray(world.buildings)
    ? world.world
    : world;
  invariant(isRecord(source), "world payload must be an object");
  invariant(source.meta?.synthetic === true, "world must be explicitly synthetic");
  invariant(source.meta?.non_authoritative === true, "world must be non-authoritative");
  return source;
}

function requireCollection(world, name) {
  invariant(Array.isArray(world[name]), `${name} must be an array`);
  return world[name];
}

function entityId(entity, collection) {
  invariant(isRecord(entity), `${collection} contains a non-object value`);
  invariant(typeof entity.id === "string" && entity.id.length > 0, `${collection} entity is missing id`);
  return entity.id;
}

function buildIndex(entities, collection) {
  const index = new Map();
  for (const entity of entities) {
    const id = entityId(entity, collection);
    invariant(!index.has(id), `${collection} contains duplicate id ${id}`);
    index.set(id, entity);
  }
  return index;
}

function optionalIdentifier(value, path) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  invariant(typeof value === "string", `${path} must be a string when present`);
  invariant(value.length > 0, `${path} cannot be empty`);
  return value;
}

function identifierList(value, path, { required = false } = {}) {
  if (!isKnown(value)) {
    invariant(!required, `${path} is required`);
    return Object.freeze({ known: false, ids: Object.freeze([]) });
  }
  invariant(Array.isArray(value), `${path} must be an array`);
  const ids = value.map((id, index) => {
    invariant(typeof id === "string" && id.length > 0, `${path}[${index}] must be a non-empty string`);
    return id;
  });
  invariant(new Set(ids).size === ids.length, `${path} contains duplicate ids`);
  return Object.freeze({ known: true, ids: Object.freeze(ids) });
}

function optionalInteger(value, path, { minimum = 0 } = {}) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  invariant(Number.isInteger(value) && value >= minimum, `${path} must be an integer >= ${minimum}`);
  return value;
}

function optionalMetric(value, path) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  const candidate = isRecord(value)
    ? firstKnown(value.value, value.current, value.percent)
    : value;
  invariant(Number.isFinite(candidate) && candidate >= 0 && candidate <= 100, `${path} must be between 0 and 100`);
  return candidate;
}

function normalizeTemplateType(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  invariant(typeof value === "string", "building template type must be a string");
  const normalized = value.trim().toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
  const candidate = normalized.startsWith("TEMPLATE_")
    ? normalized.slice("TEMPLATE_".length)
    : normalized;
  return TEMPLATE_DEFINITIONS[candidate]
    ? candidate
    : TEMPLATE_ALIASES[candidate] ?? UNKNOWN_VALUE;
}

function normalizeLifecycle(building) {
  const source = isRecord(building.lifecycle) ? building.lifecycle : {};
  const state = optionalIdentifier(
    firstKnown(source.state, building.lifecycle_state, building.life_cycle_state),
    `buildings/${building.id}/lifecycle.state`
  );
  const rawHistory = firstKnown(
    source.history,
    building.lifecycle_history,
    building.life_cycle_history
  );

  if (!isKnown(rawHistory)) {
    return Object.freeze({
      state,
      history: UNKNOWN_VALUE
    });
  }

  invariant(Array.isArray(rawHistory), `buildings/${building.id}/lifecycle.history must be an array`);
  const seen = new Set();
  const history = rawHistory.map((event, index) => {
    invariant(isRecord(event), `buildings/${building.id}/lifecycle.history[${index}] must be an object`);
    const eventId = optionalIdentifier(
      firstKnown(event.event_id, event.eventId, event.id),
      `buildings/${building.id}/lifecycle.history[${index}].event_id`
    );
    invariant(eventId !== UNKNOWN_VALUE, `buildings/${building.id}/lifecycle.history[${index}] requires event_id`);
    invariant(!seen.has(eventId), `buildings/${building.id}/lifecycle.history contains duplicate ${eventId}`);
    seen.add(eventId);
    return Object.freeze({
      eventId,
      state: optionalIdentifier(event.state, `buildings/${building.id}/lifecycle.history[${index}].state`),
      version: optionalInteger(event.version, `buildings/${building.id}/lifecycle.history[${index}].version`),
      recordedAt: optionalIdentifier(
        firstKnown(event.recorded_at, event.recordedAt, event.time),
        `buildings/${building.id}/lifecycle.history[${index}].recorded_at`
      ),
      reason: optionalIdentifier(event.reason, `buildings/${building.id}/lifecycle.history[${index}].reason`)
    });
  });

  return Object.freeze({ state, history: Object.freeze(history) });
}

function normalizeRoomReference(room) {
  return Object.freeze({
    roomId: room.id,
    label: optionalIdentifier(room.label, `rooms/${room.id}/label`),
    roomType: optionalIdentifier(room.room_type, `rooms/${room.id}/room_type`),
    floor: optionalInteger(room.floor, `rooms/${room.id}/floor`),
    status: optionalIdentifier(room.status, `rooms/${room.id}/status`)
  });
}

function occupantSummary(building, rooms, lifeProfiles, capacity) {
  const declaredPopulation = optionalInteger(
    building.population,
    `buildings/${building.id}/population`
  );
  const profileIds = lifeProfiles.map((profile) => profile.id);
  const roomOccupantIds = [...new Set(rooms.flatMap((room) => (
    Array.isArray(room.occupant_ids) ? room.occupant_ids : []
  )))];
  const aiWorkerIds = identifierList(
    building.ai_worker_ids,
    `buildings/${building.id}/ai_worker_ids`
  );
  const knownCounts = [profileIds.length, roomOccupantIds.length];
  if (declaredPopulation !== UNKNOWN_VALUE) knownCounts.push(declaredPopulation);
  const effectiveCount = Math.max(...knownCounts);

  if (capacity !== UNKNOWN_VALUE) {
    invariant(
      effectiveCount <= capacity,
      `buildings/${building.id} occupancy ${effectiveCount} exceeds capacity ${capacity}`
    );
  }

  return Object.freeze({
    declaredPopulation,
    resolvedLifeCount: profileIds.length,
    roomOccupantCount: roomOccupantIds.length,
    aiWorkerCount: aiWorkerIds.known ? aiWorkerIds.ids.length : UNKNOWN_VALUE,
    lifeIds: Object.freeze(profileIds),
    roomOccupantIds: Object.freeze(roomOccupantIds),
    capacity,
    available: capacity === UNKNOWN_VALUE ? UNKNOWN_VALUE : capacity - effectiveCount,
    status: capacity === UNKNOWN_VALUE ? UNKNOWN_VALUE : "WITHIN_CAPACITY"
  });
}

function validateRelationships({ buildings, parcels, rooms, lifeProfiles }) {
  const parcelIndex = buildIndex(parcels, "parcels");
  const roomIndex = buildIndex(rooms, "rooms");
  const lifeIndex = buildIndex(lifeProfiles, "lifeProfiles");
  const buildingIndex = buildIndex(buildings, "buildings");

  for (const building of buildings) {
    invariant(building.object_type === "BUILDING", `buildings/${building.id} must have object_type BUILDING`);
    const parcelId = optionalIdentifier(
      firstKnown(building.parcel_id, building.parent_id),
      `buildings/${building.id}/parcel_id`
    );
    invariant(parcelId !== UNKNOWN_VALUE, `buildings/${building.id} requires parcel_id`);
    invariant(parcelIndex.has(parcelId), `buildings/${building.id} references missing parcel ${parcelId}`);
    if (isKnown(building.parent_id)) {
      invariant(building.parent_id === parcelId, `buildings/${building.id} parent_id must match parcel_id`);
    }

    const parcelBuildingIds = identifierList(
      parcelIndex.get(parcelId).building_ids,
      `parcels/${parcelId}/building_ids`
    );
    if (parcelBuildingIds.known) {
      invariant(parcelBuildingIds.ids.includes(building.id), `parcels/${parcelId} does not reference ${building.id}`);
    }

    const roomIds = identifierList(building.room_ids, `buildings/${building.id}/room_ids`, { required: true });
    for (const roomId of roomIds.ids) {
      invariant(roomIndex.has(roomId), `buildings/${building.id} references missing room ${roomId}`);
      invariant(roomIndex.get(roomId).building_id === building.id, `rooms/${roomId} has the wrong building_id`);
    }

    const linkedRoomIds = rooms
      .filter((room) => room.building_id === building.id)
      .map((room) => room.id);
    invariant(
      linkedRoomIds.length === roomIds.ids.length && linkedRoomIds.every((id) => roomIds.ids.includes(id)),
      `buildings/${building.id} room_ids do not match room parent links`
    );

    const aiWorkerIds = identifierList(
      building.ai_worker_ids,
      `buildings/${building.id}/ai_worker_ids`
    );
    for (const lifeId of aiWorkerIds.ids) {
      invariant(lifeIndex.has(lifeId), `buildings/${building.id} references missing AI Worker ${lifeId}`);
      const profile = lifeIndex.get(lifeId);
      invariant(profile.life_type === "AI_WORKER", `lifeProfiles/${lifeId} must be AI_WORKER`);
      invariant(profile.building_id === building.id, `lifeProfiles/${lifeId} has the wrong building_id`);
    }
  }

  for (const room of rooms) {
    invariant(buildingIndex.has(room.building_id), `rooms/${room.id} references missing building ${room.building_id}`);
  }

  for (const profile of lifeProfiles) {
    if (!isKnown(profile.building_id)) continue;
    invariant(buildingIndex.has(profile.building_id), `lifeProfiles/${profile.id} references missing building ${profile.building_id}`);
  }

  return Object.freeze({ buildingIndex, parcelIndex, roomIndex, lifeIndex });
}

function createSnapshot(building, context) {
  const parcelId = firstKnown(building.parcel_id, building.parent_id);
  const templateType = normalizeTemplateType(
    firstKnown(building.template_type, building.building_template, building.building_type)
  );
  const template = templateType === UNKNOWN_VALUE
    ? UNKNOWN_VALUE
    : TEMPLATE_DEFINITIONS[templateType];
  const templateId = optionalIdentifier(building.template_id, `buildings/${building.id}/template_id`);
  if (templateId !== UNKNOWN_VALUE && template !== UNKNOWN_VALUE) {
    invariant(templateId === template.id, `buildings/${building.id} template_id does not match building type`);
  }
  const roomIds = identifierList(building.room_ids, `buildings/${building.id}/room_ids`, { required: true }).ids;
  const rooms = roomIds.map((roomId) => normalizeRoomReference(context.roomIndex.get(roomId)));
  const level = optionalInteger(
    firstKnown(building.level, building.building_level),
    `buildings/${building.id}/level`,
    { minimum: 1 }
  );
  const health = optionalMetric(
    firstKnown(building.health, building.building_health),
    `buildings/${building.id}/health`
  );
  const capacitySource = isRecord(building.capacity)
    ? firstKnown(building.capacity.total, building.capacity.people, building.capacity.occupants)
    : firstKnown(building.capacity, building.building_capacity);
  const capacity = optionalInteger(
    capacitySource,
    `buildings/${building.id}/capacity`
  );
  const lifecycle = normalizeLifecycle(building);
  const linkedProfiles = context.lifeProfiles.filter((profile) => profile.building_id === building.id);

  return Object.freeze({
    buildingId: building.id,
    label: optionalIdentifier(building.label, `buildings/${building.id}/label`),
    parcelId,
    templateId,
    templateType,
    template,
    level,
    health,
    capacity,
    lifecycle,
    lifecycleState: lifecycle.state,
    lifecycleHistory: lifecycle.history,
    occupancy: occupantSummary(building, roomIds.map((id) => context.roomIndex.get(id)), linkedProfiles, capacity),
    roomIds: Object.freeze([...roomIds]),
    rooms: Object.freeze(rooms),
    status: optionalIdentifier(building.status, `buildings/${building.id}/status`),
    dataFreshness: optionalIdentifier(building.data_freshness, `buildings/${building.id}/data_freshness`),
    source: optionalIdentifier(building.source, `buildings/${building.id}/source`),
    synthetic: true,
    readOnly: true
  });
}

/**
 * Build an immutable projection over the synthetic fixture. The runtime never
 * writes to the supplied world and rejects broken ownership or parent links.
 */
export function createBuildingRuntime({ world } = {}) {
  const source = normalizeWorld(world);
  const buildings = requireCollection(source, "buildings");
  const parcels = requireCollection(source, "parcels");
  const rooms = requireCollection(source, "rooms");
  const lifeProfiles = requireCollection(source, "lifeProfiles");
  const indexes = validateRelationships({ buildings, parcels, rooms, lifeProfiles });
  const context = Object.freeze({ ...indexes, lifeProfiles });
  const snapshots = buildings.map((building) => createSnapshot(building, context));
  const snapshotIndex = new Map(snapshots.map((snapshot) => [snapshot.buildingId, snapshot]));
  const unknownProjectionCount = snapshots.reduce((count, snapshot) => count + [
    snapshot.templateType,
    snapshot.level,
    snapshot.health,
    snapshot.capacity,
    snapshot.lifecycleState,
    snapshot.lifecycleHistory
  ].filter((value) => value === UNKNOWN_VALUE).length, 0);
  const report = Object.freeze({
    ok: true,
    runtime: "BUILDING_RUNTIME_ALPHA",
    mode: "READ_ONLY_SYNTHETIC_PROJECTION",
    templateCount: BUILDING_TEMPLATE_TYPES.length,
    buildingCount: snapshots.length,
    roomCount: rooms.length,
    parcelCount: parcels.length,
    lifeProfileCount: lifeProfiles.length,
    unknownProjectionCount,
    violations: Object.freeze([])
  });

  return Object.freeze({
    getTemplate(type) {
      const templateType = normalizeTemplateType(type);
      return templateType === UNKNOWN_VALUE ? null : TEMPLATE_DEFINITIONS[templateType];
    },
    listTemplates() {
      return Object.freeze(BUILDING_TEMPLATE_TYPES.map((type) => TEMPLATE_DEFINITIONS[type]));
    },
    getBuildingSnapshot(buildingId) {
      if (!isKnown(buildingId)) return null;
      return snapshotIndex.get(String(buildingId)) ?? null;
    },
    listByParcel(parcelId) {
      if (!isKnown(parcelId)) return Object.freeze([]);
      const normalized = String(parcelId);
      return Object.freeze(snapshots.filter((snapshot) => snapshot.parcelId === normalized));
    },
    integrityReport() {
      return report;
    }
  });
}
