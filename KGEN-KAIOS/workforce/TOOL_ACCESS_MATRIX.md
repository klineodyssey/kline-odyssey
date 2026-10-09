# KGEN Tool Access Matrix

**Status:** ACTIVE BASE / CANDIDATE ADDITION NOT ACTIVE
**Version:** 1.2-candidate
**Last Updated:** 2026-10-09
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

## Candidate Rule Patch Evidence (Not An Active Grant)

| Field | Value |
|---|---|
| Work ID | `KAIOS-HUMAN-DELEGATED-TRIAL-ADMISSION-CANDIDATE-20261009` |
| Temporary execution reference | `TEMP-EXEC-Sentinel_dcbfb651dd648191a5a18d0f21ddce6a-20261009T081939Z` |
| Reference kind | `COMPANY_TEMP_WORK_REF_NOT_PLATFORM_ID` |
| Human authorization source | `Sentinel_dcbfb651dd648191a5a18d0f21ddce6a` at `2026-10-09T08:19:39Z` |
| Decision | `APPROVED_WITH_LIMITS` / `CANDIDATE_AUTHORIZED` |
| Owner | `human-primeforge` / Human Authority 沈英明 |
| Implementer label | `DOT_DELEGATED_CANDIDATE_RUNTIME_UNBOUND` |
| Reviewer | `PENDING_DISTINCT_TECHNICAL_REVIEW_ASSIGNED_BY_PARENT` |
| Base commit | `4a31413095c73c04ea83443498780106af0510cf` |
| Branch | `dot/kaios-temporary-admission-candidate-20261009` |
| Risk | `R1` |
| Single writer | `true` |
| Candidate envelope expiry | `2026-10-11T08:19:39Z` or Draft PR handoff, whichever comes first |
| Output | Commit, push non-main branch, open Draft PR, stop for distinct review |
| Status | `CANDIDATE_ONLY_NOT_ACTIVE` |

The exact writable scope is only `AGENTS.md`, active `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`, `KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md`, `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md`, `KGEN-KAIOS/task_claim_schema.json`, `KGEN-KAIOS/workforce/TOOL_ACCESS_MATRIX.md`, `KGEN-KAIOS/workforce/tool_access_matrix.json`, and `KGEN-KAIOS/workforce/WORKER_EXECUTION_REPORT_TEMPLATE.md`. Acceptance requires schema compatibility and negative security tests, exact-head diff/scope validation, no registry or queue mutation, no active grant, and distinct technical review. This record documents the candidate patch envelope only; it does not add DOT to the worker rows or activate tool authority.

## Permanent Denials

No worker may bypass protected paths, publish secrets, force push, hide changes, or push main without the Codex/Human governance gates defined in Boot and Workspace Policy.

## Machine-Readable Source

See `KGEN-KAIOS/workforce/tool_access_matrix.json`.
