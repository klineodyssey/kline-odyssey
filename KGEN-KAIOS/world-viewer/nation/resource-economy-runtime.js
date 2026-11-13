import {
  boundedPush,
  createNotifier,
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
const K5168_MINE = Object.freeze({
  point_id: "P_5168p0_金山銀礦_R22",
  capacity: 3,
  energy_cost: 10,
  gold_yield: 1
});

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
  const initialState = () => ({
    revision: 0,
    quantities: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, resource.initial_quantity])),
    net_movements: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, 0])),
    movements: [],
    trades: [],
    audit_log: [],
    mining_rounds: []
  });
  let state = initialState();
  let lastSave = null;

  function refresh(required = false) {
    if (!storageRef) return;
    try {
      const raw = storageRef.getItem(storageKey);
      if (raw === lastSave) return;
      if (raw === null) {
        state = initialState();
      } else {
        const envelope = JSON.parse(raw);
        const restored = envelope.state;
        if (envelope.schema_version !== SCHEMA_VERSION ||
          !Number.isSafeInteger(restored?.revision) || restored.revision < 0) {
          throw new Error("Invalid resource save");
        }
        const rounds = restored.mining_rounds === undefined ? [] : restored.mining_rounds;
        if (!Array.isArray(rounds) || rounds.length > K5168_MINE.capacity ||
          rounds.some((run, index) => run?.round !== index + 1 ||
            run.point_id !== K5168_MINE.point_id || typeof run.proposal_id !== "string" ||
            run.synthetic !== true)) throw new Error("Invalid mine rounds");
        const defaults = initialState();
        state = {
          ...defaults,
          ...restored,
          quantities: { ...defaults.quantities, ...restored.quantities },
          net_movements: { ...defaults.net_movements, ...restored.net_movements },
          movements: restored.movements?.slice(-MAX_TRADES) ?? [],
          trades: restored.trades?.slice(-MAX_TRADES) ?? [],
          audit_log: restored.audit_log?.slice(-MAX_AUDIT) ?? [],
          mining_rounds: rounds
        };
      }
      lastSave = raw;
    } catch {
      if (required) throw runtimeError(RUNTIME, "RESOURCE_STORAGE_FAILED", "Unable to read the saved resource inventory");
    }
  }

  function persist(next = state) {
    const envelope = { schema_version: SCHEMA_VERSION, state: next };
    if (!saveEnvelope(storageRef, storageKey, envelope)) {
      if (storageRef) lastSave = undefined;
      return false;
    }
    lastSave = JSON.stringify(envelope);
    return true;
  }

  refresh();
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
    refresh(true);
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
    refresh(true);
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

  function quoteMineDevelopment(budget) {
    usable();
    refresh(true);
    if (config.planet_id !== "EARTH") throw runtimeError(RUNTIME, "MINE_UNAVAILABLE", "K5168 is unavailable on this planet");
    if (state.mining_rounds.length >= K5168_MINE.capacity) {
      throw runtimeError(RUNTIME, "MINE_DEPLETED", "The K5168 deposit has been depleted");
    }
    const energy = state.quantities.ENERGY;
    const gold = state.quantities.GOLD;
    if (!Number.isFinite(energy) || !Number.isFinite(gold) ||
      !Number.isFinite(state.net_movements.ENERGY) || !Number.isFinite(state.net_movements.GOLD)) {
      throw runtimeError(RUNTIME, "RESOURCE_STORAGE_FAILED", "Resource quantities are invalid");
    }
    if (!Number.isSafeInteger(budget) || budget < K5168_MINE.energy_cost ||
      budget > energy - resource("ENERGY").minimum_reserve) {
      throw runtimeError(RUNTIME, "MINE_BUDGET_INSUFFICIENT", "Insufficient available simulated energy");
    }
    if (gold + K5168_MINE.gold_yield > resource("GOLD").capacity) {
      throw runtimeError(RUNTIME, "MINE_INVENTORY_FULL", "Gold inventory capacity reached");
    }
    return snapshot({
      point_id: K5168_MINE.point_id,
      proposal_id: stableId("K5168-proposal", state.revision),
      revision: state.revision,
      budget,
      energy_cost: K5168_MINE.energy_cost,
      gold_yield: K5168_MINE.gold_yield
    });
  }

  function developMine(proposal) {
    usable();
    refresh(true);
    if (state.mining_rounds.some(run => run.proposal_id === proposal?.proposal_id)) {
      throw runtimeError(RUNTIME, "MINE_ALREADY_COMMITTED", "This mining proposal has already been committed");
    }
    if (proposal?.point_id !== K5168_MINE.point_id || proposal.revision !== state.revision ||
      proposal.proposal_id !== stableId("K5168-proposal", state.revision) ||
      proposal.energy_cost !== K5168_MINE.energy_cost || proposal.gold_yield !== K5168_MINE.gold_yield) {
      throw runtimeError(RUNTIME, "MINE_STALE_PROPOSAL", "The mining proposal must be reviewed again");
    }
    const quote = quoteMineDevelopment(proposal.budget);
    const revision = state.revision + 1;
    const run = {
      run_id: stableId("resource-mine", revision),
      point_id: quote.point_id,
      proposal_id: quote.proposal_id,
      round: state.mining_rounds.length + 1,
      energy_used: quote.energy_cost,
      gold_produced: quote.gold_yield,
      synthetic: true
    };
    const next = {
      ...state,
      revision,
      quantities: { ...state.quantities },
      net_movements: { ...state.net_movements },
      movements: [...state.movements],
      audit_log: [...state.audit_log],
      mining_rounds: [...state.mining_rounds, run]
    };
    const updates = [
      { resourceId: "ENERGY", delta: -run.energy_used, cause: "MINE_ENERGY_SPENT" },
      { resourceId: "GOLD", delta: run.gold_produced, cause: "MINE_OUTPUT" }
    ];
    for (const { resourceId, delta, cause } of updates) {
      next.quantities[resourceId] = Number((Number(state.quantities[resourceId]) + delta).toFixed(3));
      next.net_movements[resourceId] = Number((state.net_movements[resourceId] + delta).toFixed(3));
      boundedPush(next.movements, {
        movement_id: `${run.run_id}-${resourceId}`,
        resource_id: resourceId,
        delta,
        cause,
        reference_id: run.run_id
      }, MAX_TRADES);
    }
    boundedPush(next.audit_log, {
      audit_id: stableId("resource-audit", revision),
      type: "MINE_DEVELOPMENT_COMPLETED",
      reference_id: run.run_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    }, MAX_AUDIT);
    if (!persist(next)) throw runtimeError(RUNTIME, "RESOURCE_STORAGE_FAILED", "Unable to save the mining result");
    state = next;
    notifier.emit("MINE_DEVELOPMENT_COMPLETED", { run_id: run.run_id, point_id: run.point_id });
    return snapshot(run);
  }

  const getSnapshot = () => {
    refresh();
    return snapshot({
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
      mine: config.planet_id === "EARTH" ? {
        ...K5168_MINE,
        remaining: K5168_MINE.capacity - state.mining_rounds.length,
        rounds: state.mining_rounds
      } : null,
      net_movements: state.net_movements,
      audit_log: state.audit_log,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function integrityReport() {
    refresh();
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
    quoteMineDevelopment,
    developMine,
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
