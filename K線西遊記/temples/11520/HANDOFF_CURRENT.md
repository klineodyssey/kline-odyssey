# 11520 HANDOFF CURRENT

## World-first / Market Life — local candidate, 2026-10-04

- Authority: Human `KAIOS_K11520_HUMAN_CENTERED_WORLD_AND_MARKET_LIFE_V1`.
  Canonical branch `codex/k11520-world-first-market-life`, isolated worktree;
  base `e6dbf366341ef88f3f2b8fbbcd2d95704ad3f85f`. Draft review only, no merge.
  Do not fold #484 epsilon, #485 empty repay, #473 Heart, Lamp, OST or 16888
  into this task; their existing release gates remain independent.
- Visual audit: large interception/delivery and permanent market cards occupy
  the playfield despite passing viewport bounds. Existing HUD settings and
  layout owners implement minimal disclosure, not a second manager. Classify
  essential controls ALWAYS_VISIBLE, detail CONTEXTUAL, notices EVENT_ONLY,
  wallet/settings/chat MANUAL. MINIMAL is default; preference persists.
- Map lineage: PR #423, commit `924050045f26c1560eba6be80fb2a5eb64f9c0ae`
  (2026-09-21 +08) changed `plane-map-runtime.mjs` default to K and captured
  pointer events to show K details. Prior parent
  `6709b92e18cea76f87113fcc57a95fe9260df535` retained normal local navigation.
  The original `bindMap -> mapTap -> setWaypoint -> startNavigation` remains.
  Restore default XYZ, retain explicit K detail and XY/YZ canonical navigation.
- Camera: existing renderer only; zoom .65–1.8, pan bounded ±12 local units,
  reset, no persistence or Player XYZ writes. HUD origins are excluded; raycast
  actionable origins do not start pan. Pinch wins over canvas single-pointer
  gestures; release never becomes an accidental movement tap.
- Market Life: reuse market-life growth/memory/travel and the existing visual
  `vectorForAxis` mapping. Directional travel stays within 2m of its local home;
  neutral actors patrol .65m. These are GAME_PRESENTATION parameters, not
  k/alpha/theta-to-meter conversion. Combat rule/settlement owners are unchanged.
- Training: prospective 60s observation with 15s freshness/gap limit; duplicate
  batches cannot settle twice. Completed local game observations persist in the
  existing Player ID scoped storage; pending predictions never survive reload.
  No reward payout, capital/position mutation or real trade. Full GA600 is
  NOT_INTEGRATED; UI does not mislabel local momentum as formal GA600 output.
- Follow: read-only intent/distance cue; free manual movement, cancel/switch and
  existing guardian attack remain. Follow itself cannot navigate or transact.
- Gates IN_PROGRESS: local unit suite 217/217 and Universal 302/302 passed.
  Focused six-viewport Chromium passed MINIMAL, idle/held-pointer disclosure,
  pan/pinch/reset/XYZ separation, market intent/movement, follow/cancel, map
  navigation and persisted HUD preference. FULL 390x844 regression passed with
  actual joystick pursuit of the moving guardian before strikes (range rule
  unchanged). Landscape chip overlap was repaired and screenshot inspected.
  Character centre-hit priority additionally yields to pinch/manual camera;
  final exact-head CI must validate that last integration. Do not report full
  VISUAL_QA or exact-head CI PASS from intermediate screenshots. No Mainnet,
  public Testnet transaction, transfer, release or merge performed.
- PR #486 initial head `ce376ba8c08a7689e41389c43f7c97514a3944d6`:
  Universal and Portal PASS; Game/Responsive caught integration defects, not a
  release PASS. Camera down/up use the existing mirrored raycast coordinate,
  whereas moves use physical screen coordinates; normalize only camera input.
  Clear consumed avatar gestures, retain ground routing. Card geometry reads
  must use current DOM after quote replacement. FULL regression explicitly
  selects FULL, and post-reload utility clearance checks current rectangles
  with the same 8px gap (including the existing side-by-side utility lane).
- Visual follow-up: occluding world visuals fade in the camera-to-player line
  only, with independent materials; identity, position, hit targets and combat
  state remain untouched. Restore materials before applying current phase
  visibility. This is not a physics or collision correction.
- Candidate follow-up local gates: character routing, FULL mobile HUD and
  signed-C immersive browser tests PASS; core runtime 69/69 PASS. Final six-size
  run and new exact-head CI still required. Responsive CI now checks out and
  labels the PR's actual head, not GitHub's synthetic merge SHA.
- Head `dca6832b863abd78430692e46f7488346f8d5322`: Responsive (including
  six-size world-first), Universal and Portal PASS. Game progressed through
  controls/combat to an old plane-map test's fixed-pixel GROUND assumption;
  roaming entities can legitimately occupy that pixel. The follow-up selects
  actual empty canvas before a real click; canonical ground route and movement
  assertions stay exact. Local plane-map and full Digital Ant/insurance/bandit
  browser regressions PASS after that test correction.
- Added actual actor-follow switching, manual movement while following, a real
  60-second prospective observation, and exact growth reload checks at 390x844.
  Local PASS, including correct/wrong/flat counters and XP. Initialize all
  counters as zero so fresh and restored growth have the same schema. No
  injected scores or changed clocks. Character-ready tests use attached READY
  or FALLBACK telemetry rather than requiring MINIMAL to reveal hidden HUD.
  Final updated-head CI remains the release-review gate.

- Head `a4897825`: exact-head Responsive/world-first, Portal and Universal
  PASS. Six CI screenshots and follow details directly inspected. Local full
  Player Life and settlement regressions passed, but geometry inspection found
  a landscape event toast below the viewport. Existing toast placement now
  measures its wrapped height and uses space above the bottom-anchored guide;
  the real boss-victory browser test also requires full viewport containment.
  This follow-up requires a new exact-head CI result; old green gates are not
  evidence for the revised candidate.

- Game's Player Life Boss regression was reproduced with per-strike evidence:
  42 of 55 clicks returned OUT_OF_RANGE as the live target moved to 3.18m.
  The old test only approached at start/recovery. Use the actual existing
  joystick to pursue before strikes; retain 30/55 strike limits, original range,
  damage, recovery and exact DEAD/one-shot assertions. No combat change.

- Game also exposed the pre-existing insurance geometry race: countdown render
  replaces the claim subtree between visible wait and boundingBox. The test now
  reads APPROVED state, current connected visible control and geometry in one
  browser task. The 44px assertion is unchanged and is not a polling predicate;
  undersized controls still fail. No Courier/insurance product logic changed.

## Canonical coordinate restoration candidate — 2026-10-04

- TASK_ID: K11520-CANONICAL-COORDINATE; Human explicit audit → minimal Draft PR
  order. Worker codex-gm-01 ACTIVE/T5; branch codex/k11520-canonical-coordinate.
  Refetched base a42eb12c8080e6f881798968a28a868efb14d04a is lineage only.
- BOOT / MUST READ: stable Boot, Physics CURRENT V3.8, UniverseMap V10.2,
  Signed Universe V7.5, root/11520 AGENTS and both CURRENT handoffs. Current
  authority wins over historical cumulative text. No new coordinate runtime.
- CANONICAL INPUT: CURRENT §§169/183 defines priceFloor=floor(log10(P_USDT))
  and priceAlpha=P_USDT/10^priceFloor, with KGEN examples. Existing 11520
  `game-ui-product-fixes-v23.mjs::floorOf/updateFloors` already applied the
  same mapping directly to market-card prices (3aac2099, 2026-09-06).
  This restoration keeps that existing market-price input, not CT energy or
  normalization. BTCUSDT/ETHUSDT/BNBUSDT are USDT reference observations,
  NOT an attested USD execution index and NOT the player's physical position.
- SIGNED ADDRESS: CURRENT §§150–153, 210 and Signed Universe law give
  nonzero x → (floor(log10(abs(x))), abs(x)/10^k, 0/π). Zero is K0 / ORIGIN,
  never k=0/alpha=0. Prime Gate alpha=5.11111 remains a location marker;
  this display grants no Gate transit, energy or Autopilot capability.
- WORLD: map point 11520 花果山 is land/address k4/alpha1.152/theta0;
  market price floors and player LOCAL XYZ are separate. Negative XYZ means
  local direction, not negative price. UniverseMap's historical profit_axis
  Z-KZ is superseded by CURRENT §12; it is not restored as settlement math.
- NORM ORIGIN: PR421 / bc3db907aa92e1668edbc07c358ebd2360a61a02,
  merged 2026-09-21 01:32:41 UTC+8, introduced six-phase simulation combat
  Ni(P)=100*(P/P0-1). BTC P0=100000, ETH=4000, BNB=600. Source explicitly says
  simulation reference, NOT Canon constants. PR425 / 3900740bb68d7267a23655651cc5ccef726e2ebf
  connected public quotes and replaced visible floor badges with norm labels.

### Norm dependency matrix / migration boundary

| Consumer | Existing dependency | Candidate handling |
|---|---|---|
| market cards / detail | norm label | signed price address; explicit USDT |
| market overview | three relative axis intercepts | one shared alpha [1,10) map; per-market k/θ indicators |
| world market snapshot | playerK/anchors/inverse helpers | retain compatibility values; add typed universe/relativePercent metadata |
| practice monster | relative kPosition and frame translation | unchanged; advanced simulated vector, not canonical address |
| combat range / movement | local meters and physical K | unchanged; no market-to-meter conversion |
| combat phase / weak points | plane normal and signed C | unchanged; explicitly not signed-universe θ |
| GA600 game profiles | existing synthetic encounter profiles | unchanged, no new price/alpha training authority |
| trading / settlement | raw accepted price/index differences | unchanged; no alpha/norm in PnL |
| browser/unit tests | norm equality and relative-vector invariants | retain numerical compatibility checks; display tests now assert signed address |
| Courier / Life / Wallet / other worlds | no new dependency | untouched |

- EXECUTION: reuse existing spatial-coordinate-runtime for the scalar mapping;
  replace its existing skin floor calculation with the shared function. Keep
  relative percentage indicators in advanced disclosure; internal compatibility
  names do not grant Canon authority. No save migration or gameplay rebalance.
- PROTECTED PATH CHECK: Boot, Physics CURRENT, map data, Signed Law, token,
  settlement, Wallet, Life, 12345/16888, Courier/Logistics and audio unchanged.
- FINAL REPORT: candidate requires exact-head CI and real Chromium screenshots
  at 360x844, 390x844, 412x772, 432x856, 480x900 and 844x390. Formula tests cover
  scale boundaries, signs, zero, subnormal numbers, Gate and XYZ separation.
  This entry records scope, not a premature QA PASS. No merge authorized.
  No Mainnet or asset transaction; no salary/payment receipt created.

## V2.9 public playtest / fade-out correction — 2026-10-01

- Human-approved #462 head `f9b05c714c4970471f65460d92969dfc1cff9458`
  merged as `3c15472c44136452e05815e0e483cbc301f09eac`.
- Unmocked public Pages Chromium: fresh 390x844 player earned 27 kills,
  Player Lv.5, Engine Lv.3, daily eligibility, then defeated the three-phase
  Boss through actual controls. Final XP 490 / Engine XP 166; same Player ID,
  house and inventory survived reload. No direct XP mutation was used.
- Portrait/landscape Boss and once-only reward checks passed. Separate rarity
  tests use explicitly seeded Lv.6 and random fixtures, actual attack controls,
  and real public runtime: not organic drop-rate evidence or economic authority.
- Public shared audio: 11 music states and 14 SFX have nonzero destination PCM;
  mute produces zero signal. Digital browser output is not a physical-speaker
  listening claim. First-party synthesis only; no commercial media requests.
- Screenshot inspection caught loot text jumping onto the HUD during its final
  opacity fade. New per-frame responsive assertion reproduced the pre-fix error
  (`toast x moved during visible fade`, opacity 1 after dismiss). Keep the single
  toast's placement until its next message/pagehide; add no timer or DOM owner.
- Follow-up branch `codex/k11520-v29-toast-fade` must pass fresh exact-head CI,
  screenshot review and public deployment verification before final closeout.
- No protected transaction, payment, payout, cloud/Oracle/music purchase or
  automatic real-trading risk increase. No payment receipt: payroll stays HOLD.

## V2.9 gameplay candidate — 2026-10-01

- Base refetched from origin/main `69c6045fbd7e06f16cf71ad1f6443abf9e227a9b`
  (#461 public audio fix). Branch `codex/k11520-v29-gameplay`.
- Human: GAMEPLAY FIRST. Extend existing Player Life, World, Backpack and
  Shared Audio authorities; no parallel game or financial engine.
- Progression, Boss/rarity, Daily Journey and GA600 synthetic game training
  are documented cumulatively in `docs/K11520_PLAYER_LIFE.md`.
- Real gameplay and screenshot review must pass before READY_FOR_SECOND_REVIEW.
  This heading is implementation status, not a claim of completed browser QA.
- Actual bounded engineering sessions: `v29_progression`, `v29_boss`,
  `v29_audio` under codex-gm-01; no registry employees or payroll invented.
  No payment receipt exists: payroll/rewards remain HOLD, not PAID.
- No Mainnet, paid Oracle/cloud/music, on-chain KAIOS payout or automatic
  trading/cap increase. Human receives the PR for second-layer review.

## V2.8 Player Life candidate — 2026-10-01

- Human work order: guest-first permanent local Player ID, provider-neutral
  Player Life domain and replaceable cloud ports. Source base was refetched
  `37269353e4e1677b287c4419d1bcf9faf9ff47e4`, not assumed from chat.
- Read `docs/K11520_PLAYER_LIFE.md`. Existing backpack and simulation ledger
  remain sole owners; their data is scoped by Player ID, then wallet where
  applicable. Connecting/changing a wallet does not rename the player.
- Profile, home, data-driven house, event-derived progression, optional signed
  wallet links, local backup/import and contextual UI are candidate code.
  No persistent extra K-space card, paid cloud, payout or Mainnet action.
- Security review found and repaired duplicate item IDs hidden by stack merge,
  missing persisted item identity, corrupt simulation-save overwrite and legacy
  guest XP reset. Malformed saves remain untouched; local data is NOT trusted
  authentication or an authoritative economic ledger.
- Local Chromium uses disposable fixture wallets/signatures and public quote
  fixtures for reproducibility. This is not evidence of real wallet custody,
  real player counts, real funds or cloud authentication. Exact-head CI and
  screenshots must accompany the PR; Human forwards it for second-layer review.
- Cloud interface: NOT_CONFIGURED. Recommendation only: evaluate Supabase /
  PostgreSQL for future authenticated ownership and transactional events.
- Session helpers `player_domain`, `player_ui`, `player_qa` are actual bounded
  work sessions under codex-gm-01, not new registry employees. No salary or
  reward receipt was produced: payroll/payout remains HOLD, never PAID.

## Live-market display QA rounding — 2026-10-01

- Public Pages verification after PR456 exposed a test-only half-cent mismatch.
  Deterministic reproduction: ETH reference 2501 gives normalized K -37.475; the existing canonical formatter
  displays -37.47 while raw Number.toFixed(2) expects -37.48. The market price
  itself is unchanged. Browser QA now checks the exact canonical formatted label,
  with a deterministic regression for that boundary. No product runtime, price,
  Oracle policy, financial logic or precision was changed to satisfy the test.
- Post-release anonymous play also exposed the older non-tutorial target label
  crossing landscape C/lots after reload. The existing label now shares the
  tutorial's bounded mobile placement in both states and remains tappable for
  target detail. Responsive QA checks map/control clearance; no additional card.
- Live map/runtime assertions now sample one matching rendered quote generation
  atomically (2.5s deadline, exact equality retained). Separate browser reads can
  straddle a legitimate live tick; prices must not be frozen to satisfy QA.

## V2.7.0 journey onboarding continuation — 2026-10-01

- Continues merged PR455 (518ec114), without resetting restored XYZ or changing
  market, wallet, position, settlement, payout or canonical Life-slot authority.
- Existing world runtime now owns browser-local tutorial stages: walk, hit,
  loot, plane/positive-negative C practice, preview only, done. Stages follow
  real gameplay events; the tutorial never awards loot or submits an order.
  Existing players continue normally. Settings can replay/skip the short story.
- Existing contextual monster guide carries the current step and opens story
  detail on demand; no second persistent K-space card. Replay closes utilities
  so landscape combat is usable immediately. Real player gestures unlock the
  existing original BGM and zh-TW welcome, not automatic page load.
- Existing simulation-browser suite exercises the tutorial alongside wallet,
  liquidation, receipts and account/reload recovery in both mobile orientations.
  Screenshots remain in artifacts/11520-settlement-qa; responsive checks use
  the existing six-profile suite. Release requires fresh exact-head CI and
  direct visual inspection, then deployed Pages verification.
- First-party code/text/test changes only, no new assets or runtime files.
  KAIOS remains a local/wallet-bound candidate, not a paid receipt. No payroll
  receipt produced: HOLD. Mainnet, paid Oracle and >1C production remain HOLD.

## V2.7.0 returning-player encounter closeout — 2026-10-01

- PR455 preserves restored XYZ and creates the first guardian at player Z +7m.
  Ambient apes/wisps spawn and roam in the nearby camera footprint, separately
  from canonical source-managed Life slots and all settlement authorities.
- Returning-player Chromium inspection additionally found the bootstrap still
  overwrote V2.7.0 with V2.6.25, and the finite ground disappeared outside origin.
  Bootstrap now guards V2.7.0; the render-only ground follows local player X/Z
  without moving the player, buildings, collision objects or market coordinates.
- Existing responsive QA now seeds XYZ (210, .013172, 186), checks the 7m target,
  observes visible/moving ambient meshes, and saves screenshots plus read-only
  projection evidence. Release still requires exact-head CI and Pages verification.
- First-party implementation/test changes only; no external assets, signer,
  token payout, payment or Oracle subscription. Added-line secret scan: no matches.
  Payroll/ATM has no new receipt: HOLD. >1C production and Mainnet remain HOLD.

## Active V1 product scope — 2026-09-30

- Human changed priority to journey/gameplay and free0.001–1C trading capability.
  Paid Chainlink450USD and100C production activation are HOLD/FUTURE_UNLOCK.
- `controls/nonlinear-controls.mjs::resolveCMode` uses abs(C) for mode and
  sign(C) for direction. Public simulation entry and unsigned Mainnet intent
  enforce1C; existing100C simulation/Testnet evidence remains historical.
- Free REST observations now use provider time, not fetch time.15s stale limit
  is unchanged. No stale fills or liquidation; offline journey remains playable.
- Account-keyed local simulation persistence is distinct from on-chain recovery.
  Local journey loot and metrics are not chain KAIOS, real trades or human KPI.
- Production Mainnet remains NOT_ACTIVATED. Do not label this source release
  real-volume ready or relax USD Oracle/approval gates to manufacture completion.
- Candidate evidence: existing `tests/11520-browser-settlement.mjs` now covers
  both mobile orientations, stale liquidation preservation, A/B switching,
  read-only reconnect/reload, high-C rejection, joystick approach, zero-C kill,
  local loot/backpack and local metrics. Screenshots live in the existing
  `artifacts/11520-settlement-qa/` CI artifact. Responsive evidence remains in
  `artifacts/11520-responsive-qa/`; direct review covered portrait, short warm
  viewport, landscape, Slash, Golden Rain and Phantom Axe.
- First-party source/test changes only; no new external assets or music.
  Added-line credential-pattern scan returned zero matches. No signer access,
  payment, transaction, salary receipt or real trading volume was produced.

## P0 range-exit / capability candidate — 2026-09-30

- Human range-exit policy is now approved for source changes. Position admits
  new risk only inside bounds and within a current attested Oracle capability;
  valid out-of-range exits settle at actual observations, never clamped prices.
- Existing Oracle exit checks and Brain principal/claims/insurance remain intact.
  Source and risk reconfiguration invalidate capability; reduced/expired caps
  revalidate pending fills, while legitimate exits remain available.
- Production capability remains NO_NEW_RISK until latency/precision/independence
  evidence is verified. USD INDEX is the unsigned Mainnet package quote policy;
  no USD/USDT parity assumption. Public Testnet deployment is not upgraded by
  this repository change. No Mainnet broadcast or funding authorized.
- Local/CI results belong to their exact source hashes and are not public chain
  receipts. Review PR checks and the execution manifest before release claims.

## Complete-product capital/wallet continuation — 2026-09-29

- PR446 merged6f567ca000113f5ffe9bd0887098d50c4fe3a149 after all exact-head
  CI passed. Published source/rotation/PWA and actual chain97 read-only wallet,
  receipt recovery/stale-price rejection passed. No further chain writes.
- Offline follow-up adds one read-only candidate OracleSourceAdapter and extends
  the existing runner with unsigned chain56 packages; no duplicate settlement
  engine or public deployment. Timestamp/Pyth source-time mutation, freshness,
  confidence-before-rounding, exact precision and constructor guards tested with
  unchanged Position. USD is not USDT; actual source/risk policy remains open.
  Package hashes bind roles/nonces/code/calldata/caps, not Human approval. Missing
  parameters produce a blocked package. Frontend inspector never enables signing.
  Existing four public organs and their receipt/bytecode lineage are unchanged.

- PR445 merged at b433131756f046e9f4f3a3cce957316ba85da0ce; all exact-head
  and main Game/Responsive/Trading/Universal/Pages CI passed. Public source
  matched that merge; real no-asset-interception portrait/landscape/rotation and
  PWA smoke passed. Post-release stale mock-feed QA found a secondary route
  toast overwriting the correct ORACLE_STALE rejection. The bounded follow-up
  preserves execution-owned Testnet feedback; it changes no oracle, order,
  settlement, wallet or transaction authority. Fresh checks remain required for
  this follow-up; no new chain transactions are needed.
- TASK_ID K11520-COMPLETE-PRODUCT-20260929; Human DOCX handoff V1 and explicit
  CONTINUE_TO_COMPLETE. Base main12adee3fbc53fa2c2d05706b54b7246ccfb7e9e8 is
  lineage only: always refetch. Preserved five inherited contract/test edits in
  codex/k11520-wallet-permanent-approval; Human dirty main was not modified.
- V2.6.25 / shell-v279. Signed canonical C-order PnL is absolute index delta
  times C times lots, not divided by entry. One lot is still one KGEN margin.
  KGEN_TRADING_SPEC, UI specification, manual, preview and tests are synchronized
  under explicit Human authority. The historical public Testnet bytecode is
  legacy and archived separately; the capital successor below has real receipts.
- Brain uses actual token-received funding, distinct free settlement capital,
  aggregate gross reserved liability and player claims. Position atomically
  reserves maximum favorable PnL over configured bounds and locks configuration
  while open. Claims cannot consume another position's earmarked reservation.
  Settled profit uses its own reservation first; excess available capital pays
  the rest, otherwise a persistent claim remains. Principal exits stay possible
  under solvent custody even when legacy claim debt is unfunded.
- Reviewed P1 found/fixed: an old unfunded claim must not turn another fully
  funded position's reserved payout into a new claim. Actual Brain regression
  proves reserved100 pays fundedA100 while legacyB100 remains pending, then
  genuine funding repaysB; neither player principal finances the other.
- Brain runtime21105bytes; append-only six-slot gap35→29 against pinned actual
  pre-capital source. Actual ancestor proxy/timelock upgrade, partial claims,
  fee-on-transfer actual funding, A/B/C and custody tests pass locally.
- Wallet adapter reads allowance, requires explicit max-approval confirmation,
  supports Deposit/Available-only Withdraw, and uses capability-gated candidate
  claims/preview. Old deployments cannot invent Claimable0 or call absent ABI.
- PR #445 checkpoint2fb4e5 passed actual-pair/capital Trading Readiness,
  candidate-wallet Chromium, Responsive and Universal CI. Game Product exposed
  historical percentage-return and version-label assertions, updated to test
  the Human-approved index model and V2.6.25 rather than changing product math.
- Actual local contracts and both390x844/844x390 browsers exercised100C100lots,
  approve/deposit, pending/cross/fill, PnL, close/liquidation, withdraw, A/B/C
  isolation and reload. Populated previews were directly image-reviewed after
  awaiting asynchronous validation; blank loading-state captures are not PASS.
- Existing rehearsal runner supports explicit, separately archived successors:
  `--prepare-successor97=<run-id>` compiles/snapshots without provider/signer;
  `--deploy97 --successor97=<same-run-id>` is a separately authorized public
  action, verifies predecessor chain/code/roles/proxy/all receipts and refuses
  reused candidates/runs. Original deployment records remain immutable; a
  prepared successor is not a deployment receipt. Public successor
  `capital-20260929` was subsequently deployed under the explicit BSC97 order:
  75/75 confirmed receipts, 0.0027142114 test BNB gas, new mock token and nine
  test feeds only. Brain proxy0x60e3801CDf885830ca45Def76a6141f841B0521d;
  complete addresses, code hashes and receipts are in the Testnet manifest.
  Actual contract touch/cross, one-shot, isolated loss and insurance tests PASS.
  Public Chromium now also passes390x844 profit50 close/withdraw/reload and
  844x390 gap raw loss220 / isolated loss100 / withdraw/reload at100C100lots.
  Additional37 confirmed browser-attempt/lifecycle transactions are preserved
  in the manifest, separate from75 deployment/smoke receipts. Final source
  reloaded both orientations read-only with zero broadcasts; direct screenshots
  verify wallet metrics, actual receipt history and historic liquidation boundary.
  EIP1193 uses a bounded Node-only configured Testnet signer broker, not a claim
  that a Human MetaMask extension was tested. Historical failed captures stay
  archived as failures, not final visual evidence.
- Release remains pending fresh exact-head CI, direct mobile screenshots and
  Pages verification. Use PR/Actions/artifacts for final status, not this entry.
- Mainnet remains blocked pending concrete contract/role/oracle/funding/gas
  manifest approval. The configured signer was used only through the bounded
  BSC97 test-asset route, with no key export and no Mainnet transaction.
  Mainnet oracle review found USD/USDT basis and third-source policy unresolved;
  RedStone requires a source-specific timestamp adapter (its changing answer
  keeps round1), not weakening the existing replay guard. Payroll/ATM/advance
  has no new real payment receipt: HOLD.

## Human spatial calibration / nonlinear C — 2026-09-25

- TASK_ID: K11520-C-DETENTS-K-DISTANCE-20260925; Human explicitly approved
  1 LOCAL game spatial unit = 1 meter, scoped only to K11520 simulation.
  Base 6d546d102dd7ac79bf8ee4ee621d12ddca750b3c is lineage, not future CURRENT.
- V2.6.23 / shell-v277. Existing spatial-coordinate-runtime owns all conversion:
  1K = 384400/16888 km from Physics CURRENT Moon anchor. Local render/collision
  remain meters; K displays use six significant digits, never relabel raw units.
- The narrow Y rail uses compact three-significant-digit scientific K notation;
  accessible detail retains full K/meters. The legacy energy painter also uses
  the shared formatter, so low-C motion cannot be rounded back to raw zero.
  Mobile HUD QA waits for world/controller readiness and asserts signed movement.
- Production follow-up: slow optional UI delivery reproduced a second legacy
  intro after bootstrap dismissal. The existing skin now respects the persistent
  bootstrap owner; settlement browser QA delays that module and rejects a second
  overlay. No timeout-only workaround or game control change.
- Market KX/KY/KZ and delta remain explicitly normalized market coordinates.
  No market tick = meter calibration exists. Explicit dimensional transform seam
  rejects absent/untagged PHYSICAL_K; no normalized-market + meter arithmetic.
  Guardian retains its 7m rendered spawn and unchanged 2.2/6/4m skill ranges.
- Existing nonlinear-controls owns 49 signed C detents: 0, ±.001/.01/.1/1,
  ±5..100 by5. Inner half-travel reserves four low-C steps; execution validates
  without rounding. Simulation, order adapter and candidate RiskKernel agree.
- XYZ/capture/navigation use numeric spatial state, never parse the converted
  HUD. Tiny-C labels retain precision; local K distance and normalized market
  delta are separate in the existing minimap/detail footprint.
- Local evidence: 166 runtime/product tests; all49 touch detents each orientation;
  six responsive profiles, rotations, market/phase synchronization and three FX;
  wallet/settlement lifecycle both sizes. Direct screenshot review repaired a
  target-card/attack overlap. Exact-head CI and Pages remain release gates.
- Artifacts: 11520-visual-qa/C_*.png, 11520-responsive-qa/K_DISTANCE_*.png,
  responsive report.json and 11520-settlement-qa. Fixture wallet/quotes are not
  Human wallet evidence. Local EVM is not public Testnet or Mainnet deployment.
- This section supersedes historical arbitrary-unit/R=market+local descriptions
  below without deleting lineage. No Boot/Physics Canon replacement, new asset,
  parallel ledger, signer, live transaction or production oracle activation.
- No verified payroll/ATM/advance receipt for this task: HOLD, not PAID/RECEIVED.
  Human dirty main, paused patrol and Cursor remain untouched.

## Wallet/order/settlement integration — 2026-09-25

- TASK_ID: K11520-WALLET-ORDER-INTEGRATION-20260925; direct Human order.
  Lineage base ef9c74c3a6a18d252077fe213add60b0da486b9c (#439), not a future CURRENT claim.
- V2.6.22 / shell-v274. Reuses #439 ledger and contracts unchanged.
  evm-wallet-runtime + wallet-game-bridge own one read-only EIP-1193 session;
  real-trading-order-intent owns one adapter interface; game-main owns existing UI.
- Account/chain/disconnect clear unverified balance without page reload.
  Human UX duplicate RPC/capture/events and focus-driven automatic connect removed.
  Retained public address is separate and explicitly unverified.
- Preview is pure; pending has no fill/debit; observed touch/cross fills once.
  Position/PnL/normal close/isolated liquidation/readable receipt history share
  the existing simulation ledger. EVM seam is disabled, no flag enables signing.
- Runtime functional tests and both-size deterministic browser lifecycle passed;
  screenshot inspection found/fixed expanded wallet header's stale 38px inline
  sizing. Wallet controls now have real hit-test regression coverage.
- Exact-head CI and production deployment/source checks remain release gates;
  use GitHub PR/Actions and live source hashes for completion, not this note.
- Screenshots: artifacts/11520-settlement-qa, CI artifact 11520-settlement-SHA.
  Wallet address/balance and quotes in that test are synthetic fixtures, not
  Human wallet evidence. No external chain transaction was sent.
- Payroll snapshot/reserve are prototype-only, no payment receipt for this task.
  Payroll/ATM advances remain HOLD. Human dirty main and paused patrol untouched.

## Current public market K-space — 2026-09-21

- TASK_ID: KAIOS-11520-LIVE-MARKET-MAP-20260921; Human image execution order; owner 衡曜 / codex-gm-01. Fresh base 924050045f26c1560eba6be80fb2a5eb64f9c0ae is lineage only. Branch codex/k11520-live-market-map-20260921 is an isolated clean worktree; Human dirty main untouched.
- Existing `public-market-quotes.mjs` is the sole quote adapter: public market-data-only origin, read-only, credentials omitted, bounded timeout, complete validated batches. No new provider, asset, module, bootstrap, Canon constant, wallet or settlement authority.
- `world-runtime.mjs` normalizes each batch with existing anchors and translates the common market frame, preserving relative K/local XYZ/rendered location/HP/cooldown/range. Startup WAIT has no fake current encounter; failure/age over 15 seconds yields STALE last-good coordinates. Source and receipt time remain traceable.
- `game-5d-main.mjs` shares that batch with cards/target detail; normalized K replaces the legacy floor badge's visible card space without changing floor math. `plane-map-runtime.mjs` uses only the shared snapshot: colored axis-intercept market points, oblique third-axis projection, Player/Monster vector, expandable near-distance plot, live prices/K/distances and separate LOCAL XYZ.
- V2.6.20 / shell cache v272. Existing tests extend atomic validation, stale recovery, inverse transform, neutral formatting, map bounds, live-card/map/combat equality, refresh without player movement, incomplete-batch rejection and recovery. Existing gameplay, portrait/landscape/rotation/PWA/BGM gates remain required.
- Source/IP: original first-party code and procedural canvas only. No new files or copied assets/music. Protected real-funds execution denied. Added-line secret scan required before publication.
- Release at authoring: candidate QA in progress; exact PR checks, merge SHA, Pages/source hashes and directly inspected screenshots establish release, not this note. Payroll/ATM advance/offset receipt NOT_VERIFIED / HOLD, no payment. Paused patrol and Cursor remain paused.

## Previous K-space map visualization — 2026-09-21

- TASK_ID: KAIOS-11520-KSPACE-MAP-20260921; Human continuation order; owner 衡曜 / codex-gm-01. Base `6709b92e18cea76f87113fcc57a95fe9260df535` is lineage, not a future CURRENT assertion. Branch `codex/k11520-kspace-map-20260921` is isolated from Human dirty main.
- BOOT / MUST READ: current Boot, AGENTS, Physics CURRENT, Universe Map, Canon, merge policy, registry, workspace/manager/dispatcher/review rules, queues and this temple's AGENTS/handoff. Registered ACTIVE T5; no active claim conflict. Existing protected PRs are separate from this bounded Human UI order.
- PROTECTED PATH CHECK: no Canon/Boot/wallet/contracts/source-Life/settlement change. No protected external execution. Provenance is first-party repository code and original canvas rendering, no new assets.
- TASK PLAN / EXECUTION: extend `runtime/plane-map-runtime.mjs`, preserve #421 snapshot as coordinate authority. K and LOCAL XYZ views share existing minimap footprint. Blue P circle and gold M diamond, Player-to-Monster vector, in-plane axes, separate normal/depth rail, explicit positive/negative/neutral phase, Ku distance and expandable player/monster/delta tuples. Coincident planar points remain coincident; depth is not faked as in-plane displacement.
- XYZ navigation remains available through the XYZ tab and existing world map. K-map taps open the existing detail sheet and cannot create a local waypoint. Market display prices no longer masquerade as K map coordinates. The simulation normalization/combat source is unchanged.
- V2.6.19 / shell cache v271. Existing unit/browser tests include all planes/signs, no-target/changed-target projection, live snapshot equality, two view switches, 44px tabs, gameplay and rotation. Mandatory screenshot names 01 through 06 are emitted with viewport prefixes into existing CI artifacts.
- FINAL REPORT at authoring: candidate undergoing real-browser and exact-head validation. PR checks, actual merge and normal Pages deployment are final release evidence; no predicted completion. Payroll current-period receipts/advance/netting remain HOLD / NOT_VERIFIED; no paid claim. Broad patrol and Cursor remain paused.

## Previous K-space combat integration — 2026-09-21

- TASK_ID: KAIOS-11520-KSPACE-COMBAT-20260921; owner 衡曜 / codex-gm-01 / LIFE-CODEX-GM-0001.
- Human source: explicit K-SPACE COMBAT COORDINATE IMPLEMENTATION ORDER; ordinary game/simulation repository merge and Pages publication authorized after exact-head tests and direct screenshot review. No second-reviewer ceremony; protected execution remains prohibited.
- Isolated branch: `codex/k11520-kspace-combat-20260921`; base checkpoint `88362a7c75a06416b65b4f6c91fcba67ed095893` is lineage, never a future CURRENT assertion.
- V2.6.18 extends existing `runtime/world-runtime.mjs`, `runtime/game-5d-main.mjs` and combat runtimes, not a parallel universe/runtime. Ni(P)=100*(P/P0-1), inverse P=P0*(1+Ki/100); reference prices/anchors are explicit fictional simulation inputs, not live-oracle authority or Canon constants. R=K+r, renderer uses the player K origin.
- One practice K-Guardian has six body HP pools, no LIFE_ID, capital, reward, custody or source settlement. Plane selects normal axis; sign(C) selects phase; 0C cannot hit. Local movement takes speed magnitude so negative C never reverses the joystick. Lots remain positive and do not choose phase.
- Slash: 2.2-unit selected body. Golden Rain: 6-unit tangent-plane same-sign bodies. Phantom Axe: 4-unit forward semicircle, three same-sign bodies. All use actual full-XYZ distance, cooldown and live body HP. GUARD/RESIST/EXPOSED yield different damage; no auto-mint, no asset reward. Target panel shows K/XYZ/delta, source/anchors and explicit reset.
- Visual repair: readable unmirrored phase labels, compact target card outside controls, deterministic clear encounter corridor and forward camera framing. A 12-second model-load fallback prevents invisible-player waits; late model success replaces/disposes the fallback.
- Evidence: existing responsive QA writes `{profile}-kspace-{target,relative-coordinates,slash-negative,slash-positive,goldenRain,phantomAxe}.png`, four rotation cycles and report.json to `artifacts/11520-responsive-qa`. CI associates artifacts with exact candidate SHA. Reports distinguish functional evidence from required direct image inspection.
- At documentation time: local implementation/QA; final release authority is the eventual exact-head checks, merge SHA and successful Pages run, not this note. No known defect may be excused by a green source-only check.
- Payroll: `KGEN-KAIOS/workforce/salary_ledger.jsonl` contains prototype MERIT_POINT/internal-ledger rows, not a current GM paid receipt. Issued/received/advance/offset remain HOLD / NOT_VERIFIED; no payment performed. Broad patrol stays paused; this explicit task does not restart Cursor or automation.

## Previous landscape finalization — 2026-09-20

- TASK_ID: KAIOS-11520-LANDSCAPE-FINALIZATION-20260920.
- Owner: 衡曜 / codex-gm-01. Human Owner explicitly authorizes low-risk repository merge and normal Pages publication after exact-head Functional + Visual QA.
- Branch: `codex/k11520-landscape-finalization-20260920`.
- Reconciled base checkpoint: `2158065ae4eac6563557b890999eed0762756124`; always refetch, never treat this checkpoint as a future CURRENT head.
- Candidate changes: existing landscape layout/precision inputs/panels, presentation-only golden rain/phantom axe, scoped network-first service-worker failure behavior and regression tests. No duplicate runtime, new assets, trade/wallet identity change or protected execution.
- Test evidence: `artifacts/11520-responsive-qa/report.json` and `landscape-{slash,goldenRain,phantomAxe}.png`, `landscape-final-844x390.png`, `rotation-portrait-390x844.png`. CI uploads these under its exact SHA; screenshot existence alone is not Visual QA.
- Local isolated Chrome PWA installation and actual standalone display mode were verified; orientation remains any. Production certification must use the eventual Pages release and fresh public smoke, not this local observation alone.
- Payroll: current-period GM receipt/advance/deduction not verified from prototype ledger; HOLD, no payment or received-salary claim.
- Release status: LOCAL_QA / exact-head CI and production verification pending at documentation time. The PR check runs, merge commit and Pages deployment provide authoritative final release evidence.

## Historical living-world candidate (preserved, not current release authority)

STATUS: ACTIVE DRAFT CANDIDATE
TASK_ID: KAIOS-11520-LIVING-WORLD-LOGISTICS-20260908
BASE_BRANCH: main
EXACT_BASE_SHA: 45aac5b703dd4b80fca54a60f1b6531f27c1ac32
EXACT_HEAD_SHA: b5e7f2d9e38ddc6163427f875bc830463716cb53
DRAFT_PR: #221

## Current completed slice

- XZ+Y / XY+Z / YZ+X persistent three-plane 3D controller remains functional.
- K-sphere normal mapping remains XZ -> KY, XY -> KZ, YZ -> KX without hiding the other market axes.
- Digital Ant logistics/CFO simulation and source-managed Market Life XYZ autonomy remain enabled on this Draft candidate.
- Mobile lower HUD has an authoritative formal layout organ: `runtime/mobile-control-layout.mjs`.
- On 390x844, C warp, lots, remaining-axis rail, attack/order actions, minimap, wallet, backpack and dock are separated into non-overlapping zones.
- Browser QA machine-checks the control-layout overlap report instead of relying only on screenshot existence.

## Exact-head QA

- 11520 Universal Exchange V2 #1605: SUCCESS
- 11520 Game Product QA #477: SUCCESS
- ES module validation: PASS
- Runtime/product invariant tests: PASS
- Real Chromium 390x844 XZ / XY / YZ functional QA: PASS
- Mandatory screenshots: PASS
- Mobile control overlap gate: PASS
- Manual visual inspection of implementation artifact from code head `4880727a6e1dad9ca9a0f704b6d8e98172207f2a`: PASS
- Visual artifact ID: 10039250633
- Artifact digest: `sha256:007bc2b3a142c454b22ed9acb58224553a4e923bbdd1dee82c9ae04f5387db87`
- Exact head `b5e7f2d9e38ddc6163427f875bc830463716cb53` differs from that implementation head only by handoff documentation commits and re-ran both mandatory workflows successfully.

## Measured 390x844 layout

- C warp: x=170..214, y=532..650
- Lots: x=220..264, y=532..650
- Attack: x=170..224, y=486..524
- Order: x=228..282, y=486..524
- Remaining-axis rail: x=288..332, y=698..830
- Joystick: x=14..160, y=682..828
- Minimap: x=6..122, y=274..408
- Wallet valve: x=276..322, y=560..606
- Backpack: x=339..385, y=714..760
- Dock: x=341..385, y=776..834

Overlap gates all false:
`warpMinimap`, `lotsMinimap`, `warpLots`, `railDock`, `attackWarp`, `orderLots`.

## Safety boundary

DRAFT ONLY. No merge, production deploy, Mainnet transaction, token transfer, payment, treasury action, governance change, external KYC, secret export, or private-key exposure. Digital Ant and Market Life settlement remains simulation-first / receipt-gated; no autonomous real-asset transfer was enabled.

## Remaining blockers / next priority

No blocker remains for the mobile-control-layout slice.

NEXT_PRIORITY_CANDIDATE: make Digital Ant freight/ATM missions and Market Life work/travel/retirement decisions visibly distinguishable in the 3D world (vehicle/route/activity state), while preserving simulation-only settlement and requiring real 390x844 browser visual QA.
