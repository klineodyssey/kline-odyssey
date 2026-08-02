import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AI_COMPANY_RUNTIME_ID,
  FEASIBILITY_GATES,
  PROJECT_TEMPLATES,
  REQUIRED_DIVISIONS,
  REQUIRED_TEMPLATES,
  computeAiCompanyStateHash,
  createAiCompanyDemonstrationFlows,
  createKaiosAiCompanyRuntimeV1
} from "../ai-company/ai-company-project-runtime.js";

const RUNTIME_SOURCE = new URL("../ai-company/ai-company-project-runtime.js", import.meta.url);
const VIEWER_APP_SOURCE = new URL("../../../world-viewer/ai-company-v1/app.js", import.meta.url);
const TASK_SCHEMA_SOURCE = new URL("../../../KAIOS/ai-company/KAIOS_AI_COMPANY_TASK_SCHEMA_V1.json", import.meta.url);
const TASKS_API_SOURCE = new URL("../../../api/kaios/ai-company/v1/tasks.json", import.meta.url);
const PROJECTS_API_SOURCE = new URL("../../../api/kaios/ai-company/v1/projects.json", import.meta.url);

function requestFor(templateId, overrides = {}) {
  const catalog = {
    FISHPOND_PROJECT: ["I need a fishpond.", "FISHPOND", "LAND-FISHPOND-TEST-001", 250000],
    BASIC_HOUSE_PROJECT: ["I need a basic house.", "HOUSE", "LAND-HOUSE-TEST-001", 220000],
    WAREHOUSE_PROJECT: ["I need a warehouse.", "WAREHOUSE", "LAND-WAREHOUSE-TEST-001", 240000],
    BASIC_ROAD_PROJECT: ["I need a road.", "ROAD", "LAND-ROAD-TEST-001", 280000],
    SMALL_BRIDGE_PROJECT: ["I need a bridge.", "BRIDGE", "LAND-BRIDGE-TEST-001", 360000],
    WORKSHOP_PROJECT: ["I need a workshop.", "WORKSHOP", "LAND-WORKSHOP-TEST-001", 260000],
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
      const result = runtime.assignWorker(projectId, currentTask.task_id, worker.worker_id);
      assert.equal(result.status, "COMPLETED", `${currentTask.task_code}:${skill}:${result.reason ?? "UNKNOWN"}`);
    }
    for (const type of currentTask.equipment) {
      const equipment = plan.equipment.find((candidate) => candidate.type === type);
      const result = runtime.reserveEquipment(projectId, currentTask.task_id, equipment.equipment_id);
      assert.equal(result.status, "COMPLETED", `${currentTask.task_code}:${type}:${result.reason ?? "UNKNOWN"}`);
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
  const state = runtime.getState();
  const window = state.task_windows[taskId];
  if (window && state.simulation_time < window.start) runtime.advanceTime(window.start - state.simulation_time);
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
    "closeProject", "restructureCompany", "enterCourtProtection", "liquidateCompany", "dissolveCompany",
    "exportState", "importState", "resetState", "replayEvents"
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

  const defaultsRuntime = createKaiosAiCompanyRuntimeV1({ seed: "VISIBLE-DEFAULTS" });
  const defaulted = defaultsRuntime.submitRequest({
    request_text: "I need a basic house.", requested_object: "HOUSE",
    requested_location: "LAND-DEFAULTS-001", requested_budget: 220000,
    intended_use: "SIMULATED_HOUSING", rights_context: ["SIMULATED_USAGE_RIGHT"]
  });
  const defaultsAnalysis = defaultsRuntime.analyzeRequirements(defaulted.outputs.request.request_id).outputs.analysis;
  assert.deepEqual(defaultsAnalysis.assumptions.map(({ field }) => field), [
    "customer_life_id", "customer_type", "requested_quantity", "requested_quality",
    "civilization_context", "risk_level", "priority", "requested_deadline"
  ]);
  assert.ok(defaultsAnalysis.assumptions.every(({ label, customer_visibility, approval_status }) => label === "SIMULATION_ASSUMPTION" && customer_visibility && approval_status === "APPROVED"));
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
    ["retired-equipment", (runtime, projectId) => { runtime.createBOM(projectId); runtime.createWorkforcePlan(projectId); return runtime.createEquipmentPlan(projectId, { equipment_states: { SURVEY_TOOL: "RETIRED" } }); }, "NO_EQUIPMENT"],
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
  for (const order of state.procurement_orders) {
    assert.deepEqual(order.state_history.map(({ status }) => status), [
      "RFQ_CREATED", "QUOTES_RECEIVED", "SUPPLIER_SELECTED", "ORDER_PLACED",
      "IN_PRODUCTION", "IN_TRANSIT", "RECEIVED", "ACCEPTED", "PAYMENT_APPROVED"
    ]);
    assert.deepEqual(order.selection_basis, ["QUALITY", "DELIVERY", "CAPACITY", "RISK", "TOTAL_COST"]);
  }
  assert.ok(state.projects[0].risks.length >= 4);
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

test("physical workers obey cumulative shift hours, shift boundaries, and cross-cycle rest", () => {
  const cumulative = createKaiosAiCompanyRuntimeV1({ seed: "CUMULATIVE-SHIFT" });
  const { projectId } = approvedProject(cumulative, "BASIC_ROAD_PROJECT");
  planProject(cumulative, projectId, { schedule: { planned_start: 0 } });
  const state = cumulative.getState();
  const project = state.projects.find((candidate) => candidate.project_id === projectId);
  const plan = state.resource_plans.find((candidate) => candidate.project_id === projectId);
  const operator = plan.workforce.find(({ skill }) => skill === "EXCAVATOR_OPERATOR");
  assert.equal(cumulative.assignWorker(projectId, project.tasks[1].task_id, operator.worker_id, { start: 6, end: 15 }).status, "COMPLETED");
  assert.equal(cumulative.assignWorker(projectId, project.tasks[2].task_id, operator.worker_id, { start: 15, end: 24 }).reason, "REST_REQUIREMENT_CONFLICT");
  assert.equal(cumulative.assignWorker(projectId, project.tasks[2].task_id, operator.worker_id, { start: 20, end: 28 }).reason, "REST_REQUIREMENT_CONFLICT");

  const rest = createKaiosAiCompanyRuntimeV1({ seed: "CROSS-CYCLE-REST" });
  const prepared = approvedProject(rest, "BASIC_ROAD_PROJECT");
  planProject(rest, prepared.projectId, { schedule: { planned_start: 0 } });
  const restState = rest.getState();
  const restProject = restState.projects.find(({ project_id }) => project_id === prepared.projectId);
  const restPlan = restState.resource_plans.find(({ project_id }) => project_id === prepared.projectId);
  const restOperator = restPlan.workforce.find(({ skill }) => skill === "EXCAVATOR_OPERATOR");
  assert.equal(rest.assignWorker(prepared.projectId, restProject.tasks[1].task_id, restOperator.worker_id, { start: 8, end: 20 }).status, "COMPLETED");
  assert.equal(rest.assignWorker(prepared.projectId, restProject.tasks[2].task_id, restOperator.worker_id, { start: 24, end: 30 }).reason, "REST_REQUIREMENT_CONFLICT");
  assert.equal(rest.assignWorker(prepared.projectId, restProject.tasks[2].task_id, restOperator.worker_id, { start: 28, end: 34 }).status, "COMPLETED");
  assert.equal(rest.integrityReport().ok, true);
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

test("task execution enforces schedule windows and full worker reservation coverage", () => {
  const future = createKaiosAiCompanyRuntimeV1({ seed: "FUTURE-WINDOW" });
  const { projectId: futureProjectId } = approvedProject(future, "SOFTWARE_MODULE_PROJECT");
  planProject(future, futureProjectId, { schedule: { planned_start: 100 } });
  future.startProcurement(futureProjectId);
  assignProject(future, futureProjectId);
  future.start();
  const futureTask = future.getState().projects[0].tasks[0];
  assert.equal(future.startTask(futureProjectId, futureTask.task_id).reason, "TASK_WINDOW_NOT_OPEN");
  future.advanceTime(100);
  assert.equal(future.startTask(futureProjectId, futureTask.task_id).status, "COMPLETED");

  const shortShift = createKaiosAiCompanyRuntimeV1({ seed: "SHORT-SHIFT" });
  const { projectId: shortProjectId } = approvedProject(shortShift, "SOFTWARE_MODULE_PROJECT");
  planProject(shortShift, shortProjectId);
  shortShift.startProcurement(shortProjectId);
  const shortState = shortShift.getState();
  const shortTask = shortState.projects[0].tasks[0];
  const shortPlan = shortState.resource_plans[0];
  const worker = shortPlan.workforce.find(({ skill }) => skill === shortTask.skills[0]);
  const equipment = shortPlan.equipment.find(({ type }) => type === shortTask.equipment[0]);
  assert.equal(shortShift.assignWorker(shortProjectId, shortTask.task_id, worker.worker_id, { start: 0, end: 1 }).status, "COMPLETED");
  assert.equal(shortShift.reserveEquipment(shortProjectId, shortTask.task_id, equipment.equipment_id, { start: 0, end: shortTask.duration_hours }).status, "COMPLETED");
  shortShift.start();
  assert.equal(shortShift.startTask(shortProjectId, shortTask.task_id).reason, "SHIFT_OVERLAP");
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
  assert.equal(runtime.integrityReport().ok, true);
  assert.equal(runtime.getState().projects[0].tasks[0].work_segments.reduce((sum, segment) => sum + segment.effective_hours, 0), 4);
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
  for (const pendingTask of runtime.getState().projects[0].tasks.filter(({ status }) => status !== "COMPLETE")) executeTask(runtime, projectId, pendingTask.task_id);
  runtime.scheduleMaintenance(projectId);
  assert.equal(runtime.deliverProject(projectId).status, "COMPLETED");
});

test("change orders explicitly recalculate budget, schedule, materials, rights, and safety", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "CHANGE-ORDER-TEST" });
  const { projectId } = approvedProject(runtime, "BASIC_HOUSE_PROJECT");
  planProject(runtime, projectId);
  assert.equal(runtime.submitChangeOrder(projectId, { added_cost: 100, materials: { STEEL: -1 } }).reason, "INVALID_CHANGE_MATERIAL_QUANTITY");
  assert.equal(runtime.submitChangeOrder(projectId, { added_cost: 100, materials: { UNOBTAINIUM: 1 } }).reason, "UNKNOWN_CHANGE_MATERIAL");
  const before = runtime.getState().projects[0];
  const change = runtime.submitChangeOrder(projectId, { description: "Add reinforced entry", added_cost: 5000, added_duration: 8, materials: { STEEL: 2 }, rights_review: true, safety_review: true }).outputs.change_order;
  assert.equal(change.status, "CHANGE_REQUESTED");
  assert.equal(runtime.approveChangeOrder(change.change_order_id).status, "ACCEPTED");
  const after = runtime.getState().projects[0];
  assert.equal(after.budget.approved_budget, before.budget.approved_budget + 5000);
  assert.equal(after.budget.total_estimated_cost, before.budget.total_estimated_cost + 5000);
  assert.equal(after.schedule.planned_end, before.schedule.planned_end + 8);
  const approvedChange = runtime.getState().change_orders.find(({ change_order_id }) => change.change_order_id);
  assert.equal(approvedChange.dependencies_reviewed, true);
  assert.deepEqual(approvedChange.impact_analysis, {
    budget: "RECALCULATED", schedule: "RECALCULATED", materials: "PROCUREMENT_REQUIRED",
    workforce: "REVALIDATED", equipment: "REVALIDATED", rights: "PASS_SIMULATION",
    safety: "PASS_SIMULATION", dependencies: "RECALCULATED", procurement: "REQUIRED",
    financial_exposure: after.capacity_reserved
  });
  const oversized = runtime.submitChangeOrder(projectId, { added_cost: 900000, materials: { STEEL: 20000 } }).outputs.change_order;
  assert.equal(runtime.approveChangeOrder(oversized.change_order_id).reason, "NO_WAREHOUSE");
  const overexposed = runtime.submitChangeOrder(projectId, { added_cost: 3000000 }).outputs.change_order;
  assert.equal(runtime.approveChangeOrder(overexposed.change_order_id).reason, "COMPANY_CAPACITY_EXCEEDED");
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
  const accountingBefore = structuredClone(state.projects[0].accounting);
  assert.equal(runtime.calculateBudget(state.projects[0].project_id).reason, "PROJECT_PLANNING_LOCKED");
  assert.deepEqual(runtime.getState().projects[0].accounting, accountingBefore);
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
  assert.equal(insolvencyRuntime.restructureCompany().status, "COMPLETED");
  assert.equal(insolvencyRuntime.enterCourtProtection().status, "COMPLETED");
  const liquidation = insolvencyRuntime.liquidateCompany();
  assert.equal(liquidation.status, "COMPLETED");
  assert.equal(liquidation.outputs.recovery.asset_records_preserved, true);
  assert.ok(liquidation.outputs.recovery.assets.equipment.length > 0);
  assert.ok(insolvencyRuntime.getState().procurement_orders.every(({ status }) => ["PAYMENT_APPROVED", "INSPECTION_FAILED", "CANCELLED"].includes(status)));
  const frozenAssets = structuredClone(liquidation.outputs.recovery.assets);
  const frozenFinance = structuredClone(insolvencyRuntime.getState().finance);
  const pendingMaterial = insolvencyRuntime.getState().procurement_orders.find(({ status }) => status === "CANCELLED")?.material_id ?? firstOrder.material_id;
  assert.equal(insolvencyRuntime.receiveMaterial(projectId, pendingMaterial).reason, "COMPANY_TERMINATED");
  assert.equal(insolvencyRuntime.advanceTime(1).reason, "COMPANY_TERMINATED");
  assert.deepEqual(insolvencyRuntime.getState().finance, frozenFinance);
  assert.deepEqual(insolvencyRuntime.getState().company_recovery.find(({ recovery_type }) => recovery_type === "LIQUIDATION_SIMULATION").assets, frozenAssets);
  assert.equal(insolvencyRuntime.dissolveCompany().status, "COMPLETED");
  assert.equal(insolvencyRuntime.getState().company.status, "DISSOLVED");
  assert.equal(insolvencyRuntime.receiveMaterial(projectId, pendingMaterial).reason, "COMPANY_TERMINATED");
  assert.deepEqual(insolvencyRuntime.replayEvents(), insolvencyRuntime.getState());
  assert.equal(insolvencyRuntime.integrityReport().ok, true);
  assert.equal(insolvencyRuntime.integrityReport().ledger_balanced, true);
});

test("five deterministic demonstrations have truthful completion and domain bindings", () => {
  const first = createAiCompanyDemonstrationFlows({ seed: "DEMO-CONTRACT" });
  const second = createAiCompanyDemonstrationFlows({ seed: "DEMO-CONTRACT" });
  assert.equal(first.fishpond.status, "COMPLETE");
  assert.equal(first.fishpond.domain_evidence.runtime, "KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1");
  assert.equal(first.fishpond.domain_evidence.adapter, "EXECUTED_CANONICAL_RUNTIME");
  assert.equal(first.fishpond.domain_evidence.execution_status, "COMPLETE");
  assert.equal(first.fishpond.domain_evidence.integrity_verified, true);
  assert.ok(first.fishpond.domain_evidence.construction_stages.length >= 17);
  assert.equal(first.basic_house.status, "COMPLETE");
  assert.equal(first.basic_house.domain_evidence.runtime, "REAL_CAUSAL_WORLD_FOUNDATION");
  assert.equal(first.basic_house.domain_evidence.adapter, "EXECUTED_CANONICAL_RUNTIME");
  assert.equal(first.basic_house.domain_evidence.final_stage, "COMPLETE");
  assert.equal(first.basic_house.domain_evidence.integrity_verified, true);
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
  const payloadTampered = runtime.exportState();
  payloadTampered.state.events[1].actor_life_id = "LIFE-TAMPERED-ACTOR";
  assert.throws(() => imported.importState(payloadTampered), /EVENT_PAYLOAD_HASH_MISMATCH/);
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

test("warehouse classification is exact and every physical template fits bounded shifts", () => {
  for (const templateId of ["WAREHOUSE_PROJECT", "BASIC_ROAD_PROJECT", "SMALL_BRIDGE_PROJECT", "WORKSHOP_PROJECT"]) {
    assert.ok(PROJECT_TEMPLATES[templateId].tasks.every(({ duration }) => duration <= 12), `${templateId} has an oversized shift`);
    const runtime = createKaiosAiCompanyRuntimeV1({ seed: `PHYSICAL-TEMPLATE-${templateId}` });
    const { projectId } = readyProject(runtime, templateId);
    const project = runtime.getState().projects.find(({ project_id }) => project_id === projectId);
    assert.equal(project.template_id, templateId);
    for (const currentTask of project.tasks) executeTask(runtime, projectId, currentTask.task_id);
    runtime.scheduleMaintenance(projectId);
    assert.equal(runtime.deliverProject(projectId).status, "COMPLETED");
    assert.equal(runtime.acceptProject(projectId, "ACCEPTED").status, "ACCEPTED");
    assert.equal(runtime.closeProject(projectId).status, "COMPLETED");
    assert.equal(runtime.integrityReport().ok, true);
  }
});

test("supplier selection evaluates quality, delivery, capacity, risk, and total cost", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "SUPPLIER-SELECTION" });
  const { projectId } = approvedProject(runtime, "BASIC_HOUSE_PROJECT");
  planProject(runtime, projectId);
  assert.equal(runtime.startProcurement(projectId).status, "COMPLETED");
  for (const order of runtime.getState().procurement_orders) {
    assert.ok(order.supplier_candidates.length >= 3);
    assert.equal(order.supplier_selection.method, "DETERMINISTIC_WEIGHTED_TOTAL_VALUE");
    assert.equal(order.supplier_selection.lowest_price_automatic, false);
    const selected = order.supplier_candidates.find(({ supplier_id }) => supplier_id === order.selected_supplier);
    const highestScore = Math.max(...order.supplier_candidates.filter(({ eligible }) => eligible).map(({ score }) => score));
    const cheapest = order.supplier_candidates.reduce((best, candidate) => candidate.total_cost < best.total_cost ? candidate : best);
    assert.equal(selected.score, highestScore);
    assert.notEqual(selected.supplier_id, cheapest.supplier_id);
  }
  assert.equal(runtime.integrityReport().ok, true);
});

test("failed material inspection releases commitment before deterministic retry", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "PROCUREMENT-RETRY" });
  const { projectId } = approvedProject(runtime, "BASIC_HOUSE_PROJECT");
  planProject(runtime, projectId);
  runtime.startProcurement(projectId, { inspection_fail_materials: ["CONCRETE"] });
  runtime.start();
  const failedOrder = runtime.getState().procurement_orders.find(({ material_id }) => material_id === "CONCRETE");
  runtime.advanceTime(failedOrder.arrival_time);
  const committedBeforeFailure = runtime.getState().projects[0].budget.committed;
  assert.equal(runtime.receiveMaterial(projectId, "CONCRETE").reason, "MATERIAL_INSPECTION_FAILED");
  const afterFailure = runtime.getState();
  assert.equal(afterFailure.projects[0].budget.committed, committedBeforeFailure - failedOrder.committed_amount);
  assert.equal(afterFailure.procurement_orders.find(({ order_id }) => order_id === failedOrder.order_id).commitment_released, true);
  const terminalOrder = structuredClone(afterFailure.procurement_orders.find(({ order_id }) => order_id === failedOrder.order_id));
  assert.equal(runtime.receiveMaterial(projectId, "CONCRETE").reason, "MATERIAL_INSPECTION_TERMINAL");
  assert.deepEqual(runtime.getState().procurement_orders.find(({ order_id }) => order_id === failedOrder.order_id), terminalOrder);
  assert.equal(runtime.startProcurement(projectId).status, "COMPLETED");
  const afterRetry = runtime.getState();
  const expectedCommitment = afterRetry.procurement_orders
    .filter(({ status, commitment_released }) => !commitment_released && !["PAYMENT_APPROVED", "INSPECTION_FAILED", "CANCELLED"].includes(status))
    .reduce((sum, order) => sum + order.committed_amount, 0);
  assert.ok(Math.abs(afterRetry.projects[0].budget.committed - expectedCommitment) < 0.001);
  assert.equal(afterRetry.procurement_orders.filter(({ material_id }) => material_id === "CONCRETE").length, 2);
  assert.equal(runtime.integrityReport().ok, true);
});

test("published task schema covers every strict task projection field", async () => {
  const schema = JSON.parse(await readFile(TASK_SCHEMA_SOURCE, "utf8"));
  const standalone = JSON.parse(await readFile(TASKS_API_SOURCE, "utf8"));
  const projects = JSON.parse(await readFile(PROJECTS_API_SOURCE, "utf8"));
  const projections = [standalone.tasks, projects.projects.flatMap(({ tasks }) => tasks)];
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("work_segments"));
  for (const tasks of projections) {
    for (const task of tasks) {
      assert.deepEqual(Object.keys(task).filter((key) => !(key in schema.properties)), []);
      assert.deepEqual(schema.required.filter((key) => !(key in task)), []);
      for (const segment of task.work_segments) {
        assert.ok(segment.end >= segment.start);
        assert.ok(segment.effective_hours > 0);
      }
    }
  }
});

test("pause-resume preflight blocks cross-project digital worker and equipment collisions", () => {
  const workerRuntime = createKaiosAiCompanyRuntimeV1({ seed: "RESUME-WORKER-COLLISION" });
  const first = approvedProject(workerRuntime, "LIFE_PACKAGE_PROJECT");
  planProject(workerRuntime, first.projectId, { schedule: { planned_start: 0 } });
  workerRuntime.startProcurement(first.projectId);
  const second = approvedProject(workerRuntime, "LIFE_PACKAGE_PROJECT");
  planProject(workerRuntime, second.projectId, { schedule: { planned_start: 17 } });
  workerRuntime.startProcurement(second.projectId);
  assignProject(workerRuntime, first.projectId);
  assignProject(workerRuntime, second.projectId);
  workerRuntime.start();
  const firstTask = workerRuntime.getState().projects.find(({ project_id }) => project_id === first.projectId).tasks[0];
  workerRuntime.startTask(first.projectId, firstTask.task_id);
  workerRuntime.pauseTask(first.projectId, firstTask.task_id);
  workerRuntime.advanceTime(10);
  const reservationsBefore = structuredClone(workerRuntime.getState().worker_reservations);
  const windowsBefore = structuredClone(workerRuntime.getState().task_windows);
  assert.equal(workerRuntime.resumeTask(first.projectId, firstTask.task_id).reason, "SHIFT_OVERLAP");
  assert.deepEqual(workerRuntime.getState().worker_reservations, reservationsBefore);
  assert.deepEqual(workerRuntime.getState().task_windows, windowsBefore);

  const equipmentRuntime = createKaiosAiCompanyRuntimeV1({ seed: "RESUME-EQUIPMENT-COLLISION" });
  const softwareOne = approvedProject(equipmentRuntime, "SOFTWARE_MODULE_PROJECT");
  planProject(equipmentRuntime, softwareOne.projectId, { schedule: { planned_start: 0 } });
  equipmentRuntime.startProcurement(softwareOne.projectId);
  const softwareTwo = approvedProject(equipmentRuntime, "SOFTWARE_MODULE_PROJECT");
  planProject(equipmentRuntime, softwareTwo.projectId, { schedule: { planned_start: 21 } });
  equipmentRuntime.startProcurement(softwareTwo.projectId);
  assignProject(equipmentRuntime, softwareOne.projectId);
  assignProject(equipmentRuntime, softwareTwo.projectId);
  equipmentRuntime.start();
  const softwareTask = equipmentRuntime.getState().projects.find(({ project_id }) => project_id === softwareOne.projectId).tasks[0];
  equipmentRuntime.startTask(softwareOne.projectId, softwareTask.task_id);
  equipmentRuntime.pauseTask(softwareOne.projectId, softwareTask.task_id);
  equipmentRuntime.advanceTime(5);
  assert.equal(equipmentRuntime.resumeTask(softwareOne.projectId, softwareTask.task_id).reason, "EQUIPMENT_RESERVATION_CONFLICT");
});

test("import performs deterministic replay even after hashes are recomputed", () => {
  const source = createKaiosAiCompanyRuntimeV1({ seed: "REPLAY-INVALID-TAMPER" });
  source.start();
  source.advanceTime(1);
  const tampered = source.exportState();
  const action = tampered.state.action_log.at(-1);
  const event = tampered.state.events.at(-1);
  action.args.hours = 2;
  action.arguments_hash = computeAiCompanyStateHash(action.args);
  event.inputs.hours = 2;
  event.action_arguments_hash = action.arguments_hash;
  const eventPayload = structuredClone(event);
  delete eventPayload.event_payload_hash;
  delete eventPayload.next_state_hash;
  event.event_payload_hash = computeAiCompanyStateHash(eventPayload);
  const projectedState = structuredClone(tampered.state);
  projectedState.events = projectedState.events.map((item) => {
    const projectedEvent = { ...item };
    delete projectedEvent.next_state_hash;
    return projectedEvent;
  });
  event.next_state_hash = computeAiCompanyStateHash(projectedState);
  assert.deepEqual(source.validateState(tampered.state), []);
  const target = createKaiosAiCompanyRuntimeV1({ seed: "REPLAY-INVALID-TARGET" });
  assert.throws(() => target.importState(tampered), /IMPORT_REJECTED:REPLAY_STATE_MISMATCH/);
  assert.equal(target.getState().events.length, 0);
});

test("accepted projects reject new and previously submitted change orders", () => {
  const runtime = createKaiosAiCompanyRuntimeV1({ seed: "TERMINAL-CHANGE-ORDER" });
  const { projectId } = readyProject(runtime, "SOFTWARE_MODULE_PROJECT");
  const pending = runtime.submitChangeOrder(projectId, { description: "Pre-acceptance option", added_cost: 200, added_duration: 1 }).outputs.change_order;
  for (const currentTask of runtime.getState().projects[0].tasks) executeTask(runtime, projectId, currentTask.task_id);
  runtime.scheduleMaintenance(projectId);
  runtime.deliverProject(projectId);
  runtime.acceptProject(projectId, "ACCEPTED");
  const before = structuredClone(runtime.getState().projects[0]);
  assert.equal(runtime.submitChangeOrder(projectId, { added_cost: 100, added_duration: 1 }).reason, "PROJECT_NOT_CHANGEABLE");
  assert.equal(runtime.approveChangeOrder(pending.change_order_id).reason, "PROJECT_NOT_CHANGEABLE");
  const after = runtime.getState().projects[0];
  assert.deepEqual(after.budget, before.budget);
  assert.deepEqual(after.schedule, before.schedule);
  assert.deepEqual(after.accounting, before.accounting);
});

test("runtime source has no external execution, wallet connector, or transaction signer", async () => {
  const [source, viewerSource] = await Promise.all([readFile(RUNTIME_SOURCE, "utf8"), readFile(VIEWER_APP_SOURCE, "utf8")]);
  for (const prohibited of [/\bfetch\s*\(/, /XMLHttpRequest/, /\bWebSocket\s*\(/, /window\.ethereum/, /privateKey/, /signTransaction/, /sendTransaction/]) assert.doesNotMatch(source, prohibited);
  assert.match(source, /NO_PRODUCTION_AUTHORITY/);
  assert.match(source, /external_autonomous_execution:\s*false/);
  assert.match(source, /real_kgen:\s*false/);
  assert.doesNotMatch(viewerSource, /importState\(JSON\.parse/);
  assert.match(viewerSource, /importState\(await file\.text\(\)\)/);
});
