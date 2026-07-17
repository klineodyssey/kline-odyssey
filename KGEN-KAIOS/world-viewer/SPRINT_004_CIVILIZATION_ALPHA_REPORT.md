# KAIOS Civilization Alpha - Sprint 004 Report

## Decision

- Decision: `HUMAN-SPRINT-004-001`
- Task: `KAIOS-WV-SPRINT-004`
- Branch: `codex/world-viewer-sprint-004-civilization`
- Product stage: `CIVILIZATION_ALPHA`
- Architecture: frozen and unchanged
- Data: public synthetic, local and non-authoritative

## Product Result

Sprint 004 turns the Digital Earth Viewer into a bounded living-world simulation. A mock player can enter the Starter Parcel, inspect Life OS, advance world time, follow a Citizen schedule, watch Wukong 001 work autonomously, plant and harvest a crop, sell the harvest, buy food, and inspect derived city health.

The executable remains:

```text
KGEN-KAIOS/world-viewer/index.html
```

## Daily Life

The Citizen schedule is deterministic and complete:

```text
Sleep -> Wake -> Breakfast -> Work -> Lunch -> Study -> Shopping
-> Exercise -> Dinner -> Entertainment -> Sleep
```

Life OS remains responsible for Health, Hunger, Thirst and Fatigue. Citizen Runtime owns Mood, Knowledge, Money, Housing, Relationship and Safety. The Civilization view presents both domains together without moving market or company authority into Life OS.

## AI Worker

`Wukong 001` runs a synthetic daily shift across:

```text
REST -> RECHARGE -> CLOCK_IN -> FARM -> BUILD -> RECHARGE
-> PATROL -> FARM -> WORK -> CLOCK_OUT -> REST
```

Energy, fatigue, attendance, production and bounded event history are validated. No AI provider, background service or real payroll is connected.

## Food And Resources

The resource catalog contains:

`RICE`, `VEGETABLE`, `FRUIT`, `FISH`, `PIG`, `CHICKEN`, `EGG`, `MILK`, `WATER`, `WOOD`, `STONE`, `IRON`, `ELECTRICITY`.

The local marketplace exposes Food, Furniture, Tools, Seeds, Building Materials, Medical, Energy and Water. Buy, sell, consume, production and transport events use a balanced prototype credit ledger. Real KGEN, wallet and settlement paths do not exist in this implementation.

## Agriculture

The Starter Parcel includes three synthetic plots. Rice, vegetables and fruit use bounded seed inventory, water, energy, growth time and AI assistance. State transitions are:

```text
EMPTY -> GROWING -> READY -> HARVESTED
```

Harvest enters the bounded farm warehouse. A sale explicitly transfers warehouse stock to player inventory and then to the prototype market.

## City Runtime

City metrics are derived projections, never a Source of Truth:

- Population, employment and unemployment.
- Food, energy, housing and roads.
- Pollution and happiness.
- `STABLE`, `THRIVING`, `STRAINED` and `AT_RISK` status bands.

## Time

The synthetic calendar exposes minute, hour, day, week, season and year. The UI provides one-hour, one-day and controlled automatic advancement. Every runtime consumes the same clock snapshot.

## Implementation Diff

- Added Simulation Clock and Citizen Daily Runtime.
- Added autonomous AI Worker Daily Runtime.
- Added prototype Economy, Agriculture and derived City runtimes.
- Added a Civilization orchestrator with a bounded event history.
- Added Today, Farm, Market and City Inspector tabs.
- Added desktop and mobile world-time controls.
- Fixed responsive Canvas sizing by using the Viewer container during resize.
- Added Civilization integrity and browser product gates.

## Architecture Diff

None. Frozen World Viewer, Land, Civilization, Runtime CURRENT and Universe Map files were not modified. All additions are product modules under the approved World Viewer implementation boundary.

## QA

| Gate | Result |
|---|---|
| Static acceptance | `PASS` - 30 files / 34 local references |
| Digital Earth integrity | `PASS` |
| Civilization integrity | `PASS` |
| Browser Product QA | `128 PASS / 0 FAIL / 0 SKIP` |
| Visual regression | `PASS` - 8 device/theme baselines |
| Responsive and safe area | `PASS` |
| Accessibility | `PASS` |
| Broken links and console | `PASS` |
| Protected paths | `0` |

## Performance

| Metric | Observed worst case | Budget status |
|---|---:|---|
| First usable | `793.2 ms` | `PASS` |
| Render time | `0.9 ms` | `PASS` |
| Renderer FPS | `57.8` | `PASS` |
| JS heap | `4,631,328 bytes` | `PASS` |
| Critical transfer | `501,614 bytes` | `PASS` |

## Memory Bounds

After extended simulation:

- Civilization events: maximum `180`.
- Clock events: maximum `120`.
- Citizen events: maximum `160`.
- AI Worker events: maximum `160`.
- Economy ledger: maximum `300`.
- Agriculture events: maximum `180`.
- City history: maximum `120`.

## Safety Boundary

- No real GPS or KYC.
- No real land ownership mutation.
- No wallet, Token Contract or KGEN settlement.
- No backend write service.
- No Runtime CURRENT or Universe Map modification.
- No frozen baseline modification.
- No Company or Governance Runtime additions.

## Evidence

- `tests/evidence/sprint-004/qa-report.json`
- `tests/evidence/sprint-004/performance-report.json`
- `tests/evidence/sprint-004/civilization-integrity-report.json`
- `tests/evidence/sprint-004/screenshots/`
- `tests/evidence/sprint-004/diffs/`
- `tests/baselines/sprint-004/`

## Sprint 005 Candidate

Continue product-first with production chains and citizen agency: seeded crop rotation, NPC purchases, warehouse-to-market transport, job assignment and bounded save/export recovery. Keep all real identity, finance and authoritative registry work out of scope.
