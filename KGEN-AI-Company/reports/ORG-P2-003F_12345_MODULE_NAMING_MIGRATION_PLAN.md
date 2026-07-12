# ORG-P2-003F 12345 Module Naming Migration Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003F |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-12 |
| Base Commit | fcf948f |
| Branch | `cursor/org-p2-003f-naming-plan-3898` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | Codex |
| Architecture Decision | D8 FUTURE MIGRATION — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Drafted a **future-only migration plan** for Temple 12345 module naming per D8. The repo runs **two parallel naming families** (`runtime-*` ×25, `kgen-12345-*` ×45) plus `kgen-v*` ×2, with **functional overlap** but **non-identical file pairs**. Mapped **index.html boot order**, proposed target convention `temple-12345-<domain>-<role>`, phased migration with **shims**, and **rollback** gates. **No runtime modules, index.html, manifests, or protected paths modified.**

## Problem (D8)

| Issue | Evidence |
|---|---|
| Dual prefixes for same organ layer | `runtime-mother.js` ↔ `kgen-12345-mother-runtime.js` |
| Dual regeneration organs | `runtime-regeneration.*` ↔ `kgen-12345-divine-regeneration.*` |
| Dual registries / policies | `runtime-cell-registry.json` ↔ `kgen-12345-cell-registry.json` |
| Third versioned family | `kgen-v1046-morph-dna-runtime.*` vs `kgen-12345-morph-dna-organ-transplant.*` |
| LIFE_MANIFEST lists both families | `required_files` groups `runtime_*` and `kgen_12345_*` |
| HTML loads kgen chain + runtime core | 14 module tags; most `runtime-*` organs not in HTML |

**Root cause:** V10.42+ modular split moved UI to `runtime-main.js` while retaining `kgen-12345-*` config/boot shells; life-standard organs duplicated under `runtime-*` without retiring kgen counterparts.

## Live Boot Order (`index.html`)

| # | Path | Layer |
|---|---|---|
| 1–3 | `kgen-12345-core.css`, `kgen-12345-divine-regeneration.css`, `runtime-main.css` | Styles |
| 4 | `../../modules/kgen-land-engine.js` | Shared parent |
| 5–9 | `kgen-12345-app-shell`, `web3-shell`, `runtime` (config), `mother-runtime`, `divine-regeneration`, `ai-service` | Shell / organs |
| 10 | `runtime-main.js` | **UI owner** (`KGEN_RUNTIME_CORE`) |
| 11–14 | `runtime-bootstrap.js`, `kgen-12345-ui.css`, `kgen-12345-ui.js` | Immune check + UI overlay |

`kgen-12345-runtime.js` states: *Config + Boot only. UI is owned by runtime-main.js.*

## Parallel Pair Map

| runtime-* | kgen-12345-* | HTML-loaded | Notes |
|---|---|---|---|
| `runtime-main.js` / `.css` | — | ✅ | Canonical UI core |
| `runtime-bootstrap.js` | — | ✅ | LIFE_MANIFEST immune check |
| `runtime-mother.js` | `kgen-12345-mother-runtime.js` | kgen | Files differ |
| `runtime-regeneration.*` | `kgen-12345-divine-regeneration.*` | kgen | Files differ |
| `runtime-cell-registry.json` | `kgen-12345-cell-registry.json` | — | Files differ |
| `runtime-growth-policy.json` | `kgen-12345-growth-policy.json` | — | Files differ |
| `runtime-legacy.js` | `kgen-12345-runtime.js` | kgen (runtime.js) | Different roles today |
| `runtime-warp-elevator.js` | `kgen-12345-warp-runtime.js` | dynamic | Assumed overlap |
| `runtime-universe-axis.js` | `kgen-12345-world-axis.js` | dynamic | Assumed overlap |
| `kgen-v1046-morph-dna-runtime.*` | `kgen-12345-morph-dna-organ-transplant.*` | neither | Version-in-filename risk |

**Implication:** Rename-only migration will break cross-references in `runtime-main.js`, `LIFE_MANIFEST.json`, and organ CELL metadata. **Merge behavior first, then rename.**

## Proposed Target Convention

```text
temple-12345-<domain>-<role>.<ext>
```

| Layer | Target example | Replaces |
|---|---|---|
| UI core | `temple-12345-core-runtime.js` / `.css` | `runtime-main.*` |
| Boot immune | `temple-12345-boot-immune.js` | `runtime-bootstrap.js` |
| Config | `temple-12345-config-boot.js` | `kgen-12345-runtime.js` |
| Organ | `temple-12345-mother-engine.js` | both mother files (after merge) |

**Deprecated post-migration:** bare `runtime-*`, `kgen-12345-*`, `kgen-v*` in active `modules/` (immune headers already block version-in-filename).

## Migration Phases (future WOs only)

| Phase | Scope | Protected edits? |
|---|---|---|
| **0 — Registry** | `docs/KGEN_TEMPLE_12345_MODULE_REGISTRY.json` mapping current→target, boot order, owner organ | No |
| **1 — Behavior merge** | Pick canonical implementation per pair; smoke wallet/AI/bootstrap | **Yes** — authorized WO |
| **2 — Shims** | Old filenames → thin loaders to new canonical; `index.html` switches after verify | **Yes** |
| **3 — Manifest** | Atomic update `LIFE_MANIFEST.json`, `RUNTIME_GENOME.json`, `SHA256SUMS.txt` | **Yes** |
| **4 — Shim removal** | Move deprecated files to `modules/archive/`; no deletion | **Yes** + human gate |

## Rollback Requirements

| Gate | Requirement |
|---|---|
| Pre-migration tag | `temple-12345-modules-pre-migration` on last known-good `main` |
| Shim window | Old paths must load ≥2 release tags after rename |
| index.html rollback | Revert script `src` list; shims keep old URLs working |
| LIFE_MANIFEST backup | `archive/LIFE_MANIFEST.json.pre-migration` before Phase 3 |
| Verify | `runtime-bootstrap` LIFE check PASS before/after each phase |
| Authority | Phase 1+ requires explicit WO + Codex review |

## Compatibility Requirements

| Consumer | Requirement |
|---|---|
| `12345.html` bridge | Same entry URL and query params |
| GitHub Pages cache | `?v=` cache-bust on changed scripts (existing pattern) |
| `kgen-land-engine.js` | Parent path `../../modules/` unchanged |
| `window.*` globals | Keep `KGEN_RUNTIME_CORE`, `KGEN_12345_CONFIG`, `KGEN_AI_SPEAK` aliases ≥2 releases |
| Organ CELL `file:` metadata | Update atomically with rename |
| `modules/archive/` | Excluded from all rename phases |

## Risk Register

| ID | Risk | Severity |
|---|---|---|
| R1 | Protected edit without approval | Critical |
| R2 | Divergent pair merge breaks wallet/AI | High |
| R3 | LIFE_MANIFEST / SHA256 drift | High |
| R4 | Duplicate load (shim + canonical) | Medium |
| R5 | Archive modules accidentally renamed | Medium |

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Migration plan only | ✅ |
| No runtime/12345 files modified | ✅ |
| Rollback + compatibility included | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md` (D8)
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `docs/KGEN_TEMPLE_12345_MAP.md`
- `docs/KGEN_RUNTIME_RULES.md`
- `K線西遊記/temples/12345/index.html` (read only)
- `K線西遊記/temples/12345/LIFE_MANIFEST.json` (read only)
- `K線西遊記/temples/12345/modules/kgen-12345-runtime.js`
- `K線西遊記/temples/12345/modules/` listing

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003F → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md` — created

## Protected Paths Checked

No changes under contracts, `K線西遊記/temples/12345`, wallet, bridge, Boot CURRENT, Runtime CURRENT, final-whitepaper, or KGEN token contract.

## Recommendation

1. Codex approve ORG-P2-003F; do **not** authorize protected edits from this report.
2. Proposed follow-up: Phase 0 registry JSON under `docs/` only.
3. Next OPEN on main: **ORG-P2-004** (reissue required — stale handoff per reconciliation log).

## Need Codex Review

**Yes.**

## Need Human Decision

**Yes** before Phase 1+ — confirm target prefix `temple-12345-*` vs `runtime-*` unification.
