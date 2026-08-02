---
title: KAIOS AI Workforce 24H Scheduler
schedule_version: 1.0.0
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
status: ACTIVE
authority: CODEX_CONTROLLED
---

# KAIOS AI Workforce 24H Scheduler

Maximum execution window: `2026-08-02T09:35:00Z` through
`2026-08-03T09:35:00Z`.

The window is a maximum, not a claim of uninterrupted computation. Every
actual command, wait, service pause and completed PR is recorded in
`KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md`. Work may continue across goal
continuations while the platform supports it. No elapsed time is fabricated.

## Controller

- Controller: `codex-gm-01`
- Authority: audit, specification, implementation, review, merge and deploy
  within the user-authorized boundaries
- Repository concurrency: one Codex migration branch at a time
- Cursor concurrency: `ONE_TASK_AT_A_TIME`
- Cursor reviewer: `codex-gm-01`
- Mainline rule: synchronize after each merged PR

## Queue Policy

1. Select the first dependency-ready `QUEUED` package.
2. Create a bounded branch and Recovery point.
3. Open Draft, independently review and classify P0/P1/P2.
4. Repair P1/P2; stop on P0 or a mandatory boundary.
5. Mark Ready, merge, synchronize main and deploy when public files changed.
6. Verify production rather than inferring success from local tests.
7. Delete the completed branch and start the next dependency-ready package.

## Cursor Policy

Cursor receives exactly one registered task. When its current task completes,
Codex reviews every artifact, closes or merges it under candidate authority,
releases the claim and atomically dispatches the next approved item. Cursor
cannot rename authoritative software, change Canonical schemas, merge, deploy,
or approve itself.

Current Cursor task:

- `KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`
- branch `cursor-handoff/KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`
- output `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

The software-life manifest candidate task is queued behind the pre-existing
forest/agriculture queue. It does not preempt an active claim.

## Mandatory Stops

- P0 security issue
- real wallet, private key or mnemonic access
- real KGEN activation or on-chain transfer
- protected CURRENT conflict
- Constitution lineage overwrite
- destructive migration without recovery
- irreconcilable Canonical conflict
- repository access failure
- external autonomous execution
- Production authority activation

## Completion Modes

- `COMPLETE`: all approved packages merged, deployed where applicable,
  production verified and branches clean.
- `BACKLOG_EXHAUSTED`: no approved dependency-ready work remains.
- `WINDOW_LIMIT`: the maximum execution window elapsed; remaining queue is
  preserved without a false completion claim.
- `MANDATORY_GATE`: a stop condition occurred and evidence is preserved.
