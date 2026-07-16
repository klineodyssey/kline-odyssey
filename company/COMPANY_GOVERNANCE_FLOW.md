---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define one provider-neutral governance path from Human input to evidence-backed closeout."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md; KGEN-KAIOS/governance/ARCHITECTURE_GOVERNANCE_BOARD.md"
SOURCE_OF_TRUTH: false
---

# Company Governance Flow V1

## 1. Common Boot

All providers use the same governance order:

```text
Company Boot
-> Decision Center
-> Company Inbox
-> Review Queue
-> Company Dispatcher
-> Canonical Claim
-> Implementation
-> Evidence
-> Review
-> Human Decision
```

This flow extends the fourteen-layer Company OS Boot; it does not replace Constitution, Runtime CURRENT, or the existing Boot manifest. Every layer fails closed.

| Layer | Required proof | Failure |
|---|---|---|
| Company Boot | Constitution, actor, CURRENT sources, protected paths, repo health | `FAIL_CLOSED_BOOT` |
| Decision Center | Active in-scope decision and Human Anchor | `FAIL_CLOSED_AUTHORITY` |
| Inbox | Valid, classified, deduplicated message | `FAIL_CLOSED_INBOX` |
| Review Queue | Actionable Review/Repair count and custody | `REVIEW_FIRST` |
| Dispatcher | Eligibility and atomic Claim acquisition | `FAIL_CLOSED_DISPATCH` |
| Implementation | Complete Task Envelope and allowed scope | `FAIL_CLOSED_IMPLEMENTATION` |
| Evidence | Hashes, tests, provenance, protected report | `FAIL_CLOSED_EVIDENCE` |
| Review | Independent reviewer and disposition | `FAIL_CLOSED_REVIEW` |
| Human Decision | Required final approval, override, or closeout | `HUMAN_DECISION_REQUIRED` |

## 2. Human Input Flow

```text
Human Message
-> HUMAN_INBOX record
-> DECISION or other Message Contract
-> authority validation
-> classification
-> IDEA | QUESTION | ARCHITECTURE | REVIEW | IMPLEMENTATION | EMERGENCY
-> appropriate lane
```

Ideas and questions never become implementation by inference. Architecture messages enter AGB governance. Implementation messages require explicit implementation scope and a valid baseline/ADR chain.

## 3. Architecture Flow

```text
Architecture Inbox
-> Source Audit
-> Proposal
-> Independent Review
-> Architecture Resolution
-> ADR
-> Human Architecture Approval
-> Baseline Update
-> Implementation Planning Request
-> Human Implementation Approval
```

The current Decision Center package stops after Proposal and awaits Human Architecture Review.

## 4. Implementation Flow

```text
Active Implementation Decision
-> Approved Baseline And ADR
-> Implementation Inbox
-> Review-First Barrier
-> WorkQueue Candidate
-> Task Envelope
-> Dispatcher Eligibility
-> Atomic Claim
-> Isolated Worker Session
-> Evidence
-> Handoff
```

The Decision Center may authorize the chain but cannot perform the work. WorkQueue remains a task-state projection; it is not a command source.

## 5. Review And Repair Flow

```text
Handoff
-> REVIEW_INBOX
-> authority / Claim / Session / branch validation
-> Evidence Chain validation
-> reviewer conflict-of-interest check
-> APPROVE | APPROVE_WITH_WARNINGS | REPAIR_REQUIRED | REJECT | BLOCKED | HUMAN_REVIEW_REQUIRED
```

`REPAIR_REQUIRED` retains the Task and Claim lineage, narrows scope, increments repair cycle, and obtains a fresh fencing token. A Worker cannot review or close its own work.

## 6. Release Flow

```text
Approved Review
-> Release Message
-> protected / secret / rollback / environment checks
-> authorized integration actor
-> commit / push / documentation release as permitted
-> release evidence
-> close disposition
-> Claim release
-> DONE projection
```

Production-sensitive, financial, identity, Token, CURRENT, Universe Map, and protected actions always retain their Human-only boundary.

## 7. State Ownership

| State | Canonical owner after cutover | Projection or consumer |
|---|---|---|
| Command authority | Decision Center ledger | Boot, Inbox, dashboards |
| Inbox lifecycle | Company Inbox ledger | scheduler and dashboards |
| Priority | Priority Scheduler policy | Dispatcher |
| Task definition | Approved WorkOrder/Task Envelope authority | WorkQueue Markdown |
| Claim lock | Canonical Atomic Claim Authority | WorkQueue, Session, dashboard |
| Worker identity | Worker/Agent/Clone registries | Dispatcher and review |
| Evidence history | Append-only Evidence Registry | Review and audit |
| Review disposition | Review Registry | Decision/WorkQueue/dashboard |
| Release state | Release Registry | Pages/dashboard/changelog |

Decision Center is therefore the single command source without becoming a monolithic data owner.

## 8. Deadlock And Starvation

- Review timeout routes to escalation; it does not auto-approve.
- Repair cycles have a configured limit and then enter `SAFE_HOLD`.
- Missing Human decisions remain visible without blocking unrelated read-only maintenance.
- Invalid handoffs are quickly classified as evidence-only and cannot permanently block Review First.
- Emergency stop and security containment always preempt normal scheduling.
- Queue order and holds are audit events, never hidden state.

## 9. Legacy And Provider Rules

Provider adapters may translate syntax only. If a provider prompt, memory, README, `.cursorrules`, branch-local claim, or historical SOP conflicts with an active Decision Center record or higher authority, it is suppressed and logged. No provider may create a second command stream.

## 10. Cutover And Rollback

Before Human cutover:

1. import existing decisions by immutable reference and hash;
2. map current Inbox, WorkQueue, Claim, Review, and Handoff states;
3. replay history into a sandbox;
4. shadow-read both current and candidate projections;
5. reconcile every divergence;
6. test Human Anchor, emergency stop, rollback, and provider adapters;
7. freeze writes during the exact cutover window;
8. activate one ledger at a Human-specified effective sequence/time;
9. convert legacy command writers to read-only adapters.

Rollback before cutover discards the candidate and leaves current sources untouched. Rollback after cutover freezes new dispatch, restores the last verified snapshot, replays the immutable log, reconciles claims/reviews, and requires Human approval if authority or state could be lost.

## 11. Current Boundary

This document creates no implementation, WorkQueue, Claim, dispatch, commit to main, deployment, or protected-path change.
