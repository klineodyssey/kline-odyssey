---
TITLE: "KAIOS Worker Swarm Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define a fail-closed coordination layer for many controlled Worker execution instances."
ANCESTOR: "KGEN-KAIOS/TASK_DISPATCHER.md; KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md; KGEN-KAIOS/workforce/AGENT_WORKFORCE_V2_STANDARD.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "CivilizationLifeform"
PHYLUM: "RuntimeArchitecture"
CLASS: "CompanyCoordinationRuntime"
ORDER: "WorkerSwarm"
FAMILY: "KAIOS"
GENUS: "ControlledWorkerSwarm"
SPECIES: "KAIOSWorkerSwarmRuntimeProposal"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/WORKER_SWARM_RUNTIME.md"
---

# Worker Swarm Runtime

## 1. Definition

Worker Swarm Runtime coordinates many registered execution instances under one Company authority. It is not a new Kernel, provider marketplace, autonomous collective, or replacement for existing workforce governance.

The term `swarm` means coordinated concurrency with explicit identity, leases, evidence, review ownership and recovery. It does not grant collective authority to alter architecture, Canon, protected paths or main.

## 2. Identity Chain

```text
Employee UUID
-> Agent ID
-> Worker ID
-> Clone ID
-> Session ID
-> Claim ID
-> Task ID
-> Evidence ID
-> Review ID
```

Each identifier has one purpose:

| Identifier | Meaning | Reuse rule |
|---|---|---|
| Employee UUID | Permanent Workforce V2 employee identity | Never reused |
| Agent ID | Provider-neutral Agent identity | Never shared by active Agents |
| Worker ID | Authorization principal in Worker Registry | Never shared by concurrent workers |
| Clone ID | Durable controlled execution-instance identity | Never reused after archive |
| Session ID | One chat window or invocation | Immutable and never reopened |
| Claim ID | Exclusive task custody record | One lineage, never reassigned silently |
| Task ID | WorkOrder identity | May have repair cycles, one primary owner |
| Evidence ID | Immutable evidence package reference | Content-addressed where possible |
| Review ID | Review decision record | Immutable, superseded by a new review |

## 3. Cardinality

- One registered Worker maps to one active Clone identity in V1.
- One Clone has zero or one active Session.
- One Session has zero or one active Claim.
- One Claim has one Primary Worker, one active Session holder and one Review Owner.
- One Task has at most one active Claim across the company.
- One disconnected Claim may continue through a new Recovery Session, but the previous Session must be fenced first.
- Advisors may add evidence but never become a second Primary Owner.

Future multi-clone worker pools require a new Human-approved architecture revision. V1 does not infer them from provider concurrency.

## 4. Runtime States

Clone operational states are separate from Workforce employment states:

```text
REGISTERED
-> BOOTING
-> READY
-> CLAIM_ACTIVE
-> EXECUTING
-> WAITING_REVIEW
-> CLOSED
-> OFFLINE

WAITING_REVIEW -> REPAIR -> EXECUTING
ANY_ACTIVE -> BLOCKED
ANY_ACTIVE -> RECOVERY_PENDING -> RECOVERING
ANY -> SUSPENDED
OFFLINE -> ARCHIVED
```

Workforce status such as `ACTIVE_ON_DUTY` or `SUSPENDED` remains owned by the Workforce Registry. Swarm state cannot promote employment or trust.

## 5. Coordination Cycle

```text
Human Inbox accepted
-> Priority calculated
-> Dispatcher checks existing reviews and repairs
-> Worker eligibility verified
-> Clone and Session verified
-> Claim allocated atomically
-> Worker executes one Task Envelope
-> Heartbeats and checkpoints recorded
-> Evidence submitted
-> Claim enters review custody
-> Codex Review decides approve, repair, reject, block or Human review
-> Dispatcher closes and releases atomically
-> Session checkpoints and closes
```

Cursor never chooses the next task, creates a second claim, releases itself, approves its evidence or starts a Recovery Session.

## 6. Core Invariants

1. Every executing Clone resolves to an active formal Worker.
2. `clone_id`, `session_id`, `claim_id`, `evidence_id` and `review_id` are globally unique.
3. One Session holds at most one active Claim.
4. One Clone has at most one unfenced active Session.
5. One Task has at most one active Claim.
6. Claim allocation and registry pointers change in one atomic transaction.
7. A branch-local claim is evidence, not the canonical company lock.
8. Heartbeat proves liveness only; it does not prove progress or quality.
9. Evidence submission transfers Claim custody to Review; it does not release the Claim.
10. Repair keeps the same Task and Claim lineage unless a formal superseding decision exists.
11. Recovery increments a fencing token before a new Session can write.
12. Old Sessions cannot resume after being fenced.
13. No Clone can merge, push main, deploy or modify protected paths.
14. Registry history is append-only; snapshots never erase events.
15. Human Final Authority remains above Dispatcher, Swarm and registries.

## 7. Concurrency and Scale

The architecture may coordinate 10, 50, 100 or 500 Workers by partitioning registry reads by `worker_id`, `clone_id` and `task_id`. Scale does not relax one-Claim-per-Session or one-Claim-per-Task.

The Master Registry is a logical consistency facade, not one giant mutable JSON document. A future implementation may use transactional storage, an append-only event log and materialized snapshots. Storage technology is deliberately not selected in this proposal.

## 8. Review Custody

When Evidence is accepted for review:

- Clone execution stops unless a bounded evidence-completion action is authorized.
- Session becomes `WAITING_REVIEW`.
- Claim remains exclusive.
- Review Owner becomes responsible for disposition.
- A new Human request enters Inbox but cannot consume the occupied Claim slot.
- Close and release happen only after queue, claim, session, clone, evidence, review and decision references agree.

## 9. Failure Semantics

Missing identity, stale registry version, duplicate IDs, conflicting claims, invalid Session, missing Task Envelope, protected-path request, stale fencing token, missing checkpoint, missing evidence or unresolved review returns a fail-closed result. No system component may guess the missing authority from chat history.

## 10. Architecture Boundary

This proposal defines contracts only. No registry service, queue, API, database, heartbeat process, recovery executor, implementation WorkQueue, commit, push or deployment is created.

