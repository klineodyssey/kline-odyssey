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

const RUNTIME = "AiCompanyOrganismRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 160;
const MAX_LEDGER = 200;

function initialState(config) {
  return {
    revision: 0,
    company: {
      ...clone(config),
      status: "ACTIVE",
      company_life_state: "ALIVE",
      company_dna_revision: 1,
      supply_chain_health: 100,
      product_inventory: {},
      production_total: 0,
      sales_total: 0,
      expansion_state: "NOT_READY"
    },
    finance: {
      opening_balance: config.prototype_balance,
      balance: config.prototype_balance,
      revenue: 0,
      operating_cost: 0,
      inventory_value: 0,
      prototype_only: true
    },
    ledger: [],
    events: []
  };
}

function restore(candidate, fallback) {
  if (!candidate?.company || !candidate?.finance) return fallback;
  return {
    ...fallback,
    ...candidate,
    company: {
      ...fallback.company,
      ...candidate.company,
      assets: [...(candidate.company.assets ?? fallback.company.assets)],
      products: [...(candidate.company.products ?? fallback.company.products)],
      product_inventory: { ...(candidate.company.product_inventory ?? {}) }
    },
    finance: { ...fallback.finance, ...candidate.finance },
    ledger: Array.isArray(candidate.ledger) ? candidate.ledger.slice(-MAX_LEDGER) : [],
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

export function createAiCompanyOrganismRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.ai-company-organism.v1"
} = {}) {
  if (!config?.company_id || config.organism_type !== "AI_COMPANY_ORGANISM") {
    throw new TypeError("AI Company Organism Runtime requires a civilization company fixture");
  }
  const storageRef = resolveStorage(storage);
  const defaults = initialState(config);
  let state = defaults;
  let destroyed = false;
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.company);
  if (saved) state = restore(saved.state, defaults);

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_AI_COMPANY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    real_company: false,
    company: state.company,
    finance: state.finance,
    ledger: state.ledger,
    events: state.events,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "AI Company Organism Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, { event_id: stableId("company", state.revision), type, ...details }, MAX_EVENTS);
  }

  function ledger(type, amount, details = {}) {
    const entry = {
      entry_id: stableId("company-ledger", state.revision + state.ledger.length + 1),
      previous_entry_id: state.ledger.at(-1)?.entry_id ?? null,
      type,
      amount,
      ...details,
      synthetic: true
    };
    boundedPush(state.ledger, entry, MAX_LEDGER);
    return entry;
  }

  function evaluate({ factoryStatus = "READY", supplyChainHealth = state.company.supply_chain_health } = {}) {
    state.company.supply_chain_health = clamp(supplyChainHealth);
    if (state.finance.balance <= state.company.bankruptcy_threshold) {
      state.company.status = "BANKRUPT";
      state.company.company_life_state = "SUSPENDED";
    } else if (state.company.health < 30) {
      state.company.status = "DISTRESSED";
      state.company.company_life_state = "DEGRADED";
    } else if (factoryStatus === "BLOCKED" || state.company.supply_chain_health < 70) {
      state.company.status = "CONSTRAINED";
      state.company.company_life_state = "ALIVE";
    } else if (
      state.finance.balance >= state.company.expansion_balance
      && state.company.reputation >= state.company.expansion_reputation
      && state.company.health >= 80
    ) {
      state.company.status = "EXPANSION_READY";
      state.company.company_life_state = "ALIVE";
    } else {
      state.company.status = "ACTIVE";
      state.company.company_life_state = "ALIVE";
    }
    state.company.expansion_state = state.company.status === "EXPANSION_READY" ? "ELIGIBLE_FOR_REVIEW" : "NOT_READY";
    return state.company.status;
  }

  function recordProduction({ productId, quantity = 1, unitValue = 0, operatingCost = 20 } = {}) {
    usable();
    const units = Math.max(1, Math.floor(Number(quantity) || 1));
    const cost = Math.max(0, Number(operatingCost) || 0) * units;
    if (!productId) throw runtimeError(RUNTIME, "PRODUCT_REQUIRED", "Company production requires a product ID");
    if (state.finance.balance < cost) throw runtimeError(RUNTIME, "COMPANY_FINANCE_CONSTRAINED", "Company cannot fund the production cycle");
    state.finance.balance -= cost;
    state.finance.operating_cost += cost;
    state.finance.inventory_value += Math.max(0, Number(unitValue) || 0) * units;
    state.company.product_inventory[productId] = (state.company.product_inventory[productId] ?? 0) + units;
    state.company.production_total += units;
    state.company.reputation = clamp(state.company.reputation + units * 0.15);
    ledger("PRODUCTION_COST", -cost, { product_id: productId, quantity: units });
    record("COMPANY_PRODUCTION_RECORDED", { product_id: productId, quantity: units, cost });
    evaluate();
    persist();
    notifier.emit("COMPANY_PRODUCTION_RECORDED", { product_id: productId, quantity: units });
    return getSnapshot();
  }

  function sellProduct({ productId, quantity = 1, unitValue = 0 } = {}) {
    usable();
    const units = Math.max(1, Math.floor(Number(quantity) || 1));
    const inventory = state.company.product_inventory[productId] ?? 0;
    if (inventory < units) throw runtimeError(RUNTIME, "COMPANY_PRODUCT_UNAVAILABLE", `Company lacks ${productId}`);
    const revenue = Math.max(0, Number(unitValue) || 0) * units;
    state.company.product_inventory[productId] -= units;
    state.company.sales_total += units;
    state.finance.balance += revenue;
    state.finance.revenue += revenue;
    state.finance.inventory_value = Math.max(0, state.finance.inventory_value - revenue);
    state.company.reputation = clamp(state.company.reputation + units * 0.25);
    ledger("SYNTHETIC_PRODUCT_SALE", revenue, { product_id: productId, quantity: units });
    record("COMPANY_PRODUCT_SOLD", { product_id: productId, quantity: units, revenue });
    evaluate();
    persist();
    notifier.emit("COMPANY_PRODUCT_SOLD", { product_id: productId, quantity: units });
    return getSnapshot();
  }

  function advance({ elapsedHours = 1, factoryStatus = "READY", supplyChainHealth = 100 } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) {
      throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Company advance must be 0-720 hours");
    }
    if (factoryStatus === "READY" && supplyChainHealth >= 70) {
      state.company.health = clamp(state.company.health + 0.02 * hours);
      state.company.energy = clamp(state.company.energy - 0.01 * hours);
    } else {
      state.company.health = clamp(state.company.health - 0.08 * hours);
      state.company.energy = clamp(state.company.energy - 0.04 * hours);
    }
    evaluate({ factoryStatus, supplyChainHealth });
    record("COMPANY_ADVANCED", { elapsed_hours: hours, factory_status: factoryStatus, status: state.company.status });
    persist();
    notifier.emit("COMPANY_ADVANCED", { elapsed_hours: hours, status: state.company.status });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const expectedBalance = state.finance.opening_balance + state.finance.revenue - state.finance.operating_cost;
    if (Math.abs(expectedBalance - state.finance.balance) > 0.0001) issues.push("company ledger balance mismatch");
    if (state.finance.balance < 0) issues.push("company balance is negative");
    if (state.company.health < 0 || state.company.health > 100) issues.push("company health invalid");
    if (state.company.energy < 0 || state.company.energy > 100) issues.push("company energy invalid");
    if (state.company.reputation < 0 || state.company.reputation > 100) issues.push("company reputation invalid");
    if (!state.company.company_dna_id || !state.company.life_os_profile_id) issues.push("company organism layers incomplete");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    if (state.ledger.length > MAX_LEDGER) issues.push("ledger limit exceeded");
    return snapshot({
      ok: issues.length === 0,
      runtime: "CIVILIZATION_AI_COMPANY_ALPHA",
      status: state.company.status,
      balance: state.finance.balance,
      issues
    });
  }

  evaluate();

  return Object.freeze({
    getSnapshot,
    evaluate,
    recordProduction,
    sellProduct,
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
