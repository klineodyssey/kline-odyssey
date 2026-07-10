const businessTypes = [
  "Temple", "Farm", "Mine", "Factory", "Restaurant", "Clothing Store", "Weapon Shop", "Potion Shop",
  "Book Store", "Hospital", "School", "Hotel", "Museum", "Convenience Store", "Shopping Mall",
  "Logistics Center", "Warehouse", "Energy Station", "Data Center", "AI Center", "Marketplace", "Bank", "Exchange"
];

const resources = [
  "Food", "Wood", "Stone", "Metal", "Energy", "Knowledge", "Data", "AI Compute", "Gold", "KGEN", "Temple Point", "Civilization Point"
];

const views = {
  economy: {
    title: "Economy Viewer",
    rows: [
      ["Temple", "KGEN-TEM-12345-000001 anchors the economy and civilization identity."],
      ["Business", "Many businesses convert citizens, professions and resources into services."],
      ["Market", "Transactions aggregate into one market view and price discovery signal."],
      ["Governance", "GDP, employment, activity and health feed civilization growth."]
    ]
  },
  business: {
    title: "Business Viewer",
    rows: [
      ["Library", `${businessTypes.length} business types are active in V8.2.`],
      ["Required Fields", "Business ID, Owner, Employees, Required Profession, Building, Production, Consumption, Inventory, Revenue, Expense, Growth, Level, Upgrade Path."],
      ["Ranking Signal", "Ranking is simulated from growth, level, revenue and governance safety."]
    ]
  },
  market: {
    title: "Market Viewer",
    rows: [
      ["Buy / Sell", "Prototype market events only."],
      ["Auction / Order Book", "Concept layer; no real order execution."],
      ["Price Discovery", "Reads supply, demand, inventory, temple activity and governance risk."]
    ]
  },
  citizen: {
    title: "Citizen Economy Viewer",
    rows: [
      ["Work", "Citizens attach to professions and businesses."],
      ["Wage", "Wage events are simulated transaction records."],
      ["Consumption", "Citizens consume food, energy, data, services and temple goods."],
      ["Reputation", "Reputation changes through work, trade, tax and service quality."]
    ]
  },
  temple: {
    title: "Temple Economy Viewer",
    rows: [
      ["One Temple", "One Temple creates one economy identity."],
      ["Treasury", "Temple treasury is a simulation layer, not a real bank account."],
      ["Activity", "Temple activity contributes to civilization health."]
    ]
  },
  compliance: {
    title: "Boundary Viewer",
    rows: [
      ["Concept", "Design target and future module concept."],
      ["Prototype", "Interactive static model without live settlement."],
      ["Simulation", "Read-only events and accounting signals."],
      ["Production", "Requires review before real users rely on it."],
      ["Regulated", "Requires legal authorization and jurisdiction-specific compliance."]
    ]
  }
};

const state = {
  activeView: "economy",
  query: "",
  examples: {}
};

const viewer = document.getElementById("viewer");
const searchInput = document.getElementById("searchInput");

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot read ${path}`);
  return response.json();
}

async function loadExamples() {
  const files = ["economy", "business", "market", "exchange", "bank", "resource", "transaction", "governance_signal"];
  const pairs = await Promise.all(files.map(async name => {
    try {
      return [name, await loadJson(`examples/${name}.example.json`)];
    } catch (error) {
      return [name, { warning: error.message }];
    }
  }));
  state.examples = Object.fromEntries(pairs);
}

function matchesQuery(text) {
  return !state.query || text.toLowerCase().includes(state.query.toLowerCase());
}

function renderFlow(rows) {
  return `<div class="flow">${rows.filter(row => matchesQuery(row.join(" "))).map(row => (
    `<div class="flow-row"><b>${row[0]}</b><span>${row[1]}</span></div>`
  )).join("")}</div>`;
}

function renderTags(items) {
  return `<div class="tag-list">${items.map(item => `<span class="tag">${item}</span>`).join("")}</div>`;
}

function renderExamples() {
  const cards = Object.entries(state.examples).map(([name, data]) => {
    const status = data.status || data.settlement_state || "Readable";
    const id = data[`${name}_id`] || data.transaction_id || data.signal_id || data.business_id || data.economy_id || "record";
    return `<article class="panel">
      <h3>${name}</h3>
      <p><strong>ID</strong><br>${id}</p>
      <p><strong>Status</strong><br><span class="${status === "Readable" ? "status-ok" : "status-warn"}">${status}</span></p>
    </article>`;
  }).join("");
  return `<div class="panel-grid">${cards}</div>`;
}

function render() {
  const view = views[state.activeView];
  const extra = state.activeView === "business" ? renderTags(businessTypes) : state.activeView === "economy" ? renderTags(resources) : "";
  viewer.innerHTML = `
    <article class="panel wide">
      <h2>${view.title}</h2>
      ${renderFlow(view.rows)}
      ${extra}
    </article>
    ${renderExamples()}
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
