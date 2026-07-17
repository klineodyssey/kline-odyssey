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

const RUNTIME = "GovernmentRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_CASES = 80;
const MAX_AUDIT = 120;

export const GOVERNMENT_HIERARCHY = Object.freeze([
  ["VILLAGE_COUNCIL", "Genesis Village Council"],
  ["TOWN_HALL", "Hukou Town Hall"],
  ["CITY_GOVERNMENT", "Hsinchu City Government"],
  ["PROVINCE", "Taiwan Province Alpha"],
  ["NATION", "Taiwan Nation Alpha"],
  ["PLANET_GOVERNMENT", "Earth Planet Government Alpha"]
].map(([level_id, label], index, rows) => Object.freeze({
  level_id,
  label,
  parent_level_id: rows[index + 1]?.[0] ?? null,
  authority: "SYNTHETIC_CIVILIZATION_ONLY"
})));

export const LAW_CATALOG = Object.freeze([
  "CIVIL_LAW",
  "CRIMINAL_LAW",
  "PROPERTY_LAW",
  "TRADE_LAW",
  "ENVIRONMENT_LAW",
  "CONSTRUCTION_LAW",
  "AI_LAW",
  "DNA_CREATION_LAW"
].map((law_id) => Object.freeze({
  law_id,
  status: "SIMULATION_POLICY_ACTIVE",
  enforcement: "EVIDENCE_REVIEW_REQUIRED",
  real_world_authority: false
})));

const OFFICIALS = Object.freeze([
  { office_id: "mayor-hsinchu-alpha", role: "MAYOR", jurisdiction: "CITY_GOVERNMENT" },
  { office_id: "governor-taiwan-alpha", role: "GOVERNOR", jurisdiction: "PROVINCE" },
  { office_id: "minister-public-service-alpha", role: "MINISTER", jurisdiction: "NATION" }
].map((office) => Object.freeze({
  ...office,
  holder_id: `synthetic-${office.role.toLowerCase()}-001`,
  appointment_status: "SIMULATION_APPOINTED",
  human_authority: false
})));

const CIVIL_SERVICE = Object.freeze([
  "EDUCATION", "MEDICAL", "JUSTICE", "PUBLIC_SAFETY", "TRANSPORTATION",
  "PUBLIC_UTILITIES", "COMMUNICATION", "DISASTER_RESPONSE", "SOCIAL_WELFARE", "TREASURY"
].map((department_id) => Object.freeze({
  department_id,
  status: "ACTIVE_SYNTHETIC",
  evidence_required: true,
  review_required: true
})));

function valueOrUnknown(value) {
  return value === null || value === undefined || value === "" ? "UNKNOWN" : value;
}

export function createGovernmentRuntime({
  world,
  populationRuntime,
  lifeRuntime,
  settlementRuntime,
  storage,
  storageKey = "kaios.world-viewer.government.v1"
} = {}) {
  if (!world || !populationRuntime || !lifeRuntime || !settlementRuntime) {
    throw new TypeError("Government Runtime requires world, Population, Life and Settlement runtimes");
  }
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, cycle_count: 0, justice_cases: [], audit_log: [] };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      justice_cases: restored.state.justice_cases?.slice(-MAX_CASES) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Government Runtime has been destroyed");
  };

  function citizenRights() {
    const population = populationRuntime.getSnapshot();
    const lives = new Map(lifeRuntime.listSnapshots().map((life) => [life.life_id, life]));
    const obligations = settlementRuntime.getSnapshot().obligations ?? [];
    return (population.citizens ?? []).map((citizen) => {
      const life = lives.get(citizen.life_id) ?? {};
      const taxEntries = obligations.filter((entry) => entry.payer_id === citizen.life_id || entry.payer_id === world.player?.player_id);
      return {
        citizen_id: citizen.life_id,
        identity: valueOrUnknown(citizen.display_name),
        identity_class: "SYNTHETIC_ALIAS_ONLY",
        citizenship: valueOrUnknown(citizen.citizenship ?? "KAIOS_CIVILIZATION_ALPHA"),
        residence: valueOrUnknown(citizen.residence_id ?? world.player?.starter_parcel_id),
        family: valueOrUnknown(citizen.family_id),
        education: valueOrUnknown(citizen.education_status ?? population.metrics?.education_index),
        occupation: valueOrUnknown(citizen.occupation),
        health: valueOrUnknown(life.health ?? life.needs?.health),
        property: citizen.life_id === world.player?.life_id ? world.player?.starter_parcel_id : "NONE_RECORDED",
        tax_record: {
          currency: "KAIOS_CREDIT",
          entries: taxEntries.length,
          authoritative: false
        },
        reputation: valueOrUnknown(citizen.reputation ?? 50),
        contribution: valueOrUnknown(citizen.contribution ?? citizen.work_cycles ?? 0),
        projection_only: true
      };
    });
  }

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_GOVERNMENT_ALPHA",
    schema_version: SCHEMA_VERSION,
    decision_id: "HUMAN-SPRINT-007-CIVILIZATION-GOVERNANCE",
    synthetic: true,
    authoritative: false,
    hierarchy: GOVERNMENT_HIERARCHY,
    officials: OFFICIALS,
    civil_service: CIVIL_SERVICE,
    treasury: { account_id: "civilization-government-alpha", currency: "KAIOS_CREDIT" },
    citizen_rights: citizenRights(),
    laws: LAW_CATALOG,
    justice: {
      architecture_only: true,
      executable_penalty: false,
      cases: state.justice_cases
    },
    cycle_count: state.cycle_count,
    audit_log: state.audit_log,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.audit_log, {
      audit_id: stableId("government-audit", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_AUDIT);
  }

  function runCycle() {
    usable();
    state.cycle_count += 1;
    record("GOVERNANCE_CYCLE_COMPLETED", {
      hierarchy_levels: GOVERNMENT_HIERARCHY.length,
      rights_reviewed: citizenRights().length
    });
    persist();
    notifier.emit("GOVERNANCE_CYCLE_COMPLETED", { cycle_count: state.cycle_count });
    return getSnapshot();
  }

  function submitJusticeCase({ lawId = "CIVIL_LAW", claimantId = world.player?.life_id, evidence = "SYNTHETIC_PLAYER_STATEMENT" } = {}) {
    usable();
    if (!LAW_CATALOG.some((law) => law.law_id === lawId)) throw runtimeError(RUNTIME, "UNKNOWN_LAW", `Unknown law ${lawId}`);
    const sequence = state.revision + 1;
    const justiceCase = {
      case_id: stableId("justice-case", sequence),
      law_id: lawId,
      claimant_id: claimantId,
      court: "KAIOS_SIMULATION_COURT",
      judge: "SYNTHETIC_REVIEW_JUDGE",
      evidence: [{ evidence_id: stableId("case-evidence", sequence), type: evidence }],
      appeal: "AVAILABLE_AFTER_REVIEW",
      penalty: "NOT_EXECUTED",
      prison: "NOT_EXECUTED",
      rehabilitation: "ARCHITECTURE_OPTION_ONLY",
      status: "ARCHITECTURE_ONLY_REVIEW_REQUIRED",
      executable: false,
      citizen_state_mutation: false
    };
    boundedPush(state.justice_cases, justiceCase, MAX_CASES);
    record("JUSTICE_CASE_PROPOSED", { case_id: justiceCase.case_id, law_id: lawId, executable: false });
    persist();
    notifier.emit("JUSTICE_CASE_PROPOSED", { case_id: justiceCase.case_id });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (GOVERNMENT_HIERARCHY.length !== 6) issues.push("government hierarchy must contain six levels");
    if (LAW_CATALOG.length !== 8) issues.push("law catalog must contain eight laws");
    if (state.justice_cases.some((entry) => entry.executable !== false || entry.citizen_state_mutation !== false)) issues.push("justice case became executable");
    if (OFFICIALS.some((official) => official.human_authority !== false)) issues.push("synthetic official gained Human authority");
    const required = ["identity", "citizenship", "residence", "family", "education", "occupation", "health", "property", "tax_record", "reputation", "contribution"];
    if (citizenRights().some((rights) => required.some((field) => !Object.hasOwn(rights, field)))) issues.push("citizen rights projection incomplete");
    if (state.justice_cases.length > MAX_CASES || state.audit_log.length > MAX_AUDIT) issues.push("government history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_GOVERNMENT_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    runCycle,
    submitJusticeCase,
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
