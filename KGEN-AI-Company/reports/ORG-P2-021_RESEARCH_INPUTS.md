# ORG-P2-021 — Research Inputs for Organization V2.1 (Non-Canon)

**Task ID:** ORG-P2-021  
**Status:** Report for Codex Review (`review_status: PENDING_CODEX_REVIEW`)  
**Owner:** Cursor (`cursor-01`)  
**Reviewer:** Codex (`codex-gm-01`)  
**Priority:** P3  
**Department:** Research  
**Date:** 2026-07-16  
**Base Commit (`observed_origin_main`):** `d5d9b2cc5bafd67ec600fccb2701f638020d9741`  
**Scope:** List research inputs for Organization V2.1 planning. **No Canon or protected-path edits.**

## Session Context

| Field | Value |
|---|---|
| `session_id` | `SESSION-20260716-17-EPHEMERAL` |
| `worker_id` | `cursor-01` |
| `worker_agent_id` | `cursor-agent-0016` |
| `claim_id` | `CLAIM-ORG-P2-021-20260716T0920-cursor-01` |
| `branch` | `cursor-handoff/ORG-P2-021-20260716` |
| `supersedes_archive_tips` | `334e729e` (legacy `cursor-handoff/ORG-P2-021`; 138-file stale tree) |
| `preflight_result` | `PASS` |
| `atomic_claim_service` | `NOT_IMPLEMENTED` |

## Codex Coordination

| Item | Note |
|---|---|
| **Batch review request** | **REQUEST:** Codex batch-review **20** pending `-20260716` ORG-P2 handoffs (005–020, 022–025). This submission completes Phase-2 evidence coverage **21/21** (all OPEN 005–025 tasks now have dated handoffs). |
| **Review priority** | P0: 014, 018, 019 → P1: 006–009, 012–013, 016, 020, 022–024 → P2: 005, 010–011, 015, 017, 025 → P3: **021** (this report) |
| **Stale evidence** | Mark `ORG-P2-004-20260716` SUPERSEDED (004 DONE on main @ `006c00d0`). Mark legacy `cursor-handoff/ORG-P2-021` @ `334e729e` SUPERSEDED by this reissue. |
| **Task Envelope** | None for ORG-P2-021 |
| **WORK_QUEUE** | **Not modified by Cursor** — main still shows OPEN until Codex closeout |
| **SWARM reference** | Aligns with `PROP-SWARM-001` / `PROP-SWARM-003` in `SWARM_BATTLE_STATUS.md` |

## Multi-Window Problems

| ID | Issue | This session response |
|---|---|---|
| **PF1** | Cursor forbidden WORK_QUEUE self-closeout | No WORK_QUEUE edits |
| **PF2** | Shared `cursor-01` may duplicate claims | Unique `claim_id` + `session_id`; single-task branch |

---

## Executive Summary

Listed **research inputs** for a future **Organization V2.1** planning cycle. Every inventory row is labeled **`NON_CANON`** (research / draft / architecture evidence only). This WorkOrder **does not change** Machine Canon, Civilization Core Canon, Boot, Runtime CURRENT, Token contract, or other protected paths.

**Verdict: PASS** — Research input inventory complete; zero Canon writes; zero protected-path modifications.

## Acceptance Criteria

| Criterion | Result |
|---|---|
| List research inputs; label non-Canon | ✅ |
| Files read, files modified, checks, risks, blockers, recommendation | ✅ |
| No protected path modified | ✅ |
| REVIEW evidence after report exists | ✅ (handoff requests REVIEW; WorkQueue left for Codex) |

---

## Hard Rule for V2.1 Research

| Rule | Binding |
|---|---|
| Research hypotheses must **not** be written into formal Canon | Research Office No-Overreach (`README.md`, `ROLE.md`) |
| Canon may only be extended later by **Codex + Human** cumulative update | Organization operating rule |
| All V2.1 research outputs start as **`NON_CANON` / `PROPOSED`** | Provenance governance in `KGEN_CANON_MASTER.json` |
| Protected paths remain read-only unless scoped Human+Codex WO | `DO_NOT_TOUCH.md` |

---

## 1. Research Input Inventory (all `NON_CANON` for V2.1 planning)

Inputs are sources Research may **read**. Consuming them for V2.1 drafts does **not** promote them into Canon.

### A. Physics / Whitepaper / Runtime (read-only)

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-A1 | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Physics Runtime CURRENT | `NON_CANON` research ref (protected SSOT) | Align Org V2.1 runtime language; **do not edit** |
| R-A2 | `docs/physics/final-whitepaper/…FINAL.pdf` | Official whitepaper | `NON_CANON` research ref (protected) | Cite facts; no rewrite |
| R-A3 | `KGEN-Runtime/COS-*` | COS runtime books | `NON_CANON` | Map Org departments ↔ runtime organs |
| R-A4 | `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | Universe Map SSOT | `NON_CANON` | Coordinate / Portal research (see ORG-P2-005 evidence) |

### B. Genesis Library publications

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-B1 | `KGEN-Genesis/GEN-003_Universe_Design/` | Universe design | `NON_CANON` | Portal / map research |
| R-B2 | `KGEN-Genesis/GEN-006_Game_Design/` | Game design | `NON_CANON` | Game loop standard gap research |
| R-B3 | `KGEN-Genesis/GEN-007_DNA_Evolution/` | DNA / GA | `NON_CANON` | Evolution research pack |
| R-B4 | `KGEN-Genesis/GEN-008_Finance/` | Finance | `NON_CANON` | Bank / tax / LP narrative inputs |
| R-B5 | `KGEN-Genesis/GEN-009_AI_Runtime/` | AI runtime | `NON_CANON` | AI organ / workforce alignment |
| R-B6 | Other `GEN-001..GEN-012` | Canon publications | `NON_CANON` for V2.1 delta work | Gap scan vs Org V2.0 standards |

### C. Organization V2.0 standards (baseline, not V2.1 Canon)

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-C1 | `KGEN-Organization/README.md` | Org OS index (25 depts) | `NON_CANON` baseline | Department coverage audit |
| R-C2 | `Canon/KGEN_CIVILIZATION_CORE_CANON.md` | Org L1 civilization rules | `NON_CANON` **read-only** | Diff candidates only via future Canon WO |
| R-C3 | `Economy/KGEN_ECONOMY_LOOP.md` | Economy loop | `NON_CANON` baseline | War / rental / treasury gaps |
| R-C4 | `Temple/KGEN_TEMPLE_STANDARD.md` | Temple | `NON_CANON` baseline | Portal / physical-faith links |
| R-C5 | `Land/KGEN_LAND_STANDARD.md` | Land | `NON_CANON` baseline | Wild land / conquest |
| R-C6 | `App/KGEN_APP_LIFE_STANDARD.md` | App organism | `NON_CANON` baseline | Lifecycle / marketplace |
| R-C7 | `WorkOrders/KGEN_WORKORDER_STANDARD.md` | WO process | `NON_CANON` baseline | V2.1 process deltas |
| R-C8 | Dept README/ROLE/RESPONSIBILITY (all 25) | Operating desks | `NON_CANON` | Role completeness for V2.1 |

### D. Machine-Readable Canon (read-only SSOT pointer)

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-D1 | `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine Canon V2.0 | `NON_CANON` **read-only** for this task | Extract open questions; **no JSON edits** |
| R-D2 | `organization_v2` block in Canon JSON | Org V2.0 pointers | `NON_CANON` baseline | 25 departments / 25 workorders — V2.1 delta anchor |
| R-D3 | `KGEN-Canon/KGEN_*_INDEX.json` | Doc/runtime/SDK indexes | `NON_CANON` | Coverage matrix |

### E. KAIOS architecture evidence (research / design)

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-E1 | `KGEN-KAIOS/V8/` … `V9.2/` | Temple economy → draft sync | `NON_CANON` | Org ↔ KAIOS interface research |
| R-E2 | `KGEN-KAIOS/constitution/` | KAIOS Constitution | `NON_CANON` (gov) | Authority hierarchy inputs |
| R-E3 | `KGEN-KAIOS/kernel/` | Kernel V1 (RESEARCH_ONLY) | `NON_CANON` | Single-agent lifecycle implications |
| R-E4 | `KGEN-KAIOS/governance/` | Architecture Governance Board | `NON_CANON` | How Org V2.1 proposals escalate |
| R-E5 | `KGEN-KAIOS/governance/autopilot/` | Company autopilot / inbox | `NON_CANON` | Swarm coordination research inputs |
| R-E6 | `KGEN-KAIOS/provenance/*.json` | Provenance schemas | `NON_CANON` | V2.1 file metadata requirements |

### F. SDK / public / markets

| ID | Path | Topic | Label | V2.1 use |
|---|---|---|---|---|
| R-F1 | `KGEN-SDK/` + schemas | Developer APIs | `NON_CANON` | Schema gaps (ORG-P2-015 evidence) |
| R-F2 | `OfficialLinks.json` | Public link manifest | `NON_CANON` | Publishing consistency |
| R-F3 | Canon `token` block / BscScan | On-chain facts | `NON_CANON` research cite | Must match V7.5.2; no contract edits |

### G. Phase-2 report evidence (inputs only; all `NON_CANON`)

| ID | Path | Topic | V2.1 use |
|---|---|---|---|
| R-G1 | `ORG-P2-004_CANON_ALIGNMENT.md` | Canon alignment baseline | Wording-risk follow-ups for V2.1 Canon WO scoping |
| R-G2 | `ORG-P2-005` … `ORG-P2-020` `-20260716` reports | Domain QA (Universe→DevOps) | Consolidated gap themes for V2.1 research briefs |
| R-G3 | `ORG-P2-022` … `ORG-P2-025` `-20260716` reports | Docs / Publishing / WO / checklist | Index and closure research inputs |
| R-G4 | `SWARM_BATTLE_STATUS.md` | Swarm coordination | Batch-review context; not normative |

---

## 2. Suggested V2.1 Research Themes (all `PROPOSED` / `NON_CANON`)

These are **not** opened WorkOrders and **not** Canon amendments:

1. **Game Loop standard gap** — Civilization Core §6 has no dedicated `KGEN_GAME_LOOP_STANDARD.md` (ORG-P2-013 evidence).
2. **NPC / Building / Citizen standards** — department folders exist; formal standards thin vs Temple/Land/App (ORG-P2-010, 011).
3. **Org ↔ KAIOS boundary** — which KAIOS V8–V9 schemas become Org V2.1 normative vs remain OS evidence (ORG-P2-014).
4. **Protected-path path reality** — `KGEN/contracts/` vs root `contracts/`; missing `bridge/` (ORG-P2-019).
5. **Workforce / attendance / atomic claims** — post-V2.0 ops chapter for Research dry-runs (SWARM + claim registry proposals).
6. **Publishing URL drift** — whitepaper `.html` vs `.md`, donation index (ORG-P2-023 evidence).
7. **Kernel V1 implications** — single-agent Boot/Sleep for Research dry-runs; implementation still NOT_STARTED.

---

## 3. Explicit Non-Actions

| Action | Status |
|---|---|
| Modify `KGEN-Canon/KGEN_CANON_MASTER.json` | **NOT DONE** |
| Modify Civilization Core Canon / Boot / Runtime CURRENT | **NOT DONE** |
| Promote any hypothesis to Canon | **FORBIDDEN** in this WO |
| Create official V2.1 direction docs | **NOT DONE** (needs Codex WO) |
| Modify `WORK_QUEUE.md` | **NOT DONE** (Codex closeout only) |

---

## 4. Risks

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Research notes mistaken for Canon | Medium | All rows labeled `NON_CANON`; No-Overreach rule |
| R2 | Silent Canon rewrite via “V2.1 cleanup” | High | Require separate Codex Canon WO |
| R3 | Mixing protected Runtime CURRENT into editable drafts | Medium | Read-only cite; no copies claiming CURRENT |
| R4 | Atomic claim service NOT_IMPLEMENTED | Medium | Session/claim IDs; Codex serialization |
| R5 | Legacy `334e729e` branch tree pollution | Low | Superseded by this clean reissue from `d5d9b2c` |

## 5. Blockers

None for this inventory WorkOrder.

## 6. Checks Run

| Check | Result |
|---|---|
| CURSOR_PREFLIGHT | ✅ PASS |
| CANON_JSON_PARSE | ✅ PASS |
| Research No-Overreach respected | ✅ PASS |
| Candidate paths existence sample | ✅ PASS |
| Protected path diff (planned edits) | ✅ report + handoff only |
| Single-task purity | ✅ ORG-P2-021 only |
| Secret scan | ✅ none |
| WORK_QUEUE modified | ✅ NO |

## 7. Files Read

- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-AI-Company/CURSOR_REPORTING_RULES.md`
- `KGEN-Organization/Research/README.md`
- `KGEN-Organization/Research/ROLE.md`
- `KGEN-Organization/Research/RESPONSIBILITY.md`
- `KGEN-Organization/Research/WORK_QUEUE.md` (department queue)
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` (ORG-P2-021 spec)
- `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`
- `KGEN-Organization/README.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-AI-Company/reports/SWARM_BATTLE_STATUS.md` (batch-review context)
- `KGEN-AI-Company/reports/ORG-P2-004_CANON_ALIGNMENT.md` (dependency P2-004)
- Phase-2 handoff branch tips 005–020, 022–025 (metadata only)

## 8. Files Modified / Added

- `KGEN-AI-Company/reports/ORG-P2-021_RESEARCH_INPUTS.md` (this report)
- `KGEN-AI-Company/reports/handoffs/ORG-P2-021/HANDOFF.md`
- `KGEN-AI-Company/reports/handoffs/ORG-P2-021/handoff.json`

## 9. Files Deleted

None.

## 10. Protected Paths

No protected-path modifications. Runtime CURRENT / Universe Map / Boot / Canon / 12345 / contracts / wallet / bridge untouched.

## 11. Recommendation

**APPROVE** ORG-P2-021 as a Research inventory. Codex: batch-close Phase-2 handoffs 005–025 (21/21 coverage after this merge), then optionally open **PROPOSED** research brief WOs for themes §2.1–2.7 — all remain **NON_CANON** until explicit Canon promotion WOs.
