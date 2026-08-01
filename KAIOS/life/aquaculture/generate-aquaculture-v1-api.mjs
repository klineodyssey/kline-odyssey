import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONSTRUCTION_STAGES, createFishpondAquacultureRuntimeV1 } from "../../../KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const output = resolve(root, "api/kaios/aquaculture/v1");
await mkdir(output, { recursive: true });

const runtime = createFishpondAquacultureRuntimeV1({ seed: "KAIOS-AQUACULTURE-PUBLIC-001" });
runtime.start();
while (runtime.getState().construction.completed_stages.length < CONSTRUCTION_STAGES.length) runtime.advanceConstruction(168);
const fish = runtime.stockFish(180).outputs;
const shrimp = runtime.stockShrimp(180).outputs;
runtime.feed(fish.population_id, 28);
runtime.feed(shrimp.population_id, 12);
runtime.startAeration(6);
runtime.advanceTime(168);
const harvest = runtime.harvest(fish.population_id, 60).outputs;
runtime.moveToColdStorage(harvest.inventory_id);
runtime.createMarketOrder({ buyer: "SYNTHETIC-KAOHSIUNG-WHOLESALER", quantity_kg: 4, grade: "A", unit_price: 12, confirmed: true });
runtime.pause();

const state = runtime.getState();
const envelope = {
  schema_version: "1.0.0",
  runtime: state.runtime,
  mode: "STATIC_READ_ONLY_PROJECTION",
  generated_from_seed: state.seed,
  simulation_only: true,
  read_only: true,
  mutation_endpoints: false,
  authority: "NO_PRODUCTION_AUTHORITY",
  wallet: "NONE",
  real_kgen: "NO_REAL_KGEN",
  real_food_safety_certification: false
};
const files = {
  "index.json": { ...envelope, endpoints: ["ponds.json", "water-quality.json", "populations.json", "feed.json", "harvests.json", "inventory.json", "orders.json", "ledger.json", "events.json", "status.json"] },
  "ponds.json": { ...envelope, land: state.land, pond: state.pond, construction: state.construction, rights: state.rights },
  "water-quality.json": { ...envelope, water_sources: state.water_sources, water_quality: state.water_quality, water_balance: state.water_quality.last_balance },
  "populations.json": { ...envelope, populations: state.populations, maximum_total_population: state.boundaries.maximum_population, ecology_binding: state.ecology_binding },
  "feed.json": { ...envelope, feed: state.feed, biomass_accounting: "FEED_AND_TIME_REQUIRED" },
  "harvests.json": { ...envelope, harvests: state.harvests, mass_accounting: "GROSS_EQUALS_MARKETABLE_PLUS_REJECTED_PLUS_MORTALITY" },
  "inventory.json": { ...envelope, inventory: state.inventory, cold_chain: state.cold_chain },
  "orders.json": { ...envelope, orders: state.orders, revenue_rule: "ACCEPTED_DELIVERY_ONLY" },
  "ledger.json": { ...envelope, enterprise: state.enterprise },
  "events.json": { ...envelope, events: state.events },
  "status.json": { ...envelope, status: state.status, integrity: runtime.integrityReport(), deterministic: true, serializable: true, stoppable: true, resumable: true, replayable: true, auditable: true, boundaries: state.boundaries }
};
for (const [name, value] of Object.entries(files)) await writeFile(resolve(output, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
