# 11520 Universal Exchange V3.9

## Cargo visual resource lifetime candidate — 2026-10-07

Existing `runtime/life-visual-runtime.mjs` records the geometry/material resources
owned by each procedural cargo visual at factory creation. A canonical identity
or custody-context rebuild disposes those resources once before replacing the
subtree. Shared cargo materials are deduplicated by identity; life-body/status
resources and borrowed resources attached later are outside that ownership set.
Unchanged cargo, quantity-only updates and temporarily hidden cargo retain the
existing cached visual. Item identity, physical-cash custody and domain state
remain governed by the existing world-item and logistics owners.

`tests/11520-living-world-visual.test.mjs` exercises the real production factories
and sync owner using THREE-compatible disposal spies, including 64 rebuilds and
32 unchanged updates. Both cleanup regressions failed against base `f7f6795`
with zero disposal calls. Focused item/life tests pass after the repair.
`FUNCTIONAL_QA: FOCUSED_PASS`; `VISUAL_QA: NOT_RUN` at this checkpoint.
These spies prove disposal ownership/calls, not GPU memory or FPS improvement.
No main merge, deployment, or human-playtest readiness is asserted.

The existing `tests/11520-browser-item-visual.mjs` now records the exact checkout
and served module hashes, renders 17 alternating cargo custody rebuilds in an
isolated THREE gallery, and captures both transit and the final ATM cassette.
The gallery-only cameras fit object bounds; production world/camera/player code
is unchanged. Its report distinguishes existing actual-world screenshots from
synthetic-gallery evidence and checks dispose events, stable per-context renderer
geometry counts, unchanged item/domain state and untouched body resources.
This follow-up harness is awaiting fresh Chromium CI and screenshot inspection.
Renderer counts do not establish GPU-memory/FPS acceptance, and camera-created
material clones remain outside the factory-owned cleanup boundary.

Follow-up capture diagnosis retains the original immediate ground-drop PNG and
records console/network/page errors, context events, actual world-canvas sizes
and framebuffer samples before capture. The additional ready-frame wait is
bounded to three seconds and fails after preserving the failure PNG/JSON if no
world renders. It requires varied, visibly nonblack RGB samples from the actual
WebGL framebuffer, not opaque alpha, HUD presence or a synthetic gallery. The
observed empty image has no world variation; the normal scene clear color alone
also cannot satisfy the gate. Existing production context/scene state is read
only, without context creation, restoration, camera changes or hidden overlays.
The black live-world image was observed at both initial `d024920e` (Game run
`37572849203`, checkout `c986c416`) and test-only `ba7cd3d` (Game run
`37574729237`, checkout `efe983f9`). Those captures alone do not distinguish a
renderer defect from capture timing/setup. Full product visual acceptance remains
**NOT_PASS**; cropped backpack previews and utility-tray overlap are not repaired
or concealed by the isolated gallery.
## Q15 3D frame-budget source audit — 2026-10-07

TASK_ID: Q15-3D-FRAME-BUDGET
STATUS: SOURCE_AUDIT / IMPLEMENTATION_PROPOSED / NOT_MEASURED
SOURCE_HEAD: `f7f67950418ebbb6f7a5a309a32d529232fcb3b6`
UPDATED_BY: dot / scoped external engineering documentation
SCOPE: existing 11520 world renderer; documentation only, no release approval.

### Preserved / partial / missing / tested

- **Preserved owner:** [game-5d.html:26,117](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/game-5d.html#L26)
  imports Three 0.180.0 and the bootstrap;
  [game-5d-bootstrap.mjs:44](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/runtime/game-5d-bootstrap.mjs#L44)
  loads the existing [game-5d-main.mjs:590–797](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/runtime/game-5d-main.mjs#L590),
  which owns the Three scene, camera, WebGL renderer and RAF loop.
  `world-runtime.mjs` is its simulation dependency, not a second renderer.
- **Preserved safeguards:** fixed DPR cap 2 and antialiasing at main:590;
  12-second avatar fallback with late-success fallback disposal at main:593;
  per-entity visual records/pending guards at main:605–606; species silhouettes
  and identity metadata in
  [life-visual-runtime.mjs:174–207](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/runtime/life-visual-runtime.mjs#L174).
- **Partial efficiency:** main:591 allocates separate geometry/materials for
  each procedural tree; main:608–615 builds individual phase spheres/sprites.
  The main:787 loop performs simulation, visual synchronization, camera, FX,
  HUD/maps and rendering each RAF. Its clamped 40ms animation delta is not a
  frame-time measurement. Source structure identifies candidates to measure,
  not a measured bottleneck. Existing obstruction fading at main:767–783 is
  not an occlusion-culling system and is outside this implementation proposal.
- **Missing in inspected owners:** no instancing, explicit distance LOD/culling
  policy, `renderer.info` sampling, frame-time percentiles or over-budget
  counters in the complete main, life-visual and combat-FX modules inspected.
  No assertion here that Three's built-in renderer culling is disabled.
  [mobile-ui-settings.mjs:26,64,81–82](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/runtime/mobile-ui-settings.mjs#L26)
  defines HUD disclosure profiles, not graphics-quality tiers.
- **Separate existing 2D owner:** do not copy or count
  [KGEN-KAIOS/world-viewer/lod/lod-controller.js:1–18](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/KGEN-KAIOS/world-viewer/lod/lod-controller.js#L1)
  as 11520 Three LOD. Its EARTH-to-ROOM levels are semantic navigation.
  [renderer/map-renderer.js:21,48–89](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/KGEN-KAIOS/world-viewer/renderer/map-renderer.js#L21)
  uses Canvas2D, bounds culling, item caps and its own render/estimated-FPS
  metrics. These do not establish this 3D scene's performance.
- **Test inventory, not a new PASS:** existing
  [11520-living-world-visual.test.mjs:6–52](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/tests/11520-living-world-visual.test.mjs#L6)
  checks lifestyle/cargo, archetypes and silhouette scale. Existing
  [11520-browser-responsive.mjs:543–557,595–623](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/tests/11520-browser-responsive.mjs#L543)
  times geometry/input acquisition, not sustained 3D throughput.
  This audit ran no browser, GPU benchmark or functional suite:
  FUNCTIONAL_QA=NOT_RUN; VISUAL_QA=NOT_RUN; mobile FPS=NOT_MEASURED.
  Absence findings are bounded to inspected owners, not repository-wide proof.

### Asset provenance caveats

Three and GLTFLoader imports are pinned to 0.180.0 (entry:26; main:16–17).
The Knight model URL at main:593 identifies KayKit-Game-Assets /
KayKit-Character-Pack-Adventures-1.0 but uses mutable `main`; an immutable
asset digest and license were not independently verified here. Scenery and
species bodies are procedural repository source. The older
[assets/resource-manifest.json:7–9](https://github.com/klineodyssey/kline-odyssey/blob/f7f67950418ebbb6f7a5a309a32d529232fcb3b6/K線西遊記/temples/11520/assets/resource-manifest.json#L7)
lists Three 0.166.1, so it is insufficient provenance for the actual entry's
0.180.0 renderer. No assets or dependency versions changed in this audit.

### Smallest proposed measurement slice — not implemented

Reuse `runtime/game-5d-main.mjs`; no new renderer, bootstrap or runtime file.
At its existing `frame(now)` (source main:787), place opt-in timestamp reads
at callback entry and immediately before/after the existing render call.
Record raw RAF delta independently of the existing clamped animation delta,
CPU callback/render-call duration, and post-render `renderer.info` calls,
triangles and memory geometry/texture counters. CPU render-call duration is
not GPU time. Keep game statement order, dt, movement, camera and state writes
unchanged. Expose only a copied, bounded diagnostics snapshot.

Default off; use a fixed-capacity sample buffer, explicit warmup and
visible-document sampling. Reset the interval baseline on visibility changes
rather than treating a hidden-tab pause as a slow gameplay frame. Summaries:
sample count/window, viewport/DPR, p50/p95/p99 raw frame interval and counts
over declared 16.67ms/33.33ms reference budgets. Budgets are reporting references,
not current acceptance claims. No network export, persistence, automatic
quality changes or financial/player data in the report.

After separate implementation approval, add a small opt-in scenario to the
existing `tests/11520-browser-responsive.mjs`, retaining current assertions
and default test budgets. Verify disabled mode, bounded/reset sampling and
snapshot-copy behavior, then capture an exact-SHA mobile-viewport report and
inspect the rendered screenshot. Record browser/device/DPR, warmup, scene
and FX state; label emulation separately from physical-device evidence.
A source audit or synthetic timing fixture cannot certify mobile FPS.

**Overlap boundary:** main:787 shares a file with stopped Navigator movement
and camera work. Any later patch must be confined to observational frame hooks,
with an exact diff proving no edits to movement/camera functions, timing inputs
or their invocation order. The responsive runner is also a shared file, so its
candidate changes must be reconciled before a scoped test edit. The stopped
backpack-preview WebGL remediation, Player Life backup guard and Customer
journal are excluded; no hooks or changes there. This README-only proposal
does not authorize any runtime/test implementation or reopening stopped work.


## V2.9.4 M1 read-only wallet candidate

The existing wallet panel has an explicit 1C Testnet read-only view. It reads
chain97 identity, native tBNB and testKGEN; it cannot approve, deposit, trade,
claim or withdraw. The legacy deployment remains a separate EXIT-ONLY context
for existing principal, with no new risk or funding. Root addresses, saved
legacy preferences, transaction leases and receipt caches are preserved.

The view uses injected EIP-1193. Ordinary mobile browsers without a provider
remain disconnected; use MetaMask Mobile's Explore browser as described in the
[official guide](https://support.metamask.io/configure/wallet/how-to-use-the-metamask-mobile-browser/).
Synthetic browser providers and actual BSC97 reads do not establish physical
MetaMask/Android acceptance. Full M2–M5 financial activation remains on HOLD.
See `HANDOFF_CURRENT.md` for exact evidence, limitations and release gates.

## World-first / market-life candidate — 2026-10-04

Independent Human-requested candidate, **not a released or QA-passed build**.
Existing `runtime/mobile-ui-settings.mjs` owns MINIMAL (default), STANDARD and
FULL preferences. Markets disclose on demand and close after 15 idle seconds;
held pointers defer closing. Existing `mobile-control-layout.mjs` owns compact
missile/delivery, market row and camera/follow controls. No second HUD manager.

`runtime/plane-map-runtime.mjs` defaults to local XYZ navigation again. The
explicit K button still opens the canonical signed market address map. Camera
pan/pinch in `runtime/game-5d-main.mjs` changes camera offsets only, not Player
XYZ, market coordinates, navigation ownership or order authority. Reset returns
to the player. Camera/follow selections are intentionally session-only.

Existing `runtime/market-life-runtime.mjs` growth/memory and travel behavior
power local training observations in `runtime/world-runtime.mjs`. Fresh public
quotes select a simulated momentum/countertrend market direction; a prospective
60-second observation produces correct/wrong/flat outcomes. Stale/gapped data
and reload discard unfinished predictions. Completed growth is saved through the
existing player-scoped storage, never accepted as financial or identity proof.
No second performance balance or reward ledger is created. Full GA600 remains
**NOT_INTEGRATED**; displayed confidence/fitness is the observed game hit-rate,
not a validated predictive probability, backtest, or investment performance.
Following is observation and a direction cue: it does not move the player,
open positions, sign, pay, or change leverage. Source-managed Life is untouched.

Focused six-profile Chromium QA:
`K11520_WORLD_FIRST_QA=1 node K線西遊記/temples/11520/tests/11520-browser-responsive.mjs`.
Use `K11520_BASE_URL` for the local HTTP server. Screenshots and functional
evidence are generated under `artifacts/11520-responsive-qa/`; visual review
remains required. The existing full-information regression suite separately
selects the FULL preference. Canonical Physics/UniverseMap and other worlds
are not modified. See `HANDOFF_CURRENT.md` for lineage and current gates.

## K11520 V2.8 Player Life

Guest-first local game candidate implementation; no cloud provisioning, Mainnet
transaction, NFT or payout authority. Canonical specification and cloud comparison:
`docs/K11520_PLAYER_LIFE.md`.

| Path | Purpose |
|---|---|
| `K線西遊記/temples/11520/runtime/player-life-runtime.mjs` | Provider-neutral schema, random Player ID, local store, validated progression/home and wallet proofs. |
| `K線西遊記/temples/11520/runtime/player-life-ui.mjs` | Contextual profile, starter home, privacy, local switching and backup UI. |
| `K線西遊記/temples/11520/tests/11520-player-life.test.mjs` | Storage, isolation, ownership, replay, privacy and wallet-proof security regressions. |
| `K線西遊記/temples/11520/tests/11520-browser-player-life.mjs` | Real Chromium mobile, recovery, account-switch and backup evidence. |

Existing `evm-wallet-runtime.mjs` and `backpack-runtime.mjs` / `backpack-ui.mjs`
retain simulation-wallet and captured-item authority with Player ID namespaces.
Cloud identity and authoritative economics remain NOT_CONFIGURED.


## V1 journey / free-reference product — 2026-09-30

Human V1 decision supersedes the paid-Oracle/100C launch target, not historical
contract evidence. The sole C-mode resolver is in
`controls/nonlinear-controls.mjs`: magnitude below0.001 is MONSTER_MODE,
0.001–1 is FREE_TRADING_MODE, above1 is LOCKED_HIGH_SPEED_MODE.
The sign still supplies LONG/SHORT; canonical detents and positive1–100 lots
remain unchanged. Zero is the initial journey mode; ordinary XYZ movement never
depends on trading eligibility.

The public page remains **SIMULATION**, not real-money trading. Its existing
execution adapter uses the V1 ceiling and zero fee. The unsigned Mainnet intent
also rejects above1C, even if other gates are satisfied. The100C engine and
explicit BSC97 rehearsal remain historical simulation/test infrastructure, not
permission for production liquidation.

Free Binance aggregate-trade references carry provider event time and sequence.
The game polls every5s with the existing15s stale limit, no credential, paid
subscription, synthetic fresh timestamp or stale fallback. Invalid/stale data
cannot fill/liquidate; existing positions remain. World exploration/combat
continues offline with a clearly waiting simulation reference frame.
USDT public reference quotes are **not** the USD production settlement index;
there is no implicit USD/USDT parity or on-chain Oracle activation.

The existing practice guardian now supports a repeatable0C journey encounter:
approach, attack surviving parts, defeat, earn local-only fragments/+5 local
KAIOS, then a new encounter after6s. Manual practice reset suppresses rewards.
No registered Life is killed for funds, and no chain asset is minted.

The existing simulation ledger is saved per lowercase connected address (guest
separate), restored only after read-only wallet identity confirmation, and kept
separate from on-chain balances/claimable. Same-account stale-tab writes fail
closed; this is not cross-device authenticated multiplayer. Local receipts and
progress can be edited/cleared by the device owner and are never financial proof.
The stats organ shows local sessions, play time, kills, drops and trading events;
they are **not** verified human-player, retention or real-volume analytics.
The backpack shows local journey fragments alongside its existing inventory.

Chainlink450USD purchase HOLD; paid Data Streams not required for this candidate.
Mainnet broadcast, real KGEN movement and production Oracle activation remain
unauthorized. Real-volume release still requires a reviewed free on-chain
settlement source/configuration, exact deployment approval and real receipts.

## Capital and complete-wallet candidate — 2026-09-29

Human COMPLETE_PRODUCT_HANDOFF V1 + CONTINUE_TO_COMPLETE governs this cumulative
update. Existing Brain/Position/Trigger, wallet adapter and simulation ledger
remain the only organs. Candidate C-order math is `ΔIndex * signed C * lots`,
not percentage return. Details: `KGEN_TRADING_SPEC.md`, `GAME_UI_SPEC.md` and
repository path `docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json`.

Actual-received Settlement Capital and Insurance are separate from player
principal. New positions atomically reserve maximum favorable PnL within fixed
oracle bounds; opposing trades do not offset admission liabilities. Settled
unfunded profit remains Claimable and can be repaid after funding. Available
principal withdrawal remains independent of unfunded claim debt.

Wallet UI auto-reads allowance; maximum approval is explicit and still requires
wallet confirmation. No approval occurs on Connect. Deposit once, trade multiple
times, and withdraw only Available. Candidate claims and index-delta liquidation
ABI require manifest capability `ISOLATED_V1`; the already deployed historical
BSC97 rehearsal is still `NOTIONAL_RETURN_V1`, not this candidate deployment.

Mainnet broadcast remains disabled pending a populated, explicitly approved
execution manifest. Local Ganache receipts/screenshots are not public Testnet or
Mainnet receipts. Earlier sections below are retained as historical lineage.

## C detents and physical distance — V2.6.23 / 2026-09-25

Human-approved K11520 simulation calibration: **1 local spatial unit = 1 meter**.
This is not a new universe Canon. Existing `runtime/spatial-coordinate-runtime.mjs`
is the sole conversion authority: CURRENT Physics §161 Moon anchor gives
`kmPerK=384400/16888`. Local positions/radii remain the same gameplay size;
UI converts them to sufficient-precision K with optional meter details.

Market price → `100*(P/P0-1)` → named KX/KY/KZ normalized market coordinates
remains independent. Market ΔK is explicitly normalized, not physical K.
No market-to-physical calibration has been approved: `marketToPhysicalK` rejects
an absent explicitly dimensioned transform, and composition accepts only a
`PHYSICAL_K` origin plus converted local XYZ. The practice guardian stays at its
existing rendered 7-meter location; its separate market KZ+1 does not supply a
physical meter. Local range tests cannot be altered by a market tick.
This supersedes earlier K+local arbitrary-unit wording below without removing
the historical record. Market maps/markers and current public quotes remain.

Canonical C: 0, signed 0.001/0.01/0.1/1, and signed 5..100 in steps of 5.
Existing `controls/nonlinear-controls.mjs` owns detents, nearest snap, formatting
and nonlinear travel. Controls snap; executable intent/ledger boundaries reject
non-detents. RiskKernel enforces the same exact fixed-point set. No chain is
deployed or activated. Lots remain 1..100 positive integers. Wallet balance is
read-only; orders/positions/receipts remain simulation. Cache v277 network-first.

## Wallet → order → settlement — V2.6.22 / 2026-09-25

The existing EIP-1193 wallet organ is now a single shared read-only session:
explicit Connect Wallet, full public address, network/chain, exact decimal KGEN
balance, bounded errors, account/chain/disconnect synchronization, no page reload.
Retained public identity is explicitly unverified until a fresh connection.
No seed/private key, chain switch, signing or broadcast is requested.

The existing `runtime/real-trading-order-intent.mjs` now supplies one common
intent and execution adapter for the existing `runtime/kgen-margin-runtime.mjs`
ledger. SIMULATION preview → pending → touch/cross → fill → mark/PnL →
close/liquidation → receipts shares that ledger, not the read-only chain balance.
Future EVM adapter is a disabled, fail-closed seam: deployment flags cannot
activate a transaction, fake success, or fall back to debiting simulation.

Wallet panel, readable orders/positions/receipt history and the preview retain
portrait/landscape controls. Simulation is session-only, reset on reload;
wallet identity changes do not reload or reset it. Shell cache v274 is network-first.
The existing browser settlement test covers both orientations with clearly
identified synthetic wallet/quote fixtures, including rejection, account/chain
changes, disconnection, one-shot fill, isolated liquidation and profitable close.
Those fixtures are not evidence of a Human wallet balance or a chain transaction.

## Settlement simulation / candidate contracts — V2.6.21 / 2026-09-25

Existing Game ledger now presents PENDING → TOUCH/CROSS → FILLED → position →
close/SL/TP/liquidation → receipt. C sign alone supplies direction, abs(C)≤100,
lots1..100 are principal. Available/locked/equity/unrealized/realized are explicitly
**SIMULATION WALLET**, session-only; readonly chain balance remains separate.
Public quote ticks never authorize real-funds settlement. Original HUD positions,
K-space semantics, movement, portrait and landscape are preserved. Shellv273 is
still same-origin/temple-scoped network-first, orientation any.

`KGEN/contracts/KGEN_OrderTriggerEngine.sol` connects to existing Position/Brain;
see `docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json` for unapproved Testnet/Mainnet
inputs. No deployed address or signer is invented. Browser test entry:
`K線西遊記/temples/11520/tests/11520-browser-settlement.mjs` (both orientations).


## Public market K-space — V2.6.20 / 2026-09-21

The shared validated BTCUSDT/ETHUSDT/BNBUSDT public quote batch now drives both market cards and simulation K coordinates. `Ki=100*(Pi/P0i-1)` retains the existing anchors (100000/4000/600); these anchors define units, not substitute prices. The production encounter waits for a complete valid batch. Missing/invalid updates retain last-good values visibly marked STALE; no initial `(1,-0.5,1)` is presented as current market data.

The existing K minimap shows three colored market intercepts, Player P, Monster M and their relative vector. Tap to inspect prices, K values, three market distances, player/monster/ΔK tuples, phase and separate LOCAL XYZ. Expand the near-distance projection when a one-Ku vector is small at the market-wide scale. Each scalar price is plotted on its own axis, not as three invented independent coordinates. Plane changes update the oblique projection and normal axis.

Quote updates translate the shared market frame without changing local XYZ, relative K, rendered encounter location, HP, cooldown or attack range. Market cards remain informational; plane plus sign(C) retain authority. Existing decimal-order floor calculations are unchanged; their small card badge yields its space to normalized K to avoid landscape overflow. Shell cache v272 remains network-first, temple-scoped; orientation is any. This is public reference data for simulation, never a real-funds oracle.

## K-space coordinate map — V2.6.19 / 2026-09-21

The existing minimap defaults to **K圖**: blue P = Player K, gold M = Monster K, arrow = relative K vector. The current plane supplies the two graph axes; the right depth rail supplies the third K axis. Coincident projected points share a circle/diamond, with depth shown separately. Active phase and ΔK distance use normalized simulation Ku, not raw prices or local attack range.

Tap K圖 or the K canvas to expand player/monster KX/KY/KZ values, ΔK, distance and phase in the existing sheet. **XYZ** restores the local waypoint map. LOCAL XYZ and K-space remain separate: movement does not silently change K; market-card clicks do not change plane authority. No giant permanent HUD was added.

## K-space practice combat — V2.6.18 / 2026-09-21

Walk toward the visible **K-Guardian · 模擬** with the XYZ joystick. Tap the plane control to choose XZ→KY, XY→KZ or YZ→KX; set C positive/negative to choose that body's phase. Zero C is neutral; lots remain positive position size, never direction. Market cards remain info-only.

The reference transform in existing `runtime/world-runtime.mjs` is `Ki=100*(Pi/P0i-1)` with traceable inverse and explicit simulation anchors. V2.6.18's default fixture K was approximately `(1,-0.5,1)`; V2.6.20 supersedes that production source with validated public quotes as described above. The practice guardian retains K offset `(0,0,1)` and local XYZ `(0,0,6)`. World position is K+local; gameplay distance includes all three dimensions. These are game units, not physical meters, canonical prices or a real-funds oracle. Display text is never parsed as coordinate authority.

Slash attacks one selected body within 2.2 units; Golden Rain attacks the two tangent-plane axes of the same phase within 6; Phantom Axe sweeps the three same-phase bodies within 4 and in front of the avatar. Six independent HP pools, exposed/guarded/resistant multipliers and cooldowns determine actual results. The target card shows HP/range and opens source/coordinate details plus an explicit practice reset. Damage feedback explains neutral, range, resistance and weak points. No reward, token, custody or source-managed Life settlement is created.

Actual movement/phase/skill regression and screenshots extend `tests/11520-browser-responsive.mjs`; existing runtime tests cover normalization, inverse, range/height, cooldown, dead parts and source-slot isolation. Review the exact SHA's CI artifacts before declaring Visual QA. Existing PWA/BGM and all protected-action gates remain unchanged; cache v270 is still network-first and orientation is `any`.

## Landscape game finalization — 2026-09-20

The existing `game-5d.html` landscape mode keeps movement/plane and Y/C/lots controls on the left, the world in the center and differently sized combat actions on the right. Order remains separate. Portrait anchors and wallet/trading authority are unchanged. Landscape precision inputs and open panels stay inside the viewport.

`tests/11520-browser-responsive.mjs` exercises four portrait/landscape rotation cycles, real pointer hits, plane-selected trading, info-only market cards, signed C, positive lots, physical joystick/Y movement, direct order preview and three interaction-driven combat screenshots. Golden rain uses an elapsed-time falling pattern and target sigil; phantom axe has an actual curved translucent blade and shaft.

PWA orientation remains `any`. The existing `sw.js` shell cache is network-first, scoped to this temple, caches successful responses only, and never substitutes HTML for missing offline JS. PWA/standalone support does not remove browser chrome from an ordinary tab. All game orders in this work are simulation-only; protected real-money authority is unchanged.

## Digital Ant next-stage status

- V3.9 activates `KGEN_FIELD_SERVICE_BUSINESS` after the WUKONG_GATEKEEPER primary-job gate. Its CFO scans verified K280/Universe Map nodes for cash logistics, KUFO supply, waste collection and general delivery demand.
- The scan currently sees four canonical nodes but no ATM cash/KUFO inventory evidence, waste inventory or cargo request. Therefore real/candidate Field Jobs, route, costs, quote, delivery evidence, Revenue and First KAIOS all remain zero or evidence-required.
- KAIOS ledger assets and physical `KAIOS_CASH_CARGO` are permanently distinct. A wallet transfer is not a cash delivery. Container mass, waste mass and reactable matter mass are likewise separate.
- Field quotes use energy, labor, depreciation, maintenance, BNB, security, insurance/risk, loading, unloading and other verified costs. Non-positive profit triggers reprice/optimize/consolidate/negotiate/decline; movement or XP never creates Revenue.
- Routes must reuse the existing K280 Land and Universe Map evidence. Delivery requires origin, pickup, cargo, route, arrival, receiver and customer acceptance evidence. No Body, vehicle, worker, distance or job is invented.

- V3.8 binds `DIGITAL_ANT_0001` to the single authoritative `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` Thought Organ. CURRENT and the installed V3.8 document are byte-identical; their platform-stable canonical UTF-8/LF SHA-256 is `dbb4774a71db614994dff3e08e9cec34b94633c4d46dca13bff2f6f54d9b0b48`. Only binding metadata is stored in the Life manifest.
- Life/App/Listing certification now verifies Life ID, immutable Birth, Wallet binding, Work evidence, Mission/Dream, the CURRENT Thought Organ, App manifest, permissions and secret safety. The result is `CERTIFIED_LOCAL`, not settlement or physical-world authority.
- The Mother Engine must validate CURRENT before every next-best-action decision. Its truthful First KAIOS strategy is to publish the read-only KGEN Chain Monitor service package and scan verified Requests; current Customers, Revenue and KAIOS remain zero.
- The private Heart scheduler is installed in the user-controlled Windows session and remains separate from the public signer-free Worker. It uses the existing local credential, address/chain/code/selector/gas/reserve checks and receipt reconciliation; it never serializes or logs the credential and never blind-resubmits. The first scheduled V3.8 Heartbeat was reconciled after an RPC 403 without a duplicate broadcast, moving KGEN from 3 to 4; the task then correctly returned cooldown `NO_ACTION`.
- No Body, UFO, Flight, Alchemy, KUFO, KSHIP, Customer or Revenue is invented. Without a verified Body the Ant remains alive and network-capable but cannot claim physical movement.

- V3.7 keeps the successful first Heartbeat/KGEN evidence and adds production public action candidates plus UTC ignition-window probes. Persistent automatic writes remain blocked until a private scheduler with secret management, address binding and receipt reconciliation exists.
- One controlled V3.7 private execution completed a second Heartbeat, the first Fortune at the deployed minimum/fair amount of 1 KGEN, and the first Wish. All three have successful receipts and expected Heart events; the resulting public balance is 3 KGEN. This does not claim that a persistent private scheduler is installed.
- The full first Wish is public and its future chain payload is a hash only. Wish consumes BNB gas, not KGEN. Vow is locked until mission completion, and the existing Heart Lamp remains KGEN-based.
- 18911 furnace runtime is mainnet read-verified, while 511111 Wormhole and KSHIP Converter are not registered. With Ant KAIOS at zero, Incense is blocked and no Alchemy/KUFO/KSHIP evidence is claimed.
- One K18888 Heaven Day equals one K280 year. KUFO half-life is one K280 year; the old three-Heaven-days rule is rejected. KUFO is fuel, UFO is a separate demand-first vehicle, and KSHIP is not a chip.
- `DIGITAL_ANT_APP_0001` is V1.4.0. Life ID, Birth Certificate, public Wallet and Company identity are unchanged.
- V3.6 records the first real `heartbeatClaim()` and the first KGEN as two receipt-gated Life Events from one BSC transaction. Heartbeat reward is 1 KGEN and the deployed cooldown is 3,600 seconds; Fortune remains a separate action and no Fortune event is claimed.
- `DIGITAL_ANT_APP_0001` is V1.3.0. Its browser/public Worker permissions remain read-only. The credential-capable local Secure Signer is not stored in the Repo or Pages and was enabled only for the explicitly approved Heartbeat path; every other Heart write remains disabled.
- The Mother Engine records evidence/root-cause/options/authority proposals, including safe reconciliation of the already-broadcast transaction after the initial receipt RPC failed, with no duplicate submission.
- KGEN operational energy, KAIOS purchase, Body/KUFO/KSHIP energy, Transport Contract and demand-first Supply Chain schemas are active architecture only. `ANT_MECH_BODY` is an internal Founder need, not a Customer or Revenue event.
- The Land audit reuses the existing K280 Land anchor, 12345 parcel/grid demonstration and Universe Map XYZ/boundary model. No protected Land, 12345, TempleHeart, KGEN Contract, KAIOS or Universe Map source was changed.
- V3.5 makes `WUKONG_GATEKEEPER` the enforced primary job. Every hourly cycle completes Life/Dark-Matter checks and the 12345 Gatekeeper duty before CFO and Company work; an attempted Company bypass fails with `PRIMARY_JOB_BYPASS`.
- `DIGITAL_ANT_APP_0001` is V1.2.0. Life ID, immutable Birth Certificate, public Wallet binding, 11520 Listing and Company Genesis remain the same evidence-backed records.
- The Core Heart Indexer now covers Fortune, Heartbeat, Ignition, Lamp, Wish and Vow events. Optional transfer/approval/funding-graph analysis remains `ADVANCED_GRAPH_INDEXER_REQUIRED` and no longer degrades a successful basic patrol.
- First Heart, Fortune, Ignition, Lamp, Wish, Vow, Thanksgiving, KGEN and KAIOS events require successful receipts and immutable block/transaction/timestamp evidence. Unobserved events display `NOT YET`.
- The public Worker remains signer-free. `DIGITAL_ANT_SECURE_SIGNER_WORKER` is a private-runtime specification in `NOT_CONNECTED`; every Heart action is disabled until a separate policy, fresh chain revalidation and survival-reserve check are approved.
- V3.4 makes 11520 a production public web application with Traditional Chinese and English primary UI, Japanese/Korean fallback, a user-gesture Voice Concierge and always-available Text input.
- `DIGITAL_ANT_APP_0001` is now V1.1.0. `DIGITAL_ANT_0001`, its Birth Certificate and personal Wallet remain unchanged; App upgrade is an organ upgrade, not rebirth.
- The hourly GitHub Actions scheduler runs one stateless public read-only cycle. It writes `runtime/worker-status.json` and one immutable hourly event under `runtime/work-events/` through an exact Git allowlist. The UI derives HEALTHY/DEGRADED/MISSED_CYCLE/FAILED/OFFLINE from this evidence instead of hard-coding ON_DUTY.
- 12345 patrol uses the existing verified read adapter and labels Heartbeat, Fortune, Ignition, Lamp, Wish and Thanksgiving/Vow as client-derived eligibility with `WRITE_NOT_CONNECTED`. No GitHub workflow receives the Digital Ant private key.
- Shared real requests use authenticated GitHub Issues. Browser IndexedDB remains local draft/cache only; a local Draft or confirmation is never promoted to global Customer, Quote, Order, Settlement or Revenue.

- V3.3 adds `PUBLIC_CIVILIZATION_REQUEST_GATEWAY` as the public 11520 `TELL THE ANT WHAT YOU WANT` entry. Text and pasted Voice transcripts create `DRAFT_INTENT` first; Image, File, Map and direct microphone capture are explicitly `NOT_AVAILABLE`.
- The Concierge returns understood goal, project class, expected output, missing information, constraints, safety, executability and next step before confirmation. Anonymous or unconfirmed entries cannot become Requests.
- A confirmed local Request requires non-Founder identity, external source, explicit confirmation and a one-way contact-evidence hash. Raw contact evidence is never written to IndexedDB/History or displayed on the public Board. Request receipt still creates no Customer, Quote, Order, payment or Revenue.
- KGEN Monitor, Digital Cow, Media, Construction and Social Assistance routes produce plans only. Cow Life, Building, media delivery, recipients, wallets and claims remain uncreated; estimates are `SIMULATION / ESTIMATE_ONLY`, never Quotes.
- Canonical counts remain zero. Quote generation is `SIMULATION_ONLY` until Cost/Margin/Risk policies are approved, and `PAYMENT_INFRASTRUCTURE_PENDING` remains enforced while Company Treasury is unbound.
- V3.3 records a read-only Worktree Classification snapshot: 4,527 untracked entries classified as 197 Project Source, 3,882 User Data and 448 Generated Artifacts, with no Cache/Temp/Build/Unknown match. Nothing was deleted, staged or committed; the Gitignore proposal remains review-only and unapplied.

- V3.2 adds `CUSTOMER_ACQUISITION_ENGINE` to the existing Company Domain. One evidence-classified Demand Scan covers 17 civilization nodes and records two observed internal/system gaps, zero supported inferences and two research hypotheses without creating a Lead or Customer.
- Hypothesis, Lead, Customer, Proposal, Quote, Settlement and Revenue are separate records. Canonical Lead, Contactable Lead, Customer, Request, Customer Proposal, Quote, Order and Settlement counts remain zero.
- `KGEN_CHAIN_MONITOR` remains the reproducible First Customer Priority. Its BASIC/PRO/CIVILIZATION pricing policy records every required cost component as `MEASUREMENT_REQUIRED`; recommended ranges remain `ESTIMATE_PENDING / NOT_APPROVED`.
- The 11520 Customer Request Board accepts a local `DRAFT_INTENT` from Text or a Voice transcript. It appends the draft locally but cannot promote it to a formal Request until requester identity, contact evidence and confirmation are independently verified.
- Customer Qualification, success criteria and Treasury Binding Readiness are active schemas. Company Wallet and signer remain null, payment stays disabled, and no First Customer Event exists.
- V3.1 cumulatively adds `AI_CIVILIZATION_OS`, operated by `DIGITAL_ANT_0001` for `AI_ANT_COMPANY_0001`. It normalizes Voice/Text/Image/File/Map and Life/Building/Media/Finance/Service/Transport/Manufacturing requests into evidence-labelled Intents, then compiles them through desired world state, gaps, dependencies, resources, work, cost, quote, contract, execution, verification and delivery.
- The OS distinguishes `EXECUTABLE_NOW`, `PLANNABLE_NOT_EXECUTABLE_YET` and `REJECTED_WITH_REASON`. It enforces risk floors, dependency ordering, resource conservation, transport capacity, staffing evidence, safety review, Definition of Done evidence and Customer acceptance. UI animation is never accepted as World State.
- Digital Cow, three-minute Media, residential Construction and 100-person Public Assistance records are `EXAMPLE_SCENARIO` only. Real Intents, Projects, Lives, Buildings, Media Deliveries, Aid Recipients, Employees, Trucks, Steel, Settlements and Revenue remain zero.
- External AI onboarding never grants a Life ID automatically. Voice storage needs consent; high/critical real-money, medical, physical-safety, construction, land and legal actions retain human/governance gates. Chain write, transfer, approval, deployment and settlement authority remain disabled.
- V3.1 makes `KGEN_CHAIN_MONITOR` the first Company product definition. It is `READ_ONLY`, requires no private key, has no custody/trading/governance/chain-write authority, and exposes BASIC/PRO/CIVILIZATION service levels whose prices remain `POLICY_REQUIRED`.
- The First Real Customer pipeline now distinguishes Hypothesis, Lead, Customer, source-backed Request, qualified Quote, Order, Delivery, Invoice, Settlement and Revenue. Canonical real counts are all zero; an internal Proposal or 33333 legacy draft cannot enter the real pipeline.
- A formal Quote requires a `QUALIFIED_REQUEST` plus separately approved Cost, Margin and Risk Reserve policies. Quote, accepted Quote, Order and Invoice never become Revenue; only verifiable Settlement evidence may recognize cash and Revenue.
- Customer, Request, Quote, Order, Delivery, Invoice and Revenue panels are active with truthful empty/locked states. Company Treasury binding requirements are ready, but no Wallet, signer or receivable address is bound and the Founder Wallet stays separate.

- V3.0 adds the read-only `CIVILIZATION_DEMAND_ENGINE`, a deterministic Product Priority policy and one append-only/idempotent local Demand Cycle. It detects three evidence-backed research Needs and creates three internal Proposals without creating a Customer, Order, Quote, Contract or Revenue.
- `AI_ANT_AUTO_LP` and `AI_ANT_TREASURY_OS` are product candidates only. Auto LP has no chain/liquidity authority and forbids wash trade, self-match, fake volume and same-controller activity. Treasury OS can read and propose but cannot spend, invest or transfer.
- `AI_ANT_COMPANY_TREASURY` is `PLAN_READY_NOT_BOUND`, has no Wallet and all BNB/KGEN/KAIOS/KUFO/KSHIP balances remain zero. KAIOS Quote support is `RECEIVABLE_ONLY_DRY_RUN`; KUFO/KSHIP remain reference-only while undeployed.
- The 500 Celestial Seat path follows the GitHub CURRENT public-function-seat rules: no paid/guaranteed Seat, no Codex-only grant, no application submitted and no compensation. Candidate functions remain research only and require public evidence plus external governance.
- Investor Relations is local preparation only with zero Investors, acceptance or Settlement. 33333 is corrected to `KAIOS_CIVILIZATION_DEPLOYMENT_COORDINATE / LEGACY_DRAFT_EXAMPLE / NOT_CUSTOMER / NOT_BUDGET_COMMITMENT`.

- OWNER approval formed `AI_ANT_COMPANY_0001` through one append-only, idempotent `COMPANY_GENESIS_EVENT`. Company status is `FORMING / LOCAL_11520`; this is not a mainnet Company or settlement authorization.
- The Charter is `APPROVED`. `DIGITAL_ANT_0001` holds non-payroll CEO and Acting CFO roles while its immutable Birth, personal Wallet and `0.006 BNB` remain personal Life property.
- Company accounting opens with zero cash, revenue, expenses, profit, deposits, receivables, payables and salary liability. Customer deposits remain liabilities.
- Company W4, Project Budget and Salary Escrow Wallets are `REQUIRED_NOT_BOUND`; Emergency Reserve is `REQUIRED_NOT_FUNDED`; Project Escrow is `NOT_DEPLOYED`.
- Customer Inbox and all Company queues are active but empty. Strategic goal is `GET_FIRST_REAL_CUSTOMER`; ordered mission execution currently waits at the required `BIND_COMPANY_TREASURY` prerequisite.
- Founder mission `FOUND_AI_ANT_COMPANY` is completed only from Company Genesis evidence; `BUILD_AI_ANT_COMPANY` is now active. Queen and Larva remain uncreated.

- V2.8 adds the `AI_ANT_COMPANY_0001` Founder Profile, cumulative Charter and ten evidence-labelled Business Lines without creating a new Company Runtime or Life.
- Historical V2.8 founding readiness was `READY_FOR_APPROVAL`; V2.9 OWNER approval superseded that projection and the Company is now `FORMING`.
- Customer Request, Requirement Analysis, deterministic cost-basis Quote, customer-acceptance-gated Contract and empty WorkOrder engines are locally implemented. They contain zero customers, contracts, deposits, revenue, payroll and settlement.
- Company accounting starts at zero and separates Founder personal Wallet, Company W4, Project Budget, Salary Escrow and Emergency Reserve. Customer deposits are liabilities, never immediate revenue or profit.
- V3.0 reclassifies the old 33333 figure as a legacy draft civilization-coordinate example, not a Customer or committed budget; deposit, cash and revenue remain zero. Land/GPS/Map remains consent-gated architecture only.

- Life Security separates `LIFE_ID`, public Wallet binding and local-only Wallet credential. Wallet failure or zero BNB never creates Life death.
- `DIGITAL_ANT_0001` current security projection is `HEALTHY / LEGACY_EOA`; recovery is limited to Life-preserving Wallet rotation. Assets in an irrecoverable old EOA are explicitly `STRANDED_IF_KEY_IRRECOVERABLE`.
- `ANT_QUEEN_MOTHER_ENGINE` is `ARCHITECTURE_ONLY_NOT_BORN`. It may monitor, audit and propose recovery, but cannot own ants, keys, salary or private assets.
- Colony Emergency Dark Matter Reserve is `NOT_FUNDED / PROPOSAL_ONLY`; Savings Vault and Smart Life Wallet are `NOT_DEPLOYED`.
- V2.6 separates `ANT_QUEEN_LIFE` pre-genesis data from `ANT_QUEEN_MOTHER_ENGINE`. V2.7 assigns the reserved Genesis Profile ID `DIGITAL_ANT_QUEEN_0001`, but the Queen remains outside the formal Life Registry: Wallet and first-BNB Birth Evidence are absent, so Birth Status is `NOT_BORN` and Genesis Readiness is `NOT_READY`.
- `KGEN_LIFE_SMART_WALLET` now has a formal owner/guardian/recovery/spending/auditor specification, but no contract or threshold is deployed. `DIGITAL_ANT_0001` migration is `NOT_APPROVED`.
- `ANT_COLONY_LIFE_REGISTRY` derives one truthful born adult worker. Security monitoring is `PARTIAL_SECURITY_MONITORING` until Transfer, Approval, transaction-graph and funding-source indexers exist.
- V2.7 adds the read-only `ANT_QUEEN_APP`, deterministic Digital Life Health Records, GREEN→BLACK medical triage, Emergency First policy, opt-in Insurance, consent-based Recovery Repayment and separated medical asset classes. Prices remain `UNPRICED_POLICY_REQUIRED`; cases, receivables and deployed medical wallets remain zero/absent.

- `11520_LISTING_DIGITAL_ANT_0001`: `LISTED` in the local Registry; `UNPRICED`; settlement `NOT_DEPLOYED`; identity right is not offered.
- Four Digital Ant service profiles are registered with zero customers and no fabricated revenue.
- `DIGITAL_ANT_APP_0001`: `V1.0.0 / RELEASED_LOCAL`; its SHA-256 manifest is verified at boot and its release event is appended to App and Life History without changing Life ID or Birth Certificate.
- `DIGITAL_ANT_WORKER`: one-shot hourly Runtime implemented in `READ_ONLY_DRY_RUN`; the production GitHub Actions adapter runs at minute 17 and persists shared evidence through an exact Git allowlist.
- Work Queue schema is ready and empty. No automatic dispatch or chain write is enabled.
- `AI_ANT_COMPANY_0001`: `FORMING / LOCAL_11520`; Demand and product research are local only; Real KGEN and Real KAIOS company payment remain unauthorized.

This directory is the active static-first exchange frontend. It is not a settlement contract and it does not simulate market activity.

- Entry: `index.html`
- UI controller: `app.mjs`
- Styles: `styles.css`
- Domain source: `/core`
- Local persistence: IndexedDB append-only events plus current projections
- Canonical migration: verified currency metadata upgrades stale local projections through `CANONICAL_SEED_UPGRADED` events; local history is retained
- Chain read: Temple Heart 12345, verified at runtime
- KGEN AMM chain write: `USER_WALLET_LIVE`, after runtime verification and explicit wallet confirmation
- 11520 settlement contract: BSC mainnet proxy live; frontend settlement adapter not yet integrated
- KAIOS: `MAINNET_LIVE`; KGEN→KAIOS follows the White Hole mechanism and is not exposed as a DEX swap
- Life Factory: local append-only `GENESIS_DRAFT` only; genesis, wallet binding and organ assignment require separate verified evidence
- Digital Ant birth: `BORN / ALIVE / ON_DUTY`; the immutable first-BNB evidence is block `116031445`, verified through archive state transition, full block transaction, receipt and independent BSC RPC reads
- Digital Ant work: Post-Birth Work Runtime V1.0 runs the `WUKONG_GATEKEEPER_HOURLY_JOB` as `READ_ONLY_DRY_RUN`. The canonical first work cycle is replayed once into append-only Life History with `NO_ACTION`, zero actual gas and no transaction hash.
- Heart eligibility: `CLIENT_DERIVED` only, from getters and functions present in `KGEN_TempleHeart_V3_2_6.sol`. The adapter never invents `canClaim`, `canLight` or `canIgnite` calls.
- CFO of Self: chain-evidenced balances, zero-unless-settled income/expense rules, a live-gas-derived survival-reserve proposal, and a non-executable first-KGEN quote plan.
- Listing: the Life Profile is `LISTED` in the local Registry through an append-only event; it is unpriced, does not offer identity, and has no settlement adapter.
- Scheduler entry: `core/jobs/public-read-only-worker.mjs`. It consumes only the public canonical wallet and `BSC_RPC_URL`, emits deterministic hourly Work Event IDs, and never reads a private key.
- Life Security and Colony Medical Economy source: `core/security/life-security.mjs`. Recovery and Wallet-binding events reuse the append-only Life stream and never rewrite Birth Certificate evidence. Medical proposals cannot transfer value, and a compromised Wallet must recover or rotate before Dark Matter support.

The Digital Ant private key is never available to this frontend. The checksum-normalized public wallet and public Birth Certificate may be displayed after verified binding. The KGEN trade panel uses only the visitor's EIP-1193 wallet and never accesses Digital Ant environment variables. Local Digital Ant signer processes must still pass `core/security/verify-wallet-binding.mjs` before any chain-capable action.

Birth resolution is a local trusted-runtime operation:

```text
node core/security/resolve-digital-ant-birth.mjs
```

A complete trusted address indexer or archive-state proof is required for historical resolution. Candidate blocks and transactions are cross-checked through independent BSC RPC reads; missing capability returns `BIRTH_EVIDENCE_PENDING` rather than guessing.

The first public work snapshot was observed on BSC block `116039099`. It records BNB `0.006`, KGEN `0`, KAIOS `0`, a valid Heart code/config read and an owner-unapproved KGEN acquisition scenario. The scenario is block-stamped evidence only: `broadcast_capability=ABSENT`, `live_trading=false`, `chain_write=false`. V3.5 separates the operational Core Heart Event Indexer from optional advanced transaction-graph analysis; no risk label is escalated without evidence.


## NVIDIA GPU paper-market candidate

The K12345 → K11520 NVIDIA GPU route, landed-cost model, acquisition evidence model, and isolated GPU/KGEN and GPU/KAIOS order books are bounded paper-simulation candidates.

- `0.00011520` and K11520 remain candidate coordinates with no repository-bound Human authority.
- No real GPU inventory, supplier purchase, cargo delivery, warehouse receipt, company budget, signer, settlement, or production actor registry is asserted.
- Whole-chip lot size is `1`; fractional chips fail closed.
- Matches remain `MATCHED_UNSETTLED`; CT stays undefined until a repository-owned settlement attestation exists. No such production registry is connected.
- The implementation has no wallet, RPC, signer, storage, DOM, transfer, or chain-write authority.
- Real-trade readiness always fails closed while independent GPU readiness verifiers are not wired.

Lineage: historical PR #178; current-main successor preserves the fail-closed actor and settlement boundary introduced by PR #328.
