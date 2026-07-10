# KAIOS V8.2 Transaction Standard

## Definition

Transaction is an economic event created by Citizen, Business, Market, Exchange, Bank, App or Temple service activity. In V8.2 transactions are Prototype / Simulation records unless a future Production module explicitly implements settlement.

## Transaction Types

| Type | Meaning |
|---|---|
| Salary | Citizen receives simulated wage or reward. |
| Consumption | Citizen or business consumes good or service. |
| Production Output | Business creates output inventory. |
| Listing Event | Market listing is created, updated or closed. |
| Purchase Simulation | Buyer and seller create simulated settlement. |
| Deposit Simulation | Bank deposit record for economy signal. |
| Withdrawal Simulation | Bank withdrawal record for economy signal. |
| Tax Signal | Contribution signal to temple or civilization treasury. |
| Investment Concept | Future allocation to business, temple or civilization growth. |

## Required Transaction Fields

- `transaction_id`
- `transaction_type`
- `from_entity`
- `to_entity`
- `asset_type`
- `asset_id`
- `quantity`
- `value_reference`
- `currency_reference`
- `market_id`
- `bank_id`
- `status`
- `created_at`

## Rules

1. One Citizen may generate many Transactions.
2. Many Transactions create Market signals.
3. Transaction status must distinguish Simulated, Settled Concept, Disputed, Archived and Regulated Review.
4. No V8.2 transaction is real settlement, on-chain transfer, custody action or payment instruction.