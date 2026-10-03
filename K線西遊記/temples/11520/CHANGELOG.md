# 11520 Changelog

## 2026-10-04 — Player Courier insurance browser-test synchronization

- Reproduced the #480 main Game CI failure at `a42eb12c`: the 500 ms courier-panel refresh replaces an already-visible `APPROVED` claim between Playwright locator resolution and its separate geometry request. The current button remains 308×44 in portrait while the detached handle returns null.
- Read canonical claim state, current DOM visibility, scroll position, geometry and hit testing in one browser turn. Retained the 44 px minimum, full content width, viewport containment and pointer-reachability assertions; crossed an actual panel replacement and both orientations without a fixed sleep.
- Added exact premium debit, paid-claim reload/no duplicate credit, explicit `UNINSURED` zero payout, deterministic failed public raid, ordinary PvP ownership protection and canonical duplicate-loot rejection checks. Relative QA imports also support the public Pages base path.
- Test-only repair: no production CSS, courier runtime, economics, Wallet, TempleHeart or Mainnet changes. Browser fixtures and balances are explicitly local gameplay, not real token transfers or cross-device multiplayer evidence.
- Added a manual trigger to the existing read-only/local-EVM Trading Readiness workflow for exact-head release validation; unchanged jobs, safety assertions and permissions.

## 2026-10-03 — Player Courier public bandit and insurance completion

- Wired the existing Player Courier `BANDIT_MODE`, `CARGO_RAID_ACTION`, `raid()` and one-shot loot receipt into the public game shell without creating another logistics engine.
- Added a compact cash-target chip that appears only for a different eligible local Player Life; the expanded panel reports attack-window, distance, cooldown, insurance and exact rejection reasons.
- Kept ordinary PvE/PvP separate from robbery. Cargo ownership changes only through the explicit raid action, and a claimed loot crate cannot be claimed twice.
- Exposed both uninsured zero-payout and exact-premium `QUOTE_ONLY -> ACTIVE` insured robbery paths in real Chromium QA at 390×844 and 844×390.
- Made proximity fail closed when either Life position is unavailable, and enforced the 8 m local raid limit inside the canonical courier runtime rather than only in UI.
- Made loot delivery two-phase: the backpack must persist the exact reward receipt before the courier journal transfers the single cargo ownership state.
- Made insured robbery create an `APPROVED` entitlement first; only the original courier's replay-protected local-ledger credit can advance it to `PAID`, and the same receipt cannot add KAIOS twice.
- Added a durable pending-premium recovery record and mutually exclusive expanded courier/bandit panels so interrupted activation and compact HUD layout remain visible and recoverable.
- Labeled the feature `LOCAL GAMEPLAY`: no cross-device realtime multiplayer, TempleHeart change, token transfer, custody or Mainnet write is claimed.

## 2026-10-03 — Player Courier background delivery and explicit bandit raids

- Extended the existing Digital Ant logistics runtime with `PLAYER_COURIER`, preserving the autonomous ATM UFO path and creating no second delivery system.
- Attached one canonical cargo to the accepting Player Life while a timestamp-authoritative background timer runs; movement, combat, exploration, home actions and the normal HUD remain available.
- Added durable local mission journals, reload/background resume, clock-rollback review, stale-tab conflict detection and one-shot terminal receipts for delivery, robbery, salary and loot.
- Added explicit `BANDIT_MODE` plus `CARGO_RAID_ACTION`; ordinary combat can reduce cargo durability but cannot transfer ownership. A successful eligible raid moves the single cargo into one loot crate without minting or transferring tokens.
- Reused the existing Cargo Risk Desk for insured and uninsured robbery accounting. An underwriting-ready quote stays `QUOTE_ONLY` until exact local premium evidence activates it; coverage examples remain insurance math and are not the future Lamp 500/800 policy.
- Added compact collapsible portrait/landscape courier HUD and local player reward posting after a verified delivered receipt. Everything remains `LOCAL_GAME_ONLY`: no TempleHeart change, custody, physical delivery, KGEN/KAIOS transfer or Mainnet transaction.

## 2026-10-03 — Player-requested cash and goods delivery to the canonical home

- Added a first-viewport “鈔票／貨物外送到家” action. A delivery now begins with an actual player action and targets that Player Life’s existing home-plot XYZ instead of an invented destination.
- Reused the existing Digital Ant ATM UFO and authoritative `ASCEND -> CRUISE_5D -> DESCEND` route. No second exchange, delivery engine, coordinate system or Life was created.
- Added receiver identity, home proximity and runtime-generated receipt gates. Arrival alone remains unpaid; only the requesting player at the home can accept the cargo.
- Separated restricted cargo principal, freight revenue, worker salary, operating cost and company net. Digital Ant’s local-game salary is recognized only after acceptance; cargo principal never becomes revenue.
- Kept the entire first release in `LOCAL_SIMULATION_ONLY`: the player’s local KAIOS pays the freight fee, while no wallet transfer, Mainnet write or real salary claim is performed.

## 2026-10-03 — Visible KAIOS missile interception and ATM UFO crash loop

- Promoted the Digital Ant interception action from the bottom of a long ATM sheet to a persistent, pointer-reachable mobile HUD button.
- Added local-game KAIOS missile mass accounting at the CURRENT `1 KAIOS = 1 kg` scale, opposite signed-C targeting, relative-velocity kinetic energy, a separate atmospheric-drag work term and a public gameplay-energy normalization.
- Added ATM UFO operational energy, propulsion shutdown, Y-axis crash motion and ground-impact-gated loot. Energy reaching zero means loss of propulsion, never disappearance of mass.
- Added exact local KAIOS ammunition spending and bounded, replay-protected crash rewards: mission risk-pool KAIOS plus local-game KUFO, KSHIP and UFO technology fragments. Restricted cargo principal and chain balances remain unchanged.
- Kept KX/KY/KZ orders exclusively in the hedge domain; XYZ/C missile combat does not place or settle a market order and does not perform a Mainnet write.

## 2026-10-03 — Digital Ant XYZ cargo raid and Cargo Risk Desk

- Added a playable XYZ cargo interception gate for `DIGITAL_ANT_0001`: the player must be within range, provide recent opposing physical movement, spend local game energy, use a distinct Life ID and pass replay/cooldown checks.
- Added a bounded mission-declared local game risk pool. A successful robbery awards only from that pool; restricted KAIOS custody principal and chain balances are never mutated by browser combat.
- Added the AI Ant Company Cargo Risk Desk to the existing logistics runtime with integer KAIOS/basis-point quotes, deductible, independent reserve gate, covered causes and evidence-gated local-simulation claims.
- Kept KX/KY/KZ as independent hedging axes and XYZ as actual movement/combat. No market order, token transfer, Mainnet write, insurer company, exchange or settlement engine was created.
- Removed the `V1` suffix from the public Digital Ant logistics runtime identifier; version history remains in metadata/changelog rather than the formal program identity.

## 2026-10-03 — Digital Ant 5D ATM UFO cash delivery

- Connected `DIGITAL_ANT_0001` to the live 11520 Market Life source loop instead of updating only a text HUD.
- Added a visible procedural ATM UFO with cash vault and four drive units; this is a vehicle/equipment projection, not a second Life.
- Added authoritative `ASCEND -> CRUISE_5D -> DESCEND -> LANDED_AWAITING_RECEIPT` XYZ delivery phases.
- Calibrated movement speed from `abs(C) * 0.001 K/sec` and kept C sign as the movement long/short battle side.
- Kept KX/KY/KZ orders isolated as separately authorized cargo-cost hedges; physical motion cannot create a hedge order.
- Kept cargo principal non-lootable and receipt-gated; arrival alone is not chain delivery or revenue.

## 2026-10-03 · Digital Ant armored courier / Market Guardian policy

- Kept the existing Digital Ant Market Life source and 11520 world; no second exchange or settlement engine was created.
- Defined source-managed Digital Ant as an armored cash courier / Market Guardian: aligned positions escort, opposing positions wait for market settlement, and high route threat causes defend-and-reroute.
- Prohibited player-asset theft, cargo-principal loot, intentional feeder death and unfunded rewards. Ordinary combat still cannot settle or kill a source-managed Life.
- Separated physical XYZ routing from K-space orders. A logistics event now defaults to neutral K-space instead of fabricating a `KY+` position.
- Added fail-closed cargo hedge planning: matched KAIOS cargo/liability needs no hedge; verified variable-cost exposure needs a market, authority and separate operating risk reserve, with no cargo principal used as margin.

## 2026-09-29 · Settlement capital candidate and wallet account integration

- Human COMPLETE_PRODUCT_HANDOFF V1 and CONTINUE_TO_COMPLETE supersede percentage-return C-order math with `ΔIndex × signed C × lots`; fixed principal and canonical detents remain. Historical public Testnet bytecode keeps explicitly labeled legacy semantics.
- Brain appends isolated actual-received capital, aggregate position liability reservations and per-player claims; preserves existing 24-hour upgrade change. Custody and unfunded debt are distinct; claim repayment never consumes another player's principal.
- Position atomically reserves gross maximum favorable PnL within configured bounds, rejects insufficient capital, and freezes market/oracle reconfiguration while positions are open. Maintenance liquidation preview uses the same integer predicate as settlement.
- Existing wallet adapter reads allowance, supports explicit maximum approval/deposit/available-only withdrawal and capability-gated claims. No connect-triggered approval, Mainnet activation or second settlement engine.
- Added actual ancestor UUPS upgrade/storage validation, A/B/C isolation, signed detent/lot matrix, capital stress and local-EVM Chromium wallet QA. CI/visual/publication evidence, not this entry, establishes completion.

## 2026-09-21 · V2.6.20 public market K-space

- Replaced fixed production K reference values with atomic validated public BTC/ETH/BNB batches, using existing deterministic/invertible anchors. WAIT and STALE are explicit; no partial/fabricated current K.
- Added three color-coded market intercepts, prices/normalized values/distances, shared map/card/target updates and expandable near-range relative projection in the existing map footprint.
- Common-frame translation preserves local movement, monster relative position, HP/cooldown and combat radius. Plane/sign/lots authority, wallet, PWA and BGM unchanged; v272 cache remains scoped/network-first.
- Added batch update/failure/recovery tests and real-browser screenshots; bounded card-label repair prevents landscape overflow without relocating controls.

## 2026-09-21 · V2.6.19 K-space map visualization

- Extended the existing map with Player/Monster K markers, relative vector, three-axis projection/depth, signed active phase, Ku distance and expandable K/ΔK/local XYZ values.
- Preserved XYZ waypoint navigation behind an explicit XYZ tab; K taps only inspect. Removed display-quote-as-coordinate behavior from this map organ. #421 combat and normalization are unchanged.
- Added projection, target-change/no-target and real-browser plane/sign/map regression evidence; cache v271 remains scoped/network-first and orientation remains any.

## 2026-09-21 · V2.6.18 K-space practice combat

- Added traceable normalized reference K coordinates and local XYZ composition, six phase bodies, real radius/height/cooldown gates and distinct slash/plane/sweep tactics without live settlement or rewards.
- Added compact target feedback/details/reset and six in-world body markers. Plane and signed C remain the only phase authorities; market cards stay informational and lots stay positive.
- Fixed negative-C joystick reversal, mirrored body text, target occlusion and unbounded avatar-load waiting. Existing scenery is procedural; no new external asset or copyrighted music was introduced.
- Added actual approach/positive-negative hit/three-skill browser captures and source-slot isolation tests. Worker cache v270 is still scoped and network-first; PWA orientation remains any.

## 2026-09-20 · Landscape finalization

- Repaired only the existing landscape mode: bounded top/status/map layout, left movement/parameter rails, visible 44px precision inputs, distinct right combat targets, separate order and bounded utility panels.
- Preserved portrait controls, market-info-only cards, plane trading authority, signed C/positive lots and immediate combat/direct simulation order.
- Added elapsed-time golden rain with concentric target/runes and a curved translucent phantom axe with shaft/sweep; slash remains the smaller quick cyan effect.
- Added four real-browser rotation cycles, touch-target/overlap checks, interaction screenshots and worker cache failure tests. Cache v269 is temple-scoped and fails closed for missing offline modules.

## 2026-09-04 · KGEN / KAIOS Market Life AI Civilization Canon

- Added `MARKET_LIFE_AI_SPEC.md` as the authoritative product concept for living markets in 11520.
- Locked the civilization principle that monsters are Market Life themselves, not passive NPC targets waiting for HP depletion.
- Defined Market Life identity, profit motive, fear/survival pressure, capital/risk, vitality, memory and autonomous strategy.
- Small Market Life may operate a single market; increasingly intelligent/grown AI life may unlock more KX/KY/KZ market dimensions.
- High-tier life such as a Bull Demon King class may perceive multi-market player exposure, follow, oppose, hedge, reallocate, retreat or re-enter according to its own survival/profit decision.
- Explicitly prohibited fixed `player long => monster short` behavior and AI that intentionally dies merely to reward the player.
- Separated market action, KGEN capital/PnL, Life vitality and KAIOS world/reward results.
- Defined Naihe / Mengpo as a post-death life-cycle boundary; the historical 8-second respawn is test fallback only and is not the full life-cycle canon.
- Added future tamable/tradable Life concept for fish/cattle/duck-type AI while preserving independent Life IDs and forbidding unverified real-asset transfer.
- Locked static Pages / real-wallet / real-settlement safety boundaries and a modular runtime architecture for later implementation.

## 2026-09-03 · Canonical Trading / Vehicle / Regression Lock

- Added `KGEN_TRADING_SPEC.md` as the authoritative KGEN trading mathematics source: `1 KGEN = 1 lot`; order principal/margin equals absolute lots; `PnL = price difference × direction × lots × C`; C never reduces principal.
- Human-rejected models are now explicitly `REJECTED / SUPERSEDED`: `margin = lots / leverage`, `margin = lots / C`, and any model where increasing C automatically lowers required KGEN principal.
- Defined per-position loss boundary: the position's allocated KGEN principal is its risk pool; when exhausted, the position liquidates. No automatic recourse to unrelated Free wallet KGEN without a new canonical rule.
- Locked KGEN account separation: verified wallet balance, Free, Locked Principal/Margin, Reserved Orders, Unrealized PnL and Realized PnL are distinct states.
- Added `VEHICLE_C_SPEC.md`: ordinary characters/objects cannot arbitrarily exceed light speed; high-C capability requires a capable vehicle such as a transforming vehicle/UFO. Vehicle organs may include navigation, map, communications/audio, telemetry, memory, vision, warp and structural organs.
- Vehicle organ failure degrades only corresponding capability. Vehicle disassembly never deletes the player Life; the player falls back to ordinary walking/XYZ gameplay (走路取經).
- The proposed extra `100×` fuel/capability reserve remains `UNRESOLVED`; it is not a production formula until a later explicit Human Decision.
- Updated `GAME_UI_SPEC.md` to restore the historical MOBA control invariant: joystick inner zone controls XZ movement; outer ring circular drag controls avatar heading; right-hand camera orbit remains independent.
- Locked the historical KayKit Adventurers CC0 Knight GLB + `GLTFLoader` + `AnimationMixer` pipeline as a capability that must not be silently removed. Primitive/capsule character is fallback-only.
- KX/KY/KZ are locked as independent market axes with independent market/side/lots/C/order/position state.
- Updated `JIEYAO_HANDOFF_CURRENT.md` so future construction pages read GAME_UI_SPEC + KGEN_TRADING_SPEC + VEHICLE_C_SPEC before modifying runtime and do not require the human to repeat these definitions.
- Change-control law: `CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC`. A code/spec conflict is a regression unless a new explicit Human Decision changes the canon.

## 2026-09-03 · P0-A Formal Gameplay Runtime Integration

- Continued the existing 11520 mother-image product on `latest main` without redefining the locked XYZ / KX-KY-KZ / C / L / firepower / KGEN / KAIOS rules.
- Reused the existing formal `runtime/world-runtime.mjs` instead of creating a duplicate `world/gameplay-runtime.mjs` organ.
- Removed the `Math.random()` button-combat path from `game-5d.html`; attacks use the formal runtime and KAIOS reward is kill-gated.
- Wired monster HP, aggro, chase, attack range/cooldown, death and 8-second respawn into the playable world.
- Routed XZ/Y movement through `resolvePlayerMove()` so world bounds and collision objects can block movement.
- Kept the cumulative organ inventory reachable; no Mainnet/payment/treasury/governance/chain authority is introduced.

## 2026-09-03 · Playable 5D Mother-Image Construction

- Rebuilt `game-5d.html` from the approved 11520 construction mother image instead of continuing a reduced prototype.
- Restored cumulative organs: 5D world, K-market, positions, orders, history, assets, statistics, market information, backpack, character, world map, ATM, settings and contextual AI/help.
- Added desktop rail and mobile/right-bottom dock.
- Preserved XYZ/KAIOS and K-market/KGEN economy separation.
- Order-fire opens a preview; only explicit confirmation may submit; cancel leaves state unchanged.
- Added third-person Three.js world, runtime combat/collision integration and internal 5D map distinct from real address/navigation layers.
- GitHub Pages remains static frontend/local-offchain where stated; it is not represented as a deployed multiplayer backend or real-money settlement service.

## Historical 4.0.0 and earlier
Earlier entries remain available in Git history. Current behavior is governed by the CURRENT canonical files above; historical code or text that conflicts with them must not be resurrected as active rules.
