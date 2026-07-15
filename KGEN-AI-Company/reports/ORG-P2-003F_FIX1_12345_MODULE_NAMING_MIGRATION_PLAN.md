# ORG-P2-003F-FIX1 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Trigger | `KAIOS BOOT` → `Claim one task` |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-15 |
| Base Commit | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| Branch | `cursor/org-p2-003f-fix1-a008` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |
| Prior Rejection | `ORG-P2-003F_CODEX_REVIEW.md` (stale base `761f0e1`) |

## Summary

Completed **KAIOS Worker Boot**, claimed exactly one OPEN WorkOrder (`ORG-P2-003F-FIX1`), and produced a **report-only** D8 migration plan from current `origin/main` (`7a692c3`). Temple 12345 modules were audited read-only. Zero deletions. Public routes preserved. No concurrent claims.

---

# Worker Execution Report

## 1. BOOT

- Boot phrase: `KAIOS BOOT` (prior session) + `Claim one task`
- Boot file: `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — CURRENT confirmed
- Physics Runtime CURRENT / Universe Map / AGENTS.md — read (boot pack)
- Result: **BOOT_COMPLETE / PASS**

## 2. MUST READ

| File | Result |
|---|---|
| `KGEN-KAIOS/WORKER_REGISTRY.md` + `worker_registry.json` | ✅ cursor-01 ACTIVE T2 |
| `WORK_QUEUE.md` | ✅ first OPEN = ORG-P2-003F-FIX1 |
| `CURSOR_EMPLOYEE_BOOT.md` / `CURSOR_AUTO_WORK_PROTOCOL.md` | ✅ |
| `DO_NOT_TOUCH.md` | ✅ |
| `ORG-P2-003F_CODEX_REVIEW.md` | ✅ stale-base rejection context |
| `ORG-P2-003_ARCHITECTURE_DECISION.md` | ✅ D8 decision |
| `docs/KGEN_TEMPLE_12345_MAP.md` | ✅ dependency graph |
| `docs/KGEN_RUNTIME_RULES.md` | ✅ protected paths |

| Credential | Value |
|---|---|
| worker_id | cursor-01 |
| employee_status | ACTIVE |
| trust_level | T2 |
| allowed_branch_pattern | `cursor-handoff/<Task-ID>` |
| can_push_main | false |
| acknowledgments | boot/canon/workspace/do_not_touch = true |
| suspension | none |
| Credential result | **PASS** |

## 3. PROTECTED PATH CHECK

No modifications to contracts, `K線西遊記/temples/12345/`, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or token contract.

Result: **PASS**

## 4. TASK CLAIM LEASE

```json
{
  "task_id": "ORG-P2-003F-FIX1",
  "worker_id": "cursor-01",
  "worker_type": "Cursor",
  "status": "REVIEW",
  "branch": "cursor/org-p2-003f-fix1-a008",
  "base_commit": "7a692c34df50861ab10f8bd80959d95251b1071c",
  "claimed_at": "2026-07-15T02:10:00Z",
  "lease_expires_at": "2026-07-15T06:10:00Z",
  "heartbeat": "2026-07-15T02:15:00Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md",
  "reviewer": "codex-gm-01",
  "notes": "KAIOS BOOT single-task claim; report-only; no 12345 edits"
}
```

| Field | Value |
|---|---|
| claim_id | `CLAIM-ORG-P2-003F-FIX1-20260715T0210-cursor-01` |
| Concurrent tasks | **NONE** |

Lifecycle: BOOT → CLAIM → WORK → REPORT → REVIEW

## 5. EXECUTION

- Mode: **Draft / report-only** (D8 FUTURE MIGRATION)
- Branch from `origin/main` @ `7a692c3`
- Temple 12345: **read-only audit** — 0 file edits

### 5.1 Current Module Inventory (read-only)

Audited `K線西遊記/temples/12345/modules/` on current main:

| Family | Count | Pattern | Role |
|---|---:|---|---|
| `kgen-12345-*` | 46 | `kgen-12345-<organ>.{js,css,json}` | Temple-scoped life organs, shells, UI, DNA |
| `runtime-*` | 24 | `runtime-<organ>.{js,css,json}` | Bootstrap, main loop, panels, recording, layout |
| `kgen-v1046-*` | 2 | version-prefixed legacy morph DNA | Historical version prefix drift |
| **Total active modules** | **72** | | excludes `archive/` |

### 5.2 Current `index.html` Load Order (authoritative boot chain)

Scripts loaded by live `index.html` (bottom of file):

```text
../../modules/kgen-land-engine.js          (parent galaxy module)
modules/kgen-12345-app-shell.js
modules/kgen-12345-web3-shell.js
modules/kgen-12345-runtime.js              (legacy inline extraction)
modules/kgen-12345-mother-runtime.js
modules/kgen-12345-divine-regeneration.js
modules/kgen-12345-ai-service.js
modules/runtime-main.js                    (formal runtime entry)
modules/runtime-bootstrap.js               (immune boot organ)
modules/kgen-12345-ui.js
```

Stylesheets:

```text
modules/kgen-12345-core.css
modules/kgen-12345-divine-regeneration.css
modules/runtime-main.css
modules/kgen-12345-ui.css
```

**Boot spine:** `runtime-bootstrap.js` → `runtime-main.js` → `LIFE_MANIFEST.json` + `RUNTIME_GENOME.json`

Many additional `runtime-*` and `kgen-12345-*` files exist on disk but are loaded dynamically or via internal imports — not all are in the static `index.html` script list. Any rename must preserve this spine and dynamic import graph.

### 5.3 Naming Drift Analysis

| Issue | Examples | Risk |
|---|---|---|
| Dual prefix families | `runtime-main.js` vs `kgen-12345-runtime.js` | Unclear which is canonical for new organs |
| Version in filename | `kgen-v1046-morph-dna-runtime.js`, `runtime-v10-40-6-stable-patch.js` | Violates VERSION_FILENAME_BLOCK in module headers |
| Overlapping semantics | `runtime-mother.js` vs `kgen-12345-mother-runtime.js` | Duplicate naming intent |
| Legacy parallel loaders | `kgen-12345-runtime.js` loaded before `runtime-main.js` | Migration must not break backward compat |
| Registry JSON split | `runtime-cell-registry.json` vs `kgen-12345-cell-registry.json` | Two cell registries |

### 5.4 Proposed Official Naming Standard (future)

D8 requires one official pattern **before** any protected file edit:

```text
temple-12345-<layer>-<organ>.<ext>

Layers:
  boot    — bootstrap / immune (today: runtime-bootstrap.js)
  core    — main runtime loop (today: runtime-main.js)
  shell   — app/web3/ui shells (today: kgen-12345-*-shell.js)
  organ   — life organs (today: most kgen-12345-* and runtime-* organs)
  data    — registries and policies (today: *-registry.json, *-policy.json)
  legacy  — read-only aliases during transition (no new files)
```

**Rules:**

1. No version numbers in filenames (`v10-40-6`, `v1046` → metadata only).
2. One canonical file per organ; legacy names become thin re-export shims during transition.
3. `runtime-bootstrap.js` and `runtime-main.js` rename only in a dedicated protected-path WorkOrder with Human + Codex approval.
4. New modules use `temple-12345-*` only; no new `kgen-12345-*` or bare `runtime-*` files.

### 5.5 Phased Migration Plan

| Phase | Scope | Actions | Protected-path edit? |
|---|---|---|---|
| **P0 — Registry** | docs only | Publish machine-readable `MODULE_NAMING_REGISTRY.json` under `docs/` mapping old→new names | No |
| **P1 — Documentation** | docs + module README | Label every module as `CANONICAL`, `LEGACY_ALIAS`, or `DEPRECATE_CANDIDATE` | No |
| **P2 — Shim layer** | 12345 modules | Add `legacy/` re-export shims; keep old paths working | Yes — requires new WorkOrder |
| **P3 — index.html** | `index.html` | Switch script tags to canonical names one organ at a time | Yes — protected |
| **P4 — Cleanup** | archive | Move unreferenced modules to `modules/archive/` with manifest update | Yes — SHA256SUMS update |

**Estimated module groups for P2–P4:** 72 files across 4 phases; each phase is one scoped WorkOrder with rollback tag.

### 5.6 Rollback and Compatibility

| Requirement | Plan |
|---|---|
| Rollback | Each phase tagged; `index.html` reverts to prior script list; shims remain until P4 |
| SHA256SUMS / MANIFEST | Updated only in dedicated manifest WorkOrder; never in this report task |
| LIFE_MANIFEST / RUNTIME_GENOME | Path references updated in genome WorkOrder after shim validation |
| External deep links | Old URLs (`modules/kgen-12345-runtime.js`) served via shim for ≥1 release cycle |
| wukong-temple legacy | No migration; D5 ARCHIVE policy unchanged |

### 5.7 Public Routes Preservation Check

Verified present on base commit `7a692c3`:

| File | Status |
|---|---|
| `KGEN-OFFICIAL-LINKS.json` | ✅ present |
| `community/index.html` | ✅ present |
| `official/index.html` | ✅ present |
| `markets/index.html` | ✅ present |
| `security/index.html` | ✅ present |
| `liquidity-lock/index.html` | ✅ present |

Deletions vs main: **none** (report-only task).

### Files Modified (this task)

| File | Change |
|---|---|
| `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` | created |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | OPEN → IN_PROGRESS → REVIEW |
| `KGEN-KAIOS/worker_registry.json` | claim metadata for cursor-01 |

### Checks

| Check | Result |
|---|---|
| Latest main base | ✅ `7a692c3` |
| Deletions vs main | ✅ none |
| One task only | ✅ |
| Claim lease complete | ✅ |
| Public routes intact | ✅ |
| Temple 12345 untouched | ✅ |
| Report-only (D8) | ✅ |

## 6. FINAL REPORT

- Final result: **PASS**
- Visible state: BOOT → CLAIM → WORK → REPORT → REVIEW → READY_FOR_PUSH
- Push: handoff branch only (not main)
- WorkQueue: OPEN → IN_PROGRESS → REVIEW
- DONE: Codex only
- Codex review needed: **YES**

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Breaking boot spine on rename | High | Phase P2 shims; never rename bootstrap+main in same commit |
| Dynamic import graph unknown | Medium | Run dependency scan WorkOrder before P3 |
| Dual registry JSON divergence | Medium | Merge registries in P0 registry doc first |
| Stale-base handoff (prior rejection) | High | This FIX1 starts from `7a692c3`; no unrelated file changes |

## Blockers

None for report approval. **Implementation blocked** until Codex creates scoped WorkOrders for P0–P4.

## Recommendation

**APPROVE** ORG-P2-003F-FIX1 as a D8 future-migration plan. Do not merge any 12345 code changes from this branch — report and governance metadata only.

## Suggested Follow-Up WorkOrders (PROPOSED — not OPEN)

| Proposed ID | Scope | Priority |
|---|---|---|
| ORG-P2-003F-P0 | Publish `docs/MODULE_NAMING_REGISTRY.json` | P2 |
| ORG-P2-003F-P2 | Shim layer for top-10 loaded modules | P1 |
| ORG-P2-003F-P3 | `index.html` script tag migration (protected) | P0 |

## Need Codex Review

Completed. Awaiting Codex decision.
