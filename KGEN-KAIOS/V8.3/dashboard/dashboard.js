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
  const cards = [
    ["KAIOS Version", state.config.version || "V8.3"],
    ["Readiness Score", `${score}/100`],
    ["Records", Object.keys(state.records).length],
    ["Schemas", (state.config.schema_sources || []).length],
    ["Alerts", state.alerts.length]
  ];
  html("summary", cards.map(card => `<article class="summary-card"><span>${card[0]}</span><strong>${card[1]}</strong></article>`).join(""));
}

function renderPanels() {
  const clock = state.records.world_clock || {};
  const tick = state.records.simulation_tick || {};
  const citizen = state.records.citizen_behavior || {};
  const business = state.records.business_behavior || {};
  const temple = state.records.temple_activity || {};
  const event = state.records.event || {};
  const governance = state.records.governance_response || {};

  html("worldClock", `<h2>World Clock</h2>${list([`Clock: ${clock.clock_id || "unread"}`, `Scope: ${clock.clock_scope || "unread"}`, `Tick Rate: ${clock.tick_rate || "unread"}`, `Cycle: ${clock.cycle || "unread"}`])}`);
  html("tickStatus", `<h2>Tick Status</h2>${list([`Tick: ${tick.tick_id || "unread"}`, `Scale: ${tick.tick_scale || "unread"}`, `Phase: ${tick.phase || "unread"}`, `Updated Entities: ${(tick.updated_entities || []).length}`])}`);
  html("timelineHealth", `<h2>Timeline Health</h2>${list(["Snapshots are read-only.", "Simulation is ReviewOnly.", "No production clock advancement."])}`);
  html("citizenBehavior", `<h2>Citizen Behavior</h2>${list([`Citizen: ${citizen.citizen_id || "unread"}`, `Actions: ${(citizen.actions || []).join(", ") || "unread"}`, `Energy Delta: ${citizen.energy_delta || 0}`])}`);
  html("businessBehavior", `<h2>Business Behavior</h2>${list([`Business: ${business.business_id || "unread"}`, `Production Delta: ${business.production_delta || 0}`, `Revenue Delta: ${business.revenue_delta || 0}`, `Risk: ${business.risk_warning || "unread"}`])}`);
  html("templeActivity", `<h2>Temple Activity</h2>${list([`Temple: ${temple.temple_id || "unread"}`, `Service: ${temple.service_activity || 0}`, `Faith: ${temple.faith_value || 0}`, `Festival Readiness: ${temple.festival_readiness || 0}`])}`);
  html("eventEngine", `<h2>Event Engine</h2>${list([`Event: ${event.event_id || "unread"}`, `Type: ${event.event_type || "unread"}`, `Severity: ${event.severity || "unread"}`, `Boundary: Prototype simulation event only.`])}`);
  html("governanceResponse", `<h2>Governance Response</h2>${list([`Response: ${governance.response_id || "unread"}`, `Risk: ${governance.risk_class || "unread"}`, `Type: ${governance.response_type || "unread"}`, `Codex Review: ${governance.codex_review_required ? "Required" : "Not required"}`])}`);
  html("alerts", `<h2>Alerts</h2>${list(state.alerts.length ? state.alerts.map(item => `<span class="status-warn">${item}</span>`) : ["No read failures detected.", "Dashboard is read-only.", "Protected paths are not touched."])}`);
}

loadDashboard().finally(() => {
  renderSummary();
  renderPanels();
});
