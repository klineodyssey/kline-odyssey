# ORG-P2-008 Temple Standard QA

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-008 |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-12 |
| Base Commit | `fcf948f62e0619041896a004ce2efa10666d3ec1` |
| Branch | `cursor-handoff/ORG-P2-008` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-008_TEMPLE_STANDARD_QA.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |

## Summary

Validated **temple organ naming rules** and **一圖一神殿 / One image, one temple** references across Organization Temple standards, Civilization Core Canon, Machine Canon JSON, public portals, and KAIOS V8. Organization docs are **internally consistent** and **aligned with Canon**. **No hard rule conflict** in Organization layer. **Protected Temple 12345** contains **legacy version-suffixed organ filenames** that contradict `KGEN_TEMPLE_STANDARD.md` §10 — grandfathered drift, remediation deferred to ORG-P2-003F migration plan. **No protected paths modified.**

## One Image One Temple (一圖一神殿)

| Source | Rule | Status |
|---|---|---|
| `KGEN_CANON_MASTER.json` | `"One image, one temple."` | ✅ Canon fact |
| `KGEN_CIVILIZATION_CORE_CANON.md` §2 | `一圖一神殿。` | ✅ Aligned |
| `KGEN_TEMPLE_STANDARD.md` §2 | Primary image not shared; archive/dev reuse only | ✅ Aligned |
| `KGEN-Organization/Temple/ROLE.md` | Department owns 一圖一神殿 rule | ✅ Aligned |
| `KAIOS V8` specs | 一圖一神殿 / One Picture One Temple economy entry | ✅ Aligned (V8 = asset-layer interpretation) |
| `civilization/index.html`, `index.html` | Public portal references 一圖一神殿 | ✅ Aligned |
| `video/EP002_*` | Dedicated episode for One Image One Temple | ✅ Aligned |

**Temple inventory (read-only):** 15 numeric temple shells under `K線西遊記/temples/` (12345, 11520, 16888, …). Multiple temples are **allowed**; rule forbids **shared primary image identity**, not multiple temple nodes.

**Drift T1:** KAIOS V8 blueprint PNG is a **system concept image**, not a per-temple public identity — document as meta-blueprint, not temple primary image.

## Organ Naming Rules

### Organization standard (`KGEN_TEMPLE_STANDARD.md` §10)

> Official organ filenames must be stable and must not include version suffixes such as v2, v3, final, hotfix, patch, or stable.

| Check | Organization docs | Result |
|---|---|---|
| Temple Standard §10 | States no version suffixes | ✅ Clear rule |
| Temple ROLE | `不得新增版本號正式器官檔名` | ✅ Aligned |
| App Life Standard §23 | Assembly requires version-free official organ name | ✅ Cross-aligned |
| Organization Temple/*.md | No versioned organ filenames proposed | ✅ PASS |

### Protected 12345 reality (read-only audit — not modified)

| Filename pattern | Count (active `modules/`) | Rule conflict |
|---|---:|---|
| `runtime-v10-40-6-stable-patch.js` | 1 | ❌ Explicit §10 violation (grandfathered) |
| `kgen-v1046-morph-dna-runtime.*` | 2 | ❌ Version in filename |
| `kgen-12345-stable-countdown.js` | 1 | ⚠️ Contains `stable` token |
| `modules/archive/*v10.*`, `*v109*` | 20 | ✅ Archive — exempt per ORG-P2-003D policy |
| `kgen-12345-*` / `runtime-*` (no version token) | majority | ✅ Future target per ORG-P2-003F |

**Verdict:** Organization **official naming rule has no internal conflict**. Live 12345 modules contain **legacy versioned filenames** protected from edit in this WorkOrder. Remediation path: **ORG-P2-003F** phased migration + future scoped 12345 WOs.

## Organ Taxonomy (Organization)

`KGEN_TEMPLE_STANDARD.md` §10 organ list vs building blocks §3–§9:

| Organ type | Documented | Naming rule |
|---|---|---|
| UI, runtime loader, wallet, bridge, AI chat | §10 | Stable basename |
| leaderboard, quest board, market/bank panels | §10 | Stable basename |
| House, Shop, Bank, Exchange, Warehouse, Portal | §3–§9 | Role names stable |
| NPC | §4 | Life participant, not filename |

No competing **versioned official organ naming rule** found in Organization or Canon JSON.

## Problems Found

| ID | Issue | Severity | Action |
|---|---|---|---|
| T1 | V8 blueprint vs per-temple image scope ambiguous | Low | Doc-only clarification in Temple Standard |
| T2 | 12345 `runtime-v10-40-6-stable-patch.js` violates §10 | Medium | ORG-P2-003F migration; no edit now |
| T3 | Dual module families (`runtime-*` / `kgen-12345-*`) | Medium | Covered by ORG-P2-003F |
| T4 | 15 temples — no central image registry doc | Low | PROPOSED registry WO |
| T5 | `index.html` temple map link encoding (`K蝺...`) | Low | Frontend WO — unrelated to Canon |

## Checks Run

| Check | Result |
|---|---|
| `git pull origin main` | ✅ @ `fcf948f` |
| Worker gate | ✅ |
| Canon / Temple / JSON cross-read | ✅ |
| 12345 modules filename scan (read-only) | ✅ |
| Protected path diff | ✅ Clean |

## Files Read

- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-AI-Company/CURSOR_REPORTING_RULES.md`
- `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Organization/Temple/README.md`
- `KGEN-Organization/Temple/ROLE.md`
- `KGEN-Organization/Temple/RESPONSIBILITY.md`
- `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md`
- `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-KAIOS/V8/README.md`
- `civilization/index.html`, `index.html` (portal refs)
- `K線西遊記/temples/12345/modules/` (read-only filename audit)

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-008 → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-008_TEMPLE_STANDARD_QA.md` — this report

## Protected Paths Checked

No modifications under protected paths.

## Risks

| Risk | Mitigation |
|---|---|
| Agents add new `*-v10-*` organs to 12345 | Temple ROLE forbids; require Codex WO |
| Shared temple hero images across numeric temples | Maintain per-temple ASSET_MANIFEST when editing allowed |
| Organization standard ignored during 12345 work | Cross-check §10 in every temple handoff |

## Suggested WorkOrders

| Task ID | Title | Status |
|---|---|---|
| ORG-P2-008-IMAGE-REGISTRY | Temple primary image registry (doc-only) | PROPOSED |
| ORG-P2-008-V8-SCOPE | Clarify V8 blueprint vs temple identity in Temple Standard | PROPOSED |

## Do Not Do

- Do not rename 12345 organs in this QA pass.
- Do not merge temple primary images.
- Do not create new version-suffixed official organ files.

## Blockers

None for QA report.

## Recommendation

**APPROVE** ORG-P2-008. Organization temple organ naming and 一圖一神殿 references are **Canon-consistent**. Legacy 12345 filename drift is **known and tracked** via ORG-P2-003F; not a blocker for Organization V2.0 standards.

## Need Codex Review

Yes.

## Need Human Decision

No.
