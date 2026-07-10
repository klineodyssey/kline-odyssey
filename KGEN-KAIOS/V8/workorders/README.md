# KAIOS V8.0 WorkOrders

This directory stores executable V8.0 WorkOrders for Cursor or another registered KAIOS Worker.

## Files

| File | Purpose |
|---|---|
| `V8_WORKORDERS.md` | V8-P0 through V8-P15 WorkOrders with owner, reviewer, branch, report path, acceptance criteria, legal/security review flags, and protected paths. |

## Execution Model

Workers must use the Cursor Handoff Branch Workflow or an equivalent KAIOS-approved handoff branch. The Worker commits to `cursor-handoff/<Task-ID>`, pushes the branch, writes a report under `KGEN-KAIOS/V8/reports/`, and stops for Codex review.

No Worker may push `main` directly.