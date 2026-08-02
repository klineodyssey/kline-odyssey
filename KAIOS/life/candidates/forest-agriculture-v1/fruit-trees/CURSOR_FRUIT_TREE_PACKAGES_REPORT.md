# Cursor Fruit Tree Package Candidate Report

Task ID: `KAIOS-CURSOR-FRUIT-TREE-PACKAGES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

Canonical handoff branch:
`cursor-handoff/KAIOS-CURSOR-FRUIT-TREE-PACKAGES-001`

Work-order declared base commit:
`9329560df73a6668f74a5eb05910d951fa079a38`

Human-authorized current origin/main source and branch base commit:
`6b8654995cf04a5227b7980d74a113ffb83c3adc`

Provenance hash basis:
`SHA256_OF_GIT_BLOB_CONTENT_AT_SOURCE_BASE_COMMIT`

## Scope

These six artifacts provide bounded aggregate fruit-tree research candidates.
They reuse `TREE_ALPHA`, `FRUIT_ALPHA`, Life Runtime V1, Agriculture Alpha,
Ecology V1, Economy Alpha, Physical Labor and Canonical Life owners. They do
not create a fruit-tree species, Runtime, Canonical record, inventory, ledger,
Rights decision, Economy rule or deployment behavior.

Every numerical envelope is a simulation or compatibility value. Nothing in
this package is agronomic, biological, food-safety or production guidance.

## Taxonomy Finding

- `TREE_ALPHA` and `FRUIT_ALPHA` are separate repository owner records.
- Both owner-native records preserve all ranks plus `subspecies` and
  `category` exactly as defined in `taxonomy-standard.js`.
- Each has a separate Canonical Life crosswalk with `life_instance: null` and
  `life_instance_status: UNASSIGNED`.
- Owner `subspecies` never maps to an individual Canonical Life instance.
- `FRUIT_ALPHA` is a synthetic aggregate. The candidate records no validated
  real species and invents no species name or identifier.

## Owner And Unit Boundaries

| Truth | Existing owner | Candidate behavior |
|---|---|---|
| Foundational tree state and generic plant gates | `KAIOS_LIFE_RUNTIME_V1.tree` / `TREE_ALPHA` | Read-only reference and proposal gates |
| Aggregate fruit-tree identity | `FRUIT_ALPHA` | Preserve synthetic owner record; no species inference |
| Established-tree fruit cycle and basic warehouse | `AGRICULTURE_ALPHA` | Preserve 48-hour synthetic cycle and native units |
| Water, soil, nutrients, biomass and decomposition | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | Paired candidate pool deltas only |
| Inventory and ledger | `CIVILIZATION_ECONOMY_ALPHA` | Owner IDs only; no balances or entries created |
| Worker time and location | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Owner-native `worker_minute` capacity |
| Shared plant contract | Canonical Life V1 plus `PLANT_EXTENSION` | Compatibility crosswalk only; no promotion |

Agriculture Alpha's synthetic water and energy units remain isolated because no
reversible conversion to liters, Ecology energy proxy or physical energy is
authorized. The numerical oracle uses Ecology/Physical Labor native base units
and explicit reversible micro-unit conversions.

## Candidate Findings

1. Tree establishment requires a propagation source, compatible soil, water,
   nutrients, sunlight, compatible temperature, labor and elapsed time.
2. Fruit development requires an already-established tree owner reference.
3. Agriculture Alpha's `48` hours is treated only as an established-tree
   synthetic fruit cycle, never as tree creation or maturation time.
4. Establishment stage durations remain low-confidence class-level proposals;
   species-specific values are `SOURCE_UNDERSPECIFIED`.
5. Harvest requires readiness, labor, tools, containers, elapsed time and
   warehouse capacity. Product and residue enter separate named custody pools.
6. Water, structural biomass, nutrients, energy and labor remain distinct.
7. Residue enters compost custody before a recorded nutrient-return event.
8. Thirty numeric parameter objects contain the full required envelope.

## Deterministic Numerical Oracle

`FRUIT-TREE-AGGREGATE-NUMERICAL-ORACLE-001` is an objective fixture, not a
Runtime parameter or biological model. It starts with propagation material and
requires ordered planting, irrigation, uptake, noninstant growth, noninstant
fruiting, harvest, residue custody, composting and nutrient return.

Transition contract:

- scale: `1,000,000` micro-units per owner-native base unit
- ingestion rounding: `ROUND_HALF_TO_EVEN`
- transition arithmetic: signed integer addition only
- direct binary floating-point state addition: forbidden
- event-domain conservation tolerance: exactly zero micro-units

Initial and final conserved totals:

| Domain | Exact total |
|---|---:|
| Water | `2,000,000,000 micro_liter` |
| Structural biomass | `5,000,000,000 micro_kilogram_biomass` |
| Nutrient proxy | `200,000,000 micro_kilogram_nutrient_proxy` |
| Energy proxy | `500,000,000 micro_energy_proxy` |
| Labor capacity | `480,000,000 micro_worker_minute` |

The first four ordered events now advance through the minimum candidate
establishment duration of `397` days and issue the explicit owner-simulation
reference `TREE-ESTABLISHED-REFERENCE-ORACLE-001` before fruiting. All eight
events balance every touched domain exactly, no pool becomes negative, and
replay equals the declared final state. The canonical payload is
the recursively key-sorted `numerical_oracle.expected_final_state`, compact
JSON encoded as UTF-8 without BOM or trailing newline. Its reproducible
SHA-256 is:

`85e0560512382f38e74972cdb96974afd1ff9892896ff3cc1836acaec365d16f`

## Artifact Map

- `fruit-tree-catalog-candidates.json`: owner taxonomy, separate Canonical
  crosswalks, aggregate package identity, owner values and causal gates.
- `fruit-tree-environment-thresholds.json`: generic owner-native environmental
  envelopes and explicit unit boundaries.
- `fruit-tree-growth-stage-proposals.json`: non-skippable establishment and
  established-tree fruit-cycle stage proposals.
- `fruit-tree-resource-flow-proposal.json`: paired flow rules, reversible unit
  contracts and the exact fixed-point oracle.
- `fruit-tree-test-scenarios.json`: objective taxonomy, causal, conservation,
  provenance, encoding, secret and protected-boundary scenarios.
- `CURSOR_FRUIT_TREE_PACKAGES_REPORT.md`: scope, evidence and handoff record.

## Immutable Git-Blob Provenance

Hashes use exact Git blob bytes at source commit
`6b8654995cf04a5227b7980d74a113ffb83c3adc`, not transformed checkout text.

| Source path | Git object | SHA-256 |
|---|---|---|
| `KAIOS/life/candidates/forest-agriculture-v1/CURSOR_FRUIT_TREE_PACKAGES_WORK_ORDER.md` | `10afc4ec879812717a46607643d3d00764c64ae3` | `8fb9a8cdc39ea7e6cf34500e911661a5e8e8088b2afc0fceb5f1d7fa2e3017fe` |
| `KGEN-KAIOS/world-viewer/biology/taxonomy-standard.js` | `f4cc78d30bccf375bb3e55f5e3cb2df63d0a4683` | `2c7eb6d439ac320176751c4985d1f510b68a5656ef4b4ef041dc46b4f55dcc28` |
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |
| `KGEN-KAIOS/world-viewer/data/synthetic-world.json` | `76ddff32f74c2b41ca7d9d9309b7b39a2a2618c8` | `4be4c1b83420bb24604742fb722a8aedba8b3d2c163f7f18ccd871628ee7f34f` |
| `KAIOS/life/runtime/foundational-life-runtime.js` | `9187c14774b34c25e9ae23cf21749fbb5dbb891d` | `4d72be28bbad06ff65d1dddb44043e6f3e2086a095a8bf105e2f08cbed648779` |
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |

## Validation Evidence

- required output count: `6 / 6 PASS`
- strict JSON parse and duplicate-key rejection: `5 / 5 PASS`
- numeric parameter contracts: `30 / 30 PASS`
- embedded source Git-object and blob-byte provenance: `22 / 22 PASS`
- fixed-point event conservation: `8 / 8 PASS`
- establishment duration/reference prerequisite: `PASS`
- exact final-state replay and reproducible SHA-256: `PASS`
- strict UTF-8 without BOM or NUL: `6 / 6 PASS`
- secret scan: `PASS`
- protected-path and staged-scope scan: `PASS`
- `git diff --cached --check`: `PASS`

## Codex Review Repair

Independent review found that the first oracle revision conserved resources but
did not issue its required established-tree reference before fruiting. Codex
repaired the candidate fixture by making the four establishment stages consume
at least `397` elapsed days, recording the owner-simulation reference as an
explicit state change, gating fruiting on that reference and regenerating the
deterministic final-state hash. This repair does not promote the candidate or
change any Runtime owner.

## Boundaries

No Runtime, CURRENT, Canonical Schema, Rights authority, Economy authority,
Wallet, KGEN, deployment, registry, index or merge behavior is created or
changed. No candidate is self-approved, Canonical, production-authorized or a
validated real species package.

## Handoff

Codex must independently review these six artifacts. Until that review, the
only valid completion state is:

`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
