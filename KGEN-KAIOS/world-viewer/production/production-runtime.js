import {
  boundedPush,
  clamp,
  clone,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "ProductionRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;
const NODE_STATES = new Set(["AVAILABLE", "DEGRADED", "OFFLINE"]);
const CONSUMABLE_NODE_CATEGORIES = new Set([
  "ELECTRICITY", "WATER", "SILICON", "CHEMICALS", "INDUSTRIAL_GAS",
  "TRANSPORTATION", "WAREHOUSE", "FINANCE"
]);

function initialState(config) {
  return {
    revision: 0,
    elapsed_hours: 0,
    supply_nodes: clone(config.supply_nodes),
    factory: {
      ...clone(config.factory),
      status: "READY",
      cycle_progress_hours: 0,
      total_produced: 0,
      product_inventory: {},
      retired_products: {},
      repaired_products: 0,
      recycled_products: 0,
      missing_dependencies: [],
      last_cycle: null
    },
    events: []
  };
}

function restore(candidate, fallback) {
  if (!candidate || !Array.isArray(candidate.supply_nodes) || !candidate.factory) return fallback;
  const nodes = new Map(candidate.supply_nodes.map((node) => [node.node_id, node]));
  return {
    ...fallback,
    ...candidate,
    supply_nodes: fallback.supply_nodes.map((node) => ({ ...node, ...(nodes.get(node.node_id) ?? {}) })),
    factory: {
      ...fallback.factory,
      ...candidate.factory,
      material_inventory: { ...fallback.factory.material_inventory, ...(candidate.factory.material_inventory ?? {}) },
      product_inventory: { ...(candidate.factory.product_inventory ?? {}) },
      retired_products: { ...(candidate.factory.retired_products ?? {}) },
      missing_dependencies: Array.isArray(candidate.factory.missing_dependencies)
        ? candidate.factory.missing_dependencies.slice(0, 40)
        : []
    },
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

export function createProductionRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.production.v1"
} = {}) {
  if (!config?.factory || !Array.isArray(config?.supply_nodes)) {
    throw new TypeError("Production Runtime requires factory and supply-chain fixture data");
  }
  const storageRef = resolveStorage(storage);
  const defaults = initialState(config);
  let state = defaults;
  let destroyed = false;
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.factory);
  if (saved) state = restore(saved.state, defaults);

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_PRODUCTION_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    real_industrial_control: false,
    supply_nodes: state.supply_nodes,
    factory: state.factory,
    product_lifecycle: ["FACTORY", "WAREHOUSE", "TRANSPORT", "STORE", "CUSTOMER", "REPAIR", "RECYCLE"],
    elapsed_hours: state.elapsed_hours,
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Production Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, { event_id: stableId("production", state.revision), type, ...details }, MAX_EVENTS);
  }

  function nodeByCategory(category) {
    return state.supply_nodes.find((node) => node.category === category) ?? null;
  }

  function evaluate(companyStatus = "ACTIVE") {
    const recipe = state.factory.product_recipe;
    const missing = [];
    for (const category of state.factory.required_nodes) {
      const node = nodeByCategory(category);
      const required = Number(recipe.node_costs?.[category] ?? 1);
      if (!node) missing.push(`${category}:MISSING_NODE`);
      else if (node.status !== "AVAILABLE") missing.push(`${category}:${node.status}`);
      else if (Number(node.capacity) < required) missing.push(`${category}:INSUFFICIENT_CAPACITY`);
    }
    for (const [material, required] of Object.entries(recipe.materials)) {
      if (Number(state.factory.material_inventory[material] ?? 0) < Number(required)) {
        missing.push(`${material}:INSUFFICIENT_MATERIAL`);
      }
    }
    if (companyStatus === "BANKRUPT") missing.push("AI_COMPANY:BANKRUPT");
    if (state.factory.health <= 0) missing.push("FACTORY:LIFE_OS_FAILED");
    if (state.factory.maintenance <= 0) missing.push("FACTORY:MAINTENANCE_REQUIRED");
    state.factory.missing_dependencies = missing;
    state.factory.status = missing.length ? "BLOCKED" : "READY";
    return snapshot({ ready: missing.length === 0, status: state.factory.status, missing_dependencies: missing });
  }

  function applyCycle(companyStatus, source) {
    const readiness = evaluate(companyStatus);
    if (!readiness.ready) {
      throw runtimeError(RUNTIME, "FACTORY_DEPENDENCY_MISSING", `Factory blocked: ${readiness.missing_dependencies.join(", ")}`);
    }
    const recipe = state.factory.product_recipe;
    for (const [material, required] of Object.entries(recipe.materials)) {
      state.factory.material_inventory[material] -= Number(required);
    }
    for (const [category, cost] of Object.entries(recipe.node_costs ?? {})) {
      const node = nodeByCategory(category);
      if (node && CONSUMABLE_NODE_CATEGORIES.has(category)) node.capacity = Math.max(0, Number(node.capacity) - Number(cost));
    }
    const quantity = Math.max(1, Number(state.factory.capacity_per_cycle) || 1);
    state.factory.product_inventory[recipe.product_id] = (state.factory.product_inventory[recipe.product_id] ?? 0) + quantity;
    state.factory.total_produced += quantity;
    state.factory.maintenance = clamp(state.factory.maintenance - 0.8);
    state.factory.energy = clamp(state.factory.energy - 0.5);
    state.factory.health = clamp(state.factory.health - 0.05);
    state.factory.cycle_progress_hours = 0;
    state.factory.last_cycle = {
      cycle_id: stableId("factory-cycle", state.factory.total_produced),
      product_id: recipe.product_id,
      quantity,
      source,
      synthetic: true
    };
    record("PRODUCT_CREATED", state.factory.last_cycle);
    evaluate(companyStatus);
    return state.factory.last_cycle;
  }

  function runCycle({ companyStatus = "ACTIVE" } = {}) {
    usable();
    const result = applyCycle(companyStatus, "PLAYER_REQUEST");
    persist();
    notifier.emit("PRODUCT_CREATED", result);
    return snapshot({ result, snapshot: getSnapshot() });
  }

  function advance({ elapsedHours = 1, companyStatus = "ACTIVE", autoProduce = true } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) {
      throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Production advance must be 0-720 hours");
    }
    state.elapsed_hours += hours;
    const produced = [];
    const readiness = evaluate(companyStatus);
    if (readiness.ready) {
      state.factory.cycle_progress_hours += hours;
      state.factory.energy = clamp(state.factory.energy + 0.12 * hours);
      state.factory.health = clamp(state.factory.health + 0.015 * hours);
      while (autoProduce && state.factory.cycle_progress_hours >= state.factory.cycle_hours) {
        state.factory.cycle_progress_hours -= state.factory.cycle_hours;
        try {
          produced.push(applyCycle(companyStatus, "AUTONOMOUS_WORLD"));
        } catch {
          break;
        }
      }
    } else {
      state.factory.health = clamp(state.factory.health - 0.12 * hours);
      state.factory.energy = clamp(state.factory.energy - 0.08 * hours);
    }
    record("PRODUCTION_ADVANCED", { elapsed_hours: hours, produced: produced.length, status: state.factory.status });
    persist();
    notifier.emit("PRODUCTION_ADVANCED", { elapsed_hours: hours, produced: produced.length });
    return snapshot({ produced, snapshot: getSnapshot() });
  }

  function setNodeStatus(nodeId, status) {
    usable();
    if (!NODE_STATES.has(status)) throw runtimeError(RUNTIME, "INVALID_NODE_STATUS", `Unsupported node status ${status}`);
    const node = state.supply_nodes.find((candidate) => candidate.node_id === nodeId);
    if (!node) throw runtimeError(RUNTIME, "SUPPLY_NODE_NOT_FOUND", `Unknown supply node ${nodeId}`);
    node.status = status;
    record("SUPPLY_NODE_CHANGED", { node_id: nodeId, status });
    evaluate();
    persist();
    notifier.emit("SUPPLY_NODE_CHANGED", { node_id: nodeId, status });
    return getSnapshot();
  }

  function repairProduct(productId, quantity = 1) {
    usable();
    const units = Math.max(1, Math.floor(Number(quantity) || 1));
    if ((state.factory.retired_products[productId] ?? 0) < units) {
      throw runtimeError(RUNTIME, "NO_REPAIR_CANDIDATE", `No retired ${productId} is available for repair`);
    }
    state.factory.retired_products[productId] -= units;
    state.factory.product_inventory[productId] = (state.factory.product_inventory[productId] ?? 0) + units;
    state.factory.repaired_products += units;
    record("PRODUCT_REPAIRED", { product_id: productId, quantity: units });
    persist();
    notifier.emit("PRODUCT_REPAIRED", { product_id: productId, quantity: units });
    return getSnapshot();
  }

  function recycleProduct(productId, quantity = 1) {
    usable();
    const units = Math.max(1, Math.floor(Number(quantity) || 1));
    if ((state.factory.product_inventory[productId] ?? 0) < units) {
      throw runtimeError(RUNTIME, "NO_PRODUCT_STOCK", `No ${productId} is available for recycling`);
    }
    state.factory.product_inventory[productId] -= units;
    state.factory.material_inventory.STEEL = (state.factory.material_inventory.STEEL ?? 0) + units;
    state.factory.material_inventory.PLASTIC = (state.factory.material_inventory.PLASTIC ?? 0) + units;
    state.factory.recycled_products += units;
    record("PRODUCT_RECYCLED", { product_id: productId, quantity: units });
    persist();
    notifier.emit("PRODUCT_RECYCLED", { product_id: productId, quantity: units });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const nodeIds = new Set();
    for (const node of state.supply_nodes) {
      if (nodeIds.has(node.node_id)) issues.push(`${node.node_id}: duplicate node`);
      nodeIds.add(node.node_id);
      if (!NODE_STATES.has(node.status)) issues.push(`${node.node_id}: invalid status`);
      if (!Number.isFinite(Number(node.capacity)) || Number(node.capacity) < 0) issues.push(`${node.node_id}: invalid capacity`);
    }
    for (const [material, quantity] of Object.entries(state.factory.material_inventory)) {
      if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) issues.push(`${material}: invalid material quantity`);
    }
    for (const category of state.factory.required_nodes) {
      if (!state.supply_nodes.some((node) => node.category === category)) issues.push(`${category}: required node missing`);
    }
    if (!state.factory.body_profile_id || !state.factory.species_os_id || !state.factory.life_os_profile_id) issues.push("factory organism layers incomplete");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    return snapshot({
      ok: issues.length === 0,
      runtime: "CIVILIZATION_PRODUCTION_ALPHA",
      factory_status: state.factory.status,
      total_produced: state.factory.total_produced,
      issues
    });
  }

  evaluate();

  return Object.freeze({
    getSnapshot,
    evaluate,
    runCycle,
    advance,
    setNodeStatus,
    repairProduct,
    recycleProduct,
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
