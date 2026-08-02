# Cursor Soil Type Candidate Data Report

## Dispatch Record

| Field | Value |
| --- | --- |
| Task | `KAIOS-CURSOR-SOIL-TYPES-001` |
| Worker | `cursor-01` |
| Branch | `cursor-handoff/KAIOS-CURSOR-SOIL-TYPES-001` |
| Work-order base | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` |
| Dispatch commit | `e06d76906d3364d4a07607b9a4a7a92e8a016b29` |
| Status | `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW` |
| Mode | `SIMULATION_ONLY_COMPATIBILITY_DATA` |
| Canonical promotion | `false` |
| Runtime change | None |

This bounded delivery supplies compatibility research data only. It does not
create a soil Runtime, Canonical Life record, legal soil classification,
agronomic recommendation, environmental approval, foundation certification,
Rights authority, Economy authority, Wallet behavior, KGEN behavior,
deployment or merge.

## Required Outputs

| File | Contents |
| --- | --- |
| `CURSOR_SOIL_TYPES_REPORT.md` | Scope, evidence, decisions and validation record |
| `soil-type-catalog-candidates.json` | Seven candidate soil analog identities and owner boundaries |
| `soil-physical-property-proposals.json` | Seven mineral-texture and physical-behavior envelopes |
| `soil-water-nutrient-thresholds.json` | Owner-native gates plus seven water/nutrient screening envelopes |
| `soil-compatibility-matrix.json` | Separate crop-support and foundation-support screening relationships |
| `soil-test-scenarios.json` | Fixed-point causal oracle and deterministic acceptance scenarios |

No other file is part of this delivery.

## Candidate Design

Seven deliberately broad simulation analogs are proposed: sandy, sandy loam,
loam, silt loam, clay loam, clay and organic-rich mineral soil. They are not
legal, laboratory or field classifications. Each type links to a physical
profile, a water/nutrient profile, a crop-support screen and a separately
owned foundation-support screen.

The data keeps these state domains distinct:

- texture and mineral composition;
- moisture and water custody;
- fertility and nutrient custody;
- organic-matter custody;
- compaction and integrity response;
- erosion and sediment custody;
- contamination and removal custody;
- crop-support compatibility;
- foundation-support compatibility.

Soil type never supplies current moisture, fertility, organic matter,
compaction, erosion or contamination state by itself. Fertility, soil mass,
organic matter, nutrients and contaminants require a recorded source and a
paired recipient or custody pool.

## Parameters And Units

The five JSON datasets contain 126 numeric parameter objects. Every object has
`parameter_name`, `unit`, `minimum`, `default`, `maximum`, `rationale`,
`source_type`, `confidence`, `risk` and `validation_required`. Source labels
are restricted to the six labels authorized by the work order.

| Dataset | Numeric parameter objects |
| --- | ---: |
| Physical property proposals | 49 |
| Water and nutrient thresholds | 61 |
| Deterministic fixture parameters | 16 |
| Catalog and compatibility labels | 0 |
| Total | 126 |

Owner-native units remain explicit. Foundational Life scores stay on their
native 0-to-100 scale. The Ecology fertility threshold remains a native
0-to-1 fraction and is not silently equated to a Foundational Life score.
Mineral texture uses percent of dry mineral mass, with the reversible
conversion `fraction = percent / 100`. Hydraulic conductivity in millimeters
per hour is not converted to Ecology liters without area and duration.
Density remains kilograms per cubic meter because no owner adapter is
declared. Fixed-point oracle fields state their units in their suffixes and use
exactly 1,000,000 micro-units per owner unit.

## Compatibility Boundaries

Crop-support labels reference the existing aggregate rice, vegetable,
fruit-tree and forest-habitat candidates. They remain owner-gated by current
water, fertility, contamination, nutrient, species and site evidence.

Foundation-support labels are independent from crop support. Every row requires
qualified site investigation and the Causal Construction survey, design and
inspection flow. The organic-rich mineral candidate provides no affirmative
foundation-support basis. No compatibility label authorizes construction,
occupancy, planting, harvest, water use, land use, remediation or transfer.

## Deterministic Oracle

`SOIL-CAUSAL-FIXED-POINT-ORACLE-001` replays nine ordered integer events:
infiltration, drought water transfer, erosion, contaminant release,
contaminant removal, nutrient removal, nutrient return, construction loading
and source-bound restoration.

Five material domains conserve exact totals across replay: water, soil mass,
organic matter, nutrients and contaminants. Compaction, integrity and the
settlement proxy are explicitly non-conserved response metrics, but every
change has a named loading or restoration cause. No material pool may become
negative. The canonical recursively key-sorted final-state SHA-256 is:

`0f5458a11290775ed3de92b462bdb900527c43c3ce27b7f55e1de24dc2dcce1c`

The test dataset defines 15 scenarios covering format, parameter envelopes,
property separation, each required causal case, replay determinism,
compatibility separation, Rights boundaries, provenance, encoding and Git
scope.

## Immutable Evidence Register

SHA-256 values below are computed from exact Git blob bytes, not decoded or
newline-normalized text. Data evidence uses the declared source base. The
worker gate and dispatch use the commits at which those records are active.

| Source path | Commit | Git object | SHA-256 |
| --- | --- | --- | --- |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `0f66a62de1018e35ca93198dc890fdddf70ab213` | `1ef1f7f2f17cc55fa8afbca429ccdfb9e0ce2a1ac55108f194b1810c26331dbc` |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `f9748c99501ec1c1ea6ba5c39833909684c0ffbe` | `6d71cd7946f0b4057a9b5289923d3c7b424e409140feb7404f5b433a309ab00b` |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `0f97fc7e723fc97cd8366a10f0c9eb7892df4605` | `bfde25dfb2737e6f698850aa705ea221c64bb0f228ff8e3a7f2740f0ae123451` |
| `AGENTS.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `06ad797cc0d87f9a468ccbd11ccf03f528029a7a` | `c16c1ba1cfff166e68d2ec1a399afb9f9fa877631b574ebe3fdf03c5c514295b` |
| `KGEN-KAIOS/worker_registry.json` | `a38ad99338025c3ac0f4f8553ff6479340286ea0` | `b53b95435d7f7715e7ca5957b0b516416fdc754c` | `2649f9f5f549ae7186319a01add60cd1b29c2d973f3f88050546ee316bc948aa` |
| `KAIOS/life/candidates/forest-agriculture-v1/CURSOR_SOIL_TYPES_WORK_ORDER.md` | `e06d76906d3364d4a07607b9a4a7a92e8a016b29` | `97960f92293067d177a8a5fefa1cff2e422a52a2` | `fc8d820a5952a03bfe8adb2e24f5019929c6840799c799c555383c2c559c2bd7` |
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |
| `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `783ea5b17d82bf6579e4a9763bcbc3b18fb06ac2` | `bec5f35a1906dbd9eb72764e935f4ad282a81398587b66de789130ae4a0428f4` |
| `KAIOS/life/candidates/soil/life.manifest.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `c3b86866e9a3f35b784f33e168cc80c8cb686fae` | `afc569084c467e92ed967559e0a99ce8c1877dea1a43c3f0c7efc8183b61aeb9` |
| `KAIOS/life/runtime/foundational-life-runtime.js` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `9187c14774b34c25e9ae23cf21749fbb5dbb891d` | `4d72be28bbad06ff65d1dddb44043e6f3e2086a095a8bf105e2f08cbed648779` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KAIOS_CONSTRUCTION_CAUSALITY_SPEC.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `52b30a3e46c81f7ed9f19edd0b90932d1a9223dd` | `6f34c4e145e9e56edcc8ed22d37f7c33d36d9881215c5fc00bc565e591c160b6` |
| `KAIOS_CONSTRUCTION_SCHEMA.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `fe1323d5c131e5909086c4b16785a2c1c3bdeccb` | `e0665d76cc90ba881a6414f34b3a201be58dae554379685f15a9ff9fb7b92aec` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-catalog-candidates.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `1d4a445a1548ad61ee96810411135e7d88d9e30a` | `f824773458c31a4725eced0f83102a8eefefdcabf27dd71b4e59806684244a57` |
| `KAIOS/life/candidates/forest-agriculture-v1/fruit-trees/fruit-tree-catalog-candidates.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `2c11bdd2985c8e8c56fa6d91dbb5f50d00888136` | `fcbaa9bc1ad6f4823aca7c25640daeb2159fb319ea781b770d92d457b9b78153` |
| `KAIOS/life/candidates/forest-agriculture-v1/vegetables/vegetable-catalog-candidates.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `5f33d11528d7ea14eb26417224a85cece1392144` | `77cc5dd2e4b6264d5fe8d015881858a2c76f5a522d567a185061b919bbad8cd6` |
| `KAIOS/life/candidates/forest-agriculture-v1/forest/forest-composition-candidates.json` | `614b4e02edb8f705848ad7cb49132ae37e8f5b7e` | `e4e63adb992337dc333c4de78152903234d8a46d` | `007323cb9cad66726b0b1cfe86f05eeda01dbce5d783832e730828299f287e8d` |

## Validation Record

| Validation | Count or result |
| --- | --- |
| Required output files | 6 |
| Strict JSON parses | 5/5 pass |
| Duplicate-key checks | 5/5 pass |
| Candidate soil types | 7 |
| Physical profiles | 7 |
| Water/nutrient profiles | 7 |
| Compatibility rows | 7 |
| Complete numeric parameter objects | 126/126 pass |
| Default mineral texture sums | 7/7 equal 100 percent |
| Deterministic ordered events | 9/9 replayed |
| Deterministic scenario declarations | 15 |
| Conserved material domains | 5/5 pass |
| Repeated replay equality | 2/2 pass |
| Immutable evidence records | 20/20 Git object and SHA-256 checks pass |
| UTF-8 decode | 6/6 pass |
| BOM absence | 6/6 pass |
| NUL absence | 6/6 pass |
| Secret-pattern findings | 0 |
| Out-of-scope changed paths | 0 |
| Protected-path changes | 0 |
| `git diff --check` | Pass |

Validation is deterministic and read-only. It checks strict JSON with duplicate
key rejection, parameter completeness and ranges, source-label allowlisting,
cross-file soil/profile identifiers, texture totals, event replay, non-negative
material pools, conservation totals, final-state hash, immutable source blobs,
encoding, exact file scope, protected paths, secret patterns and whitespace.

## Handoff Boundary

All outputs remain `CANDIDATE_ONLY`, simulation-only and pending Codex review.
Promotion would require an explicit owner-approved schema adapter, source and
unit validation, crop-specific and site-specific research, qualified
environmental and geotechnical workflows where applicable, Rights review and a
separate authorized Canonical change. This task performs none of those steps.
