# ORG-P2-003F-FIX1: 12345 Module Naming Migration Plan (Rebased)

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Task Title | Rebase 12345 module naming migration plan on current main |
| Worker | cursor-01 |
| Worker Type | Cursor |
| Worker Trust Level | T2 |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | Runtime |
| Branch | `cursor/org-p2-003f-fix1-d550` (Cloud Agent naming; task ID: ORG-P2-003F-FIX1) |
| Base Commit | `7a692c34df50861ab10f8bd80959d95251b1071c` (origin/main tip at claim time) |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Report Date | 2026-07-15 |
| Status | REVIEW |
| Source Task | ORG-P2-003F (REJECTED — stale base) |
| Fix Instruction | ORG-P2-003F_CODEX_REVIEW.md |

---

## Worker Boot SOP Evidence

Per the Cursor Required Boot Order in `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`:

| Step | File Read | Result |
|---|---|---|
| 1 | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | Read. Workforce governance gates confirmed. |
| 2 | `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Read. cursor-01 is ACTIVE, T2. |
| 3 | `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Read. V5 Handoff Loop confirmed. |
| 4 | `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md` | Read. Handoff rules confirmed. |
| 5 | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Read. First OPEN task identified: ORG-P2-003F-FIX1. |
| 6 | `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Read. Protected paths confirmed. |
| 7 | `KGEN-KAIOS/worker_registry.json` | Read. cursor-01 validated: ACTIVE, T2, all acknowledgments true, no suspension. |

Worker registry validation result: **PASS**

- `employee_status`: ACTIVE
- `trust_level`: T2
- `can_push_main`: false
- `allowed_branch_pattern`: cursor-handoff/<Task-ID>
- `boot_acknowledged`: true
- `canon_acknowledged`: true
- `workspace_policy_acknowledged`: true
- `do_not_touch_acknowledged`: true
- `suspension`: null

---

## Fix Context: Why ORG-P2-003F Was Rejected

The original `ORG-P2-003F` was rejected by Codex on 2026-07-12 because:

1. The branch was based on stale main commit `761f0e1`.
2. Merging it would have deleted current public-route files (`KGEN-OFFICIAL-LINKS.json`, `KGEN_PUBLIC_INFORMATION_AUDIT.md`, `community/index.html`, `official/index.html`, `markets/index.html`, `security/index.html`, `liquidity-lock/index.html`) — unrelated to the naming plan.
3. The branch did not preserve current official public routes and manifests.

This `ORG-P2-003F-FIX1` report starts from current `origin/main` tip (`7a692c3`) and is a report-only task: no Temple 12345 files are modified.

---

## Files Read for This Task

| File | Purpose |
|---|---|
| `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md` | Rejection reason and fix instructions |
| `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md` | D8 decision: Future Migration |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected paths list |
| `docs/KGEN_TEMPLE_12345_MAP.md` | Full 201-file Temple 12345 inventory |
| `docs/KGEN_RUNTIME_RULES.md` | Runtime rules and protected-source-of-truth list |

---

## Files Modified

| File | Change |
|---|---|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Status changed: OPEN → IN_PROGRESS → REVIEW |
| `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` | This report (new file) |

No Temple 12345 files modified. No protected paths touched.

---

## Current Module Naming Inventory

This section maps the active module naming patterns in `K線西遊記/temples/12345/modules/` as observed read-only from the Temple Map.

### Pattern A — `kgen-12345-*` (Temple-scoped)

These modules embed the temple ID (`12345`) directly in the filename. They account for the majority of active modules.

**JavaScript modules (kgen-12345-):**

| Module File | Function |
|---|---|
| `kgen-12345-app-shell.js` | Application shell bootstrap |
| `kgen-12345-ai-service.js` | AI service integration |
| `kgen-12345-axis-c-scene.js` | Axis-C scene renderer |
| `kgen-12345-2d-antigravity-engine.js` | 2D anti-gravity physics |
| `kgen-12345-boot-runtime.js` | Temple boot runtime |
| `kgen-12345-civilization-brain-rollcall.js` | Civilization brain rollcall |
| `kgen-12345-countdown-engine.js` | Countdown timer engine |
| `kgen-12345-death-manager.js` | Death lifecycle manager |
| `kgen-12345-divine-regeneration.js` | Divine regeneration runtime |
| `kgen-12345-holy-cup.js` | Holy Cup staking UI |
| `kgen-12345-immune-runtime.js` | Immune system runtime |
| `kgen-12345-input-governance.js` | Input governance layer |
| `kgen-12345-install-check.js` | Install/health checker |
| `kgen-12345-layout-engine.js` | Layout engine |
| `kgen-12345-layout-runtime.js` | Layout runtime |
| `kgen-12345-manifest-runtime.js` | Manifest loader runtime |
| `kgen-12345-morph-dna-organ-transplant.js` | Morph DNA organ transplant |
| `kgen-12345-mother-runtime.js` | Mother runtime (legacy bridge) |
| `kgen-12345-motion-control.js` | Motion control |
| `kgen-12345-organ-lifecycle.js` | Organ lifecycle controller |
| `kgen-12345-organ-system.js` | Organ system |
| `kgen-12345-organ-wukong-control-console.js` | Wukong control console organ |
| `kgen-12345-panel-router.js` | Panel router |
| `kgen-12345-proto-stabilizer.js` | Proto stabilizer |
| `kgen-12345-recursive-verify.js` | Recursive manifest verifier |
| `kgen-12345-runtime.js` | Core runtime (legacy label) |
| `kgen-12345-sphere-runtime.js` | Sphere/3D runtime |
| `kgen-12345-stable-countdown.js` | Stable countdown (redundant with countdown-engine?) |
| `kgen-12345-transformer-runtime.js` | Transformer runtime |
| `kgen-12345-ui-runtime.js` | UI runtime |
| `kgen-12345-universe-elevator.js` | Universe elevator |
| `kgen-12345-version.js` | Version tracker |
| `kgen-12345-warp-runtime.js` | Warp runtime |
| `kgen-12345-watchdog-runtime.js` | Watchdog / health monitor |
| `kgen-12345-web3-shell.js` | Web3/wallet shell |
| `kgen-12345-world-axis.js` | World axis |

**CSS modules (kgen-12345-):**

| Module File | Function |
|---|---|
| `kgen-12345-core.css` | Core temple styles |
| `kgen-12345-divine-regeneration.css` | Divine regeneration styles |
| `kgen-12345-morph-dna-organ-transplant.css` | Morph DNA styles |
| `kgen-12345-organ-system.css` | Organ system styles |

**JSON data (kgen-12345-):**

| Module File | Function |
|---|---|
| `kgen-12345-cell-registry.json` | Cell registry data |
| `kgen-12345-growth-policy.json` | Growth policy config |
| `kgen-12345-organ-registry.json` | Organ registry data |

### Pattern B — `runtime-*` (Generic organ names, Boot-aligned)

These modules follow the Boot-canonical naming convention (`runtime-<organ-name>`) defined in `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` section 6 (Formal Organ Naming).

**Formal/Protected (runtime-):**

| Module File | Status | Note |
|---|---|---|
| `runtime-main.js` | formal/current — PROTECTED | Primary runtime entry |
| `runtime-bootstrap.js` | formal/current — PROTECTED | Bootstrap loader |
| `runtime-main.css` | active/support | Main stylesheet |

**Active support (runtime-):**

| Module File | Function |
|---|---|
| `runtime-canvas-screen-recorder.js` | Screen/canvas recorder |
| `runtime-cell-registry.json` | Cell registry (runtime namespace) |
| `runtime-core.css` | Core CSS (runtime namespace) |
| `runtime-festival-engine.js` | Festival event engine |
| `runtime-growth-policy.json` | Growth policy (runtime namespace) |
| `runtime-layout-fix.js` | Layout fix module |
| `runtime-legacy.js` | Legacy compatibility bridge |
| `runtime-mother.js` | Mother runtime (runtime namespace) |
| `runtime-panel-registry.js` | Panel registry |
| `runtime-panel-window-restore.js` | Panel window restore |
| `runtime-recording-engine.js` | Recording engine |
| `runtime-regeneration.js` | Regeneration runtime |
| `runtime-regeneration.css` | Regeneration styles |
| `runtime-router-engine.js` | Router engine |
| `runtime-state.js` | State manager |
| `runtime-temple-layout.js` | Temple layout |
| `runtime-universe-axis.js` | Universe axis |
| `runtime-v10-40-6-stable-patch.js` | Version-embedded patch (naming violation: version in filename) |
| `runtime-visibility-engine.js` | Visibility engine |
| `runtime-visual-semantic-control.js` | Visual semantic control |
| `runtime-warp-elevator.js` | Warp elevator |
| `runtime-zlayer-engine.js` | Z-layer engine |

### Pattern C — Version-Embedded Names (Non-Canonical)

These violate the Boot rule "版本不得寫在檔名" (version must not be written in the filename):

| Module File | Violation |
|---|---|
| `runtime-v10-40-6-stable-patch.js` | Version `v10-40-6` embedded in filename; also uses `stable-patch` suffix |
| `kgen-v1046-morph-dna-runtime.js` | Version `v1046` embedded |
| `kgen-v1046-morph-dna-runtime.css` | Version `v1046` embedded |

### Pattern D — Archive (Historical Only)

Located at `modules/archive/`. These are historical; they must not be used as current entries and must not be rewritten.

| Archive Group | Examples |
|---|---|
| kgen-12345-v10.10-* | core.css, holy-cup-simple.js, panel-router.js, stable-countdown.js, version.js |
| kgen-12345-v10.11-* | Same set as v10.10 |
| kgen-12345-v10.26/v10.27-* | autopilot-fix.js, stable-organ-check.js |
| kgen-12345-xyz-* | state-engine.css/.js |
| kgen-v109-* | holy-cup.js, panels.js, stable-fix.css, stable-timer.js, version-sync.js |
| kgen-12345-runtime.legacy.js | Legacy runtime archive |

---

## Naming Analysis

### Coexistence of Two Active Patterns

The current Temple 12345 has two active naming conventions running simultaneously:

| Pattern | Count (approx.) | Boot Alignment |
|---|---|---|
| `kgen-12345-<function>` | ~40 files | Partially aligned — temple-scoped, not organ-naming spec |
| `runtime-<function>` | ~22 files | Fully aligned — matches Boot section 6 organ naming |
| `kgen-v<version>-*` | 2 active files | Violates Boot version-in-filename rule |

### Root Cause of Dual Naming

The `kgen-12345-*` pattern emerged from early development where the temple ID was included for disambiguation across multiple temple projects. The `runtime-*` pattern was introduced later in alignment with the Boot organ-naming standard that prohibits version numbers in filenames and specifies `runtime-<organ>.js` as the canonical format.

### Functional Overlaps (Potential Conflicts)

Several functional areas now have dual representations:

| Function | kgen-12345-* name | runtime-* name | Risk |
|---|---|---|---|
| Mother runtime | `kgen-12345-mother-runtime.js` | `runtime-mother.js` | Possible functional overlap; both active |
| Regeneration | `kgen-12345-divine-regeneration.js` | `runtime-regeneration.js` | Both loaded; may differ in scope |
| Cell registry | `kgen-12345-cell-registry.json` | `runtime-cell-registry.json` | Dual registry; divergence risk |
| Growth policy | `kgen-12345-growth-policy.json` | `runtime-growth-policy.json` | Dual config; divergence risk |
| Core CSS | `kgen-12345-core.css` | `runtime-core.css` | Style layering; test before removing either |
| Runtime entry | `kgen-12345-runtime.js` | `runtime-main.js` (PROTECTED) | kgen-12345-runtime.js labeled "legacy" in template map |

---

## Migration Plan (Advisory — Codex Approval Required Before Implementation)

### Governing Decision

Architecture Decision D8 from ORG-P2-003 states:

> "No 12345 runtime or module file may be changed in this decision. Future migration must begin with a naming registry and compatibility plan. The plan must map existing runtime-* and kgen-12345-* modules, identify current boot order, and define one official naming pattern before any protected file is touched."

This plan is advisory. No module file is renamed, deleted, or modified as part of this WorkOrder. All implementation steps below require separate Codex-assigned WorkOrders.

### Goal: One Official Naming Pattern

The target naming pattern, aligned with Boot section 6, is:

```
runtime-<function>.js
runtime-<function>.css
```

Version numbers must never appear in active filenames. Temple ID (12345) must not be embedded in organ filenames.

### Phase 0 — Pre-Migration Prerequisites (No code changes)

1. **Create Module Naming Registry** — A new JSON file (e.g., `modules/MODULE_NAMING_REGISTRY.json`) that maps each current `kgen-12345-*` filename to its proposed `runtime-*` canonical name, documents functional purpose, load order, and any known overlap.
2. **Load-Order Audit** — Inspect `index.html` and `runtime-bootstrap.js` to document the exact module load sequence. This is required before any rename.
3. **Functional Overlap Resolution** — For each dual-named pair (e.g., `kgen-12345-mother-runtime.js` / `runtime-mother.js`), document which is the authoritative version and which is a compatibility shim.

### Phase 1 — Version-Embedded Names First (Lowest Risk)

Target files:
- `runtime-v10-40-6-stable-patch.js` → Rename to `runtime-stable-patch.js` or absorb into `runtime-main.js` if content is small
- `kgen-v1046-morph-dna-runtime.js` → Rename to `runtime-morph-dna.js`
- `kgen-v1046-morph-dna-runtime.css` → Rename to `runtime-morph-dna.css`

Prerequisite: Load-order audit must confirm no other file references the version-embedded names by string literal (not just `<script src>`).

Rollback: Git revert. No data loss since content is preserved; only filename changes.

### Phase 2 — Functional Overlap Consolidation (Medium Risk)

For each dual-named pair:

1. Confirm which file is authoritative (check `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `CELL_REGISTRY.md`).
2. If both are needed: add a compatibility alias comment; do not delete yet.
3. If one is a deprecated shim: mark it as deprecated in its header comment only.
4. Actual deletion of deprecated shims requires a separate Codex-assigned WorkOrder with explicit human approval.

### Phase 3 — kgen-12345-* → runtime-* Rename Campaign (High Risk, Protected Path Adjacent)

This phase is the largest and cannot be executed until Phases 0 and 1 are complete.

**Critical constraint**: `index.html` is a protected file. Any rename that requires updating `<script src>` or `<link href>` in `index.html` requires explicit human authorization per `DO_NOT_TOUCH.md`.

Suggested approach:
1. Create shim redirect files: e.g., `kgen-12345-panel-router.js` becomes a one-line re-export pointing to the new canonical `runtime-panel-router.js`.
2. This avoids changing `index.html` in the short term.
3. Once `index.html` is updated under authorized WorkOrder, shim files can be removed.

### Phase 4 — Archive Cleanup (Lowest Priority)

Archive files at `modules/archive/` must not be deleted without explicit human authorization. They serve as historical reference. A future WorkOrder may add a README to `modules/archive/` explaining that these files are read-only historical records and should not be loaded by production code.

---

## Compatibility and Rollback Requirements

| Requirement | Detail |
|---|---|
| No breaking change to `index.html` without explicit approval | `index.html` is a protected file |
| No change to `runtime-main.js` or `runtime-bootstrap.js` | Formally protected |
| No change to `LIFE_MANIFEST.json`, `MANIFEST.json`, `RUNTIME_GENOME.json` | Formally protected |
| No change to `SHA256SUMS.txt`, `VERSION`, `VERSION.md`, `VERSION_GOVERNANCE.json` | Formally protected |
| Each rename must be reversible by git revert | No content changes during rename |
| Module registry must be created before any rename begins | Prerequisite gate |
| Load-order audit must be complete before any rename begins | Prerequisite gate |

---

## Protected Path Check

The following paths were verified as NOT modified by this WorkOrder:

| Protected Path | Status |
|---|---|
| `contracts` | Not modified |
| `K線西遊記/temples/12345` (all files) | Not modified — read-only audit only |
| `wallet` | Not modified |
| `bridge` | Not modified |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | Not modified |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Not modified |
| `docs/physics/final-whitepaper/` | Not modified |
| `KGEN/contracts/KGEN_Token_V7_5_2.sol` | Not modified |

---

## Public Routes Preservation Check

This branch starts from current `origin/main` tip `7a692c3`. The following previously-deleted files are confirmed present in the current main tree and are not touched by this WorkOrder:

- `KGEN-OFFICIAL-LINKS.json` — preserved
- `KGEN_PUBLIC_INFORMATION_AUDIT.md` — preserved
- `KGEN_LP_LOCK_PUBLIC_PROOF.md` — preserved
- `community/index.html` — preserved
- `official/index.html` — preserved
- `markets/index.html` — preserved
- `security/index.html` — preserved
- `liquidity-lock/index.html` — preserved

---

## Risks and Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| Dual-named modules may have diverged in content | HIGH | Functional overlap audit required in Phase 0 before any rename |
| `index.html` references `kgen-12345-*` names directly | HIGH | Use shim redirect approach; do not touch `index.html` until authorized |
| `LIFE_MANIFEST.json` may embed `kgen-12345-*` names | MEDIUM | Audit manifest before Phase 3; manifest is protected path |
| Archive files may be inadvertently loaded | LOW | Already in `archive/` subfolder; no production `<script>` references expected |
| Version-embedded `runtime-v10-40-6-stable-patch.js` may be referenced by string | MEDIUM | Load-order audit required before rename |

---

## Recommendations

1. **Approve this plan as a governance baseline.** No code changes are included in this WorkOrder.
2. **Create a follow-up WorkOrder** (proposed, requires Codex promotion) to produce `MODULE_NAMING_REGISTRY.json` as Phase 0.
3. **Authorize Phase 1** (version-embedded renames) as a low-risk first step once the registry is in place.
4. **Defer Phase 3** until `index.html` change authorization is explicitly granted by the human user.

---

## Checks Run

| Check | Result |
|---|---|
| Worker registration validated | PASS |
| Protected paths confirmed unmodified | PASS |
| Branch starts from current origin/main | PASS — base `7a692c3` |
| Previously-deleted public-route files preserved | PASS |
| No Temple 12345 files modified | PASS |
| Report path matches WorkOrder spec | PASS |
| No new Runtime CURRENT or bootstrap created | PASS |
| No Canon modification | PASS |

---

## Suggested Follow-Up WorkOrders (PROPOSED — require Codex promotion to DRAFT/OPEN)

| Proposed ID | Title | Notes |
|---|---|---|
| ORG-P2-003F-PHASE0 | Create MODULE_NAMING_REGISTRY.json for Temple 12345 | Map kgen-12345-* → runtime-* canonical names |
| ORG-P2-003F-PHASE1 | Rename version-embedded module files | runtime-v10-40-6-stable-patch.js, kgen-v1046-* |
| ORG-P2-003F-PHASE3 | Execute kgen-12345-* → runtime-* rename with shim approach | Requires Phase 0 complete and Codex+Human approval |

These remain PROPOSED until Codex reviews and promotes them.

---

*Report completed by cursor-01 (T2, ACTIVE). Task status set to REVIEW. Awaiting Codex review.*
