import { LIFE_OS_FORBIDDEN_DOMAINS } from "../life/life-os-viewer.js";

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
  "RESEARCH",
  "PUBLIC_FACILITY"
]);

const LIFE_LAYER_KEYS = Object.freeze([
  "body",
  "species_os",
  "individual_life_os",
  "mind_runtime",
  "citizen_runtime"
]);

const REQUIRED_ACTIVE_LAYERS = Object.freeze([
  "body",
  "species_os",
  "individual_life_os"
]);

const LIFE_LAYER_STATUSES = new Set([
  "ACTIVE",
  "READY",
  "STANDBY",
  "DORMANT",
  "DEGRADED",
  "NOT_APPLICABLE"
]);

const LIFE_STATES = new Set([
  "BODY_ONLY",
  "LIFE_INITIALIZING",
  "GESTATING",
  "BIRTH_TRANSITION",
  "ALIVE",
  "DYING",
  "DEAD"
]);

const ACTIVITY_STATES = new Set([
  "AWAKE",
  "RESTING",
  "SLEEP_REQUESTED",
  "ASLEEP",
  "WAKING",
  "DORMANT",
  "NOT_APPLICABLE"
]);

const HEALTH_STATES = new Set([
  "HEALTHY",
  "STRESSED",
  "INJURED",
  "DISEASED",
  "REPAIRING",
  "CRITICAL"
]);

const LIFE_STAGES = new Set([
  "PRE_BIRTH",
  "JUVENILE",
  "MATURE",
  "AGING",
  "END_OF_LIFE"
]);

const VITAL_KEYS = Object.freeze(["health", "energy", "food", "water"]);
const LIFE_TYPES = new Set(["AI_WORKER", "NPC", "PLANT", "PLAYER", "PET"]);
const REQUIRED_LIFE_TYPES = Object.freeze(["AI_WORKER", "NPC", "PLANT", "PLAYER", "PET"]);
const SEMANTIC_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SAFE_DNA_SUMMARY_FIELDS = new Set([
  "summary_id",
  "classification",
  "trait_count",
  "traits",
  "disclosure"
]);

const FORBIDDEN_PUBLIC_FIELD_NAMES = new Set([
  "genome",
  "raw_genome",
  "genome_sequence",
  "genomic_sequence",
  "genetic_sequence",
  "raw_dna",
  "dna_sequence",
  "private_genome",
  "private_dna",
  "secret",
  "secrets",
  "secret_key",
  "private_key",
  "seed_phrase",
  "mnemonic",
  "password",
  "credential",
  "credentials",
  "auth_token",
  "access_token",
  "api_key",
  "raw_kyc",
  "kyc",
  "gps",
  "gps_coordinate",
  "precise_gps",
  "precise_location",
  "real_identity",
  "legal_name",
  "government_id",
  "passport_number",
  "email",
  "phone",
  "medical_record",
  "patient_id",
  "real_health",
  "real_health_data",
  "biometric"
]);

const PRODUCTION_EVOLUTION_STAGES = Object.freeze([
  "UNICELLULAR", "CAMBRIAN_OCEAN", "FISH", "AMPHIBIAN", "REPTILE", "BIRD",
  "MAMMAL", "PRIMITIVE_HUMAN", "CIVILIZATION", "INDUSTRIAL", "AI_CIVILIZATION"
]);

const AGRICULTURE_FACILITY_TYPES = new Set([
  "MIXED_FARM", "FISH_FARM", "PIG_FARM", "CHICKEN_FARM", "FRUIT_FARM",
  "FOREST", "VEGETABLE_FARM", "BEE_FARM", "WATER_SYSTEM"
]);

const FACTORY_SUPPLY_CATEGORIES = new Set([
  "ELECTRICITY", "WATER", "ENGINEERS", "WORKERS", "EQUIPMENT", "SILICON",
  "CHEMICALS", "INDUSTRIAL_GAS", "TRANSPORTATION", "WAREHOUSE", "FINANCE", "AI_COMPANY"
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`World data validation failed: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizedFieldName(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function isForbiddenPublicField(field) {
  const normalized = normalizedFieldName(field);
  if (FORBIDDEN_PUBLIC_FIELD_NAMES.has(normalized)) return true;
  if (normalized.includes("private_key") || normalized.includes("seed_phrase")) return true;
  if (normalized.includes("genome") && !normalized.endsWith("genome_summary")) return true;
  if (/^(?:raw|private)_(?:dna|genetic)(?:_|$)/.test(normalized)) return true;
  return normalized.split("_").some((part) => ["secret", "password", "mnemonic"].includes(part));
}

function validateNoPrivateFields(value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoPrivateFields(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [field, child] of Object.entries(value)) {
    invariant(!isForbiddenPublicField(field), `${path}.${field} is forbidden in a public fixture`);
    validateNoPrivateFields(child, `${path}.${field}`);
  }
}

function isForbiddenLifeOsField(field) {
  const normalized = normalizedFieldName(field);
  return LIFE_OS_FORBIDDEN_DOMAINS.some((domain) => (
    normalized === domain
    || normalized.startsWith(`${domain}_`)
    || normalized.endsWith(`_${domain}`)
    || normalized.includes(`_${domain}_`)
  ));
}

function validateLifeOsBoundary(value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateLifeOsBoundary(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [field, child] of Object.entries(value)) {
    invariant(!isForbiddenLifeOsField(field), `${path}.${field} crosses the Life OS domain boundary`);
    validateLifeOsBoundary(child, `${path}.${field}`);
  }
}

function entityId(entity, collection) {
  invariant(isRecord(entity), `${collection} contains a non-object value`);
  invariant(typeof entity.id === "string" && entity.id.length > 0, `${collection} entity is missing id`);
  return entity.id;
}

function validateView(entity, collection) {
  invariant(isRecord(entity.view), `${collection}/${entity.id} is missing view geometry`);
  invariant(Array.isArray(entity.view.bounds) && entity.view.bounds.length === 4, `${collection}/${entity.id} has invalid bounds`);
  invariant(entity.view.bounds.every(Number.isFinite), `${collection}/${entity.id} has non-numeric bounds`);
}

function validateLayer(profile, layerKey) {
  const layer = profile[layerKey];
  const path = `lifeProfiles/${profile.id}/${layerKey}`;
  invariant(isRecord(layer), `${path} must be an object`);
  invariant(typeof layer.id === "string" && layer.id.length > 0, `${path} is missing id`);
  invariant(LIFE_LAYER_STATUSES.has(layer.status), `${path} has invalid status ${layer.status}`);
  invariant(typeof layer.version === "string" && SEMANTIC_VERSION.test(layer.version), `${path} has invalid version`);
  if (REQUIRED_ACTIVE_LAYERS.includes(layerKey)) {
    invariant(layer.status !== "NOT_APPLICABLE", `${path} cannot be NOT_APPLICABLE`);
  }
  if (layer.status === "NOT_APPLICABLE") {
    invariant(typeof layer.reason === "string" && layer.reason.length > 0, `${path} requires a NOT_APPLICABLE reason`);
  }
  return layer;
}

function validateDnaSummary(profile, body) {
  const summary = body.dna_summary;
  const path = `lifeProfiles/${profile.id}/body/dna_summary`;
  invariant(isRecord(summary), `${path} must be a privacy-safe object`);
  invariant(
    Object.keys(summary).every((field) => SAFE_DNA_SUMMARY_FIELDS.has(field)),
    `${path} contains a non-public field`
  );
  invariant(typeof summary.summary_id === "string" && summary.summary_id.length > 0, `${path} is missing summary_id`);
  invariant(typeof summary.classification === "string" && summary.classification.length > 0, `${path} is missing classification`);
  invariant(Number.isInteger(summary.trait_count) && summary.trait_count >= 0 && summary.trait_count <= 100, `${path} has invalid trait_count`);
  invariant(Array.isArray(summary.traits), `${path}.traits must be an array`);
  invariant(summary.traits.length === summary.trait_count, `${path}.trait_count must match traits`);
  invariant(
    summary.traits.every((trait) => typeof trait === "string" && trait.length > 0 && trait.length <= 64),
    `${path}.traits must contain short public labels`
  );
  invariant(summary.disclosure === "PUBLIC_SAFE_SUMMARY", `${path} must declare PUBLIC_SAFE_SUMMARY`);
}

function validateVitals(profile) {
  const path = `lifeProfiles/${profile.id}/vitals`;
  invariant(isRecord(profile.vitals), `${path} must be an object`);
  for (const metric of VITAL_KEYS) {
    const value = profile.vitals[metric];
    invariant(Number.isFinite(value) && value >= 0 && value <= 100, `${path}.${metric} must be between 0 and 100`);
  }
}

function validateLifeProfile(profile, layerIds) {
  const path = `lifeProfiles/${profile.id}`;
  invariant(profile.synthetic === true, `${path} must be explicitly synthetic`);
  invariant(profile.privacy_class === "PUBLIC_SYNTHETIC", `${path} must be PUBLIC_SYNTHETIC`);
  invariant(profile.identity_class === "SYNTHETIC_ALIAS_ONLY", `${path} must not represent a real identity`);
  invariant(profile.source === "SYNTHETIC_LIFE_FIXTURE", `${path} has invalid source`);
  invariant(LIFE_TYPES.has(profile.life_type), `${path} has invalid life_type ${profile.life_type}`);
  validateNoPrivateFields(profile, path);

  const layers = Object.fromEntries(
    LIFE_LAYER_KEYS.map((layerKey) => [layerKey, validateLayer(profile, layerKey)])
  );
  for (const layer of Object.values(layers)) {
    invariant(!layerIds.has(layer.id), `${path} reuses layer id ${layer.id}`);
    layerIds.add(layer.id);
  }

  invariant(typeof layers.body.profile === "string" && layers.body.profile.length > 0, `${path}/body is missing profile`);
  invariant(
    Array.isArray(layers.body.organ_systems)
      && layers.body.organ_systems.every((system) => typeof system === "string" && system.length > 0),
    `${path}/body.organ_systems must contain public system labels`
  );
  validateDnaSummary(profile, layers.body);

  invariant(
    typeof layers.species_os.species_code === "string" && layers.species_os.species_code.length > 0,
    `${path}/species_os is missing species_code`
  );
  invariant(LIFE_STATES.has(layers.individual_life_os.life_state), `${path} has invalid Life State`);
  invariant(ACTIVITY_STATES.has(layers.individual_life_os.activity_state), `${path} has invalid activity_state`);
  invariant(HEALTH_STATES.has(layers.individual_life_os.health_state), `${path} has invalid health_state`);
  invariant(LIFE_STAGES.has(layers.individual_life_os.life_stage), `${path} has invalid life_stage`);
  invariant(
    Number.isInteger(layers.individual_life_os.state_version)
      && layers.individual_life_os.state_version >= 0,
    `${path} has invalid state_version`
  );
  validateLifeOsBoundary(layers.individual_life_os, `${path}/individual_life_os`);

  invariant(typeof layers.mind_runtime.profile === "string" && layers.mind_runtime.profile.length > 0, `${path}/mind_runtime is missing profile`);
  invariant(
    typeof layers.citizen_runtime.occupation === "string" && layers.citizen_runtime.occupation.length > 0,
    `${path}/citizen_runtime is missing occupation`
  );

  if (profile.life_type === "AI_WORKER") {
    invariant(
      LIFE_LAYER_KEYS.every((layerKey) => layers[layerKey].status !== "NOT_APPLICABLE"),
      `${path} AI Worker must declare all five active layers`
    );
  }
  if (profile.life_type === "PLANT") {
    invariant(layers.mind_runtime.status === "NOT_APPLICABLE", `${path} Plant Mind Runtime must be NOT_APPLICABLE`);
    invariant(layers.citizen_runtime.status === "NOT_APPLICABLE", `${path} Plant Citizen Runtime must be NOT_APPLICABLE`);
    invariant(layers.mind_runtime.profile === "NOT_APPLICABLE", `${path} Plant Mind profile must be NOT_APPLICABLE`);
    invariant(layers.citizen_runtime.occupation === "NOT_APPLICABLE", `${path} Plant occupation must be NOT_APPLICABLE`);
  }
  if (layers.mind_runtime.status === "NOT_APPLICABLE") {
    invariant(layers.mind_runtime.profile === "NOT_APPLICABLE", `${path} inactive Mind profile must be NOT_APPLICABLE`);
  }
  if (layers.citizen_runtime.status === "NOT_APPLICABLE") {
    invariant(layers.citizen_runtime.occupation === "NOT_APPLICABLE", `${path} inactive occupation must be NOT_APPLICABLE`);
  } else {
    invariant(layers.citizen_runtime.occupation !== "NOT_APPLICABLE", `${path} active Citizen Runtime requires an occupation`);
  }

  validateVitals(profile);
  invariant(Number.isInteger(profile.ga_count) && profile.ga_count >= 0 && profile.ga_count <= 108, `${path}.ga_count must be between 0 and 108`);
  invariant(typeof profile.ga_profile === "string" && profile.ga_profile.length > 0, `${path}.ga_profile is required`);
}

function validateProductionAlpha(production) {
  const path = "production_alpha";
  invariant(isRecord(production), `${path} must be an object`);
  invariant(production.decision_id === "HUMAN-SPRINT-005-CIVILIZATION-PRODUCTION", `${path} has invalid decision ID`);
  invariant(production.simulation_only === true, `${path} must be simulation only`);
  invariant(production.real_biology === false && production.real_trade === false, `${path} cannot enable real biology or trade`);
  invariant(production.legal_securities === false && production.authoritative_registry === false, `${path} cannot be authoritative`);
  validateNoPrivateFields(production, path);

  invariant(Array.isArray(production.evolution_stages), `${path}.evolution_stages must be an array`);
  invariant(
    JSON.stringify(production.evolution_stages.map(({ stage_id: id }) => id)) === JSON.stringify(PRODUCTION_EVOLUTION_STAGES),
    `${path}.evolution_stages must preserve the approved lineage`
  );
  invariant(production.current_evolution_stage === "AI_CIVILIZATION", `${path} must open at AI_CIVILIZATION`);

  invariant(Array.isArray(production.species_catalog) && production.species_catalog.length >= 20, `${path}.species_catalog is incomplete`);
  const speciesIds = new Set();
  for (const species of production.species_catalog) {
    invariant(!speciesIds.has(species.species_id), `${path} duplicates Species ${species.species_id}`);
    speciesIds.add(species.species_id);
    invariant(PRODUCTION_EVOLUTION_STAGES.includes(species.evolution_stage), `${species.species_id} has invalid evolution stage`);
    invariant(["PRODUCER", "CONSUMER", "PREDATOR", "OMNIVORE", "DECOMPOSER"].includes(species.trophic_role), `${species.species_id} has invalid trophic role`);
    invariant(Number.isInteger(species.population) && species.population >= 0, `${species.species_id} has invalid population`);
    invariant(Number.isFinite(species.health) && species.health >= 0 && species.health <= 100, `${species.species_id} has invalid health`);
    for (const field of ["body_profile_id", "species_os_id", "life_os_profile_id", "dna_summary_id"]) {
      invariant(typeof species[field] === "string" && species[field].length > 0, `${species.species_id} is missing ${field}`);
    }
  }
  for (const label of ["Tiger", "Lion", "Elephant", "Cow", "Pig", "Chicken", "Fish", "Bee", "Tree", "Rice", "Corn", "Cabbage", "Fruit Tree", "Flower", "Mushroom", "Bacteria"]) {
    invariant(production.species_catalog.some((species) => species.label === label), `${path} is missing ${label}`);
  }

  invariant(Array.isArray(production.agriculture_facilities) && production.agriculture_facilities.length === AGRICULTURE_FACILITY_TYPES.size, `${path}.agriculture_facilities is incomplete`);
  const facilityTypes = new Set(production.agriculture_facilities.map(({ facility_type: type }) => type));
  invariant([...AGRICULTURE_FACILITY_TYPES].every((type) => facilityTypes.has(type)), `${path}.agriculture_facilities has invalid types`);
  for (const facility of production.agriculture_facilities) {
    invariant(facility.species_os_id && facility.life_os_profile_id, `${facility.facility_id} lacks organism layers`);
    invariant(Array.isArray(facility.required_inputs) && facility.required_inputs.length > 0, `${facility.facility_id} lacks inputs`);
    invariant(facility.output?.resource_id && Number(facility.output?.quantity) > 0, `${facility.facility_id} lacks output`);
  }

  invariant(Array.isArray(production.supply_nodes), `${path}.supply_nodes must be an array`);
  const supplyCategories = new Set(production.supply_nodes.map(({ category }) => category));
  invariant([...FACTORY_SUPPLY_CATEGORIES].every((category) => supplyCategories.has(category)), `${path}.supply_nodes are incomplete`);
  invariant(production.factory?.organism_type === "FACTORY_ORGANISM", `${path}.factory must be a Factory Organism`);
  invariant(production.factory.required_nodes.every((category) => FACTORY_SUPPLY_CATEGORIES.has(category)), `${path}.factory has unknown requirements`);
  invariant(production.factory.product_recipe?.product_id === "REFRIGERATOR_ALPHA", `${path}.factory must include the refrigerator Alpha recipe`);
  invariant(production.ai_company?.organism_type === "AI_COMPANY_ORGANISM", `${path}.ai_company must be an AI Company Organism`);
  invariant(production.ai_company.company_dna_id && production.ai_company.life_os_profile_id, `${path}.ai_company lacks life layers`);

  invariant(Array.isArray(production.civilization_stages) && production.civilization_stages.length === 6, `${path}.civilization_stages is incomplete`);
  invariant(production.exchange?.exchange_id === "K11520", `${path}.exchange must be K11520`);
  invariant(Array.isArray(production.exchange.candidates) && production.exchange.candidates.length >= 3, `${path}.exchange candidates are incomplete`);
  invariant(production.exchange.candidates.every(({ review_status: status }) => status === "CANDIDATE_REVIEW_REQUIRED"), `${path}.exchange cannot auto-list candidates`);
}

function validateSettlementAlpha(settlement) {
  const path = "settlement_alpha";
  invariant(isRecord(settlement), `${path} must be an object`);
  invariant(settlement.decision_id === "HUMAN-SPRINT-006-SETTLEMENT-ECONOMY", `${path} has invalid decision ID`);
  invariant(settlement.simulation_only === true && settlement.authoritative_registry === false, `${path} must remain synthetic and non-authoritative`);
  invariant(settlement.real_finance === false && settlement.real_kgen_transfer === false && settlement.real_external_settlement === false, `${path} cannot enable real settlement`);
  invariant(Number.isInteger(settlement.carrying_capacity) && settlement.carrying_capacity >= 4, `${path} has invalid carrying capacity`);
  validateNoPrivateFields(settlement, path);

  invariant(Array.isArray(settlement.currency_layers) && settlement.currency_layers.length === 3, `${path} must define three currency layers`);
  invariant(settlement.currency_layers[0]?.asset_id === "KAIOS_CREDIT", `${path} Layer 1 must be KAIOS Credit`);
  invariant(settlement.currency_layers[0]?.status === "ACTIVE_SYNTHETIC_LEDGER", `${path} Layer 1 must remain synthetic`);
  invariant(settlement.currency_layers[1]?.asset_id === "KGEN" && settlement.currency_layers[1]?.token_tax === "0.30% UNCHANGED", `${path} must preserve the KGEN boundary and tax`);
  invariant(settlement.currency_layers[2]?.asset_id === "EXTERNAL_SETTLEMENT", `${path} Layer 3 must use the official external settlement boundary`);
  invariant(settlement.currency_layers.slice(1).every(({ status }) => status === "OFFICIAL_SETTLEMENT_REQUEST_ONLY"), `${path} external layers must be request only`);
  invariant(settlement.bootstrap_reference?.rate === 1, `${path} Bootstrap Reference must start at 1:1`);
  invariant(settlement.bootstrap_reference?.permanent_peg === false && settlement.bootstrap_reference?.guaranteed_return === false, `${path} Bootstrap Reference cannot be a peg or guarantee`);
  invariant(settlement.bootstrap_reference?.future_governance_adjustable === true, `${path} Bootstrap Reference must remain governance adjustable`);

  const expectedHierarchy = ["FAMILY", "VILLAGE", "TOWN", "CITY", "NATION", "CIVILIZATION"];
  invariant(Array.isArray(settlement.hierarchy) && settlement.hierarchy.length === expectedHierarchy.length, `${path}.hierarchy is incomplete`);
  invariant(JSON.stringify(settlement.hierarchy.map(({ level }) => level)) === JSON.stringify(expectedHierarchy), `${path}.hierarchy has invalid levels`);
  const hierarchyIds = new Set(settlement.hierarchy.map(({ entity_id: id }) => id));
  for (const node of settlement.hierarchy) {
    invariant(node.entity_id && node.label, `${path}.hierarchy contains an incomplete node`);
    invariant(node.parent_id === null || hierarchyIds.has(node.parent_id), `${node.entity_id} has an invalid settlement parent`);
  }

  invariant(Array.isArray(settlement.logistics_routes) && settlement.logistics_routes.length >= 4, `${path}.logistics_routes is incomplete`);
  const routeIds = new Set();
  for (const route of settlement.logistics_routes) {
    invariant(!routeIds.has(route.route_id), `${path} duplicates route ${route.route_id}`);
    routeIds.add(route.route_id);
    invariant(route.from && route.to && Number.isInteger(route.capacity) && route.capacity > 0, `${route.route_id} is invalid`);
    invariant(Array.isArray(route.modes) && route.modes.every((mode) => ["DOMESTIC", "EXPORT", "IMPORT"].includes(mode)), `${route.route_id} has an invalid mode`);
  }
  invariant(settlement.living_cycle?.currency === "KAIOS_CREDIT", `${path}.living_cycle must use KAIOS Credit`);
  invariant(settlement.living_cycle.salary > settlement.living_cycle.tax + settlement.living_cycle.rent, `${path}.living_cycle must leave positive income`);
}

function validateGovernanceAlpha(governance) {
  const path = "governance_alpha";
  invariant(isRecord(governance), `${path} must be an object`);
  invariant(governance.decision_id === "HUMAN-SPRINT-007-CIVILIZATION-GOVERNANCE", `${path} has invalid decision ID`);
  invariant(governance.simulation_only === true && governance.authoritative_registry === false, `${path} must remain synthetic and non-authoritative`);
  invariant(
    governance.real_government === false
      && governance.real_law_enforcement === false
      && governance.real_medical_service === false
      && governance.real_emergency_service === false
      && governance.real_finance === false,
    `${path} cannot enable real public authority or services`
  );
  validateNoPrivateFields(governance, path);

  const hierarchy = ["VILLAGE_COUNCIL", "TOWN_HALL", "CITY_GOVERNMENT", "PROVINCE", "NATION", "PLANET_GOVERNMENT"];
  const laws = ["CIVIL_LAW", "CRIMINAL_LAW", "PROPERTY_LAW", "TRADE_LAW", "ENVIRONMENT_LAW", "CONSTRUCTION_LAW", "AI_LAW", "DNA_CREATION_LAW"];
  const services = ["EDUCATION", "MEDICAL", "JUSTICE", "POLICE", "FIRE_DEPARTMENT", "TRANSPORTATION", "PUBLIC_UTILITIES", "COMMUNICATION", "DISASTER_RESPONSE", "SOCIAL_WELFARE"];
  const aiRoles = ["GOVERNMENT_AI", "MEDICAL_AI", "EDUCATION_AI", "JUSTICE_AI", "POLICE_AI", "TRAFFIC_AI", "AGRICULTURE_AI", "ENVIRONMENTAL_AI"];
  const hazards = ["EARTHQUAKE", "FLOOD", "TYPHOON", "VOLCANO", "PANDEMIC", "WAR", "ECONOMIC_CRISIS", "FOOD_CRISIS", "POWER_FAILURE"];
  invariant(JSON.stringify(governance.government_hierarchy) === JSON.stringify(hierarchy), `${path}.government_hierarchy is invalid`);
  invariant(JSON.stringify(governance.law_catalog) === JSON.stringify(laws), `${path}.law_catalog is invalid`);
  invariant(Array.isArray(governance.services) && JSON.stringify(governance.services.map(({ service_id: id }) => id)) === JSON.stringify(services), `${path}.services is incomplete`);
  invariant(governance.services.every(({ capacity, demand, staff }) => [capacity, demand].every((value) => Number.isFinite(value) && value >= 0 && value <= 100) && Number.isInteger(staff) && staff > 0), `${path}.services contains invalid capacity data`);
  invariant(JSON.stringify(governance.ai_government_roles) === JSON.stringify(aiRoles), `${path}.ai_government_roles is invalid`);
  invariant(JSON.stringify(governance.resilience_hazards) === JSON.stringify(hazards), `${path}.resilience_hazards is invalid`);
}

export function validateWorldFixture(world) {
  invariant(isRecord(world), "root must be an object");
  invariant(world.meta?.synthetic === true, "World Viewer accepts synthetic data only");
  invariant(
    world.meta?.non_authoritative === true && world.meta?.authoritative !== true,
    "fixture must be explicitly non-authoritative"
  );
  invariant(world.meta?.privacy_class === "PUBLIC_SYNTHETIC", "fixture must be PUBLIC_SYNTHETIC");
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
  invariant(world.lifeProfiles.length >= 5, "demo must contain Player, AI Worker, NPC, Pet, and Plant life profiles");
  invariant(world.player?.starter_parcel_id && ids.has(world.player.starter_parcel_id), "starter parcel is invalid");
  invariant(world.player?.life_id && ids.has(world.player.life_id), "player Life profile is invalid");
  invariant(world.player?.home_building_id && ids.has(world.player.home_building_id), "player home building is invalid");
  invariant(world.player?.home_room_id && ids.has(world.player.home_room_id), "player home room is invalid");
  invariant(world.genesis?.decision_id === "HUMAN-SPRINT-004-CIVILIZATION-GENESIS", "Genesis decision ID is invalid");
  invariant(world.genesis?.one_time_claim === true && world.genesis?.real_kgen === false, "Genesis must be one-time and synthetic");
  invariant(
    JSON.stringify(world.genesis?.starter_fortune_options) === JSON.stringify([1, 8, 88, 188, 388, 888]),
    "Genesis Fortune options are invalid"
  );
  invariant(Array.isArray(world.planet_profiles) && world.planet_profiles.length >= 5, "Planet profiles are required");
  const planetIds = new Set(world.planet_profiles.map(({ planet_id: id }) => id));
  invariant(["EARTH", "MOON", "MARS", "JUPITER", "FUTURE_PLANET"].every((id) => planetIds.has(id)), "required Planet profiles are missing");
  validateProductionAlpha(world.production_alpha);
  validateSettlementAlpha(world.settlement_alpha);
  validateGovernanceAlpha(world.governance_alpha);

  const actionIds = (world.proposalActions ?? []).map((action) => (
    typeof action === "string" ? action : action?.id
  ));
  const uniqueActionIds = new Set(actionIds);
  invariant(actionIds.length === EXPECTED_LAND_USES.length, "land-use action count must be eight");
  invariant(uniqueActionIds.size === EXPECTED_LAND_USES.length, "land-use actions must be unique");
  invariant(EXPECTED_LAND_USES.every((action) => uniqueActionIds.has(action)), "land-use actions do not match the approved set");
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

  const layerIds = new Set();
  world.lifeProfiles.forEach((profile) => validateLifeProfile(profile, layerIds));
  for (const lifeType of REQUIRED_LIFE_TYPES) {
    invariant(world.lifeProfiles.some((profile) => profile.life_type === lifeType), `${lifeType} life profile is required`);
  }

  invariant(Array.isArray(world.buildingTemplates) && world.buildingTemplates.length >= 7, "building templates are required");
  invariant(Array.isArray(world.furniture), "furniture must be an array");
  invariant(Array.isArray(world.equipment), "equipment must be an array");
  invariant(Array.isArray(world.organisms), "organisms must be an array");
  const contentIds = new Set();
  for (const [collectionName, collection] of [
    ["buildingTemplates", world.buildingTemplates],
    ["furniture", world.furniture],
    ["equipment", world.equipment],
    ["organisms", world.organisms]
  ]) {
    for (const item of collection) {
      const id = entityId(item, collectionName);
      invariant(!contentIds.has(id), `${collectionName} reuses id ${id}`);
      contentIds.add(id);
    }
  }
  const organismTypes = new Set(world.organisms.map(({ organism_type: type }) => type));
  for (const type of REQUIRED_LIFE_TYPES) {
    invariant(organismTypes.has(type), `${type} room organism is required`);
  }

  const starterParcel = world.parcels.find(({ id }) => id === world.player.starter_parcel_id);
  invariant(
    (typeof starterParcel.parcel_version === "string" && starterParcel.parcel_version.length > 0)
      || (Number.isInteger(starterParcel.parcel_version) && starterParcel.parcel_version >= 0),
    "starter parcel version is required"
  );
  invariant(Array.isArray(starterParcel.revision_history) && starterParcel.revision_history.length > 0, "starter parcel revision history is required");
  invariant(Array.isArray(starterParcel.ownership_timeline) && starterParcel.ownership_timeline.length > 0, "starter parcel ownership timeline is required");
  invariant(Array.isArray(starterParcel.proposal_history), "starter parcel proposal history is required");

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
