const statusOrder = ["Draft", "Prototype", "Active", "Dormant", "Locked", "Retired", "Archived", "Deleted", "Disputed"];

const canonicalChain = [
  "Universe", "Civilization", "World", "Temple", "Land", "Residence", "Citizen", "Profession", "Business", "Economy", "Exchange", "Bank", "Market", "Listing", "Transaction", "Governance"
];

const seedEntities = [
  { id: "KGEN-UNI-20260710-000001", entity_type: "Universe", owner: "KGEN-System", parent: null, children: ["KGEN-CIV-20260710-000001"], runtime: "Universe Data Layer", status: "Prototype", state: { name: "KGEN Universe" } },
  { id: "KGEN-CIV-20260710-000001", entity_type: "Civilization", owner: "KGEN-System", parent: "KGEN-UNI-20260710-000001", children: ["KGEN-WRD-20260710-000001"], runtime: "Civilization Runtime", status: "Prototype", state: { name: "KLINE ODYSSEY" } },
  { id: "KGEN-WRD-20260710-000001", entity_type: "World", owner: "KGEN-System", parent: "KGEN-CIV-20260710-000001", children: ["KGEN-TEM-12345-000001"], runtime: "World Runtime", status: "Prototype", state: { coordinate_source: "Universe Map V10.2" } },
  { id: "KGEN-TEM-12345-000001", entity_type: "Temple", owner: "KGEN-System", parent: "KGEN-WRD-20260710-000001", children: ["KGEN-LND-K12345-000001"], runtime: "Temple Runtime", status: "Prototype", state: { name: "Temple 12345", life: true } },
  { id: "KGEN-LND-K12345-000001", entity_type: "Land", owner: "KGEN-PLY-DEMO-000001", parent: "KGEN-TEM-12345-000001", children: ["KGEN-RES-K12345-000001"], runtime: "Land Runtime", status: "Prototype", state: { stage: "Claimed Land", zoning: "Temple Commerce" } },
  { id: "KGEN-BLD-K12345-000001", entity_type: "Building", owner: "KGEN-PLY-DEMO-000001", parent: "KGEN-LND-K12345-000001", children: ["KGEN-RES-K12345-000001"], runtime: "Building Runtime", status: "Prototype", state: { building_type: "Residence Store" } },
  { id: "KGEN-RES-K12345-000001", entity_type: "Residence", owner: "KGEN-PLY-DEMO-000001", parent: "KGEN-LND-K12345-000001", children: ["KGEN-CIT-K12345-000001"], runtime: "Residence Runtime", status: "Prototype", state: { occupancy: 1 } },
  { id: "KGEN-CIT-K12345-000001", entity_type: "Citizen", owner: "KGEN-PLY-DEMO-000001", parent: "KGEN-RES-K12345-000001", children: ["KGEN-PRO-MERCHANT-000001"], runtime: "Citizen Runtime", status: "Prototype", state: { level: 7, profession: "Merchant" } },
  { id: "KGEN-PRO-MERCHANT-000001", entity_type: "Profession", owner: "KGEN-System", parent: "KGEN-CIT-K12345-000001", children: ["KGEN-BUS-K12345-000001"], runtime: "Profession Runtime", status: "Prototype", state: { name: "Merchant", output: "liquidity" } },
  { id: "KGEN-BUS-K12345-000001", entity_type: "Business", owner: "KGEN-CIT-K12345-000001", parent: "KGEN-PRO-MERCHANT-000001", children: ["KGEN-MKT-11520-000001"], runtime: "Business Runtime", status: "Prototype", state: { type: "Temple Store" } },
  { id: "KGEN-EXC-11520-000001", entity_type: "Exchange", owner: "KGEN-System", parent: "KGEN-BUS-K12345-000001", children: ["KGEN-MKT-11520-000001"], runtime: "Huaguo Exchange 11520 Runtime", status: "Prototype", state: { name: "Huaguo Mountain Exchange 11520" } },
  { id: "KGEN-BNK-18888-000001", entity_type: "Bank", owner: "KGEN-System", parent: "KGEN-EXC-11520-000001", children: [], runtime: "Bank Simulation Runtime", status: "Prototype", state: { regulated: false } },
  { id: "KGEN-MKT-11520-000001", entity_type: "Market", owner: "KGEN-System", parent: "KGEN-EXC-11520-000001", children: ["KGEN-LST-000001"], runtime: "Market Runtime", status: "Prototype", state: { market_class: "A In-Game" } },
  { id: "KGEN-LST-000001", entity_type: "Listing", owner: "KGEN-PLY-DEMO-000001", parent: "KGEN-MKT-11520-000001", children: ["KGEN-TXN-000001"], runtime: "Listing Runtime", status: "Prototype", state: { asset_type: "App", price_model: "Fixed" } },
  { id: "KGEN-TXN-000001", entity_type: "Transaction", owner: "KGEN-System", parent: "KGEN-LST-000001", children: ["KGEN-GOV-000001"], runtime: "Transaction Runtime", status: "Prototype", state: { settlement: "simulated" } },
  { id: "KGEN-GOV-000001", entity_type: "Governance", owner: "KGEN-System", parent: "KGEN-TXN-000001", children: [], runtime: "Governance Runtime", status: "Prototype", state: { policy: "Review before production" } },
  { id: "KGEN-PLY-DEMO-000001", entity_type: "Player", owner: "Human", parent: "KGEN-UNI-20260710-000001", children: ["KGEN-CIT-K12345-000001"], runtime: "Player Runtime", status: "Prototype", state: { role: "operator" } },
  { id: "KGEN-NPC-000001", entity_type: "NPC", owner: "KGEN-System", parent: "KGEN-TEM-12345-000001", children: [], runtime: "NPC Runtime", status: "Prototype", state: { role: "Temple Keeper" } },
  { id: "KGEN-AI-CIT-000001", entity_type: "AI", owner: "KGEN-System", parent: "KGEN-CIT-K12345-000001", children: [], runtime: "AI Runtime", status: "Prototype", state: { canon_lock: true } },
  { id: "KGEN-APP-HASH-4F8C2A91", entity_type: "App", owner: "KGEN-CIT-K12345-000001", parent: "KGEN-BUS-K12345-000001", children: [], runtime: "App Organism Runtime", status: "Prototype", state: { lifecycle: "Rentable" } },
  { id: "KGEN-DNA-CIT-000001", entity_type: "DNA", owner: "KGEN-CIT-K12345-000001", parent: "KGEN-CIT-K12345-000001", children: [], runtime: "DNA Runtime", status: "Prototype", state: { class: "CitizenMerchant" } },
  { id: "KGEN-MIS-V81-000001", entity_type: "Mission", owner: "KGEN-TEM-12345-000001", parent: "KGEN-CIV-20260710-000001", children: ["KGEN-QST-V81-000001"], runtime: "Mission Runtime", status: "Prototype", state: { goal: "Activate Residence Citizen Economy" } },
  { id: "KGEN-QST-V81-000001", entity_type: "Quest", owner: "KGEN-TEM-12345-000001", parent: "KGEN-MIS-V81-000001", children: [], runtime: "Quest Runtime", status: "Prototype", state: { action: "Assign Citizen Profession" } },
  { id: "KGEN-ITM-CLOTH-000001", entity_type: "Item", owner: "KGEN-BUS-K12345-000001", parent: "KGEN-BUS-K12345-000001", children: [], runtime: "Item Runtime", status: "Prototype", state: { category: "Clothing" } }
];

const seedRelationships = [
  ["KGEN-UNI-20260710-000001", "contains", "KGEN-CIV-20260710-000001"],
  ["KGEN-CIV-20260710-000001", "contains", "KGEN-WRD-20260710-000001"],
  ["KGEN-WRD-20260710-000001", "contains", "KGEN-TEM-12345-000001"],
  ["KGEN-TEM-12345-000001", "contains", "KGEN-LND-K12345-000001"],
  ["KGEN-LND-K12345-000001", "contains", "KGEN-RES-K12345-000001"],
  ["KGEN-CIT-K12345-000001", "resides_in", "KGEN-RES-K12345-000001"],
  ["KGEN-CIT-K12345-000001", "works_as", "KGEN-PRO-MERCHANT-000001"],
  ["KGEN-CIT-K12345-000001", "employed_by", "KGEN-BUS-K12345-000001"],
  ["KGEN-APP-HASH-4F8C2A91", "serves", "KGEN-BUS-K12345-000001"],
  ["KGEN-LST-000001", "listed_on", "KGEN-MKT-11520-000001"],
  ["KGEN-TXN-000001", "settles", "KGEN-LST-000001"],
  ["KGEN-GOV-000001", "governs", "KGEN-TXN-000001"]
].map((row, index) => ({
  relationship_id: `KGEN-REL-SEED-${String(index + 1).padStart(6, "0")}`,
  source_id: row[0],
  relationship_type: row[1],
  target_id: row[2],
  status: "Prototype",
  create_time: "2026-07-10T00:00:00Z",
  update_time: "2026-07-10T00:00:00Z"
}));

const state = {
  activeView: "graph",
  query: "",
  entities: seedEntities,
  relationships: seedRelationships,
  loadedExample: false
};

const viewer = document.getElementById("viewer");
const searchInput = document.getElementById("searchInput");

async function loadExampleGraph() {
  try {
    const response = await fetch("examples/entity_graph.example.json", { cache: "no-store" });
    if (!response.ok) return;
    const graph = await response.json();
    if (Array.isArray(graph.entities) && graph.entities.length) {
      const merged = new Map(seedEntities.map(entity => [entity.id, entity]));
      graph.entities.forEach(entity => merged.set(entity.id, { ...entity, state: entity.state || {} }));
      state.entities = Array.from(merged.values());
    }
    if (Array.isArray(graph.relationships) && graph.relationships.length) {
      const mergedRelationships = new Map(seedRelationships.map(rel => [rel.relationship_id, rel]));
      graph.relationships.forEach(rel => mergedRelationships.set(rel.relationship_id, rel));
      state.relationships = Array.from(mergedRelationships.values());
    }
    state.loadedExample = true;
  } catch (error) {
    state.loadedExample = false;
  }
}

function matchesQuery(entity) {
  if (!state.query) return true;
  const text = JSON.stringify(entity).toLowerCase();
  return text.includes(state.query.toLowerCase());
}

function filteredEntities() {
  return state.entities.filter(matchesQuery);
}

function renderMetrics() {
  document.getElementById("entityCount").textContent = String(state.entities.length);
  document.getElementById("metricEntities").textContent = String(state.entities.length);
  document.getElementById("metricRelationships").textContent = String(state.relationships.length);
  document.getElementById("metricCitizens").textContent = String(state.entities.filter(e => e.entity_type === "Citizen").length);
  document.getElementById("metricProfessions").textContent = String(state.entities.filter(e => e.entity_type === "Profession").length);
}

function entityCard(entity) {
  const children = Array.isArray(entity.children) ? entity.children.length : 0;
  const stateText = entity.state ? Object.entries(entity.state).map(([key, value]) => `${key}: ${value}`).join(" / ") : "No state";
  return `<article class="entity-card">
    <h3>${entity.entity_type}</h3>
    <p><strong>ID</strong><br>${entity.id}</p>
    <p><strong>Owner</strong><br>${entity.owner}</p>
    <p><strong>Runtime</strong><br>${entity.runtime}</p>
    <p><strong>Status</strong><br><span class="badge">${entity.status}</span><span class="badge">Children ${children}</span></p>
    <p>${stateText}</p>
  </article>`;
}

function renderGraph() {
  const byType = new Map(state.entities.map(entity => [entity.entity_type, entity]));
  viewer.innerHTML = `<div class="graph">${canonicalChain.map(type => {
    const entity = byType.get(type);
    const id = entity ? entity.id : "No seed entity";
    const runtime = entity ? entity.runtime : "Not active in current seed";
    return `<div class="graph-lane"><b>${type}</b><span>${id}<br>${runtime}</span></div>`;
  }).join("")}</div>`;
}

function renderEntities(types = null) {
  const set = types ? new Set(types) : null;
  const list = filteredEntities().filter(entity => !set || set.has(entity.entity_type));
  viewer.innerHTML = `<div class="card-grid">${list.map(entityCard).join("")}</div>`;
}

function renderRelationships() {
  const rows = state.relationships.filter(rel => {
    if (!state.query) return true;
    return JSON.stringify(rel).toLowerCase().includes(state.query.toLowerCase());
  });
  viewer.innerHTML = `<div class="relationship-list">${rows.map(rel => `<div class="relationship-row"><span>${rel.source_id}</span><b>${rel.relationship_type}</b><span>${rel.target_id}</span></div>`).join("")}</div>`;
}

function renderEconomy() {
  renderEntities(["Business", "Exchange", "Bank", "Market", "Listing", "Transaction", "Governance", "Item", "Mission", "Quest"]);
}

function render() {
  renderMetrics();
  if (state.activeView === "graph") renderGraph();
  if (state.activeView === "entities") renderEntities();
  if (state.activeView === "citizens") renderEntities(["Citizen", "Player", "NPC", "AI", "DNA", "App"]);
  if (state.activeView === "professions") renderEntities(["Profession", "Business", "Building", "Residence"]);
  if (state.activeView === "economy") renderEconomy();
  if (state.activeView === "relationships") renderRelationships();
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

loadExampleGraph().finally(render);