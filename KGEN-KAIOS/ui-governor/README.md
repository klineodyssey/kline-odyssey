---
TITLE: "KAIOS UI Governor Architecture Package"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
AUTOMATION: "DESIGNED_NOT_ENABLED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Define permanent UI inspection governance and a shared UI Style Canon without implementing or modifying protected UI runtimes."
ANCESTOR: "KGEN-Genesis/GEN-010_Design_System/KGEN_Design_System_V1.0.md; KGEN-KAIOS/world-viewer/UI_LAYOUT_STANDARD.md; KGEN-KAIOS/V10/FRONTEND_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# KAIOS UI Governor

## 1. Decision Boundary

This package specifies a permanent UI inspection control plane. It does not run a browser, capture screenshots, create GitHub Issues, mutate WorkQueue, allocate Claims, dispatch Cursor, change a Temple, or deploy Pages.

The normalized repository decision identifier `HUMAN-UI-GOVERNOR-001` is assigned for traceability because the Human instruction did not include an explicit ID. It does not add authority beyond the supplied Architecture-only decision.

| Field | Value |
|---|---|
| Architecture | `UNDER_REVIEW` |
| UI Governor implementation | `NOT_STARTED` |
| Daily scheduler | `NOT_RUNNING` |
| Screenshot baselines | `0 / 80` |
| Automatic Issue generation | `DESIGNED_NOT_ENABLED` |
| Automatic WorkQueue generation | `DESIGNED_NOT_ENABLED` |
| Cursor UI dispatch | `DISABLED` |
| Protected UI remediation | `HUMAN_PATH_AUTHORIZATION_REQUIRED` |
| Deployment | `NOT_STARTED` |

## 2. Source Audit

| Source | Classification | Finding | Treatment |
|---|---|---|---|
| Human UI Governor Decision | Human architecture direction | Requests permanent inspection, automatic triage, Style Canon, and six mobile rules | Highest task authority |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | CURRENT Constitution | Architecture before implementation, evidence first, fail closed, Human Final Authority | Mandatory |
| `KGEN-Genesis/GEN-010_Design_System/KGEN_Design_System_V1.0.md` | Official design ancestor | Broad KGEN design bible; no executable cross-surface inspection control plane | Import, do not replace |
| `KGEN-KAIOS/V10/FRONTEND_STANDARD.md` | Draft frontend standard | Frontend is presentation, not identity or transaction authority | Import boundary |
| `KGEN-KAIOS/world-viewer/UI_LAYOUT_STANDARD.md` | Frozen World Viewer architecture | Map-first desktop/mobile contract and accessibility expectations | Reference only; baseline unchanged |
| `KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md` | Frozen baseline | World Viewer implementation is not started | Do not rewrite |
| `KGEN-KAIOS/boot-runtime/KAIOS_BOOT_UI_FLOW.md` | Architecture proposal | Truthful gate states and fail-closed UI | Reuse state semantics |
| `.github/workflows/deploy-pages-static.yml` | Active deployment workflow | Publishes static Pages; no visual, accessibility, responsive or performance test stage | Future adapter only |
| Homepage, Galaxy and Temple 12345 page implementations | Current implementations | Mixed inline/module UI, inconsistent safe-area and test evidence | Observe only |
| UI Governor equivalent | Missing | No matching runtime, report, screenshot diff or regression package found | New proposal justified |

## 3. Package Map

| File | Purpose |
|---|---|
| `UI_GOVERNOR_RUNTIME.md` | Control-plane lifecycle, inspection matrix, evidence and release gates |
| `UI_HEALTH_REPORT.md` | Current pre-automation baseline and transparent score |
| `SCREENSHOT_DIFF_RUNTIME.md` | Baseline, mask, comparison and diff artifact contract |
| `VISUAL_REGRESSION_RUNTIME.md` | Visual baseline lifecycle and regression decisions |
| `RESPONSIVE_LAYOUT_RUNTIME.md` | Device profiles, orientation, theme and layout invariants |
| `ACCESSIBILITY_RUNTIME.md` | Automated and manual accessibility evidence contract |
| `PERFORMANCE_RUNTIME.md` | FPS, loading, Web performance and console/network budgets |
| `AUTOMATIC_ISSUE_GENERATOR.md` | Finding normalization, deduplication and issue state machine |
| `AUTOMATIC_WORKQUEUE_GENERATOR.md` | Issue-to-proposed-WorkOrder architecture and approval gates |
| `CURSOR_UI_WORKER_DISPATCH.md` | Isolated Cursor UI task and evidence contract |
| `UI_STYLE_CANON_V1.md` | Shared component, spacing, motion and typography architecture |
| `ui_governor_runtime.json` | Machine-readable inspection, automation and boundary model |
| `ui_health_report.json` | Machine-readable baseline health evidence |
| `ui_style_canon_v1.json` | Machine-readable Style Canon candidate tokens and invariants |

## 4. Inspection Matrix

The daily target is ten surfaces multiplied by eight deterministic profiles: 80 scenario cells. A cell is covered only when it has a current approved baseline and a complete new run with screenshot, DOM, console, network, accessibility and performance evidence.

Surfaces:

```text
HOMEPAGE
TEMPLE
WORLD_VIEWER
LAND
LIFE
MISSION
MARKETPLACE
COMPANY
DNA
PLAYER
```

Profiles cover Desktop, Tablet, Android, iPhone, Landscape, Portrait, Dark Mode and Light Mode. They are defined in `RESPONSIVE_LAYOUT_RUNTIME.md`.

## 5. Current Gate

The architecture is ready for independent review, not implementation or baseline freeze. Automatic WorkQueue creation and Cursor dispatch remain disabled until:

1. this architecture is approved;
2. the Canonical Atomic Claim Authority is implemented and independently validated;
3. screenshot storage, privacy, retention and artifact integrity are approved;
4. a low-risk UI path allowlist exists;
5. the affected path is not protected, or Human grants exact protected-path authority;
6. rollback and re-run evidence are available.
