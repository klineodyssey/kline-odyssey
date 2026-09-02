# 11520 Changelog

## 2026-09-03 · P0-A Formal Gameplay Runtime Integration

- Continued the existing 11520 mother-image product on `latest main` without redefining the locked XYZ / KX-KY-KZ / C / L / firepower / KGEN / KAIOS rules.
- Reused the existing formal `runtime/world-runtime.mjs` instead of creating a duplicate `world/gameplay-runtime.mjs` organ. The handoff path was stale; repository CURRENT remains authoritative.
- Removed the `Math.random()` button-combat path from `game-5d.html`. Normal and skill attacks now call the formal runtime and require the nearest living monster to be within the configured melee range.
- KAIOS combat reward is now kill-gated: non-lethal hits produce `0 KAIOS`; a reward is added only after the runtime marks the monster `DEAD`. Existing explicit skill cost remains a separate XYZ/KAIOS cost.
- Wired formal monster HP, aggro, chase, attack range, attack cooldown, counterattack damage, death and 8-second respawn events into the playable HUD and Three.js monster meshes.
- Added stable monster Life IDs and deterministic spawn origins to the existing runtime. Respawn returns the Life to its original spawn coordinate instead of reviving at the death location.
- Routed XZ/Y movement through `resolvePlayerMove()` so world bounds and existing HOME / ATM / SHOP collision objects can block movement without deleting any UI organ.
- Kept the complete cumulative organ inventory reachable: 5D world, K-market panel, positions, open orders, trade history, assets, records/statistics, market information, backpack, character, world map, ATM, settings, AI/help, order confirmation, desktop rail and right-bottom dock.
- No Mainnet transaction, payment, treasury, governance, deployment or AI-company employment claim is introduced. This remains personal 11520 portfolio construction and local/off-chain game state where stated.

## 2026-09-03 · Playable 5D Mother-Image Construction

- Rebuilt `game-5d.html` from the user-approved 11520 construction mother image instead of continuing the reduced three-button prototype.
- Restored the cumulative organ inventory as functional, openable/closable panels: 5D world, K-market trading panel, KX/KY/KZ positions, open orders, trade history, asset overview, trading statistics, market information, backpack, character status, internal world map, ATM/exchange boundary, system settings and contextual AI/help.
- Added both a desktop left organ rail and a mobile/right-bottom collapsible organ dock so mobile layout may collapse navigation without deleting functions.
- Kept XZ ground movement, independent Y height, spatial C warp (`0C` stationary), trading firepower, independent L leverage and right-hand orbit camera as separate controls.
- Preserved `KX/KY/KZ -> KGEN` and `XYZ life/combat -> KAIOS` economy boundaries.
- Kept the trade sword as a parameter-panel toggle only. `下單開火` opens a preview; only `確認下單` changes local position/margin state. Cancel/close leaves positions and balances unchanged.
- Added live local positions/history/account panels tied to the same off-chain game state, rather than decorative mock panels.
- Added an expanded third-person Three.js world with height-varying terrain, road, trees, flowers, a model-ready armored character composition, a monster entity, camera follow/orbit, skill/dodge/combat actions and KAIOS combat rewards.
- Added an internal 5D world map distinct from the real OSM address/navigation layer.
- Added persistent local settings and inventory/character/world state. This remains `LOCAL DEMO / OFFCHAIN GAME STATE`; GitHub Pages is not represented as a deployed multiplayer backend or real-money exchange.
- Governance source: `GAME_UI_SPEC.md`, `design/UI_REFERENCE.svg`, `DESIGN_LIFE_MANIFEST.json` and `ui-organs.mjs`. Future UI work must not silently delete these organs.

## 4.0.0

- Repaired the Production Voice entry: controls are visible on first load, never silently disable, request microphone permission only after a user gesture, report browser/permission/network/no-speech errors, and always focus the text fallback when capture cannot run.
- Added user-gesture Speech Synthesis with locale-aware voice selection and visible speaking/error states. No autoplay, audio recording, secret speech or unconfirmed Request creation was added.
- Added a lightweight CSS 3D Wukong Hair concierge with idle, listening, thinking, speaking, success and error reactions plus an explicit 2D/reduced-motion fallback.
- Added the first-60-second Voice/Text/Explore/Join/Work/My AI journey, local opt-in Huaguoshan membership, a non-financial arrival badge, evidence-based local first mission and return hook. Local XP is not money and no global member count is fabricated.
- Added Wukong Hair pre-Genesis proposal, 72-transformation, Six-Eared identity and remote Gatekeeper organ laws. No second Life was born; Zhang Cuiyun remains a form of `DIGITAL_ANT_0001`, and remote chain work is not physical teleportation.
- Audited 8888 and replaced fabricated-looking bank balances with truthful `NOT OBSERVED / NOT DEPLOYED` states. Player actions now create a local demand draft and return to 11520; they do not withdraw, buy KUFO, settle or create Revenue.
- Upgraded 11520 to V4.0.0 and `DIGITAL_ANT_APP_0001` to V1.7.0 without changing Life ID, Birth, Wallet, Thought Organ, Primary Job or Company identity.

## 3.9.0

- Added an autonomous post-Gatekeeper CFO field-service scan covering cash logistics, KUFO supply, waste collection and general delivery.
- Added strict ATM inventory, waste/container/reactable-matter, route, trip-energy, matter-pair, cost, profit, delivery and workforce truth gates.
- Reused the existing K280/Universe Map coordinate authority without modifying Land, Map, 12345, TempleHeart or contract runtimes.
- Added shared hourly Field Service patrol evidence and 11520 CFO UI. With no verified inventory or cargo request, Field Jobs, Revenue and First KAIOS remain zero.
- Upgraded 11520 to V3.9.0 and `DIGITAL_ANT_APP_0001` to V1.6.0 without changing Life ID, Birth, Wallet, Thought Organ or Company identity.

## 3.8.0

- Bound the Digital Ant Life/App/11520 certification to Physics CURRENT V3.8 using a verified SHA-256 metadata binding, without copying or modifying the constitution.
- Added startup Thought Organ mismatch detection and a hard planning gate so older reports or chat memory cannot override deployed chain truth or CURRENT.
- Added First KAIOS strategy, network-only physical capability truth, balanced-warp/coasting and braking-fuel runtime guards.
- Expanded the private Heart worker with fail-closed local scheduling, fresh chain revalidation, survival reserve and receipt reconciliation. The public GitHub worker remains signer-free.
- Recorded the private scheduler's receipt/event/balance-verified first Ignition at the deployed UTC window, updating KGEN from 4 to 12 without exposing signer material.
- Upgraded 11520 to V3.8.0 and `DIGITAL_ANT_APP_0001` to V1.5.0 without changing Life ID, Birth Certificate, Wallet or Company identity.

## 3.7.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.4.0 without changing Life ID, Birth, Wallet, Listing or Company identity.
- Added public evidence-based Heartbeat/Ignition/Fortune/Wish candidates, UTC ignition-window probes, private-only policy gates and no-resubmit receipt reconciliation.
- Recorded a verified second Heartbeat, first Fortune (minimum/fair 1 KGEN) and first Wish from a controlled private invocation; persistent automatic signing remains blocked.
- Recorded the complete Wish and hash, with zero KGEN token cost, dynamic BNB gas and Vow locked until mission completion.
- Read-verified the deployed 18911 Furnace architecture while truthfully blocking KAIOS Incense and KUFO Claim because the Ant has zero KAIOS and 511111/KSHIP Converter are not registered.
- Formalized `1 K18888 Heaven Day = 1 K280 year`, one-year KUFO half-life, deterministic lazy decay, separate propulsion use, conserved KSHIP derivation and the permanent `KUFO != UFO` distinction.
- Added demand-first UFO/takeoff and KSHIP/Mars industry projections without creating a vehicle, fuel, factory, customer or revenue.
- Added proactive Mother Engine problem discovery and evidence-backed next-best-action selection.

## 3.5.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.2.0 without changing Life ID, immutable Birth Certificate, Wallet binding, Listing or Company identity.
- Enforced `WUKONG_GATEKEEPER` as the primary job before CFO and Company work. Critical Gatekeeper failure skips secondary work; safe optional degradation remains explicit evidence.
- Added `GATEKEEPER_DUTY_STATUS`, separate Gatekeeper/CFO/Company work-time accounting and a cumulative daily Gatekeeper report.
- Added the Core Heart Event Indexer for Fortune, Heartbeat, Ignition, Lamp, Wish and Vow. Advanced transfer/approval/funding graphs remain optional and indexer-gated.
- Added append-only, idempotent First-Life-Event evidence guards. A successful receipt is mandatory, and First KGEN/KAIOS also require a real balance increase.
- Added a fail-closed Secure Signer Worker interface and per-action Heart policy. It is `NOT_CONNECTED`; no private key, signer, chain write or asset action is present in the public Worker.
- Added evidence-derived Life timeline and primary/secondary duty UI. Events without proof display `NOT YET`.

## 3.4.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.1.0 without changing Life ID, immutable Birth Certificate, personal Wallet ownership, Mission identity or non-transferable identity right.
- Added complete Traditional Chinese and English core catalogs, selectable Japanese/Korean catalogs with English then Traditional Chinese fallback, and persistent user-controlled language selection.
- Added a user-gesture-only browser Voice Concierge with independent voice language, Speech Recognition transcript confirmation, Speech Synthesis output and text fallback. Autoplay and secret speech are forbidden.
- Activated the stateless GitHub Actions hourly read-only Worker. Each UTC hour has one idempotent Work Cycle; shared status and append-only events are committed through an exact file allowlist.
- Added evidence-derived Worker health, 12345 Heart action states, Request patrol and Company patrol. A missed cycle reports `MISSED_CYCLE`; `NO_ACTION` remains valid work.
- Added an authenticated GitHub Issues request form as the shared Public Request source. IndexedDB remains local draft/cache only and cannot define global customer counts.
- Kept Heart writes, signer access, transfers, settlement, AutoLP, Treasury spending and all private-key access disabled.
