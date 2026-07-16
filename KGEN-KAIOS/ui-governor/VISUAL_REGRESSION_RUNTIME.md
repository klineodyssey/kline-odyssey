---
TITLE: "KAIOS Visual Regression Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Define baseline lifecycle, regression decisions and release gating."
ANCESTOR: "KGEN-KAIOS/ui-governor/SCREENSHOT_DIFF_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Visual Regression Runtime

## 1. Baseline Lifecycle

```text
CANDIDATE
-> CAPTURE_VALIDATED
-> CODEX_REVIEW
-> APPROVED
-> ACTIVE
-> SUPERSEDED
-> ARCHIVED
```

A Worker cannot approve its own baseline. A failed candidate cannot replace the active baseline. Baseline promotion records source commit, review decision, affected cells, approved masks and rollback baseline.

## 2. Coverage Unit

Coverage is measured by `surface_id + state_id + profile_id`, not only by route. The daily minimum matrix has 80 default-state cells. Interactive surfaces add state coverage such as:

```text
DEFAULT
LOADING
EMPTY
ERROR
DRAWER_OPEN
DIALOG_OPEN
CONTEXT_MENU_OPEN
SELECTED
FOCUS_VISIBLE
OFFLINE_OR_DEGRADED
```

The 80-cell headline is therefore a floor, not complete interaction coverage.

## 3. Regression Classification

| Class | Meaning | Default action |
|---|---|---|
| `EXPECTED_CHANGE` | Matches approved design decision | Review baseline candidate |
| `UNEXPECTED_REGRESSION` | Violates active baseline or Style Canon | Create finding |
| `ENVIRONMENT_NOISE` | Browser/font/raster instability | Invalidate and rerun |
| `FIXTURE_DRIFT` | Data no longer deterministic | Block baseline comparison |
| `MASK_DRIFT` | Mask changed or expanded | P1 review |
| `SOURCE_MISMATCH` | Candidate commit differs from declared source | Fail closed |

## 4. Triage

Regression triage evaluates visual severity, affected profiles, task blockage, accessibility impact, privacy impact and scope. A one-pixel change can be P0 when it reveals private data; a large approved illustration change can be expected.

## 5. Release Rules

- Every required cell has one active baseline.
- Every candidate comparison references the same approved policy revision.
- No P0 or P1 visual regression is unresolved.
- Approved changes include decision and rollback evidence.
- Baseline artifacts are restorable and content addressed.
- Theme and orientation baselines are independent.
- Protected surfaces require protected-path review even for visual-only changes.

## 6. Retention

Active and rollback baselines are warm artifacts. Superseded baselines move to cold archive with manifest and decision references. Disposable retry captures expire. Evidence needed for release or incident audit is immutable under the active retention policy.

## 7. Current Coverage

```text
Required default cells specified: 80
Approved screenshot baselines: 0
Automated comparisons: 0
Runtime coverage: 0 percent
```

This architecture must not report its 80 defined cells as executed coverage.

## 8. Architecture Boundary

No baseline is captured or approved here. World Viewer and other frozen architecture baselines are not visual screenshot baselines.
