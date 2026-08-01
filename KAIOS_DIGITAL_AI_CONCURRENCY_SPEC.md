# KAIOS Digital AI Concurrency Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

Authority: `NO_EXTERNAL_AUTONOMY / NO_PRODUCTION_AUTHORITY`

## Scope

A digital AI may process bounded tasks concurrently because computation is not
the same as physical embodiment. Concurrency is capacity-limited, observable,
reviewable and deterministic. A robotic or otherwise physical AI body still
obeys the single-body, single-location and single-primary-physical-job rules in
`KAIOS_SINGLE_LIFE_TIMELINE_SPEC.md`.

## Capacity Contract

Required fields are:

`compute_capacity, memory_capacity, context_capacity, energy_budget,
concurrency_limit, active_task_count, waiting_task_count, quality_risk,
latency, review_queue`

Every task records its compute, memory, context and energy reservation. Active
reservations must not exceed any capacity. `active_task_count` must not exceed
`concurrency_limit`. Excess tasks enter a waiting state; they are not reported
as active progress.

## Task States

`ACTIVE_COMPUTE`, `WAITING_EXTERNAL`, `WAITING_TEST`, `WAITING_REVIEW`,
`PAUSED`, `COMPLETED`.

Only `ACTIVE_COMPUTE` consumes an active concurrency slot. Waiting work remains
observable and must resume through an explicit event. `COMPLETED` is immutable.

## Exhaustion And Quality

- Insufficient compute, memory, context or energy blocks admission.
- Capacity is not oversubscribed by lowering accounting precision.
- Rising utilization increases `latency` and `quality_risk` according to a
  documented deterministic policy.
- High quality risk routes output to `WAITING_REVIEW`; it does not bypass review.
- Review queue length does not grant more compute capacity.
- Payment or priority cannot override capacity or safety gates.

The specification does not create autonomous agents, background services or
authority to act outside the local simulation.
