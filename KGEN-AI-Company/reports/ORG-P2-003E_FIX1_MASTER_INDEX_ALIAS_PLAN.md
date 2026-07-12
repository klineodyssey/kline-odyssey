# ORG-P2-003E-FIX1 Master Index Alias Plan (Rebase Fix)

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003E-FIX1 |
| Prior Task | ORG-P2-003E (REJECTED — stale base) |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-12 |
| Base Commit | 0f256af62e0619041896a004ce2efa10666d3ec1 |
| Branch | `cursor-handoff/ORG-P2-003E-FIX1` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003E_FIX1_MASTER_INDEX_ALIAS_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Result | **PASS** (pending Codex merge) |

## Summary

Re-applied ORG-P2-003 **D7 Master Index alias labels** on **latest `origin/main` @ `0f256af`**, fixing the stale-base rejection of ORG-P2-003E. **Six doc-only files changed; zero deletions.** All post-`761f0e1` public routes and manifests preserved (`OfficialLinks.json`, portal HTML, workforce SOP).

---

## Worker Boot SOP Evidence

### 1. BOOT

| Item | Evidence |
|---|---|
| Boot file read | ✅ `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` |
| CURRENT entry | ✅ Boot CURRENT; step 3 lists `KGEN_MASTER_LIBRARY_INDEX.md` |
| Scope | ✅ Documentation alias labels only (ORG-P2-003E-FIX1) |
| Role | ✅ Cursor Construction/Documentation worker under Codex review |

### 2. MUST READ

| File | Read |
|---|---|
| `KGEN-Canon/KGEN_CANON_MASTER.json` | ✅ |
| `KGEN_MASTER_LIBRARY_INDEX.md` | ✅ |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ✅ |
| `KGEN-KAIOS/worker_registry.json` | ✅ |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | ✅ |
| `KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md` | ✅ |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | ✅ |
| `KGEN-AI-Company/reports/ORG-P2-003E_CODEX_REVIEW.md` | ✅ |
| `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md` | ✅ |

**Worker authorization:**

| Field | Value |
|---|---|
| worker_id | cursor-01 |
| employee_status | ACTIVE |
| trust_level | T2 |
| allowed_branch_pattern | cursor-handoff/<Task-ID> |
| can_push_main | false |
| reviewer | codex-gm-01 |
| Continue? | ✅ REGISTRATION_REQUIRED not triggered |

### 3. PROTECTED PATH CHECK

| Protected path | In scope? | Modified? |
|---|---|---|
| contracts | ❌ | ❌ |
| K線西遊記/temples/12345 | ❌ | ❌ |
| wallet | ❌ | ❌ |
| bridge | ❌ | ❌ |
| PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md | ❌ read only | ❌ |
| docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md | ❌ | ❌ |
| docs/physics/final-whitepaper/ | ❌ | ❌ |
| KGEN/contracts/KGEN_Token_V7_5_2.sol | ❌ | ❌ |

**Verdict:** Protected path scan clean. Task may proceed.

### 4. TASK PLAN

| Item | Plan |
|---|---|
| Goal | Re-apply D7 alias banners on current main |
| Read | Architecture decision, Codex rejection, index files |
| Modify | 5 index docs + WORK_QUEUE status |
| Not touch | OfficialLinks, portal HTML, workforce SOP, Canon JSON body |
| Output | This FIX1 report |
| Validation | `git diff --stat origin/main`; preserve-file checklist |
| Push | `cursor-handoff/ORG-P2-003E-FIX1` only |

### 5. EXECUTION

Lifecycle: `Claim → Handoff Branch → Report → Push Handoff → Stop for Codex Review`

| Step | Done |
|---|---|
| `git pull origin main` | ✅ @ `0f256af` |
| Branch `cursor-handoff/ORG-P2-003E-FIX1` | ✅ from current main |
| D7 labels applied | ✅ 5 files |
| Stale-base file deletions | ✅ None |
| WORK_QUEUE → REVIEW | ✅ |

### 6. FINAL REPORT

| Item | Value |
|---|---|
| Pass / Fail | **PASS** (handoff ready) |
| JSON validation | ✅ `KGEN_CANON_MASTER.json` parses |
| Pages validation | N/A (doc-only; no Pages workflow change) |
| Protected path violations | ✅ None |
| Files intentionally not modified | `OfficialLinks.json`, `KGEN-OFFICIAL-LINKS.json`, `community/index.html`, `official/index.html`, `markets/index.html`, `security/index.html`, `liquidity-lock/index.html`, `KGEN-KAIOS/workforce/*` |
| Push status | Pending commit+push after report |

---

## Rejection Fix (ORG-P2-003E)

| Codex finding | FIX1 resolution |
|---|---|
| Stale base `16a384f` vs main `0f256af` | ✅ Rebased from `0f256af` |
| Would delete `OfficialLinks.json`, portals, workforce SOP | ✅ Zero deletions; files verified present |
| Bundled unintended changes | ✅ Diff limited to 6 files, +25/-4 lines |

## D7 Implementation (Reapplied)

| File | Change |
|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | D7 hierarchy table + unique master statement |
| `docs/KGEN_MASTER_INDEX.md` | SUB-INDEX banner |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | GENESIS SUB-INDEX banner; `## Genesis Document Index` |
| `KGEN-Genesis/000_INDEX/README.md` | Portal SUB-INDEX banner; section rename |
| `README.md` | Genesis row → `Genesis Document Index (sub-index)` |

## Preserve Checklist (post-`761f0e1` assets)

| File | Status |
|---|---|
| `OfficialLinks.json` | ✅ Present, unmodified |
| `KGEN-OFFICIAL-LINKS.json` | ✅ Present, unmodified |
| `community/index.html` | ✅ Present, unmodified |
| `official/index.html` | ✅ Present, unmodified |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | ✅ Present, unmodified |

## Files Read

Listed in Worker Boot SOP §2 plus index target files.

## Files Modified

- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/000_INDEX/README.md`
- `README.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-AI-Company/reports/ORG-P2-003E_FIX1_MASTER_INDEX_ALIAS_PLAN.md`

## Checks Run

| Check | Result |
|---|---|
| `git diff --stat origin/main` | 6 files, no deletions of main assets |
| Preserve manifest/portals | ✅ |
| Worker registry gate | ✅ cursor-01 ACTIVE T2 |
| Canon JSON parse | ✅ |

## Risks

| Risk | Mitigation |
|---|---|
| AUTOPILOT regen strips banner | Future template pin |
| Duplicate FIX branches | One branch `ORG-P2-003E-FIX1` only |

## Recommendation

**APPROVE** ORG-P2-003E-FIX1 and merge to main. Closes D7 doc alias gap without touching public routes.

## Need Codex Review

Yes.

## Need Human Decision

No.
