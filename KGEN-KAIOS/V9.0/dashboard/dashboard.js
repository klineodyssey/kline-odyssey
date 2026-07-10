const state = { config: null, records: {}, alerts: [] };

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
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
}

function html(id, value) { document.getElementById(id).innerHTML = value; }
function list(items) { return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`; }

function renderSummary() {
  const score = Math.max(0, (state.config.readiness_score || 0) - state.alerts.length * 4);
  document.getElementById("healthScore").textContent = `${score}/100`;
  document.getElementById("healthText").textContent = state.alerts.length ? "Warnings require review" : "All public files readable";
  const cards = [["KAIOS Version", state.config.version || "V9.0"], ["Readiness Score", `${score}/100`], ["Records", Object.keys(state.records).length], ["Schemas", (state.config.schema_sources || []).length], ["Alerts", state.alerts.length]];
  html("summary", cards.map(card => `<article class="summary-card"><span>${card[0]}</span><strong>${card[1]}</strong></article>`).join(""));
}

function renderPanels() {
  const decision = state.records.ai_decision || {};
  const risk = state.records.ai_risk || {};
  const workorder = state.records.ai_workorder || {};
  const override = state.records.human_override || {};
  const review = state.records.codex_review || {};
  const observation = state.records.ai_observation || {};

  html("aiDecisions", `<h2>AI Decisions</h2>${list([`Decision: ${decision.decision_id || "unread"}`, `Confidence: ${decision.confidence || 0}`, `Status: ${decision.status || "unread"}`])}`);
  html("riskAlerts", `<h2>Risk Alerts</h2>${list([`Risk: ${risk.risk_level || "unread"}`, `Blocked: ${risk.blocked ? "Yes" : "No"}`, `Review: ${(risk.required_review || []).join(", ") || "unread"}`])}`);
  html("recommendedWorkorders", `<h2>Recommended WorkOrders</h2>${list([`Task: ${workorder.task_id || "unread"}`, `Priority: ${workorder.priority || "unread"}`, `Status: ${workorder.status || "unread"}`, `Reviewer: ${workorder.reviewer || "unread"}`])}`);
  html("civilizationHealth", `<h2>Civilization Health</h2>${list(["Reads V8.1 Universe state.", "Reads V8.2 economy health.", "Reads V8.3 time and governance signals."])}`);
  html("economySignals", `<h2>Economy Signals</h2>${list(["Recession scenario is simulation-only.", "Resource shortage requires reserve review.", "Market actions are not executed."])}`);
  html("templeSignals", `<h2>Temple Signals</h2>${list(["Temple activity decline detected in dry run context.", "Advisor may recommend service support.", "No real-world claim is made."])}`);
  html("citizenSignals", `<h2>Citizen Signals</h2>${list(["Unemployment increase requires support planning.", "Citizen recommendations are simulation-only.", "No real employment action is executed."])}`);
  html("humanOverrides", `<h2>Human Overrides</h2>${list([`Override: ${override.override_id || "unread"}`, `Action: ${override.new_state || "unread"}`, `Status: ${override.status || "unread"}`])}`);
  html("codexReviews", `<h2>Codex Reviews</h2>${list([`Review: ${review.review_id || "unread"}`, `Result: ${review.result || "unread"}`, `Status: ${review.status || "unread"}`])}`);
  html("alerts", `<h2>Alerts</h2>${list(state.alerts.length ? state.alerts.map(item => `<span class="status-warn">${item}</span>`) : [`Observation source: ${observation.source_path || "unread"}`, "Dashboard is read-only.", "AI cannot mark DRAFT as OPEN."])}`);
}

loadDashboard().finally(() => {
  renderSummary();
  renderPanels();
});
