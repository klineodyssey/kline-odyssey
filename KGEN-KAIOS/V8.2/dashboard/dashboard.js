const state = {
  config: null,
  records: {},
  alerts: []
};

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function readText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

async function loadDashboard() {
  try {
    state.config = await readJson("dashboard.config.json");
  } catch (error) {
    state.alerts.push(`Config read warning: ${error.message}`);
    state.config = { readiness_score: 0, data_sources: [], schema_sources: [] };
  }

  await Promise.all((state.config.data_sources || []).map(async path => {
    const key = path.split("/").pop().replace(".example.json", "");
    try {
      state.records[key] = await readJson(path);
    } catch (error) {
      state.alerts.push(`Data read warning: ${error.message}`);
    }
  }));

  await Promise.all((state.config.schema_sources || []).map(async path => {
    try {
      await readJson(path);
    } catch (error) {
      state.alerts.push(`Schema read warning: ${error.message}`);
    }
  }));

  try {
    const report = await readText("../reports/KAIOS_V8_2_QA_REPORT.md");
    if (!report.includes("PASS")) state.alerts.push("QA report is readable but has no PASS marker.");
  } catch (error) {
    state.alerts.push(`QA report warning: ${error.message}`);
  }
}

function setHtml(id, html) {
  document.getElementById(id).innerHTML = html;
}

function list(items) {
  return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

function pillRow(items) {
  return `<div class="pill-row">${items.map(item => `<span class="pill">${item}</span>`).join("")}</div>`;
}

function renderSummary() {
  const records = Object.keys(state.records).length;
  const alerts = state.alerts.length;
  const score = Math.max(0, (state.config.readiness_score || 0) - alerts * 4);
  document.getElementById("healthScore").textContent = `${score}/100`;
  document.getElementById("healthText").textContent = alerts ? "Warnings require review" : "All public files readable";

  const cards = [
    ["KAIOS Version", state.config.version || "V8.2"],
    ["Readiness Score", `${score}/100`],
    ["Records", records],
    ["Schemas", (state.config.schema_sources || []).length],
    ["Alerts", alerts]
  ];
  setHtml("summary", cards.map(card => `<article class="summary-card"><span>${card[0]}</span><strong>${card[1]}</strong></article>`).join(""));
}

function renderPanels() {
  const economy = state.records.economy || {};
  const business = state.records.business || {};
  const market = state.records.market || {};
  const bank = state.records.bank || {};
  const signal = state.records.governance_signal || {};
  const resource = state.records.resource || {};

  setHtml("templeEconomy", `<h2>Temple Economy</h2>${list([
    `Temple: ${economy.temple_id || "unread"}`,
    `Economy: ${economy.economy_id || "unread"}`,
    `Stage: ${economy.stage || "unread"}`,
    `Boundary: ${economy.risk_boundary || "read-only simulation"}`
  ])}`);

  setHtml("citizenEconomy", `<h2>Citizen Economy</h2>${list([
    "Citizens work through Profession records.",
    "Wages, taxes and consumption are represented by transaction events.",
    "Reputation becomes a future upgrade signal."
  ])}`);

  setHtml("marketOverview", `<h2>Market Overview</h2>${list([
    `Market: ${market.market_id || "unread"}`,
    `Type: ${market.market_type || "unread"}`,
    `Liquidity Mode: ${market.liquidity_mode || "unread"}`,
    "No live order execution."
  ])}`);

  setHtml("businessRanking", `<h2>Business Ranking</h2>${list([
    `${business.business_type || "Business"} Level ${business.level || 0}`,
    `Revenue Signal: ${business.revenue || 0}`,
    `Expense Signal: ${business.expense || 0}`,
    `Growth Signal: ${business.growth || 0}`
  ])}${pillRow(business.upgrade_path || [])}`);

  setHtml("resourceFlow", `<h2>Resource Flow</h2>${list([
    `Resource: ${resource.resource_type || "unread"}`,
    `Quantity: ${resource.quantity || 0} ${resource.unit || ""}`,
    "Supply Chain: Producer -> Logistics -> Warehouse -> Retail -> Consumer -> Recycling"
  ])}`);

  setHtml("civilizationHealth", `<h2>Civilization Health</h2>${list([
    `GDP: ${signal.gdp || 0}`,
    `Population: ${signal.population || 0}`,
    `Employment: ${signal.employment || 0}`,
    `Health: ${signal.civilization_health || 0}`,
    `AI Activity: ${signal.ai_activity || 0}`
  ])}`);

  const alertItems = state.alerts.length ? state.alerts.map(alert => `<span class="status-warn">${alert}</span>`) : ["No read failures detected.", "Protected paths are not touched by this dashboard.", "Dashboard has no write controls."];
  setHtml("alerts", `<h2>Alerts</h2>${list(alertItems)}`);

  setHtml("nextTask", `<h2>Next Recommended Task</h2>${list([
    "V8.3 Civilization Simulation Engine",
    "Add time-step simulation, citizen behavior loop and economy stress test.",
    "Keep V8.2 dashboard read-only until production review."
  ])}`);
}

loadDashboard().finally(() => {
  renderSummary();
  renderPanels();
});
