import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  AI_BODY_PROFILES,
  BASIC_LIFE_NEEDS,
  EDUCATION_PATHS,
  LIFE_PATHS,
  STARTER_WORLD_NODES,
  WORK_MARKET,
  acceptFirstWork,
  advanceLifecycle,
  completeOnboarding,
  createPlayerGenesisRuntime,
  createPlayerGenesisState,
  createSimulatedDescendant,
  buyStarterService,
  exportSimulation,
  importSimulation,
  identifyNextLifeNeed,
  performWorkTick,
  reviewWork,
  runHouseholdExpenseLoop,
  runPayroll,
  satisfyStarterNeed,
  selectLifePath,
  simulateDeath,
  travelToStarterNode,
  validateState,
  walletSummary
} from "../player-genesis/player-genesis-runtime.js";

function genesis(overrides = {}) {
  const state = createPlayerGenesisState({
    seed: "TEST-SEED-001",
    display_name: "Test Player",
    birthday: "2000-01-01",
    gps_consent: "CONSENT_DENIED",
    navigation_consent: "CONSENT_GRANTED",
    step_consent: "CONSENT_DENIED",
    ...overrides
  });
  completeOnboarding(state);
  return state;
}

function completeWork(state) {
  acceptFirstWork(state);
  for (let index = 0; index < 4; index += 1) performWorkTick(state);
  reviewWork(state);
  runPayroll(state);
  return state;
}

test("player genesis is deterministic for a fixed seed", () => {
  assert.deepEqual(createPlayerGenesisState({ seed: "FIXED" }).ids, createPlayerGenesisState({ seed: "FIXED" }).ids);
});

test("player and AI receive distinct Life IDs", () => {
  const state = genesis();
  assert.notEqual(state.ids.player_life_id, state.ids.ai_life_id);
});

test("player, AI and household accounts remain separate", () => {
  const state = genesis();
  assert.equal(new Set([state.ids.player_wallet_id, state.ids.ai_wallet_id, state.ids.household_wallet_id]).size, 3);
});

test("all wallet profiles are simulated and have no private key", () => {
  const state = genesis();
  for (const id of [state.ids.player_wallet_id, state.ids.ai_wallet_id, state.ids.household_wallet_id]) {
    assert.equal(state.accounts[id].mode, "SIMULATED_WALLET");
    assert.equal(state.accounts[id].key_material, "NOT_PRESENT");
    assert.equal(state.accounts[id].chain, "NO_CHAIN");
  }
});

test("GPS denial activates a manual synthetic location without exact coordinates", () => {
  const state = genesis();
  assert.equal(state.consent.gps, "CONSENT_DENIED");
  assert.equal(state.birthplace.source, "MANUAL_SYNTHETIC_SELECTION");
  assert.equal(state.birthplace.exact_coordinates, null);
  assert.equal(state.exact_gps_stored, false);
});

test("birthplace and starter location are distinct", () => {
  const state = genesis();
  assert.notEqual(state.birthplace.location_id, state.starter_location.location_id);
});

test("identical birthplace and starter location are rejected", () => {
  const state = createPlayerGenesisState({ birthplace_id: "SAME", starter_location_id: "SAME" });
  assert.throws(() => completeOnboarding(state), /BIRTHPLACE_STARTER_LOCATION_MUST_DIFFER/);
});

test("starter land begins at primitive foraging with bounded resources", () => {
  const state = genesis();
  assert.equal(state.starter_land.civilization_stage, "PRIMITIVE_FORAGING");
  assert.equal(state.starter_land.asset_class, "LAND_PARCEL");
  assert.ok(state.starter_land.forbidden_starter_assets.includes("FACTORY"));
});

test("player chooses one of the shared life paths and education requires a valid path", () => {
  const state = genesis();
  assert.ok(LIFE_PATHS.includes("ENTREPRENEURSHIP"));
  assert.ok(EDUCATION_PATHS.includes("SKILL_TRAINING"));
  assert.throws(() => selectLifePath(state, "EDUCATION"), /EDUCATION_PATH_REQUIRED/);
  selectLifePath(state, "EDUCATION", "SKILL_TRAINING");
  assert.equal(state.life_path.status, "ENROLLED_SIMULATION");
});

test("basic needs identify the next requirement from real local state", () => {
  const state = genesis();
  assert.deepEqual(BASIC_LIFE_NEEDS.slice(0, 3), ["WATER", "FOOD", "SLEEP"]);
  const next = identifyNextLifeNeed(state);
  assert.equal(next.next_need, "MONEY");
  assert.equal(next.evidence, "LOCAL_SIMULATION_STATE");
});

test("world route reuses map primitives and needs require arrival evidence", () => {
  const state = genesis();
  selectLifePath(state, "EMPLOYMENT");
  assert.equal(STARTER_WORLD_NODES.K280_WATER_SOURCE.type, "WATER");
  assert.throws(() => satisfyStarterNeed(state, "K280_WATER_SOURCE"), /ARRIVAL_REQUIRED/);
  const route = travelToStarterNode(state, "K280_WATER_SOURCE");
  assert.equal(route.status, "ARRIVED_SIMULATION");
  assert.equal(route.map_evidence, "UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json");
  satisfyStarterNeed(state, "K280_WATER_SOURCE");
  assert.equal(state.starter_land.resources.water, 11);
  assert.equal(route.exact_gps_stored, false);
});

test("first playable loop requires earnings before one service purchase", () => {
  const state = genesis();
  selectLifePath(state, "VOCATIONAL_LABOR");
  assert.throws(() => buyStarterService(state, "K280_WATER_AND_FOOD_GUIDE"), /EARNINGS_REQUIRED/);
  completeWork(state);
  const purchase = buyStarterService(state, "K280_WATER_AND_FOOD_GUIDE");
  assert.equal(purchase.status, "SIMULATED_SETTLED");
  assert.equal(state.life_loop.status, "FIRST_PLAYABLE_LIFE_LOOP_COMPLETE");
  assert.equal(state.life_loop.completed_cycles, 1);
  assert.throws(() => buyStarterService(state, "K280_WATER_AND_FOOD_GUIDE"), /ALREADY_PURCHASED/);
});

test("work market contains all eight required roles", () => {
  assert.deepEqual(WORK_MARKET.map(({ role }) => role), [
    "BUILDING_LABORER", "SURVEY_ASSISTANT", "RESOURCE_GATHERER", "TRANSPORT_HELPER",
    "FARM_ASSISTANT", "AI_PROGRAMMER", "LIFE_SPEC_DESIGNER", "QA_REVIEWER"
  ]);
});

test("first work order assigns required player and AI roles", () => {
  const state = genesis();
  assert.equal(state.active_work_order.player_role, "BUILDING_LABORER");
  assert.equal(state.active_work_order.ai_role, "SURVEY_ASSISTANT");
});

test("work cannot start before onboarding", () => {
  const state = createPlayerGenesisState();
  assert.throws(() => acceptFirstWork(state), /ONBOARDING_REQUIRED/);
});

test("each work tick consumes player stamina and AI energy and compute", () => {
  const state = genesis();
  acceptFirstWork(state);
  performWorkTick(state);
  assert.equal(state.player.stamina, 92);
  assert.equal(state.ai.energy, 94);
  assert.equal(state.ai.compute, 96);
});

test("one click cannot complete or pay work", () => {
  const state = genesis();
  acceptFirstWork(state);
  performWorkTick(state);
  assert.equal(state.active_work_order.completion_percent, 25);
  assert.equal(state.active_work_order.payroll_status, "NOT_ELIGIBLE");
});

test("four attendance ticks move work to review", () => {
  const state = genesis();
  acceptFirstWork(state);
  for (let index = 0; index < 4; index += 1) performWorkTick(state);
  assert.equal(state.active_work_order.status, "IN_REVIEW");
  assert.equal(state.active_work_order.attendance_ticks.length, 4);
});

test("payroll is blocked before Codex review", () => {
  const state = genesis();
  acceptFirstWork(state);
  for (let index = 0; index < 4; index += 1) performWorkTick(state);
  assert.throws(() => runPayroll(state), /PAYROLL_NOT_ELIGIBLE/);
});

test("Codex review passes all eight gates", () => {
  const state = genesis();
  acceptFirstWork(state);
  for (let index = 0; index < 4; index += 1) performWorkTick(state);
  reviewWork(state);
  assert.equal(state.codex_review.status, "APPROVED");
  assert.equal(state.codex_review.passed_gates.length, 8);
});

test("payroll uses an authorized explicit simulated budget", () => {
  const state = completeWork(genesis());
  assert.equal(state.active_work_order.funding_source, "SIMULATED_COMPANY_PAYROLL_BUDGET");
  assert.equal(state.accounts["SIM-COMPANY-PAYROLL-BUDGET"].balance, 880);
});

test("payroll distributes exactly its gross budget", () => {
  const state = completeWork(genesis());
  assert.equal(state.payroll.gross, 120);
  assert.equal(state.payroll.distributed, 120);
  assert.equal(state.accounts[state.ids.player_wallet_id].balance, 72);
  assert.equal(state.accounts[state.ids.ai_wallet_id].balance, 36);
  assert.equal(state.accounts[state.ids.household_wallet_id].balance, 12);
});

test("AI salary is not owned by player", () => {
  const state = completeWork(genesis());
  const summary = walletSummary(state);
  assert.equal(summary.ai.balance, 36);
  assert.equal(summary.ai_salary_owned_by_player, false);
});

test("every ledger entry is balanced and contract-backed", () => {
  const state = completeWork(genesis());
  assert.ok(state.ledger.every((entry) => entry.balanced && entry.contract && entry.debit !== entry.credit));
});

test("economic loop includes expenses, consumption, maintenance, tax and savings", () => {
  const state = completeWork(genesis());
  runHouseholdExpenseLoop(state);
  const types = new Set(state.ledger.map(({ type }) => type));
  for (const type of ["INCOME", "EXPENSE", "CONSUMPTION", "MAINTENANCE", "TAX_SIMULATION", "SAVINGS", "HOUSEHOLD_TRANSFER"]) assert.ok(types.has(type));
});

test("economic transactions conserve total simulated balances", () => {
  const state = genesis();
  const total = () => Object.values(state.accounts).reduce((sum, account) => sum + account.balance, 0);
  const before = total();
  completeWork(state);
  runHouseholdExpenseLoop(state);
  assert.equal(total(), before);
});

test("digital AI does not require human food", () => {
  assert.equal(AI_BODY_PROFILES.DIGITAL_AI.food_requirement, "NONE");
  assert.ok(AI_BODY_PROFILES.DIGITAL_AI.needs.includes("compute"));
  assert.ok(!AI_BODY_PROFILES.DIGITAL_AI.needs.includes("food"));
});

test("robotic and biological AI needs remain body-specific", () => {
  assert.ok(AI_BODY_PROFILES.ROBOTIC_AI.needs.includes("lubrication"));
  assert.ok(AI_BODY_PROFILES.BIOLOGICAL_AI.needs.includes("food"));
  assert.ok(!AI_BODY_PROFILES.ROBOTIC_AI.needs.includes("refrigerator"));
});

test("lifecycle advancement is deterministic and replayable", () => {
  const first = genesis();
  const second = genesis();
  advanceLifecycle(first, 300);
  advanceLifecycle(second, 300);
  assert.equal(first.ai.lifecycle_stage, second.ai.lifecycle_stage);
  assert.equal(first.ai.age_ticks, 300);
  assert.equal(first.lifecycle.replayable, true);
});

test("death stops work and preserves Life History", () => {
  const state = genesis();
  acceptFirstWork(state);
  simulateDeath(state, "AI", "MAINTENANCE_FAILURE");
  assert.equal(state.ai.lifecycle_stage, "DECEASED");
  assert.equal(state.ai.work_status, "STOPPED");
  assert.ok(state.events.some(({ type, history_preserved }) => type === "LIFE_DECEASED" && history_preserved));
  assert.throws(() => performWorkTick(state), /WORK_NOT_IN_PROGRESS|DECEASED_LIFE_CANNOT_WORK/);
});

test("simulated descendant requires household resources and remains bounded", () => {
  const state = completeWork(genesis());
  runHouseholdExpenseLoop(state);
  const child = createSimulatedDescendant(state);
  assert.equal(child.status, "SIMULATED_DESCENDANT");
  assert.deepEqual(child.parent_life_ids, [state.ids.player_life_id, state.ids.ai_life_id]);
  assert.ok(state.household.population_cap <= 12);
});

test("simulated descendant cooldown prevents unbounded reproduction", () => {
  const state = completeWork(genesis());
  runHouseholdExpenseLoop(state);
  createSimulatedDescendant(state);
  state.accounts[state.ids.household_wallet_id].balance = 20;
  assert.throws(() => createSimulatedDescendant(state), /BIRTH_COOLDOWN_ACTIVE/);
});

test("export is marked non-authoritative and removes exact coordinates", () => {
  const state = genesis();
  const exported = JSON.parse(exportSimulation(state));
  assert.equal(exported.export_status, "NON_AUTHORITATIVE_SIMULATION");
  assert.equal(exported.birthplace.exact_coordinates, null);
  assert.equal(exported.player.birthday_value, null);
  assert.equal(exported.player.birthday_private, "REDACTED_FROM_EXPORT");
});

test("valid export round-trips through import", () => {
  const state = completeWork(genesis());
  const restored = importSimulation(exportSimulation(state));
  assert.deepEqual(restored.ids, state.ids);
  assert.equal(validateState(restored).ok, true);
});

test("unsafe imported GPS state is rejected", () => {
  const state = genesis();
  state.exact_gps_stored = true;
  assert.throws(() => importSimulation(JSON.stringify(state)), /GPS_PRIVACY_BOUNDARY/);
});

test("local persistence supports save, resume, import and reset", () => {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
  const runtime = createPlayerGenesisRuntime({ storage });
  runtime.create({ seed: "PERSIST" });
  runtime.completeOnboarding();
  runtime.save();
  const second = createPlayerGenesisRuntime({ storage });
  assert.ok(second.resume());
  const exported = second.export();
  second.reset();
  assert.equal(second.getState(), null);
  assert.ok(second.import(exported));
});

test("state validation enforces simulation boundaries", () => {
  const state = genesis();
  assert.deepEqual(validateState(state), { ok: true, issues: [] });
  state.real_kgen = true;
  assert.ok(validateState(state).issues.includes("REAL_SETTLEMENT_BOUNDARY"));
});

test("official homepage, Full Viewer, and public route expose Player Genesis", async () => {
  const [home, viewer, route, app] = await Promise.all([
    fs.readFile(new URL("../../../index.html", import.meta.url), "utf8"),
    fs.readFile(new URL("../index.html", import.meta.url), "utf8"),
    fs.readFile(new URL("../../../world-viewer/player-genesis/index.html", import.meta.url), "utf8"),
    fs.readFile(new URL("../player-genesis/index.html", import.meta.url), "utf8")
  ]);
  assert.match(home, /開始 KAIOS 人生/);
  assert.match(home, /\.\/world-viewer\/player-genesis\//);
  assert.match(viewer, /world-viewer\/player-genesis\//);
  assert.match(route, /KGEN-KAIOS\/world-viewer\/player-genesis/);
  assert.match(app, /KAIOS MOBILE OS/);
});

test("UI exposes loading, error, retry, save, resume, export, import and reset", async () => {
  const [html, app] = await Promise.all([
    fs.readFile(new URL("../player-genesis/index.html", import.meta.url), "utf8"),
    fs.readFile(new URL("../player-genesis/app.js", import.meta.url), "utf8")
  ]);
  for (const id of ["loading-state", "error-state", "retry-button", "save-button", "resume-button", "export-button", "import-input", "reset-button"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const id of ["path-panel", "need-grid", "telepathy-panel", "telepathy-form", "relay-summary"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(app, /LOCAL_BROWSER_TO_GM_CONTROLLER_NOT_CONNECTED/);
  assert.match(app, /payload_persisted === false/);
  assert.doesNotMatch(app, /available: true \}.*ROUTE_BROWSER_TO_CODEX/s);
});

test("responsive styles cover required mobile and desktop constraints", async () => {
  const css = await fs.readFile(new URL("../player-genesis/styles.css", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /max-width: 100%/);
  assert.match(css, /100dvh/);
  assert.match(css, /prefers-reduced-motion/);
});
