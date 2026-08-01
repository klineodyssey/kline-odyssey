# KAIOS Fishpond Aquaculture Runtime V1 Specification

Status: `DRAFT_PENDING_INDEPENDENT_REVIEW`

Mode: `LOCAL_DETERMINISTIC_SIMULATION`

## 1. Objective

Define the first bounded causal fishpond industry loop from simulated land selection through construction, ecology, harvest, cold-chain delivery, demand, inventory and enterprise finance.

## 2. Source Crosswalk

Requirements map is maintained in `KAIOS_FISHPOND_AQUACULTURE_SOURCE_CROSSWALK.md`. Charter prose is reference-only and cannot grant Runtime authority.

## 3. Existing Runtime Reuse

Reuse Canonical Life IDs; Ecology V1 habitat/population/resource concepts; Causal World route, fuel, bridge and wear rules; Physical Labor single-body conflicts; Supply Chain inventory, demand, ledger and insolvency contracts. The aquaculture module orchestrates these contracts and does not replace their owners.

## 4. Scope

One synthetic land parcel, one bounded pond, fish and shrimp stock, staged construction, finite water/feed/energy, deterministic health proxies, harvest inventory, cold-chain logistics, confirmed orders and simulated double-entry finance.

## 5. Out of Scope

Real farms, veterinary diagnosis, food-safety certification, legal land/water title, biological engineering, real money, Wallet, KGEN, blockchain, Production Runtime, autonomous agents and universal biological claims.

## 6. Land Requirements

Site state records parcel, simulated usage right, area, elevation, slope, soil permeability, flood and pollution risk, water/road/electric access. Any failed gate blocks construction with the specified reason.

## 7. Pond Design

Design records pond area/depth/volume, embankment, lining, inlet, outlet, drainage, aeration, electricity and inspection requirements. Dimensions must fit the land parcel.

## 8. Construction Stages

`SITE_SURVEY → DESIGN → PERMIT_SIMULATION → SITE_CLEARING → EXCAVATION → EMBANKMENT → LINING_OR_SOIL_COMPACTION → INLET_INSTALLATION → OUTLET_INSTALLATION → DRAINAGE_INSTALLATION → AERATION_INFRASTRUCTURE → ELECTRICAL_CONNECTION → WATER_FILLING → LEAK_TEST → WATER_STABILIZATION → INSPECTION → READY_FOR_STOCKING`. No skipping or zero-duration completion.

## 9. Labor

Each stage lists roles, skills, shift hours, travel and stamina. One physical body has one location and primary job. Conflicts reuse `ROLE_TIME_CONFLICT`, `LOCATION_CONFLICT`, `TRAVEL_TIME_CONFLICT`, `SHIFT_OVERLAP` and `REST_REQUIREMENT_CONFLICT`.

## 10. Tools And Machinery

Finite inventories include survey tools, shovel, excavator, truck, compactor, pump, pipe, aerator, electrical panel, water-test kit and cold-storage unit. Missing items block progression.

## 11. Materials

Soil, gravel, lining material, pipe, electrical components and construction consumables are conserved and consumed by stage bills of material.

## 12. Water Source

Sources are river, simulated groundwater/reservoir, rainwater storage or treated water. Each has finite volume, flow, quality, reliability, cost and simulated usage rights.

## 13. Water Inlet And Outlet

Transfers require installed infrastructure, pump/energy when applicable, elapsed time and source availability. Outflow is recorded, never discarded from accounting.

## 14. Water Quality

Track temperature, dissolved oxygen, pH, salinity, ammonia/nitrite/nitrate proxies, turbidity, organic load, pollution and pathogen-risk proxy. Changes derive from feeding, biomass, waste, aeration, exchange, rainfall, pollution, mortality and decomposition.

## 15. Fish Stocking

`FISH_JUVENILE_STOCK` requires the canonical foundational fish ID, ready pond, compatible water, finite stock inventory, simulated health/quarantine clearance, transport time, budget and capacity.

State flow: `NOT_STOCKED -> STOCKING_BLOCKED | TRANSPORT_PENDING -> QUARANTINE_SIMULATION -> STOCKED`. Blocking reasons are `POND_NOT_READY`, `WATER_UNSTABLE`, `LOW_OXYGEN`, `WRONG_TEMPERATURE`, `WRONG_SALINITY`, `STOCK_NOT_AVAILABLE`, `TRANSPORT_NOT_AVAILABLE`, `OVER_CARRYING_CAPACITY`, `HEALTH_CHECK_FAILED_SIMULATION` and `QUARANTINE_NOT_COMPLETE`.

## 16. Shrimp Stocking

`SHRIMP_POST_LARVAL_STOCK` follows the same gates plus salinity and larval compatibility. The shared biological population cap is finite.

The schema couples fish only to `FISH_JUVENILE_STOCK` and shrimp only to `SHRIMP_POST_LARVAL_STOCK`. Runtime validation enforces `sum(population.count) <= boundaries.maximum_population`; per-population schema maxima never replace this shared invariant.

`aquaculture-spec-validator.mjs` is the specification-owned executable validator for this cross-record invariant. Runtime V1 must call or preserve equivalent behavior; a descriptive schema annotation alone is insufficient.

## 17. Feed

Feed is inventory with quantity, quality, expiry and delivery history. Feeding consumes stock and labor. Spoiled or absent feed cannot create growth.

## 18. Growth

Biomass gain consumes feed and oxygen over time and is bounded by health, water compatibility and carrying capacity. Feed conversion is explicitly a simulation proxy.

## 19. Reproduction

Reuse bounded Ecology V1 reproduction modes and caps. Farm stocking does not authorize uncontrolled breeding or automatic Species creation.

## 20. Oxygen

Dissolved oxygen changes with temperature, biomass, feeding, decomposition, exchange and aeration. Low oxygen raises stress and mortality risk.

Aeration states are `OFF`, `STARTING`, `RUNNING`, `POWER_OUTAGE`, `AERATOR_BROKEN`, `EMERGENCY_AERATION_REQUIRED` and `MAINTENANCE_REQUIRED`. Start is blocked by `NO_AERATOR`, `NO_ELECTRICITY`, `NO_OPERATOR_OR_AUTOMATION_AUTHORITY` or `AERATOR_MAINTENANCE_REQUIRED`.

## 21. Waste

Unassimilated feed, biological waste and dead biomass increase organic load, ammonia proxy and oxygen demand; mass enters explicit waste/decomposition pools.

## 22. Disease

Disease is a non-diagnostic risk proxy derived from stock health, quality, density, temperature, oxygen, feed, pollution, stress and quarantine.

State flow: `HEALTHY -> AT_RISK -> SYMPTOMATIC_SIMULATION -> ISOLATION_REQUIRED | TREATMENT_SIMULATION -> RECOVERING | MORTALITY_EVENT`. No state is a veterinary diagnosis or food-safety certification.

## 23. Mortality

Mortality reduces count and living biomass, creates dead biomass, cost and pollution risk, and requires removal, decomposition or recorded disposal.

## 24. Water Treatment

Treatment consumes energy, time and finite capacity and transfers pollution/waste to recorded treatment outputs; it cannot erase mass.

## 25. Harvest

Harvest requires readiness, workers, equipment, containers, cooling, destination capacity and time. Ordered stages are planning, drain, capture, sorting, weighing, grading, chilling, packing, storage, dispatch and complete.

## 26. Grading

Record count, gross, marketable and rejected mass, grade, unit cost and inventory ID. Component masses must equal gross mass within tolerance.

## 27. Cold Storage

Storage requires installed unit, electricity, capacity and temperature control. Delay or outage raises excursion and spoilage risk.

## 28. Logistics

Delivery uses a finite vehicle, fuel/energy, capacity, road/bridge-compatible route, loading/unloading and travel time. No instant delivery.

## 29. Market Demand

Forecasts do not recognize revenue. Only confirmed orders with quantity, grade, price, channel, delivery window and payment terms can accept delivery.

Order states are `FORECAST`, `CONFIRMED`, `FULFILLING`, `DELIVERED`, `ACCEPTED`, `REJECTED` and `CANCELLED`. `NO_CONFIRMED_BUYER`, `GRADE_MISMATCH`, `DELIVERY_WINDOW_MISSED`, `INSUFFICIENT_INVENTORY` and `BUYER_REJECTED_SIMULATION` block revenue recognition.

## 30. Inventory

Unsold output remains finished goods with mass, book value, storage cost, shelf life, condition and reserved/available quantity.

## 31. Accounting

All simulated entries contain equal debit and credit amounts and a source event. Revenue is recognized only after accepted delivery.

## 32. Cash Flow

Track startup capital, construction/equipment/stock/feed/energy/water/labor/maintenance/harvest/storage/transport costs, receivables, payables, cash, debt and profit/loss.

## 33. Insolvency

Finite states progress from planning through operation to warning, distress, simulated restructuring, court protection, liquidation and dissolution. Transitions require ledger conditions and do not have legal effect.

The complete ordered business state set is `PLANNING -> CONSTRUCTION -> PRE_STOCKING -> OPERATING -> HARVESTING -> SALES_PENDING -> CASH_FLOW_WARNING -> PAYMENT_DELAY -> DISTRESS -> INSOLVENT -> RESTRUCTURING_SIMULATION -> COURT_PROTECTION_SIMULATION -> LIQUIDATION_SIMULATION -> DISSOLVED`. Liquidation changes custody or disposition status but preserves land, equipment, stock and inventory records.

## 34. Rights

Land owner/user, pond operator, water usage, stock/equipment owner, worker, custodian, harvest, sales, transport and inspector roles remain separate and `SIMULATED_RIGHTS_ONLY`.

## 35. Safety Boundaries

`NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`, `NO_REAL_BIOENGINEERING`, `NO_REAL_FOOD_SAFETY_CERTIFICATION`, `NO_REAL_LEGAL_EFFECT`, `NO_PRODUCTION_AUTHORITY`, `NO_UNCONTROLLED_REPRODUCTION`.

## 36. Determinism

Same seed, initial state, ordered actions and environmental inputs produce identical event and state hashes. Runtime is bounded, serializable, stoppable, resumable, replayable and auditable.

## 37. APIs

Eleven static JSON projections expose index, ponds, water quality, populations, feed, harvests, inventory, orders, ledger, events and status. All are read-only and contain no mutation endpoint:

- `/api/kaios/aquaculture/v1/index.json`
- `/api/kaios/aquaculture/v1/ponds.json`
- `/api/kaios/aquaculture/v1/water-quality.json`
- `/api/kaios/aquaculture/v1/populations.json`
- `/api/kaios/aquaculture/v1/feed.json`
- `/api/kaios/aquaculture/v1/harvests.json`
- `/api/kaios/aquaculture/v1/inventory.json`
- `/api/kaios/aquaculture/v1/orders.json`
- `/api/kaios/aquaculture/v1/ledger.json`
- `/api/kaios/aquaculture/v1/events.json`
- `/api/kaios/aquaculture/v1/status.json`

Allowed methods on deployed GitHub Pages are `GET` and `HEAD`; mutation endpoints are `FALSE`.

## 38. World Viewer

The public module exposes land, construction, water, stock, feed, aeration, health, harvest, logistics, demand, inventory, finance and event views with required controls, loading/error/retry and boundary labels.

## 39. Tests

Tests cover governance, land gates, stage order, resources, water and biomass conservation, stocking, growth, mortality, harvest, logistics, demand, ledger, insolvency, deterministic replay, import validation, UI and repository regressions.

## 40. Rollback

Use a merge-preserving revert of the dedicated aquaculture PR. Existing Ecology, Life, Causal World, labor and supply-chain owners remain unchanged.

## 41. Acceptance Criteria

Implementation may begin only after every causal gate in this specification is represented by state, event, blocking reason and negative test. Final public output must remain static, read-only and simulation-only.

## 42. Cursor Contribution Decision

Decision: `CURSOR_RESEARCH_ONLY`. Cursor proposals are candidate inputs only. Codex selects bounded defaults, repairs issues and remains sole Schema and Runtime authority.
