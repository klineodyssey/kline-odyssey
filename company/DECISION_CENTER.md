---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define a future append-only company command authority with Human Final Authority and fail-closed validation."
ANCESTOR: "KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md; KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md"
SOURCE_OF_TRUTH: false
---

# Company Decision Center Runtime V1

## 1. Definition

The Company Decision Center is the proposed canonical control plane for KAIOS company commands. After a separately approved cutover, every Task, Review, Repair, Architecture action, Implementation authorization, Evidence acceptance, and Release must trace to one active Decision Center decision.

Its source-of-truth scope is deliberately narrow:

- **Owns:** command identity, authority, scope, version, status, effective time, expiry, supersession, revocation, and audit lineage.
- **References:** Constitution, Canon, Runtime CURRENT, frozen baselines, WorkQueue, registries, evidence, reviews, commits, and release artifacts.
- **Does not own:** domain state, source code, land, money, identity, private data, Canon content, or protected Runtime.

Logical singularity does not require one fragile file or server. A future implementation may use replicated storage, but all replicas must expose one ordered canonical decision ledger and one deterministic current projection.

## 2. Authority Order

```text
Human Final Authority
> KAIOS Constitution
> Protected CURRENT / Canon / Frozen Baseline constraints
> Active Decision Center decision
> Approved ADR and Architecture Resolution
> Company policy and WorkQueue projection
> Dispatcher result
> Task Envelope and Claim
> Worker proposal or provider output
```

The Decision Center cannot weaken a higher source. A conflicting decision is `BLOCKED_AUTHORITY_CONFLICT`, not partially executed.

## 3. Responsibilities

The Decision Center must:

1. assign a globally unique `decision_id` and monotonically increasing version per decision lineage;
2. bind each decision to one `human_authority_id` or an explicit, current delegated-authority record;
3. record one status and one effective time for each immutable version;
4. validate scope, risk, expiry, revocation, protected paths, and Human Anchor;
5. publish provider-neutral command messages;
6. preserve append-only history and hash-linked supersession;
7. expose deterministic read-only projections to Boot, Inbox, Dispatcher, dashboards, and adapters;
8. fail closed on missing, conflicting, expired, revoked, or unverifiable authority.

It must not:

- invent Human decisions;
- generate WorkOrders directly from unreviewed input;
- allocate Claims;
- review its own decision;
- merge, push, deploy, pay, change ownership, or modify protected paths;
- treat chat memory, prompts, branches, READMEs, or dashboards as independent command sources.

## 4. Decision Record Contract

Every immutable decision version requires:

```text
decision_id
decision_version
decision_type
title
reason
options
chosen_option
scope
risk_level
rollback_plan
human_authority_id
delegated_authority_id
authority_scope
authority_evidence_ref
status
effective_at
expires_at
supersedes_decision_version
revokes_decision_id
affected_workorders
affected_workers
affected_files
expected_result
review_required
evidence_refs
created_at
recorded_by
record_hash
previous_record_hash
classification
retention_class
```

One field value is never silently edited. Corrections append a new version that cites the previous version. Revocation appends a revocation decision; it does not erase the original record.

## 5. Decision Status

| Status | Meaning |
|---|---|
| `RECEIVED` | Captured as input; not authoritative for action |
| `AUTHORITY_VALIDATING` | Human/delegated authority and scope are being verified |
| `ACTIVE` | Effective, unexpired, unrevoked, and usable within scope |
| `HOLD` | Preserved but cannot authorize mutation |
| `SUPERSEDED` | Replaced by a later immutable version |
| `REVOKED` | Explicitly withdrawn by sufficient authority |
| `EXPIRED` | Effective period ended |
| `REJECTED` | Failed authority, policy, or review validation |
| `ARCHIVED` | Retained as history after terminal disposition |

Only `ACTIVE` can authorize a downstream action. Architecture-only decisions authorize proposal work, not implementation.

## 6. Validation Pipeline

```text
Capture
-> Schema Validation
-> Unique ID / Version Check
-> Human Anchor Check
-> Authority Scope Check
-> Constitution / Protected Constraint Check
-> Effective Time / Expiry Check
-> Supersession / Revocation Check
-> Risk And Review Gate
-> Append Immutable Record
-> Publish Current Projection
```

Validation returns one of:

- `VALID_ACTIVE`
- `VALID_HOLD`
- `BLOCKED_AUTHORITY`
- `BLOCKED_SCOPE`
- `BLOCKED_SOURCE_CONFLICT`
- `BLOCKED_PROTECTED_PATH`
- `BLOCKED_REVIEW_REQUIRED`
- `REJECTED_REPLAY`
- `REJECTED_SCHEMA`

## 7. Append-Only Integrity

The canonical history must support:

- immutable records;
- ordered sequence numbers;
- `record_hash` and `previous_record_hash`;
- idempotency keys;
- correlation and causation IDs;
- signed or otherwise verifiable Human authority references;
- snapshot plus replay;
- independent audit and tamper detection;
- retention without exposing secrets or private payloads.

`decision_center.json` in this proposal is a zero-state Architecture projection. It is not a production event store.

## 8. Human Anchor

Every material command validates:

```text
human_authority_id
decision_signature_or_verification_ref
decision_scope
effective_at
decision_expiry
revocation_state
emergency_stop_state
override_state
appeal_state
audit_ref
```

Delegated Codex authority is valid only inside its explicit scope and expiry. Delegation cannot modify Human Final Authority, Constitution, protected Runtime, Token Contract, or other Human-only boundaries.

## 9. Projections And Adapters

After cutover, the Decision Center publishes read-only projections to:

- Company Boot: active decisions and source hashes;
- Company Inbox: routing authority and holds;
- Priority Scheduler: eligible message classes and urgency;
- Review Queue: review-required decisions and custody;
- Company Dispatcher: dispatch authorization only;
- WorkQueue: task lifecycle projection;
- Decision Engine V4 dashboard: manager and health projection;
- provider adapters: filtered commands within provider capability and permission.

Projections can be rebuilt from the ledger. A projection cannot authorize an action if it diverges from the canonical sequence or hash.

## 10. Conflict And Availability

| Condition | Result |
|---|---|
| Two active versions claim the same lineage | `BLOCKED_DECISION_DIVERGENCE` |
| Human Anchor cannot be verified | `HUMAN_DECISION_REQUIRED` |
| Ledger unavailable | Mutations stop; read-only cached status may display stale warning |
| Projection behind canonical sequence | Dispatcher stops at the last verified sequence |
| Clock uncertainty affects effective time | `SAFE_HOLD_TIME_ORDERING` |
| Review queue contains actionable review | New implementation dispatch blocked |
| Protected-path conflict | `BLOCKED_PROTECTED_PATH` |

Emergency stop intake remains available even when ordinary dispatch is halted. It is a containment command, not implementation work.

## 11. Current Boundary

The target authority is not active. Current sources remain unchanged and no WorkQueue, Claim, dispatch, implementation, deployment, or protected modification is created by this document.
