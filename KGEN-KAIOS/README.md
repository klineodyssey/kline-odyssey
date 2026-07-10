# KGEN AI Operating System

**System ID:** KAIOS
**Version:** V8.1 Universe Data Layer
**Status:** Draft for Review / Data Layer Prototype
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



## V7.2 Read-Only Operations Dashboard

| File | Purpose |
|---|---|
| `dashboard/index.html` | GitHub Pages dashboard entry |
| `dashboard/dashboard.js` | Read-only data loader and renderer |
| `dashboard/dashboard.css` | Responsive operations dashboard styling |
| `dashboard/dashboard.config.json` | Source paths, status order, readiness score, protected paths |
| `dashboard/README.md` | Dashboard purpose, data sources, and read-only rules |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/dashboard/

The dashboard reads Worker Registry, WorkQueue, Codex Review Log, KAIOS reports, AI Company reports, and KAIOS schemas. It does not write to GitHub, does not claim tasks, does not merge, and does not use a GitHub token.
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


## V8.0 One Picture One Temple Economy System

V8.0 adds the first KAIOS application layer for one picture one temple, land, residence, commerce, bank simulation, 11520 exchange, and real-world link standards. It lets Codex read a player's current asset state and generate a governed construction roadmap while preserving Concept / Prototype / Runtime / Production / Regulated boundaries.

| File | Purpose |
|---|---|
| `V8/README.md` | V8 entry and file map |
| `V8/index.html` | Read-only player roadmap demo |
| `V8/KAIOS_V8_MASTER_SPEC.md` | Official V8 master specification |
| `V8/KAIOS_V8_PLAYER_ENTRY_MODEL.md` | Picture, Land, Residence, Temple, App, Real Business and Civilization Node entry rules |
| `V8/KAIOS_V8_ASSET_LIFECYCLE.md` | Wild Land to Cross-Universe Node lifecycle |
| `V8/KAIOS_V8_TASK_GENERATOR.md` | Codex task generator and WorkOrder fields |
| `V8/KAIOS_V8_ECONOMY_RUNTIME.md` | Civilization economy runtime and bank concept boundary |
| `V8/KAIOS_V8_REAL_WORLD_LINK_STANDARD.md` | Real-world business virtual twin adapters and compliance gates |
| `V8/KAIOS_V8_LISTING_STANDARD.md` | Land, temple, building, App, AI, DNA, membership, and regulated listing boundary |
| `V8/runtime/HUAGUO_EXCHANGE_11520_RUNTIME.md` | Huaguo Mountain Exchange 11520 runtime |
| `V8/runtime/KAIOS_V8_BANK_RUNTIME.md` | Bank simulation runtime |
| `V8/schemas/` | Thirteen JSON Schemas |
| `V8/examples/` | Six JSON examples |
| `V8/workorders/V8_WORKORDERS.md` | V8-P0 through V8-P15 Cursor handoff WorkOrders |
| `V8/reports/KAIOS_V8_QA_REPORT.md` | V8 baseline QA report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8/

## V8.1 Universe Data Layer

V8.1 adds the living data layer for the KGEN Universe. It defines unique IDs, entity relationships, citizen and profession records, lifecycle events, world state snapshots, runtime relationship maps, parseable JSON Schemas, examples and a read-only Universe Viewer.

| File | Purpose |
|---|---|
| `V8.1/README.md` | V8.1 entry and file map |
| `V8.1/index.html` | Read-only Universe Viewer |
| `V8.1/UNIVERSE_DATA_LAYER.md` | Master data-layer specification |
| `V8.1/UNIVERSE_GRAPH.md` | Universe Graph backbone and entity roles |
| `V8.1/ENTITY_RELATIONSHIP.md` | Entity relationship envelope and relationship record rules |
| `V8.1/UNIQUE_ID_STANDARD.md` | Stable ID format for all Universe entities |
| `V8.1/WORLD_STATE_MODEL.md` | Snapshot model for world, civilization, temple, economy, citizen and market state |
| `V8.1/CITIZEN_STANDARD.md` | Citizen as civilization life standard |
| `V8.1/PROFESSION_STANDARD.md` | Profession library and economic output model |
| `V8.1/LIFE_CYCLE_STANDARD.md` | Create, Grow, Learn, Work, Trade, Build, Upgrade, Reproduce, Retire, Archive and Delete stages |
| `V8.1/runtime/` | Runtime Relationship Map, Temple, Citizen, Economy, Player and AI runtime documents |
| `V8.1/schemas/` | Eight JSON Schemas |
| `V8.1/examples/` | Eight parseable examples |
| `V8.1/reports/KAIOS_V8_1_QA_REPORT.md` | V8.1 QA report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8.1/
## Protected Systems

KAIOS V8.1 does not modify:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`