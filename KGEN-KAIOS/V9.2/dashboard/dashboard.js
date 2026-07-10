const els = {
  healthCards: document.getElementById("healthCards"),
  syncRows: document.getElementById("syncRows"),
  statusList: document.getElementById("statusList"),
  alerts: document.getElementById("alerts"),
  audit: document.getElementById("audit")
};

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function tone(status) {
  if (["SYNC_READY", "OPEN"].includes(status)) return "ok";
  if (["SYNC_PENDING", "SYNC_VALIDATING", "HUMAN_PAUSED", "SYNC_ROLLBACK_PENDING"].includes(status)) return "warn";
  if (["SYNC_REJECTED", "SYNC_CONFLICT"].includes(status)) return "stop";
  return "info";
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function card(label, value, className = "info") {
  return `<article><span>${html(label)}</span><strong class="${className}">${html(value)}</strong></article>`;
}

function renderHealth(config, result, warnings) {
  els.healthCards.innerHTML = [
    card("KAIOS Version", config.version, "info"),
    card("Readiness Score", config.readiness_score, "ok"),
    card("Mode", config.mode, "info"),
    card("WorkOrder", config.workorder_id, "info"),
    card("Sync Status", result?.new_status || "WAITING", tone(result?.new_status)),
    card("Dispatch Hold", result?.dispatch_hold ? "TRUE" : "UNKNOWN", result?.dispatch_hold ? "warn" : "info"),
    card("Alerts", warnings.length, warnings.length ? "warn" : "ok")
  ].join("");
}

function renderRows(config, result) {
  els.syncRows.innerHTML = `
    <tr>
      <td>${html(result?.source_draft_id || config.source_draft_id)}</td>
      <td>${html(result?.formal_workorder_id || config.workorder_id)}</td>
      <td class="${tone(result?.new_status)}">${html(result?.new_status || "WAITING")}</td>
      <td>${result?.dispatch_hold ? "true" : "unknown"}</td>
      <td>${html(result?.reviewer || "Codex")}</td>
    </tr>
  `;
}

function renderStatusList(config, result) {
  const current = result?.new_status || "WAITING";
  els.statusList.innerHTML = (config.statuses || []).map((status) => `
    <div class="${status === current ? tone(status) : ""}"><strong>${html(status)}</strong> ${status === current ? "1" : "0"}</div>
  `).join("");
}

function renderAlerts(warnings) {
  els.alerts.innerHTML = warnings.length
    ? warnings.map((warning) => `<div class="warn">${html(warning)}</div>`).join("")
    : `<div class="ok">No active dashboard alerts.</div>`;
}

function renderAudit(result) {
  els.audit.innerHTML = result
    ? `<div><strong>${html(result.formal_workorder_id)}</strong><p>${html(result.previous_status)} -> ${html(result.new_status)}</p></div>`
    : `<div class="warn">Sync result not available yet.</div>`;
}

async function boot() {
  const warnings = [];
  let config;
  let result = null;

  try {
    config = await loadJson("dashboard.config.json");
  } catch (error) {
    config = {
      version: "V9.2",
      readiness_score: "WARN",
      mode: "read-only",
      workorder_id: "AI-ECONOMY-2026-0001",
      source_draft_id: "V9-DRYRUN-001A",
      statuses: []
    };
    warnings.push(`Config unavailable: ${error.message}`);
  }

  try {
    result = await loadJson(config.data_sources.sync_result);
  } catch (error) {
    warnings.push(`Sync result unavailable: ${error.message}`);
  }

  renderHealth(config, result, warnings);
  renderRows(config, result);
  renderStatusList(config, result);
  renderAlerts(warnings);
  renderAudit(result);
}

boot();
