# ORG-P2-015 — SDK Schema Gap Analysis

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-015 |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-12 |
| Base Commit | `6a7f6d70fb571093b00cf62f55153761f8337ce0` |
| Branch | `cursor-handoff/ORG-P2-015` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-015_SDK_SCHEMA_GAP.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | SDK |

## Summary

Compared **Organization V2.0 standards** and **KAIOS V8.x schemas** against the existing **KGEN-SDK V1.0 library** (SDK-001–010). **Core domains are partially covered** (Temple, Land, App, Economy, Game Loop, AI, DNA/GA, Universe Map, Runtime Loader, Agent). **Seven future SDK schemas** are recommended for gaps: NPC, Building, Citizen/Profession, Portal, Evolution Lineage, Marketplace/Listing (11520), and Workforce/Attendance. All current SDK books remain **Draft for Review**. **No protected paths modified.**

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
| SDK-009 | Game Loop API | Canon §6 game loop (no Org std doc) | `sdk-009_schema.json` |
| SDK-010 | Cursor / Codex Agent API | WorkOrder / agent partial | `sdk-010_schema.json` |

**Index:** `KGEN-Canon/KGEN_SDK_INDEX.json` — 10 documents, all `Draft for Review`, last update 2026-07-09.

---

## 2. Organization standard coverage matrix

| Organization domain | Formal standard path | SDK | Coverage |
|---|---|---|---|
| Temple | `Temple/KGEN_TEMPLE_STANDARD.md` | SDK-003 | ✅ Covered |
| Land | `Land/KGEN_LAND_STANDARD.md` | SDK-004 | ✅ Covered |
| App | `App/KGEN_APP_LIFE_STANDARD.md` | SDK-005 | ✅ Covered |
| Economy | `Economy/KGEN_ECONOMY_LOOP.md` | SDK-008 | ✅ Partial — war/rental/NFT fields thin |
| Game | *(no `KGEN_GAME_LOOP_STANDARD.md`)* | SDK-009 | ⚠️ Partial — ORG-P2-013 gap M1 |
| Canon / Civilization | `Canon/KGEN_CIVILIZATION_CORE_CANON.md` | SDK-008/009 | ⚠️ Partial — no dedicated Civ SDK |
| NPC | `NPC/README.md` + KAIOS `NPC_STANDARD.md` | — | ❌ **Gap** |
| Building | `Building/README.md` only | — | ❌ **Gap** |
| Universe / Portal | `Universe/README.md` | SDK-002 | ⚠️ Portal not first-class |
| Runtime | `Runtime/README.md` | SDK-001 | ✅ Covered |
| WorkOrders | `WorkOrders/KGEN_WORKORDER_STANDARD.md` | SDK-010 | ⚠️ Partial |
| Workforce *(new)* | `KGEN-KAIOS/workforce/*` | — | ❌ **Gap** |

**Canon JSON pointers** (`KGEN_CANON_MASTER.json`): `temple_standard`, `land_standard`, `app_life_standard`, `workorder_standard` — **no** `economy_standard` or `npc_standard` pointer.

---

## 3. KAIOS schemas without SDK books

| KAIOS artifact | Purpose | SDK equivalent |
|---|---|---|
| `V8.1/schemas/entity_graph.schema.json` | 24 entity classes | Partially split across SDK-003–008 |
| `V8.3/schemas/time_state.schema.json` | Time engine states | ❌ No SDK |
| `provenance/ORGANISM_MANIFEST_SCHEMA.json` | Organism manifests | ❌ No SDK (doc standard only) |
| `provenance/EVOLUTION_EVENT_SCHEMA.json` | Lineage events | ❌ No SDK |
| `workforce/agent_registry.json` | Agent workforce V2 | ❌ No SDK (post–2026-07-12 main) |

---

## 4. Recommended future SDK schemas (priority order)

| Priority | Proposed ID | Title | Organization / KAIOS source | Key entities |
|---|---|---|---|---|
| P0 | **SDK-011** | NPC API | NPC Office + `NPC_STANDARD.md` | `npc_id`, role, service_scope, ai_link, simulation_flag |
| P0 | **SDK-012** | Building API | Building Office + ORG-P2-010 map | house, shop, warehouse, bank, exchange, temple_node |
| P1 | **SDK-013** | Citizen / Profession API | `CITIZEN_STANDARD.md`, `PROFESSION_STANDARD.md` | citizen_id, profession, residence, employer |
| P1 | **SDK-014** | Portal API | Temple §9 + Universe Office | portal_id, entry_path, target_temple/world |
| P1 | **SDK-015** | Marketplace / Listing API | 11520 exchange + `KAIOS_V8_LISTING_STANDARD.md` | listing_id, asset_type, collateral, organ_decomposition |
| P2 | **SDK-016** | Evolution Lineage API | `EVOLUTION_LINEAGE_STANDARD.md` + event schema | evolution_event_id, event_type, rollback_path |
| P2 | **SDK-017** | Workforce / Attendance API | `KGEN-KAIOS/workforce/*` | agent_id, desk_id, attendance, tool_access |
| P3 | **SDK-018** | Time State API | `V8.3/time_state.schema.json` | entity_type, time_state, decay/growth |

**Do not** create duplicate SDK IDs for existing functions — extend SDK-003/008/010 via cumulative V1.1 if scope is additive only.

---

## 5. Schema field gaps in existing SDKs (extend vs new)

| Existing SDK | Missing fields vs Organization standard | Action |
|---|---|---|
| SDK-004 Land | rental §8, conquest §7, NFT future §9 | Extend `sdk-004_schema.json` V1.1 |
| SDK-008 Economy | civilization_war, cross-universe, communal treasury | Extend `sdk-008_schema.json` V1.1 |
| SDK-009 Game Loop | quest, combat, train as typed steps | Extend after `KGEN_GAME_LOOP_STANDARD` exists |
| SDK-010 Agent | `task_source_type` enum from WorkOrder standard | Extend `sdk-010_schema.json` V1.1 |
| SDK-003 Temple | Portal §9, quest board organ | Extend or split to SDK-014 |

---

## 6. Canon / index alignment risks

| Risk | Detail | Mitigation |
|---|---|---|
| SDK vs Canon JSON drift | Canon lacks `economy_standard` pointer | Add pointer in future Canon WO (not this task) |
| Workforce not in SDK index | New main commits 2026-07-12 | SDK-017 proposal |
| All SDKs Draft for Review | No production npm package | Label consumers as doc-validation only |
| KAIOS entity graph ⊃ SDK split | 24 classes, 10 SDKs | SDK-011–013 close NPC/Building/Citizen gaps |

---

## 7. Checks Run

| Check | Result |
|---|---|
| KGEN_SDK_INDEX.json enumerated (10 docs) | ✅ |
| Organization KGEN_*_STANDARD files mapped | ✅ 4 formal + dept READMEs |
| KAIOS schema orphan scan | ✅ 4 orphans listed |
| Canon master standard pointers | ✅ Compared |
| Protected path diff | ✅ None |

## Files Read

- `KGEN-Organization/SDK/README.md`
- `KGEN-Organization/SDK/ROLE.md`
- `KGEN-Organization/SDK/RESPONSIBILITY.md`
- `KGEN-SDK/README.md`
- `KGEN-Canon/KGEN_SDK_INDEX.json`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md`
- `KGEN-Organization/Land/KGEN_LAND_STANDARD.md`
- `KGEN-Organization/App/KGEN_APP_LIFE_STANDARD.md`
- `KGEN-Organization/Economy/KGEN_ECONOMY_LOOP.md`
- `KGEN-KAIOS/V8.1/NPC_STANDARD.md`
- `KGEN-KAIOS/V8.1/schemas/entity_graph.schema.json`
- `KGEN-KAIOS/V8.3/schemas/time_state.schema.json`
- `KGEN-KAIOS/EVOLUTION_LINEAGE_STANDARD.md`
- `KGEN-KAIOS/workforce/README.md`
- `KGEN-AI-Company/reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md`
- `KGEN-AI-Company/reports/ORG-P2-013_GAME_LOOP_MAP.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-015 OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-015_SDK_SCHEMA_GAP.md` — this report (created)

## Protected Paths Checked

No modifications under protected paths.

## Suggested WorkOrders

| Task ID | Title | Status |
|---|---|---|
| SDK-011-DRAFT | Draft NPC API schema from NPC_STANDARD | PROPOSED |
| SDK-012-DRAFT | Draft Building API from ORG-P2-010 map | PROPOSED |
| SDK-004-V1.1 | Add rental/conquest/NFT-future to Land schema | PROPOSED |

## Do Not Do

- Do not hard-code universe constants outside Canon JSON.
- Do not publish SDK schemas that contradict `KGEN_CANON_MASTER.json`.
- Do not create version-suffixed duplicate SDK folders for same function.

## Blockers

None.

## Recommendation

**APPROVE** ORG-P2-015. Prioritize **SDK-011 (NPC)** and **SDK-012 (Building)** for next schema drafting cycle.

## Need Codex Review

Yes.

## Need Human Decision

No — SDK numbering above is proposal only.

## Handoff

- **Branch:** `cursor-handoff/ORG-P2-015`
- **WORK_QUEUE:** ORG-P2-015 → REVIEW
- **Next queue item:** ORG-P2-016 (Frontend pages/links)

**End of report.**
