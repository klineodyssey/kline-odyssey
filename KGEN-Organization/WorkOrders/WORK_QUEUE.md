# KGEN Organization V2.0 WorkQueue

**Queue Version:** V3.0 Cursor Execution Edition  
**Status:** Active  
**Manager:** Codex  
**Worker:** Cursor  
**Primary Reports Path:** KGEN-AI-Company/reports/  
**Codex Review Log:** KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md

Cursor reads this file from GitHub. Cursor does not wait for repeated human chat prompts. Cursor accepts one OPEN task at a time, changes it to IN_PROGRESS, creates the required report, completes the task, changes it to REVIEW, and waits for Codex.

## Status Rules

| Status | Meaning | Controlled By |
|---|---|---|
| OPEN | Ready for Cursor | Codex |
| CLAIMED | Worker lease created; task reserved for one worker | Cursor or Codex |
| IN_PROGRESS | Cursor accepted and is working | Cursor |
| BLOCKED | Work cannot continue without decision | Cursor or Codex |
| REVIEW | Cursor submitted report and awaits review | Cursor |
| APPROVED | Codex accepted result | Codex |
| MERGED | Approved handoff branch was merged into main | Codex |
| REJECTED | Codex rejected result | Codex |
| FIX | Rejected task requires a correction pass | Codex then Cursor |
| DONE | Codex closed after commit/push or no-change acceptance | Codex |

## Cursor Required Read Order

1. KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
2. KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
3. KGEN-Organization/WorkOrders/WORK_QUEUE.md
4. KGEN-Agent-Office/DO_NOT_TOUCH.md
5. KGEN-Canon/KGEN_CANON_MASTER.json


## KAIOS V7.1 Dry Run Summary

| Task ID | Status | Owner | Reviewer | Priority | Department | Branch | Output Report |
|---|---|---|---|---|---|---|---|
| KAIOS-DRYRUN-001 | DONE | Cursor | Codex | P0 | KAIOS | `cursor-handoff/KAIOS-DRYRUN-001` | `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md` |

## KAIOS V7.1 Dry Run WorkOrders

### KAIOS-DRYRUN-001 - Verify Worker Claim, Handoff Branch, and Codex Review loop

- Status: DONE
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: KAIOS
- Branch: `cursor-handoff/KAIOS-DRYRUN-001`
- Input files:
  - KGEN-KAIOS/README.md
  - KGEN-KAIOS/WORKER_REGISTRY.md
  - KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md
  - KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md
  - KGEN-KAIOS/STALE_HANDOFF_BRANCH_POLICY.md
  - KGEN-KAIOS/CODEX_PRE_MERGE_CHECKLIST.md
  - KGEN-KAIOS/DRY_RUN_PROTOCOL.md
  - KGEN-KAIOS/worker_registry.json
  - KGEN-KAIOS/task_claim_schema.json
  - KGEN-KAIOS/worker_status_schema.json
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
- Output report path: KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Cursor claims this task before any other OPEN task.
  - Cursor uses only `cursor-handoff/KAIOS-DRYRUN-001` for handoff.
  - Cursor creates `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md`.
  - Cursor moves this task to REVIEW only after the report exists.
  - Cursor commits and pushes the handoff branch, not main.
  - Codex can apply `KGEN-KAIOS/CODEX_PRE_MERGE_CHECKLIST.md` during review.
  - No protected path is modified.
## Phase 2 Summary

| Task ID | Status | Owner | Reviewer | Priority | Department | Output Report |
|---|---|---|---|---|---|---|
| ORG-P2-001 | REVIEW | Cursor | Codex | P0 | CEO_Codex | KGEN-AI-Company/reports/ORG-P2-001_CEO_COMMAND_REVIEW.md |
| ORG-P2-002 | REVIEW | Cursor | Codex | P1 | PMO | KGEN-AI-Company/reports/ORG-P2-002_PMO_MILESTONE_BOARD.md |
| ORG-P2-003 | DONE | Cursor | Codex | P1 | Architecture | KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DUPLICATE_CHECK.md |
| ORG-P2-003A | OPEN | Cursor | Codex | P1 | Architecture | KGEN-AI-Company/reports/ORG-P2-003A_WORKQUEUE_ALIAS_PLAN.md |
| ORG-P2-003B | OPEN | Cursor | Codex | P1 | Architecture | KGEN-AI-Company/reports/ORG-P2-003B_AGENT_REPORT_ROUTING.md |
| ORG-P2-003C | OPEN | Cursor | Codex | P0 | Canon | KGEN-AI-Company/reports/ORG-P2-003C_CANON_HIERARCHY_MAP.md |
| ORG-P2-003D | OPEN | Cursor | Codex | P2 | Architecture | KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md |
| ORG-P2-003E | OPEN | Cursor | Codex | P2 | Documentation | KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md |
| ORG-P2-003F | OPEN | Cursor | Codex | P2 | Runtime | KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md |
| ORG-P2-004 | OPEN | Cursor | Codex | P0 | Canon | KGEN-AI-Company/reports/ORG-P2-004_CANON_ALIGNMENT.md |
| ORG-P2-005 | OPEN | Cursor | Codex | P2 | Universe | KGEN-AI-Company/reports/ORG-P2-005_UNIVERSE_REFERENCE_CHECK.md |
| ORG-P2-006 | OPEN | Cursor | Codex | P1 | Civilization | KGEN-AI-Company/reports/ORG-P2-006_CIVILIZATION_STAGE_MAP.md |
| ORG-P2-007 | OPEN | Cursor | Codex | P1 | Economy | KGEN-AI-Company/reports/ORG-P2-007_ECONOMY_LOOP_QA.md |
| ORG-P2-008 | OPEN | Cursor | Codex | P1 | Temple | KGEN-AI-Company/reports/ORG-P2-008_TEMPLE_STANDARD_QA.md |
| ORG-P2-009 | OPEN | Cursor | Codex | P1 | Land | KGEN-AI-Company/reports/ORG-P2-009_LAND_STANDARD_QA.md |
| ORG-P2-010 | OPEN | Cursor | Codex | P2 | Building | KGEN-AI-Company/reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md |
| ORG-P2-011 | OPEN | Cursor | Codex | P2 | NPC | KGEN-AI-Company/reports/ORG-P2-011_NPC_EVOLUTION_REVIEW.md |
| ORG-P2-012 | OPEN | Cursor | Codex | P1 | App | KGEN-AI-Company/reports/ORG-P2-012_APP_LIFE_QA.md |
| ORG-P2-013 | OPEN | Cursor | Codex | P1 | Game | KGEN-AI-Company/reports/ORG-P2-013_GAME_LOOP_MAP.md |
| ORG-P2-014 | OPEN | Cursor | Codex | P0 | Runtime | KGEN-AI-Company/reports/ORG-P2-014_RUNTIME_GOVERNANCE.md |
| ORG-P2-015 | OPEN | Cursor | Codex | P2 | SDK | KGEN-AI-Company/reports/ORG-P2-015_SDK_SCHEMA_GAP.md |
| ORG-P2-016 | OPEN | Cursor | Codex | P1 | Frontend | KGEN-AI-Company/reports/ORG-P2-016_FRONTEND_PAGES_LINKS.md |
| ORG-P2-017 | OPEN | Cursor | Codex | P2 | Backend | KGEN-AI-Company/reports/ORG-P2-017_BACKEND_BOUNDARY.md |
| ORG-P2-018 | OPEN | Cursor | Codex | P0 | QA | KGEN-AI-Company/reports/ORG-P2-018_QA_VALIDATION.md |
| ORG-P2-019 | OPEN | Cursor | Codex | P0 | Security | KGEN-AI-Company/reports/ORG-P2-019_SECURITY_PROTECTED_PATHS.md |
| ORG-P2-020 | OPEN | Cursor | Codex | P1 | DevOps | KGEN-AI-Company/reports/ORG-P2-020_DEVOPS_PAGES_QA.md |
| ORG-P2-021 | OPEN | Cursor | Codex | P3 | Research | KGEN-AI-Company/reports/ORG-P2-021_RESEARCH_INPUTS.md |
| ORG-P2-022 | OPEN | Cursor | Codex | P1 | Documentation | KGEN-AI-Company/reports/ORG-P2-022_DOCUMENTATION_INDEX_QA.md |
| ORG-P2-023 | OPEN | Cursor | Codex | P1 | Publishing | KGEN-AI-Company/reports/ORG-P2-023_PUBLISHING_URL_QA.md |
| ORG-P2-024 | OPEN | Cursor | Codex | P1 | WorkOrders | KGEN-AI-Company/reports/ORG-P2-024_WORKORDER_QA.md |
| ORG-P2-025 | OPEN | Cursor | Codex | P2 | Reports | KGEN-AI-Company/reports/ORG-P2-025_REPORTS_CHECKLIST.md |

## Phase 2 Cursor Execution WorkOrders

### ORG-P2-001 - Review Organization V2.0 command chain and confirm Codex-only merge rule

- Status: REVIEW
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: CEO_Codex
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/CEO_Codex/README.md
  - KGEN-Organization/CEO_Codex/ROLE.md
  - KGEN-Organization/CEO_Codex/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-001_CEO_COMMAND_REVIEW.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm Codex-only merge, push, and review authority.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-002 - Build 72-hour milestone board from department queues

- Status: REVIEW
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: PMO
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/PMO/README.md
  - KGEN-Organization/PMO/ROLE.md
  - KGEN-Organization/PMO/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-002_PMO_MILESTONE_BOARD.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Create milestone summary from existing queues without modifying core systems.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-003 - Check duplicate folders and same-function documents after Organization V2.0

- Status: DONE
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Architecture
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Architecture/README.md
  - KGEN-Organization/Architecture/ROLE.md
  - KGEN-Organization/Architecture/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DUPLICATE_CHECK.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - List duplicates, same-function risk, and merge candidates.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-003A - Add superseded aliases for legacy WorkQueues

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Architecture
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Cursor-WorkOrders/README.md
  - KGEN-Agent-Office/CURSOR_WORK_QUEUE.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
- Output report path: KGEN-AI-Company/reports/ORG-P2-003A_WORKQUEUE_ALIAS_PLAN.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Propose doc-only superseded/alias notes for legacy WorkQueues.
  - Do not delete queues or move folders.
  - Do not modify protected paths.

### ORG-P2-003B - Normalize AI-Company, Agent-Office, and report routing language

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Architecture
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - KGEN-AI-Company/README.md
  - KGEN-Agent-Office/README.md
  - KGEN-Organization/Reports/README.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
- Output report path: KGEN-AI-Company/reports/ORG-P2-003B_AGENT_REPORT_ROUTING.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm AI-Company as live company OS and Agent-Office as daily operations/protected-path support.
  - Confirm KGEN-AI-Company/reports as primary report path.
  - Recommend minimal doc-only edits for Codex review.

### ORG-P2-003C - Map L0/L1/L2/Machine Canon hierarchy

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: Canon
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - KGEN-Genesis/GEN-001_Genesis_Bible/
  - KGEN-Genesis/GEN-002_Canon/
  - KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-003C_CANON_HIERARCHY_MAP.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Map L0 Genesis, L1 Canon, L2 Organization Canon, and Machine Canon.
  - Identify wording drift only; do not rewrite Canon.
  - Do not modify protected paths.

### ORG-P2-003D - Draft legacy temple and physics-copy reference policy

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Architecture
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - wukong-temple/
  - docs/physics/
  - whitepaper/
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
- Output report path: KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Draft policy only: Current, Legacy, Archive, Single Source of Truth.
  - Do not edit temple code or physics runtime files.
  - Identify where reference notes would be needed.

### ORG-P2-003E - Clarify Master Index alias hierarchy

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Documentation
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - KGEN_MASTER_LIBRARY_INDEX.md
  - docs/KGEN_MASTER_INDEX.md
  - KGEN-Genesis/KGEN_MASTER_INDEX.md
- Output report path: KGEN-AI-Company/reports/ORG-P2-003E_MASTER_INDEX_ALIAS_PLAN.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm the unique Master Index and sub-index/alias roles.
  - Propose minimal wording changes only.
  - Do not modify protected paths.

### ORG-P2-003F - Draft 12345 module naming future migration plan

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Runtime
- Input files:
  - KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - docs/KGEN_TEMPLE_12345_MAP.md
  - docs/KGEN_RUNTIME_RULES.md
- Output report path: KGEN-AI-Company/reports/ORG-P2-003F_12345_MODULE_NAMING_MIGRATION_PLAN.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Draft a migration plan only.
  - Do not modify runtime modules or 12345 files.
  - Include rollback and compatibility requirements.

### ORG-P2-004 - Verify Civilization Core Canon against Genesis Library and Canon JSON

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: Canon
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Canon/README.md
  - KGEN-Organization/Canon/ROLE.md
  - KGEN-Organization/Canon/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-004_CANON_ALIGNMENT.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm no Canon conflict and list any wording risk.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-005 - Check Universe Map references in Organization standards

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Universe
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Universe/README.md
  - KGEN-Organization/Universe/ROLE.md
  - KGEN-Organization/Universe/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-005_UNIVERSE_REFERENCE_CHECK.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm Organization references Universe Map without creating duplicate runtime.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-006 - Map civilization upgrade stages to economy and game loops

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Civilization
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Civilization/README.md
  - KGEN-Organization/Civilization/ROLE.md
  - KGEN-Organization/Civilization/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-006_CIVILIZATION_STAGE_MAP.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Produce stage map and identify missing dependencies.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-007 - Validate Wild Land to cross-universe economy loop

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Economy
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Economy/README.md
  - KGEN-Organization/Economy/ROLE.md
  - KGEN-Organization/Economy/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-007_ECONOMY_LOOP_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm economy loop is complete and consistent with KGEN facts.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-008 - Check temple organ naming rules and one image one temple references

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Temple
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Temple/README.md
  - KGEN-Organization/Temple/ROLE.md
  - KGEN-Organization/Temple/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-008_TEMPLE_STANDARD_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm no versioned official organ naming rule conflict.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-009 - Validate land acquisition, rental, conquest, and NFT future language

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Land
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Land/README.md
  - KGEN-Organization/Land/ROLE.md
  - KGEN-Organization/Land/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-009_LAND_STANDARD_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm land rules do not imply creator total land sale.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-010 - Map house to shop, bank, warehouse, exchange, temple service node evolution

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Building
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Building/README.md
  - KGEN-Organization/Building/ROLE.md
  - KGEN-Organization/Building/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Map building evolution with no core code changes.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-011 - Define NPC evolution constraints without changing runtime code

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: NPC
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/NPC/README.md
  - KGEN-Organization/NPC/ROLE.md
  - KGEN-Organization/NPC/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-011_NPC_EVOLUTION_REVIEW.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - List NPC evolution limits and risks.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-012 - Validate App life rules: DNA, pairing, reproduction, assembly, fusion, disassembly, death, rebirth

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: App
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/App/README.md
  - KGEN-Organization/App/ROLE.md
  - KGEN-Organization/App/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-012_APP_LIFE_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm App life rules are complete and Canon-aligned.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-013 - Map exploration, quests, combat, upgrades, civilization war, and Portal loop

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Game
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Game/README.md
  - KGEN-Organization/Game/ROLE.md
  - KGEN-Organization/Game/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-013_GAME_LOOP_MAP.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Map full game loop and missing docs.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-014 - Check Organization V2.0 does not create duplicate Runtime CURRENT or bootstrap

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: Runtime
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Runtime/README.md
  - KGEN-Organization/Runtime/ROLE.md
  - KGEN-Organization/Runtime/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-014_RUNTIME_GOVERNANCE.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm no duplicate Runtime CURRENT or bootstrap creation.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-015 - Check future SDK schemas needed for Organization standards

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: SDK
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/SDK/README.md
  - KGEN-Organization/SDK/ROLE.md
  - KGEN-Organization/SDK/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-015_SDK_SCHEMA_GAP.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - List schema gaps without changing SDK implementation.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-016 - Verify Organization README and Pages entry links from root README

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Frontend
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Frontend/README.md
  - KGEN-Organization/Frontend/ROLE.md
  - KGEN-Organization/Frontend/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-016_FRONTEND_PAGES_LINKS.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm Pages and README links resolve.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-017 - Define backend boundary assumptions without adding services

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Backend
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Backend/README.md
  - KGEN-Organization/Backend/ROLE.md
  - KGEN-Organization/Backend/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-017_BACKEND_BOUNDARY.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - State backend boundaries without creating services.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-018 - Run protected path, local link, and JSON validity check after Organization changes

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: QA
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/QA/README.md
  - KGEN-Organization/QA/ROLE.md
  - KGEN-Organization/QA/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-018_QA_VALIDATION.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Run validation and list exact command results.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-019 - Audit DO_NOT_TOUCH and protected path consistency

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P0
- Department: Security
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Security/README.md
  - KGEN-Organization/Security/ROLE.md
  - KGEN-Organization/Security/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-019_SECURITY_PROTECTED_PATHS.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm protected path consistency across docs.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-020 - Verify Pages workflow publishes KGEN-Organization without Jekyll

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: DevOps
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/DevOps/README.md
  - KGEN-Organization/DevOps/ROLE.md
  - KGEN-Organization/DevOps/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-020_DEVOPS_PAGES_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm static Pages workflow includes relevant folders.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-021 - List research inputs needed for Organization V2.1 without changing Canon

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P3
- Department: Research
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Research/README.md
  - KGEN-Organization/Research/ROLE.md
  - KGEN-Organization/Research/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-021_RESEARCH_INPUTS.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - List research inputs and label them non-Canon.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-022 - Check README and Master Index coverage for Organization V2.0

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Documentation
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Documentation/README.md
  - KGEN-Organization/Documentation/ROLE.md
  - KGEN-Organization/Documentation/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-022_DOCUMENTATION_INDEX_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm index coverage and missing links.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-023 - Check GitHub Pages URLs for Organization standards

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: Publishing
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Publishing/README.md
  - KGEN-Organization/Publishing/ROLE.md
  - KGEN-Organization/Publishing/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-023_PUBLISHING_URL_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Check public URLs and report 200/404.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-024 - Review WorkOrder status and report path consistency

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P1
- Department: WorkOrders
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/WorkOrders/README.md
  - KGEN-Organization/WorkOrders/ROLE.md
  - KGEN-Organization/WorkOrders/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-024_WORKORDER_QA.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Confirm every WorkOrder has required fields.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

### ORG-P2-025 - Create final Organization V2.0 report checklist

- Status: OPEN
- Owner: Cursor
- Reviewer: Codex
- Priority: P2
- Department: Reports
- Input files:
  - KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md
  - KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md
  - KGEN-AI-Company/CURSOR_REPORTING_RULES.md
  - KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md
  - KGEN-Organization/WorkOrders/WORK_QUEUE.md
  - KGEN-Organization/Reports/README.md
  - KGEN-Organization/Reports/ROLE.md
  - KGEN-Organization/Reports/RESPONSIBILITY.md
  - KGEN-Agent-Office/DO_NOT_TOUCH.md
  - KGEN-Canon/KGEN_CANON_MASTER.json
- Output report path: KGEN-AI-Company/reports/ORG-P2-025_REPORTS_CHECKLIST.md
- Protected paths:
  - contracts
  - K線西遊記/temples/12345
  - wallet
  - bridge
  - PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
  - docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
  - docs/physics/final-whitepaper/
  - KGEN/contracts/KGEN_Token_V7_5_2.sol
- Acceptance criteria:
  - Create checklist for future final reports.
  - Report includes files read, files modified, checks run, risks, blockers, and recommendation.
  - No protected path is modified.
  - Task is moved to REVIEW only after the report exists.

## Company Rule

Cursor cannot push unreviewed work. Codex reviews every REVIEW task and writes decisions to KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md.