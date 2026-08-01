# Cursor Forest Life Package Research Report

Task ID: `KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

Canonical handoff branch:
`cursor-handoff/KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001`

Source base commit:
`eaa63455fcf5f807b9d852a79157759b11293b2e`

Initial candidate commit:
`6feccef5d7d9cbeabc74fe2fd02dab2018c6ee2a`

Provenance hash basis:
`SHA256_OF_GIT_BLOB_CONTENT_AT_SOURCE_BASE_COMMIT`

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
  `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1`

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
4. Rainfall uses the explicit dimensional contract
   `total_rainfall_liter = daily_rainfall_l_per_m2_per_day * habitat_area_m2 *
   elapsed_days`, followed by deterministic half-even rounding. Rainfall,
   runoff, soil moisture, plant uptake, atmospheric return and river outflow
   use paired debits and credits.
5. Managed thinning or harvest must reduce standing biomass and create a named
   custody output or residue pool. Money alone cannot replace time, labor,
   access, rights or material availability.
6. Fire, disease and pest processes remain abstract stress scenarios. This
   package does not introduce insects, fungi or microbes as active life
   populations.
7. Nutrients occupy `PLANT_NUTRIENT_STORE`; they are never treated as total
   structural biomass. Structural growth debits an explicit
   `ATMOSPHERIC_CARBON_MATERIAL_PROXY`.
8. Energy is represented by explicit source, embedded-store, decomposition and
   heat-dissipation proxy pools. Every energy movement is paired and tested.
9. `FOREST-NUMERICAL-ORACLE-001` supplies complete initial pools, ten ordered
   event deltas, exact final pools and reproducible final-state SHA-256
   `1802f41c085121f051ce165212b762ae2503a7d7153aa1067defe5d8e88afe1e`.

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

## Rework Resolution

The same task and branch were repaired after `REWORK_REQUIRED` review:

- rainfall now has a dimensional conversion, rounding, tolerance, paired-pool
  transfer and complete event contract;
- `FOREST-NUMERICAL-ORACLE-001` provides exact initial state, ten ordered
  actions, exact final state, canonical serialization and a reproducible hash;
- structural biomass, nutrient stores, atmospheric carbon/material and energy
  source/store/dissipation proxies are separate and conserved;
- all five JSON artifacts carry immutable source provenance;
- the only Ecology owner identifier is
  `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1`.

The original 39 numeric parameter contracts remain unchanged. Two added
parameters use the same required metadata contract for rainfall precision and
energy balance tolerance.

## Provenance

Allowed labels are `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`. Repository identifiers and existing Runtime rules use
`REPOSITORY_DERIVED`; all numerical envelopes remain proposals requiring
validation.

The following immutable references were hashed from the exact Git blob bytes
returned by `git show eaa63455fcf5f807b9d852a79157759b11293b2e:<path>`.
Checkout bytes are not used because line-ending conversion can change their
hash. Inferred defaults remain separately labeled `MODEL_INFERENCE` or
`RESEARCH_PROPOSAL` and are not repository facts.

| Source | Exact path | Schema/version | SHA-256 |
|---|---|---|---|
| Tree | `KAIOS/life/candidates/tree/life.manifest.json` | `1.0.0` | `e9f264eb81f13d68afa69b94acc57278f3acbc656d28bb059f089e8995b35084` |
| Grass | `KAIOS/life/candidates/grass/life.manifest.json` | `1.0.0` | `42d9e9ee6e1f6fb03679dd8755a89ac184fd60cf6d10014829f94f337e05c430` |
| Soil | `KAIOS/life/candidates/soil/life.manifest.json` | `1.0.0` | `afc569084c467e92ed967559e0a99ce8c1877dea1a43c3f0c7efc8183b61aeb9` |
| Water | `KAIOS/life/candidates/water/life.manifest.json` | `1.0.0` | `8764d1bde87565c87f0b50a1f4776760b694881654b4743b765728541a9e9fee` |
| River | `KAIOS/life/candidates/river/life.manifest.json` | `1.0.0` | `fe2075a704959d9f2c2962067400e39ae62f884b76b88fb1a2a9143888bcaa61` |
| Ecology | `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | Ecology schema `1.0.0`; owner `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |

Every JSON artifact repeats this branch, source base, initial candidate commit,
exact source path, source schema/version and SHA-256 registry so that each file
remains independently auditable.

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
