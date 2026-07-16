---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Define complete, reviewable Cursor evidence and handoff artifacts."
ANCESTOR: "KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: EvidenceHandoff
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: CursorHandoffStandardArchitecture
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/CURSOR_HANDOFF_STANDARD.md"
---

# Cursor Handoff Standard Proposal

## 1. Required Artifacts

Every completed Cursor task must produce both:

- `HANDOFF.md`, readable by Human and reviewer;
- `handoff.json`, machine-readable with equivalent facts.

An absent or inconsistent artifact fails the handoff. A task-branch commit or chat statement alone is not completion evidence.

## 2. Required Fields

Both artifacts must represent:

```text
task_id
human_decision_id
worker_id
branch
worktree
base_sha
head_sha
files_changed
files_added
files_deleted
tests_run
test_results
evidence
known_issues
risks
protected_path_violations
runtime_current_modified
universe_map_modified
implementation_scope
out_of_scope_observations
recommended_next_action
review_status
```

Traceability should also include `claim_id`, `task_envelope_id`, `boot_evidence`, `preflight_result`, `legacy_rules_suppressed`, `commit_sha`, `report_path`, timestamps and provenance records.

## 3. Delivery State

The worker sequence is:

```text
BOOT
-> CLAIM
-> WORK
-> TEST
-> REPORT
-> HANDOFF
-> REVIEW_WAIT
```

Cursor must report `review_status: PENDING_CODEX_REVIEW`. It cannot mark `APPROVED`, `MERGED`, `RELEASED` or `DONE` on its own.

## 4. Evidence Quality

- Changed-file lists must match the task-branch diff from `base_sha` to `head_sha`.
- Deletions and renames must be explicit.
- Each required test must include command or method, result and relevant output reference.
- Evidence must be reproducible without hidden chat memory.
- Known failures and skipped tests must not be omitted.
- Out-of-scope findings become observations, risks or follow-up proposals only.
- The report must identify whether implementation, deployment, Runtime CURRENT or Universe Map were touched.

## 5. Branch and Push Boundary

The current registered Cursor namespace is `cursor-handoff/<Task-ID>`. Cursor may push that handoff only when `push_allowed` is true in the validated Task Envelope. Cursor cannot push, merge or fast-forward `main`.

## 6. Review Gate

Codex validates identity, envelope, branch, base, diff, report, tests, Canon, protected paths, provenance and single-task purity. Human approval remains required whenever the governing decision or risk level requires it.

## 7. Failure Conditions

Handoff fails when any of the following is true:

- either required artifact is missing;
- test evidence is missing or materially inconsistent;
- files differ from the reported inventory;
- the branch contains more than one task;
- a protected path changed;
- base or head SHA is not visible;
- the report claims completion beyond Cursor authority;
- required provenance is absent.

Failed handoff remains evidence; it is not deleted or rewritten as a passing report.
