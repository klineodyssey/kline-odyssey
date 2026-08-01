# KAIOS Construction Causality Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

Authority: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

## Canonical Relationship

This specification extends the PR #63 `BASIC_HOUSE_FOUNDATION` foundation. It
does not modify that runtime and does not claim the complete house runtime is
implemented. Future implementation must adapt the existing causal runtime,
unit system, event hashes, route gates and balanced simulated ledgers rather
than create a parallel engine.

## Canonical Sources Reviewed

| Source | Reused contract | PR #64 decision |
|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | mandatory boot and protected boundaries | read only; unchanged |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | unit and physics authority | read only; unchanged |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | canonical map boundary | read only; unchanged |
| `KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js` | SI units, materials, tools, workers, routes, stage time and event hashes | extended by specification, not modified |
| `KGEN-KAIOS/world-viewer/simulation/simulation-clock.js` | deterministic timeline convention | reused by reference |
| `KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js` | Life IDs, work order, attendance, stamina, AI energy/compute and separate accounts | reused by reference |
| `KGEN-KAIOS/civilization/INDIVIDUAL_WORKER_STANDARD.md` | worker identity and evidence boundary | compatible; physical timeline made explicit |
| `KGEN-KAIOS/civilization/PAYROLL_STANDARD.md` | reviewed work before simulated payroll | preserved; payment cannot replace causality |
| `KGEN-KAIOS/civilization/RIGHTS_SEPARATION_STANDARD.md` | rights remain separate | preserved |
| `KGEN-KAIOS/land/RIGHTS_AUTHORITY_STANDARD.md` | land authority separation | simulation land right is not legal title |
| `KGEN-KAIOS/workforce/ATTENDANCE_STANDARD.md` | attendance requires evidence | physical attendance adds location/time constraints |
| `KGEN-KAIOS/workforce/COMPENSATION_STANDARD.md` | prototype ledger and Human-gated real payment | no real payment activated |

No material canonical conflict was found. The existing runtime implements an
eight-stage foundation demonstration. The twelve-stage sequence below is the
required future complete-house contract and is not a claim that those stages
are currently executable.

## Dependency Chain

```text
land_right -> survey -> design -> permit_simulation -> site_access
-> workforce -> materials -> equipment -> energy -> transport
-> construction -> inspection -> rework -> completion
```

`land_right` is a simulation authorization and not legal title. Every dependency
must be evidenced before the dependent stage begins. Missing money is not the
only block: money cannot substitute for an absent physical dependency.

## Residential Stage Order

```text
SURVEY -> DESIGN -> SITE_CLEARING -> EXCAVATION -> FOUNDATION -> STRUCTURE
-> ROOF -> UTILITIES -> INTERIOR -> INSPECTION -> REWORK -> COMPLETE
```

No stage may be skipped or completed instantly. `REWORK` may have zero physical
scope only after an inspection explicitly records no defects; it still records
the decision event before `COMPLETE`.

## Stage Contract

Every stage defines:

`bill_of_materials, tools, machines, workers, skills, energy, water, time,
site_access, technology_gate, safety_gate, inspection_gate`

The machine shape is `KAIOS_CONSTRUCTION_SCHEMA.json`. Material quantities are
consumed or reserved through auditable transactions. Tools and machines remain
located, available, compatible and maintained. Workers must pass the timeline
and workforce specifications. Transport must deliver inputs before use.

## Required Blocking

- Missing workers or skills: workforce conflict code.
- Missing material: `BLOCKED_MATERIAL:<ITEM>`.
- Missing tool or machine: `BLOCKED_TOOL:<ITEM>` or
  `NO_MACHINE_OPERATOR` where applicable.
- Missing access or transport: `BLOCKED_ACCESS`.
- Missing energy or water: `BLOCKED_ENERGY` or `BLOCKED_WATER`.
- Insufficient technology: `BLOCKED_TECHNOLOGY`.
- Failed safety or inspection: `BLOCKED_SAFETY` or `REWORK_REQUIRED`.
- Out-of-order transition: `STAGE_ORDER_CONFLICT`.

## Conservation And History

Time advances explicitly. Material input equals installed, waste, returned and
remaining material. Energy input equals recorded consumption plus remainder.
Workers contribute only effective work time at the site. Each state transition
records inputs, outputs, source, actor and previous/next state hashes for replay.

## Boundary

No real construction, permit, property title, labor dispatch, wallet, KGEN,
settlement, autonomous machinery or Production Runtime is activated here.
