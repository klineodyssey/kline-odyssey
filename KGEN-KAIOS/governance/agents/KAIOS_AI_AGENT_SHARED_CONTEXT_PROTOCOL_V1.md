# KAIOS AI Agent Shared Context Protocol V1.0

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Runtime Implementation: NOT_STARTED  
Cursor Dispatch: NOT_DISPATCHED

## Purpose

Shared context prevents each AI session from reinventing company reality. The repository is the durable context channel. Chat memory, browser cache and local assumptions are advisory only.

## Candidate Context Files

Future implementation may maintain:

- `CURRENT_STATE.json`
- `CURRENT_COMPANY_CONTEXT.md`
- `CURRENT_BASELINE.json`
- `CURRENT_WORK_STATE.json`
- `AGENT_REGISTRY.json`
- `SESSION_REGISTRY.json`
- latest handoff records
- message records
- incident records
- performance records

This V1 draft does not create those live files.

## Canonical Current-State Pointer

The only formal Agent current-state pointer is:

`KGEN-KAIOS/governance/agents/CURRENT_STATE.json`

This proposal does not create the live file. Future implementation must treat any other state summary as derived, not canonical.

Required fields:

- `current_main_sha`
- `current_baseline_id`
- `current_recovery_point`
- `active_workorders`
- `superseded_workorders`
- `active_agent_sessions`
- `revoked_sessions`
- `last_human_decision_id`
- `updated_at`
- `updated_by`
- `state_sha256`

If another file claims a conflicting `current_main_sha`, baseline or active session list, high-risk operations stop with `CURRENT_STATE_CONFLICT`.

## Context Classes

| Class | Examples | Consistency Need |
|---|---|---|
| Immutable Canon | Genesis baseline, Human decisions, protected invariants | Append-only / review-gated |
| Current Baseline | main SHA, approved registry states, recovery point | Strong read before action |
| Active Work State | WorkQueue, review queue, current task status | Strong read before dispatch/review |
| Evidence Ledger | handoffs, PR evidence, test reports | Append-only |
| Working Memory | notes, known risks, temporary context | Versioned and expirable |
| Telemetry | heartbeat, session presence, local status | Eventual consistency |

## Company Boot Context Load

Every session must read:

1. `AGENTS.md`
2. PrimeForge Boot
3. Current Company Context
4. Current Baseline
5. Current Work State
6. Agent Registry
7. Own Life Record
8. Latest three related handoffs
9. WorkQueue
10. Codex Review Log
11. Engineering Handover Log
12. Company Status
13. Latest Recovery Point
14. Main SHA
15. Assigned WorkOrder
16. Risk Register
17. Protected Paths

## Boot Output

The boot result must emit:

- `COMPANY_BOOT_STATUS`
- `AGENT_LIFE_ID`
- `AGENT_INSTANCE_ID`
- `PARENT_HANDOFF`
- `MAIN_SHA`
- `BASELINE_STATUS`
- `CURRENT_WORK`
- `OPEN_BLOCKERS`
- `AUTHORIZED_ACTIONS`
- `FORBIDDEN_ACTIONS`
- `IDENTITY_ATTESTATION_STATUS`
- `SESSION_BIRTH_RECORD`
- `CAPABILITY_GRANT_STATUS`
- `SESSION_LOCK_STATUS`
- `STALE_SESSION_STATUS`

## Failed Boot Rule

If Company Boot does not pass, the session may not:

- modify files
- dispatch
- commit
- push
- approve review
- merge
- release

It may only report the boot failure and required repair.

## High-Risk Action Recheck

Before commit, push, PR, review approval, merge, dispatch or deployment, the instance must re-read:

- `CURRENT_STATE.json`
- capability grant
- revocation list
- session lock and heartbeat
- latest Human decision
- WorkQueue state
- current main SHA

Stale or conflicting state produces `STALE_SESSION_BLOCKED`.

## Memory Provenance

Any remembered fact used for work must identify:

- source path or source message
- source SHA or timestamp
- confidence
- whether it was read this session
- whether it conflicts with current repository state

## Secret Boundary

Shared context must never contain raw secrets, private keys, wallet seed phrases, API tokens, KYC payloads, precise private GPS or full environment dumps. Only result-only evidence may be stored, with access reason, approver, start/end time and revocation status.

## Result

READY_FOR_BASELINE_REVIEW
