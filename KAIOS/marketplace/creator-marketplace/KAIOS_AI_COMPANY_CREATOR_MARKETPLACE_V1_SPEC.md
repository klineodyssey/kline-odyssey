# KAIOS AI Company Creator Marketplace V1

Status: `APPROVED_SPECIFICATION_CANDIDATE`  
Mode: `SIMULATION_ONLY`  
Task: `KAIOS-AI-COMPANY-CREATOR-MARKETPLACE-V1-001`

## Objective

Connect Player Genesis, finite starter resources, KAIOS Game Credit, AI Company projects, candidate creation, Codex review, delivery, payroll, household consumption and reinvestment without creating a duplicate life, project, payroll or supply-chain runtime.

## Canonical Dependencies

| Owner | Reused responsibility |
| --- | --- |
| Player Genesis | player, AI companion, household and starter-land identities |
| AI Company Order Runtime | requirement analysis, feasibility, task dependencies, BOM, workforce, equipment, supply chain, inspection and delivery |
| Life Energy and Payroll Runtime | balanced credit movement, escrow concepts, worker-owned pay and duplicate-claim protection |
| Real Causal World | transport, location and construction causality |
| Physical Labor | single-location work, time, stamina and skill constraints |
| Supply Chain | availability, inventory, route, lead-time and no-instant-delivery rules |
| Canonical Life | candidate identity, taxonomy, provenance and review status |

This module is an orchestration layer. These owners remain authoritative.

The existing `KGEN-KAIOS/V10` Marketplace documents are prototype concept boundaries. V1 preserves their listing/disclosure intent as a read-only compatibility projection and does not create a second trade engine.

## Boundaries

- `KAIOS_GAME_CREDIT_ONLY`
- `NO_REAL_KGEN`
- `NO_REAL_WALLET`
- `NO_ONCHAIN_TRANSFER`
- `NO_PRODUCTION_AUTHORITY`
- `NO_EXTERNAL_AUTONOMY`
- `NO_UNCONTROLLED_MINT`
- Cursor output is `CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
- An unreviewed listing is never labeled Canonical.

## State Machines

Request: `SUBMITTED -> NEEDS_CLARIFICATION | ANALYZING -> ACCEPTED | REJECTED | BLOCKED_*`.

Project: `PROPOSED -> ESCROW_RESERVED -> TASKS_READY -> IN_PROGRESS -> REVIEW -> DELIVERY_READY -> ACCEPTED | REWORK_REQUIRED | REJECTED -> CLOSED`.

Listing: `CANDIDATE -> PENDING_CODEX_REVIEW -> APPROVED | REWORK_REQUIRED | REJECTED -> DELIVERABLE | ARCHIVED`.

Delivery: `SUBMITTED -> CODEX_REVIEW -> CUSTOMER_REVIEW -> ACCEPTED | PARTIAL_ACCEPTANCE | REWORK_REQUIRED | REJECTED`.

## Starter Package

Player Genesis receives one simulation-use land parcel, finite essentials and finite KAIOS Game Credit. The grant key is the immutable Player Genesis ID. A second grant for the same ID is blocked. Only a full simulation reset clears the grant registry.

## Demand

Demand is derived from body type, household size, climate, location, civilization, inventory, health, work, distance and season. Biological, digital and robotic needs remain distinct. Demand cannot be generated only to sustain a producer.

## Orders And Escrow

An accepted request reserves payroll, materials, transport, energy, compute, review and contingency inside project escrow. No task starts before predecessors and required resources pass. No project completes with a negative escrow balance.

## Creator Marketplace

Categories are `FOUNDATIONAL_LIFE`, `PLANT_LIFE`, `ANIMAL_LIFE`, `MARINE_LIFE`, `MICROBIAL_LIFE`, `SOFTWARE_LIFE`, `ROBOTIC_LIFE`, `TERRAIN_LIFE`, `WATER_BODY_LIFE`, `BUILDING_LIFE`, `INFRASTRUCTURE_LIFE`, `COMPANY_LIFE`, `SERVICE`, `RESEARCH`, `SUPPLY_CHAIN`, `TRANSPORT`, and `MAINTENANCE`.

Listings disclose creator, review and canonical status, Genome/package version, Game Credit price, delivery time, dependencies, civilization gates, rights, maintenance, limitations, provenance, integrity and simulation-only status.

## Review And Acceptance

Creator self-approval is forbidden. Codex review precedes customer acceptance. Accepted work releases approved payroll and vendor obligations. Partial acceptance releases only accepted portions. Rework holds related payroll. Rejection refunds eligible escrow after valid incurred costs.

## Payroll

Payroll requires an authorized task, active worker identity, valid delivery, Codex approval, customer acceptance when required, reserved payroll, no duplicate claim, no time conflict and a balanced ledger. Salary enters the worker's own simulated wallet. Household contribution requires a declared contract.

## Economy

The loop is demand, order, production or service, wages, consumption, revenue, maintenance, savings, reinvestment, capacity and new demand. Unsold inventory remains inventory, consumes capacity, incurs storage cost and is not revenue.

## Deterministic Demonstrations

1. Starter household receives one finite grant and buys food and water.
2. Tree package runs through escrow, candidate work, Codex review, customer acceptance, payroll and delivery.
3. Basic shelter requires land, materials, workers, tools, transport, time and inspection.
4. Unsupported capability is blocked or rejected with an eligible refund and preserved history.

## Event Envelope

Every mutation records `event_id`, `simulation_time`, `actor_id`, `request_id`, `project_id`, `task_id`, `action`, `inputs`, `outputs`, credit and resource deltas, previous and next state hashes, status and reason.

## APIs And Viewer

GitHub Pages projections under `/api/kaios/marketplace/v1/` are static and read-only. The Viewer exposes local deterministic controls only; it cannot mutate a server, deploy code, mint credit or call a wallet.

## Migration And Rollback

The implementation adds a new orchestration owner and route. It does not migrate existing state. Rollback removes the marketplace route, generated projections and registry links while leaving Player Genesis, AI Company and Payroll data unchanged.

## Acceptance

Acceptance requires one starter grant, finite resources, balanced credit, causal project execution, worker-owned payroll, explicit household transfer, deterministic replay, read-only APIs, no real KGEN/wallet/on-chain behavior, and all repository gates passing.
