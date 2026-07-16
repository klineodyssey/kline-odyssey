---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define the only future legal dispatch path while keeping automatic dispatch disabled."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/worker-swarm/COMPANY_DISPATCHER.md; KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md"
SOURCE_OF_TRUTH: false
---

# Company Dispatcher V1

## 1. Role

After a Human-approved cutover, Company Dispatcher is the only component allowed to translate an eligible Inbox message into a bounded dispatch request. It does not originate commands and is not the Claim lock itself.

```text
Active Decision
-> Validated Inbox Message
-> Priority Scheduler
-> Review-First Barrier
-> Dispatcher Eligibility
-> Canonical Atomic Claim Authority
-> Task Envelope
-> Worker Adapter
```

Cursor, Codex, ChatGPT, Gemini, Grok, Claude, OpenHands, Copilot, future providers, prompts, branches, and WorkQueue rows cannot self-dispatch.

## 2. Dispatcher Authority Boundary

Dispatcher may:

- select one eligible message after priority and review gates;
- request atomic Claim acquisition;
- bind the returned Claim to one Task Envelope, Session, Clone, Worker, reviewer, branch, and worktree;
- route a Handoff to Review custody;
- route bounded Repair to the same Claim lineage;
- request Close and Release after an accepted Review;
- emit a deterministic dispatch decision and audit event.

Dispatcher may not:

- create or alter Human authority;
- make Architecture approval decisions;
- implement work;
- act as the canonical Claim database;
- let a Worker review itself;
- merge, push, deploy, spend, or modify protected state by implication;
- turn an Inbox item or WorkQueue row into permission without an active Decision Center record.

## 3. Review-First Rule

Before allocation, Dispatcher queries the validated Review Queue:

```text
if actionable_review_count > 0:
    decision = REVIEW_FIRST
    implementation_dispatch = DENIED
```

The barrier excludes malformed or unauthorized submissions already classified as `EVIDENCE_ONLY` or `ARCHIVE`. This prevents invalid branch spam from becoming a denial-of-service mechanism. Review routing, Repair, emergency containment, and Human decision intake remain available.

## 4. Dispatch Preconditions

All conditions must be true:

1. Company Boot passed and the Session is current.
2. Decision Center decision is `ACTIVE`, unexpired, unrevoked, and in scope.
3. Inbox message schema and authority passed.
4. Review Queue has no actionable Review or Repair ahead of this item.
5. Task and Task Envelope identify one objective.
6. Implementation is explicitly authorized when the action is implementation.
7. Worker, provider, Clone, Session, reviewer, branch, worktree, and permissions resolve.
8. Canonical Claim Authority is available and returns a fresh fencing token.
9. No active Claim exists for the Task, Session, or Clone.
10. Authorized paths do not intersect protected or forbidden paths.
11. Dependencies, base SHA, tests, evidence, expiry, and rollback are valid.
12. Human Main remains untouched.

Unknown or conflicting state fails closed.

## 5. Atomic Claim Boundary

Dispatcher sends a compare-and-swap request to the canonical Claim authority. A successful result must include:

```text
claim_id
task_id
worker_id
clone_id
session_id
review_owner_id
record_version
fencing_token
lease_expiry
claim_status
```

Branch-local JSON, a Worker-generated claim ID, or a WorkQueue edit does not acquire a Claim. Until the canonical authority is implemented and cut over, automatic dispatch remains disabled. Explicit manual Codex assignment must still use a complete Task Envelope and must be labelled `MANUAL_DISPATCH_NON_ATOMIC`.

## 6. Dispatch Decisions

| Decision | Meaning |
|---|---|
| `ALLOCATE` | All gates passed and canonical Claim acquired |
| `REVIEW_FIRST` | Actionable Review or Repair has priority |
| `REPAIR_SAME_CLAIM` | Bounded correction retains task lineage and custody |
| `RECOVER_SAME_CLAIM` | Fenced recovery Session continues the same task |
| `HOLD_IN_INBOX` | Valid input is not yet dispatchable |
| `REJECT_DUPLICATE` | Existing message, Task, or Claim already covers it |
| `REJECT_UNAUTHORIZED` | Missing or insufficient Decision authority |
| `BLOCK_CLAIM_AUTHORITY` | Atomic Claim service unavailable or conflicting |
| `BLOCK_SOURCE_CONFLICT` | Higher sources disagree |
| `BLOCK_PROTECTED_PATH` | Scope intersects a protected boundary |
| `HUMAN_REVIEW_REQUIRED` | Risk or authority exceeds delegation |

## 7. Handoff, Review, Repair, Close

```text
Worker Handoff
-> Evidence Integrity Check
-> Claim / Session / Branch Consistency
-> Review Custody
-> APPROVE | APPROVE_WITH_WARNINGS | REPAIR_REQUIRED | REJECT | BLOCKED | HUMAN_REVIEW_REQUIRED
-> Close Disposition
-> Release Exclusive Claim
```

Repair keeps the same Task and Claim lineage, increments a repair cycle, obtains a fresh fencing token, and narrows scope. Close and Release are separate states; expiry alone does not release Review custody.

## 8. Provider Compatibility

Provider adapters translate the standard Task Envelope and Message Contract into provider-specific invocation formats. Adapters may reduce capability but may not broaden scope, reorder Boot, change authority, or omit evidence. Unsupported capability returns `HOLD_NO_COMPATIBLE_WORKER`.

## 9. Current Boundary

`dispatcher_runtime.json` is disabled zero state. No WorkQueue, Claim, Task Envelope, dispatch, implementation, deployment, or provider invocation is created by this proposal.
