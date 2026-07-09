# Cursor Reporting Rules

Every Cursor task must produce a report under `KGEN-AI-Company/reports/`.

## Required Fields

- Task ID
- Date
- Base Commit
- Start Status
- End Status
- Files Read
- Files Modified
- Protected Paths Checked
- Summary
- Checks Run
- Risks
- Blockers
- Recommendation
- Need Codex Review
- Need Human Decision

## Report Timing

Cursor creates the report file when it accepts a task and completes the report before moving the task to REVIEW.

## No Silent Work

If Cursor changes files but does not write a report, the task is not acceptable.