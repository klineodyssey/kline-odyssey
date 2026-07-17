import { createAgricultureRuntime } from "../agriculture/agriculture-runtime.js";
import { createAiWorkerRuntime } from "../ai/ai-worker-runtime.js";
import { createCitizenDailyRuntime, CITIZEN_DAILY_SCHEDULE } from "../citizen/citizen-daily-runtime.js";
import { createCityRuntime } from "../city/city-runtime.js";
import { createEconomyRuntime } from "../economy/economy-runtime.js";
import { createEcosystemRuntime } from "../ecosystem/ecosystem-runtime.js";
import { createAiCompanyOrganismRuntime } from "../enterprise/ai-company-organism-runtime.js";
import { createLifeExchangeRuntime } from "../exchange/life-exchange-runtime.js";
import { createCivilizationGenesisRuntime } from "../genesis/genesis-runtime.js";
import { createPlanetEnvironmentRuntime } from "../planet/planet-environment-runtime.js";
import { createProductionRuntime } from "../production/production-runtime.js";
import { createLogisticsRuntime } from "../settlement/logistics-runtime.js";
import { createPopulationRuntime } from "../settlement/population-runtime.js";
import { createSettlementRuntime } from "../settlement/settlement-runtime.js";
import { createSimulationClock } from "../simulation/simulation-clock.js";
import { boundedPush, createNotifier, runtimeError, snapshot, stableId } from "./runtime-utils.js";

const RUNTIME = "CivilizationRuntime";
const MAX_EVENTS = 180;

function scheduleAt(hour) {
  let selected = CITIZEN_DAILY_SCHEDULE[0];
  for (const entry of CITIZEN_DAILY_SCHEDULE) if (hour >= entry.start_hour) selected = entry;
  return selected.activity;
}

export function createCivilizationRuntime({
  world,
  lifeRuntime,
  buildingRuntime,
  storage,
  storagePrefix = "kaios.world-viewer.civilization-alpha"
} = {}) {
  if (!world || !lifeRuntime) throw new TypeError("Civilization Runtime requires the synthetic world and Life Runtime");
  const config = world.civilization_alpha ?? {};
  const playerId = world.player?.player_id ?? "mock-player-001";
  const playerLifeId = world.player?.life_id ?? "life-player-001";
  const planet = createPlanetEnvironmentRuntime({ world });
  const clock = createSimulationClock({ start: config.clock_start, storage, storageKey: `${storagePrefix}.clock` });
  const citizen = createCitizenDailyRuntime({ world, storage, storageKey: `${storagePrefix}.citizen`, startingMoney: config.prototype_balance ?? 0 });
  const aiWorker = createAiWorkerRuntime({ world, storage, storageKey: `${storagePrefix}.ai-worker` });
  const economy = createEconomyRuntime({
    playerId,
    playerBalance: config.prototype_balance ?? 0,
    playerInventory: {},
    genesisTreasury: config.genesis_treasury ?? 10_000,
    storage,
    storageKey: `${storagePrefix}.economy`
  });
  const settlementConfig = world.settlement_alpha ?? {};
  const population = createPopulationRuntime({
    citizenSnapshots: citizen.listSnapshots(),
    hierarchy: settlementConfig.hierarchy,
    storage,
    storageKey: `${storagePrefix}.population`
  });
  const logistics = createLogisticsRuntime({
    routes: settlementConfig.logistics_routes,
    storage,
    storageKey: `${storagePrefix}.logistics`
  });
  const settlement = createSettlementRuntime({
    economyRuntime: economy,
    populationRuntime: population,
    playerId,
    playerLifeId,
    storage,
    storageKey: `${storagePrefix}.settlement`
  });
  const productionConfig = world.production_alpha;
  if (!productionConfig) throw new TypeError("Civilization Runtime requires the Sprint 005 production fixture");
  const configuredAgriculture = createAgricultureRuntime({
    parcelId: world.player?.starter_parcel_id,
    facilities: productionConfig.agriculture_facilities,
    resources: productionConfig.agriculture_resources,
    storage,
    storageKey: `${storagePrefix}.agriculture`
  });
  const ecosystem = createEcosystemRuntime({ config: productionConfig, storage, storageKey: `${storagePrefix}.ecosystem` });
  const production = createProductionRuntime({ config: productionConfig, storage, storageKey: `${storagePrefix}.production` });
  const aiCompany = createAiCompanyOrganismRuntime({ config: productionConfig.ai_company, storage, storageKey: `${storagePrefix}.ai-company-organism` });
  const exchange = createLifeExchangeRuntime({ config: productionConfig.exchange, storage, storageKey: `${storagePrefix}.life-exchange` });
  const city = createCityRuntime({ cityId: config.city_id, label: world.cities?.find(({ id }) => id === config.city_id)?.label, storage, storageKey: `${storagePrefix}.city` });
  const genesis = createCivilizationGenesisRuntime({
    world,
    planetRuntime: planet,
    lifeRuntime,
    economyRuntime: economy,
    storage,
    storageKey: `${storagePrefix}.genesis`
  });
  let running = false;
  let timer = null;
  let destroyed = false;
  let revision = 0;
  const events = [];

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_ALPHA",
    synthetic: true,
    source_of_truth: false,
    playerId,
    playerLifeId,
    running,
    revision,
    clock: clock.getSnapshot(),
    citizen: citizen.getSnapshot(playerLifeId),
    citizens: citizen.listSnapshots(),
    aiWorker: aiWorker.getSnapshot(config.ai_worker_id),
    aiWorkers: aiWorker.listSnapshots(),
    genesis: genesis.getSnapshot(),
    planet_environment: planet.getSnapshot(),
    economy: economy.getSnapshot(),
    population: population.getSnapshot(),
    logistics: logistics.getSnapshot(),
    settlement: settlement.getSnapshot(),
    agriculture: configuredAgriculture.getSnapshot(),
    ecosystem: ecosystem.getSnapshot(),
    production: production.getSnapshot(),
    ai_company: aiCompany.getSnapshot(),
    exchange: exchange.getSnapshot(),
    civilization_progress: civilizationProgress(),
    city: city.getSnapshot(),
    events
  });
  const notifier = createNotifier(getSnapshot);
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Civilization Runtime has been destroyed");
  };
  const born = () => {
    if (!genesis.getSnapshot().completed) {
      throw runtimeError(RUNTIME, "GENESIS_REQUIRED", "Complete Civilization Genesis before entering the living world");
    }
  };

  function record(type, details = {}) {
    revision += 1;
    boundedPush(events, { event_id: stableId("civilization", revision), type, ...details }, MAX_EVENTS);
  }

  function buildings() {
    if (!buildingRuntime) return world.buildings ?? [];
    return (world.parcels ?? []).flatMap((parcel) => buildingRuntime.listByParcel(parcel.id));
  }

  function supplyChainHealth() {
    const nodes = production.getSnapshot().supply_nodes;
    return nodes.length
      ? nodes.filter(({ status }) => status === "AVAILABLE").length / nodes.length * 100
      : 0;
  }

  function civilizationProgress() {
    const citySnapshot = city.getSnapshot();
    const ecosystemSnapshot = ecosystem.getSnapshot();
    const productionSnapshot = production.getSnapshot();
    const companySnapshot = aiCompany.getSnapshot();
    const score = Math.max(0, Math.min(100,
      citySnapshot.food * 0.14
      + citySnapshot.energy * 0.13
      + citySnapshot.housing * 0.13
      + citySnapshot.roads * 0.1
      + citySnapshot.happiness * 0.1
      + ecosystemSnapshot.average_health * 0.15
      + (productionSnapshot.factory.status === "READY" ? 100 : 35) * 0.12
      + companySnapshot.company.health * 0.13
    ));
    let stage = productionConfig.civilization_stages[0];
    for (const candidate of productionConfig.civilization_stages) {
      if (score >= candidate.minimum_score) stage = candidate;
    }
    return snapshot({
      stage_id: stage.stage_id,
      score: Number(score.toFixed(1)),
      stages: productionConfig.civilization_stages,
      constraints: {
        food: citySnapshot.food,
        energy: citySnapshot.energy,
        housing: citySnapshot.housing,
        ecosystem_health: Number(ecosystemSnapshot.average_health.toFixed(1)),
        factory_status: productionSnapshot.factory.status,
        company_status: companySnapshot.company.status
      }
    });
  }

  function refreshCity() {
    return city.refresh({
      citizens: citizen.listSnapshots(),
      aiWorkers: aiWorker.listSnapshots(),
      economy: economy.getSnapshot(),
      agriculture: configuredAgriculture.getSnapshot(),
      production: production.getSnapshot(),
      company: aiCompany.getSnapshot(),
      ecosystem: ecosystem.getSnapshot(),
      population: population.getSnapshot(),
      logistics: logistics.getSnapshot(),
      settlement: settlement.getSnapshot(),
      buildings: buildings(),
      world
    });
  }

  function tryLifeAction(action) {
    try { lifeRuntime.act(playerLifeId, action); return true; } catch { return false; }
  }

  function handleCitizenTransition(previous, next) {
    if (previous === next) return;
    if (["BREAKFAST", "LUNCH", "DINNER"].includes(next)) {
      const ate = tryLifeAction("EAT");
      const drank = tryLifeAction("DRINK");
      try { economy.consume({ ownerId: playerId, resourceId: "RICE", quantity: 1, reason: next }); } catch { /* Food shortage is reflected by needs. */ }
      try { economy.consume({ ownerId: playerId, resourceId: "WATER", quantity: 1, reason: next }); } catch { /* Water shortage is reflected by needs. */ }
      record("MEAL", { activity: next, ate, drank });
    } else if (next === "WORK") {
      tryLifeAction("WORK");
      try {
        settlement.runLivingCycle(settlementConfig.living_cycle);
        record("WORK_STARTED", { salary: settlementConfig.living_cycle?.salary ?? 24, currency: "KAIOS_CREDIT" });
      } catch {
        record("WORK_STARTED", { salary: 0, settlement_status: "CONSTRAINED" });
      }
    } else if (next === "SLEEP") {
      tryLifeAction("SLEEP");
      record("SLEEP_STARTED");
    } else if (next === "WAKE") {
      tryLifeAction("WAKE");
      record("WAKE_STARTED");
    }
  }

  function advance(minutes = 60) {
    usable();
    born();
    const total = Number(minutes);
    if (!Number.isFinite(total) || total <= 0 || total > 30 * 1440) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Civilization advance must be 1-43200 minutes");
    let remaining = Math.floor(total);
    while (remaining > 0) {
      const chunk = Math.min(60, remaining);
      const previousActivity = citizen.getSnapshot(playerLifeId).current_activity;
      const clockSnapshot = clock.advance(chunk);
      const nextActivity = scheduleAt(clockSnapshot.hour);
      handleCitizenTransition(previousActivity, nextActivity);
      const compatibility = planet.evaluateLifeCompatibility({ planetId: "EARTH", speciesId: "HUMAN" });
      lifeRuntime.advance({
        elapsedMs: chunk * 60_000,
        environment: { oxygen_available: compatibility.oxygen_available }
      });
      aiWorker.advance({ elapsedMinutes: chunk, clockSnapshot });
      const workerSnapshots = aiWorker.listSnapshots();
      const assistance = workerSnapshots.some((worker) => worker.current_action === "FARM") ? 0.25 : 0;
      configuredAgriculture.advance({ elapsedHours: chunk / 60, aiAssistance: assistance });
      const planetProfile = planet.getSnapshot().active_profile;
      ecosystem.advance({
        elapsedHours: chunk / 60,
        environment: {
          oxygen_available: compatibility.oxygen_available,
          water_available: String(planetProfile.water).includes("AVAILABLE"),
          temperature_compatible: planetProfile.life_compatibility?.HUMAN === "COMPATIBLE"
        },
        agricultureWarehouse: configuredAgriculture.getSnapshot().warehouse
      });
      const companyStatus = aiCompany.getSnapshot().company.status;
      const productionResult = production.advance({ elapsedHours: chunk / 60, companyStatus, autoProduce: true });
      for (const product of productionResult.produced) {
        aiCompany.recordProduction({
          productId: product.product_id,
          quantity: product.quantity,
          unitValue: productionConfig.factory.product_recipe.sale_value,
          operatingCost: productionConfig.factory.product_recipe.node_costs.FINANCE
        });
      }
      aiCompany.advance({
        elapsedHours: chunk / 60,
        factoryStatus: production.getSnapshot().factory.status,
        supplyChainHealth: supplyChainHealth()
      });
      logistics.advance({
        elapsedHours: chunk / 60,
        productionPollution: production.getSnapshot().factory.status === "READY" ? 22 : 8,
        ecosystemHealth: ecosystem.getSnapshot().average_health
      });
      citizen.advance({ elapsedMinutes: chunk, clockSnapshot, lifeSnapshots: lifeRuntime.listSnapshots() });
      const currentCity = city.getSnapshot();
      population.advance({
        elapsedHours: chunk / 60,
        educationCapacity: currentCity.education ?? 70,
        employmentDemand: currentCity.employment ?? 70,
        carryingCapacity: settlementConfig.carrying_capacity ?? 24,
        citizenSnapshots: citizen.listSnapshots()
      });
      citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
      remaining -= chunk;
    }
    refreshCity();
    record("TIME_ADVANCED", { minutes: Math.floor(total) });
    notifier.emit("TIME_ADVANCED", { minutes: Math.floor(total) });
    return getSnapshot();
  }

  function buy(listingId, quantity = 1) {
    usable();
    born();
    economy.buy({ listingId, buyerId: playerId, quantity });
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("MARKET_PURCHASE", { listing_id: listingId, quantity });
    notifier.emit("MARKET_PURCHASE", { listing_id: listingId, quantity });
    return getSnapshot();
  }

  function plant(plotId, cropId) {
    usable();
    born();
    configuredAgriculture.plant({ plotId, cropId });
    record("CROP_PLANTED", { plot_id: plotId, crop_id: cropId });
    notifier.emit("CROP_PLANTED", { plot_id: plotId, crop_id: cropId });
    return getSnapshot();
  }

  function harvest(plotId) {
    usable();
    born();
    const result = configuredAgriculture.harvest(plotId).result;
    refreshCity();
    record("CROP_HARVESTED", result);
    notifier.emit("CROP_HARVESTED", result);
    return getSnapshot();
  }

  function sellHarvest(resourceId, quantity = 1) {
    usable();
    born();
    configuredAgriculture.takeFromWarehouse(resourceId, quantity);
    economy.deposit({ ownerId: playerId, resourceId, quantity, source: "FARM_WAREHOUSE" });
    economy.sell({ sellerId: playerId, resourceId, quantity, unitPrice: 4 });
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("HARVEST_SOLD", { resource_id: resourceId, quantity });
    notifier.emit("HARVEST_SOLD", { resource_id: resourceId, quantity });
    return getSnapshot();
  }

  function collectFacility(facilityId) {
    usable();
    born();
    const result = configuredAgriculture.collectFacility(facilityId).result;
    refreshCity();
    record("AGRICULTURE_FACILITY_COLLECTED", result);
    notifier.emit("AGRICULTURE_FACILITY_COLLECTED", result);
    return getSnapshot();
  }

  function runProductionCycle() {
    usable();
    born();
    const companyStatus = aiCompany.getSnapshot().company.status;
    const result = production.runCycle({ companyStatus }).result;
    aiCompany.recordProduction({
      productId: result.product_id,
      quantity: result.quantity,
      unitValue: productionConfig.factory.product_recipe.sale_value,
      operatingCost: productionConfig.factory.product_recipe.node_costs.FINANCE
    });
    record("FACTORY_CYCLE_COMPLETED", result);
    notifier.emit("FACTORY_CYCLE_COMPLETED", result);
    return getSnapshot();
  }

  function sellCompanyProduct(productId, quantity = 1) {
    usable();
    born();
    aiCompany.sellProduct({ productId, quantity, unitValue: productionConfig.factory.product_recipe.sale_value });
    record("COMPANY_PRODUCT_SOLD", { product_id: productId, quantity });
    notifier.emit("COMPANY_PRODUCT_SOLD", { product_id: productId, quantity });
    return getSnapshot();
  }

  function requestExchangeReview(candidateId) {
    usable();
    born();
    exchange.requestReview(candidateId);
    record("EXCHANGE_REVIEW_REQUESTED", { candidate_id: candidateId });
    notifier.emit("EXCHANGE_REVIEW_REQUESTED", { candidate_id: candidateId });
    return getSnapshot();
  }

  function runSettlementCycle() {
    usable();
    born();
    settlement.runLivingCycle(settlementConfig.living_cycle);
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("SETTLEMENT_CYCLE_COMPLETED", { currency: "KAIOS_CREDIT" });
    notifier.emit("SETTLEMENT_CYCLE_COMPLETED");
    return getSnapshot();
  }

  function registerMarriage(partnerAId = playerLifeId, partnerBId = "life-npc-guide-001") {
    usable();
    born();
    population.registerMarriage({ partnerAId, partnerBId, consentA: true, consentB: true });
    refreshCity();
    record("MARRIAGE_REGISTERED", { partner_ids: [partnerAId, partnerBId] });
    notifier.emit("MARRIAGE_REGISTERED", { partner_ids: [partnerAId, partnerBId] });
    return getSnapshot();
  }

  function registerBirth(familyId = "family-starter-001") {
    usable();
    born();
    const inventory = economy.getSnapshot().player_inventory;
    const citySnapshot = city.getSnapshot();
    const resourceReady = (inventory.RICE ?? 0) >= 1
      && (inventory.WATER ?? 0) >= 1
      && citySnapshot.housing >= 40
      && ecosystem.getSnapshot().average_health >= 40;
    population.registerBirth({
      familyId,
      displayName: `Genesis Child ${population.getSnapshot().metrics.births + 1}`,
      carryingCapacity: settlementConfig.carrying_capacity ?? 24,
      resourceReady
    });
    economy.consume({ ownerId: playerId, resourceId: "RICE", quantity: 1, reason: "BIRTH_SUPPORT" });
    economy.consume({ ownerId: playerId, resourceId: "WATER", quantity: 1, reason: "BIRTH_SUPPORT" });
    refreshCity();
    record("BIRTH_REGISTERED", { family_id: familyId });
    notifier.emit("BIRTH_REGISTERED", { family_id: familyId });
    return getSnapshot();
  }

  function dispatchLogistics(routeId = "route-farm-warehouse", resourceId = "RICE", quantity = 1, mode = "DOMESTIC") {
    usable();
    born();
    const job = logistics.dispatch({ routeId, resourceId, quantity, mode });
    if (job.status === "DELIVERED") economy.createTransportJob({ resourceId, quantity, from: job.from, to: job.to });
    refreshCity();
    record("LOGISTICS_DISPATCHED", { job_id: job.job_id, mode: job.mode });
    notifier.emit("LOGISTICS_DISPATCHED", { job_id: job.job_id });
    return getSnapshot();
  }

  function recoverEcology(waterUnits = 1, effort = 10) {
    usable();
    born();
    economy.consume({ ownerId: playerId, resourceId: "WATER", quantity: waterUnits, reason: "ECOLOGY_RECOVERY" });
    logistics.recoverEcology({ waterUnits, effort });
    refreshCity();
    record("ECOLOGY_RECOVERY_COMPLETED", { water_units: waterUnits, effort });
    notifier.emit("ECOLOGY_RECOVERY_COMPLETED");
    return getSnapshot();
  }

  function requestKgenSettlement(amount = 1) {
    usable();
    born();
    settlement.requestAssetSettlement({ asset: "KGEN", direction: "KGEN_TO_CREDIT", amount, requesterId: playerId });
    record("KGEN_SETTLEMENT_REQUESTED", { amount, execution: false });
    notifier.emit("KGEN_SETTLEMENT_REQUESTED", { amount });
    return getSnapshot();
  }

  function requestExternalSettlement(asset = "TWD", amount = 100) {
    usable();
    born();
    settlement.requestAssetSettlement({ asset, direction: "EXTERNAL_TO_CREDIT", amount, requesterId: playerId });
    record("EXTERNAL_SETTLEMENT_REQUESTED", { asset, amount, execution: false });
    notifier.emit("EXTERNAL_SETTLEMENT_REQUESTED", { asset, amount });
    return getSnapshot();
  }

  function requestMortgage() {
    usable();
    born();
    settlement.requestMortgage({ parcelId: world.player?.starter_parcel_id });
    record("MORTGAGE_ARCHITECTURE_PROPOSED");
    notifier.emit("MORTGAGE_ARCHITECTURE_PROPOSED");
    return getSnapshot();
  }

  function requestInsurance() {
    usable();
    born();
    settlement.requestInsurance({ subjectId: playerLifeId });
    record("INSURANCE_ARCHITECTURE_PROPOSED");
    notifier.emit("INSURANCE_ARCHITECTURE_PROPOSED");
    return getSnapshot();
  }

  function settleInheritance() {
    usable();
    born();
    settlement.settleInheritance({ beneficiaryId: playerLifeId });
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("INHERITANCE_SETTLED", { beneficiary_id: playerLifeId });
    notifier.emit("INHERITANCE_SETTLED", { beneficiary_id: playerLifeId });
    return getSnapshot();
  }

  function start({ intervalMs = 1000, minutesPerTick = 60 } = {}) {
    usable();
    born();
    if (timer !== null) return false;
    if (!Number.isFinite(intervalMs) || intervalMs < 250) throw runtimeError(RUNTIME, "INVALID_INTERVAL", "Auto interval must be at least 250ms");
    running = true;
    timer = globalThis.setInterval(() => {
      try { advance(minutesPerTick); } catch { stop(); }
    }, intervalMs);
    notifier.emit("AUTO_STARTED", { interval_ms: intervalMs, minutes_per_tick: minutesPerTick });
    return true;
  }

  function stop() {
    if (timer === null) return false;
    globalThis.clearInterval(timer);
    timer = null;
    running = false;
    notifier.emit("AUTO_STOPPED");
    return true;
  }

  function integrityReport() {
    const reports = {
      genesis: genesis.integrityReport(),
      planet: planet.integrityReport(),
      clock: clock.integrityReport(),
      citizen: citizen.integrityReport(),
      ai_worker: aiWorker.integrityReport(),
      economy: economy.integrityReport(),
      population: population.integrityReport(),
      logistics: logistics.integrityReport(),
      settlement: settlement.integrityReport(),
      agriculture: configuredAgriculture.integrityReport(),
      ecosystem: ecosystem.integrityReport(),
      production: production.integrityReport(),
      ai_company: aiCompany.integrityReport(),
      exchange: exchange.integrityReport(),
      city: city.integrityReport()
    };
    const issues = Object.entries(reports).filter(([, report]) => !report.ok).map(([name]) => `${name} integrity failed`);
    if (events.length > MAX_EVENTS) issues.push("civilization event limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_ALPHA", reports, event_count: events.length, issues });
  }

  refreshCity();

  function beginGenesis() {
    usable();
    const result = genesis.beginBirth();
    record("GENESIS_STARTED", { stage: result.stage });
    notifier.emit("GENESIS_STARTED", { stage: result.stage });
    return getSnapshot();
  }

  function claimGenesisFortune(amount) {
    usable();
    const result = genesis.claimFortune(amount);
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("GENESIS_COMPLETED", {
      birth_id: result.birth_id,
      fortune_amount: result.fortune_claim?.amount ?? 0
    });
    notifier.emit("GENESIS_COMPLETED", { birth_id: result.birth_id });
    return getSnapshot();
  }

  return Object.freeze({
    getSnapshot,
    beginGenesis,
    claimGenesisFortune,
    advance,
    buy,
    plant,
    harvest,
    sellHarvest,
    collectFacility,
    runProductionCycle,
    sellCompanyProduct,
    requestExchangeReview,
    runSettlementCycle,
    registerMarriage,
    registerBirth,
    dispatchLogistics,
    recoverEcology,
    requestKgenSettlement,
    requestExternalSettlement,
    requestMortgage,
    requestInsurance,
    settleInheritance,
    start,
    stop,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      stop();
      notifier.clear();
      clock.destroy();
      citizen.destroy();
      aiWorker.destroy();
      economy.destroy();
      population.destroy();
      logistics.destroy();
      settlement.destroy();
      configuredAgriculture.destroy();
      ecosystem.destroy();
      production.destroy();
      aiCompany.destroy();
      exchange.destroy();
      city.destroy();
      genesis.destroy();
      planet.destroy();
      destroyed = true;
      return true;
    }
  });
}
