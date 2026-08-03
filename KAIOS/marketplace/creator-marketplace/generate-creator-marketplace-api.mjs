/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-CREATOR-MARKETPLACE-API
 * species_id: SPECIES-KAIOS-SOFTWARE-SERVICE
 * genome_id: GENOME-KAIOS-CREATOR-MARKETPLACE-API
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: API_ORGAN
 * canonical_filename: generate-creator-marketplace-api.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCreatorMarketplaceRuntime, CREATOR_MARKETPLACE_BOUNDARIES } from "../../../KGEN-KAIOS/world-viewer/marketplace/creator-marketplace-runtime.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const canonicalDirectory = path.join(repo, "api/kaios/marketplace");
const compatibilityDirectory = path.join(canonicalDirectory, "v1");

function scenario(name) {
  const runtime = createCreatorMarketplaceRuntime({ seed: `KAIOS-MARKETPLACE-API-${name}` });
  const result = runtime[name]();
  return { result, state: runtime.getState(), integrity: runtime.integrityReport() };
}

const starter = scenario("runStarterHouseholdDemo");
const tree = scenario("runTreeLifeDemo");
const shelter = scenario("runBasicShelterDemo");
const failed = scenario("runFailedOrderDemo");

const projections = {
  "status.json": {
    runtime: "KAIOS_AI_COMPANY_CREATOR_MARKETPLACE",
    runtime_revision: "1.0.0",
    status: "RUNTIME_VALIDATED_SIMULATION",
    boundaries: CREATOR_MARKETPLACE_BOUNDARIES,
    deterministic: true,
    serializable: true,
    replayable: true,
    auditable: true,
    mutation_endpoints: false
  },
  "starter-package.json": {
    player_genesis: starter.state.player_genesis,
    starter_grants: starter.state.starter_grants,
    starter_land: starter.state.starter_land,
    household_inventory: starter.state.household_inventory,
    needs: starter.state.needs,
    accounts: Object.values(starter.state.accounts).filter(({ type }) => ["PLAYER_SIMULATED_WALLET", "AI_SIMULATED_WALLET", "HOUSEHOLD_SHARED_ACCOUNT"].includes(type)),
    result: starter.result,
    integrity: starter.integrity
  },
  "requests.json": { requests: [...tree.state.requests, ...shelter.state.requests, ...failed.state.requests], decisions_are_simulation_only: true },
  "projects.json": { projects: [...tree.state.projects, ...shelter.state.projects, ...failed.state.projects], no_instant_completion: true },
  "tasks.json": { tasks: [...tree.state.tasks, ...shelter.state.tasks], dependency_enforcement: true },
  "listings.json": { listings: tree.state.listings, unreviewed_is_not_canonical: true },
  "payroll.json": { payroll_events: tree.state.payroll_events, worker_wallet: Object.values(tree.state.accounts).find(({ type }) => type === "AI_SIMULATED_WALLET"), duplicate_prevention: true },
  "events.json": { events: [...starter.state.events, ...tree.state.events, ...shelter.state.events, ...failed.state.events], hash_chain: true },
  "energy-ontology.json": tree.state.energy_ontology
};

const files = Object.keys(projections);
const index = {
  runtime: "KAIOS_AI_COMPANY_CREATOR_MARKETPLACE",
  canonical_route: "/api/kaios/marketplace/",
  compatibility_route: "/api/kaios/marketplace/v1/",
  read_only: true,
  mutation_endpoints: false,
  files
};

function html(routeStatus, prefix) {
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAIOS Creator Marketplace API</title><style>body{max-width:760px;margin:40px auto;padding:0 20px;background:#101412;color:#f4f1e8;font:16px/1.6 system-ui}a{color:#e6b84f}code{color:#75aee8}</style></head><body><h1>KAIOS Creator Marketplace API</h1><p><code>${routeStatus}</code> · READ_ONLY · SIMULATION_ONLY · NO REAL KGEN</p><ul>${files.map((name) => `<li><a href="${name}">${name}</a></li>`).join("")}</ul><p><a href="${prefix}world-viewer/creator-marketplace/">Open Creator Marketplace</a></p></body></html>`;
}

await fs.mkdir(canonicalDirectory, { recursive: true });
await fs.mkdir(compatibilityDirectory, { recursive: true });
await fs.writeFile(path.join(canonicalDirectory, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
await fs.writeFile(path.join(canonicalDirectory, "index.html"), html("CANONICAL_UNVERSIONED_ROUTE", "../../../"));
await fs.writeFile(path.join(compatibilityDirectory, "index.json"), `${JSON.stringify({ ...index, route_status: "LEGACY_ALIAS", deprecation_status: "DEPRECATION_PENDING" }, null, 2)}\n`);
await fs.writeFile(path.join(compatibilityDirectory, "index.html"), html("LEGACY_ALIAS", "../../../../"));

for (const [name, value] of Object.entries(projections)) {
  await fs.writeFile(path.join(canonicalDirectory, name), `${JSON.stringify({ ...value, route_status: "CANONICAL_UNVERSIONED_ROUTE" }, null, 2)}\n`);
  await fs.writeFile(path.join(compatibilityDirectory, name), `${JSON.stringify({ ...value, route_status: "LEGACY_ALIAS", canonical_route: `/api/kaios/marketplace/${name}`, deprecation_status: "DEPRECATION_PENDING" }, null, 2)}\n`);
}

console.log(JSON.stringify({ status: "PASS", canonical_files: files.length + 2, compatibility_files: files.length + 2, mutation_endpoints: false }, null, 2));

