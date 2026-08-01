# Cursor Foundational Life Package Report

Task ID: `KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001`
Worker: `cursor-01`
Branch: `cursor-handoff/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001`
Final package state: `CANDIDATE_LIFE_PACKAGES`
Review state: `PENDING_CODEX_REVIEW`
Authority state: `CANDIDATE_ONLY`

## Source Review

Read-only governance and source files reviewed:

- `AGENTS.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-AI-Company/reports/task-envelopes/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001_task_envelope.json`
- `KGEN-AI-Company/reports/claims/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001_claim.json`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KAIOS_CANONICAL_LIFE_SOURCE_AUDIT.md`
- `KAIOS_CANONICAL_LIFE_SPEC_V1.md`
- `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json`
- `KAIOS_CANONICAL_LIFE_TAXONOMY_V1.json`
- `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json`
- `KAIOS_CANONICAL_LIFE_PHYSICS_BINDING_V1.md`
- `KAIOS_CANONICAL_LIFE_ECONOMY_BINDING_V1.md`
- `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md`
- `KAIOS_CANONICAL_LIFE_PACKAGE_TEMPLATE_V1/`

Dispatch validation:

- `cursor-01` is `ACTIVE`, `T2`, `FOUNDATIONAL_LIFE_CREATOR`, `worker_code_limited`.
- `current_task` matches `KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001`.
- Worker status is `CLAIMED`.
- Authorized branch is `cursor-handoff/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001`.

SHA record:

- Original expected PR67 precondition main: `29c5d51769f35ff7cd4af14e97f63958e6e201a0`
- Envelope source/base snapshot: `a29a0f5228022bbbf054f9ae9d486264cc957998`
- Current origin/main dispatch base: `74009c7906ef671c1fe250199b901c0d0045c6dc`

## Candidate Packages

Each package contains exactly these 16 files: `README.md`, `life.manifest.json`, `taxonomy.json`, `physics.json`, `environment.json`, `growth_or_formation.json`, `health_or_integrity.json`, `reproduction_or_change.json`, `economy.json`, `rights.json`, `runtime.json`, `viewer.json`, `api.json`, `provenance.json`, `integrity.json`, `event_log.json`.

| Path | Life ID | Type / Extension |
|---|---|---|
| `KAIOS/life/candidates/grass/` | `LIFE-KAIOS-FOUNDATIONAL-GRASS-001` | `PLANT_LIFE` / `PLANT_EXTENSION` |
| `KAIOS/life/candidates/tree/` | `LIFE-KAIOS-FOUNDATIONAL-TREE-001` | `PLANT_LIFE` / `PLANT_EXTENSION` |
| `KAIOS/life/candidates/fish/` | `LIFE-KAIOS-FOUNDATIONAL-FISH-001` | `MARINE_LIFE` / `MARINE_EXTENSION` |
| `KAIOS/life/candidates/shrimp/` | `LIFE-KAIOS-FOUNDATIONAL-SHRIMP-001` | `MARINE_LIFE` / `MARINE_EXTENSION` |
| `KAIOS/life/candidates/mountain/` | `LIFE-KAIOS-FOUNDATIONAL-MOUNTAIN-001` | `TERRAIN_LIFE` / `TERRAIN_EXTENSION` |
| `KAIOS/life/candidates/soil/` | `LIFE-KAIOS-FOUNDATIONAL-SOIL-001` | `LAND_LIFE` / `LAND_EXTENSION`, `SOIL_EXTENSION` |
| `KAIOS/life/candidates/water/` | `LIFE-KAIOS-FOUNDATIONAL-WATER-001` | `WATER_BODY_LIFE` / `WATER_BODY_EXTENSION` |
| `KAIOS/life/candidates/river/` | `LIFE-KAIOS-FOUNDATIONAL-RIVER-001` | `WATER_BODY_LIFE` / `WATER_BODY_EXTENSION` |

Field coverage:

- Grass covers taxonomy, species program, mass and height ranges, root depth, water and sunlight needs, soil compatibility, growth rate, seed and reproduction, season, temperature range, disease, grazing, erosion control, economy, and event log.
- Tree covers taxonomy, species program, mass and height ranges, root system, water and sunlight needs, soil compatibility, growth stages, seed, flower, optional fruit, wood output, habitat role, aging, disease, death, economy, and event log.
- Fish covers taxonomy, body plan, mass and length ranges, water type, temperature, oxygen, salinity, diet, movement, energy, health, growth, sex, reproduction, offspring, lifespan, predator-prey role, aquaculture role, harvest output, economy, and event log.
- Shrimp covers taxonomy, body plan, mass and length ranges, water type, temperature, oxygen, salinity, diet, molting, growth, health, reproduction, larval stages, lifespan, aquaculture role, water quality sensitivity, harvest output, economy, and event log.
- Mountain covers formation, geology, mass, volume, density, elevation, slope, stability, erosion, weathering, resource deposits, water source role, transport barrier, hazards, collapse conditions, economy, civilization role, and event log.
- Soil covers composition, mass, volume, density, moisture, fertility, pH, organic matter, compaction, erosion, contamination, crop support, foundation support, water retention, economy, and event log.
- Water covers composition, mass, volume, temperature, state, energy, purity, pollution, availability, consumption, evaporation, freezing, boiling, economy, life support role, and event log.
- River covers source, path, length, width, depth, downhill flow, volume, temperature, oxygen, sediment, pollution, inflow, outflow, flood, drought, bridge interaction, transport blocking, irrigation role, economy, and event log.

## Integrity Procedure

Each package documents and stores one reproducible SHA-256 procedure:

1. Sort the declared component file names.
2. Exclude `integrity.json`.
3. For JSON components, serialize canonical UTF-8 bytes with sorted keys and no insignificant whitespace.
4. For `life.manifest.json`, set only `integrity.checksum` to 64 zeroes before canonical serialization.
5. Hash `filename + newline + byte_length + newline + bytes + newline` for each sorted component.
6. Store the resulting checksum in both `life.manifest.json` and `integrity.json`.

This avoids self-reference and is tested by recomputation.

## Constraints Preserved

- Runtime bindings are non-executable local validation only.
- `simulation_only` is true.
- Production authority is false.
- Wallet is `NONE`.
- Real KGEN is `NO_REAL_KGEN`.
- On-chain transfer is `NO_ONCHAIN_TRANSFER`.
- K11520 is `SIMULATED_K11520_ONLY`.
- No settlement, deployment, canonical promotion, legal personhood, sentience claim, or real biological engineering claim is made.
- River flow is downhill from source elevation 520 m to mouth elevation 400 m and formation requires sustained source, channel path, and elapsed time.
- Mountain, soil, and water formation/change records include elapsed-time and no-instant-formation constraints where applicable.

## Tests

Focused test added:

- `KAIOS/life/tests/validate_foundational_life_candidates.py`

Validation coverage:

- Canonical schema shape and required field validation from `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json`.
- Exact required file sets for all eight packages.
- Taxonomy completeness and biological 19-layer compatibility where applicable.
- Correct life type and approved extension mapping.
- Mass-volume-density coherence.
- Physics/environment, growth/formation causality, and energy/resource constraints.
- Economy and rights boundaries.
- Event log and provenance.
- Reproducible integrity checksum.
- River downhill and no-instant-formation causality.
- No protected path changes, wallet authority, real KGEN, on-chain transfer, settlement, or production authority.
- Valid JSON, UTF-8 no BOM, corruption scan.

Commands run:

- `python KAIOS/life/tests/validate_foundational_life_candidates.py` -> `FOUNDATIONAL_LIFE_CANDIDATE_VALIDATION_PASS`
- `git diff --check` -> pass, no output
- `ReadLints` on `KAIOS/life/tests/validate_foundational_life_candidates.py` -> no linter errors found

## Changed Files

Changed paths are limited to:

- `KAIOS/life/candidates/grass/**`
- `KAIOS/life/candidates/tree/**`
- `KAIOS/life/candidates/fish/**`
- `KAIOS/life/candidates/shrimp/**`
- `KAIOS/life/candidates/mountain/**`
- `KAIOS/life/candidates/soil/**`
- `KAIOS/life/candidates/water/**`
- `KAIOS/life/candidates/river/**`
- `KAIOS/life/tests/validate_foundational_life_candidates.py`
- `CURSOR_FOUNDATIONAL_LIFE_PACKAGE_REPORT.md`

Protected changes: none intended and none required.

Exact final status: `CANDIDATE_LIFE_PACKAGES / PENDING_CODEX_REVIEW / CANDIDATE_ONLY`.
