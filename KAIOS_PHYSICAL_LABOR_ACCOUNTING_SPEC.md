# KAIOS Physical Labor Accounting Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

Units: meter, second, kilogram, joule

## Conservation Rules

Physical labor conserves mass, distance, time, energy and worker capacity.
Money records economic allocation; it cannot move material or complete work.
Every aggregate must reconcile to its detailed inputs within an explicit
numeric tolerance. The reference tolerance is `1e-9` for calculated values.

## Brick-Carrying Reference Model

Inputs:

`brick_count, mass_per_brick, total_mass, pickup_distance, carry_distance,
vertical_height, bricks_per_trip, worker_speed, worker_strength,
worker_stamina, gravity, terrain, stairs, tools, safety_limit, load_time,
unload_time, rest_interval`

Outputs:

`trips, distance_walked, mass_moved, vertical_work, active_minutes,
rest_minutes, total_worker_hours, required_workers, estimated_completion,
injury_risk, fatigue, blocked_reason`

Reference equations:

```text
total_mass = brick_count * mass_per_brick
trips = ceil(brick_count / bricks_per_trip)
mass_moved = total_mass
distance_walked = trips * (pickup_distance + carry_distance)
vertical_work = total_mass * gravity * vertical_height
total_worker_hours = (active_minutes + rest_minutes) / 60
```

The final trip may carry fewer bricks. Per-trip mass must not exceed
`worker_strength` or `safety_limit`; otherwise work is blocked or requires an
approved tool and additional workers. Terrain and stairs reduce speed and raise
fatigue; they cannot reduce conserved mass or distance.

## Recording Modes

- `ONE_STEP_ONE_RECORD`: records each pickup, carry, placement and rest event.
- `AGGREGATED_BATCH`: records a bounded batch with count, distance, mass, time,
  energy and worker identifiers.

Both modes must produce identical conservation totals for identical inputs.
Aggregated mode may reduce record volume, never physical requirements.

## Fatigue And Injury Risk

Fatigue increases with load ratio, active duration, vertical work, difficult
terrain, stairs and inadequate rest. Work blocks when health, stamina or safety
limits fail. Injury risk is a bounded simulation indicator, not medical advice.
