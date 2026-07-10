# KGEN AI Operating System

**System ID:** KAIOS
**Version:** V7.1 Minimal Worker Layer / Dry Run Ready
**Status:** Architecture First / Minimal Worker Layer / Draft for Review
**Manager:** Codex
**Scope:** AI work operating system for KGEN.

## Purpose

KAIOS is the KGEN AI Operating System. It is not another document library and it is not a mass document expansion. It is the architecture layer that coordinates AI workers, tasks, claims, reports, reviews, recovery, dashboard state, and security policy.

KAIOS sits above the existing KGEN AI Company, Agent Office, Organization, Machine Canon, Genesis Library, Runtime Library, and SDK Library. It does not replace them. It gives them a working operating model.

## Architecture First Rule

V7.0 defined the architecture. V7.1 adds only the minimum worker layer required to register AI and Human workers, claim tasks safely, detect stale handoff branches, and give Codex a pre-merge checklist.

V7.1 does not rewrite AI Company, Agent Office, Organization, WorkQueue, Runtime, Canon, or protected systems. It only adds references and machine-readable worker schemas.

## Core Question

Can Claude, Gemini, OpenHands, GitHub Copilot, ChatGPT, Deep Research, Cursor, Codex, and Human Engineers join the same AI company without redesigning the system?

**Architecture answer:** Yes, if each actor is registered as a Worker and communicates through KAIOS interfaces: Worker Registry, Task Dispatcher, Message Bus, Review Pipeline, Dashboard, Recovery, and Security.

## V7.0 Architecture Files

| File | Purpose |
|---|---|
| `KAIOS_ARCHITECTURE.md` | System architecture and boundaries |
| `KAIOS_MASTER_PLAN.md` | V7 architecture plan and staged rollout |
| `KAIOS_COMPONENTS.md` | Component inventory |
| `KAIOS_ROADMAP.md` | Architecture roadmap |
| `KAIOS_GLOSSARY.md` | Common terms |
| `AI_RUNTIME_BUS.md` | Runtime coordination concept |
| `WORKER_REGISTRY.md` | Worker identity and status model |
| `TASK_DISPATCHER.md` | Task lifecycle and routing model |
| `TASK_CLAIM_PROTOCOL.md` | Claim and lease protocol |
| `REVIEW_PIPELINE.md` | Review, merge, push pipeline |
| `MESSAGE_BUS.md` | GitHub-based communication model |
| `EVENT_MODEL.md` | Event names and payload intent |
| `STATE_MACHINE.md` | Worker, task, review, and recovery states |
| `DASHBOARD_MODEL.md` | Company dashboard data model |
| `RECOVERY_MODEL.md` | Failure and recovery architecture |
| `SECURITY_MODEL.md` | Role and permission architecture |

## V7.1 Minimal Worker Layer Files

| File | Purpose |
|---|---|
| `WORKER_REGISTRY.md` | Human-readable registry rules and worker field definitions |
| `GENERIC_WORKER_PROTOCOL.md` | Shared worker protocol for Cursor, Claude, Gemini, OpenHands, Copilot, ChatGPT, Deep Research, and Human Engineer |
| `TASK_CLAIM_LEASE_PROTOCOL.md` | Claim lease rules that prevent two workers from taking the same WorkOrder |
| `STALE_HANDOFF_BRANCH_POLICY.md` | Recovery policy for missing branches, invisible commits, missing reports, old bases, advanced main, disappeared workers, and timeout |
| `CODEX_PRE_MERGE_CHECKLIST.md` | Required Codex checklist before merge to main |
| `worker_registry.json` | Machine-readable worker registry seed |
| `task_claim_schema.json` | Machine-readable JSON Schema for task claims and lease records |
| `worker_status_schema.json` | Machine-readable JSON Schema for worker status records |


## V7.1 Dry Run Files

| File | Purpose |
|---|---|
| `DRY_RUN_PROTOCOL.md` | Minimal V7.1 dry run procedure for Worker Claim, Cursor Handoff Branch, and Codex Review |
| `reports/README.md` | KAIOS report storage rules and expected dry run report path |

## V7.1 Dry Run Task

| Task ID | Status | Owner | Reviewer | Branch | Output Report |
|---|---|---|---|---|---|
| KAIOS-DRYRUN-001 | DONE | Cursor | Codex | `cursor-handoff/KAIOS-DRYRUN-001` | `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md` |
## Worker Types Supported

- Codex
- Cursor
- Claude
- Gemini
- OpenHands
- GitHub Copilot
- ChatGPT
- Deep Research
- Human Engineer

## Protected Systems

KAIOS V7.1 does not modify:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`