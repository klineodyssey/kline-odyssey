# ORG-P2-003E Master Index Alias Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003E |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-12 |
| Base Commit | fcf948f |
| Branch | `cursor-handoff/ORG-P2-003E` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | Codex |
| Architecture Decision | D7 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Confirmed **one unique library-level Master Index** and mapped all other `KGEN_MASTER_INDEX` names as **scoped sub-indexes or aliases**. Proposed **minimal doc-only wording** (P1–P7). **No protected paths modified.** **Report-only** — no index file edits in this handoff.

## D7 Hierarchy (Official)

| Role | Label | Path | Scope |
|---|---|---|---|
| **Unique Master** | Library Master Index | `KGEN_MASTER_LIBRARY_INDEX.md` | Cross-library router (Boot, Genesis, KAIOS, WorkQueue, Canon) |
| **Sub-index** | Repository Inventory | `docs/KGEN_MASTER_INDEX.md` | AUTOPILOT full file inventory (~86 KB) |
| **Sub-index** | Genesis Library Index | `KGEN-Genesis/KGEN_MASTER_INDEX.md` | GEN-001–GEN-012 metadata |
| **Alias** | Genesis 000_INDEX README | `KGEN-Genesis/000_INDEX/README.md` | Byte-identical to Genesis sub-index |

```text
KGEN_MASTER_LIBRARY_INDEX.md     ← UNIQUE library Master
├── docs/KGEN_MASTER_INDEX.md    ← repo inventory sub-index
└── KGEN-Genesis/KGEN_MASTER_INDEX.md
    └── KGEN-Genesis/000_INDEX/README.md  (alias)
```

## Agent Routing

| Intent | Read | Do not use as Master |
|---|---|---|
| Library / portal / Boot entry | `KGEN_MASTER_LIBRARY_INDEX.md` | `docs/KGEN_MASTER_INDEX.md` |
| File exists? category? bytes? | `docs/KGEN_MASTER_INDEX.md` | Library Master |
| GEN document UUID / level | `KGEN-Genesis/KGEN_MASTER_INDEX.md` | Root README link alone |

## Audit Findings

| ID | Finding |
|---|---|
| F1 | No `KGEN_MASTER_INDEX.md` at repo root (correct) |
| F2 | `docs/KGEN_MASTER_INDEX.md` is AUTOPILOT inventory with Windows paths |
| F3 | `KGEN-Genesis/000_INDEX/README.md` ≡ `KGEN-Genesis/KGEN_MASTER_INDEX.md` |
| F4 | `docs/KGEN_SYSTEM_INDEX.md` line ~770 lists non-existent root `KGEN_MASTER_INDEX.md` |
| F5 | Root `README.md` links Genesis “Master Index” to `000_INDEX/README.md` (alias OK if labeled) |
| F6 | `KGEN_MASTER_LIBRARY_INDEX.md` lacks explicit sub-index cross-links (deferred from 003A) |
| F7 | GEN-001–012 publication step 5 says「KGEN_MASTER_INDEX、000_INDEX」without scoped paths |

## Proposed Minimal Wording (not applied)

**P1** — `KGEN_MASTER_LIBRARY_INDEX.md` top banner: only library Master; list two sub-index paths.

**P2** — `docs/KGEN_MASTER_INDEX.md` banner: SUB-INDEX inventory; points to Library Master.

**P3** — `KGEN-Genesis/KGEN_MASTER_INDEX.md` banner: Genesis sub-index; Pages alias `000_INDEX/README.md`.

**P4** — `KGEN-Genesis/000_INDEX/README.md` banner: ALIAS of canonical Genesis sub-index.

**P5** — `docs/KGEN_SYSTEM_INDEX.md`: fix path to `docs/KGEN_MASTER_INDEX.md`.

**P6** — Root `README.md`: rename row to「Genesis Library Index」→ `KGEN-Genesis/KGEN_MASTER_INDEX.md`.

**P7** — GEN publication checklist: scoped path names (Canon cumulative WO).

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Confirm unique Master vs sub-index/alias | ✅ |
| Propose minimal wording only | ✅ P1–P7 |
| No protected path modified | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/000_INDEX/README.md`
- `docs/KGEN_SYSTEM_INDEX.md`
- `README.md`
- `library/index.html`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003E → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md` — created

## Protected Paths Checked

No changes under contracts, `K線西遊記/temples/12345`, wallet, bridge, Boot CURRENT, Runtime CURRENT, final-whitepaper, or KGEN token contract.

## Recommendation

1. Codex approve ORG-P2-003E; merge this **report-only** handoff (replaces stale `fa2b8bd` branch that bundled non-task doc edits).
2. Implement P1–P6 in a follow-up doc-only WO; defer P7 to Canon update.
3. Next OPEN after merge: ORG-P2-003F.

## Need Codex Review

**Yes.**
