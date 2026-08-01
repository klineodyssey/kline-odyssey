# KAIOS Life Runtime V1 Specification

Status: `SIMULATION_ONLY`

Authority: PR #66 Canonical Life Schema V1 and Organism Manifest Schema V2 remain authoritative. This runtime consumes, but does not redefine, either schema.

## Scope

Life Runtime V1 executes the PR #69 Grass, Tree, Fish, Shrimp, Mountain, Soil, Water, and River candidate packages. Each state retains candidate provenance and the following approval projection:

- `CANDIDATE_PACKAGE`
- `RUNTIME_VALIDATED`
- `CANONICAL_SCHEMA_COMPATIBLE`
- `NOT_PRODUCTION_AUTHORIZED`

Runtime validation is not Canonical promotion.

## Causal Contract

Every package starts at zero growth or formation progress and records an approved deterministic initialization cause. One tick advances one simulated day. Environment, location, mass, energy, water, health, integrity, age, growth or formation, and package-specific traits are updated before a chained state hash and event are emitted.

Events record `event_id`, `life_id`, `species_id`, simulation time, location, action, inputs, outputs, resource, energy, mass, health and integrity deltas, previous and next hashes, status, and reason. Mass deltas expose equal accounted input/output transfer and a zero balance residual.

## Package Rules

- Grass requires elapsed time, compatible soil, water, sunlight, nutrients, and temperature support. Grazing removes biomass. Mature growth can propagate.
- Tree uses the same plant dependencies plus root, biomass, stage, disease, declared output, reproduction, aging, and death state.
- Fish requires compatible water, oxygen, temperature, salinity, food, and elapsed time. Movement and reproduction are recorded.
- Shrimp additionally requires water quality and records molting and larval development.
- Mountain formation requires elapsed time and tectonic input. Erosion, weathering, slope, stability, deposits, water-source role, and collapse risk remain visible.
- Soil tracks moisture, fertility, pH, organic matter, compaction, erosion, contamination, crop support, and foundation support. Fertility cannot rise without organic matter or amendment input.
- Water tracks mass, volume, temperature, phase, purity, pollution, consumption, evaporation, freezing, boiling, and life-support role. Evaporation consumes energy and transfers mass.
- River requires a downhill elevation path. Uphill flow is blocked. Inflow, outflow, width, depth, sediment, pollution, flood, drought, bridge interaction, transport blocking, and irrigation role remain visible.

## Runtime Controls

The runtime is deterministic, bounded, serializable, stoppable, resumable, replayable, and auditable. Imports verify runtime version, seed, package identity, state shape, and state hashes. Limits are 10,000 ticks per package and 500 retained events per package.

## Authority Boundaries

`NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`, `NO_PRODUCTION_AUTHORITY`, and `SIMULATED_K11520_ONLY` remain mandatory. No Constitution V2 or protected CURRENT file is modified.
