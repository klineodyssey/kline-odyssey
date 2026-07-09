# KGEN AI Company Operating System

**Version:** V3.0  
**Status:** Active / Draft for Review  
**Source:** KGEN Organization V2.0, Agent Office, Machine-Readable Canon

## 1. Company Model

KGEN AI Company is a GitHub-native work system. It treats Codex as management and Cursor as employee. The company does not depend on private memory, repeated human prompts, or hidden chat context.

## 2. Management Layer

Codex is the management layer. Codex creates tasks, splits WorkOrders, updates GitHub WorkQueue, reviews Cursor reports, decides whether changes are accepted, commits approved changes, pushes to origin/main, and reports to the user.

## 3. Employee Layer

Cursor is the employee layer. Cursor reads the WorkQueue, accepts one OPEN task, marks it IN_PROGRESS, performs scoped work, writes a report, marks the task REVIEW, and waits for Codex.

## 4. Handoff Layer

GitHub is the only handoff center. The live queue is `KGEN-Organization/WorkOrders/WORK_QUEUE.md`. Cursor reports are stored in `KGEN-AI-Company/reports/`. Codex review records are stored in `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.

## 5. Canon Layer

All work must obey Boot V1.4, Runtime CURRENT, Universe Map, AGENTS, `KGEN-Canon/KGEN_CANON_MASTER.json`, Genesis Library, Runtime Library, SDK Library, and Organization V2.0.

## 6. Protected Layer

No AI Company task may modify contracts, $templePath, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or KGEN Token contract without explicit human authorization.

## 7. Daily Rhythm

Cursor checks the queue every 10 minutes, writes progress every 2 hours, writes integration status every 10 hours, and writes a daily report every 24 hours. Codex reviews every REVIEW task.
