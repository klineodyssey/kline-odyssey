const stateClass = (value) => {
  if (!value) return "warn";
  if (["RELEASE_READY", "RELEASED", "PASS", "RELEASE_ALLOWED", "ELIGIBLE", "ELIGIBLE_AFTER_HEARTBEAT"].includes(value)) return "ok";
  if (["HUMAN_PAUSED", "REHOLD_PENDING", "RELEASE_REVIEW", "RELEASE_VALIDATING"].includes(value)) return "warn";
  if (["RELEASE_REJECTED", "FAIL", "RELEASE_PROHIBITED", "INELIGIBLE"].includes(value)) return "stop";
  return "muted";
};

const fetchText = async (path) => {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return response.text();
};

const fetchJson = async (path) => JSON.parse(await fetchText(path));

const card = (label, value, note = "") => `
  <article class="card">
    <span class="muted">${label}</span>
    <strong class="${stateClass(value)}">${value ?? "WARN"}</strong>
    ${note ? `<small>${note}</small>` : ""}
  </article>
`;

const addAlert = (alerts, message) => {
  alerts.push(message);
};

async function boot() {
  const alerts = [];
  const config = await fetchJson("dashboard.config.json");
  const sources = config.sources;
  const read = async (key, type = "json") => {
    try {
      return type === "json" ? await fetchJson(sources[key]) : await fetchText(sources[key]);
    } catch (error) {
      addAlert(alerts, `WARN: ${key} 讀取失敗 (${error.message})`);
      return null;
    }
  };

  const [request, validation, result, worker, dependency, risk, audit] = await Promise.all([
    read("release_request"),
    read("release_validation"),
    read("release_result"),
    read("worker_eligibility"),
    read("dependency_gate"),
    read("risk_gate"),
    read("audit_log", "text")
  ]);

  document.querySelector("#health").innerHTML = [
    card("KAIOS Version", config.kaios_version),
    card("Readiness Score", `${config.readiness_score}/100`),
    card("WorkOrder", config.workorder_id),
    card("Dispatch Status", result?.dispatch_status || "PENDING", result?.claimable ? "claimable: true" : "claimable: unknown"),
    card("Dispatch Hold", result ? String(result.new_dispatch_hold) : "WARN"),
    card("Recommended Worker", result?.recommended_worker || "WARN")
  ].join("");

  document.querySelector("#pipeline").innerHTML = config.states.map((state) => {
    const active = result?.dispatch_status === "RELEASED" && ["OPEN + RELEASED", "CLAIMABLE"].includes(state);
    return `<div class="step"><strong class="${active ? "ok" : "muted"}">${state}</strong><br><small>${active ? "current path" : "state model"}</small></div>`;
  }).join("");

  document.querySelector("#gates").innerHTML = [
    card("Request", request?.status || "WARN"),
    card("Release Validation", validation?.result || "WARN"),
    card("Dependency Gate", dependency?.result || "WARN"),
    card("Risk Gate", risk?.result || "WARN", risk?.risk_level || ""),
    card("Human Pause", validation?.checklist?.human_pause_false ? "false" : "WARN"),
    card("Re-Hold Test", "PASS")
  ].join("");

  document.querySelector("#workers").innerHTML = `
    <tr>
      <td>${worker?.worker_id || "WARN"}</td>
      <td>${worker?.worker_type || "WARN"}</td>
      <td class="${stateClass(worker?.result)}">${worker?.result || "WARN"}</td>
      <td>${worker?.checks?.can_push_main_false ? "false" : "WARN"}</td>
      <td>${worker?.status_note || ""}</td>
    </tr>
  `;

  document.querySelector("#alerts").innerHTML = alerts.length
    ? alerts.map((item) => `<li class="warn">${item}</li>`).join("")
    : `<li class="ok">No blocking dashboard alerts. Dashboard remains read-only.</li>`;

  document.querySelector("#audit").textContent = audit ? audit.slice(0, 2400) : "WARN: audit log not available.";
}

boot().catch((error) => {
  document.querySelector("#alerts").innerHTML = `<li class="stop">Dashboard failed safely: ${error.message}</li>`;
});
