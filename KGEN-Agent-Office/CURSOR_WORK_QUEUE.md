# Cursor Work Queue

**Queue Version:** V1.0  
**Maintainer:** Codex  
**Worker:** Cursor  
**Rule:** Cursor starts from the first task with `Status: OPEN`.

## TASK-001

**Status:** OPEN  
**Title:** Review main working tree uncommitted files without deleting or overwriting  

### Target Files

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `README.md`
- `KGEN_AI_RULES.md`
- `KGEN_BOOT_GRAPH.md`
- `KGEN_MASTER_INDEX.md`
- `KGEN_MODULE_MAP.md`
- `KGEN_RUNTIME_TREE.md`
- `VALIDATION_REPORT.md`

### Requirements

For each file, determine its purpose and classify it as:

- A. Should preserve
- B. Should merge
- C. Should archive
- D. Needs human confirmation

### Output

`KGEN-Agent-Office/reports/TASK-001_UNCOMMITTED_FILES_REVIEW.md`

### Restrictions

Do not delete files. Do not overwrite files. Do not reset the working tree.

## TASK-002

**Status:** OPEN  
**Title:** Check KGEN Genesis / Runtime / SDK / Canon entry links  

### Scope

Check whether official entry links and internal links resolve across:

- `KGEN-Genesis/`
- `KGEN-Runtime/`
- `KGEN-SDK/`
- `KGEN-Canon/`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- root `README.md`

### Output

`KGEN-Agent-Office/reports/TASK-002_LINK_CHECK_REPORT.md`

## TASK-003

**Status:** OPEN  
**Title:** Check App, Land, Temple, House, Shop, 11520 Exchange, AI, DNA, GA consistency  

### Scope

Verify that all libraries consistently describe:

- App as life;
- Land as Wild Land first;
- Temple as life;
- House evolving to shop;
- 11520 as exchange center;
- AI as life organ;
- DNA / GA as evolution core;
- the full economy loop.

### Output

`KGEN-Agent-Office/reports/TASK-003_CANON_LOOP_CHECK.md`

## TASK-004

**Status:** OPEN  
**Title:** Check BscScan / CMC / CoinGecko submission fields from Canon JSON  

### Scope

Confirm that listing fields can be read from:

`KGEN-Canon/KGEN_CANON_MASTER.json`

### Output

`KGEN-Agent-Office/reports/TASK-004_LISTING_READY_REPORT.md`

## TASK-005

**Status:** OPEN  
**Title:** Build next Codex work proposal without modifying core systems  

### Scope

Review current documentation state and propose the next Codex work batch.

### Output

`KGEN-Agent-Office/reports/TASK-005_NEXT_CODEX_PLAN.md`

### Restriction

Do not directly change the main system, contracts, temple runtime, wallet, bridge, Boot, Runtime CURRENT, or final whitepaper.

