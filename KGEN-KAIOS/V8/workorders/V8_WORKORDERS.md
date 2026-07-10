# KAIOS V8.0 WorkOrders

**System:** KAIOS V8.0 One Picture One Temple Economy System  
**Status:** Draft for Review  
**Owner:** Codex Dispatcher  
**Worker Pattern:** Cursor Handoff Branch Workflow  
**Review Rule:** Codex reviews before merge to `main`.  
**Protected Paths:** `contracts`, `K線西遊記/temples/12345`, `wallet`, `bridge`, `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`, `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`, `docs/physics/final-whitepaper/`, `KGEN/contracts/KGEN_Token_V7_5_2.sol`

## Execution Rule

These WorkOrders translate V8.0 from architecture into reviewable tasks. Cursor or another Worker may claim one task at a time through KAIOS claim lease rules. Each task must push a handoff branch, write the required report, and stop for Codex review. No Worker may push `main` directly.

## Shared Acceptance Gates

Every V8 WorkOrder must keep the official Canon intact: one picture one temple, one temple one life, one land one residence, one residence one store, one store one economy, one economy one civilization node. Every task must distinguish Concept, Prototype, Runtime, Production, and Regulated scope. No task may claim a real-world partnership, financial license, securities approval, or brand authorization unless a separate legal record exists in the repository.

## V8 WorkOrder Matrix

| Task ID | Title | Owner | Reviewer | Priority | Status | Branch | Report Path |
|---|---|---|---|---|---|---|---|
| V8-P0 | Architecture Baseline Review | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P0-ARCHITECTURE` | `KGEN-KAIOS/V8/reports/V8-P0_ARCHITECTURE_REPORT.md` |
| V8-P1 | Canon Alignment Review | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P1-CANON` | `KGEN-KAIOS/V8/reports/V8-P1_CANON_ALIGNMENT_REPORT.md` |
| V8-P2 | Data Schemas Validation | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P2-SCHEMAS` | `KGEN-KAIOS/V8/reports/V8-P2_SCHEMA_VALIDATION_REPORT.md` |
| V8-P3 | Player Entry Model QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P3-PLAYER-ENTRY` | `KGEN-KAIOS/V8/reports/V8-P3_PLAYER_ENTRY_REPORT.md` |
| V8-P4 | Land Runtime QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P4-LAND` | `KGEN-KAIOS/V8/reports/V8-P4_LAND_RUNTIME_REPORT.md` |
| V8-P5 | Residence Store Runtime QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P5-RESIDENCE-STORE` | `KGEN-KAIOS/V8/reports/V8-P5_RESIDENCE_STORE_REPORT.md` |
| V8-P6 | Temple Runtime QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P6-TEMPLE` | `KGEN-KAIOS/V8/reports/V8-P6_TEMPLE_RUNTIME_REPORT.md` |
| V8-P7 | Bank Runtime Boundary QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P7-BANK` | `KGEN-KAIOS/V8/reports/V8-P7_BANK_RUNTIME_REPORT.md` |
| V8-P8 | Huaguo Exchange 11520 QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P8-EXCHANGE-11520` | `KGEN-KAIOS/V8/reports/V8-P8_EXCHANGE_11520_REPORT.md` |
| V8-P9 | Real-World Link QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P9-REAL-WORLD-LINK` | `KGEN-KAIOS/V8/reports/V8-P9_REAL_WORLD_LINK_REPORT.md` |
| V8-P10 | Listing Standard QA | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P10-LISTING` | `KGEN-KAIOS/V8/reports/V8-P10_LISTING_STANDARD_REPORT.md` |
| V8-P11 | Frontend Demo QA | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P11-FRONTEND-DEMO` | `KGEN-KAIOS/V8/reports/V8-P11_FRONTEND_DEMO_REPORT.md` |
| V8-P12 | Security Legal Boundary QA | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P12-SECURITY-LEGAL` | `KGEN-KAIOS/V8/reports/V8-P12_SECURITY_LEGAL_REPORT.md` |
| V8-P13 | Full QA Sweep | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P13-QA` | `KGEN-KAIOS/V8/reports/V8-P13_QA_REPORT.md` |
| V8-P14 | Pages Deployment Check | Cursor | Codex | P1 | OPEN | `cursor-handoff/V8-P14-PAGES` | `KGEN-KAIOS/V8/reports/V8-P14_PAGES_DEPLOYMENT_REPORT.md` |
| V8-P15 | Final Release Review | Cursor | Codex | P0 | OPEN | `cursor-handoff/V8-P15-FINAL-REPORT` | `KGEN-KAIOS/V8/reports/V8-P15_FINAL_RELEASE_REPORT.md` |

## Detailed WorkOrders

### V8-P0 Architecture Baseline Review

- **Task ID:** V8-P0
- **Parent Asset ID:** KAIOS-V8
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** KAIOS V7.2, KAIOS V8.0 master specification
- **Input Files:** `KGEN-KAIOS/V8/README.md`, `KGEN-KAIOS/V8/KAIOS_V8_MASTER_SPEC.md`, `KGEN-KAIOS/V8/assets/README.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P0_ARCHITECTURE_REPORT.md`
- **Acceptance Criteria:** Confirms V8 is a Concept/Prototype/Runtime architecture, not a production financial or legal claim; confirms official blueprint asset is linked and preserved.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P0-ARCHITECTURE`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P0_ARCHITECTURE_REPORT.md`
- **Legal Review Required:** No, unless new real-world claims are added
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P1 Canon Alignment Review

- **Task ID:** V8-P1
- **Parent Asset ID:** KAIOS-V8-CANON
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** Genesis Library, Machine Canon, V8 master specification
- **Input Files:** `KGEN-Canon/KGEN_CANON_MASTER.json`, `KGEN-Genesis/`, `KGEN-KAIOS/V8/`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P1_CANON_ALIGNMENT_REPORT.md`
- **Acceptance Criteria:** Confirms V8 does not contradict one picture one temple, App as life, land lifecycle, temple life, AI/DNA/GA evolution, and 11520 exchange role.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P1-CANON`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P1_CANON_ALIGNMENT_REPORT.md`
- **Legal Review Required:** No
- **Security Review Required:** No
- **Status:** OPEN

### V8-P2 Data Schemas Validation

- **Task ID:** V8-P2
- **Parent Asset ID:** KAIOS-V8-DATA
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** V8 data model
- **Input Files:** `KGEN-KAIOS/V8/schemas/`, `KGEN-KAIOS/V8/examples/`, `KGEN-KAIOS/V8/KAIOS_V8_DATA_MODEL.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P2_SCHEMA_VALIDATION_REPORT.md`
- **Acceptance Criteria:** All JSON files parse; examples reference schema-aligned fields; no regulated production claims are encoded as active permissions.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P2-SCHEMAS`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P2_SCHEMA_VALIDATION_REPORT.md`
- **Legal Review Required:** No
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P3 Player Entry Model QA

- **Task ID:** V8-P3
- **Parent Asset ID:** KAIOS-V8-ENTRY
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 player entry model and task generator
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_PLAYER_ENTRY_MODEL.md`, `KGEN-KAIOS/V8/KAIOS_V8_TASK_GENERATOR.md`, `KGEN-KAIOS/V8/examples/`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P3_PLAYER_ENTRY_REPORT.md`
- **Acceptance Criteria:** Picture, Land, Residence, Temple, App, Real Business, and Civilization Node entry paths all generate missing modules and WorkOrder roadmaps.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P3-PLAYER-ENTRY`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P3_PLAYER_ENTRY_REPORT.md`
- **Legal Review Required:** Only for Real Business examples
- **Security Review Required:** No
- **Status:** OPEN

### V8-P4 Land Runtime QA

- **Task ID:** V8-P4
- **Parent Asset ID:** KAIOS-V8-LAND
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 lifecycle, land schema, economy runtime
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_ASSET_LIFECYCLE.md`, `KGEN-KAIOS/V8/schemas/land.schema.json`, `KGEN-KAIOS/V8/KAIOS_V8_ECONOMY_RUNTIME.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P4_LAND_RUNTIME_REPORT.md`
- **Acceptance Criteria:** Land supports Wild Land, claim, construction, rental, trade, war acquisition, free market transfer, and recovery without implying creator-sold land.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P4-LAND`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P4_LAND_RUNTIME_REPORT.md`
- **Legal Review Required:** For real-world land mapping only
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P5 Residence Store Runtime QA

- **Task ID:** V8-P5
- **Parent Asset ID:** KAIOS-V8-BUILDING
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 lifecycle, building/residence/business schemas
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_ASSET_LIFECYCLE.md`, `KGEN-KAIOS/V8/schemas/building.schema.json`, `KGEN-KAIOS/V8/schemas/residence.schema.json`, `KGEN-KAIOS/V8/schemas/business.schema.json`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P5_RESIDENCE_STORE_REPORT.md`
- **Acceptance Criteria:** Residence can evolve into store, bank branch, exchange node, warehouse, factory, service station, and temple service node with clear rights and restrictions.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P5-RESIDENCE-STORE`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P5_RESIDENCE_STORE_REPORT.md`
- **Legal Review Required:** For real merchant mapping only
- **Security Review Required:** No
- **Status:** OPEN

### V8-P6 Temple Runtime QA

- **Task ID:** V8-P6
- **Parent Asset ID:** KAIOS-V8-TEMPLE
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 master spec and temple schema
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_MASTER_SPEC.md`, `KGEN-KAIOS/V8/schemas/temple.schema.json`, `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P6_TEMPLE_RUNTIME_REPORT.md`
- **Acceptance Criteria:** Temple remains a life with AI, DNA, Runtime, level, skills, governance, economy, and real-world link capability.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P6-TEMPLE`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P6_TEMPLE_RUNTIME_REPORT.md`
- **Legal Review Required:** For physical temple mapping only
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P7 Bank Runtime Boundary QA

- **Task ID:** V8-P7
- **Parent Asset ID:** KAIOS-V8-BANK
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 bank runtime and security/legal boundary
- **Input Files:** `KGEN-KAIOS/V8/runtime/KAIOS_V8_BANK_RUNTIME.md`, `KGEN-KAIOS/V8/schemas/bank.schema.json`, `KGEN-KAIOS/V8/KAIOS_V8_SECURITY_AND_LEGAL_BOUNDARY.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P7_BANK_RUNTIME_REPORT.md`
- **Acceptance Criteria:** Bank is described as KGEN world simulation and prototype runtime; real financial service requires licensed institution and local compliance.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P7-BANK`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P7_BANK_RUNTIME_REPORT.md`
- **Legal Review Required:** Yes
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P8 Huaguo Exchange 11520 QA

- **Task ID:** V8-P8
- **Parent Asset ID:** KAIOS-V8-EXCHANGE-11520
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 exchange runtime, listing standard, economy runtime
- **Input Files:** `KGEN-KAIOS/V8/runtime/HUAGUO_EXCHANGE_11520_RUNTIME.md`, `KGEN-KAIOS/V8/KAIOS_V8_LISTING_STANDARD.md`, `KGEN-KAIOS/V8/schemas/exchange.schema.json`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P8_EXCHANGE_11520_REPORT.md`
- **Acceptance Criteria:** Exchange supports Land, Temple, Building, Residence, Store, App, AI, DNA, GA Strategy, Equipment, Materials, Civilization Technology, Real-World Business Twin, and future regulated rights with boundaries.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P8-EXCHANGE-11520`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P8_EXCHANGE_11520_REPORT.md`
- **Legal Review Required:** Yes for real-world and regulated listings
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P9 Real-World Link QA

- **Task ID:** V8-P9
- **Parent Asset ID:** KAIOS-V8-REAL-WORLD-LINK
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** Real-world link standard and schema
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_REAL_WORLD_LINK_STANDARD.md`, `KGEN-KAIOS/V8/schemas/real_world_link.schema.json`, `KGEN-KAIOS/V8/examples/real_business_twin.example.json`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P9_REAL_WORLD_LINK_REPORT.md`
- **Acceptance Criteria:** Clothing store, restaurant, convenience store type, shopping mall, bank branch, service counter, temple shop, warehouse, factory, and membership club are modeled as categories without unauthorized brand claims.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P9-REAL-WORLD-LINK`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P9_REAL_WORLD_LINK_REPORT.md`
- **Legal Review Required:** Yes
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P10 Listing Standard QA

- **Task ID:** V8-P10
- **Parent Asset ID:** KAIOS-V8-LISTING
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** V8 listing standard and listing schema
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_LISTING_STANDARD.md`, `KGEN-KAIOS/V8/schemas/listing.schema.json`, `KGEN-KAIOS/V8/examples/huaguo_exchange_listing.example.json`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P10_LISTING_STANDARD_REPORT.md`
- **Acceptance Criteria:** Listing classes A/B/C/D are separated, and class D is Future Regulated Module only.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P10-LISTING`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P10_LISTING_STANDARD_REPORT.md`
- **Legal Review Required:** Yes
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P11 Frontend Demo QA

- **Task ID:** V8-P11
- **Parent Asset ID:** KAIOS-V8-DEMO
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** V8 demo files
- **Input Files:** `KGEN-KAIOS/V8/index.html`, `KGEN-KAIOS/V8/v8.css`, `KGEN-KAIOS/V8/v8.js`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P11_FRONTEND_DEMO_REPORT.md`
- **Acceptance Criteria:** Demo is read-only, mobile-readable, no backend writes, no token, no payment, no real trade, and displays missing modules, WorkOrder roadmap, economy loop, 11520, bank, mall/store categories, and compliance status.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P11-FRONTEND-DEMO`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P11_FRONTEND_DEMO_REPORT.md`
- **Legal Review Required:** No
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P12 Security Legal Boundary QA

- **Task ID:** V8-P12
- **Parent Asset ID:** KAIOS-V8-LEGAL
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** Security/legal boundary and all V8 documents
- **Input Files:** `KGEN-KAIOS/V8/KAIOS_V8_SECURITY_AND_LEGAL_BOUNDARY.md`, `KGEN-KAIOS/V8/`, `KGEN-KAIOS/V8/runtime/`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P12_SECURITY_LEGAL_REPORT.md`
- **Acceptance Criteria:** No unauthorized brand partnership, real financial service, securities trading, regulated marketplace, or tax/legal compliance claim appears as Production.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P12-SECURITY-LEGAL`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P12_SECURITY_LEGAL_REPORT.md`
- **Legal Review Required:** Yes
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P13 Full QA Sweep

- **Task ID:** V8-P13
- **Parent Asset ID:** KAIOS-V8-QA
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** V8-P0 through V8-P12 artifacts
- **Input Files:** `KGEN-KAIOS/V8/`, `README.md`, `KGEN-KAIOS/README.md`, `KGEN_MASTER_LIBRARY_INDEX.md`, `.github/workflows/deploy-pages-static.yml`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P13_QA_REPORT.md`
- **Acceptance Criteria:** Confirms file existence, JSON parse, demo load, link readability, no forbidden marker words, and no protected path modifications.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P13-QA`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P13_QA_REPORT.md`
- **Legal Review Required:** No
- **Security Review Required:** Yes
- **Status:** OPEN

### V8-P14 Pages Deployment Check

- **Task ID:** V8-P14
- **Parent Asset ID:** KAIOS-V8-PAGES
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P1
- **Dependencies:** Static Pages workflow and V8 demo
- **Input Files:** `.github/workflows/deploy-pages-static.yml`, `KGEN-KAIOS/V8/`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P14_PAGES_DEPLOYMENT_REPORT.md`
- **Acceptance Criteria:** Public Pages URL returns 200 for V8 index, blueprint PNG, schema, and build-info after deployment.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P14-PAGES`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P14_PAGES_DEPLOYMENT_REPORT.md`
- **Legal Review Required:** No
- **Security Review Required:** No
- **Status:** OPEN

### V8-P15 Final Release Review

- **Task ID:** V8-P15
- **Parent Asset ID:** KAIOS-V8-RELEASE
- **Owner:** Cursor
- **Reviewer:** Codex
- **Priority:** P0
- **Dependencies:** All V8 release artifacts
- **Input Files:** `KGEN-KAIOS/V8/`, `KGEN-KAIOS/README.md`, `README.md`, `KGEN_MASTER_LIBRARY_INDEX.md`
- **Expected Outputs:** `KGEN-KAIOS/V8/reports/V8-P15_FINAL_RELEASE_REPORT.md`
- **Acceptance Criteria:** Confirms V8.0 is ready as official Draft for Review / Prototype system with architecture, Canon, schemas, runtime, demo, workorders, QA, and compliance boundaries.
- **Protected Paths:** Shared protected paths above
- **Branch:** `cursor-handoff/V8-P15-FINAL-REPORT`
- **Base Commit:** origin/main at claim time
- **Report Path:** `KGEN-KAIOS/V8/reports/V8-P15_FINAL_RELEASE_REPORT.md`
- **Legal Review Required:** Yes
- **Security Review Required:** Yes
- **Status:** OPEN