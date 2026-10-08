# KAIOS AI Agent Handoff Protocol V1.0

Status: LOCAL_VALIDATOR_CANDIDATE
Runtime Implementation: HASH_BOUND_VALIDATION_ONLY
Cursor Dispatch: NOT_DISPATCHED

## Rule

Every AI Agent session that reads material state, changes files, reviews work, discovers a blocker, or receives a Human decision must leave a repository-backed handoff before stopping. A chat message is not a sufficient handoff.

## Required Handoff Fields

- `handoff_id`
- `from_life_id`
- `from_instance_id`
- `to_role`
- `to_instance_id_if_known`
- `workorder_id`
- `base_sha`
- `ending_sha`
- `files_read`
- `files_changed`
- `actions_completed`
- `actions_not_completed`
- `tests_run`
- `test_results`
- `open_blockers`
- `known_risks`
- `incidents`
- `human_decisions`
- `forbidden_next_actions`
- `required_next_actions`
- `recovery_point`
- `evidence_paths`
- `created_at`
- `signature`

## Handoff States

| State | Meaning |
|---|---|
| `CREATED` | Handoff record exists and has a unique ID. |
| `DRAFT` | Handoff is being written by the active instance. |
| `SUBMITTED` | Handoff is complete and ready for the next session. |
| `ACKNOWLEDGED` | Next instance has read it during Company Boot. |
| `SUPERSEDED` | A newer handoff replaces it without deleting history. |
| `EXPIRED` | Handoff is too stale for high-risk continuation without revalidation. |
| `ARCHIVED` | Historical only. |

## When Handoff Is Mandatory

- Session modified any repository file.
- Session changed WorkQueue, Review Log, Handover Log, registry, proposal status or evidence.
- Session reviewed a PR, branch or Cursor handoff.
- Session detected conflict, blocker, source corruption, protected-path risk or network failure.
- Session received a new Human decision that changes state.
- Session ends with incomplete work.

## Forbidden

- No silent stop after material action.
- No "done in chat" as the only record.
- No handoff without base SHA and ending SHA.
- No replacing old handoff content without append-only supersession.
- No hiding incidents inside summary text without incident fields.
- No secrets in handoff body, evidence excerpts, screenshots or copied environment output.

## Acknowledgement Contract

The next session must create `handoff_acknowledgement` evidence before using a handoff:

- `ack_id`
- `handoff_id`
- `acknowledged_by_instance_id`
- `acknowledged_at`
- `main_sha_at_ack`
- `handoff_sha256`
- `staleness_result`
- `required_next_actions_accepted`

If a handoff is expired or references stale main, the next session may only read, sync, review drift, create a new handoff or escalate.

## Evidence And Secret Boundary

Every handoff evidence path must include source provenance: source path, source SHA-256, observed main SHA, observing instance and confidence. Secret-bearing artifacts must be represented by result-only evidence and must never disclose raw secret values.

## Architecture Boundary

This protocol does not implement a live cross-session transport, file writer, database, scheduler, Agent wake-up or public posting. Runtime V0.1 now validates a handoff envelope and its append-only audit chain locally; transport and durable persistence remain unimplemented.

## V1.1 Instance-Bound Handoff Candidate

The local candidate reuses Company Boot Runtime V0.1. It does not create a second Company OS.

An identity name, Life ID or Worker ID in a message is a claim until an independently supplied active instance registry binds all four values:

- `SELF_NAME`
- `LIFE_ID`
- `WORKER_ID`
- `INSTANCE_ID`

No delivery is valid without both a verified sender instance and a verified recipient instance. A missing recipient returns `MISSING_VERIFIED_REPLY_TARGET`; the sender must not guess a session ID or broadcast.

The immutable message envelope contains:

- `MESSAGE_ID`
- `CORRELATION_ID`
- `IDEMPOTENCY_KEY`
- full sender and recipient identity tuples
- `CREATED_AT`
- `REPOSITORY`
- `BASE_SHA`
- `HEAD_SHA`
- `PAYLOAD`
- `PAYLOAD_SHA256`
- `MESSAGE_SHA256`
- `REPLY_TO`
- initial ACK, decision and delivery states
- `SIGNATURE_TYPE`
- an explicit all-false protected-action safety boundary

`MESSAGE_SHA256` binds the canonical JSON envelope excluding only its own hash field. `PAYLOAD_SHA256` independently binds canonical JSON payload content. Exact replay of both Message ID and idempotency key is an `IDEMPOTENT_NOOP`; conflicting replay fails closed.

The append-only audit trail uses:

```text
CREATED
-> QUEUED
-> DELIVERED
-> ACKNOWLEDGED
-> ANSWERED
-> REVIEWED
```

Any non-terminal step may instead become `FAILED_CLOSED`. Each event binds the message hash and previous event hash. The verified recipient—not the sender—must author `ACKNOWLEDGED` and `ANSWERED`. `REVIEWED` requires a third verified instance distinct from sender and recipient. This enforces ACK non-impersonation and forbids self-review.

Current transport decision:

- repository documents and GitHub artifacts remain the durable evidence bus;
- saved Codex session resume is session continuation, not an authenticated cross-Life mailbox;
- remote-control or UI follow-up queueing does not itself prove a Life/Worker/Instance binding;
- no live verified reply target is recorded for the current mobile instance;
- therefore automatic delivery remains `BLOCKED_MISSING_VERIFIED_REPLY_TARGET`.

## Result

LOCAL_VALIDATOR_CANDIDATE_REQUIRES_DISTINCT_REVIEW
