# KAIOS Forest and Agriculture Runtime V1 Specification

Task: `KAIOS-FOREST-AGRICULTURE-RUNTIME-V1-001`

Status: `SPECIFICATION_DRAFT_FOR_CODEX_REVIEW`

Mode: `LOCAL_DETERMINISTIC_SIMULATION / SIMULATION_ONLY`

## Objective

Create one deterministic causal loop connecting forest, grassland, soil, water,
rainfall, irrigation, crops, labor, harvest, storage, transport, demand,
household food consumption, organic waste, compost, nutrient return and forest
regeneration. V1 is an approximation, not agronomic, biological, legal or
food-safety authority.

## Existing Runtime Reuse

The implementation extends or composes existing owners. It must not introduce
a second Life, Ecology, route, labor, inventory, ledger or authority engine.

- Agriculture Alpha owns plot planting, crop progress and warehouse basics.
- Ecology V1 owns habitats, populations, water/soil cycles and decomposition.
- Life Runtime V1 owns foundational grass, tree, soil, water and river state.
- Causal World owns route feasibility, travel time, fuel, load and wear.
- Physical Labor owns worker location, time, shift, skill and rest gates.
- Supply Chain specifications own demand, inventory and balanced-ledger rules.

## Entities

`FOREST_STAND`, `GRASSLAND`, `FARMLAND`, `FARM_PLOT`, `CROP_BATCH`,
`FRUIT_TREE_STAND`, `SOIL_PROFILE`, `WATER_SOURCE`, `RAINFALL_EVENT`,
`IRRIGATION_NETWORK`, `FERTILIZER_BATCH`, `COMPOST_BATCH`, `WORK_SHIFT`,
`HARVEST_BATCH`, `WAREHOUSE_LOT`, `DELIVERY_ORDER`, `MARKET_ORDER`,
`HOUSEHOLD_FOOD_ACCOUNT`, `ORGANIC_WASTE_BATCH`, `NUTRIENT_RETURN_EVENT`,
`FOREST_REGENERATION_PROJECT`.

Every stateful entity records `id`, `type`, `location`, `simulation_time`,
`status`, `source`, `authority`, `simulation_only`, `history`,
`previous_state_hash` and `next_state_hash`.

## Causal Sequence

`land usage right -> survey -> soil/water suitability -> field preparation ->
seed/planting material -> labor/tools -> planting -> rainfall/irrigation ->
growth -> maintenance -> harvest -> grading -> warehouse -> transport ->
confirmed demand -> sale or household allocation -> consumption -> organic
waste -> compost/decomposition -> nutrient return -> soil/forest recovery`.

No stage may be bypassed by available money alone.

## Forest and Grassland

Forest stands require suitable land, soil, water, sunlight, time and bounded
tree/grass populations. Managed harvest reduces biomass and creates explicit
wood/residue lots. Regeneration requires seed source, capacity, water, labor or
natural propagation, and elapsed time. Clear-cut instant reset is prohibited.

States: `ESTABLISHING`, `GROWING`, `MATURE`, `RESOURCE_STRESSED`,
`DISTURBED`, `REGENERATING`, `DEGRADED`, `LOCALLY_COLLAPSED`.

## Crops and Farmland

Initial crop classes are `RICE`, `VEGETABLE` and `FRUIT`. Each crop declares
seed or propagation source, soil compatibility, temperature/season envelope,
water, nutrients, labor, tools, growth duration, harvest window, yield bounds,
residue ratio and storage limits. Candidate parameters remain
`SIMULATION_APPROXIMATION` until Codex validation.

Crop states: `PLANNED`, `SOIL_PREPARATION`, `PLANTED`, `GERMINATING`,
`GROWING`, `FLOWERING_OR_FRUITING`, `HARVEST_READY`, `HARVESTED`,
`FAILED`, `RESIDUE_PENDING`.

## Water, Rainfall and Irrigation

The conserved water equation is:

`previous + rainfall + source withdrawal - irrigation - runoff - evaporation -
seepage - recorded removal = next` within configured tolerance.

Irrigation requires a compatible water source, usage capability, route or pipe,
equipment, energy where powered, maintenance and elapsed time. Required blocks:
`NO_WATER_SOURCE`, `NO_WATER_USAGE_RIGHT`, `IRRIGATION_NOT_BUILT`,
`PUMP_NO_ENERGY`, `DROUGHT`, `FLOOD`, `POLLUTED_WATER`.

## Soil, Fertilizer and Compost

Soil tracks moisture, fertility, organic matter, pH proxy, compaction, erosion
and contamination. Fertility cannot increase without fertilizer, compost,
decomposition, sediment or another recorded material transfer. Fertilizer is an
inventory input with cost and pollution risk. Compost requires organic waste,
water, labor, space and time; input mass becomes compost, emissions/moisture
loss proxies and residue within tolerance.

## Labor and Infrastructure

Physical work reuses the single-life timeline. A worker cannot prepare soil,
irrigate, harvest, drive and unload at overlapping locations or times. Required
roles include `FARM_MANAGER`, `SOIL_TECHNICIAN`, `IRRIGATION_WORKER`,
`GENERAL_FARM_LABORER`, `HARVEST_WORKER`, `WAREHOUSE_OPERATOR`,
`TRUCK_DRIVER`, `FOREST_WORKER` and `SAFETY_OFFICER`.

Irrigation, access paths, compost area and warehouse are causal projects. They
require materials, tools, workers, energy, access and time.

## Harvest, Warehouse and Transport

Harvest requires readiness, workers, tools, containers and time. Product mass
is split into marketable food, rejected product and residue. Warehouse capacity,
arrival time, shelf life, storage cost, spoilage and reserved quantity apply.
Delivery reuses road, bridge, fuel, load, wear and travel rules. No instant
transport is permitted.

## Demand, Household Consumption and Waste

Market demand and household food need are separate sinks. Revenue is recognized
only after accepted delivery to a confirmed simulated buyer. Household
consumption requires available food inventory and advances time. Consumption
creates bounded organic waste; waste must be composted, decomposed, stored or
disposed through a recorded action.

## Economy and Rights

Ledgers record seed, fertilizer, water, energy, labor, tool, maintenance,
warehouse, transport, spoilage, revenue, receivables, payables and household
allocation. Entries balance and use simulated funding only.

Rights remain separate: `LAND_OWNER`, `LAND_USER`, `WATER_USAGE_RIGHT`,
`FOREST_CUSTODIAN`, `FARM_OPERATOR`, `CROP_OWNER`, `HARVEST_RIGHT`,
`WAREHOUSE_OPERATOR`, `TRANSPORT_OPERATOR`, `SALES_RIGHT` and
`HOUSEHOLD_CONSUMPTION_RIGHT`. All are `SIMULATED_RIGHTS_ONLY`.

## Determinism and Event Contract

The Runtime must be deterministic, serializable, stoppable, resumable,
replayable and auditable. Every command records actor, location, time, inputs,
outputs, water/mass/energy/nutrient/inventory/cash deltas, status, reason, seed
and previous/next hashes. Same state, seed, actions and environment produces the
same result.

## Public Surface

Planned stable route: `/world-viewer/forest-agriculture-v1/`.

Planned read-only projections:

- `/api/kaios/forest-agriculture/v1/index.json`
- `state.json`, `forests.json`, `farmland.json`, `crops.json`
- `water.json`, `soil.json`, `harvests.json`, `inventory.json`
- `households.json`, `ledger.json`, `events.json`, `status.json`

Public mutation endpoints are forbidden.

## Required Tests

Tests cover land/rights, soil and water suitability, rainfall, irrigation,
drought/flood, seed and inputs, labor conflicts, crop stages, forest biomass,
regeneration, fertilizer, compost mass, harvest, storage, spoilage, transport,
demand, household consumption, waste, nutrient return, ledger balance,
deterministic replay, import/export/reset, responsive UI, accessibility and all
existing Life/Ecology/Aquaculture/Causal World regressions.

## Safety Boundaries

`NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`,
`NO_REAL_BIOENGINEERING`, `NO_REAL_FOOD_SAFETY_CERTIFICATION`,
`NO_REAL_LAND_OR_WATER_RIGHT`, `NO_PRODUCTION_AUTHORITY`,
`NO_CONSTITUTION_PROMOTION`, `NO_EXTERNAL_AUTONOMY`.

## Rollback

The V1 orchestration module, Viewer, static projections and task records can be
reverted without deleting or changing the canonical owners listed above.

## Acceptance

Implementation begins only after this specification, source crosswalk, Cursor
candidate contribution and independent Codex review pass with no unresolved
P0/P1/P2 finding.
