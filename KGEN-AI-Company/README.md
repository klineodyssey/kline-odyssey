# KGEN AI Company Automation V5.0

**Status:** Active / Draft for Review
**Manager:** Codex
**Employee:** Cursor
**Primary Queue:** `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
**Report Center:** `KGEN-AI-Company/reports/`
**Review Log:** `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

KGEN AI Company turns KGEN Organization V2.0 from a document organization into a working AI company. Codex manages the company. Cursor works as the execution employee. GitHub files are the only handoff center.

> **Routing (ORG-P2-003 D2/D3):**  
> This folder is the **live company operating system**.  
> `KGEN-Agent-Office/` is the daily operations desk (protected paths, prompts, legacy templates).  
> Primary report intake is `KGEN-AI-Company/reports/`.

## First Day Startup

The human operator only needs to paste this into Cursor Agent:

```text
gi，上班
```

After that, Cursor must pull `origin/main`, read the AI Company boot files, find the first OPEN WorkOrder, move it to IN_PROGRESS, execute it, write a report, push `cursor-handoff/<Task-ID>`, move it to REVIEW, and wait for Codex.

## Operating Files

| File | Purpose |
|---|---|
| `AI_COMPANY_OPERATING_SYSTEM.md` | Company-level operating model |
| `CODEX_MANAGER_PROTOCOL.md` | Codex management protocol |
| `CURSOR_EMPLOYEE_BOOT.md` | Cursor first-day boot sequence |
| `CURSOR_AUTO_WORK_PROTOCOL.md` | Cursor continuous work protocol |
| `CURSOR_DISPATCHER_V4.md` | V4 dispatcher mode for one-command task pickup |
| `CURSOR_ONE_COMMAND_START.md` | Exact `gi，上班` startup behavior |
| `CODEX_DISPATCHER_PROTOCOL.md` | Codex review and dispatch responsibilities |
| `WORKQUEUE_EXECUTION_RULES.md` | How Cursor scans for the first OPEN task |
| `CURSOR_POLLING_RULES.md` | Safe polling cadence |
| `CURSOR_REPORTING_RULES.md` | Report requirements |
| `CODEX_REVIEW_AND_MERGE_RULES.md` | Review, approve, reject, merge, push rules |
| `WORKORDER_LIFECYCLE.md` | OPEN to DONE lifecycle |
| `WORKSPACE_POLICY.md` | Human Main, Cursor Worker, and Codex Review workspace rules |
| `WORKTREE_SETUP.md` | Minimum worktree layout and checklist |
| `WORKTREE_RECOVERY.md` | Recovery steps for missing branches, dirty trees, conflicts, and incomplete handoffs |
| `HUMAN_OPERATOR_GUIDE.md` | Short human instructions |
| `reports/README.md` | Cursor and Codex report center |
| `scripts/` | Copy-paste operating scripts for Cursor and Codex |

## Non-Negotiable Rule

Cursor does not rely on chat memory. Cursor reads GitHub WorkQueue and GitHub files. Codex reviews every report before commit or push.

## Cursor Handoff Branch Workflow

V5.0 formally adopts Cursor Handoff Branch Workflow. Cursor pushes only `cursor-handoff/<Task-ID>`. Codex fetches that branch, reviews the diff and report, and only Codex merges approved work into main.

- Workflow: `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md`
- Codex dispatcher: `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md`
- Lifecycle: `KGEN-AI-Company/WORKORDER_LIFECYCLE.md`

## Workspace Policy

KGEN AI Company uses the minimum workspace governance model:

- Human Main Workspace: `C:\Desktop\kline-odyssey`, reserved for human daily work. AI agents do not commit, merge, reset, stash, push, or delete files there by default.
- Cursor Worker Workspace: Cursor executes one WorkOrder and pushes only `cursor-handoff/<Task-ID>`.
- Codex Review Workspace: `C:\Desktop\kline-odyssey-codex-review`, kept clean for fetch, review, merge, and push.

If Human Main has uncommitted files, agents list them and continue from the Codex Review Workspace. If Cursor forgets to push a handoff branch, Codex does not review and the task remains BLOCKED until `cursor-handoff/<Task-ID>` is visible on origin.

- Policy: `KGEN-AI-Company/WORKSPACE_POLICY.md`
- Setup: `KGEN-AI-Company/WORKTREE_SETUP.md`
- Recovery: `KGEN-AI-Company/WORKTREE_RECOVERY.md`
