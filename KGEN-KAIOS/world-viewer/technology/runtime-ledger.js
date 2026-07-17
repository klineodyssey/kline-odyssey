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

export function createBoundedLedgerRuntime({
  runtime,
  schemaVersion = "1.0.0",
  catalog,
  idField,
  initialField,
  valueField,
  storage,
  storageKey,
  auditPrefix
}) {
  if (!Array.isArray(catalog) || catalog.length === 0) throw new TypeError(`${runtime} requires a catalog`);
  const ids = catalog.map((entry) => entry[idField]);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id)) throw new TypeError(`${runtime} catalog IDs must be unique`);
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    balances: Object.fromEntries(catalog.map((entry) => [entry[idField], Number(entry[initialField] ?? 0)])),
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === schemaVersion && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      balances: { ...state.balances, ...restored.state.balances },
      audit_log: restored.state.audit_log?.slice(-120) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: schemaVersion, state });
  const usable = () => {
    if (destroyed) throw runtimeError(runtime, "RUNTIME_DESTROYED", `${runtime} has been destroyed`);
  };
  const entry = (id) => {
    const found = catalog.find((candidate) => candidate[idField] === id);
    if (!found) throw runtimeError(runtime, "UNKNOWN_LEDGER_ITEM", `Unknown ${runtime} item ${id}`);
    return found;
  };
  const getSnapshot = () => snapshot({
    runtime,
    schema_version: schemaVersion,
    simulation_only: true,
    records: catalog.map((item) => ({ ...item, [valueField]: state.balances[item[idField]] })),
    audit_log: state.audit_log,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function record(type, details) {
    boundedPush(state.audit_log, {
      audit_id: stableId(auditPrefix, state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, 120);
  }

  function add(id, quantity, reason = "SYNTHETIC_COLLECTION") {
    usable();
    const item = entry(id);
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0 || amount > item.capacity) {
      throw runtimeError(runtime, "INVALID_LEDGER_ADDITION", `${id} addition is outside its bounded capacity`);
    }
    const accepted = Math.min(amount, item.capacity - state.balances[id]);
    if (accepted <= 0) return getSnapshot();
    state.revision += 1;
    state.balances[id] = Number((state.balances[id] + accepted).toFixed(3));
    record("LEDGER_ITEM_ADDED", { item_id: id, quantity: accepted, reason });
    persist();
    notifier.emit("LEDGER_ITEM_ADDED", { item_id: id, quantity: accepted });
    return getSnapshot();
  }

  function consume(id, quantity, reason = "SYNTHETIC_CONSUMPTION") {
    usable();
    entry(id);
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) throw runtimeError(runtime, "INVALID_LEDGER_CONSUMPTION", `${id} consumption must be positive`);
    if (state.balances[id] < amount) throw runtimeError(runtime, "INSUFFICIENT_LEDGER_BALANCE", `${id} balance is insufficient`);
    state.revision += 1;
    state.balances[id] = Number((state.balances[id] - amount).toFixed(3));
    record("LEDGER_ITEM_CONSUMED", { item_id: id, quantity: amount, reason });
    persist();
    notifier.emit("LEDGER_ITEM_CONSUMED", { item_id: id, quantity: amount });
    return getSnapshot();
  }

  function has(costs = {}) {
    return Object.entries(costs).every(([id, quantity]) => {
      entry(id);
      return state.balances[id] >= Number(quantity);
    });
  }

  function consumeBundle(costs = {}, reason) {
    usable();
    if (!has(costs)) throw runtimeError(runtime, "INSUFFICIENT_LEDGER_BUNDLE", `${runtime} bundle is incomplete`);
    for (const [id, quantity] of Object.entries(costs)) consume(id, quantity, reason);
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    for (const item of catalog) {
      const value = state.balances[item[idField]];
      if (!Number.isFinite(value) || value < 0 || value > item.capacity) issues.push(`${item[idField]} is outside capacity`);
    }
    if (state.audit_log.length > 120) issues.push("audit limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime, issues });
  }

  return Object.freeze({
    getSnapshot,
    add,
    consume,
    consumeBundle,
    has,
    balance: (id) => {
      entry(id);
      return state.balances[id];
    },
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
