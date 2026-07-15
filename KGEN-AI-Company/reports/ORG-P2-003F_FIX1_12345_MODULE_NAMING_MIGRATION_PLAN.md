# ORG-P2-003F-FIX1 12345 Module Naming Migration Plan (Lease Reclaim)

**Task ID:** ORG-P2-003F-FIX1  
**Status:** Report for Codex Review  
**Owner:** Cursor (`cursor-01`)  
**Reviewer:** Codex (`codex-gm-01`)  
**Priority:** P2  
**Department:** Runtime  
**Date:** 2026-07-15  
**Prior Task:** ORG-P2-003F (REJECTED — stale base)  
**Prior claim:** `CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01` (lease expired `2026-07-15T06:05:59Z`; WorkOrder still OPEN on main)  
**Basis:** ORG-P2-003 D8 + `ORG-P2-003F_CODEX_REVIEW.md`  
**Base Commit:** `7a692c34df50861ab10f8bd80959d95251b1071c`  
**Scope:** Plan/report only. **Do not edit** `K線西遊記/temples/12345/`.

## Claim Lease Evidence

| Field | Value |
|---|---|
| `claim_id` | `CLAIM-ORG-P2-003F-FIX1-20260715T1324-cursor-01` |
| `worker_id` | `cursor-01` |
| `claimed_at` | `2026-07-15T13:24:37Z` |
| `lease_expires_at` | `2026-07-15T17:24:37Z` |
| `heartbeat` | `2026-07-15T13:25:05Z` |
| `base_commit` | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| `branch` | `cursor-handoff/ORG-P2-003F-FIX1-20260715r2` |
| `report_path` | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Claim JSON | `KGEN-AI-Company/reports/CLAIM-ORG-P2-003F-FIX1-20260715T1324-cursor-01.json` |

**Registration:** ACTIVE / T2 / `can_push_main=false`. **Single task this turn:** ORG-P2-003F-FIX1 only.

**Branch note:** Clean child of `origin/main` — avoids force-push over expired tip `cursor-handoff/ORG-P2-003F-FIX1`.

---

## 1. BOOT

| Check | Result |
|---|---|
| Boot CURRENT | ACTIVE / CURRENT / SOURCE_OF_TRUTH TRUE |
| User request | `Claim one task` |
| First OPEN | ORG-P2-003F-FIX1 (prior lease expired) |
| Roles | Cursor executes; Codex reviews |

## 2. MUST READ

| Item | Value |
|---|---|
| `worker_id` | `cursor-01` |
| Trust / status | T2 / ACTIVE |
| Allowed | **Yes** |

## 3. PROTECTED PATH CHECK

Temple 12345 / contracts / wallet / bridge / Boot / Runtime CURRENT / final-whitepaper: **not edited**.

## 4. TASK PLAN

Reissue D8 naming migration plan on current main with fresh claim lease; report-only.

## 5. EXECUTION

```text
Claim → Read-only audit → Report → REVIEW → Stop for Codex
```

**Verification Only / No Temple File Change**

---

## Executive Summary

**PASS.** D8 migration plan re-audited on `7a692c34`. Dual stack `runtime-*` / `kgen-12345-*` remains. Official UI lock: `kgen-12345-ui.js` / `.css`. **Zero deletions. Zero temple edits.**

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Start from latest `origin/main` | ✅ `7a692c34` |
| Plan/report only; no temple edits | ✅ |
| Preserve public routes / manifests | ✅ 10/10 |
| One WorkOrder; claim lease | ✅ |
| Boot SOP evidence | ✅ |

## Rejection / Reclaim Remediation

| Finding | Response |
|---|---|
| ORG-P2-003F stale base deletions | ✅ Rebased; zero deletions |
| Prior FIX1 lease expired; still OPEN | ✅ Fresh claim `…T1324…` |
| Avoid force-push on old handoff tip | ✅ New branch `…-20260715r2` |

### Preserved public routes / manifests

`KGEN-OFFICIAL-LINKS.json`, `OfficialLinks.json`, `KGEN_PUBLIC_INFORMATION_AUDIT.md`, `KGEN_LP_LOCK_PUBLIC_PROOF.md`, `community/`, `official/`, `markets/`, `security/`, `liquidity-lock/`, `workforce/` — all present.

---

## D8 Migration Plan (read-only audit)

### Module inventory

**Path:** `K線西遊記/temples/12345/modules/`  
**Active files:** 73

| Family | Count |
|---|---:|
| `kgen-12345-*` | 45 |
| `runtime-*` | 25 |
| `kgen-v*` | 2 |

### index.html boot order (2026-07-15T13:24Z)

```text
CSS: kgen-12345-core.css → kgen-12345-divine-regeneration.css → runtime-main.css
JS:  kgen-12345-app-shell → web3-shell → kgen-12345-runtime → mother-runtime
     → divine-regeneration → ai-service → runtime-main → kgen-12345-ui.css
     → runtime-bootstrap → kgen-12345-ui.js
(+ CDN three/ethers/WalletConnect; galaxy kgen-land-engine)
```

**Official UI lock:** `kgen-12345-ui.js` / `kgen-12345-ui.css` only.

### Dual-stack overlap

| runtime-* | kgen-12345-* |
|---|---|
| `runtime-main.js` / `.css` | `kgen-12345-runtime.js` (+ core CSS) |
| `runtime-mother.js` | `kgen-12345-mother-runtime.js` |
| `runtime-regeneration.*` | `kgen-12345-divine-regeneration.*` |
| `runtime-cell-registry.json` | `kgen-12345-cell-registry.json` |
| `runtime-growth-policy.json` | `kgen-12345-growth-policy.json` |
| `runtime-core.css` | `kgen-12345-core.css` |

### Policy violations (not in index boot; future archive only)

- `runtime-v10-40-6-stable-patch.js`
- `runtime-layout-fix.js`
- `kgen-12345-stable-countdown.js`
- `kgen-v1046-morph-dna-runtime.js` / `.css`

### Official naming pattern

```text
kgen-12345-<organ-role>.<js|css|json>
```

### Phases (plan only)

0 registry in `docs/` → 1 shims → 2 consolidate dual-stack → 3 archive violations → 4 retire `runtime-*`

### Rollback / compatibility

Git tag per phase; atomic LIFE_MANIFEST; shim ≥1 release; immutable boot order during shim; no competing `-v2`/`-v3` UI organs.

---

## Files Read

- Boot CURRENT, Employee Boot, DO_NOT_TOUCH
- `ORG-P2-003F_CODEX_REVIEW.md`, `ORG-P2-003_ARCHITECTURE_DECISION.md` (D8)
- `docs/KGEN_TEMPLE_12345_MAP.md`, `docs/KGEN_RUNTIME_RULES.md` (spot)
- `K線西遊記/temples/12345/index.html` + `modules/` (read-only)
- `worker_registry.json`, WORK_QUEUE

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — claim fields + OPEN→REVIEW; repaired corrupted temple path spellings in protected-path lists
- `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md`
- `KGEN-AI-Company/reports/CLAIM-ORG-P2-003F-FIX1-20260715T1324-cursor-01.json`

## Files Deleted

**None.** Temple **not edited.**

## Checks Run

| Check | Result |
|---|---|
| Registration | ✅ ACTIVE T2 |
| Single claim | ✅ FIX1 only |
| Prior lease expired | ✅ before reclaim |
| Preserve routes | ✅ 10/10 |
| Module count | ✅ 73 |
| Temple dirty | ✅ none |

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Dual-stack merge breaks boot | High | Phased WO + shim |
| LIFE_MANIFEST drift | High | Atomic update |
| Competing FIX1 tips confuse Codex | Medium | This branch is the active reclaim; prior tips evidence-only |

## Blockers

None for plan approval. Renames require future protected-path WO.

## Recommendation

**APPROVE** this reclaim. Merge surface: report + claim + WorkQueue only. Do not rename temple modules yet.

---

## 6. FINAL REPORT

| Field | Value |
|---|---|
| Task | ORG-P2-003F-FIX1 |
| Status requested | **REVIEW** |
| Branch | `cursor-handoff/ORG-P2-003F-FIX1-20260715r2` |
| Next | Codex Review |
