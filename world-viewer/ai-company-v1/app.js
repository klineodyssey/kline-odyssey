import { createKaiosAiCompanyRuntimeV1 } from "../../KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js";

const $ = (id) => document.getElementById(id);
const MAX_IMPORT_BYTES = 2000000;
const QUEUE_URL = "../../api/kaios/ai-company/v1/cursor-queue.json";

const labels = {
  requests: "Customer Requests", analysis: "Requirement Analysis", gates: "Feasibility Gates",
  proposals: "Project Proposals", projects: "Active Projects", dependencies: "Dependency Graph",
  materials: "Materials", workforce: "Workers", equipment: "Equipment", "supply-chain": "Supply Chain",
  budget: "Budget", schedule: "Schedule", procurement: "Procurement", execution: "Construction / Production",
  inspections: "Inspections", changes: "Change Orders", delivery: "Delivery", maintenance: "Maintenance",
  capacity: "Company Capacity", finance: "Company Finance", risks: "Risks", events: "Event Timeline",
  cursor: "Cursor Work Queue"
};

let runtime;
let view = "requests";
let cursorQueue = { status: "LOADING", queue: [] };

const last = (items = []) => items.at(-1) ?? null;
const format = (value, digits = 2) => {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(digits);
  if (typeof value === "boolean") return value ? "YES" : "NO";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "NONE";
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "--");
};

function card(title, rows, meter = null) {
  const article = document.createElement("article");
  article.className = "card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("dl");
  for (const [key, value] of rows) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = key;
    detail.textContent = format(value);
    list.append(term, detail);
  }
  article.append(heading, list);
  if (meter !== null) {
    const track = document.createElement("div");
    const fill = document.createElement("span");
    track.className = "meter";
    fill.style.width = `${Math.max(0, Math.min(100, Number(meter) || 0))}%`;
    track.append(fill);
    article.append(track);
  }
  return article;
}

function cards(items) {
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const item of items) grid.append(item);
  return grid;
}

function currentContext(state) {
  const request = last(state.requests);
  const proposal = [...state.proposals].reverse().find((item) => !request || item.request_id === request.request_id) ?? last(state.proposals);
  const project = [...state.projects].reverse().find((item) => !proposal || item.proposal_id === proposal.proposal_id) ?? last(state.projects);
  const task = project?.tasks?.find((item) => ["IN_PROGRESS", "READY", "INSPECTION_PENDING", "REWORK_REQUIRED", "PAUSED"].includes(item.status)) ?? project?.tasks?.[0] ?? null;
  return { request, proposal, project, task };
}

function flattenPlans(state, key) {
  return state.resource_plans.flatMap((plan) => (plan[key] ?? []).map((item) => ({ ...item, resource_plan_id: plan.resource_plan_id })));
}

function renderTimeline(events) {
  const list = document.createElement("ol");
  list.className = "timeline";
  for (const event of events.slice(-150).reverse()) {
    const row = document.createElement("li");
    const time = document.createElement("time");
    const type = document.createElement("strong");
    const detail = document.createElement("span");
    time.textContent = `T${event.simulation_time}`;
    type.textContent = event.event_type;
    detail.textContent = `${event.status}${event.reason ? ` / ${event.reason}` : ""} / ${event.next_state_hash}`;
    row.append(time, type, detail);
    list.append(row);
  }
  return list;
}

function renderDependencies(projects) {
  const board = document.createElement("div");
  board.className = "dependency-board";
  for (const project of projects) {
    for (const edge of project.dependencies ?? []) {
      const row = document.createElement("div");
      row.className = "dependency-row";
      const predecessor = document.createElement("b");
      const arrow = document.createElement("i");
      const successor = document.createElement("span");
      const status = document.createElement("small");
      predecessor.textContent = edge.predecessor_task_id;
      arrow.textContent = "→";
      successor.textContent = edge.successor_task_id;
      status.textContent = edge.status;
      row.append(predecessor, arrow, successor, status);
      board.append(row);
    }
  }
  return board;
}

function render() {
  const state = runtime.getState();
  const integrity = runtime.integrityReport();
  const active = state.projects.filter((project) => !["COMPLETE", "CANCELLED", "FAILED"].includes(project.status)).length;
  $("runtime-state").textContent = state.runtime_status;
  $("clock").textContent = `${format(state.simulation_time, 0)} h`;
  $("request-count").textContent = String(state.requests.length);
  $("project-count").textContent = `${active} / ${state.capacity.max_active_projects}`;
  $("cash").textContent = `${format(state.finance.cash)} SIM`;
  $("review-queue").textContent = `${state.capacity.review_queue} / ${state.capacity.max_review_queue}`;
  $("integrity").textContent = integrity.ok ? "INTEGRITY PASS" : "INTEGRITY FAIL";
  $("view-title").textContent = labels[view];
  $("loading").hidden = true;
  $("error").hidden = true;

  const target = $("view");
  target.setAttribute("aria-busy", "false");
  target.replaceChildren();
  let items = [];

  if (view === "requests") items = state.requests.map((request) => card(request.request_id, [["Status", request.status], ["Customer", request.customer_life_id], ["Need", request.request_text], ["Object", request.requested_object], ["Location", request.requested_location], ["Budget", request.requested_budget], ["Priority", request.priority]]));
  if (view === "analysis") items = state.requests.flatMap((request) => [card(`${request.request_id} / Assumptions`, [["Status", request.status], ["Assumptions", request.assumptions.map((item) => `${item.label}:${item.description}`)]]), ...Object.entries(request.structured_requirements).map(([key, values]) => card(key.toUpperCase(), [["Request", request.request_id], ["Requirements", values]]))]);
  if (view === "gates") items = state.feasibility_reviews.flatMap((review) => review.gates.map((gate) => card(gate.gate_id, [["Request", review.request_id], ["Outcome", gate.outcome], ["Reason", gate.reason ?? "NONE"], ["Required", gate.required_to_unblock]])));
  if (view === "proposals") items = state.proposals.map((proposal) => card(proposal.proposal_id, [["Request", proposal.request_id], ["Template", proposal.template_id], ["Status", proposal.status], ["Budget", proposal.estimated_cost], ["Duration", `${format(proposal.estimated_duration)} h`], ["Assumptions", proposal.assumptions.length]]));
  if (view === "projects") items = state.projects.map((project) => card(project.project_id, [["Template", project.template_id], ["Status", project.status], ["Location", project.location], ["Domain", project.domain_binding], ["Tasks", project.tasks.length], ["Issues", project.issues.length], ["Progress", `${format(project.progress_percent)}%`]], project.progress_percent));
  if (view === "dependencies") { target.append(renderDependencies(state.projects)); $("empty").hidden = state.projects.some((project) => project.dependencies?.length); return; }
  if (view === "materials") items = flattenPlans(state, "bill_of_materials").map((item) => card(item.material_id, [["Project", item.project_id], ["Quantity", `${format(item.quantity)} ${item.unit}`], ["Mass", item.total_mass], ["Available", item.availability], ["Cost", item.total_cost], ["Status", item.status]]));
  if (view === "workforce") items = flattenPlans(state, "workforce").map((worker) => card(worker.life_id, [["Role", worker.role], ["Skill", worker.skill], ["Location", worker.location], ["Travel", `${format(worker.travel_time)} h`], ["Available", worker.availability], ["Status", worker.status]]));
  if (view === "equipment") items = flattenPlans(state, "equipment").map((equipment) => card(equipment.equipment_id, [["Type", equipment.type], ["Location", equipment.location], ["Operator", equipment.operator_requirement], ["Energy", equipment.energy_type], ["Wear", equipment.wear], ["Maintenance", equipment.maintenance_state], ["Status", equipment.status]], (1 - equipment.wear) * 100));
  if (view === "supply-chain") items = flattenPlans(state, "supply_chain").map((leg) => card(leg.transport_id, [["Origin", leg.origin], ["Destination", leg.destination], ["Route", leg.route], ["Mass", leg.mass], ["Vehicle", leg.vehicle], ["Time", `${format(leg.loading_time + leg.travel_time + leg.unloading_time)} h`], ["Status", leg.status]]));
  if (view === "budget") items = state.projects.filter((project) => project.budget).map((project) => card(project.project_id, [["Status", project.budget.status], ["Funding", project.budget.funding_source], ["Estimated", project.budget.total_estimated_cost], ["Approved", project.budget.approved_budget], ["Spent", project.budget.spent], ["Committed", project.budget.committed], ["Remaining", project.budget.remaining]]));
  if (view === "schedule") items = state.projects.filter((project) => project.schedule).map((project) => card(project.project_id, [["Status", project.schedule.status], ["Start", project.schedule.planned_start], ["End", project.schedule.planned_end], ["Duration", `${format(project.schedule.estimated_duration)} h`], ["Critical path", project.schedule.critical_path], ["Delays", project.schedule.weather_delay + project.schedule.inspection_delay + project.schedule.rework_delay + project.schedule.transport_delay]]));
  if (view === "procurement") items = state.procurement_orders.map((item) => card(item.order_id, [["Project", item.project_id], ["Material", item.material_id], ["Quantity", format(item.quantity)], ["Material cost", item.material_cost], ["Transport cost", item.transport_cost], ["Arrival", `${format(item.arrival_time)} h`], ["Status", item.status]]));
  if (view === "execution") items = state.projects.flatMap((project) => project.tasks.map((task) => card(task.task_id, [["Project", project.project_id], ["Objective", task.objective], ["Status", task.status], ["Remaining", `${format(task.remaining_hours)} h`], ["Labor", task.consumed.labor_hours], ["Energy", task.consumed.energy], ["Cost", task.consumed.cost], ["Progress", `${format(task.progress_percent)}%`]], task.progress_percent)));
  if (view === "inspections") items = state.inspections.map((inspection) => card(inspection.inspection_id, [["Project", inspection.project_id], ["Task", inspection.task_id], ["Type", inspection.inspection_type], ["Result", inspection.result], ["Defects", inspection.defects], ["Status", inspection.status]]));
  if (view === "changes") items = state.change_orders.map((change) => card(change.change_order_id, [["Project", change.project_id], ["Description", change.description], ["Budget delta", change.added_cost], ["Schedule delta", `${format(change.added_duration)} h`], ["Dependencies reviewed", change.dependencies_reviewed], ["Status", change.status]]));
  if (view === "delivery") items = state.deliveries.map((delivery) => card(delivery.delivery_id, [["Project", delivery.project_id], ["Deliverables", delivery.deliverable_ids], ["Documentation", delivery.documentation_complete], ["Rights", delivery.rights_package], ["Maintenance", delivery.maintenance_plan_complete], ["Customer", delivery.customer_outcome ?? "PENDING"], ["Status", delivery.status]]));
  if (view === "maintenance") items = state.maintenance_plans.map((item) => card(item.maintenance_id, [["Project", item.project_id], ["Schedule", item.maintenance_schedule], ["Inspection", item.inspection_schedule], ["Wear monitoring", item.wear_monitoring], ["Responsible", item.repair_responsibility], ["Asset", item.asset_status], ["Status", item.status]]));
  if (view === "capacity") items = [card(state.capacity.status, [["Active", `${state.capacity.active_projects} / ${state.capacity.max_active_projects}`], ["Physical", `${state.capacity.active_physical_projects} / ${state.capacity.max_active_physical_projects}`], ["Digital", `${state.capacity.active_digital_projects} / ${state.capacity.max_active_digital_projects}`], ["Compute", `${format(state.capacity.compute_load * 100)}%`], ["Review", `${state.capacity.review_queue} / ${state.capacity.max_review_queue}`], ["Procurement", `${state.capacity.procurement_queue} / ${state.capacity.max_procurement_queue}`], ["Workers", `${state.capacity.worker_assignments} / ${state.capacity.max_worker_assignments}`], ["Exposure", `${format(state.capacity.financial_exposure)} / ${format(state.capacity.max_financial_exposure)}`]], Math.max(state.capacity.active_projects / state.capacity.max_active_projects, state.capacity.compute_load) * 100)];
  if (view === "finance") items = [card(state.company.status, [["Cash", state.finance.cash], ["Receivables", state.finance.receivables], ["Payables", state.finance.payables], ["Work in progress", state.finance.work_in_progress], ["Customer deposits", state.finance.customer_deposits], ["Project revenue", state.finance.project_revenue], ["Project cost", state.finance.project_cost], ["Profit / loss", state.finance.profit_or_loss], ["Debt", state.finance.debt], ["Balanced entries", state.ledger.length]])];
  if (view === "risks") items = state.projects.flatMap((project) => project.risks.map((risk) => card(risk.risk_id, [["Project", project.project_id], ["Description", risk.description], ["Probability", risk.probability], ["Impact", risk.impact], ["Mitigation", risk.mitigation], ["Status", risk.status]], (1 - risk.probability * risk.impact) * 100)));
  if (view === "cursor") items = (cursorQueue.queue ?? []).map((item) => card(`${item.priority}. ${item.task_id}`, [["Work", item.work], ["Status", item.status], ["Worker", cursorQueue.worker_id], ["Concurrency", cursorQueue.one_task_at_a_time ? "ONE_TASK_AT_A_TIME" : "UNAVAILABLE"], ["Authority", cursorQueue.output_authority]]));
  if (view === "events") { target.append(renderTimeline(state.events)); $("empty").hidden = state.events.length > 0; return; }

  $("empty").hidden = items.length > 0;
  if (items.length) target.append(cards(items));
}

function showResult(result) {
  if (!result) return;
  const entries = Array.isArray(result) ? result : [result];
  const blocked = [...entries].reverse().find((item) => item?.status === "BLOCKED" || item?.reason);
  const latest = blocked ?? entries.at(-1);
  $("notice").textContent = `${latest?.status ?? "COMPLETED"}${latest?.reason ? ` / ${latest.reason}` : ""}`;
  $("notice").hidden = false;
}

function safe(action) {
  try {
    $("error").hidden = true;
    const result = action();
    showResult(result);
    render();
  } catch (error) {
    $("error-detail").textContent = error instanceof Error ? error.message : "Unknown simulation error";
    $("error").hidden = false;
  }
}

function contextIds() {
  const context = currentContext(runtime.getState());
  return {
    requestId: context.request?.request_id,
    proposalId: context.proposal?.proposal_id,
    projectId: context.project?.project_id,
    taskId: context.task?.task_id,
    changeId: last(runtime.getState().change_orders)?.change_order_id
  };
}

function submitRequest() {
  const requestedObject = $("template-select").value;
  return runtime.submitRequest({
    customer_life_id: "LIFE-KAIOS-PLAYER-SIM-001",
    customer_type: "PLAYER",
    request_text: $("request-text").value.trim(),
    requested_object: requestedObject,
    requested_location: "STARTER-LAND-K280-SIM-001",
    requested_quantity: 1,
    requested_quality: "BASIC_SIMULATION",
    requested_deadline: null,
    requested_budget: Number($("request-budget").value),
    intended_use: "LOCAL_DETERMINISTIC_SIMULATION",
    civilization_context: "INDUSTRIAL",
    rights_context: ["SIMULATED_USAGE_RIGHT"],
    risk_level: "MEDIUM",
    priority: "NORMAL"
  });
}

function planProject() {
  const { projectId } = contextIds();
  return [
    runtime.decomposeProject(projectId),
    runtime.calculateDependencies(projectId),
    runtime.createBOM(projectId),
    runtime.createWorkforcePlan(projectId),
    runtime.createEquipmentPlan(projectId),
    runtime.createSupplyChainPlan(projectId),
    runtime.calculateBudget(projectId),
    runtime.calculateSchedule(projectId)
  ];
}

function startPlannedTask() {
  const { projectId, taskId } = contextIds();
  const state = runtime.getState();
  const project = state.projects.find((item) => item.project_id === projectId);
  const task = project?.tasks.find((item) => item.task_id === taskId);
  const plan = state.resource_plans.find((item) => item.project_id === projectId);
  const results = [];
  for (const skill of task?.skills ?? []) {
    const worker = plan?.workforce.find((item) => item.skill === skill);
    if (worker && !task.workers.includes(worker.worker_id)) results.push(runtime.assignWorker(projectId, taskId, worker.worker_id));
  }
  for (const type of task?.equipment ?? []) {
    const equipment = plan?.equipment.find((item) => item.type === type);
    if (equipment) results.push(runtime.reserveEquipment(projectId, taskId, equipment.equipment_id));
  }
  results.push(runtime.startTask(projectId, taskId));
  return results;
}

const actions = {
  "submit-request": submitRequest,
  clarify: () => runtime.requestClarification(contextIds().requestId, ["CUSTOMER_CONFIRMATION"]),
  analyze: () => runtime.analyzeRequirements(contextIds().requestId),
  feasibility: () => runtime.evaluateFeasibility(contextIds().requestId),
  proposal: () => runtime.createProposal(contextIds().requestId),
  approve: () => runtime.approveProposal(contextIds().proposalId),
  "create-project": () => runtime.createProject(contextIds().proposalId),
  "plan-project": planProject,
  contract: () => runtime.createSimulatedContract(contextIds().projectId),
  procure: () => runtime.startProcurement(contextIds().projectId),
  "start-task": startPlannedTask,
  "pause-task": () => runtime.pauseTask(contextIds().projectId, contextIds().taskId),
  "resume-task": () => runtime.resumeTask(contextIds().projectId, contextIds().taskId),
  "complete-task": () => runtime.completeTask(contextIds().projectId, contextIds().taskId),
  inspect: () => runtime.inspectTask(contextIds().projectId, contextIds().taskId, "PASS"),
  rework: () => runtime.requestRework(contextIds().projectId, contextIds().taskId),
  "change-order": () => runtime.submitChangeOrder(contextIds().projectId, { description: "Customer-visible simulated scope adjustment", added_cost: 500, added_duration: 8 }),
  "approve-change-order": () => runtime.approveChangeOrder(contextIds().changeId),
  deliver: () => runtime.deliverProject(contextIds().projectId),
  accept: () => runtime.acceptProject(contextIds().projectId, "ACCEPTED"),
  maintenance: () => runtime.scheduleMaintenance(contextIds().projectId),
  "close-project": () => runtime.closeProject(contextIds().projectId),
  start: () => runtime.start(), pause: () => runtime.pause(), resume: () => runtime.resume(),
  advance: () => runtime.advanceTime(8),
  "run-demo": () => runtime.runDemonstration($("demo-select").value),
  reset: () => runtime.resetState()
};

for (const [id, action] of Object.entries(actions)) $(id).addEventListener("click", () => safe(action));
$("view-select").addEventListener("change", (event) => { view = event.target.value; render(); });
$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(runtime.exportState(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kaios-ai-company-v1-simulation.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
$("import").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("匯入檔案不可超過 2 MB。");
    runtime.importState(JSON.parse(await file.text()));
    render();
  } catch (error) {
    $("error-detail").textContent = error instanceof Error ? error.message : "Import failed";
    $("error").hidden = false;
  } finally {
    event.target.value = "";
  }
});

async function loadCursorQueue() {
  try {
    const response = await fetch(QUEUE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    cursorQueue = await response.json();
  } catch {
    cursorQueue = { status: "READ_ONLY_PROJECTION_UNAVAILABLE", queue: [], worker_id: "cursor-01", one_task_at_a_time: true, output_authority: "CANDIDATE_ONLY" };
  }
}

async function boot() {
  try {
    runtime = createKaiosAiCompanyRuntimeV1();
    await loadCursorQueue();
    view = $("view-select").value;
    render();
  } catch (error) {
    $("loading").hidden = true;
    $("error-detail").textContent = error instanceof Error ? error.message : "Unknown load error";
    $("error").hidden = false;
  }
}

$("retry").addEventListener("click", boot);
boot();
