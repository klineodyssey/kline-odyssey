---
TITLE: "Canonical Atomic Claim Authority Implementation Proposal"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "IMPLEMENTATION_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Independent security and consistency review required"
SOURCE_COMMIT: "PENDING_LEVEL_B_PUBLICATION"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Select one transactional Claim authority and prevent branch-local race conditions."
ANCESTOR: "TASK_CLAIM_LEASE_PROTOCOL.md; Worker Swarm Master Registry proposal"
SOURCE_OF_TRUTH: "FALSE"
---

# Canonical Atomic Claim Authority Proposal

## Decision

Select **Option B: Dedicated Claim Registry Service backed by a transactional SQL database** as the target canonical authority.

GitHub branches, WorkQueue Markdown, Handoff files and dashboards remain auditable projections. They do not acquire locks.

## Why

| Option | Decision | Reason |
|---|---|---|
| GitHub Issue/PR labels | Reject as authority | Label edits and queue ordering do not provide a clear cross-object transaction and fencing contract |
| Dedicated Claim Registry service | Select | Supports unique constraints, transactions, compare-and-swap, fencing, leases and audit events |
| Local SQLite | Sandbox only | Safe for one-host simulation but not shared distributed authority |
| GitHub Actions serialized dispatcher | Adapter only | Useful for reconciliation, but concurrency queues are not the durable Claim ledger |
| Branch-local JSON | Reject | Already demonstrated overlapping Claim snapshots |

## Canonical Record

```text
claim_id
task_id
clone_id
worker_id
session_id
review_owner_id
status
fencing_token
lease_expiry
heartbeat_at
review_custody_at
repair_cycle
branch
base_sha
head_sha
record_version
created_at
updated_at
closed_at
released_at
```

Unique active constraints apply to `task_id`, `clone_id` and `session_id`. Every transition supplies expected `record_version` and `fencing_token`.

## Transition API Draft

```text
POST /claims/acquire
POST /claims/{id}/heartbeat
POST /claims/{id}/submit-review
POST /claims/{id}/repair
POST /claims/{id}/recover
POST /claims/{id}/close
POST /claims/{id}/release
GET  /claims/{id}
GET  /tasks/{task_id}/active-claim
```

All mutation endpoints are authenticated, authorized, idempotent and append an audit event. API design is not implementation authorization.

## Fencing

Acquire and Recovery increment `fencing_token`. Any write with an older token is rejected. Review custody retains the lock after execution lease expiry. Release requires completed disposition and cross-registry reconciliation.

## Storage and Secrets

Credentials, connection strings and service tokens never enter the Repo or Pages. A future service uses managed secret storage, least privilege, encrypted transport, backups and restore tests.

## Migration

1. Inventory existing branch-local claims as evidence.
2. Create deterministic legacy mappings without activating them.
3. Run a local SQLite simulator for state-machine tests only.
4. Complete independent security and concurrency review.
5. Deploy a non-production transactional service after separate authorization.
6. Shadow-read against current WorkQueue and branch evidence.
7. Human/Codex approve authority cutover.
8. Keep Markdown/JSON projections for audit.

## Current Operating Rule

Until implementation and cutover are complete, Codex may manually assign distinct tasks to distinct Sessions and record the complete Task Envelope. The company must state `MANUAL_DISPATCH_NON_ATOMIC`; it must not claim fully atomic automatic dispatch.

## Rollback

Before authority cutover, discard the simulator and continue manual dispatch. After a future cutover, rollback requires a reviewed snapshot, frozen acquisitions, event reconciliation and Human approval if state loss could occur.

## Boundary

This file is an implementation proposal. No service, database, workflow, secret, WorkQueue task, deployment or production authority is created here.

