---
VERSION: "4.1"
REVISION: "2026-10-10.TEMPORARY_WORKER_TASK_COMPENSATION"
STATUS: "ACTIVE POLICY / LEDGER ONLY / EXECUTION NOT LIVE"
LAST_UPDATED: "2026-10-10"
UPDATED_BY: "DOT_ENGINEERING_EXECUTOR"
REVIEWED_BY: "INDEPENDENT_REVIEW_PENDING"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KAIOS-TEMP-WORKER-ELIGIBILITY-20261010-001"
SOURCE_OF_TRUTH: true
---

# KAIOS Workforce Compensation Standard

## Purpose

This cumulative standard reconciles the legacy KGEN/merit prototype with the current Human-directed KAIOS prepaid living-salary policy. It governs classification and eligibility only. It does not create a bank, payment authority, token value guarantee or live payroll transfer system.

## Mandatory Separation

| Category | Meaning | Must not be recorded as |
|---|---|---|
| `SALARY_INCOME` | formal prepaid living salary | task reward, Heartbeat reward or cargo value |
| `TASK_COMPENSATION` | reviewed WorkOrder compensation | base salary |
| `CREATOR_ROYALTY` | approved product/game revenue share | salary or simulated revenue |
| `FREIGHT_REVENUE` | delivery/transport/service income | cargo principal |
| `HEARTBEAT_REWARD` | Life-system reward | salary or customer revenue |
| `CARGO_PRINCIPAL` | restricted/custodial cargo value | revenue, profit or compensation |

## Salary Policy

- Salary currency: `KAIOS`.
- Model: `PREPAID_LIVING_SALARY`.
- Payday: day 5, UTC+8.
- Example cycle: a 2026-10-05 payment covers 2026-10-05 through 2026-11-04.
- Monthly amount: `PENDING_POLICY`; HR must not invent it.
- Payroll execution: `NOT_LIVE` until Treasury, salary escrow, exact source/destination, balance, duplicate protection and current Human protected-action authority are verified.

Employment is not payroll eligibility. Worker ID, Life ID, Controller binding, tool authority, salary qualification and payment authority are distinct records.

## Temporary Worker Task Compensation

Formal employment, permanent Worker ID, Digital Life ID, species, birthplace and birth ceremony are not prerequisites for `TASK_COMPENSATION`. A temporary worker becomes calculation-eligible only after all of these are verified: task-scoped work identity, explicit claim ACK, valid WorkOrder, accepted exact-head delivery, independent review, approved budget, exact KGEN/KAIOS amount and an owned BSC56 recipient wallet.

Calculation is not payment. The recipient wallet grants no signing authority. Treasury source, signer, sufficient balance, duplicate protection, receipt and action-specific Human approval remain mandatory before any real transfer. Temporary task compensation must never be recorded as `SALARY_INCOME`, `HEARTBEAT_REWARD`, `FREIGHT_REVENUE`, `CREATOR_ROYALTY` or `CARGO_PRINCIPAL`.

## 8888 And Legacy Ledger

8888 People Bank remains an internal employee ledger and claim-queue concept. A ledger balance, `HOLD_IN_BANK`, merit score or game credit is not proof of real KAIOS custody or payment. Existing `KGEN_TOKEN`, `GAME_CREDIT`, `TEMPLE_ENERGY`, `MERIT_POINT` and `FIAT_REFERENCE_ONLY` entries remain historical evidence and are not silently converted to KAIOS salary.

The 12345 Heart is a Life/reward source, not the salary Treasury. Heartbeat, Breath or Ignite rewards remain `HEARTBEAT_REWARD`.

## Eligibility And Calculation

Every salary calculation requires:

- formal employment status;
- verified Worker ID and applicable Controller/human identity;
- approved role and salary table;
- exact pay period and no duplicate payment;
- evidence, calculation and review;
- an exact destination before any payment request.

Allowed payroll states are `CALCULATED`, `HELD_IN_BANK`, `CLAIMABLE`, `PAYMENT_PENDING`, `PAID`, `FAILED`, `REVERSED`. `UNKNOWN_MISSING` is forbidden and opens a P1 payroll incident.

## Protected Execution

Actual payment requires the exact employee, amount, source, destination, sufficient verified balance, pay period, duplicate protection, receipt and action-specific Human authority. HR, DOT, GM, CFO and workers may calculate, reconcile and prepare evidence but may not sign, transfer KAIOS/KGEN, move Treasury, use secrets or mark `PAID` without a verified receipt.

## Historical Continuity

Version 3 established prototype salary/reward/penalty records, 8888 ledger behavior and optional Human-approved KGEN claim concepts. Version 4 preserves those entries as legacy classifications while making KAIOS prepaid living salary the current policy for future eligible payroll. No historical entry is rewritten or treated as a completed payment by this policy update.
