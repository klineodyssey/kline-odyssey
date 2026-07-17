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

const RUNTIME = "EconomyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MARKET_ID = "civilization-market-alpha";
const GENESIS_TREASURY_ID = "civilization-genesis-treasury-alpha";
const MAX_LEDGER = 300;
const MAX_RESOURCE_QUANTITY = 10_000;
const WAREHOUSE_CAPACITY = 5_000;

export const RESOURCE_CATALOG = Object.freeze([
  ["RICE", "FOOD"], ["VEGETABLE", "FOOD"], ["FRUIT", "FOOD"],
  ["FISH", "FOOD"], ["PIG", "FOOD"], ["CHICKEN", "FOOD"],
  ["EGG", "FOOD"], ["MILK", "FOOD"], ["WATER", "WATER"],
  ["WOOD", "BUILDING_MATERIALS"], ["STONE", "BUILDING_MATERIALS"],
  ["IRON", "BUILDING_MATERIALS"], ["ELECTRICITY", "ENERGY"]
].map(([resource_id, category]) => Object.freeze({ resource_id, category })));

export const MARKETPLACE_CATEGORIES = Object.freeze([
  "FOOD", "FURNITURE", "TOOLS", "SEEDS", "BUILDING_MATERIALS", "MEDICAL", "ENERGY", "WATER"
]);

const DEFAULT_LISTINGS = Object.freeze([
  ["listing-rice", "RICE", "Rice", "FOOD", 6, 120],
  ["listing-vegetable", "VEGETABLE", "Vegetable", "FOOD", 5, 90],
  ["listing-fruit", "FRUIT", "Fruit", "FOOD", 8, 70],
  ["listing-water", "WATER", "Water", "WATER", 3, 180],
  ["listing-electricity", "ELECTRICITY", "Electricity", "ENERGY", 7, 140],
  ["listing-seed-rice", "SEED_RICE", "Rice seeds", "SEEDS", 4, 30],
  ["listing-tool", "FARM_TOOL", "Farm tool", "TOOLS", 18, 12],
  ["listing-furniture", "CHAIR", "Furniture", "FURNITURE", 24, 8],
  ["listing-wood", "WOOD", "Wood", "BUILDING_MATERIALS", 9, 85],
  ["listing-medical", "MEDICAL_KIT", "Medical kit", "MEDICAL", 28, 10]
].map(([listing_id, resource_id, label, category, price, stock]) => Object.freeze({
  listing_id, resource_id, label, category, price, stock
})));

function initialState(playerId, playerBalance, playerInventory, genesisTreasury) {
  return {
    revision: 0,
    accounts: {
      [playerId]: playerBalance,
      [MARKET_ID]: 10_000,
      [GENESIS_TREASURY_ID]: genesisTreasury
    },
    inventories: { [playerId]: { ...playerInventory } },
    listings: DEFAULT_LISTINGS.map((listing) => ({ ...listing })),
    transport_jobs: [],
    genesis_grants: {},
    ledger: []
  };
}

function cleanState(candidate, fallback) {
  if (!candidate || typeof candidate !== "object") return fallback;
  const state = { ...fallback, ...candidate };
  state.accounts = { ...fallback.accounts, ...(candidate.accounts ?? {}) };
  state.inventories = Object.fromEntries(Object.entries(candidate.inventories ?? fallback.inventories).map(([id, inventory]) => [id, { ...inventory }]));
  state.listings = Array.isArray(candidate.listings) ? candidate.listings.map((listing) => ({ ...listing })) : fallback.listings;
  state.transport_jobs = Array.isArray(candidate.transport_jobs) ? candidate.transport_jobs.slice(-80) : [];
  state.genesis_grants = candidate.genesis_grants && typeof candidate.genesis_grants === "object"
    ? Object.fromEntries(Object.entries(candidate.genesis_grants).map(([id, grant]) => [id, { ...grant }]))
    : {};
  state.ledger = Array.isArray(candidate.ledger) ? candidate.ledger.slice(-MAX_LEDGER) : [];
  return state;
}

function inventoryQuantity(inventory) {
  return Object.values(inventory ?? {}).reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
}

export function createEconomyRuntime({
  playerId = "mock-player-001",
  playerBalance = 500,
  playerInventory = { RICE: 3, VEGETABLE: 2, FRUIT: 1, WATER: 6, ELECTRICITY: 4 },
  genesisTreasury = 10_000,
  storage,
  storageKey = "kaios.world-viewer.economy.v1"
} = {}) {
  const storageRef = resolveStorage(storage);
  const defaults = initialState(playerId, playerBalance, playerInventory, genesisTreasury);
  let state = defaults;
  let destroyed = false;
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.accounts);
  if (restored) state = cleanState(restored.state, defaults);
  const initialCreditSupply = Object.values(state.accounts).reduce((sum, value) => sum + Number(value), 0);

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_ECONOMY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    prototype_ledger_only: true,
    player_id: playerId,
    player_balance: state.accounts[playerId] ?? 0,
    player_inventory: state.inventories[playerId] ?? {},
    balances: state.accounts,
    inventories: state.inventories,
    listings: state.listings,
    transport_jobs: state.transport_jobs,
    genesis_grants: state.genesis_grants,
    ledger: state.ledger,
    warehouse_capacity: WAREHOUSE_CAPACITY,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Economy Runtime has been destroyed");
  };
  const account = (id) => {
    if (!Object.hasOwn(state.accounts, id)) state.accounts[id] = 0;
    return state.accounts[id];
  };
  const inventory = (id) => {
    if (!state.inventories[id]) state.inventories[id] = {};
    return state.inventories[id];
  };

  function record(type, details) {
    state.revision += 1;
    return boundedPush(state.ledger, {
      entry_id: stableId("economy", state.revision),
      previous_entry_id: state.ledger.at(-1)?.entry_id ?? null,
      type,
      ...details,
      synthetic: true
    }, MAX_LEDGER);
  }

  function transferCredits(from, to, amount, reason) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw runtimeError(RUNTIME, "INVALID_AMOUNT", "Credit amount must be positive");
    if (account(from) < value) throw runtimeError(RUNTIME, "INSUFFICIENT_FUNDS", `${from} has insufficient prototype credits`);
    state.accounts[from] -= value;
    account(to);
    state.accounts[to] += value;
    record("BALANCED_CREDIT_TRANSFER", { from, to, amount: value, reason });
  }

  function buy({ listingId, buyerId = playerId, quantity = 1 } = {}) {
    usable();
    const units = integer(quantity);
    const listing = state.listings.find((item) => item.listing_id === listingId);
    if (!listing) throw runtimeError(RUNTIME, "LISTING_NOT_FOUND", `Unknown listing ${listingId}`);
    if (units <= 0 || units > 100) throw runtimeError(RUNTIME, "INVALID_QUANTITY", "Buy quantity must be 1-100");
    if (listing.stock < units) throw runtimeError(RUNTIME, "INSUFFICIENT_STOCK", `${listingId} has insufficient stock`);
    const target = inventory(buyerId);
    if (inventoryQuantity(target) + units > WAREHOUSE_CAPACITY) throw runtimeError(RUNTIME, "STORAGE_FULL", `${buyerId} storage capacity exceeded`);
    transferCredits(buyerId, MARKET_ID, listing.price * units, `BUY:${listingId}`);
    listing.stock -= units;
    target[listing.resource_id] = clamp((target[listing.resource_id] ?? 0) + units, 0, MAX_RESOURCE_QUANTITY);
    record("RESOURCE_TRANSFER", { direction: "MARKET_TO_BUYER", owner_id: buyerId, resource_id: listing.resource_id, quantity: units, listing_id: listingId });
    persist();
    notifier.emit("PURCHASE", { listing_id: listingId, buyer_id: buyerId, quantity: units });
    return getSnapshot();
  }

  function deposit({ ownerId = playerId, resourceId, quantity, source = "PRODUCTION" } = {}) {
    usable();
    const units = integer(quantity);
    if (!resourceId || units <= 0 || units > 1_000) throw runtimeError(RUNTIME, "INVALID_DEPOSIT", "Deposit requires a resource and 1-1000 units");
    const target = inventory(ownerId);
    if (inventoryQuantity(target) + units > WAREHOUSE_CAPACITY) throw runtimeError(RUNTIME, "STORAGE_FULL", `${ownerId} storage capacity exceeded`);
    target[resourceId] = clamp((target[resourceId] ?? 0) + units, 0, MAX_RESOURCE_QUANTITY);
    record("RESOURCE_SOURCE", { owner_id: ownerId, resource_id: resourceId, quantity: units, source });
    persist();
    notifier.emit("RESOURCE_DEPOSITED", { owner_id: ownerId, resource_id: resourceId, quantity: units });
    return getSnapshot();
  }

  function consume({ ownerId = playerId, resourceId, quantity = 1, reason = "CONSUMPTION" } = {}) {
    usable();
    const units = integer(quantity);
    const source = inventory(ownerId);
    if (units <= 0 || (source[resourceId] ?? 0) < units) throw runtimeError(RUNTIME, "INSUFFICIENT_RESOURCE", `${ownerId} lacks ${resourceId}`);
    source[resourceId] -= units;
    record("RESOURCE_SINK", { owner_id: ownerId, resource_id: resourceId, quantity: units, reason });
    persist();
    notifier.emit("RESOURCE_CONSUMED", { owner_id: ownerId, resource_id: resourceId, quantity: units });
    return getSnapshot();
  }

  function sell({ sellerId = playerId, resourceId, quantity = 1, unitPrice = 4 } = {}) {
    usable();
    const units = integer(quantity);
    const source = inventory(sellerId);
    if (units <= 0 || (source[resourceId] ?? 0) < units) throw runtimeError(RUNTIME, "INSUFFICIENT_RESOURCE", `${sellerId} lacks ${resourceId}`);
    source[resourceId] -= units;
    transferCredits(MARKET_ID, sellerId, Number(unitPrice) * units, `SELL:${resourceId}`);
    const listing = state.listings.find((item) => item.resource_id === resourceId);
    if (listing) listing.stock = clamp(listing.stock + units, 0, MAX_RESOURCE_QUANTITY);
    record("RESOURCE_TRANSFER", { direction: "SELLER_TO_MARKET", owner_id: sellerId, resource_id: resourceId, quantity: units });
    persist();
    notifier.emit("SALE", { seller_id: sellerId, resource_id: resourceId, quantity: units });
    return getSnapshot();
  }

  function payReward({ ownerId = playerId, amount = 12, reason = "WORK" } = {}) {
    usable();
    transferCredits(MARKET_ID, ownerId, amount, `REWARD:${reason}`);
    persist();
    notifier.emit("REWARD", { owner_id: ownerId, amount, reason });
    return getSnapshot();
  }

  function grantGenesisBundle({ claimId, ownerId = playerId, amount, resources = [] } = {}) {
    usable();
    const id = String(claimId ?? "");
    const value = Number(amount);
    if (!/^[A-Z0-9_-]{8,128}$/i.test(id)) {
      throw runtimeError(RUNTIME, "INVALID_GENESIS_CLAIM", "Genesis claim ID is invalid");
    }
    if (![1, 8, 88, 188, 388, 888].includes(value)) {
      throw runtimeError(RUNTIME, "INVALID_GENESIS_AMOUNT", "Genesis Fortune amount is not approved");
    }
    const existing = state.genesis_grants[id];
    if (existing) {
      if (existing.owner_id !== ownerId || existing.amount !== value) {
        throw runtimeError(RUNTIME, "GENESIS_CLAIM_CONFLICT", "Genesis claim identity conflicts with the recorded grant");
      }
      return getSnapshot();
    }
    if (!Array.isArray(resources) || resources.length < 1 || resources.length > 16) {
      throw runtimeError(RUNTIME, "INVALID_GENESIS_BUNDLE", "Genesis survival bundle is invalid");
    }
    const normalized = resources.map((item) => {
      const resourceId = String(item?.resource_id ?? "").toUpperCase();
      const units = integer(item?.quantity);
      if (!/^[A-Z0-9_-]{1,64}$/.test(resourceId) || units <= 0 || units > 100) {
        throw runtimeError(RUNTIME, "INVALID_GENESIS_BUNDLE", "Genesis bundle contains an invalid resource");
      }
      return { resource_id: resourceId, quantity: units };
    });
    if (account(GENESIS_TREASURY_ID) < value) {
      throw runtimeError(RUNTIME, "GENESIS_TREASURY_EMPTY", "Prototype Genesis treasury has insufficient balance");
    }
    const target = inventory(ownerId);
    const bundleQuantity = normalized.reduce((sum, item) => sum + item.quantity, 0);
    if (inventoryQuantity(target) + bundleQuantity > WAREHOUSE_CAPACITY) {
      throw runtimeError(RUNTIME, "STORAGE_FULL", `${ownerId} storage cannot receive the Genesis bundle`);
    }

    transferCredits(GENESIS_TREASURY_ID, ownerId, value, `GENESIS_FORTUNE:${id}`);
    for (const item of normalized) {
      target[item.resource_id] = clamp((target[item.resource_id] ?? 0) + item.quantity, 0, MAX_RESOURCE_QUANTITY);
      record("GENESIS_RESOURCE_SOURCE", { claim_id: id, owner_id: ownerId, ...item });
    }
    state.genesis_grants[id] = {
      claim_id: id,
      owner_id: ownerId,
      amount: value,
      currency: "PROTOTYPE_KGEN",
      resources: normalized,
      one_time: true,
      synthetic: true
    };
    record("GENESIS_BUNDLE_GRANTED", { claim_id: id, owner_id: ownerId, amount: value });
    persist();
    notifier.emit("GENESIS_BUNDLE_GRANTED", { claim_id: id, owner_id: ownerId, amount: value });
    return getSnapshot();
  }

  function createTransportJob({ resourceId, quantity, from, to } = {}) {
    usable();
    const units = integer(quantity);
    if (!resourceId || !from || !to || units <= 0) throw runtimeError(RUNTIME, "INVALID_TRANSPORT", "Transport job is incomplete");
    const job = {
      job_id: stableId("transport", state.revision + 1),
      resource_id: resourceId,
      quantity: units,
      from,
      to,
      status: "DELIVERED",
      synthetic: true
    };
    boundedPush(state.transport_jobs, job, 80);
    record("TRANSPORT", job);
    persist();
    notifier.emit("TRANSPORT", { job_id: job.job_id });
    return snapshot(job);
  }

  function integrityReport() {
    const issues = [];
    const creditSupply = Object.values(state.accounts).reduce((sum, value) => sum + Number(value), 0);
    if (Math.abs(creditSupply - initialCreditSupply) > 0.0001) issues.push("prototype credit ledger is unbalanced");
    for (const [owner, balance] of Object.entries(state.accounts)) if (!Number.isFinite(balance) || balance < 0) issues.push(`${owner}: invalid balance`);
    for (const [owner, values] of Object.entries(state.inventories)) {
      if (inventoryQuantity(values) > WAREHOUSE_CAPACITY) issues.push(`${owner}: warehouse capacity exceeded`);
      for (const [resource, quantity] of Object.entries(values)) if (!Number.isFinite(quantity) || quantity < 0 || quantity > MAX_RESOURCE_QUANTITY) issues.push(`${owner}/${resource}: invalid stock`);
    }
    if (state.ledger.length > MAX_LEDGER) issues.push("ledger history exceeded limit");
    if (!state.listings.every((listing) => MARKETPLACE_CATEGORIES.includes(listing.category))) issues.push("unknown marketplace category");
    for (const [claimId, grant] of Object.entries(state.genesis_grants)) {
      if (grant.claim_id !== claimId || grant.one_time !== true) issues.push(`${claimId}: invalid Genesis grant`);
      if (![1, 8, 88, 188, 388, 888].includes(grant.amount)) issues.push(`${claimId}: invalid Genesis amount`);
    }
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_ECONOMY_ALPHA", credit_supply: creditSupply, ledger_entries: state.ledger.length, issues });
  }

  return Object.freeze({
    getSnapshot,
    buy,
    deposit,
    consume,
    sell,
    payReward,
    grantGenesisBundle,
    createTransportJob,
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
