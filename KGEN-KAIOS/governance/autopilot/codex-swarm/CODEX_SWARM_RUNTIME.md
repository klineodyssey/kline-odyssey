---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Define controlled internal parallelism for the Codex Chief Engineering Organization."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/worker-swarm/WORKER_SWARM_RUNTIME.md; KGEN-KAIOS/governance/autopilot/CODEX_GENERAL_MANAGER_BOOT.md"
SOURCE_OF_TRUTH: false
---

# Codex Swarm Runtime V1

## 1. Definition

Codex Swarm Runtime is an internal organization profile under the existing Company OS and Worker Swarm. It lets one Codex Chief Engineering Organization operate several isolated, role-scoped execution Clones without sharing Sessions, Claims, worktrees, write sets, or approval authority.

It is not:

- a new Company OS;
- a second Governance Board;
- a second WorkQueue;
- a second Company Dispatcher;
- a collective merge authority;
- proof that parallel Codex Agents are currently online.

## 2. Topology

```text
Human PrimeForge
-> KAIOS Constitution and Human Anchor
-> Company Decision / Current Authority
-> Company OS Boot and Priority Scheduler
-> Codex Chief Engineering Organization
   -> Architecture Clone
   -> Review Clone
   -> Dispatcher Clone
   -> Kernel Clone
   -> Life Clone
   -> UI Clone
   -> Git Clone
   -> Documentation Clone
   -> Testing Clone
   -> Company Clone
-> Evidence / Review / Decision / Release
```

The parent Codex organization is a controller and authority boundary, not a hidden implementation Clone. It opens the Company Session, verifies Human authority, submits allocation requests to existing governance, observes health, and closes the organization checkpoint.

## 3. Identity Model

Every internal execution must resolve this chain:

```text
codex_organization_id
-> parent_worker_id
-> internal_actor_id
-> clone_role
-> clone_id
-> session_id
-> claim_id
-> task_id
-> worktree_id
-> branch
-> evidence_id
-> review_id
```

`parent_worker_id = codex-gm-01` is not reused as the concurrent execution principal. Every Clone has a unique registered `internal_actor_id`. This preserves the existing rule that concurrent workers do not share one Worker authorization identity.

## 4. Allocation Cycle

```text
Company Boot PASS
-> Inbox item references active authority
-> Priority Scheduler selects eligible work
-> role capability and separation check
-> write-set conflict check
-> canonical Claim acquisition
-> unique Session / worktree / branch binding
-> Clone executes one Task Envelope
-> checkpoint and evidence
-> Review custody
-> Review disposition
-> Git integration authorization when applicable
-> Close / Release
-> Session archive
```

No Clone may self-create a command, promote an Inbox item, allocate its own Claim, or reopen a fenced Session.

## 5. Runtime States

```text
REGISTERED
-> BOOTING
-> READY
-> CLAIM_ACTIVE
-> EXECUTING
-> HANDOFF_SUBMITTED
-> WAITING_REVIEW
-> CLOSED
-> OFFLINE

WAITING_REVIEW -> REPAIR -> EXECUTING
ANY_ACTIVE -> BLOCKED
ANY_ACTIVE -> CHECKPOINTING -> RECOVERY_PENDING -> RECOVERING
ANY -> SUSPENDED
OFFLINE -> ARCHIVED
```

Role capability does not change lifecycle state, employment status, trust, or Human authority.

## 6. Core Invariants

1. One Clone has one immutable role for its Session.
2. One Session has at most one active Claim.
3. One Claim has one primary Clone and one Review Owner.
4. One Task has at most one active primary Claim.
5. Every Clone uses one isolated worktree and one `codex/` branch.
6. Active write sets cannot overlap.
7. Shared indexes are updated through a serialized integration task, not concurrently by every author.
8. An author Clone cannot review or integrate its own artifact.
9. Review Clone cannot implement.
10. Dispatcher Clone cannot edit program or Architecture files.
11. Git Clone cannot invent approval or alter reviewed content during integration.
12. Testing Clone reports evidence and cannot approve the tested artifact.
13. Protected paths remain Human-only unless an exact higher authorization exists.
14. Every state transition is versioned, fenced, and append-only in its governing registry.
15. Human Final Authority and current autonomy ceilings remain active.

## 7. Communication

Clones exchange references through existing or approved Company messages:

- Task Envelope for execution scope;
- Checkpoint for resumable state;
- Evidence for artifacts and tests;
- Review for disposition;
- Repair for bounded correction;
- Release for authorized Git integration.

Direct hidden chat-to-chat instruction, shared mutable memory, shared worktrees, or branch comments are not command authority.

## 8. Data And Consistency

Strong consistency is required for:

- identity registration;
- Claim ownership and fencing;
- worktree and write-set reservation;
- Review custody;
- integration authorization;
- Close / Release.

Eventual consistency is acceptable for presence, progress percentages, dashboards and telemetry when freshness is visible. Evidence, Review, Decision and Release histories are append-only.

## 9. Failure And Recovery

| Failure | Required response |
|---|---|
| Clone crash | Fence Session, preserve checkpoint, recover same Claim with a new Session |
| Worktree corruption | Quarantine worktree; reconstruct from base, branch and evidence |
| Write-set collision | Reject later allocation; do not merge concurrent edits |
| Review conflict | Assign another eligible Review Clone or external reviewer |
| Git conflict | Stop integration; produce semantic conflict evidence |
| Stale source | Revalidate base and authority; repair or reissue Task Envelope |
| Registry unavailable | Stop new allocation and state mutation |
| Parent organization Session loss | Resume from organization checkpoint after Human Anchor and source revalidation |

Recovery never changes task scope, role authority, or approval state.

## 10. Scale Boundary

V1 targets S0 internal organization scale only: up to 10 active Codex Clones under one global quota. Larger pools, distributed regions, or 100+ Codex Clones require a new review of identity, quota, state, review independence and failure domains.

## 11. Architecture Boundary

No live Clone, registry, scheduler, Claim, worktree automation, background process, implementation, WorkQueue, merge, push, deployment, or CURRENT modification is created here.
