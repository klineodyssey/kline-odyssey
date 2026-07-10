const fetchJson = async (path) => {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return response.json();
};

const card = (label, value, note = "", state = "ok") => `
  <article class="card">
    <span class="muted">${label}</span>
    <strong class="${state}">${value}</strong>
    ${note ? `<small>${note}</small>` : ""}
  </article>
`;

async function boot() {
  const alerts = [];
  const config = await fetchJson("dashboard.config.json");
  const load = async (key) => {
    try {
      return await fetchJson(config.sources[key]);
    } catch (error) {
      alerts.push(`WARN: ${key} 讀取失敗 (${error.message})`);
      return null;
    }
  };

  const [kos, membership, wallet, payment, marketplace, agent, dryrun] = await Promise.all([
    load("operating_system"),
    load("membership"),
    load("wallet"),
    load("payment"),
    load("marketplace"),
    load("ai_agent"),
    load("dry_run")
  ]);

  document.querySelector("#health").innerHTML = [
    card("KAIOS Version", config.kaios_version),
    card("Architecture Score", `${config.architecture_score}/100`),
    card("Service Count", config.service_count),
    card("Schema Count", config.schema_count),
    card("Runtime Count", config.runtime_count),
    card("Mode", config.mode, "No writes, no tokens, no signing")
  ].join("");

  document.querySelector("#services").innerHTML = config.service_domains.map((domain) => `
    <article class="service">
      <span class="muted">${domain}</span>
      <strong class="ok">Mapped</strong>
      <small>Concept / Prototype boundary</small>
    </article>
  `).join("");

  document.querySelector("#boundaries").innerHTML = [
    card("Membership", membership?.status || "WARN", membership?.verification || "", membership ? "ok" : "warn"),
    card("Wallet", wallet?.status || "WARN", wallet?.prototype_only ? "prototype only" : "", wallet ? "ok" : "warn"),
    card("Payment", payment?.status || "WARN", payment?.no_real_settlement ? "no real settlement" : "", "warn"),
    card("Marketplace", marketplace?.status || "WARN", marketplace?.legal_boundary || "", "warn"),
    card("AI Agent", agent?.agent_id || "WARN", agent?.can_push_main === false ? "cannot push main" : "", agent ? "ok" : "warn"),
    card("Protected Paths", kos?.protected_paths?.length || "WARN", "unchanged")
  ].join("");

  document.querySelector("#dryrun").innerHTML = (dryrun?.steps || []).map((step) => `<li>${step}</li>`).join("");
  document.querySelector("#alerts").innerHTML = alerts.length
    ? alerts.map((alert) => `<li class="warn">${alert}</li>`).join("")
    : `<li class="ok">Dashboard is read-only and all configured sources loaded.</li>`;
}

boot().catch((error) => {
  document.querySelector("#alerts").innerHTML = `<li class="warn">Dashboard failed safely: ${error.message}</li>`;
});
