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

## 8. Autonomous Safe-Cycle Candidate

The first executable Company-cycle candidate is `runAutonomousCompanyCycle()` in `core/company/index.mjs`. It reuses the formal Worker Registry, WorkQueue, Review-first policy, task-envelope authority, branch policy and independent reviewer boundary.

The candidate is deterministic and separates planning from effects. It emits append-only machine events for `CLOCK_IN`, `WORK_ORDER`, `HANDOFF`, `REVIEW_REQUEST`, `BLOCKER_STATE` and `CLOCK_OUT`, while rejecting replayed cycle IDs. `REWORK_REQUIRED` returns to the explicit original authorized worker as a repair candidate; only a later `DELIVERY_SUBMITTED` record can request a new independent review. Every work candidate requires a registered, active, T2+ reviewer distinct from its worker.

`persistAutonomousCompanyCycle()` now records a safe cycle in the existing Company history stream instead of creating another queue or Company OS. Deterministic event IDs, payload hashes and the existing `previous_event_id` chain make replay visible and fail closed; `IndexedDbUniverseStore` provides browser persistence. `restoreAutonomousCompanyCycleState()` reconstructs prior cycle IDs and the latest clock-out result after restart.

`readLatestRepositorySnapshot()` is the first read-only Company eye. At clock-in it obtains the repository default branch, current main SHA and time, active PR head/state, divergence and named exact-head check runs from GitHub. Bearer credentials may only be sent to the canonical `https://api.github.com` origin; custom test adapters must run without a token. Missing, skipped-only, unrelated, failed or incomplete required checks cannot produce `PASS`. It has no mutation, merge, branch-push, signer or chain method. A failed or malformed GitHub response produces no fabricated snapshot.

`runAutonomousCompanyReadOnlyCycle()` composes the eye, exact-head CI gate, planner and durable Company history into one invocation-driven cycle. It requires the expected head, open PR, `behind_main = 0` and named passing checks before planning, then re-reads main and the PR head immediately before persistence. A moving repository or stale/incomplete CI leaves no durable cycle event. Neither function can claim a task, wake a worker, wake a reviewer or mutate GitHub.

`createLocalSqliteClaimRegistrySimulator()` implements the approved migration step for a one-host SQLite state-machine test only. It uses transactional unique active locks, compare-and-swap `record_version`, monotonic fencing tokens, review custody, same-worker repair lineage, reconciled close/release and an append-only operation ledger. Its public authority marker is always `LOCAL_SQLITE_SIMULATOR_NOT_AUTHORITY`; it cannot dispatch or wake a worker and is not the selected shared SQL Claim Registry service.

The Universal Exchange verification job uses Node 24 so exact-head CI executes the built-in `node:sqlite` tests. The scheduled Digital Ant public worker remains on Node 20; this candidate does not change its production execution runtime.

The cycle still cannot persist a shared authoritative Claim, start an employee, mutate GitHub, merge, push `main`, pay, access a private key, deploy or send a transaction. Those connectors remain independently gated.

Current connection state:

- General Manager read/plan/persist clock-in: `CANDIDATE_IMPLEMENTED_INVOCATION_REQUIRED`
- safe job selection: `CANDIDATE_IMPLEMENTED`
- durable Company cycle memory: `LOCAL_CANDIDATE_IMPLEMENTED_EXISTING_STORE`
- latest repository self-discovery: `READ_ONLY_CANDIDATE_IMPLEMENTED`
- exact-head CI observer: `READ_ONLY_ON_INVOCATION_IMPLEMENTED`
- local SQLite Claim state-machine simulator: `IMPLEMENTED_SANDBOX_ONLY`
- shared transactional Claim authority: `NOT_CONNECTED`
- employee wake: `EXISTING_CURSOR_WORKFLOW_PRESENT_NOT_CONNECTED_TO_CYCLE`
- independent review trigger: `NOT_CONNECTED`
- background scheduler: `NOT_RUNNING`
- Human sovereign override and emergency stop: `PRESERVED`
