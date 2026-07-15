# ORG-P2-003F-FIX1 — Temple 12345 Module Naming Future Migration Plan

**Task ID:** ORG-P2-003F-FIX1
**Owner / Worker:** Cursor (`cursor-01`)
**Reviewer:** Codex (`codex-gm-01`)
**Priority:** P2
**Department:** Runtime
**Status:** REVIEW
**Report Type:** Plan / report only (no protected-path edit)
**Report Date:** 2026-07-15
**Supersedes:** rejected `ORG-P2-003F` handoff `origin/cursor-handoff/ORG-P2-003F` (tip `e9429d6`)

---

## 0. Worker Boot SOP Evidence

This section satisfies `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` (six required sections).

### 1. BOOT

- Read `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`: present at repo root; CURRENT boot authority confirmed. Boot is a protected path and is **not** modified by this task.
- CURRENT / OFFICIAL / RUNTIME entry confirmed: `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` remains the Single Source of Truth; not modified.
- User request scope: draft a documentation-only migration plan for Temple 12345 module naming. This is inside Cursor's authorized Construction / Documentation / QA scope.
- Review path: Codex review required (Cursor cannot merge or push `main`).

### 2. MUST READ

| Field | Value |
|---|---|
| worker_id | `cursor-01` |
| worker type | Cursor |
| trust level | T2 |
| employee status | ACTIVE |
| branch permission | `cursor-handoff/<Task-ID>` (see §7 note on platform branch prefix) |
| reviewer | `codex-gm-01` |
| allowed to continue | YES (workforce gate passed) |

Files read for this task:

- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
- `KGEN-KAIOS/TASK_CLAIM_PROTOCOL.md`
- `KGEN-AI-Company/reports/ORG-P2-003F_CODEX_REVIEW.md`
- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md`

Workforce gate validation result for `cursor-01`:

- `employee_status` = ACTIVE ✔
- `trust_level` = T2 (≥ T2) ✔
- `can_push_main` = false ✔
- `allowed_branch_pattern` = `cursor-handoff/<Task-ID>` ✔
- boot / canon / workspace_policy / do_not_touch acknowledged = true ✔
- `suspension` = null ✔

Gate result: **PASS** (not `REGISTRATION_REQUIRED`).

### 3. PROTECTED PATH CHECK

Protected paths in the DO_NOT_TOUCH list and this WorkOrder:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

Scan result: this task writes **only** to `KGEN-AI-Company/reports/` and updates the status fields of this WorkOrder in `KGEN-Organization/WorkOrders/WORK_QUEUE.md`. No protected path is in the write scope. Temple 12345 module files were inspected read-only to build the inventory. No explicit protected-path authorization is required because none is edited. Task is allowed to continue.

### 4. TASK PLAN

- What will be done: draft a future migration plan (naming registry, target pattern, phased plan, rollback, compatibility) for Temple 12345 module names.
- Files to read: the input files listed in §2.
- Files to modify: `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` (this report) and the two status fields for ORG-P2-003F-FIX1 in `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
- Files that will not be touched: everything under `K線西遊記/temples/12345/`, all protected paths, and all current public routes / manifests (`KGEN-OFFICIAL-LINKS.json`, `KGEN_PUBLIC_INFORMATION_AUDIT.md`, `KGEN_LP_LOCK_PUBLIC_PROOF.md`, `community/`, `official/`, `markets/`, `security/`, `liquidity-lock/`, etc.).
- Expected outputs: this Markdown report plus WorkQueue status transition to REVIEW.
- Validation plan: `git diff --stat` for change scope, JSON validity of any touched JSON (none touched), protected-path grep on the diff, and confirmation that no file added after the current `origin/main` is deleted.
- Commit / push plan: commit on the handoff branch, push handoff branch only, never `main`, never force push.

### 5. EXECUTION

Cursor lifecycle: Claim → Handoff Branch → Report → Push Handoff → Stop for Codex Review.

- Base: latest `origin/main` at `7a692c34df50861ab10f8bd80959d95251b1071c` (fresh base; addresses the stale-base cause of the ORG-P2-003F rejection).
- This is a documentation deliverable; no runtime behavior changes.

### 6. FINAL REPORT

See §7 for the consolidated final-report block (pass/fail, files, validation, branch, push status, risks, next action).

---

## 1. Scope

This report drafts the **future** migration plan required by ORG-P2-003 Decision **D8 (FUTURE MIGRATION)**. It does not rename, move, or edit any Temple 12345 module. It produces:

1. A naming registry of current module families.
2. The observed boot order.
3. Naming inconsistencies and risks.
4. One proposed official naming pattern.
5. A phased migration plan with rollback and compatibility requirements.

Per D8, no protected file may be touched until Codex and the human approve a scoped implementation WorkOrder built on this plan.

## 2. Current Module Naming Registry

Source of truth for the inventory: live directory `K線西遊記/temples/12345/modules/` and `docs/KGEN_TEMPLE_12345_MAP.md`. Three active naming families plus one archive family exist today.

### 2.1 Family A — `runtime-*` (generic runtime modules)

Examples (active): `runtime-bootstrap.js`, `runtime-main.js`, `runtime-main.css`, `runtime-core.css`, `runtime-state.js`, `runtime-router-engine.js`, `runtime-panel-registry.js`, `runtime-panel-window-restore.js`, `runtime-recording-engine.js`, `runtime-regeneration.js`, `runtime-regeneration.css`, `runtime-festival-engine.js`, `runtime-layout-fix.js`, `runtime-mother.js`, `runtime-temple-layout.js`, `runtime-universe-axis.js`, `runtime-visibility-engine.js`, `runtime-visual-semantic-control.js`, `runtime-warp-elevator.js`, `runtime-zlayer-engine.js`, `runtime-cell-registry.json`, `runtime-growth-policy.json`, `runtime-canvas-screen-recorder.js`, `runtime-legacy.js`, `runtime-v10-40-6-stable-patch.js`.

- Protected (formal/current, source of truth): `runtime-bootstrap.js`, `runtime-main.js`.

### 2.2 Family B — `kgen-12345-*` (temple-scoped modules)

Examples (active): `kgen-12345-app-shell.js`, `kgen-12345-web3-shell.js`, `kgen-12345-runtime.js`, `kgen-12345-mother-runtime.js`, `kgen-12345-boot-runtime.js`, `kgen-12345-ai-service.js`, `kgen-12345-core.css`, `kgen-12345-ui.js`, `kgen-12345-ui.css`, `kgen-12345-ui-runtime.js`, `kgen-12345-divine-regeneration.js`, `kgen-12345-divine-regeneration.css`, `kgen-12345-organ-system.js`, `kgen-12345-organ-system.css`, `kgen-12345-organ-lifecycle.js`, `kgen-12345-organ-registry.json`, `kgen-12345-organ-wukong-control-console.js`, `kgen-12345-panel-router.js`, `kgen-12345-countdown-engine.js`, `kgen-12345-stable-countdown.js`, `kgen-12345-death-manager.js`, `kgen-12345-immune-runtime.js`, `kgen-12345-input-governance.js`, `kgen-12345-install-check.js`, `kgen-12345-layout-engine.js`, `kgen-12345-layout-runtime.js`, `kgen-12345-manifest-runtime.js`, `kgen-12345-motion-control.js`, `kgen-12345-proto-stabilizer.js`, `kgen-12345-recursive-verify.js`, `kgen-12345-sphere-runtime.js`, `kgen-12345-transformer-runtime.js`, `kgen-12345-universe-elevator.js`, `kgen-12345-version.js`, `kgen-12345-warp-runtime.js`, `kgen-12345-watchdog-runtime.js`, `kgen-12345-world-axis.js`, `kgen-12345-axis-c-scene.js`, `kgen-12345-2d-antigravity-engine.js`, `kgen-12345-civilization-brain-rollcall.js`, `kgen-12345-holy-cup.js`, `kgen-12345-cell-registry.json`, `kgen-12345-growth-policy.json`, `kgen-12345-morph-dna-organ-transplant.js`, `kgen-12345-morph-dna-organ-transplant.css`.

### 2.3 Family C — `kgen-v<version>-*` (version-tagged modules)

Examples (active): `kgen-v1046-morph-dna-runtime.js`, `kgen-v1046-morph-dna-runtime.css`.
Archive equivalents: `kgen-v109-holy-cup.js`, `kgen-v109-panels.js`, `kgen-v109-stable-fix.css`, `kgen-v109-stable-timer.js`, `kgen-v109-version-sync.js`.

### 2.4 Family D — `modules/archive/*` (historical, do not rewrite)

Examples: `kgen-12345-runtime.legacy.js`, `kgen-12345-v10.10-*`, `kgen-12345-v10.11-*`, `kgen-12345-v10.26-autopilot-fix.js`, `kgen-12345-v10.27-stable-organ-check.js`, `kgen-12345-xyz-state-engine.{js,css}`. These are frozen archive files and are explicitly out of migration scope.

## 3. Observed Boot Order (read-only)

From the loaded dependency graph in `docs/KGEN_TEMPLE_12345_MAP.md` (index.html):

```text
index.html
  → CSS: kgen-12345-core.css, kgen-12345-divine-regeneration.css, runtime-main.css
  → kgen-land-engine.js (site-level module, outside temple modules/)
  → kgen-12345-app-shell.js
  → kgen-12345-web3-shell.js
  → kgen-12345-runtime.js (legacy runtime)
  → kgen-12345-mother-runtime.js (legacy mother)
  → kgen-12345-divine-regeneration.js (legacy regen)
  → kgen-12345-ai-service.js
  → runtime-main.js
  → runtime-bootstrap.js
runtime-bootstrap.js → runtime-main.js → LIFE_MANIFEST.json, RUNTIME_GENOME.json
```

Key observation: the two protected source-of-truth modules (`runtime-bootstrap.js`, `runtime-main.js`) are Family A, while most feature modules are Family B. Both families are loaded from the same directory and the boot entry mixes both. Any rename touches boot order and must be treated as protected-path work.

## 4. Naming Inconsistencies and Risks

| ID | Finding | Risk |
|---|---|---|
| N1 | Two coexisting families (`runtime-*` and `kgen-12345-*`) with overlapping responsibilities (e.g. `kgen-12345-runtime.js` legacy vs `runtime-main.js` current). | Ambiguity about the authoritative runtime; risk of editing the wrong file. |
| N2 | Version-tagged names (`kgen-v1046-*`, `kgen-v109-*`) mixed with unversioned names. | Violates the "no versioned file for same function" rule; naming implies status that may be stale. |
| N3 | Duplicate concepts across families: `kgen-12345-mother-runtime.js` vs `runtime-mother.js`; `kgen-12345-divine-regeneration.*` vs `runtime-regeneration.*`; `kgen-12345-ui-runtime.js` vs `kgen-12345-ui.js`. | Same-function duplication; unclear which is loaded. |
| N4 | Protected `runtime-*` modules and non-protected `runtime-*` modules share a prefix. | Prefix alone does not signal protection; accidental edits possible. |
| N5 | Names are referenced by many governance files (LIFE_MANIFEST.json, MANIFEST.json, SHA256SUMS.txt, PACKAGE_MANIFEST.txt, CELL_REGISTRY, index.html). | Any rename is a wide-blast-radius change requiring manifest + checksum updates. |

## 5. Proposed Official Naming Pattern (PROPOSED)

**Status: PROPOSED. Not approved. No file is renamed by this report.**

Proposed single pattern for all *active, non-archive* temple modules:

```text
kgen-12345-<layer>-<feature>.<ext>
```

- `<layer>` ∈ { `boot`, `runtime`, `organ`, `ui`, `data`, `net`, `sim` }
- `<feature>` = kebab-case feature name, no version suffix
- No embedded version numbers in active module filenames; versions live in `VERSION`, `VERSION_GOVERNANCE.json`, and CHANGELOG only.
- Archive files keep their historical names under `modules/archive/` unchanged.

Rationale: a single `kgen-12345-*` prefix scopes modules to the temple, `<layer>` disambiguates responsibility (fixing N1/N3), and dropping version suffixes fixes N2. Protection is expressed in the manifest/registry, not the filename (fixing N4).

Illustrative mapping (proposal only, not executed):

| Current | Proposed target | Note |
|---|---|---|
| `runtime-main.js` (protected) | `kgen-12345-runtime-main.js` | Protected; requires explicit Boot-aligned approval. |
| `runtime-bootstrap.js` (protected) | `kgen-12345-boot-bootstrap.js` | Protected; requires explicit Boot-aligned approval. |
| `runtime-mother.js` | `kgen-12345-runtime-mother.js` | Resolve duplication with legacy `kgen-12345-mother-runtime.js` first. |
| `kgen-v1046-morph-dna-runtime.js` | `kgen-12345-runtime-morph-dna.js` | Drop version tag (N2). |

## 6. Phased Migration Plan (future, gated)

Each phase is gated on Codex + human approval and must not run until a scoped implementation WorkOrder exists.

- **Phase 0 — Registry (docs only):** produce a machine-readable rename map `old → new` plus a "keep" and "archive" list. No file change. Deliverable: JSON registry under a non-protected reports/SDK path.
- **Phase 1 — Alias shims:** introduce new-named modules that `import`/re-export the old modules (or duplicate `<script>` references guarded behind manifest flags) so both names resolve. No deletion. Requires manifest + SHA256 update under explicit approval.
- **Phase 2 — Reference switch:** update `index.html`, `LIFE_MANIFEST.json`, `MANIFEST.json`, `RUNTIME_GENOME.json`, `CELL_REGISTRY`, `PACKAGE_MANIFEST.txt`, and checksums to the new names. Protected-path change; explicit authorization mandatory.
- **Phase 3 — Retire old names:** move superseded old-named files to `modules/archive/` (never hard-delete). Protected-path change; explicit authorization mandatory.
- **Phase 4 — Verify:** run `verify_manifest.js`, regenerate `SHA256SUMS.txt`, confirm boot order unchanged in browser, confirm no orphan/missing entries via `MISSING_REPORT.md` / `ORPHAN_REPORT.md`.

### 6.1 Rollback Requirements

- Every phase must be a single reversible commit on a handoff branch; no squashing across phases.
- Keep the previous manifest + `SHA256SUMS.txt` snapshot so a phase can be reverted by restoring the prior manifest and checksums.
- No hard deletion at any phase; retirement = move to `archive/`. This guarantees rollback by moving files back.
- Rollback trigger: any boot-order change, any failed `verify_manifest.js`, or any checksum mismatch.

### 6.2 Compatibility Requirements

- Old module names must keep resolving until Phase 3 (alias shims from Phase 1).
- Public routes and manifests listed in §4 (N5) and the ORG-P2-003F rejection must remain byte-stable except where a phase explicitly and intentionally updates a manifest.
- `runtime-bootstrap.js` and `runtime-main.js` are protected source of truth; they may be renamed only inside a Boot-aligned, explicitly authorized phase, never as a side effect.
- No change to `wallet`, `bridge`, `contracts`, or KGEN Token behavior.

## 7. Final Report Block

- **Result:** PASS (documentation deliverable complete; report-only).
- **Task ID:** ORG-P2-003F-FIX1
- **Worker ID:** `cursor-01` (Cursor, T2, ACTIVE)
- **Reviewer:** `codex-gm-01`
- **Base commit (fresh `origin/main`):** `7a692c34df50861ab10f8bd80959d95251b1071c`
- **Files read:** see §0.2.
- **Files modified:**
  - `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md` (new report)
  - `KGEN-Organization/WorkOrders/WORK_QUEUE.md` (ORG-P2-003F-FIX1 status OPEN → IN_PROGRESS → REVIEW)
- **Files intentionally not modified:** all of `K線西遊記/temples/12345/`, all protected paths, and all current public routes / manifests (fixes the ORG-P2-003F stale-base deletion defect).
- **JSON validation:** no JSON files were modified by this task.
- **Pages validation:** not applicable (no public route or Pages file changed).
- **Protected-path violation result:** none. Diff limited to `KGEN-AI-Company/reports/` and this WorkOrder's status.
- **Report path:** `KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md`
- **Intended KGEN handoff branch:** `cursor-handoff/ORG-P2-003F-FIX1`.
- **Actual branch used:** `cursor/org-p2-003f-fix1-12345-naming-998e` — the Cursor Cloud platform enforces the `cursor/<name>-998e` branch template for this run, which overrides the `cursor-handoff/<Task-ID>` convention. Flagged for Codex so the branch-pattern check is evaluated against this platform constraint.
- **Push status:** handoff branch pushed to `origin`; `main` not pushed; no force push.
- **Follow-up risks:** any implementation phase touches protected Temple 12345 files and manifests; must not begin without a scoped, explicitly authorized WorkOrder.
- **Recommended next action (PROPOSED):** Codex reviews this plan; if approved, open a Phase 0 (docs-only rename registry) WorkOrder. All suggested WorkOrders remain PROPOSED per the Auto Work Protocol.
