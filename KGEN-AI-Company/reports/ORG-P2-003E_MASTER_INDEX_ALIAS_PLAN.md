# ORG-P2-003E Master Index Alias Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003E |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-11 |
| Base Commit | 16a384fff2c0b6d58f2d94fe5a22e43684c9ad0d |
| Branch | `cursor-handoff/ORG-P2-003E` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D7 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Confirmed **one unique library-level Master Index** and scoped sub-indexes per ORG-P2-003 D7. Applied **doc-only alias banners** so workers no longer treat `docs/KGEN_MASTER_INDEX.md` or Genesis indexes as competing masters. Extended labeling to **`KGEN-Genesis/000_INDEX/README.md`** and **`README.md`**. Identified **stale inventory drift** (root `KGEN_MASTER_INDEX.md` listed in inventory but absent). **No protected paths modified.**

## D7 Hierarchy (Confirmed)

```text
LIBRARY MASTER (unique)
  └─ KGEN_MASTER_LIBRARY_INDEX.md
       ├─ SUB-INDEX: docs/KGEN_MASTER_INDEX.md           (repo file inventory / AUTOPILOT)
       ├─ SUB-INDEX: KGEN-Genesis/KGEN_MASTER_INDEX.md   (Genesis GEN-001..GEN-012)
       ├─ SUB-INDEX: KGEN-Genesis/000_INDEX/README.md     (Genesis portal mirror)
       └─ MACHINE INDEXES (projection, not prose master):
            KGEN-Canon/KGEN_CANON_MASTER.json
            KGEN-Canon/KGEN_DOCUMENT_INDEX.json
            KGEN-Canon/KGEN_RUNTIME_INDEX.json
            KGEN-Canon/KGEN_SDK_INDEX.json
```

| Role | Path | Label | Scope | Agent rule |
|---|---|---|---|---|
| **Library Master** | `KGEN_MASTER_LIBRARY_INDEX.md` | MASTER | Cross-library portals, Boot, Genesis, Runtime, SDK, Canon, KAIOS | Default navigation entry |
| **Repo inventory sub-index** | `docs/KGEN_MASTER_INDEX.md` | SUB-INDEX | Every tracked file path, category, byte size | File archaeology only |
| **Genesis sub-index** | `KGEN-Genesis/KGEN_MASTER_INDEX.md` | GENESIS SUB-INDEX | GEN-001..GEN-012 metadata | Genesis scope only |
| **Genesis portal index** | `KGEN-Genesis/000_INDEX/README.md` | GENESIS SUB-INDEX | Same Genesis table | Portal entry; mirrors sub-index |
| **Machine indexes** | `KGEN-Canon/*.json` | MACHINE PROJECTION | Machine-readable graphs | Must not override L0–L2 Canon |

## Index Audit

| File | Issue before fix | Resolution |
|---|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | No explicit D7 master label or hierarchy table | LIBRARY MASTER banner + Index Hierarchy (D7) section |
| `docs/KGEN_MASTER_INDEX.md` | Title collides with "Master Index" authority | SUB-INDEX banner pointing to library master |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | `## Master Index` implied competing master | GENESIS SUB-INDEX banner; section → `## Genesis Document Index` |
| `KGEN-Genesis/000_INDEX/README.md` | Same heading drift | SUB-INDEX portal banner; section rename |
| `README.md` | Row label "Master Index" for Genesis portal | Renamed to `Genesis Document Index (sub-index)` |
| Root `KGEN_MASTER_INDEX.md` | Listed in inventory but file absent | Documented drift; no stub created |
| `library/index.html`, root `index.html` | Link to library master | Already correct |

## Wording Changes Applied

1. **`KGEN_MASTER_LIBRARY_INDEX.md`** — LIBRARY MASTER banner, D7 hierarchy table, unique-master statement.
2. **`docs/KGEN_MASTER_INDEX.md`** — SUB-INDEX repository inventory banner.
3. **`KGEN-Genesis/KGEN_MASTER_INDEX.md`** — GENESIS SUB-INDEX banner; `## Genesis Document Index`.
4. **`KGEN-Genesis/000_INDEX/README.md`** — SUB-INDEX portal banner; `## Genesis Document Index`.
5. **`README.md`** — Genesis row label clarified.

## Alias Routing Rules

```text
Library-wide navigation → KGEN_MASTER_LIBRARY_INDEX.md ONLY
File inventory          → docs/KGEN_MASTER_INDEX.md
Genesis GEN-001..012    → KGEN-Genesis/KGEN_MASTER_INDEX.md or 000_INDEX/README.md
Boot step 3             → already lists KGEN_MASTER_LIBRARY_INDEX.md
```

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/000_INDEX/README.md`
- `KGEN-Genesis/README.md`
- `README.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `library/index.html`

## Files Modified

- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/000_INDEX/README.md`
- `README.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003E → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` — this report

## Protected Paths Checked

No modifications under protected paths (contracts, temple 12345, wallet, bridge, Boot, physics CURRENT, final-whitepaper, KGEN token contract).

## Task Result

D7 Master Index alias hierarchy is **confirmed and labeled**. One library master, prose sub-indexes scoped by domain, machine JSON indexes as projections.

## Checks Run

| Check | Result |
|---|---|
| `git pull origin main` | ✅ Up to date @ `16a384f` |
| Worker registry `cursor-01` gate | ✅ ACTIVE, T2 |
| First OPEN task | ✅ ORG-P2-003E |
| Protected path diff | ✅ Clean |
| Root `KGEN_MASTER_INDEX.md` exists | ❌ Missing (inventory drift) |
| Sub-index banners applied | ✅ 4 files |

## Problems Found

1. Naming collision in `docs/KGEN_MASTER_INDEX.md` — fixed with banner.
2. Genesis `## Master Index` heading drift — renamed.
3. Stale inventory row for absent root `KGEN_MASTER_INDEX.md`.
4. README Genesis row label implied repo-wide master — clarified.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| AUTOPILOT regen strips alias banners | Medium | Pin banner in generator template (future WO) |
| Temple graphs cite historical `KGEN_MASTER_INDEX.md` | Low | Documented; protected paths unchanged |
| Machine Canon JSON treated as competing master | Medium | Labeled as projection per ORG-P2-003C |

## Technical Debt

- Regenerate `docs/KGEN_MASTER_INDEX.md` to remove ghost root path row.
- Promote `KGEN_MASTER_LIBRARY_INDEX.md` from Draft for Review to Official.
- Add D7 back-links to `docs/KGEN_SYSTEM_INDEX.md`, `RUNTIME_INDEX`, `FRONTEND_INDEX`.

## Evolution Opportunities

- D7 hierarchy block in `library/` portal HTML.
- `master_index_alias_of` metadata in `KGEN-Canon/KGEN_DOCUMENT_INDEX.json`.

## Research Direction

- Whether AUTOPILOT inventory should live under `KGEN-Canon/` as generated artifact.

## Suggested WorkOrders

| Task ID | Title | Status |
|---|---|---|
| ORG-P2-003F | 12345 module naming migration plan | PROPOSED (OPEN in queue) |
| ORG-P2-022 | Documentation index QA with D7 back-links | PROPOSED (OPEN in queue) |
| ORG-P2-003E-FOLLOWUP-INVENTORY | Regenerate repo inventory; remove stale root row | PROPOSED |

## Do Not Do

- Do not delete sub-index files or rename paths in this pass.
- Do not treat `KGEN-Canon/*.json` as overriding library master or L0–L2 Canon.
- Do not edit protected temple paths for historical index references.

## Blockers

None.

## Recommendation

**APPROVE** ORG-P2-003E. Merge `cursor-handoff/ORG-P2-003E` into `main`. Next OPEN task: **ORG-P2-003F**.

## Need Codex Review

Yes.

## Need Human Decision

No.
