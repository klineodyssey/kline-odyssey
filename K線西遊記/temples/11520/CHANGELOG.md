# 11520 Changelog

## Metadata

| Field | Value |
|---|---|
| VERSION | CURRENT |
| REVISION | 2026-10-07.BNB-LIQUIDATION-STATUS-CONSISTENCY |
| PRODUCT_CONTEXT | V2.9.5 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-10-07 |
| UPDATED_BY | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 |
| REVIEWED_BY | dot / independent scoped technical source review / 2026-10-07; no registered Reviewer role or release approval |
| SOURCE_COMMIT | 35e2a331b05140a33e1b86e6918304e3e36ff039 |
| TASK_ID | K11520-BNB-LIQUIDATION-STATUS-20261007 |
| CHANGE_REASON | Record the reviewed liquidation-status source and its strict executable-byte provenance checkpoint. |
| ANCESTOR | K線西遊記/temples/11520/CHANGELOG.md @ 35e2a331b05140a33e1b86e6918304e3e36ff039 |
| SOURCE_OF_TRUTH | TRUE |

## 2026-10-07 — V2.9.5 liquidation-status provenance checkpoint

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-07 | V2.9.5 / 2026-10-07.BNB-LIQUIDATION-STATUS-CONSISTENCY | K11520-BNB-LIQUIDATION-STATUS-20261007 | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER | dot / independent scoped technical source review / 2026-10-07; no registered Reviewer role or release approval | `K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs`; `tests/11520-kgen-margin-wallet-foundation.test.mjs`; `K線西遊記/temples/11520/tests/11520-ui-static.test.mjs`; `K線西遊記/temples/11520/CHANGELOG.md` | Align the exported risk flag with the existing exact lifecycle liquidation boundary and accurately record the intentional source change. | No accounting, margin, capital, fees, price precision, oracle, units, speed caps, storage or receipt behavior changes. | Reverting only this provenance checkpoint returns to 35e2a331b05140a33e1b86e6918304e3e36ff039 and restores its recorded failing hash check. Reverting the complete liquidation-status increment to f7f67950418ebbb6f7a5a309a32d529232fcb3b6 restores the prior inconsistent boolean; no data reset or migration is required by this boolean-only change. |

- Source parent: `35e2a331b05140a33e1b86e6918304e3e36ff039`; clean pre-fix main: `f7f67950418ebbb6f7a5a309a32d529232fcb3b6`.
- Reproduction: BNB/KZ SHORT, -0.001C, entry 600.0004, 1 lot and
  mark 1600.0004 returned `risk.liquidated=false` although the existing
  lifecycle correctly emitted LIQUIDATED with realized PnL -1. The reviewed
  change uses the lifecycle's existing exact price comparison, without an
  epsilon or any change to numeric PnL, remaining principal or receipts.
- Independent scoped technical source review passed for runtime SHA-256
  `3bd55973da2dbb920934a06a8c2bf463427b371b00560e5954f29df254a24160`
  and foundation test SHA-256
  `a3f74b92ec9f967121c789fc1b07409fd0832cc2cd34f24c23a5522637dbb1fc`.
  That review grants no canonical Reviewer authority or release approval.
  This successor provenance checkpoint still requires its own review and CI.
- Fresh deterministic checks covered the exact boundary and adjacent IEEE-754
  prices across BTC/ETH/BNB LONG/SHORT; the existing foundation fixture suite
  passed. Differential checks preserved all numeric fields in 1,152 risk
  outputs and all ledger/receipt fields in 1,152 lifecycle snapshots. Counts
  describe overlapping check matrices, not unique product tests.
- Exact-source [Game Product run 37655022698](https://github.com/klineodyssey/kline-odyssey/actions/runs/37655022698)
  checked out `35e2a331b05140a33e1b86e6918304e3e36ff039`. Its
  [product-qa job 112907825715](https://github.com/klineodyssey/kline-odyssey/actions/runs/37655022698/job/112907825715)
  passed 39 Player Life tests, then failed one of 204 product-group checks:
  the strict executable-byte provenance check still expected the old body hash.
  The later missing Playwright/screenshots/uploads followed that early failure.
  This record preserves that failure and makes no successor CI or visual claim.
- Old executable-body SHA-256:
  `4add666842ff5b418ae9be0147cc86b240c4ba48159c08413b64598c4ad892ed`.
  Current reviewed executable-body SHA-256:
  `cbbb60fead493a081252f92b222caa6951b8d0cf7dd6e24669f839dd40bc0341`.
  Pre-fix main full runtime SHA-256:
  `03063c4c323826fb3a74275884aac060c9267e7dc7b9db9750298f3ef2787631`.
- This checkpoint changes the existing runtime metadata, its one strict
  provenance record and this cumulative changelog only. Other assets retain
  their existing expected hashes and metadata. No workflow change, rerun,
  held BSC/backpack/persistence hunk, general product version change, live
  transaction, canonical role change or release approval is included.

### Previous checkpoint metadata (historical, preserved verbatim)

| Field | Value |
|---|---|
| VERSION | CURRENT |
| REVISION | 2026-10-06.MARKET-CARD-NODE-RETENTION |
| PRODUCT_CONTEXT | V2.9.5 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-10-06 |
| UPDATED_BY | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 |
| REVIEWED_BY | dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval |
| SOURCE_COMMIT | cf2ffb47c3e71e444935ef6151adc7f9d6208ca4 |
| TASK_ID | K11520-SIMULATION-TRADING-P0-20261006 |
| CHANGE_REASON | Record retained market-card presentation and preserve the measured HUD-stability gate. |
| ANCESTOR | K線西遊記/temples/11520/CHANGELOG.md @ cf2ffb47c3e71e444935ef6151adc7f9d6208ca4 |
| SOURCE_OF_TRUTH | TRUE |

## 2026-10-06 — V2.9.5 retained market-card presentation revision

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | V2.9.5 / 2026-10-06.MARKET-CARD-NODE-RETENTION | K11520-SIMULATION-TRADING-P0-20261006 | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER | dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval | `K線西遊記/temples/11520/runtime/game-5d-main.mjs`; `K線西遊記/temples/11520/tests/11520-ui-static.test.mjs`; `K線西遊記/temples/11520/tests/11520-browser-responsive.mjs`; `K線西遊記/temples/11520/CHANGELOG.md` | Preserve the three canonical card nodes and existing normal-axis decorations across quote and simulation refreshes. | Same market selectors, leaf values, labels, aria state and click routing; financial/source algorithms and simulation storage are unchanged. | Revert this four-file increment to cf2ffb47c3e71e444935ef6151adc7f9d6208ca4 if required. It preserves the earlier toast-dismissal repair and simulation ledger support, but restores the measured missing-decoration interval. |

- Candidate `cf2ffb47c3e71e444935ef6151adc7f9d6208ca4` passed all six
  recorded toast-fade trajectories (zero visible rectangle drift, final opacity
  zero), but Responsive job `112381925094` failed landscape expanded cycle 1.
  Artifact `11428985611`, SHA-256
  `dd277860ec776e42fb055f13baca643eecc6f0a3421da343dafa5b2da7bae358`,
  records ten frames over 535.6 ms with card heights 81.890625 / 75.6875 and
  status top 144 / 138. Later settled screenshots do not erase that failure.
- Executing the actual render, simulation-tick and normal-presentation owners
  in a deterministic DOM fixture proved that an unchanged-data tick replaced
  all cards and detached their badges until the existing 120 ms decorator
  callback. Under the tested timer phase, the gap was 117 ms. No CSS or pixel
  heights were assigned in that model; exact browser attribution remains
  pending card/badge diagnostics on the next candidate.
- The existing renderAxes owner now creates missing canonical cards, then
  updates their leaves, active state, accessibility and handlers in place.
  It does not rebuild the header span or duplicate the normal-axis decorator.
- The actual-owner regression checks identity and badge retention, current
  price/position/read-only output, labels, aria state, click routing and
  unchanged game/trade state. Browser stability frames now additionally record
  card/badge identity, presence and header geometry; the existing geometry
  signature, three consecutive frames, 500 ms limit and hit tests remain.
- Fresh exact-head CI, runtime screenshots and direct inspection remain
  required. No CI timeout, Courier presentation, financial function, source
  authority, signing, token transfer or general product version is changed.

## 2026-10-06 — V2.9.5 toast-dismissal placement revision

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | V2.9.5 / 2026-10-06.TOAST-DISMISSAL-PLACEMENT | K11520-SIMULATION-TRADING-P0-20261006 | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER | dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval | `K線西遊記/temples/11520/runtime/game-ui-product-fixes-v23.mjs`; `K線西遊記/temples/11520/tests/11520-ui-static.test.mjs`; `K線西遊記/temples/11520/CHANGELOG.md` | Keep the same toast stationary during dismissal without weakening its visible-fade assertion. | Presentation-only observer admission; same DOM node, timer, accessibility, local simulation storage and financial behavior. | Revert this three-file successor to de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9 if required; that restores the observed dismissal-shift defect but does not remove the simulation source/ledger support introduced by #519. |

- Post-merge main `de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9`
  failed the local responsive fade assertion in job `112369037365`, run
  `37492641953`. Artifact `11427520499`, SHA-256
  `2d80e07ad4084b26c92a8ba9c3ed1e06c0a75faad426938a60a5a015a32ec914`,
  records a cold-360 toast at y=440.75, then y=432.75 after dismissal while
  opacity remained 1. The later failure screenshot does not capture that instant.
- The existing observer re-ran world placement on the toast's class removal.
  An executed regression using the actual owner callback and a changed guide
  rectangle reproduced the exact 8 px shift. The original browser record did
  not record the guide rectangle, so that specific movement remains inferred.
- Ignore toast-only dismissal notifications; a new direct message still reads
  current geometry, and actual panel-context mutations still move the same node.
  Preserve the existing browser fade/geometry assertions and all time budgets.
- Exact-head source review, fresh browser evidence and successor release remain
  separate gates. #519's public preview/M1 results do not validate this change.
  Public contextual job `112369454296` is separately CANCELLED after its
  functional test and artifact upload succeeded; this source change does not
  relabel or repair that job result. No workflow or timeout is changed here.

## 2026-10-06 — V2.9.5 simulation-playability component revision

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | V2.9.5 / 2026-10-06.SIMULATION-ORDER-PLAYABILITY | K11520-SIMULATION-TRADING-P0-20261006 | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER | dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval | `.github/workflows/11520-game-product-qa.yml`; `K線西遊記/temples/11520/CHANGELOG.md`; `K線西遊記/temples/11520/HANDOFF_CURRENT.md`; `K線西遊記/temples/11520/game-5d.html`; `K線西遊記/temples/11520/runtime/game-5d-main.mjs`; `K線西遊記/temples/11520/runtime/game-ui-product-fixes-v23.mjs`; `K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs`; `K線西遊記/temples/11520/runtime/public-market-quotes.mjs`; `K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs`; `K線西遊記/temples/11520/tests/11520-browser-responsive.mjs`; `K線西遊記/temples/11520/tests/11520-browser-settlement.mjs`; `K線西遊記/temples/11520/tests/11520-browser-signed-c-immersive.mjs`; `K線西遊記/temples/11520/tests/11520-ui-static.test.mjs`; `tests/11520-order-route.test.mjs`; `tests/11520-real-trading-order-intent.test.mjs` | Restore offline simulation lifecycle, retain REAL gates, expose complete component provenance and prevent panel feedback overlap. | Additive source metadata stays in existing local simulation storage; no automatic storage/model migration. Active deterministic-source books retain their source and recovery guard. | The final metadata-only commit can be reverted without changing executable behavior. A functional rollback before this repair removes support for persisted deterministic observations: preserve/export the local simulation data and do not load the old runtime against active synthetic-source books without a separately validated recovery/migration plan; prefer a forward fix. No destructive reset or safe automatic migration is claimed. |

- Component REVISION: `2026-10-06.SIMULATION-ORDER-PLAYABILITY`. This is a
  revision within the existing V2.9.5 product context, not a new product-number
  release or a second version authority. Existing component versions remain;
  the previously unversioned margin owner is marked CURRENT.
- Prior revisions of these same stable paths at e26 are ANCESTOR; no parallel
  active file is promoted, renamed or archived.
- Record the P0 repair in the existing game main, public quote, execution
  adapter, margin ledger, toast owner and `game-5d.html` metadata. The provenance
  base is validated candidate `0ad0cffe33d23d1104baa963fedef25ad149a0ac`;
  pre-repair lineage is main `e26f3a76ef0be7f43058225f46def3fbe123371e`.
  The separately reviewed local functional toast parent is
  `e1d7efc4f132259993bc71558cba7ec9c613cc81`, exact tree
  `2861266d5ad8b38fce9fb127d3cffbe6518c83c1`; its new behavior is not
  included in the prior 0ad browser acceptance.
- Explicit SIMULATION can preview, submit, trigger, fill, mark PnL, close,
  liquidate and retain history during public WAIT/STALE/INVALID states, using
  clearly labeled deterministic local observations in the existing engine.
  Active source corruption fails closed and public/REAL observations stay separate.
- Preserve financial formulas, the current simulation 1C cap, REAL eligibility,
  wallet/chain/receipt/withdraw gates and all signer/Mainnet boundaries. No
  second engine, registry identity, transfer or finance activation is introduced.
- Keep Cancel/Submit outside the scrolling preview. Route the one existing
  toast into the active trading panel header so provenance and receipt headings
  are not covered; preserve direct writers, accessible status, timers and errors.
- The preceding 0ad candidate passed both 36-case six-size offline lifecycle
  suites and required CI. Direct screenshot review nevertheless found toast
  overlap: its full VISUAL_QA/release gate remained FAIL despite footer PASS.
  This toast successor needs its own exact-head Chromium and direct screenshot
  acceptance; prior green results are not substituted for that evidence.
- The final provenance-only layer is checked against exact non-metadata byte
  hashes. HTML retains its UTF-8 BOM. Formal filenames, bootstrap/brand, the
  separate Navigator payload, general VERSION/MANIFEST and physics are unchanged.
- Physical C movement, software-keyboard offset behavior and Player body mass
  are not established by this repair. No merge or deployment is recorded here.

## 2026-10-04 — Canonical signed market address candidate

- Restore the existing price-floor lineage with shared `(k, alpha, theta)`
  display, a common alpha map and Prime Gate 5.11111; distinguish USDT reference
  quotes, WORLD 11520 land address and local physical XYZ.
- Preserve PR421 relative-percent simulation values, monster translation,
  combat ranges/phase and all trading math. Relative indicators are advanced
  information, not canonical K coordinates or physical distances.
- Reuse the existing spatial organ and skin floor function; CURRENT zero is
  K0/ORIGIN. No canonical documents/data, new runtime or second coordinate
  authority. Lineage and dependency matrix are in HANDOFF_CURRENT.md.
- Release remains Draft-only pending exact-head functional and visual QA.
- Browser coverage includes market decade boundaries/shared Gate without
  movement or combat changes, and map captures at all six viewport sizes.
  Existing toast fade QA now observes completion with a 2s bound instead of
  sampling only an arbitrary 800ms frame; exact-zero/geometry checks remain.

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
