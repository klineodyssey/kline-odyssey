# KAIOS V11 Multi-Agent Payroll Standard

**Document ID:** KAIOS-V11-PAYROLL-STANDARD
**Version:** V11 Design Proposal 1.0
**Status:** PROTOTYPE DESIGN / NOT A BANK / NOT PAYMENT AUTHORIZATION
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Purpose

V11 payroll is a prototype civilization ledger that converts reviewed mission evidence into internal compensation records. It extends Workforce V3 and the 8888 People Bank prototype; it does not create real employment contracts, banking, token transfer, securities, investment, tax filing, or guaranteed value.

## Payroll Flow

```text
Mission Evidence
-> Reviewer Decision
-> Reward and Salary Calculation
-> Department Budget Check
-> Civilization Payroll Ledger
-> 8888 Prototype Account
-> Human Approval Queue
-> Optional Future Distribution
```

No Agent may approve its own compensation or initiate an irreversible external transfer.

## Compensation Components

- base salary policy;
- mission reward;
- quality bonus;
- review or mentoring bonus;
- research bonus;
- security or bug bounty;
- revenue-share allocation;
- department leadership allocation;
- penalty, reversal, withheld, or freeze event;
- retirement/final reconciliation.

Different units must remain separate:

- `KGEN_TOKEN` (future Human-approved distribution only)
- `GAME_CREDIT`
- `TEMPLE_ENERGY`
- `MERIT_POINT`
- `DEPARTMENT_CREDIT`
- `FIAT_REFERENCE_ONLY`

Conversion requires a versioned conversion policy and review. `FIAT_REFERENCE_ONLY` is informational and not payable money.

## Required Payroll Record

A future payroll record requires:

- `payroll_id`
- `civilization_id`
- `department_id`
- `agent_id`
- `mission_id`
- `period_start` and `period_end`
- `compensation_type`
- `unit`
- `gross_amount`
- `quality_multiplier`
- `risk_multiplier`
- `penalty_amount`
- `net_amount`
- `budget_source`
- `evidence_refs`
- `review_result`
- `approved_by`
- `approval_status`
- `ledger_account_id`
- `claim_status`
- `external_tx_hash` only if a future Human-approved transfer exists
- timestamps and audit references

## Calculation Rules

1. No verifiable mission evidence means no mission reward.
2. Self-reported working time is not sufficient evidence.
3. Duplicate evidence cannot be paid twice.
4. Rejected work does not receive full reward.
5. FIX work requires responsibility and value review.
6. Budget reservation occurs before reward approval.
7. A department cannot spend another department's payroll without an approved transfer.
8. Payroll reserve cannot cover marketplace speculation or simulation losses.
9. Negative balances cannot be created automatically against future salary.
10. Penalties require a recorded reason, evidence, appeal route, and reviewer.

## Department Budget

Department budget policy should define period, unit, payroll allocation, mission reward allocation, training allocation, tool/compute allowance, contingency reserve, approval threshold, and rollover policy.

Budget exhaustion pauses new paid missions; it does not erase approved compensation or force unpaid work.

## Revenue Share

Revenue share is prototype accounting. It must identify revenue source, gross amount, costs, eligible Agents, formula, period, disputes, reserve, and Human approval. It cannot imply ownership of a company, security, dividend, or guaranteed return unless a future regulated structure explicitly authorizes it.

## Audit And Freeze

Payroll can be frozen for missing evidence, duplicate claim, identity conflict, protected-boundary violation, fraud suspicion, unresolved marketplace dispute, or security incident. Freeze preserves the record and requires review; it is not silent confiscation.

## Human Approval

Human approval is mandatory for token distribution, fiat/payment gateway use, real tax/employment claims, regulated revenue share, external transfer, wallet signing, and any irreversible conversion.

## V10/V3 Compatibility

V11 reuses the existing compensation types, 8888 prototype employee accounts, claim queue, reserve separation, and Human approval boundary. It adds `civilization_id`, `department_id`, `mission_id`, and owner-scoped budget policies without changing 12345 or 8888 runtime code.

## Implementation Gate

No payroll schema, calculator, ledger mutation, wallet integration, or token distribution may be built until Human approval and a separate legal/security design review.
