import { createLifeEnergyPayrollRuntime } from "../../KGEN-KAIOS/world-viewer/economy/life-energy-payroll-runtime.js";

const $ = (id) => document.getElementById(id);
const MAX_IMPORT_BYTES = 2_000_000;
let runtime;
let currentView = "life";

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
    detail.textContent = Array.isArray(value) ? value.join(", ") : String(value ?? "--");
    list.append(term, detail);
  }
  article.append(heading, list);
  return article;
}

function grid(items) {
  const element = document.createElement("div");
  element.className = "grid";
  for (const item of items) element.append(item);
  return element;
}

function timeline(events) {
  const list = document.createElement("ol");
  list.className = "timeline";
  for (const item of events.slice().reverse()) {
    const row = document.createElement("li");
    const time = document.createElement("time");
    const action = document.createElement("strong");
    const detail = document.createElement("span");
    time.textContent = `T${item.simulation_time}`;
    action.textContent = item.action;
    detail.textContent = `${item.status} / ${item.reason} / ${item.next_state_hash}`;
    row.append(time, action, detail);
    list.append(row);
  }
  return list;
}

function render() {
  const state = runtime.getState();
  const integrity = runtime.integrityReport();
  $("runtime-status").textContent = state.runtime_status;
  $("simulation-time").textContent = `${state.simulation_time} h`;
  $("credit-supply").textContent = `${integrity.credit_supply} KAIOS_CREDIT`;
  $("ledger-count").textContent = String(state.ledger.length);
  $("event-count").textContent = String(state.events.length);
  $("integrity").textContent = integrity.ok ? "PASS" : "FAIL";
  $("integrity").style.color = integrity.ok ? "var(--green)" : "var(--red)";
  $("loading").hidden = true;
  $("error").hidden = true;
  const target = $("content");
  target.replaceChildren();
  let content;

  if (currentView === "life") content = grid(state.life_model.map((life) => card(life.life_id, [["Life Exists", life.life_exists], ["Agency", life.agency_level], ["Economic Capability", life.economic_capability]])));
  if (currentView === "agency") content = grid(state.life_model.map((life) => card(life.life_id, [["Agency Level", life.agency_level], ["Wallet Required For Life", "NO"], ["External Autonomy", "DISABLED"]])));
  if (currentView === "economy") content = grid(state.life_model.map((life) => card(life.life_id, [["Capability", life.economic_capability], ["Life Exists", life.life_exists], ["Currency", life.economic_capability === "SIMULATED_WALLET" ? "KAIOS_CREDIT" : "NOT_APPLICABLE"]])));
  if (currentView === "credit") content = grid(state.ledger.map((entry) => card(entry.entry_id, [["Debit", entry.debit_account], ["Credit", entry.credit_account], ["Amount", entry.amount], ["Reason", entry.reason], ["Balanced", entry.balanced]])));
  if (currentView === "resources") content = grid(Object.entries(state.physical_resources).map(([name, value]) => card(name, [["Quantity", value], ["Credit Substitute", "NO"]])));
  if (currentView === "wallet") content = grid([card(state.worker.wallet_id ?? "NO WALLET", [["Life ID", state.worker.life_id], ["Life Exists", state.worker.life_exists], ["Active", state.worker.active], ["Balance", state.worker.wallet_id ? state.accounts[state.worker.wallet_id].balance : "PAYROLL BLOCKED"]])]);
  if (currentView === "escrow") content = grid([card("PROJECT-BUDGET-001", [["Balance", state.accounts["PROJECT-BUDGET-001"].balance], ["Currency", "KAIOS_CREDIT"]]), card("PROJECT-ESCROW-001", [["Balance", state.accounts["PROJECT-ESCROW-001"].balance], ["Project", state.project?.project_id], ["Status", state.project?.status]])]);
  if (currentView === "payroll-events") content = grid(state.payroll_events.map((item) => card(item.payroll_event_id, [["Worker", item.worker_life_id], ["Gross", item.gross_pay], ["Net", item.net_pay], ["Energy", item.energy_cost], ["Compute", item.compute_cost], ["Status", item.status]])));
  if (currentView === "transfers") content = grid(state.ledger.filter(({ reason }) => reason === "HOUSEHOLD_CONTRACT").map((entry) => card(entry.entry_id, [["From", entry.debit_account], ["To", entry.credit_account], ["Amount", entry.amount], ["Contract", entry.reason]])));
  if (currentView === "ant-ledger") { const ant = state.colony_ledgers.ant; content = grid([card(ant.ledger_id, [["Work Credits", JSON.stringify(ant.work_credits)], ["Rations", JSON.stringify(ant.ration_allocations)], ["Food Mass", state.physical_resources.ant_food_mass], ["Consumed", state.physical_resources.ant_consumed_mass], ["Starvation Risk", ant.starvation_risk]])]); }
  if (currentView === "bee-ledger") { const bee = state.colony_ledgers.bee; content = grid([card(bee.ledger_id, [["Pollination Credits", JSON.stringify(bee.work_credits)], ["Honey Shares", JSON.stringify(bee.honey_shares)], ["Nectar", state.physical_resources.hive_nectar_mass], ["Honey", state.physical_resources.hive_honey_mass], ["Shortage Risk", bee.shortage_risk]])]); }
  if (currentView === "timeline") content = timeline(state.events);
  const empty = !content || (content.classList.contains("grid") && !content.children.length) || (content.classList.contains("timeline") && !content.children.length);
  $("empty").hidden = !empty;
  if (content) target.append(content);
}

function notify(message) {
  $("notice").textContent = message;
  $("notice").hidden = false;
  render();
}

function scenario(name) {
  runtime.resetState();
  runtime.start();
  if (name === "payroll") runtime.runPayrollDemo();
  if (name === "rejected") runtime.runPayrollDemo({ outcome: "REJECTED" });
  if (name === "duplicate") { runtime.runPayrollDemo(); runtime.runPayrollDemo(); }
  if (name === "ant") { runtime.runAntColonyScenario({ foodAvailable: true }); runtime.runAntColonyScenario({ foodAvailable: false }); }
  if (name === "bee") { runtime.runBeeHiveScenario({ nectarAvailable: true }); runtime.runBeeHiveScenario({ nectarAvailable: false }); runtime.runBeeHiveScenario({ nectarAvailable: false }); }
  notify(`情境完成：${name}`);
}

function download() {
  const blob = new Blob([runtime.exportState()], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kaios-life-energy-payroll-simulation.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bind() {
  for (const button of document.querySelectorAll("[data-view]")) button.addEventListener("click", () => {
    currentView = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
  $("start").addEventListener("click", () => { runtime.start(); render(); });
  $("pause").addEventListener("click", () => { runtime.pause(); render(); });
  $("resume").addEventListener("click", () => { runtime.resume(); render(); });
  $("advance").addEventListener("click", () => { runtime.advanceTime(1); render(); });
  for (const name of ["payroll", "rejected", "duplicate", "ant", "bee"]) $(name).addEventListener("click", () => scenario(name));
  $("replay").addEventListener("click", () => { runtime.replayEvents(); notify("事件已依相同 seed 與 actions 重播"); });
  $("reset").addEventListener("click", () => { runtime.resetState(); notify("模擬已重設"); });
  $("export").addEventListener("click", download);
  $("import").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("IMPORT_FILE_TOO_LARGE");
      runtime.importState(await file.text());
      notify("模擬狀態已匯入");
    } catch (error) {
      $("error-detail").textContent = error.message;
      $("error").hidden = false;
    }
  });
  $("retry").addEventListener("click", () => { runtime = createLifeEnergyPayrollRuntime(); render(); });
}

try {
  runtime = createLifeEnergyPayrollRuntime();
  bind();
  render();
} catch (error) {
  $("loading").hidden = true;
  $("error-detail").textContent = error.message;
  $("error").hidden = false;
}
