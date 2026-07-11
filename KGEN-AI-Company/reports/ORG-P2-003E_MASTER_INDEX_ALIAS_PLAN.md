# ORG-P2-003E Master Index Alias Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003E |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-11 |
| Base Commit | 16a384fff2c0b6d58f2d94fe5a22e43684c9ad0d |
| Branch | `main` |
| Commit SHA | `f13d814` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D7 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Confirmed **one unique library-level Master Index** and two scoped sub-indexes per ORG-P2-003 D7. Applied **minimal doc-only alias banners** so workers no longer treat `docs/KGEN_MASTER_INDEX.md` or `KGEN-Genesis/KGEN_MASTER_INDEX.md` as competing masters. Identified **stale inventory drift** (`KGEN_MASTER_INDEX.md` listed at repo root in `docs/KGEN_MASTER_INDEX.md` but file is absent). **No protected paths modified.**

## D7 Hierarchy (Confirmed)

```text
LIBRARY MASTER (unique)
  └─ KGEN_MASTER_LIBRARY_INDEX.md
       ├─ SUB-INDEX: docs/KGEN_MASTER_INDEX.md        (repo file inventory / AUTOPILOT)
       ├─ SUB-INDEX: KGEN-Genesis/KGEN_MASTER_INDEX.md (Genesis GEN-001..GEN-012)
       └─ MACHINE INDEXES (projection, not prose master):
            KGEN-Canon/KGEN_CANON_MASTER.json
            KGEN-Canon/KGEN_DOCUMENT_INDEX.json
            KGEN-Canon/KGEN_RUNTIME_INDEX.json
            KGEN-Canon/KGEN_SDK_INDEX.json
```

| Role | Path | Label | Scope | Cursor / agent rule |
|---|---|---|---|---|
| **Library Master** | `KGEN_MASTER_LIBRARY_INDEX.md` | MASTER | Cross-library portals, Boot, Genesis, Runtime, SDK, Canon, KAIOS, Organization | Default navigation entry for "Master Index" |
| **Repo inventory sub-index** | `docs/KGEN_MASTER_INDEX.md` | SUB-INDEX / ALIAS | Every tracked file path, category, byte size | Use for file archaeology; do not override library master |
| **Genesis sub-index** | `KGEN-Genesis/KGEN_MASTER_INDEX.md` | GENESIS SUB-INDEX | GEN-001..GEN-012 publication metadata | Scoped to Genesis Library only |
| **Machine indexes** | `KGEN-Canon/*.json` | MACHINE PROJECTION | Machine-readable document/runtime/SDK graphs | Must not override L0–L2 Canon or library master |

## Index Audit

| File | Title / heading | Issue before fix | Resolution |
|---|---|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | "KGEN Master Library Index" | Correct scope but no explicit D7 master label | Added LIBRARY MASTER INDEX banner + sub-index pointers |
| `docs/KGEN_MASTER_INDEX.md` | `# KGEN MASTER_INDEX` | Name collides with "Master Index" authority | Added SUB-INDEX / ALIAS banner pointing to library master |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | Section `## Master Index` | Implied competing master inside Genesis | Renamed section to `## Genesis Publication Index`; added GENESIS SUB-INDEX banner |
| `KGEN_MASTER_INDEX.md` (repo root) | Listed in `docs/KGEN_MASTER_INDEX.md` inventory | **File missing** — stale AUTOPILOT row | Document drift; recommend future inventory regen WO (PROPOSED) |
| `library/index.html`, root `index.html` | Link to `KGEN_MASTER_LIBRARY_INDEX.md` | Already correct | No change required |
| `README.md` | Links `KGEN_MASTER_LIBRARY_INDEX.md` as Master Library Index | Already correct | No change required |

## Wording Changes Applied (Minimal)

### 1. `KGEN_MASTER_LIBRARY_INDEX.md`

```markdown
> **LIBRARY MASTER INDEX** — Unique cross-library Master Index per ORG-P2-003 D7. Sub-indexes: `docs/KGEN_MASTER_INDEX.md` (repo file inventory), `KGEN-Genesis/KGEN_MASTER_INDEX.md` (Genesis publications GEN-001..GEN-012). Machine-readable indexes live under `KGEN-Canon/`.
```

### 2. `docs/KGEN_MASTER_INDEX.md`

```markdown
> **SUB-INDEX / ALIAS** — Full repository file inventory (AUTOPILOT V1.0). Not the library Master Index. Authoritative cross-library index: `KGEN_MASTER_LIBRARY_INDEX.md`. Decision: ORG-P2-003 D7 (ALIAS).
```

### 3. `KGEN-Genesis/KGEN_MASTER_INDEX.md`

```markdown
> **GENESIS SUB-INDEX** — Lookup table for GEN-001 through GEN-012 within the Genesis Library. Not the library Master Index. Cross-library Master Index: `KGEN_MASTER_LIBRARY_INDEX.md`. Decision: ORG-P2-003 D7 (ALIAS).
```

Section heading `## Master Index` → `## Genesis Publication Index`.

## Proposed Follow-up (Not Applied — Codex Decision)

| Location | Proposed change | Reason |
|---|---|---|
| `docs/KGEN_MASTER_INDEX.md` inventory table | Remove or mark stale row for root `KGEN_MASTER_INDEX.md` | File absent; misleads path lookup |
| `KGEN-Canon/KGEN_DOCUMENT_INDEX.json` | Add `master_index_alias_of` metadata field in future schema WO | Machine index should reference library master |
| `docs/KGEN_SYSTEM_INDEX.md`, `docs/KGEN_RUNTIME_INDEX.md` | Add one-line "see library master" footer | Reduce parallel-index confusion |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-AI-Company/CURSOR_REPORTING_RULES.md`
- `README.md` (master index links)
- `library/index.html` (portal links)

## Files Modified

- `KGEN_MASTER_LIBRARY_INDEX.md` — D7 library master banner
- `docs/KGEN_MASTER_INDEX.md` — sub-index alias banner
- `KGEN-Genesis/KGEN_MASTER_INDEX.md` — genesis sub-index banner + section rename
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003E OPEN → IN_PROGRESS → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` — this report (created)

## Protected Paths Checked

No modifications under:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

## Task Result

D7 Master Index alias hierarchy is **confirmed and labeled**. One library master, two prose sub-indexes, machine JSON indexes scoped as projections. Stale root `KGEN_MASTER_INDEX.md` inventory row flagged for future cleanup.

## Checks Run

| Check | Result |
|---|---|
| `git pull origin main` | ✅ Already up to date @ `16a384f` |
| Worker registry `cursor-01` gate | ✅ ACTIVE, T2, acknowledgments true |
| First OPEN task scan | ✅ ORG-P2-003E |
| Protected path diff | ✅ No protected files touched |
| Root `KGEN_MASTER_INDEX.md` exists | ❌ Missing (inventory drift only) |
| Portal links to library master | ✅ `index.html`, `library/index.html` |

## Problems Found

1. **Naming collision:** `docs/KGEN_MASTER_INDEX.md` used title "KGEN MASTER_INDEX" without alias label — fixed.
2. **Genesis heading drift:** `## Master Index` inside Genesis sub-index implied second master — renamed.
3. **Stale inventory:** `docs/KGEN_MASTER_INDEX.md` lists `KGEN_MASTER_INDEX.md` at repo root (231005 bytes) but file is absent.

## Risks

| Risk | Level | Mitigation |
|---|---|---|
| Agents still cite old "Master Index" paths from temple dependency graphs | Medium | Banners + library master link; temple graphs unchanged (protected) |
| AUTOPILOT regen overwrites alias banners | Low | Regen WO must preserve D7 banners |
| Machine Canon JSON treated as competing master | Medium | Report labels JSON as projection; ORG-P2-003C hierarchy stands |

## Technical Debt

- Regenerate `docs/KGEN_MASTER_INDEX.md` inventory to remove ghost root path.
- Align `KGEN-Canon/KGEN_DOCUMENT_INDEX.json` with D7 alias metadata.

## Evolution Opportunities

- Single `library/` portal page listing Master vs Sub-index vs Machine index roles.
- Link Genesis README sub-index section explicitly to D7 decision.

## Research Direction

- Whether AUTOPILOT inventory should become a generated artifact under `KGEN-Canon/` instead of a prose "master-like" doc.

## Suggested WorkOrders

| Task ID | Title | Status |
|---|---|---|
| ORG-P2-003E-FOLLOWUP-INVENTORY | Regenerate repo inventory; remove stale root `KGEN_MASTER_INDEX.md` row | PROPOSED |
| ORG-P2-003E-FOLLOWUP-CANON-JSON | Add `master_index_alias_of` to machine document index schema | PROPOSED |

## Do Not Do

- Do not delete `docs/KGEN_MASTER_INDEX.md` or `KGEN-Genesis/KGEN_MASTER_INDEX.md` — they remain useful sub-indexes.
- Do not rename files in this pass — alias labels only.
- Do not treat `KGEN-Canon/*.json` as overriding library master or L0–L2 Canon.

## Blockers

None.

## Recommendation

**APPROVE** ORG-P2-003E. Merge doc-only alias banners into `main`. Next OPEN task in queue: **ORG-P2-003F** (12345 module naming migration plan).

## Need Codex Review

Yes.

## Need Human Decision

No.
