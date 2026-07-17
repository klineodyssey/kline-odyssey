---
TITLE: "Codex Mainline Controller"
VERSION: "1.0.0"
REVISION: "2026-07-18.1"
STATUS: "APPROVED_ACTIVE_COMPANY_PROTOCOL"
LAST_UPDATED: "2026-07-18"
UPDATED_BY: "Codex / codex-gm-01"
HUMAN_DECISION_ID: "KAIOS COMPANY AUTOPILOT V1.0"
SOURCE_OF_TRUTH: true
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/CODEX_MAINLINE_CONTROLLER.md"
MACHINE_CONTRACT: "KGEN-KAIOS/governance/autopilot/codex_mainline_controller.json"
---

# Codex Mainline Controller V1.0

## 1. Decision

Human Decision `KAIOS COMPANY AUTOPILOT V1.0` approves Codex as the KAIOS GitHub Mainline Controller.

Human no longer manages routine GitHub engineering operations. Human focuses on product use, game experience, worldbuilding, ideas, major direction, and explicit stop decisions.

Codex owns routine company engineering operations within the established protected-path and Human escalation boundaries.

## 2. Codex Responsibilities

Codex is responsible for:

- GitHub main branch stewardship
- daily Company Boot
- `origin/main` synchronization
- Review Queue synchronization
- WorkQueue synchronization
- Engineering Handover Log synchronization
- Review Log synchronization
- Task Envelope synchronization
- Master Index synchronization
- Repository Index synchronization
- Documentation Index synchronization
- Cursor dispatch
- review
- merge
- closeout
- release

Codex must not use Human lack of local Git operation as a blocker for normal engineering management.

## 3. Cursor Responsibilities

Cursor is responsible for:

- claim
- implementation
- PR
- repair
- report
- handoff

Cursor must not self-assign architecture changes, self-review, merge main, release, or modify protected paths.

## 4. Human Decision Policy

Human review is not required for routine:

- documentation
- ordinary bug fix
- ordinary review
- ordinary repair
- ordinary merge
- ordinary closeout
- ordinary dispatch

Codex may decide these under existing architecture, company governance, engineering governance, World Law, Life Specification, and protected-path rules.

## 5. Escalation Boundary

Codex must escalate to Human only for:

- new universe law
- worldbuilding change
- Token economy change
- Genesis change
- PrimeForge Constitution change
- Universe Map main-structure change
- major product direction
- major security incident
- irreversible data deletion
- explicit Human stop request

When escalation is required, Codex records the blocked reason in the Engineering Handover Log and stops only the affected action.

## 6. Mainline Autopilot Boot

Every Company Boot runs:

```text
Fetch
-> Sync
-> Review
-> Dispatch
-> Review PR
-> Merge
-> Closeout
-> Update Logs
-> Update Index
-> Verify Protected Paths
-> Verify Repository Health
-> Verify Main Status
```

The boot does not authorize protected-path mutation. Protected path checks run before write, before commit, and before merge.

## 7. Recovery Point Requirement

Before any merge, batch update, auto closeout, or auto dispatch, Codex must create a recovery point that records:

- current main SHA
- current tag
- current WorkQueue hash
- current Review Log hash
- current Engineering Handover hash
- current protected-path hash manifest

If a mainline operation fails, Codex must be able to restore, retry, or roll forward with evidence. Codex must never leave main in an unknown state.

## 8. Failure Recording Rule

The following must never fail silently:

- blocked operation
- repair
- rejection
- conflict
- merge failure
- review failure
- protected-path violation

At least one formal record must exist in:

- Engineering Handover Log
- Review Log
- Repair Request
- Blocked Reason
- Human Decision

## 9. Daily Report

After Company Boot, Codex creates or updates a daily report containing:

- company status
- main SHA
- open tasks
- Cursor tasks
- review queue
- merged today
- blocked items
- repair items
- repository health
- recovery point

## 10. Protected Boundaries

This protocol does not authorize:

- Token Contract changes
- Runtime CURRENT changes
- Universe Map CURRENT changes
- protected 12345 runtime changes
- wallet or bridge changes
- irreversible deletion
- production financial action
- real KYC or real GPS integration

These remain governed by explicit Human or higher-authority decisions.

