import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const required = [
  "KAIOS_AI_COMPANY_CREATOR_MARKETPLACE_V1_SPEC.md",
  "KAIOS_PLAYER_STARTER_PACKAGE_V1_SPEC.md",
  "KAIOS_STARTER_DEMAND_ENGINE_V1_SPEC.md",
  "KAIOS_GAME_CREDIT_MARKETPLACE_V1_SPEC.md",
  "KAIOS_KGEN_ENERGY_LAYER_ONTOLOGY_V1.md",
  "KAIOS_CREATOR_LISTING_SCHEMA_V1.json",
  "KAIOS_MARKETPLACE_REQUEST_SCHEMA_V1.json",
  "KAIOS_MARKETPLACE_PROJECT_SCHEMA_V1.json",
  "KAIOS_MARKETPLACE_TASK_SCHEMA_V1.json",
  "KAIOS_MARKETPLACE_DELIVERY_SCHEMA_V1.json",
  "KAIOS_MARKETPLACE_ACCEPTANCE_SCHEMA_V1.json",
  "KAIOS_CREATOR_MARKETPLACE_TEST_PLAN.md"
];

const issues = [];
for (const name of required) {
  const target = path.join(directory, name);
  if (!fs.existsSync(target)) issues.push(`MISSING:${name}`);
  if (name.endsWith(".json")) {
    try {
      const value = JSON.parse(fs.readFileSync(target, "utf8"));
      if (!value.$schema && name !== "KAIOS_CURSOR_CREATOR_MARKETPLACE_TASK_ENVELOPE.json") issues.push(`SCHEMA_DECLARATION_MISSING:${name}`);
    } catch (error) {
      issues.push(`INVALID_JSON:${name}:${error.message}`);
    }
  }
}

const combined = required.filter((name) => name.endsWith(".md")).map((name) => fs.readFileSync(path.join(directory, name), "utf8")).join("\n");
for (const boundary of ["SIMULATION_ONLY", "NO_REAL_KGEN", "NO_REAL_WALLET", "NO_EXTERNAL_AUTONOMY"]) {
  if (!combined.includes(boundary)) issues.push(`BOUNDARY_MISSING:${boundary}`);
}
if (!combined.includes("NOT_A_PHYSICAL_CURRENCY_CONVERSION")) issues.push("ENERGY_CONVERSION_BOUNDARY_MISSING");

console.log(JSON.stringify({ status: issues.length ? "FAIL" : "PASS", required_files: required.length, issues }, null, 2));
if (issues.length) process.exitCode = 1;
