import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const laborSchema = JSON.parse(read("KAIOS_PHYSICAL_LABOR_SCHEMA.json"));
const constructionSchema = JSON.parse(read("KAIOS_CONSTRUCTION_SCHEMA.json"));

const conflicts = [
  "ROLE_TIME_CONFLICT", "LOCATION_CONFLICT", "TRAVEL_TIME_CONFLICT",
  "REST_REQUIREMENT_CONFLICT", "SLEEP_REQUIREMENT_CONFLICT",
  "BODY_INSTANCE_CONFLICT", "SHIFT_OVERLAP", "INSUFFICIENT_WORKFORCE",
  "MISSING_REQUIRED_SKILL", "NO_SUPERVISOR", "NO_SAFETY_STAFF",
  "NO_MACHINE_OPERATOR", "WORKSPACE_OVERCAPACITY"
];

const timelineStates = [
  "OFF_DUTY", "COMMUTING", "CLOCKED_IN", "SETUP", "ACTIVE_WORK", "MEETING",
  "WAITING", "MEAL", "TOILET", "REST", "EQUIPMENT_DOWNTIME", "CLEANUP",
  "CLOCKED_OUT", "SLEEPING"
];

const stageOrder = [
  "SURVEY", "DESIGN", "SITE_CLEARING", "EXCAVATION", "FOUNDATION", "STRUCTURE",
  "ROOF", "UTILITIES", "INTERIOR", "INSPECTION", "REWORK", "COMPLETE"
];

function overlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

function validatePhysicalIntervals(intervals) {
  const errors = [];
  for (let left = 0; left < intervals.length; left += 1) {
    for (let right = left + 1; right < intervals.length; right += 1) {
      const a = intervals[left];
      const b = intervals[right];
      if (!overlap(a, b)) continue;
      if (a.body_instance_id !== b.body_instance_id) errors.push("BODY_INSTANCE_CONFLICT");
      if (a.location !== b.location) errors.push("LOCATION_CONFLICT");
      if (a.role !== b.role) errors.push("ROLE_TIME_CONFLICT");
      if (a.kind === "SHIFT" && b.kind === "SHIFT") errors.push("SHIFT_OVERLAP");
      if ([a.kind, b.kind].includes("REST")) errors.push("REST_REQUIREMENT_CONFLICT");
      if ([a.kind, b.kind].includes("SLEEP")) errors.push("SLEEP_REQUIREMENT_CONFLICT");
    }
  }
  return [...new Set(errors)];
}

function travelConflict(previous, next, travelMinutes) {
  if (previous.location === next.location) return null;
  return next.start - previous.end < travelMinutes ? "TRAVEL_TIME_CONFLICT" : null;
}

function effectiveWork(shift) {
  const deductions = ["commute", "meal", "toilet", "rest", "waiting", "equipment_downtime", "material_shortage"]
    .reduce((sum, key) => sum + shift[key], 0);
  const result = shift.scheduled_time - deductions;
  if (result < 0) throw new Error("NEGATIVE_EFFECTIVE_WORK_TIME");
  return result;
}

function admitAiTasks(capacity, tasks) {
  const active = tasks.filter(({ state }) => state === "ACTIVE_COMPUTE");
  const sums = (field) => active.reduce((sum, item) => sum + item[field], 0);
  if (active.length > capacity.concurrency_limit) return "CONCURRENCY_LIMIT_EXCEEDED";
  if (sums("compute") > capacity.compute_capacity) return "COMPUTE_CAPACITY_EXHAUSTED";
  if (sums("memory") > capacity.memory_capacity) return "MEMORY_CAPACITY_EXHAUSTED";
  if (sums("context") > capacity.context_capacity) return "CONTEXT_CAPACITY_EXHAUSTED";
  if (sums("energy") > capacity.energy_budget) return "ENERGY_BUDGET_EXHAUSTED";
  return "ADMITTED";
}

function brickModel(input) {
  const totalMass = input.brick_count * input.mass_per_brick;
  const tripCapacity = input.bricks_per_trip * input.mass_per_brick;
  if (tripCapacity > Math.min(input.worker_strength, input.safety_limit)) {
    return { blocked_reason: "SAFETY_LOAD_LIMIT", total_mass: totalMass };
  }
  const trips = Math.ceil(input.brick_count / input.bricks_per_trip);
  const distance = trips * (input.pickup_distance + input.carry_distance);
  const activeMinutes = distance / input.worker_speed / 60 + trips * (input.load_time + input.unload_time);
  const rests = input.rest_interval > 0 ? Math.floor(activeMinutes / input.rest_interval) : 0;
  const restMinutes = rests * 10;
  return {
    blocked_reason: null,
    trips,
    total_mass: totalMass,
    mass_moved: totalMass,
    distance_walked: distance,
    vertical_work: totalMass * input.gravity * input.vertical_height,
    active_minutes: activeMinutes,
    rest_minutes: restMinutes,
    total_worker_hours: (activeMinutes + restMinutes) / 60,
    fatigue: Math.min(100, activeMinutes / 8 + tripCapacity / input.safety_limit * 20)
  };
}

function workforceGate(config, assigned) {
  if (assigned.length < config.minimum_workers) return "INSUFFICIENT_WORKFORCE";
  if (assigned.length > config.workspace_capacity) return "WORKSPACE_OVERCAPACITY";
  if (!config.required_skills.every((skill) => assigned.some((worker) => worker.role === skill))) return "MISSING_REQUIRED_SKILL";
  if (config.supervisor_count > assigned.filter(({ role }) => role === "site_supervisor").length) return "NO_SUPERVISOR";
  if (config.safety_staff > assigned.filter(({ role }) => role === "safety_officer").length) return "NO_SAFETY_STAFF";
  if (config.machine_operators > assigned.filter(({ role }) => role.endsWith("_operator")).length) return "NO_MACHINE_OPERATOR";
  return "PASS";
}

test("all required specification artifacts exist", () => {
  for (const file of [
    "KAIOS_SINGLE_LIFE_TIMELINE_SPEC.md", "KAIOS_DIGITAL_AI_CONCURRENCY_SPEC.md",
    "KAIOS_WORK_SHIFT_SPEC.md", "KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md",
    "KAIOS_WORKFORCE_REQUIREMENTS_SPEC.md", "KAIOS_CONSTRUCTION_CAUSALITY_SPEC.md",
    "KAIOS_PHYSICAL_LABOR_SCHEMA.json", "KAIOS_CONSTRUCTION_SCHEMA.json",
    "KAIOS_PHYSICAL_LABOR_TEST_PLAN.md"
  ]) assert.equal(fs.existsSync(path.join(root, file)), true, file);
});

test("schemas use Draft 2020-12 and remain specification-only", () => {
  for (const schema of [laborSchema, constructionSchema]) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.properties.mode.const, "SPECIFICATION_ONLY");
    assert.equal(schema.properties.authority.const, "NO_PRODUCTION_AUTHORITY");
  }
});

test("timeline schema contains every required field and state", () => {
  const required = laborSchema.$defs.lifeTimeline.required;
  for (const field of ["life_id", "body_instance_id", "current_location", "current_activity", "activity_start", "activity_end", "travel_start", "travel_end", "work_shift_id", "meal_state", "toilet_state", "rest_state", "sleep_state", "health_state", "stamina", "availability", "attendance", "time_log", "event_log"]) assert.ok(required.includes(field), field);
  assert.deepEqual(laborSchema.$defs.timelineState.enum, timelineStates);
});

test("schema contains every mandatory conflict code", () => assert.deepEqual(laborSchema.$defs.conflictCode.enum, conflicts));

test("one body cannot occupy two locations at once", () => assert.ok(validatePhysicalIntervals([
  { start: 0, end: 60, body_instance_id: "BODY-1", location: "A", role: "laborer", kind: "SHIFT" },
  { start: 30, end: 90, body_instance_id: "BODY-1", location: "B", role: "laborer", kind: "SHIFT" }
]).includes("LOCATION_CONFLICT")));

test("one life cannot activate conflicting body instances", () => assert.ok(validatePhysicalIntervals([
  { start: 0, end: 60, body_instance_id: "BODY-1", location: "A", role: "laborer", kind: "SHIFT" },
  { start: 30, end: 90, body_instance_id: "BODY-2", location: "A", role: "laborer", kind: "SHIFT" }
]).includes("BODY_INSTANCE_CONFLICT")));

test("one body cannot perform two primary roles or shifts", () => {
  const result = validatePhysicalIntervals([
    { start: 0, end: 60, body_instance_id: "BODY-1", location: "A", role: "laborer", kind: "SHIFT" },
    { start: 30, end: 90, body_instance_id: "BODY-1", location: "A", role: "surveyor", kind: "SHIFT" }
  ]);
  assert.ok(result.includes("ROLE_TIME_CONFLICT"));
  assert.ok(result.includes("SHIFT_OVERLAP"));
});

test("travel time is mandatory between physical locations", () => assert.equal(travelConflict({ end: 100, location: "A" }, { start: 120, location: "B" }, 30), "TRAVEL_TIME_CONFLICT"));

test("required rest and sleep cannot overlap physical work", () => {
  const base = { start: 0, end: 60, body_instance_id: "BODY-1", location: "A", role: "laborer" };
  assert.ok(validatePhysicalIntervals([{ ...base, kind: "SHIFT" }, { ...base, kind: "REST" }]).includes("REST_REQUIREMENT_CONFLICT"));
  assert.ok(validatePhysicalIntervals([{ ...base, kind: "SHIFT" }, { ...base, kind: "SLEEP" }]).includes("SLEEP_REQUIREMENT_CONFLICT"));
});

test("effective work subtracts commute meal toilet rest waiting downtime and shortage", () => assert.equal(effectiveWork({ scheduled_time: 480, commute: 60, meal: 30, toilet: 10, rest: 20, waiting: 15, equipment_downtime: 25, material_shortage: 40 }), 280));
test("negative effective work is rejected", () => assert.throws(() => effectiveWork({ scheduled_time: 60, commute: 20, meal: 20, toilet: 10, rest: 10, waiting: 10, equipment_downtime: 10, material_shortage: 10 }), /NEGATIVE_EFFECTIVE_WORK_TIME/));

test("digital AI concurrency respects task and compute limits", () => {
  const capacity = { concurrency_limit: 2, compute_capacity: 100, memory_capacity: 100, context_capacity: 100, energy_budget: 100 };
  assert.equal(admitAiTasks(capacity, [{ state: "ACTIVE_COMPUTE", compute: 60, memory: 20, context: 20, energy: 20 }, { state: "ACTIVE_COMPUTE", compute: 50, memory: 20, context: 20, energy: 20 }]), "COMPUTE_CAPACITY_EXHAUSTED");
  assert.equal(admitAiTasks(capacity, [{ state: "ACTIVE_COMPUTE", compute: 20, memory: 20, context: 20, energy: 20 }, { state: "WAITING_REVIEW", compute: 90, memory: 90, context: 90, energy: 90 }]), "ADMITTED");
});

test("digital concurrency does not waive physical-body rules", () => assert.match(read("KAIOS_DIGITAL_AI_CONCURRENCY_SPEC.md"), /single-body, single-location and single-primary-physical-job/));

const bricks = { brick_count: 103, mass_per_brick: 2.5, pickup_distance: 4, carry_distance: 16, vertical_height: 3, bricks_per_trip: 8, worker_speed: 1.2, worker_strength: 30, safety_limit: 25, gravity: 9.80665, load_time: 0.5, unload_time: 0.4, rest_interval: 30 };

test("brick accounting conserves count mass distance time and vertical energy", () => {
  const result = brickModel(bricks);
  assert.equal(result.trips, 13);
  assert.equal(result.total_mass, 257.5);
  assert.equal(result.mass_moved, result.total_mass);
  assert.equal(result.distance_walked, 260);
  assert.equal(result.vertical_work, 257.5 * 9.80665 * 3);
  assert.equal(result.total_worker_hours, (result.active_minutes + result.rest_minutes) / 60);
  assert.ok(result.fatigue > 0);
});

test("unsafe per-trip brick load blocks work", () => assert.equal(brickModel({ ...bricks, bricks_per_trip: 11 }).blocked_reason, "SAFETY_LOAD_LIMIT"));
test("both brick recording modes are mandatory", () => assert.deepEqual(laborSchema.$defs.brickAccounting.properties.mode.enum, ["ONE_STEP_ONE_RECORD", "AGGREGATED_BATCH"]));

const workforce = { minimum_workers: 4, optimal_workers: 6, maximum_effective_workers: 8, workspace_capacity: 10, required_skills: ["site_supervisor", "general_laborer", "safety_officer", "excavator_operator"], supervisor_count: 1, safety_staff: 1, machine_operators: 1 };
const completeCrew = [{ role: "site_supervisor" }, { role: "general_laborer" }, { role: "safety_officer" }, { role: "excavator_operator" }];

test("workforce gates minimum headcount skills supervision safety operator and capacity", () => {
  assert.equal(workforceGate(workforce, completeCrew), "PASS");
  assert.equal(workforceGate(workforce, completeCrew.slice(0, 3)), "INSUFFICIENT_WORKFORCE");
  assert.equal(workforceGate({ ...workforce, minimum_workers: 3 }, completeCrew.filter(({ role }) => role !== "safety_officer")), "MISSING_REQUIRED_SKILL");
  assert.equal(workforceGate({ ...workforce, required_skills: ["general_laborer"], minimum_workers: 1 }, [{ role: "general_laborer" }]), "NO_SUPERVISOR");
  assert.equal(workforceGate({ ...workforce, required_skills: ["site_supervisor", "general_laborer"], minimum_workers: 2 }, [{ role: "site_supervisor" }, { role: "general_laborer" }]), "NO_SAFETY_STAFF");
  assert.equal(workforceGate({ ...workforce, required_skills: ["site_supervisor", "general_laborer", "safety_officer"], minimum_workers: 3 }, completeCrew.slice(0, 3)), "NO_MACHINE_OPERATOR");
  assert.equal(workforceGate({ ...workforce, minimum_workers: 1, required_skills: [], supervisor_count: 0, safety_staff: 0, machine_operators: 0, workspace_capacity: 2 }, [{ role: "general_laborer" }, { role: "general_laborer" }, { role: "general_laborer" }]), "WORKSPACE_OVERCAPACITY");
});

test("workforce schema defines diminishing returns and crowding", () => {
  const fields = constructionSchema.$defs.workforce.required;
  assert.ok(fields.includes("maximum_effective_workers"));
  assert.ok(fields.includes("diminishing_returns"));
  assert.ok(fields.includes("crowding_penalty"));
});

test("construction dependency and stage order are exact", () => {
  assert.deepEqual(constructionSchema.properties.stage_order.prefixItems.map(({ const: value }) => value), stageOrder);
  assert.deepEqual(constructionSchema.properties.dependency_chain.prefixItems.map(({ const: value }) => value), ["land_right", "survey", "design", "permit_simulation", "site_access", "workforce", "materials", "equipment", "energy", "transport", "construction", "inspection", "rework", "completion"]);
});

test("every construction stage requires causal inputs and gates", () => {
  const required = constructionSchema.$defs.stage.required;
  for (const field of ["bill_of_materials", "tools", "machines", "workers", "skills", "energy", "water", "time", "site_access", "technology_gate", "safety_gate", "inspection_gate"]) assert.ok(required.includes(field), field);
});

test("construction specification blocks stage skipping and absent inputs", () => {
  const document = read("KAIOS_CONSTRUCTION_CAUSALITY_SPEC.md");
  for (const marker of ["STAGE_ORDER_CONFLICT", "BLOCKED_MATERIAL", "BLOCKED_TOOL", "BLOCKED_ACCESS", "BLOCKED_ENERGY", "BLOCKED_WATER", "BLOCKED_TECHNOLOGY", "BLOCKED_SAFETY", "REWORK_REQUIRED"]) assert.match(document, new RegExp(marker));
  assert.match(document, /No stage may be skipped or completed instantly/);
});

test("specification requires replay serialization and state hashes", () => {
  const combined = read("KAIOS_SINGLE_LIFE_TIMELINE_SPEC.md") + read("KAIOS_CONSTRUCTION_CAUSALITY_SPEC.md");
  assert.match(combined, /reproduce|Replay/i);
  assert.match(combined, /previous.*state hash/i);
  assert.match(combined, /next state hash/i);
});

test("no full runtime implementation or production authority is introduced", () => {
  const changedSpecs = ["KAIOS_SINGLE_LIFE_TIMELINE_SPEC.md", "KAIOS_DIGITAL_AI_CONCURRENCY_SPEC.md", "KAIOS_WORK_SHIFT_SPEC.md", "KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md", "KAIOS_WORKFORCE_REQUIREMENTS_SPEC.md", "KAIOS_CONSTRUCTION_CAUSALITY_SPEC.md", "KAIOS_PHYSICAL_LABOR_TEST_PLAN.md"].map(read).join("\n");
  assert.match(changedSpecs, /SPECIFICATION_ONLY/);
  assert.match(changedSpecs, /NO_PRODUCTION_AUTHORITY/);
  assert.doesNotMatch(changedSpecs, /REAL_KGEN_ENABLED|PRODUCTION_RUNTIME_ACTIVE|REAL_WALLET_CREATED/);
});
