# KAIOS 11520 PAGE HANDOFF HANDBOOK — CURRENT

> Purpose: hand the entire current 11520 workstream to a new ChatGPT/Codex page without making the Human repeat context or act as a message courier.
>
> This handbook is operational, not historical prose. The next page must read current `main`, `AGENTS.md`, this handbook, and the CURRENT Mainnet address manifest before changing code.

## 0. Handoff control

- Repository: `klineodyssey/kline-odyssey`
- Canonical execution branch: `main`
- Exact main at handbook creation: `d66b1ca1eb71de4fde6b16e4283605cec40624a1`
- Main commit title: `fix(11520): restore responsive mobile HUD and real click targets`
- Human authority: repository owner / final Human authority.
- Project context identity: canonical KAIOS GM lineage is `衡曜 / LIFE-CODEX-GM-0001 / codex-gm-01`; a new ChatGPT page must not claim machine-verified continuity unless that mapping is actually verified.
- New page behavior: autonomous safe engineering. Do not ask the Human to copy messages between pages, inspect screenshots for you, or approve ordinary low-risk merges.

Freshness rule: the SHA above is an anchor, not permission to stay stale. Before every implementation cycle, fetch latest `main`; if `main` advanced, rebase/reconstruct work from the latest exact head rather than carrying an old branch wholesale.

## 1. Human operating policy

The Human has explicitly simplified the company workflow:

1. Ordinary low-risk repository, website, UI, game, docs, simulation, read-only runtime, tests, CI, browser QA, screenshot QA, and Pages deployment may be decided and completed autonomously.
2. A second reviewer is not a universal blocker after Human authorization. Do not leave safe finished work parked merely because a ceremonial reviewer is absent.
3. Safe completion loop is: inspect latest main -> implement -> tests -> real browser -> screenshots -> AI visual inspection -> repair -> repeat -> exact-head CI -> merge -> Pages -> inspect production again.
4. If a test or screenshot is red, do not report completion and do not merge merely to make progress appear faster.
5. Protected actions still require a final Human decision packet immediately before execution: Mainnet deployment/config writes, real token transfers, real approvals, signer/private-key use, Treasury/payment/LP funding, governance/admin execution, KYC/account ownership, production-oracle control or equivalent irreversible real-funds changes.
6. Never expose or request private keys, seed phrases, passwords or signer secrets.

Human preference: “一次做對一次做到好” — fix root ownership and architecture rather than stacking another temporary CSS/runtime owner.

## 2. What 11520 is

11520 is one canonical 花果山 / Universal Exchange / playable 3D XYZ world with market reference axes.

Do not create a second exchange, second physics system, second settlement system, or parallel world state just to solve a local UI problem.

Canonical separation:

- Player/world space = `X/Y/Z`.
- Market/universe reference = `KX/KY/KZ`.
- Player movement changes XYZ only. It must not move KX/KY/KZ universe/market boundaries.
- Negative XYZ is ordinary signed local space, not automatically Mirror Universe.
- Steering/joystick does not decide LONG/SHORT.
- K-market direction and physical XYZ movement are separate authorities.
- Current control-plane model is one 3D world with `XZ+Y`, `XY+Z`, `YZ+X` control modes and unified XYZ navigation authority.
- Normal-axis market mapping currently used by presentation: `XZ -> KY`, `XY -> KZ`, `YZ -> KX`.

KGEN/KAIOS scale used in current 11520 gameplay/engineering lineage:

- `1 KGEN = 1 lot = 1 index = 1000 KAIOS = 1000 kg` for the current mass/index bridge.
- Do not silently use the old stale `1 KGEN = 1 kg` lineage.

## 3. Current UI truth — most important recent repair

The Human supplied a real production mobile screenshot showing the official site badly scrambled. It exposed floating drawer pills (`K市場 / 座標 / 生命 / 地圖 / 參數`), detached C/lot/axis rails, central/right utility drift, crowded market/status cards, and real-trading preflight intruding into the play scene.

Root cause was not a single visual constant. Multiple historical runtimes were simultaneously competing for DOM/CSS ownership. Old `game-mobile-shell.mjs` created floating drawer controls while later `mobile-ui-settings`, `mobile-control-layout`, `market-origin-wallet-layout`, `mobile-action-rail-clearance`, and product-fix layers also attempted to own positions and visibility.

### 3.1 Do not repeat the #345-style scope expansion

A prior layout change (#345 lineage) changed core mobile layout runtimes beyond the narrow request and became the main scope-expansion/regression point. Later features inherited that state. Digital Ant work was not the primary origin of the HUD regression.

Never fix one mobile control by relocating unrelated organs.

### 3.2 Current merged closeout

PR `#362` was ultimately rebuilt as a consolidation, not shipped as another permanent late hotfix owner.

Merged main SHA:

`d66b1ca1eb71de4fde6b16e4283605cec40624a1`

The accepted design is:

- existing **Mobile Control Layout** owns status / joystick / three-rail geometry;
- existing **Market/Wallet Layout** owns the right utility lane;
- modal/action clearance may raise layers but must not relocate the canonical rails;
- bootstrap installs the existing owner in a deterministic order;
- legacy mobile rail observer is not reinstalled as a competing owner;
- wallet runtime/trading/contracts were not changed for the layout repair.

Exact-head acceptance recorded for the closeout:

- Universal Exchange QA: PASS
- Responsive Product QA: PASS
- Game Product QA: PASS
- real Chromium screenshots directly inspected at widths `360 / 390 / 412 / 432 / 480`
- actual order preview/cancel exercised `5/5`
- single utility master preserved
- rail art remains bounded and circular
- no clock/balance overlap
- no market-card/status overlap

Do not reintroduce the removed `production-mobile-layout-hotfix.mjs` as a second permanent owner.

### 3.3 Mobile HUD target

For phone widths, preserve this hierarchy:

- top brand/account strip;
- KX/KY/KZ market cards;
- World/Life status safely below market cards;
- minimap below status without overlap;
- lower-left canonical plane joystick;
- grouped bottom vertical controls `[C][口數][remaining/normal axis]` with one coherent visual group;
- attack/order above the rail group, reachable and not covering joystick;
- right utility normally collapsed to one master button; expand reveals wallet/chat/settings/BGM/AI/backpack/dock functions; collapse returns to one master;
- no legacy floating `K市場/座標/生命/地圖/參數` pills in production;
- joystick/thumb imagery must remain circular and non-squashed; approved Wukong crop belongs to the axis thumb;
- when a joystick thumb moves, the artwork/thumb must visibly follow the finger and return to center.

Do not let Facebook/in-app-browser behavior depend on desktop-only assumptions. Responsive QA must cover real-entry paths, cold/warm state and realistic quote text.

## 4. 11520 playability requirements

The site is a game, not only a dashboard. Preserve and keep testing:

- enter world successfully from the 11520 landing/entry path;
- XYZ movement and collisions;
- XZ/XY/YZ mode differences;
- joystick touch-follow behavior;
- character / HP state;
- monsters/wild ecology and Digital Ant visual behavior;
- item/backpack/living-cargo identity;
- minimap / plane map navigation;
- C and lot controls;
- order preview/cancel/execute local gameplay path;
- wallet public-identity continuity;
- mobile controls remain reachable and non-overlapping.

A synthetic unit test pass is not enough. Real Chromium screenshots are mandatory evidence for UI/game closeout.

## 5. Trading workstream — current state

Human objective: 11520 must **能交易、能玩、能下單**.

Distinguish these states precisely:

- `can click order / local order preview` != real funds trading.
- `MATCHED_UNSETTLED` != settled trade.
- a settlement request packet != payment.
- a Solidity contract existing != deployed active production wiring.

### 5.1 Safe work already merged

PR lineage around `#357 -> #360` brought current-main trading readiness forward:

- Brain V4 candidate source
- Market Risk Kernel
- Position Engine
- fixed real-trading market binding
- unsigned order intent
- player-visible real-trading preflight
- order button route classification

Current first production-market design is deliberately fixed to avoid ambiguous asset identity:

- `KX = BTC/USDT`
- `KY = ETH/USDT`
- `KZ = BNB/USDT`

Other display markets may exist for gameplay/observation, but must not silently route into the real Position Engine until explicit market-id/oracle binding exists.

Current order-route classification should preserve the distinction:

- `REAL_READY_FOR_EXPLICIT_WALLET_ACTION`
- `LOCAL_SIMULATION_REAL_BLOCKED`
- `ORDER_BLOCKED`

At the current safe boundary, clicking order may continue the playable local simulation when real-trading prerequisites are incomplete. It must not pretend a local fill is a real Mainnet trade.

### 5.2 Brain/Position real-funds candidate

Current candidate contracts include:

- `KGEN/contracts/KGEN_BrainExchange.sol`
- `KGEN/contracts/KGEN_MarketRiskKernel.sol`
- `KGEN/contracts/KGEN_PositionEngine.sol`

Testing was corrected so CI compiles the canonical versionless tracked sources and only creates ephemeral byte-identical aliases when legacy test harness paths require them. Never return to “test one Solidity file, deploy a different versioned file”.

The actual Brain proxy + Position Engine integration must ensure `SETTLEMENT_ROLE` is limited to the Engine, not ordinary EOAs.

### 5.3 Oracle provenance — active next task

Old PR `#361` is CLOSED / NOT MERGED because it was based on pre-#362 main.

Current replacement PR:

- PR `#363`
- title: `feat(11520): register primary BSC oracle provenance on current main`
- base: merged UI-closeout main `d66b1ca1...`
- head at handbook creation: `2cfd344b06447f9dadd31c874d5d5dc47ab23b2e`
- status at handbook creation: OPEN / mergeable

It records primary BNB Chain Mainnet Chainlink feed provenance for the fixed KX/KY/KZ real-trading markets.

Primary feed addresses currently recorded in this workstream:

- BTC/USD: `0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf`
- ETH/USD: `0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e`
- BNB/USD: `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`

Important: primary provenance alone must **not** set production oracle quorum ready. The candidate policy requires at least two valid production sources with provider independence. Keep `productionQuorumReady=false` until a second independent provider/feed set is reviewed and tested.

Next page should first fresh-check #363 CI and current main. If all safe exact-head checks are green and no conflict/staleness exists, merge according to Human low-risk policy. Then continue to a second independent production oracle source, exact observation binding and fail-closed quorum tests.

## 6. Existing deployed Mainnet systems — do not rediscover from scratch

Use the CURRENT Mainnet manifest and chain reads. Known addresses from the current canonical lineage include:

### Original/reused universe layer

- KGEN token: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- K11520 Brain / Huaguoshan Universal Exchange legacy runtime: `0xd0605F4EF10e5C1438F11AF9edc36926769239d6`
- 108000 MarsSeats V2.2.1 deployed address from deployment console: `0x3529dbFbaD465C2269F8096879A1c298d5257298`
- Legacy TempleHeart runtime: `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972`
- 16888 Universe V5.20.0 deployed: `0xAbF1EBF153A69Cf383a1435AFC20F7232D893D63`
- KGEN LP pair: `0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`

Do not confuse “contract source exists” with “deployed address”, but also do not infer “not deployed” merely because GitHub/BscScan text search fails. Deployment tx/address evidence outranks name search.

### KAIOS Genesis / banking / settlement layer

- KAIOS / K33333: `0xD4E67B3a69e41524c424150E6b6e921b01D036db`
- 11520 Exchange Settlement proxy: `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df`
- 18888 Lingxiao Celestial Bank proxy: `0x11d34c0F723aCd334B8F95076f73F07f06202aab`
- 8888 Gaolaozhuang Commercial Bank proxy: `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C`
- legacy 8888 treasury lineage: `0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9`
- CelestialSeat500 proxy: `0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe`
- Organ Registry: `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D`
- Economic Router proxy: `0xC49f989c6ff0d22824df8D993Ce82207165C1428`
- Bank Risk Controller proxy: `0x61573a93a88c58DAa5066A0aA319f88cE34d88FC`
- Bank Governance proxy / current KGEN owner: `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166`
- KGEN Reserve Redemption proxy / current KGEN Bank Wallet: `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE`
- KAIOS Genesis Inscription: `0xb02CBc7698646653D541F494F510Fe18638AC7ae`

Do not collapse these different roles into one “bank” or “exchange address”.

### Role distinctions

- `KGEN.owner()` = BankGovernance proxy, not Mother.
- KGEN Bank Wallet = Reserve Redemption proxy, not KGEN owner, not 18888.
- Mother is governance proposer, not token owner.
- legacy 8888 treasury is not the new 8888 Commercial Bank proxy.
- original 11520 Brain is not the later KAIOS 11520 Settlement proxy.

## 7. What is required before genuine real-funds 11520 trading

The next page should work toward this single closed loop, not invent another exchange:

`wallet identity -> exact market binding -> actor authority -> oracle quorum -> margin funding/custody -> order intent -> Position Engine -> risk checks -> exact settlement authorization -> settlement/transfer -> receipt verification -> ownership/accounting proof -> VERIFIED_SETTLED -> UI receipt/history`

Engineering that may proceed autonomously before final Human authorization:

- ABI/adapters
- read-only Mainnet calls
- chain-id checks
- exact address manifests
- wallet/account continuity
- unsigned transaction/intents
- simulation/fork/local EVM tests
- oracle provenance and observation validation
- receipt parsers/verifiers
- replay protection
- solvency/risk invariants
- browser UI for preview, blockers and explicit wallet confirmation
- deterministic deployment/config scripts that do not execute
- Human final execution packet

Do not execute without final Human authorization:

- deploy Brain V4 / Position Engine / new oracle components to Mainnet
- grant settlement/oracle roles on Mainnet
- configure live production oracle addresses onchain
- approve/spend real KGEN/KAIOS
- fund Brain/escrow/liquidity
- send real trade/settlement transactions
- use signer/private keys
- governance proposal/approval/execution that changes live authority/state

When technically ready, provide one Human decision packet containing exact contracts/addresses, calls, gas/cost estimate, token amounts/allowances, role changes, risks, rollback/disable plan, and expected post-state. Human `可以上線/執行` is the final execution authority for that exact packet.

## 8. Wallet identity and cross-Temple navigation

Human requirement: switching between 11520 / 12345 / 16888 / 18888 etc. is navigation only and must not silently change wallet identity.

12345 and 16888 must have a visible mobile-safe `返回宇宙 / 返回11520世界` path. Do not trap the player on a Temple page and do not depend only on browser Back.

Wallet continuity rules:

- same connected EVM account/address persists across Temple navigation;
- navigation itself triggers no payment, approval, signer request or transfer;
- if provider is temporarily unavailable, show disconnected/reconnect and retain only a safe last-known public identity reference;
- never store private key/seed/session secret in URL, logs or localStorage;
- returning to 11520 restores prior XYZ if available; if not, use canonical bootstrap policy;
- wallet identity is independent of XYZ and KX/KY/KZ.

Browser tests should cover at least:

- `11520 -> 12345 -> 11520`
- `11520 -> 16888 -> 11520`
- `12345 <-> 16888`

and assert public wallet identity continuity.

## 9. Production entry / Facebook in-app browser

A past Human screenshot showed a 11520 landing page inside Facebook in-app browser where `進入世界` did not work. Treat real-entry behavior as a product requirement, not an edge case.

Whenever entry logic or boot order changes:

- test the actual landing/entry path, not only direct runtime modules;
- validate click listeners and navigation URL;
- avoid assumptions that require unsupported browser APIs without fallback;
- consider stale service-worker/cache behavior;
- use real mobile Chromium dimensions and realistic runtime loading order;
- do not claim entry fixed until a browser test proves the click enters the game.

## 10. Mainnet source/deployment lessons from this page

Do not repeat the earlier mistake of using source-name search as deployment proof.

Known deployment console evidence confirmed:

- KGEN V7.5.2 token/bank/genesis deployment succeeded;
- AMM pair was marked via `setMarketMakerPair`;
- Brain / MarsSeats / Heart deployed in `deploy_all.js`;
- ownership transferred from deployer to the historical Mother address for those three legacy contracts;
- Hardhat automatic source verification then failed because an obsolete Etherscan/BscScan V1 endpoint was used. That verification error did **not** undo deployment.

For any disputed deployment, prove with:

`address -> code present -> creation tx -> block/time -> constructor/proxy slots -> verified source if available -> runtime getters/roles`

rather than filename search alone.

## 11. Active PR / lineage handling rules

At handbook creation:

- #362 = merged UI ownership/responsive closeout -> main `d66b1ca1...`
- #361 = closed, stale, superseded; DO NOT merge
- #363 = current-main oracle provenance transplant; inspect and continue

Always inspect open PRs before starting a duplicate branch. If an old PR contains useful code but is stale, transplant the minimal safe diff onto current main; do not merge a large stale branch wholesale.

Historical branches/PR descriptions may contain claims such as “visual PASS” that were later disproven by a Human production screenshot. Current production evidence outranks stale PR prose.

## 12. QA gates for every 11520 UI/game change

Minimum sequence:

1. Fresh latest `main`.
2. Read `AGENTS.md` and current 11520 handbook/work orders.
3. Make the smallest ownership-consistent change.
4. Static/module tests.
5. Functional tests.
6. Responsive browser tests at `360, 390, 412, 432, 480` where applicable.
7. Use realistic BTC/ETH/BNB quote strings, not only short mock placeholders.
8. Test cold state and warm/persisted localStorage state.
9. Exercise utility master collapse/expand repeatedly.
10. Exercise XZ/XY/YZ and joystick thumb follow.
11. Exercise actual order preview/cancel.
12. Save screenshots.
13. AI directly inspect screenshots for overlap, clipping, detached controls, squashed art, unreadable text and blocked hit targets.
14. Repair and repeat until no known defect.
15. Exact-head CI green.
16. Merge safe change.
17. Wait for Pages deployment.
18. Verify deployed exact SHA / Pages run.
19. Open production URL and repeat visual/functional check.

Never substitute “tests pass” for screenshot inspection.

## 13. Known anti-patterns — prohibited

- Adding another high-z-index late hotfix as a permanent second layout owner.
- Using MutationObserver callbacks that mutate the same observed style/class attributes and create feedback loops.
- Moving unrelated UI when asked to fix one control.
- Treating Facebook/in-app browser as unsupported and ignoring it.
- Calling a local simulated order a real trade.
- Treating `MATCHED_UNSETTLED` as real settlement.
- Enabling real trading with only one oracle provider when policy requires independent quorum.
- Mixing physical XYZ, K-axis market semantics and wallet identity.
- Letting Temple navigation replace/reinitialize wallet identity.
- Treating old predicted deployment addresses as current live unless later receipts prove deployment.
- Treating a failed BscScan source-verification command as failed deployment.
- Asking the Human to inspect screenshots or manually relay handoff text when the system can do it.

## 14. New-page startup checklist

The next page should execute, not merely summarize:

1. Fetch latest main and compare to handbook anchor `d66b1ca1...`.
2. Read root `AGENTS.md`.
3. Read this handbook.
4. Read CURRENT Mainnet address manifest.
5. Inspect open PRs, especially #363 or its successor.
6. Verify Pages currently corresponds to the latest eligible merged UI main.
7. Re-open production 11520 and inspect at 390x844 (plus responsive widths if UI changed).
8. If UI regression is found, fix within existing ownership model; no second owner.
9. Continue oracle/provider independence work.
10. Continue wallet -> order -> position -> settlement -> receipt adapters in fail-closed mode.
11. Preserve local playable orders until the real-funds path is genuinely ready.
12. Do not execute Mainnet/protected actions without the final exact Human authorization packet.

## 15. Definition of done for this whole workstream

### Game/UI done

- Human can enter 11520 on phone/in-app browser.
- HUD is coherent across supported mobile widths.
- one utility master behaves consistently.
- XZ/XY/YZ control modes are visibly and functionally distinct.
- joystick/thumb visuals follow input.
- C/lot/remaining-axis group remains coherent.
- game, map, creatures, backpack, wallet, chat and combat controls remain usable.
- 12345/16888 return-to-universe and wallet continuity work.

### Trading done — safe engineering stage

- fixed markets have exact asset identity;
- independent oracle quorum proven;
- wallet/account + chain checks enforced;
- margin/custody/risk/position path integrated in tests;
- settlement request and receipt verification are exact/replay-safe;
- browser shows clear local-vs-real state;
- executable transaction preview is explicit and requires wallet confirmation;
- no hidden signer/broadcast path.

### Trading done — production stage

Only after Human approves the exact protected execution packet:

- required Mainnet contracts/config are deployed/connected;
- exact roles and oracle sources are live;
- funding/allowance policy is explicit;
- real transaction is user-authorized;
- receipt/finality/ownership are verified;
- trade transitions to `VERIFIED_SETTLED` only on real evidence;
- UI shows real tx/receipt state;
- emergency pause/rollback path is known and tested.

## 16. Public URL

Official site root:

`https://klineodyssey.github.io/kline-odyssey/`

11520 direct game path:

`https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`

Do not tell the Human a new change is live merely because a PR merged. Confirm Pages deployment and production behavior first.

---

Handoff directive to the next page:

**Continue autonomously from latest main. Preserve the merged responsive HUD ownership model, finish the safe oracle/real-trading readiness chain, keep 11520 playable throughout, and do not stop for redundant approval. Stop only at a genuine protected Mainnet/real-funds authority boundary, then present one exact Human decision packet.**
