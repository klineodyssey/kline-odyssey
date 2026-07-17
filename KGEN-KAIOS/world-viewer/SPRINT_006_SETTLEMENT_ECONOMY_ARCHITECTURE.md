# Sprint 006 Settlement And Economy Product Contract

## Decision

- Human Decision: `HUMAN-SPRINT-006-SETTLEMENT-ECONOMY`
- Task: `KAIOS-WV-SPRINT-006`
- Scope: executable synthetic Alpha under the frozen World Viewer architecture
- Base: `3c6f9df60cad30d5b54b07003dac0af60e420ced`

## Source Audit

Sprint 006 extends the existing `economy/economy-runtime.js`, `city/city-runtime.js` and `civilization/civilization-runtime.js`. It does not create a second market, ledger or Civilization orchestrator. New bounded modules own only capabilities that do not yet exist:

- `settlement/population-runtime.js`: Family, Citizen demographics, Birth, Education, Employment, Marriage, Inheritance and the Village-to-Civilization hierarchy.
- `settlement/logistics-runtime.js`: routes, warehouse capacity, transportation, Import/Export simulation, pollution and ecology recovery.
- `settlement/settlement-runtime.js`: Salary, Tax, Rent, Mortgage proposal, Insurance proposal and gated asset-settlement requests.

## Economy Layers

### Layer 1: KAIOS Credit

`KAIOS_CREDIT` is the only executable currency in this Alpha. Food, wages, rent, construction, AI Company operations and marketplace activity use a balanced local ledger. All accounts remain public synthetic fixtures.

### Layer 2: KGEN

KGEN is represented as an official blockchain asset reference. No wallet, contract, chain RPC or Token transfer is connected. The initial reference is `1 KGEN = 1 KAIOS Credit`; it is explicitly mutable only through future Governance Runtime, is not a peg and provides no guaranteed return.

### Layer 3: External Settlement

USDT, TWD and future fiat references can create `PENDING_OFFICIAL_SETTLEMENT` requests only. No quote is executable and no external payment provider is connected.

## Settlement Hierarchy

```text
Family
-> Citizen
-> Village
-> Town
-> City
-> Nation
-> Civilization
```

The population registry records synthetic families, marriage consent, births, education, employment and inheritance events. Birth requires housing, food, water and ecological capacity. Inheritance transfers KAIOS Credit only through the balanced Economy ledger.

## Product Flows

```text
Work -> Salary -> Tax -> Rent -> KAIOS Credit Ledger
Farm / Factory / AI Company -> Product -> Logistics -> Trade -> KAIOS Credit
Production / Transport -> Pollution -> Ecology Recovery
KGEN / USDT / TWD Request -> Official Settlement Gate -> Pending Review
```

Mortgage and Insurance remain Architecture-only product records. They cannot create debt, interest, coverage, payout or a real financial obligation.

## Integrity Invariants

1. KAIOS Credit supply remains balanced across all transfers.
2. KGEN 0.30% Token tax is metadata-only and unchanged.
3. Reference rates cannot be changed by the client.
4. KGEN and external requests never mutate KAIOS Credit balances.
5. Population, warehouse stock and environmental metrics never become negative.
6. A birth requires capacity; a marriage requires consent; inheritance requires a recorded lifecycle event.
7. Logistics cannot dispatch beyond route or warehouse capacity.
8. Pollution is bounded and ecology recovery consumes local synthetic resources.
9. All event histories are bounded and append-only within the session envelope.
10. Runtime CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS baseline, Token Contract and Human Main remain unchanged.

## UI Contract

The Civilization Inspector adds `Settlement` and `Economy` tabs. Desktop keeps the right Inspector; mobile keeps the full-screen bottom-sheet behavior. Actions must expose their synthetic or review-only state and remain keyboard/touch accessible.

## Review Gates

- Static and strict JSON/JSONL validation.
- ES module syntax and imports.
- Existing Runtime, Genesis, Production and Civilization integrity.
- New Settlement/Economy integrity and long-run bounds.
- Desktop, tablet, Android and iPhone Product QA.
- Accessibility, responsive layout, safe area, screenshot diff and performance.
- Secret and protected-path checks.

