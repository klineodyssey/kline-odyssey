---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define a provider-neutral, versioned, machine-readable company message contract."
ANCESTOR: "KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md; KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# Company Message Standard V1

## 1. Purpose

The Message Standard is the provider-neutral contract connecting Decision Center, Inbox, Scheduler, Dispatcher, Claims, Workers, Evidence, Review, and Release. A message transports a governed fact or request; it does not grant authority by existence.

## 2. Common Envelope

Every message requires:

```text
message_id
message_type
schema_name
schema_version
message_version
created_at
effective_at
expires_at
source_actor_id
source_role
source_provider
target_lane
tenant_id
session_id
human_decision_id
decision_version
authority_scope
correlation_id
causation_id
idempotency_key
classification
retention_class
payload_ref
payload_hash
evidence_refs
review_state
status
supersedes_message_id
previous_message_hash
message_hash
signature_or_verification_ref
```

The envelope contains only routing and integrity metadata. Large, private, regulated, or proprietary payloads are stored outside public projections and referenced by authorized URI/ID plus hash.

## 3. Message Types

| Type | Required payload | Authority effect |
|---|---|---|
| `DECISION` | decision ID/version, Human/delegated authority, scope, status, effective time, reason, rollback | May authorize only when active and validated |
| `TASK` | task ID, objective, source decision, actions, paths, risk, tests, evidence, reviewer | Candidate only until dispatch and Claim |
| `REVIEW` | review ID, target, reviewer, disposition, findings, evidence, conflicts | Controls review disposition, not original command |
| `REPAIR` | repair ID/cycle, task/claim/review lineage, bounded changes, tests, expiry | Continues same task; cannot broaden scope |
| `ARCHITECTURE` | proposal ID, stage, sources, dependencies, risks, review/ADR/baseline state | Never implies implementation |
| `IMPLEMENTATION` | implementation authorization, baseline/ADR refs, scope, rollback, expiry | Eligible for task creation only after all gates |
| `EVIDENCE` | evidence ID, task/claim/session, artifact/test hashes, causation, tamper state | Proves work; never self-approves |
| `RELEASE` | release ID, review/decision refs, artifact/commit, environment, rollback, approval | Eligible release request; protected boundaries still apply |

Coverage is 8 of 8 required message families.

## 4. Type Contracts

### Decision

Required additions:

```text
decision_id
decision_version
decision_type
human_authority_id
delegated_authority_id
reason
options
chosen_option
risk_level
rollback_plan
scope
status
affected_refs
```

### Task

Required additions:

```text
task_id
title
objective
authorized_actions
forbidden_actions
authorized_paths
forbidden_paths
protected_paths
required_sources
required_tests
required_evidence
risk_level
reviewer_id
task_envelope_status
```

### Review

Required additions:

```text
review_id
review_type
reviewer_id
reviewer_independence
target_type
target_id
target_version
findings
test_results
protected_path_result
disposition
required_follow_up
```

### Repair

Required additions:

```text
repair_id
repair_cycle
task_id
claim_id
review_id
same_claim_lineage
authorized_repairs
forbidden_expansion
required_retests
repair_expiry
```

### Architecture

Required additions:

```text
proposal_id
architecture_status
source_audit_refs
dependencies
risk_register_refs
independent_review_state
resolution_id
adr_ids
human_approval_state
baseline_state
implementation_state
```

### Implementation

Required additions:

```text
implementation_authorization_id
approved_baseline_refs
approved_adr_refs
objective
scope
rollback_plan
workqueue_creation_allowed
deployment_allowed
human_approval_required
```

### Evidence

Required additions:

```text
evidence_id
task_id
claim_id
worker_id
session_id
artifact_hash
commit_sha
test_hash
timestamp
authorization_ref
previous_evidence_hash
tamper_status
```

### Release

Required additions:

```text
release_id
release_type
decision_id
review_id
artifact_refs
commit_sha
target_environment
protected_path_result
secret_scan_result
rollback_plan
release_status
```

## 5. Validation

Messages pass:

1. strict schema and supported-version validation;
2. globally unique ID and idempotency validation;
3. Human Decision and authority-scope validation;
4. effective time, expiry, supersession, and revocation validation;
5. payload hash and previous-message hash validation;
6. classification, tenant, permission, and target-lane validation;
7. referenced source existence and version validation;
8. protected-path and secret-policy validation;
9. state-transition validation;
10. append-only audit registration.

Unknown fields may be preserved for forward compatibility but cannot change authorization semantics. Unsupported major schema versions fail closed.

## 6. Versioning And Compatibility

- Semantic schema versioning applies per message type.
- Additive optional fields use a minor version.
- Authorization or state-semantic changes require a major version, migration, compatibility test, and approval.
- Providers declare supported schemas and capabilities during Boot.
- Adapters cannot drop required fields or infer authority.
- Historical messages retain their original schema and are replayed through versioned readers.

## 7. Ordering, Replay, And Delivery

- At-least-once transport is permitted only with idempotent consumers.
- Duplicate identical messages return the existing disposition.
- Same idempotency key with different payload is rejected.
- Commands with stale decision versions, fencing tokens, or state versions are rejected.
- Correlation groups a workflow; causation identifies the immediate parent.
- No delivery guarantee can override authority or expiry.

## 8. Security

- Message bodies are least-privilege and lane-scoped.
- Public projections redact private data and secrets.
- Tenant identity and authorization are validated at every consumer.
- A provider cannot subscribe to every lane by default.
- Signature references are access-controlled; private keys never enter messages or the Repo.
- Evidence and audit messages are append-only and tamper-evident.

## 9. Provider Compatibility

ChatGPT, Codex, Cursor, Gemini, Grok, Claude, OpenHands, Copilot, and future providers use the same envelope. Provider-specific fields live in a namespaced `extensions` object and cannot alter common authorization semantics.

## 10. Architecture Boundary

No schema service, message broker, queue, event bus, API, WorkQueue, Claim, implementation, or deployment is created by this standard.
