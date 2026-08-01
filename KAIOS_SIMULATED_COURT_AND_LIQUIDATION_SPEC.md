# KAIOS Simulated Court And Liquidation Specification

Status: `SPECIFICATION_ONLY`

Mode: `SIMULATED_COURT / SIMULATED_BANKRUPTCY`

Legal effect: `NO_REAL_LEGAL_EFFECT`

## Process

```text
payment_default -> filing -> asset_transfer_freeze -> asset_inventory
-> liability_inventory -> employee_wage_claims -> tax_claims
-> secured_claims -> unsecured_claims -> inventory_sale -> equipment_sale
-> land_right_transfer -> contract_termination
-> employee_placement_or_dismissal -> distribution -> dissolution
```

The transfer freeze blocks unauthorized simulated disposition while allowing
the court process to record approved custody and sale. Claim classes and
priority are explicit; distribution cannot exceed realized proceeds.

## Asset Continuity

Company failure never deletes assets. Every asset receives one evidenced result:

`AUCTIONED`, `TRANSFERRED`, `SOLD`, `LEASED`, `SCRAPPED`, `RECYCLED`,
`ABANDONED_WITH_CUSTODIAN`.

Each result records owner, custodian, destination, book value, realized value,
time and provenance. Land treatment transfers only the simulated land-right
class available to the company; it does not create or convey legal title.

## Claims And Distribution

The process inventories employee wage claims, tax-simulation claims, secured
claims and unsecured claims before distribution. Every distribution debits a
realized-proceeds account and credits a verified claim account. Unpaid balances
remain recorded; dissolution does not rewrite history.

No real court filing, seizure, dismissal, auction, title transfer, tax action,
wallet operation or settlement is authorized.
