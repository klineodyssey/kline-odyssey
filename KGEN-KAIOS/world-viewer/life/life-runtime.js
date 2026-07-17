const SCHEMA_VERSION = "1.0.0";
const DEFAULT_STORAGE_KEY = "kaios.world-viewer.life-runtime.synthetic.v1";
const DEFAULT_TICK_INTERVAL_MS = 5_000;
const MAX_EVENTS_PER_LIFE = 100;
const MAX_INVENTORY_QUANTITY = 10_000;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MAX_ADVANCE_MS = 7 * DAY_MS;

export const LIFE_ACTIONS = Object.freeze({
  EAT: "EAT",
  DRINK: "DRINK",
  SLEEP: "SLEEP",
  WAKE: "WAKE",
  WORK: "WORK"
});

const ACTION_SET = new Set(Object.values(LIFE_ACTIONS));
const FOOD_ITEMS = Object.freeze([
  "food",
  "food_portions",
  "food_ration",
  "food_rations",
  "meal",
  "meals"
]);
const WATER_ITEMS = Object.freeze([
  "water",
  "water_units",
  "water_ration",
  "water_rations",
  "drink",
  "drinks"
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedMetric(value, fallback = 0) {
  return clamp(finiteNumber(value, fallback), 0, 100);
}

function nonNegativeNumber(value, fallback = 0) {
  return Math.max(0, finiteNumber(value, fallback));
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, deepClone(child)])
  );
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function publicClone(value) {
  return deepFreeze(deepClone(value));
}

function runtimeError(code, message) {
  const error = new Error(message);
  error.name = "LifeRuntimeError";
  error.code = code;
  return error;
}

function resolveClock(now) {
  const source = typeof now === "function"
    ? now
    : now === undefined
      ? Date.now
      : () => now;
  return () => {
    const value = source();
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (!Number.isFinite(timestamp)) {
      throw runtimeError("INVALID_CLOCK", "Life Runtime clock returned an invalid time");
    }
    return timestamp;
  };
}

function toIso(timestamp) {
  return new Date(timestamp).toISOString();
}

function lifeProfilesFrom(world) {
  const source = world?.world ?? world ?? {};
  const profiles = source.lifeProfiles ?? source.life_profiles ?? [];
  if (Array.isArray(profiles)) return profiles;
  return isRecord(profiles) ? Object.values(profiles) : [];
}

function profileId(profile) {
  return stringOrNull(
    profile?.id
      ?? profile?.profile_id
      ?? profile?.life_id
      ?? profile?.individual_id
  );
}

function isPublicSyntheticProfile(profile) {
  return isRecord(profile)
    && profile.synthetic === true
    && profile.privacy_class === "PUBLIC_SYNTHETIC"
    && profile.identity_class === "SYNTHETIC_ALIAS_ONLY"
    && Boolean(profileId(profile));
}

function normalizeInventory(source, useStarterResources = false) {
  const inventory = {};
  const add = (rawKey, rawQuantity) => {
    if (typeof rawKey !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawKey)) return;
    const quantity = clamp(Math.floor(finiteNumber(rawQuantity, 0)), 0, MAX_INVENTORY_QUANTITY);
    inventory[rawKey] = quantity;
  };

  if (Array.isArray(source)) {
    source.forEach((item) => {
      if (!isRecord(item)) return;
      add(item.item_id ?? item.resource_id ?? item.id ?? item.name, item.quantity ?? item.count);
    });
  } else if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) return;
      add(key, isRecord(value) ? value.quantity ?? value.count : value);
    });
  }

  if (useStarterResources && Object.keys(inventory).length === 0) {
    inventory.food_ration = 3;
    inventory.water_ration = 3;
  }
  return inventory;
}

function deriveHealthState(health) {
  if (health <= 0) return "DEAD";
  if (health < 20) return "CRITICAL";
  if (health < 50) return "WEAK";
  return "HEALTHY";
}

function deriveLifeState(health) {
  if (health <= 0) return "DEAD";
  if (health < 20) return "CRITICAL";
  return "ALIVE";
}

function normalizeActivity(value, lifeState) {
  if (lifeState === "DEAD") return "OFFLINE";
  const activity = String(value ?? "AWAKE").toUpperCase();
  return ["AWAKE", "SLEEPING", "WORKING", "RESTING", "IDLE"].includes(activity)
    ? activity
    : "AWAKE";
}

function initialState(profile, timestamp) {
  const id = profileId(profile);
  const individual = isRecord(profile.individual_life_os) ? profile.individual_life_os : {};
  const citizen = isRecord(profile.citizen_runtime) ? profile.citizen_runtime : {};
  const vitals = isRecord(profile.vitals) ? profile.vitals : {};
  const health = boundedMetric(vitals.health ?? profile.health, 100);
  const lifeState = deriveLifeState(health);

  return {
    life_id: id,
    profile_id: id,
    synthetic: true,
    privacy_class: "PUBLIC_SYNTHETIC",
    display_name: String(profile.display_name ?? profile.label ?? profile.name ?? id),
    life_type: String(profile.life_type ?? "SYNTHETIC_LIFE"),
    health,
    food: boundedMetric(vitals.food ?? profile.food, 75),
    water: boundedMetric(vitals.water ?? profile.water, 75),
    oxygen: boundedMetric(vitals.oxygen ?? profile.oxygen, 100),
    energy: boundedMetric(vitals.energy ?? profile.energy, 75),
    age_days: nonNegativeNumber(profile.age_days ?? individual.age_days, 0),
    occupation: String(citizen.occupation ?? profile.occupation ?? "NOT_APPLICABLE"),
    activity_state: normalizeActivity(individual.activity_state ?? profile.activity_state, lifeState),
    life_state: lifeState,
    health_state: deriveHealthState(health),
    room_id: stringOrNull(profile.room_id),
    building_id: stringOrNull(profile.building_id),
    parcel_id: stringOrNull(profile.parcel_id),
    inventory: normalizeInventory(profile.inventory, true),
    genesis: null,
    revision: Math.max(0, Math.floor(finiteNumber(individual.state_version ?? profile.revision, 0))),
    last_simulated_at: toIso(timestamp),
    events: []
  };
}

function normalizeGenesisRecord(candidate, lifeId) {
  if (!isRecord(candidate)
    || candidate.life_id !== lifeId
    || candidate.synthetic !== true
    || typeof candidate.birth_id !== "string"
    || typeof candidate.fortune_claim_id !== "string") return null;
  return {
    birth_id: candidate.birth_id,
    life_id: lifeId,
    planet_id: String(candidate.planet_id ?? "UNKNOWN"),
    species_id: String(candidate.species_id ?? "UNKNOWN"),
    fortune_claim_id: candidate.fortune_claim_id,
    starter_pack_id: String(candidate.starter_pack_id ?? "UNKNOWN"),
    starter_parcel_id: String(candidate.starter_parcel_id ?? "UNKNOWN"),
    starter_shelter_id: String(candidate.starter_shelter_id ?? "UNKNOWN"),
    recorded_at: Number.isFinite(Date.parse(candidate.recorded_at))
      ? new Date(candidate.recorded_at).toISOString()
      : null,
    synthetic: true
  };
}

function persistedState(candidate, fallback) {
  if (!isRecord(candidate) || candidate.life_id !== fallback.life_id || candidate.synthetic !== true) {
    return fallback;
  }

  const health = boundedMetric(candidate.health, fallback.health);
  const lifeState = deriveLifeState(health);
  return {
    ...fallback,
    health,
    food: boundedMetric(candidate.food, fallback.food),
    water: boundedMetric(candidate.water, fallback.water),
    oxygen: boundedMetric(candidate.oxygen, fallback.oxygen),
    energy: boundedMetric(candidate.energy, fallback.energy),
    age_days: nonNegativeNumber(candidate.age_days, fallback.age_days),
    activity_state: normalizeActivity(candidate.activity_state, lifeState),
    life_state: lifeState,
    health_state: deriveHealthState(health),
    inventory: normalizeInventory(candidate.inventory, false),
    genesis: normalizeGenesisRecord(candidate.genesis, fallback.life_id),
    revision: Math.max(fallback.revision, Math.floor(nonNegativeNumber(candidate.revision, fallback.revision))),
    last_simulated_at: Number.isFinite(Date.parse(candidate.last_simulated_at))
      ? new Date(candidate.last_simulated_at).toISOString()
      : fallback.last_simulated_at,
    events: normalizeEvents(candidate.events, fallback.life_id)
  };
}

function normalizeEvents(events, lifeId) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => (
      isRecord(event)
      && event.life_id === lifeId
      && typeof event.event_id === "string"
      && typeof event.type === "string"
      && Number.isFinite(Date.parse(event.timestamp))
    ))
    .slice(-MAX_EVENTS_PER_LIFE)
    .map((event) => ({
      event_id: event.event_id,
      life_id: lifeId,
      type: event.type,
      action: stringOrNull(event.action),
      timestamp: new Date(event.timestamp).toISOString(),
      revision: Math.max(0, Math.floor(nonNegativeNumber(event.revision, 0))),
      details: normalizeEventDetails(event.details)
    }));
}

function normalizeEventDetails(details) {
  if (!isRecord(details)) return {};
  const result = {};
  for (const [key, value] of Object.entries(details)) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value === null) {
      result[key] = value;
    }
  }
  return result;
}

function resolveStorage(storage) {
  if (storage === null) return null;
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function validateStorage(storage) {
  return storage === null || (
    typeof storage?.getItem === "function"
    && typeof storage?.setItem === "function"
  );
}

function inventoryKey(inventory, candidates) {
  const lookup = new Map(Object.keys(inventory).map((key) => [key.toLowerCase(), key]));
  for (const candidate of candidates) {
    const key = lookup.get(candidate);
    if (key && inventory[key] >= 1) return key;
  }
  return null;
}

function applyMetabolism(state, elapsedMs, environment = {}) {
  if (state.life_state === "DEAD" || elapsedMs <= 0) return;

  const hours = elapsedMs / HOUR_MS;
  const sleeping = state.activity_state === "SLEEPING";
  const working = state.activity_state === "WORKING";
  const foodRate = sleeping ? 0.3 : working ? 1.2 : 0.65;
  const waterRate = sleeping ? 0.45 : working ? 1.55 : 0.9;
  const energyRate = sleeping ? -4 : working ? 2 : 0.5;

  state.food = boundedMetric(state.food - foodRate * hours);
  state.water = boundedMetric(state.water - waterRate * hours);
  const oxygenAvailable = environment.oxygen_available !== false;
  state.oxygen = boundedMetric(state.oxygen + (oxygenAvailable ? 12 : -24) * hours);
  state.energy = boundedMetric(state.energy - energyRate * hours);
  state.age_days = nonNegativeNumber(state.age_days + elapsedMs / DAY_MS);

  let healthDelta = 0;
  if (state.water <= 0) healthDelta -= 4 * hours;
  if (state.food <= 0) healthDelta -= 2 * hours;
  if (state.oxygen <= 30) healthDelta -= (state.oxygen <= 0 ? 12 : 4) * hours;
  if (state.energy <= 0) healthDelta -= 1.5 * hours;
  if (state.food >= 60 && state.water >= 60 && state.energy >= 60) healthDelta += 0.15 * hours;
  state.health = boundedMetric(state.health + healthDelta);
  state.health_state = deriveHealthState(state.health);
  state.life_state = deriveLifeState(state.health);
  state.activity_state = normalizeActivity(state.activity_state, state.life_state);
}

function ensureCanAct(state, action) {
  if (state.life_state === "DEAD") {
    throw runtimeError("LIFE_NOT_ACTIVE", `${state.life_id} cannot perform ${action}`);
  }
  if (state.activity_state === "SLEEPING" && action !== LIFE_ACTIONS.WAKE) {
    throw runtimeError("LIFE_SLEEPING", `${state.life_id} must wake before ${action}`);
  }
}

function applyAction(state, action) {
  ensureCanAct(state, action);
  const details = {};

  if (action === LIFE_ACTIONS.EAT) {
    const item = inventoryKey(state.inventory, FOOD_ITEMS);
    if (!item) throw runtimeError("INSUFFICIENT_INVENTORY", `${state.life_id} has no food item`);
    state.inventory[item] -= 1;
    state.food = boundedMetric(state.food + 25);
    state.energy = boundedMetric(state.energy + 4);
    details.consumed_item = item;
  } else if (action === LIFE_ACTIONS.DRINK) {
    const item = inventoryKey(state.inventory, WATER_ITEMS);
    if (!item) throw runtimeError("INSUFFICIENT_INVENTORY", `${state.life_id} has no water item`);
    state.inventory[item] -= 1;
    state.water = boundedMetric(state.water + 30);
    details.consumed_item = item;
  } else if (action === LIFE_ACTIONS.SLEEP) {
    if (state.activity_state === "SLEEPING") {
      throw runtimeError("INVALID_TRANSITION", `${state.life_id} is already sleeping`);
    }
    state.activity_state = "SLEEPING";
  } else if (action === LIFE_ACTIONS.WAKE) {
    if (state.activity_state !== "SLEEPING") {
      throw runtimeError("INVALID_TRANSITION", `${state.life_id} is not sleeping`);
    }
    state.activity_state = "AWAKE";
  } else if (action === LIFE_ACTIONS.WORK) {
    if (state.occupation === "NOT_APPLICABLE") {
      throw runtimeError("OCCUPATION_REQUIRED", `${state.life_id} has no occupation`);
    }
    const costs = { energy: 12, food: 4, water: 5 };
    for (const [resource, cost] of Object.entries(costs)) {
      if (state[resource] < cost) {
        throw runtimeError("INSUFFICIENT_RESOURCE", `${state.life_id} needs ${cost} ${resource} to work`);
      }
    }
    state.energy -= costs.energy;
    state.food -= costs.food;
    state.water -= costs.water;
    state.activity_state = "WORKING";
    Object.assign(details, costs);
  }

  state.health_state = deriveHealthState(state.health);
  state.life_state = deriveLifeState(state.health);
  return details;
}

/**
 * Create a bounded local simulator for PUBLIC_SYNTHETIC life fixtures.
 * It has no network access and starts no timers until start() is called.
 */
export function createLifeRuntime({
  world = {},
  storage,
  storageKey = DEFAULT_STORAGE_KEY,
  now,
  tickIntervalMs = DEFAULT_TICK_INTERVAL_MS
} = {}) {
  if (typeof storageKey !== "string" || storageKey.trim().length === 0) {
    throw new TypeError("storageKey must be a non-empty string");
  }
  if (!Number.isFinite(tickIntervalMs) || tickIntervalMs <= 0) {
    throw new RangeError("tickIntervalMs must be greater than zero");
  }

  const clock = resolveClock(now);
  const storageRef = resolveStorage(storage);
  if (!validateStorage(storageRef)) {
    throw new TypeError("storage must implement getItem and setItem");
  }

  const sourceProfiles = lifeProfilesFrom(world).filter(isPublicSyntheticProfile);
  const sourceIds = new Set();
  for (const profile of sourceProfiles) {
    const id = profileId(profile);
    if (sourceIds.has(id)) throw runtimeError("DUPLICATE_LIFE_ID", `Duplicate life profile ${id}`);
    sourceIds.add(id);
  }

  const bootTime = clock();
  const defaults = new Map(sourceProfiles.map((profile) => {
    const state = initialState(profile, bootTime);
    return [state.life_id, state];
  }));
  let states = new Map([...defaults].map(([id, state]) => [id, deepClone(state)]));
  let listeners = new Set();
  let timerId = null;
  let destroyed = false;
  let eventSequence = 0;
  let persistenceError = null;
  let recoveryStatus = "NOT_REQUIRED";

  function assertUsable() {
    if (destroyed) throw runtimeError("RUNTIME_DESTROYED", "Life Runtime has been destroyed");
  }

  function appendEvent(state, type, timestamp, { action = null, details = {} } = {}) {
    eventSequence += 1;
    const event = {
      event_id: `${state.life_id}:event:${state.revision}:${eventSequence}`,
      life_id: state.life_id,
      type,
      action,
      timestamp: toIso(timestamp),
      revision: state.revision,
      details: normalizeEventDetails(details)
    };
    state.events = [...state.events, event].slice(-MAX_EVENTS_PER_LIFE);
    return event;
  }

  function serialize() {
    return JSON.stringify({
      schema_version: SCHEMA_VERSION,
      namespace: "KAIOS_WORLD_VIEWER_SYNTHETIC_LIFE",
      synthetic_only: true,
      states: [...states.values()]
    });
  }

  function persist() {
    if (!storageRef) return false;
    try {
      storageRef.setItem(storageKey, serialize());
      persistenceError = null;
      return true;
    } catch (error) {
      persistenceError = String(error?.message ?? error);
      return false;
    }
  }

  function recover() {
    if (!storageRef) return;
    let raw;
    try {
      raw = storageRef.getItem(storageKey);
    } catch (error) {
      persistenceError = String(error?.message ?? error);
      recoveryStatus = "STORAGE_UNAVAILABLE";
      return;
    }
    if (raw === null) return;

    try {
      const envelope = JSON.parse(raw);
      if (!isRecord(envelope)
        || envelope.schema_version !== SCHEMA_VERSION
        || envelope.namespace !== "KAIOS_WORLD_VIEWER_SYNTHETIC_LIFE"
        || envelope.synthetic_only !== true
        || !Array.isArray(envelope.states)) {
        throw new Error("invalid synthetic Life Runtime envelope");
      }

      for (const candidate of envelope.states) {
        const fallback = defaults.get(candidate?.life_id);
        if (fallback) states.set(fallback.life_id, persistedState(candidate, deepClone(fallback)));
      }
      recoveryStatus = "RECOVERED";
    } catch {
      recoveryStatus = "CORRUPT_DATA_RESET";
      const timestamp = clock();
      states = new Map([...defaults].map(([id, state]) => {
        const reset = deepClone(state);
        reset.revision += 1;
        appendEvent(reset, "RECOVERY", timestamp, { details: { reason: "CORRUPT_STORAGE" } });
        return [id, reset];
      }));
      persist();
    }
  }

  function snapshotFor(state) {
    return publicClone(state);
  }

  function requireState(lifeId) {
    const state = states.get(String(lifeId));
    if (!state) throw runtimeError("LIFE_NOT_FOUND", `Unknown synthetic life ${lifeId}`);
    return state;
  }

  function notify(type, state, event = null) {
    const message = publicClone({
      type,
      life_id: state?.life_id ?? null,
      snapshot: state ? state : null,
      event
    });
    for (const listener of [...listeners]) {
      try {
        listener(message);
      } catch {
        // A subscriber cannot interrupt simulation or persistence.
      }
    }
  }

  function getSnapshot(lifeId) {
    assertUsable();
    return snapshotFor(requireState(lifeId));
  }

  function listSnapshots() {
    assertUsable();
    return [...states.values()].map(snapshotFor);
  }

  function act(lifeId, requestedAction) {
    assertUsable();
    const action = String(requestedAction ?? "").toUpperCase();
    if (!ACTION_SET.has(action)) {
      throw runtimeError("UNKNOWN_ACTION", `Unsupported Life action ${requestedAction}`);
    }

    const state = requireState(lifeId);
    const timestamp = Math.max(clock(), Date.parse(state.last_simulated_at));
    const details = applyAction(state, action);
    state.revision += 1;
    state.last_simulated_at = toIso(timestamp);
    const event = appendEvent(state, "ACTION", timestamp, { action, details });
    persist();
    notify("ACTION", state, event);
    return snapshotFor(state);
  }

  function registerGenesis(lifeId, record = {}) {
    assertUsable();
    const state = requireState(lifeId);
    const birthId = stringOrNull(record.birth_id);
    const claimId = stringOrNull(record.fortune_claim_id);
    if (!birthId || !claimId) {
      throw runtimeError("INVALID_GENESIS_RECORD", "Life Genesis record requires birth and fortune claim IDs");
    }
    if (state.genesis) {
      if (state.genesis.birth_id === birthId && state.genesis.fortune_claim_id === claimId) {
        return snapshotFor(state);
      }
      throw runtimeError("GENESIS_ALREADY_RECORDED", `${state.life_id} already has a Genesis birth record`);
    }
    const inventory = normalizeInventory(record.inventory, false);
    for (const [itemId, quantity] of Object.entries(inventory)) {
      state.inventory[itemId] = clamp((state.inventory[itemId] ?? 0) + quantity, 0, MAX_INVENTORY_QUANTITY);
    }
    const recordedAt = toIso(Math.max(clock(), Date.parse(state.last_simulated_at)));
    state.genesis = normalizeGenesisRecord({
      ...record,
      birth_id: birthId,
      fortune_claim_id: claimId,
      life_id: state.life_id,
      recorded_at: recordedAt,
      synthetic: true
    }, state.life_id);
    state.revision += 1;
    state.last_simulated_at = recordedAt;
    const event = appendEvent(state, "GENESIS_BIRTH", Date.parse(recordedAt), {
      details: {
        birth_id: birthId,
        planet_id: state.genesis.planet_id,
        fortune_claim_id: claimId,
        starter_pack_id: state.genesis.starter_pack_id,
        starter_parcel_id: state.genesis.starter_parcel_id
      }
    });
    persist();
    notify("GENESIS_BIRTH", state, event);
    return snapshotFor(state);
  }

  function advance(request = undefined, selectedLifeId = null) {
    assertUsable();
    let elapsedMs = request;
    let lifeId = selectedLifeId;
    let environment = {};
    if (isRecord(request)) {
      elapsedMs = request.elapsedMs ?? request.elapsed_ms;
      lifeId = request.lifeId ?? request.life_id ?? selectedLifeId;
      environment = isRecord(request.environment) ? request.environment : {};
    }

    const currentTime = clock();
    const targets = lifeId == null ? [...states.values()] : [requireState(lifeId)];
    const changed = [];
    for (const state of targets) {
      const previousTime = Date.parse(state.last_simulated_at);
      const requestedElapsed = elapsedMs === undefined
        ? Math.max(0, currentTime - previousTime)
        : Math.max(0, finiteNumber(elapsedMs, 0));
      const boundedElapsed = Math.min(requestedElapsed, MAX_ADVANCE_MS);
      if (boundedElapsed <= 0) continue;

      applyMetabolism(state, boundedElapsed, environment);
      const simulationTime = elapsedMs === undefined
        ? currentTime
        : previousTime + boundedElapsed;
      state.revision += 1;
      state.last_simulated_at = toIso(simulationTime);
      const event = appendEvent(state, "ADVANCE", simulationTime, {
        details: {
          elapsed_ms: boundedElapsed,
          capped: requestedElapsed > MAX_ADVANCE_MS
        }
      });
      changed.push([state, event]);
    }

    if (changed.length > 0) {
      persist();
      changed.forEach(([state, event]) => notify("ADVANCE", state, event));
    }
    return lifeId == null ? listSnapshots() : getSnapshot(lifeId);
  }

  function subscribe(listener) {
    assertUsable();
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function start() {
    assertUsable();
    if (timerId !== null) return false;
    timerId = globalThis.setInterval(() => {
      try {
        advance();
      } catch {
        stop();
      }
    }, tickIntervalMs);
    return true;
  }

  function stop() {
    if (timerId === null) return false;
    globalThis.clearInterval(timerId);
    timerId = null;
    return true;
  }

  function reset(lifeId = null) {
    assertUsable();
    const timestamp = clock();
    const ids = lifeId == null ? [...defaults.keys()] : [String(lifeId)];
    const resetSnapshots = [];
    for (const id of ids) {
      const fallback = defaults.get(id);
      if (!fallback) throw runtimeError("LIFE_NOT_FOUND", `Unknown synthetic life ${id}`);
      const resetState = deepClone(fallback);
      resetState.revision += 1;
      resetState.last_simulated_at = toIso(timestamp);
      const event = appendEvent(resetState, "RESET", timestamp);
      states.set(id, resetState);
      resetSnapshots.push(snapshotFor(resetState));
    }
    persist();
    ids.forEach((id) => {
      const resetState = states.get(id);
      notify("RESET", resetState, resetState.events.at(-1));
    });
    return lifeId == null ? resetSnapshots : resetSnapshots[0];
  }

  function integrityReport() {
    assertUsable();
    const issues = [];
    for (const [id, state] of states) {
      if (!defaults.has(id) || state.synthetic !== true || state.privacy_class !== "PUBLIC_SYNTHETIC") {
        issues.push(`${id}: non-synthetic or unknown identity`);
      }
      for (const metric of ["health", "food", "water", "oxygen", "energy"]) {
        if (!Number.isFinite(state[metric]) || state[metric] < 0 || state[metric] > 100) {
          issues.push(`${id}: invalid ${metric}`);
        }
      }
      if (!Number.isFinite(state.age_days) || state.age_days < 0) issues.push(`${id}: invalid age_days`);
      if (state.events.length > MAX_EVENTS_PER_LIFE) issues.push(`${id}: event limit exceeded`);
      if (state.life_state !== deriveLifeState(state.health)) issues.push(`${id}: life state mismatch`);
      if (!Number.isFinite(Date.parse(state.last_simulated_at))) issues.push(`${id}: invalid simulation time`);
    }

    return publicClone({
      ok: issues.length === 0,
      schema_version: SCHEMA_VERSION,
      synthetic_only: true,
      life_count: states.size,
      event_count: [...states.values()].reduce((total, state) => total + state.events.length, 0),
      running: timerId !== null,
      persistence: {
        available: storageRef !== null,
        storage_key: storageKey,
        recovery_status: recoveryStatus,
        last_error: persistenceError
      },
      issues,
      checked_at: toIso(clock())
    });
  }

  function destroy() {
    if (destroyed) return false;
    stop();
    listeners.clear();
    destroyed = true;
    return true;
  }

  recover();

  return Object.freeze({
    getSnapshot,
    listSnapshots,
    act,
    registerGenesis,
    advance,
    subscribe,
    start,
    stop,
    reset,
    integrityReport,
    destroy
  });
}
