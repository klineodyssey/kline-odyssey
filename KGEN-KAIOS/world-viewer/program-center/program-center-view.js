const PROGRAMS_URL = new URL("../../../api/kaios/charter/programs/index.json", import.meta.url);
const STATUS_URL = new URL("../../../api/kaios/charter/programs/status.json", import.meta.url);

const FILTERS = [
  "ALL",
  "IMPLEMENTED",
  "PARTIAL",
  "SPECIFICATION_ONLY",
  "MISSING",
  "CONFLICT",
  "HELD",
  "FOUNDATION",
  "ECONOMY",
  "CIVILIZATION",
  "GOVERNANCE",
  "ADVANCED"
];

const ECONOMY_DOMAINS = new Set([
  "AI_ECONOMY", "BANKING", "COMMERCE", "FINANCE", "TAXATION", "INSURANCE",
  "CENTRAL_BANK", "CAPITAL_MARKETS", "PENSIONS", "ACCOUNTING", "BANKRUPTCY",
  "PROCUREMENT", "SUPPLY_CHAIN", "MANUFACTURING", "INDUSTRY"
]);

const GOVERNANCE_DOMAINS = new Set([
  "GOVERNANCE", "JUSTICE", "COURTS", "DEMOCRACY", "LEGISLATURE", "EXECUTIVE",
  "AUDIT", "HUMAN_RIGHTS", "DIPLOMACY", "DEFENSE", "EMERGENCY", "PUBLIC_SAFETY"
]);

export function createProgramCenterView(container, { fetchImpl = globalThis.fetch } = {}) {
  let programs = [];
  let foundationStatus = null;
  let state = "LOADING";
  let errorMessage = "";
  let filter = "ALL";
  let query = "";

  async function load() {
    state = "LOADING";
    render();
    try {
      const [response, statusResponse] = await Promise.all([
        fetchImpl(PROGRAMS_URL, { cache: "no-store" }),
        fetchImpl(STATUS_URL, { cache: "no-store" })
      ]);
      if (!response.ok || !statusResponse.ok) throw new Error(`HTTP ${response.status}/${statusResponse.status}`);
      const [payload, statusPayload] = await Promise.all([response.json(), statusResponse.json()]);
      if (payload?.read_only !== true || payload?.mutation_endpoints !== false || !Array.isArray(payload?.programs)) {
        throw new Error("Program registry failed the read-only contract");
      }
      if (statusPayload?.read_only !== true
        || statusPayload?.foundation_gap_closure_v1?.production_authority !== false
        || !Array.isArray(statusPayload?.foundation_gap_closure_v1?.components)) {
        throw new Error("Program status failed the simulation-only contract");
      }
      programs = payload.programs;
      foundationStatus = statusPayload.foundation_gap_closure_v1;
      state = programs.length ? "READY" : "EMPTY";
      errorMessage = "";
    } catch (error) {
      state = "ERROR";
      errorMessage = error instanceof Error ? error.message : "Unknown loading error";
    }
    render();
    return state;
  }

  function matches(program) {
    if (query) {
      const haystack = `${program.program_id} ${program.chapter_title} ${program.program_name} ${program.domain}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    switch (filter) {
      case "IMPLEMENTED": return program.implementation_status.startsWith("IMPLEMENTED");
      case "PARTIAL": return program.implementation_status === "IMPLEMENTED_PARTIAL";
      case "SPECIFICATION_ONLY": return program.implementation_status === "SPECIFICATION_ONLY";
      case "MISSING": return program.implementation_status === "MISSING";
      case "CONFLICT": return program.conflicts.length > 0;
      case "HELD": return program.priority.startsWith("HOLD_") || program.authorized_mode === "PROHIBITED_UNDER_CURRENT_BOUNDARY";
      case "FOUNDATION": return program.priority === "P0_FOUNDATION";
      case "ECONOMY": return ECONOMY_DOMAINS.has(program.domain);
      case "CIVILIZATION": return program.priority === "P2_ECONOMY_CIVILIZATION";
      case "GOVERNANCE": return GOVERNANCE_DOMAINS.has(program.domain);
      case "ADVANCED": return program.priority === "P4_ADVANCED_TECHNOLOGY" || program.priority === "P5_PLANETARY_MULTIVERSE";
      default: return true;
    }
  }

  function render() {
    container.replaceChildren();
    const root = document.createElement("section");
    root.className = "program-center";
    root.setAttribute("aria-label", "KAIOS Genesis Charter Program Center");

    const boundary = document.createElement("p");
    boundary.className = "program-center__boundary";
    boundary.textContent = "READ_ONLY REQUIREMENTS • NO RUNTIME ACTIVATION • NO WALLET • NO KGEN";
    root.append(boundary);

    if (foundationStatus) {
      const foundation = document.createElement("p");
      foundation.className = "program-center__foundation";
      foundation.textContent = `Foundation Gap Closure V1 • ${foundationStatus.status} • ${foundationStatus.components.length} bounded adapters`;
      root.append(foundation);
    }

    if (state === "LOADING") {
      root.append(statusMessage("Loading Charter program registry…", "status"));
      container.append(root);
      return;
    }
    if (state === "ERROR") {
      const message = statusMessage(`Program registry unavailable: ${errorMessage}`, "alert");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "program-center__retry";
      retry.textContent = "Retry";
      retry.addEventListener("click", load, { once: true });
      root.append(message, retry);
      container.append(root);
      return;
    }
    if (state === "EMPTY") {
      root.append(statusMessage("No reviewed Program Units are available.", "status"));
      container.append(root);
      return;
    }

    const controls = document.createElement("div");
    controls.className = "program-center__controls";
    const search = document.createElement("input");
    search.type = "search";
    search.value = query;
    search.placeholder = "Search chapter, program, or domain";
    search.setAttribute("aria-label", "Search Charter programs");
    search.addEventListener("input", () => {
      query = search.value.trim();
      render();
      requestAnimationFrame(() => container.querySelector("input[type=search]")?.focus());
    });
    controls.append(search);

    const filters = document.createElement("div");
    filters.className = "program-center__filters";
    filters.setAttribute("aria-label", "Program filters");
    for (const value of FILTERS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = value.replaceAll("_", " ");
      button.setAttribute("aria-pressed", String(filter === value));
      button.addEventListener("click", () => {
        filter = value;
        render();
      });
      filters.append(button);
    }
    controls.append(filters);
    root.append(controls);

    const visible = programs.filter(matches);
    const summary = document.createElement("p");
    summary.className = "program-center__summary";
    summary.textContent = `${visible.length} of ${programs.length} reviewed Program Units`;
    root.append(summary);

    const list = document.createElement("div");
    list.className = "program-center__list";
    for (const program of visible) list.append(programCard(program));
    if (!visible.length) list.append(statusMessage("No Program Units match this filter.", "status"));
    root.append(list);
    container.append(root);
  }

  function destroy() {
    programs = [];
    foundationStatus = null;
    container.replaceChildren();
  }

  return { load, render, destroy, getState: () => ({ state, count: programs.length, filter }) };
}

function statusMessage(text, role) {
  const message = document.createElement("p");
  message.className = "program-center__state";
  message.textContent = text;
  message.setAttribute("role", role);
  return message;
}

function programCard(program) {
  const card = document.createElement("article");
  card.className = "program-center__card";
  const heading = document.createElement("h2");
  heading.textContent = program.program_name;
  const meta = document.createElement("p");
  meta.className = "program-center__meta";
  meta.textContent = `Chapter ${String(program.chapter_number).padStart(3, "0")} • ${program.domain}`;
  const status = document.createElement("dl");
  for (const [label, value] of [
    ["Status", program.implementation_status],
    ["Coverage", `${program.coverage}%`],
    ["Dependency", program.dependencies.length ? program.dependencies.join(" → ") : "ROOT"],
    ["Runtime", program.current_paths[0] ?? "NONE"],
    ["Origin PR", program.current_PRs.join(", ") || "NONE"],
    ["Risk", program.risk],
    ["Next", program.next_action],
    ["Promotion", program.promotion_status]
  ]) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    status.append(row);
  }
  card.append(heading, meta, status);
  return card;
}
