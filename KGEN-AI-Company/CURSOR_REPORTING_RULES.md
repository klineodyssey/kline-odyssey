# Cursor Reporting Rules

Every Cursor task must produce a report under `KGEN-AI-Company/reports/`.

## Required Fields

- Task ID
- Date
- Base Commit
- Branch
- Commit SHA
- Author Worker ID
- Start Status
- End Status
- Files Read
- Files Modified
- Protected Paths Checked
- Task Result
- Checks Run
- Problems Found
- Risks
- Technical Debt
- Evolution Opportunities
- Research Direction
- Suggested WorkOrders
- Do Not Do
- Blockers
- Recommendation
- Need Codex Review
- Need Human Decision

## Report Timing

Cursor creates the report file when it accepts a task and completes the report before moving the task to REVIEW.

## No Silent Work

If Cursor changes files but does not write a report, the task is not acceptable.

## R&D Suggestions

Cursor may propose follow-up WorkOrders in the report, but every suggestion must use `Status: PROPOSED`. Cursor must not edit the live WorkQueue to turn its own suggestion into `DRAFT`, `OPEN`, `IN_PROGRESS`, or `REVIEW`. Codex reviews suggestions and decides whether to create a formal WorkOrder.
