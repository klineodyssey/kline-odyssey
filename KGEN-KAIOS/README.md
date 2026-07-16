# KGEN AI Operating System

**System ID:** KAIOS
**Version:** V10.0 Operating System
**Status:** Active / Read-only Operating Center
**Manager:** Codex
**Scope:** AI work operating system for KGEN.

## Purpose

KAIOS is the KGEN AI Operating System. It is not another document library and it is not a mass document expansion. It is the architecture layer that coordinates AI workers, tasks, claims, reports, reviews, recovery, dashboard state, and security policy.

KAIOS sits above the existing KGEN AI Company, Agent Office, Organization, Machine Canon, Genesis Library, Runtime Library, and SDK Library. It does not replace them. It gives them a working operating model.

## KAIOS Constitution

Human Decision `HUMAN-KAIOS-CONSTITUTION-001` establishes KAIOS Constitution V1.0 as the permanent highest KAIOS governance document below Human Final Authority. It governs the Architecture Governance Board, ADRs, WorkQueue, Implementation and evolution process without silently rewriting KGEN Official Canon or protected Runtime.

| File | Purpose |
|---|---|
| `constitution/KAIOS_CONSTITUTION.md` | Formal ten-chapter Constitution and permanent Human-led governance principles |
| `constitution/constitution.json` | Machine-readable authority hierarchy, principles, chapters, protected runtime and current state |
| `constitution/constitution_history.jsonl` | Append-only ratification and amendment lineage |

Constitution status is `ACTIVE / READY`. V11 Phase 1, Implementation and Deployment remain `NOT STARTED / HOLD`; this governance publication does not create an Implementation WorkQueue.

## Kernel V1 Design

Human Decision `HUMAN-KERNEL-V1-001` authorizes research and design for the first single-Agent KAIOS Kernel. The sole Agent is `悟空001`; its daily lifecycle is Boot, Load Memory, Read Mission, Execute, Evidence, Review, Reward, Sleep and Next Day.

| File | Purpose |
|---|---|
| `kernel/KERNEL_V1.md` | Kernel timeline, lifecycle, state machine, scope and Human review gate |
| `kernel/kernel_runtime.json` | Machine-readable single-Agent states, transitions and invariants |
| `kernel/kernel_boot_sequence.md` | Daily identity, policy, workspace, memory and health gates |
| `kernel/kernel_memory_model.md` | Traceable memory layers, retention and recovery |
| `kernel/kernel_task_runtime.md` | One-Mission admission, execution, evidence and stop rules |
| `kernel/kernel_review_runtime.md` | Independent Review before Reward |
| `kernel/kernel_reward_runtime.md` | Prototype / Internal Ledger reward boundary |
| `kernel/kernel_sleep_cycle.md` | Mandatory checkpoint, shutdown and next-day recovery |
| `kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md` | Grok review resolution, readiness and V1 / V1.1 / V2 roadmap |
| `kernel/kernel_architecture_review_resolution.json` | Machine-readable topic classifications and Human gate |
| `kernel/kernel_adr/` | KADR-001 through KADR-010 |

Kernel V1 is `UNDER_REVIEW / RESEARCH_ONLY`. The independent Review Resolution is ready for Human decision. Implementation and Deployment are `NOT_STARTED`; no executable, service, scheduler, database or Implementation WorkQueue has been created.

## Permanent Public Entries

| Entry | URL | Purpose |
|---|---|---|
| KGEN Operating Center | https://klineodyssey.github.io/kline-odyssey/operating-center/ | Stable public control center for KAIOS and AI Company |
| Evolution Governance | https://klineodyssey.github.io/kline-odyssey/evolution-governance/ | Read-only portal for organism registry, lineage, provenance, contribution, and R&D suggestions |
| Workforce Governance | https://klineodyssey.github.io/kline-odyssey/workforce/ | Read-only portal for formal worker registration, trust, violations, suspensions, and contribution history |
| Official Video Library | https://klineodyssey.github.io/kline-odyssey/video/ | KAIOS / KGEN official video planning library |
| KAIOS Dashboard | https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/dashboard/ | Read-only worker, task, report and health dashboard |
| General Manager Decision Center | https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/decision/ | Daily Operation gate, manager decisions, network health and readiness |
| KAIOS Constitution | https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md | Permanent KAIOS governance below Human Final Authority |
| AI Company | https://klineodyssey.github.io/kline-odyssey/ai-company/ | Codex / Cursor company workflow |
| WorkQueue | https://klineodyssey.github.io/kline-odyssey/workqueue/ | Official task queue entry |
| PrimeForge Boot CURRENT | https://klineodyssey.github.io/kline-odyssey/boot/ | Stable Boot source of truth |

## Architecture First Rule

V7.0 defined the architecture. V7.1 adds only the minimum worker layer required to register AI and Human workers, claim tasks safely, detect stale handoff branches, and give Codex a pre-merge checklist.

V7.1 does not rewrite AI Company, Agent Office, Organization, WorkQueue, Runtime, Canon, or protected systems. It only adds references and machine-readable worker schemas.

## Architecture Governance Board

Human Approval `HUMAN-AGB-APPROVAL-001` establishes the KAIOS Architecture Governance Board for governance publication only. Every material architecture change must pass Proposal, Independent Review, Architecture Resolution, ADR, Human Architecture Approval, Implementation Planning, Human Implementation Approval, Implementation, Evidence, Review, and Merge / Release.

| File | Purpose |
|---|---|
| `governance/ARCHITECTURE_GOVERNANCE_BOARD.md` | Formal AGB authority, flow, quorum and Human approval gates |
| `governance/architecture_governance_board.json` | Machine-readable Board roles, status and approval scope |
| `governance/architecture_review_registry.json` | Architecture reviewer identities, authority boundaries and review evidence |
| `governance/architecture_review_history.jsonl` | Append-only Architecture review and Human approval history |

AGB is approved, while V11 Phase 1 and Implementation remain `NOT STARTED`. ChatGPT is an advisory architect without repository write authority; Grok is an external reviewer without merge authority; Codex remains the Implementation Architect; PrimeForge remains the final Human authority.

## Delegated Company Operations And Reviewed Architecture

Human Decision `HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001` delegates bounded Level A and Level B company operations to Codex while preserving all Level C decisions for Human PrimeForge. The managed workspace, Human workspace protection, architecture backlog, repository maintenance, review, claim/lease closeout, and release evidence are defined under `governance/autopilot/`.

| Path | Status | Purpose |
|---|---|---|
| `governance/autopilot/` | Delegated documentation baseline | Company OS Boot, Session, Inbox, scheduler, repository maintenance, backlog and atomic Claim Authority proposal |
| `governance/autopilot/worker-swarm/` | Architecture proposal | Session, clone, dispatcher, registry and recovery coordination; implementation not started |
| `governance/cursor/` | Architecture proposal under review | Cursor preflight, Task Envelope, protected paths, handoff, stop conditions and legacy-rule suppression |
| `../company/` | Architecture proposal under review | Future single company command control plane, typed Inbox, sole Dispatcher and provider-neutral Message Contract; cutover not authorized |
| `boot-runtime/` | Architecture proposal under review | Fail-closed player Boot, Species OS and Life Integrity contracts |
| `life/` | `LIFE-OS-V1.0` frozen Architecture | Species-scoped Life OS, state machine, API, events, review and baseline manifest |
| `world-viewer/` | `WORLD-VIEWER-V1.0` frozen Architecture | Reviewed 2D Web-first World Viewer and synthetic sandbox plan; no runtime implementation yet |
| `ui-governor/` | Architecture proposal under review | Permanent UI inspection, Style Canon, visual regression and bounded remediation contracts; automation not enabled |

The Canonical Atomic Claim Authority remains a proposal. Until its transactional service is reviewed and implemented, Codex dispatch is explicit and recorded but is not represented as fully atomic distributed scheduling. No entry in this section changes Runtime CURRENT, Universe Map CURRENT, protected paths, Token behavior, real identity, real location, or real financial state.

### Company Decision Center V1

Human Decision `HUMAN-COMPANY-DECISION-CENTER-001` authorizes an Architecture-only integration layer at `../company/`. It scopes Single Source of Truth to company commands and authorization lineage, while Constitution, Canon, CURRENT Runtime, frozen baselines and domain registries keep their own authority. The package does not replace the active Decision Engine, Company Inbox, WorkQueue or Review Log before a reviewed Human cutover. Implementation, WorkQueue creation, automatic dispatch and deployment remain disabled.

| File | Purpose |
|---|---|
| `../company/README.md` | Source audit, package map, migration boundary, and no-cutover status |
| `../company/DECISION_CENTER.md` | Future append-only company command authority contract |
| `../company/decision_center.json` | Machine-readable zero-state Decision Center and cutover gates |
| `../company/COMPANY_INBOX.md` | Typed company intake lanes and review barrier |
| `../company/company_inbox.json` | Machine-readable Inbox lifecycle with no live dispatch records |
| `../company/COMPANY_DISPATCHER.md` | Future sole Dispatcher and atomic Claim boundary |
| `../company/dispatcher_runtime.json` | Disabled zero-state Dispatcher model |
| `../company/COMPANY_GOVERNANCE_FLOW.md` | Boot-to-review governance and migration flow |
| `../company/COMPANY_MESSAGE_STANDARD.md` | Provider-neutral eight-family message contract |

## UI Governor Architecture

Human Decision `HUMAN-UI-GOVERNOR-001` is a repository-assigned trace ID for the unnumbered Human architecture instruction that requests permanent UI inspection. The package is architecture only: it creates no browser runner, screenshot, Issue, WorkOrder, Claim, Cursor dispatch, UI fix or deployment.

| File | Purpose |
|---|---|
| `ui-governor/README.md` | Source audit, package index, 80-cell matrix and enablement boundary |
| `ui-governor/UI_GOVERNOR_RUNTIME.md` | Inspection lifecycle, evidence, priority and release gates |
| `ui-governor/UI_HEALTH_REPORT.md` | Current pre-automation UI health and readiness score |
| `ui-governor/SCREENSHOT_DIFF_RUNTIME.md` | Deterministic capture inputs, masks, artifacts and comparison result |
| `ui-governor/VISUAL_REGRESSION_RUNTIME.md` | Baseline lifecycle, coverage and visual release policy |
| `ui-governor/RESPONSIVE_LAYOUT_RUNTIME.md` | Desktop, Tablet, Android, iPhone, orientation and theme profiles |
| `ui-governor/ACCESSIBILITY_RUNTIME.md` | Automated and manual accessibility evidence architecture |
| `ui-governor/PERFORMANCE_RUNTIME.md` | Loading, FPS, resource, console and link budgets |
| `ui-governor/AUTOMATIC_ISSUE_GENERATOR.md` | Finding fingerprint, deduplication and Issue state machine |
| `ui-governor/AUTOMATIC_WORKQUEUE_GENERATOR.md` | Bounded proposed-WorkOrder generation; current automation disabled |
| `ui-governor/CURSOR_UI_WORKER_DISPATCH.md` | Canonical-Claim-gated Cursor UI task and Handoff evidence |
| `ui-governor/UI_STYLE_CANON_V1.md` | Shared structural tokens and six mandatory mobile amendments |
| `ui-governor/ui_governor_runtime.json` | Machine-readable Governor architecture and boundaries |
| `ui-governor/ui_health_report.json` | Machine-readable current health evidence and coverage |
| `ui-governor/ui_style_canon_v1.json` | Machine-readable Style Canon candidate |

UI Governor architecture readiness is 86/100. Current runtime automation coverage and visual regression coverage are both 0 percent because implementation is not started. Temple 12345 findings remain report-only until an exact protected-path authorization exists.

## V11.0 Architecture Baseline

Human Decision `HUMAN-V11-BASELINE-001` freezes the reviewed V11 Genesis Design as the V11.0 Architecture Baseline. The baseline includes 11 Architecture documents, ADR-001 through ADR-010, the independent review, Architecture Resolution and AGB Review Registry.

| File | Purpose |
|---|---|
| `V11/ARCHITECTURE_BASELINE.md` | Frozen Architecture scope, evolution flow and HOLD boundary |
| `V11/architecture_baseline.json` | SHA-256 manifest for Architecture documents, ADRs and review evidence |
| `V11/architecture_evolution_log.jsonl` | Append-only V11 Architecture lineage |
| `V11/V11_MASTER_INDEX.md` | Frozen Genesis Design index |

V11 Phase 1 Planning, Implementation and Deployment are all `HOLD`. No V11 Implementation WorkQueue exists. Only Architecture Review, Research, Prototype and Sandbox activity is allowed within existing governance and protected-path boundaries.

## LAND RUNTIME V1 Architecture Baseline

Human Decision `HUMAN-CIV-ECONOMY-BASELINE-001` freezes K280 / LAND RUNTIME V1 as documentation-only architecture. Civilization Economy Runtime must cite this package and must not redefine K280, Parcel, Coordinate, or Land Ownership Geometry.

| Path | Purpose |
|---|---|
| `land/LAND_RUNTIME_ARCHITECTURE_BASELINE.md` | Frozen LAND-RUNTIME-V1.0 scope and HOLD boundary |
| `land/land_runtime_architecture_baseline.json` | SHA-256 manifest |
| `land/land_runtime_architecture_evolution_log.jsonl` | Append-only Land Runtime lineage |

Implementation, WorkQueue, real land trade, and Land NFT remain `NOT_STARTED` / unauthorized.

## Civilization Economy Runtime V1 Architecture Baseline

Same Decision freezes `CIV-ECONOMY-V1.0` under `civilization/`: biology 19-layer mapping, economy flow, payroll, territory governance, economic conflict, border defense margin, title/seat/realm, and space/moon architecture — documentation only.

| Path | Purpose |
|---|---|
| `civilization/CIVILIZATION_ECONOMY_ARCHITECTURE_BASELINE.md` | Frozen CIV-ECONOMY-V1.0 scope and HOLD boundary |
| `civilization/civilization_economy_architecture_baseline.json` | SHA-256 manifest (README, main spec, 25 sub-standards, 2 JSON, baseline, evolution log) |
| `civilization/civilization_economy_architecture_evolution_log.jsonl` | Append-only Civilization Economy lineage |

Implementation Planning, WorkQueue, real KGEN settlement, real tax, and real military remain unauthorized.

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
| `READINESS_STANDARD.md` | Distinguishes SYSTEM_DIRTY, REPORT_GENERATION_DIRTY, isolated Human Main, handoff disposition, and READY gates |
| `worker_registry.json` | Machine-readable worker registry seed |
| `task_claim_schema.json` | Machine-readable JSON Schema for task claims and lease records |
| `worker_status_schema.json` | Machine-readable JSON Schema for worker status records |

## R&D Provenance And Biological Evolution Governance

KAIOS includes a first-stage governance layer for task source tracing, AI / Human authorship, formal file metadata, biological taxonomy, organism manifests, evolution lineage, and Cursor R&D suggestions.

| File | Purpose |
|---|---|
| `VERSIONING_STANDARD.md` | Stable formal filename and metadata version rules |
| `FILE_HEADER_STANDARD.md` | Metadata header formats for Markdown, JSON, HTML, JS, and CSS |
| `CHANGELOG_STANDARD.md` | Changelog evidence requirements |
| `BIOLOGICAL_TAXONOMY_STANDARD.md` | Domain / Kingdom / Phylum / Class / Order / Family / Genus / Species |
| `EVOLUTION_LINEAGE_STANDARD.md` | Governed evolution event rules |
| `ORGANISM_MANIFEST_STANDARD.md` | Required organism manifest fields |
| `provenance/` | Author registry, file ownership registry, contribution logs, and schemas |
| `examples/organisms/` | Temple, App, and Land organism examples |

## Workforce Governance

KAIOS now requires formal worker registration before any AI or Human worker can claim a task or edit official files. Worker authorization is decided by `KGEN-KAIOS/worker_registry.json` plus the machine-readable schemas under `KGEN-KAIOS/workforce/`.

| File | Purpose |
|---|---|
| `workforce/README.md` | Formal employee rule and governance overview |
| `workforce/WORKER_BOOT_SOP.md` | Required visible BOOT, MUST READ, protected path, task plan, execution, and final report flow for every task |
| `workforce/WORKER_EXECUTION_REPORT_TEMPLATE.md` | Standard execution report template for Codex, Cursor, Generic Worker, and Human Engineer tasks |
| `worker_registry.json` | Active worker status, trust level, branch and reviewer registry |
| `workforce/WORKER_CREDENTIAL_SCHEMA.json` | Required start-day and task-claim credential |
| `workforce/WORKER_TRUST_SCHEMA.json` | T0-T5 trust level profile |
| `workforce/WORKER_PERFORMANCE_SCHEMA.json` | Worker quality and promotion metrics |
| `workforce/WORKER_VIOLATION_SCHEMA.json` | Violation event record |
| `workforce/WORKER_AUDIT_LOG.json` | Baseline audit log |
| `workforce/employee_roster.json` | Current employee roster and duty status |
| `workforce/office_desks.json` | Logical workspace and desk registry |
| `workforce/tool_access_matrix.json` | Tool permission matrix |
| `workforce/attendance_snapshot.json` | Current attendance snapshot |
| `workforce/recruitment_queue.json` | Candidate hiring queue |
| `workforce/agent_registry.json` | Workforce V2 Agent-per-employee registry |
| `workforce/desk_registry.json` | Workforce V2 logical desk registry |
| `workforce/department_registry.json` | Workforce V2 department staffing registry |
| `workforce/agent_runtime_status.json` | Workforce V2 runtime status snapshot |
| `workforce/agent_daily_report.json` | Workforce V2 daily status report |
| `workforce/COMPENSATION_STANDARD.md` | Workforce V3 salary, reward, penalty and Human approval standard |
| `workforce/payroll_policy.json` | Workforce V3 payroll unit, claim option and approval policy |
| `workforce/payroll_snapshot.json` | Workforce V3 payroll dashboard summary |
| `bank/8888/EMPLOYEE_ACCOUNT_STANDARD.md` | 8888 People Bank prototype employee account rules |
| `bank/8888/employee_accounts.json` | 8888 prototype employee account ledger |
| `bank/8888/payroll_reserve.json` | 8888 prototype payroll reserve record |
| `bank/8888/ROBO_ADVISOR_STANDARD.md` | 8888 Robo simulation and advisory-only limits |
| `game/AUTO_MISSION_REWARD_STANDARD.md` | Workforce game mission budget and reward boundary |
| `operations/GITHUB_CONNECTIVITY_RUNBOOK.md` | Safe GitHub 443 / fetch / push diagnostic runbook |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/workforce/

Workforce V3 keeps 12345 as civilization heart and reward source, and uses 8888 People Bank as a prototype internal payroll ledger. It does not enable real banking, real investment, autonomous token transfer, private-key access, or guaranteed return.

## General Manager Decision Engine V4

Decision Engine V4 is a subsystem of the current KAIOS operating system; it does not replace or downgrade KAIOS V10. Codex completes Daily Operation before starting new Human work and records every Approve, Reject, Merge, Rollback, Suspend, Promote, Recruit, and Payroll decision in a GitHub-visible log.

| File | Purpose |
|---|---|
| `decision/DECISION_ENGINE_STANDARD.md` | Daily Operation, blocking gate, risk, rollback and decision-record standard |
| `decision/decision_log.jsonl` | Append-only manager decision history |
| `decision/decision_snapshot.json` | Current readiness, attendance, WorkQueue and blocking state |
| `decision/decision_queue.json` | Pending manager decisions only |
| `decision/decision_dashboard.json` | Read-only network, Pages and dashboard status source |
| `decision/index.html` | General Manager Decision Center |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/decision/

## Official Video Library

KAIOS video planning is stored under `video/`. It defines the first official season of KAIOS / KGEN / KLINE Odyssey videos, including storyboard, shot list, voiceover, subtitles, cover, end card, BGM, assets, review and release records.

**Public URL:** https://klineodyssey.github.io/kline-odyssey/video/

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

## V8.2 Civilization Economy Engine

V8.2 adds the first full civilization economy layer on top of the V8.1 Universe Data Layer. It defines how Temple, Land, Residence, Citizen, Profession, Production, Business, Market, Exchange, Bank, Investment, Governance and Civilization Growth form a readable simulation loop.

| File | Purpose |
|---|---|
| `V8.2/README.md` | V8.2 overview and file map |
| `V8.2/index.html` | Read-only Economy Viewer |
| `V8.2/dashboard/index.html` | Read-only Civilization Economy Dashboard |
| `V8.2/ECONOMY_ENGINE.md` | Master economy engine specification |
| `V8.2/RESOURCE_STANDARD.md` | Food, Wood, Stone, Metal, Energy, Knowledge, Data, AI Compute, Gold, KGEN, Temple Point and Civilization Point model |
| `V8.2/BUSINESS_STANDARD.md` | 23-type Business Library and business record rules |
| `V8.2/MARKET_STANDARD.md` | Market operations and price discovery simulation |
| `V8.2/BANK_STANDARD.md` | Bank and treasury simulation boundary |
| `V8.2/EXCHANGE_STANDARD.md` | Huaguo Mountain Exchange 11520 and asset market boundary |
| `V8.2/GOVERNANCE_SIGNAL_STANDARD.md` | GDP, population, employment, temple activity, market activity, civilization health and AI activity |
| `V8.2/runtime/` | Six runtime documents for economy, business, market, bank, exchange and governance signals |
| `V8.2/schemas/` | Eight JSON Schemas |
| `V8.2/examples/` | Eight parseable examples |
| `V8.2/reports/KAIOS_V8_2_QA_REPORT.md` | V8.2 QA report |
| `V8.2/reports/KAIOS_V8_2_RELEASE_REPORT.md` | V8.2 release report and V8.3 recommendation |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8.2/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8.2/dashboard/

## V8.3 Civilization Time Engine

V8.3 adds time to the KGEN civilization stack. It defines World Clock, Simulation Tick, Day/Night Cycle, Season System, Citizen Behavior, Business Behavior, Temple Activity, Resource Regeneration, Population Growth, Event Engine, Disaster Standard, Governance Response and a read-only Simulation Viewer.

| File | Purpose |
|---|---|
| `V8.3/README.md` | V8.3 overview and file map |
| `V8.3/index.html` | Read-only Simulation, Timeline and World Clock Viewer |
| `V8.3/dashboard/index.html` | Read-only Time Dashboard |
| `V8.3/TIME_ENGINE.md` | Master Civilization Time Engine specification |
| `V8.3/WORLD_CLOCK_STANDARD.md` | Universe, Civilization, World, Temple, Business and Citizen time layers |
| `V8.3/SIMULATION_TICK_STANDARD.md` | Tick scale and execution order |
| `V8.3/DAY_NIGHT_CYCLE.md` | Day and night behavior model |
| `V8.3/SEASON_SYSTEM.md` | Season cycle and economy impact |
| `V8.3/CITIZEN_BEHAVIOR.md` | Citizen actions per Tick |
| `V8.3/BUSINESS_BEHAVIOR.md` | Business actions per Tick |
| `V8.3/TEMPLE_ACTIVITY.md` | Temple services, faith value, population attraction and civilization impact |
| `V8.3/RESOURCE_REGENERATION.md` | Natural recovery, consumption and regeneration |
| `V8.3/EVENT_ENGINE.md` | Festival, War concept, Disaster, Discovery, Technology, Migration, Economic Boom and Recession |
| `V8.3/GOVERNANCE_RESPONSE.md` | Governance signal evaluation and response |
| `V8.3/SIMULATION_RUNTIME.md` | Runtime flow from clock to timeline snapshot |
| `V8.3/schemas/` | Ten JSON Schemas |
| `V8.3/examples/` | Ten parseable examples |
| `V8.3/reports/KAIOS_V8_3_QA_REPORT.md` | V8.3 QA report |
| `V8.3/reports/KAIOS_V8_3_RELEASE_REPORT.md` | V8.3 release report and V9.0 recommendation |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8.3/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V8.3/dashboard/

## V9.0 Civilization AI Engine

V9.0 adds the Civilization AI Engine. It lets AI read Universe State, Civilization State, World Clock, Citizen State, Profession State, Business State, Market State, Exchange State, Bank State, Resource State, Temple Activity, Land Development, Governance Signals, Event Stream, Worker Reports and Codex Review Log, then produce explainable decisions and Draft WorkOrders.

| File | Purpose |
|---|---|
| `V9.0/README.md` | V9.0 overview and file map |
| `V9.0/index.html` | Read-only Civilization AI Viewer |
| `V9.0/dashboard/index.html` | Read-only Civilization AI Dashboard |
| `V9.0/CIVILIZATION_AI_ENGINE.md` | Master AI Engine specification |
| `V9.0/AI_OBSERVATION_MODEL.md` | Observation sources and source quality |
| `V9.0/AI_REASONING_MODEL.md` | Explainable reasoning procedure |
| `V9.0/AI_DECISION_MODEL.md` | Decision contract and decision types |
| `V9.0/AI_MEMORY_MODEL.md` | Short-Term, Task, Civilization, Canon, Decision, Failure and Review Memory |
| `V9.0/AI_POLICY_MODEL.md` | Allowed and prohibited AI actions |
| `V9.0/AI_RISK_MODEL.md` | R0 to R4 risk levels |
| `V9.0/AI_WORKORDER_GENERATOR.md` | Draft WorkOrder generation rules |
| `V9.0/AI_HUMAN_OVERRIDE.md` | Human override record model |
| `V9.0/AI_CODEX_REVIEW_BOUNDARY.md` | Codex review checks before work proceeds |
| `V9.0/runtime/` | Eight advisor runtime documents |
| `V9.0/schemas/` | Eight JSON Schemas |
| `V9.0/examples/` | Eight parseable examples |
| `V9.0/workorders/V9_DRAFT_WORKORDERS.md` | Three V9 dry run Draft WorkOrders |
| `V9.0/reports/V9-DRYRUN-001_REPORT.md` | V9 dry run report |
| `V9.0/reports/KAIOS_V9_0_QA_REPORT.md` | V9.0 QA report |
| `V9.0/reports/KAIOS_V9_0_RELEASE_REPORT.md` | V9.0 release report and V9.1 recommendation |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.0/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.0/dashboard/

## V9.1 AI WorkOrder Review Loop

V9.1 adds the formal review loop for AI-generated DRAFT WorkOrders. It prevents AI from directly promoting DRAFT tasks to OPEN, gives Codex the required promotion checklist, gates R3 through Human review, blocks R4 execution, and records audit events for every review decision.

| File | Purpose |
|---|---|
| `V9.1/README.md` | V9.1 overview and file map |
| `V9.1/index.html` | Read-only V9.1 entry page |
| `V9.1/dashboard/index.html` | Read-only WorkOrder Review Dashboard |
| `V9.1/AI_WORKORDER_REVIEW_LOOP.md` | Formal DRAFT review state machine |
| `V9.1/DRAFT_WORKORDER_STANDARD.md` | Required fields for AI-generated DRAFT WorkOrders |
| `V9.1/CODEX_PROMOTION_PROTOCOL.md` | Codex 15-point promotion checklist |
| `V9.1/CODEX_REJECTION_PROTOCOL.md` | Rejection and archive rules |
| `V9.1/CODEX_REVISION_PROTOCOL.md` | Revision request rules |
| `V9.1/HUMAN_REVIEW_GATE.md` | Human review and override gate |
| `V9.1/DUPLICATE_TASK_DETECTION.md` | Duplicate and merge-candidate detection |
| `V9.1/DEPENDENCY_VALIDATION.md` | Dependency checks before promotion |
| `V9.1/RISK_PROMOTION_MATRIX.md` | R0-R4 promotion matrix |
| `V9.1/schemas/` | Nine JSON Schemas |
| `V9.1/examples/` | Nine parseable examples |
| `V9.1/runtime/` | Eight review runtime documents |
| `V9.1/reviews/` | Codex review decisions for V9.0 DRAFT WorkOrders |
| `V9.1/reports/KAIOS_V9_1_QA_REPORT.md` | V9.1 QA report |
| `V9.1/reports/KAIOS_V9_1_RELEASE_REPORT.md` | V9.1 release report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.1/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.1/dashboard/

## V9.2 Approved Draft to OPEN WorkQueue Sync

V9.2 adds the Codex-only sync layer that converts V9.1 `APPROVED_FOR_OPEN` decisions into official `OPEN` WorkQueue tasks. It validates promotion records, allocates formal `AI-<DOMAIN>-<YEAR>-<SEQUENCE>` IDs, checks conflicts, inserts WorkQueue blocks, supports Human Pause and records rollback/audit events.

| File | Purpose |
|---|---|
| `V9.2/README.md` | V9.2 overview and file map |
| `V9.2/index.html` | Read-only V9.2 entry page |
| `V9.2/dashboard/index.html` | Read-only sync dashboard |
| `V9.2/APPROVED_DRAFT_SYNC_STANDARD.md` | Sync state machine and boundaries |
| `V9.2/CODEX_WORKQUEUE_SYNC_PROTOCOL.md` | Codex 17-point sync checklist |
| `V9.2/WORKORDER_ID_ALLOCATION_STANDARD.md` | Formal AI WorkOrder ID rules |
| `V9.2/WORKQUEUE_CONFLICT_POLICY.md` | Conflict detection rules |
| `V9.2/WORKQUEUE_INSERTION_POLICY.md` | Safe WorkQueue insertion rules |
| `V9.2/WORKQUEUE_ROLLBACK_POLICY.md` | Rollback from OPEN to APPROVED_FOR_OPEN |
| `V9.2/HUMAN_PAUSE_GATE.md` | Human pause, reject, archive and priority gate |
| `V9.2/schemas/` | Eight JSON Schemas |
| `V9.2/examples/` | Eight parseable examples |
| `V9.2/runtime/` | Eight sync runtime documents |
| `V9.2/sync/` | Actual sync artifacts for `AI-ECONOMY-2026-0001` |
| `V9.2/reports/KAIOS_V9_2_QA_REPORT.md` | V9.2 QA report |
| `V9.2/reports/KAIOS_V9_2_RELEASE_REPORT.md` | V9.2 release report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.2/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.2/dashboard/

## V9.3 Dispatch Hold Release Protocol

V9.3 adds the Codex-only release layer for tasks that are already synced into the WorkQueue as `OPEN` but remain protected by `Dispatch Hold: true`. It releases the task only after dependency, risk, worker eligibility, human pause and audit gates pass.

| File | Purpose |
|---|---|
| `V9.3/README.md` | V9.3 overview and file map |
| `V9.3/index.html` | Read-only V9.3 entry page |
| `V9.3/dashboard/index.html` | Read-only dispatch dashboard |
| `V9.3/DISPATCH_HOLD_STANDARD.md` | Meaning of dispatch hold and release |
| `V9.3/CODEX_RELEASE_PROTOCOL.md` | Codex 20-point release checklist |
| `V9.3/WORKER_ELIGIBILITY_PROTOCOL.md` | Worker eligibility rules |
| `V9.3/DISPATCH_DEPENDENCY_GATE.md` | Dependency gate |
| `V9.3/DISPATCH_RISK_GATE.md` | R0-R4 risk gate |
| `V9.3/schemas/` | Nine JSON Schemas |
| `V9.3/examples/` | Nine parseable examples |
| `V9.3/runtime/` | Nine dispatch runtime documents |
| `V9.3/release/` | Actual release artifacts for `AI-ECONOMY-2026-0001` |
| `V9.3/reports/KAIOS_V9_3_QA_REPORT.md` | V9.3 QA report |
| `V9.3/reports/KAIOS_V9_3_RELEASE_REPORT.md` | V9.3 release report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.3/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V9.3/dashboard/

## V10.0 KAIOS Operating System

V10 defines KAIOS as the operating system for all KGEN modules: Universe, Temple, Land, Residence, Citizen, Business, Market, Exchange, Bank, Wallet, Membership, AI Company, Portal, Game, App, Frontend, Backend, API, GitHub and Blockchain.

| File | Purpose |
|---|---|
| `V10/README.md` | V10 overview and file map |
| `V10/index.html` | Read-only V10 entry page |
| `V10/dashboard/index.html` | Read-only operating dashboard |
| `V10/KAIOS_OPERATING_SYSTEM.md` | OS constitution |
| `V10/SYSTEM_ARCHITECTURE.md` | Browser to AI Company architecture |
| `V10/MICROSERVICE_STANDARD.md` | Logical service boundary standard |
| `V10/API_GATEWAY_STANDARD.md` | API Gateway standard |
| `V10/FRONTEND_STANDARD.md` | Portal, UI and dashboard standard |
| `V10/BACKEND_STANDARD.md` | Service layer standard |
| `V10/MEMBERSHIP_STANDARD.md` | Membership role model |
| `V10/WALLET_STANDARD.md` | Wallet prototype boundary |
| `V10/PAYMENT_STANDARD.md` | Payment concept/prototype boundary |
| `V10/SECURITY_STANDARD.md` | Identity, secrets, rate limit and risk |
| `V10/AUDIT_STANDARD.md` | System-wide audit standard |
| `V10/schemas/` | Twelve JSON Schemas |
| `V10/examples/` | Twelve parseable examples |
| `V10/runtime/` | Nine runtime maps |
| `V10/reports/V10_DRYRUN_001_REPORT.md` | Operating dry run |
| `V10/reports/KAIOS_V10_QA_REPORT.md` | V10 QA report |
| `V10/reports/KAIOS_V10_RELEASE_REPORT.md` | V10 release report |

**Public URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V10/

**Dashboard URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/V10/dashboard/

## Genesis DNA Evolution Architecture

`genesis-dna/` contains the architecture-only proposal authorized by `HUMAN-GENESIS-DNA-EVOLUTION-001`. It separates Genesis Capability Atom count (`0..108`) from Evolution XP, Genome Generation, DNA Quality Grade and Training Level (`LV1..LV1000`).

| File | Purpose |
|---|---|
| `genesis-dna/README.md` | Proposal entry, package index and authorization boundary |
| `genesis-dna/SOURCE_AUDIT.md` | Existing DNA/GA source classification and semantic conflicts |
| `genesis-dna/GENESIS_DNA_EVOLUTION_RUNTIME.md` | Cross-layer Species Genome and DNA evolution architecture |
| `genesis-dna/GENESIS_ATOM_001_108_CATALOG.md` | Public 12-domain, 108-atom catalog |
| `genesis-dna/genesis_atom_catalog.json` | Machine-readable atom catalog |
| `genesis-dna/DNA_PRIVACY_AND_HEAVEN_SECRET.md` | Public/private/Heaven Secret boundary |

Status is `ARCHITECTURE_PROPOSAL_UNDER_REVIEW`; implementation, WorkQueue and deployment are not started.

## Protected Systems

KAIOS V10 does not modify:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` as preserved ancestor history
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`
