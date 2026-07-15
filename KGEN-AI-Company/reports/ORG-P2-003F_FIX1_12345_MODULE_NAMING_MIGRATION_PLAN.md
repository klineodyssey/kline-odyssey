# ORG-P2-003F-FIX1 — Temple 12345 Module Naming Future Migration Plan (Rebased on Current Main)

> Report-only. No protected path is modified by this WorkOrder. This document is a **plan/draft**; it does not authorize any rename, deletion, or runtime edit.

## Task Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F-FIX1 |
| Date | 2026-07-15 |
| Base Commit | `7a692c34df50861ab10f8bd80959d95251b1071c` (latest `origin/main`) |
| Handoff Branch (protocol slot) | `cursor-handoff/ORG-P2-003F-FIX1` |
| Actual Push Branch | `cursor/org-p2-003f-fix1-1eb2` (Cloud Agent branch-naming policy; see note below) |
| Assigned By | Codex |
| Worker | Cursor / `cursor-01` |
| Reviewer | Codex / `codex-gm-01` |
| Start Status | OPEN |
| End Status | REVIEW |
| Priority | P2 |
| Department | Runtime |

**Branch-name note.** The KGEN Handoff Branch Workflow reserves the slot `cursor-handoff/ORG-P2-003F-FIX1`. That remote branch already exists from a prior superseded submission (tip `dbdd905c`, disposition `REJECT_NO_CLAIM`) and is based on stale main, so pushing a current-main rebase to it would be a non-fast-forward and would require a force push (forbidden by `KGEN-Agent-Office/DO_NOT_TOUCH.md`). This run also executes under the Cursor Cloud Agent branch policy, which requires the `cursor/<name>-1eb2` pattern. The work is therefore pushed to `cursor/org-p2-003f-fix1-1eb2`, which maps 1:1 to the `ORG-P2-003F-FIX1` slot. Codex may fetch this branch in place of the stale slot branch.

## Worker Boot SOP Evidence

Formal Workforce Gate validated against `KGEN-KAIOS/worker_registry.json` (`cursor-01`):

| Requirement | Registry value | Pass |
|---|---|---|
| `worker_id` exists | `cursor-01` | ✅ |
| `employee_status` ∈ {ACTIVE, TRUSTED, SENIOR_TRUSTED} | `ACTIVE` | ✅ |
| `trust_level` ≥ T2 | `T2` | ✅ |
| `can_push_main` is false | `false` | ✅ |
| `allowed_branch_pattern` | `cursor-handoff/<Task-ID>` | ✅ (slot recorded above) |
| `boot_acknowledged` | `true` | ✅ |
| `canon_acknowledged` | `true` | ✅ |
| `workspace_policy_acknowledged` | `true` | ✅ |
| `do_not_touch_acknowledged` | `true` | ✅ |
| `suspension` | `null` | ✅ |
| Reviewer defined | `codex-gm-01` | ✅ |

Gate result: **PASS** (no `REGISTRATION_REQUIRED`).

Required read order executed:

1. `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
2. `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
3. `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md`
4. `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
5. `KGEN-Agent-Office/DO_NOT_TOUCH.md`
6. `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md` + `KGEN-KAIOS/task_claim_schema.json`

Claim discipline: `ORG-P2-003F-FIX1` was the first `OPEN` WorkOrder scanning `WORK_QUEUE.md` top-to-bottom. It was moved `OPEN → IN_PROGRESS` before any content work, and is moved to `REVIEW` only after this report exists (no silent work).

## Files

**Files Read (read-only):**

- `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md`
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md` (D8)
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md` (protection map)
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Organization/WorkOrders/REPORT_TEMPLATE.md`
- `KGEN-AI-Company/CURSOR_REPORTING_RULES.md`
- `KGEN-KAIOS/worker_registry.json`

**Files Modified:**

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` (status field only: `OPEN → IN_PROGRESS → REVIEW` for `ORG-P2-003F-FIX1`).
- `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` (this report; new file).

**Protected Paths Checked (confirmed NOT modified):**

- `contracts`
- `K線西遊記/temples/12345` (audited read-only via `docs/KGEN_TEMPLE_12345_MAP.md` only)
- `wallet`, `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`, `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

No file added after the prior stale base was deleted; no public route or manifest file was removed. This branch is a clean child of current `origin/main`.

## Summary

This plan responds to Architecture Decision **D8 (FUTURE MIGRATION)** from `ORG-P2-003_ARCHITECTURE_DECISION.md`: Temple 12345 currently carries two parallel module-naming families, `kgen-12345-*` (temple-scoped) and `runtime-*` (generic). D8 requires that, before any protected 12345 file is touched, a migration plan must (1) map both families, (2) record the current boot order, and (3) define one official naming pattern, plus rollback and compatibility requirements. This document delivers that plan **without editing any 12345 file**.

## 1. Current Naming Families (from `docs/KGEN_TEMPLE_12345_MAP.md`)

### Family A — `kgen-12345-*` (temple-scoped prefix)

Active/support modules include: `kgen-12345-app-shell.js`, `kgen-12345-web3-shell.js`, `kgen-12345-runtime.js` (legacy), `kgen-12345-mother-runtime.js`, `kgen-12345-divine-regeneration.js` / `.css`, `kgen-12345-ai-service.js`, `kgen-12345-core.css`, `kgen-12345-boot-runtime.js`, `kgen-12345-cell-registry.json`, `kgen-12345-growth-policy.json`, `kgen-12345-panel-router.js`, `kgen-12345-organ-system.js` / `.css`, `kgen-12345-organ-lifecycle.js`, `kgen-12345-layout-engine.js` / `-layout-runtime.js`, `kgen-12345-countdown-engine.js` / `-stable-countdown.js`, `kgen-12345-universe-elevator.js`, `kgen-12345-version.js`, plus `kgen-v1046-*` and archived `kgen-v109-*` under `modules/archive/`.

### Family B — `runtime-*` (generic prefix)

Modules include: `runtime-main.js` (**formal/current, protected**), `runtime-bootstrap.js` (**formal/current, protected**), `runtime-main.css`, `runtime-core.css`, `runtime-cell-registry.json`, `runtime-growth-policy.json`, `runtime-mother.js`, `runtime-regeneration.js` / `.css`, `runtime-legacy.js`, `runtime-festival-engine.js`, `runtime-router-engine.js`, `runtime-panel-registry.js`, `runtime-panel-window-restore.js`, `runtime-recording-engine.js`, `runtime-state.js`, `runtime-temple-layout.js`, `runtime-universe-axis.js`, `runtime-warp-elevator.js`, `runtime-visibility-engine.js`, `runtime-visual-semantic-control.js`, `runtime-zlayer-engine.js`, `runtime-layout-fix.js`, `runtime-v10-40-6-stable-patch.js`, `runtime-canvas-screen-recorder.js`.

### Same-function overlap risk (both families present)

| Domain | Family A (`kgen-12345-*`) | Family B (`runtime-*`) | Notes |
|---|---|---|---|
| Runtime entry | `kgen-12345-runtime.js` (legacy) | `runtime-main.js` (formal/current), `runtime-legacy.js` | Formal entry is Family B |
| Mother runtime | `kgen-12345-mother-runtime.js` | `runtime-mother.js` | Duplicate-function pair |
| Regeneration | `kgen-12345-divine-regeneration.js` / `.css` | `runtime-regeneration.js` / `.css` | Duplicate-function pair |
| Core styles | `kgen-12345-core.css` | `runtime-core.css`, `runtime-main.css` | Overlapping CSS scope |
| Cell registry | `kgen-12345-cell-registry.json` | `runtime-cell-registry.json` | Data-file duplication |
| Growth policy | `kgen-12345-growth-policy.json` | `runtime-growth-policy.json` | Data-file duplication |
| Layout | `kgen-12345-layout-engine.js` / `-layout-runtime.js` | `runtime-temple-layout.js`, `runtime-layout-fix.js` | Overlapping layout logic |
| Panels/routing | `kgen-12345-panel-router.js` | `runtime-panel-registry.js`, `runtime-router-engine.js` | Overlapping routing |
| Elevator/axis | `kgen-12345-universe-elevator.js` | `runtime-warp-elevator.js`, `runtime-universe-axis.js` | Overlapping navigation |

These overlaps are the concrete "same-function" drift D8 warns about. This plan does **not** resolve them now; it records them so a future scoped WorkOrder can consolidate under one pattern.

## 2. Current Boot / Dependency Order (from the map's loaded dependency graph)

```text
K線西遊記/index.html (Portal)
  └─> K線西遊記/temples/12345/index.html
        ├─ CSS:  kgen-12345-core.css, kgen-12345-divine-regeneration.css, runtime-main.css
        ├─ ../modules/kgen-land-engine.js ──> data/kgen-land-demo.json
        ├─ kgen-12345-app-shell.js
        ├─ kgen-12345-web3-shell.js
        ├─ kgen-12345-runtime.js (legacy), kgen-12345-mother-runtime.js,
        │  kgen-12345-divine-regeneration.js, kgen-12345-ai-service.js
        ├─ runtime-main.js  (formal/current)
        └─ runtime-bootstrap.js (formal/current)
              └─> runtime-main.js
                     ├─> LIFE_MANIFEST.json
                     └─> RUNTIME_GENOME.json
```

Boot invariant to preserve across any future rename: `runtime-bootstrap.js → runtime-main.js → {LIFE_MANIFEST.json, RUNTIME_GENOME.json}`, and `kgen-land-engine.js → data/kgen-land-demo.json`. Integrity/registry files that reference module names and must stay in sync: `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `MANIFEST.json`, `SHA256SUMS.txt`, `PACKAGE_MANIFEST.txt`, and `verify_manifest.js`.

## 3. Official Naming Pattern (recommendation)

Two candidate target patterns were evaluated.

- **Option A — temple-scoped `kgen-<temple>-<domain>-<role>` for every module.** Pro: explicit temple identity in the filename; scales when other temples (16888, etc.) copy modules. Con: requires renaming the two **protected formal/current entrypoints** `runtime-main.js` and `runtime-bootstrap.js`, i.e. maximum protected-path churn and highest boot-break risk. **Rejected** for now.
- **Option B — generic `runtime-<domain>-<role>` for temple-local runtime modules, with temple identity carried by the folder path `temples/<id>/modules/`. (RECOMMENDED)** Pro: the two protected entrypoints already use `runtime-*`, so the protected core is untouched; only lower-risk `active/support` `kgen-12345-*` modules would eventually be renamed toward `runtime-*`; folder path already disambiguates temples. Con: filenames are less self-describing when viewed outside their folder.

**Recommendation: Option B.** Standardize the forward-looking official prefix as `runtime-*`, scoped by the temple folder, because it keeps `runtime-main.js` / `runtime-bootstrap.js` (protected source of truth) stable and confines future renames to non-entrypoint modules. This is a recommendation only; it becomes actionable solely through a future Codex-issued WorkOrder with explicit human authorization for protected-path edits.

## 4. Migration Phasing (all future, all gated)

1. **P0 Freeze & registry.** Publish a name registry (old → target) as documentation only; change no files under `temples/12345`.
2. **P1 Alias shims.** For each renamed module, add a thin re-export/`@import` shim at the old path so `index.html`, manifests, and external references keep resolving. No behavior change.
3. **P2 Reference cutover.** Update `index.html` script/style tags and registry JSONs to target names in one atomic commit; keep shims.
4. **P3 Integrity resync.** Regenerate `SHA256SUMS.txt`, update `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `MANIFEST.json`, `PACKAGE_MANIFEST.txt`; run `verify_manifest.js` to green.
5. **P4 Shim retirement.** Only after a full green boot cycle, remove shims in a separate commit.

Every phase that touches `K線西遊記/temples/12345` is a protected-path change and MUST stop for Codex + human approval before execution.

## 5. Rollback Requirements

- Each phase is a single, self-contained commit that can be reverted with one `git revert` without touching unrelated files.
- Alias shims (P1) remain until a full boot cycle passes, so cutover (P2/P3) is reversible by pointing references back to old names.
- Integrity files (`SHA256SUMS.txt`, `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `MANIFEST.json`) are regenerated per phase and committed with that phase, so a revert restores a self-consistent manifest set.
- No force push and no history rewrite at any phase (per `DO_NOT_TOUCH.md`).

## 6. Compatibility Requirements

- Boot order in Section 2 must be byte-for-byte preserved at every phase.
- No public route, deploy path, or GitHub Pages URL may change; renames are internal to `temples/12345/modules/`.
- `../modules/kgen-land-engine.js` and `data/kgen-land-demo.json` bindings must remain valid.
- Historical `modules/archive/` files are never renamed (archive = do-not-rewrite).
- External referrers listed in the map (`KGEN_BOOT_GRAPH.md`, `KGEN_MASTER_INDEX.md`, `KGEN_MODULE_MAP.md`, `docs/KGEN_FILE_DEPENDENCY.md`, `docs/KGEN_RUNTIME_INDEX.md`, `PACKAGE_MANIFEST.txt`) must be updated in the same phase that renames the referenced module.

## Canon Alignment

Consistent with `ORG-P2-003_ARCHITECTURE_DECISION.md` D8 (FUTURE MIGRATION), `KGEN-Agent-Office/DO_NOT_TOUCH.md`, and the KGEN work rules "check existing same-function files before change" / "no duplicate versioned files." The plan proposes convergence to a single pattern and explicitly forbids creating new duplicate or versioned module files. No Canon text is rewritten.

## Checks Run

- Workforce gate validation against `KGEN-KAIOS/worker_registry.json` → PASS.
- Base-commit freshness: branch created from `origin/main` `7a692c3`; `git rev-parse origin/main` == branch base (no stale-base deletions, the failure mode that rejected `ORG-P2-003F`).
- Protected-path audit: only `WORK_QUEUE.md` (status field) and this new report changed; `git diff --stat` confirms no `temples/12345`, contracts, wallet, bridge, Boot, physics, or token file touched.
- Single-WorkOrder purity: this branch changes only `ORG-P2-003F-FIX1` status plus its report.

## Problems Found

- Two parallel module-naming families with ≥9 same-function overlaps inside a protected runtime (documented in Section 1).
- The reserved handoff slot branch `cursor-handoff/ORG-P2-003F-FIX1` is stale-based; recorded and worked around without a force push.

## Risks

| Risk | Severity | Owner | Mitigation |
|---|---|---|---|
| Future rename breaks boot order | High | Codex + Human | Phased shims (Section 4) + preserve invariant (Section 2) |
| Manifest/SHA desync during rename | Medium | Runtime | P3 integrity resync + `verify_manifest.js` gate |
| Reviewer fetches wrong (stale) slot branch | Low | Codex | Branch-name note in metadata maps slot → actual branch |

## Technical Debt

Duplicate-function module pairs (Section 1 table) are latent debt; this plan is the prerequisite for retiring them.

## Evolution Opportunities

A single naming pattern enables a machine-readable module registry that other temples can reuse without copying divergent names.

## Research Direction

Evaluate an SDK-level module manifest schema (ties to `ORG-P2-015 SDK schema gap`) so module identity is declared in data, not encoded only in filenames.

## Suggested WorkOrders (Status: PROPOSED)

- **PROPOSED** `ORG-P2-003F-EXEC-P0`: publish the old→target name registry as documentation only.
- **PROPOSED** `ORG-P2-003F-EXEC-P1`: implement alias shims under `temples/12345/modules/` (requires protected-path authorization).

These remain PROPOSED; Cursor does not promote them.

## Do Not Do

- Do not rename, move, or delete any `K線西遊記/temples/12345` file under this WorkOrder.
- Do not rename `runtime-main.js` or `runtime-bootstrap.js`.
- Do not force push or rebase the stale slot branch.

## Blockers

None. Plan is report-only and complete.

## Recommendation

**ACCEPT.** This is a clean, current-main, report-only rebase of the `ORG-P2-003F` plan that satisfies every `ORG-P2-003F-FIX1` acceptance criterion (start from latest main; report/plan only; no `temples/12345` edit; public routes/manifests preserved; single WorkOrder; full Boot SOP evidence). Codex may fetch `cursor/org-p2-003f-fix1-1eb2` as the `ORG-P2-003F-FIX1` handoff.

## Need Codex Review

Yes.

## Need Human Decision

Only if/when a future execution WorkOrder is authorized to edit protected `temples/12345` files.
