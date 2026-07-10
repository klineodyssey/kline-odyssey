# KGEN Agent Office

KGEN Agent Office is the **daily operations desk** for Codex and Cursor inside the KLINE ODYSSEY repository. It owns protected-path discipline (`DO_NOT_TOUCH.md`), onboarding prompts, and legacy handoff templates.

**Stable Boot Entry:** `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
**Public Operating Center:** https://klineodyssey.github.io/kline-odyssey/operating-center/

> **Routing (ORG-P2-003 D2 KEEP):**
> Live company operating system = [`KGEN-AI-Company/`](../KGEN-AI-Company/README.md)
> Agent Office does **not** replace AI Company. Agent Office supports protected paths, prompts, and archaeology.

Codex is the command controller. Codex owns task planning, specification alignment, review, GitHub commits, and pushes.

Cursor is the construction and QA agent. Cursor executes assigned WorkQueue items, checks files, applies approved document-only fixes, validates output, and reports results back to Codex.

All work is handed off through GitHub files. Agents must not rely on oral memory, hidden chat context, or local-only assumptions.

## AI Company Automation

Live Codex-managed Cursor work runs through **KGEN AI Company Automation V5.0+**. Cursor uses Agent Office for protected paths and prompt discipline, then uses AI Company and Organization WorkQueue for live work.

- AI Company (live OS): `KGEN-AI-Company/README.md`
- Cursor employee boot: `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- Auto work protocol: `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- Live WorkQueue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- Primary reports: `KGEN-AI-Company/reports/`
- Codex review log: `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

## Cursor Start Order

Every time Cursor starts work, it must read these files in order:

1. `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
2. `KGEN-Canon/KGEN_CANON_MASTER.json`
3. `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
4. `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
5. `KGEN-AI-Company/CURSOR_POLLING_RULES.md`
6. `KGEN-Organization/WorkOrders/WORK_QUEUE.md` *(live queue)*
7. `KGEN-Agent-Office/DO_NOT_TOUCH.md`
8. `KGEN-Agent-Office/CURSOR_AGENT_PROMPT.md` *(prompt discipline)*
9. `KGEN_MASTER_LIBRARY_INDEX.md`

Do **not** treat `CURSOR_WORK_QUEUE.md` as a live task source. It is SUPERSEDED (ORG-P2-003A).

## Office Files

| File | Purpose |
|---|---|
| `CODEX_COMMAND_CENTER.md` | Codex operating protocol and command flow |
| `CURSOR_ONBOARDING.md` | Human-facing Cursor startup instructions |
| `CURSOR_DAILY_WORKFLOW.md` | Cursor daily and periodic workflow |
| `CURSOR_AGENT_PROMPT.md` | Full Cursor agent prompt |
| `CURSOR_WORK_QUEUE.md` | SUPERSEDED legacy queue — see Organization WorkQueue |
| `CURSOR_HANDOFF_LOG.md` | Shared handoff log format and active log |
| `CURSOR_REPORT_TEMPLATE.md` | Legacy report template (primary intake is AI-Company/reports) |
| `CODEX_REVIEW_PROTOCOL.md` | Codex review protocol for Cursor output |
| `AUTOMATION_SCHEDULE.md` | Suggested automation cadence |
| `DO_NOT_TOUCH.md` | Protected paths and forbidden operations |
| `reports/README.md` | Legacy report alias — primary path is AI-Company/reports |

## Governance

Agent Office extends Genesis Library, Runtime Library, SDK Library, and Machine-Readable Canon. It does not replace Canon, Runtime CURRENT, Boot CURRENT, contracts, wallet, bridge, or existing temple runtimes.

