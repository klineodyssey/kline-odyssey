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

const RUNTIME = "EvolutionRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;
export const EVOLUTION_PATHWAYS = Object.freeze(["MUTATION", "SELECTION", "ADAPTATION", "LEARNING", "CIVILIZATION", "TECHNOLOGY", "AI"]);

const DOMAIN_NAMES = Object.freeze([
  "Life Support", "Perception and Action", "Learning and Memory", "Reasoning and Decision",
  "Production and Resources", "Social and Communication", "Family and Reproduction", "Engineering and Building",
  "Market and Finance", "Governance and Diplomacy", "Universe and Space", "Genesis Integration"
]);

function fallbackCatalog() {
  const domains = DOMAIN_NAMES.map((name, index) => ({
    domain_id: `DOMAIN_${String.fromCharCode(65 + index)}`,
    code: String.fromCharCode(65 + index),
    name,
    range: `GA${String(index * 9 + 1).padStart(3, "0")}-GA${String(index * 9 + 9).padStart(3, "0")}`
  }));
  const atoms = Array.from({ length: 108 }, (_, index) => ({
    ga_id: `GA${String(index + 1).padStart(3, "0")}`,
    domain_id: domains[Math.floor(index / 9)].domain_id,
    name: `PUBLIC_CAPABILITY_${String(index + 1).padStart(3, "0")}`,
    purpose: "Public synthetic fallback capability; load the reviewed public catalog for full semantics.",
    dependencies: index % 9 === 0 ? [] : [`GA${String(index).padStart(3, "0")}`],
    risk_class: index === 107 ? "R5_HUMAN_FINAL_REVIEW" : index === 106 ? "R4_HUMAN_GOVERNANCE_REVIEW" : "R2",
    status: "FALLBACK_PUBLIC_CATALOG"
  }));
  return { metadata: { atom_count: 108, domain_count: 12, source_of_truth: false }, domains, atoms };
}

function normalizeCatalog(catalog) {
  const source = catalog?.atoms?.length === 108 && catalog?.domains?.length === 12 ? catalog : fallbackCatalog();
  return snapshot({
    metadata: { ...source.metadata, source_of_truth: false, runtime_use: "PUBLIC_CAPABILITY_REFERENCE" },
    domains: source.domains.map(({ domain_id, code, name, range }) => ({ domain_id, code, name, range })),
    atoms: source.atoms.map(({ ga_id, domain_id, name, purpose, dependencies = [], incompatible_atoms = [], risk_class, status }) => ({
      ga_id, domain_id, name, purpose, dependencies, incompatible_atoms, risk_class, catalog_status: status
    }))
  });
}
function initialProfile(species) {
  return {
    species_id: species.species_id,
    atom_capacity: 108,
    active_atom_ids: [],
    evolution_xp: 0,
    training_level: 1,
    genome_generation: "G0",
    growth: 0,
    ability_count: 0,
    pathways: Object.fromEntries(EVOLUTION_PATHWAYS.map((pathway) => [pathway, 0])),
    last_evidence_id: null,
    revision: 0
  };
}

export function createEvolutionRuntime({ speciesRecords = [], atomCatalog, storage, storageKey = "kaios.world-viewer.evolution.v1" } = {}) {
  const catalog = normalizeCatalog(atomCatalog);
  const atomIndex = new Map(catalog.atoms.map((atom) => [atom.ga_id, atom]));
  const storageRef = resolveStorage(storage);
  const defaults = speciesRecords.map(initialProfile);
  const defaultIds = new Set(defaults.map(({ species_id: id }) => id));
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.profiles));
  const savedIndex = new Map((saved?.profiles ?? []).map((profile) => [profile.species_id, profile]));
  let profiles = defaults.map((profile) => {
    const candidate = savedIndex.get(profile.species_id);
    if (!candidate) return profile;
    return {
      ...profile,
      ...candidate,
      atom_capacity: 108,
      active_atom_ids: Array.isArray(candidate.active_atom_ids) ? candidate.active_atom_ids.filter((id) => atomIndex.has(id)).slice(0, 108) : [],
      pathways: { ...profile.pathways, ...(candidate.pathways ?? {}) }
    };
  });
  let events = Array.isArray(saved?.events) ? saved.events.slice(-MAX_EVENTS) : [];
  let revision = Number.isInteger(saved?.revision) ? saved.revision : 0;
  let destroyed = false;

  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, revision, profiles, events });
  const getSnapshot = () => snapshot({
    runtime: "GENESIS_CAPABILITY_EVOLUTION_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    source_of_truth: false,
    atom_count_limit: 108,
    atom_count_is_power_score: false,
    atom_count_defines_role: false,
    catalog,
    profiles,
    events,
    revision
  });
  const notifier = createNotifier(getSnapshot);
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Evolution Runtime has been destroyed");
  };

  function getProfile(speciesId) {
    const profile = profiles.find(({ species_id: id }) => id === String(speciesId));
    if (!profile) throw runtimeError(RUNTIME, "SPECIES_NOT_FOUND", `Unknown Species ${speciesId}`);
    return profile;
  }

  function advance({ speciesId, pathway = "ADAPTATION", evidence = {}, humanApproval = false } = {}) {
    usable();
    const profile = getProfile(speciesId);
    const normalizedPathway = String(pathway).toUpperCase();
    if (!EVOLUTION_PATHWAYS.includes(normalizedPathway)) throw runtimeError(RUNTIME, "INVALID_PATHWAY", `Unknown pathway ${pathway}`);
    const score = Number(evidence.score);
    if (!evidence.evidence_id || evidence.reviewed !== true || !Number.isFinite(score) || score <= 0 || score > 100) {
      throw runtimeError(RUNTIME, "EVIDENCE_REQUIRED", "Evolution requires reviewed evidence with a score from 1 to 100");
    }
    profile.evolution_xp += Math.round(score);
    profile.training_level = Math.min(1000, 1 + Math.floor(profile.evolution_xp / 100));
    profile.growth = Math.min(100, profile.growth + score / 20);
    profile.pathways[normalizedPathway] += Math.round(score);
    profile.last_evidence_id = String(evidence.evidence_id);
    profile.revision += 1;

    const targetCount = Math.min(108, Math.floor(profile.evolution_xp / 100));
    const unlocked = [];
    while (profile.active_atom_ids.length < targetCount) {
      const candidate = catalog.atoms[profile.active_atom_ids.length];
      if (!candidate) break;
      const dependenciesPass = candidate.dependencies.every((id) => profile.active_atom_ids.includes(id));
      const highRisk = String(candidate.risk_class).startsWith("R4") || String(candidate.risk_class).startsWith("R5");
      if (!dependenciesPass || (highRisk && humanApproval !== true)) break;
      if (candidate.incompatible_atoms.some((id) => profile.active_atom_ids.includes(id))) break;
      profile.active_atom_ids.push(candidate.ga_id);
      unlocked.push(candidate.ga_id);
    }
    profile.ability_count = profile.active_atom_ids.length;
    revision += 1;
    boundedPush(events, {
      event_id: stableId("evolution", revision),
      type: "VERIFIED_EVOLUTION_PROGRESS",
      species_id: profile.species_id,
      pathway: normalizedPathway,
      evidence_id: profile.last_evidence_id,
      xp_added: Math.round(score),
      atoms_unlocked: unlocked
    }, MAX_EVENTS);
    persist();
    notifier.emit("EVOLUTION_ADVANCED", { species_id: profile.species_id, pathway: normalizedPathway, atoms_unlocked: unlocked });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (catalog.atoms.length !== 108 || catalog.domains.length !== 12) issues.push("Genesis Atom catalog must contain 12 domains and 108 atoms");
    if (new Set(catalog.atoms.map(({ ga_id: id }) => id)).size !== 108) issues.push("Genesis Atom identifiers are not unique");
    if (profiles.length !== defaultIds.size) issues.push("Evolution profiles do not match Species Registry");
    for (const profile of profiles) {
      if (profile.atom_capacity !== 108 || profile.active_atom_ids.length > 108) issues.push(`${profile.species_id}: invalid atom capacity`);
      if (profile.ability_count !== profile.active_atom_ids.length) issues.push(`${profile.species_id}: ability count mismatch`);
      if (profile.training_level < 1 || profile.training_level > 1000) issues.push(`${profile.species_id}: invalid training level`);
      if (!EVOLUTION_PATHWAYS.every((pathway) => Number.isFinite(profile.pathways[pathway]))) issues.push(`${profile.species_id}: pathway state incomplete`);
    }
    return snapshot({ ok: issues.length === 0, runtime: "GENESIS_CAPABILITY_EVOLUTION_ALPHA", species_count: profiles.length, issues });
  }

  return Object.freeze({
    getSnapshot,
    getProfile: (speciesId) => snapshot(getProfile(speciesId)),
    advance,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}
