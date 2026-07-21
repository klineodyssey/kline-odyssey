# KAIOS AI Agent Message Protocol V1.0

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Runtime Implementation: NOT_STARTED  
Cursor Dispatch: NOT_DISPATCHED

## Purpose

AI Agents must communicate through repository-backed messages rather than private assumptions. Messages make requests, warnings, blockers, review requests, handoffs, incidents and Human escalations auditable.

## Message Types

- `REQUEST`
- `RESPONSE`
- `WARNING`
- `BLOCKER`
- `REVIEW_REQUEST`
- `HANDOFF`
- `INCIDENT`
- `HUMAN_ESCALATION`
- `STATUS_UPDATE`

## Required Fields

- `message_id`
- `idempotency_key`
- `sequence_number`
- `from_life_id`
- `from_instance_id`
- `to_life_id_or_role`
- `subject`
- `workorder_id`
- `main_sha`
- `body`
- `evidence`
- `priority`
- `retry_count`
- `max_retries`
- `requires_response`
- `expires_at`
- `ack_required`
- `ack_status`
- `supersedes_message_id`
- `body_sha256`
- `status`

## Message Lifecycle

```text
CREATED
-> DELIVERED
-> ACKNOWLEDGED
-> CLOSED
```

Alternate endings:

- `EXPIRED`
- `SUPERSEDED`
- `RETRY_PENDING`
- `FAILED`
- `ARCHIVED`

## Deduplication And Retry

`idempotency_key` plus `body_sha256` is the execution guard. If a receiver sees the same key again, it must not repeat side effects.

Retries may redeliver status or evidence, but must never cause duplicate:

- dispatch
- commit
- payment
- merge
- session creation
- WorkQueue state transition

Messages requiring ACK remain `RETRY_PENDING` until acknowledged, expired or failed. `max_retries` bounds delivery attempts.

## Routing Rules

| Target | Routing |
|---|---|
| Codex GM | Architecture, review, merge, release, governance decisions |
| Cursor Worker | Claim, implementation, testing, evidence, handoff only after approved dispatch |
| Review Role | PR, handoff and evidence review |
| Human | Only Level-C or explicit world/product decisions |
| Future AI Provider | Must obey Decision Center, shared context and message contract |

## Prohibited

- No private cross-page "I told the other Codex" claims without repository message evidence.
- No message may authorize protected-path changes by itself.
- No message may override Human Final Authority.
- No message may create Cursor dispatch unless dispatch authority is separately approved.
- No message may include raw secrets.
- No message may treat cache or chat memory as sole evidence.

## Result

READY_FOR_BASELINE_REVIEW
