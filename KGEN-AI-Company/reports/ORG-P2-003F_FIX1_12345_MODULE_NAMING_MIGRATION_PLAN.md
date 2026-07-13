# ORG-P2-003F-FIX1 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Prior Task | ORG-P2-003F (REJECTED — stale handoff `e9429d6`) |
| Codex Review | `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md` |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Trust Level | T2 |
| Employee Status | ACTIVE |
| Date | 2026-07-13 |
| Base Commit | `bf1a46f` (`origin/main` — docs(kaios): close general manager daily operation) |
| Branch | `cursor-handoff/ORG-P2-003F-FIX1` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Reissued D8 **report-only** migration plan from current `origin/main` (`bf1a46f`) after Codex rejected ORG-P2-003F for stale-base deletions of public routes. Temple 12345 audited read-only. **Zero protected-path edits.** Handoff diff limited to this report and `WORK_QUEUE.md`.

---

# Worker Execution Report (Boot SOP + Claim Lease)

## 1. BOOT

| Check | Result |
|---|---|
| Boot file read | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — YES |
| CURRENT / OFFICIAL / RUNTIME entry | Boot CURRENT confirmed; Temple 12345 cited as protected runtime |
| Request in scope | YES — migration plan documentation only |
| Worker role | Cursor construction worker; Codex review required |
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

**Result:** **PASS** — no protected path touched.

## 4. TASK CLAIM LEASE

Exactly **one** OPEN WorkOrder claimed: `ORG-P2-003F-FIX1`.

```json
{
  "task_id": "ORG-P2-003F-FIX1",
  "worker_id": "cursor-01",
  "worker_type": "Cursor",
  "status": "REVIEW",
  "branch": "cursor-handoff/ORG-P2-003F-FIX1",
  "base_commit": "bf1a46f2dcc32af41c9a57ca2a38ce30aa82c7e7",
  "claimed_at": "2026-07-13T02:35:00Z",
  "lease_expires_at": "2026-07-13T06:35:00Z",
  "heartbeat": "2026-07-13T02:35:00Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md",
  "concurrent_tasks": []
}
```

## 5. TASK PLAN

| Item | Plan |
|---|---|
| What will be done | Re-deliver D8 12345 module naming migration plan from `bf1a46f` |
| Files to read | Codex rejection, D8 decision, temple map, runtime rules, `index.html` boot order |
| Files to modify | `WORK_QUEUE.md` (status only), this report |
| Files NOT touched | All `K線西遊記/temples/12345/` modules, public routes, manifests |
| Validation | Verify Codex-listed public files exist; diff = 2 files only |
| Commit / push | One commit on `cursor-handoff/ORG-P2-003F-FIX1`; push handoff; no `main` push |

## 6. EXECUTION

```text
Claim ORG-P2-003F-FIX1
-> checkout cursor-handoff/ORG-P2-003F-FIX1 from origin/main @ bf1a46f
-> IN_PROGRESS
-> read-only module inventory under modules/
-> write FIX1 report with SOP + claim lease
-> verify public-route preservation
-> REVIEW
-> commit + push handoff
-> stop for Codex Review
```

**Verification Only / No File Change** applies to Temple 12345 and all runtime modules.

### Public route preservation

Codex rejected ORG-P2-003F because stale base `761f0e1` would delete public files. This FIX1 branch preserves all of the following (verified on `bf1a46f`):

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

**Handoff diff scope:** only `WORK_QUEUE.md` + this report. No deletions.

---

## D8 Migration Plan

### Module inventory (read-only audit @ `bf1a46f`)

| Family | Count | Role |
|---|---:|---|
| `runtime-*` | 25 | Core shell, life-standard organs, engines (not all HTML-loaded) |
| `kgen-12345-*` | 45 | Config/boot, web3, AI, organs — **primary HTML load chain** |
| `kgen-v*` | 2 | Versioned morph-DNA (`kgen-v1046-morph-dna-runtime.*`) |

Location: `K線西遊記/temples/12345/modules/`

### Live boot order (`index.html` — read only)

1. CSS: `kgen-12345-core.css`, `kgen-12345-divine-regeneration.css`, `runtime-main.css`
2. Parent: `../kgen-land-engine.js`
3. Scripts: `kgen-12345-app-shell.js`, `kgen-12345-web3-shell.js`, `kgen-12345-runtime.js` (config), `kgen-12345-mother-runtime.js`, `kgen-12345-divine-regeneration.js`, `kgen-12345-ai-service.js`
4. `runtime-main.js` — **UI owner** (`KGEN_RUNTIME_CORE`)
5. `runtime-bootstrap.js`, `kgen-12345-ui.css`, `kgen-12345-ui.js`

`kgen-12345-runtime.js` header: *Config + Boot only. UI is owned by runtime-main.js.*

### Parallel pairs (merge before rename)

| runtime-* | kgen-12345-* | HTML-loaded |
|---|---|---|
| `runtime-main.*` | — | ✅ runtime |
| `runtime-bootstrap.js` | — | ✅ |
| `runtime-mother.js` | `kgen-12345-mother-runtime.js` | kgen |
| `runtime-regeneration.*` | `kgen-12345-divine-regeneration.*` | kgen |
| `runtime-cell-registry.json` | `kgen-12345-cell-registry.json` | — |
| `runtime-growth-policy.json` | `kgen-12345-growth-policy.json` | — |

All checked pairs **differ** in content — rename-only migration will break references without behavior merge.

### Target convention (future authorized WorkOrders)

```text
temple-12345-<domain>-<role>.<ext>
```

Examples:

- `temple-12345-core-runtime.js`
- `temple-12345-config-boot.js`
- `temple-12345-mother-engine.js`

### Phases (future — requires separate protected-path WorkOrders)

| Phase | Action | Protected edit? |
|---|---|---|
| 0 | Registry JSON under `docs/` | No |
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
| Start from latest `origin/main` | ✅ `bf1a46f` |
| Plan only; no 12345 edits | ✅ |
| Preserve public routes and manifests | ✅ evidence table |
| Do not delete files after `761f0e1` | ✅ diff = 2 files only |
| One WorkOrder on handoff branch | ✅ ORG-P2-003F-FIX1 only |
| Full Worker Boot SOP evidence | ✅ sections 1–6 |
| Claim lease recorded | ✅ |
| D8 future migration documented | ✅ |
| Rollback + compatibility | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md`
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md`
- `K線西遊記/temples/12345/index.html` (boot order)
- `K線西遊記/temples/12345/modules/kgen-12345-runtime.js` (header)
- `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
- `KGEN-KAIOS/worker_registry.json`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003F-FIX1 OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` — created

## Files Intentionally Not Modified

All Temple 12345 modules, `index.html`, Canon, Boot, Runtime CURRENT, public HTML routes, `KGEN-OFFICIAL-LINKS.json`, and protected paths.

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Dual `runtime-*` / `kgen-12345-*` families confuse ownership | High |
| R2 | Rename without merge breaks boot chain | Critical |
| R3 | `kgen-v*` parallel naming adds third family | Medium |

## Blockers

None for plan delivery. Protected-path edits blocked until future authorized WorkOrders.

## Recommendation

1. **Codex:** Approve FIX1 if diff is report + WORK_QUEUE only and public routes intact.
2. **Do not merge** `origin/cursor-handoff/ORG-P2-003F` (REJECTED).
3. **Do not authorize** protected 12345 edits from this plan alone.
4. **Next OPEN after FIX reviews:** ORG-P2-004 (P0 Canon alignment — fresh handoff required).

## Worker Sign-off

Task ORG-P2-003F-FIX1 complete. Status **REVIEW**. Awaiting Codex decision.
