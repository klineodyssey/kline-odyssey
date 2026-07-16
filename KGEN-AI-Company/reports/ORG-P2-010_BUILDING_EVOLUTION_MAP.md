# ORG-P2-010 — Building Evolution Map: House → Shop / Bank / Warehouse / Exchange / Temple Service Node

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-010 |
| Date | 2026-07-16 |
| Base Commit | `89f3c35` (`docs(governance): publish genesis DNA review candidate`) |
| Branch | `cursor-handoff/ORG-P2-010-20260716` |
| Author Worker ID | cursor-01 |
| Worker Agent ID | cursor-agent-0013 |
| Session ID | SESSION-20260716-14-EPHEMERAL |
| Spawned By | 本尊 |
| Supersedes | `848d9464` (rejected 2026-07-13; missing claim lease) |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | Building |
| Start Status | OPEN (main WORK_QUEUE; Cursor did not modify WORK_QUEUE) |
| End Status | REVIEW (handoff submitted; Codex closeout only) |

---

## Summary

**PASS.** Building evolution from House through Shop, Bank Branch, Warehouse, Exchange Node, and Temple Service Node is **Canon-consistent** when read with Organization V2 standards and KAIOS V8 lifecycle schemas. No hard contradictions block implementation planning. Three **wording gaps** (W1–W3) and two **technical-debt items** are documented for follow-up proposals only.

---

## Files Read

| File | Purpose |
|------|---------|
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Worker boot gate |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Execution protocol |
| `KGEN-AI-Company/CURSOR_REPORTING_RULES.md` | Required report fields |
| `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md` | WorkOrder standard |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Task definition (read-only) |
| `KGEN-Organization/Building/README.md` | Building office scope |
| `KGEN-Organization/Building/ROLE.md` | Authority boundary |
| `KGEN-Organization/Building/RESPONSIBILITY.md` | Required outputs |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected path rules |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable Canon |
| `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md` | House §3, shop/bank/exchange/warehouse defs |
| `KGEN-Organization/Land/KGEN_LAND_STANDARD.md` | Construction and city composition |
| `KGEN-Organization/Economy/KGEN_ECONOMY_LOOP.md` | Economy loop and house evolution |
| `KGEN-KAIOS/V8/KAIOS_V8_ASSET_LIFECYCLE.md` | Runtime stage matrix |
| `KGEN-KAIOS/V8/schemas/residence.schema.json` | `evolution_options` schema |
| `KGEN-KAIOS/examples/organisms/land-wild-land.organism.json` | Wild-land connection targets |

## Files Modified

| File | Change |
|------|--------|
| `KGEN-AI-Company/reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md` | Created (this report) |
| `KGEN-AI-Company/reports/handoffs/ORG-P2-010/HANDOFF.md` | Created |
| `KGEN-AI-Company/reports/handoffs/ORG-P2-010/handoff.json` | Created |

**WORK_QUEUE:** Not modified (per spawn directive and prior rejection lesson).

## Protected Paths Checked

All protected paths confirmed untouched: `contracts`, `K線西遊記/temples/12345`, `wallet`, `bridge`, `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`, `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`, `docs/physics/final-whitepaper/`, `KGEN/contracts/KGEN_Token_V7_5_2.sol`.

---

## Building Evolution Map

### 1. Foundation Rules (Machine Canon)

| Rule | Source |
|------|--------|
| One land, one house. | `canon_rules[2]` |
| One house, one shop. | `canon_rules[3]` |
| A house may evolve into a shop, exchange node, or temple service node. | `canon_rules[4]` |
| 11520 Huaguo Mountain Exchange is the marketplace for App, Land, Temple, AI, DNA, and civilization assets. | `canon_rules[12]` |
| Houses, shops, temples, and exchanges can evolve and grow. | `canon_rules[14]` |

### 2. Organization Standard Extensions (L2 Org, compatible with Canon)

| Source | House may evolve into |
|--------|----------------------|
| `KGEN_TEMPLE_STANDARD.md` §3 | shop, exchange counter, **bank branch**, **warehouse**, temple service node, civic facility |
| `KGEN_ECONOMY_LOOP.md` §6 | shop, exchange counter, temple service node, warehouse, bank branch, civic utility |
| `KGEN_LAND_STANDARD.md` §6 | houses, shops, service nodes, warehouses, temple branches (via construction) |

Org standards extend Machine Canon with bank branch and warehouse as **direct** house evolution targets. This is an **operating projection**, not a hard conflict: Canon growth rule (`canon_rules[14]`) already permits shops (and by extension their financial/logistics roles) to evolve.

### 3. Canonical Evolution Tree (Building Office scope)

```text
Wild Land
  └─ Land (one parcel)
       └─ House [L1 — mandatory first civilized organ; one per land]
            │
            ├─ Shop [L2a — commerce organ; "one house, one shop"]
            │    ├─ Bank Branch [L3 — treasury, savings, reward interfaces]
            │    ├─ Warehouse [L3 — inventory, materials, DNA packages]
            │    └─ Exchange Node [L3 — 11520-compatible listing point on parcel]
            │
            ├─ Temple Service Node [L2b — temple-layer service without full Temple organ]
            │    └─ Temple [L4 — full living civilization organ; Temple dept governance]
            │
            └─ (Org-only direct paths from House)
                 ├─ Bank Branch [L2c — when finance-first, not commerce-first]
                 ├─ Warehouse [L2d — when logistics-first]
                 └─ Exchange Node [L2e — Canon permits direct; Org aligns]
```

**11520 distinction:** The civilization-level **11520 Huaguo Mountain Exchange** is the marketplace; an **Exchange Node** on land is a parcel-level listing/participation point that connects to 11520 rules — not the Exchange itself.

### 4. Node Definitions

| Node | Level | Governing Dept | Function | Canon / Org Basis |
|------|-------|----------------|----------|-------------------|
| **House** | L1 | Building | First building organ; residential or base structure | `canon_rules[2]`; Temple §3 |
| **Shop** | L2a | Building | Sells goods, Apps, AI, DNA, land rights, temple services | `canon_rules[3]`; Temple §5; Economy §7 |
| **Bank Branch** | L2c / L3 | Building + Economy | Treasury, savings interfaces, reward distribution; must not contradict KGEN token facts | Temple §6; Economy loop |
| **Warehouse** | L2d / L3 | Building | Stores resources, materials, equipment, marketplace inventory | Temple §8 |
| **Exchange Node** | L2e / L3 | Building + Economy | Parcel listing point for 11520 marketplace assets | `canon_rules[4,12]`; Temple §7 |
| **Temple Service Node** | L2b | Building → Temple | Commercial/service layer templeized; connects to Temple runtime | `canon_rules[4]`; KAIOS V8 lifecycle |
| **Temple** | L4 | Temple | Full living civilization organ (identity, AI, DNA, Portal) | `canon_rules[0,1,13]`; Temple §1 |

### 5. KAIOS V8 Runtime Alignment

KAIOS V8 Asset Lifecycle defines a **runtime stage chain** (not identical ordering to Building L-levels):

```text
Residence → Store → Market → Bank → Exchange → Temple Service Node → City Node → …
```

| Building Map | KAIOS V8 Stage | Alignment |
|--------------|----------------|-----------|
| House | Residence | ✅ 1:1 |
| Shop | Store | ✅ 1:1 |
| (multi-shop aggregate) | Market | ⚠️ City-scale; not a single-house evolution |
| Bank Branch | Bank | ✅ |
| Exchange Node | Exchange | ✅ (parcel node vs civilization 11520 center) |
| Temple Service Node | Temple Service Node | ✅ |
| Temple (full organ) | (above Temple Service Node) | ✅ L4 in building map |

`residence.schema.json` lists `evolution_options`: Store, bank branch, warehouse, factory, temple service node — consistent with Org standards; **factory** appears in schema but not in Building office README scope (out-of-scope observation).

### 6. Evolution Path Matrix

| From → To | Machine Canon | Org Standard | Skip Allowed? | Notes |
|-----------|---------------|--------------|---------------|-------|
| Land → House | ✅ Required | ✅ | N/A | Mandatory first organ |
| House → Shop | ✅ Explicit | ✅ | — | Standard commerce path |
| House → Temple Service Node | ✅ Explicit | ✅ | — | Service-first path |
| House → Exchange Node | ✅ Explicit | ✅ | — | Canon allows direct |
| House → Bank Branch | ⚠️ Via growth rule | ✅ Explicit | Org allows direct | **W1** |
| House → Warehouse | ⚠️ Via growth rule | ✅ Explicit | Org allows direct | **W2** |
| Shop → Bank Branch | ✅ Growth rule | ✅ | No skip from Land | Implied commerce → finance |
| Shop → Warehouse | ✅ Growth rule | ✅ | No skip from Land | Implied commerce → logistics |
| Shop → Exchange Node | ✅ Growth rule | ✅ | No skip from Land | Commerce → listing |
| Temple Service Node → Temple | ✅ Temple rules | ✅ | Requires Temple dept review | L4 handoff |
| Any → Civic facility | — | ✅ Org only | — | Building scope edge; not in task list |

### 7. Building Office Coverage Check

Building position: *Building 管理民宅、商店、銀行、倉庫、交易所節點與實體映射.*

| Scope term | Mapped node | Status |
|------------|-------------|--------|
| 民宅 (House) | House L1 | ✅ |
| 商店 (Shop) | Shop L2a | ✅ |
| 銀行 (Bank) | Bank Branch | ✅ |
| 倉庫 (Warehouse) | Warehouse | ✅ |
| 交易所節點 (Exchange Node) | Exchange Node | ✅ |
| Temple Service Node | L2b (Building → Temple handoff) | ✅ documented |
| 實體映射 | Physical Link (Temple §12) | ✅ noted |

---

## Checks Run

| # | Check | Method | Result |
|---|-------|--------|--------|
| 1 | Canon consistency of all seven task paths | Cross-read Canon JSON + Org standards | **PASS** — no hard conflict |
| 2 | Skip-level from Land (Land → Exchange/Temple without House) | Canon sequence review | **PASS** — prohibited; not in map |
| 3 | 11520 Exchange vs Exchange Node | Terminology review | **PASS** — distinction documented |
| 4 | Building office scope coverage | README/ROLE vs map | **PASS** — all five types covered |
| 5 | KAIOS V8 schema alignment | `residence.schema.json` + lifecycle | **PASS** — evolution_options match |
| 6 | Protected path diff | `git diff` against base | **PASS** — zero protected edits |
| 7 | WORK_QUEUE untouched | spawn directive | **PASS** — read-only |
| 8 | Single-task purity | branch scope | **PASS** — ORG-P2-010 only |

---

## Problems Found

| ID | Problem | Severity | Type |
|----|---------|----------|------|
| W1 | Machine Canon lists three direct house paths (shop, exchange, temple service node); Org adds bank branch and warehouse as direct paths without Canon JSON update | Low | Wording / hierarchy |
| W2 | "One house, one shop" vs direct House→Warehouse/Bank: relationship between shop cardinality and alternate L2 paths not spelled out | Low | Ambiguity |
| W3 | Temple Service Node lacks a dedicated Building or Temple subsection beyond one-line mentions | Low | Documentation gap |
| TD1 | No document defines level-up preconditions (KGEN stake, governance, resources) per transition | Low | Technical debt |
| TD2 | KAIOS V8 `factory` in residence schema is outside Building README scope — ownership unclear | Low | Scope boundary |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Frontend/runtime implements skip-level evolution (Land→Exchange) | Medium | Enforce L1 House gate in runtime validators |
| W1/W2 ambiguity causes duplicate shop+bank on one house | Medium | Future WorkOrder for cardinality rules |
| Temple L4 crossed without Temple dept review | Medium | Existing cross-dept handoff protocol |
| KAIOS Market stage conflated with single-house Exchange Node | Low | Document city-scale vs parcel-scale in Building spec |

---

## Technical Debt

1. Level-up preconditions (resources, governance triggers, KGEN costs) undefined for each transition.
2. Temple Service Node needs a short dedicated spec under `Building/` or `Temple/`.
3. Machine Canon JSON could add bank branch / warehouse to `canon_rules[4]` if Codex promotes Org wording to L1.

---

## Evolution Opportunities

- `KGEN_BUILDING_LEVEL_REQUIREMENTS.md` — preconditions per transition (PROPOSED).
- Machine-readable evolution graph JSON for frontend/temple loaders (PROPOSED).
- Align KAIOS V8 stage matrix with Building L-level labels in a single index row.

---

## Research Direction

- Compare 11520 exchange listing rules with parcel Exchange Node minimum viable fields.
- Survey `K線西遊記/temples/*/index.html` for implicit building-type UI patterns (read-only; no protected edits).

---

## Suggested WorkOrders (Status: PROPOSED)

| Suggested ID | Scope | Reason |
|--------------|-------|--------|
| ORG-P2-010A | Define level-up preconditions per building evolution step | TD1 |
| ORG-P2-010B | Add Temple Service Node dedicated description | W3 / TD2 |
| ORG-P2-010C | Resolve W1/W2: Canon JSON vs Org direct-path cardinality | W1, W2 |

---

## Do Not Do

- Do not modify runtime modules, temple protected paths, contracts, or Canon bodies.
- Do not edit live WORK_QUEUE (Cursor forbidden for this spawn).
- Do not add economy token facts outside Canon.

## Blockers

None.

## Recommendation

**PASS — submit for Codex review.** The evolution map covers House → Shop, Bank Branch, Warehouse, Exchange Node, and Temple Service Node with cross-source alignment. Follow-up items are PROPOSED only.

## Need Codex Review

Yes.

## Need Human Decision

No.

---

## Session / Multi-Window Context

| Field | Value |
|---|---|
| Registry worker | `cursor-01` |
| This agent | `cursor-agent-0013` |
| Session | `SESSION-20260716-14-EPHEMERAL` |
| Spawn authority | 本尊 |
| Prior rejected tip | `848d9464` — superseded by this handoff |
| Atomic claim registry | NOT_IMPLEMENTED — claim recorded in `handoff.json` |
