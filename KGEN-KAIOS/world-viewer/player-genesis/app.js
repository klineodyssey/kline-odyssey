import { createPlayerGenesisRuntime } from "./player-genesis-runtime.js";
import {
  createKaiosTelepathyMessage,
  routeKaiosTelepathyMessage,
  acknowledgeKaiosTelepathyMessage,
  summarizeHumanRelayLaborLedger,
  HUMAN_RELAY_LABOR_RATE_CANDIDATE
} from "../../../core/company/index.mjs";

const runtime = createPlayerGenesisRuntime();
const TELEPATHY_CACHE_KEY = "kaios.telepathy.safe-metadata-cache.v1";
function readTelepathyCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TELEPATHY_CACHE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((message) => message?.payload_persisted === false).slice(-40) : [];
  } catch { return []; }
}
const telepathyMessages = readTelepathyCache();
const $ = (id) => document.getElementById(id);
const elements = {
  loading: $("loading-state"), error: $("error-state"), errorDetail: $("error-detail"),
  onboarding: $("onboarding-panel"), empty: $("empty-state"), dashboard: $("dashboard"),
  saveStatus: $("save-status")
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function dataList(rows) {
  return `<dl class="data-list">${rows.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function showError(error) {
  elements.loading.hidden = true;
  elements.error.hidden = false;
  elements.errorDetail.textContent = String(error?.message ?? error ?? "UNKNOWN_ERROR");
}

function action(id, callback) {
  $(id)?.addEventListener("click", () => {
    try {
      callback();
      render();
    } catch (error) {
      showError(error);
    }
  });
}

function render() {
  const state = runtime.getState();
  elements.loading.hidden = true;
  elements.error.hidden = true;
  elements.onboarding.hidden = Boolean(state);
  elements.empty.hidden = Boolean(state);
  elements.dashboard.hidden = !state;
  if (!state) return;

  $("identity-metrics").innerHTML = [
    metric("Player Life ID", state.ids.player_life_id),
    metric("Life Type", state.player.actor_type),
    metric("AI Life ID", state.ids.ai_life_id),
    metric("Household ID", state.ids.household_id),
    metric("Starter Land ID", state.ids.starter_land_id)
  ].join("");
  $("onboarding-status").textContent = state.onboarding_complete ? "GENESIS COMPLETE" : "PENDING";
  $("starter-land").innerHTML = dataList([
    ["Birthplace", state.birthplace.label],
    ["Starter location", state.starter_location.label],
    ["Asset", state.starter_land.asset_class],
    ["Civilization", state.starter_land.civilization_stage],
    ["Resources", Object.entries(state.starter_land.resources).map(([key, value]) => `${key}:${value}`).join(" · ")],
    ["Authority", state.starter_land.authority]
  ]);
  $("consent-summary").innerHTML = dataList([
    ["GPS", state.consent.gps], ["Navigation", state.consent.navigation], ["Step counter", state.consent.step_counter],
    ["Exact GPS stored", state.exact_gps_stored ? "YES" : "NO"], ["Birthday", state.player.birthday_private]
  ]);

  const nextNeed = runtime.identifyNextLifeNeed();
  $("life-path-summary").innerHTML = dataList([
    ["Selected path", state.life_path.selected_path ?? "CHOOSE YOUR PATH"],
    ["Education", state.life_path.education_path ?? "NOT SELECTED"],
    ["Next need", `${nextNeed.next_need} · ${nextNeed.level}/100`],
    ["Current node", state.world_map.current_node_id],
    ["Navigation", state.consent.navigation],
    ["Map evidence", state.world_map.map_evidence],
    ["Loop", state.life_loop.status]
  ]);
  $("need-grid").innerHTML = Object.entries(state.basic_needs).map(([need, level]) => metric(need, `${level}/100`)).join("");
  $("select-life-path").disabled = state.life_path.selected_path !== null;
  $("visit-water").disabled = state.world_map.current_node_id === "K280_WATER_SOURCE";
  $("collect-water").disabled = state.world_map.current_node_id !== "K280_WATER_SOURCE";
  $("visit-food").disabled = state.world_map.current_node_id === "K280_FORAGING_GROVE";
  $("collect-food").disabled = state.world_map.current_node_id !== "K280_FORAGING_GROVE";
  $("buy-first-service").disabled = state.payroll.status !== "PAID" || state.purchases.length > 0;
  $("life-loop-result").textContent = state.purchases.length ? `${state.purchases.at(-1).service_id} · ${state.purchases.at(-1).status}` : "EARN FIRST · THEN BUY ONE SERVICE";

  const job = state.active_work_order;
  $("work-status").textContent = job.status;
  $("work-order").innerHTML = dataList([
    ["Work Order", job.work_order_id], ["Title", job.title], ["Player role", job.player_role], ["AI role", job.ai_role],
    ["Completion", `${job.completion_percent}%`], ["Quality", job.quality_score || "PENDING"], ["Payroll", job.payroll_status]
  ]);
  $("work-progress").style.width = `${job.completion_percent}%`;
  $("review-gates").innerHTML = dataList(state.codex_review.gates.map((gate) => [gate, state.codex_review.passed_gates.includes(gate) ? "PASS" : state.codex_review.status]));
  $("work-market").innerHTML = state.work_market.map((role) => `<div class="market-role"><strong>${escapeHtml(role.role)}</strong><small>${escapeHtml(role.skill)}</small></div>`).join("");
  $("accept-work").disabled = job.status !== "OFFERED";
  $("work-tick").disabled = job.status !== "IN_PROGRESS";
  $("review-work").disabled = job.status !== "IN_REVIEW";
  $("payroll").disabled = job.payroll_status !== "ELIGIBLE";
  $("expense-loop").disabled = state.payroll.status !== "PAID" || state.events.some(({ type }) => type === "ECONOMIC_LOOP_COMPLETED");

  const walletIds = [state.ids.player_wallet_id, state.ids.ai_wallet_id, state.ids.household_wallet_id];
  $("wallet-grid").innerHTML = walletIds.map((id) => {
    const wallet = state.accounts[id];
    return `<article class="wallet-card"><span>${escapeHtml(wallet.label)}</span><b>${wallet.balance.toFixed(2)}</b><strong>${escapeHtml(wallet.wallet_id)}</strong><span>Income ${wallet.income.toFixed(2)} · Expenses ${wallet.expenses.toFixed(2)}</span><span>${escapeHtml(wallet.mode)} · ${escapeHtml(wallet.chain)}</span></article>`;
  }).join("");
  $("ledger-list").innerHTML = state.ledger.length
    ? state.ledger.slice().reverse().map((entry) => `<div class="ledger-entry"><strong>${escapeHtml(entry.type)}</strong><span>${entry.amount.toFixed(2)}</span><span>${escapeHtml(entry.debit)} → ${escapeHtml(entry.credit)}</span></div>`).join("")
    : `<p class="eyebrow">NO TRANSACTIONS · PAYROLL REQUIRES COMPLETED WORK AND REVIEW</p>`;

  $("household-summary").innerHTML = dataList([
    ["Household", state.household.household_id], ["Members", state.household.members.length], ["Shared account", state.household.shared_account_id],
    ["Legal marriage", state.household.legal_marriage ? "YES" : "NO"], ["Revenue share", "VOLUNTARY_CONTRACT_ONLY"], ["Capacity", state.household.capacity]
  ]);
  $("descendant-summary").innerHTML = dataList([
    ["Count", state.household.descendants.length], ["Population cap", state.household.population_cap], ["Birth cooldown", `${state.household.birth_cooldown_ticks} ticks`], ["Status", "SIMULATED_DESCENDANT ONLY"]
  ]);
  $("create-descendant").disabled = state.household.descendants.length >= state.household.population_cap;

  const profile = state.ai.body_profile;
  $("ai-needs").innerHTML = dataList([
    ["BODY_TYPE", profile.body_type], ["ENERGY_TYPE", profile.energy_type], ["FOOD_REQUIREMENT", profile.food_requirement],
    ["HOUSING_REQUIREMENT", profile.housing_requirement], ["MAINTENANCE_REQUIREMENT", profile.maintenance_requirement],
    ["HEALTH_STATUS", state.ai.health_status], ["AGING_STATUS", state.ai.aging_status], ["Energy / Compute", `${state.ai.energy} / ${state.ai.compute}`]
  ]);
  $("lifecycle-summary").innerHTML = dataList([
    ["Player stage", state.player.life_stage], ["AI stage", state.ai.lifecycle_stage], ["AI age ticks", state.ai.age_ticks],
    ["Failures", state.lifecycle.failures.length], ["History", "PRESERVED"], ["Inheritance", state.lifecycle.inheritance_executed ? "EXECUTED" : "PREFERENCE RECORDED"]
  ]);
  $("simulate-death").disabled = state.ai.lifecycle_stage === "DECEASED";
  $("event-list").innerHTML = state.events.slice().reverse().map((event) => `<li><strong>T${event.tick}</strong> ${escapeHtml(event.type)}</li>`).join("");
  renderTelepathy(state);
}

function renderTelepathy(state) {
  const relay = summarizeHumanRelayLaborLedger([]);
  $("telepathy-list").innerHTML = telepathyMessages.length
    ? telepathyMessages.slice().reverse().map((message) => `<li><strong>${escapeHtml(message.status)}</strong> ${escapeHtml(message.message_type)} → ${escapeHtml(message.to_worker_id)}<small>${escapeHtml(message.receipt ?? "NO RECEIPT")}</small></li>`).join("")
    : "<li><strong>NO MESSAGES</strong><small>Send a request without copying a work order between pages.</small></li>";
  $("relay-summary").innerHTML = dataList([
    ["Verified relay events", relay.verified_relay_events],
    ["Verified minutes", relay.verified_relay_minutes],
    ["Unverified relay events", relay.unverified_relay_events],
    ["Labor rate", relay.human_labor_rate],
    ["Payable", relay.human_relay_payable],
    ["Rate candidate", `${HUMAN_RELAY_LABOR_RATE_CANDIDATE.amount_kaios_per_hour} KAIOS/hour · NOT CANON`],
    ["Cost center", HUMAN_RELAY_LABOR_RATE_CANDIDATE.cost_center],
    ["Current Life", state.ids.player_life_id]
  ]);
}

$("genesis-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const form = new FormData(event.currentTarget);
    const gpsGranted = form.has("gps");
    runtime.create({
      display_name: form.get("display_name"),
      life_type: form.get("life_type"),
      birthday: form.get("birthday"),
      gps_consent: gpsGranted ? "CONSENT_GRANTED" : "CONSENT_DENIED",
      navigation_consent: form.has("navigation") ? "CONSENT_GRANTED" : "CONSENT_DENIED",
      step_consent: form.has("step") ? "CONSENT_GRANTED" : "CONSENT_DENIED",
      birthplace_id: form.get("birthplace_id"),
      birthplace_label: event.currentTarget.elements.birthplace_id.selectedOptions[0].textContent,
      starter_location_id: form.get("starter_location_id"),
      starter_location_label: event.currentTarget.elements.starter_location_id.selectedOptions[0].textContent,
      seed: `${form.get("display_name")}:${form.get("birthday")}:KAIOS`
    });
    runtime.completeOnboarding();
    runtime.save();
    elements.saveStatus.textContent = gpsGranted ? "COARSE CONSENT RECORDED · EXACT GPS NOT STORED" : "MANUAL LOCATION FALLBACK ACTIVE";
    render();
  } catch (error) { showError(error); }
});

action("accept-work", () => runtime.acceptFirstWork());
action("select-life-path", () => runtime.selectLifePath($("life-path-select").value, $("education-path-select").value));
action("visit-water", () => runtime.travelToStarterNode("K280_WATER_SOURCE"));
action("collect-water", () => runtime.satisfyStarterNeed("K280_WATER_SOURCE"));
action("visit-food", () => runtime.travelToStarterNode("K280_FORAGING_GROVE"));
action("collect-food", () => runtime.satisfyStarterNeed("K280_FORAGING_GROVE"));
action("buy-first-service", () => runtime.buyStarterService("K280_WATER_AND_FOOD_GUIDE"));
action("work-tick", () => runtime.performWorkTick());
action("review-work", () => runtime.reviewWork());
action("payroll", () => runtime.runPayroll());
action("expense-loop", () => runtime.runHouseholdExpenseLoop());
action("age-life", () => runtime.advanceLifecycle(100));
action("simulate-death", () => runtime.simulateDeath("AI", "MAINTENANCE_FAILURE"));
action("create-descendant", () => runtime.createSimulatedDescendant());
action("save-button", () => { runtime.save(); elements.saveStatus.textContent = "SAVED LOCALLY · NO SERVER AUTHORITY"; });
action("resume-button", () => { runtime.resume(); elements.saveStatus.textContent = runtime.getState() ? "SIMULATION RESUMED" : "NO SAVED SIMULATION"; });
action("reset-button", () => { if (confirm("重置本地模擬？不可變歷史只會保留在先前匯出的 JSON。")) { runtime.reset(); elements.saveStatus.textContent = "SIMULATION RESET"; } });
$("retry-button").addEventListener("click", () => location.reload());

$("telepathy-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const state = runtime.getState();
    const request = $("telepathy-request").value.trim();
    if (!request) throw new Error("TELEPATHY_REQUEST_REQUIRED");
    const target = $("telepathy-target").value;
    const now = new Date();
    const targetRecord = target === "CODEX_GM"
      ? { life: "LIFE-CODEX-GM-0001", worker: "codex-gm-01", route: "ROUTE_BROWSER_TO_CODEX_NOT_CONNECTED", type: "INTERNAL_COMPANY_RUNTIME", available: false, blocker: "LOCAL_BROWSER_TO_GM_CONTROLLER_NOT_CONNECTED" }
      : { life: "LIFE-CHIYAO-KAIOS-001", worker: "chiyao-reviewer-01", route: "ROUTE_CHIYAO_EXTERNAL", type: "ROUTABLE_PROVIDER_CONTROLLER", available: false };
    const message = await createKaiosTelepathyMessage({
      messageId: `MESSAGE_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
      idempotencyKey: `IDEMPOTENCY_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
      fromLifeId: state.ids.player_life_id,
      fromWorkerId: `${state.ids.player_life_id}-SESSION`,
      toLifeId: targetRecord.life,
      toWorkerId: targetRecord.worker,
      messageType: "REQUEST",
      payload: { request },
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      repositoryContext: "klineodyssey/kline-odyssey@PUBLIC_EXPERIMENTAL_BUILD",
      authorityScope: ["REQUEST_ROUTING_ONLY"]
    });
    let routed = routeKaiosTelepathyMessage({
      message,
      route: { route_id: targetRecord.route, route_type: targetRecord.type, to_life_id: targetRecord.life, to_worker_id: targetRecord.worker, available: targetRecord.available, blocker: targetRecord.blocker ?? "EXTERNAL_CHANNEL_UNAVAILABLE" },
      deliveredAt: new Date(now.getTime() + 1).toISOString(),
      processedIdempotencyKeys: telepathyMessages.map((item) => item.idempotency_key)
    });
    if (routed.status === "DELIVERED") {
      routed = acknowledgeKaiosTelepathyMessage({ message: routed, acknowledgedByLifeId: targetRecord.life, acknowledgedByWorkerId: targetRecord.worker, acknowledgedAt: new Date(now.getTime() + 2).toISOString() });
    }
    telepathyMessages.push(routed);
    localStorage.setItem(TELEPATHY_CACHE_KEY, JSON.stringify(telepathyMessages.slice(-40)));
    $("telepathy-request").value = "";
    $("telepathy-result").textContent = `${routed.status} · ${routed.receipt}`;
    renderTelepathy(state);
  } catch (error) {
    $("telepathy-result").textContent = String(error?.message ?? error);
  }
});

$("export-button").addEventListener("click", () => {
  try {
    const blob = new Blob([runtime.export()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "kaios-player-genesis-non-authoritative-simulation.json";
    link.click();
    URL.revokeObjectURL(link.href);
    elements.saveStatus.textContent = "NON_AUTHORITATIVE_SIMULATION EXPORTED";
  } catch (error) { showError(error); }
});

$("import-input").addEventListener("change", async (event) => {
  try {
    const file = event.target.files?.[0];
    if (!file) return;
    runtime.import(await file.text());
    runtime.save();
    elements.saveStatus.textContent = "SIMULATION IMPORTED AND VALIDATED";
    render();
  } catch (error) { showError(error); }
});

document.querySelectorAll(".section-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".section-tabs button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.getElementById(button.dataset.target)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
});

try {
  runtime.resume();
  elements.empty.hidden = Boolean(runtime.getState());
  render();
} catch (error) {
  runtime.reset();
  showError(error);
}
