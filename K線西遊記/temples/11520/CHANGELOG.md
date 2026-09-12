# 11520 Changelog

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