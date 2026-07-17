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

const RUNTIME = "ResourceEconomyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_TRADES = 160;
const MAX_AUDIT = 180;

export const REQUIRED_PLANET_RESOURCES = Object.freeze([
  "WATER",
  "FOREST",
  "STONE",
  "IRON",
  "COPPER",
  "GOLD",
  "OIL",
  "GAS",
  "RARE_EARTH",
  "FOOD",
  "ENERGY"
]);

function positiveQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw runtimeError(RUNTIME, "INVALID_QUANTITY", "Resource quantity must be positive");
  return Number(parsed.toFixed(3));
}

function validateConfig(config) {
  if (!config || !Array.isArray(config.catalog)) throw new TypeError("Resource Economy Runtime requires a resource catalog");
  if (JSON.stringify(config.catalog.map(({ resource_id: id }) => id)) !== JSON.stringify(REQUIRED_PLANET_RESOURCES)) {
    throw runtimeError(RUNTIME, "INVALID_RESOURCE_CATALOG", "Planet Resource catalog must contain the approved eleven resources in order");
  }
  for (const resource of config.catalog) {
    if (![resource.initial_quantity, resource.capacity, resource.minimum_reserve, resource.reference_value_credit].every(Number.isFinite)) {
      throw runtimeError(RUNTIME, "INVALID_RESOURCE", `${resource.resource_id} has invalid numeric configuration`);
    }
    if (resource.initial_quantity < 0 || resource.initial_quantity > resource.capacity || resource.minimum_reserve < 0) {
      throw runtimeError(RUNTIME, "INVALID_RESOURCE", `${resource.resource_id} has invalid inventory bounds`);
    }
  }
}

export function createResourceEconomyRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.resource-economy.v1"
} = {}) {
  validateConfig(config);
  const storageRef = resolveStorage(storage);
  const catalog = new Map(config.catalog.map((resource) => [resource.resource_id, Object.freeze({ ...resource })]));
  let destroyed = false;
  let state = {
    revision: 0,
    quantities: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, resource.initial_quantity])),
    net_movements: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, 0])),
    movements: [],
    trades: [],
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      quantities: { ...state.quantities, ...restored.state.quantities },
      net_movements: { ...state.net_movements, ...restored.state.net_movements },
      movements: restored.state.movements?.slice(-MAX_TRADES) ?? [],
      trades: restored.state.trades?.slice(-MAX_TRADES) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Resource Economy Runtime has been destroyed");
  };

  function resource(resourceId) {
    const record = catalog.get(resourceId);
    if (!record) throw runtimeError(RUNTIME, "UNKNOWN_RESOURCE", `Unknown resource ${resourceId}`);
    return record;
  }

  function quoteTrade({ direction, resourceId, quantity }) {
    usable();
    if (!["IMPORT", "EXPORT"].includes(direction)) throw runtimeError(RUNTIME, "INVALID_DIRECTION", "Resource trade direction must be IMPORT or EXPORT");
    const definition = resource(resourceId);
    const normalized = positiveQuantity(quantity);
    const current = Number(state.quantities[resourceId] ?? 0);
    if (direction === "EXPORT") {
      if (definition.export_enabled !== true) throw runtimeError(RUNTIME, "EXPORT_DISABLED", `${resourceId} export is disabled by trade policy`);
      if (current - normalized < definition.minimum_reserve) throw runtimeError(RUNTIME, "RESERVE_PROTECTED", `${resourceId} export would breach the national reserve`);
    } else {
      if (definition.import_enabled !== true) throw runtimeError(RUNTIME, "IMPORT_DISABLED", `${resourceId} import is disabled by trade policy`);
      if (current + normalized > definition.capacity) throw runtimeError(RUNTIME, "CAPACITY_EXCEEDED", `${resourceId} import exceeds storage capacity`);
    }
    return snapshot({
      direction,
      resource_id: resourceId,
      quantity: normalized,
      unit: definition.unit,
      unit_value_credit: definition.reference_value_credit,
      total_value_credit: Number((normalized * definition.reference_value_credit).toFixed(2)),
      before_quantity: current,
      after_quantity: Number((current + (direction === "IMPORT" ? normalized : -normalized)).toFixed(3))
    });
  }

  function executeTrade({ direction, resourceId, quantity, counterpartyId = "synthetic-trade-partner-001" } = {}) {
    const quote = quoteTrade({ direction, resourceId, quantity });
    state.revision += 1;
    state.quantities[resourceId] = quote.after_quantity;
    state.net_movements[resourceId] = Number((state.net_movements[resourceId] + (direction === "IMPORT" ? quote.quantity : -quote.quantity)).toFixed(3));
    const trade = {
      trade_id: stableId("resource-trade", state.revision),
      ...quote,
      counterparty_id: counterpartyId,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      settlement: "KAIOS_CREDIT_PROTOTYPE_LEDGER",
      real_trade: false
    };
    boundedPush(state.trades, trade, MAX_TRADES);
    boundedPush(state.movements, {
      movement_id: stableId("resource-movement", state.revision),
      resource_id: resourceId,
      delta: direction === "IMPORT" ? quote.quantity : -quote.quantity,
      cause: direction,
      reference_id: trade.trade_id
    }, MAX_TRADES);
    boundedPush(state.audit_log, {
      audit_id: stableId("resource-audit", state.revision),
      type: "RESOURCE_TRADE_COMPLETED",
      trade_id: trade.trade_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    }, MAX_AUDIT);
    persist();
    notifier.emit("RESOURCE_TRADE_COMPLETED", { trade_id: trade.trade_id, direction, resource_id: resourceId });
    return { snapshot: getSnapshot(), trade: snapshot(trade) };
  }

  function exchange({ giveResourceId, giveQuantity, receiveResourceId, receiveQuantity, counterpartyId = "synthetic-exchange-partner-001" } = {}) {
    usable();
    if (giveResourceId === receiveResourceId) throw runtimeError(RUNTIME, "INVALID_EXCHANGE", "Resource exchange requires two distinct resources");
    const give = resource(giveResourceId);
    const receive = resource(receiveResourceId);
    const giveAmount = positiveQuantity(giveQuantity);
    const receiveAmount = positiveQuantity(receiveQuantity);
    const giveCurrent = Number(state.quantities[giveResourceId] ?? 0);
    const receiveCurrent = Number(state.quantities[receiveResourceId] ?? 0);
    if (giveCurrent - giveAmount < give.minimum_reserve) throw runtimeError(RUNTIME, "RESERVE_PROTECTED", `${giveResourceId} exchange would breach reserve`);
    if (receiveCurrent + receiveAmount > receive.capacity) throw runtimeError(RUNTIME, "CAPACITY_EXCEEDED", `${receiveResourceId} exchange exceeds capacity`);
    state.revision += 1;
    state.quantities[giveResourceId] = Number((giveCurrent - giveAmount).toFixed(3));
    state.quantities[receiveResourceId] = Number((receiveCurrent + receiveAmount).toFixed(3));
    state.net_movements[giveResourceId] = Number((state.net_movements[giveResourceId] - giveAmount).toFixed(3));
    state.net_movements[receiveResourceId] = Number((state.net_movements[receiveResourceId] + receiveAmount).toFixed(3));
    const trade = {
      trade_id: stableId("resource-exchange", state.revision),
      direction: "EXCHANGE",
      give: { resource_id: giveResourceId, quantity: giveAmount, unit: give.unit },
      receive: { resource_id: receiveResourceId, quantity: receiveAmount, unit: receive.unit },
      counterparty_id: counterpartyId,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      real_trade: false
    };
    boundedPush(state.trades, trade, MAX_TRADES);
    for (const [resourceId, delta] of [[giveResourceId, -giveAmount], [receiveResourceId, receiveAmount]]) {
      boundedPush(state.movements, {
        movement_id: `${stableId("resource-movement", state.revision)}-${resourceId}`,
        resource_id: resourceId,
        delta,
        cause: "EXCHANGE",
        reference_id: trade.trade_id
      }, MAX_TRADES);
    }
    boundedPush(state.audit_log, {
      audit_id: stableId("resource-audit", state.revision),
      type: "RESOURCE_EXCHANGE_COMPLETED",
      trade_id: trade.trade_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    }, MAX_AUDIT);
    persist();
    notifier.emit("RESOURCE_EXCHANGE_COMPLETED", { trade_id: trade.trade_id });
    return { snapshot: getSnapshot(), trade: snapshot(trade) };
  }

  const getSnapshot = () => snapshot({
    runtime: "PLANET_RESOURCE_ECONOMY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    authoritative: false,
    planet_id: config.planet_id,
    resources: config.catalog.map((definition) => ({
      ...definition,
      quantity: state.quantities[definition.resource_id],
      available_for_export: Number(Math.max(0, state.quantities[definition.resource_id] - definition.minimum_reserve).toFixed(3)),
      utilization_percent: Number((state.quantities[definition.resource_id] / definition.capacity * 100).toFixed(1))
    })),
    trades: state.trades,
    movements: state.movements,
    net_movements: state.net_movements,
    audit_log: state.audit_log,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function integrityReport() {
    const issues = [];
    if (JSON.stringify(config.catalog.map(({ resource_id: id }) => id)) !== JSON.stringify(REQUIRED_PLANET_RESOURCES)) issues.push("resource catalog changed");
    for (const definition of config.catalog) {
      const expected = Number((definition.initial_quantity + state.net_movements[definition.resource_id]).toFixed(3));
      const actual = Number(state.quantities[definition.resource_id]);
      if (Math.abs(expected - actual) > 0.001) issues.push(`${definition.resource_id} conservation mismatch`);
      if (actual < 0 || actual > definition.capacity) issues.push(`${definition.resource_id} inventory outside capacity`);
    }
    if (state.trades.some((trade) => trade.real_trade !== false || trade.review_status !== "REVIEWED_SYNTHETIC")) issues.push("resource trade crossed simulation boundary");
    if (state.trades.length > MAX_TRADES || state.movements.length > MAX_TRADES || state.audit_log.length > MAX_AUDIT) issues.push("resource history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "PLANET_RESOURCE_ECONOMY_ALPHA", issues, trade_count: state.trades.length });
  }

  return Object.freeze({
    getSnapshot,
    quoteTrade,
    executeTrade,
    exchange,
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
