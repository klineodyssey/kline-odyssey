# ORG-P2-003F 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-11 |
| Base Commit | 761f0e199506a5f622f331289601650c5ff1c352 |
| Branch | `cursor-handoff/ORG-P2-003F` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Drafted a **future-only migration plan** for Temple 12345 module naming per ORG-P2-003 D8. Audited **72 active modules** under `K線西遊記/temples/12345/modules/` across three live naming families (`runtime-*`, `kgen-12345-*`, `kgen-v*`) plus **20** frozen files under `modules/archive/`. Mapped **index.html boot load order** and identified **functional overlap** between legacy `kgen-12345-*` shells and newer `runtime-*` core. **No runtime modules, index.html, manifests, or protected 12345 files were modified.**

## D8 Constraint

| Rule | Status |
|---|---|
| No 12345 file edits in this WorkOrder | ✅ Plan/report only |
| Naming registry required before any rename | ✅ Included below |
| Boot order must be documented before migration | ✅ Included below |
| Rollback and compatibility required | ✅ Included below |
| Codex + human approval before protected path touch | ✅ Required gate |

## Current Naming Families (Audit)

| Family | Active count | Era / role | Examples |
|---|---:|---|---|
| `runtime-*` | 25 | V2.3 modular runtime core | `runtime-main.js`, `runtime-bootstrap.js`, `runtime-panel-registry.js` |
| `kgen-12345-*` | 45 | V10.x organ/feature modules | `kgen-12345-app-shell.js`, `kgen-12345-organ-system.js` |
| `kgen-v*` | 2 | Version-pinned morph DNA | `kgen-v1046-morph-dna-runtime.js` |
| `modules/archive/*` | 20 | Frozen legacy | `kgen-12345-runtime.legacy.js`, `kgen-v109-*` |

### Protected core (DO_NOT_TOUCH / RUNTIME_RULES)

| File | Role |
|---|---|
| `runtime-bootstrap.js` | Post-load initializer; depends on `runtime-main.js` |
| `runtime-main.js` | Primary runtime orchestrator |
| `runtime-main.css` | Primary runtime styles |
| `index.html` | Script/CSS load order authority |

## index.html Boot Load Order (Current)

Order from `K線西遊記/temples/12345/index.html` (read-only audit):

1. External: three.js, ethers, WalletConnect, Orbitron/Noto fonts
2. CSS: `kgen-12345-core.css`, `kgen-12345-divine-regeneration.css`, `runtime-main.css`
3. Inline: civilization brain rollcall script block
4. `../../modules/kgen-land-engine.js` (parent galaxy module)
5. `kgen-12345-app-shell.js`
6. `kgen-12345-web3-shell.js`
7. `kgen-12345-runtime.js` (legacy runtime shim)
8. `kgen-12345-mother-runtime.js`
9. `kgen-12345-divine-regeneration.js`
10. `kgen-12345-ai-service.js`
11. `runtime-main.js` ← **protected core**
12. `kgen-12345-ui.css`
13. `runtime-bootstrap.js` ← **protected core**
14. `kgen-12345-ui.js`

**Observation:** Legacy `kgen-12345-runtime.js` loads **before** `runtime-main.js`. `runtime-bootstrap.js` loads **after** `runtime-main.js` and between UI CSS/JS. Any migration must preserve this ordering until legacy shim is formally retired.

## Functional Overlap Map (Rename Risk)

| Legacy `kgen-12345-*` | Parallel `runtime-*` | Migration risk |
|---|---|---|
| `kgen-12345-runtime.js` | `runtime-main.js` | **High** — dual runtime entry |
| `kgen-12345-mother-runtime.js` | `runtime-mother.js` | Medium — name collision intent |
| `kgen-12345-boot-runtime.js` | `runtime-bootstrap.js` | **High** — boot chain |
| `kgen-12345-divine-regeneration.js` / `.css` | `runtime-regeneration.js` / `.css` | Medium — dual regen path |
| `kgen-12345-layout-runtime.js` | `runtime-temple-layout.js`, `runtime-layout-fix.js` | Medium |
| `kgen-12345-ui-runtime.js` | `runtime-panel-registry.js`, `runtime-router-engine.js` | Medium |
| `kgen-12345-universe-elevator.js` / `warp-runtime.js` | `runtime-warp-elevator.js` | Medium |
| `kgen-12345-world-axis.js` | `runtime-universe-axis.js` | Medium |
| `kgen-12345-cell-registry.json` | `runtime-cell-registry.json` | Medium — JSON manifest drift |
| `kgen-12345-growth-policy.json` | `runtime-growth-policy.json` | Low — policy twins |

## Proposed Target Naming Standard (Future)

Single official pattern for **new and migrated** active modules:

```text
temple-12345-<organ>-<function>.{js,css,json}
```

| Segment | Meaning | Example |
|---|---|---|
| `temple-12345` | Fixed temple scope prefix | `temple-12345-core-main.js` |
| `<organ>` | Biological organ / subsystem | `runtime`, `ui`, `web3`, `organ`, `warp` |
| `<function>` | Specific module role | `bootstrap`, `panel-registry`, `holy-cup` |

**Rules:**

- Protected cores rename last (Phase 4 only, with Codex WorkOrder).
- `modules/archive/` never renamed — add `LEGACY` metadata only.
- Version numbers move to `VERSION_GOVERNANCE.json`, not filenames (`kgen-v1046-*` → deprecate version-in-name).
- JSON registries keep paired JS/CSS basename stems.
- Do not invent a second parallel prefix (`runtime-*` stays frozen until Phase 4 maps into `temple-12345-runtime-*`).

## Migration Phases (Future WorkOrders)

### Phase 0 — Registry (no file moves)

Create machine-readable registry **outside** protected path:

- Proposed path: `docs/temple-12345/MODULE_NAMING_REGISTRY.json` (new, non-protected)
- Fields: `current_path`, `target_path`, `family`, `boot_loaded`, `protected`, `overlap_with`, `phase`, `rollback_alias`

**Gate:** Codex approves registry schema before Phase 1.

### Phase 1 — Documentation aliases (doc-only)

- Update `docs/KGEN_TEMPLE_12345_MAP.md` mermaid graph with family labels.
- Add `CURRENT | LEGACY SHIM | RUNTIME CORE` tags per module in registry.
- No `index.html` or module renames.

### Phase 2 — Non-boot leaf modules

Migrate modules **not** in index.html boot chain and not protected:

- Candidates: `kgen-12345-2d-antigravity-engine.js`, `kgen-12345-sphere-runtime.js`, `kgen-12345-watchdog-runtime.js`, most organ/feature leaves.
- For each: copy → new name → update dynamic imports only → keep old path as **compat re-export stub** for one release cycle.

### Phase 3 — Boot-adjacent shells

Migrate shells loaded in index.html but not protected core:

- `kgen-12345-app-shell.js`, `kgen-12345-web3-shell.js`, `kgen-12345-ui.js`, CSS pairs.
- Requires staged `index.html` PR with rollback branch.

### Phase 4 — Protected core (Codex + human only)

- `runtime-main.js`, `runtime-bootstrap.js`, `runtime-main.css`
- `kgen-12345-runtime.js` legacy shim retirement plan
- Requires: full regression checklist, `verify_manifest.js` pass, Pages smoke test

## Compatibility Requirements

| Requirement | Implementation |
|---|---|
| **Dual-path loading** | During transition, `index.html` may load both old and new paths for one release; registry marks `compat_mode: true` |
| **Dynamic import safety** | Grep all `import(`, `src=`, `fetch(` under temple before each phase |
| **Manifest integrity** | Update `MANIFEST.json`, `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `SHA256SUMS.txt` in same WorkOrder as renames |
| **External references** | Check `12345.html` bridge, `K線西遊記/modules/`, docs cross-links |
| **Cache busting** | Preserve `?v=` query pattern on `runtime-main.css` / `runtime-main.js` / UI assets |

## Rollback Plan

```text
Per phase:
  1. Handoff branch: cursor-handoff/TEMPLE-12345-RENAME-P<phase>
  2. Pre-migration tag: temple-12345-pre-rename-p<phase>
  3. Registry snapshot: MODULE_NAMING_REGISTRY.p<phase>.json
  4. Rollback = revert index.html script tags + restore registry current_path
  5. Compat stubs remain until Codex declares phase stable
```

| Rollback trigger | Action |
|---|---|
| `verify_manifest.js` failure | Revert phase branch; keep compat stubs |
| Boot console error on localhost:8080 | Revert index.html changes first |
| Wallet/Web3 regression | Freeze at Phase 2; do not proceed to shells |

## Module Registry Snapshot (Active)

### `runtime-*` (25)

`runtime-bootstrap.js`, `runtime-canvas-screen-recorder.js`, `runtime-cell-registry.json`, `runtime-core.css`, `runtime-festival-engine.js`, `runtime-growth-policy.json`, `runtime-layout-fix.js`, `runtime-legacy.js`, `runtime-main.css`, `runtime-main.js`, `runtime-mother.js`, `runtime-panel-registry.js`, `runtime-panel-window-restore.js`, `runtime-recording-engine.js`, `runtime-regeneration.css`, `runtime-regeneration.js`, `runtime-router-engine.js`, `runtime-state.js`, `runtime-temple-layout.js`, `runtime-universe-axis.js`, `runtime-v10-40-6-stable-patch.js`, `runtime-visibility-engine.js`, `runtime-visual-semantic-control.js`, `runtime-warp-elevator.js`, `runtime-zlayer-engine.js`

### `kgen-12345-*` (45)

`kgen-12345-2d-antigravity-engine.js`, `kgen-12345-ai-service.js`, `kgen-12345-app-shell.js`, `kgen-12345-axis-c-scene.js`, `kgen-12345-boot-runtime.js`, `kgen-12345-cell-registry.json`, `kgen-12345-civilization-brain-rollcall.js`, `kgen-12345-core.css`, `kgen-12345-countdown-engine.js`, `kgen-12345-death-manager.js`, `kgen-12345-divine-regeneration.css`, `kgen-12345-divine-regeneration.js`, `kgen-12345-growth-policy.json`, `kgen-12345-holy-cup.js`, `kgen-12345-immune-runtime.js`, `kgen-12345-input-governance.js`, `kgen-12345-install-check.js`, `kgen-12345-layout-engine.js`, `kgen-12345-layout-runtime.js`, `kgen-12345-manifest-runtime.js`, `kgen-12345-morph-dna-organ-transplant.css`, `kgen-12345-morph-dna-organ-transplant.js`, `kgen-12345-mother-runtime.js`, `kgen-12345-motion-control.js`, `kgen-12345-organ-lifecycle.js`, `kgen-12345-organ-registry.json`, `kgen-12345-organ-system.css`, `kgen-12345-organ-system.js`, `kgen-12345-organ-wukong-control-console.js`, `kgen-12345-panel-router.js`, `kgen-12345-proto-stabilizer.js`, `kgen-12345-recursive-verify.js`, `kgen-12345-runtime.js`, `kgen-12345-sphere-runtime.js`, `kgen-12345-stable-countdown.js`, `kgen-12345-transformer-runtime.js`, `kgen-12345-ui.css`, `kgen-12345-ui.js`, `kgen-12345-ui-runtime.js`, `kgen-12345-universe-elevator.js`, `kgen-12345-version.js`, `kgen-12345-warp-runtime.js`, `kgen-12345-watchdog-runtime.js`, `kgen-12345-web3-shell.js`, `kgen-12345-world-axis.js`

### Other active (2)

`kgen-v1046-morph-dna-runtime.js`, `kgen-v1046-morph-dna-runtime.css`

### `modules/archive/` (20, frozen — do not rename)

`kgen-12345-runtime.legacy.js`, `kgen-12345-v10.10-*` (5), `kgen-12345-v10.11-*` (5), `kgen-12345-v10.26-autopilot-fix.js`, `kgen-12345-v10.27-stable-organ-check.js`, `kgen-12345-xyz-state-engine.css`, `kgen-12345-xyz-state-engine.js`, `kgen-v109-*` (5)

## Recommended Official Pattern (Decision)

**Adopt `temple-12345-<organ>-<function>`** as the target standard. Keep `runtime-main.js` logical name as `temple-12345-runtime-main.js` in Phase 4 only. Until Phase 4, **freeze protected filenames** and use registry aliases for documentation clarity.

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md`
- `K線西遊記/temples/12345/index.html` (read-only)
- `K線西遊記/temples/12345/modules/` (read-only inventory)
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003F OPEN → REVIEW (summary + detail)
- `KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md` — this report

## Protected Paths Checked

No modifications under protected paths. Temple 12345 audited read-only.

## Checks Run

| Check | Result |
|---|---|
| Worker registry `cursor-01` gate | ✅ ACTIVE, T2+ |
| Branch from `origin/main` @ `761f0e1` | ✅ |
| Module inventory | ✅ 25 runtime + 45 kgen-12345 + 2 kgen-v + 20 archive |
| Boot order documented | ✅ From index.html (ui.css between main and bootstrap) |
| Protected path diff | ✅ Clean |
| No 12345 file edits | ✅ |

## Problems Found

| ID | Problem | Severity |
|---|---|---|
| P1 | Dual runtime entry (`kgen-12345-runtime.js` + `runtime-main.js`) | High |
| P2 | Twin JSON registries (`*-cell-registry.json`, `*-growth-policy.json`) | Medium |
| P3 | Version in filename (`kgen-v1046-*`) conflicts with governance-in-JSON rule | Medium |
| P4 | 45 legacy-prefixed modules vs 25 runtime-prefixed — no single namespace | High |
| P5 | Parallel regen/warp/axis modules under both families | Medium |

## Risks

| Risk | Mitigation |
|---|---|
| Breaking wallet/Web3 boot | Phase 3+ requires dedicated QA WorkOrder |
| Manifest checksum drift | Same-WO update for all governance JSON |
| Agent creates duplicate `runtime-*` during migration | Registry `overlap_with` field + duplicate-function check |

## Technical Debt

- `runtime-legacy.js` and `kgen-12345-runtime.js` coexist with modern core.
- `docs/KGEN_TEMPLE_12345_MAP.md` generated 2026-07-05; may not list all current modules.

## Suggested WorkOrders

| Task ID | Title | Status |
|---|---|---|
| TEMPLE-12345-RENAME-P0 | Create MODULE_NAMING_REGISTRY.json (doc path) | PROPOSED |
| TEMPLE-12345-RENAME-P1 | Doc-only alias labels in TEMPLE_12345_MAP | PROPOSED |
| ORG-P2-014 | Runtime governance check (duplicate Runtime CURRENT) | PROPOSED (OPEN in queue) |

## Do Not Do

- Do not rename `runtime-main.js`, `runtime-bootstrap.js`, or `index.html` without explicit Codex WorkOrder.
- Do not delete `modules/archive/`.
- Do not merge `kgen-12345-runtime.js` into `runtime-main.js` without Phase 4 approval.

## Blockers

None for this planning WorkOrder. Execution phases blocked until Codex creates phase-specific WorkOrders.

## Recommendation

**APPROVE** ORG-P2-003F as the D8 migration plan. Codex should create `TEMPLE-12345-RENAME-P0` when ready to start registry work outside protected paths. Do not execute renames until registry and rollback snapshots exist.

## Need Codex Review

Yes.

## Need Human Decision

Yes — Phase 4 protected core renames require human authorization per `DO_NOT_TOUCH.md`.
