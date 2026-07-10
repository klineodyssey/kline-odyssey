# CURSOR-009_Check_App_Land_Temple_Economy_Loop

**Owner:** Cursor  
**Coordinator:** Codex  
**Status:** Draft for Review  
**Last Update:** 2026-07-09

## Mission

確認 App、土地、神殿、民宅、商店、AI、DNA、11520 與 KGEN 閉環沒有斷點。

## Must Check

- Confirm required files exist.
- Confirm official Canon is not contradicted.
- Confirm official URLs and KGEN Token facts are consistent.
- Confirm no protected area is modified.
- Confirm output report lists exact file paths and PASS / WARN / BLOCKER.

## Must Not Modify

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- Existing files under `docs/physics/final-whitepaper`

## May Fix

Cursor may fix document-only spelling, relative links, index paths, schema formatting, metadata consistency, and report wording after Codex approval. Cursor must not change program behavior.

## Output Report

Return a Markdown report named `CURSOR-009_Check_App_Land_Temple_Economy_Loop_REPORT.md` with:

1. Scope checked.
2. Files inspected.
3. PASS findings.
4. WARN findings.
5. BLOCKER findings.
6. Suggested document-only fixes.
7. Confirmation that protected systems remain unchanged.

## How To Report To Codex

Send the report path, summary, exact changed files if any, and whether Codex may stage the document-only changes.
