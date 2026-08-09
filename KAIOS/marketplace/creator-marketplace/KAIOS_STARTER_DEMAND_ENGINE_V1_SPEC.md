# Starter Demand Engine V1

The engine is deterministic and demand-driven. Inputs are household members, body profiles, location, climate, civilization stage, inventory, income, health, work, distance and season.

## Demand Categories

`FOOD`, `WATER`, `SHELTER`, `CLOTHING`, `ENERGY`, `HEALTHCARE`, `TOOLS`, `TRANSPORT`, `EDUCATION`, and `MAINTENANCE`.

## Rules

- Biological demand derives from metabolism and safety thresholds.
- Digital demand derives from compute, electricity, storage, cooling, network and maintenance thresholds.
- Robotic demand derives from charge/fuel, wear, parts, lubrication, sensors and integrity.
- Demand severity is bounded by inventory coverage and household size.
- Climate and season may adjust consumption but cannot create resources.
- A producer's need for sales is not customer demand.
- A purchase decreases buyer credit and seller inventory while increasing household inventory.

Outputs include demand ID, category, quantity, unit, urgency, cause, location, earliest service time and fulfillment status.
