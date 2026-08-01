# KAIOS Company Insolvency Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## State Order

```text
OPERATING -> CASH_FLOW_WARNING -> PAYMENT_DELAY -> DISTRESS -> INSOLVENT
-> RESTRUCTURING -> COURT_PROTECTION -> LIQUIDATION -> DISSOLVED
```

No state may be skipped without an explicit exceptional decision permitted by
the simulation policy. `INSOLVENT` requires evidence that obligations cannot be
paid when due, liabilities exceed recoverable assets, or both. A temporary cash
warning alone does not prove insolvency.

## Restructuring

Restructuring freezes unsupported production growth, preserves essential
records, inventories assets and liabilities, protects verified wage claims,
tests a funded recovery plan and records creditor outcomes. It may restructure
simulated debt, contracts, operations and assets, but cannot invent capital or
erase claims.

## Liquidation Boundary

If recovery gates fail, the company enters simulated court protection and then
liquidation. Company closure stops new orders and production. Assets, inventory,
contracts, employee claims and histories persist through explicit disposition.
`DISSOLVED` is allowed only after distribution reconciliation and archival.

This state machine has `NO_REAL_LEGAL_EFFECT` and does not provide legal or
financial advice.
