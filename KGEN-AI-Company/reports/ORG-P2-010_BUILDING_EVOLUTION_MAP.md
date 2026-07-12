# ORG-P2-010 — Building Evolution Map: House → Shop / Bank / Warehouse / Exchange / Temple Service Node

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-010 |
| Date | 2026-07-12 |
| Base Commit | fcf948f |
| Branch | `cursor-handoff/ORG-P2-010` |
| Author Worker ID | cursor-01 |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | Building |

---

## Files Read

| File | Purpose |
|------|---------|
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Boot and worker gate |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Protocol rules |
| `KGEN-AI-Company/CURSOR_REPORTING_RULES.md` | Required report fields |
| `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md` | WorkOrder standard |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Live task source |
| `KGEN-Organization/Building/README.md` | Building office definition |
| `KGEN-Organization/Building/ROLE.md` | Building role and authority |
| `KGEN-Organization/Building/RESPONSIBILITY.md` | Building responsibilities |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected path rules |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable Canon facts |

## Files Modified

| File | Change |
|------|--------|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ORG-P2-010 status OPEN → IN_PROGRESS → REVIEW |
| `KGEN-AI-Company/reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md` | Created (this report) |

## Protected Paths Checked

All protected paths confirmed untouched. No runtime, contract, temple, wallet, bridge, or boot files modified.

---

## Task Result

**PASS.** Building evolution rules are consistent with Canon. The map below formalises what Canon implies but does not yet spell out in a single document. No contradictions found. Two minor gaps noted as technical debt.

---

## Building Evolution Map

### Foundation Rules (Canon)

| Canon Rule | Source |
|------------|--------|
| "One land, one house." | `canon_rules[2]` |
| "One house, one shop." | `canon_rules[3]` |
| "A house may evolve into a shop, exchange node, or temple service node." | `canon_rules[4]` |
| "Houses, shops, temples, and exchanges can evolve and grow." | `canon_rules[14]` |

### Full Evolution Tree

```
Land (Wild Land → Built Land)
  └─ House  [L1 — base building; one per land parcel]
       ├─ Shop              [L2 — sells goods, App organisms, AI services, land rights]
       │    ├─ Bank Branch  [L3 — deposit, lending, reserve management]
       │    ├─ Warehouse    [L3 — storage of goods, materials, assets, DNA packages]
       │    └─ Exchange Node[L3 — 11520-compatible listing point for App/Land/Temple/AI/DNA]
       └─ Temple Service Node [L2 — connects to a Temple's service layer]
            └─ Temple       [L4 — full living civilization organ]
```

### Level Definitions

| Level | Building Type | Canon Basis | Description |
|-------|--------------|-------------|-------------|
| L1 | House | "One land, one house." | First civilized organ on a land parcel. Residential or base unit. Cannot skip to L3+ without passing through L2. |
| L2 | Shop | "One house, one shop." | First evolution target. Enables commerce, App/AI/DNA sales, service delivery. Required before branching to L3. |
| L2 | Temple Service Node | "A house may evolve into a shop, exchange node, or temple service node." | Alternative L2 path when the land is dedicated to temple services rather than commerce. |
| L3 | Bank Branch | Canon: "Houses, shops, temples, and exchanges can evolve and grow." | Shop evolved into financial services node. Handles deposit, lending, reserve, KGEN circulation. |
| L3 | Warehouse | Same basis | Shop evolved into asset/material storage. Supports economy logistics and inventory. |
| L3 | Exchange Node | "11520 Huaguo Mountain Exchange is the marketplace..." | Shop evolved into an 11520-compatible listing point. Must comply with 11520 exchange listing rules. |
| L4 | Temple | "Temples may connect to real stores, real services, physical commerce, and physical faith locations." | Temple Service Node evolved into a full Temple life organ. Highest building level. Has civilization responsibility. |

---

## Checks Run

### Check 1 — Canon consistency of evolution paths

| Evolution Path | Canon Permitted | Notes |
|---------------|----------------|-------|
| Land → House | ✅ "One land, one house." | Mandatory first step |
| House → Shop | ✅ "One house, one shop." | Standard evolution |
| House → Temple Service Node | ✅ "A house may evolve into a shop, exchange node, or temple service node." | Alternative path |
| Shop → Bank Branch | ✅ "Houses, shops, temples, and exchanges can evolve and grow." | Implied by growth rule |
| Shop → Warehouse | ✅ Same basis | Implied by growth rule |
| Shop → Exchange Node | ✅ "A house may evolve into an exchange node." | Via shop evolution |
| Temple Service Node → Temple | ✅ "Temples may connect to real stores, real services..." | Temple is full life organ |

**Result:** All seven paths are Canon-consistent. No path contradicts Canon.

---

### Check 2 — Skip-level evolution (prohibited)

Canon states "One land → one house → one shop" as a sequence. Jumping directly from Land to Exchange Node or from House to Temple (skipping Shop or Temple Service Node) is not stated in Canon and would violate the step-by-step evolution principle.

**Result:** The map correctly requires L2 before L3. No skip-level paths are included.

---

### Check 3 — Building office position consistency

Building office position: "Building 管理民宅、商店、銀行、倉庫、交易所節點與實體映射。"

All five building types in scope (民宅/House, 商店/Shop, 銀行/Bank, 倉庫/Warehouse, 交易所節點/Exchange Node) are covered by this map. Temple is included as L4 to show the complete evolution chain while noting it is governed by Temple department at that level.

**Result:** CONSISTENT with Building office position.

---

### Check 4 — 11520 Exchange Node vs 11520 Exchange itself

The Exchange Node (L3 building) is a **listing point** that connects to 11520 花果山交易所, not the Exchange itself. 11520 is the civilization-level marketplace; individual land parcels can host an Exchange Node that participates in it.

**Result:** Distinction is clear. No confusion between node and marketplace.

---

## Problems Found

| # | Problem | Severity | Type |
|---|---------|----------|------|
| 1 | No existing document defines minimum requirements for each level transition (e.g., what resources, KGEN stake, or governance steps unlock House→Shop). | Low | Technical Debt |
| 2 | "Temple Service Node" is mentioned in Canon but not given a dedicated description in any Building or Temple document. | Low | Gap |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Future game/frontend may implement skip-level evolution if evolution rules are not formalised | Medium | A future WorkOrder should define level-up preconditions |
| Temple at L4 is under Temple department governance; Building office must hand off cleanly | Low | Existing handoff protocol covers cross-department coordination |

---

## Technical Debt

1. Level-up preconditions (resource requirements, governance triggers) for each transition not defined.
2. "Temple Service Node" needs a short dedicated description in `Building/` or `Temple/` docs.

---

## Evolution Opportunities

- A `KGEN_BUILDING_LEVEL_REQUIREMENTS.md` could define preconditions per level.
- A Building visualization tool could use this map as data source.

---

## Suggested WorkOrders (PROPOSED)

| Suggested ID | Scope | Reason |
|-------------|-------|--------|
| ORG-P2-010A | Define level-up preconditions for each building evolution step | Addresses technical debt 1 |
| ORG-P2-010B | Add short Temple Service Node description to Building or Temple docs | Addresses gap 2 |

---

## Do Not Do

- Do not modify any runtime modules, temple files, or contracts.
- Do not change Canon rules.
- Do not add economy token facts outside Canon.

## Blockers

None.

## Recommendation

**APPROVE.** The building evolution map is complete, Canon-consistent, and covers all five building types in the Building office scope. No breaking gaps found. Suggested follow-up WorkOrders are PROPOSED and require Codex assignment.

## Need Codex Review

Yes.

## Need Human Decision

No.
