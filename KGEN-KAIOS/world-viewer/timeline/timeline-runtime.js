import {
  boundedPush,
  clone,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";
import { createPocketTimeCloakedUfoRuntime } from "./pocket-time-ufo-runtime.js";

const RUNTIME = "TimelineRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_JOURNEYS = 100;
const MAX_AUDIT = 160;

export const TIMELINE_ERA_IDS = Object.freeze([
  "CAMBRIAN",
  "ANCIENT_CIVILIZATION",
  "STONE_AGE",
  "BRONZE_AGE",
  "IRON_AGE",
  "INDUSTRIAL_AGE",
  "INFORMATION_AGE",
  "AI_CIVILIZATION",
  "INTERSTELLAR_CIVILIZATION"
]);

// Human 2026-10-16 seven-label clock. This is a named civilization duration
// model, not the K18888/K280 365.2422-day KUFO law or the 360-day simulation
// calendar. One Buddha day is the smallest integral unit in the stated ratios.
export const CIVILIZATION_DAY_IN_BUDDHA_DAYS = Object.freeze({
  SHENJUN: 31536000000n,
  SHENMING: 31536000000n,
  SHENXIAN: 86400000n,
  DRAGON_KING: 3600000n,
  MORTAL: 60000n,
  DEMON_KING: 1000n,
  BUDDHA: 1n
});

const FOUR_UPPER_DAYS_IN_MORTAL_DAYS = 4n * 525600n;

function nonnegativeInteger(value, field) {
  if (typeof value === "bigint" && value >= 0n) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  throw new TypeError(`${field} must be a nonnegative safe integer or bigint`);
}

function civilizationDayUnit(label) {
  if (!Object.hasOwn(CIVILIZATION_DAY_IN_BUDDHA_DAYS, label)) throw new RangeError(`Unknown civilization day: ${label}`);
  return CIVILIZATION_DAY_IN_BUDDHA_DAYS[label];
}

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

// Rational output keeps all seven labels exact, including sub-mortal days.
export function convertCivilizationDays(value, from, to) {
  const numerator = nonnegativeInteger(value, "value") * civilizationDayUnit(from);
  const denominator = civilizationDayUnit(to);
  const factor = gcd(numerator, denominator);
  return Object.freeze({ numerator: numerator / factor, denominator: denominator / factor });
}

// The Human's 365-day mortal year is scoped to this clock alone.
export function mortalYearsToUpperClock(years) {
  const mortalDays = nonnegativeInteger(years, "years") * 365n;
  const days = mortalDays / 525600n;
  const remainingDays = mortalDays % 525600n;
  const minuteNumerator = remainingDays * 1440n;
  const minutes = minuteNumerator / 525600n;
  const minuteRemainder = minuteNumerator % 525600n;
  return Object.freeze({ days, hours: minutes / 60n, minutes: minutes % 60n,
    remainingMinuteFraction: Object.freeze({ numerator: minuteRemainder, denominator: 525600n }) });
}

// Pure, caller-driven convergence candidate: no clock is inferred from a K
// index, no map point moves, and no live order/game-completion authority exists.
// The existing route owner must supply both elapsed time and the current CT.
export function convergeRoutesAtFourUpperDays({ routes, elapsedMortalDays, currentCT } = {}) {
  const elapsed = nonnegativeInteger(elapsedMortalDays, "elapsedMortalDays");
  if (!Array.isArray(routes) || routes.some((route) => !route || typeof route !== "object" || !route.routeId)) {
    throw new TypeError("routes must contain records with routeId");
  }
  if (new Set(routes.map((route) => route.routeId)).size !== routes.length) throw new TypeError("routeId must be unique");
  if (currentCT === undefined || currentCT === null || currentCT === "") throw new TypeError("currentCT is required");
  const completedRoutes = routes.filter((route) => route.fourDayConvergence?.completed === true);
  for (const route of completedRoutes) {
    const marker = route.fourDayConvergence;
    if (marker.atCT === undefined || marker.atCT === null || marker.atCT === "" || route.currentCT !== marker.atCT) {
      throw new TypeError("completed route must retain its convergence CT");
    }
    if (typeof marker.atMortalDay !== "string" || !/^\d+$/.test(marker.atMortalDay)
      || BigInt(marker.atMortalDay) < FOUR_UPPER_DAYS_IN_MORTAL_DAYS || BigInt(marker.atMortalDay) > elapsed) {
      throw new TypeError("completed route has an invalid convergence day");
    }
  }
  if (elapsed < FOUR_UPPER_DAYS_IN_MORTAL_DAYS) return { routes: routes.map(clone), events: [] };
  const priorCTs = completedRoutes.map((route) => route.fourDayConvergence.atCT);
  if (priorCTs.some((ct) => ct !== priorCTs[0])) throw new TypeError("converged routes disagree on CT");
  const convergenceCT = priorCTs.length ? priorCTs[0] : currentCT;
  const events = [];
  const converged = routes.map((route) => {
    if (route.fourDayConvergence?.completed) return clone(route);
    const marker = { completed: true, atCT: convergenceCT, atMortalDay: elapsed.toString() };
    events.push({ type: "FOUR_UPPER_DAY_CT_CONVERGENCE", routeId: route.routeId, currentCT: convergenceCT,
      atMortalDay: marker.atMortalDay, simulationOnly: true, autoVictory: false, gameEnded: false });
    return { ...clone(route), currentCT: convergenceCT, fourDayConvergence: marker };
  });
  return { routes: converged, events };
}

function validateConfig(config) {
  if (!config || JSON.stringify(config.eras?.map(({ era_id: id }) => id)) !== JSON.stringify(TIMELINE_ERA_IDS)) {
    throw new TypeError("Timeline Runtime requires the approved nine-era catalog");
  }
  if (!TIMELINE_ERA_IDS.includes(config.origin_era_id)) throw runtimeError(RUNTIME, "INVALID_ORIGIN_ERA", "Timeline origin era is invalid");
  if (config.vehicle?.vehicle_type !== "POCKET_TIME_CLOAKED_UFO") throw runtimeError(RUNTIME, "INVALID_TIMELINE_TRANSPORT", "Timeline Travel requires the Pocket Time Cloaked UFO");
}

export function createTimelineRuntime({
  config,
  civilizationProvider,
  nationProvider,
  technologyRuntime,
  storage,
  storageKey = "kaios.world-viewer.timeline.v1"
} = {}) {
  validateConfig(config);
  if (typeof civilizationProvider !== "function" || typeof nationProvider !== "function" || !technologyRuntime) {
    throw new TypeError("Timeline Runtime requires Civilization, Nation, and Cosmic Technology providers");
  }
  const storageRef = resolveStorage(storage);
  const vehicle = createPocketTimeCloakedUfoRuntime({
    config: config.vehicle,
    civilizationProvider,
    sharedGateProvider: () => technologyRuntime.getUfoGateSnapshot(),
    storage,
    storageKey: `${storageKey}.vehicle.v2`
  });
  let destroyed = false;
  let state = {
    revision: 0,
    current_era_id: config.origin_era_id,
    era_research: Object.fromEntries(config.eras.map(({ era_id: id, initial_research_points: points = 0 }) => [id, points])),
    journeys: [],
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      era_research: { ...state.era_research, ...restored.state.era_research },
      journeys: restored.state.journeys?.slice(-MAX_JOURNEYS) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Timeline Runtime has been destroyed");
  };

  function civilizationReady(civilization = civilizationProvider() ?? {}) {
    return Number(civilization.score ?? 0) >= config.vehicle.minimum_civilization_score
      && config.vehicle.allowed_civilization_stages.includes(civilization.stage_id);
  }

  function nationReady(nation = nationProvider()) {
    return nation?.nation?.status === "ESTABLISHED_SYNTHETIC";
  }

  function era(eraId) {
    const target = config.eras.find(({ era_id: id }) => id === eraId);
    if (!target) throw runtimeError(RUNTIME, "UNKNOWN_ERA", `Unknown Timeline era ${eraId}`);
    return target;
  }

  function travelReadiness(targetEraId, context = {}) {
    const target = era(targetEraId);
    const civilization = context.civilization ?? civilizationProvider() ?? {};
    const nation = context.nation ?? nationProvider();
    const vehicleSnapshot = context.vehicle ?? vehicle.getSnapshot();
    const checks = [
      { check_id: "NATION", pass: nationReady(nation), evidence: nation?.nation?.status ?? "NATION_REQUIRED" },
      { check_id: "CIVILIZATION", pass: civilizationReady(civilization), evidence: `${civilization.stage_id ?? "UNKNOWN"} / ${civilization.score ?? 0}` },
      { check_id: "ERA_RESEARCH", pass: state.era_research[targetEraId] >= target.required_research_points, evidence: `${state.era_research[targetEraId]} / ${target.required_research_points}` },
      { check_id: "VEHICLE", pass: vehicleSnapshot.status === "OPERATIONAL", evidence: vehicleSnapshot.status },
      { check_id: "VEHICLE_CHECKSUM", pass: vehicleSnapshot.checksum_verified === true, evidence: vehicleSnapshot.checksum_verified ? "VERIFIED" : "BLOCKED" },
      { check_id: "ENERGY", pass: vehicleSnapshot.energy_reserve >= vehicleSnapshot.travel_energy_cost, evidence: `${vehicleSnapshot.energy_reserve} / ${vehicleSnapshot.travel_energy_cost}` }
    ].map((check) => ({ ...check, status: check.pass ? "PASS" : "BLOCKED" }));
    return snapshot({ target_era_id: targetEraId, ready: targetEraId !== state.current_era_id && checks.every(({ pass }) => pass), checks });
  }

  const getSnapshot = (context = {}) => {
    const civilization = context.civilization ?? civilizationProvider() ?? {};
    const nation = context.nation ?? nationProvider();
    const vehicleSnapshot = vehicle.getSnapshot();
    const readinessContext = { civilization, nation, vehicle: vehicleSnapshot };
    return snapshot({
      runtime: "CIVILIZATION_TIMELINE_ALPHA",
      schema_version: SCHEMA_VERSION,
      decision_id: config.decision_id,
      synthetic: true,
      authoritative: false,
      real_time_travel: false,
      canonical_history_mutation: false,
      origin_era_id: config.origin_era_id,
      current_era_id: state.current_era_id,
      eras: config.eras.map((entry) => ({
        ...entry,
        research_points: state.era_research[entry.era_id],
        research_ready: state.era_research[entry.era_id] >= entry.required_research_points,
        current: state.current_era_id === entry.era_id,
        origin: config.origin_era_id === entry.era_id
      })),
      vehicle: vehicleSnapshot,
      default_target_readiness: travelReadiness(config.default_target_era_id, readinessContext),
      era_readiness: Object.fromEntries(config.eras.map(({ era_id: eraId }) => [eraId, travelReadiness(eraId, readinessContext)])),
      journeys: state.journeys,
      audit_log: state.audit_log,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    boundedPush(state.audit_log, {
      audit_id: stableId("timeline-audit", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_AUDIT);
  }

  function researchEra(eraId, points = config.era_research_increment) {
    usable();
    const target = era(eraId);
    const amount = Number(points);
    if (!Number.isFinite(amount) || amount <= 0 || amount > target.required_research_points) throw runtimeError(RUNTIME, "INVALID_ERA_RESEARCH", "Era research is outside the bounded range");
    state.revision += 1;
    state.era_research[eraId] = Math.min(target.required_research_points, state.era_research[eraId] + amount);
    record("TIMELINE_ERA_RESEARCHED", { era_id: eraId, points: amount });
    persist();
    notifier.emit("TIMELINE_ERA_RESEARCHED", { era_id: eraId, points: amount });
    return getSnapshot();
  }

  function researchVehicleProgram(points = config.vehicle.research_increment) {
    usable();
    technologyRuntime.advanceUfoProgram();
    state.revision += 1;
    record("TIMELINE_VEHICLE_RESEARCH_PROGRAM", { points_per_technology: points });
    persist();
    notifier.emit("TIMELINE_VEHICLE_RESEARCH_PROGRAM", { points });
    return getSnapshot();
  }

  function supplyVehiclePackage() {
    usable();
    technologyRuntime.approveUfoMaterialPackage();
    for (const requirement of config.vehicle.material_requirements) {
      const stockpiled = vehicle.getSnapshot().material_requirements.find(({ material_id: id }) => id === requirement.material_id)?.stockpiled ?? 0;
      const missing = Math.max(0, requirement.quantity - stockpiled);
      if (missing > 0) vehicle.supplyMaterial(requirement.material_id, missing);
    }
    state.revision += 1;
    record("TIMELINE_VEHICLE_MATERIAL_PACKAGE_SUPPLIED", { material_types: config.vehicle.material_requirements.length });
    persist();
    notifier.emit("TIMELINE_VEHICLE_MATERIAL_PACKAGE_SUPPLIED");
    return getSnapshot();
  }

  function buildVehicle() {
    usable();
    if (!nationReady()) throw runtimeError(RUNTIME, "NATION_REQUIRED", "An established synthetic Nation is required to build the Timeline vehicle");
    vehicle.build();
    state.revision += 1;
    record("TIMELINE_VEHICLE_BUILD_REVIEW_PASSED", { vehicle_id: config.vehicle.vehicle_id });
    persist();
    notifier.emit("TIMELINE_VEHICLE_BUILD_REVIEW_PASSED", { vehicle_id: config.vehicle.vehicle_id });
    return getSnapshot();
  }

  function chargeVehicle(amount = config.vehicle.charge_increment) {
    usable();
    vehicle.supplyMaterial(config.vehicle.energy_material_id, amount);
    vehicle.charge(amount);
    state.revision += 1;
    record("TIMELINE_VEHICLE_ENERGY_SUPPLIED", { amount });
    persist();
    notifier.emit("TIMELINE_VEHICLE_ENERGY_SUPPLIED", { amount });
    return getSnapshot();
  }

  function travel(targetEraId) {
    usable();
    const readiness = travelReadiness(targetEraId);
    if (!readiness.ready) {
      throw runtimeError(RUNTIME, "TIMELINE_TRAVEL_BLOCKED", `Timeline Travel blocked by ${readiness.checks.filter(({ pass }) => !pass).map(({ check_id: id }) => id).join(", ") || "CURRENT_ERA"}`);
    }
    state.revision += 1;
    const journeyId = stableId("timeline-journey", state.revision);
    const fromEraId = state.current_era_id;
    vehicle.consumeTravelEnergy(journeyId);
    state.current_era_id = targetEraId;
    const journey = {
      journey_id: journeyId,
      from_era_id: fromEraId,
      to_era_id: targetEraId,
      vehicle_id: config.vehicle.vehicle_id,
      vehicle_type: "POCKET_TIME_CLOAKED_UFO",
      status: "ISOLATED_SIMULATION_COMPLETE",
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      canonical_history_mutated: false,
      real_time_travel: false
    };
    boundedPush(state.journeys, journey, MAX_JOURNEYS);
    record("TIMELINE_TRAVEL_COMPLETED", { journey_id: journeyId, from_era_id: fromEraId, to_era_id: targetEraId });
    persist();
    notifier.emit("TIMELINE_TRAVEL_COMPLETED", { journey_id: journeyId, to_era_id: targetEraId });
    return getSnapshot();
  }

  function returnToOrigin() {
    usable();
    if (state.current_era_id === config.origin_era_id) return getSnapshot();
    const vehicleSnapshot = vehicle.getSnapshot();
    if (vehicleSnapshot.status !== "OPERATIONAL" || vehicleSnapshot.checksum_verified !== true) {
      throw runtimeError(RUNTIME, "RETURN_BLOCKED", "Operational Timeline vehicle required to return to origin");
    }
    state.revision += 1;
    const journeyId = stableId("timeline-return", state.revision);
    const fromEraId = state.current_era_id;
    vehicle.consumeTravelEnergy(journeyId);
    state.current_era_id = config.origin_era_id;
    boundedPush(state.journeys, {
      journey_id: journeyId,
      from_era_id: fromEraId,
      to_era_id: config.origin_era_id,
      vehicle_id: config.vehicle.vehicle_id,
      vehicle_type: "POCKET_TIME_CLOAKED_UFO",
      status: "RETURN_TO_ORIGIN_COMPLETE",
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      canonical_history_mutated: false,
      real_time_travel: false
    }, MAX_JOURNEYS);
    record("TIMELINE_RETURN_COMPLETED", { journey_id: journeyId, from_era_id: fromEraId });
    persist();
    notifier.emit("TIMELINE_RETURN_COMPLETED", { journey_id: journeyId });
    return getSnapshot();
  }

  function readinessFor(targetEraId) {
    usable();
    return travelReadiness(targetEraId);
  }

  function integrityReport() {
    const issues = [];
    if (JSON.stringify(config.eras.map(({ era_id: id }) => id)) !== JSON.stringify(TIMELINE_ERA_IDS)) issues.push("Timeline era catalog changed");
    if (!TIMELINE_ERA_IDS.includes(state.current_era_id)) issues.push("current Timeline era is unknown");
    if (state.journeys.some((journey) => journey.vehicle_type !== "POCKET_TIME_CLOAKED_UFO" || journey.canonical_history_mutated !== false || journey.real_time_travel !== false)) issues.push("journey crossed Timeline safety boundary");
    if (!vehicle.integrityReport().ok) issues.push("Timeline vehicle integrity failed");
    if (!technologyRuntime.integrityReport().ok) issues.push("shared Cosmic Technology integrity failed");
    if (state.journeys.length > MAX_JOURNEYS || state.audit_log.length > MAX_AUDIT) issues.push("Timeline history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_TIMELINE_ALPHA", issues, vehicle: vehicle.integrityReport(), journey_count: state.journeys.length });
  }

  return Object.freeze({
    getSnapshot,
    readinessFor,
    researchEra,
    researchVehicleProgram,
    supplyVehiclePackage,
    buildVehicle,
    chargeVehicle,
    travel,
    returnToOrigin,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      vehicle.destroy();
      destroyed = true;
      return true;
    }
  });
}
