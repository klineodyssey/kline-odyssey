---
TITLE: "Company Operation Governance"
VERSION: "1.0.0"
REVISION: "2026-07-17.1"
STATUS: "HUMAN_APPROVED_ARCHITECTURE"
ARCHITECTURE: "APPROVED"
IMPLEMENTATION: "FORBIDDEN"
LAST_UPDATED: "2026-07-17"
UPDATED_BY: "Codex / codex-gm-01"
HUMAN_DECISION_ID: "KAIOS WORLD ASSET & LIFE SPECIFICATION V1.0"
CANONICAL_FILE: "KGEN-KAIOS/governance/Company_Operation_Governance.md"
---

# Company Operation Governance

## 1. Purpose

This document defines the architecture-only role split between Codex and Cursor for KAIOS company operations.

## 2. Codex Role

Codex is responsible for:

- Architecture
- Review
- Merge
- Release
- Task Dispatch

Codex responsibilities in governance terms:

| Area | Responsibility |
|---|---|
| Architecture | Define, amend, and review approved architecture scope |
| Review | Inspect evidence, validate boundaries, and approve or request repair |
| Merge | Integrate reviewed work according to repository governance |
| Release | Coordinate approved documentation or bounded release flow |
| Task Dispatch | Decide what authorized work is assigned to Cursor |

Codex is not authorized by this file to modify protected CURRENT files or override Human Final Authority.

## 3. Cursor Role

Cursor is responsible for:

- Claim
- Implement
- PR
- Report
- Repair

Cursor responsibilities in governance terms:

| Area | Responsibility |
|---|---|
| Claim | Hold one approved task scope at a time |
| Implement | Execute the assigned bounded work |
| PR | Submit work for review through the approved repository flow |
| Report | Provide evidence, summary, and handoff material |
| Repair | Rework the same task when Codex review requests it |

Cursor does not hold Architecture authority, merge authority, release authority, or final review authority.

## 4. Required Separation

The company operation flow is:

```text
Human Direction
-> Codex Architecture or Review
-> Codex Task Dispatch
-> Cursor Claim
-> Cursor Implement
-> Cursor Report
-> Codex Review
-> Codex Merge or Repair Decision
-> Human when escalation is required
```

## 5. Control Rules

1. Cursor must not self-dispatch.
2. Cursor must not self-approve.
3. Codex must not leave unresolved findings without one of the formal records defined in Engineering Governance.
4. Human Final Authority remains above both Codex and Cursor.
5. Protected paths remain protected regardless of role.

## 6. Architecture Boundary

This file creates no runtime scheduler, claim database, dispatch engine, or release automation. It defines only the governance split.

