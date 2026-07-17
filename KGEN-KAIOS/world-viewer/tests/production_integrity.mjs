import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createAgricultureRuntime } from "../agriculture/agriculture-runtime.js";
import { createEcosystemRuntime } from "../ecosystem/ecosystem-runtime.js";
import { createAiCompanyOrganismRuntime } from "../enterprise/ai-company-organism-runtime.js";
import { createLifeExchangeRuntime } from "../exchange/life-exchange-runtime.js";
import { createProductionRuntime } from "../production/production-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const config = world.production_alpha;
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const ecosystem = createEcosystemRuntime({ config, storage, storageKey: "sprint-005-ecosystem" });
const agriculture = createAgricultureRuntime({
  parcelId: world.player.starter_parcel_id,
  facilities: config.agriculture_facilities,
  resources: config.agriculture_resources,
  storage,
  storageKey: "sprint-005-agriculture"
});
const production = createProductionRuntime({ config, storage, storageKey: "sprint-005-production" });
const company = createAiCompanyOrganismRuntime({ config: config.ai_company, storage, storageKey: "sprint-005-company" });
const exchange = createLifeExchangeRuntime({ config: config.exchange, storage, storageKey: "sprint-005-exchange" });

const initialEcosystem = ecosystem.getSnapshot();
assert.equal(initialEcosystem.lineage.length, 11);
assert.equal(initialEcosystem.lineage[0].stage_id, "UNICELLULAR");
assert.equal(initialEcosystem.lineage.at(-1).stage_id, "AI_CIVILIZATION");
assert.equal(initialEcosystem.current_evolution_stage, "AI_CIVILIZATION");
assert.ok(initialEcosystem.species.length >= 20);
assert.ok(initialEcosystem.species.every((species) => (
  species.body_profile_id && species.species_os_id && species.life_os_profile_id && species.dna_summary_id
)));
const trophicRoles = new Set(initialEcosystem.species.map(({ trophic_role: role }) => role));
assert.ok(["PRODUCER", "HERBIVORE", "CARNIVORE", "OMNIVORE", "PREDATOR", "SCAVENGER", "DECOMPOSER"].every((role) => trophicRoles.has(role)));
assert.equal(Object.keys(initialEcosystem.population_balance.role_counts).length, 7);

const healthy = ecosystem.advance({
  elapsedHours: 24,
  environment: { oxygen_available: true, water_available: true, temperature_compatible: true },
  agricultureWarehouse: { RICE: 10, VEGETABLE: 10 }
});
assert.ok(healthy.energy_flow.producer_input >= 0);
assert.ok(healthy.energy_flow.transferred <= healthy.energy_flow.producer_input + healthy.energy_flow.agriculture_input + 0.0001);
assert.ok(["BALANCED", "CONSTRAINED", "COLLAPSE_RISK"].includes(healthy.food_chain_status));

const fishBeforeStress = healthy.species.find(({ species_id: id }) => id === "FISH_ALPHA");
const stressed = ecosystem.advance({
  elapsedHours: 72,
  environment: { oxygen_available: false, water_available: false, temperature_compatible: true },
  agricultureWarehouse: {}
});
const fishAfterStress = stressed.species.find(({ species_id: id }) => id === "FISH_ALPHA");
assert.ok(fishAfterStress.health < fishBeforeStress.health);
assert.ok(fishAfterStress.population < fishBeforeStress.population);

assert.equal(agriculture.getSnapshot().facilities.length, 9);
agriculture.advance({ elapsedHours: 18, aiAssistance: 0.25 });
const vegetable = agriculture.getSnapshot().facilities.find(({ facility_id: id }) => id === "vegetable-farm-001");
assert.equal(vegetable.state, "READY");
const collected = agriculture.collectFacility("vegetable-farm-001").result;
assert.deepEqual(collected, { facility_id: "vegetable-farm-001", resource_id: "VEGETABLE", quantity: 8 });
assert.equal(agriculture.getSnapshot().warehouse.VEGETABLE, 8);

assert.equal(production.evaluate(company.getSnapshot().company.status).ready, true);
production.setNodeStatus("supply-electricity", "OFFLINE");
assert.equal(production.evaluate(company.getSnapshot().company.status).ready, false);
assert.throws(
  () => production.runCycle({ companyStatus: company.getSnapshot().company.status }),
  (error) => error.code === "FACTORY_DEPENDENCY_MISSING"
);
production.setNodeStatus("supply-electricity", "AVAILABLE");
const cycle = production.runCycle({ companyStatus: company.getSnapshot().company.status }).result;
assert.equal(cycle.product_id, "REFRIGERATOR_ALPHA");
assert.equal(production.getSnapshot().factory.product_inventory.REFRIGERATOR_ALPHA, 1);

company.recordProduction({ productId: cycle.product_id, quantity: cycle.quantity, unitValue: 84, operatingCost: 20 });
assert.equal(company.getSnapshot().finance.balance, 2480);
assert.equal(company.getSnapshot().company.product_inventory.REFRIGERATOR_ALPHA, 1);
company.sellProduct({ productId: "REFRIGERATOR_ALPHA", quantity: 1, unitValue: 84 });
assert.equal(company.getSnapshot().finance.balance, 2564);
assert.equal(company.getSnapshot().company.sales_total, 1);

const exchangeInitial = exchange.getSnapshot();
assert.equal(exchangeInitial.exchange_id, "K11520");
assert.equal(exchangeInitial.listed_count, 0);
assert.equal(exchangeInitial.automatic_listing, false);
exchange.requestReview("candidate-refrigerator-alpha");
assert.equal(exchange.getSnapshot().candidates.find(({ candidate_id: id }) => id === "candidate-refrigerator-alpha").review_status, "REVIEW_REQUESTED");
assert.equal(exchange.getSnapshot().listed_count, 0);

for (let index = 0; index < 220; index += 1) {
  production.evaluate(company.getSnapshot().company.status);
}

const reports = {
  ecosystem: ecosystem.integrityReport(),
  agriculture: agriculture.integrityReport(),
  production: production.integrityReport(),
  company: company.integrityReport(),
  exchange: exchange.integrityReport()
};
for (const [name, report] of Object.entries(reports)) assert.equal(report.ok, true, `${name}: ${JSON.stringify(report.issues)}`);
assert.equal(JSON.stringify(world), canonicalBefore, "Production runtimes must not mutate the canonical fixture");

const output = {
  status: "PASS",
  decision_id: config.decision_id,
  reports,
  product_flow: {
    cambrian_lineage: true,
    species_life_layers: true,
    planet_stress: true,
    food_chain_energy: true,
    agriculture_organisms: true,
    missing_supply_blocks_factory: true,
    refrigerator_created: true,
    company_ledger_balanced: true,
    k11520_review_only: true
  },
  protected_runtime_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

exchange.destroy();
company.destroy();
production.destroy();
agriculture.destroy();
ecosystem.destroy();
