# KGEN Organization V2.0 Second Stage WorkQueue

**Queue Version:** V2.0  
**Status:** Active  
**Owner:** Codex  
**Worker:** Cursor  
**Rule:** Cursor accepts one OPEN task at a time, produces the listed report, then moves the task to REVIEW for Codex.

## Status Model

- OPEN: Ready for Cursor.
- IN_PROGRESS: Cursor is executing this task.
- REVIEW: Cursor has submitted a report and Codex must review.
- DONE: Codex accepted the work.
- BLOCKED: Requires human or Codex decision.

## Phase 2 WorkOrders

| Task ID | Status | Department | Title | Required Report |
|---|---|---|---|---|
| ORG-P2-001 | OPEN | CEO_Codex | Review Organization V2.0 command chain and confirm Codex-only merge rule | `KGEN-Organization/Reports/ORG-P2-001_CEO_COMMAND_REVIEW.md` |
| ORG-P2-002 | OPEN | PMO | Build 72-hour milestone board from department queues | `KGEN-Organization/Reports/ORG-P2-002_PMO_MILESTONE_BOARD.md` |
| ORG-P2-003 | OPEN | Architecture | Check duplicate folders and same-function documents after Organization V2.0 | `KGEN-Organization/Reports/ORG-P2-003_ARCHITECTURE_DUPLICATE_CHECK.md` |
| ORG-P2-004 | OPEN | Canon | Verify Civilization Core Canon against Genesis Library and Canon JSON | `KGEN-Organization/Reports/ORG-P2-004_CANON_ALIGNMENT.md` |
| ORG-P2-005 | OPEN | Universe | Check Universe Map references in Organization standards | `KGEN-Organization/Reports/ORG-P2-005_UNIVERSE_REFERENCE_CHECK.md` |
| ORG-P2-006 | OPEN | Civilization | Map civilization upgrade stages to economy and game loops | `KGEN-Organization/Reports/ORG-P2-006_CIVILIZATION_STAGE_MAP.md` |
| ORG-P2-007 | OPEN | Economy | Validate Wild Land to cross-universe economy loop | `KGEN-Organization/Reports/ORG-P2-007_ECONOMY_LOOP_QA.md` |
| ORG-P2-008 | OPEN | Temple | Check temple organ naming rules and one image one temple references | `KGEN-Organization/Reports/ORG-P2-008_TEMPLE_STANDARD_QA.md` |
| ORG-P2-009 | OPEN | Land | Validate land acquisition, rental, conquest, and NFT future language | `KGEN-Organization/Reports/ORG-P2-009_LAND_STANDARD_QA.md` |
| ORG-P2-010 | OPEN | Building | Map house to shop, bank, warehouse, exchange, temple service node evolution | `KGEN-Organization/Reports/ORG-P2-010_BUILDING_EVOLUTION_MAP.md` |
| ORG-P2-011 | OPEN | NPC | Define NPC evolution constraints without changing runtime code | `KGEN-Organization/Reports/ORG-P2-011_NPC_EVOLUTION_REVIEW.md` |
| ORG-P2-012 | OPEN | App | Validate App life rules: DNA, pairing, reproduction, assembly, fusion, disassembly, death, rebirth | `KGEN-Organization/Reports/ORG-P2-012_APP_LIFE_QA.md` |
| ORG-P2-013 | OPEN | Game | Map exploration, quests, combat, upgrades, civilization war, and Portal loop | `KGEN-Organization/Reports/ORG-P2-013_GAME_LOOP_MAP.md` |
| ORG-P2-014 | OPEN | Runtime | Check Organization V2.0 does not create duplicate Runtime CURRENT or bootstrap | `KGEN-Organization/Reports/ORG-P2-014_RUNTIME_GOVERNANCE.md` |
| ORG-P2-015 | OPEN | SDK | Check future SDK schemas needed for Organization standards | `KGEN-Organization/Reports/ORG-P2-015_SDK_SCHEMA_GAP.md` |
| ORG-P2-016 | OPEN | Frontend | Verify Organization README and Pages entry links from root README | `KGEN-Organization/Reports/ORG-P2-016_FRONTEND_PAGES_LINKS.md` |
| ORG-P2-017 | OPEN | Backend | Define backend boundary assumptions without adding services | `KGEN-Organization/Reports/ORG-P2-017_BACKEND_BOUNDARY.md` |
| ORG-P2-018 | OPEN | QA | Run protected path, local link, and JSON validity check after Organization changes | `KGEN-Organization/Reports/ORG-P2-018_QA_VALIDATION.md` |
| ORG-P2-019 | OPEN | Security | Audit DO_NOT_TOUCH and protected path consistency | `KGEN-Organization/Reports/ORG-P2-019_SECURITY_PROTECTED_PATHS.md` |
| ORG-P2-020 | OPEN | DevOps | Verify Pages workflow publishes KGEN-Organization without Jekyll | `KGEN-Organization/Reports/ORG-P2-020_DEVOPS_PAGES_QA.md` |
| ORG-P2-021 | OPEN | Research | List research inputs needed for Organization V2.1 without changing Canon | `KGEN-Organization/Reports/ORG-P2-021_RESEARCH_INPUTS.md` |
| ORG-P2-022 | OPEN | Documentation | Check README and Master Index coverage for Organization V2.0 | `KGEN-Organization/Reports/ORG-P2-022_DOCUMENTATION_INDEX_QA.md` |
| ORG-P2-023 | OPEN | Publishing | Check GitHub Pages URLs for Organization standards | `KGEN-Organization/Reports/ORG-P2-023_PUBLISHING_URL_QA.md` |
| ORG-P2-024 | OPEN | WorkOrders | Review WorkOrder status and report path consistency | `KGEN-Organization/Reports/ORG-P2-024_WORKORDER_QA.md` |
| ORG-P2-025 | OPEN | Reports | Create final Organization V2.0 report checklist | `KGEN-Organization/Reports/ORG-P2-025_REPORTS_CHECKLIST.md` |

## Protected Paths

No Organization V2.0 WorkOrder may modify contracts, `K線西遊記/temples/12345`, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or any unconfirmed user files unless a human gives a separate explicit instruction.
