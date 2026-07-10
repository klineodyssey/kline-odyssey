# KAIOS V8.2 Bank Standard

## Definition

Bank in V8.2 is a Prototype / Simulation runtime for account signals, reserve health, treasury structure and civilization finance metrics. It is not a licensed bank, not a deposit-taking institution, not a lender and not a financial service.

## Bank Functions

| Function | Scope | Boundary |
|---|---|---|
| Deposit | Simulation record of value entering an account or treasury | No real custody. |
| Withdraw | Simulation record of value leaving an account or treasury | No payment instruction. |
| Reserve | Reserve health metric | No regulated reserve claim. |
| Loan | Concept-layer credit simulation | No lending service. |
| Interest | Concept-layer yield or cost signal | No promised return. |
| Treasury | Economy pool for temple or civilization | Simulation accounting. |
| Temple Treasury | Temple-level resource and KGEN reference pool | Not custody. |
| Civilization Treasury | Civilization-level growth pool | Governance signal only. |

## Bank Entities

- Bank Account
- Treasury
- Temple Treasury
- Civilization Treasury
- Deposit Record
- Withdrawal Record
- Reserve Snapshot
- Loan Concept Record
- Interest Concept Record
- Audit Record

## Required Bank Fields

- `bank_id`
- `owner`
- `account_count`
- `deposit_signal`
- `withdraw_signal`
- `reserve_ratio`
- `loan_concept_enabled`
- `interest_concept_enabled`
- `temple_treasury`
- `civilization_treasury`
- `audit_state`
- `status`

## Compliance Boundary

Any real deposit, loan, interest, insurance, custody, payment, KYC, AML or consumer financial service requires licensed institution participation, business agreement, jurisdiction review, security review and regulatory compliance. V8.2 does not implement those services.