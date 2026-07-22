# KAIOS Company Boot Runtime V0.1 Security Model

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Implementation: NOT_STARTED

## Security Goal

V0.1 proves that a Codex session cannot safely act until identity, authority, current state, parent context, workorder scope and secret boundaries are verified.

The default result of uncertainty is `COMPANY_BOOT_FAILED`.

## Trust Model

| Source | Trust Level | Use |
|---|---|---|
| Repository baseline files at verified main SHA | High | Current architecture and policy truth |
| Agent Registry candidate | High only after hash and current-state validation | Life identity lookup |
| Attestation record | High only if linked to registry and grant | Identity proof |
| Capability grant | High only if active, in scope and not revoked | Allowed actions |
| Parent handoff | High only if hash/evidence match | Session continuity |
| Chat memory | Advisory only | Never sole evidence |
| Cache | Advisory only | Never current truth |
| Screenshot | Supporting only | Not sole merge or authority evidence |

## Identity Controls

- Life ID is not Session ID.
- Session ID is not WorkOrder ID.
- Agent cannot self-authorize by writing JSON.
- Attestation must match Life Record, Capability Grant, Session Birth Record and Current Main SHA.
- Missing or conflicting identity evidence returns `IDENTITY_ATTESTATION_FAILED`.

## Capability Controls

V0.1 capabilities are allowlisted:

- READ
- BOOT
- VERIFY
- AUDIT
- CREATE_SESSION_RECORD
- CREATE_HANDOFF_RECORD
- ARCHIVE_SESSION

All other capabilities are denied even when an operator asks for them inside a V0.1 boot session.

## Revocation Controls

Capability revocation immediately invalidates the affected capability. If the revoked capability is required to continue boot, the session moves to `COMPANY_BOOT_FAILED`.

Expired grants are treated as revoked for V0.1.

## Current-State Controls

V0.1 must read exactly one canonical current-state pointer candidate. Conflicting current-state files cause `CURRENT_STATE_CONFLICT`.

Expected fields include:

- `current_main_sha`
- `current_baseline_id`
- `current_recovery_point`
- `active_workorders`
- `active_agent_sessions`
- `revoked_sessions`
- `last_human_decision_id`
- `state_sha256`

## Secret Boundary

V0.1 must not store or echo:

- token
- password
- private key
- mnemonic
- wallet seed
- full environment variable dump
- authorization header
- cookie
- credential helper output

Secret checks apply to boot output, evidence, handoff, logs, messages, screenshots, PR bodies and task envelopes.

## Protected Path Boundary

V0.1 may read protected paths for verification, but may not modify:

- Runtime CURRENT
- Universe Map CURRENT
- Universe physics CURRENT
- token contracts
- wallet or bridge files
- WorkQueue dispatch state
- product UI or runtime code

## Failure Containment

When a failure is detected:

1. Stop all non-read actions.
2. Preserve evidence without secrets.
3. Produce a blocked handoff.
4. Archive the session.
5. Require Human or approved controller review before retry.

## Security Non-Goals

V0.1 does not implement encryption, scheduler security, network policy, access-control service, database authorization, production secret vault, or autonomous remediation.
