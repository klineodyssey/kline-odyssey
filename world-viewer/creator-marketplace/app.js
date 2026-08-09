/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-CREATOR-MARKETPLACE-VIEWER
 * genome_id: GENOME-KAIOS-CREATOR-MARKETPLACE-VIEWER
 * genome_version: 1.0.0
 * organ_type: VIEWER_ORGAN
 * authority: SIMULATION_ONLY
 */
import { createCreatorMarketplaceRuntime } from "../../KGEN-KAIOS/world-viewer/marketplace/creator-marketplace-runtime.js";

const $ = (id) => document.getElementById(id);
const MAX_IMPORT_BYTES = 2_000_000;
let runtime;
let view = "starter";

function show(value) {
  if (Array.isArray(value)) return value.join(", ") || "--";
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "--");
}

function card(title, rows) {
  const article = document.createElement("article");
  article.className = "card";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const list = document.createElement("dl");
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = show(value);
    list.append(term, detail);
  }
  article.append(heading, list);
  return article;
}

function grid(items) {
  const container = document.createElement("div");
  container.className = "grid";
  items.forEach((item) => container.append(item));
  return container;
}

function timeline(events) {
  const list = document.createElement("ol");
  list.className = "timeline";
  events.slice().reverse().forEach((event) => {
    const row = document.createElement("li");
    const time = document.createElement("time");
    const action = document.createElement("strong");
    const detail = document.createElement("span");
    time.textContent = `T${event.simulation_time}`;
    action.textContent = event.action;
    detail.textContent = `${event.status} / ${event.reason} / ${event.next_state_hash}`;
    row.append(time, action, detail);
    list.append(row);
  });
  return list;
}

function render() {
  const state = runtime.getState();
  const report = runtime.integrityReport();
  const player = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET");
  $("runtime-status").textContent = state.runtime_status;
  $("simulation-time").textContent = `${state.simulation_time} h`;
  $("player-credit").textContent = `${player.balance} KGC`;
  $("project-count").textContent = String(state.projects.length);
  $("delivery-count").textContent = String(state.deliveries.length);
  $("integrity").textContent = report.ok ? "PASS" : "FAIL";
  $("integrity").style.color = report.ok ? "var(--green)" : "var(--red)";
  $("loading").hidden = true;
  const target = $("content");
  target.replaceChildren();
  let content;

  if (view === "starter") content = grid(state.starter_grants.map((item) => card(item.starter_grant_id, [["Player Genesis", item.player_genesis_id], ["Land", item.land_id], ["Credit", item.credit], ["Status", item.status], ["Resources", item.resources]])));
  if (view === "land") content = state.starter_land ? grid([card(state.starter_land.land_id, [["Parcels", state.starter_land.parcels], ["Right", state.starter_land.right], ["Civilization", state.starter_land.civilization], ["Legal Title", state.starter_land.real_legal_title], ["Blockchain", state.starter_land.blockchain_ownership]])]) : grid([]);
  if (view === "needs") content = grid(state.needs.map((item) => card(item.category, [["Resource", item.resource], ["Quantity", item.quantity], ["Urgency", item.urgency], ["Cause", item.cause], ["Status", item.fulfillment_status]])));
  if (view === "credit") content = grid(Object.values(state.accounts).map((item) => card(item.account_id, [["Type", item.type], ["Owner", item.owner_id], ["Balance", item.balance], ["Currency", item.currency]])));
  if (view === "requests") content = grid(state.requests.map((item) => card(item.request_id, [["Description", item.description], ["Type", item.requested_output_type], ["Budget", item.budget], ["Kind", item.kind], ["Status", item.status], ["Reason", item.decision_reason]])));
  if (view === "accepted") content = grid(state.requests.filter(({ status }) => status === "ACCEPTED").map((item) => card(item.request_id, [["Description", item.description], ["Budget", item.budget], ["Location", item.location], ["Status", item.status]])));
  if (view === "blocked") content = grid(state.requests.filter(({ status }) => status.startsWith("BLOCKED") || status === "REJECTED").map((item) => card(item.request_id, [["Description", item.description], ["Status", item.status], ["Reason", item.decision_reason], ["History", "PRESERVED"]])));
  if (view === "projects") content = grid(state.projects.map((item) => card(item.project_id, [["Request", item.request_id], ["Kind", item.kind], ["Status", item.status], ["Tasks", item.task_ids], ["Listing", item.listing_id], ["AI Company", item.ai_company_binding?.status ?? "BOUNDARY_REFERENCE"]])));
  if (view === "tasks") content = grid(state.tasks.map((item) => card(item.task_id, [["Type", item.task_type], ["Mode", item.physical_or_digital], ["Worker", item.worker_class], ["Duration", `${item.duration} h`], ["Elapsed", `${item.elapsed} h`], ["Dependencies", item.dependencies], ["Status", item.status]])));
  if (view === "workers") content = grid(state.actors.filter(({ role }) => ["AI_WORKER", "BUILDER", "TRANSPORTER"].includes(role)).map((item) => card(item.role, [["ID", item.life_or_company_id], ["Location", item.location], ["Availability", item.availability], ["Authority", item.authority]])));
  if (view === "creators") content = grid(state.actors.filter(({ role }) => ["CURSOR_CANDIDATE_CREATOR", "CODEX_REVIEWER", "AI_COMPANION"].includes(role)).map((item) => card(item.role, [["ID", item.life_or_company_id], ["Capabilities", item.capabilities], ["Authority", item.authority], ["Forbidden", item.forbidden_actions]])));
  if (view === "life-listings") content = grid(state.listings.filter(({ category }) => category.endsWith("LIFE")).map((item) => card(item.listing_id, [["Category", item.category], ["Creator", item.creator], ["Review", item.review_status], ["Canonical", item.canonical_status], ["Price", item.price_in_KAIOS_GAME_CREDIT], ["Limitations", item.known_limitations]])));
  if (view === "product-listings") content = grid(state.built_assets.map((item) => card(item.asset_id, [["Type", item.type], ["Materials", item.materials], ["Inspection", item.inspection], ["Simulation", item.simulation_only]])));
  if (view === "escrow") content = grid(state.projects.map((item) => card(item.escrow.account_id, [["Project", item.project_id], ["Budget", item.escrow.customer_budget], ["Payroll", item.escrow.reserved_payroll], ["Materials", item.escrow.reserved_materials], ["Spent", item.escrow.spent], ["Refunded", item.escrow.refunded], ["Remaining", item.escrow.remaining]])));
  if (view === "payroll") content = grid(state.payroll_events.map((item) => card(item.payroll_event_id, [["Project", item.project_id], ["Worker", item.worker_life_id], ["Wallet", item.wallet_id], ["Gross", item.gross_pay], ["Household", item.household_transfer], ["Status", item.status]])));
  if (view === "deliveries") content = grid(state.deliveries.map((item) => card(item.deliverable_id, [["Project", item.project_id], ["Version", item.version], ["Creator", item.provenance.creator], ["Review", item.review_status], ["Acceptance", item.acceptance_record?.outcome], ["Rights", item.rights]])));
  if (view === "consumption") content = grid(Object.entries(state.household_inventory).map(([name, value]) => card(name, [["Household Quantity", value], ["Market Quantity", state.market_inventory[name] ?? "NOT_SOLD"], ["Credit Substitute", "NO"]])));
  if (view === "profit") content = grid([card(state.company.status, [["Revenue", state.company.revenue], ["Expenses", state.company.expenses], ["Profit/Loss", state.company.profit_or_loss], ["Unsold Inventory", state.company.unsold_inventory], ["Storage Cost", state.company.storage_cost], ["No Sale Revenue", 0]])]);
  if (view === "timeline") content = timeline(state.events);

  const empty = !content || content.children.length === 0;
  $("empty").hidden = !empty;
  if (content) target.append(content);
}

function notify(value) {
  const item = value?.outputs ?? value;
  $("notice").textContent = typeof item === "string" ? item : JSON.stringify(item);
  $("notice").hidden = false;
  render();
}

function safe(action) {
  try { $("error").hidden = true; notify(action()); }
  catch (error) { $("error-detail").textContent = error.message; $("error").hidden = false; }
}

function resetForScenario(name) {
  runtime.resetState();
  const commands = { starter: "runStarterHouseholdDemo", tree: "runTreeLifeDemo", shelter: "runBasicShelterDemo", failed: "runFailedOrderDemo" };
  safe(() => runtime[commands[name]]());
}

function latestProject(state) { return state.projects.at(-1); }
function latestDelivery(state) { return state.deliveries.at(-1); }

function bind() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
  document.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => resetForScenario(button.dataset.scenario)));
  $("create-request").addEventListener("click", () => safe(() => runtime.submitRequest({ description: "Create a generic tree candidate life package", requested_output_type: "LIFE_PACKAGE", budget: 120 })));
  $("fund-project").addEventListener("click", () => safe(() => { const request = runtime.getState().requests.at(-1); runtime.evaluateRequest(request.request_id); return runtime.fundProject(request.request_id); }));
  $("accept-quote").addEventListener("click", () => safe(() => runtime.createTasks(latestProject(runtime.getState()).project_id)));
  $("inspect-supply").addEventListener("click", () => { view = "tasks"; render(); });
  $("start-project").addEventListener("click", () => safe(() => { runtime.start(); return runtime.startProject(latestProject(runtime.getState()).project_id); }));
  $("inspect-task").addEventListener("click", () => safe(() => { const project = latestProject(runtime.getState()); const task = runtime.getState().tasks.find((item) => item.project_id === project.project_id && item.status === "IN_PROGRESS"); runtime.advanceTime(task.duration - task.elapsed); return runtime.approveSubmittedTask(project.project_id); }));
  $("submit-deliverable").addEventListener("click", () => safe(() => runtime.submitDeliverable(latestProject(runtime.getState()).project_id, { creator: "cursor-01-style-candidate" })));
  $("review").addEventListener("click", () => safe(() => runtime.reviewDeliverable(latestDelivery(runtime.getState()).deliverable_id, "APPROVED")));
  $("accept").addEventListener("click", () => safe(() => runtime.acceptDelivery(latestDelivery(runtime.getState()).deliverable_id, "ACCEPTED")));
  $("rework").addEventListener("click", () => safe(() => runtime.reviewDeliverable(latestDelivery(runtime.getState()).deliverable_id, "REWORK_REQUIRED")));
  $("reject").addEventListener("click", () => safe(() => runtime.reviewDeliverable(latestDelivery(runtime.getState()).deliverable_id, "REJECTED")));
  $("release-payroll").addEventListener("click", () => safe(() => runtime.releasePayroll(latestProject(runtime.getState()).project_id)));
  $("buy-essential").addEventListener("click", () => safe(() => runtime.buyEssentialItem("basic_food", 1, 2)));
  $("pause").addEventListener("click", () => safe(() => runtime.pause()));
  $("resume").addEventListener("click", () => safe(() => runtime.resume()));
  $("advance").addEventListener("click", () => safe(() => runtime.advanceTime(1)));
  $("replay").addEventListener("click", () => safe(() => runtime.replayEvents()));
  $("reset").addEventListener("click", () => safe(() => runtime.resetState()));
  $("export").addEventListener("click", () => { const blob = new Blob([runtime.exportState()], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "kaios-creator-marketplace-simulation.json"; link.click(); URL.revokeObjectURL(link.href); });
  $("import").addEventListener("change", async (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > MAX_IMPORT_BYTES) return safe(() => { throw new Error("IMPORT_FILE_TOO_LARGE"); }); const serialized = await file.text(); safe(() => runtime.importState(serialized)); });
  $("retry").addEventListener("click", () => { runtime = createCreatorMarketplaceRuntime(); render(); });
}

try { runtime = createCreatorMarketplaceRuntime(); bind(); render(); }
catch (error) { $("loading").hidden = true; $("error-detail").textContent = error.message; $("error").hidden = false; }
