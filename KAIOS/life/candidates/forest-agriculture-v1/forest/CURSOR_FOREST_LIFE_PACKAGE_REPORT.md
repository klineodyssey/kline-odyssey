# Cursor Forest Life Package Research Report

Task ID: `KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

## Scope

These six artifacts describe a managed-forest research candidate assembled
from existing repository owners. A forest is treated as a habitat and managed
ecosystem projection, not as a new animal-like Life type and not as a new
Runtime. All values are simulation approximations pending Codex review.

## Existing Owners Reused

- Tree population: `SPECIES-KAIOS-FOUNDATIONAL-TREE`
- Grass ground cover: `SPECIES-KAIOS-FOUNDATIONAL-GRASS`
- Soil state: `SPECIES-KAIOS-FOUNDATIONAL-SOIL`
- Water pool: `SPECIES-KAIOS-FOUNDATIONAL-WATER`
- River and runoff relation: `SPECIES-KAIOS-FOUNDATIONAL-RIVER`
- Forest habitat: `HABITAT-FOREST-V1`
- Habitat, population, biomass, water, nutrient and decomposition truth:
  existing Ecology Runtime owner

The proposals contain only references, candidate parameter envelopes,
deterministic scenario inputs and expected invariants. They do not persist an
authoritative copy of Life or Ecology state.

## Candidate Findings

1. Composition must be bounded by habitat area, carrying capacity, water,
   nutrients, sunlight, temperature and elapsed simulation time.
2. Regeneration requires an existing seed or propagation source. It cannot
   restore mature biomass instantly.
3. Growth transfers water, nutrients and an energy proxy into biomass through
   recorded paired deltas. Death transfers biomass into dead biomass before
   decomposition returns a bounded portion to nutrients.
4. Rainfall, runoff, soil moisture, plant uptake, atmospheric return and river
   outflow must use paired debits and credits. Water cannot appear from an
   unexplained irrigation or rainfall action.
5. Managed thinning or harvest must reduce standing biomass and create a named
   custody output or residue pool. Money alone cannot replace time, labor,
   access, rights or material availability.
6. Fire, disease and pest processes remain abstract stress scenarios. This
   package does not introduce insects, fungi or microbes as active life
   populations.

## Artifact Map

- `forest-composition-candidates.json`: candidate forest layers and bounded
  composition parameters.
- `forest-environment-thresholds.json`: deterministic compatibility and stress
  envelopes.
- `forest-regeneration-scenarios.json`: baseline, disturbance and recovery
  action sequences.
- `forest-resource-flow-proposal.json`: paired water, mass and nutrient flow
  contracts.
- `forest-test-scenarios.json`: objective candidate acceptance scenarios.

## Provenance

Allowed labels are `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`. Repository identifiers and existing Runtime rules use
`REPOSITORY_DERIVED`; all numerical envelopes remain proposals requiring
validation.

## Boundaries

No Runtime, Canonical Schema, CURRENT, Wallet, KGEN, Rights authority, Economy
authority, deployment or merge behavior is created or changed. No candidate is
Canonical, production-authorized, agronomic guidance or a real forestry claim.

## Recommendation

Codex should validate all parameter envelopes against the Canonical Life,
Ecology, Physics, Labor, Rights and Economy owners before using any proposal in
an implementation specification. Unsupported organism classes should remain
abstract resource or stress proxies until separately approved Life packages
exist.
