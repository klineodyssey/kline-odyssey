---
TITLE: "PrimeForge Company Autopilot Source Audit"
VERSION: "0.3.0"
REVISION: "2026-07-15.3"
STATUS: "INTERNAL_SOURCE_AUDIT"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-OS-BOOT-001"
CHANGE_REASON: "Confirm no equivalent shared Company OS Boot, Company Kernel, or Company Session exists before adding the P0 amendment."
ANCESTOR: "Repository source audit"
SOURCE_OF_TRUTH: "FALSE"
---

# Source Audit

## Audit Rule

`Human Decision > Constitution > CURRENT selector/runtime > frozen baseline > approved ADR > active company governance > candidate > historical > archive`.

Network freshness was reverified at `2026-07-15T17:29:48+08:00`. DNS, GitHub TCP 443, HTTPS, remote Git, Actions, Pages, and `git fetch origin --prune` passed. `origin/main` remained `7a692c34df50861ab10f8bd80959d95251b1071c`.

## Current and Active Sources

| Source | Classification | Imported responsibility |
|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | CURRENT / SOURCE_OF_TRUTH | Stable Boot entry and role manifests |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | ACTIVE CONSTITUTION | Human authority, review, evidence, protected Runtime |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | ACTIVE MACHINE CANON | Canon order, workforce, protected paths |
| `KGEN-AI-Company/WORKSPACE_POLICY.md` | ACTIVE | Human Main isolation and Codex review worktree |
| `KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md` | ACTIVE | General Manager daily gate and decision duties |
| `KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md` | ACTIVE | Daily Operation, blocking conditions, decision evidence |
| `KGEN-KAIOS/decision/decision_log.jsonl` | ACTIVE LEDGER | Material manager decisions |
| `KGEN-KAIOS/WORKER_REGISTRY.md` | ACTIVE | Human-readable worker authority |
| `KGEN-KAIOS/worker_registry.json` | ACTIVE MACHINE REGISTRY | Worker status, trust, current task, branch |
| `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md` | ACTIVE / DRAFT FOR REVIEW | One-task lease lifecycle |
| `KGEN-KAIOS/task_claim_schema.json` | ACTIVE MACHINE SCHEMA | Current claim fields; no first-class `claim_id` |
| `KGEN-KAIOS/CODEX_PRE_MERGE_CHECKLIST.md` | ACTIVE / DRAFT FOR REVIEW | Review, provenance, protected-path gate |
| `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md` | ACTIVE | Handoff review and dispositions |
| `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md` | ACTIVE / DRAFT FOR REVIEW | Cursor branch and report submission |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ACTIVE QUEUE | Only formal company WorkQueue |
| `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` | ACTIVE REVIEW LOG | Only formal Codex handoff review history |
| `KGEN-KAIOS/operations/MAINTENANCE_MODE_STANDARD.md` | ACTIVE SPECIAL MODE | Network wait and recovery |
| `KGEN-KAIOS/operations/GITHUB_CONNECTIVITY_RUNBOOK.md` | ACTIVE RUNBOOK | DNS/TCP/TLS/remote diagnostics and safe recovery |
| `docs/maps/README.md` | CURRENT MAP SELECTOR | Selects active Universe Map |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | PROTECTED CURRENT | Active Physics Runtime reference |
| `KGEN-KAIOS/V11/ARCHITECTURE_BASELINE.md` | FROZEN BASELINE | Approved V11 architecture boundary |
| `KGEN-KAIOS/civilization/CIVILIZATION_ECONOMY_ARCHITECTURE_BASELINE.md` | FROZEN BASELINE | Civilization economy architecture |
| `KGEN-KAIOS/kernel/KERNEL_V1.md` | RESEARCH PROPOSAL | Kernel architecture; not frozen or implemented |

## Existing Autopilot-Labeled Sources

| Source | Classification | Decision |
|---|---|---|
| `docs/AUTOPILOT.md` | LEGACY SUPPORT / ENCODING-DAMAGED | Historical project generator notes; no company authority |
| `whitepaper/KGEN Universe Runtime Autopilot V0.1.md` | HISTORICAL CONCEPT | Universe research; no manager authority |
| `wukong-temple/README_WUKONG_TEMPLE_AUTOPILOT_V1_6.md` | LEGACY TEMPLE-SPECIFIC | No company authority |
| Domain files matching `*AUTOPILOT*` | DOMAIN SUPPORT / ARCHIVE | Temple or data-pipeline scope only |

## Coverage and Gaps

| Requested function | Existing source | Coverage |
|---|---|---|
| Codex General Manager Boot | Manager Protocol, Boot CURRENT | PARTIAL |
| Company Daily Operation | Decision Engine, Manager Protocol | STRONG; not automatic per invocation |
| Cursor Handoff Review | Dispatcher, Handoff Workflow, Pre-Merge | STRONG; artifact contract incomplete |
| Claim and Lease Controller | Claim Lease Protocol and schema | PARTIAL |
| Stop Conditions | Decision Engine, Workspace Policy, Maintenance Mode | PARTIAL / distributed |
| Company Inbox | No active equivalent | MISSING |
| Human Inbox Router | No active equivalent | MISSING |
| Priority Scheduler | Priority rules distributed across protocols | PARTIAL |
| Repository Maintenance Runtime | Maintenance Mode and connectivity runbook | PARTIAL; no unified company lifecycle |
| Permanent Codex start command | No active equivalent | MISSING |
| Machine boot manifest | No active equivalent | MISSING |
| Shared Company OS Boot | No active equivalent | MISSING |
| Company Kernel governance orchestrator | No active equivalent; KAIOS Kernel is a different domain | MISSING |
| Company Session and checkpoint | No active equivalent | MISSING |

## Current Handoff Evidence

| Field | Evidence |
|---|---|
| Primary task | `ORG-P2-003F-FIX1` |
| Verified branch tip | `e6e5d2fa251ba84b0f49eff1bd341329b381dc67` |
| Base | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| Protected-path changes | 0 |
| Technical result | PASS |
| Required disposition | `REPAIR_REQUIRED` |
| Missing evidence | Task Envelope, task-specific Handoff pair, first-class claim ID, report content/head identity |
| Timestamp lease | Expired after timely Handoff; review/repair custody retained |
| Later overlapping refs | 8; unauthorized or no-claim evidence, all unmerged |
| Remote freshness | VERIFIED |

## Audit Conclusion

The company already has most governance organs. Repository search found no equivalent shared Company OS Boot, Company Kernel, or Company Session. The P0 amendment may therefore add those contracts inside this package while importing existing authorities. Company Kernel must remain a governance orchestrator and must not compete with KAIOS Universe/Runtime Kernel architecture.
