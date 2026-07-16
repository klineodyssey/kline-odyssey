const UNKNOWN_VALUE = "UNKNOWN";

export const ROOM_OCCUPANT_TYPES = Object.freeze([
  "PLAYER",
  "AI_WORKER",
  "NPC",
  "PET",
  "PLANT"
]);

const VALID_OCCUPANT_TYPES = new Set(ROOM_OCCUPANT_TYPES);

function invariant(condition, message) {
  if (!condition) throw new Error(`Room runtime validation failed: ${message}`);
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
  const source = isRecord(world.world) && !Array.isArray(world.rooms)
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

function optionalCollection(world, names) {
  const present = names.filter((name) => world[name] !== undefined);
  invariant(present.length <= 1, `${names.join("/")} defines more than one source collection`);
  if (present.length === 0) return Object.freeze({ known: false, values: Object.freeze([]) });
  const value = world[present[0]];
  invariant(Array.isArray(value), `${present[0]} must be an array`);
  return Object.freeze({ known: true, values: value });
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
  invariant(typeof value === "string" && value.length > 0, `${path} must be a non-empty string`);
  return value;
}

function optionalInteger(value, path, { minimum = 0 } = {}) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  invariant(Number.isInteger(value) && value >= minimum, `${path} must be an integer >= ${minimum}`);
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

function assertGloballyUnique(indexes) {
  const owners = new Map();
  for (const [collection, index] of indexes) {
    for (const id of index.keys()) {
      invariant(!owners.has(id), `${collection}/${id} duplicates id from ${owners.get(id)}`);
      owners.set(id, collection);
    }
  }
}

function requireBuildingRuntime(buildingRuntime) {
  invariant(isRecord(buildingRuntime), "buildingRuntime must be an object");
  for (const method of ["getBuildingSnapshot", "listByParcel", "integrityReport"]) {
    invariant(typeof buildingRuntime[method] === "function", `buildingRuntime.${method} is required`);
  }
  const report = buildingRuntime.integrityReport();
  invariant(report?.ok === true, "buildingRuntime integrity must pass first");
  return buildingRuntime;
}

function normalizeLifeIndex(world, lifeProfiles) {
  const index = new Map();
  const playerId = firstKnown(world.player?.id, world.player?.player_id);
  if (isKnown(playerId)) {
    invariant(typeof playerId === "string", "player id must be a string");
    index.set(playerId, Object.freeze({
      id: playerId,
      label: optionalIdentifier(
        firstKnown(world.player.display_name, world.player.label),
        `player/${playerId}/label`
      ),
      occupantType: "PLAYER",
      roomId: optionalIdentifier(world.player.room_id, `player/${playerId}/room_id`),
      buildingId: optionalIdentifier(world.player.building_id, `player/${playerId}/building_id`),
      source: "SYNTHETIC_PLAYER_FIXTURE"
    }));
  }

  for (const profile of lifeProfiles) {
    const id = entityId(profile, "lifeProfiles");
    invariant(!index.has(id), `lifeProfiles/${id} duplicates a player or life id`);
    const occupantType = optionalIdentifier(profile.life_type, `lifeProfiles/${id}/life_type`);
    invariant(VALID_OCCUPANT_TYPES.has(occupantType), `lifeProfiles/${id} has unsupported occupant type ${occupantType}`);
    index.set(id, Object.freeze({
      id,
      label: optionalIdentifier(profile.label, `lifeProfiles/${id}/label`),
      occupantType,
      roomId: optionalIdentifier(profile.room_id, `lifeProfiles/${id}/room_id`),
      buildingId: optionalIdentifier(profile.building_id, `lifeProfiles/${id}/building_id`),
      source: optionalIdentifier(profile.source, `lifeProfiles/${id}/source`)
    }));
  }

  return index;
}

function validateRoomLink(room, buildingRuntime) {
  invariant(room.object_type === "ROOM", `rooms/${room.id} must have object_type ROOM`);
  const buildingId = optionalIdentifier(
    firstKnown(room.building_id, room.parent_id),
    `rooms/${room.id}/building_id`
  );
  invariant(buildingId !== UNKNOWN_VALUE, `rooms/${room.id} requires building_id`);
  if (isKnown(room.parent_id)) {
    invariant(room.parent_id === buildingId, `rooms/${room.id} parent_id must match building_id`);
  }
  const building = buildingRuntime.getBuildingSnapshot(buildingId);
  invariant(building, `rooms/${room.id} references missing building ${buildingId}`);
  invariant(building.roomIds.includes(room.id), `building ${buildingId} does not reference room ${room.id}`);
  return buildingId;
}

function validateOccupant(room, occupantId, lifeIndex) {
  invariant(lifeIndex.has(occupantId), `rooms/${room.id} references missing occupant ${occupantId}`);
  const occupant = lifeIndex.get(occupantId);
  invariant(VALID_OCCUPANT_TYPES.has(occupant.occupantType), `rooms/${room.id} has invalid occupant type ${occupant.occupantType}`);
  if (occupant.roomId !== UNKNOWN_VALUE) {
    invariant(occupant.roomId === room.id, `${occupantId} is linked to room ${occupant.roomId}, not ${room.id}`);
  }
  if (occupant.buildingId !== UNKNOWN_VALUE) {
    invariant(occupant.buildingId === room.building_id, `${occupantId} is linked to the wrong building`);
  }
  return occupant;
}

function relationId(entity, fields, path) {
  const value = firstKnown(...fields.map((field) => entity[field]));
  const id = optionalIdentifier(value, path);
  invariant(id !== UNKNOWN_VALUE, `${path} is required`);
  return id;
}

function validateContentGraph({
  rooms,
  roomIndex,
  furnitureState,
  equipmentState,
  organismState,
  lifeIndex
}) {
  const furnitureIndex = buildIndex(furnitureState.values, "furniture");
  const equipmentIndex = buildIndex(equipmentState.values, "equipment");
  const organismIndex = buildIndex(organismState.values, "organisms");
  assertGloballyUnique([
    ["rooms", roomIndex],
    ["furniture", furnitureIndex],
    ["equipment", equipmentIndex],
    ["organisms", organismIndex]
  ]);

  const furnitureOwners = new Map();
  const equipmentOwners = new Map();
  const organismOwners = new Map();
  const equipmentParents = new Map();
  const organismParents = new Map();

  function claimRoomOwner(owners, id, roomId, label) {
    const existing = owners.get(id);
    invariant(!existing || existing === roomId, `${label}/${id} belongs to more than one room`);
    owners.set(id, roomId);
  }

  for (const room of rooms) {
    const furnitureIds = identifierList(room.furniture_ids, `rooms/${room.id}/furniture_ids`);
    for (const furnitureId of furnitureIds.ids) {
      invariant(furnitureState.known, `rooms/${room.id} references furniture without a furniture collection`);
      invariant(furnitureIndex.has(furnitureId), `rooms/${room.id} references missing furniture ${furnitureId}`);
      invariant(!furnitureOwners.has(furnitureId), `furniture/${furnitureId} belongs to more than one room`);
      furnitureOwners.set(furnitureId, room.id);
      const furniture = furnitureIndex.get(furnitureId);
      const roomId = relationId(furniture, ["room_id", "parent_id"], `furniture/${furnitureId}/room_id`);
      invariant(roomId === room.id, `furniture/${furnitureId} has the wrong room_id`);
    }

    const equipmentIds = identifierList(room.equipment_ids, `rooms/${room.id}/equipment_ids`);
    for (const equipmentId of equipmentIds.ids) {
      invariant(equipmentState.known, `rooms/${room.id} references equipment without an equipment collection`);
      invariant(equipmentIndex.has(equipmentId), `rooms/${room.id} references missing equipment ${equipmentId}`);
      claimRoomOwner(equipmentOwners, equipmentId, room.id, "equipment");
      const equipment = equipmentIndex.get(equipmentId);
      const roomId = relationId(equipment, ["room_id"], `equipment/${equipmentId}/room_id`);
      invariant(roomId === room.id, `equipment/${equipmentId} has the wrong room_id`);
    }

    const organismIds = identifierList(room.organism_ids, `rooms/${room.id}/organism_ids`);
    for (const organismId of organismIds.ids) {
      invariant(organismState.known, `rooms/${room.id} references organisms without an organisms collection`);
      invariant(organismIndex.has(organismId), `rooms/${room.id} references missing organism ${organismId}`);
      claimRoomOwner(organismOwners, organismId, room.id, "organisms");
      const organism = organismIndex.get(organismId);
      const roomId = relationId(organism, ["room_id"], `organisms/${organismId}/room_id`);
      invariant(roomId === room.id, `organisms/${organismId} has the wrong room_id`);
    }
  }

  for (const furniture of furnitureState.values) {
    const furnitureId = furniture.id;
    invariant(furnitureOwners.has(furnitureId), `furniture/${furnitureId} is orphaned from Room -> Furniture`);
    const equipmentIds = identifierList(furniture.equipment_ids, `furniture/${furnitureId}/equipment_ids`);
    for (const equipmentId of equipmentIds.ids) {
      invariant(equipmentState.known, `furniture/${furnitureId} references equipment without an equipment collection`);
      invariant(equipmentIndex.has(equipmentId), `furniture/${furnitureId} references missing equipment ${equipmentId}`);
      invariant(!equipmentParents.has(equipmentId), `equipment/${equipmentId} belongs to more than one furniture item`);
      equipmentParents.set(equipmentId, furnitureId);
      claimRoomOwner(equipmentOwners, equipmentId, furnitureOwners.get(furnitureId), "equipment");
      const equipment = equipmentIndex.get(equipmentId);
      if (isKnown(equipment.furniture_id) || isKnown(equipment.parent_id)) {
        const ownerId = relationId(equipment, ["furniture_id", "parent_id"], `equipment/${equipmentId}/furniture_id`);
        invariant(ownerId === furnitureId, `equipment/${equipmentId} has the wrong furniture_id`);
      }
      if (isKnown(equipment.room_id)) {
        invariant(equipment.room_id === furnitureOwners.get(furnitureId), `equipment/${equipmentId} has the wrong room_id`);
      }
    }
  }

  for (const equipment of equipmentState.values) {
    const equipmentId = equipment.id;
    invariant(equipmentOwners.has(equipmentId), `equipment/${equipmentId} is orphaned from Room/Furniture -> Equipment`);
    const organismIds = identifierList(equipment.organism_ids, `equipment/${equipmentId}/organism_ids`);
    for (const organismId of organismIds.ids) {
      invariant(organismState.known, `equipment/${equipmentId} references organisms without an organisms collection`);
      invariant(organismIndex.has(organismId), `equipment/${equipmentId} references missing organism ${organismId}`);
      invariant(!organismParents.has(organismId), `organisms/${organismId} belongs to more than one equipment item`);
      organismParents.set(organismId, equipmentId);
      claimRoomOwner(organismOwners, organismId, equipmentOwners.get(equipmentId), "organisms");
      const organism = organismIndex.get(organismId);
      if (isKnown(organism.equipment_id) || isKnown(organism.parent_id)) {
        const ownerId = relationId(organism, ["equipment_id", "parent_id"], `organisms/${organismId}/equipment_id`);
        invariant(ownerId === equipmentId, `organisms/${organismId} has the wrong equipment_id`);
      }
      if (isKnown(organism.room_id)) {
        invariant(organism.room_id === equipmentOwners.get(equipmentId), `organisms/${organismId} has the wrong room_id`);
      }
    }
  }

  for (const organism of organismState.values) {
    const organismId = organism.id;
    invariant(organismOwners.has(organismId), `organisms/${organismId} is orphaned from Room/Equipment -> Organism`);
    const lifeIds = identifierList(organism.life_ids, `organisms/${organismId}/life_ids`);
    if (!lifeIds.known && isKnown(organism.life_id)) {
      invariant(false, `organisms/${organismId} must use life_ids for the Organism -> Life link`);
    }
    const room = roomIndex.get(organismOwners.get(organismId));
    for (const lifeId of lifeIds.ids) validateOccupant(room, lifeId, lifeIndex);
  }

  for (const room of rooms) {
    const occupantIds = identifierList(room.occupant_ids, `rooms/${room.id}/occupant_ids`);
    const organismIds = identifierList(room.organism_ids, `rooms/${room.id}/organism_ids`);
    if (!occupantIds.known || !organismIds.known) continue;
    const linkedLifeIds = [...new Set(organismIds.ids.flatMap((organismId) => (
      identifierList(organismIndex.get(organismId).life_ids, `organisms/${organismId}/life_ids`).ids
    )))];
    invariant(
      linkedLifeIds.length === occupantIds.ids.length
        && linkedLifeIds.every((lifeId) => occupantIds.ids.includes(lifeId)),
      `rooms/${room.id} occupant_ids do not match Organism -> Life links`
    );
  }

  return Object.freeze({
    furnitureIndex,
    equipmentIndex,
    organismIndex,
    equipmentParents,
    organismParents
  });
}

function publicEntity(entity, type, relation) {
  return Object.freeze({
    id: entity.id,
    type,
    label: optionalIdentifier(entity.label, `${type.toLowerCase()}/${entity.id}/label`),
    status: optionalIdentifier(entity.status, `${type.toLowerCase()}/${entity.id}/status`),
    ...relation
  });
}

function resolveContentGraph(room, indexes) {
  const furnitureIds = identifierList(room.furniture_ids, `rooms/${room.id}/furniture_ids`);
  if (!furnitureIds.known) {
    return Object.freeze({
      chainStatus: UNKNOWN_VALUE,
      linkModel: UNKNOWN_VALUE,
      furniture: UNKNOWN_VALUE,
      equipment: UNKNOWN_VALUE,
      organisms: UNKNOWN_VALUE,
      life: UNKNOWN_VALUE
    });
  }

  const furniture = furnitureIds.ids.map((id) => indexes.furnitureIndex.get(id));
  const directEquipmentIds = identifierList(room.equipment_ids, `rooms/${room.id}/equipment_ids`);
  const nestedEquipmentKnowledge = furniture.map((item) => (
    identifierList(item.equipment_ids, `furniture/${item.id}/equipment_ids`)
  ));
  const nestedEquipmentKnown = nestedEquipmentKnowledge.every(({ known }) => known);
  const equipmentKnown = directEquipmentIds.known || nestedEquipmentKnown;
  const equipmentIds = directEquipmentIds.known
    ? directEquipmentIds.ids
    : [...new Set(nestedEquipmentKnowledge.flatMap(({ ids }) => ids))];
  const equipment = equipmentIds.map((id) => indexes.equipmentIndex.get(id));
  const directOrganismIds = identifierList(room.organism_ids, `rooms/${room.id}/organism_ids`);
  const nestedOrganismKnowledge = equipment.map((item) => (
    identifierList(item.organism_ids, `equipment/${item.id}/organism_ids`)
  ));
  const nestedOrganismsKnown = nestedOrganismKnowledge.every(({ known }) => known);
  const organismsKnown = directOrganismIds.known || (equipmentKnown && nestedOrganismsKnown);
  const organismIds = directOrganismIds.known
    ? directOrganismIds.ids
    : [...new Set(nestedOrganismKnowledge.flatMap(({ ids }) => ids))];
  const organisms = organismIds.map((id) => indexes.organismIndex.get(id));
  const lifeKnowledge = organisms.map((item) => (
    identifierList(item.life_ids, `organisms/${item.id}/life_ids`)
  ));
  const lifeKnown = organismsKnown && lifeKnowledge.every(({ known }) => known);
  const lifeIds = [...new Set(lifeKnowledge.flatMap(({ ids }) => ids))];
  const linkModel = directEquipmentIds.known && directOrganismIds.known
    ? "ROOM_ANCHORED_CONTENT_LAYERS"
    : nestedEquipmentKnown && nestedOrganismsKnown
      ? "NESTED_CONTENT_CHAIN"
      : "HYBRID_EXPLICIT_CONTENT_LINKS";

  return Object.freeze({
    chainStatus: equipmentKnown && organismsKnown && lifeKnown ? "RESOLVED" : "PARTIAL_UNKNOWN",
    linkModel,
    furniture: Object.freeze(furniture.map((item) => publicEntity(item, "FURNITURE", {
      roomId: room.id,
      equipmentIds: identifierList(item.equipment_ids, `furniture/${item.id}/equipment_ids`).known
        ? identifierList(item.equipment_ids, `furniture/${item.id}/equipment_ids`).ids
        : UNKNOWN_VALUE
    }))),
    equipment: equipmentKnown
      ? Object.freeze(equipment.map((item) => publicEntity(item, "EQUIPMENT", {
          roomId: room.id,
          furnitureId: indexes.equipmentParents.get(item.id) ?? UNKNOWN_VALUE,
          organismIds: identifierList(item.organism_ids, `equipment/${item.id}/organism_ids`).known
            ? identifierList(item.organism_ids, `equipment/${item.id}/organism_ids`).ids
            : UNKNOWN_VALUE
        })))
      : UNKNOWN_VALUE,
    organisms: organismsKnown
      ? Object.freeze(organisms.map((item) => publicEntity(item, "ORGANISM", {
          roomId: room.id,
          equipmentId: indexes.organismParents.get(item.id) ?? UNKNOWN_VALUE,
          lifeIds: identifierList(item.life_ids, `organisms/${item.id}/life_ids`).known
            ? identifierList(item.life_ids, `organisms/${item.id}/life_ids`).ids
            : UNKNOWN_VALUE
        })))
      : UNKNOWN_VALUE,
    life: lifeKnown
      ? Object.freeze(lifeIds.map((id) => indexes.lifeIndex.get(id)))
      : UNKNOWN_VALUE
  });
}

function normalizeCapacity(room) {
  const source = isRecord(room.capacity)
    ? firstKnown(room.capacity.total, room.capacity.people, room.capacity.occupants)
    : firstKnown(room.capacity, room.room_capacity);
  return optionalInteger(source, `rooms/${room.id}/capacity`);
}

function createRoomSnapshot(room, buildingId, contents, lifeIndex) {
  const occupantIdsState = identifierList(room.occupant_ids, `rooms/${room.id}/occupant_ids`);
  const directOccupants = occupantIdsState.ids.map((id) => validateOccupant(room, id, lifeIndex));
  const chainedLife = Array.isArray(contents.life) ? contents.life : [];
  const occupantsById = new Map([...directOccupants, ...chainedLife].map((occupant) => [occupant.id, occupant]));
  const resolvedOccupants = [...occupantsById.values()];
  const capacity = normalizeCapacity(room);
  const occupantCountKnown = occupantIdsState.known || Array.isArray(contents.life);
  const occupantCount = occupantCountKnown ? resolvedOccupants.length : UNKNOWN_VALUE;

  if (capacity !== UNKNOWN_VALUE && occupantCount !== UNKNOWN_VALUE) {
    invariant(occupantCount <= capacity, `rooms/${room.id} occupancy ${occupantCount} exceeds capacity ${capacity}`);
  }

  const byType = Object.fromEntries(ROOM_OCCUPANT_TYPES.map((type) => [type, 0]));
  resolvedOccupants.forEach((occupant) => {
    byType[occupant.occupantType] += 1;
  });

  return Object.freeze({
    roomId: room.id,
    buildingId,
    label: optionalIdentifier(room.label, `rooms/${room.id}/label`),
    roomType: optionalIdentifier(room.room_type, `rooms/${room.id}/room_type`),
    floor: optionalInteger(room.floor, `rooms/${room.id}/floor`),
    capacity,
    occupancy: Object.freeze({
      occupantCount,
      occupantIds: occupantIdsState.known ? occupantIdsState.ids : UNKNOWN_VALUE,
      occupants: occupantIdsState.known ? Object.freeze(directOccupants) : UNKNOWN_VALUE,
      resolvedOccupants: Object.freeze(resolvedOccupants),
      byType: Object.freeze(byType),
      available: capacity === UNKNOWN_VALUE || occupantCount === UNKNOWN_VALUE
        ? UNKNOWN_VALUE
        : capacity - occupantCount,
      status: capacity === UNKNOWN_VALUE || occupantCount === UNKNOWN_VALUE
        ? UNKNOWN_VALUE
        : "WITHIN_CAPACITY"
    }),
    contents,
    status: optionalIdentifier(room.status, `rooms/${room.id}/status`),
    source: optionalIdentifier(room.source, `rooms/${room.id}/source`),
    synthetic: true,
    readOnly: true
  });
}

/** Create a validated, immutable Room -> Furniture -> Equipment -> Organism -> Life projection. */
export function createRoomRuntime({ world, buildingRuntime } = {}) {
  const source = normalizeWorld(world);
  const buildings = requireBuildingRuntime(buildingRuntime);
  const rooms = requireCollection(source, "rooms");
  const lifeProfiles = requireCollection(source, "lifeProfiles");
  const roomIndex = buildIndex(rooms, "rooms");
  const lifeIndex = normalizeLifeIndex(source, lifeProfiles);
  const furnitureState = optionalCollection(source, ["furniture", "furnitures"]);
  const equipmentState = optionalCollection(source, ["equipment", "equipments"]);
  const organismState = optionalCollection(source, ["organisms"]);

  for (const room of rooms) {
    validateRoomLink(room, buildings);
    const occupantIds = identifierList(room.occupant_ids, `rooms/${room.id}/occupant_ids`);
    occupantIds.ids.forEach((id) => validateOccupant(room, id, lifeIndex));
  }

  const contentIndexes = validateContentGraph({
    rooms,
    roomIndex,
    furnitureState,
    equipmentState,
    organismState,
    lifeIndex
  });
  const indexes = Object.freeze({ ...contentIndexes, lifeIndex });
  const snapshots = rooms.map((room) => {
    const buildingId = firstKnown(room.building_id, room.parent_id);
    return createRoomSnapshot(room, buildingId, resolveContentGraph(room, indexes), lifeIndex);
  });
  const snapshotIndex = new Map(snapshots.map((snapshot) => [snapshot.roomId, snapshot]));
  const report = Object.freeze({
    ok: true,
    runtime: "ROOM_RUNTIME_ALPHA",
    mode: "READ_ONLY_SYNTHETIC_PROJECTION",
    roomCount: snapshots.length,
    furnitureCount: furnitureState.values.length,
    equipmentCount: equipmentState.values.length,
    organismCount: organismState.values.length,
    lifeReferenceCount: lifeIndex.size,
    unknownContentChains: snapshots.filter(({ contents }) => contents.chainStatus === UNKNOWN_VALUE).length,
    linkModels: Object.freeze([...new Set(snapshots.map(({ contents }) => contents.linkModel))]),
    occupantTypes: ROOM_OCCUPANT_TYPES,
    violations: Object.freeze([])
  });

  return Object.freeze({
    getRoomSnapshot(roomId) {
      if (!isKnown(roomId)) return null;
      return snapshotIndex.get(String(roomId)) ?? null;
    },
    listByBuilding(buildingId) {
      if (!isKnown(buildingId)) return Object.freeze([]);
      const normalized = String(buildingId);
      return Object.freeze(
        snapshots
          .filter((snapshot) => snapshot.buildingId === normalized)
          .sort((left, right) => {
            const leftFloor = left.floor === UNKNOWN_VALUE ? Number.MAX_SAFE_INTEGER : left.floor;
            const rightFloor = right.floor === UNKNOWN_VALUE ? Number.MAX_SAFE_INTEGER : right.floor;
            return leftFloor - rightFloor || left.roomId.localeCompare(right.roomId);
          })
      );
    },
    resolveContents(roomId) {
      const snapshot = !isKnown(roomId) ? null : snapshotIndex.get(String(roomId));
      return snapshot?.contents ?? null;
    },
    integrityReport() {
      return report;
    }
  });
}
