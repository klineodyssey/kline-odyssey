---
TITLE: "Claim and Lease Controller Integration Profile"
VERSION: "0.3.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_MANUAL_OPERATOR_PROTOCOL_ATOMIC_SERVICE_NOT_IMPLEMENTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Place claim and lease custody under Company OS Layer 9 without creating an independent boot path."
ANCESTOR: "KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md"
SOURCE_OF_TRUTH: true
---

# Claim and Lease Controller

The existing Task Claim Lease Protocol remains authoritative. This proposal adds manager lifecycle semantics; it does not create a second claim registry.

## Company OS Placement

The Company Kernel invokes this controller at **Layer 9: Claim Lease** only after Layers 0 through 8 pass. The controller cannot self-start, issue a claim before Review Queue reconciliation, or continue after any earlier layer fails. Cursor, Codex, ChatGPT and future AI providers all observe the same canonical claim state through the shared Company OS Boot.

Layer 9 validates custody and determines whether the current Session may proceed to the Layer 10 authorization gate. It does not perform implementation, merge, push or deployment.

## Claim Serialization Gap

The current formal main registry shows `cursor-01` as `IDLE`, while multiple handoff branches independently carry claim records. A branch-local claim cannot provide an atomic company-wide lock because another branch may not see it. Automatic dispatch must remain disabled until a separately approved design provides one canonical claim authority, immutable `claim_id`, lock version, compare-and-set transition, and conflict audit.

## Proposed Controller States

```text
OPEN
-> ACTIVE
-> REVIEW
-> APPROVED
-> CLOSED
-> RELEASED

REVIEW -> REPAIR -> REVIEW
ACTIVE -> EXPIRED
ACTIVE -> ABANDONED
ANY -> BLOCKED
```

`CLAIMED` and `IN_PROGRESS` remain WorkQueue lifecycle states. `ACTIVE`, `REVIEW`, `REPAIR`, `CLOSED` and `RELEASED` describe lease-controller custody.

## One-Task Lock

For one worker, at most one claim may be in `ACTIVE`, `REVIEW` or `REPAIR`. A new claim request while any of those states exists returns:

```text
REJECT_UNAUTHORIZED
reason: already holding one active task
```

This is healthy enforcement, not a worker failure.

## Proposed Machine Fields

- `claim_id`
- `task_id`
- `worker_id`
- `task_envelope_id`
- `branch`
- `base_commit`
- `claimed_at`
- `execution_lease_expires_at`
- `heartbeat_at`
- `review_submitted_at`
- `review_id`
- `review_status`
- `repair_cycle`
- `closed_at`
- `released_at`
- `release_reason`
- `supersedes_claim_id`

Adding these fields to the active schema requires a separate Human implementation approval.

## Review Custody Rule

If a valid Handoff reaches `REVIEW` before execution lease expiry:

1. worker execution stops;
2. the claim lock remains held;
3. execution expiry no longer marks the Worker abandoned;
4. Codex owns the review SLA;
5. the claim becomes `APPROVED`, `REPAIR`, `BLOCKED` or `REJECTED`;
6. release occurs only after the formal closeout is visible.

This prevents a completed task from blocking all future work merely because Codex did not review before the original execution expiry.

## Repair Rule

Repair keeps the same `task_id`, claim lineage and primary owner. Codex may issue a bounded repair window. Cursor must not open a parallel task or create an unrelated branch.

## Expiry Rule

Expiry applies when a Worker has no valid Handoff and no heartbeat before `execution_lease_expires_at`. It does not erase evidence. Codex may reopen, block or mark abandoned after checking branch/report visibility.

## Current Incident

- Claim: `CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01`
- Handoff submitted before expiry: yes.
- Current wall-clock expiry passed: yes.
- Correct interpretation: review-custody delay, not Cursor abandonment.
- Remote freshness: verified; `origin/main` and handoff tip are unchanged.
- Formal release: not executed because evidence repair remains required and commit/push are forbidden this round.
- Eight later claim/handoff refs overlap this claim window and are classified unauthorized evidence, not replacement claims.
- Root cause: branch-local claim snapshots did not serialize company-wide claim state.
- Next action: same-task evidence repair, then a separately authorized closeout.
