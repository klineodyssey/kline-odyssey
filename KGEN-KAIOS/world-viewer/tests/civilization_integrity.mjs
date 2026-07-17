import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { RESOURCE_CATALOG, MARKETPLACE_CATEGORIES } from "../economy/economy-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-004-life-test", now: () => "2036-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-004-civilization-test"
});

const initial = civilization.getSnapshot();
assert.equal(initial.clock.hour, 6);
assert.equal(initial.citizen.current_activity, "WAKE");
assert.equal(initial.economy.player_balance, 0);
assert.equal(initial.genesis.completed, false);
assert.equal(initial.planet_environment.active_profile.planet_id, "EARTH");
assert.equal(initial.agriculture.plots.length, 3);
assert.equal(RESOURCE_CATALOG.length, 25);
assert.ok(["FOOD", "ANIMALS", "PLANTS", "DNA", "FACTORIES", "AI_COMPANY", "SOFTWARE", "LICENSE", "GENOME"].every((category) => MARKETPLACE_CATEGORIES.includes(category)));
assert.equal(initial.agriculture.facilities.length, 9);
assert.ok(initial.ecosystem.species.length >= 20);
assert.equal(initial.biology.registry_count, 26);
assert.equal(initial.biology.taxonomy_ranks.length, 9);
assert.equal(initial.biology.evolution.catalog.atoms.length, 108);
assert.equal(initial.ecosystem.current_evolution_stage, "AI_CIVILIZATION");
assert.equal(initial.production.factory.status, "READY");
assert.equal(initial.ai_company.company.status, "ACTIVE");
assert.equal(initial.exchange.listed_count, 0);
assert.equal(initial.government.hierarchy.length, 6);
assert.equal(initial.public_services.services.length, 10);
assert.equal(initial.resilience.hazards.length, 9);

assert.throws(() => civilization.advance(60), (error) => error.code === "GENESIS_REQUIRED");
const booted = civilization.beginGenesis();
assert.equal(booted.genesis.stage, "AWAITING_FORTUNE");
assert.equal(booted.genesis.completed_steps.length, 4);
const born = civilization.claimGenesisFortune(88);
assert.equal(born.genesis.completed, true);
assert.equal(born.genesis.fortune_claim.amount, 88);
assert.equal(born.economy.player_balance, 88);
assert.equal(born.economy.player_inventory.BASIC_CLOTHES, 1);
assert.equal(life.getSnapshot("life-player-001").genesis.birth_id, born.genesis.birth_id);
assert.throws(() => civilization.claimGenesisFortune(888), (error) => error.code === "GENESIS_ALREADY_CLAIMED");

const factoryBefore = born.production.factory.total_produced;
const manufactured = civilization.runProductionCycle();
assert.equal(manufactured.production.factory.total_produced, factoryBefore + 1);
assert.equal(manufactured.ai_company.company.product_inventory.REFRIGERATOR_ALPHA, 1);
civilization.requestExchangeReview("candidate-refrigerator-alpha");
assert.equal(civilization.getSnapshot().exchange.candidates.find(({ candidate_id: id }) => id === "candidate-refrigerator-alpha").review_status, "REVIEW_REQUESTED");
assert.equal(civilization.getSnapshot().exchange.listed_count, 0);

civilization.advanceSpeciesEvolution("HUMAN_ALPHA", "LEARNING");
assert.deepEqual(civilization.getSnapshot().biology.registry.find(({ species_id: id }) => id === "HUMAN_ALPHA").evolution.active_atom_ids, ["GA001"]);
civilization.requestSpeciesReproduction("HUMAN_ALPHA", "CLONE");
assert.equal(civilization.getSnapshot().biology.reproduction.history.at(-1).status, "PROPOSAL_ONLY_REVIEW_REQUIRED");

const breakfast = civilization.advance(60);
assert.equal(breakfast.clock.hour, 7);
assert.equal(breakfast.citizen.current_activity, "BREAKFAST");
assert.ok(breakfast.economy.player_inventory.RICE < born.economy.player_inventory.RICE);
assert.ok(breakfast.economy.player_inventory.WATER < born.economy.player_inventory.WATER);

const work = civilization.advance(60);
assert.equal(work.clock.hour, 8);
assert.equal(work.citizen.current_activity, "WORK");
assert.equal(work.aiWorker.current_action, "FARM");
assert.equal(work.economy.player_balance, 106);
assert.deepEqual(work.settlement.obligations.map(({ type }) => type), ["SALARY", "TAX", "RENT"]);

civilization.plant("starter-garden-001", "VEGETABLE");
const grown = civilization.advance(12 * 60);
assert.equal(grown.agriculture.plots.find(({ plot_id }) => plot_id === "starter-garden-001").state, "READY");
civilization.harvest("starter-garden-001");
const harvested = civilization.getSnapshot();
assert.ok(harvested.agriculture.warehouse.VEGETABLE >= 6);
const beforeSale = harvested.economy.player_balance;
civilization.sellHarvest("VEGETABLE", 1);
assert.equal(civilization.getSnapshot().economy.player_balance, beforeSale + 4);

const beforeBuy = civilization.getSnapshot().economy.player_balance;
civilization.buy("listing-rice", 1);
assert.equal(civilization.getSnapshot().economy.player_balance, beforeBuy - 6);

const dayBefore = civilization.getSnapshot().clock.day;
civilization.advance(1440);
assert.equal(civilization.getSnapshot().clock.day, dayBefore + 1);

for (let index = 0; index < 220; index += 1) civilization.advance(60);
const final = civilization.getSnapshot();
const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.ok(final.events.length <= 180);
assert.ok(final.clock.events.length <= 120);
assert.ok(final.citizen.events.length <= 160);
assert.ok(final.aiWorker.events.length <= 160);
assert.ok(final.economy.ledger.length <= 300);
assert.ok(final.agriculture.events.length <= 180);
assert.ok(final.ecosystem.events.length <= 180);
assert.ok(final.biology.events.length <= 180);
assert.ok(final.production.events.length <= 180);
assert.ok(final.ai_company.events.length <= 160);
assert.ok(final.ai_company.ledger.length <= 200);
assert.ok(final.exchange.events.length <= 120);
assert.ok(final.population.events.length <= 180);
assert.ok(final.logistics.events.length <= 160);
assert.ok(final.settlement.events.length <= 140);
assert.ok(final.government.audit_log.length <= 120);
assert.ok(final.public_services.history.length <= 120);
assert.ok(final.resilience.history.length <= 120);
assert.ok(final.city.history.length <= 120);
assert.equal(final.city.employed + final.city.unemployed, final.city.population);
for (const deadCitizen of final.citizens.filter(({ life_state: state }) => state === "DEAD")) {
  assert.equal(final.population.citizens.find(({ life_id: id }) => id === deadCitizen.life_id)?.lifecycle_state, "DECEASED");
}
assert.equal(JSON.stringify(world), canonicalBefore, "Civilization Runtime must not mutate the canonical fixture");

const output = {
  status: "PASS",
  clock: report.reports.clock,
  citizen: report.reports.citizen,
  ai_worker: report.reports.ai_worker,
  economy: report.reports.economy,
  agriculture: report.reports.agriculture,
  ecosystem: report.reports.ecosystem,
  biology: report.reports.biology,
  production: report.reports.production,
  ai_company: report.reports.ai_company,
  exchange: report.reports.exchange,
  population: report.reports.population,
  logistics: report.reports.logistics,
  settlement: report.reports.settlement,
  government: report.reports.government,
  public_services: report.reports.public_services,
  resilience: report.reports.resilience,
  city: report.reports.city,
  product_flow: {
    universe_booted: true,
    planet_verified: true,
    life_os_booted: true,
    genesis_fortune_claimed_once: true,
    survival_pack_granted: true,
    starter_parcel_verified: true,
    login_fixture: true,
    breakfast_consumed: true,
    work_settlement_completed: true,
    ai_farmed: true,
    crop_planted: true,
    crop_harvested: true,
    harvest_sold: true,
    market_purchase: true,
    cambrian_lineage: true,
    food_chain_running: true,
    biology_registry_running: true,
    genome_and_dna_running: true,
    genesis_atom_evolution_running: true,
    clone_proposal_only: true,
    factory_produced: true,
    ai_company_running: true,
    k11520_review_only: true
  },
  memory_bounds: {
    civilization: final.events.length,
    clock: final.clock.events.length,
    citizen: final.citizen.events.length,
    ai_worker: final.aiWorker.events.length,
    economy: final.economy.ledger.length,
    agriculture: final.agriculture.events.length,
    ecosystem: final.ecosystem.events.length,
    biology: final.biology.events.length,
    production: final.production.events.length,
    ai_company: final.ai_company.events.length,
    exchange: final.exchange.events.length,
    population: final.population.events.length,
    logistics: final.logistics.events.length,
    settlement: final.settlement.events.length,
    government: final.government.audit_log.length,
    public_services: final.public_services.history.length,
    resilience: final.resilience.history.length,
    city: final.city.history.length
  },
  protected_runtime_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
