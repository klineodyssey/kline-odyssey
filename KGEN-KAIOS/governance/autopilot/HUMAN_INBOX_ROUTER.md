---
TITLE: "PrimeForge Human Inbox Router"
VERSION: "0.3.0"
REVISION: "2026-07-15.3"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-OS-BOOT-001"
CHANGE_REASON: "Route Human input only after Company Kernel starts Inbox and Company OS reaches Layer 7."
ANCESTOR: "KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md"
SOURCE_OF_TRUTH: "FALSE"
---

# Human Inbox Router

`COMPANY_INBOX.md` owns durable intake and lifecycle. This file owns classification and routing. Capture happens immediately; routing waits for Company Boot, Daily Operation and the Priority Scheduler.

## Categories

| Category | Default route |
|---|---|
| `ARCHITECTURE_DECISION` | Decision ledger, then Architecture Governance flow |
| `ARCHITECTURE_REQUEST` | Proposal only; no implementation |
| `IMPLEMENTATION_AUTHORIZATION` | Validate baseline, scope and current active task before WorkQueue |
| `REVIEW_REQUEST` | Review queue before inbox work |
| `BUG_REPORT` | Evidence intake; task proposal if not already covered |
| `CURSOR_TASK` | Queue candidate; no claim while another claim is active |
| `CODEX_TASK` | Codex scope and authority check |
| `GROK_REVIEW` | External review evidence; no merge authority |
| `COMPANY_OPERATION` | Daily Operation and company state handling |
| `URGENT_STOP` | Immediate stop and state preservation |
| `GENERAL_IDEA` | `IDEA_INBOX`; no implementation |

## Routing States

- `INBOX`
- `IDEA_INBOX`
- `ARCHITECTURE_REQUEST`
- `HUMAN_DECISION_PENDING`
- `NEXT_TASK_CANDIDATE`
- `BLOCKED_BY_ACTIVE_TASK`
- `BLOCKED_SOURCE_CONFLICT`
- `READY_FOR_GOVERNANCE_REVIEW`

## Active-Task Rule

When a Worker has an `ACTIVE`, `REVIEW` or `REPAIR` claim, a new Cursor-directed Human message is recorded only as inbox evidence. It cannot create a second claim, modify current scope or reorder the queue by chat alone.

## Duplicate Rule

The router checks task ID, source decision, output path, branch, report path, protected paths and unresolved dependencies. A duplicate is linked to the existing item rather than opened again.

## Current Human Message Classification

| Input | Classification | State |
|---|---|---|
| Company Autopilot governance | `ARCHITECTURE_DECISION` + `COMPANY_OPERATION` | `ARCHITECTURE_PROPOSAL_UNDER_REVIEW` |
| Automatic repository maintenance | `ARCHITECTURE_DECISION` + `COMPANY_OPERATION` | `ARCHITECTURE_PROPOSAL_UNDER_REVIEW` |
| Company OS Boot and Session | `ARCHITECTURE_DECISION` + `COMPANY_OPERATION` | `P0_AMENDMENT_UNDER_REVIEW` |
| ORG-P2-003F-FIX1 review instruction | `REVIEW_REQUEST` | `REPAIR_REQUIRED / SAME_TASK_CUSTODY` |
| Kernel Law direction | `ARCHITECTURE_REQUEST` | `ARCHITECTURE_INBOX_REGISTERED` |

## Kernel Law Architecture Inbox

```text
Inbox ID: ARCH-INBOX-KERNEL-LAW-20260715-001
Source: HUMAN-PRIMEFORGE-COMPANY-AUTOPILOT-001
Kernel Freeze: HOLD
Request: Universe Physics Laws / Kernel Law Layer
Kernel Count: remains six
Required invariants:
  Mass Conservation
  Energy Conservation
  Identity Uniqueness
  Ownership Integrity
  Time Ordering
  Life State Integrity
  Resource Conservation
  Economic Ledger Balance
  Evidence Before Reward
  No Unauthorized State Mutation
  Protected Path Integrity
  Human Final Authority
Map Direction: Coordinate Map -> Universe Physics Database
CURRENT Map Change: forbidden
Physics Runtime CURRENT Change: forbidden
Implementation: not authorized
Status: ARCHITECTURE_INBOX_REGISTERED / AWAITING REVIEW
```

This inbox record does not freeze Kernel V1, modify its current proposal, update Universe Map or authorize implementation.

## Network Rule

When remote Git is unhealthy, records requiring remote action use `DEFERRED_NETWORK_ACTION`. Records for Idea, Architecture, Decision, Approval, and Review remain accepted and visible. Connectivity recovery never changes their meaning; it only re-enables the remote action gate.
