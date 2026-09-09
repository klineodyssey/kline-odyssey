# KAIOS 11520 GAMEPLAY WHITEPAPER

STATUS: DRAFT_CANDIDATE  
EDITION: 0.1  
DATE: 2026-09-09  
TASK_ID: KAIOS-11520-GAME-WHITEPAPER-V0-1-20260909  
PURPOSE: Cumulative gameplay design source for Human and AI workers.  
AUTHORITY_BOUNDARY: This document specifies game design. It does not authorize Mainnet transfers, token burns, payments, treasury actions, contract deployment, governance changes, or production deployment.

## 1. Product vision

KAIOS 11520 is one persistent three-dimensional XYZ world in which living players move, explore, transport cargo, fight monsters and hostile forces, cooperate with factions, capture strategic territory, defend supply lines, and expand civilization.

The game combines three systems without collapsing them into one accounting system:

1. **KGEN market universe** — KX/KY/KZ are market-universe expansion boundaries produced by KGEN collateral, positions, long/short conflict, matter/antimatter conflict, and settlement.
2. **KAIOS living game world** — X/Y/Z are spatial coordinates that a player can change through movement and gameplay.
3. **Territory and logistics war** — players transport KAIOS through XYZ space, fight for passage and control, establish faction occupation, defend territory, and continue toward new frontiers.

The fundamental invariant is:

> Player XYZ movement MUST NOT directly change KX/KY/KZ. KX/KY/KZ are independently determined by the KGEN market universe. KX/KY/KZ may change the environment or available world boundary in which XYZ gameplay occurs.

## 2. Coordinate model

### 2.1 Player-space XYZ

`X`, `Y`, and `Z` are the player's mutable 3D spatial coordinates.

A route from `(x0,y0,z0)` to `(x1,y1,z1)` has displacement:

`DeltaXYZ = (x1-x0, y1-y0, z1-z0)`

Example:

`DeltaXYZ = (100,-10,88)`

means travel `X+100`, `Y-10`, `Z+88`. These signs are spatial directions, **not financial long/short positions**.

For equal axis scales, route distance is:

`sqrt(100^2 + (-10)^2 + 88^2) = sqrt(17844) ~= 133.58 world units`.

### 2.2 KGEN market-space KX/KY/KZ

KX/KY/KZ are universe-boundary state produced by the KGEN market and settlement system. A player cannot change them by walking, flying, fighting, transporting cargo, or moving the XYZ joystick.

The game may project KX/KY/KZ into world conditions such as available frontier, matter/antimatter regions, environmental pressure, resource distribution, monster ecology, or newly reachable territory. Such projection must be explicit and must never claim that `X == KX`, `Y == KY`, or `Z == KZ`.

### 2.3 11520 three-plane control

The same XYZ world is controlled through three selectable planes:

- `XZ + Y`: circular joystick controls X/Z; vertical rail controls Y.
- `XY + Z`: circular joystick controls X/Y; vertical rail controls Z.
- `YZ + X`: circular joystick controls Y/Z; vertical rail controls X.

All modes operate on the same canonical XYZ position. Switching planes must never reset or fork player coordinates.

## 3. KAIOS gameplay role

KAIOS is the game-world resource associated with living activity, logistics and gameplay. A player may possess, allocate, transport, protect, or use KAIOS within game rules.

The implementation MUST distinguish at least:

- `wallet_balance`: authoritative asset balance when a real wallet is involved;
- `game_allocation`: explicitly authorized game-world allocation;
- `cargo_amount`: KAIOS represented as cargo in a mission;
- `combat_energy`: temporary gameplay power committed to an encounter.

A combat loss MUST NOT silently burn, transfer, or confiscate real wallet assets. Any real transfer/burn/payment/claim requires a separate explicit, receipt-gated and authorized financial path.

## 4. Core player loop

The primary loop is:

`Choose mission -> choose XYZ destination -> allocate cargo/resources -> travel -> encounter -> fight/negotiate/evade -> reach objective -> capture/deliver/defend -> receive game outcome -> continue exploration`.

The player should always have a visible reason to move through XYZ space. Empty movement without world consequence is not the target product.

## 5. Logistics / armored-cash-transport gameplay

A mission can require transporting KAIOS from origin A to destination B.

Example:

- Cargo: `1000 KAIOS`
- Origin: `(0,0,0)`
- Destination: `(100,-10,88)`
- Required displacement: `(100,-10,88)`
- Straight-line distance: approximately `133.58` world units.

The 1000 KAIOS remains cargo; it is not automatically split into X/Y/Z financial positions.

A route can contain hostile territories, monsters, checkpoints, terrain, airspace, allies, alternate paths, ambushes and supply bases. The player may choose a safer longer route or a dangerous shorter route.

A successful delivery may produce a game-defined freight reward, faction supply, experience, reputation, construction resources or territorial reinforcement. Real-token settlement is outside this gameplay specification unless separately authorized.

## 6. Encounters and monsters

Entities occupy real XYZ locations or volumes. An encounter begins when player/world rules indicate contact, for example:

`distance(playerXYZ, monsterXYZ) <= encounterRadius`.

An encounter should permit meaningful choices where appropriate:

- fight;
- evade;
- retreat;
- negotiate;
- call allies;
- change route.

A monster may control a territorial volume and refuse passage. Defeating it can open a route, remove a local threat, unlock an area, generate game loot, or contribute to faction occupation.

## 7. Combat model

Holding more KAIOS must not automatically guarantee victory. A player chooses how much game allocation to commit as active combat energy.

Example:

- player available allocation: `1000`;
- player commits `300` combat energy;
- `700` remains reserve.

A baseline effective-power model may use:

`EffectivePower = CombatEnergy * SkillFactor * EquipmentFactor * TerrainFactor * StatusFactor`.

This formula is a starting design contract, not a final balance constant. Player skill, positioning, timing, cooperation and equipment should matter so combat does not become pure wallet-size comparison.

Combat must be deterministic enough to test but may include bounded gameplay variation when explicitly specified.

## 8. Factions

Players may join factions, remain neutral, or participate through future life/civilization systems.

Candidate faction examples include narrative civilizations such as Huaguoshan, Heavenly Court, or hostile/monster factions; these names are examples and do not freeze final faction canon.

Factions provide:

- friendly territory;
- shared objectives;
- supply lines;
- defense responsibilities;
- cooperative attacks;
- strategic identity;
- territorial history.

The intended feel combines accessible hero movement/combat with persistent territorial strategy, but 11520 is not required to copy a conventional MOBA or flat strategy map.

## 9. Territory capture

Reaching enemy land is **not sufficient for permanent ownership**.

The baseline capture sequence is:

`Reach hostile objective -> defeat/disable local resistance -> establish presence -> satisfy occupation time/objective -> establish faction control -> defend against counterattack`.

Territory belongs primarily to a faction/control system rather than permanently to the first individual who touches it. Individual players may receive roles such as discoverer, commander, city lord, defender, contributor, logistics leader or battle-credit holder without privately owning the entire world cell.

Capture progress should be visible and contestable.

## 10. Three-dimensional warfare

11520 territory is not restricted to a flat XZ map.

Combat can occur through:

- ground advance in XZ;
- vertical movement and aerial battle through Y;
- XY wall/cliff/vertical-plane operations;
- YZ flanking and aerial side approaches;
- full XYZ pursuit and interception.

A fortress that is strong from X+ may be attacked from another altitude or plane. This makes the three-plane joystick a tactical system rather than merely an unusual UI control.

## 11. Supply lines and team warfare

A faction that wins a battle but cannot supply the captured area should be vulnerable to losing it.

KAIOS logistics can support gameplay functions such as:

- combat-energy replenishment;
- NPC/monster-allied units;
- repairs;
- fortification;
- transport;
- construction;
- local respawn/support services.

These are game allocations unless a separately authorized financial system explicitly says otherwise.

Team power should not necessarily be a naive sum of wallet balances. Candidate balancing may use diminishing contribution, role bonuses, coordination, terrain and skill so large holders cannot automatically dominate every encounter.

## 12. KGEN market universe -> XYZ environment

The KGEN market can alter the world **environment**, not player XYZ through hidden coupling.

Conceptual flow:

`KGEN collateral/positions/settlement -> KX/KY/KZ universe state -> explicit World Boundary Projection -> XYZ frontier/environment -> player gameplay`.

Candidate effects include:

- frontier expansion/contraction;
- opening or closing regions;
- matter/antimatter environmental pressure;
- resource and monster distribution;
- weather/energy-field changes;
- new strategic objectives.

The projection layer must be testable and inspectable. It must not rewrite KGEN settlement based on a player's joystick movement.

## 13. Victory and profit semantics

Spatial direction signs are not financial long/short semantics.

For a delivery mission, game profit can be represented conceptually as:

`GameMissionNet = FreightReward - MovementCost - CombatCost - RepairCost`.

A player succeeds because cargo/objectives are completed under game rules, not because `(100,-10,88)` means "long X, short Y, long Z".

Financial KGEN profit/loss remains governed by the separate market settlement system.

## 14. First playable vertical slice

AI workers should build the smallest complete playable loop before adding large systems.

### MVP-1: XYZ Cargo Gate

1. Spawn player at `(0,0,0)`.
2. Give a **simulation-only** mission cargo display of `1000 KAIOS`.
3. Set destination to `(100,-10,88)` or a scaled equivalent suitable for the current world.
4. Show destination marker, distance and route direction.
5. Place one hostile monster/checkpoint in the route.
6. Enter encounter radius through real joystick movement.
7. Allow player to choose a bounded simulation combat allocation, e.g. `100 / 300 / 500`.
8. Resolve a testable encounter using game-state values only.
9. On victory, open passage; on defeat, knock player back to a safe XYZ point/cooldown state.
10. Reach destination with cargo state intact.
11. Display `DELIVERED` and a simulation-only mission result.
12. Do not execute a real token transfer, burn, payment or Mainnet transaction.

### MVP-1 acceptance criteria

- same canonical XYZ position across all three control planes;
- joystick visual direction matches avatar displacement;
- KX/KY/KZ unchanged by player movement;
- cargo amount remains distinct from combat energy;
- monster encounter is triggered by actual XYZ spatial relation;
- victory/defeat changes game-world state visibly;
- destination cannot be completed from outside its arrival radius;
- no silent real-asset mutation;
- real-browser functional QA;
- 390x844 interaction QA;
- screenshot evidence for travel, encounter and delivery states;
- visual QA must pass before human-playtest readiness is claimed.

## 15. MVP-2: faction territory

After MVP-1 is stable:

1. Add at least two factions plus neutral territory.
2. Add one capturable strategic point.
3. Require successful approach, local resistance resolution and occupation progress.
4. Add counterattack/defense state.
5. Connect logistics delivery to faction reinforcement.
6. Preserve faction control as game state independently from KGEN market settlement.

## 16. MVP-3: persistent war world

After faction capture is proven:

- multiple strategic points;
- faction supply network;
- team combat;
- NPC forces;
- construction/repair;
- respawn and recovery;
- mission generation;
- world-event projection from KX/KY/KZ;
- history/replay/audit of territorial changes;
- anti-cheat and authoritative multiplayer state design.

## 17. AI engineering work map

AI workers should treat this whitepaper as a design contract and decompose implementation into bounded work orders.

Recommended order:

1. **Coordinate invariant tests** — prove XYZ movement never mutates KX/KY/KZ.
2. **Mission state model** — origin, destination, cargo, status, route distance.
3. **Destination HUD/marker** — visible target and remaining distance.
4. **Encounter volume** — spatial monster/checkpoint trigger.
5. **Simulation combat allocation** — game-only active energy, no wallet mutation.
6. **Combat resolver** — deterministic test fixture first.
7. **Passage state** — blocked/open after encounter result.
8. **Delivery resolver** — arrival-radius gated completion.
9. **Mobile UX** — integrate with XZ+Y / XY+Z / YZ+X controls.
10. **Browser/screenshot QA** — travel, combat, victory, defeat, delivery.
11. **Faction state model**.
12. **Capture-point state machine**.
13. **Supply/defense loop**.
14. **KXYZ World Boundary Projection** only after the independent market-state interface is explicit and tested.

Every implementation work order must state whether it touches wallet, payment, contract, Mainnet, treasury or governance boundaries. If yes, it must stop at the applicable authorization gate.

## 18. Required safety invariants

The following are non-negotiable for future implementations:

1. XYZ movement cannot mutate KX/KY/KZ.
2. KX/KY/KZ cannot be fabricated from local joystick values.
3. Combat simulation cannot silently mutate real wallet balances.
4. Cargo state cannot masquerade as proof of real token custody.
5. UI labels must distinguish simulation/game allocation from authoritative financial balances.
6. Client-side victory cannot by itself authorize a financial payout.
7. No caller-supplied payment evidence may be treated as authoritative settlement without independent verification.
8. Replay protection is required before any future real-value action.
9. Multiplayer territorial authority requires an authoritative state model; local browser state alone is not sufficient.
10. KGEN market settlement remains independent from KAIOS gameplay settlement unless a future explicitly governed interface is approved.

## 19. Open design questions that do NOT block MVP-1

The Human does not need to define these before engineering can begin:

- final faction names and number of factions;
- exact combat balance constants;
- final monster taxonomy;
- final loot table;
- final construction economy;
- whether neutral players can found factions;
- long-term multiplayer server architecture;
- exact KXYZ-to-environment projection formula;
- final territorial season/reset policy.

These should remain configurable candidates until playtesting provides evidence.

## 20. Decisions that require Human/canonical approval before activation

Engineering may prototype these safely, but activation requires explicit authority where applicable:

- real KAIOS/KGEN transfer, burn, stake, escrow, payout or reward settlement;
- Mainnet transaction paths;
- treasury-funded rewards;
- production smart-contract changes;
- irreversible territory/economy governance;
- canonical changes to protected Physics CURRENT / Boot / Constitution;
- external KYC or exchange actions.

## 21. Definition of playable

11520 is **playable** when a Human can enter the real rendered world and, without reading developer logs:

- understand where they are;
- understand where they are going;
- move correctly in XYZ;
- see controls respond to touch;
- encounter an obstacle/enemy;
- make a meaningful tactical/resource choice;
- see battle outcome change the world;
- complete or fail a mission;
- understand what was gained/lost in game terms;
- continue into another objective.

A green unit test without this visible loop is not sufficient.

## 22. Cumulative-document rule

Future editions of this whitepaper must remain cumulative. Do not replace it with a diff-only document and do not require an AI worker to reconstruct current gameplay rules from old chat history. When a rule changes, update the relevant section and retain enough rationale/history for later workers to understand the current design.

---

### Initial design decision summary

KAIOS 11520 is a persistent XYZ territorial/logistics/combat world inside an independently evolving KGEN KX/KY/KZ market universe. Players transport KAIOS, navigate true 3D routes, fight monsters and opposing forces, establish faction control and defend supply lines. KGEN determines the market-universe boundary; KAIOS powers game-world activity. The first implementation target is a simulation-only 1000-KAIOS cargo mission with one spatial encounter and one destination, proven through real mobile browser and screenshot QA before expanding into faction war.