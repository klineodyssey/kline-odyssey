# KAIOS AI Worker Payroll Wallet V0 Specification

Status: `APPROVED_SPECIFICATION`

Mode: `SIMULATED_WALLET / KAIOS_CREDIT / NO_CHAIN / NO_PRIVATE_KEY`

## Entities

`AI_WORKER_WALLET`, `PROJECT_ESCROW`, `RESERVED_PAYROLL`, `PAYROLL_EVENT`,
`PAYROLL_APPROVAL`, `WORKER_EXPENSE`, `HOUSEHOLD_TRANSFER`,
`VOLUNTARY_TRANSFER`, `MAINTENANCE_RESERVE` and `AUDIT_LEDGER`.

## Payroll Gate

Release requires all of:

1. authorized task envelope;
2. active worker identity;
3. completed deliverable and handoff;
4. Codex review approval;
5. customer or project acceptance;
6. sufficient reserved payroll;
7. no duplicate payroll key;
8. no illegal work-time or location conflict;
9. balanced ledger projection;
10. an existing simulated worker wallet.

A missing wallet returns `PAYROLL_BLOCKED_MISSING_WALLET`; the worker remains a
valid life. Rejected tasks receive no pay. Rework keeps the reservation in
escrow until a new approval or cancellation/refund event.

## Allocation

Gross pay is released from project escrow into the AI worker wallet first.
Energy, compute, maintenance, platform fee and simulated tax are explicit
subsequent or same-envelope balanced postings. A household, player or agency
receives value only under one of:

`EMPLOYMENT_CONTRACT`, `HOUSEHOLD_CONTRACT`, `AGENCY_CONTRACT`,
`REVENUE_SHARE_CONTRACT`, `MAINTENANCE_CONTRACT`, `INHERITANCE_CONTRACT` or
`VOLUNTARY_TRANSFER`.

No contract defaults to a 100 percent player transfer. Wallets remain distinct.

## State Machine

`BUDGET_RESERVED -> WORK_IN_PROGRESS -> SUBMITTED -> REVIEW_PENDING ->
APPROVED | REWORK_REQUIRED | REJECTED -> PAYROLL_RELEASED | REFUNDED | CANCELLED`

`PAYROLL_RELEASED`, `REFUNDED` and `CANCELLED` are terminal for the unique
`project_id/task_id/worker_life_id/approval_id` claim key.

## End-to-End Demonstration

The deterministic demo funds a candidate plant-life package with KAIOS Credit,
reserves escrow, assigns a candidate-only worker, records delivery, Codex review
and project acceptance, releases pay to the worker, deducts compute/energy,
optionally performs a contracted household transfer, and proves a balanced
final ledger. Failure fixtures cover insufficient budget, rejection, rework,
duplicate payroll, inactive worker, missing wallet, time conflict and imbalance.
