const decisionTypes = ["Citizen support", "Business expansion", "Resource reallocation", "Temple upgrade", "Land development", "Market stabilization", "Bank reserve warning", "Governance response", "Event response", "Migration recommendation", "Technology investment", "WorkOrder priority change"];
const riskLevels = ["R0 Informational", "R1 Low", "R2 Medium", "R3 High", "R4 Critical"];

const views = {
  decision: [["Source State", "Decision reads V8.1, V8.2, V8.3 and review records."], ["Recommendation", "AI recommends but does not execute."], ["Alternatives", "Rejected alternatives are visible for review."]],
  risk: [["R0-R1", "AI can propose low-risk recommendations."], ["R2", "Codex Review required."], ["R3", "Codex and Human Review required."], ["R4", "Execution forbidden; warning and BLOCKED draft only."]],
  memory: [["Short-Term", "Current evaluation state."], ["Civilization", "Long-running metrics and history."], ["Review", "Codex and Human review outcomes."], ["Source Rule", "GitHub state is formal source."]],
  workorder: [["DRAFT Only", "AI cannot mark DRAFT as OPEN."], ["Codex", "Codex reviews quality, dependency and protected paths."], ["Human", "Human can approve, reject, pause, block or archive."]],
  review: [["Canon", "Check official rules."], ["Risk", "Check R0-R4 level."], ["Protected Paths", "Check no protected path mutation."], ["Duplicate Task", "Check task uniqueness."]],
  policy: [["Allowed", "Observe, Analyze, Reason, Recommend, Generate Draft WorkOrders."], ["Prohibited", "No transactions, transfers, deployment, legal commitment, main merge or protected path modification."]]
};

const state = { activeView: "decision", query: "", examples: {} };
const viewer = document.getElementById("viewer");
const searchInput = document.getElementById("searchInput");

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot read ${path}`);
  return response.json();
}

async function loadExamples() {
  const files = ["ai_observation", "ai_decision", "ai_memory", "ai_risk", "ai_policy", "ai_workorder", "human_override", "codex_review"];
  const pairs = await Promise.all(files.map(async name => {
    try {
      return [name, await readJson(`examples/${name}.example.json`)];
    } catch (error) {
      return [name, { warning: error.message }];
    }
  }));
  state.examples = Object.fromEntries(pairs);
}

function matches(text) {
  return !state.query || text.toLowerCase().includes(state.query.toLowerCase());
}

function flow(rows) {
  return `<div class="flow">${rows.filter(row => matches(row.join(" "))).map(row => `<div class="flow-row"><b>${row[0]}</b><span>${row[1]}</span></div>`).join("")}</div>`;
}

function tags(items) {
  return `<div class="tag-list">${items.map(item => `<span class="tag">${item}</span>`).join("")}</div>`;
}

function exampleCards() {
  return Object.entries(state.examples).map(([name, record]) => {
    const id = record.decision_id || record.observation_id || record.memory_id || record.risk_id || record.policy_id || record.task_id || record.override_id || record.review_id || "record";
    const status = record.status || "Readable";
    return `<article class="panel">
      <h3>${name}</h3>
      <p><strong>ID</strong><br>${id}</p>
      <p><strong>Status</strong><br><span class="status-ok">${status}</span></p>
    </article>`;
  }).join("");
}

function render() {
  const extra = state.activeView === "decision" ? tags(decisionTypes) : state.activeView === "risk" ? tags(riskLevels) : "";
  viewer.innerHTML = `
    <article class="panel wide">
      <h2>${state.activeView}</h2>
      ${flow(views[state.activeView])}
      ${extra}
    </article>
    <div class="panel-grid">${exampleCards()}</div>
  `;
}

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");
    state.activeView = button.dataset.view;
    render();
  });
});

searchInput.addEventListener("input", event => {
  state.query = event.target.value.trim();
  render();
});

loadExamples().finally(render);
