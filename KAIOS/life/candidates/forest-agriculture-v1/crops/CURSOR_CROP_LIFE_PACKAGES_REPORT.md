# Cursor Crop Life Package Candidate Report

Task ID: `KAIOS-CURSOR-CROP-LIFE-PACKAGES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

Canonical handoff branch:
`cursor-handoff/KAIOS-CURSOR-CROP-LIFE-PACKAGES-001`

Dispatch envelope base commit:
`176e8b96e40894a542da5823c436e9d49f663f0e`

Source and branch base commit:
`05f471228af592e5c43071bc998e063101d82ef5`

Provenance hash basis:
`SHA256_OF_GIT_BLOB_CONTENT_AT_SOURCE_BASE_COMMIT`

## Scope

These six artifacts provide bounded class-level candidates for the existing
Agriculture Alpha crop IDs `RICE`, `VEGETABLE` and `FRUIT`. They define
research envelopes, proposed stage subdivisions, paired resource flows, an
exact deterministic fixture and objective candidate tests. They do not create
a crop Runtime, species, inventory, ledger, Rights decision or Economy rule.

Every numerical envelope is a simulation approximation unless it is explicitly
marked `REPOSITORY_DERIVED` as an exact projection of an existing owner value.
Nothing in this package is agronomic, biological, food-safety or production
guidance.

## Existing Owners Reused

| Truth | Existing owner | Candidate behavior |
|---|---|---|
| Crop IDs, plot growth, harvest and basic warehouse | `AGRICULTURE_ALPHA` | Reference and test only |
| Habitat, water, soil, nutrients and decomposition | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | Reference paired pool deltas only |
| Food inventory and ledger | `CIVILIZATION_ECONOMY_ALPHA` | Reference owner IDs; no balances copied |
| Worker location, time and capacity | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Reference validated shifts and time logs |
| Shared plant contract | `KAIOS_CANONICAL_LIFE_SCHEMA_V1` plus `PLANT_EXTENSION` | Compatibility boundary; no promotion |

Fertilizer batches, compost batches, harvest lots and warehouse quantities stay
with their existing authoritative owners. Candidate files contain no mutable
owner state.

## Taxonomy Finding

- `RICE_ALPHA` is defined in the existing taxonomy registry and is referenced
  exactly as written there.
- `FRUIT_ALPHA` is defined in the existing taxonomy registry, but remains a
  synthetic aggregate. It does not replace the queued fruit-tree package task.
- `VEGETABLE_ALPHA` is referenced by `synthetic-world.json` but is not defined
  in `taxonomy-standard.js`. The candidate therefore sets its species reference
  and taxonomy to `null`, records `SOURCE_UNDERSPECIFIED`, and requires future
  species resolution. No taxonomy was invented.

## Candidate Findings

1. A crop stage requires a seed or propagation source, compatible soil, water,
   nutrients, sunlight, compatible temperature, labor and elapsed time.
2. Candidate stage defaults preserve the current synthetic Agriculture Alpha
   cycles: RICE `24` hours, VEGETABLE `12` hours and FRUIT `48` hours.
3. Those hours are owner-regression values, not real biological growth claims.
4. Harvest requires `HARVEST_READY`, labor, tools, containers, time and owner
   warehouse capacity; it creates separate product and residue custody.
5. Water, structural mass, nutrients and energy use distinct pools. Nutrients
   are never counted as structural biomass.
6. Irrigation, uptake, transpiration, harvest water, drainage and warehouse
   custody use paired debits and credits.
7. Residue moves into a referenced compost feedstock before bounded nutrient
   return. Nothing disappears merely because a stage completes.
8. Fifty-two numeric parameter contracts carry the required name, unit,
   minimum, default, maximum, rationale, source type, confidence, risk and
   validation flag.
9. Aggregate `VEGETABLE` and `FRUIT` thresholds remain low-confidence proposals
   until later species packages are reviewed.

## Deterministic Numerical Oracle

`CROP-RICE-NUMERICAL-ORACLE-001` is an objective test fixture, not a Runtime
parameter set. It contains complete initial pools, twelve ordered integer
events, exact final pools and total invariants.

Transition contract:

- `KAIOS_FIXED_POINT_DECIMAL_V1`
- scale: `1,000,000` micro-units per base unit
- ingestion rounding: `ROUND_HALF_TO_EVEN`
- transition arithmetic: signed integer addition only
- direct binary floating-point state addition: forbidden

Initial and final conserved totals:

| Domain | Exact total |
|---|---:|
| Water | `1,500,000,000 micro_liter` |
| Structural mass | `1,210,000,000 micro_kilogram` |
| Nutrient proxy | `101,000,000 micro_kilogram_nutrient_proxy` |
| Energy proxy | `100,000,000,000 micro_joule_proxy` |
| Labor capacity | `600,000,000 micro_worker_minute` |

The canonical payload is the recursively key-sorted
`numerical_oracle.expected_final_state`, compact JSON encoded as UTF-8 without
BOM or trailing newline. Its reproducible SHA-256 is:

`62ad9997a125620630e52778870a9b3a242c6333998552b3767607efc42cbd24`

The fixture ends after `2,880` simulated minutes with product custody in the
owner warehouse projection, named crop residue, compost feedstock and a
recorded nutrient-return event. It recognizes no revenue and changes no ledger.

## Artifact Map

- `crop-catalog-candidates.json`: exact owner crop IDs and constants, taxonomy
  references, unresolved taxonomy evidence and causal gates.
- `crop-environment-thresholds.json`: bounded candidate soil, water, light,
  temperature and fertility envelopes.
- `crop-growth-stage-proposals.json`: non-skippable proposed stage subdivisions
  that preserve existing synthetic cycle totals.
- `crop-resource-flow-proposal.json`: paired pool contracts and exact fixed-point
  lifecycle oracle.
- `crop-test-scenarios.json`: objective positive, negative, conservation,
  provenance and boundary scenarios.
- `CURSOR_CROP_LIFE_PACKAGES_REPORT.md`: scope, evidence and handoff record.

## Immutable Provenance

Each JSON artifact repeats the complete registry below. Hashes were computed
from exact Git blob bytes at source commit
`05f471228af592e5c43071bc998e063101d82ef5`, not from platform-transformed
checkout bytes.

| Source path | Git object | SHA-256 |
|---|---|---|
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |
| `KGEN-KAIOS/world-viewer/biology/taxonomy-standard.js` | `f4cc78d30bccf375bb3e55f5e3cb2df63d0a4683` | `2c7eb6d439ac320176751c4985d1f510b68a5656ef4b4ef041dc46b4f55dcc28` |
| `KGEN-KAIOS/world-viewer/data/synthetic-world.json` | `76ddff32f74c2b41ca7d9d9309b7b39a2a2618c8` | `4be4c1b83420bb24604742fb722a8aedba8b3d2c163f7f18ccd871628ee7f34f` |
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |

## Validation Evidence

- required output count: `6 / 6`
- JSON parse and duplicate-key scan: `PASS`
- numeric parameter contracts: `52 / 52 PASS`
- fixed-point oracle event balance: `12 / 12 PASS`
- final-state replay and SHA-256: `PASS`
- source Git-blob hashes: `9 / 9 PASS`
- UTF-8 without BOM: `PASS`
- secret and protected-scope scan: `PASS`
- `git diff --check`: `PASS`

## Boundaries

No Runtime, CURRENT, Canonical Schema, Rights authority, Economy authority,
Wallet, KGEN, deployment or merge behavior is created or changed. No candidate
is self-approved, Canonical, production-authorized, a real crop specification,
or a food-safety claim.

## Handoff

Codex must independently review the six candidate artifacts. Until that review,
the only valid completion state is:

`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
