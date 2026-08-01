# KAIOS Fishpond Aquaculture Source Crosswalk

Task: `KAIOS-FISHPOND-AQUACULTURE-RUNTIME-V1-001`

Status: `REVIEWED_REQUIREMENTS_ONLY`

Charter sources are non-canonical requirements references. Canonical Life, Organism Schema V2, Universe Physics, Physical Labor, Causal World, Supply Chain and Ecology Runtime remain authoritative.

| Chapter | Program ID | Existing coverage | Gap | Dependency | Risk | Conflict | Recommended action |
|---|---|---|---|---|---|---|---|
| 23 | `KAIOS-CH-023-065-REPRODUCTION` | Ecology V1 bounded fish/shrimp populations | Stocking, quarantine, farm growth | Life Runtime, Ecology V1 | Medium | None | Reuse population IDs and caps |
| 24 | `KAIOS-CH-024-066-ECOLOGY` | Habitat, water, pollution, mortality | Farm operations and harvest | Ecology V1 | Medium | Commercial settlement is out of prior scope | Add simulation-only enterprise layer |
| 38 | `KAIOS-CH-038-080-SUPPLY_CHAIN` | Specification only | Feed, equipment and cold-chain dependencies | PR #65 | High | None | Implement bounded supply inputs |
| 39 | `KAIOS-CH-039-081-LOGISTICS` | Demo logistics | Stock and harvest delivery | Causal route engine | High | None | Require route, time, fuel and capacity |
| 40 | `KAIOS-CH-040-082-COMMERCE` | Demo commerce | Confirmed aquaculture orders | PR #65 demand rules | Medium | None | No buyer means no revenue |
| 45 | `KAIOS-CH-045-087-HOUSING` | Land/building demo | Pond land-use gate | Land rights | High | No real title authority | Simulated usage right only |
| 47 | `KAIOS-CH-047-089-AGRICULTURE` | Agriculture demo | Fishpond industry cycle | Water, labor, ecology | High | Existing `FISH_FARM` is not `FISHPOND` | New specialized module, no duplicate ecology engine |
| 48 | `KAIOS-CH-048-090-ENERGY_GRID` | Specification only | Aeration/cooling continuity | Energy accounting | High | Source underspecified | Bounded electricity and outage proxy |
| 49 | `KAIOS-CH-049-091-ECOLOGY` | Pollution/restoration implemented | Pond waste and treatment | Ecology V1 | High | None | Causal water-quality deltas |
| 51 | `KAIOS-CH-051-093-CONSTRUCTION` | Causal house project partial | Pond stage graph | Causal Runtime, PR #64 | High | None | Ordered, time-consuming construction |
| 80 | `KAIOS-CH-080-122-FOOD_SECURITY` | Agriculture demo | Aquatic food supply | Harvest/inventory | Medium | Nutrition details underspecified | Product inventory proxy only |
| 84 | `KAIOS-CH-084-126-ECOLOGY` | Ecology V1 partial | Farm restoration controls | Ecology V1 | Medium | None | Reuse pollution/restoration events |
| 86 | `KAIOS-CH-086-128-SUPPLY_CHAIN` | Specification only | Feed, stock and equipment chain | PR #65 | High | None | Block missing inputs |
| 87 | `KAIOS-CH-087-129-COMMERCE` | Demo only | Grade/order matching | Demand and sales spec | Medium | Consumer law has no real effect | Simulated channel and rejection only |
| 90 | `KAIOS-CH-090-132-ACCOUNTING` | Balanced-ledger specification | Pond enterprise postings | PR #65 | High | None | Double-entry simulated ledger |
| 91 | `KAIOS-CH-091-133-BANKRUPTCY` | Specification only | Distress and asset continuity | PR #65 | High | No real court effect | Simulation-only restructuring/liquidation |
| 107 | `KAIOS-CH-107-019-FOOD_SECURITY` | Agriculture demo | Fish/shrimp harvest supply | Ecology, inventory | Medium | Source underspecified | Record product mass and spoilage |
| 109 | `KAIOS-CH-109-021-TRANSPORT` | Causal transport demo | Cold-chain delivery | PR #63 | High | None | Reuse route constraints conceptually |
| 114 | `KAIOS-CH-114-027-ECOLOGY` | Ecology V1 partial | Aquaculture biodiversity impact | Ecology V1 | Medium | None | Capacity and pollution gates |
| 121 | `KAIOS-CH-121-035-FOOD_SECURITY` | Agriculture demo | Rural pond enterprise | Labor and finance | Medium | Source underspecified | Local simulated enterprise only |
| 122 | `KAIOS-CH-122-036-WATER` | Water cycle partial | Pond balance and water-source rights | Ecology V1 | High | None | Conserved pond water ledger |
| 124 | `KAIOS-CH-124-038-TRANSPORT` | Causal route demo | Resilient cold chain | PR #63 | High | None | Delay and spoilage scenarios |
| 129 | `KAIOS-CH-129-043-MANUFACTURING` | Production/logistics demo | Aquaculture production status | PR #65 | High | None | Causal input-to-product loop |
| 132 | `KAIOS-CH-132-047-FOOD_SECURITY` | Agriculture demo | Inventory resilience | Warehouse spec | Medium | Source underspecified | Safety stock and spoilage accounting |

## Coverage Decision

- Existing reusable coverage: Life, fish/shrimp identity, FISHPOND habitat, bounded population, water/pollution, causal transport, labor and finance specifications.
- Missing authority-safe implementation: staged pond construction, stocking operations, water-quality operations, feed/growth, aeration, harvest, cold chain, orders, inventory and enterprise ledger.
- Source-underspecified areas use explicit `SIMULATION_APPROXIMATION` parameters and never claim real biological, veterinary or food-safety validity.
