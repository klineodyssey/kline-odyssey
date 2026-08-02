# Cursor Insect Candidate Package Report

Task ID: `KAIOS-CURSOR-INSECT-CANDIDATES-001`

Worker: `cursor-01`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

Mode: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

Branch: `cursor-handoff/KAIOS-CURSOR-INSECT-CANDIDATES-001`

Dispatch branch base commit:
`88dce5e0532567a1f1113abf9bfee907efea65bc`

Immutable source base commit:
`56d3b8f20a63c4a8a5d19251ed72f7f9fe4e78c9`

Provenance hash basis:
`SHA256_OF_EXACT_GIT_BLOB_BYTES_AT_SOURCE_BASE_COMMIT`

## Scope

These seven artifacts propose bounded research packages for three synthetic
insect roles: herbivore beetle analog, predator beetle analog and detritivore
beetle analog. Each candidate consumes the merged Canonical Life shared core
and exactly one approved `ANIMAL_EXTENSION`. Nothing in this package promotes
an identity, changes an owner schema or activates Runtime behavior.

The proposals are abstract simulation models. They are not empirical species
descriptions, bioengineering instructions, agricultural advice, pesticide or
disease claims, pest-control promises, safety guarantees, product claims or
authority to create organisms. Pollination is explicitly excluded for its
separately queued workline.

## Owner Boundaries

| Truth | Foreign owner | Candidate behavior |
|---|---|---|
| Shared Life fields and allowed animal extension | `KAIOS_CANONICAL_LIFE_SCHEMA_V1` and `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1` | Read-only composition and validation |
| Life identity, event and state authority | `KAIOS_LIFE_RUNTIME_V1` | Non-executable manifest proposal only |
| Location, motion, time and physical causality | Universe Physics Runtime `CURRENT` | References causal gates; creates no physics |
| Habitat, food relationships, reproduction, population and decomposition | `KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1` | Candidate deltas and pending custody only |
| Forest and agriculture integration | `KAIOS_FOREST_AGRICULTURE_RUNTIME_V1` | No farm, crop, pest-control or production action |
| Human work capacity | `KAIOS_PHYSICAL_LABOR_SCHEMA` | Foreign reference for any future intervention |
| Rights and authority | Canonical Life Rights | Null/unassigned projections; no rights decision |
| Value, balances and K11520 | Civilization Economy owner | No value, price, balance or ledger mutation |
| Inventory, transfer and custody acceptance | Supply Chain owner | Pending references only; no accepted transfer |

The current Ecology schema admits only its existing foundational species IDs.
It does not admit any proposed insect ID in this package. Runtime admission
therefore remains blocked by
`OWNER_SCHEMA_EXTENSION_AND_CODEX_REVIEW_REQUIRED`.

## Candidate Identities

| Candidate package | Proposed species ID | Proposed role | Status |
|---|---|---|---|
| `CANDIDATE-INSECT-HERBIVORE-V1` | `SPECIES-KAIOS-INSECT-HERBIVORE-CANDIDATE` | Abstract herbivore | `NONCANONICAL` |
| `CANDIDATE-INSECT-PREDATOR-V1` | `SPECIES-KAIOS-INSECT-PREDATOR-CANDIDATE` | Abstract predator | `NONCANONICAL` |
| `CANDIDATE-INSECT-DETRITIVORE-V1` | `SPECIES-KAIOS-INSECT-DETRITIVORE-CANDIDATE` | Abstract detritivore | `NONCANONICAL` |

The taxonomy records are complete proposal records, not accepted taxonomy.
They do not reuse or alter the repository's existing `BEE_ALPHA` identifier.
The predator label does not activate predation, a food chain or pest control,
and the detritivore label does not activate decomposition.

## Model Findings

1. Every lifecycle transition is ordered, takes positive elapsed time and is
   gated by candidate location, habitat and stage state.
2. Feeding, development and reproduction additionally require bounded food,
   water, energy-proxy, temperature and health conditions as applicable.
3. Reproduction uses integer cohorts, a cooldown, a population cap and a
   generation cap. There is no unbounded recursive spawning.
4. Structural mass, water and energy proxy remain separate conserved domains.
   Food input, waste and dead biomass have explicit subsidiary ledgers.
5. Waste and dead biomass remain in named candidate custody until a future
   Ecology owner acceptance event. Pending custody is not decomposition.
6. Microbial activity is represented only as
   `MICROBIAL_DECOMPOSITION_PROXY / ABSTRACT_RESOURCE_POOL /
   NOT_FULL_LIFE_RUNTIME`; the package creates no microbes or other life.
7. Rights, ownership, custody authority, economic value, listing, K11520,
   labor authorization and Supply Chain acceptance remain foreign-owner facts.
8. Sixty-four numeric parameter envelopes carry the required parameter name,
   unit, bounds, rationale, source type, confidence, risk and validation flag.
   Non-repository values are synthetic proposals, not empirical chemistry or
   biology.

## Deterministic Oracle

`INSECT-HERBIVORE-LIFECYCLE-RESOURCE-ORACLE-001` is an objective integer test
fixture, not a Runtime parameter set. It applies eight ordered actions across
`43,200,000,000 micro_minute` (`30` simulated days at the declared scale).

Initial and final conserved totals:

| Domain | Exact total |
|---|---:|
| Structural mass | `120,000,000 micro_gram_proxy` |
| Water | `22,000,000 micro_milliliter_proxy` |
| Energy proxy | `120,000,000 micro_energy_proxy_unit` |

Subsidiary custody identities:

| Ledger | Identity |
|---|---|
| Food | `100,000,000 initial = 88,000,000 remaining + 12,000,000 consumed` |
| Food allocation | `12,000,000 consumed = 5,000,000 growth + 7,000,000 waste` |
| Waste | `7,000,000 created = 3,000,000 retained + 4,000,000 pending owner transfer` |
| Dead biomass | `900,000 created = 300,000 retained + 600,000 pending owner transfer` |
| Population | `16 initial + 20 births - 3 deaths - 0 migration = 33 final` |
| Population cap | `36 peak <= 40 candidate role cap` |
| Generation cap | `1 maximum generation <= 3 generation cap` |

The recursively key-sorted compact UTF-8 serialization of
`deterministic_normal_oracle.expected_final_state` has SHA-256:

`0872776fca782d8cea32265e6f93a2b0f6da9c2f5961cb833adf318bc6361fc9`

All action deltas sum to zero within every conserved domain they touch. A
negative pool, stage skip, zero-time transition, cap breach, missing cause,
ledger mismatch or replay hash mismatch is rejected.

## Artifact Map

- `insect-candidate-manifests.json`: three full shared-core manifests with one
  approved `ANIMAL_EXTENSION` each and deterministic identity checksums.
- `insect-taxonomy-proposals.json`: complete explicitly noncanonical taxonomy
  proposals and collision boundaries.
- `insect-physics-environment-proposals.json`: bounded environment envelopes,
  unit rules and causal evaluation gates.
- `insect-lifecycle-resource-proposals.json`: lifecycle, reproduction,
  population, custody ledgers and deterministic oracle.
- `insect-rights-economy-proposals.json`: foreign-owner separation and blocked
  intervention, rights, economy and transfer states.
- `insect-test-scenarios.json`: thirty-three objective positive, negative,
  provenance, conservation and scope scenarios.
- `CURSOR_INSECT_CANDIDATES_REPORT.md`: evidence, assumptions, risks and Codex
  handoff record.

## Immutable Provenance

The package registry records exact Git objects and SHA-256 digests of source
blob bytes at commit `56d3b8f20a63c4a8a5d19251ed72f7f9fe4e78c9`.

| Source path | Git object | SHA-256 |
|---|---|---|
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | `3bfcea2e0fc3854a6ff674a93ef32edc2ee0aab5` | `d1ced898d043e4890142df40a9033145762d4ceb28fd0e49eae39dc43bf224c5` |
| `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json` | `8f3a30d1cba18b7156c64439bfce5d9bafc6926e` | `72ab55fe394b1038cb2b8ab8bac616f378521b89fde36aa6cf5ab3cbebea58fa` |
| `KAIOS_CANONICAL_LIFE_PACKAGE_TEMPLATE_V1/life.manifest.json` | `5d8fd7eceb0e7c9f380597f64e2ccd55a3e52982` | `dca53d23855d00c3b926f5ce037e75203f87feaa063b11f6f13415d84635d251` |
| `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md` | `783ea5b17d82bf6579e4a9763bcbc3b18fb06ac2` | `bec5f35a1906dbd9eb72764e935f4ad282a81398587b66de789130ae4a0428f4` |
| `KAIOS/life/KAIOS_LIFE_RUNTIME_V1_SPEC.md` | `e1df7d486971684f9cd8020b9005a9fdcc389ce4` | `bc69596af470812bdfcbaa1989cf4cb59887c35f46f1c97d52f6d3dba87eb655` |
| `KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1_SPEC.md` | `0f4399751f4e75727aeac45343a8b3a8900ec534` | `7fb277af16f552b16db2f4cb511fd060e4e3a5217855198f30fcf59371b8eda1` |
| `KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_SCHEMA_V1.json` | `c99eb0eba386af67c009bfd115e88b934d1c9000` | `3257f8cd1f0ba482f0c6bc8d98fbfb4748c8a1172c9c88d4bf9a2981c90af9f0` |
| `KAIOS/life/candidates/ecology-v1/food-relationships.json` | `e8f5b84d16ce7e7ca6c0943e8fff252a9dea3000` | `0b7a915e081d2256ed3b7b9159ee1437b2967eaaa54f2109099911e13d9ccf36` |
| `KAIOS/life/candidates/ecology-v1/population-scenarios.json` | `80d2c522ff439280a932bd96914dc8ee04815c5d` | `7d0a4ae68343ac672362750f1db87bcb9776df6f362e50857613a6bd6bb3beda` |
| `KAIOS/life/candidates/ecology-v1/habitat-compatibility.json` | `365c7bbaffdf6754ebed3a6435cda73e45b191b5` | `f1dc488b8795ca5ad5a2e320f0502696d01a66329253b9922754bfc48ef37050` |
| `KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md` | `9a2dd4ad05bb7b2e3d71b91b479359947ada8376` | `4e1a23e97d09ec2dc4ad65440e6958e646f75ed418e5c703c5a5a1635c2809a1` |
| `KAIOS_PHYSICAL_LABOR_SCHEMA.json` | `357b00093f4a912e616e9d39edf04753aacf94f7` | `21060f7bdf64f0a3af827f1fcd7d95d3170affef54c01bbeb449b9361fdd2f43` |
| `KAIOS_SUPPLY_CHAIN_SCHEMA.json` | `56bc0ff72042100cb74ace45ee3c30d7703a48e9` | `ea6d175e8bfd242a288f6e6374e97e97fd18ecf5edb40761a29de2129036aa60` |
| `KGEN-KAIOS/world-viewer/biology/taxonomy-standard.js` | `f4cc78d30bccf375bb3e55f5e3cb2df63d0a4683` | `2c7eb6d439ac320176751c4985d1f510b68a5656ef4b4ef041dc46b4f55dcc28` |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | `2b1a37dba8cf3863eb4b30d4547995f281a6bc62` | `8b5879091b212ea3e0ead296719e872b9353209fd8982f01567f2bbb78991f27` |
| `KGEN-KAIOS/world-viewer/data/synthetic-world.json` | `76ddff32f74c2b41ca7d9d9309b7b39a2a2618c8` | `4be4c1b83420bb24604742fb722a8aedba8b3d2c163f7f18ccd871628ee7f34f` |
| `KAIOS/life/candidates/fish/life.manifest.json` | `04eb6c9ad48016457c0ece08a0e42a42cd9e6a63` | `a460652cd22bb107a39ceec1b8cb97f200368385bfe00551e0c4e362197472c0` |
| `KAIOS/life/candidates/forest-agriculture-v1/crops/crop-resource-flow-proposal.json` | `969a300fd867055de75359167225b1b98f97635b` | `b0e6bb9e1241ef0bf70a45f82156736bb17821e9c29624b62207e78215cf0849` |

## Validation Evidence

- required output scope: `7 / 7 PASS`
- strict JSON parse and duplicate-key scan: `6 / 6 PASS`
- Canonical shared-core manifest validation: `3 / 3 PASS`
- approved extension composition: `3 / 3 PASS`
- numeric parameter contracts: `64 / 64 PASS`
- deterministic oracle action balance: `8 / 8 PASS`
- conserved and subsidiary ledgers: `8 / 8 PASS`
- bounded population and generation assertions: `PASS`
- objective test scenarios: `33 / 33 structurally present`
- immutable source Git objects and SHA-256: `18 / 18 PASS`
- allowed source labels: `110 / 110 PASS`
- UTF-8 without BOM, NUL or replacement characters: `7 / 7 PASS`
- secret and protected-path scans: `PASS`
- `git diff --check`: `PASS`

## Assumptions And Remaining Risks

- Environment, stage, resource and reproduction envelopes are low-confidence
  synthetic proxies unless marked as exact repository-derived bounds.
- The current Ecology owner schema cannot admit the proposed species IDs.
  Owner schema work and independent Codex review are prerequisites to any use.
- The current Ecology trophic vocabulary has no direct accepted detritivore
  candidate binding; no substitute food-chain behavior is inferred here.
- Rights, labor, Supply Chain and Economy owner events are references only and
  have not occurred. Pending custody cannot be interpreted as acceptance.
- The package does not establish ecological suitability, carrying capacity,
  agricultural benefit, environmental safety or biological realism.
- Pollination remains unmodeled and reserved for the separate queue task.

## Boundaries

No Runtime, Canonical Schema, extension registry, CURRENT, Universe Law,
Rights/Economy authority, Wallet, KGEN, deployment, governance, registry,
index, merge or release behavior is created or changed. No candidate is
self-approved, Canonical or production-authorized.

## Handoff

Codex must independently review all seven artifacts. Until that review, the
only valid state is:

`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`
