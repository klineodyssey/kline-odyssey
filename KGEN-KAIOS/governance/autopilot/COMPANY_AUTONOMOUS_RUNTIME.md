---
TITLE: "PrimeForge Company Fully Autonomous Runtime V1 Architecture"
VERSION: "0.3.0"
REVISION: "2026-07-16.3"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "AGB / MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT; next independent review required"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
CHANGE_REASON: "Apply P0 hierarchy, state integrity, security, memory, recovery, Human Anchor, autonomy and product review resolution."
ANCESTOR: "COMPANY_OS_BOOT.md; COMPANY_SESSION.md; PRIMEFORGE_COMPANY_AUTOPILOT.md; worker-swarm/WORKER_SWARM_RUNTIME.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "CivilizationLifeform"
PHYLUM: "GovernanceArchitecture"
CLASS: "CompanyOperatingRuntime"
ORDER: "AutonomousOperations"
FAMILY: "PrimeForgeCompany"
GENUS: "GovernedAutonomy"
SPECIES: "CompanyFullyAutonomousRuntimeV1Proposal"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/COMPANY_AUTONOMOUS_RUNTIME.md"
---

# Company Fully Autonomous Runtime V1

## 1. Purpose

Company Fully Autonomous Runtime V1 is an integration proposal for governed day-to-day company operation. It extends the approved Company OS Boot and existing Worker Swarm proposal; it does not create another company, another Company Kernel, or an independent source of authority.

AGB decision `AGB-COMPANY-AUTONOMOUS-RUNTIME-001` places this proposal in `ARCHITECTURE_REVISION_P0`. Fully Autonomous Runtime, Baseline Freeze and Auto Dispatch are disabled. V1 targets S0/S1 architecture only and does not claim operational support for any scale.

The permanent startup preflight is:

```text
Company Boot
-> Company Session Resume
-> Company Health Check
-> Repository Health
-> Company Inbox
-> Cursor Review
-> Pending Review
-> Architecture Queue
-> Human Decision Queue
-> Review Queue
-> Process current Human message
```

No Human message is acted on before this preflight completes. Any failed layer fails closed. After preflight, the operational priority is:

```text
Company Boot
-> Review Inbox
-> Review Cursor
-> Repair
-> Architecture
-> Implementation Planning
-> Human Inbox
-> Company Maintenance
-> End of Day Review
-> Session Checkpoint
```

Automation is bounded by the Constitution, current Human Decisions, delegated risk levels, protected paths, task envelopes, review custody and Human Final Authority.

## 2. Source Precedence

This proposal is interpreted in the following order:

1. current Human Decision;
2. current Constitution;
3. Company OS Boot and Company Session;
4. current registries and canonical claim authority;
5. approved baselines and ADRs;
6. this integration proposal;
7. older Candidate or Historical worker rules.

If two sources conflict, execution stops with `BLOCKED_SOURCE_CONFLICT`. This proposal does not edit or silently supersede a frozen baseline.

## 3. Formal Roles

| Actor | Formal role | Allowed authority | Prohibited authority |
|---|---|---|---|
| PrimeForge | Human Final Authority | Final architecture, implementation and override decisions | None within constitutional Human authority |
| Codex | KAIOS Company General Manager / CEO / Chief Implementation Officer | Daily operation, dispatch, review, quality, versions, GitHub, Cursor management, evidence, architecture review and Human Decision execution within delegated authority | Cannot replace Human Final Authority or cross Level C boundaries |
| Cursor Master | Chief Worker | Receive a Codex task, create authorized Clone work units, allocate bounded subwork, collect evidence, report to Codex | No architecture approval, Codex review, merge, push, release or scope expansion |
| Cursor Clone | Monkey Clone Worker | Boot, claim, implement, test, produce evidence and handoff | No review, merge, push, release, deploy, protected-path write or self-dispatch |
| ChatGPT | Chief System Architect | Architecture proposal, analysis and advisory review | No repository write, merge, push or implementation-start authority |

External reviewers remain independent and do not gain merge authority.

## 4. Cursor Master Contract

Cursor Master is a logical chief-worker role controlled by Codex. It need not be a continuously running chat window and cannot create company work by itself.

Cursor Master may create Clone work units only when all of the following are present:

- a Codex-issued parent Task Envelope;
- an explicit clone budget;
- non-overlapping authorized paths or declared coordination boundaries;
- child task identifiers and expected evidence;
- unique Clone, Session and Claim identities;
- Codex as `review_owner` and `review_target`;
- a stop condition and lease.

Cursor Master may aggregate status, but raw child evidence and handoffs remain visible to Codex. A summary cannot replace the child records.

## 5. Monkey Clone Identity

Every Cursor chat window is one Monkey Clone and receives one immutable `clone_id`. A provider tab, label or branch name is not sufficient identity.

Required lineage fields are:

```text
master_clone_id
clone_id
session_id
claim_id
worker_id
handoff_id
review_target
parent_clone
workspace
checkpoint
heartbeat
```

The identity model is:

```text
Cursor Master
-> Monkey Clone
-> Session
-> Claim
-> Evidence
-> Handoff
-> Codex Review
```

One Clone has at most one unfenced active Session. One Session has at most one `ACTIVE`, `REVIEW` or `REPAIR` Claim. Recovery opens a new Session only after the old Session is fenced. A Clone identity is never silently reused for another window.

This rule amends the earlier Worker Swarm Candidate assumption that a new window is normally a new Session for an existing Clone. Until the amendment is approved and implemented, the stricter legacy registry rule remains operational and concurrent branch-local claims are not canonical authorization.

## 6. Hierarchical Monkey Communication Runtime

Human is never used as a manual dispatcher. The only valid communication path is:

```text
Human PrimeForge
-> Codex General Manager
-> Federation Controller
-> Region Controller
-> Company Controller
-> Department Dispatcher
-> Monkey Squad Leader
-> Clone Registry and Monkey Queue
-> Assigned Monkey Clone Session
-> Checkpoint and Handoff
-> Codex Review
-> Atomic Close and Release
```

Each layer manages bounded direct children under quota. S0 may collapse unused controller layers into one process while preserving the logical authority boundaries. If no machine channel is available, the assignment remains `PENDING_DISPATCH_CHANNEL`; Codex reports the system limitation but does not ask Human to relay the instruction.

## 7. Company Runtime Modules

| Module | Responsibility | Existing source or extension |
|---|---|---|
| Company OS Boot | Fail-closed startup and source loading | Existing `COMPANY_OS_BOOT.md` |
| Company Session | Checkpointed invocation lifecycle | Existing `COMPANY_SESSION.md` |
| Company Dispatcher | Sole task and claim coordinator | Existing Worker Swarm proposal |
| Monkey Swarm Review Runtime | Discover and classify all Clone output | This proposal package |
| Auto Cursor Review Runtime | Validate one handoff and decide disposition | This proposal package |
| Review Recovery Runtime | Restore review custody after interruption | Defined here and in closing/review documents |
| Company Closing Runtime | End-of-day scan and durable checkpoint gate | This proposal package |
| Company Memory | Durable provenance for decisions, reviews, rejections, lessons, debt and roadmap | Amendment contract in this proposal |
| Monkey Queue | Delivery custody between Dispatcher and one Clone Session | Amendment contract in this proposal |
| Heartbeat Runtime | Five-minute liveness and checkpoint expectation | Amendment contract in this proposal |
| Hierarchical Swarm | Bounded controllers, quotas and Spawn Budgets | `HIERARCHICAL_MONKEY_SWARM_STANDARD.md` |
| Distributed State | Per-domain consistency, partitions and event contracts | `DISTRIBUTED_STATE_CONSISTENCY_STANDARD.md` |
| Canonical Claim Authority | Atomic Claim, lease, fencing and evidence custody | `CANONICAL_CLAIM_AUTHORITY_STANDARD.md` |
| Swarm Security | Sandbox, attestation, collusion and key lifecycle | `SWARM_SECURITY_STANDARD.md` |
| Memory Retention | Hot/warm/cold/immutable/disposable memory lifecycle | `COMPANY_MEMORY_RETENTION_STANDARD.md` |
| Human Anchor and Autonomy | Verifiable Human authority and fixed autonomy levels | `HUMAN_ANCHOR_STANDARD.md`; `AUTONOMY_LEVEL_STANDARD.md` |
| Recovery and Drift | Failure recovery and architecture comparison | `DISASTER_RECOVERY_STANDARD.md`; `ARCHITECTURE_DRIFT_STANDARD.md` |

The new modules are launched by Company Kernel. They cannot self-start from a Cursor prompt or chat memory.

## 8. Clone State Model

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
ANY_ACTIVE -> RECOVERY_PENDING -> RECOVERING
ANY -> SUSPENDED
OFFLINE -> ARCHIVED
```

Only Dispatcher and Codex review actions may change `WAITING_REVIEW`, `REPAIR`, `CLOSED` or `RELEASED` custody. Cursor Master and Clone cannot approve or release themselves.

## 9. Automatic Review Triggers

Company Kernel invokes Monkey Swarm Review at:

1. every Company Boot;
2. every Company Session resume;
3. before a new dispatch;
4. after a known handoff event;
5. at the end of any long-running Codex operation;
6. before Session close.

A long-running operation must checkpoint and rescan at least every 30 minutes. The architecture defines the requirement; it does not claim a background timer currently exists.

## 10. Review-First Queue Priority

The General Manager processes work in this order:

1. Human `STOP` or Level C safety event;
2. unclassified handoff and review custody;
3. repair on an existing task;
4. expiring lease and orphan claim;
5. approved close and release;
6. architecture review;
7. authorized implementation planning;
8. new Human Inbox item;
9. routine company maintenance.

New Human ideas are retained in Inbox while an occupied Claim is reviewed. They do not create a second Claim.

Before dispatch, `Review Queue`, `Repair Queue`, expired Claims, Recovery and pending Decisions must be classified. No approved task can bypass these queues.

## 11. Review and Release Invariants

1. A handoff is deduplicated by `handoff_id`, `claim_id` and source head SHA.
2. A branch-local claim is evidence, not canonical claim authority.
3. A valid Task Envelope must predate execution and resolve from a trusted source.
4. Evidence submission transfers custody to Codex Review; it does not release the lease.
5. Repair stays on the same task and claim lineage unless a recorded superseding decision exists.
6. Close, release, queue update, review log and decision evidence must agree.
7. A Clone cannot review another Clone.
8. Missing authority, identity, provenance or protected-path evidence fails closed.
9. Human Main is never used as a Cursor execution or integration workspace.
10. Human Final Authority and Human override remain available.

## 12. Review Recovery

Review Recovery Runtime restores review custody, not execution authority:

```text
Detect interrupted review
-> load last durable checkpoint
-> validate claim and handoff identity
-> fence stale reviewer Session
-> open Recovery Session
-> replay append-only evidence references
-> resume at the first incomplete review gate
-> write superseding review event
```

It must not re-run implementation, mutate submitted evidence or accept stale writes. If no durable checkpoint exists, the result is `BLOCKED_REVIEW_RECOVERY_EVIDENCE_MISSING`.

## 13. Permanent Inbox Router

Every Human message receives one primary classification and zero or more secondary classifications from this fixed set:

| Code | Classification | Default route |
|---|---|---|
| A | `ARCHITECTURE` | Architecture Queue |
| B | `REVIEW` | Review Queue |
| C | `REPAIR` | Repair Queue |
| D | `BUG` | Triage Queue |
| E | `PROPOSAL` | Proposal Inbox |
| F | `DECISION` | Human Decision Queue |
| G | `QUESTION` | Manager response |
| H | `IDEA` | Idea Inbox |
| I | `EMERGENCY` | P0 stop and safety route |
| J | `KERNEL` | Kernel Architecture Queue |
| K | `LIFE` | Life Architecture Queue |
| L | `ECONOMY` | Economy Architecture Queue |
| M | `LAND` | Land Architecture Queue |
| N | `UNIVERSE` | Universe Architecture Queue |
| O | `COMPANY` | Company Governance Queue |

`HUMAN-COMPANY-AUTONOMOUS-002` is classified primary `F: DECISION`, secondary `A: ARCHITECTURE` and `O: COMPANY`. Classification never creates implementation authority.

## 14. Auto Dispatch Policy

Auto Dispatch is currently `DISABLED_UNTIL_CANONICAL_ATOMIC_CLAIM_AUTHORITY`. A future Level 2 dispatch may occur only when all conditions pass:

1. Review, Repair, Recovery, expired Claim and pending Decision queues have no blocking item;
2. the WorkQueue task is explicitly `APPROVED` for implementation;
3. the task is not `ARCHITECTURE_ONLY`;
4. one complete Task Envelope exists;
5. one eligible Clone has no active Claim;
6. canonical claim authority allocates a unique Claim and fencing token;
7. workspace and paths are isolated and protected checks pass;
8. reviewer and rollback evidence are assigned.

An `OPEN` WorkQueue entry is not equivalent to `APPROVED`. Architecture-only work may be analyzed and reviewed, but never auto-coded. Documentation of this policy does not enable it.

## 15. Heartbeat Runtime

Every active Clone emits an adaptive, jittered heartbeat to its Squad Aggregator rather than writing directly to a central Registry. A nominal active interval may be 300 seconds, bounded by task and failure policy, and contains:

```text
clone_id
session_id
claim_id
worker_id
workspace
checkpoint_id
current_task
progress_state
fencing_token
observed_at
```

Squad, Department and Region aggregators send batches and health summaries upward. Heartbeat proves liveness, not quality or completion. Failure suspicion, backoff, jitter, lease expiry and fencing prevent a heartbeat storm and duplicate execution.

## 16. Company Memory

Company Memory is durable, provenance-first operating memory partitioned into immutable decisions, approved baselines, active state, working memory, historical archive, lessons, private data, Heaven Secret and Divine Vault references. It stores:

- Human Decisions and delegated authority;
- review findings and evidence references;
- architecture proposals, resolutions and baseline state;
- rejected work and reasons;
- lessons learned;
- technical debt;
- roadmap commitments and dependencies.

Each memory item requires `memory_id`, `memory_type`, `source`, `source_sha`, `decision_id`, `created_at`, `supersedes`, `status`, `visibility`, `evidence_refs`, `retention_rule` and `next_action`. Memory is append-only with supersession; chat history is never its sole source. Secrets, private Human workspace content, credentials, KYC and exact GPS are forbidden.

Company Memory uses schema versions, migrations, snapshots, retention, compaction, pruning, replay, rollback and type-specific conflict resolution. It cannot be one unbounded JSON. A snapshot that says `PENDING_PUSH` while its commit is already in `origin/main` is marked `STALE_METADATA`, not treated as a real pending push.

## 17. Runtime Separation

| Runtime | Owns | Must not own |
|---|---|---|
| Life OS | Life maintenance and lifecycle | Company queues, claims or GitHub |
| Company OS | Company governance and operations | Biological life state |
| Monkey Runtime | Worker identity, Session, Claim, heartbeat and handoff | Human authority or Life OS |

Cross-runtime communication uses explicit adapters and evidence, never shared mutable authority.

## 18. Wukong Law

The Wukong Law formalizes independent worker identity under bounded authority: every monkey hair is one independent Worker, while all worker action remains inside the Human and Codex governance boundary.

```text
Human Final Authority
-> Codex General Manager
-> Bounded Federation / Region / Company Controllers
-> Department Dispatcher
-> Monkey Squad Leader
-> Monkey Clone
-> Task
-> Evidence
-> Codex Review
-> Human gate when required
```

No lower layer may reverse, bypass or impersonate an upper authority.

## 19. Repository and Version Drift

At Boot and Close, Codex performs fetch, compare, repository health, version gap, architecture gap and proposal gap checks. Architecture gaps produce proposals. Runtime CURRENT, Universe Map CURRENT, protected paths and Level C changes stop for Human authority. Routine drift detection does not ask Human whether Codex should fetch or compare.

## 20. Legacy Suppression

Before Cursor work, Company Boot validates `boot_version`, `sop_version`, `queue_revision`, `claim_schema_version`, `handoff_schema_version` and baseline references. A stale Cursor Boot, SOP, Queue, Claim or Handoff is intercepted as `STALE_PROTOCOL_BLOCKED`.

The Clone must reload CURRENT sources and repeat preflight. Legacy rules are recorded as suppressed and cannot grant retroactive authority to work already performed.

## 21. Daily Autonomous Cycle

```text
Company Boot
-> Git Health
-> Pages Health
-> Review Queue
-> Cursor Queue
-> Repair
-> Architecture Queue
-> Human Inbox
-> Authorized Dispatch
-> Checkpoint
-> Daily Review
-> Company Close
```

This is mandatory without Human reminder. Architecture defines the cycle; it does not claim a persistent scheduler is implemented.

## 22. Current Handoff Incident Evidence

The initial 2026-07-16 Company Boot discovered eight remote Cursor handoff branches for `ORG-P2-005`, `006`, `007`, `008`, `014`, `018`, `019` and `020`. All use `cursor-01`, each carries a distinct ephemeral Session, and all were created without a Codex Task Envelope or canonical dispatch after the previous closeout.

Architecture-session disposition:

- all eight: `REJECT_UNAUTHORIZED / EVIDENCE_ONLY`;
- `ORG-P2-005` and `ORG-P2-020`: additional declared-head identity mismatch;
- no branch is merged, deleted, released or treated as an approved WorkQueue transition;
- original WorkOrders remain `OPEN` until a future authorized disposition is durably recorded.

A closing fetch discovered 13 additional tips: `KAIOS-WV-SBX-001` and `ORG-P2-009`, `010`, `011`, `012`, `013`, `015`, `016`, `017`, `022`, `023`, `024` and `025`. Only World Viewer carries a candidate Task Envelope, none has a canonical Claim, one has no Handoff, and eight Handoff records declare a head different from the preserved branch tip. They are `REJECT_NO_CANONICAL_CLAIM / EVIDENCE_ONLY`; existing WorkOrders remain OPEN or candidate.

These incidents demonstrate why unique Clone identities, parent envelopes, atomic claims, review custody and automatic Boot/Resume/Close scans are mandatory. The current publication records the intake decision in the existing WorkQueue, Review Log and Decision Log, but does not merge, delete or release any remote branch.

## 23. P0 Enablement Blockers

The twenty P0 risks in `COMPANY_AUTONOMOUS_RUNTIME_REVIEW_RESOLUTION.md` remain open. Architecture mitigations are not operational resolutions. Enablement requires independent review, testable exit criteria, Canonical Claim Authority conformance, S0 security and recovery scenarios, and a new Human decision.

The maximum autonomy level is `LEVEL_2`, but Level 2 dispatch remains disabled. Level 3 and Level 4 require a separate Human approval. Level 5 is Human only.

## 24. Compliance Gates

The architecture must later prove at least:

- Boot, Resume and End Session each discover an unseen handoff;
- a long-running task performs a final rescan;
- missing Task Envelope returns `REJECT_UNAUTHORIZED`;
- one Clone requesting a second Claim is blocked;
- authorized distinct Clones may execute non-overlapping child tasks;
- Clone review, merge, push and release attempts are denied;
- an orphan Claim and expiring lease enter the correct queue;
- a head mismatch cannot be approved;
- a stale Session fails its fencing-token check;
- Session close fails when the final checkpoint cannot be persisted.
- a stale Boot, SOP, Queue, Claim or Handoff is blocked before coding;
- an architecture-only task never enters auto dispatch;
- heartbeat timeout fences the old Session before Recovery;
- Human is never used as a dispatch transport.

## 25. Architecture Boundary

This package defines contracts only. It does not implement a dispatcher, background poller, registry service, atomic lock, Session daemon, Cursor integration, implementation WorkOrder, deployment or Pages update. General Manager review metadata may classify remote evidence without enabling any proposed runtime.

```text
Architecture: ARCHITECTURE_REVISION_P0
Company Fully Autonomous Runtime V1: MAJOR_REVISION_IN_PROGRESS
Fully Autonomous: DISABLED
Baseline Freeze: DENIED
Monkey Swarm: ACTIVE_ARCHITECTURE
Codex: KAIOS_COMPANY_GENERAL_MANAGER
Cursor: MONKEY_CLONE_WORKER
Human: FINAL_AUTHORITY
Maximum Autonomous Level: LEVEL_2_ARCHITECTURE_LIMIT
Auto Dispatch: DISABLED_UNTIL_CANONICAL_ATOMIC_CLAIM_AUTHORITY
S0/S1: ARCHITECTURE_TARGET
S2: FUTURE
S3: NOT_SUPPORTED
Implementation: NOT_STARTED
WorkQueue: NOT_CREATED
Deployment: NOT_STARTED
Runtime CURRENT modified: false
Universe Map modified: false
```

The next gate is Independent Architecture Review followed by Human Architecture Review. Approval of this proposal does not itself authorize implementation.
