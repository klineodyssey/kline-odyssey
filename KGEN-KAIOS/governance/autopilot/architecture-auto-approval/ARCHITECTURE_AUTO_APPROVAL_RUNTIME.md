---
TITLE: "Architecture Auto Approval Runtime"
VERSION: "0.1.0"
STATUS: "PROPOSED_NOT_ENABLED"
HUMAN_DECISION_ID: "HUMAN-ARCHITECTURE-AUTO-APPROVAL-001"
AUTONOMY_LEVEL_REQUIRED: "LEVEL_2_ARCHITECTURE_GOVERNANCE"
IMPLEMENTATION: "NOT_STARTED"
---

# Architecture Auto Approval Runtime

## Purpose

The runtime converts a standing Human delegation into a deterministic,
fail-closed approval gate for low-risk Architecture records. It reduces repeated
per-document approval while preserving Human Final Authority and AGB evidence.

It is not a second governance system. It is an execution policy beneath the
Constitution, AGB, Decision Center, and Human Anchor.

## Authority Chain

```text
Human Final Authority
-> standing delegation with scope and revocation
-> AGB process and role separation
-> Architecture Auto Approval Gate
-> non-CURRENT Architecture Baseline candidate
-> append-only decision evidence
-> Decision Center projection
-> Dispatcher notification only
```

`ARCHITECTURE_BASELINE_AVAILABLE` is informational. It never authorizes a Task,
Claim, implementation, deployment, release, or change to a CURRENT selector.

## Bootstrap Rule

The runtime cannot approve any of these items:

1. Its own proposal, amendments, activation, or authority expansion.
2. The Human delegation that authorizes it.
3. Constitution, AGB, Human Anchor, autonomy level, Decision Center authority,
   or canonical claim authority changes.

Human must explicitly activate the reviewed runtime once. The activation record
must include scope, version, effective time, expiry or permanence, revocation,
and emergency stop. Until then, state is `DISABLED_PENDING_BOOTSTRAP_APPROVAL`.

## Approval Lifecycle

```text
DRAFT
-> SOURCE_AUDITED
-> INDEPENDENT_REVIEWED
-> AMENDMENTS_RESOLVED
-> VALIDATED
-> RISK_CLASSIFIED
-> AUTO_GATE_EVALUATED
-> APPROVED_BY_STANDING_DELEGATION | HUMAN_REVIEW_REQUIRED | REJECTED
-> BASELINE_RECORDED
-> DECISION_APPENDED
-> DECISION_CENTER_PROJECTED
-> DISPATCHER_NOTIFIED
```

Every transition is idempotent and tied to an artifact manifest. A changed
manifest invalidates the prior gate result and returns the item to review.

## Baseline Boundary

Auto Approval may create an immutable, non-deployed Architecture Baseline record
on a dedicated architecture ref or registry. It may not rewrite an existing
frozen baseline and may not update `main` when that update would trigger Pages or
a release prohibited by the decision.

Recommended logical target:

```text
refs/heads/architecture-baseline/<proposal-id>
```

Publication to `main`, Pages, a release branch, or any CURRENT selector is a
separate action with its own authority and validation.

## Required Separation

- Proposal author cannot be the final Review owner.
- Review owner cannot be the Git integrator for the same approval record.
- A review marked external must come from an independently identified reviewer.
- Internal Codex review may not be labeled external.
- The Dispatcher receives an event only after the baseline and decision records
  are durable; it cannot infer implementation authorization.

## Human Override

Human may suspend, revoke, narrow, or supersede any approval. Revocation blocks
new use but does not silently rewrite historical decisions. Emergency stop sets
the runtime to `SAFE_HOLD` and prevents all new auto approvals.

## Failure Modes

Any missing source, conflicting CURRENT selector, unresolved P0/P1 risk, stale
review, hash mismatch, protected-path change, validation failure, authority
ambiguity, or unavailable audit store produces `HUMAN_REVIEW_REQUIRED` or
`REJECTED`. The runtime never guesses approval.

## Enablement Status

- Architecture: `UNDER_REVIEW`
- Auto Approval: `DISABLED`
- Implementation: `NOT_STARTED`
- Deployment: `NOT_STARTED`
- WorkQueue: `UNCHANGED`
- Pages: `UNCHANGED`
