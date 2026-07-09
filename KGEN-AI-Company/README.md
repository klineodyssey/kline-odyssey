# KGEN AI Company Automation V3.0

**Status:** Active / Draft for Review  
**Manager:** Codex  
**Employee:** Cursor  
**Primary Queue:** `KGEN-Organization/WorkOrders/WORK_QUEUE.md`  
**Report Center:** `KGEN-AI-Company/reports/`  
**Review Log:** `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

KGEN AI Company turns KGEN Organization V2.0 from a document organization into a working AI company. Codex manages the company. Cursor works as the execution employee. GitHub files are the only handoff center.

## First Day Startup

The human operator only needs to paste this once into Cursor Agent:

```text
gi，上班，啟動西遊記，專案開始。
```

After that, Cursor must pull `origin/main`, read the AI Company boot files, find the first OPEN WorkOrder, move it to IN_PROGRESS, execute it, write a report, move it to REVIEW, and wait for Codex.

## Operating Files

| File | Purpose |
|---|---|
| `AI_COMPANY_OPERATING_SYSTEM.md` | Company-level operating model |
| `CODEX_MANAGER_PROTOCOL.md` | Codex management protocol |
| `CURSOR_EMPLOYEE_BOOT.md` | Cursor first-day boot sequence |
| `CURSOR_AUTO_WORK_PROTOCOL.md` | Cursor continuous work protocol |
| `CURSOR_POLLING_RULES.md` | Safe polling cadence |
| `CURSOR_REPORTING_RULES.md` | Report requirements |
| `CODEX_REVIEW_AND_MERGE_RULES.md` | Review, approve, reject, merge, push rules |
| `WORKORDER_LIFECYCLE.md` | OPEN to DONE lifecycle |
| `HUMAN_OPERATOR_GUIDE.md` | Short human instructions |
| `reports/README.md` | Cursor and Codex report center |
| `scripts/` | Copy-paste operating scripts for Cursor and Codex |

## Non-Negotiable Rule

Cursor does not rely on chat memory. Cursor reads GitHub WorkQueue and GitHub files. Codex reviews every report before commit or push.
