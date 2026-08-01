# KAIOS Demand And Sales Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Demand Sources

`household`, `company`, `city`, `government_simulation`, `research`,
`industrial`, `transport`, `healthcare`, `energy`, `technology`.

## Sales Channels

`direct_order`, `retail`, `wholesale`, `contract`, `exchange`,
`public_procurement_simulation`, `subscription`, `service_bundle`.

## Planning States

- `DEMAND_FORECAST` is non-binding evidence used for planning.
- `CONFIRMED_ORDER` has buyer, quantity, price, delivery terms and funding.
- `PRODUCTION_PLAN` maps confirmed demand and bounded forecast to capacity.
- `SAFETY_STOCK` is justified by service level and replenishment time.
- `OVERPRODUCTION` is output above confirmed demand plus approved safety stock.
- `STOCKOUT` is confirmed demand that available inventory cannot fulfill.
- `DEAD_STOCK` is inventory with no supported sale or productive-use path.

## Revenue Recognition

A forecast, production event, warehouse receipt or sales offer is not revenue.
Revenue requires a valid sale, quantity transfer, acceptance/delivery evidence
and a balanced cash or receivable entry. Returns, refunds and cancellations
reverse the relevant revenue and inventory entries.

No demand gives `NO_DEMAND`; no channel gives `NO_SALES_CHANNEL`. Production
may not continue merely to improve utilization metrics when working capital or
warehouse capacity is inadequate.
