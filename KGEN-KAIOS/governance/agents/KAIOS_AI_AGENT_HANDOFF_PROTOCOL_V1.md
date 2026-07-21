# KAIOS AI Agent Handoff Protocol V1.0

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Runtime Implementation: NOT_STARTED  
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

This protocol does not implement file writers, automation, databases, schedulers or live enforcement. It defines the required contract for future implementation.

## Result

READY_FOR_BASELINE_REVIEW
