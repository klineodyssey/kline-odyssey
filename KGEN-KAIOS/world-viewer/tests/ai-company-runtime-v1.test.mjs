import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AI_COMPANY_RUNTIME_ID,
  FEASIBILITY_GATES,
  PROJECT_TEMPLATES,
  REQUIRED_DIVISIONS,
  REQUIRED_TEMPLATES,
  createAiCompanyDemonstrationFlows,
  createKaiosAiCompanyRuntimeV1
} from "../ai-company/ai-company-project-runtime.js";

const RUNTIME_SOURCE = new URL("../ai-company/ai-company-project-runtime.js", import.meta.url);

function requestFor(templateId, overrides = {}) {
  const catalog = {
    FISHPOND_PROJECT: ["I need a fishpond.", "FISHPOND", "LAND-FISHPOND-TEST-001", 250000],
    BASIC_HOUSE_PROJECT: ["I need a basic house.", "HOUSE", "LAND-HOUSE-TEST-001", 220000],
    SMALL_FARM_PROJECT: ["I need a small farm.", "FARM", "LAND-FARM-TEST-001", 180000],
    LIFE_PACKAGE_PROJECT: ["I need a crop candidate life package.", "CROP CANDIDATE LIFE PACKAGE", "LOCAL_SIMULATION_WORKSPACE", 80000],
    SOFTWARE_MODULE_PROJECT: ["I need a World Viewer software panel.", "SOFTWARE WORLD VIEWER PANEL", "LOCAL_SIMULATION_WORKSPACE", 90000]
  };
  const [requestText, requestedObject, location, budget] = catalog[templateId];
  return {
    customer_life_id: "LIFE-TEST-CUSTOMER-001",
    customer_type: "PLAYER",
    request_text: requestText,
    requested_object: requestedObject,
    requested_location: location,
    requested_quantity: 1,
    requested_quality: "STANDARD_SIMULATION",
    requested_deadline: 1000,
    requested_budget: budget,
    intended_use: "UNIT_TEST",
    civilization_context: "INDUSTRIAL",
    rights_context: ["SIMULATED_USAGE_RIGHT"],
    risk_level: "MEDIUM",
    priority: "NORMAL",
    ...overrides
  };
}

function approvedProject(runtime, templateId = "BASIC_HOUSE_PROJECT", requestOverrides = {}) {
  const submitted = runtime.submitRequest(requestFor(templateId, requestOverrides));
  assert.notEqual(submitted.status, "BLOCKED");
  const requestId = submitted.outputs.request.request_id;
  assert.equal(runtime.analyzeRequirements(requestId).status, "COMPLETED");
  assert.equal(runtime.evaluateFeasibility(requestId).status, "COMPLETED");
  const proposal = runtime.createProposal(requestId).outputs.proposal;
  assert.equal(runtime.approveProposal(proposal.proposal_id).status, "ACCEPTED");
  const project = runtime.createProject(proposal.proposal_id).outputs.project;
  assert.equal(runtime.decomposeProject(project.project_id).status, "COMPLETED");
  assert.equal(runtime.calculateDependencies(project.project_id).status, "COMPLETED");
  return { requestId, proposalId: proposal.proposal_id, projectId: project.project_id };
}

function planProject(runtime, projectId, options = {}) {
  const bom = runtime.createBOM(projectId, options.bom);
  const workforce = runtime.createWorkforcePlan(projectId, options.workforce);
  const equipment = runtime.createEquipmentPlan(projectId, options.equipment);
  const supply = runtime.createSupplyChainPlan(projectId, options.supply);
  const budget = runtime.calculateBudget(projectId, options.budget);
  const schedule = runtime.calculateSchedule(projectId, options.schedule);
  const contract = runtime.createSimulatedContract(projectId, options.contract);
  return { bom, workforce, equipment, supply, budget, schedule, contract };
}

function procureProject(runtime, projectId) {
  assert.equal(runtime.startProcurement(projectId).status, "COMPLETED");
  if (runtime.getState().runtime_status !== "RUNNING") runtime.start();
  const orders = runtime.getState().procurement_orders.filter(({ project_id }) => project_id === projectId);
  if (orders.length) {
    const latestArrival = Math.max(...orders.map(({ arrival_time }) => arrival_time));
    const early = runtime.receiveMaterial(projectId, orders[0].material_id);
    assert.equal(early.reason, "TRANSPORT_TIME_REQUIRED");
    runtime.advanceTime(latestArrival - runtime.getState().simulation_time);
    for (const order of orders) assert.equal(runtime.receiveMaterial(projectId, order.material_id).status, "COMPLETED");
  }
  runtime.calculateSchedule(projectId);
}

function assignProject(runtime, projectId) {
  const state = runtime.getState();
  const project = state.projects.find((candidate) => candidate.project_id === projectId);
  const plan = state.resource_plans.find((candidate) => candidate.project_id === projectId);
  for (const currentTask of project.tasks) {
    for (const skill of currentTask.skills) {
      const worker = plan.workforce.find((candidate) => candidate.skill === skill);
      assert.equal(runtime.assignWorker(projectId, currentTask.task_id, worker.worker_id).status, "COMPLETED");
    }
    for (const type of currentTask.equipment) {
      const equipment = plan.equipment.find((candidate) => candidate.type === type);
      assert.equal(runtime.reserveEquipment(projectId, currentTask.task_id, equipment.equipment_id).status, "COMPLETED");
    }
  }
}

function readyProject(runtime, templateId = "BASIC_HOUSE_PROJECT", requestOverrides = {}) {
  const identifiers = approvedProject(runtime, templateId, requestOverrides);
  const plans = planProject(runtime, identifiers.projectId);
  for (const result of Object.values(plans)) assert.notEqual(result.status, "BLOCKED", `${result.reason ?? "planning failure"}`);
  procureProject(runtime, identifiers.projectId);
  assignProject(runtime, identifiers.projectId);
  return identifiers;
}

function executeTask(runtime, projectId, taskId, outcome = "PASS") {
  assert.equal(runtime.startTask(projectId, taskId).status, "COMPLETED");
  const remaining = runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks.find(({ task_id }) => task_id === taskId).remaining_hours;
  assert.equal(runtime.advanceTime(remaining).status, "COMPLETED");
  const inspection = runtime.inspectTask(projectId, taskId, outcome);
  if (["PASS", "PASS_WITH_CONDITIONS"].includes(outcome)) assert.equal(runtime.completeTask(projectId, taskId).status, "COMPLETED");
  return inspection;
}

test("primary factory exposes stable commands, canonical catalogs, and disabled authority", () => {
  const runtime = createKaiosAiCompanyRuntimeV1();
  const requiredCommands = [
    "getState", "start", "pause", "resume", "advanceTime", "runDemonstration", "integrityReport",
    "submitRequest", "requestClarification", "analyzeRequirements", "evaluateFeasibility", "createProposal",
    "approveProposal", "createProject", "decomposeProject", "calculateDependencies", "createBOM",
    "createWorkforcePlan", "createEquipmentPlan", "createSupplyChainPlan", "calculateBudget", "calculateSchedule",
    "createSimulatedContract", "startProcurement", "assignWorker", "reserveEquipment", "receiveMaterial",
    "startTask", "pauseTask", "resumeTask", "blockTask", "completeTask", "inspectTask", "requestRework",
    "submitChangeOrder", "approveChangeOrder", "deliverProject", "acceptProject", "scheduleMaintenance",
    "closeProject", "exportState", "importState", "resetState", "replayEvents"
  ];
  for (const command of requiredCommands) assert.equal(typeof runtime[command], "function", command);
  assert.equal(REQUIRED_DIVISIONS.length, 21);
  assert.equal(FEASIBILITY_GATES.length, 16);
  assert.deepEqual(Object.keys(PROJECT_TEMPLATES), REQUIRED_TEMPLATES);
  assert.equal(Object.isFrozen(PROJECT_TEMPLATES.FISHPOND_PROJECT.tasks), true);
  assert.throws(() => { PROJECT_TEMPLATES.FISHPOND_PROJECT.tasks[0].duration = 0; }, TypeError);
  assert.throws(() => createKaiosAiCompanyRuntimeV1({ capacity: { max_active_projects: 0 } }), /INVALID_CAPACITY_CONFIGURATION/);
  const state = runtime.getState();
  assert.equal(state.runtime, AI_COMPANY_RUNTIME_ID);
  assert.equal(state.company.divisions.length, 21);
  assert.deepEqual(state.boundaries, {
    simulation_only: true, wallet_access: false, real_wallet: false, real_kgen: false,
    onchain_transfer: false, real_legal_effect: false, production_authority: false,
    external_autonomous_execution: false, unbounded_spending: false,
    self_modifying_production_code: false, constitution_source_modification: false,
    current_modification: false, mutation_endpoints: false
  });
  assert.equal(runtime.integrityReport().ok, true);
  runtime.start(); runtime.pause(); runtime.resume(); runtime.stop();
  assert.equal(runtime.getState().runtime_status, "STOPPED");
});

test("request analysis requires clarification and records visible simulation assumptions", () => {
  const runtime = createKaiosAiCompanyRuntimeV1();
  const submitted = runtime.submitRequest(requestFor("BASIC_HOUSE_PROJECT", {
    requested_location: null, requested_budget: 0, intended_use: "", rights_context: [], requested_deadline: null
  }));
  const requestId = submitted.outputs.request.request_id;
  const blocked = runtime.analyzeRequirements(requestId);
  assert.equal(blocked.status, "NEEDS_CLARIFICATION");
  assert.deepEqual(blocked.outputs.missing_fields.sort(), ["intended_use", "requested_budget", "requested_location", "rights_context"]);
  runtime.requestClarification(requestId, blocked.outputs.missing_fields, {
    requested_location: "LAND-HOUSE-TEST-002", requested_budget: 220000,
    intended_use: "SIMULATED_HOUSING", rights_context: ["SIMULATED_USAGE_RIGHT"]
  });
  const analyzed = runtime.analyzeRequirements(requestId);
  assert.equal(analyzed.status, "COMPLETED");
  assert.equal(analyzed.outputs.analysis.assumptions[0].label, "SIMULATION_ASSUMPTION");
  assert.equal(analyzed.outputs.analysis.assumptions[0].customer_visibility, true);
  assert.equal(analyzed.outputs.analysis.assumptions[0].approval_status, "APPROVED");
});

test("all sixteen feasibility gates are explicit and a failed gate creates no project", () => {
  const runtime = createKaiosAiCompanyRuntimeV1();
  const requestId = runtime.submitRequest(requestFor("BASIC_HOUSE_PROJECT")).outputs.request.request_id;
  runtime.analyzeRequirements(requestId);
  const result = runtime.evaluateFeasibility(requestId, { land_available: false });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.outputs.review.gates.length, 16);
  assert.deepEqual(result.outputs.review.gates.map(({ gate_id }) => gate_id), FEASIBILITY_GATES);
  assert.equal(result.outputs.review.gates.find(({ gate_id }) => gate_id === "LAND_GATE").reason, "NO_LAND");
  assert.equal(runtime.createProposal(requestId).status, "BLOCKED");
  assert.equal(runtime.getState().projects.length, 0);
});

test("project decomposition is acyclic and mandatory predecessors cannot be skipped", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "DEPENDENCY-TEST" });
  const { projectId } = readyProject(runtime, "BASIC_HOUSE_PROJECT");
  const project = runtime.getState().projects.find(({ project_id }) => project_id === projectId);
  assert.equal(project.dependencies.length, project.tasks.length - 1);
  assert.equal(runtime.startTask(projectId, project.tasks[1].task_id).reason, "DEPENDENCY_NOT_COMPLETE");
  const tampered = runtime.exportState();
  tampered.state.projects[0].dependencies.push({ dependency_id: "CYCLE", predecessor_task_id: project.tasks.at(-1).task_id, successor_task_id: project.tasks[0].task_id, mandatory: true, status: "UNSATISFIED" });
  assert.ok(runtime.validateState(tampered.state).includes("PROJECT_DEPENDENCY_CYCLE"));
  assert.throws(() => runtime.importState(tampered), /PROJECT_DEPENDENCY_CYCLE/);
});

test("resource plans fail closed for materials, skills, equipment, routes, and warehouse capacity", () => {
  for (const [kind, build, reason] of [
    ["material", (runtime, projectId) => runtime.createBOM(projectId, { unavailable: ["CONCRETE"] }), "NO_MATERIAL"],
    ["workforce", (runtime, projectId) => { runtime.createBOM(projectId); return runtime.createWorkforcePlan(projectId, { omit_skills: ["SURVEYOR"] }); }, "SKILL_NOT_AVAILABLE"],
    ["equipment", (runtime, projectId) => { runtime.createBOM(projectId); runtime.createWorkforcePlan(projectId); return runtime.createEquipmentPlan(projectId, { unavailable: ["SURVEY_TOOL"] }); }, "NO_EQUIPMENT"],
    ["route", (runtime, projectId) => { runtime.createBOM(projectId); return runtime.createSupplyChainPlan(projectId, { route_available: false }); }, "NO_ROUTE"],
    ["warehouse", (runtime, projectId) => runtime.createBOM(projectId, { warehouse_capacity: 1 }), "NO_WAREHOUSE"]
  ]) {
    const runtime = createKaiosAiCompanyRuntimeV1({ seed: `RESOURCE-${kind}` });
    const { projectId } = approvedProject(runtime);
    const result = build(runtime, projectId);
    assert.equal(result.reason, reason, kind);
  }
});

test("funding, simulated deposit, procurement timing, spending, and ledger remain balanced", () => {
  const unfunded = createKaiosAiCompanyRuntimeV1();
  const { projectId: unfundedProject } = approvedProject(unfunded, "BASIC_HOUSE_PROJECT", { requested_budget: 65000 });
  unfunded.createBOM(unfundedProject); unfunded.createWorkforcePlan(unfundedProject); unfunded.createEquipmentPlan(unfundedProject); unfunded.createSupplyChainPlan(unfundedProject);
  assert.equal(unfunded.calculateBudget(unfundedProject, { approved_budget: 1 }).reason, "NO_BUDGET");
  assert.equal(unfunded.createSimulatedContract(unfundedProject).reason, "FUNDED_BUDGET_AND_SCHEDULE_REQUIRED");

  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "FINANCE-TEST" });
  const { projectId } = approvedProject(runtime);
  const planned = planProject(runtime, projectId);
  assert.equal(planned.contract.status, "COMPLETED");
  assert.ok(runtime.getState().finance.customer_deposits > 0);
  const cashAfterDeposit = runtime.getState().finance.cash;
  procureProject(runtime, projectId);
  const state = runtime.getState();
  assert.ok(state.finance.cash < cashAfterDeposit);
  assert.ok(Object.keys(state.material_inventory).length > 0);
  assert.ok(state.ledger.length > 0);
  assert.ok(state.ledger.every((entry) => entry.balanced && entry.debit_amount === entry.credit_amount));
  assert.equal(runtime.integrityReport().ledger_balanced, true);
});

test("single-life assignment enforces skill, location, shift, travel, and rest conflicts", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "WORKER-CONFLICTS" });
  const first = approvedProject(runtime, "BASIC_HOUSE_PROJECT", { requested_location: "LAND-A" });
  planProject(runtime, first.projectId);
  const second = approvedProject(runtime, "BASIC_HOUSE_PROJECT", { requested_location: "LAND-B" });
  planProject(runtime, second.projectId);
  runtime.calculateSchedule(first.projectId, { planned_start: 0 });
  runtime.calculateSchedule(second.projectId, { planned_start: 0 });
  const firstState = runtime.getState();
  const firstProject = firstState.projects.find(({ project_id }) => project_id === first.projectId);
  const secondProject = firstState.projects.find(({ project_id }) => project_id === second.projectId);
  const firstPlan = firstState.resource_plans.find(({ project_id }) => project_id === first.projectId);
  const secondPlan = firstState.resource_plans.find(({ project_id }) => project_id === second.projectId);
  const surveyorOne = firstPlan.workforce.find(({ skill }) => skill === "SURVEYOR");
  const surveyorTwo = secondPlan.workforce.find(({ skill }) => skill === "SURVEYOR");
  const architect = firstPlan.workforce.find(({ skill }) => skill === "ARCHITECT");
  assert.equal(runtime.assignWorker(first.projectId, firstProject.tasks[0].task_id, architect.worker_id).reason, "SKILL_NOT_AVAILABLE");
  assert.equal(runtime.assignWorker(first.projectId, firstProject.tasks[0].task_id, surveyorOne.worker_id).status, "COMPLETED");
  assert.equal(runtime.assignWorker(second.projectId, secondProject.tasks[0].task_id, surveyorTwo.worker_id).reason, "LOCATION_CONFLICT");
  assert.equal(runtime.assignWorker(second.projectId, secondProject.tasks[0].task_id, surveyorTwo.worker_id, { start: 4.2, end: 8.2 }).reason, "TRAVEL_TIME_CONFLICT");
  assert.equal(runtime.assignWorker(second.projectId, secondProject.tasks[0].task_id, surveyorTwo.worker_id, { start: 6, end: 19 }).reason, "REST_REQUIREMENT_CONFLICT");
});

test("equipment requires an assigned operator and ready simulated energy", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "EQUIPMENT-TEST" });
  const { projectId } = approvedProject(runtime, "BASIC_HOUSE_PROJECT");
  planProject(runtime, projectId);
  const state = runtime.getState();
  const project = state.projects.find(({ project_id }) => project_id === projectId);
  const plan = state.resource_plans.find(({ project_id }) => project_id === projectId);
  const survey = project.tasks[0];
  const surveyTool = plan.equipment.find(({ type }) => type === "SURVEY_TOOL");
  assert.equal(runtime.reserveEquipment(projectId, survey.task_id, surveyTool.equipment_id).reason, "NO_MACHINE_OPERATOR");
  const surveyor = plan.workforce.find(({ skill }) => skill === "SURVEYOR");
  runtime.assignWorker(projectId, survey.task_id, surveyor.worker_id);
  assert.equal(runtime.reserveEquipment(projectId, survey.task_id, surveyTool.equipment_id).status, "COMPLETED");
  const requestId = runtime.submitRequest(requestFor("FISHPOND_PROJECT")).outputs.request.request_id;
  runtime.analyzeRequirements(requestId);
  assert.equal(runtime.evaluateFeasibility(requestId, { energy_available: false }).outputs.review.gates.find(({ gate_id }) => gate_id === "ENERGY_GATE").reason, "NO_ENERGY");
});

test("execution consumes explicit time and supports runtime and task pause-resume", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "EXECUTION-TEST" });
  const { projectId } = readyProject(runtime, "BASIC_HOUSE_PROJECT");
  const taskId = runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks[0].task_id;
  assert.equal(runtime.startTask(projectId, taskId).status, "COMPLETED");
  assert.equal(runtime.completeTask(projectId, taskId).reason, "INSPECTION_APPROVAL_REQUIRED");
  assert.equal(runtime.pauseTask(projectId, taskId).status, "COMPLETED");
  assert.equal(runtime.advanceTime(1).outputs.active_tasks, 0);
  assert.equal(runtime.resumeTask(projectId, taskId).status, "COMPLETED");
  const before = runtime.getState();
  runtime.advanceTime(1);
  const after = runtime.getState();
  const currentTask = after.projects.find(({ project_id }) => project_id === projectId).tasks.find(({ task_id: id }) => id === taskId);
  assert.equal(after.simulation_time, before.simulation_time + 1);
  assert.ok(currentTask.remaining_hours > 0);
  assert.ok(currentTask.consumed.labor_hours > 0);
  runtime.pause();
  assert.equal(runtime.advanceTime(1).reason, "RUNTIME_PAUSED");
  runtime.resume();
  runtime.advanceTime(currentTask.remaining_hours);
  assert.equal(runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks[0].status, "INSPECTION_PENDING");
  runtime.inspectTask(projectId, taskId, "PASS");
  runtime.completeTask(projectId, taskId);
  const secondTaskId = runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks[1].task_id;
  assert.equal(runtime.blockTask(projectId, secondTaskId, "SIMULATED_WEATHER_DELAY").status, "COMPLETED");
  assert.equal(runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks[1].blocked_reason, "SIMULATED_WEATHER_DELAY");
});

test("failed inspection creates explicit rework and keeps downstream work blocked", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "REWORK-TEST" });
  const { projectId } = readyProject(runtime, "SOFTWARE_MODULE_PROJECT");
  const firstTask = runtime.getState().projects[0].tasks[0];
  const secondTask = runtime.getState().projects[0].tasks[1];
  assert.equal(runtime.startTask(projectId, secondTask.task_id).reason, "DEPENDENCY_NOT_COMPLETE");
  assert.equal(runtime.startTask(projectId, firstTask.task_id).status, "COMPLETED");
  runtime.advanceTime(firstTask.remaining_hours);
  assert.equal(runtime.inspectTask(projectId, firstTask.task_id, "REWORK_REQUIRED").status, "REWORK_REQUIRED");
  const rework = runtime.requestRework(projectId, firstTask.task_id, { duration_hours: 2 }).outputs.rework_task;
  assert.equal(runtime.startTask(projectId, secondTask.task_id).reason, "DEPENDENCY_NOT_COMPLETE");
  const plan = runtime.getState().resource_plans[0];
  const worker = plan.workforce.find(({ skill }) => skill === rework.skills[0]);
  assert.equal(runtime.assignWorker(projectId, rework.task_id, worker.worker_id).status, "COMPLETED");
  assert.equal(runtime.startTask(projectId, rework.task_id).status, "COMPLETED");
  runtime.advanceTime(2);
  runtime.inspectTask(projectId, rework.task_id, "PASS");
  runtime.completeTask(projectId, rework.task_id);
  assert.equal(runtime.getState().projects[0].tasks.find(({ task_id }) => task_id === firstTask.task_id).status, "INSPECTION_PENDING");
  runtime.inspectTask(projectId, firstTask.task_id, "PASS");
  runtime.completeTask(projectId, firstTask.task_id);
  assert.equal(runtime.getState().projects[0].tasks.find(({ task_id }) => task_id === secondTask.task_id).status, "READY");
});

test("change orders explicitly recalculate budget, schedule, materials, rights, and safety", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "CHANGE-ORDER-TEST" });
  const { projectId } = approvedProject(runtime, "BASIC_HOUSE_PROJECT");
  planProject(runtime, projectId);
  const before = runtime.getState().projects[0];
  const change = runtime.submitChangeOrder(projectId, { description: "Add reinforced entry", added_cost: 5000, added_duration: 8, materials: { STEEL: 2 }, rights_review: true, safety_review: true }).outputs.change_order;
  assert.equal(change.status, "CHANGE_REQUESTED");
  assert.equal(runtime.approveChangeOrder(change.change_order_id).status, "ACCEPTED");
  const after = runtime.getState().projects[0];
  assert.equal(after.budget.approved_budget, before.budget.approved_budget + 5000);
  assert.equal(after.budget.total_estimated_cost, before.budget.total_estimated_cost + 5000);
  assert.equal(after.schedule.planned_end, before.schedule.planned_end + 8);
  assert.equal(runtime.getState().change_orders[0].dependencies_reviewed, true);
});

test("delivery requires completion and maintenance, then acceptance recognizes revenue and closeout releases capacity", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "DELIVERY-TEST" });
  const summary = runtime.runDemonstration("SOFTWARE_MODULE_PROJECT");
  assert.equal(summary.status, "COMPLETE");
  assert.equal(summary.closeout_status, "CLOSED_BALANCED_SIMULATION");
  assert.equal(summary.external_deployment, false);
  const state = runtime.getState();
  assert.equal(state.deliveries[0].status, "ACCEPTED");
  assert.equal(state.maintenance_plans[0].status, "ACTIVE");
  assert.ok(state.finance.project_revenue > 0);
  assert.equal(state.capacity.active_projects, 0);
  assert.equal(runtime.integrityReport().ok, true);
});

test("company capacity blocks excess projects and simulated insolvency remains bounded", () => {
  const capacityRuntime = createKaiosAiCompanyRuntimeV1({ seed: "CAPACITY-TEST", capacity: { max_active_projects: 1, max_active_physical_projects: 1 } });
  approvedProject(capacityRuntime, "BASIC_HOUSE_PROJECT", { requested_location: "LAND-CAPACITY-A" });
  const submitted = capacityRuntime.submitRequest(requestFor("FISHPOND_PROJECT", { requested_location: "LAND-CAPACITY-B" }));
  const requestId = submitted.outputs.request.request_id;
  capacityRuntime.analyzeRequirements(requestId); capacityRuntime.evaluateFeasibility(requestId);
  const proposal = capacityRuntime.createProposal(requestId).outputs.proposal;
  capacityRuntime.approveProposal(proposal.proposal_id);
  const blocked = capacityRuntime.createProject(proposal.proposal_id);
  assert.equal(blocked.reason, "COMPANY_CAPACITY_EXCEEDED");
  assert.equal(blocked.outputs.disposition, "QUEUED");

  const insolvencyRuntime = createKaiosAiCompanyRuntimeV1({ seed: "INSOLVENCY-TEST", initialCash: 0 });
  const { projectId } = approvedProject(insolvencyRuntime, "BASIC_HOUSE_PROJECT");
  planProject(insolvencyRuntime, projectId, { contract: { deposit_rate: 0 } });
  insolvencyRuntime.startProcurement(projectId);
  insolvencyRuntime.start();
  const firstOrder = insolvencyRuntime.getState().procurement_orders[0];
  insolvencyRuntime.advanceTime(firstOrder.arrival_time);
  insolvencyRuntime.receiveMaterial(projectId, firstOrder.material_id);
  const insolvent = insolvencyRuntime.getState();
  assert.equal(insolvent.company.status, "INSOLVENT");
  assert.ok(insolvent.finance.payables > 0);
  assert.equal(insolvencyRuntime.integrityReport().ledger_balanced, true);
});

test("five deterministic demonstrations have truthful completion and domain bindings", () => {
  const first = createAiCompanyDemonstrationFlows({ seed: "DEMO-CONTRACT" });
  const second = createAiCompanyDemonstrationFlows({ seed: "DEMO-CONTRACT" });
  assert.equal(first.fishpond.status, "COMPLETE");
  assert.equal(first.fishpond.domain_evidence.runtime, "KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1");
  assert.equal(first.basic_house.status, "COMPLETE");
  assert.equal(first.basic_house.domain_evidence.runtime, "REAL_CAUSAL_WORLD_FOUNDATION");
  assert.equal(first.blocked_small_farm.status, "BLOCKED_DEPENDENCY");
  assert.equal(first.blocked_small_farm.automatic_completion, false);
  assert.equal(first.candidate_life_package.approval_status, "CANDIDATE_ONLY");
  assert.equal(first.software_module.external_deployment, false);
  assert.deepEqual(first, second);
});

test("serialization, strict import, reset, hash-chain validation, and deterministic replay work", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "REPLAY-TEST" });
  runtime.runDemonstration("FISHPOND_PROJECT");
  const hash = runtime.integrityReport().state_hash;
  const replayed = runtime.replayEvents();
  assert.deepEqual(replayed, runtime.getState());
  assert.equal(runtime.integrityReport().state_hash, hash);
  const serialized = JSON.stringify(runtime.exportState());
  const imported = createKaiosAiCompanyRuntimeV1({ seed: "IMPORT-TARGET" });
  imported.importState(serialized);
  assert.deepEqual(imported.getState(), runtime.getState());
  assert.equal(imported.integrityReport().ok, true);

  const tampered = runtime.exportState();
  tampered.state.events.at(-1).next_state_hash = "0".repeat(64);
  assert.throws(() => imported.importState(tampered), /STATE_HASH_MISMATCH/);
  assert.throws(() => imported.importState('{"state":{},"state":{}}'), /DUPLICATE_JSON_KEY:state/);
  const reset = imported.resetState();
  assert.equal(reset.events.length, 0);
  assert.equal(reset.requests.length, 0);
  assert.equal(reset.runtime_status, "PAUSED");
});

test("imports reject authority and ledger tampering transactionally", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "IMPORT-SECURITY" });
  runtime.runDemonstration("SOFTWARE_MODULE_PROJECT");
  const before = runtime.getState();
  const authority = runtime.exportState();
  authority.state.boundaries.real_kgen = true;
  assert.throws(() => runtime.importState(authority), /AUTHORITY_BOUNDARY/);
  assert.deepEqual(runtime.getState(), before);
  const ledger = runtime.exportState();
  ledger.state.ledger[0].credit_amount += 1;
  assert.throws(() => runtime.importState(ledger), /LEDGER_BALANCE/);
  assert.deepEqual(runtime.getState(), before);
  const replaySource = runtime.exportState();
  replaySource.state.action_log.at(-1).result_status = "FAILED";
  assert.throws(() => runtime.importState(replaySource), /STATE_HASH_MISMATCH|EVENT_ACTION_MISMATCH/);
  assert.deepEqual(runtime.getState(), before);
});

test("runtime source has no external execution, wallet connector, or transaction signer", async () => {
  const source = await readFile(RUNTIME_SOURCE, "utf8");
  for (const prohibited of [/\bfetch\s*\(/, /XMLHttpRequest/, /\bWebSocket\s*\(/, /window\.ethereum/, /privateKey/, /signTransaction/, /sendTransaction/]) assert.doesNotMatch(source, prohibited);
  assert.match(source, /NO_PRODUCTION_AUTHORITY/);
  assert.match(source, /external_autonomous_execution:\s*false/);
  assert.match(source, /real_kgen:\s*false/);
});
