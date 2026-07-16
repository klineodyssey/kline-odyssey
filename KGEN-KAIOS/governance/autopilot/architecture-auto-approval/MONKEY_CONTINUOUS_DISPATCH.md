---
TITLE: "Monkey Continuous Dispatch"
VERSION: "0.1.0"
STATUS: "PROPOSED_DISABLED"
DEPENDENCY: "CANONICAL_ATOMIC_CLAIM_AUTHORITY"
IMPLEMENTATION: "NOT_STARTED"
---

# Monkey Continuous Dispatch

## Purpose

Continuous Dispatch reduces eligible worker idle time after a reviewed Claim is
closed. It does not permit a Cursor worker to self-dispatch, self-review, merge,
push main, or convert an Architecture approval into implementation authority.

## Lifecycle

```text
HANDOFF_REVIEWED
-> CLAIM_CLOSED
-> LEASE_RELEASED
-> REVIEW_AND_REPAIR_SCAN
-> APPROVED_IMPLEMENTATION_INBOX_SCAN
-> CAPABILITY_AND_PATH_MATCH
-> ATOMIC_COMPARE_AND_SWAP
-> TASK_ENVELOPE_BOUND
-> CLAIM_ACTIVE
```

Review and Repair always precede new dispatch. A worker with an `ACTIVE`,
`REVIEW`, or `REPAIR` Claim is ineligible for another Claim.

## Hard Eligibility Gates

The Dispatcher may attempt a Claim only when all are true:

- The task has explicit implementation authorization.
- `architecture_only` is false.
- Task Envelope is complete and unexpired.
- The worker is active, trusted, capable, and has no current Claim.
- Authorized paths do not overlap another active writer.
- Protected paths are excluded.
- Required worktree and branch are isolated from Human Main.
- Required tests, evidence, reviewer, and handoff target are defined.
- Repository and security health gates pass.
- Canonical Claim Authority can perform atomic compare-and-swap and return a
  unique `claim_id` and `fencing_token`.
- Quota, rate limit, cooldown, and worker capacity gates pass.

Architecture approval emits no implementation authorization. If no eligible
task exists, the worker remains idle and the queue may be `EMPTY_HEALTHY`.

## Atomicity Dependency

Branch-local JSON, chat text, or branch existence cannot be the Claim lock.
Continuous Dispatch remains `DISABLED` until a reviewed implementation provides:

```text
atomic_compare_and_swap
unique_claim_id
fencing_token
lease_expiry
heartbeat
review_custody
repair_owner
close_state
release_state
stale_session_rejection
```

Until then, Codex may make explicit offers, but the system must not claim fully
automatic or atomic dispatch.

## Matching and Fairness

Candidate order considers Review/Repair priority, task priority, age, deadline,
capability fit, trust, path isolation, conflict of interest, and recent workload.
Owner-controlled workers cannot monopolize the queue through clone count.

## Metrics

- `eligible_worker_utilization`: busy eligible time / available eligible time.
- `eligible_idle_time`: time from Claim release to next valid Claim or
  `EMPTY_HEALTHY` receipt.
- `dispatch_latency`: eligible task discovery to atomic Claim result.
- `claim_conflict_rate`: failed compare-and-swap attempts / attempts.
- `review_blocked_time`: time waiting for mandatory review or repair.

Target architecture guidance is 60-85 percent utilization and no more than five
minutes of eligible idle time when approved work exists. These are targets, not
current observations. Current values are `NOT_MEASURED`.

## Current State

- Architecture: `UNDER_REVIEW`
- Continuous Dispatch: `DISABLED`
- Canonical Atomic Claim Authority: `PROPOSAL_ONLY`
- Worker claims created by this package: `0`
- WorkQueue changes: `0`
