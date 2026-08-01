# KAIOS Workforce Requirements Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Per-Stage Workforce Contract

Every construction stage defines:

`minimum_workers, optimal_workers, maximum_effective_workers,
required_skills, supervisor_count, safety_staff, machine_operators,
workspace_capacity`

Required roles are:

`surveyor`, `site_supervisor`, `general_laborer`, `excavator_operator`,
`steel_worker`, `concrete_worker`, `electrician`, `plumber`, `safety_officer`,
`inspector`.

One life may satisfy one primary physical role at a time. A supervisor or safety
officer counts toward general labor only when the same interval explicitly
permits that role and no conflict is created.

## Validation

| Failure | Code |
|---|---|
| Headcount below minimum | `INSUFFICIENT_WORKFORCE` |
| Required skill absent | `MISSING_REQUIRED_SKILL` |
| Supervisor requirement unmet | `NO_SUPERVISOR` |
| Safety staffing unmet | `NO_SAFETY_STAFF` |
| Machine has no qualified operator | `NO_MACHINE_OPERATOR` |
| Bodies exceed safe site capacity | `WORKSPACE_OVERCAPACITY` |

## Productivity

Productivity rises toward `optimal_workers`, then receives diminishing returns.
Workers above `maximum_effective_workers` add no productive capacity. Workers
above `workspace_capacity` block the stage. A deterministic crowding penalty
must account for coordination, access obstruction and safety separation.

Reference policy:

```text
minimum_workers <= optimal_workers <= maximum_effective_workers <= workspace_capacity
```

No payroll budget or deadline pressure may override the workforce gates.
