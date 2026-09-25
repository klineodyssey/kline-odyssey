# KAIOS 11520 TRADING READINESS R1 — 2026-09-14

STATUS = ACTIVE
PRIORITY = P0
RISK = R1_READ_ONLY_AND_UI_WIRING_FIRST
HUMAN_AUTHORITY = 沈英明

## Objective
Make 11520 usable as one coherent product: player can enter, play, place orders, see order state, receive matched/unmatched status, and progress toward verified settlement without creating a second exchange or bypassing existing Mainnet safety/governance.

## Canonical live endpoints
- KGEN Token: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- K11520 Brain / Huaguoshan Taiwan Universal Exchange: `0xd0605F4EF10e5C1438F11AF9edc36926769239d6`
- KAIOS 11520 Exchange Settlement proxy: `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df`
- KAIOS 18888 Bank proxy: `0x11d34c0F723aCd334B8F95076f73F07f06202aab`
- KAIOS 8888 Commercial Bank proxy: `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C`
- BankGovernance / current KGEN owner: `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166`

## Product acceptance
1. 11520 entry succeeds in normal mobile browser and in-app browser paths.
2. Existing XYZ gameplay remains functional; no KX/KY/KZ semantic changes.
3. User can open the market/order surface without losing wallet identity or XYZ state.
4. User can create BUY or SELL order input with explicit quantity, price, side, and confirmation state.
5. UI clearly distinguishes `SUBMITTED`, `OPEN`, `PARTIALLY_FILLED`, `MATCHED_UNSETTLED`, `VERIFIED_SETTLED`, `CANCELLED`, `REJECTED` where supported by runtime.
6. Trading engine remains fail-closed on self-match, replay, invalid actor authority, insufficient funding evidence, stale/invalid settlement authority, or missing receipt evidence.
7. No paper match may be displayed as a completed real settlement.
8. Existing settlement proxy is the canonical KAIOS settlement endpoint; do not create a parallel settlement contract/runtime.
9. Brain remains the existing 11520 organ/runtime address; do not conflate it with the settlement proxy.
10. 12345/16888 return-to-universe and same-wallet continuity must remain intact.

## Engineering sequence
### A. Current-main inventory
- Find current 11520 order-entry UI, market runtime, matching engine, settlement request builder, actor authority adapter, receipt verifier, wallet/session continuity, and browser QA.
- Compare implemented engine states against the live 11520 Settlement ABI and canonical manifest.

### B. Safe implementation before any protected action
Implement and merge all low-risk missing pieces that do NOT send Mainnet transactions:
- complete order form/input wiring;
- validate side/price/quantity client-side and runtime-side;
- connect order submission to current matching engine;
- render order book, open orders, fills, and settlement state;
- connect read-only chain state for canonical settlement/Brain endpoints;
- build deterministic settlement request packet from a matched trade;
- implement receipt verification/read-only status surfaces;
- preserve wallet identity across 11520/12345/16888 navigation;
- preserve XYZ position and gameplay state;
- browser tests and 390x844 visual QA.

### C. Protected Mainnet boundary
Do NOT autonomously:
- grant settlement roles;
- move KGEN/KAIOS/BNB/USDT;
- approve token spend;
- fund escrow;
- submit real settlement transactions;
- use signer/private key;
- change governance/owner/admin roles;
- deploy or upgrade Mainnet contracts.

If the only remaining blockers are protected actions, produce one Human decision packet containing exact contract/address/function/value, expected state transition, gas/cost estimate, rollback/irreversibility, and evidence that all non-protected checks pass.

## Required tests
- order creation BUY/SELL
- invalid price/quantity rejection
- self-match rejection
- nonce/replay rejection
- partial and full match
- unmatched/open order persistence
- deterministic match -> settlement packet binding
- settlement receipt required before `VERIFIED_SETTLED`
- no CT/OHLC/volume promotion before verified settlement where current canon requires it
- wallet identity equality across `11520 -> 12345 -> 11520`, `11520 -> 16888 -> 11520`, `12345 <-> 16888`
- prior XYZ restored on return
- mobile 390x844 screenshot QA

## Closeout
Return exactly:

CURRENT_MAIN =
TRADING_PR =
CAN_ENTER_11520 =
CAN_PLAY_XYZ =
CAN_OPEN_ORDER_TICKET =
CAN_SUBMIT_ORDER_TO_ENGINE =
CAN_MATCH =
CAN_BUILD_SETTLEMENT_REQUEST =
CAN_VERIFY_SETTLEMENT_RECEIPT =
CAN_REAL_SETTLE_NOW =
REAL_SETTLEMENT_BLOCKERS =
WALLET_CONTINUITY =
XYZ_CONTINUITY =
FUNCTIONAL_QA =
VISUAL_QA =
PAGES_SHA =
HUMAN_ACTION_REQUIRED =

## Completion rule
Do not report `CAN_REAL_SETTLE_NOW = YES` unless exact live chain reads and receipt-capable runtime prove the complete path. A matching engine alone is not real settlement.

## 2026-09-25 Human settlement engineering continuation

Existing live endpoints above remain historical Canon and are not automatically
the candidate BrainV4/Position/Trigger deployments. Versionless organs are extended
in `codex/k11520-settlement-final-20260925`; no parallel Brain/wallet is introduced.
Local actual-stack EVM passes32 signed100C stress and12 realistic-price boundary
cases;8 local deployments and92 smoke transaction records are generated with source
hashes in `artifacts/settlement-local-evm.json`. This is Ganache1337, not Testnet.

Game existing ledger and sheets show simulation pending/fill/isolated liquidation/
receipts and five wallet accounting fields;152 tests and both canonical Chromium
viewports passed. Required exact-head CI/Pages verification is still a release gate.
`docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json` records explicit missing Testnet
public account/role/feed/gas inputs and live3-source oracle evidence. No signer,
private key, deployment, role grant, treasury or token transfer executed.
