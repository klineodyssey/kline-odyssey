# KAIOS Reproduction, Population and Ecosystem Runtime V1 Specification

Status: `APPROVED_SPECIFICATION_CANDIDATE`

Mode: `LOCAL_DETERMINISTIC_SIMULATION`

## Objective

Extend the existing ecosystem owner so the eight foundational Life Runtime V1 packages can participate in bounded habitats, populations, reproduction or natural change, food/resource relationships, death, decomposition, water/soil cycles, pollution and restoration. This is a simulation approximation, not a complete biosphere or real biological model.

## Scope

- `GRASS`, `TREE`, `FISH`, `SHRIMP`, `MOUNTAIN`, `SOIL`, `WATER`, `RIVER`
- deterministic habitats, resource pools and species populations
- bounded births, deaths, migration, competition and carrying capacity
- biomass, water and nutrient accounting
- read-only static APIs and World Viewer controls

Out of scope: real biology, commercial agriculture or aquaculture, unrestricted genome rewriting, automatic species promotion, predators not represented by approved Life packages, real ownership, Wallet, KGEN, settlement, legal authority, external autonomy and Production Runtime.

## Canonical Owner and Migration

`KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` remains the single ecosystem owner. V1 extends it through a backward-compatible factory/export; the existing Cambrian alpha interface remains available. Life behavior is consumed from `KAIOS/life/runtime/foundational-life-runtime.js`, not duplicated. No persistent migration is required; incompatible local envelopes are rejected and can be reset.

## Entities

`ECOSYSTEM`, `HABITAT`, `POPULATION`, `SPECIES_POPULATION`, `FOOD_RELATION`, `RESOURCE_POOL`, `WATER_POOL`, `SOIL_POOL`, `NUTRIENT_POOL`, `DECOMPOSITION_POOL`, `CARRYING_CAPACITY`, `REPRODUCTION_EVENT`, `BIRTH_EVENT`, `DEATH_EVENT`, `MIGRATION_EVENT`, `PREDATION_EVENT`, `COMPETITION_EVENT`, `DISEASE_EVENT`, `POLLUTION_EVENT`, `RESTORATION_EVENT`, `SEASON_EVENT`.

Every entity carries `id`, `type`, `location`, `simulation_time`, `status`, `source`, `authority`, `simulation_only`, `history`, `previous_state_hash`, and `next_state_hash`.

## State Machines

Runtime: `PAUSED -> RUNNING -> PAUSED -> STOPPED`; import restores only validated paused state.

Population: `STABLE`, `GROWING`, `DECLINING`, `OVER_CAPACITY`, `RESOURCE_STRESSED`, `DISEASE_STRESSED`, `POLLUTION_STRESSED`, `COLLAPSING`, `EXTINCT_LOCAL`, `RECOVERING`.

Events are append-only and bounded. Every transition records deterministic inputs, outputs, resource deltas, previous/next hashes, status and reason.

## Population and Carrying Capacity

Each species population records the required count, distributions, resource needs, rates, diversity proxy, generation and status. Count changes use integer births/deaths/migrations only.

Capacity is a deterministic `SIMULATION_APPROXIMATION` from area, water, food, soil fertility, oxygen, temperature fit, pollution, shelter, space requirement, season and explicitly authorized intervention. Capacity is clamped to configured hard bounds. Above capacity, reproduction falls, competition and migration rise, then health and survival decline. Runtime hard population cap defaults to 100 and cannot exceed 500.

## Reproduction

| Life | Approved Modes |
|---|---|
| Grass | `SEED_PROPAGATION`, `VEGETATIVE_PROPAGATION` |
| Tree | `SEED_PROPAGATION` |
| Fish | `SEXUAL_REPRODUCTION`, `SPAWNING` |
| Shrimp | `SEXUAL_REPRODUCTION`, `LARVAL_DEVELOPMENT` |
| Mountain | `NO_REPRODUCTION` |
| Soil | `NO_REPRODUCTION` |
| Water | `NO_REPRODUCTION` |
| River | `NO_REPRODUCTION` |

Gates: propagation source or parents, minimum age, health, energy, food, water, habitat, season, temperature, capacity, cooldown and scenario generation limit. Block reasons are exactly `NO_MATE_OR_PROPAGATION_SOURCE`, `INSUFFICIENT_ENERGY`, `INSUFFICIENT_FOOD`, `INSUFFICIENT_WATER`, `NO_HABITAT`, `OVER_CARRYING_CAPACITY`, `WRONG_SEASON`, `TEMPERATURE_OUT_OF_RANGE`, `HEALTH_TOO_LOW`, `REPRODUCTION_COOLDOWN`, `POPULATION_CAP_REACHED`.

## Food Web and Resource Flows

Grass and tree are biomass producers. Fish consumes declared aquatic primary food; shrimp consumes aquatic food or detritus. `DEAD_BIOMASS` enters decomposition. Decomposition returns nutrients to soil. Water supports plants and aquatic populations. River transports water and provides habitat. Mountain contributes runoff, elevation barriers and bounded minerals.

Missing plankton, microbes and decomposers are represented only by `AQUATIC_PRIMARY_FOOD_POOL`, `DETRITUS_POOL`, and `MICROBIAL_DECOMPOSITION_PROXY`, each marked `ABSTRACT_RESOURCE_POOL` and `NOT_FULL_LIFE_RUNTIME`.

Flows conserve water, biomass and nutrients within configured tolerance: uptake, release, evaporation, inflow/outflow, soil moisture, growth, consumption, waste, death biomass, decomposition, nutrient return, erosion, sediment and approved harvest/removal. No mass vanishes; residual rounding is recorded.

## Habitats

`GRASSLAND`, `FOREST`, `FISHPOND`, `RIVER_HABITAT`, `WETLAND`, `SOIL_HABITAT`, `MOUNTAIN_WATERSHED` define location, area, water, temperature, soil, oxygen, salinity, pollution, food pools, shelter, capacity, season, hazards, intervention and restoration state. `FISHPOND` is `ECOLOGICAL_SIMULATION_ONLY` with no commercial settlement.

## Water and Soil Cycles

Mountain runoff feeds river inflow. River water feeds habitat and irrigation projections, with flood/drought states. Water changes soil moisture and evaporates with time/energy. Plant death enters decomposition and organic matter. Erosion moves soil to river sediment. Pollution degrades water and soil and stresses fish/shrimp.

Conditions: `RIVER_FLOW_BLOCKED`, `DROUGHT`, `FLOOD`, `LOW_OXYGEN`, `HIGH_POLLUTION`, `LOW_SOIL_MOISTURE`, `LOW_FERTILITY`, `EROSION_RISK`, `SEDIMENT_OVERLOAD`.

## Natural Selection Limits

Only `water_efficiency`, `temperature_tolerance`, `growth_rate`, `disease_resistance`, `oxygen_tolerance`, `salinity_tolerance`, and `body_size_proxy` may vary. Values remain inside candidate-data species bounds. Mutation is low, seeded and configurable. Output is `TRAIT_VARIATION` or `CANDIDATE_LINEAGE`; it is always `NO_AUTOMATIC_NEW_SPECIES`.

## Death, Decomposition and Extinction

Age, starvation, dehydration, oxygen, temperature, disease, predation proxy, pollution, habitat loss, overcrowding and accident may cause death. Death decrements count, creates biomass/remains, preserves event history and blocks later reproduction for that individual/count. Biomass enters decomposition, consumption, burial or recorded removal. Count zero is `EXTINCT_LOCAL`; Species records remain.

## Commands and Queries

Commands: `createEcosystem`, `createHabitat`, `addPopulation`, `advanceTime`, `evaluateResources`, `evaluateCarryingCapacity`, `processGrowth`, `processReproduction`, `processCompetition`, `processFoodConsumption`, `processDeath`, `processDecomposition`, `processWaterCycle`, `processSoilCycle`, `processPollution`, `processMigration`, `processRestoration`, `exportState`, `importState`, `resetState`, `replayEvents`.

Queries return immutable snapshots. Public GitHub Pages APIs are static JSON and expose no commands or mutation endpoints.

## UI

World Viewer route: `world-viewer/ecosystem-v1/`. Views cover map, habitats, populations, food relations, water, soil, nutrients, capacity, births, deaths, decomposition, pollution, flood/drought, timeline, charts and status. Controls are local-only start/pause/resume/advance/reset/export/import, habitat/species/scenario selection and drought/pollution/restoration scenarios.

## Security and Performance

Bounded limits: 7 habitats, 8 populations, 500 total individuals, 1,000 events, 10,000 ticks, fixed-size history and no network dependency. No real Wallet, KGEN, on-chain transfer, bioengineering, public mutation, legal effect, external agent, Production authority or Constitution promotion.

## Determinism and Persistence

Same initial state, seed and action list produces identical state hashes. State is serializable, stoppable, resumable, replayable and auditable. Export is `NON_AUTHORITATIVE_SIMULATION`; import validates schema, limits and safety boundaries. Local storage is optional and namespaced.

## Tests and Acceptance

The test plan is `KAIOS_REPRODUCTION_ECOLOGY_TEST_PLAN.md`. Acceptance requires all specified reproduction, population, ecology, physics, replay, regression, security, UI and API gates; P0/P1/P2 unresolved must be zero.

## Rollback

Remove the V1 route/API projections and revert the additive V1 export. Existing ecosystem alpha storage and Life Runtime V1 remain unchanged. No data migration, chain rollback or authority reversal is needed.

## Cursor Contribution

Decision: `CURSOR_IMPLEMENTATION_WORK_AVAILABLE`. Cursor may author candidate-only datasets/tests under `KAIOS_ECOLOGY_CURSOR_TASK_ENVELOPE.json`. Codex owns review, repairs, authoritative Runtime implementation and promotion decisions.
