# Business Runtime

**Runtime ID:** KAIOS-V8.2-RUNTIME-BUSINESS  
**Status:** Prototype / Simulation

## Purpose

The Business Runtime converts buildings, professions and inventory into simulated production and revenue. It supports the 23 V8.2 Business Library types, including Temple, Farm, Factory, Restaurant, Clothing Store, Convenience Store, Shopping Mall, Bank and Exchange.

## Lifecycle

```text
Create -> Staff -> Produce -> Consume -> Sell -> Pay Wages -> Pay Tax -> Reinvest -> Upgrade -> Archive
```

## Required Inputs

- `business_id`
- `business_type`
- `owner`
- `employees`
- `required_profession`
- `required_building`
- `production`
- `consumption`
- `inventory`
- `revenue`
- `expense`
- `growth`
- `level`
- `upgrade_path`

## Simulation Rules

1. A business cannot produce without at least one compatible profession.
2. A business consumes resources before producing output.
3. Revenue minus expense produces a growth signal, not guaranteed profit.
4. Business upgrades require a higher level, stable inventory and governance permission.
5. Real-world business twins require separate authorization and legal review.

## Citizen Economy Link

Employees receive simulated wages. Wages may create transactions, deposits, taxes and consumption signals.
