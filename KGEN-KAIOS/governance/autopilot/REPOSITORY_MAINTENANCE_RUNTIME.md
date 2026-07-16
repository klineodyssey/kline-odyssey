---
TITLE: "PrimeForge Repository Maintenance Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Move routine repository health, synchronization and recovery responsibility from Human to Codex governance."
ANCESTOR: "MAINTENANCE_MODE_STANDARD.md; GITHUB_CONNECTIVITY_RUNBOOK.md; WORKSPACE_POLICY.md"
SOURCE_OF_TRUTH: true
---

# Repository Maintenance Runtime

## Responsibility Boundary

Human PrimeForge focuses on Architecture, Idea, Decision, Approval, and Review. Codex is responsible for repository observation, fetch, compare, safe synchronization, handoff review, lease disposition, queue reconciliation, Actions/Pages health, and network recovery.

This is an architecture proposal. No daemon, scheduled job, service, credential, implementation WorkQueue, commit, push, or deployment is created in this round.

Repository Maintenance Runtime is registered by Company Kernel at Layer 1 and executes its health/fetch/compare responsibilities at Layer 6. It cannot self-start from a provider prompt and cannot bypass the Session checkpoint.

## States

| State | Meaning |
|---|---|
| `IDLE` | No maintenance action due |
| `HEALTH_CHECK` | DNS, TCP 443, HTTPS, remote Git, Actions and Pages are measured separately |
| `HEALTHY` | Required remote signals pass |
| `DEGRADED` | Some non-critical signal is stale or unavailable |
| `NETWORK_RETRY_MODE` | Remote-dependent actions pause; retries continue |
| `NETWORK_RECOVERY` | Connectivity returned and refs must be refreshed |
| `FETCHING` | Fetch/prune runs in a clean Codex workspace |
| `COMPARING` | Local, origin/main, handoff tips, commits and pending patches are compared |
| `SYNC_VALIDATING` | Fast-forward eligibility, dirty state, RSS changes, protected paths and conflicts are checked |
| `REVIEW_REQUIRED` | Changed handoff evidence invalidates an earlier review |
| `CLOSEOUT_READY` | Reviewed state is ready for separately authorized formal update |

## Maintenance Cycle

```text
HEALTH_CHECK
-> FETCHING
-> COMPARING
-> REVIEW_REQUIRED or SYNC_VALIDATING
-> CLOSEOUT_READY
-> IDLE
```

On network failure:

```text
HEALTH_CHECK
-> NETWORK_RETRY_MODE
-> NETWORK_RECOVERY
-> FETCHING
-> COMPARING
```

## Health Checks

1. DNS resolution for `github.com`.
2. TCP port 443.
3. GitHub HTTPS.
4. `git ls-remote origin`.
5. `git fetch origin --prune` when reachable.
6. latest `origin/main` and handoff tips.
7. GitHub Actions latest run and conclusion.
8. GitHub Pages required route health.
9. local worktrees, pending commits, pending pushes, and dirty state.
10. protected-path diff and JSON/JSONL integrity.
11. cross-ref claim overlap and canonical claim-lock consistency.

## Retry Policy

The proposed retry schedule is `15s, 30s, 60s, 5m, 15m`, then every 15 minutes with bounded jitter. A Human manual request triggers an immediate check. Each attempt records timestamp, health dimensions, result, next retry, and affected remote actions.

`NETWORK_RETRY_MODE` does not block Inbox capture, Human decisions, architecture work, local review, or local evidence. It blocks only actions whose correctness depends on current remote state.

## Safe Synchronization

- Never run pull, reset, stash, clean, merge, or write operations in dirty Human Main.
- Use an isolated clean Codex maintenance/review worktree.
- Fetch first, then compare exact SHAs and merge bases.
- A pull-equivalent update must be explicit fast-forward only.
- Preserve remote RSS automation and unrelated Human changes.
- Never force push.
- Never delete remote handoff branches automatically.
- Changed handoff tips invalidate stale approval evidence and return to Review.
- Conflicting branch-local claims block dispatch and generate a claim-overlap decision.
- Divergence or conflict produces a report and bounded repair; it does not trigger an automatic history rewrite.

## Review, Close, and Release

Repository Maintenance may prepare and validate review closeout. Formal queue update, claim close/release, merge, and push still require the existing Codex authority, complete evidence, and task-specific authorization. Architecture approval alone is not push authority.

## Secret Boundary

The module stores no GitHub token, API key, password, private key, seed phrase, private KYC data, or private GPS data. It may consume credentials supplied by the approved local execution environment without reading or persisting their values.

## Current Observation

At `2026-07-15T16:54:24+08:00`, DNS, TCP 443, GitHub HTTPS, remote Git, Actions, Pages, and `git fetch origin --prune` passed. `origin/main` remained `7a692c34df50861ab10f8bd80959d95251b1071c`. Thirteen open draft PRs were observed and left unchanged in this architecture-only round. Two handoff refs changed during fetch and six other July 15 refs were not yet recorded in the Review Log; all eight overlap the `ORG-P2-003F-FIX1` claim window and lack a task-specific Task Envelope/Handoff pair. They are evidence-only and not merge candidates.
