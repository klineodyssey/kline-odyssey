# ORG-P2-003D Legacy Reference Policy

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003D |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-10 |
| Base Commit | bfb40a07ff8f952ccb092d1dad6c1c030395eeb7 |
| Branch | `cursor-handoff/ORG-P2-003D` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md` |
| WorkQueue Status | REVIEW |
| Reviewer | Codex |
| Architecture Decision | D5 ARCHIVE + D6 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Drafted a **documentation-only** reference policy for legacy temple and physics-runtime copies. Labels: **Current**, **Legacy**, **Archive**, **Single Source of Truth (SSOT)**. No temple code and no physics runtime files were edited. Locations that need future reference notes are listed for Codex-assigned follow-up WorkOrders (some require human approval because they sit under protected paths).

## Classification Vocabulary

| Label | Meaning | Agent rule |
|---|---|---|
| **Current** | Active official surface for users and agents | Prefer this path; do not fork |
| **Legacy** | Still reachable for compatibility / history | May read; must not treat as SSOT; point to Current |
| **Archive** | Historical snapshot only | Do not extend; do not cite as latest law |
| **SSOT** | Single Source of Truth | Only this path governs active physics / temple identity |

## Policy A — Temple Surfaces (D5 ARCHIVE)

### Official positions

| Role | Path | Label |
|---|---|---|
| Official Wukong / Heart temple | `K線西遊記/temples/12345/` | **Current** + **Protected** |
| Standalone legacy deploy tree | `wukong-temple/` | **Legacy** |
| Versioned HTML under `wukong-temple/archive/` | e.g. `index.html.V2.2` | **Archive** |

### Inventory (wukong-temple)

| Asset | Notes |
|---|---|
| `wukong-temple/index.html` | Legacy public entry |
| `life-forge.html`, `bookstore.html`, `mars-villa/` | Legacy feature shells |
| `README_Wukong_Temple_Deploy_V2_3.md` | Deploy guide; no Current pointer today |
| `README_WUKONG_TEMPLE_AUTOPILOT_V1_6.md` | Autopilot notes |
| `archive/*` | 15+ historical index versions |

### Policy rules (draft)

1. **Current temple identity** is only `K線西遊記/temples/12345/`.
2. `wukong-temple/` remains readable for archaeology and old bookmarks.
3. Agents must not migrate wallet, bridge, or organ code from Legacy → Current without an explicit human + Codex WorkOrder.
4. Agents must not delete `wukong-temple/` under this policy.
5. Future doc WorkOrders may add a **Legacy banner** to `wukong-temple/README_*.md` pointing to Current 12345 — **allowed** (not protected).
6. Editing files under `K線西遊記/temples/12345/` for banners or redirects is **BLOCKED** without human approval (`DO_NOT_TOUCH`).

### Where reference notes are needed (Temple)

| Target | Note type | Authorization |
|---|---|---|
| `wukong-temple/README_Wukong_Temple_Deploy_V2_3.md` | Legacy banner → Current 12345 URL/path | Codex doc WorkOrder |
| `wukong-temple/README_WUKONG_TEMPLE_AUTOPILOT_V1_6.md` | Same Legacy banner | Codex doc WorkOrder |
| `wukong-temple/index.html` (optional HTML comment / visible notice) | “Legacy surface; Current is temples/12345” | Codex + careful UI scope |
| `wukong-temple/archive/README.md` | Archive label | Codex doc WorkOrder |
| AGENTS.md local URL table | Already lists both; clarify Legacy vs Current | Codex doc WorkOrder |
| `K線西遊記/temples/12345/` any file | Do **not** edit under this task | Human + Codex required |

## Policy B — Physics Runtime Copies (D6 ALIAS)

### Official positions

| Role | Path | Label |
|---|---|---|
| Active physics constitution | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | **SSOT** + **Protected** |
| Versioned ancestors under `docs/physics/` | `…_V1_2` … `…_V3_7` | **Archive** (ancestor lineage; CURRENT cites them) |
| Final whitepaper package | `docs/physics/final-whitepaper/` | **Protected** publication set |
| Byte-identical V1_6 copy | `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` | **Legacy alias** (research folder) |
| Byte-identical V1_6 copy | `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md` | **Legacy alias** inside **Protected** temple |

### Byte-identity evidence

MD5 `32c706d4c9b0cdfb0624dbd8e8510cb3` matches all three:

- `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md`
- `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md`
- `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md`

### Policy rules (draft)

1. **SSOT for physics law** is only `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`.
2. Versioned `docs/physics/KGEN_Universe_Physics_Runtime_V*.md` files are **Archive ancestors**; Boot V1.4 forbids treating them as CURRENT.
3. Byte-identical copies outside CURRENT must not be edited as if they were CURRENT.
4. Do **not** delete copies in this policy phase.
5. Reference notes on non-protected copies (`whitepaper/…V1_6.md`, optionally `docs/physics/…V1_6.md`) may say: “Archive / alias — SSOT is Runtime CURRENT.”
6. Reference notes or deletion of the copy under `K線西遊記/temples/12345/` require **human + Codex** (protected path).
7. Creating new same-function physics CURRENT forks is forbidden (`DO_NOT_TOUCH` + Boot rules).

### Where reference notes are needed (Physics)

| Target | Note type | Authorization |
|---|---|---|
| `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` | Alias → CURRENT | Codex doc WorkOrder (not protected) |
| `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md` | Archive ancestor note (if not already clear) | Codex; prefer not rewriting large ancestor bodies — short header note only |
| Other `docs/physics/…_V*.md` | Optional “ancestor of CURRENT” header | Codex doc WorkOrder |
| `docs/physics/README` (if created later) | Map SSOT vs Archive | New file via Documentation WorkOrder |
| `K線西遊記/temples/12345/…V1_6.md` | Alias note or remove-after-approval | **Human + Codex** (protected) |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Do not alter for this task | Protected |

## Forbidden Actions Under This Policy

- Edit or delete `K線西遊記/temples/12345/**`
- Edit Runtime CURRENT or final-whitepaper
- Force-merge `wukong-temple` into 12345
- Delete byte-identical physics copies without a scoped approved WorkOrder
- Create `CURRENT_v2` or duplicate Universe Physics Runtime folders

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Draft policy: Current / Legacy / Archive / SSOT | ✅ |
| Do not edit temple code or physics runtime files | ✅ Report-only |
| Identify where reference notes would be needed | ✅ Tables above |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `wukong-temple/README_Wukong_Temple_Deploy_V2_3.md`
- `wukong-temple/` inventory (27 files)
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` (header only)
- `docs/physics/KGEN_Universe_Physics_Runtime_V*.md` listing
- `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` (hash)
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003D OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md` — this report

## Protected Paths Checked

No modifications to protected paths. Temple and physics runtime bodies untouched.

## Checks Run

| Check | Result |
|---|---|
| Clean branch from `origin/main` | ✅ @ `bfb40a0` |
| First OPEN task | ✅ ORG-P2-003D |
| V1_6 MD5 triple match | ✅ Identical |
| Temple / physics file edits | ✅ None |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Users still land on `wukong-temple` via old URLs | Medium until Legacy banners land |
| R2 | Agents may edit temple-local V1_6 thinking it is CURRENT | Medium — mitigated by this policy |
| R3 | Applying notes inside 12345 without human approval would violate DO_NOT_TOUCH | High if ignored |

## Blockers

None for this draft.

## Recommendation

1. **Codex:** Approve this policy draft.
2. **Next doc WorkOrder (non-protected):** Add Legacy banners to `wukong-temple/README_*.md` and alias note to `whitepaper/…V1_6.md`.
3. **Human decision later:** Whether to annotate or remove `K線西遊記/temples/12345/…V1_6.md`.
4. **Cursor next:** ORG-P2-003E (Master Index alias) or ORG-P2-004.

## Need Codex Review

**Yes.**

## Need Human Decision

**No** for approving this draft. **Yes** before any edit under `K線西遊記/temples/12345/` or Runtime CURRENT.
