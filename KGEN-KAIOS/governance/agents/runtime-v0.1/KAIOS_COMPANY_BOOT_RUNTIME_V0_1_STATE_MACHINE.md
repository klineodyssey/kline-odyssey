# KAIOS Company Boot Runtime V0.1 State Machine

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Implementation: NOT_STARTED

## Canonical States

| State | Allowed Inputs | Allowed Actions | Forbidden Actions | Exit Conditions | Failure Conditions | Evidence Required |
|---|---|---|---|---|---|---|
| `NEW` | Boot input envelope | Validate envelope shape | Write, commit, push, dispatch, merge | Input fields present | Missing boot input | Input hash |
| `BOOTING` | `NEW` | Read registries, current state candidate and parent handoff | Product modification, WorkQueue mutation | Required sources readable | Missing source, unreadable JSON | Files-read evidence |
| `IDENTITY_VERIFIED` | Valid Life ID and attestation | Compare Life Record, Attestation, Birth Record and Current Main SHA | Self-issued high authority | Identity sources agree | Fake Life ID, fake attestation, registry mismatch | Identity evidence IDs |
| `CAPABILITY_VERIFIED` | Valid grant and revocation check | Verify allowlisted V0.1 capabilities | Capability escalation | Grant active, scoped and unrevoked | Expired grant, revoked grant, missing scope | Grant and revocation evidence |
| `STATE_VERIFIED` | Current state candidate | Verify `current_main_sha`, baseline, recovery point and state hash | Treat cache as current truth | Current state unique and hashes match | Current state conflict, stale base SHA, state SHA mismatch | Current-state hash evidence |
| `HANDOFF_LOADED` | Parent handoff or root authorization | Verify parent handoff hash and work continuity | Inherit high-risk work silently | Parent handoff found or root authorized | Missing handoff, handoff SHA mismatch | Handoff evidence |
| `READ_ONLY_ACTIVE` | Verified identity, capability, current state and handoff | Run read-only boot audit | Write, branch, commit, push, PR, merge, dispatch, deploy | Audit complete with evidence | Secret in output, unauthorized WorkOrder | Audit evidence IDs |
| `HANDOFF_WRITTEN` | Audit result | Write handoff record only in approved future runtime path | Product file modification, dispatch, PR | Handoff includes ending SHA and required fields | Handoff missing required fields | Handoff hash |
| `ARCHIVED` | Handoff written and lock releasable | Release lock, mark archived | Resume on new main SHA | Session closed | Lock release failed | Archive evidence |
| `FAILED` | Any failed boot gate | Record blocked evidence and handoff | Continue work, high-risk action | Failure handoff written | Secret leakage in failure evidence | Failure evidence |
| `REVOKED` | Revocation record | Stop revoked capability, create blocked handoff | Use revoked grant | Archive after blocked handoff | Continued use of revoked capability | Revocation evidence |
| `STALE` | Base main SHA differs from current main SHA | READ, SYNC, DRIFT_REVIEW, HANDOFF, HUMAN_ESCALATION | WRITE, COMMIT, PUSH, PR, MERGE, DISPATCH, DEPLOY | Drift reviewed or Human directs retry | High-risk action attempted | Drift evidence |
| `CONFLICTED` | Duplicate Session ID, lock conflict or current-state conflict | Record conflict evidence and handoff | Continue boot as normal | Human or controller resolves conflict | Silent conflict override | Conflict evidence |

## Transition Rules

Every transition must be evidence-backed. Chat memory cannot satisfy a transition by itself.

The state machine is fail closed. Missing evidence, stale main SHA, duplicate session ID, secret exposure, missing parent handoff, or unauthorized workorder all move to `COMPANY_BOOT_FAILED`.

There are no unrestricted jumps. The only normal forward path is:

## Read-Only Happy Path

```text
NEW
-> BOOTING
-> IDENTITY_VERIFIED
-> CAPABILITY_VERIFIED
-> STATE_VERIFIED
-> HANDOFF_LOADED
-> READ_ONLY_ACTIVE
-> HANDOFF_WRITTEN
-> ARCHIVED
```

## Blocked Path

```text
NEW | BOOTING | IDENTITY_VERIFIED | CAPABILITY_VERIFIED | STATE_VERIFIED | HANDOFF_LOADED | READ_ONLY_ACTIVE
-> FAILED | REVOKED | STALE | CONFLICTED
-> HANDOFF_WRITTEN
-> ARCHIVED
```

Blocked sessions may only record the failure evidence and required next actions.

## High-Risk Action Guard

V0.1 never permits high-risk actions. Any attempt to perform the following from V0.1 is an immediate boundary failure:

- create branch
- commit
- push
- open PR
- merge
- dispatch Cursor
- modify WorkQueue
- modify Runtime CURRENT
- modify Universe Map CURRENT
- modify token or wallet material
- deploy

## Session Archive Rule

When archived, a session may be referenced by future sessions as parent context, but it may not continue operating on a new main SHA. Future work must start a new Session Birth Record.
