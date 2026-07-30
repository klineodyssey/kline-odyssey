const MASK_32 = 0xffffffff;

export const K280_VERSION = "1.0.0";
export const K280_SPECIES_ID = "SPECIES-KAIOS-K280-RAPTOR";
export const K280_ORGANISM_ID = "KAIOS-RAPTOR-K280-001";
export const K280_LIFE_ID = "LIFE-KAIOS-RAPTOR-K280-001";
export const K280_GENOME_ID = "GENOME-KAIOS-RAPTOR-K280-001-G0";
export const K280_EMBODIMENT_ID = "EMBODIMENT-KAIOS-RAPTOR-K280-001-DIGITAL";
export const K280_BIRTH_EVENT_ID = "BIRTH-KAIOS-RAPTOR-K280-001";
export const K280_RUNTIME_INSTANCE_ID = "RUNTIME-KAIOS-RAPTOR-K280-001-LOCAL";
export const DEFAULT_SEED = "KAIOS-K280-GENESIS-SEED-001";

export const CIVILIZATION_STAGES = Object.freeze([
  "PRIMITIVE_FORAGING",
  "AGRICULTURAL",
  "URBAN",
  "INDUSTRIAL",
  "ELECTRICAL",
  "INFORMATION",
  "AI_CIVILIZATION",
  "SPACEFARING",
  "INTERSTELLAR",
  "IMMORTAL_CIVILIZATION",
  "DEITY_CIVILIZATION",
  "DIVINE_ARMY_CIVILIZATION"
]);

export const RIGHTS_CLASSES = Object.freeze([
  "OWNERSHIP_RIGHT",
  "CUSTODY_RIGHT",
  "OPERATION_RIGHT",
  "OCCUPANCY_RIGHT",
  "USAGE_RIGHT",
  "BREEDING_RIGHT",
  "COMMERCIAL_LICENSE",
  "TRANSFER_RIGHT",
  "HABITAT_RIGHT",
  "CONTROL_AUTHORITY"
]);

const TRAIT_RANGES = Object.freeze({
  size: [0.72, 1.28],
  energy_efficiency: [0.7, 1.3],
  sensory_range: [0.65, 1.35],
  intelligence: [0.55, 1.25],
  aggression: [0.25, 0.9],
  sociability: [0.2, 0.95],
  cold_adaptation: [0.55, 1.35],
  speed: [0.7, 1.35],
  healing: [0.65, 1.3],
  fertility: [0.4, 0.95]
});

const STAGE_THRESHOLDS = Object.freeze({
  PRIMITIVE_FORAGING: { population: 1, knowledge: 0, infrastructure: 0, stability: 20 },
  AGRICULTURAL: { population: 8, knowledge: 12, infrastructure: 8, stability: 35 },
  URBAN: { population: 18, knowledge: 24, infrastructure: 20, stability: 45 },
  INDUSTRIAL: { population: 32, knowledge: 38, infrastructure: 38, stability: 50 },
  ELECTRICAL: { population: 40, knowledge: 50, infrastructure: 50, stability: 55 },
  INFORMATION: { population: 48, knowledge: 62, infrastructure: 58, stability: 60 },
  AI_CIVILIZATION: { population: 55, knowledge: 72, infrastructure: 68, stability: 65 },
  SPACEFARING: { population: 62, knowledge: 80, infrastructure: 76, stability: 68 },
  INTERSTELLAR: { population: 68, knowledge: 86, infrastructure: 82, stability: 70 },
  IMMORTAL_CIVILIZATION: { population: 72, knowledge: 91, infrastructure: 87, stability: 74 },
  DEITY_CIVILIZATION: { population: 76, knowledge: 95, infrastructure: 92, stability: 78 },
  DIVINE_ARMY_CIVILIZATION: { population: 80, knowledge: 98, infrastructure: 96, stability: 82 }
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(ordered(value));
}

export function checksum(value) {
  const text = typeof value === "string" ? value : stableStringify(value);
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  return seeds.map((seed, index) => {
    let hash = seed >>> 0;
    for (let cursor = 0; cursor < text.length; cursor += 1) {
      hash ^= text.charCodeAt(cursor) + index * 131;
      hash = Math.imul(hash, 0x01000193) >>> 0;
      hash ^= hash >>> 13;
    }
    const first = (hash >>> 0).toString(16).padStart(8, "0");
    const second = (Math.imul(hash ^ seed, 0x5bd1e995) >>> 0).toString(16).padStart(8, "0");
    return `${first}${second}`;
  }).join("");
}

function seedNumber(seed) {
  return Number.parseInt(checksum(String(seed)).slice(0, 8), 16) >>> 0;
}

export function createRng(seed, initialState = null) {
  let state = Number.isInteger(initialState) ? initialState >>> 0 : seedNumber(seed) || 0x6d2b79f5;
  const random = () => {
    state = (state + 0x6d2b79f5) & MASK_32;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  random.snapshot = () => state >>> 0;
  return random;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function baseAlleles(rng) {
  return Object.fromEntries(Object.entries(TRAIT_RANGES).map(([trait, [minimum, maximum]]) => {
    const value = round(minimum + rng() * (maximum - minimum));
    return [trait, {
      dominant: value,
      recessive: round(clamp(value * (0.86 + rng() * 0.2), minimum, maximum))
    }];
  }));
}

function recombineAlleles(parents, rng) {
  const alleles = {};
  for (const [trait, [minimum, maximum]] of Object.entries(TRAIT_RANGES)) {
    const left = parents[0].allele_groups[trait];
    const right = parents[1].allele_groups[trait];
    const dominant = rng() < 0.5 ? left.dominant : right.dominant;
    const recessive = rng() < 0.5 ? left.recessive : right.recessive;
    alleles[trait] = {
      dominant: round(clamp(dominant, minimum, maximum)),
      recessive: round(clamp(recessive, minimum, maximum))
    };
  }
  return alleles;
}

function mutateAlleles(alleles, rng, probability) {
  const history = [];
  for (const [trait, [minimum, maximum]] of Object.entries(TRAIT_RANGES)) {
    if (rng() >= probability) continue;
    const target = rng() < 0.5 ? "dominant" : "recessive";
    const before = alleles[trait][target];
    const delta = (rng() - 0.5) * (maximum - minimum) * 0.18;
    const after = round(clamp(before + delta, minimum, maximum));
    alleles[trait][target] = after;
    history.push({ trait, allele: target, before, after, delta: round(after - before) });
  }
  return history;
}

export function projectPhenotype(alleleGroups) {
  const expressed = Object.fromEntries(Object.entries(alleleGroups).map(([trait, pair]) => [
    trait,
    round(pair.dominant * 0.72 + pair.recessive * 0.28)
  ]));
  const hue = Math.round(28 + expressed.cold_adaptation * 46 + expressed.sociability * 18);
  return {
    expressed_traits: expressed,
    size_class: expressed.size > 1.1 ? "LARGE" : expressed.size < 0.88 ? "COMPACT" : "STANDARD",
    coloration: `K280-AMBER-${hue}`,
    morphology: "DIGITAL_RAPTOR_BIPEDAL",
    locomotion_profile: expressed.speed > 1.12 ? "SPRINTER" : "BALANCED_RUNNER",
    sensory_profile: expressed.sensory_range > 1.12 ? "LONG_RANGE" : "STANDARD_RANGE",
    social_profile: expressed.sociability > 0.68 ? "COOPERATIVE" : "SOLITARY_LEANING"
  };
}

export function createGenome({
  seed = DEFAULT_SEED,
  parents = [],
  generation = 0,
  mutationProbability = 0.08
} = {}) {
  if (parents.length !== 0 && parents.length !== 2) {
    throw new RangeError("Genome generation requires zero or two parent genomes");
  }
  const parentIds = parents.map((parent) => parent.genome_id);
  const rng = createRng(`${seed}|${parentIds.join("|")}|${generation}`);
  const alleleGroups = parents.length === 2 ? recombineAlleles(parents, rng) : baseAlleles(rng);
  const mutationHistory = mutateAlleles(alleleGroups, rng, mutationProbability);
  const payload = {
    species_id: K280_SPECIES_ID,
    parent_genome_ids: parentIds,
    generation,
    random_seed: seed,
    allele_groups: alleleGroups,
    dominant_traits: Object.fromEntries(Object.entries(alleleGroups).map(([key, value]) => [key, value.dominant])),
    recessive_traits: Object.fromEntries(Object.entries(alleleGroups).map(([key, value]) => [key, value.recessive])),
    mutation_history: mutationHistory,
    phenotype_projection: projectPhenotype(alleleGroups),
    health_predispositions: { resilience: alleleGroups.healing.dominant, cold_stress: round(1.4 - alleleGroups.cold_adaptation.dominant) },
    metabolism_traits: { efficiency: alleleGroups.energy_efficiency.dominant },
    locomotion_traits: { speed: alleleGroups.speed.dominant },
    sensory_traits: { range: alleleGroups.sensory_range.dominant },
    intelligence_traits: { adaptability: alleleGroups.intelligence.dominant },
    aggression_traits: { intensity: alleleGroups.aggression.dominant },
    social_traits: { affinity: alleleGroups.sociability.dominant },
    reproduction_traits: { fertility: alleleGroups.fertility.dominant },
    environmental_adaptation: { cold: alleleGroups.cold_adaptation.dominant },
    lifespan_range_ticks: [1800, 3200],
    size_range_meters: [1.4, 2.1],
    coloration: projectPhenotype(alleleGroups).coloration,
    morphology: "DIGITAL_RAPTOR_BIPEDAL",
    mutation_probability: mutationProbability,
    inheritance_probability: 0.5,
    biological_instruction: false,
    simulation_only: true
  };
  const genomeId = generation === 0 && seed === DEFAULT_SEED
    ? K280_GENOME_ID
    : `GENOME-K280-G${generation}-${checksum(payload).slice(0, 16).toUpperCase()}`;
  const withId = { genome_id: genomeId, ...payload, checksum_algorithm: "K280_FNV1A64" };
  return Object.freeze({ ...withId, integrity_checksum: checksum(withId) });
}

export function verifyGenome(genome) {
  const { integrity_checksum: expected, ...payload } = genome;
  return expected === checksum(payload) && genome.species_id === K280_SPECIES_ID;
}

export function buildBirthPipeline({ species, seed = DEFAULT_SEED } = {}) {
  if (!species || species.species_id !== K280_SPECIES_ID) {
    throw new TypeError("K280 birth pipeline requires the canonical K280 Species");
  }
  const genome = createGenome({ seed });
  const names = [
    "SPECIFICATION",
    "VALIDATION",
    "TAXONOMY",
    "SPECIES_PROGRAM_BINDING",
    "GENOME_GENERATION",
    "ORGANISM_ID_ASSIGNMENT",
    "EMBODIMENT_BINDING",
    "BIRTH_RECORD",
    "RELEASE",
    "DIGITAL_RUNTIME_LIFE"
  ];
  const base = Date.parse("2026-07-30T00:00:00.000Z");
  const stages = names.map((name, index) => {
    const input = index === 0 ? species.species_id : names[index - 1];
    const output = index === names.length - 1 ? K280_RUNTIME_INSTANCE_ID : name;
    const record = {
      stage: name,
      input,
      output,
      timestamp: new Date(base + index * 1000).toISOString(),
      validation_status: "PASS",
      source_version: K280_VERSION,
      deterministic_seed: seed
    };
    return { ...record, integrity_checksum: checksum(record) };
  });
  return {
    pipeline_id: `PIPELINE-K280-${checksum({ seed, species: species.species_id }).slice(0, 12)}`,
    stages,
    genome,
    identity: {
      life_id: K280_LIFE_ID,
      organism_id: K280_ORGANISM_ID,
      species_id: K280_SPECIES_ID,
      genome_id: genome.genome_id,
      embodiment_id: K280_EMBODIMENT_ID,
      birth_event_id: K280_BIRTH_EVENT_ID,
      runtime_instance_id: K280_RUNTIME_INSTANCE_ID
    },
    release: "LOCAL_DETERMINISTIC_SIMULATION",
    production_authority: false,
    wallet: null,
    real_kgen: false,
    event_log: stages.map(({ stage, timestamp, validation_status, integrity_checksum }) => ({
      event: stage,
      timestamp,
      status: validation_status,
      integrity_checksum
    }))
  };
}

function initialState({ genome, sex = "FEMALE", seed = DEFAULT_SEED } = {}) {
  return {
    simulation_time: 0,
    age: 0,
    health: 100,
    energy: 86,
    hunger: 12,
    hydration: 88,
    temperature: 37.2,
    position: { x: 48, y: 52 },
    active_behavior: "WAKE",
    emotional_state: "CURIOUS",
    lifecycle_stage: "HATCHLING",
    growth_stage: "HATCHLING",
    sex,
    sleeping: false,
    alive: true,
    genome_id: genome.genome_id,
    memory: [],
    event_log: [],
    mutation_history: [...genome.mutation_history],
    reproduction_history: [],
    reproduction_cooldown: 0,
    seed,
    revision: 0
  };
}

export class K280LifeRuntime {
  constructor({ genome = createGenome(), seed = DEFAULT_SEED, sex = "FEMALE", state = null, restored = false } = {}) {
    if (!verifyGenome(genome)) throw new TypeError("Genome integrity verification failed");
    this.genome = genome;
    this.state = state ? structuredClone(state) : initialState({ genome, sex, seed });
    this.rng = createRng(`${seed}|runtime`, this.state.rng_state);
    this.state.rng_state = this.rng.snapshot();
    this.maxMemory = 80;
    this.maxEvents = 240;
    if (!restored) this.recordEvent("RUNTIME_INITIALIZED", { mode: "LOCAL_DETERMINISTIC_SIMULATION" });
  }

  snapshot() {
    return structuredClone(this.state);
  }

  serialize() {
    return stableStringify({ version: K280_VERSION, genome: this.genome, state: this.state });
  }

  static restore(serialized) {
    const parsed = JSON.parse(serialized);
    return new K280LifeRuntime({
      genome: parsed.genome,
      seed: parsed.state.seed,
      sex: parsed.state.sex,
      state: parsed.state,
      restored: true
    });
  }

  recordEvent(type, details = {}) {
    this.state.revision += 1;
    this.state.event_log.push({
      event_id: `K280-EVT-${String(this.state.revision).padStart(6, "0")}`,
      tick: this.state.simulation_time,
      type,
      ...details
    });
    this.state.event_log = this.state.event_log.slice(-this.maxEvents);
  }

  recordMemory(summary, importance = 0.5) {
    this.state.memory.push({
      memory_id: `K280-MEM-${String(this.state.revision + this.state.memory.length + 1).padStart(6, "0")}`,
      tick: this.state.simulation_time,
      summary,
      importance: clamp(importance, 0, 1),
      private_real_memory: false
    });
    this.state.memory = this.state.memory.slice(-this.maxMemory);
  }

  random() {
    const value = this.rng();
    this.state.rng_state = this.rng.snapshot();
    return value;
  }

  wake() { this.state.sleeping = false; this.state.active_behavior = "WAKE"; this.recordEvent("WAKE"); }
  sleep() { this.state.sleeping = true; this.state.active_behavior = "SLEEP"; this.recordEvent("SLEEP"); }
  rest() { this.restoreEnergy(8); this.state.active_behavior = "REST"; this.recordEvent("REST"); }
  move(dx = 1, dy = 0) {
    this.state.position.x = clamp(this.state.position.x + dx, 0, 100);
    this.state.position.y = clamp(this.state.position.y + dy, 0, 100);
    this.consumeEnergy(2);
    this.state.active_behavior = "MOVE";
    this.recordEvent("MOVE", { position: { ...this.state.position } });
  }
  perceive(signal = "HABITAT") { this.recordMemory(`Perceived ${signal}`, 0.35); this.recordEvent("PERCEIVE", { signal }); }
  eat(amount = 18) { this.reduceHunger(amount); this.restoreEnergy(amount * 0.35); this.recordEvent("EAT", { amount }); }
  drink(amount = 16) { this.state.hydration = clamp(this.state.hydration + amount, 0, 100); this.recordEvent("DRINK", { amount }); }
  consumeEnergy(amount = 1) { this.state.energy = clamp(this.state.energy - amount, 0, 100); }
  restoreEnergy(amount = 1) { this.state.energy = clamp(this.state.energy + amount, 0, 100); }
  increaseHunger(amount = 1) { this.state.hunger = clamp(this.state.hunger + amount, 0, 100); }
  reduceHunger(amount = 1) { this.state.hunger = clamp(this.state.hunger - amount, 0, 100); }
  healthChange(amount) { this.state.health = clamp(this.state.health + amount, 0, 100); if (this.state.health === 0) this.deathTransition("HEALTH_DEPLETION"); }
  temperatureChange(amount) { this.state.temperature = round(clamp(this.state.temperature + amount, 30, 44), 2); }
  ageGrowth(amount = 1) { this.state.age += amount; this.growthStageChange(); }
  growthStageChange() {
    const next = this.state.age >= 900 ? "ELDER" : this.state.age >= 300 ? "ADULT" : this.state.age >= 90 ? "JUVENILE" : "HATCHLING";
    if (next !== this.state.growth_stage) {
      this.state.growth_stage = next;
      this.state.lifecycle_stage = next;
      this.recordEvent("GROWTH_STAGE_CHANGE", { stage: next });
    }
  }
  selectBehavior() {
    if (!this.state.alive) return "DEAD";
    if (this.state.sleeping) return "SLEEP";
    if (this.state.hydration < 28) return "SEEK_WATER";
    if (this.state.hunger > 68) return "FORAGE";
    if (this.state.energy < 25) return "REST";
    return this.random() > 0.55 ? "EXPLORE" : "OBSERVE";
  }
  socialInteraction(targetId = "SIMULATED-PEER") { this.state.emotional_state = "SOCIAL_ALERT"; this.recordMemory(`Social interaction with ${targetId}`, 0.6); this.recordEvent("SOCIAL_INTERACTION", { target_id: targetId }); }
  huntSimulation(success = this.random() > 0.45) { this.consumeEnergy(8); if (success) this.eat(24); this.recordEvent("HUNT_SIMULATION", { success }); return success; }
  escapeSimulation(success = this.random() > 0.3) { this.consumeEnergy(10); this.recordEvent("ESCAPE_SIMULATION", { success }); return success; }
  injurySimulation(severity = 8) { this.healthChange(-Math.abs(severity)); this.state.emotional_state = "ALERT"; this.recordEvent("INJURY_SIMULATION", { severity }); }
  healingSimulation(amount = 5) { this.healthChange(Math.abs(amount)); this.recordEvent("HEALING_SIMULATION", { amount }); }
  deathTransition(reason = "SIMULATION_TERMINAL") {
    if (!this.state.alive) return;
    this.state.alive = false;
    this.state.lifecycle_stage = "DEAD";
    this.state.active_behavior = "NONE";
    this.recordEvent("DEATH_TRANSITION", { reason, terminal: true });
  }
  mutation(probability = 0.08) {
    const mutated = createGenome({ seed: `${this.state.seed}|mutation|${this.state.revision}`, parents: [this.genome, this.genome], generation: this.genome.generation, mutationProbability: probability });
    this.state.mutation_history.push(...mutated.mutation_history);
    this.recordEvent("MUTATION", { count: mutated.mutation_history.length });
    return mutated;
  }
  mateSelection(candidates = []) {
    if (this.state.growth_stage !== "ADULT" || this.state.health < 70 || this.state.energy < 55 || this.state.reproduction_cooldown > 0) return null;
    return candidates.find((candidate) => candidate.sex !== this.state.sex && candidate.health >= 70 && candidate.energy >= 55) ?? null;
  }
  reproduceSimulation(partner, { population = 1, capacity = 100, hardMaximum = 500 } = {}) {
    if (!partner || population >= Math.min(capacity, hardMaximum)) throw new RangeError("Reproduction gate failed or population capacity reached");
    const child = createGenome({
      seed: `${this.state.seed}|offspring|${this.state.reproduction_history.length + 1}`,
      parents: [this.genome, partner.genome],
      generation: Math.max(this.genome.generation, partner.genome.generation) + 1,
      mutationProbability: 0.12
    });
    this.state.reproduction_cooldown = 40;
    this.state.reproduction_history.push({ partner_genome_id: partner.genome.genome_id, offspring_genome_id: child.genome_id, generation: child.generation });
    this.recordEvent("REPRODUCE_SIMULATION", { offspring_genome_id: child.genome_id });
    return child;
  }

  tick(environment = {}) {
    if (!this.state.alive) return this.snapshot();
    this.state.simulation_time += 1;
    this.ageGrowth(1);
    this.increaseHunger(0.7);
    this.state.hydration = clamp(this.state.hydration - 0.45, 0, 100);
    this.consumeEnergy(this.state.sleeping ? 0.15 : 0.55);
    this.temperatureChange((Number(environment.temperature ?? 7) - 7) * 0.002);
    if (this.state.reproduction_cooldown > 0) this.state.reproduction_cooldown -= 1;
    if (this.state.hunger > 88 || this.state.hydration < 12 || this.state.temperature > 42 || this.state.temperature < 32) this.healthChange(-0.8);
    this.state.active_behavior = this.selectBehavior();
    if (this.state.active_behavior === "REST") this.restoreEnergy(1.2);
    if (this.state.active_behavior === "FORAGE" && this.random() > 0.58) this.eat(8);
    if (this.state.active_behavior === "SEEK_WATER" && this.random() > 0.5) this.drink(8);
    if (this.state.simulation_time % 10 === 0) this.recordMemory(`Tick ${this.state.simulation_time}: ${this.state.active_behavior}`, 0.25);
    this.recordEvent("TICK", { behavior: this.state.active_behavior });
    return this.snapshot();
  }
}

export class CivilizationEngine {
  constructor(state = {}) {
    this.state = {
      stage: "PRIMITIVE_FORAGING",
      population: 1,
      food: 40,
      water: 60,
      energy: 20,
      knowledge: 0,
      tools: 0,
      infrastructure: 0,
      medicine: 0,
      communication: 0,
      governance: 0,
      transport: 0,
      computation: 0,
      social_stability: 45,
      ecological_stability: 70,
      manufacturing: 0,
      automation: 0,
      AI_capability: 0,
      space_capability: 0,
      interstellar_capability: 0,
      lifespan_extension: 0,
      consciousness_integration: 0,
      high_energy_control: 0,
      civilization_defense: 0,
      collective_coordination: 0,
      history: [],
      ...state
    };
  }
  transition(target) {
    const currentIndex = CIVILIZATION_STAGES.indexOf(this.state.stage);
    const targetIndex = CIVILIZATION_STAGES.indexOf(target);
    if (targetIndex !== currentIndex + 1) throw new RangeError("Civilization stages cannot be skipped");
    const gate = STAGE_THRESHOLDS[target];
    if (this.state.population < gate.population || this.state.knowledge < gate.knowledge || this.state.infrastructure < gate.infrastructure || this.state.social_stability < gate.stability) {
      throw new RangeError(`Civilization gate failed for ${target}`);
    }
    const previous = this.state.stage;
    this.state.stage = target;
    this.state.history.push({ from: previous, to: target, transition_cost: targetIndex * 2, status: "PASS" });
    return this.snapshot();
  }
  regress(reason = "STABILITY_FAILURE") {
    const index = CIVILIZATION_STAGES.indexOf(this.state.stage);
    if (index === 0) return this.snapshot();
    const previous = this.state.stage;
    this.state.stage = CIVILIZATION_STAGES[index - 1];
    this.state.history.push({ from: previous, to: this.state.stage, reason, status: "REGRESSION" });
    return this.snapshot();
  }
  evaluateStability() {
    return this.state.social_stability >= 35 && this.state.ecological_stability >= 30 && this.state.food >= 10 && this.state.water >= 10;
  }
  snapshot() { return structuredClone(this.state); }
}

export function runCambrianExplosion({ seed = DEFAULT_SEED, generations = 5, capacity = 100 } = {}) {
  if (generations < 1 || generations > 5) throw new RangeError("K280 MVP supports generations 1 through 5");
  if (capacity > 500) throw new RangeError("Population hard maximum is 500");
  const founder = createGenome({ seed });
  const founderTemplate = createGenome({ seed: `${seed}|FOUNDER-TEMPLATE`, generation: 0 });
  const population = [{ organism_id: K280_ORGANISM_ID, genome: founder, generation: 0, alive: true }];
  const timeline = [{ generation: 0, births: 1, deaths: 0, population: 1, mutation_count: founder.mutation_history.length }];
  let totalBirths = 1;
  let totalDeaths = 0;
  let mutationCount = founder.mutation_history.length;
  let currentParents = [founder, founderTemplate];
  for (let generation = 1; generation <= generations; generation += 1) {
    const available = Math.max(0, Math.min(capacity, 500) - population.filter(({ alive }) => alive).length);
    const births = Math.min(available, Math.max(1, generation * 2));
    const generationGenomes = [];
    for (let index = 0; index < births; index += 1) {
      const genome = createGenome({
        seed: `${seed}|G${generation}|${index}`,
        parents: currentParents,
        generation,
        mutationProbability: 0.1 + generation * 0.015
      });
      generationGenomes.push(genome);
      population.push({ organism_id: `KAIOS-RAPTOR-K280-G${generation}-${String(index + 1).padStart(3, "0")}`, genome, generation, alive: true });
      mutationCount += genome.mutation_history.length;
    }
    totalBirths += births;
    const deaths = generation >= 3 ? Math.min(generation - 2, population.filter(({ alive }) => alive).length - 1) : 0;
    for (let index = 0; index < deaths; index += 1) {
      const target = population.find((entry) => entry.alive && entry.generation < generation);
      if (target) target.alive = false;
    }
    totalDeaths += deaths;
    if (generationGenomes.length >= 2) currentParents = generationGenomes.slice(-2);
    else if (generationGenomes.length === 1) currentParents = [currentParents[0], generationGenomes[0]];
    timeline.push({ generation, births, deaths, population: population.filter(({ alive }) => alive).length, mutation_count: mutationCount });
  }
  const survivors = population.filter(({ alive }) => alive);
  const traitCounts = {};
  for (const entry of survivors) {
    for (const [trait, value] of Object.entries(entry.genome.phenotype_projection.expressed_traits)) {
      traitCounts[trait] = (traitCounts[trait] ?? 0) + value;
    }
  }
  const dominantTraits = Object.entries(traitCounts)
    .map(([trait, total]) => ({ trait, average: round(total / survivors.length) }))
    .sort((left, right) => right.average - left.average)
    .slice(0, 4);
  const branchCount = survivors.filter(({ genome }) => genome.mutation_history.length >= 2).length > 2 ? 1 : 0;
  return {
    mode: "K280_CAMBRIAN_EXPLOSION",
    simulation_only: true,
    scientific_equivalence_claimed: false,
    total_births: totalBirths,
    total_deaths: totalDeaths,
    surviving_population: survivors.length,
    average_health: round(86 - totalDeaths * 0.4),
    average_energy: round(72 - generations * 1.5),
    mutation_count: mutationCount,
    generation_count: generations,
    branch_count: branchCount,
    branch_status: branchCount ? "CANDIDATE_SPECIES_BRANCH" : "NO_BRANCH",
    habitat_pressure: round(Math.min(1, survivors.length / capacity)),
    food_availability: round(Math.max(0.2, 1 - survivors.length / (capacity * 1.2))),
    population_stability: survivors.length > 0 && survivors.length <= capacity ? "STABLE_BOUNDED" : "UNSTABLE",
    dominant_traits: dominantTraits,
    extinct_traits: [],
    capacity,
    hard_maximum: 500,
    timeline,
    population
  };
}
