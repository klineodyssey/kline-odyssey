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

## 8. Option B Operating Company Candidate (2026-08-27)

This cumulative section records the current local engineering boundary without rewriting the historical V3.0 text above.

The Human Customer conditionally selected `OPERATING_AI_COMPANY`. The reproducible proposed price is `108888 KAIOS`, composed of:

- direct engineering: `65000`
- distinct review: `9680`
- CI and infrastructure: `3200`
- security: `6400`
- project management: `7200`
- risk reserve: `6000`
- contingency: `4408`
- company margin: `7000`

The five milestone amounts are `21778`, `27222`, `27222`, `21778`, and `10888 KAIOS`. They sum exactly to the proposed total. This is a Binding Proposal candidate, not a payment request, receipt, funded project, or recognized revenue.

The twelve Work Packages are Customer Gateway, Requirement Intake, Quote Engine, Delivery Estimator, WBS/Dispatcher, Acceptance/Escrow Model, K18888 Transfer Adapter, K11520 Trader Cell, Revenue/Payroll Accounting, Employment-as-Genesis Pipeline, Distinct QA Loop, and Company Dashboard. Their current aggregate estimate is `792` engineering hours.

Current safety state:

- `COMPANY_RECEIVABLE_ADDRESS = NOT_BOUND`
- `PROJECT_ESCROW = NOT_DEPLOYED`
- `PAYMENT_READY = NO`
- `REAL_REVENUE = 0`
- `CHAIN_WRITE = NO`
- `CURRENT_DISTINCT_T2_REVIEWER_CAPACITY = 0`
- `TARGET_DELIVERY = 2026-11-13T18:00:00+08:00, CONDITIONAL`

Safe local engineering preparation may continue. Project activation, payment, milestone release, final acceptance, and merge remain evidence-gated. Missing distinct Reviewer capacity blocks independent acceptance but does not create a fake Reviewer or authorize self-review.
