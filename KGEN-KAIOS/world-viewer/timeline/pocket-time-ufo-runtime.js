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

const RUNTIME = "PocketTimeCloakedUfoRuntime";
const SCHEMA_VERSION = "2.0.0";
const MAX_AUDIT = 160;

function validateConfig(config) {
  if (!config || config.vehicle_type !== "POCKET_TIME_CLOAKED_UFO") {
    throw new TypeError("Timeline vehicle must be POCKET_TIME_CLOAKED_UFO");
  }
  if (!Array.isArray(config.technology_requirements) || !Array.isArray(config.material_requirements)) {
    throw new TypeError("Timeline vehicle requires technology and material manifests");
  }
  if (!/^sha256:[0-9a-f]{64}$/.test(config.blueprint_checksum ?? "")) {
    throw runtimeError(RUNTIME, "INVALID_BLUEPRINT_CHECKSUM", "Timeline vehicle blueprint checksum is invalid");
  }
}

export function createPocketTimeCloakedUfoRuntime({
  config,
  civilizationProvider,
  sharedGateProvider,
  storage,
  storageKey = "kaios.world-viewer.pocket-time-ufo.v2"
} = {}) {
  validateConfig(config);
  if (typeof civilizationProvider !== "function") throw new TypeError("Timeline vehicle requires a Civilization state provider");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    built: false,
    checksum: null,
    energy_reserve: 0,
    technology_progress: Object.fromEntries(config.technology_requirements.map(({ technology_id: id }) => [id, 0])),
    material_stockpile: Object.fromEntries(config.material_requirements.map(({ material_id: id }) => [id, 0])),
    consumed_materials: {},
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      technology_progress: { ...state.technology_progress, ...restored.state.technology_progress },
      material_stockpile: { ...state.material_stockpile, ...restored.state.material_stockpile },
      consumed_materials: { ...restored.state.consumed_materials },
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Pocket Time Cloaked UFO Runtime has been destroyed");
  };

  function technologyReady() {
    if (typeof sharedGateProvider === "function") {
      return sharedGateProvider().technology_requirements.every(({ ready }) => ready === true);
    }
    return config.technology_requirements.every(({ technology_id: id, required_points: required }) => state.technology_progress[id] >= required);
  }

  function materialsReady() {
    const localReady = state.built || config.material_requirements.every(({ material_id: id, quantity }) => state.material_stockpile[id] >= quantity);
    const sharedReady = typeof sharedGateProvider !== "function" || sharedGateProvider().special_material_ready === true;
    return localReady && sharedReady;
  }

  function capabilitiesReady() {
    return typeof sharedGateProvider !== "function"
      || sharedGateProvider().capability_requirements.every(({ ready }) => ready === true);
  }

  function civilizationReady() {
    const civilization = civilizationProvider() ?? {};
    return Number(civilization.score ?? 0) >= config.minimum_civilization_score
      && config.allowed_civilization_stages.includes(civilization.stage_id);
  }

  function status() {
    if (state.built) return state.energy_reserve >= config.travel_energy_cost ? "OPERATIONAL" : "BUILT_ENERGY_REQUIRED";
    if (technologyReady() && materialsReady() && capabilitiesReady() && civilizationReady()) return "CONSTRUCTION_READY";
    if (technologyReady() && materialsReady() && !capabilitiesReady()) return "CAPABILITY_GATE_REQUIRED";
    if (technologyReady() && materialsReady()) return "CIVILIZATION_GATE_REQUIRED";
    if (technologyReady()) return "MATERIAL_READY_REQUIRED";
    return "BLUEPRINT_LOCKED";
  }

  const getSnapshot = () => {
    const civilization = civilizationProvider() ?? {};
    const sharedGates = typeof sharedGateProvider === "function" ? sharedGateProvider() : null;
    return snapshot({
      runtime: "POCKET_TIME_CLOAKED_UFO_V2_ALPHA",
      schema_version: SCHEMA_VERSION,
      vehicle_id: config.vehicle_id,
      vehicle_type: config.vehicle_type,
      sole_timeline_transport: true,
      synthetic: true,
      real_vehicle: false,
      status: status(),
      built: state.built,
      checksum: state.checksum,
      checksum_verified: state.built && state.checksum === config.blueprint_checksum,
      energy_reserve: state.energy_reserve,
      energy_capacity: config.energy_capacity,
      travel_energy_cost: config.travel_energy_cost,
      shared_technology_source: sharedGates ? "COSMIC_TECHNOLOGY_ALPHA" : "LEGACY_LOCAL_RESEARCH",
      technology_requirements: sharedGates?.technology_requirements ?? config.technology_requirements.map((requirement) => ({
          ...requirement,
          progress: state.technology_progress[requirement.technology_id],
          ready: state.technology_progress[requirement.technology_id] >= requirement.required_points
        })),
      capability_requirements: sharedGates?.capability_requirements ?? [],
      special_material_package: sharedGates ? {
        costs: sharedGates.special_material_costs,
        ready: sharedGates.special_material_ready
      } : null,
      material_requirements: config.material_requirements.map((requirement) => ({
        ...requirement,
        stockpiled: state.material_stockpile[requirement.material_id],
        consumed: state.consumed_materials[requirement.material_id] ?? 0,
        ready: state.built || state.material_stockpile[requirement.material_id] >= requirement.quantity
      })),
      civilization_gate: {
        score: Number(civilization.score ?? 0),
        stage_id: civilization.stage_id ?? "UNKNOWN",
        minimum_score: config.minimum_civilization_score,
        allowed_stages: config.allowed_civilization_stages,
        ready: civilizationReady()
      },
      audit_log: state.audit_log,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    boundedPush(state.audit_log, {
      audit_id: stableId("timeline-vehicle-audit", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_AUDIT);
  }

  function research(technologyId, points = config.research_increment) {
    usable();
    if (typeof sharedGateProvider === "function") {
      throw runtimeError(RUNTIME, "SHARED_TECHNOLOGY_REQUIRED", "UFO V2 research is owned by Cosmic Technology Runtime");
    }
    if (state.built) return getSnapshot();
    const requirement = config.technology_requirements.find(({ technology_id: id }) => id === technologyId);
    if (!requirement) throw runtimeError(RUNTIME, "UNKNOWN_TECHNOLOGY", `Unknown Timeline technology ${technologyId}`);
    const amount = Number(points);
    if (!Number.isFinite(amount) || amount <= 0 || amount > requirement.required_points) throw runtimeError(RUNTIME, "INVALID_RESEARCH", "Research contribution is outside the bounded range");
    state.revision += 1;
    state.technology_progress[technologyId] = Math.min(requirement.required_points, state.technology_progress[technologyId] + amount);
    record("TIMELINE_TECHNOLOGY_RESEARCHED", { technology_id: technologyId, points: amount });
    persist();
    notifier.emit("TIMELINE_TECHNOLOGY_RESEARCHED", { technology_id: technologyId });
    return getSnapshot();
  }

  function supplyMaterial(materialId, quantity) {
    usable();
    const requirement = config.material_requirements.find(({ material_id: id }) => id === materialId);
    if (!requirement) throw runtimeError(RUNTIME, "UNKNOWN_MATERIAL", `Unknown Timeline material ${materialId}`);
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0 || amount > requirement.quantity * 2) throw runtimeError(RUNTIME, "INVALID_MATERIAL_QUANTITY", "Material contribution is outside the bounded range");
    state.revision += 1;
    state.material_stockpile[materialId] = Number((state.material_stockpile[materialId] + amount).toFixed(3));
    record("TIMELINE_MATERIAL_SUPPLIED", { material_id: materialId, quantity: amount });
    persist();
    notifier.emit("TIMELINE_MATERIAL_SUPPLIED", { material_id: materialId });
    return getSnapshot();
  }

  function build() {
    usable();
    if (state.built) return getSnapshot();
    const blocked = [];
    if (!technologyReady()) blocked.push("TECHNOLOGY");
    if (!materialsReady()) blocked.push("MATERIALS");
    if (!capabilitiesReady()) blocked.push("CAPABILITIES");
    if (!civilizationReady()) blocked.push("CIVILIZATION");
    if (blocked.length) throw runtimeError(RUNTIME, "VEHICLE_BUILD_BLOCKED", `Timeline vehicle build blocked by ${blocked.join(", ")}`);
    state.revision += 1;
    for (const requirement of config.material_requirements) {
      state.material_stockpile[requirement.material_id] = Number((state.material_stockpile[requirement.material_id] - requirement.quantity).toFixed(3));
      state.consumed_materials[requirement.material_id] = Number(((state.consumed_materials[requirement.material_id] ?? 0) + requirement.quantity).toFixed(3));
    }
    state.built = true;
    state.checksum = config.blueprint_checksum;
    state.energy_reserve = config.initial_energy_after_build;
    record("POCKET_TIME_CLOAKED_UFO_BUILT", { vehicle_id: config.vehicle_id, checksum: state.checksum });
    persist();
    notifier.emit("POCKET_TIME_CLOAKED_UFO_BUILT", { vehicle_id: config.vehicle_id });
    return getSnapshot();
  }

  function charge(amount = config.charge_increment) {
    usable();
    if (!state.built) throw runtimeError(RUNTIME, "VEHICLE_NOT_BUILT", "Build the Timeline vehicle before charging it");
    const energyMaterial = config.energy_material_id;
    const normalized = Number(amount);
    if (!Number.isFinite(normalized) || normalized <= 0 || normalized > config.energy_capacity) throw runtimeError(RUNTIME, "INVALID_CHARGE", "Timeline energy charge is outside the bounded range");
    if ((state.material_stockpile[energyMaterial] ?? 0) < normalized) throw runtimeError(RUNTIME, "ENERGY_MATERIAL_REQUIRED", `Supply ${energyMaterial} before charging`);
    const accepted = Math.min(normalized, config.energy_capacity - state.energy_reserve);
    if (accepted <= 0) return getSnapshot();
    state.revision += 1;
    state.material_stockpile[energyMaterial] = Number((state.material_stockpile[energyMaterial] - accepted).toFixed(3));
    state.consumed_materials[energyMaterial] = Number(((state.consumed_materials[energyMaterial] ?? 0) + accepted).toFixed(3));
    state.energy_reserve = Number((state.energy_reserve + accepted).toFixed(3));
    record("TIMELINE_VEHICLE_CHARGED", { amount: accepted, energy_material_id: energyMaterial });
    persist();
    notifier.emit("TIMELINE_VEHICLE_CHARGED", { amount: accepted });
    return getSnapshot();
  }

  function consumeTravelEnergy(referenceId) {
    usable();
    if (!state.built || state.checksum !== config.blueprint_checksum) throw runtimeError(RUNTIME, "VEHICLE_INTEGRITY_FAILED", "Timeline vehicle integrity verification failed");
    if (state.energy_reserve < config.travel_energy_cost) throw runtimeError(RUNTIME, "TRAVEL_ENERGY_REQUIRED", "Timeline vehicle has insufficient energy");
    state.revision += 1;
    state.energy_reserve = Number((state.energy_reserve - config.travel_energy_cost).toFixed(3));
    record("TIMELINE_TRAVEL_ENERGY_CONSUMED", { reference_id: referenceId, amount: config.travel_energy_cost });
    persist();
    notifier.emit("TIMELINE_TRAVEL_ENERGY_CONSUMED", { reference_id: referenceId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (config.vehicle_type !== "POCKET_TIME_CLOAKED_UFO") issues.push("invalid Timeline transport type");
    if (state.built && state.checksum !== config.blueprint_checksum) issues.push("vehicle checksum mismatch");
    if (state.energy_reserve < 0 || state.energy_reserve > config.energy_capacity) issues.push("vehicle energy outside capacity");
    if (typeof sharedGateProvider !== "function") {
      for (const requirement of config.technology_requirements) {
        const progress = state.technology_progress[requirement.technology_id];
        if (progress < 0 || progress > requirement.required_points) issues.push(`${requirement.technology_id} research outside bounds`);
      }
    }
    if (Object.values(state.material_stockpile).some((quantity) => quantity < 0)) issues.push("vehicle material stockpile became negative");
    if (state.audit_log.length > MAX_AUDIT) issues.push("vehicle audit limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "POCKET_TIME_CLOAKED_UFO_V2_ALPHA", issues, status: status(), shared_gates: sharedGateProvider?.() ?? null });
  }

  return Object.freeze({
    getSnapshot,
    research,
    supplyMaterial,
    build,
    charge,
    consumeTravelEnergy,
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
