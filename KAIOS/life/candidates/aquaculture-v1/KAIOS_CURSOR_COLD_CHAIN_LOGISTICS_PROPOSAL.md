# Cursor Cold-Chain Logistics Proposal

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

## Causal Chain

`CHILLING -> PACKING -> COLD_STORAGE -> LOADING -> ROUTE_VALIDATION -> IN_TRANSIT -> DELIVERY -> ACCEPTANCE_OR_REJECTION`

The proposal reuses the Real Causal World concepts for roads, rivers, bridges, vehicle capacity, fuel, wear, maintenance, and elapsed travel time. It does not create another route engine.

## Required Records

- Inventory ID, species ID, gross and marketable mass, simulated grade, package state, storage entry time, and dispatch time.
- Storage electricity, equipment condition, temperature-control proxy, loading labor, vehicle, route, fuel, travel duration, delays, and buyer window.
- Every temperature excursion remains a risk event. It is not a real food-safety determination.

## Failure States

`POWER_OUTAGE`, `COLD_STORAGE_UNAVAILABLE`, `LOADING_DELAYED`, `NO_ROUTE`, `INSUFFICIENT_FUEL`, `VEHICLE_CAPACITY_EXCEEDED`, `TEMPERATURE_EXCURSION`, `SPOILAGE_RISK`, `DELIVERY_REJECTED_SIMULATION`.

Unsold or rejected product remains inventory until a recorded sale, transfer, processing, disposal, or simulated liquidation event accounts for it.
