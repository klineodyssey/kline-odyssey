import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";
import { createPlanetEnvironmentRuntime } from "../planet/planet-environment-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};
const now = () => "2036-03-20T06:00:00Z";

const planet = createPlanetEnvironmentRuntime({ world });
assert.equal(planet.integrityReport().ok, true);
assert.equal(planet.getSnapshot().profile_count, 5);
assert.equal(planet.verifyForBirth({ planetId: "EARTH", speciesId: "HUMAN" }).status, "PASS");
assert.equal(planet.evaluateLifeCompatibility({ planetId: "MOON", speciesId: "HUMAN" }).compatible, false);
assert.equal(planet.evaluateLifeCompatibility({ planetId: "MOON", speciesId: "HUMAN", habitat: true }).compatible, true);
assert.equal(planet.evaluateLifeCompatibility({ planetId: "MARS", speciesId: "HUMAN" }).habitat_required, true);
assert.equal(planet.evaluateLifeCompatibility({ planetId: "JUPITER", speciesId: "HUMAN" }).compatibility, "NOT_SURVIVABLE");
assert.equal(planet.evaluateLifeCompatibility({ planetId: "FUTURE_PLANET", speciesId: "HUMAN" }).status, "UNKNOWN");
assert.deepEqual(planet.resolveSurvivalRules({ planetId: "EARTH" }).daily_needs, [
  "WATER", "CALORIES", "OXYGEN", "SLEEP", "HEALTH"
]);
assert.equal(planet.resolveSurvivalRules({
  planetId: "EARTH",
  lifeMode: "IMMORTAL",
  immortalMode: "ENERGY_CULTIVATION"
}).enabled, false);

function createProduct() {
  const life = createLifeRuntime({ world, storage, storageKey: "genesis-life-test", now });
  const building = createBuildingRuntime({ world });
  const civilization = createCivilizationRuntime({
    world,
    lifeRuntime: life,
    buildingRuntime: building,
    storage,
    storagePrefix: "genesis-civilization-test"
  });
  return { life, civilization };
}

let product = createProduct();
const preflight = product.civilization.beginGenesis().genesis;
assert.equal(preflight.stage, "AWAITING_FORTUNE");
assert.deepEqual(preflight.completed_steps.map(({ step }) => step), [
  "UNIVERSE_BOOT", "PLANET_CHECK", "SPECIES_CHECK", "LIFE_OS_BOOT"
]);

const born = product.civilization.claimGenesisFortune(888);
assert.equal(born.genesis.completed, true);
assert.equal(born.genesis.stage, "ENTER_WORLD");
assert.equal(born.genesis.completed_steps.length, 7);
assert.equal(born.genesis.fortune_claim.amount, 888);
assert.equal(born.genesis.fortune_claim.one_time, true);
assert.equal(born.genesis.airdrop, false);
assert.equal(born.genesis.real_kgen, false);
assert.equal(born.economy.player_balance, 888);
assert.equal(Object.keys(born.economy.genesis_grants).length, 1);
assert.equal(Object.values(born.economy.genesis_grants)[0].currency, "KAIOS_CREDIT");
assert.equal(Object.values(born.economy.genesis_grants)[0].reference_asset, "KGEN");
assert.equal(born.economy.player_inventory.WATER, 6);
assert.equal(born.economy.player_inventory.RICE, 3);
assert.equal(born.economy.player_inventory.STARTER_BACKPACK, 1);
assert.equal(born.economy.player_inventory.STARTER_SEED, 3);

const lifeBirth = product.life.getSnapshot("life-player-001");
assert.equal(lifeBirth.genesis.birth_id, born.genesis.birth_id);
assert.equal(lifeBirth.genesis.starter_parcel_id, "parcel-001");
assert.equal(lifeBirth.inventory.food_ration >= 3, true);
assert.equal(lifeBirth.inventory.water_ration >= 6, true);

const supplyBeforeRestart = born.economy.balances;
product.civilization.destroy();
product.life.destroy();

product = createProduct();
const restored = product.civilization.getSnapshot();
assert.equal(restored.genesis.completed, true);
assert.equal(restored.economy.player_balance, 888);
assert.equal(Object.keys(restored.economy.genesis_grants).length, 1);
assert.deepEqual(restored.economy.balances, supplyBeforeRestart);
assert.throws(
  () => product.civilization.claimGenesisFortune(1),
  (error) => error.code === "GENESIS_ALREADY_CLAIMED"
);

const oxygenBefore = product.life.getSnapshot("life-player-001").oxygen;
product.life.advance({
  lifeId: "life-player-001",
  elapsedMs: 60 * 60 * 1000,
  environment: { oxygen_available: false }
});
assert.ok(product.life.getSnapshot("life-player-001").oxygen < oxygenBefore);

const report = product.civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(JSON.stringify(world), canonicalBefore, "Genesis runtimes must not mutate the synthetic fixture");

const output = {
  status: "PASS",
  decision_id: "HUMAN-SPRINT-004-CIVILIZATION-GENESIS",
  birth_flow: born.genesis.completed_steps,
  fortune: {
    amount: born.genesis.fortune_claim.amount,
    one_time_enforced: true,
    currency: born.genesis.fortune_claim.currency,
    real_kgen: false,
    airdrop: false
  },
  survival_pack_items: born.genesis.survival_pack.items.length,
  planet_profiles: planet.getSnapshot().profile_ids,
  persistence_recovered: restored.genesis.completed,
  oxygen_environment_effect: true,
  immortal_mode_requires_planet_rule: true,
  protected_runtime_mutated: false,
  universe_physics_database_current_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) {
  await writeFile(process.argv[outputIndex + 1], serialized, "utf8");
}

product.civilization.destroy();
product.life.destroy();
planet.destroy();
