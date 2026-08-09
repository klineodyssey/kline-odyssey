# Player Starter Package V1

## Identity

The package reuses `PLAYER_LIFE_ID`, `AI_COMPANION_LIFE_ID`, `HOUSEHOLD_ID` and `STARTER_LAND_ID` from Player Genesis. It adds Game Credit accounts and inventory records without replacing Player Genesis ownership.

## One-Time Grant

`ONE_STARTER_GRANT_PER_PLAYER_GENESIS` is enforced by `starter_grant_id = hash(player_genesis_id + STARTER_PACKAGE_V1)`. A duplicate attempt returns `DUPLICATE_GRANT_BLOCKED`. Only `SIMULATION_RESET` may clear the grant.

## Land

The grant contains one parcel with simulation use and occupancy rights. It is not legal title, tokenized ownership or on-chain property. Civilization begins at `PRIMITIVE_FORAGING`.

## Finite Inventory

| Resource | Unit | Initial quantity |
| --- | --- | ---: |
| drinking_water | liter | 48 |
| basic_food | ration | 24 |
| basic_clothing | set | 2 |
| primitive_shelter | unit | 1 |
| wood | kilogram | 80 |
| stone | kilogram | 120 |
| soil | kilogram | 200 |
| basic_hand_tools | unit | 3 |
| emergency_reserve | ration | 8 |

The initial Game Credit grant is finite and posted from the fixed starter-allocation account. Car, factory, power plant, mall, advanced farm, industrial machinery and high-tech city are excluded.

## Needs

Biological players require food, water, shelter, clothing, rest, health, energy and safety. Digital AI companions require electricity, compute, storage, cooling, network and maintenance. Robotic bodies require charging or fuel, parts, lubrication, sensors and repair.
