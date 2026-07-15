# ORG-P2-003F-FIX1 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Prior Task | ORG-P2-003F (REJECTED — stale handoff `e9429d6`) |
| Prior FIX1 tip | `dbdd905c` (REJECT_NO_CLAIM) — superseded by lawful claim on `7a692c3` |
| Codex Review | `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md` |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Trust Level | T2 |
| Employee Status | ACTIVE |
| Date | 2026-07-15 |
| Base Commit | `7a692c34df50861ab10f8bd80959d95251b1071c` (`origin/main`) |
| Branch | `cursor-handoff/ORG-P2-003F-FIX1` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Claim File | `KGEN-AI-Company/reports/claims/ORG-P2-003F-FIX1_claim.json` |
| Start Status | OPEN → CLAIMED |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |
| Concurrent WorkOrders | **NONE** |

## Summary

Resumed the lawful single-task claim for ORG-P2-003F-FIX1 and completed the D8 **report-only** 12345 module naming migration plan from current `origin/main` (`7a692c3`). Temple 12345 was audited read-only. **Zero protected-path edits.** Official public routes and manifests remain present. Handoff scope is claim lease + WorkQueue status + this report + worker heartbeat only.

---

# Worker Execution Report (Boot SOP)

## State Progress

- BOOT: PASS
- CLAIM: PASS (`CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01`)
- WORK: PASS (plan/report only)
- TEST: PASS (public-route presence + module inventory + pair differ checks)
- REPORT: PASS
- REVIEW: submitted — awaiting Codex
- READY_FOR_PUSH: handoff branch only
- DONE: Codex controlled / not yet

## 1. BOOT

| Check | Result |
|---|---|
| Boot file read | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — YES |
| CURRENT / OFFICIAL / RUNTIME entry | Boot CURRENT confirmed; Temple 12345 cited as protected runtime |
| Request in scope | YES — human `Claim one task`; Cursor executes first OPEN WorkOrder |
| Worker role | Cursor construction / documentation worker; Codex review required |
| **Result** | **PASS** |

## 2. MUST READ

| File | Read |
|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | ✅ |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | ✅ |
| `KGEN_MASTER_LIBRARY_INDEX.md` | ✅ |
| `KGEN-AI-Company/WORKSPACE_POLICY.md` | ✅ |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ✅ |
| `KGEN-KAIOS/worker_registry.json` | ✅ |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | ✅ |
| `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md` | ✅ |
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | ✅ |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | ✅ |
| `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md` | ✅ |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | ✅ |
| `ORG-P2-003F_CODEX_REVIEW.md` | ✅ |
| `ORG-P2-003_ARCHITECTURE_DECISION.md` (D8) | ✅ |
| `docs/KGEN_TEMPLE_12345_MAP.md` | ✅ |
| `docs/KGEN_RUNTIME_RULES.md` | ✅ |

**Workforce gate (`cursor-01`):**

| Field | Value | Gate |
|---|---|---|
| employee_status | ACTIVE | ✅ |
| trust_level | T2 | ✅ |
| can_push_main | false | ✅ |
| allowed_branch_pattern | `cursor-handoff/<Task-ID>` | ✅ |
| boot/canon/workspace/do_not_touch acknowledged | true | ✅ |
| suspension | null | ✅ |

**Credential result:** **PASS** — not `REGISTRATION_REQUIRED`.

## 3. PROTECTED PATH CHECK

| Protected path | In scope? | Modified? |
|---|---|---|
| `contracts` | No | No |
| `K線西遊記/temples/12345` | Audit read-only | **No** |
| `wallet` / `bridge` | No | No |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | No | No |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | No | No |
| `docs/physics/final-whitepaper/` | No | No |
| `KGEN/contracts/KGEN_Token_V7_5_2.sol` | No | No |

**Result:** **PASS** — no protected path touched. Explicit authorization for 12345 edits: **not present** and **not required** for this plan-only WorkOrder.

## 4. TASK PLAN

| Item | Plan |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Task source | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` first OPEN (after prior CLAIM) |
| What will be done | Complete D8 12345 module naming migration plan on base `7a692c3` |
| Files to read | Codex rejection, D8 decision, temple map, runtime rules, `index.html` boot order, modules inventory |
| Files to modify | WorkQueue status, claim lease, worker heartbeat, this report |
| Files NOT touched | All `K線西遊記/temples/12345/` files, public routes, manifests, Boot, Runtime CURRENT |
| Expected outputs | Full SOP report + claim → REVIEW |
| Validation | Public files present; module family counts; overlapping pairs differ; handoff has no deletions |
| Commit / push | Commit on `cursor-handoff/ORG-P2-003F-FIX1`; push handoff; **no main push** |

## 5. TASK CLAIM LEASE

Exactly **one** WorkOrder claimed: `ORG-P2-003F-FIX1`. No concurrent claims.

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
  "heartbeat": "2026-07-15T02:37:08Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md",
  "reviewer": "codex-gm-01",
  "concurrent_tasks": []
}
```

Machine claim file: `KGEN-AI-Company/reports/claims/ORG-P2-003F-FIX1_claim.json` (`claim_id` carried in `notes` to satisfy schema `additionalProperties: false`).

## 6. EXECUTION

```text
Resume CLAIM ORG-P2-003F-FIX1
-> branch cursor-handoff/ORG-P2-003F-FIX1 from origin/main @ 7a692c3
-> IN_PROGRESS
-> read-only module inventory under modules/
-> verify public-route preservation
-> write FIX1 report with full Boot SOP + claim lease
-> REVIEW
-> commit + push handoff
-> stop for Codex Review
```

**Verification Only / No File Change** applies to Temple 12345 and all runtime modules.

### Public route preservation

Codex rejected ORG-P2-003F because stale base `761f0e1` would delete public files. This FIX1 branch preserves all of the following (verified on `7a692c3`):

| File | Present |
|---|---|
| `KGEN-OFFICIAL-LINKS.json` | ✅ |
| `KGEN_PUBLIC_INFORMATION_AUDIT.md` | ✅ |
| `KGEN_LP_LOCK_PUBLIC_PROOF.md` | ✅ |
| `community/index.html` | ✅ |
| `official/index.html` | ✅ |
| `markets/index.html` | ✅ |
| `security/index.html` | ✅ |
| `liquidity-lock/index.html` | ✅ |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | ✅ |
| `KGEN-KAIOS/workforce/WORKER_EXECUTION_REPORT_TEMPLATE.md` | ✅ |

**Handoff diff scope:** WorkQueue + claim lease + worker registry heartbeat + this report. No public-route deletions.

---

## D8 Migration Plan

### Module inventory (read-only audit @ `7a692c3`)

| Family | Count | Role |
|---|---:|---|
| `runtime-*` | 25 | Core shell, life-standard organs, engines (not all HTML-loaded) |
| `kgen-12345-*` | 45 | Config/boot, web3, AI, organs — **primary HTML load chain** |
| `kgen-v*` | 2 | Versioned morph-DNA (`kgen-v1046-morph-dna-runtime.*`) |
| `modules/archive/*` | 20 | Frozen legacy — out of rename scope |
| other | 1 | `README.md` |

Location: `K線西遊記/temples/12345/modules/`

### Live boot order (`index.html` — read only)

1. CSS: `kgen-12345-core.css`, `kgen-12345-divine-regeneration.css`, `runtime-main.css`
2. Parent galaxy: `../../modules/kgen-land-engine.js`
3. Scripts: `kgen-12345-app-shell.js`, `kgen-12345-web3-shell.js`, `kgen-12345-runtime.js`, `kgen-12345-mother-runtime.js`, `kgen-12345-divine-regeneration.js`, `kgen-12345-ai-service.js`
4. `runtime-main.js` — protected UI/runtime owner
5. `kgen-12345-ui.css`
6. `runtime-bootstrap.js` — protected bootstrap
7. `kgen-12345-ui.js`

**Observation:** Legacy `kgen-12345-runtime.js` loads before protected `runtime-main.js`. `runtime-bootstrap.js` loads after `runtime-main.js` and between UI CSS/JS. Any migration must preserve this ordering until legacy shims are formally retired.

### Parallel pairs (merge before rename)

| runtime-* | kgen-12345-* | Byte-identical? | HTML-loaded |
|---|---|---|---|
| `runtime-main.*` | — | n/a | ✅ runtime |
| `runtime-bootstrap.js` | — | n/a | ✅ |
| `runtime-mother.js` | `kgen-12345-mother-runtime.js` | **DIFFER** | kgen |
| `runtime-regeneration.*` | `kgen-12345-divine-regeneration.*` | **DIFFER** | kgen |
| `runtime-cell-registry.json` | `kgen-12345-cell-registry.json` | **DIFFER** | — |
| `runtime-growth-policy.json` | `kgen-12345-growth-policy.json` | **DIFFER** | — |

All checked overlapping pairs **differ** in content — rename-only migration will break references without behavior merge.

### Target convention (future authorized WorkOrders)

```text
temple-12345-<domain>-<role>.<ext>
```

Examples:

- `temple-12345-core-runtime.js`
- `temple-12345-config-boot.js`
- `temple-12345-mother-engine.js`

**Rules:**

- Protected cores rename last (Phase 4 only, with Codex + human WorkOrder).
- `modules/archive/` never renamed — add LEGACY metadata only.
- Version numbers move to `VERSION_GOVERNANCE.json`, not filenames (`kgen-v1046-*` deprecate version-in-name).
- Do not invent a second parallel prefix while `runtime-*` remains live.

### Phases (future — requires separate protected-path WorkOrders)

| Phase | Action | Protected edit? |
|---|---|---|
| 0 | Registry JSON under `docs/` (proposed: `docs/temple-12345/MODULE_NAMING_REGISTRY.json`) | No |
| 1 | Behavior merge per overlapping pair | Yes |
| 2 | Shims + `index.html` script switch | Yes |
| 3 | `LIFE_MANIFEST` / SHA256 atomic update | Yes |
| 4 | Archive deprecated shims | Yes + human gate |

### Rollback

- Tag `temple-12345-modules-pre-migration` before Phase 1
- Shims retained ≥2 release tags
- Backup `LIFE_MANIFEST.json.pre-migration` in archive
- Revert `index.html` script list to rollback

### Compatibility

- `12345.html` bridge URLs unchanged
- Preserve `?v=` cache-bust on script URLs
- Preserve `window.KGEN_RUNTIME_CORE`, `KGEN_12345_CONFIG`, `KGEN_AI_SPEAK` ≥2 releases
- Exclude `modules/archive/` from rename scope

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Start from latest `origin/main` | ✅ `7a692c3` |
| Plan only; no 12345 edits | ✅ |
| Preserve public routes and manifests | ✅ evidence table |
| Do not delete files after stale `761f0e1` base | ✅ no public deletions |
| One WorkOrder on handoff branch | ✅ ORG-P2-003F-FIX1 only |
| Full Worker Boot SOP evidence | ✅ sections 1–6 |
| Claim lease recorded with claim_id | ✅ |
| D8 future migration documented | ✅ |
| Rollback + compatibility | ✅ |

## Files Read

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md`
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md`
- `K線西遊記/temples/12345/index.html` (boot order)
- `K線西遊記/temples/12345/modules/` (inventory + pair diffs)
- `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003F-FIX1 CLAIMED → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` — completed plan
- `KGEN-AI-Company/reports/claims/ORG-P2-003F-FIX1_claim.json` — status REVIEW + heartbeat
- `KGEN-KAIOS/worker_registry.json` — cursor-01 heartbeat / last_report

## Files Intentionally Not Modified

All Temple 12345 modules, `index.html`, Canon, Boot, Runtime CURRENT, public HTML routes, `KGEN-OFFICIAL-LINKS.json`, and other protected paths.

## Checks Run

- Module family counts on `7a692c3`
- `index.html` module reference order extraction
- Overlapping pair byte comparison (all DIFFER)
- Public route / manifest presence table
- Workforce registration gate for `cursor-01`

## Problems Found

- Dual live naming families (`runtime-*` and `kgen-12345-*`) plus `kgen-v*` create rename risk.
- Prior ORG-P2-003F handoff remains REJECTED evidence only — must not be merged.
- Prior FIX1 tip `dbdd905c` remains REJECT_NO_CLAIM evidence — this branch supersedes it from current main.

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Dual `runtime-*` / `kgen-12345-*` families confuse ownership | High |
| R2 | Rename without merge breaks boot chain | Critical |
| R3 | `kgen-v*` parallel naming adds third family | Medium |

## Technical Debt

- Overlapping mother/regeneration/registry/policy twins differ and need merge WorkOrders before any rename.
- Boot order mixes legacy `kgen-12345-*` and protected `runtime-*` cores.

## Evolution Opportunities

- Phase 0 registry under `docs/` enables machine-readable migration without touching 12345.
- Future WorkOrders can retire version-in-filename (`kgen-v*`) into governance JSON.

## Research Direction

- Map every HTML-loaded vs deferred module before Phase 1 merges.
- Confirm which globals must remain stable across shim windows.

## Suggested WorkOrders

| Suggested ID | Status | Purpose |
|---|---|---|
| ORG-P2-003F-REG0 | PROPOSED | Create `docs/temple-12345/MODULE_NAMING_REGISTRY.json` (non-protected) |
| ORG-P2-004 | Already OPEN | Canon alignment — next eligible OPEN after this REVIEW |

Cursor must not promote PROPOSED suggestions to OPEN.

## Do Not Do

- Do not merge `origin/cursor-handoff/ORG-P2-003F`.
- Do not edit `K線西遊記/temples/12345/` from this plan.
- Do not rename modules without Codex + human protected-path WorkOrders.
- Do not claim concurrent WorkOrders while this lease is active.

## Blockers

None for plan delivery. Protected-path edits blocked until future authorized WorkOrders.

## Recommendation

1. **Codex:** Approve FIX1 if diff stays report/queue/claim/registry-only and public routes intact.
2. **Do not merge** rejected `ORG-P2-003F` or REJECT_NO_CLAIM tip `dbdd905c`.
3. **Do not authorize** protected 12345 edits from this plan alone.
4. **Next OPEN after FIX reviews:** ORG-P2-004 (P0 Canon alignment — fresh single-task claim required).

## Need Codex Review

YES

## Need Human Decision

Only if Codex proposes authorizing Phase 1+ protected 12345 edits; not required to accept this plan report.

## Worker Sign-off

Task ORG-P2-003F-FIX1 complete. Status **REVIEW**. Awaiting Codex decision.
