---
TITLE: "Monkey Swarm Review Runtime Architecture"
VERSION: "0.3.0"
REVISION: "2026-07-16.3"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "AGB / MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT; next independent review required"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
CHANGE_REASON: "Add hierarchical control, quotas, aggregated heartbeat, security separation and S0/S1 limits."
ANCESTOR: "CURSOR_HANDOFF_AUTO_REVIEW.md; worker-swarm/MASTER_REGISTRY_STANDARD.md; worker-swarm/RECOVERY_RUNTIME.md"
SOURCE_OF_TRUTH: "FALSE"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/MONKEY_SWARM_REVIEW_RUNTIME.md"
---

# Monkey Swarm Review Runtime

## 1. Scope

Monkey Swarm Review Runtime is the company-wide discovery and intake layer for Cursor output. It scans every registered Clone, Session, Claim and handoff, then places each unseen item under Codex review custody. It does not approve work by itself and is not a background service in this architecture phase.

## 2. Registry Inputs

The runtime reads a consistent Master Registry view containing:

- Clone Registry;
- Session Registry;
- Claim Registry;
- Evidence Registry;
- Handoff Registry;
- Review Registry;
- Decision Registry;
- WorkQueue;
- remote handoff references and approved task envelopes.

Remote branches are discovery evidence only. They cannot replace canonical registry state.

## 3. Required Clone Record

Each reviewable worker unit resolves the following immutable lineage:

```text
master_clone_id
clone_id
parent_clone
workspace
checkpoint
heartbeat
worker_id
session_id
claim_id
handoff_id
review_target
task_id
human_decision_id
task_envelope_id
base_sha
head_sha
fencing_token
```

`review_target` must resolve to Codex or a Human-required gate. Cursor Master and Monkey Clones are never valid final review targets.

Every Cursor chat window creates one unique `clone_id`. It may create multiple sequential Sessions only through checkpointed recovery; it may never share an active Session, Claim or workspace with another Clone.

## 4. Scan Triggers

| Trigger | Required action |
|---|---|
| `COMPANY_BOOT` | Full registry and remote-ref scan before new work |
| `SESSION_RESUME` | Scan changes since the last durable checkpoint |
| `HANDOFF_SIGNAL` | Validate and enqueue the signaled handoff |
| `PRE_DISPATCH` | Confirm no blocking review or repair is hidden |
| `LONG_OPERATION_CHECKPOINT` | Rescan at no more than 30-minute intervals |
| `END_SESSION` | Full closing scan and review-custody reconciliation |
| `HEARTBEAT_TIMEOUT` | Fence the stale Session and enqueue Recovery |

Repeated scans are idempotent. The deduplication key is `handoff_id + claim_id + head_sha`.

## 5. Discovery Algorithm

```text
Load last review checkpoint
-> read canonical registries
-> enumerate registered Clones and Sessions
-> enumerate active/review/repair Claims
-> enumerate remote handoff refs
-> normalize identity chain
-> detect unseen or changed heads
-> validate Task Envelope and dispatch lineage
-> classify custody
-> enqueue a ReviewItem
-> checkpoint scan cursor
```

An item discovered on a branch but absent from canonical authority is not ignored. It enters the queue as unauthorized evidence for explicit disposition.

## 6. Review Item Contract

```text
review_item_id
discovered_at
trigger
master_clone_id
clone_id
session_id
worker_id
task_id
claim_id
handoff_id
branch
base_sha
head_sha
task_envelope_ref
evidence_refs
test_refs
protected_path_report
identity_status
authority_status
custody_status
priority
recommended_gate
```

Priority is deterministic: safety and Human stop, unclassified handoff, repair, expiring lease, orphan claim, ordinary review, then informational evidence.

## 7. Intake Classifications

| Classification | Meaning | Next owner |
|---|---|---|
| `READY_FOR_CODEX_REVIEW` | Authority and evidence preflight pass | Codex |
| `REPAIR_EVIDENCE_REQUIRED` | Same authorized task lacks repairable evidence | Same Clone under Codex instruction |
| `REJECT_UNAUTHORIZED` | No valid envelope, dispatch or claim authority | Codex disposition log |
| `REJECT_DUPLICATE` | Equivalent approved content or duplicate handoff | Evidence archive |
| `EVIDENCE_ONLY` | Preserve history without queue or merge effect | Evidence archive |
| `BLOCKED_IDENTITY_CONFLICT` | Identity or head cannot be reconciled | Codex / Human if unresolved |
| `HUMAN_REVIEW_REQUIRED` | Level C or constitutional boundary | Human PrimeForge |

Discovery does not close or release a Claim. Those state changes occur only after Auto Cursor Review and an authorized disposition.

## 8. Hierarchical Dispatcher and Monkey Queue

The only task-delivery route is:

```text
Human PrimeForge
-> Codex General Manager
-> Federation Controller
-> Region Controller
-> Company Controller
-> Department Dispatcher
-> Monkey Squad Leader
-> Clone Registry and Monkey Queue
-> Assigned Clone Session
```

A queue message requires `dispatch_id`, controller lineage, `task_envelope_id`, `clone_id`, `session_id`, `claim_id`, `workspace`, `fencing_token`, `issued_at`, `lease_expiry`, `review_target` and `ack_status`. Cursor cannot dispatch itself or another Clone. Human is never the message transport.

Each controller declares `max_workers`, `max_sessions`, `max_active_claims`, `max_spawn_rate`, `max_compute_budget`, `max_memory`, `max_event_rate`, `max_retry_rate` and `max_recovery_rate`. No `CLONE_SPAWN_BUDGET` means no Clone spawn.

## 9. Heartbeat and Timeout

An active Clone emits an adaptive and jittered heartbeat to its Squad Aggregator. Squad, Department and Region layers publish bounded batches and health summaries rather than forwarding every raw event to a central Registry. Lease expiry and fencing remain authoritative.

`TIMEOUT` or failure suspicion causes the local controller to:

1. stop accepting writes from the old Session;
2. increment the fencing token;
3. preserve the latest checkpoint and evidence;
4. enter `RECOVERY_PENDING`;
5. assign a Recovery Session only after custody validation.

Heartbeat never proves task quality and never releases a Claim.

Raw heartbeat is disposable telemetry. Higher layers retain bounded summaries and anomaly evidence, not every raw heartbeat forever.

## 10. Parallel Clone Rules

Parallel execution is valid only when:

1. each chat window has a distinct Clone identity;
2. each Clone has a distinct active Session and Claim;
3. child work is covered by a Codex-issued parent envelope;
4. paths do not overlap, or an explicit integration owner exists;
5. each task has one Primary Owner;
6. all handoffs target Codex Review;
7. canonical claim authority accepts every allocation atomically.

Multiple ephemeral Sessions using the same `worker_id` and branch-local claims do not satisfy these rules before the new identity architecture is implemented.

V1 architecture targets S0 and S1 only. S2 is future federation work; S3 and 100 million Workers are not supported.

Related Clones cannot review each other. Reviewer rotation, Owner relationship, contribution caps, conflict-of-interest detection and anomaly signals are required before S1 enablement.

## 11. Legacy Suppression

At intake, the runtime validates Boot, SOP, Queue, Claim and Handoff schema revisions. Older or conflicting sources return `STALE_PROTOCOL_BLOCKED`, identify the effective CURRENT source and require a new preflight. Historical work remains evidence but gains no authority.

## 12. Current Incident Classification

The initial 2026-07-16 scan found these unapproved branches:

| Task | Tip | Session | Result |
|---|---|---|---|
| `ORG-P2-005` | `c66cfc05` | `SESSION-20260716-01-EPHEMERAL` | `REJECT_UNAUTHORIZED`, head mismatch, `EVIDENCE_ONLY` |
| `ORG-P2-006` | `5cae8265` | `SESSION-20260716-03-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-007` | `ab2a0371` | `SESSION-20260716-04-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-008` | `ca5a1bdb` | `SESSION-20260716-08-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-014` | `bfde85e3` | `SESSION-20260716-05-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-018` | `7d28ebc1` | `SESSION-20260716-06-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-019` | `90ac61c0` | `SESSION-20260716-07-EPHEMERAL` | `REJECT_UNAUTHORIZED`, `EVIDENCE_ONLY` |
| `ORG-P2-020` | `cec35404` | `SESSION-20260716-02-EPHEMERAL` | `REJECT_UNAUTHORIZED`, head mismatch, `EVIDENCE_ONLY` |

The closing fetch found 13 more submissions: `KAIOS-WV-SBX-001` and `ORG-P2-009`, `010`, `011`, `012`, `013`, `015`, `016`, `017`, `022`, `023`, `024` and `025`. None has a canonical atomic Claim; only World Viewer has a candidate Envelope, and it was not dispatched. They are retained as `REJECT_NO_CANONICAL_CLAIM / EVIDENCE_ONLY` and recorded in the existing WorkQueue disposition table and Review Log.

All remote branches remain untouched as evidence. No underlying WorkOrder is closed by either intake batch.

## 13. Failure and Recovery

If a scan stops midway, the next Boot or Resume replays from the last durable scan cursor. An item is never marked reviewed merely because it was discovered. If registry state changes during a scan, the snapshot is rejected and retried from a consistent revision.

When no durable queue exists, closing must return `SESSION_CLOSE_BLOCKED_CHECKPOINT_REQUIRED`; it cannot rely on chat memory.

## 14. Architecture Boundary

No poller, scheduler, database, registry mutation, branch deletion, WorkQueue transition, commit, push or deployment is created here.

```text
Architecture: ARCHITECTURE_REVISION_P0
Monkey Swarm: ACTIVE_ARCHITECTURE_NOT_ENABLED
S0/S1: ARCHITECTURE_TARGET
S2: FUTURE
S3: NOT_SUPPORTED
Implementation: NOT_STARTED
Review automation service: NOT_IMPLEMENTED
```
