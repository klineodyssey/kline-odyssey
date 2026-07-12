---
VERSION: "3.0"
REVISION: "2026-07-13.WORKFORCE_V3"
STATUS: "ACTIVE / PROTOTYPE INTERNAL LEDGER"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex"
REVIEWED_BY: "Codex"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KGEN-WORKFORCE-V3-2026-0001"
CHANGE_REASON: "Define 8888 People Bank employee account ledger for payroll, claims, freeze and audit."
SOURCE_OF_TRUTH: true
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Bank"
Class: "People Bank 8888"
Order: "Employee Account"
Family: "Internal Ledger"
Genus: "Prototype Payroll Bank"
Species: "KGEN-KAIOS/bank/8888/EMPLOYEE_ACCOUNT_STANDARD.md"
---

# 8888 People Bank Employee Account Standard

8888 People Bank is a KGEN prototype internal ledger for workforce payroll, game balances, merit, claim review, audit, freeze and simulation authorization. It is not a licensed bank and does not provide deposit insurance, custody, regulated payment service, securities service or investment service.

Each employee account records `account_id`, `worker_id`, status, available balance, locked balance, pending salary, game balance, temple energy, merit points, withdrawal limit, investment permission, risk level and reconciliation time.

Allowed account statuses are `ACTIVE`, `FROZEN`, `SUSPENDED`, `CLOSED` and `AUDIT_REQUIRED`.

Default approved compensation remains `HOLD_IN_BANK`. Human approval is mandatory for KGEN claim, real transfer, external payment, simulation investment mandate, or any irreversible action.

Protected path violations, missing report evidence, invisible commits, unauthorized main push, or suspected secret exposure must freeze the affected account until Codex and Human review complete.

All records in this folder are Prototype / Simulation / Internal Ledger records.

