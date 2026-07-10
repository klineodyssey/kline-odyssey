const clockLayers = ["Universe Time", "Civilization Time", "World Time", "Temple Time", "Business Time", "Citizen Time"];
const tickScales = ["1 Tick", "1 Minute", "1 Hour", "1 Day", "1 Week", "1 Month", "1 Season", "1 Year"];
const eventTypes = ["Festival", "War Concept", "Disaster", "Discovery", "Technology", "Migration", "Economic Boom", "Recession"];

const views = {
  simulation: {
    title: "Simulation Viewer",
    rows: [
      ["Clock Update", "Reads Universe, Civilization, World, Temple, Business and Citizen Time."],
      ["Behavior Update", "Runs Citizen, Business, Temple and Resource changes in review-only mode."],
      ["Event Engine", "Applies Festival, War concept, Disaster, Discovery, Technology, Migration, Economic Boom and Recession modifiers."],
      ["Governance Response", "Emits Observe, Warn, Recommend, Pause Simulation or Request Codex Review signals."]
    ]
  },
  timeline: {
    title: "Timeline Viewer",
    rows: [
      ["Tick", "Smallest governance-visible movement."],
      ["Snapshot", "Each completed Tick can become a timeline memory record."],
      ["Evolution", "Many snapshots form civilization evolution history."]
    ]
  },
  clock: {
    title: "World Clock Viewer",
    rows: [
      ["Universe Time", "Global epoch and absolute Tick index."],
      ["Civilization Time", "Civilization-level social and economic rhythm."],
      ["World Time", "Day/night, season and event window."],
      ["Temple / Business / Citizen", "Local rhythm inherited from higher clocks."]
    ]
  },
  citizen: {
    title: "Citizen Behavior Viewer",
    rows: [
      ["Work", "Creates wage, skill and fatigue signals."],
      ["Consume", "Uses resources and market services."],
      ["Rest", "Restores energy and lowers stress."],
      ["Learn / Trade / Upgrade", "Improves skill, reputation and civilization output."]
    ]
  },
  business: {
    title: "Business Behavior Viewer",
    rows: [
      ["Produce", "Consumes resource inputs and creates output."],
      ["Restock", "Updates inventory and supply chain state."],
      ["Income / Expense", "Creates simulated economy deltas."],
      ["Employee Change", "Adjusts labor demand and governance signals."]
    ]
  },
  event: {
    title: "Event Engine Viewer",
    rows: eventTypes.map(type => [type, "Prototype event type that modifies simulation state and timeline records."])
  },
  governance: {
    title: "Governance Response Viewer",
    rows: [
      ["GDP", "Economy signal inherited from V8.2."],
      ["Population", "Citizen count and migration pressure."],
      ["Unemployment", "Labor market risk signal."],
      ["Resources", "Reserve and scarcity signal."],
      ["Temple / Market Activity", "Civilization health drivers."]
    ]
  }
};

const state = {
  activeView: "simulation",
  query: "",
  examples: {}
};

const viewer = document.getElementById("viewer");
const searchInput = document.getElementById("searchInput");

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot read ${path}`);
  return response.json();
}

async function loadExamples() {
  const files = [
    "world_clock",
    "simulation_tick",
    "time_state",
    "citizen_behavior",
    "business_behavior",
    "temple_activity",
    "resource_regeneration",
    "population_growth",
    "event",
    "governance_response"
  ];
  const pairs = await Promise.all(files.map(async name => {
    try {
      return [name, await readJson(`examples/${name}.example.json`)];
    } catch (error) {
      return [name, { warning: error.message }];
    }
  }));
  state.examples = Object.fromEntries(pairs);
}

function matchesQuery(text) {
  return !state.query || text.toLowerCase().includes(state.query.toLowerCase());
}

function flow(rows) {
  return `<div class="flow">${rows.filter(row => matchesQuery(row.join(" "))).map(row => `<div class="flow-row"><b>${row[0]}</b><span>${row[1]}</span></div>`).join("")}</div>`;
}

function tags(items) {
  return `<div class="tag-list">${items.map(item => `<span class="tag">${item}</span>`).join("")}</div>`;
}

function exampleCards() {
  return Object.entries(state.examples).map(([name, record]) => {
    const id = record.clock_id || record.tick_id || record.entity_id || record.event_id || record.response_id || record.citizen_id || record.business_id || record.temple_id || record.resource_id || record.civilization_id || "record";
    const status = record.status || "Readable";
    return `<article class="panel">
      <h3>${name}</h3>
      <p><strong>ID</strong><br>${id}</p>
      <p><strong>Status</strong><br><span class="${status === "Readable" ? "status-ok" : "status-warn"}">${status}</span></p>
    </article>`;
  }).join("");
}

function render() {
  const view = views[state.activeView];
  const extra = state.activeView === "clock" ? tags(clockLayers) : state.activeView === "timeline" ? tags(tickScales) : state.activeView === "event" ? tags(eventTypes) : "";
  viewer.innerHTML = `
    <article class="panel wide">
      <h2>${view.title}</h2>
      ${flow(view.rows)}
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
