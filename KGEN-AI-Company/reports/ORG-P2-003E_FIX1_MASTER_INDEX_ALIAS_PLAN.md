# ORG-P2-003E-FIX1 Master Index Alias Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003E-FIX1 |
| Prior Task | ORG-P2-003E (REJECTED — stale base) |
| Codex Review | `KGEN-AI-Company/reports/ORG-P2-003E_CODEX_REVIEW.md` |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Trust Level | T2 |
| Employee Status | ACTIVE |
| Date | 2026-07-12 |
| Base Commit | `0f256afa969dbf834df1eb1a6036e639ab2b5cd3` (`origin/main`) |
| Branch | `cursor-handoff/ORG-P2-003E-FIX1` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003E_FIX1_MASTER_INDEX_ALIAS_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D7 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

---

## Worker Boot SOP Evidence

### 1. BOOT

| Check | Result |
|---|---|
| Boot file read | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — read |
| CURRENT entry | Boot CURRENT confirmed; V1_4 ancestor preserved |
| Request in scope | YES — documentation report only (Master Index alias hierarchy) |
| Worker role | Cursor construction worker; Codex review required before merge |

### 2. MUST READ

| File | Read |
|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | ✅ |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | ✅ |
| `KGEN_MASTER_LIBRARY_INDEX.md` | ✅ |
| `KGEN-AI-Company/WORKSPACE_POLICY.md` | ✅ (via boot pack) |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ✅ |
| `KGEN-KAIOS/worker_registry.json` | ✅ |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | ✅ |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | ✅ |
| `KGEN-AI-Company/reports/ORG-P2-003E_CODEX_REVIEW.md` | ✅ |

**Workforce gate (`cursor-01`):**

| Field | Value | Gate |
|---|---|---|
| employee_status | ACTIVE | ✅ |
| trust_level | T2 | ✅ |
| can_push_main | false | ✅ |
| allowed_branch_pattern | `cursor-handoff/<Task-ID>` | ✅ this branch |
| boot/canon/workspace/do_not_touch acknowledged | true | ✅ |
| suspension | null | ✅ |

**Continue:** YES — not `REGISTRATION_REQUIRED`.

### 3. PROTECTED PATH CHECK

| Protected path | In scope? | Modified? |
|---|---|---|
| `contracts` | No | No |
| `K線西遊記/temples/12345` | No | No |
| `wallet` / `bridge` | No | No |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | No | No |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | No | No |
| `docs/physics/final-whitepaper/` | No | No |
| `KGEN/contracts/KGEN_Token_V7_5_2.sol` | No | No |

**Result:** PASS — no protected path touched.

### 4. TASK PLAN

| Item | Plan |
|---|---|
| What will be done | Re-deliver D7 Master Index alias hierarchy report from current `origin/main` |
| Files to read | Architecture decision, three index files, Codex rejection evidence |
| Files to modify | `WORK_QUEUE.md` (status only), this report (new) |
| Files NOT touched | All public routes, manifests, indexes, Canon bodies |
| Expected output | `ORG-P2-003E_FIX1_MASTER_INDEX_ALIAS_PLAN.md` |
| Validation | Verify Codex-listed files still exist on branch; diff scope = 2 files only |
| Commit / push | One commit on `cursor-handoff/ORG-P2-003E-FIX1`; push handoff; no `main` push |

### 5. EXECUTION

```text
Claim ORG-P2-003E-FIX1
-> checkout cursor-handoff/ORG-P2-003E-FIX1 from origin/main @ 0f256af
-> IN_PROGRESS
-> audit indexes (read-only)
-> write FIX1 report with SOP evidence
-> verify public-route preservation
-> REVIEW
-> commit + push handoff
-> stop for Codex Review
```

**Verification Only / No File Change** applies to all index and Canon source files.

### 6. FINAL REPORT (this section)

| Field | Value |
|---|---|
| Pass / Fail | **PASS** (task complete; awaiting Codex) |
| JSON validation | N/A (no JSON edited) |
| Pages validation | N/A (no Pages files edited) |
| Protected path violation | **NONE** |
| Push status | Pending after commit |
| Follow-up risk | Prior REJECTED branch must not be merged |

---

## Public Route Preservation Evidence

Codex rejected ORG-P2-003E because stale base would **delete** files added after `761f0e1`. This FIX1 branch is based on `origin/main` @ `0f256af` and **does not delete** any of the following (verified present before commit):

| File | Present on branch |
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

## Summary (D7 Master Index Alias Hierarchy)

Confirmed **`KGEN_MASTER_LIBRARY_INDEX.md`** as the **unique library-level Master Index**. Classified **`docs/KGEN_MASTER_INDEX.md`** as **Repository Inventory Sub-Index** (AUTOPILOT file catalog). Classified **`KGEN-Genesis/KGEN_MASTER_INDEX.md`** as **Genesis Library Sub-Index** (byte-identical alias of `KGEN-Genesis/000_INDEX/README.md`). Documented department-scoped indexes and stale path references. Proposed **minimal wording patches** for a future doc-only WorkOrder. **No index files or protected paths modified.**

## Official Hierarchy (D7)

```text
KGEN_MASTER_LIBRARY_INDEX.md          ← unique Library Master Index
├── docs/KGEN_MASTER_INDEX.md         ← Repository Inventory Sub-Index
├── KGEN-Genesis/KGEN_MASTER_INDEX.md ← Genesis Sub-Index
│   └── (alias) KGEN-Genesis/000_INDEX/README.md
├── docs/KGEN_RUNTIME_INDEX.md
├── docs/KGEN_FRONTEND_INDEX.md
├── docs/KGEN_SYSTEM_INDEX.md
└── (other domain indexes per ORG-P2-022)
```

## File Audit

| Path | Role | Status |
|---|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | Cross-library navigation hub | **Unique Library Master** |
| `docs/KGEN_MASTER_INDEX.md` | ~654-line AUTOPILOT inventory | **Sub-Index — Repository Inventory** |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | GEN-001–012 lookup | **Sub-Index — Genesis** |
| `docs/KGEN_RUNTIME_INDEX.md` | Runtime catalog | Department index |
| `docs/KGEN_SYSTEM_INDEX.md` | KB registration | Department index (stale root path ref) |
| Root `KGEN_MASTER_INDEX.md` | Referenced in SYSTEM_INDEX | **Does not exist** — use `docs/` path |

## Agent Decision Tree

```text
Cross-library / portal / boot entry?  → KGEN_MASTER_LIBRARY_INDEX.md
Full repo file inventory?           → docs/KGEN_MASTER_INDEX.md
GEN-001–012 lookup?                   → KGEN-Genesis/KGEN_MASTER_INDEX.md
Runtime boot / temple modules?        → docs/KGEN_RUNTIME_INDEX.md
Frontend pages / temples?             → docs/KGEN_FRONTEND_INDEX.md
Uncertain?                            → Do not invent a second Master
```

## Proposed Minimal Wording (future doc WO — not applied)

| Target | Proposed change |
|---|---|
| `KGEN_MASTER_LIBRARY_INDEX.md` | Add § Index Hierarchy table |
| `docs/KGEN_MASTER_INDEX.md` | Banner: sub-index, not Library Master |
| `KGEN-Genesis/KGEN_MASTER_INDEX.md` | Banner: Genesis sub-index + alias note |
| `docs/KGEN_RUNTIME_RULES.md` row 10 | Rename purpose to inventory sub-index |
| `docs/KGEN_SYSTEM_INDEX.md` | Fix path to `docs/KGEN_MASTER_INDEX.md` |
| `AGENTS.md` | Annotate inventory sub-index |

## Acceptance Criteria (FIX1)

| Criterion | Result |
|---|---|
| Start from latest `origin/main` | ✅ `0f256af` |
| Preserve public routes and manifests | ✅ evidence table above |
| Do not delete files after `761f0e1` | ✅ diff = 2 files only |
| One WorkOrder on handoff branch | ✅ ORG-P2-003E-FIX1 only |
| Full Worker Boot SOP evidence | ✅ sections 1–6 above |
| D7 alias hierarchy confirmed | ✅ |
| Minimal wording proposals only | ✅ |
| No protected path edit | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003E_CODEX_REVIEW.md`
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `docs/KGEN_MASTER_INDEX.md` (header)
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`
- `KGEN-Genesis/000_INDEX/README.md`
- `docs/KGEN_RUNTIME_RULES.md` (inventory row)
- `docs/KGEN_SYSTEM_INDEX.md` (KB table)
- `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
- `KGEN-KAIOS/worker_registry.json`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003E-FIX1 OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003E_FIX1_MASTER_INDEX_ALIAS_PLAN.md` — created

## Files Intentionally Not Modified

All index files, Canon, Boot, Runtime CURRENT, public HTML routes, `KGEN-OFFICIAL-LINKS.json`, workforce SOP files, and protected paths.

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Agents treat `docs/KGEN_MASTER_INDEX.md` as navigation master | Medium |
| R2 | Stale `KGEN_MASTER_INDEX.md` root path in SYSTEM_INDEX | Medium |

## Blockers

None.

## Recommendation

1. **Codex:** Approve FIX1 if diff is report + WORK_QUEUE only and public routes intact.
2. **Do not merge** `origin/cursor-handoff/ORG-P2-003E` (REJECTED).
3. **Next OPEN:** ORG-P2-003F-FIX1 on separate handoff branch.

## Worker Sign-off

Task ORG-P2-003E-FIX1 complete. Status **REVIEW**. Awaiting Codex decision.
