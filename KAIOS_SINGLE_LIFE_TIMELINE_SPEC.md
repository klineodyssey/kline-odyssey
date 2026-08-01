# KAIOS Single Life Timeline Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

Task: `KAIOS-PR64-PHYSICAL-LABOR-CONSTRUCTION-SPEC-001`

Authority: `NO_PRODUCTION_AUTHORITY`

## Purpose

This specification defines the physical timeline constraints that future KAIOS
simulation runtimes must enforce. It extends the deterministic clock and event
history patterns in `KGEN-KAIOS/world-viewer/simulation/simulation-clock.js`
and `KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js`; it does
not activate a new runtime.

## Invariants

1. One physical life has exactly one primary `body_instance_id` at a time.
2. A primary body occupies exactly one `current_location` at a time.
3. A primary body performs at most one primary physical activity at a time.
4. A change of location requires a non-zero travel interval and a feasible route.
5. Physical work intervals cannot overlap travel, another shift, required rest,
   required sleep, or another primary physical activity.
6. Money cannot replace missing time, route, worker, skill, tool, machine,
   material, energy, technology, safety staff, or inspection.
7. Unapproved clones, remote bodies, body sharing and consciousness forks are
   rejected with `BODY_INSTANCE_CONFLICT`.

These are simulation constraints. They do not assert legal personhood or
control a real person, robot, workplace, or production system.

## Required Record

Every timeline record contains:

`life_id, body_instance_id, current_location, current_activity,
activity_start, activity_end, travel_start, travel_end, work_shift_id,
meal_state, toilet_state, rest_state, sleep_state, health_state, stamina,
availability, attendance, time_log, event_log`

The machine contract is `KAIOS_PHYSICAL_LABOR_SCHEMA.json`.

## Timeline States

`OFF_DUTY`, `COMMUTING`, `CLOCKED_IN`, `SETUP`, `ACTIVE_WORK`, `MEETING`,
`WAITING`, `MEAL`, `TOILET`, `REST`, `EQUIPMENT_DOWNTIME`, `CLEANUP`,
`CLOCKED_OUT`, `SLEEPING`.

Only `COMMUTING` may change the primary location. A travel event records origin,
destination, route, start, end and elapsed time. Arrival cannot precede travel
completion. `SLEEPING`, `MEAL`, `TOILET` and `REST` are not effective work.
`DECEASED` health state makes the life unavailable for future shifts while
preserving immutable history.

## Conflict Evaluation

| Condition | Required result |
|---|---|
| Two primary roles overlap | `ROLE_TIME_CONFLICT` |
| Two locations overlap | `LOCATION_CONFLICT` |
| Shift starts before feasible arrival | `TRAVEL_TIME_CONFLICT` |
| Required rest overlaps work | `REST_REQUIREMENT_CONFLICT` |
| Required sleep overlaps work | `SLEEP_REQUIREMENT_CONFLICT` |
| Multiple primary bodies are active | `BODY_INSTANCE_CONFLICT` |
| Two shifts overlap | `SHIFT_OVERLAP` |

Validation is fail-closed. A conflicting interval is rejected; it is never
trimmed, teleported or silently reassigned.

## Replay

Each transition appends an event with source, previous state hash and next state
hash. Same initial state, ordered actions and deterministic seed must reproduce
the same timeline. Import rejects overlapping intervals and boundary promotion.
