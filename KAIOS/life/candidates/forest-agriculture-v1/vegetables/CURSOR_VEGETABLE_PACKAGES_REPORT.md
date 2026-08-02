# Cursor Vegetable Package Candidate Report

Task ID: `KAIOS-CURSOR-VEGETABLE-PACKAGES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

Canonical handoff branch:
`cursor-handoff/KAIOS-CURSOR-VEGETABLE-PACKAGES-001`

Work-order declared base commit:
`e218dde35683285795714e821389806427948efe`

Human-authorized current origin/main source and branch base commit:
`9b5246918b4e912557c9a6cd402ac9ab9fb6f83f`

Provenance hash basis:
`SHA256_OF_GIT_BLOB_CONTENT_AT_SOURCE_BASE_COMMIT`

## Scope

These six artifacts provide bounded aggregate vegetable research candidates.
They reuse the existing Agriculture Alpha `VEGETABLE` plot resource,
`vegetable-farm-001` facility profile, Ecology resource pools, Economy
inventory boundary, Physical Labor timeline and Canonical Life compatibility
contract. They do not create a vegetable species, Runtime, Canonical Life
record, inventory owner, ledger, Rights decision, Economy rule or deployment
behavior.

Every numerical envelope is a simulation or compatibility value. Nothing in
this package is agronomic, biological, food-safety or production guidance.

## Taxonomy Finding

- `VEGETABLE` is an Agriculture Alpha aggregate crop and warehouse resource.
- `VEGETABLE_FARM` is an aggregate facility type, not a species.
- `VEGETABLE_ALPHA` appears only as a `food_sources` token in
  `synthetic-world.json` at the source base commit.
- No `VEGETABLE_ALPHA` record exists in `taxonomy-standard.js`.
- The candidate therefore keeps species, taxonomy, cultivar, Canonical Life ID
  and Canonical Life instance `null` and marks them `SOURCE_UNDERSPECIFIED`.
- Facility `species_os_id` and `life_os_profile_id` labels do not grant
  taxonomy or Canonical Life authority.

## Owner And Unit Boundaries

| Truth | Existing owner | Candidate behavior |
|---|---|---|
| Plot planting, 12-hour growth clock, harvest and basic warehouse | `AGRICULTURE_ALPHA.CROP_CATALOG.VEGETABLE` | Exact read-only owner references and proposal gates |
| 16-hour facility cycle and aggregate output | `AGRICULTURE_ALPHA.facilities.vegetable-farm-001` | Separate facility profile; never treated as species growth |
| Water, soil, nutrients, biomass and decomposition | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | Paired candidate pool deltas only |
| Inventory and ledger | `CIVILIZATION_ECONOMY_ALPHA` | Owner IDs and custody boundary only; no balances or entries |
| Worker time and location | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Owner-native `worker_minute` capacity |
| Shared plant contract | Canonical Life V1 plus `PLANT_EXTENSION` | Compatibility reference only; no species, instance or promotion |

The plot profile and facility profile stay separate. The 12-hour plot clock is
not averaged with the 16-hour facility clock, and the 6-unit plot yield is not
substituted for the 8-unit facility output. Agriculture water, energy,
fertilizer, capacity and warehouse units have no authorized physical
conversion. Oracle physical pools use Ecology and Physical Labor base units
with explicit reversible micro-unit conversions.

## Candidate Findings

1. Planting requires a propagation input, compatible soil, water, nutrients,
   sunlight, compatible temperature, labor, tools and elapsed time.
2. The three proposed growth-clock stages total exactly the owner-native 12
   hours; planting, harvest, warehouse intake and residue processing are
   additional nonzero time outside that clock.
3. Species temperature, soil, pH, light, water-quality, nutrient, cultivar,
   season and food-safety values remain `SOURCE_UNDERSPECIFIED`.
4. Harvest requires readiness, labor, tools, containers, elapsed time and
   reserved warehouse capacity.
5. Harvest creates a named harvest batch first. A later nonzero-time warehouse
   intake event creates owner inventory custody.
6. Marketable product, rejected biomass and residue enter separate named
   pools. Rejected material and residue enter compost custody before a
   noninstant decomposition and nutrient-return event.
7. Water, structural biomass, nutrients, energy, labor, propagation input and
   owner inventory remain distinct conserved domains.
8. Thirty-eight numeric parameter objects contain the complete required
   envelope.

## Deterministic Numerical Oracle

`VEGETABLE-PLOT-NUMERICAL-ORACLE-001` is an objective fixture, not a Runtime
parameter, species model or physical conversion for Agriculture Alpha units.
It starts with one owner seed unit and a locked six-unit owner yield projection,
then requires ordered planting, irrigation, noninstant growth, readiness,
harvest-batch custody, warehouse intake, residue custody, composting and
nutrient return.

Transition contract:

- scale: `1,000,000` micro-units per explicitly named base unit
- ingestion rounding: `ROUND_HALF_TO_EVEN`
- transition arithmetic: signed integer addition only
- direct binary floating-point state addition: forbidden
- event-domain conservation tolerance: exactly zero micro-units

Initial and final conserved totals:

| Domain | Exact total |
|---|---:|
| Water | `1,000,000,000 micro_liter` |
| Structural biomass | `1,000,000,000 micro_kilogram_biomass` |
| Nutrient proxy | `200,000,000 micro_kilogram_nutrient_proxy` |
| Energy proxy | `500,000,000 micro_energy_proxy` |
| Labor capacity | `360,000,000 micro_worker_minute` |
| Propagation-input custody | `1,000,000 micro_owner_seed_unit` |
| Owner inventory custody | `6,000,000 micro_vegetable_warehouse_unit` |

Seven ordered events advance `2,340` simulated minutes. Exactly `720` minutes
count toward the 12-hour owner growth clock before harvest. Planting takes 60
minutes before that clock; harvest and grading take 90 minutes; warehouse and
residue intake take a separate 30 minutes; compost processing takes 1,440
minutes. Every touched event domain balances exactly, no pool becomes negative,
and replay equals the declared final state.

The canonical payload is the recursively key-sorted
`numerical_oracle.expected_final_state`, compact JSON encoded as UTF-8 without
BOM or trailing newline. Its reproducible SHA-256 is:

`a61419594453485c63a55bce589555839990e0b9e20fb0e9b130d2b2ba793136`

## Artifact Map

- `vegetable-catalog-candidates.json`: aggregate plot/facility owner records,
  unresolved taxonomy boundary, owner-native constants and causal gates.
- `vegetable-environment-thresholds.json`: generic compatibility envelopes,
  source-underspecified real conditions and explicit unit boundaries.
- `vegetable-growth-stage-proposals.json`: non-skippable 12-hour growth clock,
  separate pre/post stages and Physical Labor proposals.
- `vegetable-resource-flow-proposal.json`: paired flow rules, reversible
  micro-unit contracts and the exact fixed-point oracle.
- `vegetable-test-scenarios.json`: objective identity, unit, causal, custody,
  conservation, provenance, encoding, secret and boundary scenarios.
- `CURSOR_VEGETABLE_PACKAGES_REPORT.md`: scope, evidence and handoff record.

## Immutable Git-Blob Provenance

Hashes use exact Git blob bytes at source commit
`9b5246918b4e912557c9a6cd402ac9ab9fb6f83f`, not transformed checkout text.

| Source path | Git object | SHA-256 |
|---|---|---|
| `KAIOS/life/candidates/forest-agriculture-v1/CURSOR_VEGETABLE_PACKAGES_WORK_ORDER.md` | `c83cae7565fd1dba0282373dd45b4c1750e2f324` | `639f78abdc38f55fd2b8bd9101b1cc07a458b638f01f1220be5b8cf516794c3d` |
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KGEN-KAIOS/world-viewer/data/synthetic-world.json` | `76ddff32f74c2b41ca7d9d9309b7b39a2a2618c8` | `4be4c1b83420bb24604742fb722a8aedba8b3d2c163f7f18ccd871628ee7f34f` |
| `KGEN-KAIOS/world-viewer/biology/taxonomy-standard.js` | `f4cc78d30bccf375bb3e55f5e3cb2df63d0a4683` | `2c7eb6d439ac320176751c4985d1f510b68a5656ef4b4ef041dc46b4f55dcc28` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |

## Validation Evidence

- required output count: `6 / 6 PASS`
- strict JSON parse and duplicate-key rejection: `5 / 5 PASS`
- numeric parameter contracts: `38 / 38 PASS`
- embedded source Git-object and blob-byte provenance: `20 / 20 PASS`
- unique immutable source blobs: `10 / 10 PASS`
- fixed-point event conservation: `7 / 7 PASS`
- exact 12-hour owner growth clock before harvest: `PASS`
- harvest-batch, warehouse, rejected-biomass and residue custody: `PASS`
- exact final-state replay and reproducible SHA-256: `PASS`
- strict UTF-8 without BOM or NUL: `6 / 6 PASS`
- secret scan: `PASS`
- protected-path and diff-scope scan: `PASS`
- `git diff --check`: `PASS`

## Boundaries

No Runtime, CURRENT, Canonical Schema, Rights authority, Economy authority,
Wallet, KGEN, deployment, registry, index or merge behavior is created or
changed. No candidate is self-approved, Canonical, production-authorized, a
validated real species package, an agronomic recommendation or a food-safety
claim.

## Handoff

Codex must independently review these six artifacts. Until that review, the
only valid completion state is:

`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
