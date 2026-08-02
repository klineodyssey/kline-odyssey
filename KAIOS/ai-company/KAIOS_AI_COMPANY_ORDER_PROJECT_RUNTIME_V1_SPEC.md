# KAIOS AI Company Order and Project Runtime V1 Specification

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Status: `APPROVED_SPECIFICATION_PENDING_IMPLEMENTATION`

Mode: `LOCAL_DETERMINISTIC_SIMULATION`

Authority: `CODEX_CANONICAL_RUNTIME_REVIEW`

## 1. Objective

Define one bounded AI Company coordinator that accepts a simulated customer
need, converts it into explicit requirements and a dependency-ordered project,
checks existing KAIOS capabilities, consumes finite simulated resources over
time, inspects the result, handles rework, delivers only accepted work and
closes balanced project accounts.

A request is neither authorization nor a completed object. Money never replaces
missing physics, time, location, rights, technology, civilization capability,
workers, materials, equipment, energy, transport, inspection or acceptance.

## 2. Source Crosswalk

`KAIOS_AI_COMPANY_SOURCE_CROSSWALK.md` maps the reviewed Charter Program
Registry units to current owners. Charter V2.0 and V2.1 remain read-only,
noncanonical requirement sources. Existing Canonical schemas and merged Runtime
owners outrank unpromoted Charter prose.

Chapters 37 and 64 carry `TIME` domain mappings that do not match their source
requirements. V1 treats both as `PROGRAM_REGISTRY_DOMAIN_MISMATCH`, does not
claim their reported coverage and grants no resource-allocation, permit,
administrative or legal authority from those mappings.

## 3. Canonical Dependencies

| Concern | Existing owner | AI Company responsibility |
|---|---|---|
| Identity and simulated funding | Player Genesis | reference IDs and funding availability |
| Company organism health | AI Company Alpha | coordinate project work without replacing organism state |
| Physical worker time/location | Physical Labor and Player Genesis | reserve nonoverlapping assignments |
| Construction and transport | Real Causal World | request staged work and consume returned results |
| Fishpond operation | Fishpond Aquaculture Runtime V1 | bind the fishpond project to its domain state |
| Agriculture | Agriculture Alpha and approved specification | remain blocked when the required Runtime is absent |
| Materials, inventory and insolvency | Supply Chain Economy Specification | use its contracts and balanced ledgers |
| Technology and civilization | Technology/Civilization owners | evaluate gates; never grant capability |
| Rights | Rights packages and capability interfaces | verify simulated capabilities; never mutate authority |
| Time and events | Simulation Clock, Timeline and deterministic event envelope | advance explicitly and preserve hash chains |

No second physics, economy, labor, rights, life, aquaculture, construction,
transport or agriculture engine is authorized.

## 4. Scope

- one deterministic simulated AI Company;
- structured customer requests and visible assumptions;
- sixteen feasibility gates;
- nine bounded project templates;
- project, milestone, work-package, task and dependency entities;
- bills of material, workforce, equipment, logistics, budget and schedule;
- simulation-only contracts, procurement, inspection, rework and change orders;
- delivery, acceptance, maintenance and closeout;
- bounded company capacity and balanced simulated finance;
- export, import, pause, resume, reset and replay;
- read-only World Viewer and static public API projections.

## 5. Out Of Scope

Real contracts, legal title, government authority, banking, securities,
insurance, taxes, procurement authority, wallet access, KGEN settlement,
blockchain transfer, Production Runtime, external autonomous execution,
self-modifying production code, unrestricted spending, weapons, nuclear
facilities, advanced semiconductor fabs and automatic Canonical promotion.

## 6. Organization

The company contains exactly these V1 divisions:

`CUSTOMER_SERVICE_DIVISION`, `REQUIREMENTS_DIVISION`,
`ARCHITECTURE_DIVISION`, `LIFE_CREATION_DIVISION`, `DESIGN_DIVISION`,
`PHYSICS_REVIEW_DIVISION`, `ECONOMY_REVIEW_DIVISION`,
`RIGHTS_REVIEW_DIVISION`, `CIVILIZATION_REVIEW_DIVISION`,
`PROCUREMENT_DIVISION`, `SUPPLY_CHAIN_DIVISION`, `LABOR_DIVISION`,
`CONSTRUCTION_DIVISION`, `MANUFACTURING_DIVISION`, `LOGISTICS_DIVISION`,
`QA_INSPECTION_DIVISION`, `FINANCE_DIVISION`, `RISK_DIVISION`,
`LEGAL_SIMULATION_DIVISION`, `MAINTENANCE_DIVISION` and
`DELIVERY_DIVISION`.

Each division records authority, allowed and forbidden actions, required inputs,
outputs, review gate, responsible simulated agent, event history, cost center
and status. Authority is always `SIMULATION_COORDINATION_ONLY`. A downstream
division cannot waive a failed upstream gate.

## 7. Customer Request

Requests follow `KAIOS_AI_COMPANY_REQUEST_SCHEMA_V1.json` and support fishpond,
house, farm, warehouse, road, bridge, workshop/factory, refrigerator, vehicle,
city-district, candidate-life and software-panel language. V1 project creation
is limited to the approved nine templates; unsupported requests are rejected or
held, never silently mapped to a different product.

State flow:

`SUBMITTED -> NEEDS_CLARIFICATION | ANALYZING -> FEASIBILITY_REVIEW -> REJECTED | PROPOSAL_READY -> CUSTOMER_REVIEW -> APPROVED_SIMULATION -> PROJECT_CREATED -> COMPLETED`

`CANCELLED` is terminal. Clarification records the missing fields without
inventing them.

## 8. Requirement Analysis

The analyzer emits functional, physical, location, resource, worker,
technology, rights, civilization, safety, economic, quality, delivery and
maintenance requirements. Every inferred noncritical default is labeled
`SIMULATION_ASSUMPTION` with reason, risk, customer visibility and approval.
Critical requirements never receive an implicit default.

## 9. Feasibility Gates

Every proposal evaluates exactly:

`PHYSICS_GATE`, `TIME_GATE`, `LOCATION_GATE`, `LAND_GATE`, `RIGHTS_GATE`,
`CIVILIZATION_GATE`, `TECHNOLOGY_GATE`, `ENERGY_GATE`, `MATERIAL_GATE`,
`LABOR_GATE`, `EQUIPMENT_GATE`, `LOGISTICS_GATE`, `ECONOMY_GATE`,
`SAFETY_GATE`, `ENVIRONMENT_GATE`, `QUALITY_GATE`.

Outcomes are `PASS`, `PASS_WITH_CONDITIONS`, `REWORK_REQUIRED`, `BLOCKED` or
`REJECTED`. Block reasons include `PHYSICS_NOT_SUPPORTED`,
`CIVILIZATION_TOO_LOW`, `TECHNOLOGY_NOT_AVAILABLE`, `NO_LAND`, `NO_RIGHTS`,
`NO_MATERIAL`, `NO_WORKERS`, `NO_EQUIPMENT`, `NO_ENERGY`, `NO_ROUTE`,
`NO_BUDGET`, `NO_DEMAND`, `UNSAFE`, `ENVIRONMENTAL_CAPACITY_EXCEEDED`,
`SOURCE_UNDERSPECIFIED` and `CANONICAL_CONFLICT`. A blocked result lists exact
unblock requirements and creates no project.

## 10. Project Decomposition

An approved proposal becomes:

`PROJECT -> MILESTONE -> WORK_PACKAGE -> TASK -> EVENT`

Dependencies are directed predecessor/successor edges. Mandatory predecessors
must be `COMPLETE` or `APPROVED` before the successor becomes `READY`.
Dependency cycles fail closed with `PROJECT_DEPENDENCY_CYCLE`. The schedule
derives a deterministic critical path from the directed acyclic graph.

## 11. Project Templates

| Template | V1 binding | Expected behavior |
|---|---|---|
| `FISHPOND_PROJECT` | Fishpond Aquaculture Runtime V1 | executable through its staged domain adapter |
| `BASIC_HOUSE_PROJECT` | Causal World construction and Physical Labor | executable staged foundation/house demonstration |
| `SMALL_FARM_PROJECT` | Forest/Agriculture workline | `BLOCKED_DEPENDENCY` or `SPECIFICATION_ONLY` until Runtime exists |
| `WAREHOUSE_PROJECT` | Causal construction and inventory contracts | executable bounded construction template |
| `BASIC_ROAD_PROJECT` | Causal road and construction contracts | executable bounded infrastructure template |
| `SMALL_BRIDGE_PROJECT` | Causal bridge/load/route contracts | executable only when technology and resources pass |
| `WORKSHOP_PROJECT` | construction plus production specification | bounded workshop, not a general factory authority |
| `LIFE_PACKAGE_PROJECT` | Worker Registry candidate workflow | dispatches candidate review; never creates Canonical life automatically |
| `SOFTWARE_MODULE_PROJECT` | specification, implementation, tests and Codex review | local simulated project only; no external deployment command |

`ADVANCED_SEMICONDUCTOR_FAB`, `NUCLEAR_FACILITY`, `MILITARY_SYSTEM`,
`REAL_BANK`, `REAL_GOVERNMENT` and `REAL_WORLD_AUTONOMOUS_CONSTRUCTION` are
`HOLD_HIGH_RISK` or `HOLD_DEPENDENCY_MISSING`.

## 12. Bill Of Materials

Every physical task references explicit material quantity, unit, mass, quality,
supplier, availability, lead time, cost, storage, transport, waste factor and
recyclability. Required checks cover supplier capacity, technology,
civilization, quality, route, warehouse, schedule and budget. Unavailable
material keeps the task `BLOCKED`; no amount of simulated cash creates stock.

## 13. Workforce Plan

Worker plans reuse the single-life timeline: one body, one primary physical
location and one primary physical job at a time. Reservations account for
travel, shift, meal, toilet, rest, sleep, stamina, health, skill, safety and
equipment qualification. Required failures include `ROLE_TIME_CONFLICT`,
`LOCATION_CONFLICT`, `TRAVEL_TIME_CONFLICT`, `SHIFT_OVERLAP`,
`REST_REQUIREMENT_CONFLICT`, `SKILL_NOT_AVAILABLE` and
`CERTIFICATION_SIMULATION_MISSING`. Digital AI concurrency remains bounded by
the approved compute contract and never overrides physical-body rules.

## 14. Equipment Plan

Equipment records owner, operator requirement, location, capacity, energy,
fuel/charge, wear, maintenance, transport, reservation window and cost. Missing
operator or energy blocks use. `MAINTENANCE_REQUIRED`, `BROKEN` and `RETIRED`
equipment cannot be reserved as ready.

## 15. Supply Chain Plan

Each material follows `SOURCE -> SUPPLIER -> FACTORY -> WAREHOUSE -> TRANSPORT -> SITE -> INSPECTION -> DELIVERY` as applicable. Every leg records origin,
destination, route, quantity, mass, vehicle, fuel, loading, travel, unloading,
cost, risk and status. Causal World owns roads, rivers, bridges, fuel, vehicle
capacity, wear and elapsed travel time. No instant delivery is allowed.

## 16. Budget

The budget separates design, material, labor, equipment, energy, transport,
storage, inspection, risk, maintenance, simulated tax/insurance/interest and
contingency. `remaining = approved_budget - spent - committed` and each change
order recalculates the forecast. Funding may reference only simulated customer,
company, loan, investment or public budgets. `UNFUNDED` projects cannot start.

## 17. Schedule

Schedules include planned/actual times, task dependencies, critical path,
worker/equipment availability, material arrival, weather, inspection, rework and
transport delay. Status is `ON_SCHEDULE`, `AT_RISK`, `DELAYED`, `BLOCKED`,
`PAUSED`, `RECOVERY_PLAN_REQUIRED` or `COMPLETE`. Simulated money cannot remove
physical duration.

## 18. Simulated Contract

The contract separates customer, AI Company, supplier, contractor, worker,
simulated inspector and transport operator. Scope, deliverables, price, payment,
timeline, quality, changes, cancellation, warranty, maintenance, simulated
rights and liability are visible. Every contract carries:

`SIMULATED_CONTRACT / NO_REAL_LEGAL_EFFECT`.

## 19. Procurement

Procurement progresses through RFQ, quotes, supplier selection, order,
production, transit, receipt, inspection and payment approval. Selection uses
quality, delivery, capacity, risk and total cost; lowest price alone never wins.
Payment eligibility requires accepted inspection and a balanced funding entry.

## 20. Execution

Runtime execution advances only through explicit simulation time. A task can
consume labor, energy, material, equipment wear, inventory and cash; generate
waste, progress, risk and events; then enter inspection or failure. States are
`NOT_READY`, `READY`, `IN_PROGRESS`, `PAUSED`, `BLOCKED`, `FAILED`,
`REWORK_REQUIRED`, `INSPECTION_PENDING`, `APPROVED`, `COMPLETE` or `CANCELLED`.
Zero-duration physical completion is invalid.

## 21. Inspection And Rework

Inspection types are design, material, site, safety, stage, functional and final
acceptance. Evidence and criteria produce `PASS`, `PASS_WITH_CONDITIONS`,
`FAIL`, `REWORK_REQUIRED` or `NOT_READY`. A failed inspection blocks downstream
tasks and creates an explicit rework task with new time, cost and resources.

## 22. Change Orders

Changes move through request, impact analysis, customer review, approval or
rejection, implementation and completion. Approval recalculates budget,
schedule, materials, workers, equipment, rights, safety and dependencies. Scope
cannot change silently.

## 23. Delivery And Acceptance

Delivery requires all mandatory tasks complete, inspections passed,
documentation, simulated rights package, maintenance plan and final accounting.
Customer outcomes are `ACCEPTED`, `ACCEPTED_WITH_CONDITIONS`, `REJECTED` or
`REWORK_REQUIRED`. A project stays open until accepted or formally cancelled.

## 24. Warranty And Maintenance

Physical outputs retain maintenance/inspection schedules, wear, repair
responsibility, spare-parts, energy, operating cost and failure response. Asset
states are `OPERATIONAL`, `MAINTENANCE_DUE`, `REPAIR_REQUIRED`, `DEGRADED`,
`UNSAFE`, `OUT_OF_SERVICE` or `RETIRED`.

## 25. Company Economy And Insolvency

The company tracks cash, receivables, payables, work in progress, inventory,
equipment, payroll, supplier obligations, customer deposits, project revenue,
project cost, profit/loss, debt and simulated tax/insurance/risk reserves.
Every posting has equal debit and credit amounts linked to one event.

Company states are `OPERATING`, `OVER_CAPACITY`, `CASH_FLOW_WARNING`,
`PAYMENT_DELAY`, `DISTRESS`, `INSOLVENT`, `RESTRUCTURING_SIMULATION`,
`COURT_PROTECTION_SIMULATION`, `LIQUIDATION_SIMULATION` and `DISSOLVED`.
Simulation preserves asset and liability records and has no legal effect.

## 26. Capacity

V1 defaults are finite and schema-bounded: active total, physical and digital
projects, compute load, review queue, procurement queue, worker assignments and
financial exposure. Exceeding any limit returns `COMPANY_CAPACITY_EXCEEDED` and
queues, rejects or schedules the request later. No unlimited throughput exists.

## 27. State Machines

- request: submission through project creation or terminal rejection/cancel;
- proposal: draft, blocked, customer-ready, approved, rejected or expired;
- project: planned through execution, inspection, delivery and acceptance;
- task: predecessor-gated work, pause/block/failure/rework and completion;
- procurement: RFQ through inspected receipt and payment eligibility;
- delivery: not-ready through acceptance or rework;
- maintenance: operational through repair, unsafe, retirement;
- company: operating through bounded simulated insolvency outcomes.

State transitions are command-driven and append-only in the event history.

## 28. Deterministic Events

Every event follows `KAIOS_AI_COMPANY_EVENT_SCHEMA_V1.json` and records company,
request, project, work package, task, actor, division, time, location, inputs,
outputs, resource/cash/progress/risk deltas, seed, status, reason and previous/
next state hashes.

Same initial state, seed, ordered commands and inputs must yield the same state
and event hashes. Runtime is deterministic, serializable, stoppable, resumable,
replayable and auditable. Imports are rejected when schema, authority boundary,
capacity, ledger, dependency graph or hash chain is invalid.

## 29. Runtime Commands

V1 exposes repository-equivalent local commands for request, clarification,
analysis, feasibility, proposal approval, project/dependency/resource/budget/
schedule/contract creation, procurement, worker/equipment/material assignment,
task lifecycle, inspection/rework, change orders, delivery/acceptance,
maintenance, closeout, export/import/reset and replay. No command performs
external execution or production deployment.

## 30. Public APIs

Static GitHub Pages projections expose index, requests, projects, tasks,
dependencies, materials, workforce, equipment, supply chain, budget, schedule,
inspections, deliveries, capacity, ledger, events, status and Cursor queue under
`/api/kaios/ai-company/v1/`. Production methods are `GET` and `HEAD` only.
Mutation endpoints are `FALSE`.

## 31. World Viewer

The `KAIOS AI 公司創造中心` module exposes requests, analysis, gates,
proposals, active projects, dependency graph, resource plans, budget, schedule,
procurement, execution, inspection, changes, delivery, maintenance, capacity,
finance, risks, events and the read-only Cursor queue. Local controls perform
simulation actions only and include loading, empty, error, retry, pause, resume,
advance, export, import and reset states.

Visible warnings: `SIMULATION ONLY`, `NO REAL WALLET`, `NO REAL KGEN`,
`NO REAL CONTRACT`, `NO PRODUCTION AUTHORITY`, `NO EXTERNAL AUTONOMY`.

## 32. Demonstration Contracts

- Fishpond: must bind Fishpond Aquaculture Runtime V1 and may complete only
  after its domain gates and final acceptance pass.
- Basic house: must consume staged Causal World construction resources/time.
- Small farm: remains `BLOCKED_DEPENDENCY` or `SPECIFICATION_ONLY` while the
  Forest/Agriculture Runtime is absent.
- Life package: creates a candidate-only Worker Registry workflow and stops at
  Codex review; no automatic Canonical promotion.
- Software panel: requires specification, implementation, tests and review;
  it does not deploy externally.

## 33. Security Boundaries

`SIMULATION_ONLY`, `NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`,
`NO_REAL_LEGAL_EFFECT`, `NO_PRODUCTION_AUTHORITY`, `NO_EXTERNAL_AUTONOMY`,
`NO_UNBOUNDED_SPENDING`, `NO_SELF_MODIFYING_PRODUCTION_CODE`,
`NO_CONSTITUTION_SOURCE_MODIFICATION`, `NO_CURRENT_MODIFICATION`.

## 34. Performance Bounds

Runtime state is capped at 1,000 requests, 250 projects, 5,000 tasks, 10,000
events in state and 20,000 actions. Public projections may truncate history with
an explicit count and must not silently alter authoritative local replay state.

## 35. Tests

Tests cover request/clarification/assumptions, all sixteen gates, dependency
cycles and skipping, nine templates, BOM, worker conflicts, equipment, routes,
budget/ledger, schedules, contracts, procurement, execution, inspections,
rework, changes, delivery, maintenance, capacity, insolvency, five
demonstrations, deterministic replay, imports, UI, static API, repository
integrity and regressions. Required unresolved findings are `P0=0`, `P1=0`,
`P2=0`.

## 36. Migration

No persistent or destructive migration exists. V1 creates a new local-storage
namespace and read-only static API projection. Preliminary
`KGEN-KAIOS/V10/runtime/KAIOS_AI_COMPANY_ORDER_AND_PROJECT_RUNTIME_SPEC.md`
becomes a compatibility pointer to this cumulative specification.

## 37. Rollback

Revert the dedicated specification or Runtime merge commits. Existing Player
Genesis, Causal World, Aquaculture, Physical Labor, Supply Chain, enterprise,
World Viewer and public routes remain independent owners and must not be reset.

## 38. Acceptance Criteria

Implementation is accepted only when requests require explicit approval,
dependencies cannot be skipped, resource/time/cost consumption is causal,
inspections and rework block delivery, capacity is finite, ledgers balance,
farm dependency absence remains visible, replay is deterministic, public APIs
are read-only, production is verified and all authority boundaries remain false.

## 39. Cursor Contribution

Decision: `SEQUENTIAL_BOUNDED_RESEARCH_AVAILABLE`. The active registered Cursor
task is `KAIOS-CURSOR-VEGETABLE-PACKAGES-001` after the reviewed Fruit Tree
claim was formally released. It is not interrupted.
AI Company project-template, failure-scenario and UI research remain queued
behind the approved one-task-at-a-time life backlog. Cursor may never write the
authoritative project engine, approve Canonical status, merge or deploy.
