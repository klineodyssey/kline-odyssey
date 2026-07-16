---
TITLE: "KAIOS Cursor UI Worker Dispatch Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
DISPATCH: "DISABLED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Define one-Claim isolated UI remediation and visual evidence handoff."
ANCESTOR: "KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md; KGEN-KAIOS/ui-governor/AUTOMATIC_WORKQUEUE_GENERATOR.md"
SOURCE_OF_TRUTH: false
---

# Cursor UI Worker Dispatch

## 1. Worker Role

Cursor is a controlled UI execution Worker. It may edit only an approved non-protected path in an isolated worktree under one canonical Claim. It cannot approve a baseline, review itself, merge, push main, deploy or expand scope.

## 2. Dispatch Preconditions

```text
COMPANY_BOOT_PASS
REVIEW_QUEUE_CLEAR_OR_HIGHER_PRIORITY_HANDLED
APPROVED_UI_WORKORDER
COMPLETE_TASK_ENVELOPE
CANONICAL_ATOMIC_CLAIM
UNIQUE_FENCING_TOKEN
ISOLATED_WORKTREE
AUTHORIZED_PATHS_NON_OVERLAPPING
PROTECTED_PATH_CHECK_PASS
BASELINE_AND_FIXTURE_AVAILABLE
CODEX_REVIEW_OWNER_ASSIGNED
```

Until the canonical atomic Claim authority exists, UI Auto Dispatch remains disabled.

## 3. Cursor Task Envelope Additions

```text
ui_issue_ids
surface_ids
profile_ids
state_ids
baseline_ids
style_canon_revision
required_before_screenshots
required_after_screenshots
required_visual_diffs
required_accessibility_checks
required_performance_checks
allowed_visual_change_regions
forbidden_visual_change_regions
```

## 4. Execution Flow

```text
BOOT
-> PREFLIGHT
-> CLAIM_VERIFY
-> BASELINE_CAPTURE_VERIFY
-> EDIT_AUTHORIZED_PATHS
-> STATIC_TESTS
-> 80-CELL_OR_BOUNDED_MATRIX_RUN
-> ACCESSIBILITY_RUN
-> PERFORMANCE_RUN
-> EVIDENCE_HASH
-> CHECKPOINT
-> HANDOFF
-> WAIT_FOR_CODEX
```

The bounded matrix may be smaller than 80 only when the Task Envelope proves unaffected surfaces and profiles. The full release gate still runs before publication.

## 5. Handoff Requirements

In addition to the standard Handoff:

```text
before_artifact_hashes
after_artifact_hashes
diff_artifact_hashes
affected_cells
passed_cells
failed_cells
invalid_cells
console_summary
network_summary
accessibility_summary
performance_summary
style_canon_compliance
protected_path_violations
baseline_change_requested
```

## 6. Repair

Codex returns failures to the same Task and Claim lineage when safe. Scope-expanding repair requires a new WorkOrder candidate. Baseline updates are not a repair shortcut.

## 7. Current Boundary

```text
Cursor task created: false
Claim created: false
Dispatch enabled: false
Implementation started: false
```
