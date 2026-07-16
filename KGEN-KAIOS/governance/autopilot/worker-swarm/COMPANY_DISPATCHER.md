---
TITLE: "KAIOS Company Dispatcher Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define the single coordination authority for Inbox, dispatch, lease, review, repair, retry, close and release."
ANCESTOR: "KGEN-KAIOS/TASK_DISPATCHER.md; KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md; candidate KGEN-KAIOS/governance/autopilot/PRIORITY_SCHEDULER.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "CivilizationLifeform"
PHYLUM: "GovernanceArchitecture"
CLASS: "CompanyCoordination"
ORDER: "Dispatcher"
FAMILY: "KAIOS"
GENUS: "CompanyDispatcher"
SPECIES: "KAIOSCompanyDispatcherArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/COMPANY_DISPATCHER.md"
---

# Company Dispatcher

## 1. Role

Company Dispatcher is the sole coordination function that may propose allocation, acquire Claim custody, route Review, issue bounded Repair, retry recoverable operations, and prepare Close / Release. It is invoked by Company Kernel and operated under Codex General Manager authority.

It is not Human Final Authority, Architecture authority, WorkQueue authority by itself, content reviewer, merge authority by itself, or a worker execution engine.

Cursor and other Worker Clones never self-dispatch.

## 2. Managed Lanes

| Lane | Purpose | May consume Worker Claim slot |
|---|---|---:|
| Human Inbox | Preserve and classify new Human input | No |
| Review Queue | Review submitted Handoffs before new dispatch | No |
| Repair Queue | Return bounded repair to the same Claim lineage | Existing slot retained |
| Recovery Queue | Restore interrupted authorized work | Existing slot retained |
| Dispatch Candidates | Eligible WorkOrders awaiting allocation | Yes, after acquisition |
| Close / Release | Reconcile records after disposition | No new slot |
| Health / Retry | Repository and provider health checks | No |

Normal priority remains `REVIEW -> REPAIR -> HUMAN_DECISION -> ARCHITECTURE -> IMPLEMENTATION`. Safety incidents preempt all normal lanes.

## 3. Dispatch Preconditions

Before allocating a Claim, Dispatcher verifies:

1. Company Boot and current Session passed required layers.
2. Human input is classified and implementation is explicitly authorized when applicable.
3. Task exists, is eligible and has a complete Task Envelope.
4. Worker, Agent and Clone identities resolve and are active.
5. Worker permission and trust support the risk level.
6. Clone has one valid active Session and no active Claim.
7. Task has no other active Claim.
8. workspace, branch namespace and base SHA are valid.
9. protected paths and stop conditions are loaded.
10. Review Owner exists.
11. dependencies are complete.
12. Master Registry version is current.

Any unknown result blocks allocation.

## 4. Atomic Claim Allocation

Allocation is one logical transaction:

```text
validate registry versions
-> reserve task
-> create claim_id
-> bind clone_id and session_id
-> increment fencing_token
-> set Task / Claim / Session / Clone pointers
-> append decision and registry events
-> return Claim envelope
```

Partial success is invalid. If all pointers cannot commit, the transaction aborts and no Worker may start.

## 5. Dispatch Result

Every decision returns:

```text
dispatch_id
session_id
clone_id
worker_id
task_id
claim_id
decision
reason
registry_version
fencing_token
review_owner_id
allowed_action
blocked_reason
evidence_refs
created_at
```

Allowed decisions:

- `ALLOCATE`
- `REVIEW_FIRST`
- `REPAIR_SAME_CLAIM`
- `RECOVER_SAME_CLAIM`
- `HOLD_IN_INBOX`
- `REJECT_DUPLICATE_CLAIM`
- `BLOCK_IDENTITY`
- `BLOCK_SOURCE_CONFLICT`
- `BLOCK_PROTECTED_PATH`
- `HUMAN_REVIEW_REQUIRED`

## 6. Review Routing

Handoff submission changes custody from execution to Review. Dispatcher validates that Handoff, Evidence, Claim, Session, Clone, task and branch all agree, then routes to `review_owner_id`.

Review results are:

- `APPROVE`
- `APPROVE_WITH_WARNINGS`
- `REPAIR_REQUIRED`
- `REJECT`
- `BLOCKED`
- `HUMAN_REVIEW_REQUIRED`

Dispatcher records and applies a Review result; it does not invent the result or let the Worker review itself.

## 7. Repair

Repair preserves `task_id`, `claim_id`, Primary Worker, Review Owner and evidence lineage. It creates a new repair cycle, bounded authorized scope and fresh lease/fencing token. Unrelated changes require a new future task and cannot enter the Repair branch.

## 8. Close and Release

Close and Release are separate:

- `CLOSED` means the task disposition and all required records agree.
- `RELEASED` means exclusive Claim custody has been removed and a new Claim may be considered.

Release requires visible reconciliation across WorkQueue, Claim, Clone, Session, Evidence, Review and Decision registries. Expiry alone does not release a Claim that entered Review custody.

## 9. Prohibited Dispatcher Actions

Dispatcher cannot approve Architecture, bypass Human decisions, create unregistered Workers, grant trust, alter protected paths, merge unreviewed work, push main without standing authority, deploy, spend funds, run KYC/GPS, or infer completion from heartbeat.

## 10. Architecture Boundary

No live Dispatcher service, queue, allocator, transaction store or automatic closeout is implemented in this proposal.

