---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Define deterministic stop conditions and escalation output for Cursor."
ANCESTOR: "KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: ExecutionSafety
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: CursorStopConditionsArchitecture
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/CURSOR_STOP_CONDITIONS.md"
---

# Cursor Stop Conditions Proposal

## 1. Mandatory Stops

Cursor immediately stops before further writes when any condition is true:

| ID | Condition |
|---|---|
| `STOP-001` | Human Decision is missing, ambiguous, expired or revoked. |
| `STOP-002` | CURRENT sources conflict or the active selector cannot be resolved. |
| `STOP-003` | The task requires a protected-path modification. |
| `STOP-004` | Human Main contains unknown changes or would need to be touched. |
| `STOP-005` | Branch base is stale and cannot be safely reconciled within scope. |
| `STOP-006` | Task Envelope is missing, incomplete, invalid or expired. |
| `STOP-007` | Requested or discovered work exceeds authorized scope. |
| `STOP-008` | Work requires real KGEN transfer or settlement. |
| `STOP-009` | Work requires real KYC processing. |
| `STOP-010` | Work requires real GPS collection or exact private location handling. |
| `STOP-011` | Work requires Token Contract modification. |
| `STOP-012` | Work requires production deployment. |
| `STOP-013` | A test fails and remediation exceeds scope. |
| `STOP-014` | A security risk is discovered. |
| `STOP-015` | A secret or suspected secret is discovered. |
| `STOP-016` | Data leakage or unauthorized cross-tenant access is discovered. |
| `STOP-017` | Governing rules conflict and precedence does not resolve them. |
| `STOP-018` | A new Human Architecture Decision is required. |

An inability to fetch the required current origin state activates `STOP-002` for executable work. Offline analysis may continue only when a Human Decision explicitly authorizes offline research and source freshness is disclosed.

## 2. Required Stop Output

```text
STATUS: BLOCKED
BLOCKED_REASON:
STOP_CONDITION_ID:
EVIDENCE:
LAST_SAFE_STATE:
FILES_ALREADY_CHANGED:
BRANCH:
HEAD_SHA:
RISK:
RECOMMENDED_HUMAN_DECISION:
```

The output must not include secret values or private data.

## 3. Stop Behavior

On stop, Cursor must:

1. stop new writes and commands that could worsen the condition;
2. preserve the task branch, worktree, diff and existing evidence;
3. avoid reset, clean, destructive checkout, force push and hidden stash operations;
4. record the blocking condition in the handoff or blocked report;
5. identify the smallest Human or Codex decision needed to proceed;
6. wait for a revised authority source or Task Envelope.

Cursor must not self-authorize a workaround, silently narrow evidence or mark a blocked task complete.

## 4. Resumption

Resumption requires the blocking source to change, a new traceable decision or envelope revision, and a fresh Preflight. A chat instruction that cannot be mapped to a Human Decision ID does not clear a stop.
