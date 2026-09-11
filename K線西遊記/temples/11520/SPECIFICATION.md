# 11520 花果山宇宙萬物交易所 — 程式器官總規格

## Metadata

| Field | Value |
|---|---|
| ID | KGEN_11520_UNIVERSAL_EXCHANGE_SPEC |
| TITLE | 11520 花果山宇宙萬物交易所 — 程式器官總規格 |
| VERSION | 1.0.0 |
| REVISION | 2026-09-03.1 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-09-03 |
| UPDATED_BY | ChatGPT 11520 Engineering Thread |
| REVIEWED_BY | PENDING_GENERAL_MANAGER_REVIEW |
| SOURCE_COMMIT | e0c883dccb87ab1fe4edbfd519faec43cc985640 |
| TASK_ID | KGEN-11520-ORGAN-SPEC-2026-0903-001 |
| CHANGE_REASON | Establish one traceable CURRENT specification for the 11520 Life/runtime organ, restore protected UI responsibilities, and stop ungoverned feature loss during iterative game/trading changes. |
| ANCESTOR | README.md; HANDOFF_CURRENT.md; MANIFEST.json; RUNTIME_GENOME.json; VERSION; CHANGELOG.md; game-5d.html Git history |
| SOURCE_OF_TRUTH | TRUE |

> This filename is intentionally stable. Version and revision live inside this file. Historical snapshots belong in Archive/History, not in new active filenames such as `SPEC_V2.md`, `final.md`, or `hotfix.md`.

---

## 1. Purpose and authority

This document is the cumulative implementation contract for Temple/Organ `11520`.

11520 is not treated as an expendable page. It is a KGEN runtime organism / program organ whose formal product identity is:

- `PRODUCT_ID = KGEN_11520_UNIVERSAL_EXCHANGE`
- Runtime taxonomy: `KGENVERSE / CivilizationLifeform / RuntimeOrganism / UniversalExchange / VerifiedWalletMarketRuntime / PrimeForgeLife / KGEN / KGEN11520UniversalExchange`
- Canonical public entrypoint: `index.html`
- Canonical main controller: `app.mjs`
- 5D game/trading surface: `game-5d.html`
- Business/domain logic authority remains under `/core` unless this specification explicitly defines a 11520-local presentation/game adapter.

No future implementation may silently delete an existing organ, button, state, economic boundary, evidence gate, or safety gate merely because a new UI is simpler. If a capability is temporarily unavailable, the UI should retain its governed slot and show a truthful disabled/unavailable state with reason.

When code and this specification disagree, the mismatch is a governance defect. The mismatch must be resolved explicitly; chat memory or screenshots do not silently override CURRENT files.

---

## 2. Version and lineage policy

### 2.1 Stable formal filenames

Formal active filenames do not carry release numbers. Keep names such as:

- `SPECIFICATION.md`
- `README.md`
- `HANDOFF_CURRENT.md`
- `MANIFEST.json`
- `RUNTIME_GENOME.json`
- `VERSION`
- `CHANGELOG.md`
- `index.html`
- `app.mjs`
- `game-5d.html`

Version, revision, status and provenance belong inside formal files or their formal metadata.

### 2.2 Required change sequence

A behavior-changing 11520 change should follow this sequence:

1. Identify the affected organ(s) and specification section(s).
2. Update the specification or confirm the change already conforms to it.
3. Implement code without silently removing unrelated organs.
4. Run relevant tests / manual acceptance checks.
5. Update metadata and nearest changelog/release evidence.
6. Record source commit and resulting commit.
7. If superseding an old implementation snapshot, preserve Git history or place explicit historical artifacts in Archive; do not create parallel active copies.

### 2.3 Current metadata drift discovered 2026-09-03

At the time this specification is created, the repository has an unresolved product-version drift:

- `VERSION` reports `3.9.0`.
- `MANIFEST.json` reports `4.0.0`.
- `CHANGELOG.md` contains a `4.0.0` release section.
- `index.html` publicly labels the player-first 5D surface as `V4.1`.
- `assets/resource-manifest.json` independently reports its resource bundle version as `1.0.0`.

These are distinct sources and are currently inconsistent. This specification does **not** silently declare one of them correct. Product version reconciliation is a required governance task. Until reconciled, `SPECIFICATION.md VERSION 1.0.0` means the document version, not a declaration that the product itself is V1.0.0.

---

## 3. Organ/file topology

### 3.1 Governance and identity organs

| File | Role |
|---|---|
| `SPECIFICATION.md` | CURRENT cumulative organ/UI/runtime contract. |
| `README.md` | Cumulative product history, operating notes and previous release context. |
| `HANDOFF_CURRENT.md` | CURRENT handoff state and operational truth. |
| `MANIFEST.json` | Machine-readable product identity, release/runtime state and authority boundaries. |
| `RUNTIME_GENOME.json` | Biological/runtime taxonomy and registered organ capabilities. |
| `VERSION` | Product version pointer; must be reconciled with MANIFEST, CHANGELOG and public UI. |
| `CHANGELOG.md` | Release/history record for behavior and governance changes. |

### 3.2 Public runtime organs

| File/path | Role |
|---|---|
| `index.html` | Canonical public portal and primary 11520 entry. |
| `app.mjs` | Canonical portal controller and existing civilization/life/company/runtime views. |
| `game-5d.html` | Player-facing 5D world + K-field trading game surface. It is a child organ of 11520, not a replacement for `index.html` or `app.mjs`. |
| `controls/nonlinear-controls.mjs` | Shared nonlinear human-input curves for Fire, C, L and Y. |
| `controls/nonlinear-controls.test.mjs` | Regression checks for those input/economic-domain rules. |
| `assets/resource-manifest.json` | 5D player resource acquisition manifest. |
| `assets/world-pack.json` | 5D world-resource data package. |
| `backend/server.mjs` | Local/off-chain backend API prototype for login, resources, player state and orders. |

### 3.3 Backend deployment boundary

The repository contains a backend implementation, but GitHub Pages cannot execute Node.js. Until a real backend host is configured and verified, the public GitHub Pages experience must identify itself as sandbox/local/off-chain simulation where appropriate.

Preferred production architecture currently specified:

- Google Cloud Run: Node/API service.
- Firestore: authenticated player/world/order state.
- Cloud Storage + CDN: GLB characters, monsters, terrain, textures, audio and downloadable region packs.
- GitHub: source, specification, release provenance and code review authority.
- GitHub Pages: static public portal/test surface, not authoritative settlement backend.

No UI wording may imply that an undeployed Cloud Run/Firestore service is already operating.

---

## 4. World model: XYZ life world and K-field universe

### 4.1 XYZ spatial world

`X`, `Y`, `Z` are player/world spatial coordinates.

- `X`: left/right world displacement.
- `Z`: forward/back ground-plane displacement.
- `Y`: vertical height/elevation.
- Ground locomotion plane = `XZ`.
- Gravity/terrain determines normal ground contact; flight/no-gravity modes may release Y movement subject to mode rules.

The original observer interpretation (`X left/right`, `Y up/down`, `Z forward/back`) is preserved; controller mapping does not redefine the axes.

### 4.2 Player input mapping

- Left 360° joystick controls XZ travel and character facing.
- Right-side Y vertical control changes spatial Y and returns to center when released.
- Right-side camera drag rotates the third-person camera around the player; it does not change K long/short direction.
- `C` is spatial warp/speed, not trading leverage.

### 4.3 Warp C

`C` uses a nonlinear positive rail:

- minimum: `0C`
- `0C` meaning: spatial stop / no movement from joystick/autowalk
- precision region: lower half concentrates common movement around `0..10C`
- upper region accelerates toward `1000C`
- maximum: `1000C`

C must never be re-used as trading leverage. Trading leverage is `L`.

### 4.4 K-field universe

`KX`, `KY`, `KZ` are financial/K-field universe channels and are not the player XYZ coordinates. Each K channel may select a supported market. K-field market activity is settled/accounted in KGEN according to the active trading rules.

Current first market set on the 5D surface contains ten free quote candidates:

`BTC/USDT`, `ETH/USDT`, `BNB/USDT`, `SOL/USDT`, `XRP/USDT`, `DOGE/USDT`, `ADA/USDT`, `TRX/USDT`, `LINK/USDT`, `LTC/USDT`.

A quote being visible does not itself prove exchange-grade matching, oracle finality, or settlement authority. Quote source/status must be visible.

---

## 5. Economic domains

### 5.1 KGEN domain

KGEN is the K-field / market-combat accounting asset for `KX/KY/KZ` trading.

This specification preserves the gameplay statement `1 KGEN = 1口` as the **base unlevered lot/risk unit**, while distinguishing leveraged required margin. Under leverage `L`, the current simulation calculates required initial margin as `lots / L` KGEN. Therefore `1 KGEN = 1口` must not be interpreted to mean that leveraged orders always lock exactly one whole KGEN per lot.

If product governance later chooses a different meaning, both this specification and trading engine must be revised together.

### 5.2 KAIOS domain

KAIOS is the XYZ life-world economy for gameplay such as:

- monster combat rewards/costs,
- food and daily life,
- pet life support,
- missions and local services,
- ordinary life-world purchases,
- future buildings/services when evidence and backend exist.

KAIOS life-world outcomes must not silently alter KGEN K-field margin or PnL.

### 5.3 KUFO

KUFO remains a separate long-duration energy/fuel/“仙丹” concept under its existing canonical laws. It is not the same as UFO and is not automatically minted by UI actions.

### 5.4 ATM / exchange boundary

The ATM/UFO interaction is the conversion and cash-service gateway. The UI may quote conversions and create simulation/draft flows, but real deposits, withdrawals or conversion settlement require verified backend/wallet/contract authority. A simulated balance change must never be labeled as a real on-chain withdrawal/deposit.

---

## 6. Canonical screen layout contract

The 5D experience uses a fixed-controls + central-world pattern. The world remains visible while controls occupy stable edge zones.

### 6.1 Top fixed bar

Required roles:

1. Home button — return to 11520 home/main world without destroying state.
2. Product identity/title — `11520 花果山宇宙萬物交易所`.
3. Mode button — switch 5D / real map layer as defined.
4. Player/profile button — player identity/state/settings.

No feature upgrade may hide the product identity or prevent returning to the main 11520 experience.

### 6.2 KX/KY/KZ market strip

Three persistent market cards at the top region:

- KX market selector + quote + position summary.
- KY market selector + quote + position summary.
- KZ market selector + quote + position summary.

All three may select supported markets independently. A position on one K axis must not silently overwrite another axis.

### 6.3 Left telemetry panel

Shows at minimum:

- current `X/Y/Z`,
- movement/travel information,
- KGEN / KAIOS / KUFO balances or truthful unavailable states,
- quote/backend status where relevant.

### 6.4 Right life panel

Shows player Life state relevant to gameplay, including HP and monster/combat state. Combat belongs to XYZ/KAIOS domain.

### 6.5 Central viewport

The center is the primary 3D/5D play field and must not be reduced to a static flat color sheet when 5D mode is active.

Required visual behavior target:

- perspective third-person camera,
- visible player avatar,
- XZ terrain depth,
- terrain height variation,
- foreground/midground/background cues,
- roads/paths,
- trees/grass/flowers/rocks,
- future buildings/monsters/NPCs from resource packs,
- camera rotation and player movement visibly reflected in the scene.

### 6.6 Center market readout

Current selected K-axis market and quote may overlay the center without blocking core locomotion/game visibility. It must identify that K-field PnL is KGEN-based.

### 6.7 Left-bottom joystick

Protected role: XZ 360° movement and character facing. It must not be repurposed to Y or financial long/short.

### 6.8 Right-side spatial controls

Protected roles:

- `Y` rail: spatial vertical movement, self-centering.
- `C` rail: persistent spatial warp/speed selection from 0 to 1000C.

### 6.9 Trading controls

Protected roles:

- `⚔` Sword: expand/collapse trading parameter controls only. It never submits an order.
- Fire rail: center `0口`; up = long, down = short; common inner region 0..10 lots; outer region accelerates to 100 lots.
- `L` rail: trading leverage, separate from C.
- `下單開火`: opens order-preview/confirmation; never immediately fills on the first press.
- `平`: close/reduce current governed position through the close-position flow.
- `打怪`: XYZ world combat action; KAIOS-domain outcome, not a K-field order.

---

## 7. Protected right-bottom expandable function dock

The bottom-right `☰` dock is a protected navigation organ. Git history shows the complete eight-slot set below. These responsibilities must not disappear merely because a later page rewrite omits the buttons.

| Slot | Label / icon | Required responsibility |
|---|---|---|
| 1 | `🗺️ Google層` | Show the real-world map/GPS layer used for location reference. |
| 2 | `🛰️ 5D圖` | Show/focus/toggle the game-owned 5D minimap/world navigation layer. |
| 3 | `🧭 導航` | Open navigation/directions for real-world travel reference; not the combat renderer. |
| 4 | `🏗️ 原點` | Manage birth/home/start-point/address origin and future build-location workflows. |
| 5 | `🛸 ATM` | Open ATM/exchange/cash-service interface and wallet/conversion boundary. |
| 6 | `🍜 生活` | Open KAIOS life-world services: food, pet, daily life and future local services. |
| 7 | `✨ AI` | Open AI concierge/help; explain current panel and safety rules. |
| 8 | `👗 角色` | Open avatar/character choice, appearance, clothing/equipment and downloaded model-resource controls. |

### 7.1 Dock invariants

- `☰` opens upward from the bottom-right and can be collapsed.
- All eight responsibilities are governed slots.
- A slot may be disabled with a reason if its implementation is unavailable; the slot must not be silently deleted.
- Home is a separate top-bar responsibility and is not substituted for the dock.
- AI should be reachable contextually from any major panel; the dock AI entry is the global fallback.
- Google real-world map and 5D game map are different organs and must remain distinguishable.

The 2026-09-03 audit found that recent `game-5d.html` rewrites had reduced the dock and lost at least `5D圖`, `原點` and `角色`. That loss is classified as a regression against this specification and should be restored in a later implementation patch, not normalized as the new design.

---

## 8. Real map, origin and 5D map

### 8.1 Google/GPS layer

Real-world map/GPS is used for:

- locating the player with consent,
- selecting/reference of birth place,
- selecting/reference of home/start place,
- real-world navigation,
- future address-based building/property workflows.

It is not the primary monster-combat renderer because real buildings/roads and game combat geometry are different systems.

### 8.2 Local origin

A chosen birth/home/start location may define local world origin:

`origin GPS -> game XYZ (0,0,0)`

Relative real movement may later be mapped into local X/Z displacement with explicit conversion rules. The origin is a reference anchor; changing it must be explicit and persisted.

### 8.3 5D own map

The game-owned minimap represents the 5D play world and may support:

- current player position,
- monsters/NPCs,
- buildings/ATM/service nodes,
- objectives,
- path targets,
- tap-to-autowalk.

Touching the manual joystick cancels autowalk and returns control to the player.

---

## 9. Character, 3D resources and player download

### 9.1 Character

The 5D avatar must be a real 3D scene object, not permanently reduced to an emoji. Prototype procedural Three.js geometry is acceptable for fallback, but the target resource system supports downloadable GLB/GLTF characters with animation.

Character requirements:

- player-visible third-person scale smaller than the primary world view,
- correct facing with XZ movement,
- equipment/weapon attachment points,
- male/female or broader avatar selection as resources become available,
- clothing/appearance control through the protected `角色` dock slot,
- fallback model when a downloaded model fails.

### 9.2 World resources

Login/entry should resolve a resource manifest before joining the 5D world. Resource classes may include:

- world core/terrain,
- player model,
- character animation,
- monsters,
- trees/grass/flowers/rocks,
- buildings/ATM/service objects,
- textures/materials,
- sound/music/voice resources,
- region-specific packs.

Large future assets should be hosted by object storage/CDN rather than embedded indefinitely in one HTML file.

### 9.3 Resource integrity

Resource manifest entries require versions and eventually hashes. Failed resources must expose fallback/error state; gameplay must not silently assume assets downloaded successfully.

---

## 10. AI concierge / customer service

The AI concierge is an interaction organ, not decoration.

Required duties include:

- welcome/onboarding,
- explain current screen/control when requested,
- explain `⚔` vs `下單開火`,
- warn that no order is sent until confirmation,
- explain XZ/Y/C and KX/KY/KZ separation,
- explain KGEN vs KAIOS economic domains,
- explain ATM/map/origin/character functions,
- provide text fallback,
- use speech output only after allowed/user-driven browser behavior,
- never fabricate backend, wallet, market or settlement status.

Voice/video/visual concierge capabilities must expose availability honestly. Unsupported camera/microphone/voice is not reported as active.

---

## 11. K-field trading product specification

### 11.1 Order dimensions

Every order preview must identify at minimum:

- K axis: KX / KY / KZ,
- market/symbol,
- quote source/status,
- side: long or short,
- lots,
- L leverage,
- reference/order price,
- point value,
- initial required margin,
- maintenance margin,
- available KGEN before order,
- projected KGEN after margin lock,
- PnL formula,
- simulation/backend/real-settlement mode.

### 11.2 Fire rail

`fire = 0` means no order direction/size selected.

- up: long 1..100 lots,
- down: short 1..100 lots,
- center dead zone: 0 lots,
- center-to-half: precision/common 0..10 lots,
- outer half: nonlinear acceleration 10..100 lots.

### 11.3 Leverage L

- L is trading leverage only.
- L must not alter XYZ speed.
- Current control range: 1x..1000x.
- Common/fine range is concentrated near 1..10x; larger leverage occupies outer rail travel.
- Product risk controls may later impose a per-market maximum lower than UI theoretical maximum.

### 11.4 Point value and PnL

Current 11520 simulation rule:

`POINT_VALUE = 1 KGEN per market price point per lot`

Long:

`PnL = (markPrice - entryPrice) × lots × POINT_VALUE`

Short:

`PnL = (entryPrice - markPrice) × lots × POINT_VALUE`

Equivalent signed form:

`PnL(KGEN) = (markPrice - entryPrice) × direction × lots × 1 KGEN/point`

where `direction = +1` for long and `-1` for short.

**L is not multiplied into PnL a second time.** Leverage changes the required collateral/margin and therefore effective return on margin.

### 11.5 Margin

Current simulation rule:

`initialMarginKgen = lots / L`

`maintenanceMarginKgen = initialMarginKgen × 0.75`

The 75% maintenance factor is a 11520 simulation policy, not a claim that every real futures exchange uses the same rate.

### 11.6 Market-specific contract rules required before production

A production-grade market table must eventually define per symbol:

- symbol and display name,
- quote/oracle source,
- trading hours / quote freshness rules,
- price precision,
- minimum tick,
- point value / contract multiplier,
- minimum/maximum lots,
- permitted leverage range,
- initial margin policy,
- maintenance margin policy,
- liquidation/force-close policy,
- price-band/circuit-breaker policy,
- fee/funding/settlement charges if applicable,
- mark-price source,
- settlement timing,
- outage/stale-quote behavior.

Until those per-market records exist, the current ten-market experience is a common-rule simulation and must be labeled accordingly.

---

## 12. Order lifecycle and confirmation contract

### 12.1 Adjust phase

Player opens `⚔` and adjusts Fire/L. This does not submit an order.

### 12.2 Preview phase

Player presses `下單開火`. The system builds a read-only order preview from the latest quote and current controls.

The confirmation window must provide at least:

- market,
- K axis,
- long/short,
- lots,
- L,
- reference price,
- point value,
- required initial margin,
- maintenance margin,
- available KGEN,
- PnL rule,
- backend/simulation mode,
- explicit warning that confirmation sends the order.

### 12.3 Confirm/cancel phase

Two clearly separated actions:

- `取消`: closes preview; no position or KGEN change.
- `確認下單`: revalidates quote/state/margin and only then submits/fills according to current backend mode.

The preview must not be treated as a fill.

### 12.4 Fill phase

A successful fill creates a position record with immutable order facts necessary for later PnL/close calculation. Failure keeps the prior position/balance unchanged and displays a reason.

### 12.5 Close phase

`平` closes the governed selected position using a current/valid mark price and releases margin plus/minus realized PnL according to policy. A stale/unavailable price must fail closed rather than invent a result.

### 12.6 Liquidation / margin call

The current prototype has margin fields but does not yet establish a production liquidation engine. Before real-money operation, the backend must define and test:

- account equity,
- unrealized PnL,
- maintenance test,
- liquidation threshold,
- partial vs full close,
- bankruptcy floor,
- fee priority,
- stale-price handling,
- cross/isolated margin behavior.

Until implemented, the UI must not claim production-grade liquidation protection.

---

## 13. XYZ combat and life gameplay

Monster combat is separate from K-field trading.

Minimum gameplay model:

- monsters exist in 5D XYZ world,
- player has HP,
- attacks target game entities, not markets,
- battle rewards/costs use KAIOS domain,
- monster state belongs to world/backend persistence when production backend exists,
- no random local UI reward may be reported as globally settled KAIOS unless the settlement authority exists.

Future world progression may include jobs, buildings, factories, shops, food, pets and services, but each must preserve evidence/state separation from financial K-field positions.

---

## 14. Backend specification

### 14.1 Current prototype API

`backend/server.mjs` currently defines an off-chain simulation service with:

- `GET /health`
- `GET /api/v1/resources`
- `POST /api/v1/login`
- `GET /api/v1/player`
- `PUT /api/v1/player`
- `POST /api/v1/order`

Current order backend validates K axis, side, lots, leverage and price, calculates initial/maintenance margin, and returns simulation order metadata.

### 14.2 Production backend requirements

Before production/multi-player use, backend must add or harden:

- durable identity/session/authentication,
- server-side quote authority and freshness checks,
- idempotent order IDs/client request IDs,
- replay protection,
- atomic margin/position state transitions,
- position close endpoint,
- mark-to-market engine,
- liquidation/risk engine,
- transaction/event ledger,
- audit logs,
- anti-tamper validation (never trust browser balance/price),
- world/player/monster persistence,
- resource manifest/version service,
- rate limiting and abuse controls,
- explicit production vs simulation environment separation.

### 14.3 Client authority boundary

Browser localStorage/IndexedDB and client JavaScript are never authoritative for real account balances, settlement or fill prices. They may cache presentation/draft state only.

---

## 15. Wallet, deposit, withdrawal and settlement safety

The UI may connect wallets and show verified public balances where adapters exist. It must preserve the distinction among:

- wallet connection,
- quote/reference data,
- simulated game balances,
- backend account state,
- real chain transaction,
- receipt-confirmed settlement.

Real deposit/withdraw/exchange functions must require explicit user action and a verified transaction/receipt path. Secret keys, seed phrases and private signing credentials must never be stored in the public repository, browser bundle or public workflow.

---

## 16. Fail-closed rules

The following conditions must fail closed rather than fabricate success:

- stale/missing market quote,
- backend unavailable when backend is required,
- insufficient KGEN margin,
- invalid K axis/side/lots/leverage,
- duplicate/conflicting active position where policy disallows it,
- resource manifest download failure without a safe fallback,
- location permission denied,
- unsupported voice/camera/microphone,
- wallet/chain mismatch,
- unverified settlement authority,
- missing mark price at close/liquidation.

“Unavailable” is a valid state. It is preferable to hiding the organ or fabricating completion.

---

## 17. Protected-regression matrix

Any 11520 UI/runtime rewrite must verify at least these invariants:

| Invariant | Expected |
|---|---|
| Product identity | Remains `KGEN_11520_UNIVERSAL_EXCHANGE`. |
| Canonical entry | `index.html` remains the public portal unless formally superseded. |
| Main controller | `app.mjs` remains cumulative; 5D page cannot erase existing civilization/life/company organs. |
| Right dock | Eight governed responsibilities remain present or explicitly unavailable. |
| XZ joystick | Controls spatial XZ only. |
| Y rail | Controls spatial Y, self-centering. |
| C | Spatial warp, 0C means stop. |
| L | Trading leverage only. |
| Sword | Opens/closes trade controls only. |
| Order Fire | Opens confirmation first. |
| Cancel | Does not alter balance/position. |
| Confirm | Revalidates then submits. |
| K field | KX/KY/KZ accounting uses KGEN. |
| Life world | XYZ combat/life uses KAIOS. |
| Google map | Real-world reference/navigation, not the 5D combat renderer. |
| 5D map | Game-owned navigation/autowalk layer. |
| Character | 3D object/fallback, governed role slot retained. |
| Backend truth | Pages/local state never masquerades as production backend settlement. |
| Secret safety | No private key/seed/token committed. |

---

## 18. Acceptance tests required for the current 5D branch

Minimum manual/automated acceptance suite:

1. Open 11520 canonical portal and enter 5D page.
2. Verify 3D scene renders with visible character and depth cues.
3. Left joystick changes X/Z and character facing but not Y/K direction.
4. Y rail changes Y and returns to zero velocity on release.
5. C bottom = 0C and movement stops.
6. C halfway reads approximately 10C; top reaches 1000C.
7. Sword toggles trade controls without submitting an order.
8. Fire center = 0; half ≈ 10 lots; extremes = ±100 lots.
9. L is independent of C and reaches defined range.
10. `下單開火` opens confirmation, not fill.
11. Cancel leaves KGEN/positions unchanged.
12. Confirmation window shows all mandatory order fields.
13. Confirm rejects stale/missing quote and insufficient margin.
14. Successful simulation fill records correct axis/market/side/lots/L/entry/margins.
15. PnL calculation does not multiply by L twice.
16. `平` realizes PnL using current valid mark price.
17. XYZ `打怪` changes only life-world/KAIOS simulation state, not KGEN position.
18. Bottom-right dock exposes all eight governed functions or explicit unavailable states.
19. Google map and 5D map remain separate.
20. AI explains controls and order safety accurately.
21. Reload preserves only intended local state and does not claim remote persistence.
22. Backend-offline mode clearly identifies simulation/local state.
23. No secret credentials appear in HTML, JS, manifest or logs.

---

## 19. Current known gaps / P0-P2

### P0 — governance and financial correctness

- Reconcile product version drift (`VERSION 3.9.0`, MANIFEST/CHANGELOG 4.0.0, public index V4.1).
- Restore protected right-bottom dock slots lost in recent 5D rewrites.
- Add server-authoritative order/close/risk path before any real-money claim.
- Define per-market contract specs instead of assuming one universal tick/point model.
- Define liquidation and stale-price policy.
- Ensure all behavior-changing formal organs carry required KGEN metadata headers and changelog provenance.

### P1 — game/product completeness

- Production-quality GLB character(s), animation and customization.
- 3D monsters, combat interactions and world persistence.
- 5D map POIs/pathfinding.
- Origin/address/building workflow.
- ATM conversion/deposit/withdraw UX with truthful authority states.
- Cloud Run / Firestore / Cloud Storage production deployment plan and environment config.

### P2 — polish and expansion

- terrain streaming/regions,
- audio/music/video concierge,
- richer NPC/story system,
- building/factory/shop systems,
- accessibility and performance modes,
- telemetry/analytics that do not fabricate global counts.

---

## 20. Change-control rule for future engineers/AI workers

Before deleting, moving, renaming or repurposing a 11520 feature:

1. Search `SPECIFICATION.md`, `README.md`, `HANDOFF_CURRENT.md`, `MANIFEST.json`, `RUNTIME_GENOME.json` and Git history.
2. Determine whether the element is a governed organ/responsibility.
3. If it is governed, do not silently remove it. Propose/update the specification and record why.
4. Preserve fallback/unavailable state if implementation is temporarily absent.
5. Update tests and provenance.
6. Only after the formal change is traceable should code/UI be changed.

This applies especially to the bottom-right dock, Life identity, XYZ/K-field definitions, KGEN/KAIOS separation, wallet/security gates, and order confirmation/margin logic.

---

## 21. Document revision history

| Revision | Date | Change |
|---|---|---|
| 2026-09-03.1 | 2026-09-03 | Initial CURRENT specification. Consolidated existing 11520 governance and current 5D work; recovered the historical eight-slot bottom-right dock; formalized XYZ/K-field/economic/control/order/backend boundaries; recorded version drift instead of silently choosing a product release number. |

---

## 22. Immediate implementation order after this specification

1. Restore the eight-slot bottom-right dock in `game-5d.html` without deleting current order-confirmation work.
2. Add formal metadata header to `game-5d.html`, nonlinear controls, resource manifest and backend files where missing.
3. Reconcile `VERSION` / `MANIFEST.json` / `CHANGELOG.md` / `index.html` product version in one explicit release decision.
4. Add a machine-readable per-market product-spec registry and tests.
5. Add close-position and risk/liquidation backend endpoints in simulation first.
6. Run acceptance matrix above before presenting the next test URL.
