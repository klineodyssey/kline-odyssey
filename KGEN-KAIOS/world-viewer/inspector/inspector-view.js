import {
  UNKNOWN_VALUE,
  projectLifeProfile,
  resolveLifeProfiles
} from "../life/life-os-viewer.js";

export const INSPECTOR_ENTITY_TYPES = Object.freeze([
  "EARTH",
  "REGION",
  "CITY",
  "PARCEL",
  "BUILDING",
  "ROOM"
]);

const COLLECTION_TYPES = Object.freeze([
  ["PARCEL", "parcels"],
  ["BUILDING", "buildings"],
  ["ROOM", "rooms"]
]);

const REQUIRED_FIELD_LABELS = Object.freeze([
  "Owner",
  "Governor",
  "Parcel ID",
  "Global UID",
  "Coordinate",
  "Surface K",
  "Area",
  "Current Land Use",
  "Proposed Land Use",
  "Buildings",
  "Population",
  "AI Workers",
  "Protection Zone",
  "Tax Authority",
  "Defense Authority",
  "Airspace Authority",
  "Data Freshness",
  "Source"
]);

const LIFE_RUNTIME_ACTIONS = Object.freeze([
  "EAT",
  "DRINK",
  "SLEEP",
  "WAKE",
  "WORK"
]);

const RUNTIME_COLLECTION_LIMIT = 32;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isKnown(value) {
  return value !== undefined && value !== null && value !== "";
}

function firstKnown(...values) {
  return values.find(isKnown);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeId(value) {
  return isKnown(value) ? String(value) : null;
}

function selectionId(selection) {
  if (typeof selection === "string" || typeof selection === "number") {
    return String(selection);
  }
  if (!isRecord(selection)) return null;
  return normalizeId(
    firstKnown(
      selection.selectedId,
      selection.selected_id,
      selection.objectId,
      selection.object_id,
      selection.id
    )
  );
}

function normalizeEntityType(value) {
  if (!isKnown(value)) return null;
  const type = String(value).toUpperCase();
  if (["PLANET", "EARTH_K280"].includes(type)) return "EARTH";
  if (["CITY_OVERLAY", "COUNTY", "TOWN"].includes(type)) return "CITY";
  if (["LAND_PARCEL", "PARCEL_OVERLAY"].includes(type)) return "PARCEL";
  return type;
}

function requestedEntityType(selection) {
  if (!isRecord(selection)) return null;
  const type = firstKnown(
    selection.entityType,
    selection.entity_type,
    selection.objectType,
    selection.object_type,
    selection.type
  );
  return normalizeEntityType(type);
}

function rootCandidates(world) {
  return [
    ["EARTH", world?.earth],
    ["REGION", world?.region],
    ...asArray(world?.regions).map((entity) => ["REGION", entity]),
    ["CITY", world?.cityOverlay ?? world?.city],
    ...asArray(world?.cities).map((entity) => ["CITY", entity])
  ];
}

function inferEntityType(world, entity) {
  const declared = requestedEntityType(entity);
  if (INSPECTOR_ENTITY_TYPES.includes(declared)) return declared;

  for (const [type, candidate] of rootCandidates(world)) {
    if (candidate === entity) return type;
  }
  for (const [type, collectionName] of COLLECTION_TYPES) {
    if (asArray(world?.[collectionName]).includes(entity)) return type;
  }
  return null;
}

/** Resolve only the six approved World Viewer semantic entity types. */
export function resolveInspectorEntity(world, selection) {
  if (!isRecord(world)) return null;

  if (isRecord(selection?.entity)) {
    const explicitType = requestedEntityType(selection) ?? inferEntityType(world, selection.entity);
    if (!INSPECTOR_ENTITY_TYPES.includes(explicitType)) return null;
    return {
      type: explicitType,
      id: normalizeId(selection.entity.id),
      entity: selection.entity
    };
  }

  const id = selectionId(selection);
  const typeHint = requestedEntityType(selection);

  for (const [type, entity] of rootCandidates(world)) {
    if (!isRecord(entity)) continue;
    if ((typeHint === type && !id) || normalizeId(entity.id) === id) {
      return { type, id: normalizeId(entity.id), entity };
    }
  }

  for (const [type, collectionName] of COLLECTION_TYPES) {
    if (typeHint && typeHint !== type) continue;
    const entity = asArray(world[collectionName]).find(
      (candidate) => isRecord(candidate) && normalizeId(candidate.id) === id
    );
    if (entity) return { type, id, entity };
  }

  if (!id && !typeHint && isRecord(world.earth)) {
    return { type: "EARTH", id: normalizeId(world.earth.id), entity: world.earth };
  }

  return null;
}

function formatScalar(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (typeof value === "boolean") return value ? "YES" : "NO";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : UNKNOWN_VALUE;
  if (typeof value === "string") return value;
  return UNKNOWN_VALUE;
}

function formatCoordinate(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (Array.isArray(value)) {
    return value.length ? value.map(formatScalar).join(", ") : UNKNOWN_VALUE;
  }
  if (!isRecord(value)) return formatScalar(value);

  const latitude = firstKnown(value.latitude_deg, value.latitude, value.lat);
  const longitude = firstKnown(value.longitude_deg, value.longitude, value.lon, value.lng);
  const altitude = firstKnown(value.altitude_m, value.altitude, value.alt_m);
  if (isKnown(latitude) || isKnown(longitude) || isKnown(altitude)) {
    return [
      `lat ${formatScalar(latitude)}`,
      `lon ${formatScalar(longitude)}`,
      `alt ${formatScalar(altitude)} m`
    ].join(", ");
  }

  const x = firstKnown(value.x, value.camera_x, value.screen_x);
  const y = firstKnown(value.y, value.camera_y, value.screen_y);
  if (isKnown(x) || isKnown(y)) {
    return `x ${formatScalar(x)}, y ${formatScalar(y)}`;
  }

  if (Array.isArray(value.bounds) && value.bounds.length > 0) {
    const prefix = isKnown(value.shape) ? `${formatScalar(value.shape)} ` : "";
    return `${prefix}bounds ${value.bounds.map(formatScalar).join(", ")}`;
  }

  return UNKNOWN_VALUE;
}

function formatArea(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  const formatted = formatScalar(value);
  return formatted === UNKNOWN_VALUE ? UNKNOWN_VALUE : `${formatted} m2`;
}

function formatCollection(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (Array.isArray(value)) {
    if (value.length === 0) return "0";
    return value.map((entry) => {
      if (isRecord(entry)) return formatScalar(firstKnown(entry.label, entry.name, entry.id));
      return formatScalar(entry);
    }).join(", ");
  }
  if (isRecord(value)) return formatScalar(firstKnown(value.label, value.name, value.id));
  return formatScalar(value);
}

function formatLinkedCollection(value, candidates = [], { includeCount = false } = {}) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (!Array.isArray(value)) return formatCollection(value);
  if (value.length === 0) return "0";
  const labels = value.map((entry) => {
    if (isRecord(entry)) return formatScalar(firstKnown(entry.label, entry.display_name, entry.name, entry.id));
    const id = normalizeId(entry);
    const match = candidates.find((candidate) => normalizeId(candidate?.id) === id);
    return formatScalar(firstKnown(match?.label, match?.display_name, match?.name, match?.id, entry));
  });
  return includeCount ? `${value.length} / ${labels.join(", ")}` : labels.join(", ");
}

function surfaceK(entity, world) {
  const canonical = isRecord(entity?.canonical) ? entity.canonical : {};
  const direct = firstKnown(
    entity?.surface_k,
    entity?.surfaceK,
    canonical.surface_k,
    world?.earth?.surface_k,
    world?.earth?.surfaceK
  );
  if (isKnown(direct)) return formatScalar(direct).startsWith("K") ? formatScalar(direct) : `K${direct}`;

  const frame = firstKnown(canonical.coordinate_frame, entity?.coordinate_frame, world?.earth?.coordinate_frame);
  const match = typeof frame === "string" ? frame.match(/^K(\d+)/i) : null;
  return match ? `K${match[1]}` : UNKNOWN_VALUE;
}

function matchingProposal(proposal, entityId) {
  const proposals = asArray(proposal);
  return proposals.find((candidate) => {
    if (!isRecord(candidate)) return false;
    return normalizeId(firstKnown(candidate.parcel_id, candidate.entity_id, candidate.object_id)) === entityId;
  }) ?? null;
}

function parentParcel(world, resolved) {
  if (resolved.type === "PARCEL") return resolved.entity;

  let parcelId = null;
  if (resolved.type === "BUILDING") {
    parcelId = normalizeId(resolved.entity.parcel_id);
  } else if (resolved.type === "ROOM") {
    const buildingId = normalizeId(resolved.entity.building_id);
    const building = asArray(world.buildings).find(
      (candidate) => isRecord(candidate) && normalizeId(candidate.id) === buildingId
    );
    parcelId = normalizeId(building?.parcel_id);
  }

  return asArray(world.parcels).find(
    (candidate) => isRecord(candidate) && normalizeId(candidate.id) === parcelId
  ) ?? null;
}

function dataFreshness(entity, meta) {
  const direct = firstKnown(entity.data_freshness, entity.generated_at, meta.generated_at);
  if (isKnown(direct)) return formatScalar(direct);
  return ["STALE", "RESTRICTED", "UNKNOWN"].includes(entity.status)
    ? entity.status
    : UNKNOWN_VALUE;
}

function relatedBuildings(world, resolved) {
  const buildings = asArray(world.buildings).filter(isRecord);
  const explicit = firstKnown(resolved.entity.buildings, resolved.entity.building_ids);
  if (isKnown(explicit)) return formatLinkedCollection(explicit, buildings, { includeCount: true });
  if (resolved.type === "BUILDING") return formatCollection([resolved.entity]);
  if (resolved.type === "ROOM") {
    const buildingId = normalizeId(resolved.entity.building_id);
    const building = buildings.find((candidate) => normalizeId(candidate.id) === buildingId);
    return building ? formatCollection([building]) : UNKNOWN_VALUE;
  }
  if (resolved.type !== "PARCEL") return UNKNOWN_VALUE;

  const matches = buildings.filter(
    (building) => isRecord(building) && normalizeId(building.parcel_id) === resolved.id
  );
  return matches.length ? `${matches.length} / ${formatCollection(matches)}` : "0";
}

function relatedAiWorkers(world, resolved) {
  const profiles = [
    ...asArray(world.lifeProfiles),
    ...asArray(world.aiWorkers)
  ].filter(isRecord);
  const explicit = firstKnown(
    resolved.entity.ai_workers,
    resolved.entity.aiWorkers,
    resolved.entity.ai_worker_ids,
    resolved.entity.aiWorkerIds,
    resolved.entity.ai_worker_count
  );
  if (isKnown(explicit)) {
    return Array.isArray(explicit)
      ? formatLinkedCollection(explicit, profiles, { includeCount: true })
      : formatScalar(explicit);
  }

  const relationField = resolved.type === "PARCEL"
    ? "parcel_id"
    : resolved.type === "BUILDING"
      ? "building_id"
      : resolved.type === "ROOM"
        ? "room_id"
        : null;
  if (!relationField) return UNKNOWN_VALUE;

  const matches = profiles.filter(
    (worker) => normalizeId(worker[relationField]) === resolved.id
      && String(firstKnown(worker.life_type, worker.species_code, "")).toUpperCase().includes("AI")
  );
  return matches.length
    ? `${matches.length} / ${formatCollection(matches)}`
    : "0";
}

function canonicalCoordinate(entity) {
  const canonical = isRecord(entity.canonical) ? entity.canonical : {};
  return formatCoordinate(firstKnown(
    entity.canonical_coordinate,
    canonical.coordinate,
    canonical.earth_surface_position,
    Object.keys(canonical).length ? canonical : null,
    entity.coordinate
  ));
}

function projectedCoordinate(entity) {
  return formatCoordinate(firstKnown(
    entity.projected_screen_coordinate,
    entity.viewer_coordinate,
    entity.view,
    entity.viewer
  ));
}

function rowsToObject(rows) {
  return Object.fromEntries(rows.map(([label, value]) => [label, value]));
}

function runtimeItems(value) {
  if (!isKnown(value) || value === UNKNOWN_VALUE) return [];
  if (Array.isArray(value)) return value.filter(isRecord).slice(0, RUNTIME_COLLECTION_LIMIT);
  if (!isRecord(value)) return [];

  if (isRecord(value.snapshot)) return [value.snapshot];

  for (const key of ["snapshots", "items", "values", "records"]) {
    if (Array.isArray(value[key])) {
      return value[key].filter(isRecord).slice(0, RUNTIME_COLLECTION_LIMIT);
    }
  }
  return [value];
}

function runtimeSource(runtime, name) {
  if (!isRecord(runtime)) return null;
  return firstKnown(
    runtime[name],
    runtime[`${name}Snapshot`],
    runtime[`${name}_snapshot`],
    runtime[`${name}Snapshots`],
    runtime[`${name}_snapshots`],
    runtime[`${name}s`]
  );
}

function runtimeIdentifier(value, keys) {
  if (!isRecord(value)) return null;
  return normalizeId(firstKnown(...keys.map((key) => value[key])));
}

function selectRuntimeItem(items, preferredIds, keys, relation = null) {
  const ids = preferredIds.filter(isKnown).map(String);
  const exact = items.find((item) => ids.includes(runtimeIdentifier(item, keys)));
  if (exact) return exact;
  if (typeof relation === "function") {
    const related = items.find(relation);
    if (related) return related;
  }
  return items[0] ?? null;
}

function historyEntryLabel(entry) {
  if (!isRecord(entry)) return formatScalar(entry);
  const identity = firstKnown(
    entry.revision_id,
    entry.proposal_id,
    entry.event_id,
    entry.transfer_id,
    entry.id,
    entry.local_version,
    entry.parcel_version,
    entry.version
  );
  const state = firstKnown(
    entry.event_type,
    entry.review_status,
    entry.status,
    entry.owner_id,
    entry.to_owner_id,
    entry.requested_land_use
  );
  if (!isKnown(identity) && !isKnown(state)) return UNKNOWN_VALUE;
  return [identity, state].filter(isKnown).map(formatScalar).join(" / ");
}

function formatHistory(value) {
  if (!isKnown(value) || value === UNKNOWN_VALUE || !Array.isArray(value)) return UNKNOWN_VALUE;
  if (value.length === 0) return "0";
  const recent = value.slice(-3).map(historyEntryLabel).filter((label) => label !== UNKNOWN_VALUE);
  return recent.length ? `${value.length} / ${recent.join(", ")}` : String(value.length);
}

function formatRuntimeCollection(value) {
  if (!isKnown(value) || value === UNKNOWN_VALUE) return UNKNOWN_VALUE;
  if (!Array.isArray(value)) return formatCollection(value);
  if (value.length === 0) return "0";
  const labels = value.map((entry) => {
    if (!isRecord(entry)) return formatScalar(entry);
    return formatScalar(firstKnown(
      entry.label,
      entry.displayName,
      entry.display_name,
      entry.name,
      entry.life_id,
      entry.buildingId,
      entry.building_id,
      entry.roomId,
      entry.room_id,
      entry.id
    ));
  });
  return `${value.length} / ${labels.join(", ")}`;
}

function formatCapacity(value) {
  if (!isKnown(value) || value === UNKNOWN_VALUE) return UNKNOWN_VALUE;
  if (!isRecord(value)) return formatScalar(value);
  const total = firstKnown(value.total, value.people, value.occupants, value.capacity);
  const used = firstKnown(
    value.used,
    value.occupied,
    value.occupantCount,
    value.occupant_count,
    value.resolvedLifeCount,
    value.roomOccupantCount,
    value.declaredPopulation
  );
  if (isKnown(total) && isKnown(used)) return `${formatScalar(used)} / ${formatScalar(total)}`;
  return formatScalar(firstKnown(total, used));
}

function formatInventory(value) {
  if (!isKnown(value) || value === UNKNOWN_VALUE) return UNKNOWN_VALUE;
  if (Array.isArray(value)) return formatRuntimeCollection(value);
  if (!isRecord(value)) return formatScalar(value);
  const entries = Object.entries(value);
  if (entries.length === 0) return "0";
  return entries.map(([name, quantity]) => `${name} ${formatScalar(quantity)}`).join(", ");
}

function selectedRevisionId(land) {
  const selected = land?.revision_viewer?.selected_revision;
  return normalizeId(firstKnown(
    selected?.revision_id,
    selected?.id,
    selected?.local_version,
    selected?.parcel_version,
    land?.selected_revision_id
  ));
}

function resolveRuntimeLife(items, resolved) {
  if (items.length <= 1) return items;
  const relationKey = resolved.type === "PARCEL"
    ? ["parcel_id", "parcelId"]
    : resolved.type === "BUILDING"
      ? ["building_id", "buildingId"]
      : resolved.type === "ROOM"
        ? ["room_id", "roomId"]
        : [];
  if (relationKey.length === 0) return items;
  const related = items.filter((item) => (
    relationKey.some((key) => normalizeId(item[key]) === resolved.id)
  ));
  return related.length ? related : items;
}

/** Project optional Sprint 003 runtime snapshots without mutating their source. */
export function createInspectorRuntimeProjection({ runtime = {}, resolved, parcelId } = {}) {
  const safeResolved = isRecord(resolved) ? resolved : { type: null, id: null, entity: {} };
  const entity = isRecord(safeResolved.entity) ? safeResolved.entity : {};
  const resolvedParcelId = normalizeId(firstKnown(
    parcelId,
    entity.parcel_id,
    safeResolved.type === "PARCEL" ? safeResolved.id : null
  ));
  const resolvedBuildingId = normalizeId(firstKnown(
    entity.building_id,
    safeResolved.type === "BUILDING" ? safeResolved.id : null
  ));
  const resolvedRoomId = normalizeId(
    safeResolved.type === "ROOM" ? safeResolved.id : entity.room_id
  );

  const landItems = runtimeItems(runtimeSource(runtime, "land"));
  const buildingItems = runtimeItems(runtimeSource(runtime, "building"));
  const roomItems = runtimeItems(runtimeSource(runtime, "room"));
  const playerItems = runtimeItems(runtimeSource(runtime, "player"));
  const lifeItems = resolveRuntimeLife(runtimeItems(runtimeSource(runtime, "life")), safeResolved);

  const land = selectRuntimeItem(
    landItems,
    [resolvedParcelId],
    ["parcel_id", "parcelId", "id"]
  );
  const building = selectRuntimeItem(
    buildingItems,
    [resolvedBuildingId],
    ["buildingId", "building_id", "id"],
    (item) => normalizeId(firstKnown(item.parcelId, item.parcel_id)) === resolvedParcelId
  );
  const room = selectRuntimeItem(
    roomItems,
    [resolvedRoomId],
    ["roomId", "room_id", "id"],
    (item) => normalizeId(firstKnown(item.buildingId, item.building_id))
      === normalizeId(firstKnown(resolvedBuildingId, building?.buildingId, building?.building_id))
  );
  const player = playerItems[0] ?? null;
  const revisions = asArray(land?.revision_history).filter(isRecord).slice(-RUNTIME_COLLECTION_LIMIT);
  const buildingLifecycle = firstKnown(
    building?.lifecycleState,
    building?.lifecycle_state,
    building?.lifecycle?.state,
    building?.life_cycle,
    building?.lifecycle
  );
  const roomContents = isRecord(room?.contents) ? room.contents : {};
  const roomOccupancy = isRecord(room?.occupancy) ? room.occupancy : {};
  const playerPosition = firstKnown(player?.position, player?.coordinate);

  const life = lifeItems.map((snapshot) => Object.freeze({
    source: snapshot,
    data: Object.freeze(rowsToObject([
      ["Life ID", formatScalar(firstKnown(snapshot.life_id, snapshot.lifeId, snapshot.id))],
      ["Health", formatScalar(snapshot.health)],
      ["Food", formatScalar(snapshot.food)],
      ["Water", formatScalar(snapshot.water)],
      ["Energy", formatScalar(snapshot.energy)],
      ["Age (days)", formatScalar(firstKnown(snapshot.age_days, snapshot.ageDays, snapshot.age))],
      ["Occupation", formatScalar(snapshot.occupation)],
      ["Activity", formatScalar(firstKnown(snapshot.activity_state, snapshot.activityState))],
      ["Life State", formatScalar(firstKnown(snapshot.life_state, snapshot.lifeState))],
      ["Inventory", formatInventory(snapshot.inventory)],
      ["Revision", formatScalar(snapshot.revision)]
    ]))
  }));

  return Object.freeze({
    land: Object.freeze({
      source: land,
      revisions: Object.freeze(revisions),
      data: Object.freeze(rowsToObject([
        ["Parcel Version", formatScalar(firstKnown(land?.local_parcel_version, land?.parcel_version, land?.version))],
        ["Canonical Version", formatScalar(firstKnown(land?.canonical_parcel_version, land?.canonical_version))],
        ["Selected Revision", formatScalar(selectedRevisionId(land))],
        ["Revision History", formatHistory(land?.revision_history)],
        ["Proposal History", formatHistory(land?.proposal_history)],
        ["Ownership Timeline", formatHistory(land?.ownership_timeline)],
        ["Active Draft", formatScalar(firstKnown(land?.active_draft?.proposal_id, land?.draft?.proposal_id))],
        ["Draft Storage", formatScalar(firstKnown(land?.storage_status, land?.active_draft?.local_saved))]
      ]))
    }),
    building: Object.freeze({
      source: building,
      data: Object.freeze(rowsToObject([
        ["Building ID", formatScalar(firstKnown(building?.buildingId, building?.building_id, building?.id))],
        ["Template / Type", formatScalar(firstKnown(
          building?.templateType,
          building?.template_type,
          building?.building_type,
          building?.template?.label,
          building?.template?.name,
          building?.template?.id
        ))],
        ["Level", formatScalar(firstKnown(building?.level, building?.building_level))],
        ["Health", formatScalar(firstKnown(building?.health, building?.building_health))],
        ["Capacity", formatCapacity(firstKnown(building?.capacity, building?.building_capacity))],
        ["Occupancy", formatCapacity(building?.occupancy)],
        ["Lifecycle", formatScalar(buildingLifecycle)],
        ["Rooms", formatRuntimeCollection(firstKnown(building?.rooms, building?.roomIds, building?.room_ids))]
      ]))
    }),
    room: Object.freeze({
      source: room,
      data: Object.freeze(rowsToObject([
        ["Room ID", formatScalar(firstKnown(room?.roomId, room?.room_id, room?.id))],
        ["Room Type", formatScalar(firstKnown(room?.roomType, room?.room_type))],
        ["Capacity", formatCapacity(room?.capacity)],
        ["Occupants", formatRuntimeCollection(firstKnown(
          roomOccupancy.resolvedOccupants,
          roomOccupancy.occupants,
          roomOccupancy.occupantIds,
          room?.occupants
        ))],
        ["Furniture", formatRuntimeCollection(firstKnown(roomContents.furniture, room?.furniture))],
        ["Equipment", formatRuntimeCollection(firstKnown(roomContents.equipment, room?.equipment))],
        ["Organisms", formatRuntimeCollection(firstKnown(roomContents.organisms, room?.organisms))],
        ["Life", formatRuntimeCollection(firstKnown(roomContents.life, room?.life))],
        ["Content Chain", formatScalar(firstKnown(roomContents.chainStatus, room?.chain_status))]
      ]))
    }),
    player: Object.freeze({
      source: player,
      data: Object.freeze(rowsToObject([
        ["Session", formatScalar(firstKnown(player?.sessionId, player?.session_id))],
        ["Player", formatScalar(firstKnown(player?.player?.display_name, player?.player?.player_id, player?.player_id))],
        ["Current Entity", formatScalar(firstKnown(
          player?.currentEntity?.label,
          player?.currentEntity?.id,
          player?.current_entity?.id
        ))],
        ["Position", formatCoordinate(playerPosition)],
        ["Movement", formatScalar(firstKnown(player?.movementState, player?.movement_state))],
        ["Facing", formatScalar(player?.facing)],
        ["Steps", formatScalar(firstKnown(player?.stepCount, player?.step_count))]
      ]))
    }),
    life: Object.freeze(life)
  });
}

/** Build the four-group read-only Inspector projection. */
export function createInspectorProjection({
  world = {},
  selection = null,
  proposal = null,
  viewerState = {},
  runtime = {}
} = {}) {
  const resolved = resolveInspectorEntity(world, selection);
  if (!resolved) return null;

  const entity = resolved.entity;
  const canonical = isRecord(entity.canonical) ? entity.canonical : {};
  const meta = isRecord(world.meta) ? world.meta : {};
  const draft = matchingProposal(proposal, resolved.id);
  const parcel = parentParcel(world, resolved);
  const parcelCanonical = isRecord(parcel?.canonical) ? parcel.canonical : {};
  const entityCoordinate = canonicalCoordinate(entity);
  const coordinate = entityCoordinate === UNKNOWN_VALUE && parcel && parcel !== entity
    ? canonicalCoordinate(parcel)
    : entityCoordinate;

  const canonicalRows = [
    ["Owner", formatScalar(firstKnown(entity.owner_id, entity.owner, parcel?.owner_id, parcel?.owner))],
    ["Governor", formatScalar(firstKnown(
      entity.viewer_governor,
      entity.governor_id,
      entity.governor,
      parcel?.governor_id,
      parcel?.governor
    ))],
    ["Parcel ID", formatScalar(firstKnown(
      canonical.parcel_id,
      parcelCanonical.parcel_id,
      parcel?.id,
      resolved.type === "PARCEL" ? entity.id : undefined
    ))],
    ["Global UID", formatScalar(firstKnown(canonical.global_uid, entity.global_uid, parcelCanonical.global_uid))],
    ["Coordinate", coordinate],
    ["Surface K", surfaceK(entity, world)],
    ["Area", formatArea(firstKnown(entity.area_m2, canonical.area_m2, canonical.ground_m2, parcel?.area_m2))],
    ["Current Land Use", formatScalar(firstKnown(
      entity.current_land_use,
      entity.land_use,
      parcel?.current_land_use,
      parcel?.land_use
    ))],
    ["Protection Zone", formatScalar(firstKnown(entity.protection_zone, entity.zone_type, parcel?.protection_zone))],
    ["Tax Authority", formatScalar(firstKnown(entity.tax_authority_id, entity.tax_authority, parcel?.tax_authority_id))],
    ["Defense Authority", formatScalar(firstKnown(entity.defense_authority_id, entity.defense_authority, parcel?.defense_authority_id))],
    ["Airspace Authority", formatScalar(firstKnown(entity.airspace_authority_id, entity.airspace_authority, parcel?.airspace_authority_id))],
    ["Source", formatScalar(firstKnown(entity.source, canonical.source, parcel?.source, meta.source))]
  ];

  const viewerRows = [
    ["Entity Type", resolved.type],
    ["Label", formatScalar(firstKnown(entity.label, entity.name))],
    ["Projected Coordinate", projectedCoordinate(entity)],
    ["LOD", formatScalar(firstKnown(viewerState.lod, viewerState.lod_level, entity.lod))],
    ["Visibility", formatScalar(firstKnown(viewerState.visibility, entity.visibility, entity.status))],
    ["Buildings", relatedBuildings(world, resolved)],
    ["Population", formatScalar(firstKnown(entity.population, entity.population_count, parcel?.population))],
    ["AI Workers", relatedAiWorkers(world, resolved)],
    ["Data Freshness", dataFreshness(entity, meta)],
    ["Source Revision", formatScalar(firstKnown(entity.source_revision, canonical.source_revision, meta.source_revision))]
  ];

  const proposalRows = [
    ["Proposal ID", formatScalar(firstKnown(draft?.proposal_id, draft?.intent_id, draft?.id))],
    ["Proposed Land Use", formatScalar(firstKnown(draft?.requested_land_use, draft?.land_use))],
    ["Review Status", formatScalar(firstKnown(draft?.review_status, draft?.status))],
    ["Estimated Cost", formatScalar(draft?.estimated_cost)],
    ["Environmental Impact", formatScalar(draft?.environment_impact)],
    ["Neighbor Impact", formatScalar(draft?.neighbor_impact)]
  ];

  const combined = new Map([...canonicalRows, ...viewerRows, ...proposalRows]);
  const unknownRows = REQUIRED_FIELD_LABELS
    .filter((label) => !combined.has(label) || combined.get(label) === UNKNOWN_VALUE)
    .map((label) => [label, UNKNOWN_VALUE]);
  if (unknownRows.length === 0) unknownRows.push(["Missing Fields", "NONE"]);

  const lifeProfiles = resolveLifeProfiles({ world, entity });
  const runtimeProjection = createInspectorRuntimeProjection({
    runtime,
    resolved,
    parcelId: firstKnown(
      canonical.parcel_id,
      parcelCanonical.parcel_id,
      parcel?.id,
      resolved.type === "PARCEL" ? entity.id : undefined
    )
  });
  return Object.freeze({
    type: resolved.type,
    id: resolved.id,
    entity,
    canonicalData: Object.freeze(rowsToObject(canonicalRows)),
    viewerData: Object.freeze(rowsToObject(viewerRows)),
    proposalData: Object.freeze(rowsToObject(proposalRows)),
    unknownData: Object.freeze(rowsToObject(unknownRows)),
    lifeProfiles: Object.freeze(lifeProfiles.map(projectLifeProfile)),
    lifeProfileSources: Object.freeze([...lifeProfiles]),
    runtime: runtimeProjection
  });
}

function createElement(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

function renderDataGroup(documentRef, title, values, modifier) {
  const section = createElement(
    documentRef,
    "section",
    `inspector-view__group inspector-view__group--${modifier}`
  );
  section.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", title));
  const list = createElement(documentRef, "dl", "inspector-view__data");

  Object.entries(values).forEach(([label, value]) => {
    const term = createElement(documentRef, "dt", "inspector-view__label", label);
    const detail = createElement(
      documentRef,
      "dd",
      value === UNKNOWN_VALUE
        ? "inspector-view__value inspector-view__value--unknown"
        : "inspector-view__value",
      value
    );
    list.append(term, detail);
  });

  section.appendChild(list);
  return section;
}

function renderLandLifeSummary(documentRef, projection) {
  const lifeNames = projection.lifeProfiles.map((profile) => (
    profile.displayName === UNKNOWN_VALUE ? profile.lifeId : profile.displayName
  ));
  const rows = [
    ["Owner", projection.canonicalData.Owner],
    ["Parcel ID", projection.canonicalData["Parcel ID"]],
    ["K280", projection.canonicalData["Surface K"]],
    ["Coordinate", projection.canonicalData.Coordinate],
    ["Land Use", projection.canonicalData["Current Land Use"]],
    ["Building", projection.viewerData.Buildings],
    ["Life", lifeNames.length ? `${lifeNames.length} / ${lifeNames.join(", ")}` : "0"],
    ["AI Worker", projection.viewerData["AI Workers"]]
  ];
  const section = createElement(documentRef, "section", "inspector-view__summary");
  section.setAttribute("aria-label", "Land and life summary");
  section.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", "Land and Life"));
  const list = createElement(documentRef, "dl", "inspector-view__summary-data");
  rows.forEach(([label, value]) => {
    list.append(
      createElement(documentRef, "dt", "inspector-view__summary-label", label),
      createElement(
        documentRef,
        "dd",
        value === UNKNOWN_VALUE
          ? "inspector-view__summary-value inspector-view__value--unknown"
          : "inspector-view__summary-value",
        value
      )
    );
  });
  section.appendChild(list);
  return section;
}

function actionButton(documentRef, label, className, handler, options = {}) {
  const button = createElement(documentRef, "button", className, label);
  button.type = "button";
  button.title = options.title ?? label;
  button.setAttribute("aria-label", options.ariaLabel ?? label);
  button.style.minHeight = "44px";
  if (options.expanded !== undefined) {
    button.setAttribute("aria-expanded", String(options.expanded));
  }
  if (options.pressed !== undefined) {
    button.setAttribute("aria-pressed", String(options.pressed));
  }
  if (options.disabled) button.disabled = true;
  if (typeof handler === "function") button.addEventListener("click", handler);
  return button;
}

function runtimeCommandBar(documentRef, label) {
  const commands = createElement(documentRef, "div", "inspector-view__runtime-commands");
  commands.setAttribute("role", "group");
  commands.setAttribute("aria-label", label);
  commands.style.display = "grid";
  commands.style.gridTemplateColumns = "repeat(auto-fit, minmax(112px, 1fr))";
  commands.style.gap = "7px";
  commands.style.marginTop = "10px";
  return commands;
}

function runtimeCommandButton(documentRef, label, handler, options = {}) {
  return actionButton(
    documentRef,
    label,
    "inspector-view__life-action inspector-view__runtime-action",
    handler,
    options
  );
}

function renderLandRuntime(documentRef, projection, callbacks) {
  const runtime = projection.runtime.land;
  const source = runtime.source;
  const section = renderDataGroup(documentRef, "Land History", runtime.data, "land-runtime");
  const commands = runtimeCommandBar(documentRef, "Land history commands");
  commands.append(
    runtimeCommandButton(
      documentRef,
      "Undo",
      () => callbacks.onUndoLand?.(source, projection),
      {
        disabled: source?.can_undo !== true || typeof callbacks.onUndoLand !== "function",
        ariaLabel: "Undo latest local land draft command"
      }
    ),
    runtimeCommandButton(
      documentRef,
      "Redo",
      () => callbacks.onRedoLand?.(source, projection),
      {
        disabled: source?.can_redo !== true || typeof callbacks.onRedoLand !== "function",
        ariaLabel: "Redo latest local land draft command"
      }
    ),
    runtimeCommandButton(
      documentRef,
      "Save Draft",
      () => callbacks.onSaveDraft?.(source?.active_draft ?? source?.draft ?? null, source, projection),
      {
        disabled: !isRecord(source?.active_draft ?? source?.draft)
          || typeof callbacks.onSaveDraft !== "function",
        ariaLabel: "Save current land proposal draft locally"
      }
    )
  );
  section.appendChild(commands);

  if (runtime.revisions.length > 0) {
    const revisionCommands = runtimeCommandBar(documentRef, "Parcel revision selection");
    const currentRevisionId = selectedRevisionId(source);
    runtime.revisions.forEach((revision, index) => {
      const revisionId = normalizeId(firstKnown(
        revision.revision_id,
        revision.id,
        revision.local_version,
        revision.parcel_version,
        revision.version,
        index + 1
      ));
      revisionCommands.appendChild(runtimeCommandButton(
        documentRef,
        `Revision ${revisionId ?? index + 1}`,
        () => callbacks.onSelectRevision?.(revision, source, projection),
        {
          disabled: typeof callbacks.onSelectRevision !== "function",
          pressed: revisionId === currentRevisionId,
          ariaLabel: `Select parcel revision ${revisionId ?? index + 1}`
        }
      ));
    });
    section.appendChild(revisionCommands);
  }

  return section;
}

function runtimeEntityId(source, type) {
  if (type === "BUILDING") {
    return normalizeId(firstKnown(source?.buildingId, source?.building_id, source?.id));
  }
  return normalizeId(firstKnown(source?.roomId, source?.room_id, source?.id));
}

function renderEntityRuntime(documentRef, title, modifier, runtime, type, projection, callbacks) {
  const section = renderDataGroup(documentRef, title, runtime.data, modifier);
  const entityId = runtimeEntityId(runtime.source, type);
  const commands = runtimeCommandBar(documentRef, `${type.toLowerCase()} commands`);
  commands.appendChild(runtimeCommandButton(
    documentRef,
    `Enter ${type === "BUILDING" ? "Building" : "Room"}`,
    () => callbacks.onEnterEntity?.(runtime.source, projection),
    {
      disabled: !entityId || typeof callbacks.onEnterEntity !== "function",
      ariaLabel: entityId
        ? `Enter ${type.toLowerCase()} ${entityId}`
        : `Enter ${type.toLowerCase()}, unavailable`
    }
  ));
  section.appendChild(commands);
  return section;
}

function lifeActionDisabled(action, source, callback) {
  if (typeof callback !== "function" || !isRecord(source)) return true;
  const lifeState = String(firstKnown(source.life_state, source.lifeState, "")).toUpperCase();
  const activity = String(firstKnown(source.activity_state, source.activityState, "")).toUpperCase();
  if (lifeState === "DEAD") return true;
  if (action === "SLEEP") return activity === "SLEEPING";
  if (action === "WAKE") return activity !== "SLEEPING";
  if (action === "WORK") return source.occupation === "NOT_APPLICABLE";
  return false;
}

function unknownLifeRuntimeData() {
  return rowsToObject([
    ["Life ID", UNKNOWN_VALUE],
    ["Health", UNKNOWN_VALUE],
    ["Food", UNKNOWN_VALUE],
    ["Water", UNKNOWN_VALUE],
    ["Energy", UNKNOWN_VALUE],
    ["Age (days)", UNKNOWN_VALUE],
    ["Occupation", UNKNOWN_VALUE],
    ["Activity", UNKNOWN_VALUE],
    ["Life State", UNKNOWN_VALUE],
    ["Inventory", UNKNOWN_VALUE],
    ["Revision", UNKNOWN_VALUE]
  ]);
}

function renderLifeRuntime(documentRef, projection, callbacks) {
  const runtimes = projection.runtime.life.length
    ? projection.runtime.life
    : [{ source: null, data: unknownLifeRuntimeData() }];
  const fragment = createElement(documentRef, "div", "inspector-view__runtime-life");
  fragment.style.display = "contents";

  runtimes.forEach((runtime, index) => {
    const lifeId = formatScalar(firstKnown(
      runtime.source?.life_id,
      runtime.source?.lifeId,
      runtime.source?.id
    ));
    const title = runtimes.length === 1 || lifeId === UNKNOWN_VALUE
      ? "Life Simulation"
      : `Life Simulation: ${lifeId}`;
    const section = renderDataGroup(documentRef, title, runtime.data, `life-runtime-${index}`);
    const commands = runtimeCommandBar(documentRef, `${title} commands`);
    LIFE_RUNTIME_ACTIONS.forEach((action) => {
      commands.appendChild(runtimeCommandButton(
        documentRef,
        action[0] + action.slice(1).toLowerCase(),
        () => callbacks.onLifeAction?.(action, runtime.source, projection),
        {
          disabled: lifeActionDisabled(action, runtime.source, callbacks.onLifeAction),
          ariaLabel: lifeId === UNKNOWN_VALUE
            ? `${action.toLowerCase()} life, unavailable`
            : `${action.toLowerCase()} ${lifeId}`
        }
      ));
    });
    section.appendChild(commands);
    fragment.appendChild(section);
  });

  return fragment;
}

/** Render the responsive right-panel / mobile-bottom-sheet Inspector shell. */
export function renderInspectorView(container, input = {}, callbacks = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("Inspector container must be a DOM element");
  }
  const documentRef = container.ownerDocument ?? globalThis.document;
  if (!documentRef?.createElement) throw new TypeError("Inspector requires a DOM document");

  const projection = createInspectorProjection(input);
  const expanded = Boolean(input.expanded);
  const root = createElement(documentRef, "section", "inspector-view");
  root.dataset.desktopPosition = "right";
  root.dataset.mobilePosition = "bottom-sheet";
  root.dataset.expanded = String(expanded);
  root.setAttribute("aria-label", "World object inspector");

  const header = createElement(documentRef, "header", "inspector-view__header");
  header.appendChild(
    createElement(
      documentRef,
      "h2",
      "inspector-view__title",
      projection ? `${projection.type} Inspector` : "Inspector"
    )
  );
  const actions = createElement(documentRef, "div", "inspector-view__actions");
  actions.appendChild(actionButton(
    documentRef,
    expanded ? "Collapse" : "Expand",
    "inspector-view__action inspector-view__action--expand",
    () => callbacks.onToggleExpanded?.(!expanded, projection),
    { expanded, ariaLabel: expanded ? "Collapse inspector" : "Expand inspector" }
  ));
  actions.appendChild(actionButton(
    documentRef,
    "Close",
    "inspector-view__action inspector-view__action--close",
    () => callbacks.onClose?.(projection),
    { ariaLabel: "Close inspector" }
  ));
  header.appendChild(actions);
  root.appendChild(header);

  if (!projection) {
    root.appendChild(createElement(
      documentRef,
      "p",
      "inspector-view__empty",
      "Select Earth, Region, City, Parcel, Building, or Room."
    ));
    container.replaceChildren(root);
    return null;
  }

  root.append(
    renderLandLifeSummary(documentRef, projection),
    renderDataGroup(documentRef, "Land Record (Read Only)", projection.canonicalData, "canonical"),
    renderDataGroup(documentRef, "Viewer Context", projection.viewerData, "viewer"),
    renderDataGroup(documentRef, "Local Proposal (Proposal Only)", projection.proposalData, "proposal"),
    renderLandRuntime(documentRef, projection, callbacks),
    renderEntityRuntime(
      documentRef,
      "Building Runtime",
      "building-runtime",
      projection.runtime.building,
      "BUILDING",
      projection,
      callbacks
    ),
    renderEntityRuntime(
      documentRef,
      "Room Runtime",
      "room-runtime",
      projection.runtime.room,
      "ROOM",
      projection,
      callbacks
    ),
    renderDataGroup(documentRef, "Player Movement", projection.runtime.player.data, "player-runtime"),
    renderLifeRuntime(documentRef, projection, callbacks),
    renderDataGroup(documentRef, "Unavailable Fields", projection.unknownData, "unknown")
  );

  const lifeSection = createElement(documentRef, "section", "inspector-view__life");
  lifeSection.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", "Life OS"));
  if (projection.lifeProfiles.length === 0) {
    lifeSection.appendChild(actionButton(
      documentRef,
      "Life: UNKNOWN",
      "inspector-view__life-action",
      null,
      { disabled: true }
    ));
  } else {
    projection.lifeProfiles.forEach((profile, index) => {
      const label = profile.displayName === UNKNOWN_VALUE
        ? `Life ${profile.lifeId}`
        : profile.displayName;
      lifeSection.appendChild(actionButton(
        documentRef,
        label,
        "inspector-view__life-action",
        () => callbacks.onOpenLife?.(profile, projection, projection.lifeProfileSources[index]),
        { ariaLabel: `Open Life OS status for ${label}` }
      ));
    });
  }
  root.appendChild(lifeSection);

  container.replaceChildren(root);
  return projection;
}

export function createInspectorView({
  container,
  onClose,
  onExpandedChange,
  onOpenLife,
  onUndoLand,
  onRedoLand,
  onSaveDraft,
  onSelectRevision,
  onEnterEntity,
  onLifeAction
}) {
  let expanded = false;
  let visible = true;
  let lastInput = {};
  let lastProjection = null;

  function render(input = lastInput) {
    lastInput = input;
    container.hidden = !visible;
    if (!visible) return lastProjection;
    lastProjection = renderInspectorView(
      container,
      { ...input, expanded },
      {
        onClose(projection) {
          visible = false;
          container.hidden = true;
          onClose?.(projection);
        },
        onToggleExpanded(nextExpanded, projection) {
          expanded = Boolean(nextExpanded);
          render(lastInput);
          onExpandedChange?.(expanded, projection);
        },
        onOpenLife,
        onUndoLand,
        onRedoLand,
        onSaveDraft,
        onSelectRevision,
        onEnterEntity,
        onLifeAction
      }
    );
    return lastProjection;
  }

  return Object.freeze({
    render,
    open(input = lastInput) {
      visible = true;
      return render(input);
    },
    close() {
      visible = false;
      container.hidden = true;
      onClose?.(lastProjection);
    },
    setExpanded(nextExpanded) {
      expanded = Boolean(nextExpanded);
      return render(lastInput);
    },
    snapshot() {
      return Object.freeze({ expanded, visible, projection: lastProjection });
    }
  });
}
