---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define typed company intake lanes that never authorize direct dispatch."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/COMPANY_INBOX.md; KGEN-KAIOS/governance/autopilot/HUMAN_INBOX_ROUTER.md"
SOURCE_OF_TRUTH: false
---

# Company Inbox V1

## 1. Purpose

Company Inbox is the proposed durable intake layer between every provider message and company action. It captures, validates, classifies, deduplicates, and routes messages. It never grants implementation authority and never dispatches a Worker.

```text
Provider / Human Input
-> Capture
-> Validate
-> Classify
-> Deduplicate
-> Decision Authority Check
-> Queue
-> Review-First Gate
-> Dispatcher Eligibility
```

All new input enters an Inbox lane before routing. A Human message may be urgent or authoritative, but it still receives an immutable Inbox identity and Decision Center reference.

## 2. Formal Lanes

| Lane | Accepted content | Exit target |
|---|---|---|
| `HUMAN_INBOX` | Human decisions, requests, questions, ideas, emergency stops | Decision validation or classified queue |
| `CODEX_INBOX` | GM observations, architecture resolutions, review results, maintenance findings | Review, Architecture, Decision, or Evidence lane |
| `CURSOR_INBOX` | Worker preflight, checkpoint, handoff, blocked report | Evidence or Review lane |
| `REVIEW_INBOX` | Handoffs, architecture reviews, security reviews, customer reviews | Review Queue |
| `ARCHITECTURE_INBOX` | Proposal, amendment, gap, ADR candidate | AGB flow |
| `IMPLEMENTATION_INBOX` | Human-authorized implementation request and Task Envelope candidate | Dispatcher eligibility check |
| `EVIDENCE_INBOX` | Reports, hashes, tests, diffs, screenshots, provenance | Evidence validation and Review |
| `DONE` | Closed outcomes with Decision, Review, and evidence references | Read-only retention |
| `ARCHIVE` | Superseded, rejected, expired, or evidence-only material | Read-only retention |

`DONE` and `ARCHIVE` are terminal lanes, not deletion states.

## 3. Inbox Record

Each record requires:

```text
inbox_id
message_id
message_type
schema_version
source_actor_id
source_provider
received_at
classification
lane
priority_class
human_decision_id
decision_version
authority_state
summary
payload_ref
payload_hash
correlation_id
causation_id
idempotency_key
dependencies
related_workorders
related_claims
related_workers
review_required
review_state
sensitive_classification
retention_class
status
routed_target
created_at
updated_at
closed_at
```

Sensitive payloads remain in authorized private storage. Public Inbox records contain only redacted metadata, hashes, and access-policy references.

## 4. Lifecycle

```text
RECEIVED
-> SCHEMA_VALIDATED
-> CLASSIFIED
-> DEDUPLICATED
-> AUTHORITY_CHECKED
-> QUEUED
-> ROUTED
-> CLOSED
-> DONE or ARCHIVE
```

Holding and failure states:

- `HOLD_REVIEW_FIRST`
- `HOLD_ACTIVE_CLAIM`
- `HOLD_NETWORK_DEPENDENCY`
- `HUMAN_DECISION_REQUIRED`
- `BLOCKED_SOURCE_CONFLICT`
- `BLOCKED_PROTECTED_PATH`
- `REJECTED_SCHEMA`
- `REJECTED_REPLAY`

No state transition silently changes the original message. Each transition appends an event or a superseding record.

## 5. Review-First Barrier

Before any new implementation dispatch, Inbox asks Review Queue for `actionable_review_count`.

- If greater than zero, implementation candidates move to `HOLD_REVIEW_FIRST`.
- Review and repair messages may still be routed so the backlog can be reduced.
- Emergency stop and security containment messages preempt normal ordering.
- Invalid branches without a valid Task Envelope, Claim, or Handoff are triaged to `EVIDENCE_INBOX` and then `ARCHIVE`; they do not hold the company hostage as permanent actionable reviews.
- A timed-out or deadlocked review escalates to `SAFE_HOLD` and Human review rather than being bypassed.

## 6. Priority

Normal priority is:

```text
REVIEW
-> REPAIR
-> HUMAN_DECISION
-> ARCHITECTURE
-> IMPLEMENTATION
```

Priority only selects what is examined next. It does not create authority, a WorkOrder, a Claim, or permission to edit.

## 7. Deduplication And Replay

Inbox compares:

- `idempotency_key`;
- payload hash;
- decision ID and version;
- task, claim, review, evidence, and release IDs;
- correlation and causation lineage.

An identical replay returns the existing record. Reuse of an idempotency key with a different payload is rejected and audited.

## 8. Privacy And Retention

Inbox must never publish or duplicate:

- tokens, private keys, seed phrases, passwords, or credentials;
- private KYC or exact private GPS;
- private prompts, proprietary formulas, or Heaven Secret artifacts;
- unrelated personal data.

Retention classes are `HOT_ACTIVE`, `WARM_HISTORY`, `COLD_ARCHIVE`, `IMMUTABLE_GOVERNANCE`, and `DISPOSABLE_TELEMETRY`. Legal/privacy destruction rules apply to payload storage while immutable governance records retain only the minimum non-secret audit facts.

## 9. Scale Boundary

A production Inbox must be partitionable by tenant, lane, decision lineage, and time. `company_inbox.json` is a zero-state Architecture projection, not a billion-record queue or a live service.

## 10. Current Boundary

The active operator protocol at `KGEN-KAIOS/governance/autopilot/COMPANY_INBOX.md` remains current until cutover. This proposal creates no live Inbox route, WorkOrder, Claim, dispatch, implementation, or deployment.
