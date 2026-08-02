import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROJECT_TEMPLATES,
  createAiCompanyDemonstrationFlows,
  createKaiosAiCompanyRuntimeV1
} from "../../KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = resolve(root, "api/kaios/ai-company/v1");
const queuePath = resolve(root, "KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json");
await mkdir(output, { recursive: true });

const runtime = createKaiosAiCompanyRuntimeV1({ seed: "KAIOS-AI-COMPANY-PUBLIC-001" });
const fishpond = runtime.runDemonstration("FISHPOND_PROJECT");
if (fishpond.status !== "COMPLETE") throw new Error(`PUBLIC_PROJECTION_DEMO_FAILED:${fishpond.status}`);

const state = runtime.getState();
const integrity = runtime.integrityReport();
if (!integrity.ok) throw new Error(`PUBLIC_PROJECTION_INTEGRITY_FAILED:${integrity.issues.join(",")}`);

const demonstrations = createAiCompanyDemonstrationFlows({ seed: "KAIOS-AI-COMPANY-PUBLIC-DEMO-V1" });
const cursorQueue = JSON.parse(await readFile(queuePath, "utf8"));
const envelope = {
  schema_version: "1.0.0",
  runtime: state.runtime,
  mode: "STATIC_READ_ONLY_PROJECTION",
  generated_from_seed: state.seed,
  simulation_only: true,
  authority: "NO_PRODUCTION_AUTHORITY",
  read_only: true,
  mutation_endpoints: false,
  real_wallet: false,
  real_kgen: false,
  onchain_transfer: false,
  real_legal_effect: false,
  external_autonomy: false
};

const plans = state.resource_plans;
const files = {
  "index.json": {
    ...envelope,
    endpoints: [
      "requests.json", "projects.json", "tasks.json", "dependencies.json",
      "materials.json", "workforce.json", "equipment.json", "supply-chain.json",
      "budget.json", "schedule.json", "inspections.json", "deliveries.json",
      "capacity.json", "ledger.json", "events.json", "status.json", "cursor-queue.json"
    ],
    project_templates: Object.keys(PROJECT_TEMPLATES),
    demonstrations
  },
  "requests.json": { ...envelope, requests: state.requests, clarifications: state.clarifications, analyses: state.analyses, feasibility_reviews: state.feasibility_reviews, proposals: state.proposals },
  "projects.json": { ...envelope, projects: state.projects, contracts: state.contracts, change_orders: state.change_orders, maintenance_plans: state.maintenance_plans },
  "tasks.json": { ...envelope, tasks: state.projects.flatMap(({ project_id, tasks }) => tasks.map((task) => ({ project_id, ...task }))) },
  "dependencies.json": { ...envelope, dependencies: state.projects.flatMap(({ project_id, dependencies }) => dependencies.map((dependency) => ({ project_id, ...dependency }))) },
  "materials.json": { ...envelope, bill_of_materials: plans.flatMap(({ resource_plan_id, project_id, bill_of_materials }) => bill_of_materials.map((item) => ({ resource_plan_id, project_id, ...item }))), material_inventory: state.material_inventory },
  "workforce.json": { ...envelope, workforce_plans: plans.flatMap(({ resource_plan_id, project_id, workforce }) => workforce.map((worker) => ({ resource_plan_id, project_id, ...worker }))), reservations: state.worker_reservations },
  "equipment.json": { ...envelope, equipment_plans: plans.flatMap(({ resource_plan_id, project_id, equipment }) => equipment.map((item) => ({ resource_plan_id, project_id, ...item }))), reservations: state.equipment_reservations },
  "supply-chain.json": { ...envelope, supply_chain: plans.flatMap(({ resource_plan_id, project_id, supply_chain }) => supply_chain.map((item) => ({ resource_plan_id, project_id, ...item }))), procurement_orders: state.procurement_orders },
  "budget.json": { ...envelope, budgets: state.projects.filter(({ budget }) => budget).map(({ project_id, budget }) => ({ project_id, ...budget })) },
  "schedule.json": { ...envelope, schedules: state.projects.filter(({ schedule }) => schedule).map(({ project_id, schedule }) => ({ project_id, ...schedule })), task_windows: state.task_windows },
  "inspections.json": { ...envelope, inspections: state.inspections },
  "deliveries.json": { ...envelope, deliveries: state.deliveries, maintenance_plans: state.maintenance_plans },
  "capacity.json": { ...envelope, company_status: state.company.status, capacity: state.capacity },
  "ledger.json": { ...envelope, finance: state.finance, ledger_entries: state.ledger, balance_rule: "EVERY_ENTRY_DEBIT_EQUALS_CREDIT" },
  "events.json": { ...envelope, events: state.events, event_count: state.events.length },
  "status.json": {
    ...envelope,
    status: state.runtime_status,
    company: state.company,
    integrity,
    deterministic: true,
    serializable: true,
    stoppable: true,
    resumable: true,
    replayable: true,
    auditable: true,
    demonstrations,
    boundaries: state.boundaries
  },
  "cursor-queue.json": {
    ...envelope,
    task_id: cursorQueue.task_id,
    status: cursorQueue.status,
    worker_id: cursorQueue.worker_id,
    reviewer: cursorQueue.reviewer,
    branch_template: cursorQueue.branch_template,
    one_task_at_a_time: cursorQueue.one_task_at_a_time,
    continuous_dispatch_mode: cursorQueue.continuous_dispatch_mode,
    output_authority: cursorQueue.output_authority,
    queue: cursorQueue.queue,
    forbidden: cursorQueue.forbidden
  }
};

for (const [name, value] of Object.entries(files)) {
  await writeFile(resolve(output, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

runtime.destroy();
