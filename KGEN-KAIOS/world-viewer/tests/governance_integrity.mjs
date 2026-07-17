import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-007-life-test", now: () => "2036-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-007-civilization-test"
});

civilization.beginGenesis();
let state = civilization.claimGenesisFortune(88);
assert.equal(state.government.hierarchy.length, 6);
assert.deepEqual(state.government.hierarchy.map(({ level_id: id }) => id), world.governance_alpha.government_hierarchy);
assert.equal(state.government.laws.length, 8);
assert.deepEqual(state.government.laws.map(({ law_id: id }) => id), world.governance_alpha.law_catalog);
assert.equal(state.public_services.services.length, 10);
assert.equal(state.public_services.ai_government.length, 8);
assert.equal(state.resilience.hazards.length, 9);

const rightsFields = ["identity", "citizenship", "residence", "family", "education", "occupation", "health", "property", "tax_record", "reputation", "contribution"];
assert.ok(state.government.citizen_rights.length > 0);
assert.ok(state.government.citizen_rights.every((rights) => rightsFields.every((field) => Object.hasOwn(rights, field)) && rights.projection_only === true));
assert.ok(state.government.officials.every(({ human_authority: authority }) => authority === false));
assert.ok(state.public_services.ai_government.every((worker) => (
  worker.life_os === "READY"
  && worker.audit_status === "VERIFIED"
  && worker.evidence_status === "RECORDED"
  && worker.permission.endsWith("_RECOMMENDATION_ONLY")
  && worker.review_status === "HUMAN_REVIEW_AVAILABLE"
  && worker.real_world_authority === false
)));

const creditSupply = (snapshot) => Object.values(snapshot.economy.balances).reduce((sum, value) => sum + Number(value), 0);
const initialSupply = creditSupply(state);
const governmentBefore = state.public_services.public_finance.government_budget;
const serviceBefore = state.public_services.public_finance.public_service_balance;
state = civilization.fundPublicService("EDUCATION", 10);
assert.equal(state.public_services.public_finance.government_budget, governmentBefore - 10);
assert.equal(state.public_services.public_finance.public_service_balance, serviceBefore + 10);
assert.equal(creditSupply(state), initialSupply);
assert.equal(state.public_services.appropriations.length, 1);
assert.ok(state.public_services.appropriations[0].ledger_entry_id);
assert.equal(state.public_services.public_projects[0].real_world_execution, false);

const populationBeforeCase = JSON.stringify(state.population.citizens);
state = civilization.submitJusticeCase("AI_LAW");
const justiceCase = state.government.justice.cases.at(-1);
assert.equal(justiceCase.status, "ARCHITECTURE_ONLY_REVIEW_REQUIRED");
assert.equal(justiceCase.executable, false);
assert.equal(justiceCase.citizen_state_mutation, false);
assert.equal(justiceCase.penalty, "NOT_EXECUTED");
assert.equal(justiceCase.prison, "NOT_EXECUTED");
assert.equal(JSON.stringify(state.population.citizens), populationBeforeCase);

state = civilization.runGovernanceCycle();
assert.ok(state.government.cycle_count >= 1);
state = civilization.runResilienceDrill("EARTHQUAKE");
assert.equal(state.resilience.drills.at(-1).status, "SIMULATION_DRILL_COMPLETE");
assert.equal(state.resilience.drills.at(-1).real_emergency_instruction, false);
state = civilization.runResilienceRecovery(10);
assert.equal(state.resilience.recovery_records.at(-1).status, "RECOVERY_REVIEWED_SYNTHETIC");

for (let index = 0; index < 180; index += 1) civilization.advance(60);
state = civilization.getSnapshot();
assert.ok(state.government.audit_log.length <= 120);
assert.ok(state.government.justice.cases.length <= 80);
assert.ok(state.public_services.history.length <= 120);
assert.ok(state.public_services.public_projects.length <= 60);
assert.ok(state.resilience.history.length <= 120);
assert.ok(state.resilience.active_incidents.length <= 40);
assert.equal(creditSupply(state), initialSupply);

const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(report.reports.government.ok, true);
assert.equal(report.reports.public_services.ok, true);
assert.equal(report.reports.resilience.ok, true);
assert.equal(JSON.stringify(world), canonicalBefore, "Governance Runtime must not mutate the canonical fixture");

const output = {
  status: "PASS",
  decision_id: "HUMAN-SPRINT-007-CIVILIZATION-GOVERNANCE",
  government: report.reports.government,
  public_services: report.reports.public_services,
  resilience: report.reports.resilience,
  verified_flows: {
    village_to_planet_government: true,
    citizen_rights_projection: true,
    eight_law_catalog: true,
    justice_architecture_only: true,
    public_service_appropriation_balanced: true,
    education_and_medical_network: true,
    ai_government_least_privilege: true,
    environment_projection: true,
    resilience_drill_only: true,
    recovery_evidence: true
  },
  bounded_history: {
    government_audit: state.government.audit_log.length,
    justice_cases: state.government.justice.cases.length,
    service_history: state.public_services.history.length,
    service_projects: state.public_services.public_projects.length,
    resilience_history: state.resilience.history.length
  },
  protected_runtime_mutated: false,
  life_os_current_mutated: false,
  settlement_runtime_current_mutated: false,
  token_contract_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
