# KAIOS V8.0 Codex Task Generator

**Purpose:** 讓 Codex 根據玩家資產狀態自動產生 WorkOrder Graph，但不自動執行、不自動 claim、不自動 merge。

## Input Asset States

| Entry | Existing Asset | Primary Missing Modules |
|---|---|---|
| Picture Only | picture | temple blueprint, land, residence, store, economy, governance |
| Land Only | land | zoning, residence, store, temple, app, AI, DNA, listing |
| Residence Only | residence | business type, catalog, payment boundary, marketplace, real-world twin |
| Temple Only | temple | land, residence, store, bank, exchange, app, AI, DNA, governance |
| App Only | app | DNA, runtime, owner/license, marketplace, temple/store binding |
| Real Business Only | business | legal entity, virtual twin, catalog, adapters, compliance, listing |
| Civilization Node | city/civilization | cross-universe, governance audit, marketplace health, risk review |

## WorkOrder Required Fields

Every generated WorkOrder must include:

| Field | Requirement |
|---|---|
| Task ID | Stable ID, e.g. `V8-P4-LAND-RUNTIME` |
| Parent Asset ID | The asset being expanded |
| Owner | Cursor / Claude / Gemini / OpenHands / Human Engineer |
| Reviewer | Codex |
| Priority | P0-P4 |
| Dependencies | Prior WorkOrders or assets |
| Input Files | Existing docs, schema, assets |
| Expected Outputs | Files, reports, schemas, demo state |
| Acceptance Criteria | Concrete checks |
| Protected Paths | Must list protected paths |
| Branch | `cursor-handoff/<Task-ID>` |
| Base Commit | Latest origin/main SHA at claim time |
| Report Path | `KGEN-KAIOS/V8/reports/<Task-ID>_REPORT.md` |
| Legal Review Required | true/false |
| Security Review Required | true/false |
| Status | OPEN / CLAIMED / IN_PROGRESS / REVIEW / DONE / BLOCKED / REJECTED |

## Example: Picture Only

```text
Picture
→ V8-P0 Architecture
→ V8-P1 Temple Blueprint
→ V8-P2 Land Requirement
→ V8-P3 Land Assignment
→ V8-P4 Residence Build
→ V8-P5 Store Build
→ V8-P7 Bank Runtime
→ V8-P8 Exchange 11520 Runtime
→ V8-P9 Real-World Link Review
→ V8-P10 Listing Review
→ V8-P15 Production Readiness
```

## Example: Land Only

```text
Land
→ Zoning
→ Residence
→ Store
→ Temple
→ App Organism
→ AI
→ DNA
→ Economy Runtime
→ Listing Standard
```

## Example: Residence Only

```text
Residence
→ Business Type Decision
→ Inventory Adapter
→ Payment Boundary
→ Marketplace Listing
→ Temple Service Node
→ Real-World Twin
```

## Generation Rules

1. Codex must only generate tasks; Cursor or another Worker executes via handoff branch.
2. The generator must not modify WorkQueue automatically in the V8 Demo.
3. If a task touches brand, payment, tax, financial service, securities, equity, consumer transaction, or real-world goods, mark `Legal Review Required = true`.
4. If a task introduces external adapters, ownership transfer, escrow, or settlement, mark `Security Review Required = true`.
5. If dependency is missing, generate prerequisite WorkOrder instead of skipping the dependency.
6. If player has only a concept image, the first output is Temple Blueprint, not a production temple.
7. No generated task may modify protected paths without explicit human approval.