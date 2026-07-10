# AI Decision Model

**Document ID:** KAIOS-V9.0-AI-DECISION-MODEL  
**Status:** Draft for Review / Prototype

## 1. Purpose

The AI Decision Model defines the official output contract for any V9.0 AI decision. A decision is not an action. A decision is a traceable recommendation package that waits for review.

## 2. Required Fields

Every decision must include:

- `decision_id`
- `timestamp`
- `source_state`
- `observations`
- `assumptions`
- `risks`
- `confidence`
- `recommended_action`
- `rejected_alternatives`
- `required_human_review`
- `required_codex_review`
- `proposed_workorders`
- `status`

## 3. Decision Types

- Citizen support.
- Business expansion.
- Resource reallocation.
- Temple upgrade.
- Land development.
- Market stabilization.
- Bank reserve warning.
- Governance response.
- Event response.
- Migration recommendation.
- Technology investment.
- WorkOrder priority change.

## 4. Decision Status

| Status | Meaning |
|---|---|
| `Draft` | AI created a decision and no review has started. |
| `CodexReviewRequired` | Codex must review before any action. |
| `HumanReviewRequired` | Human and Codex review are both required. |
| `Blocked` | Risk is too high or evidence is insufficient. |
| `ApprovedForWorkOrder` | Codex approved conversion to WorkOrder. |
| `Archived` | Decision is retained as memory but no action continues. |

## 5. Rejected Alternatives

AI must list rejected alternatives so reviewers can see that the recommendation is not a single-path assertion. Each rejected alternative should include a reason and risk note.
