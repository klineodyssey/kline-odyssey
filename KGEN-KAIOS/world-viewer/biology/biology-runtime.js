import {
  boundedPush,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";
import { createEvolutionRuntime, EVOLUTION_PATHWAYS } from "./evolution-runtime.js";
import { createGenomeRuntime } from "./genome-runtime.js";
import {
  createTaxonomyRecord,
  FOOD_CHAIN_ROLES_V2,
  SPECIES_CATEGORIES,
  TAXONOMY_RANKS,
  validateTaxonomyRecord,
  resolveTrophicRoleV2
} from "./taxonomy-standard.js";

const RUNTIME = "BiologyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;
const MAX_HISTORY = 240;
const NATURAL_REPRODUCTION = new Set(["MATE", "EGG", "BIRTH"]);
const PROPOSAL_REPRODUCTION = new Set(["CLONE", "ARTIFICIAL_BREEDING"]);

function inherentCapabilities(category) {
  if (["AI_ORGANISM", "APP_ORGANISM", "COMPANY_ORGANISM", "ROBOT"].includes(category)) {
    return ["INTEGRITY", "ENERGY_BUDGET", "REPAIR", "VERSIONED_BIRTH", "RETIREMENT"];
  }
  if (category === "PLANT") return ["METABOLISM", "GROWTH", "REPAIR", "REPRODUCTION", "ENVIRONMENT_RESPONSE"];
  if (category === "FUNGUS" || category === "MICROORGANISM") return ["METABOLISM", "GROWTH", "REPAIR", "REPRODUCTION", "RESOURCE_RESPONSE"];
  return ["BREATHING", "METABOLISM", "GROWTH", "REPAIR", "REPRODUCTION", "DANGER_RESPONSE"];
}

function normalizeSpecies(source) {
  const taxonomy = createTaxonomyRecord(source);
  const category = taxonomy.category;
  const digital = ["AI_ORGANISM", "APP_ORGANISM", "COMPANY_ORGANISM", "ROBOT"].includes(category);
  return {
    species_id: String(source.species_id),
    label: String(source.label),
    category,
    taxonomy,
    registry_status: "REGISTERED_SYNTHETIC",
    source_of_truth: false,
    simulation_only: true,
    body_profile_id: source.body_profile_id ?? `body-${String(source.species_id).toLowerCase()}`,
    species_os_id: source.species_os_id ?? `species-os-${String(source.species_id).toLowerCase()}`,
    life_os_profile_id: source.life_os_profile_id ?? `life-os-${String(source.species_id).toLowerCase()}`,
    dna_summary_id: source.dna_summary_id ?? `dna-summary-${String(source.species_id).toLowerCase()}`,
    evolution_stage: source.evolution_stage ?? "FUTURE",
    evolution_target: source.evolution_target ?? null,
    habitat: source.habitat ?? (digital ? "COMPUTE_HABITAT" : "UNKNOWN_HABITAT"),
    trophic_role: source.trophic_role ? resolveTrophicRoleV2(source) : null,
    food_sources: Array.isArray(source.food_sources) ? [...source.food_sources] : digital ? ["ENERGY"] : [],
    predators: Array.isArray(source.predators) ? [...source.predators] : [],
    prey: Array.isArray(source.prey) ? [...source.prey] : [],
    population: Number.isInteger(source.population) ? source.population : 0,
    health: Number.isFinite(source.health) ? source.health : 100,
    lifecycle_days: Number.isFinite(source.lifecycle_days) ? source.lifecycle_days : null,
    oxygen_required: source.oxygen_required === true,
    water_required: source.water_required === true,
    inherent_life_capabilities: inherentCapabilities(category),
    status: source.trophic_role ? (source.population > 0 ? "ACTIVE" : "EXTINCT") : "ACTIVE_OR_REGISTERED",
    population_revision: 0
  };
}

function restoreState(candidate, defaults) {
  if (!candidate || !Array.isArray(candidate.registry)) return defaults;
  const savedRegistry = new Map(candidate.registry.map((record) => [record.species_id, record]));
  return {
    ...defaults,
    ...candidate,
    registry: defaults.registry.map((record) => {
      const saved = savedRegistry.get(record.species_id);
      return saved ? { ...record, population: saved.population, health: saved.health, status: saved.status, population_revision: saved.population_revision } : record;
    }),
    reproduction_history: Array.isArray(candidate.reproduction_history) ? candidate.reproduction_history.slice(-MAX_HISTORY) : [],
    fossil_records: Array.isArray(candidate.fossil_records) ? candidate.fossil_records.slice(-MAX_HISTORY) : [],
    species_history: Array.isArray(candidate.species_history) ? candidate.species_history.slice(-MAX_HISTORY) : defaults.species_history,
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

function planetCompatibility(species, profile) {
  const planetId = profile.planet_id;
  const unknown = profile.body_type === "UNKNOWN" || planetId === "FUTURE_PLANET";
  const digital = ["AI_ORGANISM", "APP_ORGANISM", "COMPANY_ORGANISM", "ROBOT"].includes(species.category);
  let status = "BASE_REQUIRED";
  if (unknown) status = "UNKNOWN_REVIEW_REQUIRED";
  else if (planetId === "EARTH") status = digital ? "BASE_REQUIRED" : "COMPATIBLE";
  else if (planetId === "JUPITER") status = "NOT_SURVIVABLE";
  else if (["MOON", "MARS"].includes(planetId)) status = "BASE_REQUIRED";
  const requirements = [];
  if (species.oxygen_required && profile.atmosphere?.oxygen_available !== true) requirements.push("OXYGEN_SUPPORT");
  if (species.water_required && !String(profile.water).includes("LIQUID")) requirements.push("WATER_SUPPORT");
  if (String(profile.food_availability).includes("NONE") && !digital) requirements.push("FOOD_SUPPORT");
  if (String(profile.radiation).includes("HIGH")) requirements.push("RADIATION_SHIELDING");
  if (profile.gravity_g === null || profile.gravity_g === undefined) requirements.push("GRAVITY_REVIEW");
  return {
    planet_id: planetId,
    species_id: species.species_id,
    status,
    requirements,
    gravity_g: profile.gravity_g,
    atmosphere: profile.atmosphere?.status,
    temperature: profile.temperature?.class,
    radiation: profile.radiation,
    water: profile.water,
    oxygen_available: profile.atmosphere?.oxygen_available === true,
    food_availability: profile.food_availability
  };
}

export function createBiologyRuntime({
  config,
  speciesCatalog = [],
  atomCatalog,
  planetProfiles = [],
  storage,
  storageKey = "kaios.world-viewer.biology.v1"
} = {}) {
  if (!config || config.decision_id !== "HUMAN-SPRINT-008-CAMBRIAN-EXPLOSION") {
    throw new TypeError("Biology Runtime requires the Sprint 008 Biology fixture");
  }
  const combined = [...speciesCatalog, ...(config.additional_species ?? [])].map(normalizeSpecies);
  const speciesIds = new Set(combined.map(({ species_id: id }) => id));
  if (speciesIds.size !== combined.length) throw runtimeError(RUNTIME, "DUPLICATE_SPECIES", "Species Registry identifiers must be unique");
  const categories = new Set(combined.map(({ category }) => category));
  if (!SPECIES_CATEGORIES.every((category) => categories.has(category))) {
    throw runtimeError(RUNTIME, "CATEGORY_COVERAGE_INCOMPLETE", "Species Registry category coverage is incomplete");
  }

  const defaults = {
    revision: 0,
    registry: combined,
    reproduction_history: [],
    fossil_records: [],
    species_history: combined.map((species, index) => ({
      history_id: `species-history-${String(index + 1).padStart(4, "0")}`,
      species_id: species.species_id,
      event_type: "SPECIES_REGISTERED",
      stage: species.evolution_stage,
      evidence: "SPRINT_008_SYNTHETIC_FIXTURE"
    })),
    events: []
  };
  const storageRef = resolveStorage(storage);
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.registry));
  let state = restoreState(saved?.state, defaults);
  let destroyed = false;
  const genome = createGenomeRuntime(combined);
  const evolution = createEvolutionRuntime({ speciesRecords: combined, atomCatalog, storage, storageKey: `${storageKey}.evolution` });
  const evolutionTree = combined
    .filter(({ evolution_target: target }) => target && speciesIds.has(target))
    .map(({ species_id: parent, evolution_target: child }) => ({ parent_species_id: parent, child_species_id: child, relationship: "SYNTHETIC_EVOLUTION_LINEAGE" }));
  const cambrianTimeline = (config.cambrian_timeline ?? []).map((stage) => ({ ...stage }));

  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const getSnapshot = () => {
    const evolutionSnapshot = evolution.getSnapshot();
    const profileIndex = new Map(evolutionSnapshot.profiles.map((profile) => [profile.species_id, profile]));
    const active = state.registry.filter(({ status }) => status !== "EXTINCT");
    return snapshot({
      runtime: "CAMBRIAN_BIOLOGY_FOUNDATION_ALPHA",
      schema_version: SCHEMA_VERSION,
      decision_id: config.decision_id,
      synthetic: true,
      source_of_truth: false,
      real_genetic_engineering: false,
      taxonomy_ranks: TAXONOMY_RANKS,
      registry_categories: SPECIES_CATEGORIES,
      registry: state.registry.map((species) => ({ ...species, genome_id: genome.getGenome(species.species_id).genome_id, evolution: profileIndex.get(species.species_id) })),
      registry_count: state.registry.length,
      active_species_count: active.length,
      category_coverage: Object.fromEntries(SPECIES_CATEGORIES.map((category) => [category, state.registry.filter((species) => species.category === category).length])),
      genomes: genome.getSnapshot(),
      evolution: evolutionSnapshot,
      evolution_pathways: EVOLUTION_PATHWAYS,
      evolution_tree: evolutionTree,
      cambrian_timeline: cambrianTimeline,
      reproduction: {
        natural_modes: [...NATURAL_REPRODUCTION],
        proposal_only_modes: [...PROPOSAL_REPRODUCTION],
        history: state.reproduction_history
      },
      fossils: state.fossil_records,
      species_history: state.species_history,
      planet_ecology: planetProfiles.flatMap((profile) => state.registry.map((species) => planetCompatibility(species, profile))),
      civilization_evolution: state.registry.map((species) => {
        const profile = profileIndex.get(species.species_id);
        const pathwayScore = profile.pathways.LEARNING + profile.pathways.CIVILIZATION + profile.pathways.TECHNOLOGY + profile.pathways.AI;
        return {
          species_id: species.species_id,
          readiness: Math.min(100, Math.round(profile.active_atom_ids.length / 108 * 60 + Math.min(40, pathwayScore / 25))),
          fixed_role: false,
          eligible: profile.active_atom_ids.length > 0 && pathwayScore > 0,
          constraints: ["LIFE_INTEGRITY", "RESOURCE_BALANCE", "ENVIRONMENT", "EVIDENCE", "REVIEW"]
        };
      }),
      revision: state.revision,
      events: state.events
    });
  };
  const notifier = createNotifier(getSnapshot);
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Biology Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, { event_id: stableId("biology", state.revision), type, ...details }, MAX_EVENTS);
  }

  function synchronizeEcosystem(ecosystemSnapshot) {
    usable();
    const ecology = new Map((ecosystemSnapshot?.species ?? []).map((species) => [species.species_id, species]));
    let changed = false;
    for (const species of state.registry) {
      const observed = ecology.get(species.species_id);
      if (!observed) continue;
      const previousStatus = species.status;
      species.population = observed.population;
      species.health = observed.health;
      species.status = observed.status;
      species.population_revision = observed.population_revision;
      if (previousStatus !== observed.status) {
        changed = true;
        const history = {
          history_id: stableId("species-history", state.revision + state.species_history.length + 1),
          species_id: species.species_id,
          event_type: observed.status === "EXTINCT" ? "SPECIES_EXTINCTION_OBSERVED" : "SPECIES_RECOVERY_OBSERVED",
          stage: species.evolution_stage,
          evidence: `ECOSYSTEM_REVISION_${ecosystemSnapshot.revision}`
        };
        boundedPush(state.species_history, history, MAX_HISTORY);
        if (observed.status === "EXTINCT" && !state.fossil_records.some(({ species_id: id }) => id === species.species_id)) {
          boundedPush(state.fossil_records, {
            fossil_id: `FOSSIL-${species.species_id}-${String(state.fossil_records.length + 1).padStart(4, "0")}`,
            species_id: species.species_id,
            taxonomy: species.taxonomy,
            extinction_evidence: history.evidence,
            record_type: "SYNTHETIC_FOSSIL_RECORD",
            immutable: true
          }, MAX_HISTORY);
        }
        record(history.event_type, { species_id: species.species_id, evidence: history.evidence });
      }
    }
    if (changed) {
      persist();
      notifier.emit("ECOLOGY_SYNCHRONIZED", { ecosystem_revision: ecosystemSnapshot.revision });
    }
    return getSnapshot();
  }

  function advanceEvolution(request) {
    usable();
    evolution.advance(request);
    record("EVOLUTION_PROFILE_UPDATED", { species_id: request.speciesId, pathway: request.pathway, evidence_id: request.evidence?.evidence_id });
    persist();
    notifier.emit("EVOLUTION_PROFILE_UPDATED", { species_id: request.speciesId });
    return getSnapshot();
  }

  function requestReproduction({ speciesId, mode, evidence = {} } = {}) {
    usable();
    const species = state.registry.find(({ species_id: id }) => id === String(speciesId));
    if (!species) throw runtimeError(RUNTIME, "SPECIES_NOT_FOUND", `Unknown Species ${speciesId}`);
    const normalizedMode = String(mode ?? "").toUpperCase();
    if (!NATURAL_REPRODUCTION.has(normalizedMode) && !PROPOSAL_REPRODUCTION.has(normalizedMode)) {
      throw runtimeError(RUNTIME, "INVALID_REPRODUCTION_MODE", `Unknown reproduction mode ${mode}`);
    }
    const proposalOnly = PROPOSAL_REPRODUCTION.has(normalizedMode);
    if (!proposalOnly && (!evidence.evidence_id || evidence.reviewed !== true || species.population < 1 || species.status === "EXTINCT")) {
      throw runtimeError(RUNTIME, "REPRODUCTION_GATE_FAILED", "Natural reproduction requires reviewed evidence and an active synthetic population");
    }
    const recordEntry = {
      reproduction_id: stableId("reproduction", state.revision + 1),
      species_id: species.species_id,
      mode: normalizedMode,
      status: proposalOnly ? "PROPOSAL_ONLY_REVIEW_REQUIRED" : "SIMULATED_LINEAGE_RECORDED",
      evidence_id: evidence.evidence_id ?? null,
      population_mutated: false,
      real_biology: false
    };
    boundedPush(state.reproduction_history, recordEntry, MAX_HISTORY);
    record(proposalOnly ? "REPRODUCTION_PROPOSAL_CREATED" : "REPRODUCTION_EVENT_RECORDED", { reproduction_id: recordEntry.reproduction_id, species_id: species.species_id, mode: normalizedMode });
    persist();
    notifier.emit("REPRODUCTION_RECORDED", recordEntry);
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (new Set(state.registry.map(({ species_id: id }) => id)).size !== state.registry.length) issues.push("Species Registry identifiers are not unique");
    if (!SPECIES_CATEGORIES.every((category) => state.registry.some((species) => species.category === category))) issues.push("Species category coverage is incomplete");
    for (const species of state.registry) {
      if (!validateTaxonomyRecord({ ...species.taxonomy, category: species.category })) issues.push(`${species.species_id}: invalid taxonomy`);
      if (species.trophic_role !== null && !FOOD_CHAIN_ROLES_V2.includes(species.trophic_role)) issues.push(`${species.species_id}: invalid Food Chain V2 role`);
      if (!species.body_profile_id || !species.species_os_id || !species.life_os_profile_id) issues.push(`${species.species_id}: life layers incomplete`);
      if (!species.inherent_life_capabilities.length) issues.push(`${species.species_id}: inherent capabilities missing`);
    }
    if (state.reproduction_history.some(({ mode, status }) => PROPOSAL_REPRODUCTION.has(mode) && status !== "PROPOSAL_ONLY_REVIEW_REQUIRED")) issues.push("Clone or artificial breeding escaped proposal-only boundary");
    const genomeReport = genome.integrityReport();
    const evolutionReport = evolution.integrityReport();
    if (!genomeReport.ok) issues.push(...genomeReport.issues.map((issue) => `Genome: ${issue}`));
    if (!evolutionReport.ok) issues.push(...evolutionReport.issues.map((issue) => `Evolution: ${issue}`));
    return snapshot({
      ok: issues.length === 0,
      runtime: "CAMBRIAN_BIOLOGY_FOUNDATION_ALPHA",
      registry_count: state.registry.length,
      taxonomy_rank_count: TAXONOMY_RANKS.length,
      atom_count: evolution.getSnapshot().catalog.atoms.length,
      fossil_count: state.fossil_records.length,
      reports: { genome: genomeReport, evolution: evolutionReport },
      issues
    });
  }

  return Object.freeze({
    getSnapshot,
    getSpecies(speciesId) {
      const result = getSnapshot().registry.find(({ species_id: id }) => id === String(speciesId));
      if (!result) throw runtimeError(RUNTIME, "SPECIES_NOT_FOUND", `Unknown Species ${speciesId}`);
      return result;
    },
    synchronizeEcosystem,
    advanceEvolution,
    requestReproduction,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      evolution.destroy();
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}
