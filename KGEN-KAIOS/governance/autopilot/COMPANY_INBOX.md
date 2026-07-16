---
TITLE: "PrimeForge Company Inbox Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define a durable intake boundary so Human ideas and decisions are never lost or blocked by repository health."
ANCESTOR: "HUMAN_INBOX_ROUTER.md; DECISION_ENGINE_STANDARD.md"
SOURCE_OF_TRUTH: true
---

# Company Inbox

## Purpose

Company Inbox is the proposed intake ledger for every Human message. Intake happens before company maintenance; classification and execution happen after Company Boot and Daily Operation. A network failure may defer a remote action, but it must not reject Human creativity or require the Human to maintain Git.

Company Inbox is launched only by Company Kernel at Layer 1. The provider host may retain the raw invocation envelope before Layer 0, but it cannot classify or act on that envelope until the Kernel starts this module.

```text
Human Message
-> Capture Inbox Envelope
-> Acknowledge Receipt
-> Company Boot
-> Daily Operation
-> Priority Scheduler
-> Human Inbox Router
-> One Legal Action or Deferred State
```

This module does not create a WorkOrder, Claim, commit, push, deployment, or implementation authority by itself.

## Record Contract

Each record has:

- `inbox_id`
- `source_message_id`
- `human_decision_id`
- `received_at`
- `classification`
- `priority_class`
- `summary`
- `dependencies`
- `related_workorders`
- `related_workers`
- `remote_dependency`
- `active_task_conflict`
- `authorization_state`
- `routed_target`
- `status`
- `decision_record`
- `closed_at`

The Inbox stores governance metadata and a concise, non-secret summary. It must not copy tokens, private keys, passwords, seed phrases, private KYC data, exact private GPS data, or hidden credentials.

## States

| State | Meaning |
|---|---|
| `RECEIVED` | Envelope captured; no execution implied |
| `CLASSIFIED` | Router assigned a message class |
| `DEFERRED_ACTIVE_TASK` | Valid request waits behind one active Cursor task |
| `DEFERRED_NETWORK_ACTION` | Remote action waits while analysis may continue |
| `READY` | Required authority and dependencies are present |
| `IN_REVIEW` | Architecture, handoff, or Human review is active |
| `ROUTED` | Sent to the existing Decision, Review, Architecture, or WorkQueue authority |
| `HUMAN_DECISION_REQUIRED` | A protected or ambiguous decision needs Human authority |
| `CLOSED` | Result and evidence links are recorded |

## Intake Guarantees

1. Network failure never rejects a Human message.
2. A dirty Human Main never blocks read-only intake.
3. Duplicate messages link to the existing record instead of opening duplicate tasks.
4. An active Cursor claim sends new task requests to `DEFERRED_ACTIVE_TASK`.
5. Ideas remain ideas; architecture requests remain proposals; implementation requires explicit authorization.
6. `URGENT_STOP`, security incidents, secret exposure, and protected-path alerts are immediately escalated.
7. Every transition is append-only or superseding; history is not silently overwritten.

## Relationship to Human Inbox Router

Company Inbox owns durable intake and lifecycle. `HUMAN_INBOX_ROUTER.md` owns classification and routing. Neither replaces the Decision Log, WorkQueue, Claim Registry, or Review Log.

## Current Record

`HUMAN-COMPANY-AUTOMATIC-MAINTENANCE-001` is captured as `ARCHITECTURE_DECISION`, routed to this Autopilot architecture revision, and remains `IN_REVIEW`. Implementation is not authorized.
