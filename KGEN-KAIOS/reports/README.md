# KAIOS Reports

**Path:** `KGEN-KAIOS/reports/`
**Purpose:** Store KAIOS-specific dry run, worker claim, handoff, review, and recovery reports.

## Current Dry Run Report

| Task ID | Expected Report | Owner | Reviewer | Status |
|---|---|---|---|---|
| KAIOS-DRYRUN-001 | `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md` | Cursor | Codex | Pending Cursor execution |

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