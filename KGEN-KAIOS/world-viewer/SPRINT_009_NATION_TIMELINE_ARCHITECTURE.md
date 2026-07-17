# Sprint 009 Nation and Timeline Product Contract

## Decision

- Human Decision: `HUMAN-SPRINT-009-NATION-TIMELINE`
- Task: `KAIOS-WV-SPRINT-009`
- Scope: executable synthetic Alpha under the frozen World Viewer architecture
- Base: `a4ac488b8e269c7c8cb4da48b41c81d3df83d0ef`

## Source Audit

Sprint 009 extends the existing Civilization Alpha. It does not replace Settlement, Governance, Biology, Planet, Land, Life OS, Universe Physics, or the historical Universe Map.

| Source | Authority | Imported boundary |
|---|---|---|
| `KGEN-KAIOS/world-viewer/settlement/settlement-runtime.js` | Current product runtime | KAIOS Credit synthetic ledger and official settlement request boundary |
| `KGEN-KAIOS/world-viewer/governance/government-runtime.js` | Current product runtime | Government hierarchy, Citizen rights, evidence, and review |
| `KGEN-KAIOS/world-viewer/settlement/population-runtime.js` | Current product runtime | Population and settlement hierarchy |
| `KGEN-KAIOS/world-viewer/planet/planet-environment-runtime.js` | Current product runtime | Planet compatibility and environmental profiles |
| `KGEN-KAIOS/world-viewer/biology/biology-runtime.js` | Current product runtime | Cambrian and Civilization evolution state |
| `KGEN-KAIOS/civilization/CIVILIZATION_ECONOMY_ARCHITECTURE_BASELINE.md` | Frozen architecture | Economy, governance, rights, and simulation-only boundaries |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Protected CURRENT | Read-only universe reference; unchanged |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | Historical required source | Read-only historical coordinates; not promoted or repaired |

## Runtime Ownership

- `nation/nation-runtime.js` owns Nation candidacy, the six founding requirements, sovereignty, Government V2 policies, and cross-module composition.
- `nation/public-finance-runtime.js` owns governance-adjustable tax policy, invoices, a balanced prototype treasury ledger, budget, reserve, emergency reserve, public investment, and Official Currency policy.
- `nation/resource-economy-runtime.js` owns bounded Planet Resource inventories and synthetic import, export, and exchange records.
- `nation/diplomacy-runtime.js` owns reviewed synthetic Alliance, Trade Agreement, Embassy, Visa, Peace Treaty, and Sanction proposals.
- `timeline/pocket-time-ufo-runtime.js` owns the unique Timeline vehicle blueprint, technology, material, civilization, construction, and integrity gates.
- `timeline/timeline-runtime.js` owns era catalog, research progress, travel authorization, append-only journeys, and return-to-origin behavior.

## Nation Founding Contract

A Nation begins as `NATION_CANDIDATE`. It can become `ESTABLISHED_SYNTHETIC` only when all six independent requirements pass:

1. `POPULATION`: at least one registered synthetic Citizen.
2. `TERRITORY`: at least one referenced synthetic Parcel.
3. `GOVERNMENT`: a reviewed Nation-level government exists.
4. `SOVEREIGNTY`: a synthetic declaration has evidence and review.
5. `TREASURY`: a balanced prototype treasury is initialized.
6. `OFFICIAL_CURRENCY`: a non-token synthetic currency policy is active.

Founding cannot create real sovereignty, alter land ownership, grant legal authority, or mutate any CURRENT source.

## Government V2 Contract

Government V2 exposes policy records for tax, budget, public spending, military simulation, diplomacy, immigration, trade, infrastructure, and emergency response. Every policy has version, evidence, review, effective period, authority scope, and simulation-only status. Military policy contains readiness and defense allocation only; it cannot contain real targets, weapons, or operational instructions.

## Tax and Treasury Contract

The tax catalog contains Income, Sales, Business, Property, Land, Vehicle License, Fuel, Import Tariff, Export Tariff, Resource Royalty, Water Usage, and Carbon taxes or fees. Runtime code contains no fixed tax rate. Initial `rate_bps`, minimum, maximum, and step values come from the synthetic fixture and can be changed only through `setTaxRate` with evidence and governance review.

All Alpha invoices use KAIOS Credit. Every settled invoice writes equal debit and credit entries. Treasury balances are derived from the append-only ledger and cannot become negative. KGEN, external settlement, the KGEN 0.30% tax, token contracts, real money, and legal tax collection remain outside this Runtime.

## Official Currency Contract

Each Nation may configure one synthetic Official Currency with code, name, issuer, supply policy, exchange policy, and policy version. It is a Civilization simulation unit, not KGEN and not legal tender. Currency policy cannot mint KGEN, change settlement rates, promise returns, or execute external exchange.

## Resource Economy Contract

The Planet Resource catalog includes Water, Forest, Stone, Iron, Copper, Gold, Oil, Gas, Rare Earth, Food, and Energy. Inventory is finite, bounded, versioned, and conservation checked. Import, export, and exchange actions require counterparties, quantities, policy permission, logistics capacity, evidence, and review. Alpha actions update only local synthetic inventories and records.

## Diplomacy Contract

Alliance, Trade Agreement, Embassy, Visa, Peace Treaty, and Sanction are reviewed synthetic agreements. Each record includes parties, scope, rights, obligations, evidence, review, status, effective period, termination rule, and non-real-world authority. No agreement can grant land ownership, execute real sanctions, or bypass Human authority.

## Timeline Contract

The Civilization Timeline contains Cambrian, Ancient Civilization, Stone Age, Bronze Age, Iron Age, Industrial Age, Information Age, AI Civilization, and Interstellar Civilization. Timeline Travel is never an initial player capability and cannot be invoked by changing a date or UI state.

Every travel request must pass:

1. target-era research requirement;
2. special technology requirement;
3. special material manifest;
4. minimum Civilization score and stage;
5. operational `POCKET_TIME_CLOAKED_UFO`;
6. vehicle checksum and energy reserve;
7. evidence, review, and bounded journey authorization.

The Alpha records isolated simulation journeys. It does not rewrite history, mutate the canonical world, create paradoxes, or claim real time travel.

## Pocket Time Cloaked UFO Contract

The Pocket Time Cloaked UFO is the sole Timeline transport type. It progresses through `BLUEPRINT_LOCKED`, `RESEARCH_READY`, `MATERIAL_READY`, `CONSTRUCTION_READY`, `BUILT`, and `OPERATIONAL`. Missing technology, material, civilization level, energy, checksum, or authorization fails closed. The vehicle is synthetic and does not modify the protected UFO Runtime.

## Product UI Contract

The Civilization Inspector adds `Nation` and `Timeline` tabs. Nation shows founding readiness, policies, tax controls, treasury, Official Currency, resources, and diplomacy. Timeline shows the era track, research, vehicle gates, material manifest, current simulated era, and journey history. Controls are accessible on desktop and mobile, retain current touch sizes, and expose disabled reasons rather than silently failing.

## Safety Invariants

1. All actions are local, synthetic, reversible, and non-authoritative.
2. Tax rates are governance data, never hardcoded Runtime constants.
3. Treasury and resources obey conservation and bounded-history checks.
4. Official Currency cannot alter KGEN, Token Contract, 0.30% tax, or external settlement.
5. Diplomacy has no real government, border, visa, sanction, or military authority.
6. Timeline Travel requires the unique vehicle and all gates; direct travel is rejected.
7. Timeline journeys never mutate canonical history, Universe Map, Land ownership, or Life identity.
8. Universe Physics CURRENT, Kernel CURRENT, Life OS CURRENT, Cambrian Runtime CURRENT, Settlement CURRENT, Governance CURRENT, Universe Map CURRENT, Token Contract, and protected paths remain unchanged.

## Review Gates

- Strict JSON and JSONL validation.
- ES module syntax and import-graph validation.
- Existing Runtime, Genesis, Production, Settlement, Governance, Biology, and Civilization integrity suites.
- New Nation founding, tax configuration, ledger balance, resource conservation, diplomacy, vehicle, and Timeline integrity tests.
- Browser Product QA on desktop, tablet, Android, and iPhone.
- Accessibility, responsive layout, safe area, screenshot diff, performance, broken links, console, secret, and protected-path checks.

