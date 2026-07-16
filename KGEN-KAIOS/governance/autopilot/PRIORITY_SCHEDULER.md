---
TITLE: "PrimeForge Priority Scheduler Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-AUTOMATIC-MAINTENANCE-001"
CHANGE_REASON: "Define deterministic company priority without violating one-task claims or Human authority."
ANCESTOR: "CODEX_MANAGER_PROTOCOL.md; HUMAN_INBOX_ROUTER.md; TASK_CLAIM_LEASE_PROTOCOL.md"
SOURCE_OF_TRUTH: "FALSE"
---

# Priority Scheduler

Priority Scheduler is launched only by Company Kernel at Layer 1. It may calculate order during Boot, but it cannot dispatch any action before Review Queue, Claim Lease, Evidence, Review, and Human Decision layers pass.

## Normal Priority Classes

The Human-approved normal order is fixed:

1. `REVIEW`
2. `REPAIR`
3. `HUMAN_DECISION`
4. `ARCHITECTURE`
5. `IMPLEMENTATION`

Scheduling does not grant authority. An item may be first and still remain blocked by missing evidence, protected paths, an active claim, a frozen baseline, or absent Human approval.

If canonical claim state and branch-local claim evidence disagree, the scheduler selects no execution item and emits `BLOCKED_CLAIM_STATE_CONFLICT`.

## Safety Preemption

These events preempt the normal queue because they preserve state rather than advance work:

- `URGENT_STOP`
- `SECRET_EXPOSURE`
- `PROTECTED_PATH_ALERT`
- `SECURITY_INCIDENT`
- `DATA_LOSS_RISK`

After containment, normal scheduling resumes from `REVIEW`.

## Parallel Maintenance Lane

Repository health checks and `NETWORK_RETRY_MODE` run as a service lane. They do not consume the one Cursor task slot and do not prevent Inbox intake, architecture analysis, Human review, or local evidence work. Remote-dependent closeout, merge, push, and deployment remain gated until health recovers.

## Ordering Within a Class

Items in the same class are ordered by:

1. dependencies complete;
2. explicit Human urgency;
3. lower risk first unless containment requires otherwise;
4. oldest accepted source first;
5. no asset or file conflict;
6. eligible worker available;
7. lease and deadline validity.

WorkQueue line number is not an authority or a sufficient priority signal.

## One-Task Rule

- A Worker may hold one primary active task.
- `REVIEW` and `REPAIR` retain task custody until Codex records close or release.
- Advisors and reviewers may contribute evidence but cannot create a competing primary claim.
- A new Human task enters Company Inbox while the current task is unresolved.
- Repair stays on the same Task ID unless Human/Codex governance explicitly creates a replacement.

## Decision Output

Every scheduler cycle returns:

```text
selected_item
priority_class
selection_reason
authority_state
dependency_state
claim_state
network_dependency
allowed_action
blocked_reason
next_review_time
```

The scheduler never merges, pushes, deploys, edits protected paths, or converts an idea directly to an implementation task.
