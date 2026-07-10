(() => {
  "use strict";

  const STATUS_ORDER = ["OPEN", "CLAIMED", "IN_PROGRESS", "REVIEW", "APPROVED", "MERGED", "DONE", "REJECTED", "FIX", "BLOCKED"];
  const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  const state = {
    config: null,
    sources: [],
    alerts: [],
    workers: [],
    tasks: [],
    reviews: [],
    reports: []
  };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const stripTicks = (value) => String(value ?? "").replace(/^`|`$/g, "").trim();

  function addAlert(type, title, detail) {
    state.alerts.push({ type, title, detail });
  }

  async function fetchText(label, url, optional = false) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      state.sources.push({ label, url, status: "OK" });
      return text;
    } catch (error) {
      const status = optional ? "WARN" : "ERROR";
      state.sources.push({ label, url, status, message: error.message });
      addAlert(optional ? "warn" : "danger", `${label} 讀取失敗`, `${url} - ${error.message}`);
      return null;
    }
  }

  async function fetchJson(label, url, optional = false) {
    const text = await fetchText(label, url, optional);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      addAlert("danger", `${label} JSON parse failure`, error.message);
      const item = state.sources.find((source) => source.label === label);
      if (item) item.status = "ERROR";
      return null;
    }
  }

  function parseTableLine(line) {
    if (!line.trim().startsWith("|")) return null;
    if (/^\|\s*-+/.test(line)) return null;
    return line.split("|").slice(1, -1).map((cell) => cell.trim());
  }

  function isTaskId(value) {
    return /^[A-Z]+(?:-[A-Z0-9]+)+$/.test(value || "");
  }

  function parseWorkQueue(markdown) {
    const tasks = [];
    const taskMap = new Map();
    const lines = markdown.split(/\r?\n/);

    for (const line of lines) {
      const cells = parseTableLine(line);
      if (!cells || cells.length < 6) continue;
      const [taskId, status, owner, reviewer, priority, department] = cells;
      if (!isTaskId(taskId) || !STATUS_ORDER.includes(status)) continue;
      const task = {
        taskId,
        status,
        owner,
        reviewer,
        priority,
        department,
        branch: "",
        baseCommit: "",
        reportPath: "",
        acceptanceCriteria: [],
        queueOrder: tasks.length
      };
      if (cells.length >= 8) {
        task.branch = stripTicks(cells[6]);
        task.reportPath = stripTicks(cells[7]);
      } else {
        task.reportPath = stripTicks(cells[6]);
      }
      tasks.push(task);
      taskMap.set(taskId, task);
    }

    let current = null;
    let inCriteria = false;
    for (const line of lines) {
      const heading = line.match(/^###\s+([A-Z]+(?:-[A-Z0-9]+)+)\s+-\s+(.+)$/);
      if (heading) {
        current = taskMap.get(heading[1]) || null;
        if (current) current.title = heading[2].trim();
        inCriteria = false;
        continue;
      }
      if (!current) continue;
      const field = line.match(/^-\s+([^:]+):\s*(.*)$/);
      if (field) {
        const key = field[1].trim();
        const value = stripTicks(field[2].trim());
        inCriteria = false;
        if (key === "Status") current.status = value;
        if (key === "Owner") current.owner = value;
        if (key === "Reviewer") current.reviewer = value;
        if (key === "Priority") current.priority = value;
        if (key === "Branch") current.branch = value;
        if (key === "Output report path") current.reportPath = value;
        if (key === "Base Commit") current.baseCommit = value;
        if (key === "Acceptance criteria") inCriteria = true;
        continue;
      }
      if (/^-\s+Acceptance criteria:/.test(line)) {
        inCriteria = true;
        continue;
      }
      if (inCriteria) {
        const bullet = line.match(/^\s+-\s+(.+)$/);
        if (bullet) current.acceptanceCriteria.push(bullet[1].trim());
        if (line.trim() === "") inCriteria = false;
      }
    }
    return tasks;
  }

  function parseReviewLog(markdown) {
    const reviews = [];
    for (const line of markdown.split(/\r?\n/)) {
      const cells = parseTableLine(line);
      if (!cells || cells.length < 7 || cells[0] === "Date") continue;
      reviews.push({
        date: cells[0],
        taskId: cells[1],
        reportPath: cells[2],
        decision: cells[3],
        filesReviewed: cells[4],
        protectedPaths: cells[5],
        notes: cells[6]
      });
    }
    return reviews;
  }

  function extractReportPaths(text) {
    const paths = new Set();
    const pattern = /(?:KGEN-[A-Za-z0-9\-\/]+|docs\/[A-Za-z0-9_\.\-\/]+)\.(?:md|pdf|docx|json)/g;
    for (const match of text.matchAll(pattern)) paths.add(match[0]);
    return [...paths];
  }

  function classifyReport(path) {
    const lower = path.toLowerCase();
    if (lower.includes("dryrun") || lower.includes("dry_run")) return "Dry run reports";
    if (lower.includes("architecture") || lower.includes("decision")) return "Architecture decisions";
    if (lower.includes("qa") || lower.includes("validation")) return "QA reports";
    if (lower.includes("codex_review") || lower.includes("review_log")) return "Codex review reports";
    return "Worker reports";
  }

  function buildReports(reviewLogText, kaiosReportsText, aiReportsText, tasks) {
    const all = new Set();
    for (const task of tasks) if (task.reportPath) all.add(task.reportPath);
    for (const review of state.reviews) if (review.reportPath) all.add(review.reportPath);
    for (const text of [reviewLogText, kaiosReportsText, aiReportsText]) {
      if (!text) continue;
      for (const path of extractReportPaths(text)) all.add(path);
    }
    return [...all].sort().map((path) => ({ path, type: classifyReport(path) }));
  }

  function countStatuses(tasks) {
    const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]));
    for (const task of tasks) counts[task.status] = (counts[task.status] || 0) + 1;
    return counts;
  }

  function latestSuccessfulMerge(reviews) {
    for (let i = reviews.length - 1; i >= 0; i -= 1) {
      if (/APPROVED|MERGED|DONE/i.test(reviews[i].decision)) return reviews[i];
    }
    return null;
  }

  function recommendTask(tasks) {
    const candidates = tasks.filter((task) => ["OPEN", "FIX"].includes(task.status));
    candidates.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 9;
      const pb = PRIORITY_ORDER[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.queueOrder - b.queueOrder;
    });
    return candidates[0] || null;
  }

  function evaluateAlerts(tasks, reviews, config, sourceData) {
    const reviewTasks = tasks.filter((task) => task.status === "REVIEW");
    for (const task of reviewTasks) {
      if (!task.reportPath) addAlert("danger", "Missing report", `${task.taskId} is REVIEW but has no report path.`);
      if (!task.branch && task.owner === "Cursor") addAlert("warn", "Missing branch", `${task.taskId} is REVIEW but no handoff branch is recorded.`);
    }

    const latest = reviews[reviews.length - 1];
    if (latest && /protected/i.test(latest.protectedPaths) && !/no protected|pass/i.test(latest.protectedPaths)) {
      addAlert("danger", "Protected path violation", latest.protectedPaths);
    }

    if (!sourceData.buildInfo) addAlert("warn", "Main commit source", "build-info.json is generated by GitHub Pages deploy. Local preview may show WARN.");
    if (sourceData.workQueue && !sourceData.workQueue.includes("KAIOS-DRYRUN-001")) addAlert("warn", "WorkQueue check", "KAIOS dry run task not found in WorkQueue.");
    if (config.mode !== "read-only") addAlert("danger", "Readonly mode", "Dashboard config mode is not read-only.");
  }

  function renderHealth(config, buildInfo, reviews) {
    const latest = reviews[reviews.length - 1];
    const successful = latestSuccessfulMerge(reviews);
    $("kaiosVersion").textContent = config.version || "KAIOS";
    $("readinessScore").textContent = `${config.readiness_score ?? "WARN"} / 100`;
    $("mainCommit").textContent = buildInfo?.main_commit || config.base_main_commit || "WARN";
    $("lastReviewResult").textContent = latest ? `${latest.taskId}: ${latest.decision}` : "WARN";
    $("lastMerge").textContent = successful ? `${successful.taskId}: ${successful.decision}` : "WARN";
  }

  function renderWorkers(workers) {
    $("workerCount").textContent = `${workers.length} Workers`;
    $("workerRows").innerHTML = workers.length ? workers.map((worker) => `
      <tr>
        <td>${escapeHtml(worker.worker_id)}</td>
        <td>${escapeHtml(worker.worker_type)}</td>
        <td>${escapeHtml(worker.role)}</td>
        <td>${escapeHtml(worker.current_task || "-")}</td>
        <td>${escapeHtml(worker.current_branch || "-")}</td>
        <td><span class="status ${escapeHtml(worker.status || "")}">${escapeHtml(worker.status || "UNKNOWN")}</span></td>
        <td>${escapeHtml(worker.heartbeat || "-")}</td>
        <td>${worker.can_push_main ? "true" : "false"}</td>
        <td>${escapeHtml(worker.reviewer || "-")}</td>
      </tr>`).join("") : `<tr><td colspan="9">No worker data</td></tr>`;
  }

  function renderStatusGrid(tasks) {
    const counts = countStatuses(tasks);
    $("taskCount").textContent = `${tasks.length} Tasks`;
    $("statusGrid").innerHTML = STATUS_ORDER.map((status) => `
      <div class="status-card">
        <span>${status}</span>
        <strong>${counts[status] || 0}</strong>
      </div>`).join("");
  }

  function renderTasks(tasks) {
    const active = tasks.filter((task) => !["DONE", "MERGED"].includes(task.status)).slice(0, 30);
    $("taskRows").innerHTML = active.length ? active.map((task) => `
      <tr>
        <td>${escapeHtml(task.taskId)}</td>
        <td>${escapeHtml(task.priority || "-")}</td>
        <td>${escapeHtml(task.owner || "-")}</td>
        <td>${escapeHtml(task.reviewer || "-")}</td>
        <td>${escapeHtml(task.branch || "-")}</td>
        <td>${escapeHtml(task.baseCommit || "-")}</td>
        <td><span class="status ${escapeHtml(task.status)}">${escapeHtml(task.status)}</span></td>
        <td>${task.reportPath ? `<a href="${toRelativeLink(task.reportPath)}">${escapeHtml(task.reportPath)}</a>` : "-"}</td>
        <td>${escapeHtml((task.acceptanceCriteria || []).slice(0, 2).join("; ") || "-")}</td>
      </tr>`).join("") : `<tr><td colspan="9">No active tasks</td></tr>`;

    const next = recommendTask(tasks);
    $("nextTaskPill").textContent = next ? `Next: ${next.taskId}` : "Next: None";
    $("nextRecommended").innerHTML = next
      ? `<strong>${escapeHtml(next.taskId)}</strong> - ${escapeHtml(next.priority || "-")} / ${escapeHtml(next.department || "-")} / ${escapeHtml(next.status)}<br><span>依 Status、Priority、Queue order 推薦；Dashboard 只顯示，不自動執行。</span>`
      : "目前沒有可執行 OPEN / FIX 任務。";
  }

  function renderPipeline(reviews, tasks) {
    const latest = reviews[reviews.length - 1] || {};
    const latestReviewTask = tasks.find((task) => task.status === "REVIEW") || null;
    const pairs = [
      ["Latest handoff branch", latestReviewTask?.branch || "No REVIEW handoff branch recorded"],
      ["Latest Cursor commit", extractCommit(latest.filesReviewed || latest.notes || "") || "WARN"],
      ["Latest Codex review", latest.taskId ? `${latest.taskId} / ${latest.decision}` : "WARN"],
      ["Merge result", latest.decision || "WARN"],
      ["Protected path check result", latest.protectedPaths || "WARN"]
    ];
    $("pipelineList").innerHTML = pairs.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("");
  }

  function extractCommit(text) {
    const match = String(text || "").match(/[0-9a-f]{7,40}/i);
    return match ? match[0] : "";
  }

  function toRelativeLink(path) {
    if (!path) return "#";
    if (path.startsWith("KGEN-KAIOS/")) return `../../${path}`;
    if (path.startsWith("KGEN-")) return `../../${path}`;
    if (path.startsWith("docs/")) return `../../${path}`;
    return path;
  }

  function renderReports(reports) {
    const groups = new Map();
    for (const report of reports) {
      if (!groups.has(report.type)) groups.set(report.type, []);
      groups.get(report.type).push(report.path);
    }
    const preferred = ["Worker reports", "Codex review reports", "Dry run reports", "Architecture decisions", "QA reports"];
    $("reportGrid").innerHTML = preferred.map((type) => {
      const items = groups.get(type) || [];
      return `<div class="report-card"><h3>${escapeHtml(type)}</h3>${items.length ? items.slice(0, 8).map((path) => `<p><a href="${toRelativeLink(path)}">${escapeHtml(path)}</a></p>`).join("") : `<p>No report discovered</p>`}</div>`;
    }).join("");
  }

  function renderAlerts(alerts) {
    $("alertCount").textContent = `${alerts.length} Alerts`;
    $("alertsList").innerHTML = alerts.length
      ? alerts.map((alert) => `<li class="${escapeHtml(alert.type)}"><strong>${escapeHtml(alert.title)}</strong><br>${escapeHtml(alert.detail)}</li>`).join("")
      : `<li class="ok"><strong>No active alerts</strong><br>公開資料來源已讀取，未偵測到阻斷性警示。</li>`;
  }

  function renderSources(sources) {
    $("sourceList").innerHTML = sources.map((source) => `
      <div class="source-card ${source.status === "OK" ? "ok" : "warn"}">
        <h3>${escapeHtml(source.status)} - ${escapeHtml(source.label)}</h3>
        <p>${escapeHtml(source.url)}</p>
        ${source.message ? `<p>${escapeHtml(source.message)}</p>` : ""}
      </div>`).join("");
  }

  async function boot() {
    const config = await fetchJson("Dashboard config", "./dashboard.config.json");
    if (!config) {
      renderAlerts(state.alerts);
      return;
    }
    state.config = config;
    const sources = config.sources;

    const [buildInfo, workerRegistry, workQueue, reviewLog, kaiosReports, aiReports, claimSchema, statusSchema] = await Promise.all([
      fetchJson("Build info", sources.build_info, true),
      fetchJson("Worker registry", sources.worker_registry),
      fetchText("WorkQueue", sources.work_queue),
      fetchText("Codex review log", sources.codex_review_log),
      fetchText("KAIOS reports README", sources.kaios_reports_readme, true),
      fetchText("AI Company reports README", sources.ai_company_reports_readme, true),
      fetchJson("Task claim schema", sources.task_claim_schema),
      fetchJson("Worker status schema", sources.worker_status_schema)
    ]);

    state.workers = workerRegistry?.workers || [];
    state.tasks = workQueue ? parseWorkQueue(workQueue) : [];
    state.reviews = reviewLog ? parseReviewLog(reviewLog) : [];
    state.reports = buildReports(reviewLog, kaiosReports, aiReports, state.tasks);

    evaluateAlerts(state.tasks, state.reviews, config, { buildInfo, workQueue, claimSchema, statusSchema });
    renderHealth(config, buildInfo, state.reviews);
    renderWorkers(state.workers);
    renderStatusGrid(state.tasks);
    renderTasks(state.tasks);
    renderPipeline(state.reviews, state.tasks);
    renderReports(state.reports);
    renderAlerts(state.alerts);
    renderSources(state.sources);
  }

  boot().catch((error) => {
    addAlert("danger", "Dashboard crash prevented", error.message);
    renderAlerts(state.alerts);
  });
})();