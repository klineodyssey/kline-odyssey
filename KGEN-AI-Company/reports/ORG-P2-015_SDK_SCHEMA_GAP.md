# ORG-P2-015 — SDK Schema Gap Analysis

**Task ID:** ORG-P2-015  
**Status:** Report for Codex Review (`review_status: PENDING_CODEX_REVIEW`)  
**Owner:** Cursor (`cursor-01`)  
**Reviewer:** Codex (`codex-gm-01`)  
**Priority:** P2  
**Department:** SDK  
**Date:** 2026-07-16  
**Base Commit (`observed_origin_main`):** `89f3c351c488a0705f514adba974dd6c3dd3cb3a`  
**Scope:** List future SDK schema gaps without changing SDK implementation or protected paths.

## Session Context

| Field | Value |
|---|---|
| `session_id` | `SESSION-20260716-003-EPHEMERAL` |
| `worker_id` | `cursor-01` |
| `worker_agent_id` | `cursor-agent-0003` |
| `claim_id` | `CLAIM-ORG-P2-015-20260716T063657-cursor-01` |
| `observed_origin_main` | `89f3c351c488a0705f514adba974dd6c3dd3cb3a` |
| `concurrent_sessions_acknowledged` | `true` |
| `atomic_claim_service` | `NOT_IMPLEMENTED` |
| `preflight_result` | `PASS` |
| `branch` | `cursor-handoff/ORG-P2-015-20260716` |

## Codex Coordination

| Item | Note |
|---|---|
| Task Envelope | **None** for ORG-P2-015 on main |
| Dispatch | Monkey-boot gap fill: first OPEN task **without** sibling `-20260716` handoff (005–014 in sibling REVIEW custody) |
| Supersedes | Stale archive `cursor-handoff/ORG-P2-015` @ `29bf03c0` (2026-07-12 base; modified WORK_QUEUE — **not repeated**) |
| Sibling swarm | 005–014, 016–024 have `-20260716` REVIEW branches; **011** has report only, no formal handoff |
| WORK_QUEUE | **Not modified by Cursor** — Codex closeout |
| 如來佛動靜 | `origin/main` unchanged since prior session; no new envelopes; no CODEX_REVIEW_LOG closeout for 005–014 |

## Multi-Window Problems

| ID | Issue | This session response |
|---|---|---|
| **PF2** | Multi-window shared `cursor-01` may duplicate claims | Chose **015** only after confirming no sibling `-20260716` branch; unique `claim_id` |
| **PF1** | Envelope forbids Cursor WorkQueue edits | No envelope; still **did not** edit WORK_QUEUE |

---

## Summary

Compared **Organization V2.0 standards**, **KGEN-SDK V1.0** (SDK-001–010), and **KAIOS schema libraries** on current main. Core domains are partially covered; **nine future SDK schemas** are recommended for gaps introduced or clarified since the 2026-07-12 stale handoff (World Viewer sandbox, Company OS dispatch, Genesis DNA review). All SDK books remain **Draft for Review**. **No protected paths modified.**

**Verdict: PASS** — Gap analysis complete with prioritized SDK roadmap.

---

## 1. Existing SDK inventory (V1.0)

| SDK ID | Title | Org standard covered | Schema file |
|---|---|---|---|
| SDK-001 | Runtime Loader API | Runtime / Boot binding | `sdk-001_schema.json` |
| SDK-002 | Universe Map API | Universe coords / Portal partial | `sdk-002_schema.json` |
| SDK-003 | Temple API | `KGEN_TEMPLE_STANDARD.md` | `sdk-003_schema.json` |
| SDK-004 | Land API | `KGEN_LAND_STANDARD.md` | `sdk-004_schema.json` |
| SDK-005 | App Organism API | `KGEN_APP_LIFE_STANDARD.md` | `sdk-005_schema.json` |
| SDK-006 | AI Runtime API | AI Standard (KAIOS V8.1) | `sdk-006_schema.json` |
| SDK-007 | DNA / GA API | Evolution cores (Canon) | `sdk-007_schema.json` |
| SDK-008 | Economy API | `KGEN_ECONOMY_LOOP.md` | `sdk-008_schema.json` |
| SDK-009 | Game Loop API | Canon game loop (no Org std doc) | `sdk-009_schema.json` |
| SDK-010 | Cursor / Codex Agent API | WorkOrder / agent partial | `sdk-010_schema.json` |

**Index:** `KGEN-Canon/KGEN_SDK_INDEX.json` — 10 documents, all `Draft for Review`, last update **2026-07-09** (unchanged on main).

---

## 2. Organization standard coverage matrix

| Organization domain | Formal standard path | SDK | Coverage |
|---|---|---|---|
| Temple | `Temple/KGEN_TEMPLE_STANDARD.md` | SDK-003 | ✅ Covered |
| Land | `Land/KGEN_LAND_STANDARD.md` | SDK-004 | ✅ Covered |
| App | `App/KGEN_APP_LIFE_STANDARD.md` | SDK-005 | ✅ Covered |
| Economy | `Economy/KGEN_ECONOMY_LOOP.md` | SDK-008 | ⚠️ Partial — war/rental/NFT fields thin |
| Game | *(no `KGEN_GAME_LOOP_STANDARD.md`)* | SDK-009 | ⚠️ Partial — ORG-P2-013 gap |
| Canon / Civilization | `Canon/KGEN_CIVILIZATION_CORE_CANON.md` | SDK-008/009 | ⚠️ Partial — no dedicated Civ SDK |
| NPC | `NPC/README.md` + `KAIOS/V8.1/NPC_STANDARD.md` | — | ❌ **Gap** |
| Building | `Building/README.md` only | — | ❌ **Gap** |
| Universe / Portal | `Universe/README.md` | SDK-002 | ⚠️ Portal not first-class |
| Runtime | `Runtime/README.md` | SDK-001 | ✅ Covered |
| WorkOrders | `KGEN_WORKORDER_STANDARD.md` | SDK-010 | ⚠️ Partial |
| Workforce | `KGEN-KAIOS/workforce/*` | — | ❌ **Gap** |
| World Viewer *(new on main)* | `KGEN-KAIOS/world-viewer/*` | — | ❌ **Gap** — sandbox JSON only |

**Canon JSON pointers** (`KGEN_CANON_MASTER.json`): `temple_standard`, `land_standard`, `app_life_standard`, `workorder_standard`, `organism_manifest_standard`, `evolution_lineage_standard` — **no** `economy_standard`, `npc_standard`, or `world_viewer_standard` pointer.

---

## 3. KAIOS schemas without SDK books

| KAIOS artifact | Purpose | SDK equivalent |
|---|---|---|
| `V8.1/schemas/entity_graph.schema.json` | 24 entity classes | Partially split across SDK-003–008 |
| `V8.3/schemas/time_state.schema.json` | Time engine states | ❌ No SDK |
| `V9.0–V9.3/schemas/dispatch_*.schema.json` | Company OS dispatch | ❌ No SDK (SDK-010 partial) |
| `provenance/ORGANISM_MANIFEST_SCHEMA.json` | Organism manifests | ❌ No SDK |
| `provenance/EVOLUTION_EVENT_SCHEMA.json` | Lineage events | ❌ No SDK |
| `workforce/*_SCHEMA.json` | Worker trust / violation | ❌ No SDK |
| `world-viewer/data/synthetic-world.json` | 12-parcel sandbox fixture | ❌ No SDK |
| `genesis-dna/*` | DNA review candidate docs | ❌ No SDK |

**Count:** ~90+ `.schema.json` files under `KGEN-KAIOS/` vs 10 SDK schema files under `KGEN-SDK/`.

---

## 4. Recommended future SDK schemas (priority order)

| Priority | Proposed ID | Title | Organization / KAIOS source | Key entities |
|---|---|---|---|---|
| P0 | **SDK-011** | NPC API | NPC Office + `NPC_STANDARD.md` | `npc_id`, role, service_scope, ai_link |
| P0 | **SDK-012** | Building API | Building Office + ORG-P2-010 map | house, shop, warehouse, bank, exchange |
| P1 | **SDK-013** | Citizen / Profession API | `citizen.schema.json`, `profession.schema.json` | citizen_id, profession, residence |
| P1 | **SDK-014** | Portal API | Temple §9 + Universe Office | portal_id, entry_path, target_temple |
| P1 | **SDK-015** | Marketplace / Listing API | 11520 + `listing.schema.json` | listing_id, asset_type, collateral |
| P1 | **SDK-016** | Company Dispatch API | V9.0–V9.3 dispatch schemas | dispatch_id, risk_gate, release_request |
| P2 | **SDK-017** | Evolution Lineage API | `EVOLUTION_LINEAGE_STANDARD.md` | evolution_event_id, rollback_path |
| P2 | **SDK-018** | Workforce / Attendance API | `KGEN-KAIOS/workforce/*` | agent_id, trust_level, violation |
| P2 | **SDK-019** | World Viewer Parcel API | `world-viewer` sandbox plan | parcel_id, synthetic_coords, viewer_state |

**Rule:** Do not create duplicate SDK IDs — extend SDK-003/008/010 via cumulative V1.1 when scope is additive only.

---

## 5. Schema field gaps in existing SDKs (extend vs new)

| Existing SDK | Missing fields vs Organization / KAIOS | Action |
|---|---|---|
| SDK-004 Land | rental §8, conquest §7, NFT future §9 | Extend `sdk-004_schema.json` V1.1 |
| SDK-008 Economy | civilization_war, cross-universe, communal treasury | Extend `sdk-008_schema.json` V1.1 |
| SDK-009 Game Loop | quest, combat, train as typed steps | Extend after `KGEN_GAME_LOOP_STANDARD` exists |
| SDK-010 Agent | `task_source_type`, `dispatch_status`, claim lease fields | Extend `sdk-010_schema.json` V1.1 |
| SDK-003 Temple | Portal §9, quest board organ | Extend or split to SDK-014 |
| SDK-002 Universe Map | World Viewer parcel overlay (synthetic) | Extend V1.1 or SDK-019 |

---

## 6. Canon / index alignment risks

| Risk | Detail | Mitigation |
|---|---|---|
| SDK vs Canon JSON drift | Canon lacks `economy_standard` pointer | Future Canon WO (not this task) |
| SDK index stale vs main | Last update 2026-07-09; main gained world-viewer, genesis-dna | SDK index refresh WO |
| All SDKs Draft for Review | No production npm package | Label consumers doc-validation only |
| KAIOS schema ⊃ SDK split | 90+ schemas, 10 SDKs | SDK-011–019 close domain gaps |
| Stale handoff `ORG-P2-015` | Prior branch edited WORK_QUEUE | Superseded by this clean main-child handoff |

---

## 7. Checks Run

| Check | Result |
|---|---|
| CURSOR_PREFLIGHT | ✅ PASS |
| KGEN_SDK_INDEX.json enumerated (10 docs) | ✅ |
| Organization `KGEN_*_STANDARD` files mapped | ✅ 4 formal + dept READMEs |
| KAIOS schema orphan scan | ✅ 8 orphan categories listed |
| Canon master standard pointers | ✅ Compared |
| World Viewer / genesis-dna presence on main | ✅ Noted as new gaps |
| Protected path diff | ✅ None |
| Single-task purity | ✅ ORG-P2-015 only |
| Secret scan | ✅ None |

## Files Read

- `KGEN-Organization/SDK/README.md`, `ROLE.md`, `RESPONSIBILITY.md`
- `KGEN-SDK/README.md`, `KGEN-Canon/KGEN_SDK_INDEX.json`, `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md`
- `KGEN-Organization/Land/KGEN_LAND_STANDARD.md`
- `KGEN-Organization/App/KGEN_APP_LIFE_STANDARD.md`
- `KGEN-Organization/Economy/KGEN_ECONOMY_LOOP.md`
- `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`
- `KGEN-KAIOS/V8.1/NPC_STANDARD.md`, `entity_graph.schema.json`
- `KGEN-KAIOS/V8.3/time_state.schema.json`
- `KGEN-KAIOS/V9.3/dispatch_*.schema.json` (sample)
- `KGEN-KAIOS/EVOLUTION_LINEAGE_STANDARD.md`
- `KGEN-KAIOS/workforce/README.md`, `WORKER_TRUST_SCHEMA.json`
- `KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md`
- `KGEN-KAIOS/world-viewer/data/synthetic-world.json` (fixture check)
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` (read only)
- Sibling handoff branch inventory (remote scan)

## Files Modified / Added

- `KGEN-AI-Company/reports/ORG-P2-015_SDK_SCHEMA_GAP.md`
- `KGEN-AI-Company/reports/handoffs/ORG-P2-015/HANDOFF.md`
- `KGEN-AI-Company/reports/handoffs/ORG-P2-015/handoff.json`

## Files Deleted

None.

## Protected Paths

No protected-path modifications. Runtime CURRENT / Universe Map / Boot / Canon / 12345 / contracts untouched.

## Suggested WorkOrders (PROPOSED only)

| Task ID | Title | Status |
|---|---|---|
| SDK-011-DRAFT | Draft NPC API schema from NPC_STANDARD | PROPOSED |
| SDK-012-DRAFT | Draft Building API from ORG-P2-010 map | PROPOSED |
| SDK-016-DRAFT | Company Dispatch API from V9.3 schemas | PROPOSED |
| SDK-004-V1.1 | Add rental/conquest/NFT-future to Land schema | PROPOSED |

## Blockers

None for report approval.

## Recommendation

**APPROVE** ORG-P2-015. Prioritize **SDK-011 (NPC)**, **SDK-012 (Building)**, and **SDK-016 (Company Dispatch)** for the next schema drafting cycle. Codex: batch-review sibling `-20260716` swarm and closeout WORK_QUEUE entries.
