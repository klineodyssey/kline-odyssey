const SCHEMA_VERSION = "0.1.0";
const DEFAULT_SEED = "KAIOS-LIFE-ENERGY-PAYROLL-001";
const CURRENCY = "KAIOS_CREDIT";
const CIVILIZATION_SAMPLES = Object.freeze({
  "KDNA-DESIGN-001": { kind: "KDNA", title: "文明設計圖", value: 10 },
  "KRNA-CODE-001": { kind: "KRNA", title: "可執行器官", value: 20 },
  "KRNA-QA-001": { kind: "KRNA", title: "驗證紀錄", value: 30 }
});

const clone = (value) => JSON.parse(JSON.stringify(value));

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value) {
  const input = stable(value);
  let result = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    result ^= input.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return `fnv1a-${(result >>> 0).toString(16).padStart(8, "0")}`;
}

function initialState(seed) {
  const state = {
    schema_version: SCHEMA_VERSION,
    seed,
    authority: "SIMULATION_ONLY",
    runtime_status: "STOPPED",
    simulation_time: 0,
    life_model: [
      { life_id: "LIFE-GRASS-DEMO", life_exists: true, agency_level: "NO_AGENCY", economic_capability: "NO_ACCOUNT" },
      { life_id: "LIFE-FISH-DEMO", life_exists: true, agency_level: "REACTIVE", economic_capability: "NO_ACCOUNT" },
      { life_id: "LIFE-AI-WORKER-001", life_exists: true, agency_level: "TASK_BOUND", economic_capability: "SIMULATED_WALLET" }
    ],
    accounts: {
      "PROJECT-BUDGET-001": { type: "PROJECT_BUDGET", balance: 1000 },
      "PROJECT-ESCROW-001": { type: "PROJECT_ESCROW", balance: 0 },
      "AI-WORKER-WALLET-001": { type: "AI_WORKER_WALLET", balance: 0 },
      "HOUSEHOLD-LEDGER-001": { type: "HOUSEHOLD", balance: 0 },
      "ENERGY-COST-POOL": { type: "ENERGY_COST", balance: 0 },
      "COMPUTE-COST-POOL": { type: "COMPUTE_COST", balance: 0 },
      "MAINTENANCE-RESERVE": { type: "MAINTENANCE_RESERVE", balance: 0 },
      "PLATFORM-FEE-POOL": { type: "PLATFORM_FEE", balance: 0 }
    },
    credit_supply: 1000,
    physical_resources: {
      electricity_units: 100,
      electricity_consumed: 0,
      compute_units: 100,
      compute_consumed: 0,
      external_ant_food_mass: 100,
      ant_food_mass: 0,
      ant_consumed_mass: 0,
      meadow_nectar_mass: 80,
      meadow_pollen_mass: 30,
      hive_nectar_mass: 0,
      hive_pollen_mass: 0,
      hive_honey_mass: 0,
      hive_processing_byproduct_mass: 0,
      hive_consumed_mass: 0
    },
    worker: {
      life_id: "LIFE-AI-WORKER-001",
      active: true,
      wallet_id: "AI-WORKER-WALLET-001",
      current_task_id: null,
      time_conflict: false,
      life_exists: true
    },
    project: null,
    payroll_claims: [],
    payroll_events: [],
    civilization: {
      authority: "DEMO_ONLY",
      official_quota_used_percent: null,
      demo_quota_used_percent: 0,
      quota_window: "7_DAY_DEMO",
      faction: null,
      reward_pool_total: 100,
      reward_pool_remaining: 100,
      company_energy: 0,
      ally_energy: 0,
      monster_hp: 60,
      hostile_hits: 0,
      receipts: []
    },
    colony_ledgers: {
      ant: {
        ledger_id: "COLONY-LEDGER-ANT-001",
        group_id: "ANT-COLONY-001",
        group_type: "ANT_COLONY",
        work_credits: {},
        ration_allocations: {},
        starvation_risk: false,
        history: []
      },
      bee: {
        ledger_id: "COLONY-LEDGER-BEE-001",
        group_id: "BEE-HIVE-001",
        group_type: "BEE_HIVE",
        work_credits: {},
        honey_shares: {},
        shortage_risk: false,
        history: []
      }
    },
    ledger: [],
    events: [],
    last_result: null,
    state_hash: ""
  };
  state.state_hash = hash(state);
  return state;
}

function accountTotal(state) {
  return Number(Object.values(state.accounts).reduce((sum, account) => sum + account.balance, 0).toFixed(6));
}

export function createLifeEnergyPayrollRuntime({ seed = DEFAULT_SEED } = {}) {
  let seedValue = seed;
  let state = initialState(seedValue);
  let actions = [];
  let replaying = false;
  let civilizationReplayBase = clone(state.civilization);

  function hashableState(source = state) {
    const value = clone(source);
    delete value.events;
    delete value.state_hash;
    delete value.last_result;
    for (const payroll of value.payroll_events ?? []) {
      delete payroll.previous_state_hash;
      delete payroll.next_state_hash;
    }
    return value;
  }

  function timestamp() {
    return new Date(state.simulation_time * 3_600_000).toISOString();
  }

  function event(action, { actor = "KAIOS-RUNTIME", inputs = {}, outputs = {}, cost = 0, status = "COMPLETED", reason = "NONE" } = {}, beforeHash = null) {
    const previous = beforeHash ?? hash(hashableState());
    const next = hash(hashableState());
    const item = {
      event_id: `LIFE-ECON-EVENT-${String(state.events.length + 1).padStart(4, "0")}`,
      simulation_time: state.simulation_time,
      timestamp: timestamp(),
      actor,
      action,
      inputs: clone(inputs),
      outputs: clone(outputs),
      cost,
      status,
      reason,
      previous_state_hash: previous,
      next_state_hash: next
    };
    state.events.push(item);
    state.state_hash = next;
    state.last_result = { status, reason, event_id: item.event_id };
    return clone(item);
  }

  function mutate(action, details, change) {
    const previous = hash(hashableState());
    const outputs = change(previous) ?? {};
    return event(action, { ...details, outputs }, previous);
  }

  function recordAction(name, args = {}) {
    if (!replaying) actions.push({ name, args: clone(args) });
  }

  function blocked(action, reason, inputs = {}) {
    return event(action, { inputs, status: "BLOCKED", reason });
  }

  function transfer(from, to, amount, reason, claimKey = null) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return blocked("CREDIT_TRANSFER", "INVALID_AMOUNT", { from, to, amount });
    if (!state.accounts[from] || !state.accounts[to] || from === to) return blocked("CREDIT_TRANSFER", "INVALID_ACCOUNT", { from, to, amount });
    if (state.accounts[from].balance < value) return blocked("CREDIT_TRANSFER", "INSUFFICIENT_BALANCE", { from, to, amount });
    return mutate("BALANCED_CREDIT_TRANSFER", { inputs: { from, to, amount: value, currency: CURRENCY, claim_key: claimKey } }, () => {
      state.accounts[from].balance = Number((state.accounts[from].balance - value).toFixed(6));
      state.accounts[to].balance = Number((state.accounts[to].balance + value).toFixed(6));
      const entry = {
        entry_id: `CREDIT-ENTRY-${String(state.ledger.length + 1).padStart(4, "0")}`,
        debit_account: from,
        credit_account: to,
        amount: value,
        currency: CURRENCY,
        balanced: true,
        reason,
        claim_key: claimKey,
        simulation_time: state.simulation_time
      };
      state.ledger.push(entry);
      return { entry_id: entry.entry_id, balanced: true };
    });
  }

  function ensureRunning() {
    if (state.runtime_status !== "RUNNING") return blocked("RUNTIME_GATE", "RUNTIME_NOT_RUNNING");
    return null;
  }

  function start() {
    recordAction("start");
    if (state.runtime_status === "RUNNING") return blocked("START_RUNTIME", "ALREADY_RUNNING");
    return mutate("START_RUNTIME", {}, () => {
      state.runtime_status = "RUNNING";
      return { runtime_status: state.runtime_status };
    });
  }

  function pause() {
    recordAction("pause");
    if (state.runtime_status !== "RUNNING") return blocked("PAUSE_RUNTIME", "RUNTIME_NOT_RUNNING");
    return mutate("PAUSE_RUNTIME", {}, () => {
      state.runtime_status = "PAUSED";
      return { runtime_status: state.runtime_status };
    });
  }

  function resume() {
    recordAction("resume");
    if (state.runtime_status !== "PAUSED") return blocked("RESUME_RUNTIME", "RUNTIME_NOT_PAUSED");
    return mutate("RESUME_RUNTIME", {}, () => {
      state.runtime_status = "RUNNING";
      return { runtime_status: state.runtime_status };
    });
  }

  function advanceTime(hours = 1) {
    recordAction("advanceTime", { hours });
    const gate = ensureRunning();
    if (gate) return gate;
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) return blocked("ADVANCE_TIME", "INVALID_DURATION", { hours });
    return mutate("ADVANCE_TIME", { inputs: { hours: value } }, () => {
      state.simulation_time += value;
      return { simulation_time: state.simulation_time };
    });
  }

  function setDemoQuotaUsedPercent(percent) {
    recordAction("setDemoQuotaUsedPercent", { percent });
    const value = Number(percent);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return blocked("SET_DEMO_QUOTA", "PERCENT_OUT_OF_RANGE", { percent });
    }
    return mutate("SET_DEMO_QUOTA", { inputs: { used_percent: value, source: "PLAYER_DEMO" } }, () => {
      state.civilization.demo_quota_used_percent = value;
      return { used_percent: value, reward_delta: 0 };
    });
  }

  function chooseCivilizationFaction(faction) {
    recordAction("chooseCivilizationFaction", { faction });
    const gate = ensureRunning();
    if (gate) return gate;
    if (!["HOSTILE", "ALLY"].includes(faction)) return blocked("CHOOSE_FACTION", "INVALID_FACTION", { faction });
    if (state.civilization.faction) return blocked("CHOOSE_FACTION", "FACTION_ALREADY_LOCKED", { faction });
    return mutate("CHOOSE_FACTION", { inputs: { faction } }, () => {
      state.civilization.faction = faction;
      return { faction, locked: true };
    });
  }

  function submitCivilizationSample(sampleId) {
    recordAction("submitCivilizationSample", { sampleId });
    const gate = ensureRunning();
    if (gate) return gate;
    if (state.civilization.faction !== "ALLY") return blocked("SUBMIT_CIVILIZATION_SAMPLE", "ALLY_REQUIRED", { sampleId });
    const sample = CIVILIZATION_SAMPLES[sampleId];
    if (!sample) return blocked("SUBMIT_CIVILIZATION_SAMPLE", "UNKNOWN_SAMPLE", { sampleId });
    if (state.civilization.receipts.some((receipt) => receipt.sample_id === sampleId)) {
      return blocked("SUBMIT_CIVILIZATION_SAMPLE", "DUPLICATE_SAMPLE", { sampleId });
    }
    const award = Math.min(sample.value, state.civilization.reward_pool_remaining);
    if (award <= 0) return blocked("SUBMIT_CIVILIZATION_SAMPLE", "POOL_EXHAUSTED", { sampleId });
    return mutate("SUBMIT_CIVILIZATION_SAMPLE", { inputs: { sample_id: sampleId, evidence_mode: "FIXED_DEMO_FIXTURE" } }, () => {
      const company = Math.floor(award * 0.4);
      const ally = award - company;
      state.civilization.reward_pool_remaining -= award;
      state.civilization.company_energy += company;
      state.civilization.ally_energy += ally;
      state.civilization.receipts.push({ sample_id: sampleId, kind: sample.kind, title: sample.title, award, company, ally });
      return { sample_id: sampleId, award, company, ally, pool_remaining: state.civilization.reward_pool_remaining };
    });
  }

  function fightCompanyMonster() {
    recordAction("fightCompanyMonster");
    const gate = ensureRunning();
    if (gate) return gate;
    if (state.civilization.faction !== "HOSTILE") return blocked("FIGHT_COMPANY_MONSTER", "HOSTILE_REQUIRED");
    if (state.civilization.monster_hp <= 0) return blocked("FIGHT_COMPANY_MONSTER", "MONSTER_DEFEATED");
    return mutate("FIGHT_COMPANY_MONSTER", { actor: "HOSTILE_PLAYER" }, () => {
      state.civilization.monster_hp = Math.max(0, state.civilization.monster_hp - 10);
      state.civilization.hostile_hits += 1;
      return { damage: 10, monster_hp: state.civilization.monster_hp, quota_reward: 0, civilization_reward: 0 };
    });
  }

  function configurePayrollScenario(options) {
    state.worker.active = options.workerActive !== false;
    state.worker.wallet_id = options.walletExists === false ? null : "AI-WORKER-WALLET-001";
    state.worker.time_conflict = options.timeConflict === true;
    state.life_model.find((item) => item.life_id === state.worker.life_id).economic_capability = options.walletExists === false ? "NO_ACCOUNT" : "SIMULATED_WALLET";
    if (options.projectBudget !== undefined) {
      const delta = state.accounts["PROJECT-BUDGET-001"].balance - Number(options.projectBudget);
      state.accounts["PROJECT-BUDGET-001"].balance = Number(options.projectBudget);
      state.credit_supply -= delta;
    }
  }

  function runPayrollDemo(options = {}) {
    recordAction("runPayrollDemo", options);
    const gate = ensureRunning();
    if (gate) return gate;
    const settings = {
      outcome: "APPROVED",
      grossPay: 120,
      householdTransfer: 10,
      workerActive: true,
      walletExists: true,
      timeConflict: false,
      forceImbalance: false,
      ...options
    };
    configurePayrollScenario(settings);
    const claimKey = "PROJECT-PLANT-001/TASK-CANDIDATE-001/LIFE-AI-WORKER-001/APPROVAL-CODEX-001";
    if (state.payroll_claims.includes(claimKey)) return blocked("PAYROLL_RELEASE", "DUPLICATE_PAYROLL", { claim_key: claimKey });
    if (state.accounts["PROJECT-BUDGET-001"].balance < settings.grossPay) return blocked("PROJECT_ESCROW_RESERVE", "INSUFFICIENT_PROJECT_BUDGET", { required: settings.grossPay });

    mutate("CREATE_CANDIDATE_LIFE_ORDER", { actor: "PLAYER-LIFE-001", inputs: { requested_object: "APPROVED_CANDIDATE_PLANT_LIFE_PACKAGE" } }, () => {
      state.project = {
        project_id: "PROJECT-PLANT-001",
        task_id: "TASK-CANDIDATE-001",
        status: "WORK_IN_PROGRESS",
        worker_life_id: state.worker.life_id,
        deliverable: "CANDIDATE_PLANT_LIFE_PACKAGE",
        approval_id: null,
        acceptance: "PENDING"
      };
      state.worker.current_task_id = state.project.task_id;
      return { project_id: state.project.project_id, status: state.project.status };
    });
    transfer("PROJECT-BUDGET-001", "PROJECT-ESCROW-001", settings.grossPay, "RESERVED_PAYROLL", claimKey);

    if (!state.worker.active) return blocked("WORKER_ASSIGNMENT", "WORKER_INACTIVE", { worker_life_id: state.worker.life_id });
    if (state.worker.time_conflict) return blocked("WORKER_ASSIGNMENT", "ROLE_TIME_CONFLICT", { worker_life_id: state.worker.life_id });
    if (state.physical_resources.electricity_units < 8 || state.physical_resources.compute_units < 12) return blocked("TASK_EXECUTION", "INSUFFICIENT_PHYSICAL_RESOURCES");

    mutate("DELIVER_CANDIDATE_PACKAGE", { actor: state.worker.life_id }, () => {
      state.physical_resources.electricity_units -= 8;
      state.physical_resources.electricity_consumed += 8;
      state.physical_resources.compute_units -= 12;
      state.physical_resources.compute_consumed += 12;
      state.project.status = "REVIEW_PENDING";
      return { handoff: "CANDIDATE_ONLY", electricity_consumed: 8, compute_consumed: 12 };
    });

    if (settings.outcome === "REJECTED") {
      mutate("CODEX_REVIEW", { actor: "codex-gm-01", status: "REJECTED", reason: "TASK_REJECTED" }, () => {
        state.project.status = "REJECTED";
        return { payroll_eligible: false };
      });
      transfer("PROJECT-ESCROW-001", "PROJECT-BUDGET-001", settings.grossPay, "REJECTED_TASK_REFUND", claimKey);
      return clone(state.last_result);
    }
    if (settings.outcome === "REWORK_REQUIRED") {
      return mutate("CODEX_REVIEW", { actor: "codex-gm-01", status: "REWORK_REQUIRED", reason: "REWORK_HOLD" }, () => {
        state.project.status = "REWORK_REQUIRED";
        return { payroll_eligible: false, escrow_held: settings.grossPay };
      });
    }

    mutate("CODEX_REVIEW", { actor: "codex-gm-01" }, () => {
      state.project.status = "APPROVED";
      state.project.approval_id = "APPROVAL-CODEX-001";
      state.project.acceptance = "ACCEPTED_SIMULATION";
      return { approval_id: state.project.approval_id, acceptance: state.project.acceptance };
    });

    if (!state.worker.wallet_id || !state.accounts[state.worker.wallet_id]) {
      return blocked("PAYROLL_RELEASE", "PAYROLL_BLOCKED_MISSING_WALLET", { life_exists: state.worker.life_exists });
    }
    if (settings.forceImbalance) return blocked("PAYROLL_RELEASE", "PAYROLL_BLOCKED_LEDGER_IMBALANCE");

    transfer("PROJECT-ESCROW-001", state.worker.wallet_id, settings.grossPay, "GROSS_PAYROLL_RELEASE", claimKey);
    const deductions = [
      ["ENERGY-COST-POOL", 10, "ENERGY_COST"],
      ["COMPUTE-COST-POOL", 8, "COMPUTE_COST"],
      ["MAINTENANCE-RESERVE", 7, "MAINTENANCE_RESERVE"],
      ["PLATFORM-FEE-POOL", 5, "PLATFORM_FEE"]
    ];
    for (const [target, amount, reason] of deductions) transfer(state.worker.wallet_id, target, amount, reason, claimKey);
    if (settings.householdTransfer > 0) transfer(state.worker.wallet_id, "HOUSEHOLD-LEDGER-001", settings.householdTransfer, "HOUSEHOLD_CONTRACT", claimKey);

    const netPay = settings.grossPay - deductions.reduce((sum, item) => sum + item[1], 0) - settings.householdTransfer;
    return mutate("PAYROLL_RELEASED", { actor: "codex-gm-01", cost: settings.grossPay }, (previousStateHash) => {
      state.payroll_claims.push(claimKey);
      state.project.status = "COMPLETED";
      state.worker.current_task_id = null;
      const payroll = {
        payroll_event_id: "PAYROLL-EVENT-001",
        project_id: state.project.project_id,
        task_id: state.project.task_id,
        worker_life_id: state.worker.life_id,
        wallet_id: state.worker.wallet_id,
        gross_pay: settings.grossPay,
        energy_cost: 10,
        compute_cost: 8,
        maintenance_cost: 7,
        platform_fee: 5,
        household_transfer: settings.householdTransfer,
        tax_simulation: 0,
        net_pay: netPay,
        approval_id: state.project.approval_id,
        reviewer: "codex-gm-01",
        timestamp: timestamp(),
        simulation_time: state.simulation_time,
        currency: CURRENCY,
        simulation_only: true,
        previous_state_hash: previousStateHash,
        next_state_hash: "PENDING_EVENT_HASH",
        status: "PAYROLL_RELEASED"
      };
      state.payroll_events.push(payroll);
      payroll.next_state_hash = hash(hashableState());
      return payroll;
    });
  }

  function runAntColonyScenario({ foodAvailable = true } = {}) {
    const args = { foodAvailable };
    recordAction("runAntColonyScenario", args);
    const gate = ensureRunning();
    if (gate) return gate;
    const colony = state.colony_ledgers.ant;
    if (foodAvailable) {
      mutate("ANT_FOOD_COLLECTION", { actor: "ANT-WORKER-GROUP", inputs: { mass: 20 } }, () => {
        state.physical_resources.external_ant_food_mass -= 20;
        state.physical_resources.ant_food_mass += 20;
        colony.work_credits["ANT-WORKER-GROUP"] = (colony.work_credits["ANT-WORKER-GROUP"] ?? 0) + 20;
        colony.history.push("ANT_WORK_CREDIT:20");
        return { ant_food_mass: state.physical_resources.ant_food_mass, ant_work_credit: 20 };
      });
    }
    const need = 12;
    if (state.physical_resources.ant_food_mass < need) {
      return mutate("ANT_COLONY_RATION", { status: "BLOCKED", reason: "BIOLOGICAL_FOOD_SHORTAGE" }, () => {
        colony.starvation_risk = true;
        colony.ration_allocations = { queen: 0, larvae: 0, workers: 0 };
        return { credits: colony.work_credits, food_mass: state.physical_resources.ant_food_mass, starvation_risk: true };
      });
    }
    return mutate("ANT_COLONY_RATION", {}, () => {
      state.physical_resources.ant_food_mass -= need;
      state.physical_resources.ant_consumed_mass += need;
      colony.ration_allocations = { queen: 3, larvae: 4, workers: 5 };
      colony.starvation_risk = false;
      colony.history.push("ANT_COLONY_RATION:12");
      return { allocations: colony.ration_allocations, remaining_food_mass: state.physical_resources.ant_food_mass };
    });
  }

  function runBeeHiveScenario({ nectarAvailable = true } = {}) {
    const args = { nectarAvailable };
    recordAction("runBeeHiveScenario", args);
    const gate = ensureRunning();
    if (gate) return gate;
    const hive = state.colony_ledgers.bee;
    if (nectarAvailable) {
      mutate("BEE_COLLECTION", { actor: "BEE-WORKER-GROUP", inputs: { nectar_mass: 20, pollen_mass: 8 } }, () => {
        state.physical_resources.meadow_nectar_mass -= 20;
        state.physical_resources.meadow_pollen_mass -= 8;
        state.physical_resources.hive_nectar_mass += 20;
        state.physical_resources.hive_pollen_mass += 8;
        hive.work_credits["BEE-WORKER-GROUP"] = (hive.work_credits["BEE-WORKER-GROUP"] ?? 0) + 28;
        hive.history.push("POLLINATION_CREDIT:28");
        return { pollination_credit: 28, nectar_mass: 20, pollen_mass: 8 };
      });
    }
    if (state.physical_resources.hive_nectar_mass < 10) {
      return mutate("HIVE_HONEY_SHARE", { status: "BLOCKED", reason: "NECTAR_AND_HONEY_SHORTAGE" }, () => {
        hive.shortage_risk = true;
        hive.honey_shares = { queen: 0, larvae: 0, workers: 0 };
        return { credits: hive.work_credits, honey_mass: state.physical_resources.hive_honey_mass, shortage_risk: true };
      });
    }
    mutate("HONEY_PROCESSING", { inputs: { nectar_mass: 10, elapsed_hours: 4 } }, () => {
      state.simulation_time += 4;
      state.physical_resources.hive_nectar_mass -= 10;
      state.physical_resources.hive_honey_mass += 6;
      state.physical_resources.hive_processing_byproduct_mass += 4;
      return { honey_mass: 6, byproduct_mass: 4, mass_balance: 10 };
    });
    return mutate("HIVE_HONEY_SHARE", {}, () => {
      state.physical_resources.hive_honey_mass -= 5;
      state.physical_resources.hive_consumed_mass += 5;
      hive.honey_shares = { queen: 1, larvae: 2, workers: 2 };
      hive.shortage_risk = false;
      hive.history.push("HIVE_HONEY_SHARE:5");
      return { shares: hive.honey_shares, remaining_honey_mass: state.physical_resources.hive_honey_mass };
    });
  }

  function integrityReport(candidate = state) {
    const issues = [];
    if (accountTotal(candidate) !== candidate.credit_supply) issues.push("CREDIT_SUPPLY_IMBALANCE");
    if (candidate.ledger.some((entry) => !entry.balanced || entry.amount <= 0 || entry.debit_account === entry.credit_account)) issues.push("INVALID_LEDGER_ENTRY");
    if (Object.values(candidate.accounts).some((account) => account.balance < 0)) issues.push("NEGATIVE_CREDIT_BALANCE");
    if (Object.values(candidate.physical_resources).some((quantity) => quantity < 0)) issues.push("NEGATIVE_RESOURCE_BALANCE");
    if (new Set(candidate.payroll_claims).size !== candidate.payroll_claims.length) issues.push("DUPLICATE_PAYROLL_CLAIM");
    const antMass = candidate.physical_resources.external_ant_food_mass + candidate.physical_resources.ant_food_mass + candidate.physical_resources.ant_consumed_mass;
    if (antMass !== 100) issues.push("ANT_FOOD_MASS_IMBALANCE");
    const nectarMass = candidate.physical_resources.meadow_nectar_mass + candidate.physical_resources.hive_nectar_mass + candidate.physical_resources.hive_honey_mass + candidate.physical_resources.hive_processing_byproduct_mass + candidate.physical_resources.hive_consumed_mass;
    if (nectarMass !== 80) issues.push("HIVE_NECTAR_MASS_IMBALANCE");
    if (candidate.worker.life_exists !== true) issues.push("WORKER_LIFE_INVALID");
    const civilization = candidate.civilization;
    if (!civilization || civilization.authority !== "DEMO_ONLY" || civilization.official_quota_used_percent !== null) issues.push("CIVILIZATION_DEMO_BOUNDARY");
    else {
      if (!Number.isInteger(civilization.demo_quota_used_percent) || civilization.demo_quota_used_percent < 0 || civilization.demo_quota_used_percent > 100) issues.push("INVALID_DEMO_QUOTA");
      if (![null, "HOSTILE", "ALLY"].includes(civilization.faction)) issues.push("INVALID_FACTION");
      if (civilization.reward_pool_total !== 100 || !Number.isInteger(civilization.reward_pool_remaining) || civilization.reward_pool_remaining < 0 || civilization.reward_pool_remaining > 100) issues.push("INVALID_REWARD_POOL");
      if (!Number.isInteger(civilization.company_energy) || !Number.isInteger(civilization.ally_energy) || civilization.company_energy + civilization.ally_energy + civilization.reward_pool_remaining !== 100) issues.push("REWARD_POOL_IMBALANCE");
      if (!Array.isArray(civilization.receipts) || new Set(civilization.receipts.map((item) => item.sample_id)).size !== civilization.receipts.length) issues.push("DUPLICATE_CIVILIZATION_RECEIPT");
      else {
        const receiptsValid = civilization.receipts.every((item) => {
          const sample = CIVILIZATION_SAMPLES[item.sample_id];
          return sample && item.kind === sample.kind && item.title === sample.title && item.award === sample.value && item.company === Math.floor(item.award * 0.4) && item.ally === item.award - item.company;
        });
        if (!receiptsValid) issues.push("INVALID_CIVILIZATION_RECEIPT");
        if (civilization.receipts.reduce((sum, item) => sum + item.company, 0) !== civilization.company_energy || civilization.receipts.reduce((sum, item) => sum + item.ally, 0) !== civilization.ally_energy) issues.push("CIVILIZATION_RECEIPT_IMBALANCE");
      }
      if (!Number.isInteger(civilization.hostile_hits) || civilization.hostile_hits < 0 || civilization.hostile_hits > 6 || civilization.monster_hp !== 60 - civilization.hostile_hits * 10) issues.push("MONSTER_COMBAT_IMBALANCE");
      if (civilization.faction === "HOSTILE" && civilization.receipts.length) issues.push("HOSTILE_ALLY_DOUBLE_BENEFIT");
      if (civilization.faction === "ALLY" && civilization.hostile_hits) issues.push("ALLY_HOSTILE_DOUBLE_BENEFIT");
    }
    return { ok: issues.length === 0, issues, credit_supply: accountTotal(candidate), state_hash: candidate.state_hash };
  }

  function exportState() {
    return JSON.stringify({ schema_version: SCHEMA_VERSION, seed: state.seed, state, actions, civilization_replay_base: civilizationReplayBase }, null, 2);
  }

  function importState(serialized) {
    const envelope = typeof serialized === "string" ? JSON.parse(serialized) : clone(serialized);
    if (envelope.schema_version !== SCHEMA_VERSION || !envelope.state || !Array.isArray(envelope.actions)) throw new Error("INVALID_LIFE_ENERGY_PAYROLL_ENVELOPE");
    const candidate = clone(envelope.state);
    const report = integrityReport(candidate);
    if (!report.ok) throw new Error(`INVALID_IMPORTED_STATE:${report.issues.join(",")}`);
    const existingSamples = new Set(state.civilization.receipts.map((item) => item.sample_id));
    const incomingSamples = new Set(candidate.civilization.receipts.map((item) => item.sample_id));
    if ([...existingSamples].some((sampleId) => !incomingSamples.has(sampleId))) throw new Error("IMPORT_WOULD_ERASE_CIVILIZATION_RECEIPTS");
    const base = envelope.civilization_replay_base ?? initialState(candidate.seed).civilization;
    if (!base || !Array.isArray(base.receipts) || base.receipts.some((item) => !incomingSamples.has(item.sample_id))) throw new Error("INVALID_CIVILIZATION_REPLAY_BASE");
    state = candidate;
    seedValue = candidate.seed;
    actions = clone(envelope.actions);
    civilizationReplayBase = clone(base);
    return getState();
  }

  function resetState() {
    const preservedCivilization = clone(state.civilization);
    state = initialState(seedValue);
    state.civilization = preservedCivilization;
    state.state_hash = hash(hashableState());
    civilizationReplayBase = clone(preservedCivilization);
    actions = [];
    return getState();
  }

  function dispatchAction(action) {
    if (action.name === "start") return start();
    if (action.name === "pause") return pause();
    if (action.name === "resume") return resume();
    if (action.name === "advanceTime") return advanceTime(action.args.hours);
    if (action.name === "runPayrollDemo") return runPayrollDemo(action.args);
    if (action.name === "runAntColonyScenario") return runAntColonyScenario(action.args);
    if (action.name === "runBeeHiveScenario") return runBeeHiveScenario(action.args);
    if (action.name === "setDemoQuotaUsedPercent") return setDemoQuotaUsedPercent(action.args.percent);
    if (action.name === "chooseCivilizationFaction") return chooseCivilizationFaction(action.args.faction);
    if (action.name === "submitCivilizationSample") return submitCivilizationSample(action.args.sampleId);
    if (action.name === "fightCompanyMonster") return fightCompanyMonster();
    throw new Error(`UNKNOWN_REPLAY_ACTION:${action.name}`);
  }

  function replayEvents() {
    const source = clone(actions.filter((action) => action.name !== "resetState"));
    state = initialState(seedValue);
    state.civilization = clone(civilizationReplayBase);
    state.state_hash = hash(hashableState());
    actions = [];
    replaying = true;
    for (const action of source) dispatchAction(action);
    replaying = false;
    actions = source;
    return getState();
  }

  function getState() {
    return clone({ ...state, actions });
  }

  return {
    start,
    pause,
    resume,
    advanceTime,
    runPayrollDemo,
    runAntColonyScenario,
    runBeeHiveScenario,
    setDemoQuotaUsedPercent,
    chooseCivilizationFaction,
    submitCivilizationSample,
    fightCompanyMonster,
    integrityReport,
    exportState,
    importState,
    resetState,
    replayEvents,
    getState
  };
}

export const LIFE_ENERGY_PAYROLL_BOUNDARIES = Object.freeze({
  simulation_only: true,
  currency: CURRENCY,
  real_wallet: false,
  real_kgen: false,
  on_chain_transfer: false,
  issuance_enabled: false,
  mutation_endpoints: false,
  production_authority: false
});
