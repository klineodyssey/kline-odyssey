# KAIOS Reports

**Path:** `KGEN-KAIOS/reports/`
**Purpose:** Store KAIOS-specific dry run, worker claim, handoff, review, and recovery reports.

## Current Dry Run Report

| Task ID | Expected Report | Owner | Reviewer | Status |
|---|---|---|---|---|
| KAIOS-DRYRUN-001 | `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md` | Cursor | Codex | DONE |

## TempleHeart BSC Testnet Evidence

| Evidence | Path | Network | Status |
|---|---|---|---|
| Human-readable rehearsal report | `KGEN-KAIOS/reports/BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.md` | BSC Testnet chainId 97 | PASS |
| Machine-readable rehearsal evidence | `KGEN-KAIOS/reports/BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.json` | BSC Testnet chainId 97 | PASS |

## KAIOS Civilization Phase 2 Mainnet Evidence

| Evidence | Path | Network | Status |
|---|---|---|---|
| Stage 2C-0 machine-readable KGEN ownership migration | `KGEN-KAIOS/reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE2C0_2026-08-15.json` | BSC Mainnet chainId 56 | PASS |
| Stage 2C-0 human-readable KGEN ownership migration | `KGEN-KAIOS/reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE2C0_2026-08-15.md` | BSC Mainnet chainId 56 | PASS |

## Report Rules

- Cursor writes the task report here only after claiming the dry run WorkOrder.
- Codex reviews the report through the handoff branch before merge.
- Reports must list files read, files modified, checks run, branch name, commit SHA, risks, and recommendation.
- Reports must confirm that protected paths were not modified.

## Protected Paths

Reports must confirm no changes to:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`
