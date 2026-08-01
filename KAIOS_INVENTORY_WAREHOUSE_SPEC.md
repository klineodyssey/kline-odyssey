# KAIOS Inventory And Warehouse Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Inventory Classes

`RAW_MATERIAL`, `WORK_IN_PROGRESS`, `FINISHED_GOODS`, `SPARE_PARTS`,
`RETURNED_GOODS`, `SCRAP`, `RECYCLED_MATERIAL`.

Required fields are defined in `KAIOS_INVENTORY_SCHEMA.json`:

`item_id, owner_company, warehouse_id, quantity, unit_mass, total_mass,
unit_cost, book_value, storage_cost, shelf_life, condition,
reserved_quantity, available_quantity, arrival_time, expiry_time`

## Conservation

```text
total_mass = quantity * unit_mass
available_quantity = quantity - reserved_quantity - quarantined_quantity
closing_quantity = opening_quantity + receipts + returns + recovered
                   - issues - sales - scrap - loss
inventory_book_value = sum(quantity * recoverable_unit_cost)
```

Negative inventory, double reservation and unlocated stock are invalid.
Transfers require origin, destination, handling time, transport and custody.

## Warehouse Effects

Warehouse capacity is enforced by mass and volume. Storage incurs fees and
insurance; condition and elapsed time can cause damage, spoilage or
obsolescence. Inventory can freeze working capital, require handling time and
carry fire and theft risk. A risk event records quantity, value, custodian and
disposition; it cannot silently delete inventory.

`FINISHED_GOODS` become revenue only after an evidenced sale and delivery or
contract-defined acceptance. Unsold and dead stock remain inventory subject to
write-down and disposal rules.
