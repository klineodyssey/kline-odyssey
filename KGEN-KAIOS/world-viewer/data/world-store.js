const REQUIRED_COLLECTIONS = Object.freeze([
  "regions",
  "cities",
  "parcels",
  "buildings",
  "rooms",
  "lifeProfiles"
]);

const EXPECTED_LAND_USES = Object.freeze([
  "RESIDENTIAL",
  "FARM",
  "FOREST",
  "FACTORY",
  "MARKETPLACE",
  "TEMPLE",
  "MINE",
  "ROAD"
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`World data validation failed: ${message}`);
}

function entityId(entity, collection) {
  invariant(entity && typeof entity === "object", `${collection} contains a non-object value`);
  invariant(typeof entity.id === "string" && entity.id.length > 0, `${collection} entity is missing id`);
  return entity.id;
}

function validateView(entity, collection) {
  invariant(entity.view && typeof entity.view === "object", `${collection}/${entity.id} is missing view geometry`);
  invariant(Array.isArray(entity.view.bounds) && entity.view.bounds.length === 4, `${collection}/${entity.id} has invalid bounds`);
  invariant(entity.view.bounds.every(Number.isFinite), `${collection}/${entity.id} has non-numeric bounds`);
}

export function validateWorldFixture(world) {
  invariant(world && typeof world === "object", "root must be an object");
  invariant(world.meta?.synthetic === true, "Sprint 001 accepts synthetic data only");
  invariant(
    world.meta?.non_authoritative === true && world.meta?.authoritative !== true,
    "fixture must be explicitly non-authoritative"
  );
  invariant(world.earth?.surface_k === 280, "Earth surface_k must be 280");
  invariant(world.earth?.id, "Earth entity is required");
  invariant(Array.isArray(world.scene_bounds) && world.scene_bounds.length === 4, "scene_bounds must contain four numbers");
  invariant(world.scene_bounds.every(Number.isFinite), "scene_bounds must be numeric");

  const ids = new Set([entityId(world.earth, "earth")]);
  validateView(world.earth, "earth");
  for (const collection of REQUIRED_COLLECTIONS) {
    invariant(Array.isArray(world[collection]), `${collection} must be an array`);
    for (const entity of world[collection]) {
      const id = entityId(entity, collection);
      invariant(!ids.has(id), `duplicate entity id ${id}`);
      ids.add(id);
      validateView(entity, collection);
    }
  }

  invariant(world.regions.length === 1, "demo must contain exactly one region");
  invariant(world.cities.length === 1, "demo must contain exactly one city overlay");
  invariant(world.parcels.length === 12, "demo must contain exactly 12 parcels");
  invariant(world.buildings.length === 2, "demo must contain exactly two buildings");
  invariant(world.rooms.length === 3, "demo must contain exactly three rooms");
  invariant(world.lifeProfiles.length >= 2, "demo must contain AI and NPC life profiles");
  invariant(world.player?.starter_parcel_id && ids.has(world.player.starter_parcel_id), "starter parcel is invalid");

  const actions = (world.proposalActions ?? []).map((action) => (
    typeof action === "string" ? action : action?.id
  ));
  invariant(actions.length === EXPECTED_LAND_USES.length, "land-use action count must be eight");
  invariant(EXPECTED_LAND_USES.every((action) => actions.includes(action)), "land-use actions do not match the approved set");
  invariant(world.parcels.some((parcel) => parcel.status === "UNKNOWN"), "UNKNOWN-data parcel is required");

  const parentRules = [
    [world.regions, new Set([world.earth.id]), "region"],
    [world.cities, new Set(world.regions.map(({ id }) => id)), "city"],
    [world.parcels, new Set(world.cities.map(({ id }) => id)), "parcel"],
    [world.buildings, new Set(world.parcels.map(({ id }) => id)), "building"],
    [world.rooms, new Set(world.buildings.map(({ id }) => id)), "room"]
  ];
  for (const [entities, validParents, label] of parentRules) {
    for (const entity of entities) {
      invariant(validParents.has(entity.parent_id), `${label}/${entity.id} has invalid parent ${entity.parent_id}`);
    }
  }

  return world;
}

export function createWorldIndex(world) {
  const index = new Map();
  for (const entity of [
    world.earth,
    ...world.regions,
    ...world.cities,
    ...world.parcels,
    ...world.buildings,
    ...world.rooms,
    ...world.lifeProfiles
  ]) {
    index.set(String(entity.id), entity);
  }
  return index;
}

export async function loadSyntheticWorld(url = new URL("./synthetic-world.json", import.meta.url)) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load synthetic world (${response.status})`);
  const world = validateWorldFixture(await response.json());
  return Object.freeze({
    world,
    index: createWorldIndex(world),
    inspectorWorld: Object.freeze({
      ...world,
      region: world.regions[0],
      cityOverlay: world.cities[0]
    })
  });
}
