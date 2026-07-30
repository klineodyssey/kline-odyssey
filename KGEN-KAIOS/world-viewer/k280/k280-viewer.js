import {
  buildBirthPipeline,
  CivilizationEngine,
  createGenome,
  K280LifeRuntime,
  runCambrianExplosion
} from "../../../KAIOS/K280/runtime/k280-runtime.js";

const apiRoot = "../../../api/kaios/k280";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let species;
let organism;
let listing;
let rights;
let population;
let runtime;
let birthPipeline;
let civilization;
let timer = null;
let speed = 1000;
let activeTab = "genome";

async function loadJson(name) {
  const response = await fetch(`${apiRoot}/${name}.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${name} API returned ${response.status}`);
  return response.json();
}

function dataItem(label, value) {
  return `<div class="data-item"><span>${label}</span><strong>${String(value)}</strong></div>`;
}

function rightRow(label, value) {
  return `<div class="right-row"><span>${label}</span><span>${value}</span></div>`;
}

function renderTab() {
  const state = runtime.snapshot();
  const phenotype = runtime.genome.phenotype_projection;
  const content = $("#tab-content");
  if (activeTab === "genome") {
    const traits = phenotype.expressed_traits;
    content.innerHTML = `<div class="data-grid">
      ${dataItem("Genome generation", runtime.genome.generation)}
      ${dataItem("Integrity", runtime.genome.integrity_checksum.slice(0, 16))}
      ${dataItem("Size class", phenotype.size_class)}
      ${dataItem("Coloration", phenotype.coloration)}
      ${dataItem("Locomotion", phenotype.locomotion_profile)}
      ${dataItem("Social profile", phenotype.social_profile)}
      ${dataItem("Energy efficiency", traits.energy_efficiency)}
      ${dataItem("Cold adaptation", traits.cold_adaptation)}
    </div>`;
  } else if (activeTab === "organs") {
    content.innerHTML = organism.runtime_binding.required_organs
      .map((organ) => rightRow(organ, state.alive ? "HEALTHY" : "SEALED"))
      .join("");
  } else if (activeTab === "rights") {
    content.innerHTML = Object.entries(rights.rights)
      .map(([right, value]) => rightRow(right, value.status))
      .join("");
  } else if (activeTab === "civilization") {
    const civ = civilization.snapshot();
    content.innerHTML = `<div class="data-grid">
      ${dataItem("Stage", civ.stage)}
      ${dataItem("Affinity", "CANDIDATE")}
      ${dataItem("Population", population.surviving_population)}
      ${dataItem("Generation", population.generation_count)}
      ${dataItem("Knowledge", civ.knowledge)}
      ${dataItem("Governance", "NONE")}
    </div>`;
  } else {
    content.innerHTML = `
      ${rightRow("Listing", listing.listing_mode)}
      ${rightRow("Settlement", listing.settlement_mode)}
      ${rightRow("Currency", listing.currency)}
      ${rightRow("Real KGEN", listing.real_kgen)}
      ${rightRow("Wallet", listing.wallet)}
      ${rightRow("On-chain transfer", listing.onchain_transfer)}
      <div class="identity-boundary">${listing.disclaimer}</div>`;
  }
}

function renderTimeline() {
  const events = runtime.snapshot().event_log.slice(-18).reverse();
  $("#event-count").textContent = `${events.length} events`;
  $("#event-timeline").innerHTML = events.map((event) => `
    <li>
      <time>T+${String(event.tick).padStart(3, "0")}</time>
      <div><strong>${event.type}</strong><small>${event.behavior ?? event.mode ?? "deterministic event"}</small></div>
    </li>`).join("");
}

function render() {
  const state = runtime.snapshot();
  const values = {
    "health-value": Math.round(state.health),
    "energy-value": Math.round(state.energy),
    "hunger-value": Math.round(state.hunger),
    "hydration-value": Math.round(state.hydration),
    "age-value": state.age,
    "behavior-value": state.active_behavior,
    "emotion-value": state.emotional_state,
    "growth-stage": state.growth_stage,
    "simulation-time": `T+${String(state.simulation_time).padStart(4, "0")}`
  };
  for (const [id, value] of Object.entries(values)) $(`#${id}`).textContent = value;
  for (const name of ["health", "energy", "hunger", "hydration"]) $(`#${name}-meter`).value = state[name];
  $("#raptor-avatar").style.left = `${Math.max(-4, Math.min(52, state.position.x * 0.52 - 12))}%`;
  $("#raptor-avatar").style.transform = `scale(${0.88 + Math.min(0.18, state.age / 1800)})`;
  $("#organism-tag").querySelector("small").textContent = `${state.growth_stage} · ${state.emotional_state}`;
  renderTab();
  renderTimeline();
}

function step() {
  runtime.tick({ temperature: 7 });
  render();
}

function start() {
  if (timer) return;
  $("#runtime-status").textContent = "RUNNING";
  $(".runtime-state").classList.add("is-running");
  timer = window.setInterval(step, speed);
}

function pause() {
  if (timer) window.clearInterval(timer);
  timer = null;
  $("#runtime-status").textContent = "PAUSED";
  $(".runtime-state").classList.remove("is-running");
}

function reset() {
  pause();
  runtime = new K280LifeRuntime({ genome: createGenome() });
  $("#runtime-status").textContent = "READY";
  render();
}

function replay() {
  pause();
  const target = runtime.snapshot().simulation_time;
  runtime = new K280LifeRuntime({ genome: createGenome() });
  for (let tick = 0; tick < target; tick += 1) runtime.tick({ temperature: 7 });
  $("#runtime-status").textContent = "REPLAYED";
  render();
}

async function boot() {
  [species, organism, listing, rights, population] = await Promise.all([
    loadJson("species"),
    loadJson("organism"),
    loadJson("listing"),
    loadJson("rights"),
    loadJson("population")
  ]);
  birthPipeline = buildBirthPipeline({ species });
  runtime = new K280LifeRuntime({ genome: birthPipeline.genome });
  civilization = new CivilizationEngine();
  $("#life-id").textContent = birthPipeline.identity.life_id;
  $("#organism-id").textContent = birthPipeline.identity.organism_id;
  $("#species-id").textContent = birthPipeline.identity.species_id;
  $("#genome-id").textContent = birthPipeline.identity.genome_id;
  $("#embodiment-id").textContent = birthPipeline.identity.embodiment_id;
  $("#environment-population").textContent = population.surviving_population;
  $("#environment-food").textContent = `${Math.round(population.food_availability * 100)}%`;
  $("#habitat-pressure").textContent = `Habitat pressure ${population.habitat_pressure}`;
  render();
}

$("#start-button").addEventListener("click", start);
$("#pause-button").addEventListener("click", pause);
$("#step-button").addEventListener("click", () => { pause(); step(); });
$("#reset-button").addEventListener("click", reset);
$("#replay-button").addEventListener("click", replay);
$("#speed-select").addEventListener("change", (event) => {
  const running = Boolean(timer);
  pause();
  speed = Number(event.target.value);
  if (running) start();
});
$$(".tabs button").forEach((button) => button.addEventListener("click", () => {
  activeTab = button.dataset.tab;
  $$(".tabs button").forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
  renderTab();
}));

window.addEventListener("pagehide", pause);
boot().catch((error) => {
  $("#runtime-status").textContent = "BOOT FAILED";
  $("#tab-content").textContent = error.message;
  throw error;
});

export { runCambrianExplosion };
