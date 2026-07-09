# ORG-P2-003 Architecture Duplicate Check

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003 |
| Date | 2026-07-09 |
| Base Commit | 2f7e183a7ca1b60640b05c417acd5abb4dd6e00b |
| Start Status | OPEN |
| End Status | REVIEW |
| Department | Architecture |
| Priority | P1 |
| Owner | Cursor |
| Reviewer | Codex |

## Summary

Scanned the repository after Organization V2.0 introduction for duplicate folders, same-function documents, and conflicting authority paths. **No new duplicate Runtime CURRENT or Bootstrap was created by Organization V2.0.** However, **six legacy parallel systems** remain active alongside the new AI Company + Organization stack. Department template files (25× `WORK_QUEUE.md`, etc.) are **intentional**, not duplicates. Protected paths were not modified.

## Authority Map (Single Source of Truth)

| Function | Active Authority | Legacy / Archaeology |
|---|---|---|
| Boot sequence | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | `archive/boot/`, V1_2, V1_3 |
| Physics Runtime | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | `docs/physics/KGEN_Universe_Physics_Runtime_V*.md` (8 files) |
| Machine Canon | `KGEN-Canon/KGEN_CANON_MASTER.json` | `KGEN-Genesis/GEN-002_Canon/` |
| WorkQueue (live) | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | `KGEN-Cursor-WorkOrders/`, `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` |
| Cursor reports | `KGEN-AI-Company/reports/` | `KGEN-Agent-Office/reports/`, `KGEN-Organization/Reports/` (dept office) |
| Temple 12345 | `K線西遊記/temples/12345/` (protected) | `wukong-temple/` (legacy deploy) |

## Duplicate / Same-Function Findings

### D1 — Triple WorkOrder System (HIGH)

| Path | Version | Status | Overlap |
|---|---|---|---|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | V3.0 Phase 2 | **ACTIVE** | 25 ORG-P2 tasks |
| `KGEN-Cursor-WorkOrders/CURSOR-001..010` | V1.0 | Legacy OPEN | Genesis/Runtime/SDK QA |
| `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` | V1.0 | Legacy OPEN | TASK-001 uncommitted files review |

**Risk:** Cursor may read wrong queue; duplicate QA scope with ORG-P2-004..025.  
**Merge candidate:** Mark `KGEN-Cursor-WorkOrders/` and `CURSOR_WORK_QUEUE.md` as **superseded** with pointer to Organization WorkQueue (doc-only, Codex task).

### D2 — Dual Agent Operating System (MEDIUM)

| Path | Role |
|---|---|
| `KGEN-AI-Company/` | V5.0 employee boot, dispatcher, reports (**ACTIVE**) |
| `KGEN-Agent-Office/` | V4.0 protected-path discipline, legacy CURSOR_WORK_QUEUE |

`KGEN-Agent-Office/README.md` already defers to AI Company for live work. **Not a hard duplicate** but dual read-order lists confuse agents.

**Merge candidate:** Consolidate boot read-order into `CURSOR_EMPLOYEE_BOOT.md` only; Agent Office becomes protected-path + prompt archive.

### D3 — Triple Report Center (MEDIUM)

| Path | Purpose |
|---|---|
| `KGEN-AI-Company/reports/` | Phase 2 Cursor output (**ACTIVE**) |
| `KGEN-Organization/Reports/` | Department office templates |
| `KGEN-Agent-Office/reports/` | Legacy TASK reports |

**Risk:** `KGEN_WORKORDER_STANDARD.md` §10 cites `KGEN-Organization/Reports/` while Phase 2 cites `KGEN-AI-Company/reports/`.  
**Merge candidate:** Update standard doc to name AI Company reports as primary (ORG-P2-024 scope).

### D4 — Triple Canon Layer (MEDIUM)

| Path | Layer |
|---|---|
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable governance |
| `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md` | Org operational canon (V2.0) |
| `KGEN-Genesis/GEN-002_Canon/` | Published Genesis Library volume |

**Risk:** Wording drift between JSON rules and markdown canon.  
**Merge candidate:** None (delete); maintain explicit dependency chain already stated in Civilization Core Canon §Dependencies. Validate in ORG-P2-004.

### D5 — Legacy Temple vs Official 12345 (HIGH)

| Path | Notes |
|---|---|
| `K線西遊記/temples/12345/` | Protected official temple |
| `wukong-temple/` | 27 files, separate index/deploy, listed in AGENTS.md as legacy URL |

**Risk:** Two wallet/temple entry points; divergent maintenance.  
**Merge candidate:** Add legacy banner in `wukong-temple/README_*` pointing to 12345; no code merge without human approval.

### D6 — Identical Physics Runtime V1_6 (LOW, byte-match)

MD5 `32c706d4c9b0cdfb0624dbd8e8510cb3` — same file in:

- `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md`
- `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md`
- `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md`

**Risk:** Stale copy if one path updated. CURRENT file is separate and sole authority.  
**Merge candidate:** Replace copies with symlink or reference note (12345 path is protected — needs human + Codex).

### D7 — Multiple Master Indexes (MEDIUM)

| File | Size | Scope |
|---|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | 9 KB | Cross-library root index (updated for Org V2.0) |
| `docs/KGEN_MASTER_INDEX.md` | 86 KB | Full repo inventory |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | 6 KB | Genesis Library only |

**Risk:** Agents unsure which index is authoritative for navigation.  
**Merge candidate:** Document hierarchy: Library Index → Master Index → department indexes (Documentation task).

### D8 — 12345 Dual Module Naming (MEDIUM, protected)

Inside `K線西遊記/temples/12345/modules/`:

| Prefix | Count | Example |
|---|---|---|
| `runtime-*` | 20 | `runtime-main.js`, `runtime-mother.js` |
| `kgen-12345-*` | 37 | `kgen-12345-boot-runtime.js`, `kgen-12345-ui.js` |

**Risk:** Same-function organs under two naming conventions; DO_NOT_TOUCH forbids new duplicate-function organ files.  
**Merge candidate:** None without human approval; architecture note only.

### D9 — whitepaper/ vs docs/physics/ (LOW)

- `whitepaper/`: 16 markdown files (research/archive tone)
- `docs/physics/`: versioned runtime + CURRENT + final-whitepaper/

Overlapping topic (universe physics) but different governance tier. **Not a Organization V2.0 regression.**

## Intentional Non-Duplicates

| Pattern | Count | Verdict |
|---|---|---|
| Department `WORK_QUEUE.md` | 25 | Unique per department (hash-verified) |
| Department `ROLE.md` / `RESPONSIBILITY.md` / `HANDOFF.md` / `REPORT_TEMPLATE.md` | 25 each | Template family, not clones |
| `KGEN-Runtime/COS-001..010` | 10 organs | Distinct runtime domains |
| `archive/` subtrees | many | Archaeological; keep |
| Versioned Physics Runtime (non-CURRENT) | 8 | Ancestor reference per Boot V1.4 |

## Organization V2.0 Impact

Organization V2.0 **added** `KGEN-Organization/` (26 subdirs) without duplicating:

- Runtime CURRENT
- Boot V1.4
- Token contract
- 12345 temple code

It **does** sit parallel to `KGEN-Cursor-WorkOrders/` and partially overlaps QA scope of CURSOR-001..010 with ORG-P2-004..025.

## Merge Candidate Priority

| Priority | Item | Action Type | Owner |
|---|---|---|---|
| P0 | D1 WorkOrder triple stack | Doc supersede banners | Codex / Documentation |
| P1 | D3 Report path standard | Fix `KGEN_WORKORDER_STANDARD.md` §10 | ORG-P2-024 |
| P1 | D4 Canon alignment | Cross-check JSON vs markdown | ORG-P2-004 |
| P2 | D5 wukong-temple legacy | README redirect | Frontend + human |
| P2 | D7 Index hierarchy | Document in Master Library Index | Documentation |
| P3 | D6 V1_6 byte copies | Reference-only note | Research |
| BLOCKED | D8 12345 module rename | Protected path | Human decision |

## Files Read

- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-AI-Company/CURSOR_REPORTING_RULES.md`
- `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Organization/Architecture/README.md`
- `KGEN-Organization/Architecture/ROLE.md`
- `KGEN-Organization/Architecture/RESPONSIBILITY.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-Agent-Office/README.md`
- `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`
- `KGEN-Cursor-WorkOrders/README.md`
- `KGEN-AI-Company/README.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` (authority reference, not edited)

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003 status OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DUPLICATE_CHECK.md` — this report (created)

## Protected Paths Checked

No modifications to: `contracts/`, `K線西遊記/temples/12345/`, `wallet/`, `bridge/`, `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`, `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`, `docs/physics/final-whitepaper/`, `KGEN/contracts/KGEN_Token_V7_5_2.sol`.

## Checks Run

| Check | Command / Method | Result |
|---|---|---|
| Git pull | `git pull --rebase origin main` | Success → `2f7e183` |
| CURRENT uniqueness | `glob **/*CURRENT*` | Only `KGEN_Universe_Physics_Runtime_CURRENT.md` + `HANDOFF_CURRENT.md` |
| Boot uniqueness (active) | `glob **/*BOOT*` excl. archive | Single active Boot V1.4 |
| Department template hash | Python MD5 on 25 dept files | 25 unique hashes per template type |
| Physics V1_6 identity | `md5sum` 3 paths | Identical hash |
| 12345 module count | `glob modules/*.js` | 58 total; 20 `runtime-*`, 37 `kgen-12345-*` |
| WorkQueue systems | Manual scan | 3 parallel systems found |
| Protected path diff | `git diff --name-only` | No protected paths |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Cursor reads legacy `KGEN-Cursor-WorkOrders` or Agent Office queue instead of Phase 2 | High |
| R2 | Report path ambiguity delays Codex review | Medium |
| R3 | wukong-temple and 12345 diverge on wallet/UI behavior | Medium |
| R4 | 12345 dual module prefixes increase accidental duplicate organ creation | Medium |
| R5 | Three master indexes cause navigation errors for new agents | Medium |

## Blockers

None for this documentation-only audit.

## Recommendation

1. **Codex:** Approve ORG-P2-003; assign Documentation to add **superseded** banners on `KGEN-Cursor-WorkOrders/README.md` and `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`.
2. **Cursor next:** **ORG-P2-004** (P0 Canon alignment) — validates D4 before domain QA.
3. **Defer:** D8 module rename and D6 12345 physics copy removal until explicit human WorkOrder.

## Need Codex Review

**Yes.**

## Need Human Decision

**No** for this task. Human decision required only if pursuing D5 temple merge or D8 module consolidation.
