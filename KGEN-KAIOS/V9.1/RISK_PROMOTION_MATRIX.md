# Risk Promotion Matrix

**Document ID:** KAIOS-V9.1-RISK-MATRIX  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Promotion rules by risk level.

## 1. Risk Levels

| Risk | Name | Meaning | Promotion Rule |
|---|---|---|---|
| R0 | Informational | Documentation, reading, status, indexing or non-executing analysis. | Codex may promote directly. |
| R1 | Low | Low-risk docs or read-only assets with no protected path impact. | Codex may promote. |
| R2 | Medium | Requires judgment, may affect architecture, WorkQueue, runtime design or public docs. | Codex Review required. |
| R3 | High | Legal, security, production, real-world business, regulated assets, user account or high-trust claims. | Codex + Human Review required. |
| R4 | Critical | Contract deployment, token transfer, real financial execution, protected path mutation, false partnership claim or irreversible production action. | Promotion forbidden. BLOCKED or ARCHIVED only. |

## 2. Human Review Gate

Human review is mandatory for:

- Any R3 task.
- Any task involving real-world legal commitments.
- Any task involving regulated finance, securities, insurance, banking or payment processing.
- Any task that could affect official token, contracts, protected paths or public identity.

## 3. R4 Hard Stop

R4 tasks cannot become `OPEN`. Codex may create a safety report, block the task, archive it, or create a lower-risk analysis-only DRAFT. Codex may not downgrade R4 merely to execute it.

## 4. Risk Reclassification

Codex may reclassify risk only with evidence. The review report must include:

- Original risk level.
- New risk level.
- Reason.
- Required reviews.
- Audit event.

## 5. Promotion Outcomes

| Outcome | Use Case |
|---|---|
| `APPROVED_FOR_OPEN` | WorkOrder passes all checks and may be converted to `OPEN`. |
| `NEEDS_REVISION` | Draft is promising but incomplete or ambiguous. |
| `REJECTED` | Draft is invalid, duplicative, unsafe or outside Canon. |
| `BLOCKED` | Draft is valid in principle but blocked by missing dependency, branch, report or Human/legal/security review. |
| `ARCHIVED` | Draft is closed and retained for audit. |
