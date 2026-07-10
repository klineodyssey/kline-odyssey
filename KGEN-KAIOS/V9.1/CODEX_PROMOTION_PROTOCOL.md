# Codex Promotion Protocol

**Document ID:** KAIOS-V9.1-CODEX-PROMOTION  
**Version:** V9.1  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Required review before `DRAFT -> APPROVED_FOR_OPEN -> OPEN`.

## 1. Promotion Authority

Codex is the only KAIOS actor that may promote an AI-generated DRAFT WorkOrder to executable `OPEN` status. Promotion is never automatic.

## 2. Mandatory 15-Point Promotion Checklist

Codex must verify every item before promotion:

| # | Check | Required Result |
|---|---|---|
| 1 | Decision ID exists | `decision_id` maps to a source AI decision. |
| 2 | Source State traceable | Source state is named and retrievable from files, examples or reports. |
| 3 | Reasoning complete | Observations, assumptions and recommendation are clear. |
| 4 | Risk Level correct | R0-R4 matches actual impact. |
| 5 | Canon conflict check | No conflict with Genesis, Canon, Runtime or KAIOS rules. |
| 6 | Duplicate WorkOrder check | Not a duplicate of an active task, or explicitly marked merge candidate. |
| 7 | Dependencies satisfied | Required source files, reports and prior tasks exist or are done. |
| 8 | Protected Paths correct | Protected paths are listed and no task asks a worker to modify them. |
| 9 | Acceptance Criteria verifiable | Criteria can be checked by Codex after worker handoff. |
| 10 | Owner valid | Suggested owner exists or is a valid worker class. |
| 11 | Reviewer valid | Reviewer is Codex or an approved reviewer. |
| 12 | Branch Pattern correct | Handoff branch follows the task ID pattern. |
| 13 | Report Path correct | Report path is unique or explicitly grouped. |
| 14 | Legal Review identified | Required legal review is not hidden. |
| 15 | Security / Human Review identified | Required security and Human reviews are explicit. |

## 3. Promotion Sequence

1. Move DRAFT to `UNDER_REVIEW`.
2. Run duplicate detection.
3. Run dependency validation.
4. Run risk review.
5. Run Canon and protected path review.
6. Record a promotion decision.
7. If approved, set `APPROVED_FOR_OPEN`.
8. Codex may then create or update the official WorkQueue entry as `OPEN`.

## 4. Promotion Output

Promotion must produce:

- Review Report
- Duplicate Check
- Dependency Check
- Risk Decision
- Promotion Decision
- Audit Log Event

## 5. Non-Promotion Cases

Codex must not promote if:

- Risk is R4.
- R3 lacks Human review.
- The WorkOrder duplicates an unresolved task.
- Dependencies are missing.
- The branch pattern or report path is unsafe.
- The task requires protected path modification.
- The WorkOrder makes legal, financial or brand claims without authority.
