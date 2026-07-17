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

const RUNTIME = "CivilizationGenesisRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 80;
export const GENESIS_FORTUNE_OPTIONS = Object.freeze([1, 8, 88, 188, 388, 888]);

export const STARTER_SURVIVAL_PACK = Object.freeze([
  Object.freeze({ item_id: "WATER", quantity: 6, life_inventory_key: "water_ration" }),
  Object.freeze({ item_id: "SIMPLE_FOOD", quantity: 3, economy_resource_id: "RICE", life_inventory_key: "food_ration" }),
  Object.freeze({ item_id: "BASIC_CLOTHES", quantity: 1 }),
  Object.freeze({ item_id: "SIMPLE_BED", quantity: 1 }),
  Object.freeze({ item_id: "SIMPLE_TOOLS", quantity: 1 }),
  Object.freeze({ item_id: "STARTER_SEED", quantity: 3 }),
  Object.freeze({ item_id: "STARTER_BACKPACK", quantity: 1 })
]);

const BOOT_STEPS = Object.freeze([
  "UNIVERSE_BOOT",
  "PLANET_CHECK",
  "SPECIES_CHECK",
  "LIFE_OS_BOOT",
  "STARTER_RESOURCES",
  "STARTER_PARCEL",
  "ENTER_WORLD"
]);

function nowFactory(now) {
  if (typeof now === "function") return () => new Date(now()).toISOString();
  if (now !== undefined) return () => new Date(now).toISOString();
  return () => new Date().toISOString();
}

function findLifeProfile(world, lifeId) {
  return (world?.lifeProfiles ?? []).find((profile) => String(profile.id ?? profile.life_id) === String(lifeId));
}

function cleanState(candidate, defaults) {
  if (!candidate || typeof candidate !== "object" || candidate.player_id !== defaults.player_id) return defaults;
  const stage = BOOT_STEPS.includes(candidate.stage) || candidate.stage === "AWAITING_FORTUNE"
    ? candidate.stage
    : "NOT_STARTED";
  return {
    ...defaults,
    ...candidate,
    stage,
    completed_steps: Array.isArray(candidate.completed_steps) ? candidate.completed_steps.slice(-BOOT_STEPS.length) : [],
    fortune_claim: candidate.fortune_claim && typeof candidate.fortune_claim === "object" ? { ...candidate.fortune_claim } : null,
    survival_pack: candidate.survival_pack && typeof candidate.survival_pack === "object" ? { ...candidate.survival_pack } : null,
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

export function createCivilizationGenesisRuntime({
  world,
  planetRuntime,
  lifeRuntime,
  economyRuntime,
  storage,
  storageKey = "kaios.world-viewer.civilization-genesis.v1",
  now
} = {}) {
  if (!world || !planetRuntime || !lifeRuntime || !economyRuntime) {
    throw new TypeError("Civilization Genesis requires world, Planet, Life and Economy runtimes");
  }
  const playerId = String(world.player?.player_id ?? "mock-player-001");
  const lifeId = String(world.player?.life_id ?? "life-player-001");
  const planetId = String(world.genesis?.planet_id ?? "EARTH").toUpperCase();
  const speciesId = String(world.genesis?.species_id ?? "HUMAN").toUpperCase();
  const starterParcelId = String(world.player?.starter_parcel_id ?? "");
  const starterShelterId = String(world.player?.home_building_id ?? "");
  const timestamp = nowFactory(now);
  const storageRef = resolveStorage(storage);
  const defaults = {
    runtime: "CIVILIZATION_GENESIS_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    source_of_truth: false,
    player_id: playerId,
    life_id: lifeId,
    planet_id: planetId,
    species_id: speciesId,
    birth_id: `GENESIS-BIRTH-${playerId}`,
    stage: "NOT_STARTED",
    completed: false,
    completed_steps: [],
    fortune_claim: null,
    survival_pack: null,
    starter_parcel_id: starterParcelId,
    starter_shelter_id: starterShelterId,
    entered_world_at: null,
    revision: 0,
    events: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => (
    value?.schema_version === SCHEMA_VERSION
    && value?.state?.synthetic === true
    && value?.state?.player_id === playerId
  ));
  let state = cleanState(restored?.state, defaults);
  let destroyed = false;

  const getSnapshot = () => snapshot({
    ...state,
    fortune_options: GENESIS_FORTUNE_OPTIONS,
    temple_id: "K12345_WUKONG_FORTUNE_TEMPLE",
    currency: "KAIOS_CREDIT",
    reference_asset: "KGEN",
    bootstrap_reference_rate: 1,
    real_kgen: false,
    airdrop: false,
    recurring_income: false,
    boot_steps: BOOT_STEPS,
    planet: planetRuntime.getProfile(planetId)
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Civilization Genesis Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, {
      event_id: stableId("genesis", state.revision),
      type,
      timestamp: timestamp(),
      ...details
    }, MAX_EVENTS);
  }

  function completeStep(step, evidence) {
    if (!BOOT_STEPS.includes(step)) throw runtimeError(RUNTIME, "UNKNOWN_STEP", `Unknown Genesis step ${step}`);
    if (!state.completed_steps.some((entry) => entry.step === step)) {
      state.completed_steps.push({ step, status: "PASS", evidence });
    }
    state.stage = step;
    record("BOOT_STEP_PASS", { step, evidence });
  }

  function validateBirthInputs() {
    if (!world.earth?.id || world.earth.surface_k !== 280) {
      throw runtimeError(RUNTIME, "UNIVERSE_BOOT_FAILED", "Synthetic Earth K280 fixture failed Universe Boot");
    }
    const profile = findLifeProfile(world, lifeId);
    const profileSpecies = String(profile?.species_os?.species_code ?? profile?.life_type ?? "").toUpperCase();
    if (!profile || (speciesId === "HUMAN" ? !profileSpecies.includes("HUMAN") : profileSpecies !== speciesId)) {
      throw runtimeError(RUNTIME, "SPECIES_CHECK_FAILED", `${lifeId} does not match Species ${speciesId}`);
    }
    const life = lifeRuntime.getSnapshot(lifeId);
    if (!life || life.life_state === "DEAD") {
      throw runtimeError(RUNTIME, "LIFE_OS_BOOT_FAILED", `${lifeId} cannot boot Life OS`);
    }
    const parcel = (world.parcels ?? []).find(({ id }) => String(id) === starterParcelId);
    if (!parcel || String(parcel.owner_id) !== playerId) {
      throw runtimeError(RUNTIME, "STARTER_PARCEL_FAILED", "Starter Parcel fixture is unavailable or owned by another player");
    }
    const shelter = (world.buildings ?? []).find((building) => (
      String(building.id) === starterShelterId
      && String(building.parent_id) === starterParcelId
    ));
    if (!shelter) {
      throw runtimeError(RUNTIME, "STARTER_SHELTER_FAILED", "Starter House or tent fixture is unavailable");
    }
    return { profile, life, parcel, shelter };
  }

  function beginBirth() {
    usable();
    if (state.completed) return getSnapshot();
    if (state.stage === "AWAITING_FORTUNE") return getSnapshot();
    const inputs = validateBirthInputs();
    completeStep("UNIVERSE_BOOT", world.earth.id);
    const compatibility = planetRuntime.verifyForBirth({ planetId, speciesId, habitat: false });
    completeStep("PLANET_CHECK", `${compatibility.planet_id}:${compatibility.compatibility}`);
    completeStep("SPECIES_CHECK", `${speciesId}:${inputs.profile.id}`);
    completeStep("LIFE_OS_BOOT", `${lifeId}:${inputs.life.life_state}`);
    state.stage = "AWAITING_FORTUNE";
    record("FORTUNE_SELECTION_REQUIRED", { temple_id: "K12345_WUKONG_FORTUNE_TEMPLE" });
    persist();
    notifier.emit("AWAITING_FORTUNE", { player_id: playerId });
    return getSnapshot();
  }

  function claimFortune(amount) {
    usable();
    if (state.completed || state.fortune_claim?.status === "CLAIMED") {
      throw runtimeError(RUNTIME, "GENESIS_ALREADY_CLAIMED", "Genesis Fortune can only be claimed once");
    }
    if (state.stage !== "AWAITING_FORTUNE") beginBirth();
    const selectedAmount = Number(amount);
    if (!GENESIS_FORTUNE_OPTIONS.includes(selectedAmount)) {
      throw runtimeError(RUNTIME, "INVALID_FORTUNE", "Choose an approved Genesis Fortune amount");
    }
    const inputs = validateBirthInputs();
    const claimId = `GENESIS-FORTUNE-${playerId}`;
    const packId = `GENESIS-SURVIVAL-PACK-${playerId}`;
    economyRuntime.grantGenesisBundle({
      claimId,
      ownerId: playerId,
      amount: selectedAmount,
      resources: STARTER_SURVIVAL_PACK.map((item) => ({
        resource_id: item.economy_resource_id ?? item.item_id,
        quantity: item.quantity
      }))
    });
    lifeRuntime.registerGenesis(lifeId, {
      birth_id: state.birth_id,
      planet_id: planetId,
      species_id: speciesId,
      fortune_claim_id: claimId,
      starter_pack_id: packId,
      starter_parcel_id: starterParcelId,
      starter_shelter_id: starterShelterId,
      inventory: STARTER_SURVIVAL_PACK.map((item) => ({
        item_id: item.life_inventory_key ?? item.item_id,
        quantity: item.quantity
      }))
    });
    const claimedAt = timestamp();
    state.fortune_claim = {
      claim_id: claimId,
      temple_id: "K12345_WUKONG_FORTUNE_TEMPLE",
      amount: selectedAmount,
      currency: "KAIOS_CREDIT",
      reference_asset: "KGEN",
      bootstrap_reference_rate: 1,
      status: "CLAIMED",
      claimed_at: claimedAt,
      one_time: true
    };
    state.survival_pack = {
      pack_id: packId,
      status: "GRANTED",
      items: STARTER_SURVIVAL_PACK,
      shelter_asset_id: starterShelterId,
      granted_at: claimedAt
    };
    completeStep("STARTER_RESOURCES", `${claimId}:${packId}`);
    completeStep("STARTER_PARCEL", `${inputs.parcel.id}:${inputs.shelter?.id ?? "SHELTER_UNKNOWN"}`);
    completeStep("ENTER_WORLD", world.earth.id);
    state.completed = true;
    state.entered_world_at = claimedAt;
    record("CIVILIZATION_BORN", { birth_id: state.birth_id, amount: selectedAmount });
    persist();
    notifier.emit("CIVILIZATION_BORN", { birth_id: state.birth_id, player_id: playerId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const uniqueSteps = new Set(state.completed_steps.map(({ step }) => step));
    if (uniqueSteps.size !== state.completed_steps.length) issues.push("duplicate boot step");
    if (state.completed && BOOT_STEPS.some((step) => !uniqueSteps.has(step))) issues.push("completed Genesis is missing boot steps");
    if (state.completed && state.fortune_claim?.status !== "CLAIMED") issues.push("completed Genesis has no fortune claim");
    if (state.fortune_claim && !GENESIS_FORTUNE_OPTIONS.includes(state.fortune_claim.amount)) issues.push("invalid fortune amount");
    if (state.events.length > MAX_EVENTS) issues.push("Genesis event history exceeded limit");
    return snapshot({
      ok: issues.length === 0,
      runtime: "CIVILIZATION_GENESIS_ALPHA",
      completed: state.completed,
      stage: state.stage,
      one_time_claim_enforced: true,
      event_count: state.events.length,
      issues
    });
  }

  return Object.freeze({
    getSnapshot,
    beginBirth,
    claimFortune,
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
