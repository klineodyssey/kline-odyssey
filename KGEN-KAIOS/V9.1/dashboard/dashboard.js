const els = {
  healthCards: document.getElementById("healthCards"),
  draftRows: document.getElementById("draftRows"),
  riskList: document.getElementById("riskList"),
  alerts: document.getElementById("alerts"),
  history: document.getElementById("history")
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

function classForStatus(status) {
  if (["APPROVED_FOR_OPEN", "OPEN", "DONE"].includes(status)) return "ok";
  if (["NEEDS_REVISION", "BLOCKED", "UNDER_REVIEW"].includes(status)) return "warn";
  if (["REJECTED", "ARCHIVED"].includes(status)) return "stop";
  return "info";
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadConfig() {
  return loadJson("dashboard.config.json");
}

function healthCard(label, value, tone = "info") {
  return `
    <article>
      <span>${html(label)}</span>
      <strong class="${tone}">${html(value)}</strong>
    </article>
  `;
}

function renderHealth(config, decisions, warnings) {
  const promoted = decisions.filter((item) => item.promote_to_open).length;
  const revision = decisions.filter((item) => item.new_status === "NEEDS_REVISION").length;
  const stopped = decisions.filter((item) => ["REJECTED", "BLOCKED", "ARCHIVED"].includes(item.new_status)).length;
  els.healthCards.innerHTML = [
    healthCard("KAIOS Version", config.version, "info"),
    healthCard("Readiness Score", config.readiness_score, "ok"),
    healthCard("Mode", config.mode, "info"),
    healthCard("Promote", promoted, "ok"),
    healthCard("Revision", revision, revision ? "warn" : "ok"),
    healthCard("Rejected / Blocked", stopped, stopped ? "stop" : "ok"),
    healthCard("Alerts", warnings.length, warnings.length ? "warn" : "ok")
  ].join("");
}

function renderRows(decisions) {
  els.draftRows.innerHTML = decisions.map((decision) => `
    <tr>
      <td>${html(decision.task_id)}</td>
      <td>${html(decision.risk_level)}</td>
      <td class="${classForStatus(decision.new_status)}">${html(decision.new_status)}</td>
      <td>${decision.promote_to_open ? "YES" : "NO"}</td>
      <td>${decision.required_follow_up?.some((item) => item.includes("Human")) ? "YES" : "NO"}</td>
    </tr>
  `).join("");
}

function renderRisk(decisions) {
  const counts = decisions.reduce((acc, decision) => {
    acc[decision.risk_level] = (acc[decision.risk_level] || 0) + 1;
    return acc;
  }, {});
  els.riskList.innerHTML = ["R0", "R1", "R2", "R3", "R4"].map((risk) => `
    <div><strong>${risk}</strong> ${counts[risk] || 0}</div>
  `).join("");
}

function renderAlerts(warnings) {
  els.alerts.innerHTML = warnings.length
    ? warnings.map((warning) => `<div class="warn">${html(warning)}</div>`).join("")
    : `<div class="ok">No active dashboard alerts.</div>`;
}

function renderHistory(decisions) {
  els.history.innerHTML = decisions.map((decision) => `
    <div>
      <strong>${html(decision.task_id)}</strong>
      <p>${html(decision.reason)}</p>
      <span class="${classForStatus(decision.new_status)}">${html(decision.new_status)}</span>
    </div>
  `).join("");
}

async function boot() {
  const warnings = [];
  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    config = {
      version: "V9.1",
      readiness_score: "WARN",
      mode: "read-only",
      review_decisions: []
    };
    warnings.push(`Config load failed: ${error.message}`);
  }

  const decisions = [];
  for (const path of config.review_decisions || []) {
    try {
      decisions.push(await loadJson(path));
    } catch (error) {
      warnings.push(`Review decision unavailable: ${path}`);
    }
  }

  renderHealth(config, decisions, warnings);
  renderRows(decisions);
  renderRisk(decisions);
  renderAlerts(warnings);
  renderHistory(decisions);
}

boot();
