# KAIOS AI Agent Boot Checklist

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Runtime Implementation: NOT_STARTED  
Cursor Dispatch: NOT_DISPATCHED

## Boot Inputs

Before work, each AI Agent Instance must read or verify:

- `AGENTS.md`
- PrimeForge Boot
- Current Company Context
- Current Baseline
- Current Work State
- Agent Registry
- Own Life Record
- Latest three related handoffs
- WorkQueue
- Codex Review Log
- Engineering Handover Log
- Company Status
- Latest Recovery Point
- Main SHA
- Assigned WorkOrder
- Risk Register
- Protected Paths
- Agent Identity Attestation
- Session Birth Record
- Capability Grant
- Revocation Status
- Session Lock
- Heartbeat Status
- Canonical Current-State Pointer
- Evidence Provenance Requirements
- Secret Access Boundary

## Boot Output

The session must output:

```text
COMPANY_BOOT_STATUS:
AGENT_LIFE_ID:
AGENT_INSTANCE_ID:
PARENT_HANDOFF:
MAIN_SHA:
BASELINE_STATUS:
CURRENT_WORK:
OPEN_BLOCKERS:
AUTHORIZED_ACTIONS:
FORBIDDEN_ACTIONS:
IDENTITY_ATTESTATION_STATUS:
SESSION_BIRTH_RECORD:
CAPABILITY_GRANT_STATUS:
REVOCATION_STATUS:
SESSION_LOCK_STATUS:
HEARTBEAT_STATUS:
STALE_SESSION_STATUS:
CURRENT_STATE_POINTER:
```

## PASS Criteria

- Life ID and Instance ID are both present and distinct.
- Parent handoff is known or explicitly `NONE`.
- Current main SHA is verified.
- Assigned WorkOrder is current, or no WorkOrder is assigned.
- Protected paths are known.
- Forbidden actions are known.
- Source integrity warnings are recorded.
- Relevant blockers are recorded.
- Identity is verified by registry, life record, attestation, birth record, grant and current main SHA.
- Session Birth Record is present.
- Capability Grant is current, scoped and not revoked.
- Session Lock is valid for write actions.
- Heartbeat is not stale.
- `CURRENT_STATE.json` is the unique current pointer, or the session remains read-only.
- Secret boundary is known and denies raw secret logging by default.

## FAIL Effects

If boot fails, the instance may not:

- modify files
- dispatch Cursor
- create WorkQueue
- approve review
- commit
- push
- merge
- deploy

## High-Risk Action Recheck

Before commit, push, open PR, review approval, merge, dispatch or deployment, the instance must revalidate:

- current main SHA
- current WorkOrder state
- current baseline
- capability grant
- revocation status
- session lock
- heartbeat
- latest Human decision

Failure produces `STALE_SESSION_BLOCKED`. Allowed actions become only `READ`, `SYNC`, `REVIEW_DRIFT`, `CREATE_HANDOFF` and `ESCALATE_HUMAN`.

Allowed after failed boot:

- report boot failure
- record blocker
- ask Human only when the blocker cannot be resolved from repository evidence

## Result

READY_FOR_BASELINE_REVIEW
