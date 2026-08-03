import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCreatorMarketplaceRuntime, CREATOR_MARKETPLACE_BOUNDARIES } from "../marketplace/creator-marketplace-runtime.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("starter package is finite and granted exactly once", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "STARTER-GRANT" });
  const first = runtime.grantStarterPackage();
  const second = runtime.grantStarterPackage();
  const state = runtime.getState();
  assert.equal(first.status, "COMPLETED");
  assert.equal(second.reason, "DUPLICATE_GRANT_BLOCKED");
  assert.equal(state.starter_grants.length, 1);
  assert.equal(state.starter_land.parcels, 1);
  assert.equal(state.starter_land.real_legal_title, false);
  assert.equal(state.household_inventory.drinking_water, 48);
  assert.equal(state.household_inventory.basic_food, 24);
  assert.equal(Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").balance, 400);
  assert.equal(runtime.integrityReport().credit_supply, 5000);
});

test("starter demand separates biological and digital needs", () => {
  const runtime = createCreatorMarketplaceRuntime();
  runtime.grantStarterPackage();
  runtime.generateDemand();
  const needs = runtime.getState().needs;
  assert.ok(needs.some(({ category, cause }) => category === "FOOD" && cause === "BIOLOGICAL_METABOLISM"));
  assert.ok(needs.some(({ category, cause }) => category === "ENERGY" && cause === "DIGITAL_AI_OPERATION"));
});

test("essential purchase decreases player credit and market inventory", () => {
  const runtime = createCreatorMarketplaceRuntime();
  runtime.grantStarterPackage();
  const before = runtime.getState();
  runtime.buyEssentialItem("basic_food", 2, 2);
  const after = runtime.getState();
  const player = (state) => Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").balance;
  assert.equal(player(after), player(before) - 4);
  assert.equal(after.market_inventory.basic_food, before.market_inventory.basic_food - 2);
  assert.equal(after.household_inventory.basic_food, before.household_inventory.basic_food + 2);
  assert.equal(runtime.integrityReport().ok, true);
});

test("energy ontology contains references but no conversion", () => {
  const ontology = createCreatorMarketplaceRuntime().getState().energy_ontology;
  assert.equal(ontology.kaios_operational.formula, "0.5*m*v^2 + m*g*h");
  assert.equal(ontology.kgen_cosmic.formula, "m*c^2");
  assert.equal(ontology.direct_currency_energy_conversion, false);
  assert.equal(ontology.token_mass_conversion, false);
  assert.equal(ontology.kaios_kgen_conversion, false);
});

test("tree package stays candidate and pays the AI worker wallet", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "TREE-DEMO" });
  const result = runtime.runTreeLifeDemo();
  const state = runtime.getState();
  assert.equal(result.status, "ACCEPTED");
  assert.equal(result.canonical_status, "NOT_CANONICAL");
  assert.equal(state.listings[0].review_status, "DELIVERABLE");
  assert.equal(state.listings[0].canonical_status, "NOT_CANONICAL");
  assert.equal(Object.values(state.accounts).find(({ type }) => type === "AI_SIMULATED_WALLET").balance, 40);
  assert.equal(state.accounts["SUPPLIER-OPERATING"].balance, 20);
  assert.equal(state.accounts["AI-COMPANY-OPERATING"].balance, 25);
  assert.equal(state.accounts["MAINTENANCE-RESERVE"].balance, 5);
  assert.equal(state.company.revenue, 25);
  assert.equal(state.company.profit_or_loss, 25);
  assert.equal(state.projects[0].escrow.remaining, 0);
  assert.equal(result.settlement.unused_escrow_refund, 30);
  assert.equal(result.real_kgen, false);
});

test("duplicate payroll is blocked and household transfer requires contract", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "PAYROLL-GATES" });
  const result = runtime.runTreeLifeDemo();
  assert.equal(runtime.releasePayroll(result.project_id).reason, "DUPLICATE_PAYROLL_BLOCKED");
  assert.equal(runtime.settleProject(result.project_id).reason, "DUPLICATE_SETTLEMENT_BLOCKED");
  assert.equal(runtime.transferToHousehold(5).reason, "HOUSEHOLD_CONTRACT_REQUIRED");
  assert.equal(runtime.transferToHousehold(5, "HOUSEHOLD_CONTRACT").status, "COMPLETED");
  assert.equal(runtime.integrityReport().ok, true);
});

test("basic shelter reuses AI Company and causal construction", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "SHELTER-DEMO" });
  const result = runtime.runBasicShelterDemo();
  assert.equal(result.status, "ACCEPTED");
  assert.equal(result.land_verified, true);
  assert.equal(result.material_consumed, true);
  assert.ok(result.construction_time > 0);
  assert.equal(result.inspection, "PASS");
  assert.equal(result.ai_company_binding.domain_binding, "CAUSAL_WORLD_CONSTRUCTION");
  assert.equal(result.ai_company_binding.domain_evidence.adapter, "EXECUTED_CANONICAL_RUNTIME");
});

test("shelter cannot start without causal material", () => {
  const runtime = createCreatorMarketplaceRuntime();
  runtime.grantStarterPackage();
  const request = runtime.submitRequest({ description: "Build a basic shelter", requested_output_type: "BUILDING", budget: 100 }).outputs.request;
  runtime.evaluateRequest(request.request_id);
  const project = runtime.fundProject(request.request_id).outputs.project;
  runtime.createTasks(project.project_id);
  const exported = JSON.parse(runtime.exportState());
  exported.state.resource_allocation_pool.wood += exported.state.household_inventory.wood;
  exported.state.household_inventory.wood = 0;
  const tampered = createCreatorMarketplaceRuntime();
  tampered.importState(exported);
  assert.equal(tampered.startProject(project.project_id).reason, "NO_RESOURCE_WOOD");
});

test("failed advanced order refunds escrow and creates no delivery", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "FAILED-DEMO" });
  const result = runtime.runFailedOrderDemo();
  assert.equal(result.status, "BLOCKED_TECHNOLOGY");
  assert.equal(result.fake_delivery, false);
  assert.equal(result.refund, 100);
  assert.equal(result.history_preserved, true);
  assert.equal(runtime.getState().deliveries.length, 0);
});

test("all four demonstrations replay deterministically", () => {
  for (const name of ["runStarterHouseholdDemo", "runTreeLifeDemo", "runBasicShelterDemo", "runFailedOrderDemo"]) {
    const runtime = createCreatorMarketplaceRuntime({ seed: `REPLAY-${name}` });
    runtime[name]();
    const expected = runtime.integrityReport().state_hash;
    runtime.replayEvents();
    assert.equal(runtime.integrityReport().state_hash, expected, name);
  }
});

test("export and import preserve balanced state", () => {
  const runtime = createCreatorMarketplaceRuntime({ seed: "EXPORT" });
  runtime.runTreeLifeDemo();
  const imported = createCreatorMarketplaceRuntime({ seed: "OTHER" });
  imported.importState(runtime.exportState());
  assert.equal(imported.integrityReport().state_hash, runtime.integrityReport().state_hash);
  assert.equal(imported.integrityReport().ok, true);
});

test("authority boundaries disable wallet KGEN mint on-chain and external autonomy", () => {
  assert.deepEqual(CREATOR_MARKETPLACE_BOUNDARIES, {
    simulation_only: true,
    real_wallet: false,
    real_kgen: false,
    onchain_transfer: false,
    production_authority: false,
    uncontrolled_mint: false,
    external_autonomy: false,
    direct_currency_energy_conversion: false,
    mutation_endpoints: false
  });
});

test("required marketplace specifications and schemas exist", () => {
  const directory = path.join(repo, "KAIOS/marketplace/creator-marketplace");
  const required = ["KAIOS_AI_COMPANY_CREATOR_MARKETPLACE_V1_SPEC.md", "KAIOS_PLAYER_STARTER_PACKAGE_V1_SPEC.md", "KAIOS_STARTER_DEMAND_ENGINE_V1_SPEC.md", "KAIOS_GAME_CREDIT_MARKETPLACE_V1_SPEC.md", "KAIOS_KGEN_ENERGY_LAYER_ONTOLOGY_V1.md", "KAIOS_CREATOR_LISTING_SCHEMA_V1.json", "KAIOS_MARKETPLACE_REQUEST_SCHEMA_V1.json", "KAIOS_MARKETPLACE_PROJECT_SCHEMA_V1.json", "KAIOS_MARKETPLACE_TASK_SCHEMA_V1.json", "KAIOS_MARKETPLACE_DELIVERY_SCHEMA_V1.json", "KAIOS_MARKETPLACE_ACCEPTANCE_SCHEMA_V1.json", "KAIOS_CREATOR_MARKETPLACE_TEST_PLAN.md"];
  required.forEach((name) => assert.equal(fs.existsSync(path.join(directory, name)), true, name));
});
