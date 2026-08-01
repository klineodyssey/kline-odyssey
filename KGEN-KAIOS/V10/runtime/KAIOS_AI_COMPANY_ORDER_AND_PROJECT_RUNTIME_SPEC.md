# KAIOS AI Company Order and Project Runtime Specification

Task: `KAIOS_AI_COMPANY_ORDER_AND_PROJECT_RUNTIME`

Status: `SPECIFICATION / HOLD_NOT_IMPLEMENTED`

Mode: `SIMULATION_ONLY / NO_EXTERNAL_AUTONOMY`

## Objective

Accept a bounded player request such as "I need a fishpond" and convert it into
an auditable simulated project. The AI Company coordinates existing Runtime
owners; it does not create materials, labor, rights, money, roads, machines or
time.

## State Machine

`REQUESTED -> NEEDS_REVIEW -> SURVEY -> DESIGN -> BUDGET -> MATERIAL_PLAN ->
WORKFORCE_PLAN -> SUPPLY_CHAIN_PLAN -> SCHEDULED -> CONSTRUCTION -> INSPECTION ->
REWORK_OR_ACCEPTANCE -> DELIVERY -> OPERATION_READY`.

Blocking states include `MISSING_REQUIREMENT`, `NO_LAND_CAPABILITY`,
`NO_SURVEY`, `BUDGET_INSUFFICIENT`, `MATERIAL_UNAVAILABLE`,
`WORKFORCE_UNAVAILABLE`, `TOOL_OR_MACHINE_UNAVAILABLE`, `NO_ACCESS_ROUTE`,
`TECHNOLOGY_GATE`, `SAFETY_GATE`, `INSPECTION_FAILED` and `CUSTOMER_REJECTED`.

## Project Envelope

Every project records order/customer IDs, requested capability, location,
requirements, acceptance criteria, rights capabilities, design revision,
bill of materials, workers and skills, tools/machines, energy/water, logistics,
schedule, budget source, balanced ledger, inspections, rework, event chain,
previous/next hashes and `simulation_only: true`.

## Runtime Reuse

- Player Genesis owns simulated identity and work-order funding.
- AI Company Alpha owns company-organism coordination.
- Physical Labor owns body/time/location and workforce gates.
- Causal World owns transport and staged construction.
- Supply Chain owns materials, inventory, demand and finance rules.
- Fishpond and future Forest/Agriculture runtimes own domain acceptance.

## Authority

The AI Company may propose and coordinate. Codex review gates remain required
for specification, safety and deployment. It cannot mutate Canonical schemas,
CURRENT, Rights authority, Economy authority, Wallet, KGEN, Production Runtime
or external systems.

## Acceptance Tests

Tests must prove stage order, no instant building, no money substitution,
worker scheduling, route time, balanced costs, inspection/rework, deterministic
replay, rejected unsafe imports and disabled production authority.

Implementation status remains `HOLD_NOT_STARTED` until the Forest/Agriculture
planning tranche is reviewed and a separate authorization starts this Runtime.
