# Cursor Compost Models Candidate Report

**Task:** `KAIOS-CURSOR-COMPOST-MODELS-001`
**Worker:** `cursor-01`
**Branch:** `cursor-handoff/KAIOS-CURSOR-COMPOST-MODELS-001`
**Research base:** `38901fddd3a513b5121b8828dce43898a7ed74b6`
**Status:** `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`

## Executive Summary

This package proposes bounded compost-feedstock, process-stage, resource-accounting and failure fixtures for deterministic KAIOS simulation. It contains four abstract feedstock classes, six nonzero-time process stages, one closed normal accounting oracle, eight deterministic normal or failure scenarios, and a machine-checkable test manifest.

The package creates no compost Runtime, living organism, microbial species, fertilizer inventory, soil nutrient truth, product, recipe, price, yield projection, agronomic prescription, safety finding, environmental approval or legal certification. Every proposed owner mutation remains a foreign command or event reference pending independent owner validation.

## Delivered Files

Exactly these six files are delivered under `KAIOS/life/candidates/forest-agriculture-v1/compost-models/`:

1. `CURSOR_COMPOST_MODELS_REPORT.md`
2. `compost-feedstock-catalog-proposals.json`
3. `compost-process-stage-proposals.json`
4. `compost-resource-accounting-proposals.json`
5. `compost-risk-scenarios.json`
6. `compost-test-scenarios.json`

No other path is part of this task output.

## Read And Gate Record

The requested sources were read before target analysis in this order: Boot Sequence V1.4, active Physics Runtime CURRENT, Universe Map V10.2, `AGENTS.md`, compost work order, fertilizer review closeout, Forest and Agriculture V1 specification, then relevant crop, vegetable, forest, soil-type and fertilizer candidates plus the Ecology, Supply Chain and Physical Labor schemas.

The worker gate matched the assignment:

- Worker: `cursor-01`
- Employee and trust state: `ACTIVE`, `T2`
- Registered task: `KAIOS-CURSOR-COMPOST-MODELS-001`
- Registered, expected and actual branch: `cursor-handoff/KAIOS-CURSOR-COMPOST-MODELS-001`
- Worktree: `C:\Desktop\kline-odyssey-compost-models`
- Initial HEAD: `38901fddd3a513b5121b8828dce43898a7ed74b6`
- Initial worktree: clean
- Main push authority: false

The repository work order still names `976f91ac59ecf43a5e28b0afa5df0a9f948d9c76` as its source base. That commit is an ancestor of the explicit task base. The user task envelope explicitly supersedes it with `38901fddd3a513b5121b8828dce43898a7ed74b6`, so every provenance object and SHA-256 in this package is reproduced from the later explicit base. The work-order file itself is also hashed at that later base.

## Existing-Function Check

Before editing, compost, organic-waste and decomposition searches covered `docs`, `KGEN`, `KLINE Odyssey` frontend roots, Temple 12345, KAIOS and KGEN-KAIOS. No competing compost implementation or existing compost-model output directory was found. Existing references are specifications, orchestration concepts, candidate residue flows or Ecology decomposition behavior, so this package remains a proposal layer and does not duplicate a Runtime.

## Ownership Contract

| Truth | Existing owner | Reused IDs or references | Candidate behavior |
|---|---|---|---|
| Crop, plot, harvest and residue source events | `AGRICULTURE_ALPHA` | `RICE`, `VEGETABLE`, `FRUIT` | Reference source events and candidate residue pools only |
| Decomposition, nutrients, biomass, water and environmental custody | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | `HABITAT-SOIL-V1`, `HABITAT-FOREST-V1`, `POP-SOIL-001`, `DECOMPOSITION_POOL`, `DECOMPOSITION_EVENT` | Submit bounded event and paired-delta proposals only |
| Foundational soil identity and state | `KAIOS_FOUNDATIONAL_LIFE_RUNTIME_V1` | `SPECIES-KAIOS-FOUNDATIONAL-SOIL` | Read-only identity reference; no soil mutation |
| Source lots, storage, transport, quality and finished custody | `KAIOS_SUPPLY_CHAIN_SCHEMA` | Owner-native lot and event IDs | Require foreign references; create no inventory truth |
| Inventory and balanced ledger | `CIVILIZATION_ECONOMY_ALPHA` | Existing `FERTILIZER` resource | No lot, balance, price, cost or fertilizer credit |
| Worker timeline and capacity | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Owner-native work-shift IDs | Require location, non-overlap and capacity validation |
| Land, water, operation, transport and disposal capability | Existing Rights authority | Owner-native decision IDs | Consume an `ALLOW` reference; grant nothing |

`COMPOST_BATCH` remains an Ecology-owned specification entity. Because the current Ecology schema exposes `DECOMPOSITION_POOL` and `DECOMPOSITION_EVENT` rather than a dedicated compost entity, this package records that mapping as owner review work and does not amend the schema.

## State Separation

| State | Meaning | Explicit non-equivalence |
|---|---|---|
| Compost feedstock | Incoming owner-referenced material custody | Not an in-process batch or finished output |
| In-process batch | Ecology-owned `COMPOST_BATCH` projection through decomposition pools and events | Not finished, safe, mature or inventory |
| Finished candidate output | Closed candidate material awaiting foreign acceptance | Not fertilizer inventory, product or soil nutrient state |
| Fertilizer inventory | Economy-owned `FERTILIZER` resource and lot truth | Receives zero automatic compost delta |
| Soil nutrient state | Ecology-owned `nutrients_kg` or soil nutrient pools | Changes only through a later owner-approved nutrient-return event |

The fertilizer candidate `AMENDMENT-PROPOSAL-ORGANIC-CARRIER-V1` is only a possible later owner-review target. No automatic mapping is claimed.

## Feedstock Proposals

Four abstract 100 kg wet-mass fixtures provide closed composition tests, not collection amounts or production formulas:

| Proposal | Existing source boundary | Structural proxy | Nutrient proxy | Contained water | Contaminant |
|---|---|---:|---:|---:|---:|
| Crop residue | Agriculture crop and harvest events | 55,000,000 | 5,000,000 | 40,000,000 | 0 |
| Vegetable residue | Agriculture vegetable residue and rejected-biomass events | 35,000,000 | 5,000,000 | 60,000,000 | 0 |
| Forest dead biomass | Ecology forest death or approved residue custody | 68,000,000 | 2,000,000 | 30,000,000 | 0 |
| Organic waste batch | Ecology `ORGANIC_WASTE_BATCH` specification entity | 27,000,000 | 3,000,000 | 70,000,000 | 0 |

Values are `microkilogram_proxy`. Each row closes at `100000000`. A zero contaminant fixture is only a deterministic gate; any nonzero unresolved contaminant mass enters quality hold. Living or standing forest biomass is never implicit feedstock.

## Process Stages

| Sequence | Stage | Default ticks | Labor minutes | External energy proxy |
|---:|---|---:|---:|---:|
| 001 | Receipt and quality hold | 2 | 45 | 2,000,000 |
| 002 | Batch assembly and resource reservation | 4 | 60 | 5,000,000 |
| 003 | Abstract decomposition proxy | 240 | 120 | 12,000,000 |
| 004 | Conditioning and incomplete-material hold | 120 | 60 | 5,000,000 |
| 005 | Screening and ledger closure | 4 | 45 | 4,000,000 |
| 006 | Output custody close | 2 | 30 | 2,000,000 |
| **Total** | Exact test oracle only | **372** | **360** | **30,000,000** |

Every stage requires a declared location, storage state, owner event references, validated labor shift, equipment reference and inspection, energy accounting and nonzero elapsed time. Batch assembly also reserves water. The values are simulation fixtures with no authorized conversion to a real process schedule, staffing plan, equipment demand or operating formula.

## Microbial Boundary

The only allowed activity label is:

`ABSTRACT_MICROBIAL_DECOMPOSITION_PROXY / NOT_FULL_LIFE_RUNTIME`

It gates deterministic accounting transfers only. It creates no life, organism, population, species, reproduction, evolution, biological identity or physiology. The aeration signal is a dimensionless failure gate and is not an oxygen concentration, airflow target, ventilation rule or safety specification.

## Accounting Oracle

The normal fixture combines `100000000 microkilogram_proxy` of feedstock with `20000000 microkilogram_proxy` of owner-reserved process water. Water and nutrients are audited component subsets of total physical mass and are not added to it a second time.

| Ledger | Initial custody | Final named custody | Total |
|---|---:|---|---:|
| Total physical mass | 120,000,000 | finished 70,000,000; gases/emissions proxy 30,000,000; leachate 12,000,000; rejects 5,000,000; remaining feedstock 3,000,000; disposal 0 | 120,000,000 |
| Water component | 64,000,000 | finished 32,000,000; atmosphere proxy 20,000,000; leachate 10,000,000; rejects 1,000,000; remaining 1,000,000; disposal 0 | 64,000,000 |
| Nutrient component | 5,000,000 | finished 4,000,000; emissions proxy 0; leachate 500,000; rejects 300,000; remaining 200,000; disposal 0 | 5,000,000 |
| Energy proxy | 50,000,000 | finished 10,000,000; gases 5,000,000; leachate 1,000,000; rejects 1,000,000; remaining 3,000,000; disposal 0; heat 30,000,000 | 50,000,000 |
| Labor capacity | 480,000,000 | consumed 360,000,000; remaining 120,000,000 | 480,000,000 |

The final 70,000,000 output transfer closes from pending material to finished candidate custody. Fertilizer inventory, soil nutrient state, Economy balance and Rights deltas remain zero.

Six mass checkpoints each close at 120,000,000 and six water checkpoints each close at 60,000,000. The water total matches the selected crop-residue proposal's default `40000000` contained-water fixture plus `20000000` of separately reserved process water. The checkpoints enforce non-instant progression through receipt, assembly, decomposition proxy, conditioning, screening and final custody.

## Risk Fixtures

| Scenario | Expected behavior |
|---|---|
| Normal closed process | All six stages and five resource domains close; output remains candidate-only |
| Contamination hold | Nonzero contaminant remains in quality hold; no batch or process-water debit |
| Moisture stress | Below-range dimensionless signal leaves the assembled batch unchanged in hold |
| Energy shortage | Available energy below the fixture requirement blocks all stage progression |
| Aeration proxy block | Below-range abstract signal blocks decomposition-proxy transfer |
| Incomplete processing | Partial outputs remain in process, emissions, leachate and remaining-feedstock custody; finished output is zero |
| Mass-ledger mismatch | Invalid 1,000,000-unit mismatch is rejected; accepted state remains unchanged |
| Closed final output custody | Foreign custody event closes 70,000,000 units with zero fertilizer, soil or Economy credit |

Every scenario carries closed accepted-state mass, water, nutrient, energy and labor ledgers. The contamination case adds a separately closed contaminant ledger. The final-output case adds a separately closed output-transfer ledger.

## Determinism

- Fixed-point scale: `1000000`.
- Fixture arithmetic: nonnegative integer custody values and signed integer transfer logic only.
- Closure tolerance: zero.
- Stage order: fixed `001` through `006`.
- Scenario order: declared required-ID order; test runners may use lexical test-ID order.
- Randomness, network, wall clock, live market data, wallet, RPC and external autonomy: none.
- Same fixture and sequence must reproduce identical totals and statuses on a second replay.

## Provenance

All hashes below are SHA-256 over exact Git blob bytes at base `38901fddd3a513b5121b8828dce43898a7ed74b6`, not working-tree text or normalized content.

| Source path | Git object | SHA-256 |
|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | `0f66a62de1018e35ca93198dc890fdddf70ab213` | `1ef1f7f2f17cc55fa8afbca429ccdfb9e0ce2a1ac55108f194b1810c26331dbc` |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | `f9748c99501ec1c1ea6ba5c39833909684c0ffbe` | `6d71cd7946f0b4057a9b5289923d3c7b424e409140feb7404f5b433a309ab00b` |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | `0f97fc7e723fc97cd8366a10f0c9eb7892df4605` | `bfde25dfb2737e6f698850aa705ea221c64bb0f228ff8e3a7f2740f0ae123451` |
| `AGENTS.md` | `06ad797cc0d87f9a468ccbd11ccf03f528029a7a` | `c16c1ba1cfff166e68d2ec1a399afb9f9fa877631b574ebe3fdf03c5c514295b` |
| `KAIOS/life/candidates/forest-agriculture-v1/CURSOR_COMPOST_MODELS_WORK_ORDER.md` | `240e68052467a77939a84207b9e3299a632accef` | `13a6c6d823bd4ce833efad1935e15cf964d9c96d3d71c5143c95e507c00f38f1` |
| `KAIOS/life/forest-agriculture/KAIOS_CURSOR_FERTILIZER_MODELS_REVIEW_CLOSEOUT.md` | `ab55b1b70781e6eff84876371513d0c113a9fcf0` | `e5a3d002411b40dc394b40251a23a591f105ffcc3b009582248aaa36cff2b95e` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-catalog-candidates.json` | `1d4a445a1548ad61ee96810411135e7d88d9e30a` | `f824773458c31a4725eced0f83102a8eefefdcabf27dd71b4e59806684244a57` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-resource-flow-proposal.json` | `969a300fd867055de75359167225b1b98f97635b` | `b0e6bb9e1241ef0bf70a45f82156736bb17821e9c29624b62207e78215cf0849` |
| `KAIOS/life/candidates/forest-agriculture-v1/vegetables/vegetable-catalog-candidates.json` | `5f33d11528d7ea14eb26417224a85cece1392144` | `77cc5dd2e4b6264d5fe8d015881858a2c76f5a522d567a185061b919bbad8cd6` |
| `KAIOS/life/candidates/forest-agriculture-v1/vegetables/vegetable-resource-flow-proposal.json` | `a318188622731c0f9a52c47a41f4ef784aa86113` | `444b9b1a843c74ba3eddf51819cb3507be058275de8271f34e367f231856aab3` |
| `KAIOS/life/candidates/forest-agriculture-v1/forest/forest-composition-candidates.json` | `e4e63adb992337dc333c4de78152903234d8a46d` | `007323cb9cad66726b0b1cfe86f05eeda01dbce5d783832e730828299f287e8d` |
| `KAIOS/life/candidates/forest-agriculture-v1/forest/forest-resource-flow-proposal.json` | `4bf0ea0ee3ad5b1612a76debdef9efdf7ed1a90d` | `444da4c272fe05a176ae9771251e581143b2288a3956323cce32b6638f90f0ea` |
| `KAIOS/life/candidates/forest-agriculture-v1/soil-types/soil-type-catalog-candidates.json` | `aeae3970108c6f41ad461c22e6cf5d7e2d1a774b` | `a5fdf6e363f4e5cecd0d50b981bf32d5cb06f35747eb7327b37d4784a14e1d64` |
| `KAIOS/life/candidates/forest-agriculture-v1/soil-types/soil-water-nutrient-thresholds.json` | `f5c829459159e5de8acefbd6e11667c2090b9391` | `0cad3742773b1fcad1d5d2a86d1b50e95eae4a0a7d242d4dcd71fb26f6c8902c` |
| `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/fertilizer-catalog-proposals.json` | `dff6ac3e1b468f49383b4caf12c157cbb4ba4d10` | `812aa257221818990f00474669d0ee1a732a40ec0cf1ee9c57b51659a8286da8` |
| `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/nutrient-composition-proposals.json` | `3897ab6042e3ea7ed5e5265c21ff44438c8eb9ed` | `b6360a22783b7144f1f707a8df70cdb4ce46a12bebbad707385794d25f8f502a` |
| `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/application-response-model-proposals.json` | `8f8d481d2182db4320131b17f9dffda176962b02` | `6ad4367d085dae369099597d996fed5aab774ead487f5cbd4143595d69f8c533` |
| `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/environmental-risk-scenarios.json` | `19423c1850d974b1c30574e3ddd7035bdb5c042a` | `2ff5bca9f2700614405ce72ffc8c4b65c465ab60bc1aac4970e913732f7620fa` |
| `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/fertilizer-test-scenarios.json` | `7a753dda9c8c44216b427df5961460785ca4faab` | `d45afe7a06fbbc3c3d47b28c437b2030e8da90df61745e5fef9429bc50c0a0af` |
| `KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_SCHEMA_V1.json` | `c99eb0eba386af67c009bfd115e88b934d1c9000` | `3257f8cd1f0ba482f0c6bc8d98fbfb4748c8a1172c9c88d4bf9a2981c90af9f0` |
| `KAIOS_SUPPLY_CHAIN_SCHEMA.json` | `56bc0ff72042100cb74ace45ee3c30d7703a48e9` | `ea6d175e8bfd242a288f6e6374e97e97fd18ecf5edb40761a29de2129036aa60` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md` | `02ab662fad21d8365bca68d00e7eccec3a884889` | `431db8dba33f5fdaa4de04c90830eaeb054c057a708455c48265631ca4e0433c` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |

No external internet source, product label, commercial process, field trial, regulation, certification or safety dataset is used. Substantive coefficients therefore remain low-confidence `MODEL_INFERENCE`, `RESEARCH_PROPOSAL` or `ASSUMPTION` values requiring owner validation.

## Assumptions

1. The explicit task base `38901fddd3a513b5121b8828dce43898a7ed74b6` supersedes the older ancestor recorded inside the work order.
2. Candidate crop, vegetable, forest, soil and fertilizer IDs are reusable foreign references but remain candidate data rather than Canonical promotion.
3. `ORGANIC_WASTE_BATCH` and `COMPOST_BATCH` are specification-defined Ecology-owned entities; their dedicated current-schema representation remains owner work and is not invented here.
4. The `100 kg` feedstock basis, `20 kg` water input and every partition are deterministic accounting choices, not collection, mixing, handling or process quantities.
5. Total physical mass includes water and nutrient components. Parallel water and nutrient ledgers audit those subsets and are not additional mass.
6. `GASES_EMISSIONS_PROXY_CUSTODY` and `LEACHATE_CUSTODY` are aggregate accounting destinations with no chemical, regulatory, environmental or safety semantics.
7. Simulation ticks have no authorized real-time conversion. Worker minutes exercise capacity accounting and are not staffing, ergonomic or occupational-safety guidance.
8. Energy values are finite abstract proxies and are not machinery, electricity, fuel or thermodynamic estimates.
9. A finished candidate output may receive a later owner-created Economy lot only after review; it never becomes `FERTILIZER` or soil nutrient state automatically.

## Remaining Risks

1. Current Ecology schema lacks dedicated `COMPOST_BATCH` and `ORGANIC_WASTE_BATCH` records even though the Forest and Agriculture specification assigns those truths to Ecology.
2. Compost-area facility ownership and owner-native finished-output resource mapping remain `SOURCE_UNDERSPECIFIED`.
3. Feedstock composition, process partitions, time, moisture, aeration, energy and labor values have no empirical calibration and cannot support real-world conclusions.
4. Aggregate emissions, leachate, nutrient and contaminant proxies omit chemistry, pathogens, gas species, exposure, local regulation and environmental fate.
5. No fixture establishes maturity, stability, quality, safety, fertilizer value, soil benefit, crop response, yield, price or legal acceptance.

## Validation Record

The pre-commit validation suite produced these results:

- Strict JSON: 5 files parsed, 0 duplicate keys, 0 trailing-data failures.
- Candidate metadata: 5 of 5 JSON files matched status, review status, authority and source base.
- Numeric contracts: 53 parameters checked, 0 invalid contracts, 0 invalid source labels, all `validation_required=true`.
- Cross-references: 4 feedstocks, 6 stages, 8 scenarios and 40 test definitions checked with unique IDs.
- Feedstock accounting: 4 component fixtures closed at 100,000,000 units each.
- Process timing: 6 contiguous nonzero-time stages closed at 372 ticks.
- Resource accounting: 48 accepted-state ledgers closed with nonnegative integers and zero tolerance.
- Checkpoint accounting: 6 mass and 6 water checkpoints closed.
- Provenance: 61 embedded records and 27 unique source paths reproduced from exact Git blob bytes at the declared base.
- Encoding: 6 strict UTF-8 files, 0 BOM markers and 0 NUL bytes.
- Security: focused private-key, credential, token, seed and credential-bearing URL scan returned 0 findings.
- Repository scope: exactly 6 candidate paths and 0 protected-path changes.
- Whitespace and error scan: `git diff --check` passed.

## Hard Boundaries

- `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`
- `ABSTRACT_MICROBIAL_DECOMPOSITION_PROXY / NOT_FULL_LIFE_RUNTIME`
- No living organism, species, population, reproduction or full Life Runtime.
- No agronomic prescription, compost formula, product endorsement, price, yield promise, safety guarantee, environmental approval or legal certification.
- No authoritative inventory, ledger, price, ownership, labor, Rights, Agriculture, Ecology, Supply Chain, Economy or soil state.
- No Runtime, Canonical Schema, CURRENT, Universe Law, Constitution, registry, index, wallet, KGEN contract, deployment or CI change.
- No push, pull request, merge, deployment or Canonical claim.

**Final status:** `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`
