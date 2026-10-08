# KGEN Performance And Discipline Standard

**Status:** ACTIVE
**Version:** 1.1
**Last Updated:** 2026-10-08
**Task ID:** KAIOS-HR-SYSTEM-20261008-001

## Performance Metrics

- On-time delivery.
- Single-task purity.
- Report completeness.
- Protected path compliance.
- Review pass rate.
- Stale branch rate.
- Fix rate.
- Test pass rate.
- Canon compliance.
- R&D suggestion value.
- WorkOrder ACK latency and truthfulness.
- Exact-head result and evidence durability.
- Handoff completeness and receiver ACK.
- Rework attributable to avoidable quality defects.
- Protected-action and identity-boundary compliance.

No activity metric may reward filler tasks, purposeless chatter, duplicate PRs, repeated stale prompts or fabricated availability. A GitHub comment marked delivered is not a receiver ACK. Performance evidence must identify the Work ID, branch, exact HEAD, tests, review and final disposition.

## Work Handoff Lifecycle

The auditable lifecycle is `WORK_ORDER_CREATED -> DELIVERED -> ACKNOWLEDGED -> WORK_STARTED -> RESULT_SAVED -> REVIEWED -> CLOSED`. Each transition records actor identity, Work ID, revision, exact HEAD when applicable, timestamp and evidence reference. Missing ACK remains `DELIVERY_NOT_VERIFIED`; an ACK is never completion. A head change invalidates older test/review PASS until revalidated.

Transfer between writers additionally requires current-writer release, next-writer ACK, exact handoff head and remaining scope. One active engineering branch has at most one active writer.

## Violations

- Working without registration or check-in.
- Skipping Boot, WorkQueue or DO_NOT_TOUCH.
- Pushing main.
- Force pushing.
- Modifying protected paths.
- Hiding changes.
- Mixing multiple tasks in one branch.
- Faking reports.
- Claiming completion without pushing a handoff branch.
- Claiming a worker, Controller, reviewer, ACK, payroll entitlement or automation delivery without durable evidence.
- Reusing an old-head PASS after the head changes.

## Dispositions

`WARNING`, `RETRAINING`, `LOWER_TRUST`, `REVIEW_REQUIRED`, `SUSPENDED`, `REVOKED`.

## Reward Without Bypass

High-performing workers may receive higher-priority tasks, more concurrent low-risk capacity, reduced duplicate checks, and Reviewer Candidate status. They do not bypass Codex Review unless Human explicitly approves a low-risk scope with tests and rollback.

## Review And Appeal

HR maintains the evidence packet; the manager records the disposition; a distinct qualified reviewer handles technical disputes when available. Workers may cite missing or contradictory evidence and request correction. Suspension, revocation, payroll eligibility and tool authority remain separate decisions and must not be silently coupled.
