# Audit Log Standard

**Document ID:** KAIOS-V9.1-AUDIT-LOG  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Mandatory audit event format for WorkOrder review state transitions.

## 1. Purpose

The audit log preserves traceability across AI decisions, Codex reviews, Human gates, WorkQueue status changes and final outcomes. It prevents silent promotion and makes every state transition reviewable.

## 2. Required Audit Fields

| Field | Requirement |
|---|---|
| `audit_id` | Unique audit event ID. |
| `timestamp` | UTC timestamp in ISO 8601 format. |
| `actor` | Actor that made the decision. |
| `actor_role` | AI, Codex, Human, Worker or System. |
| `related_decision_id` | Source AI decision ID. |
| `related_workorder_id` | WorkOrder ID. |
| `previous_status` | Previous WorkOrder status. |
| `new_status` | New WorkOrder status. |
| `risk_level` | R0-R4. |
| `decision` | Promote, revise, reject, block, archive or informational. |
| `reason` | Human-readable reason. |
| `evidence` | Files or reports used as evidence. |
| `requires_human_review` | Boolean. |
| `requires_codex_review` | Boolean. |

## 3. Audit Rules

- Every transition from `DRAFT` must be recorded.
- Every promotion to `OPEN` must reference a Codex promotion decision.
- Every Human override must include previous and new status.
- Every rejection or archive must include a closure reason.
- Audit records must be append-only in practice. Corrections are new audit events, not silent edits.

## 4. Official Report Location

V9.1 review audit records are summarized in:

`KGEN-KAIOS/V9.1/reports/V9_1_AUDIT_LOG.md`

Machine-readable audit examples are stored in:

`KGEN-KAIOS/V9.1/examples/audit_event.example.json`
