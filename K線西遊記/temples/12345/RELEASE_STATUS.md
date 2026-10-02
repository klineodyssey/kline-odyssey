# 12345 悟空財神殿 Release Status

STATUS: LIVE FRONTEND RELEASE CANDIDATE
RELEASE: V10.50.0
DATE: 2026-08-09 (UTC+8)

## Integrated mainline

### Festival / New Year recovery candidate — 2026-10-02 (Draft; no deployment)

- Human now confirms Wish / Repay / Light Lamp / Heartbeat **real-device PASS**. This supersedes the earlier failure report below, without changing those four handlers, wallet architecture, layout or #467 shortcut authority.
- Separate Festival candidate is stacked on #470 (`c3d9f70b16aa9c01efaaff90f1018d91dd32ba50`); main baseline remains `b890a1674b2329f176a9cd189870a085e33ddd0e`. #468 stays frozen Draft; #469 and #470 remain separate Drafts. No merge or public release is claimed.
- Active authority: `modules/runtime-main.js` `CountdownRuntime` observes time/state; existing `HeartRuntime.bindButtons` → `sendHeart` → original V3.2.6 Contract signs only after the player's confirmation. The six existing Heart/More Festival listeners were already present; IDs 1/2 were historically correct. The unreferenced `modules/runtime-festival-engine.js` is legacy metadata, not a second active Festival engine, and is untouched.
- Verified defects: the former countdown used browser-local dates, but eligibility labels used hard-coded UTC ranges; configurable live windows and per-address claim records were not read. Normal date/window reverts were only reported in a remote Heart/global log, not beside the Festival drawer button. Thus today's legitimate closed-window rejection could look like an inert action. This is not evidence of a broken signer or ABI.
- Source authority: `KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol`, `festivalClaim`, `newYearCountdownClaim`, `currentUtcDate`, `timeOfDaySeconds`, `currentMinuteIndexOfDay`. Mainnet read-only observation at BSC56 block **125277216**, timestamp **1790937258** (`2026-10-02T10:34:18Z`), Heart `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972`: both features enabled; Festival start/end **0/600**; New Year start/end **85800/86400**; `configLocked=false`. `eth_call` returned `FESTIVAL_WINDOW` / `NY_WINDOW`, with no signing or broadcast.
- **5/20 = festivalId 1**, **11/11 = festivalId 2**. Current window is UTC 00:00:00 through **00:10:00 inclusive** on each named date (Taiwan 08:00:00–08:10:00). Once per ID / UTC year / address. Current default rewards are 5.2 / 11.1 KGEN; reward funding remains the contract's authority, not a frontend guarantee.
- New Year current window: UTC **12/31 23:50:00 inclusive to 1/1 00:00:00 exclusive** (Taiwan **1/1 07:50:00–08:00:00**). Once per UTC year / address / minute slot, ten slots, not once for the entire event. The contract also bounds slots to the first ten minute indices even if a configured start is not minute-aligned. These claims transfer rewards from Heart; no token allowance is required. No automatic claim is added.
- The observer reads settings and claim records at one block tag, rejects wallet-response races/read failure, retains the first-seen clock anchor for an unchanged RPC head, and expires observation freshness after 30 seconds. The existing one-second clock renders UTC/Taiwan next-open time and transitions without reload; periodic reads refresh live rules. Submission rechecks the **accepted block timestamp**, never a client-clock projection. Contract validation/revert remains final.
- Six existing buttons receive local Chinese status/feedback: not open, disabled, wallet required, claimed, ready, wrong window, cancelled, contract failure or data unavailable. Receipt confirmation refreshes claim state. No duplicate panel/ABI/transaction helper is introduced; optional hooks in the existing sender are used only by Festival actions. Detailed status stays inside the original scrolling Heart/dialog.
- QA: injected UTC clock boundaries for May/November before/inside/inclusive end/after; Taiwan-midnight mismatch; December 31/January 1; configurable windows and non-aligned New Year slots; automatic timer open/close, next-minute claim scope, frozen RPC, failed reads, disabled event, rejected transaction and revert. Actual original Contract calldata reaches only a stubbed final signer boundary: `festivalClaim(1)`, `festivalClaim(2)`, `newYearCountdownClaim()` exactly once. All six original buttons, duplicate blocking, wallet/chain gates, unchanged Wish/Vow/Lamp/Heartbeat control group and stable closed-world geometry are tested in Chromium 390×844 / 844×390 with different browser timezones. Screenshots and reports are CI artifacts, not proof of a real future-date Mainnet claim.
- **MAINNET_TX_SENT_BY_AUTOMATION = NO**. No source deployment, chain-time change, approval, token transfer, oracle purchase or 16888 modification. Draft second review is required before publication; actual future-window mobile claims are not falsely certified by these deterministic tests.

### Heart action recovery candidate — 2026-10-02 (not a Mainnet execution)

- Baseline: `b890a1674b2329f176a9cd189870a085e33ddd0e` / #467. Human Android + MetaMask evidence: balances and Heartbeat PASS; Wish, Vow, Lamp FAIL. This candidate does not claim physical-device recovery or public deployment.
- Traced active authority: `modules/runtime-main.js` → `HeartRuntime.bindButtons` → `sendHeart` → original ethers V3.2.6 Contract. All four buttons have one capture click listener on the baseline; no duplicate IDs or `dataset.kgenBound` failure reproduced. #467 shortcuts retain canonical forms; they never submit a transaction.
- **Verified common feedback defect:** on 390×844, after Wish submission the only Heart log was at y=883–936, outside the viewport. Input validation happened inside the transaction runner, after wallet requests and confirmation. A rejection, validation failure or estimation revert could therefore appear as “nothing happened.” No captured Human-device trace establishes the complete cause of all three missing wallet prompts; that remains a real-device verification requirement, not a presumed wallet outage.
- Form-local, aria-live feedback now uses the existing StatusRuntime/Heart log, with immediate pending state, strict input validation before wallet requests, explicit cancellation/revert feedback, and a per-button in-flight guard. It scrolls only within the existing open Heart form. Detailed action messages do not expand the compact global HUD status. No new panel, wallet, ABI authority, transaction sender or layout engine.
- Wish: UTF-8 keccak256 / nonzero bytes32 only; no KGEN or approval. Vow: positive whole KGEN amount; Lamp: integer days 1–3650, cost = live `lampPricePerDay × days`. Token balance/allowance are read before these two paid actions; insufficient approval selects the original Approve target and displays instructions, never auto-approves. Existing `ApproveRuntime.approveSlot` reads the live lamp price as well (not an assumed one-KGEN price).
- Mainnet **read-only** audit at BSC56 block **125271658**: Heart `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972`, code length 15110 bytes; `kgen()` = `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`; `lampPricePerDay()` = 1. `eth_call(makeWish(hash))` returned `0x`; `vowTo(1,0)` reverted `AMOUNT_ZERO`; `lightLamp(0)` reverted `DAYS_BAD`. No wallet connected and no signing/broadcast in this audit. Human's actual allowance/balance was not inferred or certified.
- Source audit `KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol`: `makeWish` emits a hash event only; `vowTo` and `lightLamp` use KGEN `safeTransferFrom` in scaled token units. These three functions have no cooldown or paused gate in this source; Heartbeat has its separate cooldown and pays out of Heart funds. Existing non-proxy Mainnet V3.2.6 remains **NO-GO for direct UUPS upgrade**; historical “proxy” wording below is not upgrade authority.
- QA: `node tests/kaios-world-audio-browser.mjs --heart-only` keeps `sendHeart`, `ensureConnected`, confirmation and the actual active ethers ABI intact. Only final `JsonRpcSigner.sendTransaction` is stubbed; EIP-1193/read responses are explicit fixtures and all network RPC writes are blocked. It decodes exactly one Wish/Heartbeat/Vow/Lamp call, and tests empty/invalid input, zero hash, missing option, insufficient KGEN/allowance, changing lamp price, RPC failure, user cancellation, revert, repeat-tap protection and ten form cycles at 390×844 / 844×390. Screenshots/reports are retained in Portal QA CI artifacts. `--layout-only` and the full suite retain six viewport composition checks.
- #468 remains Draft/frozen; #469 remains separate Draft wallet work. No 16888, deeplink, provider/signer architecture, BSC switching or Heartbeat action changes. Optional WalletConnect CDN `process is not defined` remains separate and is not certified by these injected-wallet tests.
- **Release gate:** Draft PR → exact-head CI and screenshot review → Human Android/MetaMask confirmation. Do not report “all Heart actions real-device PASS” from transaction stubs. Automation sends no Mainnet transactions, approvals, KGEN transfers or payouts.

### Mobile presentation build 20261002-MOBILE-LAND-UTILITY

- Responsive viewport with stable closed HUD; existing Land organ views move into one bounded, internally scrolling native dialog (no cloned land ledger).
- One canonical Portal icon plus shared audio control, each 44px. AI and Festival details use native modal layers; Heart remains bounded and closable after rotation.
- Existing diagnostic/chart content remains accessible inside Heart. No Heart/Land/Warp/Wallet transaction authority changes.
- Browser regression is part of `tests/kaios-world-audio-browser.mjs`: 360/390/412/432/480 portrait, 844×390 landscape, repeated modal/rotation cycles, actual pointer reachability and screenshots.
- Known pre-existing optional WalletConnect 2.12.2 CDN bundle error: `process is not defined`. This UI release does not certify WalletConnect or Mainnet upgrade readiness; injected-wallet and chain transaction paths are not rewritten.
- V3.4 source/testnet evidence does not activate Mainnet behavior. The V3.2.6-compatible frontend boundary below remains unchanged.

- PR #129 merged to `main` at `66088f3a09e3a68df3027a877e122514ab829d52`.
- Canonical lineage: `1 KGEN burn -> 1000 KAIOS -> 1000 KUFO per KAIOS burn -> 1000 KSHIP per KUFO burn`.
- TempleHeart implementation target: `KGEN_TempleHeart_Upgradeable` V3.3.2.
- 12345 frontend release: V10.50.0.

## Important chain boundary

The GitHub Pages frontend release and the BSC UUPS proxy upgrade are separate operations.

This release does **not** pretend that the existing 12345 Heart proxy has already been upgraded on-chain. The frontend keeps the existing V3.2.6-compatible transaction path until a separately signed, verified BSC UUPS upgrade transaction is completed. The bootstrap displays/probes the live Heart status and clearly distinguishes frontend readiness from chain activation.

## Preserved

- Current 12345 layout and existing UI repairs.
- Existing BSC Heart proxy address.
- Existing wallet bridge and V3.2.6-compatible write path until chain upgrade.
- `bull-front.png`, `bear-rear.png`, `heart.png`, `warp-core.png` asset paths.

## Next on-chain gate

Before activating V3.3.2 write behavior in production: production-equivalent proxy rehearsal, final implementation address verification, upgrader/governance signer verification, BSC transaction signing, post-upgrade `version()`/storage checks, and transaction-function smoke tests.
