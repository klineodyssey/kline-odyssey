---
TITLE: "KAIOS Civilization Production Runtime Alpha Architecture"
VERSION: "SPRINT-005-1.0.0"
STATUS: "APPROVED_FOR_IMPLEMENTATION"
IMPLEMENTATION: "SPRINT_005_IN_PROGRESS"
DECISION_ID: "HUMAN-SPRINT-005-CIVILIZATION-PRODUCTION"
SCOPE: "LOCAL_SYNTHETIC_ALPHA"
SOURCE_OF_TRUTH: false
---

# Civilization Production Runtime Alpha

## 1. Product Boundary

Sprint 005 extends the existing World Viewer synthetic simulation. It does not create a new Kernel, replace Life OS, or promote browser state into an authoritative registry.

The product chain is:

```text
Planet Environment
-> Life Organisms and Food Web
-> Agriculture Organisms
-> Supply Chain
-> Factory Organism
-> AI Company Organism
-> Civilization Stage
-> K11520 Listing Candidates
```

All data is public synthetic fixture data. Credits, resources, ownership, listings, DNA summaries, disease states, production, and company finance are local simulation values only.

## 2. Source Audit

| Source | Classification | Sprint 005 use |
|---|---|---|
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Protected CURRENT | Read-only environment and ordered-time constraints |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | CURRENT map data | Read-only K280 context; never used as a mutable production database |
| `KGEN-KAIOS/life/LIFE_OS_ARCHITECTURE_BASELINE.md` | Frozen baseline | Body -> Species OS -> Individual Life OS boundaries |
| `KGEN-KAIOS/life/LIFE_OPERATING_SYSTEM.md` | Frozen architecture | Life-maintenance capabilities and upper-layer mutation prohibition |
| `KGEN-KAIOS/civilization/CIVILIZATION_ECONOMY_ARCHITECTURE_BASELINE.md` | Frozen baseline | Civilization and economy terminology; not modified |
| `KGEN-KAIOS/V8.2/PRODUCTION_STANDARD.md` | Approved architecture source | Input -> process -> output -> inventory pattern |
| `KGEN-KAIOS/V8.2/SUPPLY_CHAIN_STANDARD.md` | Approved architecture source | Producer -> logistics -> warehouse -> retail -> consumer -> recycling |
| `KGEN-KAIOS/V10/runtime/MARKETPLACE_RUNTIME.md` | Approved runtime architecture | Listings require disclosure and review; no real trade |
| `KGEN-KAIOS/V10/runtime/AI_COMPANY_RUNTIME.md` | Company coordination architecture | Name collision avoided; Sprint 005 models a civilization enterprise organism only |

No existing World Viewer module implements the combined ecosystem, factory dependency gate, civilization AI company organism, or K11520 candidate exchange required by this decision.

## 3. Runtime Modules

| Module | Responsibility | Forbidden responsibility |
|---|---|---|
| `ecosystem/ecosystem-runtime.js` | Species populations, trophic roles, energy flow, habitat stress, evolution timeline | Direct Citizen, market, land, or company mutation |
| `agriculture/agriculture-runtime.js` | Crop plots plus farm-organism facilities, inputs, health, disease risk, harvest and storage | Real agriculture advice or biological control |
| `production/production-runtime.js` | Supply nodes, factory organism, dependency gate, material accounting, product lifecycle | Real industrial control or authoritative inventory |
| `enterprise/ai-company-organism-runtime.js` | Company health, finance, workforce, reputation, products, bankruptcy and expansion readiness | KAIOS Company OS, real employment, or real finance |
| `exchange/life-exchange-runtime.js` | K11520 candidate catalog, rights offered, review state and disclosure | Trade execution, securities status, settlement, or automatic listing |
| `civilization/civilization-runtime.js` | Ordered orchestration and privacy-safe projections | Direct modification of frozen baselines or CURRENT sources |

## 4. Cambrian And Species Model

The immutable history chain is:

```text
UNICELLULAR
-> CAMBRIAN_OCEAN
-> FISH
-> AMPHIBIAN
-> REPTILE
-> BIRD
-> MAMMAL
-> PRIMITIVE_HUMAN
-> CIVILIZATION
-> INDUSTRIAL
-> AI_CIVILIZATION
```

The Alpha opens in `AI_CIVILIZATION` and preserves every prior stage as completed lineage. This avoids pretending that a few browser ticks reproduce geological time while still making the full lineage inspectable.

Each synthetic Species population declares:

- stable species identity and evolution stage;
- `body_profile_id`, `species_os_id`, `life_os_profile_id`, and privacy-safe `dna_summary_id`;
- trophic role, food sources, predators and prey;
- habitat and Planet compatibility requirements;
- energy cost, lifecycle, disease risks, health and population;
- optional future evolution target.

The catalog includes bacteria, mushroom, plant and crop producers, insects, fish, amphibian, reptile, bird, livestock, wild mammals and primitive Human lineage. Species definitions are immutable fixture inputs; population state is a versioned local projection.

## 5. Food Web And Conservation

Trophic roles are `PRODUCER`, `CONSUMER`, `PREDATOR`, `OMNIVORE`, and `DECOMPOSER`.

Each ordered environment step performs:

```text
Planet compatibility
-> Producer energy input
-> Consumer demand
-> Predator/prey pressure
-> Decomposer recovery
-> Population health
-> Bounded population revision
```

Invariants:

1. Population, energy, water and resource stores never become negative.
2. Missing required water, oxygen, habitat or food lowers health and then population.
3. A zero-health population cannot grow.
4. Energy passed to consumers cannot exceed available producer, agriculture and stored energy.
5. Decomposition recovers only a bounded fraction of loss.
6. Every step is deterministic, bounded and replay-safe for the same state and input.

## 6. Agriculture Organisms

The Alpha models `MIXED_FARM`, `FISH_FARM`, `PIG_FARM`, `CHICKEN_FARM`, `FRUIT_FARM`, `FOREST`, `VEGETABLE_FARM`, `BEE_FARM`, and `WATER_SYSTEM` as facility organisms.

Each declares a Body/configuration profile, Species OS policy, Life OS maintenance state, input rates, output, cycle time, health, disease risk, capacity and storage target. Water, fertilizer, feed, electricity and maintenance are explicit resources. Missing required input sets the facility to `BLOCKED`, stops progress and degrades health. Ready output must be collected into bounded storage before the next cycle.

This is a game simulation, not farming, veterinary, medical, environmental, or food-safety guidance.

## 7. Supply Chain And Factory

The refrigerator Alpha recipe proves the complete product dependency chain:

```text
Electricity + Water + Engineers + Workers + Equipment
+ Steel + Plastic + Chip + Chemicals + Industrial Gas
+ Transportation + Warehouse + Finance + AI Company
-> Factory Cycle
-> Refrigerator
-> Store Candidate
-> Customer / Repair / Recycle lifecycle
```

Every required node must be `AVAILABLE`, required capacity must remain, material quantities must be sufficient, the factory must be healthy, and its company must not be bankrupt. Any missing requirement produces `BLOCKED` with an explicit `missing_dependencies` list. Production cannot silently invent an input.

Factory state includes level, health, capacity, maintenance, current cycle, material inventory, product inventory, waste and a bounded event history. Products declare factory, supply chain, energy, materials, workers, warehouse, transport, store, customer, repair and recycle references.

## 8. AI Company Organism

The civilization enterprise is not KAIOS Company OS. It is a game entity with:

- Company Life OS health and energy;
- Company DNA summary and evolution revision;
- Human employees and player-owned AI Worker counts;
- assets, products, prototype finance and reputation;
- supply-chain health, production history and maintenance burden;
- `ACTIVE`, `CONSTRAINED`, `DISTRESSED`, `BANKRUPT`, and `EXPANSION_READY` outcomes.

Production records balanced local revenue and cost entries. Bankruptcy stops production; expansion requires finance, reputation, health and supply-chain thresholds. No real employment, company registration, payment, debt, tax, investment or legal status is created.

## 9. Civilization And Exchange

Civilization stages are:

```text
PRIMITIVE_VILLAGE -> TOWN -> CITY -> NATION
-> CIVILIZATION -> PLANET_CIVILIZATION
```

The visible Alpha stage is derived from population, food, energy, housing, production, company health and infrastructure. Money alone cannot advance a stage.

K11520 exposes candidate records for Life Organisms, AI companies, factories, buildings, DNA blueprints, genome licenses, Species variants, technology, service and digital organisms. Each candidate declares rights offered, disclosure, risk, evidence and review status. New candidates default to `CANDIDATE_REVIEW_REQUIRED`; the Alpha has no settlement or legal-securities assertion.

## 10. Persistence And Failure

All mutable state uses versioned browser-storage envelopes with bounded event histories. Invalid or old envelopes fail to fixture defaults. The runtime never rewrites the canonical JSON fixture.

Required fail-closed outcomes include:

- `PLANET_INCOMPATIBLE`
- `FOOD_WEB_CONSTRAINED`
- `AGRICULTURE_INPUT_MISSING`
- `FACTORY_DEPENDENCY_MISSING`
- `FACTORY_MATERIAL_MISSING`
- `COMPANY_BANKRUPT`
- `LISTING_REVIEW_REQUIRED`
- `RUNTIME_DESTROYED`

## 11. Product And Safety Gates

Implementation is complete only when static, strict JSON/JSONL, ES module, ecosystem, agriculture, factory, company, exchange, civilization, browser, responsive, accessibility, performance, secret and protected-path checks pass.

Protected Runtime CURRENT, Life OS baseline, Kernel CURRENT, Universe Map CURRENT, Token Contract, `contracts/`, `wallet/`, `bridge/`, temple 12345 Runtime and private files remain unchanged.
