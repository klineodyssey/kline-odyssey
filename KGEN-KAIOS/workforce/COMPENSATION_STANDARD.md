---
VERSION: "3.0"
REVISION: "2026-07-13.WORKFORCE_V3"
STATUS: "ACTIVE / PROTOTYPE GOVERNANCE"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex"
REVIEWED_BY: "Codex"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KGEN-WORKFORCE-V3-2026-0001"
CHANGE_REASON: "Define salary, 8888 bank ledger, game rewards, Robo simulation and human approval boundaries."
SOURCE_OF_TRUTH: true
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Workforce"
Class: "Compensation"
Order: "Payroll"
Family: "Internal Ledger"
Genus: "Workforce Compensation"
Species: "KGEN-KAIOS/workforce/COMPENSATION_STANDARD.md"
---

# KGEN Workforce Compensation Standard

## Purpose

This standard defines how KGEN Workforce evidence becomes prototype compensation records. It does not create a real bank, real payroll provider, securities product, investment service, or autonomous payment system.

## System Split

| System | Purpose | Prohibited Use |
|---|---|---|
| 12345 Wukong Heart | Civilization life core, merit, energy and game reward source, Temple Runtime symbol | Not the formal salary treasury, not an employee key store, no AI withdrawal authority |
| 8888 People Bank | Company salary ledger, department budget, employee payable salary, bonuses, penalties, game asset account, claim queue, audit and freeze controls, simulation investment mandate | Not a licensed bank, no real deposit guarantee, no autonomous real-money trading |
| KGEN Payroll Vault | Future human-approved on-chain KGEN distribution and reconciliation with the 8888 ledger | No private keys, no seed phrases, no automatic AI signing, no frontend token storage |

## Formal Payroll Flow

```text
Work Evidence
-> Codex Review
-> Payroll Calculation
-> 8888 Bank Employee Account
-> Human-approved Claim
-> Optional KGEN Payroll Vault Distribution
```

## Salary Types

Allowed salary types are:

- BASE_SALARY
- TASK_REWARD
- QUALITY_BONUS
- REVIEW_BONUS
- RESEARCH_BONUS
- BUG_BOUNTY
- TEMPLE_REWARD
- GAME_REWARD
- LEADERSHIP_BONUS
- PENALTY
- REVERSAL
- WITHHELD
- CLAIMED
- PAID

## Units

Units must not be mixed without an explicit conversion record and review:

- KGEN_TOKEN
- GAME_CREDIT
- TEMPLE_ENERGY
- MERIT_POINT
- FIAT_REFERENCE_ONLY

`FIAT_REFERENCE_ONLY` is informational and must not be treated as payable money.

## Calculation Rules

Each payroll record must include task evidence, commit evidence, report path, review result, approval status, and a bank account ID. A worker's self-reported time cannot be the only payment basis.

Rejected tasks do not receive full task reward. FIX tasks are compensated only when responsibility and repair value are explicitly reviewed. Protected path violations, missing reports, missing provenance, duplicate commits, or unauthorized branch activity may freeze compensation.

## Claim Rules

Default claim mode is `HOLD_IN_BANK`. Irreversible transfers, KGEN token payout, external payments, real-market investment, and regulated actions require Human approval. AI workers may not select real chain withdrawal for themselves.

## Legal And Risk Boundary

This is a prototype internal ledger. It is not a bank, not investment advice, not a guaranteed return program, and not a promise of token value. Real-money deployment requires legal, security, compliance, treasury and Human approval.

