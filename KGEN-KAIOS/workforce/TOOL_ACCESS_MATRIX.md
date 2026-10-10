# KGEN Tool Access Matrix

**Status:** ACTIVE / FAIL-CLOSED PRECHECK ONLY
**Version:** 1.2
**Last Updated:** 2026-10-10
**Task ID:** KAIOS-TEMP-WORKER-ELIGIBILITY-20261010-001

## Purpose

This matrix records which worker may use each tool class. It is a permission record, not a credential store. No GitHub token, private key, wallet seed, password or secret may be stored here.

## Access Values

- `ALLOWED`: permitted within assigned task scope.
- `REVIEW_REQUIRED`: permitted only with Codex review and evidence.
- `HUMAN_APPROVAL_REQUIRED`: requires Human approval before use.
- `DENIED`: not permitted.

## Summary Matrix

| Worker ID | Git read | Commit | Handoff push | Merge | Push main | Files write | Contracts | Wallet | Secrets | Production |
|---|---|---|---|---|---|---|---|---|---|---|
| `codex-gm-01` | ALLOWED | ALLOWED | DENIED | ALLOWED | ALLOWED | ALLOWED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED |
| `cursor-01` | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED |
| `chatgpt-01` | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED |
| `human-primeforge` | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED |
| temporary worker with canonically verified WorkOrder claim | REVIEW_REQUIRED | REVIEW_REQUIRED | REVIEW_REQUIRED | DENIED | DENIED | REVIEW_REQUIRED | DENIED | DENIED | DENIED | DENIED |
| all other unactivated candidates | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED |

## DOT Conditional Authority Record

Human policy evidence [#559](https://github.com/klineodyssey/kline-odyssey/issues/559) authorizes DOT to perform bounded R0/R1 GitHub engineering and integrate qualified PRs after applicable tests, review and protection rules. This is a role/scope authorization, not an employment decision. DOT is not added to the formal worker rows, but may use the same task-scoped temporary-worker gate when exact work identity, claim channel, ACK, WorkOrder, branch, reviewer and recipient wallet are verified.

This conditional policy never grants Mainnet, Treasury, signer, secret, real-asset, payroll-execution, governance or irreversible destructive authority.

## Temporary Worker Tool Boundary

Tool access is created by the exact WorkOrder, not by Life birth or a display name. A canonically verified temporary claim may use only the R0/R1 tools and paths enumerated in that order, may commit/push only to its non-main handoff branch, and may never self-review or inherit protected authority. The repository schema precheck alone grants no access or eligibility. When the claim closes, expires, is superseded or loses identity/channel binding, its conditional access ends.

## Permanent Denials

No worker may bypass protected paths, publish secrets, force push, hide changes, or push main without the Codex/Human governance gates defined in Boot and Workspace Policy.

## Machine-Readable Source

See `KGEN-KAIOS/workforce/tool_access_matrix.json`.
