# KAIOS-11520-WARP-INDEX-V1 Handoff

STATUS: REVIEW_FIRST
OWNER: UNASSIGNED / HUMAN_OR_GOVERNANCE_DESIGNATION_REQUIRED
REVIEWER: DISTINCT_INDEPENDENT_REVIEW_REQUIRED
BRANCH: sol/11520-kaios-warp-index-v1
MAINNET_WRITE: NO
DEPLOYMENT: NO
MERGE: NO
PAYMENT: NO

## Branch-reported product direction (authority unverified)

11520 remains one Universal Exchange project; do not create a second exchange stack. KAIOS is the civilization settlement / player margin unit for the proposed index-game layer. A player chooses an external/reference index, warp speed C, LONG or SHORT, and the local candidate applies `1 index point = 1 KAIOS × C` for PnL. Requested market families include BTC/USDT, BTC/BNB, BTC/WBNB, BTC/KGEN and BTC/KAIOS, with future commodities such as gold and oil following the same oracle/index adapter principle.

## Delivered candidate

- `K線西遊記/temples/11520/modules/kaios-warp-index-market.mjs`
  - reusable 11520 domain module
  - 1 index point = 1 KAIOS at 1C
  - configurable warp C
  - LONG / SHORT
  - collateral reservation
  - equity / available margin
  - liquidation index
  - maximum position loss bounded by that position's collateral
  - local append-only events
  - no signer / no chain write
- `K線西遊記/temples/11520/warp-index.html`
  - playable review page inside the existing 11520 project
  - BTC/USDT and BNB/USDT public reference ticker fetch
  - derived BTC/BNB and BTC/WBNB reference indexes
  - explicit no-fabrication state for BTC/KGEN when verified KGEN quote is insufficient
  - WalletConnect v2 reuses the existing K-Line Odyssey Project ID already used by 12345/16888
  - injected-wallet support
  - immediate local LONG/SHORT fills for review play
  - local collateral deposit only, clearly labelled non-chain
  - close-position and live PnL display
- existing `11520/index.html` gains a direct KAIOS Warp Index PLAY entry; existing `app.mjs` remains untouched.
- `tests/11520-kaios-warp-index-market.test.mjs` covers PnL, leverage, liquidation, collateral bounds, open/close and requested symbol registry.
- Universal Exchange workflow runs the new test and validates 11520 modules.

## Existing BrainExchange finding

The old `KGEN_BrainExchange_V3_2_0.sol` declares `brainCapacityWhole = 50_000_000`. This is only a UI / warning capacity field in that contract; the source comment explicitly says it does not hard-revert deposits at the capacity. Its actual historical margin pool is KGEN staking (`depositMargin` / `withdrawMargin`) and profit-share accounting, not the new KAIOS player-margin engine.

Do not silently reinterpret the old 50,000,000 KGEN display capacity as a new KAIOS solvency guarantee or as an enforced vault cap.

## Existing chain system to preserve

Historical live records identify the older Brain 11520, TempleHeart 12345 and MarsSeats 108000 contracts. The current 11520 architecture also records a separate Universal Exchange Settlement proxy as mainnet live while its frontend/domain adapter remains unintegrated. BrainExchange must not be relabelled as the Universal Exchange settlement proxy.

## New conversion requirement requiring GM / Canon review

The branch reports a gameplay/economy proposal where Heart lamp / wish state may affect a KGEN→KAIOS conversion (described as `1 KGEN = 500` without wish and `1 KGEN = 800` with wish), and an alternate mobile ATM / UFO KAIOS exchange route. The proposal's Human or governance authority is not bound by repository evidence at this head.

This handoff DOES NOT implement those rates because current repository Canon separately records the KGEN→KAIOS White Hole mechanism as `1 actually destroyed KGEN -> 1,000 KAIOS settled to 18888`, not an ordinary DEX price. The 500/800 proposal therefore requires explicit reconciliation with TempleHeart behavior, KAIOS conservation, 18888 settlement, and the intended ATM/UFO custody model before any code or Mainnet adapter is changed.

## Production blockers

1. 11520 Settlement proxy ABI / implementation / ownership must be independently re-read and its application adapter integrated.
2. Define a real KAIOS player margin vault: deposit receipt, per-player balance, withdrawal, nonce/replay protection, pause/recovery and solvency invariant.
3. Decide counterparty / loss destination / insurance fund. Local candidate currently bounds loss to posted position collateral; it does not mint KAIOS winnings or create debt.
4. Freeze oracle policy: source allowlist, staleness, deviation/circuit-breaker, decimal normalization and fallback. External reference prices may not masquerade as 11520-native settled trades.
5. Decide the exact semantics of BTC/KAIOS. KAIOS is currently the PnL/settlement unit; no fabricated spot BTC/KAIOS market price is introduced.
6. Reconcile 500/800 Heart conversion proposal with existing White Hole 1:1000 Canon before implementation.
7. Distinct reviewer must verify UI, tests, wallet boundaries and no protected-path/chain-write escalation.

## Requested GM decision

REVIEW_FIRST. If accepted, promote the existing 11520 project with a bounded next WorkOrder for `KAIOS Margin Vault + Settlement Adapter`, reusing the deployed 11520 Settlement proxy where technically valid. Do not create a second exchange codebase or deploy a replacement contract before verifying the existing proxy.
