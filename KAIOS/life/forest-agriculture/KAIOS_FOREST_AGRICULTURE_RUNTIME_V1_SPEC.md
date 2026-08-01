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
- Economy Runtime owns market listings, inventories and the balanced synthetic
  ledger; the Supply Chain specification supplies additional causal gates.

### Authoritative Entity Ownership

The V1 coordinator persists only foreign IDs, command envelopes, projections
and event/hash links. It must never persist an independent authoritative copy
of an entity owned by another Runtime.

| Entity truth | Authoritative owner | V1 coordinator contract |
|---|---|---|
| Grass, tree, soil, water and river life state | Life Runtime V1 | Reference Life IDs and consume validated events |
| Forest/grassland habitat, populations, soil/water/nutrient/decomposition pools | Ecology Runtime V1 | Submit bounded commands and project returned state |
| Farm plots, crop batches, harvest batches and basic warehouse lots | Agriculture Alpha | Extend through its existing state and event interfaces |
| Worker shifts, attendance, location and effective labor | Physical Labor | Reference work-shift IDs and validated time logs |
| Routes, delivery orders, vehicles, fuel, wear and travel | Real Causal World | Reference route/delivery IDs and transport events |
| Market listings/orders, inventory accounting and financial ledger entries | `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` under Supply Chain rules | Reference order/lot/ledger IDs; never duplicate balances |
| Rights and capabilities | Existing Rights authority | Request capability decisions; never grant rights locally |

The remaining domain entities have one explicit owner:

| Domain entity | Authoritative owner | Cross-runtime references |
|---|---|---|
| `IRRIGATION_NETWORK` | Agriculture Alpha facility state | Causal World construction-project ID; Ecology water-pool IDs |
| `FERTILIZER_BATCH` | Economy Runtime inventory lot | Agriculture application event; Ecology nutrient delta |
| `COMPOST_BATCH` | Ecology Runtime decomposition/nutrient pool | Source Economy lot IDs and optional completed-output lot ID |
| `HOUSEHOLD_FOOD_ACCOUNT` | Economy Runtime inventory and ledger keyed by the Player Genesis household ID | Player Genesis household ID only |
| `ORGANIC_WASTE_BATCH` | Ecology Runtime decomposition pool | Economy custody/inventory reference where storage applies |
| `NUTRIENT_RETURN_EVENT` | Ecology Runtime event history | Agriculture plot ID and source batch ID |
| `FOREST_REGENERATION_PROJECT` | Ecology Runtime restoration event/state | Physical Labor shift IDs and Economy cost-entry IDs |

Where a row names cross-runtime references, those referenced Runtimes retain
their own authoritative truth. For example, Agriculture owns the irrigation
facility lifecycle but cannot copy a Causal World construction state or an
Ecology water balance. A completed compost output may receive a new Economy lot
ID, but the Ecology decomposition record remains the sole transformation and
mass-accounting source.

`FOREST_STAND`, `GRASSLAND`, `SOIL_PROFILE` and `WATER_SOURCE` are Ecology
or Life projections. `FARM_PLOT`, `CROP_BATCH`, `HARVEST_BATCH` and
`WAREHOUSE_LOT` are Agriculture projections. `WORK_SHIFT` and
`DELIVERY_ORDER` are foreign references. `MARKET_ORDER` and all inventory or
cash balances are Economy projections. V1-owned records are limited to
orchestration commands, action results, foreign identifiers and hash-linked
trace events.

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

Water moves through paired pool transfers; irrigation is not an unexplained
sink. For each transfer, one pool debit equals another pool credit within the
configured tolerance:

- source withdrawal: `water_source -= x`, `irrigation_network += x`
- field delivery: `irrigation_network -= x`, `soil_moisture += x`
- crop uptake: `soil_moisture -= x`, `crop_water_store += x`
- runoff: `soil_moisture -= x`, `runoff_or_river_pool += x`
- drainage: `soil_moisture -= x`, `drainage_pool += x`
- evaporation/transpiration: liquid pool debit is paired with an atmospheric
  water-proxy credit
- recorded removal: originating pool debit is paired with a named external
  custody/removal record

Rainfall credits the receiving surface/soil pool and debits the bounded
atmospheric rainfall input. The sum of source, network, soil, crop, runoff,
drainage and atmospheric proxy deltas must be zero, except for explicitly
declared external boundary transfers. Every boundary transfer records source,
destination, amount, unit, reason and event ID.

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
