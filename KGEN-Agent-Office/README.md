# KGEN Agent Office

KGEN Agent Office is the official GitHub handoff system for Codex and Cursor work inside the KLINE ODYSSEY repository.

Codex is the command controller. Codex owns task planning, specification alignment, review, GitHub commits, and pushes.

Cursor is the construction and QA agent. Cursor executes assigned WorkQueue items, checks files, applies approved document-only fixes, validates output, and reports results back to Codex.

All work is handed off through GitHub files. Agents must not rely on oral memory, hidden chat context, or local-only assumptions.

## AI Company Automation

KGEN AI Company Automation V4.0 is the active Codex-managed Cursor work system. Cursor should use Agent Office for protected paths and prompt discipline, then use AI Company and Organization WorkQueue for live work.

- AI Company: `KGEN-AI-Company/README.md`
- Cursor employee boot: `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- Auto work protocol: `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- Live WorkQueue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- Cursor reports: `KGEN-AI-Company/reports/`
- Codex review log: `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

## Cursor Start Order

Every time Cursor starts work, it must read these files in order:

1. `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
2. `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
3. `KGEN-AI-Company/CURSOR_POLLING_RULES.md`
4. `KGEN-Agent-Office/CURSOR_AGENT_PROMPT.md`
5. `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`
6. `KGEN-Agent-Office/CURSOR_DAILY_WORKFLOW.md`
7. `KGEN-Agent-Office/DO_NOT_TOUCH.md`
8. `KGEN-Canon/KGEN_CANON_MASTER.json`
9. `KGEN_MASTER_LIBRARY_INDEX.md`

## Office Files

| File | Purpose |
|---|---|
| `CODEX_COMMAND_CENTER.md` | Codex operating protocol and command flow |
| `CURSOR_ONBOARDING.md` | Human-facing Cursor startup instructions |
| `CURSOR_DAILY_WORKFLOW.md` | Cursor daily and periodic workflow |
| `CURSOR_AGENT_PROMPT.md` | Full Cursor agent prompt |
| `CURSOR_WORK_QUEUE.md` | Current task queue for Cursor |
| `CURSOR_HANDOFF_LOG.md` | Shared handoff log format and active log |
| `CURSOR_REPORT_TEMPLATE.md` | Standard Cursor report template |
| `CODEX_REVIEW_PROTOCOL.md` | Codex review protocol for Cursor output |
| `AUTOMATION_SCHEDULE.md` | Suggested automation cadence |
| `DO_NOT_TOUCH.md` | Protected paths and forbidden operations |
| `reports/README.md` | Report folder policy |

## Governance

Agent Office extends Genesis Library, Runtime Library, SDK Library, and Machine-Readable Canon. It does not replace Canon, Runtime CURRENT, Boot V1.4, contracts, wallet, bridge, or existing temple runtimes.

