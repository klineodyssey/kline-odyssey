# KAIOS Reproduction and Ecology Runtime V1 Report

Task: `KAIOS-CHARTER-REPRODUCTION-ECOLOGY-PROGRAM-001`

Mode: `LOCAL_DETERMINISTIC_SIMULATION`

## Canonical Ownership

The implementation extends the established ecosystem owner at
`KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js`. It preserves the
existing `CAMBRIAN_ECOSYSTEM_ALPHA` export and adds
`createReproductionEcologyRuntimeV1`. Canonical Life, Organism Schema V2,
Universe Physics and Constitution sources are consumed, not redefined.

## Runtime

- seven habitats: grassland, forest, fishpond, river, wetland, soil and mountain watershed
- eight population records: Grass, Tree, Fish, Shrimp, Mountain, Soil, Water and River
- biological population hard cap: `500`
- only Grass, Tree, Fish and Shrimp reproduce
- Mountain, Soil, Water and River use `NO_REPRODUCTION`
- deterministic carrying capacity from water, pollution, oxygen and fertility
- bounded plant growth, aquatic food consumption, mortality, decomposition and nutrient return
- mountain runoff, river outflow, evaporation, erosion and sediment transfer
- pollution, drought, flood, low oxygen and restoration states
- bounded trait variation with `CANDIDATE_LINEAGE` and no automatic Species creation
- event chain with previous/next deterministic state hashes
- schema-constrained transactional imports with entity-level simulation authority checks
- global/habitat water reconciliation and bounded restoration-water reserves
- start, pause, resume, stop, export, import, reset and replay

The equations are labeled `SIMULATION_APPROXIMATION`; they do not claim
engineering-grade ecology or real biological prediction.

## Cursor Contribution

Decision: `CURSOR_IMPLEMENTATION_WORK_AVAILABLE`.

Cursor PR `#76` supplied candidate-only food relationships, habitat
compatibility, environmental thresholds, population fixtures, Viewer cards and
tests. Codex found one P1 population-cap inconsistency; Cursor repaired it at
`2bc81b0d7caab0a598a478e7c04e026b24d5f3ab`. Final decision:
`APPROVED_WITH_REPAIRS`. Cursor provenance and candidate authority remain intact.

## Public Surface

- Viewer: `world-viewer/ecosystem-v1/`
- API index: `api/kaios/ecosystem/v1/index.json`
- state, habitats, populations, food web, resources, events and status projections

All public API files are static, read-only and contain explicit simulation and
authority boundaries.

## QA Evidence

Runtime tests cover population creation and caps, reproduction gates,
non-biological no-reproduction, carrying capacity, pollution, oxygen, death,
decomposition, nutrient return, water transfer, downhill river state,
deterministic replay, serialization, resume, reset, schema-invalid import rollback,
shared-pool death accounting, drought-water reconciliation and authority boundaries.

Iterative independent review identified import, replay, resource-conservation
and browser-resume edge cases. Every P1/P2 finding was repaired and converted to
a regression test; the final Runtime suite contains 32 passing cases.

Browser QA passed at `360x800`, `390x844`, `768x1024` and `1440x900` with no
horizontal overflow and zero console errors. Controls advanced the simulation
from Tick 0 to Tick 1 with integrity remaining `PASS`.

## Boundaries

`SIMULATION_ONLY`, `NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`,
`NO_REAL_BIOENGINEERING`, `NO_PRODUCTION_AUTHORITY`,
`NO_UNCONTROLLED_POPULATION`, `NO_AUTOMATIC_NEW_SPECIES`.
