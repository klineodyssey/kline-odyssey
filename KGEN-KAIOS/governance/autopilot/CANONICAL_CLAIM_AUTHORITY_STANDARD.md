---
TITLE: "Canonical Atomic Claim Authority Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
ANCESTOR: "CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md; CLAIM_AND_LEASE_CONTROLLER.md"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/CANONICAL_CLAIM_AUTHORITY_STANDARD.md"
---

# Canonical Atomic Claim Authority Standard

## 1. Non-negotiable Rule

A branch-local JSON file, commit message, chat claim or Cursor status is evidence only. It is permanently forbidden as Canonical Claim Authority.

Auto Dispatch remains `DISABLED_UNTIL_CANONICAL_ATOMIC_CLAIM_AUTHORITY` until this contract is implemented and independently tested.

## 2. Canonical Claim Record

```text
claim_id
task_id
worker_id
clone_id
session_id
workspace_id
branch
claim_state
expected_revision
current_revision
fencing_token
lease_started_at
lease_expiry
heartbeat_cursor
review_custody
review_owner
repair_owner
close_state
release_state
authorization_ref
task_envelope_hash
created_at
updated_at
```

`claim_id` is globally unique and never reused. `fencing_token` increases on every transfer, recovery or reallocation.

## 3. State Machine

```text
AVAILABLE
-> CLAIMED
-> EXECUTING
-> HANDOFF_SUBMITTED
-> REVIEW_CUSTODY
-> APPROVED
-> CLOSED
-> RELEASED

REVIEW_CUSTODY -> REPAIR -> EXECUTING
ANY_ACTIVE -> BLOCKED
ANY_ACTIVE -> EXPIRED -> RECOVERY_PENDING
RECOVERY_PENDING -> RECOVERED
ANY -> REJECTED -> CLOSED
```

Close and release are distinct. A submitted handoff transfers custody to Review but does not release the Claim.

## 4. Atomic Compare-and-swap

A mutation supplies:

```text
operation_id
claim_id
expected_revision
expected_state
expected_fencing_token
requested_state
actor_id
authorization_ref
idempotency_key
timestamp
```

The mutation succeeds only when all expected values match. Success returns a new revision and, when custody changes, a new fencing token. Failure returns current authoritative metadata without applying a partial transition.

## 5. Allocation Invariants

1. one Task has at most one active Claim;
2. one Clone has at most one active Claim;
3. one Session belongs to one Clone and one workspace;
4. the Worker is registered and eligible;
5. the Task is approved for the requested action;
6. Architecture-only tasks cannot receive implementation Claims;
7. Spawn Budget and path quota are valid;
8. protected-path scope is denied unless a separate Human-only authorization exists;
9. stale fencing tokens cannot write;
10. allocation and all reverse pointers change atomically.

## 6. Lease and Recovery

Lease expiry stops new writes. Recovery verifies the last checkpoint and evidence, fences the old Session, increments the token and creates a linked Recovery Session. Expiry does not prove abandonment and does not erase evidence.

Recovery rates are quota-bound to prevent cascade. Ambiguous custody enters `SAFE_HOLD`.

## 7. Review and Repair Custody

Only Codex Review or a Human-required gate can own final review custody. A Clone, Squad Leader or related Owner cannot review its own work.

Repair remains on the same Task and Claim lineage unless an explicit reassignment event fences the prior owner. A repair limit prevents endless loops and escalates to `SAFE_HOLD` or Human review.

## 8. Evidence Chain

Every submission appends:

```text
evidence_id
task_id
claim_id
worker_id
clone_id
session_id
artifact_hash
commit_sha
test_hash
timestamp
causation_id
previous_evidence_hash
authorization
review_signature
tamper_status
```

Workers cannot overwrite earlier Evidence. A correction creates a new evidence record linked by `previous_evidence_hash` or an explicit supersession reference.

Tamper states are `UNVERIFIED`, `VALID`, `BROKEN_CHAIN`, `HASH_MISMATCH`, `UNAUTHORIZED_SOURCE`, `REVOKED` and `QUARANTINED`.

## 9. Implementation Profiles

The standard is technology-neutral, but an implementation must provide actual transactions:

- S0 candidate: a single-writer transactional local store with write-ahead durability;
- S1 candidate: a highly available transactional store with conditional updates and partition ownership;
- Git branches and ordinary JSON files: never sufficient.

No production database is selected or deployed in this revision.

## 10. Conformance Tests

Required tests include concurrent Claim race, duplicate idempotency key, stale revision, stale fencing token, lease expiry during handoff, review transfer, bounded repair, recovery collision, related-Clone review denial, Architecture-only dispatch denial, protected-path denial and replay after snapshot restore.

Any failed Claim integrity test keeps Auto Dispatch disabled.

## 11. Architecture Boundary

```text
Canonical Claim Authority: STANDARD_UNDER_REVIEW
Implementation: NOT_STARTED
Auto Dispatch: DISABLED
Branch-local authority: FORBIDDEN
```
