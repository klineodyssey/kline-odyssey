# KAIOS Real Causal World Runtime Specification

Task ID: `KAIOS-REAL-CAUSAL-WORLD-RUNTIME-001`

Status: `LOCAL_DETERMINISTIC_SIMULATION`

## Authority Boundaries

- `SIMULATION_ONLY`
- `NO_REAL_KGEN`
- `NO_REAL_WALLET`
- `NO_REAL_GPS_HISTORY`
- `NO_EXTERNAL_AUTONOMY`
- `NO_PRODUCTION_AUTHORITY`

This runtime is a bounded browser simulation. It does not establish a
production logistics network, legal land right, real payment, blockchain
settlement, engineering certification, or external control authority.

## Canonical Sources Reused

| Source | Reused contract |
|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | Boot order and protected Runtime boundaries |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Configurable physics and no silent universal constants |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | Existing map authority remains unchanged |
| `KGEN-KAIOS/world-viewer/civilization/runtime-utils.js` | Clone, persistence envelope, storage and snapshot helpers |
| `KGEN-KAIOS/world-viewer/simulation/simulation-clock.js` | Explicit deterministic time-step pattern |
| `KGEN-KAIOS/world-viewer/settlement/logistics-runtime.js` | Existing logistics naming and synthetic settlement boundary |
| `KGEN-KAIOS/world-viewer/production/production-runtime.js` | Material, production and bounded resource conventions |
| `KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js` | Separate Player, AI and Household accounts and employment roles |
| `KGEN-KAIOS/world-viewer/civilization/civilization-runtime.js` | Canonical civilization-stage order and technology gating |
| `KGEN-KAIOS/world-viewer/land/land-runtime.js` | Synthetic land and local-only authority boundary |

No canonical conflict was found. Runtime CURRENT, Universe Map CURRENT,
Genesis law, Universe Law, Token, supply and tax configuration are untouched.

## Causal Model

The model records `WORLD_NODE`, `REGION`, `CITY`, `LAND_PARCEL`,
`ROAD_SEGMENT`, `RIVER_SEGMENT`, `BRIDGE`, `ROUTE`, `VEHICLE`, `CARGO`,
`WORKER`, `TOOL`, `MATERIAL`, `ENERGY_SOURCE`, `CONSTRUCTION_PROJECT`,
`MAINTENANCE_EVENT`, `WEAR_STATE`, and `DELIVERY_ORDER` entities. Every entity
has identity, type, position, status, timestamps, source, authority,
`simulation_only`, and history fields.

Units are explicit: meter, second, kilogram, meter per second, joule, liter,
and meter per second squared. Gravity is configurable. Calculations are
bounded deterministic approximations, not engineering-grade models.

## Route and Transport Rules

Terrain affects passability, speed, fuel, construction difficulty, wear and
cost. A truck needs compatible roads; a river needs a usable bridge or ferry.
Closed roads and bridges, load-limit violations, unavailable technology,
insufficient fuel or energy, incompatible vehicles and impassable terrain
block travel with explicit reasons.

Transport time includes loading, travel, unloading, rest, traffic, terrain,
bridge and maintenance delays. Distance, cargo mass, gravity, terrain and road
condition affect fuel and wear. Movement advances only through explicit time
steps. Critical wear stops delivery until simulated maintenance succeeds.

## Construction Rules

`BASIC_HOUSE_FOUNDATION` progresses in this order:

```text
SURVEY -> SITE_CLEARING -> EXCAVATION -> FOUNDATION
-> STRUCTURE -> UTILITIES -> INSPECTION -> COMPLETE
```

Each stage requires its declared time, materials, tools, workers, energy,
access route and civilization technology. A missing requirement blocks the
stage. No stage may be skipped and no house appears instantly.

## Economy and Player Integration

The demonstration delivery has a funded customer budget, carrier revenue,
Player and AI payroll, operating costs, and profit or loss. Ledger entries are
balanced transfers. Player and AI accounts remain separate. The first house
foundation uses `BUILDING_LABORER` and `SURVEY_ASSISTANT` roles and charges
stage costs from a simulated customer budget.

## Determinism

The same initial state, seed and action sequence produces the same serialized
result. Every causal event records actor, action, inputs, outputs, cost,
status, reason, and previous/next state hashes. Save, pause, resume, replay,
export, import and reset are local-only operations.

## Demonstration

The Kaohsiung-to-Hsinchu steel delivery is labeled
`SYNTHETIC_DEMONSTRATION`. It includes deterministic successful, missing
bridge, bridge load-limit, insufficient-fuel and wear-failure branches. It
does not store or infer real GPS history.
