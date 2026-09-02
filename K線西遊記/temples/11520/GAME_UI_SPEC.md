# 11520 花果山 5D K 線西遊記｜遊戲畫面與器官施工規格

## Metadata

| Field | Value |
|---|---|
| VERSION | 1.0.0 |
| REVISION | 2026-09-03.1 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-09-03 |
| UPDATED_BY | GPT-5.6 Sol |
| REVIEWED_BY | Human instruction approved for construction |
| SOURCE_COMMIT | PENDING_THIS_CHANGESET |
| TASK_ID | K11520-GAME-UI-CONSTRUCTION-20260903 |
| CHANGE_REASON | Establish one authoritative, cumulative construction specification for the 11520 playable 5D game UI and its expandable organs; stop ad-hoc removal or redefinition of functions. |
| ANCESTOR | K線西遊記/temples/11520/README.md; HANDOFF_CURRENT.md; MANIFEST.json; user-approved 11520 UI construction mother image |
| SOURCE_OF_TRUTH | TRUE |

## 1. Formal identity

- PRODUCT_ID: `KGEN_11520_UNIVERSAL_EXCHANGE`
- PLACE_ID: `11520`
- FORMAL_NAME: `11520 花果山 5D K 線西遊記 / 花果山宇宙萬物交易所`
- FORMAL_ENTRYPOINT: `index.html`
- FORMAL_RUNTIME: `app.mjs`
- PLAYABLE_5D_ROUTE: `game-5d.html`
- DOMAIN_CORE: `/core/index.mjs`
- Rule: formal filenames stay stable. Version and revision live inside metadata and changelog; do not create `v2`, `final`, `hotfix`, `stable` active filenames.

## 2. Life / organ construction law

1. One image = one Life reference asset. A construction image is not decoration; it is a governed design organism with identity, purpose and lineage.
2. One place = one governed place organism. Place 11520 keeps one current formal UI specification and one current construction reference drawing.
3. A residence, building, map, character, monster, tool panel, exchange panel and other persistent world object is treated as a game Life / organ record when promoted from concept to runtime.
4. A later UI change must not silently delete an existing organ. Removal requires explicit deprecation/archival evidence and a changelog entry.
5. Every runtime organ must declare: identity, location, owner/world binding, inputs, outputs, state, persistence, error state and settlement boundary.

## 3. Construction reference

Formal construction drawing: `design/UI_REFERENCE.svg`.

The drawing fixes the page zoning and function inventory. Visual polish may evolve, but the functional zones below are cumulative unless an explicit revision changes this document.

## 4. Main playable 5D world

The centre of the screen is a real third-person 3D gameplay world, not a flat wallpaper.

Required runtime elements:

- 3D player character with skeleton-ready model slot, idle/walk/run/attack/hit/death state machine.
- Perspective camera with right-hand orbit/rotation; camera follows the player.
- XZ = ground plane movement. Left joystick controls XZ movement and heading.
- Y = height axis. Independent vertical control, spring-return to zero velocity.
- C = spatial warp/speed, `0C` means stationary. C is not trading leverage.
- Terrain height, road/path, trees, flowers/grass, rocks, buildings and collision layer.
- Monster/NPC spawn points, HP, aggro, attack, hit, reward and defeat states.
- Minimap with player heading, target and clickable auto-path destination.
- HUD: player HP, energy/stamina when implemented, XYZ coordinates, current place, KGEN, KAIOS, time/network state.
- Google/real map is an address/navigation/origin layer; it is not the battle geometry.

## 5. Economy separation

### 5.1 K-world / exchange combat

- KX / KY / KZ are independent K-market membrane axes.
- Each axis can select a supported market independently.
- K-world settlement unit: KGEN.
- Trading firepower = signed lots. Centre `0`, up = long, down = short.
- Common-use precision band: 0–10 lots. Outer band accelerates continuously to 100 lots.
- `1 KGEN = 1 lot` is the current game contract sizing convention.
- L = trading leverage. L is independent from C.
- PnL core: `price difference × direction × lots × point value`.
- Leverage changes margin requirement, not the PnL multiplier a second time.
- Order submission is always preview -> confirm/cancel -> submit. Opening the sword/trade controls never submits an order.

### 5.2 XYZ world / life combat

- XYZ world activities use KAIOS for battle/life rewards and costs.
- Monster combat, food, pets, tasks, local services and life consumption belong to XYZ/KAIOS.
- KUFO remains a separate long-duration energy/fuel class where applicable.

## 6. Main screen fixed zones

### Top bar

- 11520 title/place identity.
- KGEN and KAIOS balances.
- player identity/profile.
- local/server time and connection status.
- mail/notice/ranking/achievement/shop/settings shortcuts when enabled.

### Left fixed rail

The desktop/wide layout exposes the full main menu. Mobile may collapse it into the right-bottom dock, but functions must remain available:

- Main world (5D)
- K-market / exchange panel
- Positions
- Open orders / pending orders
- Trade history
- Asset overview
- Trading records / statistics
- Market information
- Inventory / backpack
- Character status
- World map
- System settings
- Help / AI concierge

### Bottom-left

- XZ joystick.
- System/event log above joystick when space allows.

### Bottom-centre / right combat controls

- attack / skill / dodge-interaction group for XYZ combat.
- trade sword toggles exchange controls only.
- firepower slider and L leverage slider appear only when trade controls are expanded.
- Y height and C warp remain spatial controls and are never replaced by trading parameters.
- order-fire button opens the confirmation sheet; it does not submit directly.
- flat/close-position action remains separately available in K-world.

## 7. Expandable organ pages

Every organ must be openable and closable, must preserve state, and must not cover critical controls without a close/back affordance.

### 7.1 Trading panel

Shows KX/KY/KZ tabs, selected market, live price, K-line/chart, direction/firepower, L leverage, margin estimate, available KGEN and order entry actions.

### 7.2 Positions

For each KX/KY/KZ position show: market, side, lots, entry, mark/reference price, L, margin, unrealized PnL, maintenance state and close action.

### 7.3 Open orders

Show order ID, axis, market, side, order type, lots, price, status, created time and cancel action. Cancelling one order must not mutate unrelated orders.

### 7.4 Trade history

Show filled/closed orders with timestamps, entry/exit, lots, PnL KGEN and reason/status.

### 7.5 Asset overview

Show KGEN available, locked margin, unrealized PnL, realized PnL, KAIOS, KUFO and any enabled wallet balance. Sandbox/local values must be clearly separated from verified wallet/chain values.

### 7.6 Trading records / statistics

Day/week/month filters; trade count, win rate, realized PnL, best/worst trade and average PnL. No fabricated shared/global statistics.

### 7.7 Market information

KX/KY/KZ prices, change, data-source age, market status and next relevant update. Feed failure must be visible.

### 7.8 Backpack

Items are inventory records with item ID, life/organ class, quantity, weight, durability/energy where relevant and use/equip action. Items cannot appear from UI animation alone.

### 7.9 Character status

Player model preview, HP, energy/stamina, attributes, equipment and movement/combat stats. Character identity is persistent and independent from market position.

### 7.10 World map

Shows the internal 5D world map, regions, buildings, monsters/NPCs, ATM/service points, destinations and player position. Clicking a valid destination may trigger local auto-pathing.

### 7.11 System settings

Audio/music/voice, graphics quality, camera sensitivity, joystick handedness, accessibility, language, network/data source and account/privacy controls.

### 7.12 Help / AI concierge

Context-sensitive explanation for every major organ. AI must state clearly whether an action is only adjustment, local simulation, off-chain state or a real wallet/chain action. Voice can be disabled; text fallback remains available.

## 8. Order confirmation sheet

Opening `下單開火` produces a confirmation sheet with at least:

- K axis and market
- side
- lots
- L leverage
- reference/expected price
- point value
- notional/exposure indicator
- initial margin
- maintenance margin
- available KGEN
- estimated liquidation/risk state when the rule exists
- PnL formula
- market-data timestamp/age
- Cancel
- Confirm order

Only Confirm performs the submit action. Cancel/close must leave position, balance and orders unchanged.

## 9. Runtime / backend boundary

- GitHub Pages is the public static frontend and cannot be treated as a persistent multiplayer backend.
- Existing `backend/server.mjs` is an off-chain backend prototype and must not be described as deployed until an actual service endpoint exists.
- Target production backend: service API + persistent player/world/order store + asset/resource storage/CDN; current preferred deployment architecture is Cloud Run + Firestore + Cloud Storage/CDN, subject to deployment/configuration evidence.
- Player login resource flow: fetch manifest -> verify resource version -> download required world/model/audio packs -> enter world. Failed required assets must expose a recover/retry state.

## 10. Resource / Life packaging

Every production 3D resource pack should expose a stable manifest entry containing:

- `life_id`
- `resource_id`
- `species/class`
- `place_id`
- `path`
- `sha256`
- `format`
- `size`
- `license/provenance`
- `version`
- `revision`
- `dependencies`
- `status`

No untracked model/texture/audio asset may silently replace another Life.

## 11. Mobile interaction requirements

- Critical controls remain inside safe areas.
- No overlapping market cards, telemetry and price readout.
- Expandable panels have explicit close/back controls.
- Right-bottom dock may collapse, but all functions listed in section 6 remain reachable.
- Sliders use non-linear precision where needed: common small values occupy more physical travel; extreme values accelerate in the outer band.
- Touch drag, pointer cancel and orientation/resize events must restore a safe control state.

## 12. Acceptance criteria

The 11520 playable product is not accepted as a toy prototype when any of these remain true:

- main character is only an emoji or primitive placeholder without a replaceable model/animation pipeline;
- 5D world is only a flat background with no perspective/world collision structure;
- menu buttons are decorative or only `alert()` placeholders;
- panels cannot be closed or state is lost unpredictably;
- trading submit bypasses a confirmation state;
- backend/deployed status is fabricated;
- removed functions are not documented/deprecated;
- current spec, manifest and changelog disagree on the active runtime.

## 13. Current construction sequence

1. Restore complete function inventory and stable navigation.
2. Make the mother-image zoning responsive for phone and desktop.
3. Upgrade 3D character/resource pipeline and world collision/terrain.
4. Complete XYZ combat loop and KAIOS settlement state.
5. Complete K-world order/position/order-book/history/accounting state using KGEN.
6. Connect persistent backend only after endpoint/deployment evidence exists.
7. Add automated regression checks for navigation, no-overlap, slider mappings, confirm/cancel invariants and economy separation.

## 14. Change-control rule

Any future 11520 UI or gameplay behavior change must update this cumulative file, the nearest `CHANGELOG.md`, and the relevant manifest/runtime metadata. A feature may evolve, but it must not disappear by accident.
