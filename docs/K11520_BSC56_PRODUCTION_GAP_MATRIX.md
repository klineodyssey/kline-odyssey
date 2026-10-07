# K11520_BSC56_PRODUCTION_GAP_MATRIX

## Authority, scope and checkpoint

- Human decision: `BSC56_ONLY_FOR_K11520_REAL_TRADING`, 2026-10-07T03:32:30Z.
- Audited source: `f7f67950418ebbb6f7a5a309a32d529232fcb3b6` (main; includes #519 and #522). #523 Navigator remains an independent workline.
- Author: dot, temporary external engineering maintainer under the Human task; no registered GM, Reviewer, Treasury or signer authority is assumed.
- Product chain: **BNB Smart Chain Mainnet, chain ID 56**. BSC97 new product development, new trading features and new rehearsal milestones stop. Historical BSC97 tests/receipts remain intact and are **not** a production completion gate.
- This is the first source/read-only audit and bounded implementation design. It is not a release, deployment, independent security sign-off, recovered M2 `acdd`, or permission to broadcast.
- Allowed matrix states: `READY`, `PARTIAL`, `MISSING`, `CANON_CONFLICT`, `NOT_DEPLOYED`, `UNKNOWN`. `READY` is scoped to its row, never whole-product readiness.
- `NOT_DEPLOYED` below means the exact reviewed capital-isolated candidate has no recorded BSC56 deployment in the canonical manifest; it does not claim that every similarly named historical contract is absent from BSC56.

Build authority includes financial code, wallet/contract integration, unsigned transaction construction, signing UX, deterministic/local tests, security/invariant review and deployment packaging. Lack of live execution approval does not block that engineering. Live transfers, deployment, approvals, margin, orders, withdrawals and Treasury actions have not been performed.

## Source hierarchy and reconciliation

The audit began with the preserved `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`, then Boot CURRENT, company/worker/workspace rules, root and 11520 AGENTS, Physics CURRENT, active trading specification, asset/lineage manifests and existing code. Boot/Physics/token source are read-only in this checkpoint.

1. [Trading Canon](../K線西遊記/temples/11520/KGEN_TRADING_SPEC.md), revision 2026-09-30.1: section 1 P0 requires Mainnet **USD INDEX**; section 2 defines `INDEX_DELTA_C_LOTS_V1`; section 4 defines isolated capital/claimable accounting; section 7 requires verified chain/ABI/custody/receipt.
2. [Mainnet manifest](K11520_MAINNET_DEPLOYMENT_MANIFEST.json): `productV1Decision20260930` is the latest launch-scope override, retaining magnitude ceiling 1C, zero trading fee and no paid Data Streams requirement for V1. Do not resurrect 100C/paid-provider launch gates from older sections.
3. The manifest's `nonOraclePreparation20260930.precedence` already supersedes older template-only USD/USDT and missing-role/capital/cap wording. Its public role, capital and gas proposals exist, but remain unsigned/unexecuted proposals. The old top-level null fields do not erase that preparation.
4. [Physics CURRENT](physics/KGEN_Universe_Physics_Runtime_CURRENT.md), section 235: `1 KGEN = 1000 kg`, `1 KAIOS = 1 kg`. Earlier `1 KGEN = 1 kg` is explicitly superseded; it is not an unresolved scale conflict.
5. [KAIOS address manifest](../KGEN-KAIOS/KAIOS_MAINNET_GENESIS_ADDRESS_MANIFEST_CURRENT.md), sections 1–3 and 5, and [lineage CURRENT](../KGEN-KAIOS/KAIOS_MAINNET_LINEAGE_CURRENT.md) distinguish deployed Genesis, legacy Brain and candidate settlement organs. A current source file is not automatically the deployed source.

## Production gap matrix

| Item | Status | Exact evidence / existing owner | Production gap and bounded next step |
|---|---|---|---|
| BSC56 production network | READY | Human 2026-10-07 decision; manifest `CHAIN_ID=56`; `evm-wallet-runtime.mjs::KGEN_CHAIN_ID=56` | Keep chain 56 the only real-trading product network. Preserve chain97 evidence without requiring further chain97 work. |
| KGEN BSC56 identity | READY | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`; pinned live code/name/symbol/18-decimal readback below; `KGEN/contracts/KGEN_Token_V7_5_2.sol` | Identity is verified for the stated block. Recheck code, tax/exemption and actual received amounts for each final integration/funding envelope. No token redeployment. |
| KGEN ownership / authority | PARTIAL | Pinned `owner()` = `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166`; manifest section 5 identifies BankGovernance, separately from Bank Wallet `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` | A getter is not verification of the full present governance role graph. Review exact admin/upgrade/pauser/keeper routes before activation; never use an EOA label as owner evidence. |
| KAIOS BSC56 identity | READY | `0xD4E67B3a69e41524c424150E6b6e921b01D036db`; live code, KAIOS symbol, 18 decimals, immutable KGEN linkage below | Token existence does not establish K11520 margin, market or settlement semantics. |
| KAIOS standard / deployed-source match | PARTIAL | `KGEN-KAIOS/contracts/KAIOS.sol` and exact preserved Genesis source inherit `ERC20, ERC20Capped`; read-only metadata is compatible | Full fresh compiler-to-deployed-bytecode verification remains unperformed; explorer full source access returned 403 and Sourcify full-match metadata 404. Do not call metadata reads a full audit. |
| KAIOS authority | PARTIAL | Source: no `Ownable`/discretionary owner mint; live `KGEN()`, `LINGXIAO_TREASURY_18888()`, `ORGAN_REGISTRY()` match canonical links. `owner()` reverts | `owner()` reverting is unsupported getter evidence, not proof of renounced ownership. Verify current registry-authorized organ membership and exact deployed implementation before dependent actions. No Treasury authority is granted. |
| KAIOS allowed use / K11520 trading semantics | MISSING | KAIOS source supports holder transfer/allowance and specifically holder-authorized furnace burn; Life CURRENT section 8 permits lawful goods/services/markets when available. Trading Canon section 2 excludes sub-0.001C KAIOS game behavior from KGEN margin/position/PnL | `KAIOS_TRADING_SEMANTICS_CANON_GAP`: no approved KAIOS collateral, derivative lot/PnL/liquidation/oracle/settlement model was found. Do not invent KAIOS markets, equate local game credits with chain tokens, or block independent KGEN work on this gap. |
| Margin contract, exact production candidate | NOT_DEPLOYED | Existing `KGEN/contracts/KGEN_BrainExchange.sol`: `depositMargin`, `withdrawMargin`, `principalOf`, `lockedPrincipalOf`, actual-received accounting. Mainnet candidate `BRAIN_PROXY/BRAIN_IMPLEMENTATION=null`; conditional predictions explicitly `deployed=false` | Reuse Brain. Existing BSC56 Brain `0xd0605F4EF10e5C1438F11AF9edc36926769239d6` is legacy, not evidence that current capital/claimable methods are deployed. Review fresh deployment or explicit compatible migration; do not silently rebind. |
| Settlement / Position candidate | NOT_DEPLOYED | `KGEN_PositionEngine.sol`, `KGEN_MarketRiskKernel.sol`, Brain `SETTLEMENT_ROLE`; candidate `POSITION_ENGINE=null` | Position owns settlement, RiskKernel is inlined, Brain owns custody. Require Position-only settlement role and Trigger-only executor. No second settlement ledger. |
| Historical KAIOS Settlement on BSC56 | PARTIAL | `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df`; pinned EIP-1967 implementation `0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363` | Code/proxy existence is confirmed, but present ABI/authority compatibility with the KGEN derivative candidate is unverified. It must not fill the null candidate Position/Brain fields. |
| Settlement Capital / Insurance | PARTIAL | Brain `fundSettlementCapital`, `fundInsurance`, `reservePositionRisk`, `availableRiskCapacity`, `custodyReservedBalance`; manifest `nonOraclePreparation20260930.capitalCandidate` proposes 20M/5M KGEN, no transfer approval | Implementation and historical local-fork evidence exist. No live candidate pool/funding is recorded. Verify exact-source invariants and actual token deltas; do not count player deposits, claim debt or Treasury as capital. |
| Claimable / Withdraw contract | NOT_DEPLOYED | Brain `claimSettlement(bytes32)`, `settlementClaims`, `playerClaimable`, `withdrawMargin`; existing owner is Brain, not a separate Claim contract | No candidate Brain deployment. Preserve unpaid profit as debt, partial repayment to original trader principal, solvent principal exits, and no debit to unrelated players. |
| Production Oracle | PARTIAL | `KGEN_OracleSourceAdapter.sol`; Position quorum/freshness/watermarks; `real-trading-feed-provenance.mjs`; manifest `productV1Decision20260930` and `p0Resolution20260930` | Candidate sources/code and old read-only observations exist. Current approved per-axis USD sources, source independence/quality, exact configuration and expiring capability evidence are absent. Keep `NO_NEW_RISK` until verified; public USDT quotes/local simulation cannot settle real funds. V1 does not require buying paid Streams. |
| ABI / deployment binding | PARTIAL | Existing `TESTNET_EXECUTION_ABI` and `CAPITAL_EXECUTION_ABI` in `real-trading-order-intent.mjs`; compiler/export workflow and unsigned builder | Derive and verify a BSC56 ABI capability binding against exact deployed code/proxy/source hashes. Shared method signatures do not make old chain97 or legacy chain56 bytecode compatible. |
| Frontend production quote/chain binding | CANON_CONFLICT | `real-trading-market-binding.mjs` lines 7–32 bind KX/KY/KZ to BTCUSDT/ETHUSDT/BNBUSDT with chain56. Active Trading Canon section 1 and builder `validateUnsignedInput` require BTC/ETH/BNB **USD INDEX** | Separate production settlement identity from existing USDT reference/simulation identity in the existing organ. Do not relabel a USDT observation as USD, invent parity or alter the PnL formula. Legacy manifest USDT templates are already superseded, not new economic authority. |
| Wallet chain config | PARTIAL | `evm-wallet-runtime.mjs` reads KGEN on56. `createExecutionAdapter` only enables on-chain `BSC_TESTNET`; other requested modes return disabled EVM adapter | Extend the existing wallet/adapter seam with explicit chain56 identity, code/proxy verification and account/chain interruption handling. Preserve guest simulation and #519/#522/#523. Never replace `97` with `56` in historical testnet code. |
| Allowance / Approve | PARTIAL | ERC20 methods exist; current adapter checks exact spender/allowance. Manifest already proposes reset0 → exact amount → revoke0 for funding | BSC56 player preview/signing path and token/spender/session/gas exposure validation missing. Default exact allowance; no unlimited approval inference; signing is a separate wallet-owner action. |
| Orders / Fill | PARTIAL | `KGEN_OrderTriggerEngine.sol`: create, cancel, touch/cross/one-shot execution and fill receipt; current frontend lifecycle/ABI exists for simulation/history97 | Candidate Trigger address absent; BSC56 integration and exact-code/source-bound receipt recovery are missing. Revalidate range/capability at pending fill; never display local FILLED as chain settlement. |
| Positions / PnL / Liquidation | PARTIAL | Active `INDEX_DELTA_C_LOTS_V1`; Position `openCPosition`, `markPosition`, `settlementReceipt`; RiskKernel math and existing deterministic/EVM suites | Source implementation exists, but no exact BSC56 candidate deployment/Oracle/capital activation. Maintain lots KGEN principal, V1 ≤1C launch, actual accepted-price exits outside admission bounds, isolated loss and positive-profit debt. |
| Claim / Withdraw frontend | PARTIAL | Existing adapter `claim`, `withdraw`, contract-state reconciliation; Capital ABI | BSC56 wallet-owner review and verified execution/recovery path absent. A claim is debt repayment into principal, not guaranteed immediately withdrawable cash. Recheck custody and original trader. |
| Receipt / recovery | PARTIAL | Existing adapter verifies transaction identity/status/events, bounded log recovery, scoped account/chain/deployment context; simulation recovery preserved by #519 | Extend that same owner for chain56: pending/rejected/replaced/dropped/reverted/reorg/timeout, wallet switch/reload and double-click handling. Hash alone is not success; state-recovered evidence must not masquerade as confirmed transaction receipt. |
| First irreversible action / signing UX | PARTIAL | Human 2026-10-07 requirement; existing order organ now builds all eight unsigned review fields. No current chain56 live adapter or connected signing UI | Display CHAIN, WALLET, CONTRACT, FUNCTION, TOKEN, AMOUNT, EXPECTED_EFFECT, MAXIMUM_EXPOSURE; include nonce/gas/caps and calldata/manifest identity. User confirms in their wallet. Assistant does not sign/send. Construction and review may continue offline. |
| Deployment package / production QA | PARTIAL | Existing `rehearse_bsc_testnet.mjs --build-mainnet-unsigned` and `--test-mainnet-package`; `inspectMainnetUnsignedPackage`; historical source/storage/local-fork evidence | Reuse current builder, populate verified inputs only, preserve exact-head hashes and disabled new-risk state. Complete focused deterministic tests, security/invariant review and browser QA before deployment gate. BSC97 milestones are not prerequisites. |

## Pinned read-only BSC56 observations

Endpoint: `https://bsc-dataseed.bnbchain.org`; `eth_chainId=0x38`.
Block `126181251` (`0x7855f83`), hash `0x8b289a518b50a972ec5447fa7a3bace34db6d445d9b426d9b5d8c68ecff9fb7b`, timestamp `2026-10-07T03:37:25Z`.
Only code/storage/getter reads were used. No signatures or transactions.

| Contract | Runtime bytes | Runtime keccak256 | Selected readback |
|---|---:|---|---|
| KGEN | 3905 | `0x251cff271c2c754743f9eb3bc11982163fd7ca756e0b0378cb0358418ffeecc1` | `KLINE GENESIS`, `KGEN`, decimals18; owner and Bank Wallet as above |
| KAIOS | 5776 | `0x3a036ce95ac0929b247b40c9a303c2c4bfaf9aeb9bc171c009ad3532316df023` | `KAIOS Civilization Credit`, `KAIOS`, decimals18; KGEN linkage matches |
| Legacy Brain | 7864 | `0x8a9eaa449ff8e738a84994510a98358a58a07865073e6d3ae06d952c35ef0bb7` | `owner()` = `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`; no candidate compatibility claim |
| KAIOS Settlement proxy | 92 | `0x572e640425d4d6c1f70e591dec2930f8d9481f510d67a7b9577543ebaeb5dfb6` | EIP-1967 implementation = `0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363` |

KAIOS getters: `LINGXIAO_TREASURY_18888()` = `0x11d34c0F723aCd334B8F95076f73F07f06202aab`; `ORGAN_REGISTRY()` = `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D`. These are public immutable links, not permission to use them. Several guessed legacy getters reverted; later calls returned `missing trie node`, so unverified authority/getter fields remain UNKNOWN. No result was replaced with an unpinned latest read. Zero EIP-1967 slots alone do not prove all possible upgrade paths absent.

Public evidence locations: [KGEN](https://bscscan.com/address/0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be#code), [KAIOS](https://bscscan.com/address/0xD4E67B3a69e41524c424150E6b6e921b01D036db#code), [legacy Brain](https://bscscan.com/address/0xd0605F4EF10e5C1438F11AF9edc36926769239d6#code), [KAIOS Settlement](https://bscscan.com/address/0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df#code). Explorer page bodies were unavailable (403); these links identify the addresses, not a fresh verified-source claim.

## Bounded implementation design and acceptance sequence

1. **Durable audit first:** this matrix, cumulative Mainnet product-direction metadata and existing index links. Keep historical testnet manifest/receipts, contract sources and simulation unchanged. Commit, push and record SHA on the independent branch; Draft PR only.
2. **Unsigned chain56 construction in existing organs:** separate pure construction/readiness from wallet execution approval. Use `real-trading-order-intent.mjs`, `real-trading-market-binding.mjs`, `real-trading-preflight-ui.mjs` and the existing wallet bridge. Do not create another wallet, execution ledger or settlement engine. Reject missing addresses/evidence rather than borrowing historical/predicted ones.
3. **Reconcile production identity before dependent financial changes:** retain USDT public/simulation observations and introduce explicit USD-index production identity only after source-bound route reconciliation. This is not a formula change. KAIOS derivative behavior remains blocked by its named Canon gap.
4. **Deterministic security gates:** exact chain/token/target/function/ABI/calldata; zero-address and wrong-spender rejection; exact allowance/exposure; explicit integer base units; V1 C ceiling; absent/stale Oracle capability; account/chain changes; idempotency and pending wallet lease; receipt/log/state identity; no signature/provider/broadcast during construction.
5. **Reuse candidate contracts:** compile pinned compiler/dependencies; verify source hashes/storage layout and role graph; run existing risk, Brain, Position, Trigger, claim and custody invariants locally. Conservation must separate Principal, Reward liability, Insurance, free Settlement Capital, Reserved Settlement Liability and unfunded Player Claimable. No player principal is funding for others' profits. No Treasury path is exercised.
6. **Production QA preparation:** same-SHA mobile portrait/landscape browser screenshots, reviewed actual rendered UI, explicit `FUNCTIONAL_QA` and `VISUAL_QA`; wrong chain, rejection, cancellation, refresh/account switch and receipt recovery. No testnet milestone is required. Heavy suites run serially when coordinated with other active work.
7. **BSC56 deployment gate:** exact-source package, concrete approved role routes, code/ABI/Oracle/readback/risk/capital/exposure checks and Human wallet-owner confirmation for the first irreversible action. Missing production deployment does not redirect work to BSC97. A reviewed package does not itself authorize an on-chain action.

## Checkpoint boundaries

- Runtime code changes: none in this first checkpoint.
- Solidity/deployment/transaction/signature/Treasury changes: none.
- Fresh functional/browser/security suite: not run for this documentation-only checkpoint; historical test reports are not relabelled as fresh PASS.
- Boot CURRENT registration is deferred under its protected-edit rule; existing README and both KGEN indexes expose this candidate. No Boot or Physics Canon rewrite is needed to analyze/build the authorized BSC56 product.
- Source lineage is the pinned main plus its preserved ancestors. No missing M2 delta was reconstructed or claimed recovered.

## Checkpoint 2 — pure unsigned custody review

First durable audit SHA: `8886aa1fb9956e6abd5d7477b6357a68d573c3ba`, Draft PR #524.

`real-trading-order-intent.mjs::buildBsc56UnsignedCustodyReview` now constructs
unsigned KGEN approve/revoke, depositMargin, withdrawMargin and claimSettlement
review envelopes in the existing owner. It has no provider/signing/broadcast path
and never makes an execution adapter ready. Missing or proposed deployment
bindings return a review proposal with null contract/transaction; no address is
guessed. A digest-pinned deployed-binding input, exact ABI digest, account/nonce,
source/code/readback hashes, chain56, canonical KGEN and explicit gas cap are
required for calldata construction. Binding inputs remain assertions requiring
fresh independent chain verification before any wallet action. A digest alone is
not proof of deployment, source identity, custody or permission.

Amounts are decimal uint strings only. No float amount conversion or unlimited
approval is supported. Exact target/spender and the eight required Human review
fields are present; claim amounts remain contract state and repayment is not
mislabelled a wallet withdrawal. The pure builder is deterministic, not a nonce
ledger: live replay protection still requires a fresh wallet nonce and confirmation.

Focused local validation: 68/68 existing order-intent tests passed, including
eight new chain56 unsigned-review tests and the 60 unchanged prior tests.
No new BSC97 features or milestones were added; retained tests are regressions.
This does not establish live execution, browser signing UX, fresh full EVM/security
review, Oracle/capital readiness or product completion. No DOM/UI wiring changed.

### Checkpoint 3 hardening

The builder requires a digest-bound current allowance for approve/revoke, refuses
nonzero-to-nonzero replacement until a confirmed reset/readback and discloses
that old allowance may be spent before revocation mines. uint inputs have a
bounded 78-character decimal representation before BigInt parsing. Focused
order-intent tests now pass 69/69 (nine BSC56 cases, 60 retained regressions).
The output explicitly labels binding evidence as input metadata, not verified
chain facts, and transactions as ethers-style unsigned review fields, not raw
EIP-1193 JSON-RPC requests. Future wallet integration must validate and convert
quantity encoding at its separate boundary; no direct-send path exists here.
Runtime metadata and the existing 11520 CHANGELOG register this scoped addition.

### Checkpoint 4 — binding snapshot integrity

Independent scoped review of `83cc73268fcf7ee1d514a0e736a37985515c44a2`
found an accessor-bearing input could change its Brain address between hashing
and construction. Execution remained disabled, but the unsigned target was not
bound to the reported digest. The helper now takes one bounded plain-data
snapshot of all used input fields and deployment metadata before hashing or
construction. Accessors and serialization hooks are rejected without invocation;
cycles, nonplain data, symbols and sparse arrays are rejected. Limits are depth8,
256 visited nodes, 16384 accounted UTF-8 bytes, 1024 characters per string,
32 object fields and 64 array entries. Browser JavaScript cannot reliably detect
every transparent Proxy, so all construction uses the captured descriptors and
never re-reads original input after snapshotting.

Red/green proof: the exact published pre-fix runtime blob
`d7fdd01f46d37686f725b9f182ccb78e6b7cae19` passes 73 and fails the three new
accessor/mutation/resource-budget regressions. Corrected source passes 76/76
(72 order-intent plus four unchanged binding tests); an independent focused
review reran the same suites successfully. This is scoped helper review, not
full deployed-contract, Oracle or production security certification. No signer,
provider, transaction broadcast or UI activation was added.

## BSC56 CI boundary candidate

The existing Trading Readiness workflow retains every local contract, custody,
accounting, Oracle guard, unsigned-package and local-browser regression. The
public `m1-readonly-wallet` chain97 job becomes manual opt-in only via
`workflow_dispatch.include_historical_bsc97`; its implementation and historical
artifacts are preserved, and it cannot gate normal BSC56 pull requests.

The new `bsc56-readonly-binding` job checks the exact PR head and uses the existing
wallet-foundation test file. One fresh-head batch and one ten-read batch use
twelve read-only RPC methods total, bounded by two HTTP requests and per-request
time/response-size limits. State calls use the same canonical block hash under
[EIP-1898](https://eips.ethereum.org/EIPS/eip-1898); the block number/hash and chain
are rechecked. No automatic retry or fallback to latest is allowed.

The probe verifies canonical KGEN address, expected runtime code hash, decimals,
name and symbol, records the owner getter and the EIP-1967 implementation/admin/beacon slots, and binds the evidence to the
committed manifest and token-source SHA. It does not recompile the token to prove
source-to-bytecode correspondence, certify the candidate Brain/Position/Trigger,
or authorize signing. Unknown RPC/ABI/block/source conditions remain UNKNOWN
and fail the required job; missing code and identity conflicts are distinct.

Endpoint is the fixed public credential-free BNB RPC; no secret discovery, key,
signer, wallet connection, transaction or Treasury access is used. A PR event
runs the public probe once; its duplicate branch-push run is skipped. Full local
144-test validation and YAML boundary checks passed. A bounded local candidate
probe observed matching KGEN identity at block `0x78589d7`, hash
`0x04b38ce62988c26a1859974356953182d9369fe91508413ea00240f02c119f00`;
that pre-publication run is RPC/identity capability evidence only, not an
exact-head CI result. Final committed source binding must be established by CI.

## Inline review UI candidate

The existing preflight owner now hosts a blocked eight-field unsigned review in
the existing wallet panel. Deployment/readback context is absent on the actual
page, so construction remains blocked and the contract/exposure rows remain
UNKNOWN. Deterministic fixtures cover complete input-only review; they are not
live deployment evidence. All prior matrix classifications stay unchanged.

Account/chain/session/action/input/source/binding/block/nonce/gas/allowance changes
invalidate old fields; close/reopen, disposal and late results cannot restore
stale content. No signing, broadcast, wallet mode selection or simulation write
is introduced. Local focused checks pass 178/178. Actual-entry Chromium checks
have been added, but browser execution and screenshot inspection are pending at
this source checkpoint: NOT_RELEASEABLE. The preceding `5351051b` checkpoint's
five PR workflows passed, including identity-only chain56 evidence and preserved
simulation regression; that result does not certify this newer UI increment.
