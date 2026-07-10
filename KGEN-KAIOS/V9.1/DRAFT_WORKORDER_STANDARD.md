# DRAFT WorkOrder Standard

**Document ID:** KAIOS-V9.1-DRAFT-STANDARD  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Required fields for any AI-generated DRAFT WorkOrder.

## 1. Definition

A DRAFT WorkOrder is an AI-generated task proposal. It is not executable work. It has no authority to modify files, open a branch, assign a worker or change the main WorkQueue until Codex promotes it.

## 2. Required Fields

| Field | Requirement |
|---|---|
| `task_id` | Unique WorkOrder identifier. |
| `decision_id` | Source AI decision identifier. |
| `reason` | Clear reason tied to observed state. |
| `priority` | P0, P1, P2, P3 or P4. |
| `risk_level` | R0, R1, R2, R3 or R4. |
| `dependencies` | Files, reports, branches or prior tasks required before execution. |
| `input_state` | Source state used by AI. |
| `expected_output` | Concrete output, not only intent. |
| `acceptance_criteria` | Verifiable completion rules. |
| `protected_paths` | Explicit protected path list. |
| `owner_suggestion` | Suggested worker type or ID. |
| `reviewer` | Required reviewer, normally Codex. |
| `branch_pattern` | Expected handoff branch pattern. |
| `report_path` | Expected report path. |
| `legal_review_required` | Boolean. |
| `security_review_required` | Boolean. |
| `human_review_required` | Boolean. |
| `codex_review_required` | Boolean. |
| `status` | Must be `DRAFT` at creation. |

## 3. Evidence Requirement

Every DRAFT must trace back to:

- AI decision record.
- Source state.
- Observations.
- Assumptions.
- Risk score.
- Canon boundary.
- Dependencies.

Hidden chat memory is not sufficient evidence. GitHub documents, examples, reports and machine-readable JSON records are the formal source.

## 4. Acceptance Criteria Quality

Acceptance criteria must be observable. A criterion such as "improve the economy" is not acceptable. A valid criterion is: "produce a read-only report summarizing three simulation-only reserve stabilization options without modifying protected paths."

## 5. Branch and Report Rules

Each WorkOrder should have a unique branch and report path. Shared report paths are allowed only for grouped review reports and must be explicitly documented. If multiple WorkOrders point to the same report path without grouping, V9.1 marks them as `MERGE_CANDIDATE` or `NEEDS_REVISION`.

## 6. Promotion Constraint

A valid DRAFT may still be denied promotion if it duplicates an active task, lacks dependency evidence, exceeds risk permission, or asks a worker to touch protected paths.
