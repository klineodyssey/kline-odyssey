# Cursor Fish Stocking Model Proposal

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

Species ID: `SPECIES-KAIOS-FOUNDATIONAL-FISH`

## Proposed Gate Order

`POND_READY -> WATER_STABLE -> SPECIES_COMPATIBLE -> QUARANTINE_SIMULATION_COMPLETE -> TRANSPORT_COMPLETE -> CAPACITY_AVAILABLE -> STOCKING_EVENT`

Each gate is blocking. Stock units remain inventory until a transport event reaches the pond. Stocking must add population and biomass while subtracting the same units from delivered stock inventory.

## Model Inputs

- Pond water volume, usable habitat area, dissolved oxygen proxy, temperature, salinity, pollution, and carrying capacity.
- Delivered juvenile count, average mass, health-check simulation status, travel duration, and transport stress proxy.
- Existing fish and shrimp biomass so mixed-population capacity is not double-counted.

## Bounded Outcomes

- `STOCKING_APPROVED_SIMULATION`
- `POND_NOT_READY`
- `WATER_UNSTABLE`
- `LOW_OXYGEN`
- `WRONG_TEMPERATURE`
- `WRONG_SALINITY`
- `TRANSPORT_NOT_AVAILABLE`
- `OVER_CARRYING_CAPACITY`
- `HEALTH_CHECK_FAILED_SIMULATION`
- `QUARANTINE_NOT_COMPLETE`

Numeric ranges are proposals in the companion JSON artifacts. They are not husbandry advice and require Codex validation before Runtime use.
