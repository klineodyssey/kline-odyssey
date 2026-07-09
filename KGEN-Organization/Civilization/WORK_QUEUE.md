# Work Queue

**Department:** Civilization Office  
**Queue Rule:** Cursor starts only after Codex assigns a task or WorkOrders marks a task OPEN for this department.

| Task ID | Status | Title | Output |
|---|---|---|---|
| ORG-Civilization-001 | OPEN | Read department README, ROLE, RESPONSIBILITY, HANDOFF, and REPORT_TEMPLATE | Department readiness note |
| ORG-Civilization-002 | OPEN | Check related Canon links and protected path impact | Department link and risk report |
| ORG-Civilization-003 | REVIEW | Propose next department-specific WorkOrder without changing core systems | Proposal for Codex Review |

## Status Rules

- OPEN: Ready for Cursor to accept.
- IN_PROGRESS: Cursor is working and must not accept another task.
- REVIEW: Cursor has produced a report and Codex must review.
- DONE: Codex has accepted the result.