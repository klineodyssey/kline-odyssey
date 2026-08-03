import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createLifeEnergyPayrollRuntime,
  LIFE_ENERGY_PAYROLL_BOUNDARIES
} from "../../../KGEN-KAIOS/world-viewer/economy/life-energy-payroll-runtime.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const canonicalDirectory = path.join(repo, "api/kaios/economy");
const compatibilityDirectory = path.join(canonicalDirectory, "v0");

function scenario(run) {
  const runtime = createLifeEnergyPayrollRuntime();
  runtime.start();
  run(runtime);
  return { state: runtime.getState(), integrity: runtime.integrityReport() };
}

const payroll = scenario((runtime) => runtime.runPayrollDemo());
const ant = scenario((runtime) => {
  runtime.runAntColonyScenario({ foodAvailable: true });
  runtime.runAntColonyScenario({ foodAvailable: false });
});
const bee = scenario((runtime) => {
  runtime.runBeeHiveScenario({ nectarAvailable: true });
  runtime.runBeeHiveScenario({ nectarAvailable: false });
  runtime.runBeeHiveScenario({ nectarAvailable: false });
});

const projections = {
  "status.json": {
    runtime: "KAIOS_LIFE_ENERGY_ECONOMY_PAYROLL",
    runtime_revision: "0.1.0",
    status: "RUNTIME_VALIDATED_SIMULATION",
    boundaries: LIFE_ENERGY_PAYROLL_BOUNDARIES,
    deterministic: true,
    serializable: true,
    stoppable: true,
    resumable: true,
    replayable: true,
    auditable: true,
    mutation_endpoints: false
  },
  "life-model.json": {
    model: "LIFE_EXISTENCE_AGENCY_ECONOMY_THREE_AXIS",
    life_model: payroll.state.life_model,
    rule: "NO_ACCOUNT_DOES_NOT_INVALIDATE_LIFE"
  },
  "payroll-demo.json": {
    project: payroll.state.project,
    worker: payroll.state.worker,
    accounts: payroll.state.accounts,
    payroll_events: payroll.state.payroll_events,
    ledger: payroll.state.ledger,
    physical_resources: payroll.state.physical_resources,
    integrity: payroll.integrity
  },
  "colony-ant.json": {
    colony: ant.state.colony_ledgers.ant,
    physical_resources: {
      external_food_mass: ant.state.physical_resources.external_ant_food_mass,
      colony_food_mass: ant.state.physical_resources.ant_food_mass,
      consumed_mass: ant.state.physical_resources.ant_consumed_mass
    },
    integrity: ant.integrity
  },
  "colony-bee.json": {
    colony: bee.state.colony_ledgers.bee,
    physical_resources: {
      meadow_nectar_mass: bee.state.physical_resources.meadow_nectar_mass,
      hive_nectar_mass: bee.state.physical_resources.hive_nectar_mass,
      honey_mass: bee.state.physical_resources.hive_honey_mass,
      byproduct_mass: bee.state.physical_resources.hive_processing_byproduct_mass,
      consumed_mass: bee.state.physical_resources.hive_consumed_mass
    },
    integrity: bee.integrity
  },
  "events.json": {
    events: payroll.state.events,
    previous_next_hash_chain: true,
    event_count: payroll.state.events.length
  }
};

const index = {
  runtime: "KAIOS_LIFE_ENERGY_ECONOMY_PAYROLL",
  canonical_route: "/api/kaios/economy/",
  compatibility_route: "/api/kaios/economy/v0/",
  read_only: true,
  mutation_endpoints: false,
  files: ["status.json", "life-model.json", "payroll-demo.json", "colony-ant.json", "colony-bee.json", "events.json"]
};

function html(routeStatus) {
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAIOS 生命能源與薪資 API</title><style>body{max-width:760px;margin:40px auto;padding:0 20px;background:#101412;color:#f4f1e8;font:16px/1.6 system-ui}a{color:#e6b84f}code{color:#75aee8}</style></head><body><h1>KAIOS 生命能源與薪資 API</h1><p><code>${routeStatus}</code> · READ_ONLY · SIMULATION_ONLY · NO REAL KGEN · NO REAL WALLET</p><ul>${index.files.map((name) => `<li><a href="${name}">${name}</a></li>`).join("")}</ul><p><a href="${routeStatus === "CANONICAL_UNVERSIONED_ROUTE" ? "../../../world-viewer/life-energy-payroll/" : "../../../../world-viewer/life-energy-payroll/"}">開啟互動模擬</a></p></body></html>`;
}

await fs.mkdir(canonicalDirectory, { recursive: true });
await fs.mkdir(compatibilityDirectory, { recursive: true });
await fs.writeFile(path.join(canonicalDirectory, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
await fs.writeFile(path.join(canonicalDirectory, "index.html"), html("CANONICAL_UNVERSIONED_ROUTE"));

for (const [name, value] of Object.entries(projections)) {
  await fs.writeFile(path.join(canonicalDirectory, name), `${JSON.stringify({ ...value, route_status: "CANONICAL_UNVERSIONED_ROUTE" }, null, 2)}\n`);
  await fs.writeFile(path.join(compatibilityDirectory, name), `${JSON.stringify({ ...value, route_status: "LEGACY_ALIAS", canonical_route: `/api/kaios/economy/${name}`, deprecation_status: "DEPRECATION_PENDING" }, null, 2)}\n`);
}
await fs.writeFile(path.join(compatibilityDirectory, "index.json"), `${JSON.stringify({ ...index, route_status: "LEGACY_ALIAS", deprecation_status: "DEPRECATION_PENDING" }, null, 2)}\n`);
await fs.writeFile(path.join(compatibilityDirectory, "index.html"), html("LEGACY_ALIAS"));

console.log(JSON.stringify({ status: "PASS", canonical_files: 8, compatibility_files: 8, mutation_endpoints: false }, null, 2));
