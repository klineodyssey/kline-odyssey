# KAIOS Cash Flow Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Required Records

`orders, revenue, cost_of_goods, payroll, rent, energy, transport,
maintenance, interest, tax_simulation, receivables, payables,
inventory_value, cash, debt, working_capital, capital_expenditure,
depreciation`

All entries are double-sided and reference a source document. The accounting
identity must hold:

```text
assets = liabilities + equity
working_capital = current_assets - current_liabilities
cash_close = cash_open + cash_inflows - cash_outflows
```

Inventory production moves cost into inventory; it does not create revenue or
cash. Sale acceptance moves inventory cost to cost of goods and recognizes cash
or a receivable. Cash receipt reduces receivables. Supplier payment reduces cash
and payables. Capital expenditure creates an asset and future depreciation.

## Warnings

`CASH_FLOW_WARNING`, `PAYMENT_DELAY`, `WORKING_CAPITAL_SHORTAGE`,
`PAYROLL_RISK`, `SUPPLIER_DEFAULT_RISK`, `DEBT_SERVICE_FAILURE`.

Warnings are deterministic consequences of liquidity, due dates, obligations
and forecasts. They do not change balances. If available working capital is
below the production requirement, production blocks with
`NO_WORKING_CAPITAL`.

All currency in this specification is simulated. No real bank, lending,
investment, tax filing, wallet or KGEN settlement is created.
