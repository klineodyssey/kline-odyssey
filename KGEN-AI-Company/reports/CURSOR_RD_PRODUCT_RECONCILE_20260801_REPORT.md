# Cursor R&D Report — Product Surface Reconciliation

**Report type:** PROACTIVE_RD_HANDOFF (not claimable until Codex promotes WorkOrders)  
**Task ID (proposed):** `KAIOS-RD-PRODUCT-RECONCILE-001`  
**Worker:** cursor-cloud-01 / cursor-01  
**Base SHA:** `74009c7906ef671c1fe250199b901c0d0045c6dc`  
**Date:** 2026-08-01  
**Reviewer:** codex-gm-01  
**Human decision required:** Only for PR #42 close/merge policy (see §6)

---

## State Progress

| Phase | Status |
|-------|--------|
| BOOT | PASS — read `main`, `WORK_QUEUE.md`, PR #42/#69, `worker_registry.json` |
| CLAIM | N/A — proactive R&D; no OPEN dispatch for this task ID |
| WORK | PASS — comparative audit complete |
| TEST | PASS — path/link grep on `origin/main` vs `origin/cursor-handoff/KAIOS-PRODUCT-SPRINT-001A` |
| REPORT | ACTIVE (this file) |
| REVIEW | **PENDING_CODEX** |
| MERGE | Cursor denied |

---

## 1. Executive Summary (for Codex)

1. **PR #69** (Foundational Life candidates) is **submitted** — Codex should **review/merge or FIX**; Cursor idle on that line.
2. **PR #42** (Product Sprint 001A) is **largely superseded by main** for *navigation goals*, but **not merged** and uses a **different UX architecture** (product-shell) that **main does not have**.
3. WorkQueue marks **001A SUPERSEDED → 001A-R1**, but **001A-R1 is not defined** as an OPEN WorkOrder on main — **gap**.
4. Cursor recommends Codex **schedule explicit decisions** (close #42 vs R1 vs cherry-pick) instead of leaving Human to infer from chat.

---

## 2. PR #42 vs Current `main` — Functional Reconciliation

### 2.1 What PR #42 adds (still only on branch)

| Asset / behavior | Path / marker |
|------------------|---------------|
| Product shell JS/CSS | `assets/product-shell.js`, `assets/product-shell.css` |
| Bottom product dock | `#product-dock`, `.product-dock__link` |
| Full-page iframe demo | `data-product-feature`, `data-product-fullpage` |
| History navigation in shell | `product-shell.js` history API |
| Evidence pack | `assets/product-sprint-001a-evidence/` |
| PR preview pipeline | `.github/workflows/pr-preview-pages.yml` |
| Viewer entry (legacy path) | `KGEN-KAIOS/world-viewer/index.html` |

### 2.2 What `main` already has (post–Jul 31 / Aug 1 merges)

| Capability | Public route / evidence |
|------------|-------------------------|
| Full World Viewer on official site | `./world-viewer/` → `world-viewer/index.html` (commit `f4be0ed4`) |
| K280 digital life viewer | `./world-viewer/k280/` (PR #60) |
| Player Genesis | `./world-viewer/player-genesis/` |
| Real causal world runtime | `./world-viewer/causal-runtime/` |
| Homepage sections + CTAs | `index.html` `#kaios-world`, K280, genesis, causal bands |
| World Viewer product QA workflow | `.github/workflows/world-viewer-product-qa.yml` |

### 2.3 Verdict matrix

| Question | Answer |
|----------|--------|
| Can users reach World Viewer from homepage on **main**? | **YES** — multiple canonical routes |
| Is **main** a strict superset of #42 link targets? | **NO** — #42 uses old `KGEN-KAIOS/world-viewer/` embed pattern; main uses `./world-viewer/` wrappers |
| Does **main** include product-shell / dock / iframe demo UX? | **NO** |
| Is #42 merge required for core navigation? | **NO** — main already ships broader entry graph |
| Is #42 obsolete? | **PARTIALLY** — superseded for *goals*, not for *specific UX* or *PR preview CI* |

---

## 3. Active Work Lines — Status for Codex Scheduler

| Line | PR | Queue / dispatch | Cursor state | Codex next action |
|------|-----|------------------|--------------|-------------------|
| Foundational Life | **#69** | `KAIOS-PR67-...` CLAIMED | Delivered | **Review → merge or FIX** |
| BscScan logo | #51 merged | DONE | Complete | Human BscScan submit only |
| Product Sprint 001A | **#42** Draft | **SUPERSEDED** (001A-R1 referenced, **missing**) | Stale branch | **Decision: CLOSE / R1 / cherry-pick** |
| WALS index docs | — | **HOLD / NOT_APPROVED** | Blocked | Approve dispatch or cancel |
| PR preview pipeline | on #42 only | No WorkOrder | Not on main | Optional separate CI WorkOrder |

---

## 4. PROPOSED WorkOrders (Cursor may not promote — Codex only)

### PROPOSED-001 — `KAIOS-PRODUCT-SPRINT-001A-R1`

**Objective:** Define current-baseline product UX on `main` (not re-merge blind #42).

**Options (Codex pick one):**

| Option | Description | Risk |
|--------|-------------|------|
| **A — CLOSE #42** | Mark PR #42 closed/archived; document main routes as canonical; update closeout | Low |
| **B — PORT shell** | Cherry-pick `product-shell.*` onto current `index.html` + `./world-viewer/` paths | Medium merge conflict |
| **C — HYBRID** | Keep main bands; add optional dock behind feature flag | Medium |

**Acceptance:** ≤2 clicks to `./world-viewer/` on mobile + desktop; QA workflow PASS; no protected path edits.

---

### PROPOSED-002 — `KAIOS-PR-PREVIEW-PAGES-001`

**Objective:** Land PR preview deploy on `main` (extract from #42 branch).

**Blocker:** `github-pages` environment deployment branch policy (main-only).

**Codex/Human admin:** Add preview branch policy or use GitHub Actions artifact + comment URL pattern.

---

### PROPOSED-003 — `KAIOS-WALS-DOCS-001` activation

**Objective:** Unblock existing HOLD row — index integration for WALS docs.

**Codex:** Set `Dispatch Status: APPROVED`, `Status: OPEN`, refresh `base_sha`.

---

## 5. Process Improvement (Cursor commitment)

Cursor failed to put PR #42 reconciliation on GitHub before Human asked. **Fix:**

1. Every proactive R&D → this report pattern + `handoffs/*/handoff.json` + Draft PR.
2. PR comments include `<!-- CURSOR_CODEX_HANDOFF -->` block.
3. **PROPOSED** WorkOrders listed here; Codex promotes to `WORK_QUEUE.md`.
4. No silent “main already has it” conclusions in chat only.

---

## 6. Need Human Decision

| Item | Required? |
|------|-----------|
| Close vs merge PR #42 | **YES** — product direction |
| Foundational Life #69 | **NO** — Codex review sufficient |
| WALS-DOCS dispatch | **NO** — Codex policy |

---

## 7. Validation Commands (reproducible)

```bash
# main: no product shell
git show origin/main:assets/product-shell.js 2>&1 | head -1

# main: world-viewer routes
git show origin/main:index.html | rg 'world-viewer' | head

# PR42: product shell present
git show origin/cursor-handoff/KAIOS-PRODUCT-SPRINT-001A:assets/product-shell.js | head -3
```

---

## 8. Recommendation

1. **P0:** Codex review **PR #69** immediately.  
2. **P1:** Codex publish **`KAIOS-PRODUCT-SPRINT-001A-R1`** WorkOrder with option A/B/C decision.  
3. **P2:** Close or archive **PR #42** after R1 direction is recorded (avoid dual product truth).  
4. **P3:** Optionally approve **WALS-DOCS-001** or cancel explicitly.

**Cursor final status:** `CURSOR_RD_HANDOFF_SUBMITTED_PENDING_CODEX_SCHEDULING`
