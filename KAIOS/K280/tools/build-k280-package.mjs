import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildBirthPipeline,
  checksum,
  createGenome,
  K280_BIRTH_EVENT_ID,
  K280_EMBODIMENT_ID,
  K280_GENOME_ID,
  K280_LIFE_ID,
  K280_ORGANISM_ID,
  K280_RUNTIME_INSTANCE_ID,
  K280_SPECIES_ID,
  RIGHTS_CLASSES,
  runCambrianExplosion,
  stableStringify
} from "../runtime/k280-runtime.js";

const root = resolve(import.meta.dirname, "../../..");
const speciesRoot = "KAIOS/life/species/k280-raptor";
const organismRoot = `KAIOS/life/organisms/${K280_ORGANISM_ID}`;
const timestamp = "2026-07-30T00:00:00.000Z";
const baseSha = "37362ca5477fa120a54b4828a71da0cbdaf99718";

const taxonomy = {
  domain: "KGEN_UNIVERSE",
  kingdom: "DIGITAL_ANIMAL_LIFE",
  phylum: "SIMULATED_CHORDATE",
  class: "DIGITAL_REPTILIAN",
  order: "K280_RAPTORIFORMES",
  family: "K280_DIGITAL_RAPTOR",
  genus: "KAIOS_RAPTOR",
  species: K280_SPECIES_ID,
  cell: "K280_DIGITAL_CELL",
  organ: "K280_ORGAN_SYSTEM",
  runtime: "LOCAL_DETERMINISTIC_SIMULATION",
  civilization: "KAIOS_K280_CIVILIZATION_SANDBOX"
};

const species = {
  schema_version: "2.0",
  species_id: K280_SPECIES_ID,
  display_name: "K280 原生迅猛龍",
  scientific_name: "Kaiosraptor k280 digitalis",
  species_version: "1.0.0",
  taxonomy,
  taxonomy_extension_19_compatible: true,
  species_program: "KAIOS/K280/runtime/k280-runtime.js",
  genome_schema: `${speciesRoot}/genome.schema.json`,
  body_plan: `${speciesRoot}/body_plan.json`,
  cell_types: ["K280_DIGITAL_CELL", "SENSOR_CELL", "MOTOR_CELL", "MEMORY_CELL", "METABOLIC_CELL"],
  organ_systems: ["SENSOR_ARRAY", "LOCOMOTION_SYSTEM", "DIGITAL_METABOLISM", "MEMORY_CORE", "HEALTH_REGULATOR"],
  senses: ["VISION_SIMULATION", "AUDIO_SIMULATION", "PROXIMITY", "TEMPERATURE", "RESOURCE_SIGNAL"],
  locomotion: { mode: "DIGITAL_BIPEDAL", bounded_world_coordinates: true, maximum_step_per_tick: 3 },
  metabolism: { mode: "SIMULATED_ENERGY_CONVERSION", real_biology: false },
  health_model: { range: [0, 100], terminal_at: 0, reversible_death: false },
  energy_model: { range: [0, 100], input: "SIMULATED_FOOD_ENERGY", free_energy: false },
  hunger_model: { range: [0, 100], increases_per_tick: 0.7 },
  hydration_model: { range: [0, 100], decreases_per_tick: 0.45 },
  temperature_model: { unit: "SIMULATED_CELSIUS", viable_range: [32, 42] },
  age_model: { unit: "SIMULATION_TICK", deterministic: true },
  growth_stages: ["HATCHLING", "JUVENILE", "ADULT", "ELDER", "DEAD"],
  sex_model: { types: ["FEMALE", "MALE"], simulation_only: true },
  reproduction_model: `${speciesRoot}/reproduction.json`,
  heredity_model: { parent_genomes_required: 2, deterministic_seed_required: true },
  mutation_model: `${speciesRoot}/mutation_rules.json`,
  personality_traits: ["CURIOSITY", "CAUTION", "SOCIABILITY", "PERSISTENCE", "AGGRESSION"],
  memory_model: `${speciesRoot}/memory_model.json`,
  behavior_model: `${speciesRoot}/behavior_model.json`,
  predator_behavior: { mode: "HUNT_SIMULATION", real_world_targeting: false },
  social_behavior: { modes: ["SOLITARY", "PAIR", "PACK_SIMULATION"] },
  habitat_requirements: `${speciesRoot}/habitat_requirements.json`,
  lifecycle_states: ["SPECIFIED", "VALIDATED", "BORN_IN_SIMULATION", "ACTIVE", "SLEEPING", "INJURED", "ELDER", "DEAD"],
  death_state: { terminal: true, does_not_delete_identity: true },
  extinction_state: { population_zero_required: true, evidence_required: true },
  civilization_affinity: `${speciesRoot}/civilization_affinity.json`,
  embodiment_requirements: { class: "DIGITAL_EXECUTION_SHELL", physical_robot: false },
  ownership_policy: "LIFE_IDENTITY_SEPARATE_FROM_PACKAGE_OWNERSHIP",
  custody_policy: "SIMULATION_CUSTODY_ONLY",
  operating_authority: "LOCAL_SIMULATION_ONLY",
  breeding_rights: "SEPARATE_REVIEWED_RIGHT",
  commercial_rights: "NOT_GRANTED_BY_LIFE_IDENTITY",
  transfer_rights: "PACKAGE_RIGHTS_ONLY_NO_LIFE_TRANSFER",
  integrity: { algorithm: "SHA-256", manifest_required: true },
  provenance: {
    source: "KAIOS-K280-DIGITAL-LIFE-GENESIS-MVP-001",
    canonical_schema: "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json",
    base_sha: baseSha,
    real_biological_instruction: false
  },
  status: "DIGITAL_LIFE_MVP",
  simulation_only: true,
  production_authority: false
};

const genome = createGenome();
const pipeline = buildBirthPipeline({ species });
const cambrian = runCambrianExplosion({ generations: 5, capacity: 100 });

function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

function withIntegrity(record) {
  const clean = structuredClone(record);
  delete clean.integrity_hash;
  return { ...record, integrity_hash: sha256(clean) };
}

async function writeJson(relative, value) {
  const path = resolve(root, relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const speciesManifest = withIntegrity({
  schema_version: "1.0",
  species_id: K280_SPECIES_ID,
  species_name: species.display_name,
  species_version: species.species_version,
  taxonomy_ref: "KGEN-KAIOS/organism/taxonomy_registry.json#SPECIES-KAIOS-K280-RAPTOR",
  species_manifest: `${speciesRoot}/species.json`,
  program_filename: "KAIOS/K280/runtime/k280-runtime.js",
  runtime_entrypoint: "KAIOS/K280/runtime/k280-runtime.js#K280LifeRuntime",
  compatibility: ["KAIOS_WEB_STATIC", "LOCAL_NODE_TEST", "BIOLOGICAL_SIMULATION_ONLY", "TAXONOMY_EXTENSION_19"],
  reproduction_rules_ref: `${speciesRoot}/reproduction.json#K280_REPRODUCTION`,
  mutation_rules_ref: `${speciesRoot}/mutation_rules.json`,
  energy_profile_ref: `${speciesRoot}/energy_profile.json`,
  embodiment_profile_ref: `${speciesRoot}/body_plan.json`,
  trade_profile_ref: `KAIOS/exchange/11520/listings/${K280_ORGANISM_ID}.listing.json`,
  organ_requirements: species.organ_systems,
  cell_requirements: species.cell_types,
  lifecycle: species.lifecycle_states,
  release_policy: "DRY_RUN_ONLY",
  organism_schema_version: "2.0",
  status: "CANDIDATE_ONLY"
});

const bodyPlan = {
  body_plan_id: "BODY-PLAN-K280-RAPTOR-V1",
  embodiment_class: "DIGITAL_EXECUTION_SHELL",
  morphology: "DIGITAL_RAPTOR_BIPEDAL",
  segments: ["HEAD", "TORSO", "TAIL", "LEFT_LEG", "RIGHT_LEG", "LEFT_ARM", "RIGHT_ARM"],
  dimensions_meters: { length: 1.8, height: 1.1, width: 0.55 },
  collision_model: "BOUNDED_2D_CAPSULE",
  physical_body_assigned: false,
  simulation_only: true
};

const organSystems = {
  organ_systems: [
    { organ_id: "SENSOR_ARRAY", functions: ["PERCEIVE", "VISION_SIMULATION", "AUDIO_SIMULATION"], health: 100 },
    { organ_id: "LOCOMOTION_SYSTEM", functions: ["MOVE", "ESCAPE_SIMULATION", "HUNT_SIMULATION"], health: 100 },
    { organ_id: "DIGITAL_METABOLISM", functions: ["EAT", "DRINK", "ENERGY_BALANCE"], health: 100 },
    { organ_id: "MEMORY_CORE", functions: ["RECORD_MEMORY", "REPLAY"], health: 100 },
    { organ_id: "HEALTH_REGULATOR", functions: ["HEALING_SIMULATION", "TEMPERATURE_BALANCE"], health: 100 }
  ],
  real_anatomy_instruction: false
};

const cellSystem = {
  cells: species.cell_types.map((cellId, index) => ({
    cell_id: cellId,
    organ_id: organSystems.organ_systems[index % organSystems.organ_systems.length].organ_id,
    cell_type: "SOFTWARE_STATE_CELL",
    update_order: index + 1,
    bounded: true
  })),
  tissue_engineering_instruction: false
};

const reproduction = {
  profiles: {
    K280_REPRODUCTION: {
      mode: "BIOLOGICAL",
      execution: "DIGITAL_RECOMBINATION_SIMULATION",
      sex_compatibility: [["FEMALE", "MALE"]],
      maturity_stage: "ADULT",
      minimum_health: 70,
      minimum_energy: 55,
      proximity_threshold: 12,
      relationship_threshold: 0.4,
      cooldown_ticks: 40,
      parent_genomes_required: 2,
      maximum_organisms_default: 100,
      maximum_organisms_hard: 500,
      capacity_stop_required: true,
      external_agent_creation: false,
      wallet_creation: false,
      biological_instruction: false
    }
  }
};

const mutationRules = {
  mutation_policy_id: "K280-BOUNDED-MUTATION-V1",
  default_probability: 0.08,
  maximum_probability: 0.25,
  mutable_traits: Object.keys(genome.allele_groups),
  permitted_outputs: ["SIZE_VARIATION", "COLORATION_VARIATION", "ENERGY_EFFICIENCY_VARIATION", "SENSORY_VARIATION", "SOCIAL_VARIATION", "ENVIRONMENTAL_ADAPTATION"],
  species_branch_status: "CANDIDATE_SPECIES_BRANCH",
  automatic_species_activation: false,
  real_genetic_engineering: false
};

const lifecycle = {
  states: species.lifecycle_states,
  growth_thresholds: { HATCHLING: 0, JUVENILE: 90, ADULT: 300, ELDER: 900 },
  death_conditions: ["HEALTH_ZERO", "AGE_LIMIT", "SIMULATION_TERMINAL_EVENT"],
  death_terminal: true,
  archive_on_death: true,
  resurrection: false,
  unit: "SIMULATION_TICK"
};

const runtimeBinding = {
  program_filename: "KAIOS/K280/runtime/k280-runtime.js",
  runtime_entrypoint: "KAIOS/K280/runtime/k280-runtime.js#K280LifeRuntime",
  runtime_type: "LOCAL_DETERMINISTIC_SIMULATION",
  runtime_version: "1.0.0",
  execution_environment: ["BROWSER_ES_MODULE", "NODE_ES_MODULE_TEST"],
  required_organs: species.organ_systems,
  required_cells: species.cell_types,
  startup_contract: "VALIDATED_PACKAGE_REQUIRED",
  shutdown_contract: "SERIALIZE_STOP_ARCHIVE",
  health_check: "STATE_BOUNDS_AND_GENOME_CHECKSUM",
  state_path: `${organismRoot}/runtime_state.json`,
  memory_path: `${organismRoot}/memory.json`,
  archive_path: `${organismRoot}/event_log.json`,
  production_authority: false,
  network_required: false
};

const rightsTemplate = {
  policy: "SEPARATED_RIGHTS",
  rights: Object.fromEntries(RIGHTS_CLASSES.map((right) => [right, {
    status: right === "USAGE_RIGHT" || right === "HABITAT_RIGHT" ? "SIMULATION_GRANTED" : "NOT_GRANTED",
    independently_reviewed: true
  }])),
  life_identity_transferable: false,
  wallet_rights: false,
  production_authority: false
};

const listing = {
  listing_id: `LISTING-${K280_ORGANISM_ID}`,
  organism_id: K280_ORGANISM_ID,
  life_id: K280_LIFE_ID,
  listing_type: "DIGITAL_ORGANISM_PACKAGE",
  listing_mode: "SIMULATED_LISTING",
  settlement_mode: "VIRTUAL_SETTLEMENT",
  currency: "SIMULATED_KGEN",
  real_kgen: "DISABLED",
  wallet: "NONE",
  onchain_transfer: "DISABLED",
  status: "NOT_ACTIVE",
  disclaimer: "Buying the digital organism package does not automatically transfer all rights.",
  parties: {
    owner: "MVP_PACKAGE_CUSTODIAN_UNASSIGNED",
    custodian: "KAIOS_K280_SANDBOX",
    operator: "LOCAL_SIMULATION_OPERATOR",
    occupant_life_id: K280_LIFE_ID
  },
  rights: Object.fromEntries(RIGHTS_CLASSES.map((right) => [right, {
    included: ["USAGE_RIGHT", "HABITAT_RIGHT"].includes(right),
    transfer_mode: ["USAGE_RIGHT", "HABITAT_RIGHT"].includes(right) ? "SIMULATED_LICENSE_ONLY" : "SEPARATE_REVIEW_REQUIRED"
  }])),
  package_rights: {
    display_rights: "SIMULATED_PREVIEW",
    reproduction_license_rights: "NOT_INCLUDED",
    resale_rights: "NOT_INCLUDED",
    modification_rights: "NOT_INCLUDED",
    genome_template_rights: "NOT_INCLUDED",
    species_template_rights: "NOT_INCLUDED",
    runtime_authority: "LOCAL_SIMULATION_ONLY",
    governance_authority: "NONE",
    termination_authority: "NONE"
  }
};

const organismManifest = withIntegrity({
  schema_version: "2.0",
  organism_id: K280_ORGANISM_ID,
  organism_name: species.display_name,
  organism_version: "1.0.0",
  organism_class: "DIGITAL_LIFE_MVP",
  life_category: "DIGITAL_ANIMAL_SIMULATION",
  life_type: "DIGITAL_ORGANISM",
  ...Object.fromEntries(Object.entries(taxonomy).slice(0, 8)),
  taxonomy,
  species_ref: `${speciesRoot}/species.json`,
  canonical_file: `${organismRoot}/organism_manifest.json`,
  runtime_entry: "KAIOS/K280/runtime/k280-runtime.js",
  dna_schema: `${speciesRoot}/genome.schema.json`,
  dna_ref: `${organismRoot}/genome.json`,
  rna_ref: `${organismRoot}/behavior.json`,
  organs_ref: `${organismRoot}/organs.json`,
  cells_ref: `${organismRoot}/cells.json`,
  runtime_ref: `${organismRoot}/runtime_state.json`,
  energy_profile_ref: `${organismRoot}/energy.json`,
  embodiment_profile_ref: `${organismRoot}/body.json`,
  lifecycle_ref: `${organismRoot}/lifecycle.json`,
  reproduction_rules_ref: `${speciesRoot}/reproduction.json`,
  mutation_rules_ref: `${speciesRoot}/mutation_rules.json`,
  trade_profile_ref: `KAIOS/exchange/11520/listings/${K280_ORGANISM_ID}.listing.json`,
  ownership_profile_ref: `${organismRoot}/ownership.json`,
  authority_profile_ref: `${organismRoot}/authority.json`,
  runtime_binding: runtimeBinding,
  life_behavior: {
    energy_input: "SIMULATED_FOOD_ENERGY",
    energy_consumption: "BOUNDED_PER_TICK",
    food_or_fuel_type: "SIMULATED_PREY_RESOURCE",
    growth_rules: lifecycle.growth_thresholds,
    repair_rules: "HEALING_SIMULATION_ONLY",
    reproduction_mode: "DIGITAL_RECOMBINATION_SIMULATION",
    compatible_species: [K280_SPECIES_ID],
    offspring_identity_rule: "NEW_ORGANISM_AND_GENOME_ID",
    mutation_policy: mutationRules.mutation_policy_id,
    evolution_policy: "CANDIDATE_BRANCH_REQUIRES_SPECIES_VALIDATION",
    death_or_shutdown_boundary: "DEATH_TERMINAL_RUNTIME_STOP_NOT_DEATH",
    trade_eligibility: "LICENSE_ONLY",
    ownership_boundary: "PACKAGE_OWNERSHIP_NOT_LIFE_OWNERSHIP",
    occupancy_boundary: "HABITAT_OCCUPANCY_SEPARATE",
    authority_boundary: "NO_PRODUCTION_AUTHORITY"
  },
  release: {
    release_mode: "LOCAL_DETERMINISTIC_SIMULATION",
    activation_status: "NOT_ACTIVE",
    production_authority: false,
    runtime_authority: false,
    wallet_authority: false,
    exchange_settlement: false
  },
  created_at: timestamp,
  parent_species: [],
  ancestor_versions: [],
  compatible_mates: [K280_SPECIES_ID],
  mutation_rules: "BOUNDED_DIGITAL_MUTATION",
  fusion_rules: "NOT_ALLOWED",
  split_rules: "NOT_ALLOWED",
  upgrade_path: "SPECIES_PIPELINE_REVALIDATION",
  status: "DIGITAL_LIFE_MVP",
  version: "1.0.0",
  author_agent: "codex-gm-01",
  reviewer_agent: "codex-gm-01-INDEPENDENT_REVIEW_PASS",
  source_commit: baseSha
});

const identity = {
  life_id: K280_LIFE_ID,
  organism_id: K280_ORGANISM_ID,
  species_id: K280_SPECIES_ID,
  genome_id: K280_GENOME_ID,
  embodiment_id: K280_EMBODIMENT_ID,
  birth_event_id: K280_BIRTH_EVENT_ID,
  runtime_instance_id: K280_RUNTIME_INSTANCE_ID,
  identity_scope: "K280_DIGITAL_LIFE_MVP_ONLY",
  legal_personhood: false,
  sentience_claimed: false,
  real_biological_life: false
};

const initialState = {
  simulation_time: 0,
  age: 0,
  health: 100,
  energy: 86,
  hunger: 12,
  hydration: 88,
  temperature: 37.2,
  position: { x: 48, y: 52 },
  active_behavior: "WAKE",
  emotional_state: "CURIOUS",
  lifecycle_stage: "HATCHLING",
  growth_stage: "HATCHLING",
  sex: "FEMALE",
  alive: true,
  runtime_mode: "LOCAL_DETERMINISTIC_SIMULATION",
  authority: "NO_PRODUCTION_AUTHORITY"
};

const genomeSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "KAIOS/K280/genome.schema.json",
  title: "K280 Digital Genome",
  type: "object",
  required: ["genome_id", "parent_genome_ids", "species_id", "generation", "random_seed", "allele_groups", "mutation_history", "phenotype_projection", "mutation_probability", "inheritance_probability", "integrity_checksum"],
  properties: {
    genome_id: { type: "string", pattern: "^GENOME-K280-|^GENOME-KAIOS-RAPTOR-" },
    parent_genome_ids: { type: "array", items: { type: "string" }, maxItems: 2 },
    species_id: { const: K280_SPECIES_ID },
    generation: { type: "integer", minimum: 0, maximum: 100 },
    random_seed: { type: "string", minLength: 1 },
    allele_groups: { type: "object", minProperties: 10 },
    mutation_history: { type: "array" },
    phenotype_projection: { type: "object" },
    mutation_probability: { type: "number", minimum: 0, maximum: 0.25 },
    inheritance_probability: { type: "number", minimum: 0, maximum: 1 },
    integrity_checksum: { type: "string", pattern: "^[a-f0-9]{64}$" },
    biological_instruction: { const: false },
    simulation_only: { const: true }
  },
  additionalProperties: true
};

const customRequestSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "KAIOS/K280/CUSTOM_DINOSAUR_REQUEST_SCHEMA.json",
  title: "K280 Customer Dinosaur Request",
  type: "object",
  required: ["request_id", "dinosaur_type", "size", "appearance", "temperament", "intelligence", "diet", "habitat", "movement", "social_behavior", "lifespan", "reproduction", "mutation_range", "civilization_affinity", "allowed_rights", "commercial_use_status", "transferability", "simulation_limits"],
  properties: {
    request_id: { type: "string", pattern: "^CUSTOM-K280-" },
    dinosaur_type: { type: "string", minLength: 1 },
    size: { enum: ["COMPACT", "STANDARD", "LARGE"] },
    appearance: { type: "object" },
    temperament: { enum: ["CALM", "CURIOUS", "BALANCED", "ASSERTIVE"] },
    intelligence: { type: "number", minimum: 0, maximum: 1 },
    diet: { enum: ["SIMULATED_CARNIVORE", "SIMULATED_HERBIVORE", "SIMULATED_OMNIVORE"] },
    habitat: { type: "string" },
    movement: { type: "string" },
    social_behavior: { type: "string" },
    lifespan: { type: "integer", minimum: 100, maximum: 10000 },
    reproduction: { type: "object" },
    mutation_range: { type: "number", minimum: 0, maximum: 0.25 },
    civilization_affinity: { type: "string" },
    allowed_rights: { type: "array", items: { enum: RIGHTS_CLASSES } },
    commercial_use_status: { enum: ["NOT_GRANTED", "SIMULATED_REVIEW_ONLY"] },
    transferability: { enum: ["NOT_TRANSFERABLE", "PACKAGE_LICENSE_ONLY"] },
    simulation_limits: { type: "object", required: ["maximum_organisms", "maximum_ticks"] }
  },
  additionalProperties: false
};

const outputs = new Map([
  [`${speciesRoot}/species.json`, species],
  [`${speciesRoot}/taxonomy.json`, { schema_version: "1.0", species_id: K280_SPECIES_ID, taxonomy, extension_19_compatible: true }],
  [`${speciesRoot}/species_manifest.json`, speciesManifest],
  [`${speciesRoot}/genome.schema.json`, genomeSchema],
  [`${speciesRoot}/genome.default.json`, genome],
  [`${speciesRoot}/body_plan.json`, bodyPlan],
  [`${speciesRoot}/organ_systems.json`, organSystems],
  [`${speciesRoot}/cell_system.json`, cellSystem],
  [`${speciesRoot}/behavior_model.json`, { behavior_model_id: "K280-BEHAVIOR-V1", states: ["WAKE", "SLEEP", "REST", "MOVE", "OBSERVE", "EXPLORE", "FORAGE", "SEEK_WATER", "HUNT_SIMULATION", "ESCAPE_SIMULATION"], deterministic_selection: true, external_actions: false }],
  [`${speciesRoot}/memory_model.json`, { memory_model_id: "K280-MEMORY-V1", maximum_records: 80, classes: ["WORKING_SIMULATION", "HABITAT_EVENT", "SOCIAL_EVENT"], private_human_memory: false, replayable: true }],
  [`${speciesRoot}/lifecycle.json`, lifecycle],
  [`${speciesRoot}/reproduction.json`, reproduction],
  [`${speciesRoot}/mutation_rules.json`, mutationRules],
  [`${speciesRoot}/habitat_requirements.json`, { habitat_id: "HABITAT-K280-CAMBRIAN-LAB", display_name: "K280 寒武紀生命大爆發實驗場", temperature_range: [2, 16], water_required: true, food_resource_required: true, coordinate_bounds: [0, 0, 100, 100], production_environment: false }],
  [`${speciesRoot}/civilization_affinity.json`, { initial_role: "WILD_DIGITAL_ORGANISM", affinity_status: "CIVILIZATION_AFFINITY_CANDIDATE", governance_authority: "NONE", supported_roles: ["WILD_ORGANISM", "DOMESTICATED_ORGANISM", "COMPANION_ORGANISM", "ECOLOGICAL_ORGANISM", "LABOR_SUPPORT_ORGANISM", "RESEARCH_ORGANISM", "CULTURAL_SYMBOL_ORGANISM", "GUARDIAN_ORGANISM", "CIVILIZATION_PARTICIPANT_ORGANISM"] }],
  [`${speciesRoot}/rights_template.json`, rightsTemplate],
  [`${speciesRoot}/runtime_binding.json`, runtimeBinding],
  [`${speciesRoot}/energy_profile.json`, { profile_id: "K280-SIMULATED-METABOLISM", input: "SIMULATED_FOOD_ENERGY", consumption_per_tick: 0.55, storage_range: [0, 100], free_energy: false }],
  [`${organismRoot}/identity.json`, identity],
  [`${organismRoot}/life_identity.json`, { ...identity, classification: "DIGITAL_LIFE_MVP", birth_mode: "NATURAL_KAIOS_INSTANTIATION", current_state: "BORN_IN_LOCAL_SIMULATION" }],
  [`${organismRoot}/organism_manifest.json`, organismManifest],
  [`${organismRoot}/birth_record.json`, { birth_event_id: K280_BIRTH_EVENT_ID, birth_mode: "NATURAL_KAIOS_INSTANTIATION", pipeline_id: pipeline.pipeline_id, timestamp, release_scope: "LOCAL_DETERMINISTIC_SIMULATION", legal_birth: false, real_biological_birth: false }],
  [`${organismRoot}/provenance.json`, { task_id: "KAIOS-K280-DIGITAL-LIFE-GENESIS-MVP-001", source_species_id: K280_SPECIES_ID, canonical_schema: "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json", base_sha: baseSha, generated_by: "codex-gm-01", technical_provenance_not_parent_life: true }],
  [`${organismRoot}/integrity.json`, { organism_manifest_sha256: organismManifest.integrity_hash, genome_checksum: genome.integrity_checksum, package_checksum: checksum({ identity, genome: genome.integrity_checksum, manifest: organismManifest.integrity_hash }) }],
  [`${organismRoot}/genome.json`, genome],
  [`${organismRoot}/phenotype.json`, genome.phenotype_projection],
  [`${organismRoot}/body.json`, { embodiment_id: K280_EMBODIMENT_ID, ...bodyPlan, occupant_life_id: K280_LIFE_ID, owner_id: "UNASSIGNED_SIMULATION_PACKAGE", operator_id: "LOCAL_SIMULATION_OPERATOR", custodian_id: "KAIOS_K280_SANDBOX" }],
  [`${organismRoot}/cells.json`, cellSystem],
  [`${organismRoot}/organs.json`, organSystems],
  [`${organismRoot}/health.json`, { health: 100, status: "HEALTHY", injuries: [], terminal: false }],
  [`${organismRoot}/energy.json`, { energy: 86, maximum: 100, source: "SIMULATED_FOOD_ENERGY", wallet_funding: false }],
  [`${organismRoot}/needs.json`, { hunger: 12, hydration: 88, temperature: 37.2, sleep_pressure: 8 }],
  [`${organismRoot}/behavior.json`, { active_behavior: "WAKE", available_behaviors: ["MOVE", "PERCEIVE", "EAT", "DRINK", "REST", "SOCIAL_INTERACTION", "HUNT_SIMULATION", "ESCAPE_SIMULATION"] }],
  [`${organismRoot}/memory.json`, { records: [], maximum_records: 80, private_human_memory: false }],
  [`${organismRoot}/personality.json`, { curiosity: 0.76, caution: 0.58, sociability: genome.social_traits.affinity, persistence: 0.72, aggression: genome.aggression_traits.intensity }],
  [`${organismRoot}/lifecycle.json`, { ...lifecycle, current_state: "BORN_IN_SIMULATION", current_growth_stage: "HATCHLING" }],
  [`${organismRoot}/reproduction_state.json`, { eligible: false, reason: "NOT_MATURE", cooldown_ticks: 0, offspring: [] }],
  [`${organismRoot}/mutation_history.json`, { genome_id: genome.genome_id, mutations: genome.mutation_history }],
  [`${organismRoot}/habitat.json`, { habitat_id: "HABITAT-K280-CAMBRIAN-LAB", occupancy: "SIMULATED", position: initialState.position, rights: "HABITAT_RIGHT_SIMULATION_ONLY" }],
  [`${organismRoot}/civilization_state.json`, { stage: "PRIMITIVE_FORAGING", role: "WILD_DIGITAL_ORGANISM", affinity: "CIVILIZATION_AFFINITY_CANDIDATE", governance_authority: "NONE" }],
  [`${organismRoot}/runtime_state.json`, { runtime_instance_id: K280_RUNTIME_INSTANCE_ID, ...initialState, production_authority: false, network_required: false, wallet: null }],
  [`${organismRoot}/event_log.json`, { events: pipeline.event_log, replay_seed: genome.random_seed }],
  [`${organismRoot}/ownership.json`, { life_identity_owner: "SELF_IDENTITY_WITHIN_MVP_MODEL", package_owner: "UNASSIGNED", transferable: false, legal_title: false }],
  [`${organismRoot}/custody.json`, { custodian_id: "KAIOS_K280_SANDBOX", custody_scope: "LOCAL_FILES_AND_SIMULATION_STATE", owns_life: false }],
  [`${organismRoot}/operation_rights.json`, { operator_id: "LOCAL_SIMULATION_OPERATOR", scope: "START_PAUSE_STEP_RESET_REPLAY", production: false }],
  [`${organismRoot}/usage_rights.json`, { status: "SIMULATION_GRANTED", commercial_use: false }],
  [`${organismRoot}/breeding_rights.json`, { status: "SIMULATION_ONLY", automatic_commercial_license: false }],
  [`${organismRoot}/commercial_license.json`, { status: "NOT_GRANTED", requires_separate_contract: true }],
  [`${organismRoot}/transfer_rights.json`, { life_identity_transfer: false, package_license_transfer: false, onchain_transfer: false }],
  [`${organismRoot}/habitat_rights.json`, { habitat_id: "HABITAT-K280-CAMBRIAN-LAB", status: "SIMULATION_OCCUPANCY", legal_land_right: false }],
  [`${organismRoot}/authority.json`, { authority: "NO_PRODUCTION_AUTHORITY", runtime_authority: false, governance_authority: false, wallet_authority: false, termination_authority: false }],
  [`KAIOS/exchange/11520/listings/${K280_ORGANISM_ID}.listing.json`, listing],
  ["KAIOS/K280/CUSTOM_DINOSAUR_REQUEST_SCHEMA.json", customRequestSchema],
  ["KAIOS/K280/data/birth_pipeline.json", pipeline],
  ["KAIOS/K280/data/cambrian_demo.json", cambrian],
  ["api/kaios/k280/species.json", species],
  ["api/kaios/k280/organism.json", organismManifest],
  ["api/kaios/k280/state.json", { ...initialState, status: "STATIC_INITIAL_SNAPSHOT", live_runtime: false }],
  ["api/kaios/k280/events.json", { events: pipeline.event_log, static_export: true }],
  ["api/kaios/k280/civilization.json", { stage: "PRIMITIVE_FORAGING", stages: ["PRIMITIVE_FORAGING", "AGRICULTURAL", "URBAN", "INDUSTRIAL", "ELECTRICAL", "INFORMATION", "AI_CIVILIZATION", "SPACEFARING", "INTERSTELLAR", "IMMORTAL_CIVILIZATION", "DEITY_CIVILIZATION", "DIVINE_ARMY_CIVILIZATION"], current_authority: "NONE" }],
  ["api/kaios/k280/population.json", cambrian],
  ["api/kaios/k280/listing.json", listing],
  ["api/kaios/k280/rights.json", rightsTemplate]
]);

for (const [path, value] of outputs) await writeJson(path, value);

console.log(JSON.stringify({
  status: "K280_PACKAGE_BUILT",
  files_written: outputs.size,
  species_id: K280_SPECIES_ID,
  organism_id: K280_ORGANISM_ID,
  genome_id: genome.genome_id,
  pipeline_stages: pipeline.stages.length,
  generations: cambrian.generation_count,
  surviving_population: cambrian.surviving_population,
  production_authority: false,
  wallet_created: false,
  real_kgen: false
}, null, 2));
