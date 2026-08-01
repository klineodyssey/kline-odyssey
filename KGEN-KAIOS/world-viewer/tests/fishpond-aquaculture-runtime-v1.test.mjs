import assert from "node:assert/strict";
import test from "node:test";
import { createFishpondAquacultureRuntimeV1, CONSTRUCTION_STAGES } from "../aquaculture/aquaculture-runtime.js";

function completeConstruction(runtime) {
  if (runtime.getState().status !== "RUNNING") runtime.start();
  while (runtime.getState().construction.completed_stages.length < CONSTRUCTION_STAGES.length) {
    const result = runtime.advanceConstruction(168);
    assert.notEqual(result.status, "BLOCKED", `${result.reason} at ${runtime.getState().construction.stage}`);
  }
  assert.equal(runtime.getState().pond.status, "READY_FOR_STOCKING");
}

function operatingRuntime() {
  const runtime = createFishpondAquacultureRuntimeV1();
  completeConstruction(runtime);
  assert.equal(runtime.stockFish(180).status, "COMPLETED");
  assert.equal(runtime.stockShrimp(180).status, "COMPLETED");
  return runtime;
}

test("runtime starts with canonical bindings and disabled authority", () => {
  const runtime = createFishpondAquacultureRuntimeV1();
  const state = runtime.getState();
  assert.equal(state.ecology_binding.runtime, "KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1");
  assert.equal(state.ecology_binding.habitat_id, "HABITAT-FISHPOND-V1");
  assert.equal(state.boundaries.wallet, "NONE");
  assert.equal(state.boundaries.real_kgen, "NO_REAL_KGEN");
  assert.equal(state.boundaries.production_authority, false);
  assert.equal(runtime.integrityReport().ok, true);
});

test("land suitability gates block invalid rights area slope soil road flood and pollution", () => {
  const cases = [
    [{ usage_right: "NONE" }, "NO_LAND_RIGHT"], [{ area_m2: 100 }, "INSUFFICIENT_AREA"], [{ slope_percent: 12 }, "SLOPE_TOO_HIGH"],
    [{ soil_type: "SAND" }, "SOIL_NOT_COMPATIBLE"], [{ road_access: false }, "NO_ACCESS_ROUTE"], [{ flood_risk: 0.9 }, "FLOOD_RISK_UNMITIGATED"], [{ pollution_risk: 0.9 }, "POLLUTION_RISK_TOO_HIGH"]
  ];
  for (const [overrides, reason] of cases) assert.equal(createFishpondAquacultureRuntimeV1().selectLand(overrides).reason, reason);
});

test("pond construction is ordered, timed, resourced and not instant", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start();
  const partial = runtime.advanceConstruction(1);
  assert.equal(partial.status, "IN_PROGRESS");
  assert.equal(runtime.getState().construction.completed_stages.length, 0);
  runtime.advanceConstruction(168);
  assert.deepEqual(runtime.getState().construction.completed_stages, ["SITE_SURVEY"]);
  completeConstruction(runtime);
  assert.deepEqual(runtime.getState().construction.completed_stages, CONSTRUCTION_STAGES);
  assert.ok(runtime.getState().simulation_time > 0);
});

test("construction records single-life shifts, stamina, wages and rejects occupied roles", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start();
  const cashBefore = runtime.getState().enterprise.accounts.cash;
  runtime.advanceConstruction(8);
  const surveyor = runtime.getState().workers.find(({ role }) => role === "SURVEYOR");
  assert.equal(surveyor.current_activity, "OFF_DUTY"); assert.equal(surveyor.time_log.length, 1); assert.ok(surveyor.stamina < 100); assert.ok(runtime.getState().enterprise.accounts.cash < cashBefore);
  const occupied = createFishpondAquacultureRuntimeV1(), payload = occupied.exportState();
  const worker = payload.state.workers.find(({ role }) => role === "SURVEYOR"); worker.current_activity = "OTHER_SITE_WORK"; worker.availability = false;
  occupied.importState(payload); occupied.start();
  assert.equal(occupied.advanceConstruction(8).reason, "ROLE_TIME_CONFLICT");
});

test("construction deducts travel and caps effective work by shift capacity", () => {
  const runtime = createFishpondAquacultureRuntimeV1(), payload = runtime.exportState();
  const surveyor = payload.state.workers.find(({ role }) => role === "SURVEYOR"); surveyor.current_location = "REMOTE-YARD"; surveyor.travel_time_hours = 1;
  runtime.importState(payload); runtime.start(); runtime.advanceConstruction(8);
  const state = runtime.getState(), worker = state.workers.find(({ role }) => role === "SURVEYOR");
  assert.equal(state.construction.progress_hours, 7); assert.equal(worker.current_location, state.land.land_parcel_id);
  assert.equal(worker.time_log[0].travel_hours, 1); assert.equal(worker.time_log[0].effective_work_hours, 7); assert.equal(worker.time_log[0].rest_hours, 0);
});

test("construction blocks without excavator", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start();
  for (let index = 0; index < 4; index += 1) runtime.advanceConstruction(168);
  runtime.setResource("equipment", "EXCAVATOR", 0);
  assert.equal(runtime.advanceConstruction(168).reason, "BLOCKED_EQUIPMENT");
});

test("construction blocks without required workers", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start();
  runtime.setWorkerAvailability("SURVEYOR", false);
  assert.equal(runtime.advanceConstruction(168).reason, "BLOCKED_LABOR");
});

test("water source absence blocks construction", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start();
  runtime.setWaterSourceAvailability("WATER-SOURCE-RIVER-001", false, 0);
  assert.equal(runtime.advanceConstruction(168).reason, "NO_WATER_SOURCE");
});

test("construction requires finite energy and materials", () => {
  const energy = createFishpondAquacultureRuntimeV1(); energy.start(); energy.setResource("energy", "electricity_kwh", 0);
  assert.equal(energy.advanceConstruction(168).reason, "BLOCKED_ENERGY");
  const material = createFishpondAquacultureRuntimeV1(); material.start();
  for (let index = 0; index < 5; index += 1) material.advanceConstruction(168);
  material.setResource("materials", "SOIL", 0);
  assert.equal(material.advanceConstruction(168).reason, "BLOCKED_MATERIAL");
});

test("water filling and time advancement conserve pond water", () => {
  const runtime = operatingRuntime();
  runtime.advanceTime(24, { rainfall_l: 1000, evaporation_l: 500, seepage_l: 200, outflow_l: 100 });
  const { last_balance: balance } = runtime.getState().water_quality;
  assert.equal(balance.previous_volume_l + balance.inflow_l + balance.rainfall_l - balance.evaporation_l - balance.seepage_l - balance.outflow_l - balance.recorded_removal_l, balance.next_volume_l);
  assert.equal(runtime.integrityReport().ok, true);
});

test("water exchange records equal source withdrawal and effluent", () => {
  const runtime = operatingRuntime(), before = runtime.getState();
  const result = runtime.performWaterExchange(12000), after = runtime.getState();
  assert.equal(result.outputs.source_withdrawal_l, 12000); assert.equal(result.outputs.effluent_recorded_l, 12000);
  assert.equal(before.water_sources[0].volume_l - after.water_sources[0].volume_l, after.pond.effluent_pool_l - before.pond.effluent_pool_l);
  assert.equal(after.pond.water_volume_l, before.pond.water_volume_l);
});

test("polluted water prevents stocking", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); completeConstruction(runtime); runtime.processPollution(0.8);
  assert.equal(runtime.stockFish(10).reason, "WATER_UNSTABLE");
});

test("stocking is transported, quarantined, species-coupled and capped", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); completeConstruction(runtime);
  assert.equal(runtime.stockFish(20, { transport_available: false }).reason, "TRANSPORT_NOT_AVAILABLE");
  assert.equal(runtime.stockShrimp(20, { quarantine_complete: false }).reason, "QUARANTINE_NOT_COMPLETE");
  assert.equal(runtime.stockFish(300).status, "COMPLETED");
  assert.equal(runtime.stockShrimp(250).reason, "OVER_CARRYING_CAPACITY");
  assert.equal(runtime.getState().populations[0].stock_type, "FISH_JUVENILE_STOCK");
});

test("feed, oxygen, water and time causally govern growth", () => {
  const runtime = operatingRuntime(); const fish = runtime.getState().populations[0];
  runtime.feed(fish.population_id, 20); runtime.startAeration(4); runtime.advanceTime(72);
  const grown = runtime.getState().populations[0];
  assert.ok(grown.total_biomass_kg > fish.total_biomass_kg);
  assert.ok(grown.age_hours >= 72);
  assert.ok(runtime.getState().feed.inventory_kg < 1200);
  assert.ok(runtime.getState().energy.electricity_kwh < 1500);
});

test("feed mass becomes bounded biomass and recorded waste", () => {
  const runtime = operatingRuntime(), id = runtime.getState().populations[0].population_id;
  const before = runtime.getState();
  runtime.feed(id, 20); runtime.advanceTime(24);
  const after = runtime.getState(), beforePopulation = before.populations.find(({ population_id }) => population_id === id), afterPopulation = after.populations.find(({ population_id }) => population_id === id);
  const biomassGain = afterPopulation.total_biomass_kg - beforePopulation.total_biomass_kg;
  const wasteGain = after.pond.waste_pool_kg - before.pond.waste_pool_kg;
  assert.ok(biomassGain >= 0);
  assert.ok(Math.abs(biomassGain + wasteGain - 20) < 0.01);
});

test("underfeeding slows health while overfeeding raises waste and organic load", () => {
  const under = operatingRuntime(), fishId = under.getState().populations[0].population_id;
  under.advanceTime(48); assert.ok(under.getState().populations[0].health_index < 95);
  const over = operatingRuntime(), overId = over.getState().populations[0].population_id;
  over.feed(overId, 100); over.advanceTime(24);
  assert.ok(over.getState().feed.waste_kg > 0); assert.ok(over.getState().water_quality.organic_load > 0.05);
});

test("electric aeration stops during power outage", () => {
  const runtime = operatingRuntime(); runtime.runPowerOutageScenario();
  assert.equal(runtime.startAeration(2).reason, "POWER_OUTAGE");
  assert.equal(runtime.getState().pond.aeration_state, "POWER_OUTAGE");
});

test("low oxygen causes bounded mortality and creates dead biomass", () => {
  const runtime = operatingRuntime(); const before = runtime.getState().populations.reduce((sum, item) => sum + item.count, 0);
  runtime.runLowOxygenScenario(); runtime.advanceTime(24, { rainfall_l: 0, evaporation_l: 0, seepage_l: 0 });
  const state = runtime.getState(), after = state.populations.reduce((sum, item) => sum + item.count, 0);
  assert.ok(after < before); assert.ok(state.pond.dead_biomass_kg > 0);
});

test("dead biomass requires recorded decomposition and does not disappear", () => {
  const runtime = operatingRuntime(); runtime.runLowOxygenScenario(); runtime.advanceTime(24, { rainfall_l: 0, evaporation_l: 0, seepage_l: 0 });
  const before = runtime.getState().pond.dead_biomass_kg;
  const result = runtime.processDecomposition(before / 2), state = runtime.getState();
  assert.equal(result.status, "COMPLETED"); assert.ok(state.pond.dead_biomass_kg > 0); assert.ok(state.pond.waste_pool_kg > 0);
});

test("disease remains a non-diagnostic risk proxy", () => {
  const runtime = operatingRuntime(); runtime.processPollution(0.8);
  const result = runtime.scheduleHealthCheck();
  assert.equal(result.outputs.diagnostic_claim, false); assert.ok(result.outputs.disease_risk_proxy > 0);
});

test("reproduction is cooled down and bounded by shared population cap", () => {
  const runtime = operatingRuntime(), id = runtime.getState().populations[0].population_id;
  assert.equal(runtime.processReproduction(id).reason, "MINIMUM_REPRODUCTIVE_AGE");
  runtime.feed(id, 20); runtime.advanceTime(96);
  const massBefore = runtime.getState().populations[0].total_biomass_kg;
  assert.equal(runtime.processReproduction(id).status, "COMPLETED");
  assert.equal(runtime.getState().populations[0].total_biomass_kg, massBefore);
  assert.equal(runtime.processReproduction(id).reason, "REPRODUCTION_COOLDOWN");
});

test("harvest requires growth, labor, equipment and records mass balance", () => {
  const runtime = operatingRuntime(), id = runtime.getState().populations[0].population_id;
  assert.equal(runtime.harvest(id, 20).reason, "HARVEST_NOT_READY");
  runtime.feed(id, 30); runtime.advanceTime(168);
  const result = runtime.harvest(id, 50), record = result.outputs;
  assert.equal(result.status, "COMPLETED");
  assert.ok(Math.abs(record.gross_mass_kg - record.marketable_mass_kg - record.rejected_mass_kg - record.mortality_loss_kg) < 0.001);
  assert.ok(runtime.getState().pond.waste_pool_kg >= record.rejected_mass_kg);
  assert.equal(record.stages_completed.length, 11); assert.equal(runtime.integrityReport().ok, true);
});

function harvestedRuntime() {
  const runtime = operatingRuntime(), id = runtime.getState().populations[0].population_id;
  runtime.feed(id, 40); runtime.advanceTime(168); runtime.harvest(id, 80);
  const inventoryId = runtime.getState().inventory[0].inventory_id;
  runtime.moveToColdStorage(inventoryId);
  return { runtime, inventoryId };
}

test("cold chain uses causal route, fuel, vehicle capacity and travel time", () => {
  const { runtime, inventoryId } = harvestedRuntime(), quantity = runtime.getState().inventory[0].available_kg;
  const order = runtime.createMarketOrder({ quantity_kg: quantity / 2 }).outputs;
  const before = runtime.getState();
  const delivery = runtime.createDeliveryOrder({ inventoryId, orderId: order.order_id });
  assert.equal(delivery.status, "IN_TRANSIT"); assert.ok(delivery.outputs.route.distance_m > 0); assert.ok(delivery.outputs.route.fuel_required_l > 0);
  assert.equal(runtime.getState().energy.fuel_l, before.energy.fuel_l - delivery.outputs.route.fuel_required_l);
  assert.equal(runtime.getState().workers.find(({ role }) => role === "TRUCK_DRIVER").current_activity, "DRIVING");
  const electricity = runtime.getState().energy.electricity_kwh;
  assert.equal(runtime.advanceDelivery(delivery.outputs.delivery_id, 0.1).status, "IN_TRANSIT");
  assert.ok(runtime.getState().energy.electricity_kwh < electricity);
});

test("road river bridge and fuel constraints are reused from Causal World", () => {
  for (const [options, reason] of [[{ no_bridge: true }, "RIVER_WITHOUT_BRIDGE"], [{ bridge_load_limit_kg: 0 }, "BRIDGE_LOAD_LIMIT"], [{ fuel_level_l: 0 }, "INSUFFICIENT_FUEL"]]) {
    const { runtime, inventoryId } = harvestedRuntime(), quantity = runtime.getState().inventory[0].available_kg;
    const order = runtime.createMarketOrder({ quantity_kg: quantity / 2 }).outputs;
    assert.equal(runtime.createDeliveryOrder({ inventoryId, orderId: order.order_id, routeOptions: options }).reason, reason);
  }
});

test("cold-chain failure causes spoilage and no revenue", () => {
  const { runtime, inventoryId } = harvestedRuntime(), quantity = runtime.getState().inventory[0].available_kg;
  const order = runtime.createMarketOrder({ quantity_kg: quantity / 2 }).outputs;
  const delivery = runtime.createDeliveryOrder({ inventoryId, orderId: order.order_id }).outputs;
  const revenueBefore = runtime.getState().enterprise.accounts.revenue;
  const result = runtime.advanceDelivery(delivery.delivery_id, 200, { refrigeration: false });
  assert.equal(result.status, "REJECTED"); assert.equal(runtime.getState().enterprise.accounts.revenue, revenueBefore); assert.match(runtime.getState().inventory[0].condition, /SPOILED/);
});

test("confirmed demand is required and accepted delivery recognizes revenue", () => {
  const { runtime, inventoryId } = harvestedRuntime(), quantity = runtime.getState().inventory[0].available_kg;
  const forecast = runtime.createMarketOrder({ quantity_kg: quantity / 4, confirmed: false }).outputs;
  assert.equal(runtime.createDeliveryOrder({ inventoryId, orderId: forecast.order_id }).reason, "NO_CONFIRMED_BUYER");
  const order = runtime.createMarketOrder({ quantity_kg: quantity / 4, unit_price: 12 }).outputs;
  const delivery = runtime.createDeliveryOrder({ inventoryId, orderId: order.order_id }).outputs;
  runtime.advanceDelivery(delivery.delivery_id, 200);
  assert.ok(runtime.getState().enterprise.accounts.revenue > 0);
});

test("market orders reject invalid prices and delivery windows", () => {
  const runtime = createFishpondAquacultureRuntimeV1();
  assert.equal(runtime.createMarketOrder({ quantity_kg: Number.POSITIVE_INFINITY }).reason, "INVALID_ORDER_QUANTITY");
  assert.equal(runtime.createMarketOrder({ quantity_kg: 1, unit_price: -1 }).reason, "INVALID_UNIT_PRICE");
  assert.equal(runtime.createMarketOrder({ quantity_kg: 1, unit_price: Number.NaN }).reason, "INVALID_UNIT_PRICE");
  assert.equal(runtime.createMarketOrder({ quantity_kg: 1, delivery_window_hours: 0 }).reason, "INVALID_DELIVERY_WINDOW");
});

test("non-finite feed and cost commands fail before mutation", () => {
  const runtime = createFishpondAquacultureRuntimeV1(), before = runtime.getState();
  assert.equal(runtime.replenishFeed(Number.POSITIVE_INFINITY).reason, "INVALID_FEED_DELIVERY");
  assert.equal(runtime.applyOperatingCost("INVALID", Number.POSITIVE_INFINITY).reason, "INVALID_COST");
  const after = runtime.getState(); assert.equal(after.feed.inventory_kg, before.feed.inventory_kg); assert.equal(after.enterprise.accounts.cash, before.enterprise.accounts.cash); assert.equal(runtime.integrityReport().ok, true);
});

test("transaction boundary rolls back non-finite mutations from every command family", () => {
  for (const invoke of [
    (runtime) => runtime.selectLand({ slope_percent: Number.POSITIVE_INFINITY }),
    (runtime) => runtime.designPond({ capacity_l: Number.POSITIVE_INFINITY }),
    (runtime) => { runtime.start(); return runtime.advanceTime(1, { rainfall_l: Number.POSITIVE_INFINITY }); },
    (runtime) => runtime.processPollution(Number.NaN)
  ]) {
    const runtime = createFishpondAquacultureRuntimeV1(), before = runtime.getState(); const result = invoke(runtime), after = runtime.getState();
    assert.equal(result.reason, "NONFINITE_NUMERIC_INPUT"); assert.equal(runtime.integrityReport().ok, true);
    assert.equal(after.land.slope_percent, before.land.slope_percent); assert.equal(after.pond.capacity_l, before.pond.capacity_l); assert.equal(after.water_quality.pollution_index, before.water_quality.pollution_index);
  }
});

test("delivery advancement is capped to remaining route time", () => {
  const { runtime, inventoryId } = harvestedRuntime(), quantity = runtime.getState().inventory[0].available_kg;
  const order = runtime.createMarketOrder({ quantity_kg: quantity / 2 }).outputs;
  const delivery = runtime.createDeliveryOrder({ inventoryId, orderId: order.order_id }).outputs;
  const before = runtime.getState(); runtime.advanceDelivery(delivery.delivery_id, 200); const after = runtime.getState();
  assert.ok(after.simulation_time - before.simulation_time <= delivery.route.estimated_time_s / 3600 + 0.001);
  assert.ok(before.energy.electricity_kwh - after.energy.electricity_kwh <= delivery.route.estimated_time_s / 3600 * 0.5 + 0.001);
});

test("one vehicle and driver cannot serve overlapping fish and shrimp deliveries", () => {
  const runtime = operatingRuntime();
  for (const population of runtime.getState().populations) {
    runtime.feed(population.population_id, 100);
  }
  runtime.advanceTime(24 * 80);
  const populations = runtime.getState().populations;
  for (const population of populations) runtime.harvest(population.population_id, 20);
  const inventory = runtime.getState().inventory;
  for (const item of inventory) runtime.moveToColdStorage(item.inventory_id);
  const firstOrder = runtime.createMarketOrder({ buyer: "BUYER-FISH", quantity_kg: inventory[0].available_kg, confirmed: true }).outputs;
  const secondOrder = runtime.createMarketOrder({ buyer: "BUYER-SHRIMP", quantity_kg: inventory[1].available_kg, confirmed: true }).outputs;
  const firstDelivery = runtime.createDeliveryOrder({ inventoryId: inventory[0].inventory_id, orderId: firstOrder.order_id }).outputs.delivery_id;
  assert.equal(runtime.createDeliveryOrder({ inventoryId: inventory[1].inventory_id, orderId: secondOrder.order_id }).reason, "VEHICLE_NOT_AVAILABLE");
  runtime.advanceDelivery(firstDelivery, 200);
  const secondDelivery = runtime.createDeliveryOrder({ inventoryId: inventory[1].inventory_id, orderId: secondOrder.order_id }).outputs.delivery_id;
  runtime.advanceDelivery(secondDelivery, 200);
  const state = runtime.getState();
  assert.equal(state.orders.find(({ order_id }) => order_id === firstOrder.order_id).status, "ACCEPTED");
  assert.equal(state.orders.find(({ order_id }) => order_id === secondOrder.order_id).status, "ACCEPTED");
  assert.ok(state.inventory.every(({ book_value }) => book_value >= 0));
});

test("unsold inventory accumulates storage cost without revenue", () => {
  const { runtime } = harvestedRuntime(), before = runtime.getState().enterprise.accounts.expenses;
  runtime.advanceTime(48);
  const state = runtime.getState();
  assert.equal(state.enterprise.accounts.revenue, 0); assert.ok(state.enterprise.accounts.expenses > before); assert.ok(state.inventory[0].quantity_kg > 0);
});

test("cash distress, simulated restructuring and liquidation preserve assets", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.applyOperatingCost("SIMULATED_LOSS", 200000);
  assert.equal(runtime.getState().enterprise.status, "INSOLVENT");
  assert.equal(runtime.restructure().status, "COMPLETED");
  const count = runtime.getState().enterprise.assets.length;
  assert.equal(runtime.liquidate().status, "COMPLETED");
  assert.equal(runtime.getState().enterprise.assets.length, count);
  assert.ok(runtime.getState().enterprise.assets.every(({ disposition }) => disposition));
});

test("flood drought pollution and restoration are causal and replayable", () => {
  const drought = operatingRuntime(), before = drought.getState().pond.water_volume_l; drought.runDroughtScenario(); assert.ok(drought.getState().pond.water_volume_l < before);
  const flood = operatingRuntime(); flood.runFloodScenario(); assert.equal(flood.getState().pond.status, "DAMAGED");
  const polluted = operatingRuntime(); polluted.processPollution(0.7); const beforePollution = polluted.getState().water_quality.pollution_index; polluted.processRestoration(); assert.ok(polluted.getState().water_quality.pollution_index < beforePollution);
});

test("deterministic replay serialization pause resume export import and reset work", () => {
  const runtime = createFishpondAquacultureRuntimeV1({ seed: "REPLAY-001" }); runtime.start(); runtime.advanceConstruction(168); runtime.pause(); runtime.resume(); runtime.advanceConstruction(168);
  const replayed = runtime.replayEvents();
  assert.equal(replayed.seed, runtime.getState().seed); assert.equal(replayed.construction.stage, runtime.getState().construction.stage); assert.equal(replayed.simulation_time, runtime.getState().simulation_time);
  const exported = runtime.exportState(), imported = createFishpondAquacultureRuntimeV1(); imported.importState(exported);
  assert.equal(imported.getState().status, runtime.getState().status); assert.equal(imported.getState().construction.stage, runtime.getState().construction.stage);
  assert.equal(imported.integrityReport().ok, true);
  imported.resume();
  assert.equal(imported.integrityReport().ok, true);
  assert.equal(imported.replayEvents().status, "RUNNING");
  imported.resetState(); assert.equal(imported.getState().construction.stage, "SITE_SURVEY");
});

test("unsafe imports are rejected transactionally", () => {
  const runtime = createFishpondAquacultureRuntimeV1(), before = runtime.getState(); const payload = runtime.exportState(); payload.state.boundaries.production_authority = true;
  assert.throws(() => runtime.importState(payload), /AUTHORITY_BOUNDARY/); assert.deepEqual(runtime.getState(), before);
});

test("tampered hashes, accounts, water and inventory are rejected on import", () => {
  const runtime = harvestedRuntime().runtime;
  const cases = [
    ["STATE_HASH_MISMATCH", (state) => { state.enterprise.accounts.cash += 1; }],
    ["INVALID_ACCOUNT_STATE", (state) => { state.enterprise.accounts.cash = -1; }],
    ["INVALID_WATER_STATE", (state) => { state.pond.water_volume_l = state.pond.capacity_l + 1; }],
    ["INVENTORY_QUANTITY_BALANCE", (state) => { state.inventory[0].available_kg = state.inventory[0].quantity_kg + 1; }]
  ];
  for (const [reason, mutate] of cases) {
    const payload = runtime.exportState();
    mutate(payload.state);
    assert.throws(() => runtime.importState(payload), new RegExp(reason));
  }
});

test("imports reject missing structures, unknown actions and unbalanced ledger entries", () => {
  const runtime = harvestedRuntime().runtime;
  for (const [reason, mutate] of [
    ["STATE_STRUCTURE", (state) => { delete state.pond; }],
    ["UNKNOWN_ACTION_COMMAND", (state) => { state.action_log[0].command = "UNREGISTERED_COMMAND"; }],
    ["LEDGER_BALANCE", (state) => { state.enterprise.ledger[0].credit_amount += 1; }]
  ]) {
    const payload = runtime.exportState(); mutate(payload.state);
    assert.throws(() => runtime.importState(payload), new RegExp(reason));
  }
});

test("imports reject negative operational resources and unreconciled accounts", () => {
  const runtime = createFishpondAquacultureRuntimeV1();
  for (const [reason, mutate] of [
    ["NEGATIVE_OPERATIONAL_STATE", (state) => { state.energy.electricity_kwh = -1; }],
    ["ACCOUNT_RECONCILIATION", (state) => { state.enterprise.accounts.expenses = 5000; state.enterprise.profit_or_loss = -5000; }]
  ]) { const payload = runtime.exportState(); mutate(payload.state); assert.throws(() => runtime.importState(payload), new RegExp(reason)); }
  const withLedger = harvestedRuntime().runtime, payload = withLedger.exportState(); payload.state.enterprise.ledger[0].balanced = false;
  assert.throws(() => withLedger.importState(payload), /LEDGER_BALANCE/);
});

test("rights remain separated and simulated only", () => {
  const rights = createFishpondAquacultureRuntimeV1().getState().rights;
  assert.equal(rights.authority, "SIMULATED_RIGHTS_ONLY"); assert.notEqual(rights.LAND_OWNER, rights.POND_OPERATOR); assert.notEqual(rights.EQUIPMENT_OWNER, rights.POND_OPERATOR);
});

test("every event has deterministic causal deltas and hashes", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); runtime.start(); runtime.advanceConstruction(8); runtime.pause();
  for (const event of runtime.getState().events) for (const field of ["event_id", "enterprise_id", "pond_id", "land_id", "habitat_id", "simulation_time", "event_type", "actor", "inputs", "outputs", "water_delta", "oxygen_delta", "feed_delta", "population_delta", "biomass_delta", "energy_delta", "inventory_delta", "cash_delta", "health_delta", "pollution_delta", "previous_state_hash", "next_state_hash", "seed", "status", "reason"]) assert.ok(Object.hasOwn(event, field), field);
  assert.equal(runtime.integrityReport().ok, true);
});

test("subscribers receive the corrected previous-state hash", () => {
  const runtime = createFishpondAquacultureRuntimeV1(); let observed;
  runtime.subscribe((state) => { observed = state.events.at(-1); });
  const result = runtime.start();
  assert.equal(observed.previous_state_hash, result.event.previous_state_hash);
  assert.notEqual(observed.previous_state_hash, observed.next_state_hash);
});
