# KGEN Tool Access Matrix

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-07-12  
**Task ID:** KGEN-WORKFORCE-ROSTER-2026-0001

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
| `cursor-01` | ALLOWED | ALLOWED | ALLOWED | DENIED | DENIED | ALLOWED | DENIED | DENIED | DENIED | DENIED |
| `human-primeforge` | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED | HUMAN_APPROVAL_REQUIRED | DENIED | HUMAN_APPROVAL_REQUIRED |
| all unactivated candidates | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED |

## Permanent Denials

No worker may bypass protected paths, publish secrets, force push, hide changes, or push main without the Codex/Human governance gates defined in Boot and Workspace Policy.

## Machine-Readable Source

See `KGEN-KAIOS/workforce/tool_access_matrix.json`.
