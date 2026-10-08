# KGEN Tool Access Matrix

**Status:** ACTIVE
**Version:** 1.1
**Last Updated:** 2026-10-08
**Task ID:** KAIOS-HR-SYSTEM-20261008-001

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
| all unactivated candidates | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED |

## DOT Conditional Authority Record

Human policy evidence [#559](https://github.com/klineodyssey/kline-odyssey/issues/559) authorizes DOT to perform bounded R0/R1 GitHub engineering and integrate qualified PRs after applicable tests, review and protection rules. This is a role/scope authorization, not an employment decision. DOT is not added to the formal worker rows until an exact runtime/session, Controller, WorkOrder and non-duplicated Worker ID are bound.

This conditional policy never grants Mainnet, Treasury, signer, secret, real-asset, payroll-execution, governance or irreversible destructive authority.

## Permanent Denials

No worker may bypass protected paths, publish secrets, force push, hide changes, or push main without the Codex/Human governance gates defined in Boot and Workspace Policy.

## Machine-Readable Source

See `KGEN-KAIOS/workforce/tool_access_matrix.json`.
