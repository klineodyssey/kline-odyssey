(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function fetchText(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.text();
  }

  async function fetchJson(path) {
    return JSON.parse(await fetchText(path));
  }

  function parseJsonLines(text) {
    return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
  }

  function statusClass(status) {
    return String(status || "").replace(/[^A-Z_]/g, "");
  }

  function renderSummary(snapshot) {
    const decisions = snapshot.decisions || {};
    const attendance = snapshot.attendance || {};
    const queue = snapshot.workqueue || {};
    $("decisionCount").textContent = decisions.today ?? 0;
    $("pendingCount").textContent = decisions.pending ?? 0;
    $("approvedCount").textContent = decisions.approved ?? 0;
    $("rejectedCount").textContent = decisions.rejected ?? 0;
    $("attendanceCount").textContent = attendance.on_duty ?? 0;
    $("openTaskCount").textContent = queue.open ?? 0;

    const daily = snapshot.daily_operation || {};
    const ready = Boolean(daily.ready_for_human_task);
    $("readyValue").textContent = ready ? "YES" : "NO";
    $("readyBand").classList.toggle("pass", ready);
    $("updatedAt").textContent = `Snapshot: ${snapshot.metadata?.updated_at || "unknown"}`;

    const gates = [
      ["Daily Operation", daily.completed ? "PASS" : "FAIL"],
      ["Pending Handoff", daily.pending_handoff ?? "WARN"],
      ["Pending Review", daily.pending_review ?? "WARN"],
      ["Pending Push", daily.pending_push ?? "WARN"],
      ["Protected Path Alerts", daily.protected_path_alerts ?? "WARN"],
      ["Main Commit", snapshot.main_commit || "WARN"]
    ];
    $("gateList").innerHTML = gates.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("");
  }

  function renderHealth(dashboard) {
    $("healthList").innerHTML = (dashboard.health || []).map((item) => `
      <div class="health-item">
        <strong>${escapeHtml(item.service)}</strong>
        <span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
        <small>${escapeHtml(item.evidence)}</small>
      </div>`).join("") || "<p>No health data</p>";

    $("pagesList").innerHTML = (dashboard.pages_checks || []).map((item) => `
      <div class="page-item">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="status ${item.status === 200 ? "HEALTHY" : "FAIL"}">HTTP ${escapeHtml(item.status)}</span>
        <small><a href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a></small>
      </div>`).join("") || "<p>No Pages data</p>";

    $("sourceList").innerHTML = (dashboard.data_sources || []).map((source) => `<li>${escapeHtml(source)}</li>`).join("");
  }

  function renderDecisions(decisions) {
    $("decisionRows").innerHTML = decisions.length ? decisions.slice().reverse().map((item) => `
      <tr>
        <td>${escapeHtml(item.decision_id)}</td>
        <td>${escapeHtml(item.decision_type)}</td>
        <td><span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.reason)}</td>
        <td>${escapeHtml(item.chosen_option)}</td>
        <td>${escapeHtml(item.risk)}</td>
        <td>${escapeHtml(item.rollback)}</td>
      </tr>`).join("") : '<tr><td colspan="7">No decisions</td></tr>';
  }

  function renderQueue(queue) {
    const items = queue.items || [];
    $("decisionQueue").innerHTML = items.length
      ? items.map((item) => `<p><strong>${escapeHtml(item.decision_id)}</strong> ${escapeHtml(item.status)}</p>`).join("")
      : `<strong>${escapeHtml(queue.queue_status || "CLEAR")}</strong><p>目前沒有待決項目。重大決策仍永久保留於 decision_log.jsonl。</p>`;
  }

  async function boot() {
    try {
      const [snapshot, queue, dashboard, logText] = await Promise.all([
        fetchJson("./decision_snapshot.json"),
        fetchJson("./decision_queue.json"),
        fetchJson("./decision_dashboard.json"),
        fetchText("./decision_log.jsonl")
      ]);
      renderSummary(snapshot);
      renderHealth(dashboard);
      renderDecisions(parseJsonLines(logText));
      renderQueue(queue);
    } catch (error) {
      $("readyValue").textContent = "WARN";
      $("updatedAt").textContent = error.message;
      $("decisionRows").innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  boot();
})();
