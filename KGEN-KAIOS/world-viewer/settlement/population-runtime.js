import {
  boundedPush,
  clamp,
  createNotifier,
  integer,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "PopulationRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 40;
const MAX_CITIZENS = 240;

const DEFAULT_HIERARCHY = Object.freeze([
  { level: "FAMILY", entity_id: "family-starter-001", parent_id: "village-genesis-001", label: "Starter Household" },
  { level: "VILLAGE", entity_id: "village-genesis-001", parent_id: "town-hukou-alpha", label: "Genesis Village" },
  { level: "TOWN", entity_id: "town-hukou-alpha", parent_id: "city-hsinchu-alpha", label: "Hukou Alpha" },
  { level: "CITY", entity_id: "city-hsinchu-alpha", parent_id: "nation-taiwan-alpha", label: "Hsinchu Alpha" },
  { level: "NATION", entity_id: "nation-taiwan-alpha", parent_id: "civilization-kaios-alpha", label: "Taiwan Alpha" },
  { level: "CIVILIZATION", entity_id: "civilization-kaios-alpha", parent_id: null, label: "KAIOS Civilization Alpha" }
]);

function citizenFromSnapshot(source, index) {
  const lifeId = String(source?.life_id ?? `synthetic-citizen-${index + 1}`);
  const isPlayer = lifeId === "life-player-001";
  return {
    citizen_id: lifeId,
    life_id: lifeId,
    display_name: String(source?.display_name ?? lifeId),
    species_id: source?.display_name?.includes("Wukong") ? "WUKONG_WORKER_V1" : "HUMAN",
    age_years: isPlayer ? 24 : 30 + index,
    lifecycle_state: source?.life_state === "DEAD" ? "DECEASED" : "ALIVE",
    education_level: isPlayer ? 42 : 58,
    occupation: String(source?.occupation ?? "Citizen"),
    employment_status: source?.occupation ? "EMPLOYED" : "SEEKING_WORK",
    family_id: isPlayer ? "family-starter-001" : null,
    spouse_id: null,
    parent_ids: [],
    inheritance_status: "NONE",
    synthetic: true
  };
}

function initialState(citizenSnapshots, hierarchy) {
  const citizens = citizenSnapshots.map(citizenFromSnapshot);
  citizens.push({
    citizen_id: "citizen-ancestor-001",
    life_id: "life-ancestor-001",
    display_name: "Genesis Ancestor",
    species_id: "HUMAN",
    age_years: 82,
    lifecycle_state: "DECEASED",
    education_level: 66,
    occupation: "Retired Farmer",
    employment_status: "RETIRED",
    family_id: "family-starter-001",
    spouse_id: null,
    parent_ids: [],
    inheritance_status: "ESTATE_AVAILABLE",
    synthetic: true
  });
  return {
    revision: 0,
    hierarchy: (hierarchy?.length ? hierarchy : DEFAULT_HIERARCHY).map((node) => ({ ...node })),
    citizens,
    families: [{
      family_id: "family-starter-001",
      member_ids: citizens.filter(({ family_id }) => family_id === "family-starter-001").map(({ citizen_id }) => citizen_id),
      household_parcel_id: "parcel-starter-001",
      marriage_status: "SINGLE_HOUSEHOLD",
      synthetic: true
    }],
    inheritance_records: [],
    events: []
  };
}

function cleanState(candidate, fallback) {
  if (!candidate || typeof candidate !== "object") return fallback;
  return {
    ...fallback,
    ...candidate,
    hierarchy: Array.isArray(candidate.hierarchy) ? candidate.hierarchy.map((item) => ({ ...item })) : fallback.hierarchy,
    citizens: Array.isArray(candidate.citizens) ? candidate.citizens.slice(0, MAX_CITIZENS).map((item) => ({ ...item, parent_ids: [...(item.parent_ids ?? [])] })) : fallback.citizens,
    families: Array.isArray(candidate.families) ? candidate.families.map((item) => ({ ...item, member_ids: [...(item.member_ids ?? [])] })) : fallback.families,
    inheritance_records: Array.isArray(candidate.inheritance_records) ? candidate.inheritance_records.slice(-80).map((item) => ({ ...item })) : [],
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS).map((item) => ({ ...item })) : []
  };
}

export function createPopulationRuntime({
  citizenSnapshots = [],
  hierarchy,
  storage,
  storageKey = "kaios.world-viewer.population.v1"
} = {}) {
  if (!Array.isArray(citizenSnapshots) || citizenSnapshots.length === 0) {
    throw runtimeError(RUNTIME, "CITIZENS_REQUIRED", "Population Runtime requires synthetic citizens");
  }
  const storageRef = resolveStorage(storage);
  const defaults = initialState(citizenSnapshots, hierarchy);
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.citizens));
  let state = cleanState(restored?.state, defaults);
  let destroyed = false;

  function metrics() {
    const living = state.citizens.filter(({ lifecycle_state }) => lifecycle_state === "ALIVE");
    const workingAge = living.filter(({ age_years }) => age_years >= 18 && age_years < 70);
    const employed = workingAge.filter(({ employment_status }) => employment_status === "EMPLOYED");
    return {
      population: living.length,
      total_registered: state.citizens.length,
      births: state.events.filter(({ type }) => type === "BIRTH_REGISTERED").length,
      families: state.families.length,
      employment_rate: workingAge.length ? Number((employed.length / workingAge.length * 100).toFixed(1)) : 100,
      education_index: living.length ? Number((living.reduce((sum, item) => sum + item.education_level, 0) / living.length).toFixed(1)) : 0
    };
  }

  const getSnapshot = () => snapshot({
    runtime: "SETTLEMENT_POPULATION_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    hierarchy: state.hierarchy,
    citizens: state.citizens,
    families: state.families,
    inheritance_records: state.inheritance_records,
    metrics: metrics(),
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Population Runtime has been destroyed");
  };
  const citizen = (id) => state.citizens.find(({ citizen_id }) => citizen_id === String(id));

  function record(type, details = {}) {
    state.revision += 1;
    return boundedPush(state.events, {
      event_id: stableId("population", state.revision),
      type,
      ...details,
      synthetic: true
    }, MAX_EVENTS);
  }

  function advance({ elapsedHours = 1, educationCapacity = 70, employmentDemand = 70, carryingCapacity = 24, citizenSnapshots: liveCitizens = [] } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Population advance must be 1-720 hours");
    const liveIndex = new Map(liveCitizens.map((item) => [String(item.life_id), item]));
    for (const person of state.citizens) {
      const live = liveIndex.get(person.life_id);
      if (live?.life_state === "DEAD") {
        person.lifecycle_state = "DECEASED";
        person.employment_status = "DECEASED";
      }
      if (person.lifecycle_state !== "ALIVE") continue;
      if (person.age_years < 18) person.education_level = clamp(person.education_level + clamp(educationCapacity) * hours / 24_000);
      if (person.age_years >= 18 && person.age_years < 70 && person.employment_status === "SEEKING_WORK" && employmentDemand >= 50) {
        person.employment_status = "EMPLOYED";
        person.occupation = "Settlement Worker";
      }
      person.age_years = Number((person.age_years + hours / (24 * 365)).toFixed(5));
    }
    record("POPULATION_ADVANCED", { hours, carrying_capacity: integer(carryingCapacity), population: metrics().population });
    persist();
    notifier.emit("POPULATION_ADVANCED", { hours });
    return getSnapshot();
  }

  function registerMarriage({ partnerAId, partnerBId, consentA = false, consentB = false } = {}) {
    usable();
    const partnerA = citizen(partnerAId);
    const partnerB = citizen(partnerBId);
    if (!partnerA || !partnerB || partnerA === partnerB) throw runtimeError(RUNTIME, "INVALID_PARTNERS", "Marriage requires two registered citizens");
    if (!consentA || !consentB) throw runtimeError(RUNTIME, "CONSENT_REQUIRED", "Both citizens must consent");
    if ([partnerA, partnerB].some((person) => person.lifecycle_state !== "ALIVE" || person.age_years < 18 || person.spouse_id)) {
      throw runtimeError(RUNTIME, "MARRIAGE_INELIGIBLE", "Citizens are not eligible for marriage");
    }
    const familyId = partnerA.family_id ?? partnerB.family_id ?? stableId("family", state.revision + 1);
    let family = state.families.find(({ family_id }) => family_id === familyId);
    if (!family) {
      family = { family_id: familyId, member_ids: [], household_parcel_id: "parcel-starter-001", marriage_status: "MARRIED", synthetic: true };
      state.families.push(family);
    }
    family.member_ids = [...new Set([...family.member_ids, partnerA.citizen_id, partnerB.citizen_id])];
    family.marriage_status = "MARRIED";
    partnerA.family_id = familyId;
    partnerB.family_id = familyId;
    partnerA.spouse_id = partnerB.citizen_id;
    partnerB.spouse_id = partnerA.citizen_id;
    record("MARRIAGE_REGISTERED", { family_id: familyId, partner_ids: [partnerA.citizen_id, partnerB.citizen_id], consent_verified: true });
    persist();
    notifier.emit("MARRIAGE_REGISTERED", { family_id: familyId });
    return getSnapshot();
  }

  function registerBirth({ familyId, displayName = "Genesis Child", carryingCapacity = 24, resourceReady = false } = {}) {
    usable();
    const family = state.families.find(({ family_id }) => family_id === String(familyId));
    if (!family || family.marriage_status !== "MARRIED") throw runtimeError(RUNTIME, "FAMILY_NOT_READY", "Birth requires a married family");
    if (!resourceReady || metrics().population >= integer(carryingCapacity)) throw runtimeError(RUNTIME, "CARRYING_CAPACITY_BLOCK", "Food, water, housing, and ecology capacity must be available");
    const parentIds = family.member_ids.filter((id) => citizen(id)?.spouse_id).slice(0, 2);
    if (parentIds.length !== 2) throw runtimeError(RUNTIME, "PARENTS_REQUIRED", "Birth requires two eligible registered parents");
    const lifeId = stableId("life-born", state.revision + 1);
    state.citizens.push({
      citizen_id: lifeId,
      life_id: lifeId,
      display_name: String(displayName).slice(0, 64),
      species_id: "HUMAN",
      age_years: 0,
      lifecycle_state: "ALIVE",
      education_level: 0,
      occupation: "Child",
      employment_status: "DEPENDENT",
      family_id: family.family_id,
      spouse_id: null,
      parent_ids: parentIds,
      inheritance_status: "NONE",
      life_stack: { body: "VERIFIED", species_os: "VERIFIED", life_os: "READY", mind_runtime: "DEVELOPING", citizen_runtime: "REGISTERED" },
      synthetic: true
    });
    family.member_ids.push(lifeId);
    record("BIRTH_REGISTERED", { family_id: family.family_id, citizen_id: lifeId, parent_ids: parentIds });
    persist();
    notifier.emit("BIRTH_REGISTERED", { citizen_id: lifeId });
    return getSnapshot();
  }

  function recordInheritance({ recordId, estateCitizenId, beneficiaryId, amount, ledgerEntryId } = {}) {
    usable();
    const estate = citizen(estateCitizenId);
    const beneficiary = citizen(beneficiaryId);
    if (!estate || estate.lifecycle_state !== "DECEASED") throw runtimeError(RUNTIME, "ESTATE_NOT_ELIGIBLE", "Inheritance requires a deceased registered citizen");
    if (!beneficiary || beneficiary.lifecycle_state !== "ALIVE") throw runtimeError(RUNTIME, "BENEFICIARY_NOT_ELIGIBLE", "Beneficiary must be a living registered citizen");
    if (estate.inheritance_status === "SETTLED") throw runtimeError(RUNTIME, "INHERITANCE_ALREADY_SETTLED", "Estate inheritance is already settled");
    const entry = {
      record_id: String(recordId),
      estate_citizen_id: estate.citizen_id,
      beneficiary_id: beneficiary.citizen_id,
      amount: Number(amount),
      currency: "KAIOS_CREDIT",
      ledger_entry_id: String(ledgerEntryId),
      status: "SETTLED",
      synthetic: true
    };
    estate.inheritance_status = "SETTLED";
    boundedPush(state.inheritance_records, entry, 80);
    record("INHERITANCE_RECORDED", { record_id: entry.record_id, beneficiary_id: beneficiary.citizen_id, amount: entry.amount });
    persist();
    notifier.emit("INHERITANCE_RECORDED", { record_id: entry.record_id });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const citizenIds = new Set();
    const familyIds = new Set(state.families.map(({ family_id }) => family_id));
    for (const person of state.citizens) {
      if (citizenIds.has(person.citizen_id)) issues.push(`${person.citizen_id}: duplicate citizen`);
      citizenIds.add(person.citizen_id);
      if (!Number.isFinite(person.age_years) || person.age_years < 0) issues.push(`${person.citizen_id}: invalid age`);
      if (person.family_id && !familyIds.has(person.family_id)) issues.push(`${person.citizen_id}: missing family`);
      if (person.spouse_id && citizen(person.spouse_id)?.spouse_id !== person.citizen_id) issues.push(`${person.citizen_id}: asymmetric spouse relationship`);
    }
    for (const family of state.families) for (const memberId of family.member_ids) if (!citizenIds.has(memberId)) issues.push(`${family.family_id}: unknown member ${memberId}`);
    if (state.citizens.length > MAX_CITIZENS) issues.push("citizen capacity exceeded");
    if (state.events.length > MAX_EVENTS) issues.push("population event history exceeded limit");
    return snapshot({ ok: issues.length === 0, runtime: "SETTLEMENT_POPULATION_ALPHA", metrics: metrics(), issues });
  }

  return Object.freeze({
    getSnapshot,
    advance,
    registerMarriage,
    registerBirth,
    recordInheritance,
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
