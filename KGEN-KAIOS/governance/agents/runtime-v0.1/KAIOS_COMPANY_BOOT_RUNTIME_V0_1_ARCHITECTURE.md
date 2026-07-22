# KAIOS Company Boot Runtime V0.1 Architecture

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Mode: Runtime architecture and minimum implementation plan
Implementation: NOT_STARTED
Scheduler: NOT_APPROVED
Auto Dispatch: NOT_APPROVED
Cursor Dispatch: NOT_APPROVED

## Purpose

KAIOS Company Boot Runtime V0.1 is the smallest closed-loop proof that separate Codex conversation sessions can start from repository truth, verify identity and authority, perform one read-only audit, produce evidence, create a handoff, and archive the session.

V0.1 does not prove autonomous company operation. It proves session identity, boot gating, and handoff continuity.

## Baseline Anchors

- Agent Architecture Baseline: ARCHITECTURE_BASELINE_APPROVED
- Main SHA at approval time: `68d17fde53f1ce0b4f610ce9e8095e5d93c8cf9a`
- Recovery Point: `RECOVERY-20260721-KAIOS-AGENT-LIFE-ARCHITECTURE-V1`
- Required Parent Architecture: `KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_LIFE_ARCHITECTURE_V1.md`

## V0.1 Allowed Capabilities

- READ
- BOOT
- VERIFY
- AUDIT
- CREATE_SESSION_RECORD
- CREATE_HANDOFF_RECORD
- ARCHIVE_SESSION

## V0.1 Forbidden Capabilities

- WRITE_PRODUCT_CODE
- MODIFY_RUNTIME_CURRENT
- MODIFY_UNIVERSE_MAP_CURRENT
- MODIFY_TOKEN
- CREATE_BRANCH
- COMMIT
- PUSH
- OPEN_PR
- MERGE
- DISPATCH_CURSOR
- MODIFY_WORKQUEUE
- SCHEDULER
- DEPLOY
- REAL_KGEN

## Candidate Runtime Data Layout

The future minimum runtime data layout is:

```text
KGEN-KAIOS/governance/agents/runtime-v0.1/
  CURRENT_STATE.json
  AGENT_REGISTRY.json
  SESSION_REGISTRY.json
  lives/
  sessions/
  handoffs/
  evidence/
  archive/
```

This architecture draft does not create live registry state. It specifies the shape and gates that a future approved implementation must use.

No `secrets/` folder is allowed.

Forbidden stored content:

- Token
- Password
- Private Key
- Mnemonic
- Wallet Seed
- Full environment variable dump

## Boot Input

Company Boot receives:

- `life_id`
- `instance_id`
- `conversation_channel`
- `parent_handoff_id`
- `assigned_workorder`
- `base_main_sha`
- `capability_grant_id`
- `attestation_id`

## Verification Order

1. Agent Life exists.
2. Attestation is valid.
3. Capability Grant is valid.
4. Capability has not been revoked.
5. Session Birth Record is unique.
6. Parent Handoff exists, or the session is a Human-authorized root session.
7. `CURRENT_STATE` parses.
8. `current_main_sha` verifies against repository state.
9. WorkOrder status is valid.
10. Protected paths are readable.
11. Secret Boundary passes.
12. Session Lock rules pass.

If any step fails, boot result is `COMPANY_BOOT_FAILED` and the session may not continue beyond read-only evidence and handoff.

## Required Boot Result

Boot must output:

- `company_boot_status`
- `life_id`
- `instance_id`
- `attestation_status`
- `capability_status`
- `current_main_sha`
- `expected_main_sha`
- `main_sha_match`
- `current_baseline_id`
- `parent_handoff_status`
- `assigned_workorder_status`
- `session_lock_status`
- `open_blockers`
- `authorized_actions`
- `forbidden_actions`
- `evidence_ids`
- `booted_at`

## V0.1 Read-Only Audit

The only allowed test task reads:

- KAIOS AI Agent Life Architecture Baseline
- Company Status
- Current Main SHA
- Latest Recovery Point
- Latest Handoff
- Current WorkOrder

Then it outputs `READ_ONLY_BOOT_AUDIT_RESULT`.

It must not modify product files.

## Session Close

Session close must:

1. Create a Handoff Record.
2. Record `files_read`.
3. Record evidence.
4. Record unfinished items.
5. Record next steps.
6. Record forbidden next actions.
7. Mark Session status `ARCHIVED`.
8. Release Session Lock.
9. Record `ending_main_sha`.

## Architecture Boundary

V0.1 may design schemas and test cases. It may not implement scheduler behavior, background execution, automatic session creation, Cursor dispatch, WorkQueue dispatch, product UI, token changes, Real KGEN, deployment, merge automation, or live Runtime CURRENT updates.

## Result

READY_FOR_HUMAN_RUNTIME_REVIEW
