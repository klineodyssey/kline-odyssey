# AI Agent Standard

**Document ID:** KAIOS-V10-AI-AGENT-STANDARD  
**Version:** V10.0  
**Status:** Operating Standard

AI Agents operate through GitHub, WorkQueue, reports, handoff branches and Codex Review. They do not rely on hidden chat memory as source of truth.

## Agent Roles

| Role | Authority |
|---|---|
| Human | Final override |
| Codex | Chief reviewer, dispatcher, merge authority |
| Cursor | Worker and QA agent |
| Claude / Gemini / OpenHands / Copilot | Future workers |
| Deep Research | Research-only worker |

## Rules

- Worker cannot push main.
- Worker cannot modify protected paths without explicit WorkOrder and review.
- Worker must produce report.
- Codex must review branch, report, protected paths and Canon.
- Human can pause, reject, re-hold or override.

