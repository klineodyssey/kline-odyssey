# KAIOS Civilization Genesis Alpha - Sprint 004 Report

## Decision

- Decision: `HUMAN-SPRINT-004-CIVILIZATION-GENESIS`
- Task: `KAIOS-WV-SPRINT-004-GENESIS`
- Product stage: `CIVILIZATION_GENESIS_ALPHA`
- Architecture: frozen and unchanged
- Data: public synthetic, local and non-authoritative

## Product Result

The first mock player session now follows a fail-closed Civilization Genesis flow:

```text
Universe Boot
-> Planet Check
-> Species Check
-> Life OS Boot
-> Starter Resources
-> Starter Parcel
-> Enter World
```

The player cannot enter Earth K280 or run Civilization time before Genesis is complete. A completed birth is restored from bounded local storage on the next session.

## Genesis Fortune

K12345 Wukong Fortune Temple offers exactly one local prototype choice:

`1`, `8`, `88`, `188`, `388`, or `888` prototype KGEN.

The claim uses a deterministic claim ID, a balanced prototype treasury transfer and an immutable local Life OS birth record. A repeated or conflicting claim fails closed. It is not an airdrop, recurring income, wallet transfer, Token transaction or real KGEN settlement.

## Starter Survival Pack

The one-time pack contains Water, Simple Food, Basic Clothes, Simple Bed, Simple Tools, Starter Seed and Starter Backpack. The existing synthetic home building is linked as the Starter House. Resources are recorded in both the bounded Life OS inventory projection and the local prototype economy inventory without changing a canonical registry.

## Planet Environment Runtime

The product fixture now includes validated profiles for:

- Earth: human compatible at K280.
- Moon: base required, no breathable atmosphere and high radiation.
- Mars: base required, thin carbon-dioxide atmosphere and ice water.
- Jupiter: gas giant, no solid settlement surface and not human-survivable.
- Future Planet: compatibility remains `UNKNOWN` and fails closed.

Every profile contains Atmosphere, Gravity, Temperature, Pressure, Water, Radiation, Magnetic Field, Day Length, Year Length, Native Species, Food Availability, Energy, Life Compatibility, Resource Rules, Civilization Rules and Travel Rules. This is a World Viewer product fixture, not a modification of Universe Physics Database CURRENT.

Mortal survival requires Water, Calories, Oxygen, Sleep and Health. Immortal nutrition modes are supported by the contract but remain disabled unless an individual Planet profile explicitly enables Energy Cultivation, Immortal Pill or Spiritual Energy; Earth enables none and therefore fails such a request closed.

## Food And Life Integrity

Life OS now tracks Oxygen in addition to Health, Food, Water and Energy. Planet compatibility supplies the oxygen environment contract. An environment without oxygen lowers the local Life state and can reduce Health; Earth replenishes oxygen. Sleep and existing metabolism remain bounded.

## Implementation Diff

- Added `planet/planet-environment-runtime.js`.
- Added `genesis/genesis-runtime.js` and a responsive Genesis Boot screen.
- Added an idempotent one-time Genesis bundle transfer to the prototype economy ledger.
- Added a Life OS Genesis birth record, starter inventory and Oxygen metabolism.
- Added a persistent Genesis tab to the Civilization Inspector.
- Added desktop/mobile Genesis browser gates and CI integrity enforcement.

## Architecture Diff

None. Runtime CURRENT, Universe Map CURRENT, Token Contract and all frozen baselines remain unchanged. Planet records are synthetic implementation adapters under the existing World Viewer product boundary.

## QA

| Gate | Result |
|---|---|
| Static acceptance | `PASS` |
| Digital Earth integrity | `PASS` |
| Civilization integrity | `PASS` |
| Civilization Genesis integrity | `PASS` |
| Browser Product QA | `133 PASS / 0 FAIL / 0 SKIP` |
| Visual regression | `PASS` across 8 device/theme baselines |
| Genesis mobile gate | `PASS` |
| Accessibility / responsive / safe area | `PASS` |
| Broken links / console errors | `PASS` |
| Protected paths | `0` |

## Performance

| Metric | Observed worst case | Budget | Result |
|---|---:|---:|---|
| First usable | `721.5 ms` | `2500 ms` | `PASS` |
| Renderer time | `0.6 ms` | `50 ms` | `PASS` |
| Renderer FPS | `59.5` | `30` minimum | `PASS` |
| JS heap | `4,006,804 bytes` | `167,772,160 bytes` mobile | `PASS` |
| Critical transfer | `550,560 bytes` | `1,572,864 bytes` | `PASS` |

## Safety Boundary

- No real KGEN, wallet, contract or bank integration.
- No real GPS, KYC or legal land title.
- No canonical Planet Database or ownership mutation.
- No Runtime CURRENT, Universe Map CURRENT or frozen baseline modification.
- The Starter Parcel and all Planet profiles remain public synthetic fixtures.

## Evidence

- `tests/evidence/sprint-004-genesis/qa-report.json`
- `tests/evidence/sprint-004-genesis/performance-report.json`
- `tests/evidence/sprint-004-genesis/genesis-integrity-report.json`
- `tests/evidence/sprint-004-genesis/civilization-integrity-report.json`
- `tests/evidence/sprint-004-genesis/screenshots/genesis-mobile.png`

## Next Product Candidate

Sprint 005 can add a bounded survival tutorial: consume the Starter Pack, plant the first seed, complete the first work mission and unlock the first building proposal. Real identity, settlement and authoritative Planet Database writes remain separate approval gates.
