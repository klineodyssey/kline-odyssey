# Cursor Fertilizer Models Candidate Report

**Task:** `KAIOS-CURSOR-FERTILIZER-MODELS-001`
**Worker:** `cursor-01`
**Branch:** `cursor-handoff/KAIOS-CURSOR-FERTILIZER-MODELS-001`
**Declared research base:** `1650191f35567d43016473420cfd2cba22b00aea`
**Status:** `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

## Executive Summary

This candidate package proposes a deterministic, fixed-point fertilizer and received soil-amendment simulation contract. It contains abstract catalog classes, closed 100 kg proxy compositions, seven soil-linked nutrient response partitions, environmental custody fixtures, and a machine-checkable test manifest.

The package does not create fertilizer products, field recommendations, crop-yield predictions, safety findings, environmental approvals, compost processes, inventory truth, rights, prices, canonical records, or runtime behavior. All tunable numeric values are low-confidence simulation proposals with explicit ranges, units, rationale, source classification, risk, and mandatory owner validation.

## Delivered Files

Exactly these six candidate files are delivered under `KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/`:

1. `CURSOR_FERTILIZER_MODELS_REPORT.md`
2. `fertilizer-catalog-proposals.json`
3. `nutrient-composition-proposals.json`
4. `application-response-model-proposals.json`
5. `environmental-risk-scenarios.json`
6. `fertilizer-test-scenarios.json`

No other path is part of this task output.

## Read And Gate Record

The mandatory sources were read before target analysis in the required order: Boot Sequence V1.4, active Physics Runtime CURRENT, Universe Map, and `AGENTS.md`. The active boot chain's additional governance, worker, company, queue, handoff, and protected-path sources were then read before the work order and target sources.

Worker registry and branch checks matched the assignment:

- Worker: `cursor-01`
- Employee/trust state: `ACTIVE`, `T2`
- Registered task: `KAIOS-CURSOR-FERTILIZER-MODELS-001`
- Registered, expected, and actual branch: `cursor-handoff/KAIOS-CURSOR-FERTILIZER-MODELS-001`
- Worktree: `C:\Desktop\kline-odyssey-fertilizer-models`
- Main push authority: false
- Initial worktree: clean

The declared base is an ancestor of the task branch. The work order was introduced after the declared base and is treated only as the dispatch envelope. It is not represented as a research-source blob at the declared base and no false base hash is assigned to it.

## Existing-Function Check

Before editing, repository searches covered `docs`, `KGEN`, `K線西遊記`, and `K線西遊記/temples/12345`, followed by a repository-wide fertilizer/amendment search. No competing fertilizer implementation was found. Existing forest/agriculture, soil, crop, Supply Chain, Labor, Rights, Ecology, Agriculture, Economy, and Physics contracts were reused as foreign owners or source constraints.

## Ownership Contract

| Truth | Existing owner | Reused IDs or references | Candidate behavior |
|---|---|---|---|
| Foundational soil life | `KAIOS_FOUNDATIONAL_LIFE_RUNTIME_V1` | `SPECIES-KAIOS-FOUNDATIONAL-SOIL` | Read-only reference; no soil truth mutation |
| Plant contract and identity | `KAIOS_CANONICAL_LIFE_SCHEMA_V1` | `SPECIES-KAIOS-FOUNDATIONAL-GRASS`, `SPECIES-KAIOS-FOUNDATIONAL-TREE` | Response projection only; no new Plant owner |
| Soil water, nutrient, biomass, decomposition, environment | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | `HABITAT-SOIL-V1`, `POP-SOIL-001` | Proposed paired deltas only |
| Plot, crop batch, application event | `AGRICULTURE_ALPHA` | `RICE`, `VEGETABLE`, `FRUIT` | Foreign references and proposed event envelope only |
| Lot, dependency, storage, transport | `KAIOS_SUPPLY_CHAIN_SCHEMA` | Existing `FERTILIZER` resource reference | No inventory or custody truth creation |
| Worker timeline and capacity | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Owner-native shift IDs | Validated capacity and non-overlap required |
| Land/water/operation capability | `EXISTING_RIGHTS_AUTHORITY` | Existing decision IDs | Consume an `ALLOW` reference; grant nothing |
| Inventory, market, balanced ledger | `CIVILIZATION_ECONOMY_ALPHA` | Existing `FERTILIZER` resource reference | No balances, ownership, prices, costs, or entries |

## Catalog And Composition

The catalog separates three abstract classes:

- `FERT-PROPOSAL-DRY-NUTRIENT-BLEND-V1`: dry nutrient-input proxy.
- `FERT-PROPOSAL-LIQUID-NUTRIENT-SOLUTION-V1`: liquid nutrient-input proxy.
- `AMENDMENT-PROPOSAL-ORGANIC-CARRIER-V1`: received structural carrier with incidental nutrient and batch-water custody. It is explicitly not a compost process or quality model.

Each exact fixture closes to `100000000 microkilogram_proxy`, corresponding to the declared 100 kg reference basis:

| Composition profile | N | P | K | Secondary | Carrier | Batch water | Contaminant | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Dry blend | 10,000,000 | 5,000,000 | 8,000,000 | 2,000,000 | 75,000,000 | 0 | 0 | 100,000,000 |
| Liquid solution | 4,000,000 | 2,000,000 | 3,000,000 | 1,000,000 | 10,000,000 | 80,000,000 | 0 | 100,000,000 |
| Received amendment | 2,000,000 | 1,000,000 | 1,000,000 | 1,000,000 | 65,000,000 | 30,000,000 | 0 | 100,000,000 |

The zero contaminant values are test conventions, not evidence of purity. Any nonzero unresolved contaminant fixture is held and rejected from application.

## Numeric Contract

Every tunable numeric proposal contains exactly these fields:

`parameter_name`, `unit`, `minimum`, `default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk`, `validation_required`.

Allowed source labels are limited to:

`SOURCE_DERIVED`, `REPOSITORY_DERIVED`, `MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION`, and `SOURCE_UNDERSPECIFIED`.

All ranges obey `minimum <= default <= maximum`; all proposal values require validation. Exact fixture integers, source hashes, versions, counts, and fixed-point scales are oracle or identity data, not tunable parameters.

## Application Contract

An application proposal requires explicit references for inventory lot, storage inspection, transport custody, Rights decision, labor shift, equipment inspection, timing window, Agriculture plot/crop, Ecology soil observation, application event, and ledger event. Missing, denied, stale, contaminated, overlapping, failed-inspection, over-cap, negative-balance, or unclosed proposals are rejected before any debit.

Four method IDs are labels for simulation routing only. They contain no depth, spacing, dilution, pressure, crop-stage, weather, or field-use instructions.

The response model uses seven released soil candidate IDs and corresponding water/nutrient profile IDs. Default applied-nutrient custody shares are:

| Soil response profile | Plant available | Soil retained | Soil mobile | Runoff | Leaching | Volatilization | Equipment | Sum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sandy | 0.20 | 0.15 | 0.20 | 0.05 | 0.30 | 0.08 | 0.02 | 1.00 |
| Sandy loam | 0.25 | 0.20 | 0.20 | 0.08 | 0.17 | 0.08 | 0.02 | 1.00 |
| Loam | 0.30 | 0.25 | 0.15 | 0.10 | 0.10 | 0.08 | 0.02 | 1.00 |
| Silt loam | 0.28 | 0.28 | 0.14 | 0.12 | 0.08 | 0.08 | 0.02 | 1.00 |
| Clay loam | 0.25 | 0.35 | 0.12 | 0.15 | 0.04 | 0.07 | 0.02 | 1.00 |
| Clay | 0.20 | 0.40 | 0.10 | 0.20 | 0.02 | 0.06 | 0.02 | 1.00 |
| Organic-rich mineral | 0.30 | 0.38 | 0.12 | 0.08 | 0.04 | 0.06 | 0.02 | 1.00 |

These shares are model inference for deterministic owner review. They are not measured behavior, agronomic recommendations, or environmental forecasts.

## Accounting Oracle

The bounded loam fixture transfers 20% of one dry reference lot and keeps nutrient and carrier mass separate.

| Ledger | Initial | Final destinations | Final total |
|---|---:|---|---:|
| Nutrient mass | 25,000,000 | inventory 20,000,000; plant 1,500,000; retained 1,250,000; mobile 750,000; runoff 500,000; drainage 500,000; atmosphere 400,000; equipment 100,000 | 25,000,000 |
| Carrier mass | 75,000,000 | inventory 60,000,000; soil 14,700,000; equipment 300,000 | 75,000,000 |
| Event water | 10,000,000 | soil 7,000,000; runoff 2,000,000; atmosphere 1,000,000 | 10,000,000 |
| Event energy | 3,000,000 | heat/dissipation 3,000,000 | 3,000,000 |
| Labor capacity | 60,000,000 | consumed 45,000,000; remaining 15,000,000 | 60,000,000 |

The resulting response signal is `600000` on a `1000000` fixed-point scale. It is a bounded, dimensionless signal only; no yield, plant-health, profit, or soil-quality semantics attach to it.

## Risk Fixtures

Eleven deterministic scenarios cover the seven required cases plus four explicit separation cases:

| Scenario | Expected behavior |
|---|---|
| Deficiency | Alert only; no material creation or application |
| Bounded application | Closed proposal available for independent owner review |
| Over-application | Rejected with inventory, water, energy, and labor unchanged |
| Runoff | Nutrient and water enter explicit surface-runoff custody |
| Leaching | Nutrient and water enter explicit drainage custody, separate from runoff |
| Storage loss | Material moves to available, recovery, and containment custody |
| Transport loss | Departure mass closes across arrival, recovery, and containment |
| Volatilization | Nutrient enters explicit atmosphere custody, not generic loss |
| Contamination | Nonzero contaminant triggers quality hold and no application |
| Recovery | Material remains in recovery until owner-accepted restoration or disposal |
| Amendment receipt | Nutrient, carrier, and batch water remain on inspection hold; no compost state |

Every applicable fixture closes nutrient mass, carrier/amendment mass, contaminant mass, batch-water mass, event-water volume, energy, and labor capacity independently with integer arithmetic and zero tolerance.

## Determinism

- Fixed-point scale: `1000000`.
- Fixture arithmetic: integer only.
- Randomness, network, wall clock, live market data, wallet, RPC, and external state: none.
- Rounding: final-pool allocation only, with deterministic remainder assigned to the retained-soil pool.
- Scenario ordering: stable ID ordering when a runner requires ordering.
- No fixture mutates an authoritative owner.

## Provenance

All listed hashes are SHA-256 values over exact Git blob bytes at the declared base commit, not working-tree text and not normalized content.

| Source path | Git object at declared base | SHA-256 |
|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | `0f66a62de1018e35ca93198dc890fdddf70ab213` | `1ef1f7f2f17cc55fa8afbca429ccdfb9e0ce2a1ac55108f194b1810c26331dbc` |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | `f9748c99501ec1c1ea6ba5c39833909684c0ffbe` | `6d71cd7946f0b4057a9b5289923d3c7b424e409140feb7404f5b433a309ab00b` |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | `0f97fc7e723fc97cd8366a10f0c9eb7892df4605` | `bfde25dfb2737e6f698850aa705ea221c64bb0f228ff8e3a7f2740f0ae123451` |
| `AGENTS.md` | `06ad797cc0d87f9a468ccbd11ccf03f528029a7a` | `c16c1ba1cfff166e68d2ec1a399afb9f9fa877631b574ebe3fdf03c5c514295b` |
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |
| `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md` | `783ea5b17d82bf6579e4a9763bcbc3b18fb06ac2` | `bec5f35a1906dbd9eb72764e935f4ad282a81398587b66de789130ae4a0428f4` |
| `KAIOS/life/runtime/foundational-life-runtime.js` | `9187c14774b34c25e9ae23cf21749fbb5dbb891d` | `4d72be28bbad06ff65d1dddb44043e6f3e2086a095a8bf105e2f08cbed648779` |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | `2bab509140ab4b93c7e4975286c826693965cf26` | `9b2cd9d4501727d3134ea332e1a30cd77d5d7d647300820f51d9c264784ef537` |
| `KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js` | `f09478806a47c10825258385ee855faa74f51a79` | `4557d6b449ce3979f2bf4ca10cc48f271ead2ddb34cc127e60b264ce26b577c2` |
| `KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md` | `02ab662fad21d8365bca68d00e7eccec3a884889` | `431db8dba33f5fdaa4de04c90830eaeb054c057a708455c48265631ca4e0433c` |
| `KAIOS_SUPPLY_CHAIN_SCHEMA.json` | `56bc0ff72042100cb74ace45ee3c30d7703a48e9` | `ea6d175e8bfd242a288f6e6374e97e97fd18ecf5edb40761a29de2129036aa60` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |
| `KAIOS/life/candidates/forest-agriculture-v1/soil-types/soil-type-catalog-candidates.json` | `aeae3970108c6f41ad461c22e6cf5d7e2d1a774b` | `a5fdf6e363f4e5cecd0d50b981bf32d5cb06f35747eb7327b37d4784a14e1d64` |
| `KAIOS/life/candidates/forest-agriculture-v1/soil-types/soil-water-nutrient-thresholds.json` | `f5c829459159e5de8acefbd6e11667c2090b9391` | `0cad3742773b1fcad1d5d2a86d1b50e95eae4a0a7d242d4dcd71fb26f6c8902c` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-catalog-candidates.json` | `1d4a445a1548ad61ee96810411135e7d88d9e30a` | `f824773458c31a4725eced0f83102a8eefefdcabf27dd71b4e59806684244a57` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-resource-flow-proposal.json` | `969a300fd867055de75359167225b1b98f97635b` | `b0e6bb9e1241ef0bf70a45f82156736bb17821e9c29624b62207e78215cf0849` |

No external internet source, product label, commercial formulation, field trial, regulation, or safety dataset is used. Consequently, every substantive coefficient remains `MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, or `ASSUMPTION`, carries low or at most medium confidence, and requires owner validation.

## Assumptions

1. The released soil and crop candidate IDs at the declared base are valid foreign references but remain candidate data rather than canonical promotion.
2. `FERTILIZER` is reused only as an existing Economy/Supply Chain resource identifier; the received amendment mapping remains intentionally underspecified.
3. Aggregate N, P, K, and secondary nutrient proxies are accounting dimensions, not chemical species or claims about plant availability.
4. A 100 kg basis and `1000000` fixed-point scale are deterministic test choices, not purchase, storage, mixing, transport, or field quantities.
5. Water volume proxies and batch-water mass are separate ledgers; no density conversion is inferred.
6. Energy is an abstract finite debit transferred to heat/dissipation custody; no power, fuel, machinery, or thermodynamic performance is inferred.
7. Labor values exercise capacity and non-overlap contracts; they are not staffing, ergonomics, exposure, or occupational-safety guidance.
8. Response partitions are deliberately bounded and close to one, but have no empirical calibration and cannot support yield or environmental claims.
9. Owner validation is mandatory before any proposed delta could be considered by Runtime or canonical governance.

## Validation Record

The pre-commit validation suite produced these results:

- Strict JSON: 5 files parsed, 0 duplicate keys, 5 matching candidate metadata records.
- Numeric contracts: 119 parameters checked, 0 invalid contracts.
- Cross-references: 3 catalog proposals, 3 compositions, 4 methods, 7 soil response profiles, 11 risk scenarios, and 29 test definitions checked.
- Accounting: 3 exact composition fixtures and 60 resource ledgers closed with nonnegative integer values and zero tolerance.
- Provenance: 23 embedded records, 16 test-manifest expectations, and 19 report rows reproduced from exact Git blob bytes at the declared base.
- Encoding: 6 strict UTF-8 files, 0 BOM markers, and 0 NUL bytes.
- Security: focused private-key, credential, token, seed, and credential-bearing URL scan returned 0 findings.
- Repository scope: exactly 6 candidate paths and 0 protected paths.
- Whitespace/error scan: staged `git diff --check` passed.

The final handoff message records the candidate commit SHA. No push, pull request, merge, deployment, Runtime update, Canonical update, CURRENT update, governance change, wallet action, or real KGEN action is authorized.

## Hard Boundaries

- `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
- Simulation and test data only.
- No product endorsement, formulation, dosage, mixing, handling, application, storage, transport, remediation, or disposal guidance.
- No crop-yield, plant-health, soil-quality, safety, purity, compliance, or environmental guarantee.
- No compost production, decomposition, microbiology, maturity, or quality model.
- No authoritative inventory, ledger, price, cost, ownership, labor, Rights, Agriculture, Ecology, Supply Chain, Economy, or canonical state.
- No Runtime, `CURRENT`, Boot, Constitution, governance, wallet, KGEN contract, or protected-path modification.
- No push, PR, merge, deployment, or production activation.

**Final status:** `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
