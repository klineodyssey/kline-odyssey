# KAIOS Work Shift Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Shift Contract

A shift binds one `life_id`, one `body_instance_id`, one role and one physical
location to a closed scheduled interval. Acceptance requires timeline,
availability, travel, health, stamina, rest, sleep, skill and site-capacity
validation before `CLOCKED_IN`.

Required shift fields are defined by `KAIOS_PHYSICAL_LABOR_SCHEMA.json`.

## Effective Work

```text
effective_work_time =
  scheduled_time
  - commute
  - meal
  - toilet
  - rest
  - waiting
  - equipment_downtime
  - material_shortage
```

All operands use minutes and are non-negative. Effective work cannot be
negative; a negative result is invalid rather than clamped. Commute is outside
productive work even if an employer funds it. Waiting and shortage intervals
remain auditable but cannot be billed as completed physical output unless an
explicit contract separately pays waiting time.

## State Flow

```text
OFF_DUTY -> COMMUTING -> CLOCKED_IN -> SETUP -> ACTIVE_WORK
ACTIVE_WORK -> MEAL | TOILET | REST | WAITING | EQUIPMENT_DOWNTIME
ACTIVE_WORK -> CLEANUP -> CLOCKED_OUT -> OFF_DUTY
OFF_DUTY -> SLEEPING -> OFF_DUTY
```

Transitions require timestamps and location continuity. `MEETING` is a primary
activity when physical attendance is required. Remote digital participation may
be modeled under AI concurrency only when it does not imply a second body.

## Rejection Codes

Schedule validation emits `ROLE_TIME_CONFLICT`, `LOCATION_CONFLICT`,
`TRAVEL_TIME_CONFLICT`, `REST_REQUIREMENT_CONFLICT`,
`SLEEP_REQUIREMENT_CONFLICT`, `BODY_INSTANCE_CONFLICT` or `SHIFT_OVERLAP`.
Attendance evidence cannot override these failures.
