---
TITLE: "PrimeForge Company Autopilot Architecture Package"
VERSION: "0.4.0"
REVISION: "2026-07-16.1"
STATUS: "OPERATIONALLY_DELEGATED_GOVERNANCE_ARCHITECTURE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Record bounded Level A/B operational delegation, protected Human workspace handling, proposal backlog governance, and the canonical atomic Claim authority direction."
ANCESTOR: "KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md; KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md"
SOURCE_OF_TRUTH: true
---

# PrimeForge Company Autopilot

This directory is an **architecture proposal and integration profile**, not a second company system and not an executable background service. It composes the current KAIOS, AI Company, Decision Engine, WorkQueue, Claim Lease, Worker Registry and Review Log authorities.

## Biological Classification

| Rank | Value |
|---|---|
| Domain | KAIOS Governance |
| Kingdom | Company Operations |
| Phylum | Manager Control Plane |
| Class | Boot and Review Orchestration |
| Order | Evidence-First Dispatch |
| Family | PrimeForge Company |
| Genus | Codex General Manager |
| Species | PrimeForge Company Autopilot Proposal V0.3 |

## Formal Boundary

| Field | Status |
|---|---|
| Human Decisions | `HUMAN-PRIMEFORGE-COMPANY-AUTOPILOT-001`; `HUMAN-COMPANY-AUTOMATIC-MAINTENANCE-001`; `HUMAN-COMPANY-OS-BOOT-001`; `HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001` |
| Design | `AUTHORIZED` |
| Architecture | `OPERATIONALLY_DELEGATED / ACTIVE OPERATOR PROTOCOL` |
| Runtime implementation | `NOT_STARTED` |
| Background automation | `NOT_RUNNING` |
| WorkQueue implementation task | `NOT_CREATED` |
| Deployment | `NOT_STARTED` |
| Commit / Push | `AUTHORIZED_FOR_LEVEL_A_AND_LEVEL_B` |
| Human final authority | `UNCHANGED` |

## Source Freshness Notice

Codex reran Company Boot and `git fetch origin --prune` at `2026-07-15T17:29:48+08:00`. DNS, GitHub TCP 443, HTTPS, remote Git, Actions and required Pages checks passed. `origin/main` and the primary handoff tip remained unchanged.

## Package Map

| File | Purpose |
|---|---|
| `SOURCE_AUDIT.md` | Current, candidate, historical and missing source classification |
| `GAP_ANALYSIS.md` | Differences between existing governance and the requested Autopilot |
| `MERGE_PLAN.md` | Human-gated migration into existing formal sources without duplication |
| `PRIMEFORGE_COMPANY_AUTOPILOT.md` | Integrated architecture and compliance test contract |
| `CODEX_GENERAL_MANAGER_BOOT.md` | Codex invocation and source-loading profile |
| `COMPANY_DAILY_OPERATION.md` | Per-message company health and review-first gate |
| `CURSOR_HANDOFF_AUTO_REVIEW.md` | Evidence-based handoff review and current incident decision |
| `CLAIM_AND_LEASE_CONTROLLER.md` | Claim lock, review custody, repair and release model |
| `COMPANY_OS_BOOT.md` | Fourteen-layer shared fail-closed Company startup contract |
| `COMPANY_SESSION.md` | Session lifecycle, checkpoint, recovery and close contract |
| `DELEGATED_AUTONOMY_STANDARD.md` | Level A/B/C authority, Human override and managed workspace rules |
| `ARCHITECTURE_BACKLOG_REGISTRY.md` | Proposal inventory, review state, dependencies and next action |
| `CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md` | Transactional Claim authority selection and migration proposal |
| `COMPANY_AUTOPILOT_ARCHITECTURE_REVIEW.md` | Delegated publication review and score evidence |
| `COMPANY_INBOX.md` | Durable Human intake boundary that remains available during network failure |
| `PRIORITY_SCHEDULER.md` | Review-first ordering and one-task scheduling contract |
| `REPOSITORY_MAINTENANCE_RUNTIME.md` | Fetch, compare, retry, recovery and health architecture |
| `HUMAN_INBOX_ROUTER.md` | Human message classification and deferred routing |
| `COMPANY_STOP_CONDITIONS.md` | Fail-closed conditions and allowed read-only actions |
| `CODEX_COMPANY_START_COMMAND.md` | Permanent concise start command proposal |
| `company_autopilot.json` | Machine-readable architecture, tests and current observation |
| `company_boot_manifest.json` | Ordered mandatory source manifest |
| `codex_company_start_command.json` | Machine-readable start command |
| `company_inbox.json` | Proposed Inbox contract and current decision envelope |
| `priority_scheduler.json` | Machine-readable priority and safety rules |
| `repository_maintenance_runtime.json` | Proposed maintenance state machine and retry policy |
| `company_os_boot.json` | Machine-readable layer order, Company Kernel and failure policy |
| `company_session.json` | Machine-readable Session and checkpoint contract |
| `delegated_authority.json` | Machine-readable Level A/B/C delegation |
| `architecture_backlog_registry.json` | Machine-readable proposal backlog |
| `canonical_atomic_claim_authority.json` | Machine-readable Claim authority proposal |
| `company_autopilot_architecture_review.json` | Machine-readable review score and gates |

## Imported Authorities

This package does not replace:

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md`
- `KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md`
- `KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md`
- `KGEN-AI-Company/WORKSPACE_POLICY.md`
- `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md`
- `KGEN-KAIOS/CODEX_PRE_MERGE_CHECKLIST.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

If this proposal is approved, the merge plan updates those active authorities cumulatively. This directory remains the integration manifest and audit trail; it must not become a competing WorkQueue, Claim Registry or Review Log.

## Human and Company Responsibility

Human PrimeForge retains Final Authority and all Level C decisions. Under `HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001`, Codex owns bounded Level A and qualifying Level B operations, including routine repository maintenance, reviewed documentation publication, Claim closeout and isolated sandbox coordination. Cursor owns one authorized execution task at a time and never receives main, architecture or protected-path authority.

## Shared Company Boot

All providers use `COMPANY_OS_BOOT.md` and `company_os_boot.json`. A neutral Session envelope opens first, then Layers 0-13 run in fixed order. Company Kernel launches Company Inbox, Priority Scheduler, and Repository Maintenance Runtime; Human does not start those modules manually. Any failed layer ends the Session fail-closed.
