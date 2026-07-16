---
TITLE: "PrimeForge Company Autopilot Stop Conditions"
VERSION: "0.3.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Add fail-closed Company OS layer and Session checkpoint conditions."
ANCESTOR: "DECISION_ENGINE_STANDARD.md; WORKSPACE_POLICY.md; MAINTENANCE_MODE_STANDARD.md"
SOURCE_OF_TRUTH: true
---

# Company Stop Conditions

## Immediate Stop

| Condition | Blocked actions | Allowed actions |
|---|---|---|
| Missing Human Decision or task authority | Writes, claim, implementation | Read, classify, request decision |
| Required source missing | All task execution | Produce missing-source report |
| Source conflict | All affected actions | Preserve evidence and escalate |
| Human Main dirty | AI writes in Human Main | Read status; use isolated worktree |
| GitHub remote unhealthy | Remote-dependent approval, close/release, merge, push, deployment | Company Inbox, Human decisions, architecture, cached evidence review, health retry |
| Pending handoff review | New Cursor claim | Review existing handoff |
| Active claim | Second claim | Inbox-only registration |
| Missing Task Envelope | Worker execution or approval | Same-task metadata repair |
| Missing handoff package | Approval or closeout | Same-task metadata repair |
| Protected path requested | Write or merge | Protected-path proposal and Human review |
| Secret or private credential found | All propagation | Contain evidence without reproducing secret |
| Test/evidence failure outside scope | Scope expansion | Repair or Human decision |
| Implementation authorization absent | Implementation WorkQueue or code | Architecture and research only |
| Commit/push forbidden | Commit, merge, push | Uncommitted isolated proposal only |
| Company Session missing | All interpreted or state-changing work | Create neutral Session envelope |
| Company OS layer missing, reordered, or failed | All later state-changing work | Checkpoint evidence and report exact layer |
| Company Kernel module starts standalone | Module action and dispatch | Stop module; record provider divergence |
| Session checkpoint fails | Completion, release, merge, push, deployment | `FAILED_CLOSED_CHECKPOINT` |
| Layer 10 receives an implementation request without approval | Entire Session | `FAIL_CLOSED_IMPLEMENTATION_AUTHORITY`; no execution |
| Layer 13 Human Decision unresolved | Next action | `HUMAN_DECISION_REQUIRED` |

## Network Split Rule

GitHub Pages `200` does not make GitHub Remote healthy. DNS, `github.com:443`, HTTPS, remote Git, Actions and Pages are separate signals.

During `NETWORK_RETRY_MODE`, Codex retries health automatically and keeps Human messages flowing through Company Inbox. Local architecture, classification, evidence review and decision preparation may continue. Formal remote-dependent approval, WorkQueue closeout, lease release, merge, push and deployment wait until connectivity returns and exact refs are revalidated.

Network failure is an action-level block, not a Human-level block. Codex must not ask Human to run Git maintenance or repeatedly restate an already-recorded decision.

## Stop Output

```text
STATUS:
BLOCKED_REASON:
EVIDENCE:
AFFECTED_ACTIONS:
SAFE_ACTIONS:
RECOMMENDED_HUMAN_DECISION:
```

## Never Automatic

Architecture approval, protected runtime changes, Token changes, real payment, KYC/GPS, production deployment, main merge and main push always retain their existing Human/Codex gates.
