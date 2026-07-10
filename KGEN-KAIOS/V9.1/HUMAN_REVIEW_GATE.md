# Human Review Gate

**Document ID:** KAIOS-V9.1-HUMAN-GATE  
**Version:** V9.1  
**Status:** Draft for Review  
**Owner:** Human / Codex  
**Scope:** Human decisions for high-risk DRAFT WorkOrders.

## 1. Mandatory Human Review

Human review is required for:

- R3 WorkOrders.
- Any task involving legal, financial, regulated or real-world business commitments.
- Any task with brand, trademark, payment, identity, securities, banking or insurance implications.
- Any override of a Codex rejection or block.

R4 tasks cannot be promoted even with Human approval. They must be blocked, archived or rewritten as lower-risk analysis-only tasks.

## 2. Human Actions

Human may:

- `APPROVE`
- `REJECT`
- `PAUSE`
- `CHANGE_PRIORITY`
- `BLOCK`
- `ARCHIVE`

## 3. Required Human Review Record

| Field | Requirement |
|---|---|
| `review_id` | Unique review ID. |
| `reviewer` | Human reviewer name or role. |
| `timestamp` | ISO 8601 timestamp. |
| `decision` | Human action. |
| `reason` | Explanation. |
| `previous_status` | Previous status. |
| `new_status` | New status. |
| `risk_level` | R0-R4. |
| `related_decision_id` | AI decision ID. |
| `related_workorder_id` | WorkOrder ID. |

## 4. Human Override Boundary

Human may approve strategy and priority, but protected path changes, contract actions, token transfers, public legal commitments and production deployments still require the specific repository and operational procedures that govern those actions.
