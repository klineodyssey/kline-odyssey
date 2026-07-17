const TABS = Object.freeze([
  ["GENESIS", "Genesis"],
  ["TODAY", "Today"],
  ["ECOSYSTEM", "Ecology"],
  ["FARM", "Farm"],
  ["PRODUCTION", "Production"],
  ["COMPANY", "Company"],
  ["MARKET", "Market"],
  ["CITY", "City"]
]);

const NEED_LABELS = Object.freeze({
  health: "Health",
  hunger: "Hunger",
  thirst: "Thirst",
  fatigue: "Fatigue",
  mood: "Mood",
  knowledge: "Knowledge",
  money: "Money",
  housing: "Housing",
  relationship: "Relationship",
  safety: "Safety"
});

function element(documentRef, tag, className = "", text = "") {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = String(text);
  return node;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bounded(value) {
  return Math.min(100, Math.max(0, number(value)));
}

function display(value, fallback = "UNKNOWN") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("_", " ");
}

function collection(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function definitionList(documentRef, rows, className = "civilization-data") {
  const list = element(documentRef, "dl", className);
  for (const [label, value] of rows) {
    const row = element(documentRef, "div");
    row.append(element(documentRef, "dt", "", label), element(documentRef, "dd", "", display(value)));
    list.append(row);
  }
  return list;
}

function section(documentRef, title, modifier = "") {
  const node = element(documentRef, "section", `civilization-section ${modifier}`.trim());
  node.append(element(documentRef, "h2", "civilization-section__title", title));
  return node;
}

function actionButton(documentRef, label, action, callback, { disabled = false, tone = "" } = {}) {
  const button = element(documentRef, "button", `civilization-action ${tone}`.trim(), label);
  button.type = "button";
  button.dataset.civilizationAction = action;
  button.disabled = disabled;
  button.addEventListener("click", callback);
  return button;
}

function meter(documentRef, label, rawValue, { inverse = false } = {}) {
  const value = bounded(rawValue);
  const node = element(documentRef, "div", "need-meter");
  const heading = element(documentRef, "div", "need-meter__heading");
  heading.append(element(documentRef, "span", "", label), element(documentRef, "strong", "", Math.round(value)));
  const track = element(documentRef, "div", "need-meter__track");
  track.setAttribute("role", "meter");
  track.setAttribute("aria-label", label);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(Math.round(value)));
  const fill = element(documentRef, "span", "need-meter__fill");
  fill.style.width = `${value}%`;
  const concerning = inverse ? value >= 70 : value <= 30;
  const warning = inverse ? value >= 45 : value <= 55;
  fill.dataset.band = concerning ? "critical" : warning ? "warning" : "healthy";
  track.append(fill);
  node.append(heading, track);
  return node;
}

function clockLabel(clock) {
  if (!clock) return "TIME OFFLINE";
  const hour = String(number(clock.hour ?? clock.hour_of_day)).padStart(2, "0");
  const minute = String(number(clock.minute ?? clock.minute_of_hour)).padStart(2, "0");
  return `DAY ${clock.day ?? 1} / ${hour}:${minute}`;
}

function renderGenesis(documentRef, model) {
  const fragment = documentRef.createDocumentFragment();
  const genesis = model.genesis ?? {};
  const planet = model.planet_environment?.active_profile ?? genesis.planet ?? {};

  const birth = section(documentRef, "Civilization Birth", "civilization-section--time");
  birth.append(definitionList(documentRef, [
    ["Status", genesis.completed ? "BORN" : genesis.stage],
    ["Birth ID", genesis.birth_id],
    ["Species", genesis.species_id],
    ["Planet", planet.label ?? genesis.planet_id],
    ["Starter Parcel", genesis.starter_parcel_id],
    ["Starter Shelter", genesis.starter_shelter_id],
    ["Genesis Fortune", genesis.fortune_claim ? `${genesis.fortune_claim.amount} PROTOTYPE KGEN` : "NOT CLAIMED"],
    ["Temple", genesis.temple_id]
  ]));
  fragment.append(birth);

  const boot = section(documentRef, "Boot Integrity");
  const timeline = element(documentRef, "ol", "daily-timeline");
  const complete = new Map(collection(genesis.completed_steps).map((entry) => [entry.step, entry]));
  for (const stepId of collection(genesis.boot_steps)) {
    const entry = complete.get(stepId);
    const item = element(documentRef, "li", "daily-timeline__item");
    item.classList.toggle("is-active", stepId === genesis.stage);
    item.append(
      element(documentRef, "time", "", entry ? "PASS" : "WAIT"),
      element(documentRef, "span", "", display(stepId))
    );
    timeline.append(item);
  }
  boot.append(timeline);
  fragment.append(boot);

  const environment = section(documentRef, "Planet Environment");
  environment.append(definitionList(documentRef, [
    ["Atmosphere", planet.atmosphere?.status],
    ["Oxygen", planet.atmosphere?.oxygen_available ? "AVAILABLE" : "UNAVAILABLE"],
    ["Gravity", planet.gravity_g == null ? "UNKNOWN" : `${planet.gravity_g} G`],
    ["Temperature", planet.temperature?.class],
    ["Pressure", planet.pressure?.class],
    ["Water", planet.water],
    ["Radiation", planet.radiation],
    ["Magnetic Field", planet.magnetic_field],
    ["Day", planet.day_length_hours == null ? "UNKNOWN" : `${planet.day_length_hours} h`],
    ["Year", planet.year_length_days == null ? "UNKNOWN" : `${planet.year_length_days} d`],
    ["Food", planet.food_availability],
    ["Human", planet.life_compatibility?.HUMAN]
  ]));
  fragment.append(environment);

  const pack = section(documentRef, "Starter Survival Pack");
  const items = collection(genesis.survival_pack?.items);
  pack.append(definitionList(documentRef, items.length
    ? items.map((item) => [display(item.item_id), item.quantity])
    : [["Status", "PENDING BIRTH"]]));
  fragment.append(pack);
  return fragment;
}

function currentSchedule(citizen) {
  return citizen?.current_schedule
    ?? citizen?.currentSchedule
    ?? citizen?.current_activity
    ?? citizen?.activity
    ?? {};
}

function renderToday(documentRef, model, callbacks) {
  const fragment = documentRef.createDocumentFragment();
  const citizen = model.citizen ?? {};
  const worker = collection(model.aiWorkers ?? model.ai_workers)[0] ?? model.aiWorker ?? {};
  const schedule = currentSchedule(citizen);

  const timeSection = section(documentRef, "Living Day", "civilization-section--time");
  const timeRow = element(documentRef, "div", "civilization-time");
  const timeCopy = element(documentRef, "div");
  timeCopy.append(
    element(documentRef, "strong", "civilization-time__clock", clockLabel(model.clock)),
    element(documentRef, "span", "civilization-time__season", `${display(model.clock?.season, "SPRING")} / WEEK ${model.clock?.week ?? 1} / YEAR ${model.clock?.year ?? 1}`)
  );
  const timeActions = element(documentRef, "div", "civilization-actions");
  timeActions.append(
    actionButton(documentRef, "+1h", "ADVANCE_HOUR", () => callbacks.onAdvance?.(60)),
    actionButton(documentRef, "+1d", "ADVANCE_DAY", () => callbacks.onAdvance?.(1440))
  );
  timeRow.append(timeCopy, timeActions);
  timeSection.append(timeRow);
  timeSection.append(definitionList(documentRef, [
    ["Citizen", citizen.display_name ?? citizen.life_id],
    ["Now", schedule.label ?? schedule.activity ?? schedule.action ?? citizen.current_activity],
    ["Occupation", citizen.occupation],
    ["Life state", citizen.life_state ?? citizen.status]
  ]));
  fragment.append(timeSection);

  const needs = section(documentRef, "Citizen Needs");
  const needsGrid = element(documentRef, "div", "needs-grid");
  const metrics = citizen.needs ?? citizen.metrics ?? citizen;
  for (const [key, label] of Object.entries(NEED_LABELS)) {
    const source = key === "money" ? Math.min(100, number(metrics[key]) / 5) : metrics[key];
    needsGrid.append(meter(documentRef, label, source, { inverse: ["hunger", "thirst", "fatigue"].includes(key) }));
  }
  needs.append(needsGrid);
  fragment.append(needs);

  const workerSection = section(documentRef, "AI Worker Shift");
  workerSection.append(definitionList(documentRef, [
    ["Worker", worker.display_name ?? worker.worker_id ?? worker.life_id],
    ["Status", worker.current_status ?? worker.status],
    ["Action", worker.current_action ?? worker.action],
    ["Attendance", worker.attendance_status ?? worker.attendance],
    ["Energy", worker.energy],
    ["Production", worker.production ?? worker.production_score]
  ]));
  fragment.append(workerSection);

  const scheduleSection = section(documentRef, "Daily Schedule");
  const timeline = element(documentRef, "ol", "daily-timeline");
  for (const entry of collection(citizen.schedule ?? citizen.daily_schedule)) {
    const item = element(documentRef, "li", "daily-timeline__item");
    const active = String(entry.activity ?? entry.action ?? entry.label) === String(schedule.activity ?? schedule.action ?? schedule.label);
    item.classList.toggle("is-active", active);
    item.append(
      element(documentRef, "time", "", `${String(entry.start_hour ?? entry.hour ?? 0).padStart(2, "0")}:00`),
      element(documentRef, "span", "", display(entry.label ?? entry.activity ?? entry.action))
    );
    timeline.append(item);
  }
  scheduleSection.append(timeline);
  fragment.append(scheduleSection);
  return fragment;
}

function renderFarm(documentRef, model, callbacks) {
  const fragment = documentRef.createDocumentFragment();
  const farm = model.agriculture ?? {};
  const plots = collection(farm.plots ?? farm.plot_snapshots);
  const farmSection = section(documentRef, "Starter Farm");

  for (const plot of plots) {
    const row = element(documentRef, "div", "farm-plot");
    const copy = element(documentRef, "div", "farm-plot__copy");
    copy.append(
      element(documentRef, "strong", "", display(plot.label ?? plot.plot_id ?? plot.id)),
      element(documentRef, "span", "", `${display(plot.state)} / ${display(plot.crop_id ?? plot.crop ?? "EMPTY")}`)
    );
    if (String(plot.state).toUpperCase() === "GROWING") {
      copy.append(meter(documentRef, "Growth", plot.growth_percent ?? plot.progress ?? 0));
    }
    const actions = element(documentRef, "div", "civilization-actions");
    const plotId = plot.plot_id ?? plot.id;
    if (["EMPTY", "HARVESTED"].includes(String(plot.state).toUpperCase())) {
      for (const crop of ["RICE", "VEGETABLE", "FRUIT"]) {
        actions.append(actionButton(documentRef, crop === "VEGETABLE" ? "Veg" : crop[0] + crop.slice(1).toLowerCase(), `PLANT_${crop}`, () => callbacks.onPlant?.(plotId, crop)));
      }
    } else if (String(plot.state).toUpperCase() === "READY") {
      actions.append(actionButton(documentRef, "Harvest", "HARVEST", () => callbacks.onHarvest?.(plotId), { tone: "civilization-action--primary" }));
    }
    row.append(copy, actions);
    farmSection.append(row);
  }
  if (!plots.length) farmSection.append(element(documentRef, "p", "civilization-empty", "NO SYNTHETIC PLOTS"));
  fragment.append(farmSection);

  const warehouse = section(documentRef, "Farm Warehouse");
  const inventory = farm.warehouse ?? farm.inventory ?? {};
  const inventoryRows = Object.entries(inventory).map(([resource, quantity]) => [display(resource), quantity]);
  warehouse.append(definitionList(documentRef, inventoryRows.length ? inventoryRows : [["Stock", "EMPTY"]]));
  const sellable = inventoryRows.filter(([, quantity]) => number(quantity) > 0);
  if (sellable.length) {
    const actions = element(documentRef, "div", "civilization-actions civilization-actions--wrap");
    for (const [resource] of sellable) {
      const id = resource.replaceAll(" ", "_").toUpperCase();
      actions.append(actionButton(documentRef, `Sell ${resource}`, `SELL_${id}`, () => callbacks.onSellHarvest?.(id, 1)));
    }
    warehouse.append(actions);
  }
  fragment.append(warehouse);

  const facilities = section(documentRef, "Agriculture Organisms");
  for (const facility of collection(farm.facilities)) {
    const row = element(documentRef, "div", "production-row");
    const copy = element(documentRef, "div", "production-row__copy");
    copy.append(
      element(documentRef, "strong", "", facility.label ?? facility.facility_id),
      element(documentRef, "span", "", `${display(facility.facility_type)} / ${display(facility.state)}`),
      meter(documentRef, "Cycle", number(facility.progress_hours) / Math.max(1, number(facility.cycle_hours, 1)) * 100)
    );
    const actions = element(documentRef, "div", "civilization-actions");
    if (facility.state === "READY") {
      actions.append(actionButton(documentRef, "Collect", "COLLECT_FACILITY", () => callbacks.onCollectFacility?.(facility.facility_id), { tone: "civilization-action--primary" }));
    }
    row.append(copy, actions);
    facilities.append(row);
  }
  const resourceRows = Object.entries(farm.resources ?? {}).map(([resource, quantity]) => [display(resource), Number(quantity).toFixed(1)]);
  if (resourceRows.length) facilities.append(definitionList(documentRef, resourceRows, "civilization-data civilization-data--compact"));
  fragment.append(facilities);
  return fragment;
}

function renderEcosystem(documentRef, model) {
  const fragment = documentRef.createDocumentFragment();
  const ecosystem = model.ecosystem ?? {};
  const summary = section(documentRef, "Living Earth", "civilization-section--ecosystem");
  summary.append(definitionList(documentRef, [
    ["Evolution Stage", ecosystem.current_evolution_stage],
    ["Food Chain", ecosystem.food_chain_status],
    ["Biodiversity", ecosystem.biodiversity],
    ["Population", ecosystem.total_population],
    ["Average Health", `${number(ecosystem.average_health).toFixed(1)}%`],
    ["Simulation", "ACCELERATED SYNTHETIC ALPHA"]
  ]));
  fragment.append(summary);

  const lineageSection = section(documentRef, "Cambrian Lineage");
  const lineage = element(documentRef, "ol", "evolution-lineage");
  for (const stage of collection(ecosystem.lineage)) {
    const item = element(documentRef, "li", "evolution-lineage__item");
    item.classList.toggle("is-active", stage.stage_id === ecosystem.current_evolution_stage);
    item.append(
      element(documentRef, "span", "evolution-lineage__index", String(number(stage.index) + 1).padStart(2, "0")),
      element(documentRef, "strong", "", stage.label ?? display(stage.stage_id))
    );
    lineage.append(item);
  }
  lineageSection.append(lineage);
  fragment.append(lineageSection);

  const energy = section(documentRef, "Food Chain Energy");
  energy.append(definitionList(documentRef, [
    ["Producer Input", number(ecosystem.energy_flow?.producer_input).toFixed(2)],
    ["Agriculture Input", number(ecosystem.energy_flow?.agriculture_input).toFixed(2)],
    ["Consumer Demand", number(ecosystem.energy_flow?.consumer_demand).toFixed(2)],
    ["Transferred", number(ecosystem.energy_flow?.transferred).toFixed(2)],
    ["Decomposer Recovery", number(ecosystem.energy_flow?.decomposer_recovery).toFixed(2)],
    ["Balance", number(ecosystem.energy_flow?.balance).toFixed(2)]
  ]));
  fragment.append(energy);

  const species = section(documentRef, "Species Population");
  const grid = element(documentRef, "div", "species-grid");
  for (const profile of collection(ecosystem.species)) {
    const card = element(documentRef, "article", "species-card");
    card.dataset.trophicRole = profile.trophic_role;
    card.append(
      element(documentRef, "span", "species-card__role", display(profile.trophic_role)),
      element(documentRef, "strong", "", profile.label),
      element(documentRef, "span", "", `${number(profile.population).toLocaleString()} life / ${Math.round(number(profile.health))}% health`),
      element(documentRef, "small", "", `${display(profile.habitat)} / ${display(profile.evolution_stage)}`)
    );
    grid.append(card);
  }
  species.append(grid);
  fragment.append(species);
  return fragment;
}

function renderProduction(documentRef, model, callbacks) {
  const fragment = documentRef.createDocumentFragment();
  const production = model.production ?? {};
  const factory = production.factory ?? {};
  const factorySection = section(documentRef, "Factory Organism", "civilization-section--production");
  const header = element(documentRef, "div", "production-headline");
  const copy = element(documentRef, "div");
  copy.append(
    element(documentRef, "strong", "", factory.label ?? factory.factory_id),
    element(documentRef, "span", "", `${display(factory.status)} / LEVEL ${factory.level ?? 1}`)
  );
  header.append(copy, actionButton(documentRef, "Run Cycle", "RUN_FACTORY", () => callbacks.onRunProduction?.(), {
    disabled: factory.status === "BLOCKED",
    tone: "civilization-action--primary"
  }));
  factorySection.append(header, definitionList(documentRef, [
    ["Life OS", factory.life_os_profile_id],
    ["Health", `${number(factory.health).toFixed(1)}%`],
    ["Energy", `${number(factory.energy).toFixed(1)}%`],
    ["Maintenance", `${number(factory.maintenance).toFixed(1)}%`],
    ["Cycle", `${number(factory.cycle_progress_hours).toFixed(1)} / ${factory.cycle_hours ?? 0} h`],
    ["Produced", factory.total_produced],
    ["Missing", collection(factory.missing_dependencies).length ? collection(factory.missing_dependencies).join(", ") : "NONE"]
  ]));
  fragment.append(factorySection);

  const chain = section(documentRef, "Supply Chain");
  const nodes = element(documentRef, "div", "supply-grid");
  for (const node of collection(production.supply_nodes)) {
    const item = element(documentRef, "div", "supply-node");
    item.dataset.status = node.status;
    item.append(
      element(documentRef, "span", "supply-node__status", node.status === "AVAILABLE" ? "PASS" : "STOP"),
      element(documentRef, "strong", "", node.label),
      element(documentRef, "small", "", `${display(node.category)} / ${number(node.capacity).toFixed(1)} ${display(node.unit)}`)
    );
    nodes.append(item);
  }
  chain.append(nodes);
  fragment.append(chain);

  const product = section(documentRef, "Product Lifecycle");
  product.append(definitionList(documentRef, [
    ["Product", factory.product_recipe?.label],
    ["Inventory", factory.product_inventory?.[factory.product_recipe?.product_id] ?? 0],
    ["Materials", Object.entries(factory.material_inventory ?? {}).map(([id, quantity]) => `${id} ${number(quantity).toFixed(1)}`).join(" / ")],
    ["Lifecycle", collection(production.product_lifecycle).join(" -> ")],
    ["Repairable", factory.product_recipe?.repairable],
    ["Recyclable", factory.product_recipe?.recyclable]
  ]));
  fragment.append(product);
  return fragment;
}

function renderCompany(documentRef, model, callbacks) {
  const fragment = documentRef.createDocumentFragment();
  const runtime = model.ai_company ?? {};
  const company = runtime.company ?? {};
  const finance = runtime.finance ?? {};
  const identity = section(documentRef, "AI Company Organism", "civilization-section--company");
  identity.append(definitionList(documentRef, [
    ["Company", company.label ?? company.company_id],
    ["Status", company.status],
    ["Company Life", company.company_life_state],
    ["Company DNA", company.company_dna_id],
    ["DNA Revision", company.company_dna_revision],
    ["Employees", company.employees],
    ["AI Workers", company.ai_workers],
    ["Reputation", `${number(company.reputation).toFixed(1)}%`],
    ["Expansion", company.expansion_state]
  ]));
  const metrics = element(documentRef, "div", "needs-grid");
  metrics.append(
    meter(documentRef, "Health", company.health),
    meter(documentRef, "Energy", company.energy),
    meter(documentRef, "Supply", company.supply_chain_health),
    meter(documentRef, "Reputation", company.reputation)
  );
  identity.append(metrics);
  fragment.append(identity);

  const financeSection = section(documentRef, "Prototype Company Finance");
  financeSection.append(definitionList(documentRef, [
    ["Balance", `${number(finance.balance).toFixed(0)} CR`],
    ["Revenue", `${number(finance.revenue).toFixed(0)} CR`],
    ["Operating Cost", `${number(finance.operating_cost).toFixed(0)} CR`],
    ["Inventory Value", `${number(finance.inventory_value).toFixed(0)} CR`],
    ["Settlement", "LOCAL SYNTHETIC LEDGER"]
  ]));
  const inventory = Object.entries(company.product_inventory ?? {}).filter(([, quantity]) => number(quantity) > 0);
  if (inventory.length) {
    const actions = element(documentRef, "div", "civilization-actions civilization-actions--wrap");
    for (const [productId, quantity] of inventory) {
      actions.append(actionButton(documentRef, `Sell ${display(productId)} (${quantity})`, "SELL_COMPANY_PRODUCT", () => callbacks.onSellCompanyProduct?.(productId, 1)));
    }
    financeSection.append(actions);
  }
  fragment.append(financeSection);

  const assets = section(documentRef, "Company Assets");
  assets.append(definitionList(documentRef, collection(company.assets).map((asset, index) => [`Asset ${index + 1}`, asset])));
  fragment.append(assets);
  return fragment;
}

function renderMarket(documentRef, model, callbacks) {
  const fragment = documentRef.createDocumentFragment();
  const economy = model.economy ?? {};
  const balances = economy.balances ?? economy.accounts ?? {};
  const playerBalance = economy.player_balance
    ?? balances[model.playerId ?? "mock-player-001"]
    ?? balances.find?.((entry) => entry.owner_id === (model.playerId ?? "mock-player-001"))?.balance
    ?? 0;

  const wallet = section(documentRef, "Prototype Account");
  wallet.append(definitionList(documentRef, [
    ["Player", model.playerId ?? "mock-player-001"],
    ["Credits", typeof playerBalance === "object" ? playerBalance.balance : playerBalance],
    ["Settlement", "LOCAL SYNTHETIC LEDGER"]
  ]));
  fragment.append(wallet);

  const market = section(documentRef, "Civilization Market");
  for (const listing of collection(economy.listings ?? economy.market_listings)) {
    const listingId = listing.listing_id ?? listing.id;
    const row = element(documentRef, "div", "market-listing");
    const copy = element(documentRef, "div");
    copy.append(
      element(documentRef, "strong", "", display(listing.label ?? listing.resource_id ?? listing.item_id)),
      element(documentRef, "span", "", `${display(listing.category)} / ${listing.price ?? listing.unit_price ?? 0} CR / stock ${listing.stock ?? listing.quantity ?? 0}`)
    );
    row.append(copy, actionButton(documentRef, "Buy", "BUY", () => callbacks.onBuy?.(listingId, 1), {
      disabled: number(listing.stock ?? listing.quantity) <= 0,
      tone: "civilization-action--primary"
    }));
    market.append(row);
  }
  fragment.append(market);

  const inventorySection = section(documentRef, "Player Inventory");
  const inventory = economy.player_inventory
    ?? economy.inventories?.[model.playerId ?? "mock-player-001"]
    ?? economy.inventory
    ?? {};
  const rows = Object.entries(inventory)
    .filter(([, quantity]) => number(typeof quantity === "object" ? quantity.quantity : quantity) > 0)
    .map(([id, quantity]) => [display(id), typeof quantity === "object" ? quantity.quantity : quantity]);
  inventorySection.append(definitionList(documentRef, rows.length ? rows : [["Stock", "EMPTY"]]));
  fragment.append(inventorySection);

  const exchange = model.exchange ?? {};
  const exchangeSection = section(documentRef, "K11520 Civilization Exchange");
  exchangeSection.append(definitionList(documentRef, [
    ["Exchange", exchange.label ?? exchange.exchange_id],
    ["Candidates", collection(exchange.candidates).length],
    ["Listed", exchange.listed_count],
    ["Automatic Listing", exchange.automatic_listing],
    ["Legal Securities", exchange.legal_securities]
  ]));
  for (const candidate of collection(exchange.candidates)) {
    const row = element(documentRef, "div", "market-listing exchange-candidate");
    const copy = element(documentRef, "div");
    copy.append(
      element(documentRef, "strong", "", display(candidate.asset_id)),
      element(documentRef, "span", "", `${display(candidate.asset_type)} / ${display(candidate.review_status)}`),
      element(documentRef, "small", "", collection(candidate.rights_offered).map((right) => display(right)).join(" / "))
    );
    row.append(copy, actionButton(documentRef, candidate.review_status === "REVIEW_REQUESTED" ? "Review queued" : "Request review", "EXCHANGE_REVIEW", () => callbacks.onExchangeReview?.(candidate.candidate_id), {
      disabled: candidate.review_status !== "CANDIDATE_REVIEW_REQUIRED"
    }));
    exchangeSection.append(row);
  }
  fragment.append(exchangeSection);
  return fragment;
}

function renderCity(documentRef, model) {
  const fragment = documentRef.createDocumentFragment();
  const city = model.city ?? {};
  const progress = model.civilization_progress ?? {};
  const headline = section(documentRef, display(city.label ?? city.city_id ?? "City Runtime"), "civilization-section--city");
  headline.append(definitionList(documentRef, [
    ["Population", city.population],
    ["Employment", city.employment_rate ?? city.work_rate],
    ["Unemployment", city.unemployment_rate],
    ["Food", city.food ?? city.food_stock],
    ["Energy", city.energy],
    ["Housing", city.housing ?? city.housing_capacity],
    ["Roads", city.roads ?? city.road_score],
    ["Pollution", city.pollution],
    ["Happiness", city.happiness],
    ["Industry", city.industry],
    ["Supply Chain", city.supply_chain],
    ["Ecology", city.ecology],
    ["Company Health", city.company_health],
    ["Status", city.status],
    ["Civilization Stage", progress.stage_id],
    ["Civilization Score", progress.score]
  ]));
  fragment.append(headline);

  const balances = section(documentRef, "City Balance");
  const grid = element(documentRef, "div", "needs-grid");
  for (const [key, label, inverse] of [
    ["employment_rate", "Employment", false],
    ["food", "Food", false],
    ["energy", "Energy", false],
    ["housing", "Housing", false],
    ["roads", "Roads", false],
    ["pollution", "Pollution", true],
    ["happiness", "Happiness", false],
    ["industry", "Industry", false],
    ["supply_chain", "Supply Chain", false],
    ["ecology", "Ecology", false]
  ]) grid.append(meter(documentRef, label, city[key], { inverse }));
  balances.append(grid);
  fragment.append(balances);
  return fragment;
}

export function createCivilizationView(container, callbacks = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("Civilization View requires a DOM container");
  }
  const documentRef = container.ownerDocument;
  let activeTab = "TODAY";
  let lastModel = null;

  function render(model = {}) {
    lastModel = model;
    const root = element(documentRef, "div", "civilization-view");
    root.dataset.activeTab = activeTab;
    const header = element(documentRef, "header", "civilization-view__header");
    header.append(
      element(documentRef, "span", "eyebrow", "LOCAL SYNTHETIC SIMULATION"),
      element(documentRef, "strong", "", "Hsinchu Living District")
    );
    const tabs = element(documentRef, "div", "civilization-tabs");
    tabs.setAttribute("role", "tablist");
    for (const [id, label] of TABS) {
      const button = actionButton(documentRef, label, `TAB_${id}`, () => {
        activeTab = id;
        callbacks.onTab?.(id);
        render(lastModel);
      });
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(activeTab === id));
      button.classList.toggle("is-active", activeTab === id);
      tabs.append(button);
    }
    root.append(header, tabs);

    if (activeTab === "GENESIS") root.append(renderGenesis(documentRef, model));
    else if (activeTab === "ECOSYSTEM") root.append(renderEcosystem(documentRef, model));
    else if (activeTab === "FARM") root.append(renderFarm(documentRef, model, callbacks));
    else if (activeTab === "PRODUCTION") root.append(renderProduction(documentRef, model, callbacks));
    else if (activeTab === "COMPANY") root.append(renderCompany(documentRef, model, callbacks));
    else if (activeTab === "MARKET") root.append(renderMarket(documentRef, model, callbacks));
    else if (activeTab === "CITY") root.append(renderCity(documentRef, model));
    else root.append(renderToday(documentRef, model, callbacks));

    container.replaceChildren(root);
  }

  return Object.freeze({
    render,
    setTab(tab) {
      if (!TABS.some(([id]) => id === tab)) return false;
      activeTab = tab;
      if (lastModel) render(lastModel);
      return true;
    },
    getTab: () => activeTab
  });
}
