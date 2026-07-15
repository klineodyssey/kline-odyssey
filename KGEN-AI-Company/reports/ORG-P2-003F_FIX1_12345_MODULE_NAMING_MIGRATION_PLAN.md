# ORG-P2-003F-FIX1 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Prior Task | ORG-P2-003F (REJECTED — stale handoff) |
| Codex Review | `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md` |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Trust Level | T2 |
| Employee Status | ACTIVE |
| Date | 2026-07-15 |
| Base Commit | `7a692c34df50861ab10f8bd80959d95251b1071c` (`origin/main`) |
| Branch | `cursor-handoff/ORG-P2-003F-FIX1` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Reissued D8 **report-only** 12345 module naming migration plan from current `origin/main` (`7a692c3`). Temple 12345 audited read-only. Inventoried **25** `runtime-*` and **45** `kgen-12345-*` active modules. `RUNTIME_GENOME.json` owner = `modules/runtime-main.js`. Documented dual-load boot order, four-phase migration, and rollback rules. **Zero protected-path edits.** Handoff diff = claim file, report, registry heartbeat, and `WORK_QUEUE.md`.

---

# Worker Execution Report (Boot SOP + Claim Lease)

## 1. BOOT

| Check | Result |
|---|---|
| Boot file read | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — YES |
| CURRENT / OFFICIAL / RUNTIME entry | Boot CURRENT confirmed; Temple 12345 cited as protected |
| User request | `Claim one task` — within Cursor worker scope |
| Worker role | Cursor construction worker; Codex review required |
| **Result** | **PASS** |

## 2. MUST READ / CREDENTIALS

| Check | Result |
|---|---|
| `worker_id` | cursor-01 |
| `employee_status` | ACTIVE |
| `trust_level` | T2 |
| `allowed_branch_pattern` | `cursor-handoff/<Task-ID>` |
| `can_push_main` | false |
| `reviewer` | codex-gm-01 |
| Boot / Canon / Workspace / DO_NOT_TOUCH ack | true |
| Suspension | none |
| **Credential result** | **PASS** |

Files read: Boot CURRENT, WORK_QUEUE, worker_registry, TASK_CLAIM_LEASE_PROTOCOL, WORKER_BOOT_SOP, DO_NOT_TOUCH, ORG-P2-003F_CODEX_REVIEW, D8 architecture decision, `docs/KGEN_TEMPLE_12345_MAP.md`, `docs/KGEN_RUNTIME_RULES.md`, `K線西遊記/temples/12345/index.html` (script tags), `RUNTIME_GENOME.json`, modules directory listing.

## 3. PROTECTED PATH CHECK

| Path | Modified |
|---|---|
| `K線西遊記/temples/12345/` | **NO** (read-only audit) |
| contracts / wallet / bridge | NO |
| Boot CURRENT / Runtime CURRENT / final-whitepaper / token | NO |

**Result:** PASS

## 4. TASK CLAIM LEASE

Exactly **one** OPEN WorkOrder claimed: `ORG-P2-003F-FIX1`.

```json
{
  "claim_id": "CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01",
  "task_id": "ORG-P2-003F-FIX1",
  "worker_id": "cursor-01",
  "worker_type": "Cursor",
  "status": "REVIEW",
  "branch": "cursor-handoff/ORG-P2-003F-FIX1",
  "base_commit": "7a692c34df50861ab10f8bd80959d95251b1071c",
  "claimed_at": "2026-07-15T02:05:59Z",
  "lease_expires_at": "2026-07-15T06:05:59Z",
  "heartbeat": "2026-07-15T02:10:00Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md",
  "reviewer": "codex-gm-01",
  "concurrent_tasks": [],
  "notes": "Claim reserved in b654066; execution completed in same lease window."
}
```

| Field | Value |
|---|---|
| `claim_id` | `CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01` |
| Machine claim file | `KGEN-AI-Company/reports/claims/ORG-P2-003F-FIX1_claim.json` |
| Concurrent tasks | **NONE** |

Lifecycle: OPEN → CLAIMED → IN_PROGRESS → REVIEW

## 5. TASK PLAN / EXECUTION

| Item | Plan |
|---|---|
| What will be done | D8 migration plan from `7a692c3` |
| Files to modify | claim JSON, `WORK_QUEUE.md`, this report, worker registry heartbeat |
| Files NOT touched | All `K線西遊記/temples/12345/` modules, public routes |
| Validation | Public-route presence; zero deletions vs main |

---

## D8 Module Inventory (read-only, 2026-07-15)

| Family | Count | Genome owner |
|---|---:|---|
| `runtime-*` | **25** | `modules/runtime-main.js` |
| `kgen-12345-*` | **45** | legacy parallel layer |
| **Total named** | **70** | — |

### Production boot order (`index.html` script tags)

| # | Module | Role |
|---:|---|---|
| 1 | `kgen-12345-app-shell.js` | App shell |
| 2 | `kgen-12345-web3-shell.js` | Web3 shell |
| 3 | `kgen-12345-runtime.js` | Legacy runtime facade |
| 4 | `kgen-12345-mother-runtime.js` | Legacy mother runtime |
| 5 | `kgen-12345-divine-regeneration.js` | Legacy regeneration |
| 6 | `kgen-12345-ai-service.js` | AI service overlay |
| 7 | `runtime-main.js` | **Genome owner / primary runtime** |
| 8 | `runtime-bootstrap.js` | Boot immune organ |
| 9 | `kgen-12345-ui.js` | UI overlay |

CSS dual-load: `kgen-12345-core.css`, `kgen-12345-divine-regeneration.css`, `runtime-main.css`.

### Known dual-load pairs (compatibility-critical)

| `runtime-*` (target) | `kgen-12345-*` (legacy parallel) |
|---|---|
| `runtime-main.js` | `kgen-12345-runtime.js` |
| `runtime-mother.js` | `kgen-12345-mother-runtime.js` |
| `runtime-regeneration.js` | `kgen-12345-divine-regeneration.js` |
| `runtime-bootstrap.js` | `kgen-12345-boot-runtime.js` (exists; not in bottom script block) |

### Official naming target (proposed, not applied)

**Pattern:** `runtime-<organ>.{js,css,json}` under `modules/`, with `runtime-main.js` as sole genome owner entry.

Legacy `kgen-12345-*` files become **deprecated aliases** until Phase 4 removal. No new `kgen-12345-*` modules after migration freeze.

---

## Four-Phase Migration Plan

### Phase 0 — Inventory freeze (this WorkOrder)

- Publish module registry and boot order (this report).
- Codex approves plan before any 12345 file edit.
- **Status:** complete in report.

### Phase 1 — Shim documentation (future scoped WO)

- Add read-only `MODULE_NAMING_REGISTRY.md` inside 12345 (requires separate Codex-scoped WO).
- Document alias map; no renames.

### Phase 2 — Compatibility loaders (future scoped WO)

- Introduce thin re-export shims: `kgen-12345-runtime.js` → delegates to `runtime-main.js`.
- Keep **both** script tags in `index.html` during validation.
- Run `verify_manifest.js` / temple health checks after each shim.

### Phase 3 — Boot order consolidation (future scoped WO)

- Collapse dual script tags one pair at a time.
- Update `RUNTIME_GENOME.json` module list only after boot proof.
- Human + Codex gate per pair.

### Phase 4 — Deprecation (future scoped WO)

- Move unused `kgen-12345-*` to `modules/archive/`.
- Minimum 30-day alias retention per `docs/KGEN_RUNTIME_RULES.md` convention.

---

## Rollback Rules

1. Any boot failure → revert last script-tag or shim change immediately.
2. Never remove `runtime-bootstrap.js` from boot chain.
3. Never rename `runtime-main.js` (genome owner).
4. Keep git tag of last known-good `index.html` before each phase.
5. Rollback does not require public-route or manifest changes outside 12345.

---

## Public Route Preservation

| Asset | Present on branch |
|---|---|
| `KGEN-OFFICIAL-LINKS.json` | ✅ |
| `community/`, `official/`, `markets/`, `security/`, `liquidity-lock/` | ✅ |
| Workforce / KAIOS Kernel docs from `7a692c3` | ✅ |

**Diff vs main:** claim + report + registry + `WORK_QUEUE.md`. **Zero deletions.**

---

## 6. FINAL REPORT

| Field | Value |
|---|---|
| Final result | **PASS** (awaiting Codex) |
| WorkQueue | OPEN → CLAIMED → IN_PROGRESS → REVIEW |
| Protected path violation | NO |
| Codex review needed | YES |

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Start from latest `origin/main` | ✅ `7a692c3` |
| Plan/report only; no 12345 edits | ✅ |
| Preserve public routes | ✅ |
| One WorkOrder only | ✅ |
| Full Worker Boot SOP + claim lease | ✅ |
| Rollback requirements documented | ✅ |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Removing legacy script before shim validation breaks boot | High |
| R2 | 45 legacy modules have uneven load coverage | Medium |
| R3 | Dual CSS load order affects UI regression | Medium |

## Recommendation

1. **Codex:** Approve FIX1 if diff is additive-only vs `origin/main`.
2. **Do not merge** rejected `origin/cursor-handoff/ORG-P2-003F`.
3. **Next:** Scoped implementation WOs for Phase 1–4 after Human + Codex approval.

## Worker Sign-off

Task ORG-P2-003F-FIX1 claimed and complete. Status **REVIEW**. Awaiting Codex.
