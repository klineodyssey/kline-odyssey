# KAIOS Civilization Circulatory Runtime — Multi-Worker Handoff Handbook

STATUS: DESIGN_AND_HANDOFF_AUTHORITY / NOT_DEPLOYED
VERSION: V1.4
DATE: 2026-08-27 Asia/Taipei
PURPOSE: durable handoff source so Human, AI, Codex, ChatGPT pages, workers, reviewers and future digital lives can resume work without reconstructing decisions from chat history.

> This handbook records deployed facts, current design Canon, implementation candidates, superseded history and open review items separately. It does not authorize deployment, governance execution, payment, burn, token transfer or any chain transaction.

## 0. Resume protocol

Every worker taking over this task MUST:

1. Read this file before coding.
2. Fetch latest `main`; never assume a remembered SHA is current.
3. Read PR #136 exact Phase 2 deployed-evidence lineage at `00c79b380ce094c17d75697f360820c4d2035071`.
4. Read PR #152 exact design-only Canon correction at `672ab4884e8cf6f9d07c176a862fb858cafe8161`.
5. Read PR #158 exact current implementation candidate from its live Draft head; never reuse the historical `e679a71...` snapshot as current evidence.
6. Read PR #160 Mainnet provenance reconciliation before closeout of #135/#136.
7. Preserve deployed evidence as history. Never rewrite later design as if already deployed.
8. Re-run exact-head CI after every semantic code change.
9. Stop on ambiguity involving custody, governance, beneficiary routing, mass conservation or chain-time conversion.

## 1. Authority labels

Every rule MUST be classified as one of:

- `DEPLOYED_FACT`: proven by exact source/evidence and chain record.
- `CURRENT_DESIGN_CANON`: current Human-approved design direction; not necessarily deployed.
- `IMPLEMENTED_REVIEW_CANDIDATE`: code exists on a Draft/review branch but is not deployed/current.
- `HISTORICAL_SUPERSEDED`: preserved history; not active design law.
- `OPEN_REVIEW`: unresolved; fail closed.

Do not collapse these categories.

## 2. Civilization mass ladder

Current design mass scale:

- 1 KGEN = 1000 kg.
- 1 KAIOS = 1 kg.
- 1 KUFO = 1 g.
- 1 KSHIP = 1 mg.

For exactly representable amounts under the Human-frozen fresh-contribution Canon:

- required KGEN catalyst = KAIOS / 1000.
- KUFO entitlement lineage = KAIOS × 1000.
- KSHIP lifetime ceiling = KUFO × 1000.

5M example:

- 5,000,000 KAIOS = 5,000,000 kg feedstock.
- equal-mass catalyst = 5,000 KGEN = 5,000,000 kg.
- KUFO lineage target = 5,000,000,000 KUFO.

KGEN is the equal-mass civilization contribution. It is not burned and is not converted into KUFO. Under the current fresh-contribution Canon it goes directly to an immutable catalyst bank, never enters furnace escrow and is not returned after a successful atomic delivery.

## 3. 18911 alchemy chronology

Historical/repository V1 furnace semantics use 49 Epoch maturity.

PR #158 adds KGEN catalyst escrow but still uses 49 Alchemy Epochs before proof consumption.

The former proposed two-stage chronology was:

```text
49 Epoch REVIEW
+81 Epoch CATALYSIS
=130 Epoch TOTAL
```

This 49+81 waiting model is `HISTORICAL_SUPERSEDED`. It must not be described as CURRENT and must not be implemented by simply changing a single wait constant to 130.

Current Human-frozen successor design is:

```text
holder
-> successor K18911
-> exact KGEN contribution transferred directly to immutable catalystBank
-> exact catalyst-bank balance delta verified
-> existing deployed KAIOS ABI burns the authorized KAIOS
-> K511111 releases
-> KUFO is minted immediately to the beneficiary fixed at transaction entry
```

Current rules:

- minimum = 1 KAIOS;
- required KGEN contribution = KAIOS / 1000, exactly representable or fail closed;
- 130 days is the maximum freshness window for eligible KGEN contribution evidence, not a KUFO delivery delay;
- exactly day 130 remains valid; one second later is expired;
- delivery delay = 0;
- any failed step atomically reverts;
- cancellation after success is not applicable;
- refund is not applicable because no furnace KGEN escrow exists;
- KUFO decay begins at its actual mint timestamp;
- the alternate 0.10% KGEN bank-tax credit route remains `DESIGN_ONLY_DISABLED` until indexer, attester, root and budget Canon are frozen.

PR #158 remains an `IMPLEMENTED_REVIEW_CANDIDATE`, not deployment evidence. The production catalyst-bank address and KUFO `halfLifeSeconds` remain unfrozen deployment blockers.

## 4. 18888 service and 18911 alchemy separation

PR #136 deployed V1 history includes CelestialEligibility requiring a single formal 18911 burn proof >= 5M KAIOS.

PR #152 is the newer design correction:

- 18888 celestial-service path uses a non-burning 5M KAIOS Civilization Performance Bond plus evidence/review/governance.
- 18911 is a separate voluntary permanent KAIOS alchemy burn path.
- a 18911 proof must not satisfy 18888 celestial-service eligibility in the corrected future design.
- a 18888 performance bond must not substitute for 18911 alchemy.

Therefore #136 behavior remains `DEPLOYED_V1_HISTORY`; future product semantics follow #152 unless Human Canon supersedes it again.

## 5. K1852 Galactic Bank / communication satellite candidate

Historical deployed contract identity:

`KGEN_GalacticBank_V7_5_2 = 0xfc522243e988a837700CaD600D6f030f5932681F`

Existing Solidity capability is limited to ERC-20 deposit, native deposit, deposit events, owner-only ERC-20 withdrawal and owner-only native withdrawal.

It does NOT currently implement automatic 18911 routing, 18888 routing, Life binding, catalyst tickets, proof binding, automatic catalyst return or satellite communication semantics.

Current design direction:

- civilization point K1852 = artificial-satellite / white-hole communication-relay role;
- investigate the Galactic Bank identity as the KGEN catalyst communication/intermediary organ;
- normal autonomous operation must not depend on arbitrary manual owner withdrawal.

This is `CURRENT_DESIGN_CANON / IMPLEMENTATION_PENDING`, not deployed functionality.

## 6. K1852 contribution-proof boundary

Do NOT modify historical V7.5.2 deployment and pretend new methods already exist there.

K1852 routing remains `DESIGN_ONLY_UNFROZEN`. The existing GalacticBank cannot be represented as a live relay or automatic return organ. Under the current fresh-contribution Canon, a future proof/indexer adapter would establish a recent bank contribution; it would not create a returnable furnace escrow.

Minimum ticket fields:

```text
contributionProofId
lifeId
originalContributor
beneficiary
kaiosAmount
requiredKgenContribution
sourcePoint
furnacePoint=18911
contributionTimestamp
freshnessExpiresAt
bankReceiptEvidence
alchemyProofId
status
proofConsumed
```

Mandatory invariants:

- proof replay impossible;
- exact KGEN balance delta checked;
- no fee-on-transfer ambiguity;
- no arbitrary beneficiary replacement;
- original contributor preserved even if a relay submits the call;
- KGEN total supply unchanged by contribution;
- 18888, payroll and trading treasury cannot spend the bank contribution;
- 18911 cannot consume another Life/proof ticket;
- no execution while the route is `DESIGN_ONLY_DISABLED`.

## 7. Genesis organs and addresses

Historical identities:

- KGEN Token: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`.
- KGEN Galactic Bank V7.5.2 / proposed K1852 identity: `0xfc522243e988a837700CaD600D6f030f5932681F`.
- KGEN Genesis Inscription V7.5.2: `0x15fb2A5463F7873EC328BF6f2E85A115adcC3457`.
- Genesis deployer: `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`.
- Mother: `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`.
- historical KGEN bank receiver: `0xFA4d34c46e86058e672936fa03cfd79F4C7A4b3c`.
- LP owner / AutoLP: `0xE87F6975Fa3d4F3D56Dce49fc978884285A3eD85`.
- Reward: `0x0Fd21cf643211d067A18A416DA219827dA26E288`.
- Cold Mother: `0x3b19c226fbfcde67933bc96d2cff513aab413cc2`.
- Testnet deployer: `0x3a909988e4d5c9c2326a7a0596714482ab25ee0a`.
- 花果山台灣: `0xB73D6716005B37BEC742D64482fA26033eE1A4E1`.
- KUFO historical/civilization address supplied by Human: `0xef83804c264B47378FCf150086943B53fB90A90b`.
- KGEN LP: `0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`.

Address labels do not themselves prove present ownership or authority. Verify current evidence before any future transaction design.

## 8. Genesis physics interpretation

Project Canon direction:

- Genesis / Big Bang initial state records mass, addresses, allocations and time.
- It does not imply that physical space/distance already existed as a linear mapping between contract addresses or point IDs.
- civilization map identities such as K1852/K18888/K18911 are later semantic coordinates.
- point identity is not automatically SI distance.
- never derive kilometers from an address or point number without a separately frozen distance function.

## 9. Historical KGEN tax blood vessel

Genesis historical bank receiver was `0xFA4d...`.

Phase 2 Stage 2C-1 evidence records an authorized KGEN `setTaxWallets` execution that changed only the existing 0.10% bank receiver to Reserve Redemption proxy `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE`; Reward and AutoLP destinations and tax rates remained unchanged.

This redirect does NOT mean Reserve Redemption is enabled. Stage 2C-1 evidence records it as LIVE_INACTIVE / redemption disabled / zero redemptions at that snapshot.

## 10. Civilization circulatory runtime target

Every autonomous Life/person/organ must eventually have:

```text
LifeID
species/class
pointId
wallet/beneficiary
organ/workplace
job/duty
work authorization
asset permissions
salary/reward policy reference
runtime heartbeat
last verified evidence
```

No chat page is authority for a Life's current job state. Durable repository/chain evidence is authority according to its label.

Target blood-flow model:

```text
WORK / CONTRIBUTION / AUTHORIZED ECONOMIC EVENT
-> verifiable event
-> accounting classification
-> KAIOS liability or funded payment eligibility
-> fixed-beneficiary settlement route
-> receipt / ledger evidence
-> next heartbeat state
```

KAIOS is the civilization blood metaphor and accounting/mass asset. The metaphor never bypasses ERC-20 ownership, allowance, governance, budget or beneficiary controls.

## 11. Flow classes that must not be mixed

Maintain separate ledgers/routes for:

1. `REFUNDABLE_PRINCIPAL` — 18888 performance bonds.
2. `CLAIMABLE_SALARY` — matured service salary.
3. `FUNDED_SALARY_BUDGET` — approved payroll funding.
4. `CLAIMABLE_RESOURCE_REWARD` — verified reward liabilities.
5. `FUNDED_RESOURCE_REWARD_POOL` — funded reward capital.
6. `KGEN_RESERVE` — existing KGEN reserve/tax accumulation.
7. `KGEN_CATALYST_ESCROW` — historical/candidate escrow classification only; current fresh path must keep this at zero because KGEN goes directly to the immutable catalyst bank.
8. `ALCHEMY_BURNED_KAIOS` — permanently destroyed KAIOS; never refundable principal.
9. `KUFO_LINEAGE` — post-alchemy entitlement/mass lineage.
10. `KSHIP_PROPULSION` — decay-derived transport fuel lineage.
11. `TRADING_TREASURY` — the only account class that a future trading policy may authorize.
12. `TRADING_REALIZED_PNL` — receipt-backed realized result; never inferred from a quote or paper trade.

Cross-spending is prohibited unless an explicit future Canon and implementation authorizes it.

## 12. Autonomous work / circulation safety boundary

"Proactive blood flow" does NOT mean an AI may freely transfer assets.

Autonomous settlement requires ALL of:

- independently verifiable work/duty event;
- pre-authorized policy;
- funded budget;
- deterministic amount;
- pre-bound beneficiary;
- replay protection;
- cap/rate/epoch checks;
- explicit signer/contract authority;
- simulation/fork checks where required;
- no Human-only approval boundary crossed.

Otherwise the worker emits a candidate/request/evidence record and does not transfer.

## 13. Safe civilization autopilot V1 implementation

Status: `IMPLEMENTED_REVIEW_CANDIDATE / LOCAL_PAPER_ONLY / NOT_DEPLOYED`.

The shared implementation extends existing organs instead of creating one engine per Life:

- `core/permissions/index.mjs` — capability grants and revocation/expiry/Life/worker checks.
- `core/market/index.mjs` — normalized rational quotes, route discovery, full-cost CFO calculation, Policy Box and paper candidates.
- `core/jobs/index.mjs` — Life/role registry projection, priority queue, idempotent heartbeat, evidence and worker handoff.
- `core/accounting/index.mjs` — circulatory account classes, fund segregation, settlement candidates, fresh-contribution validator and disabled K1852 proof candidate.
- `tests/universal-exchange.test.mjs` — unit, integration, deterministic fuzz and invariant evidence.

The V1 flow is:

```text
MARKET_OBSERVATION
-> NORMALIZED_QUOTE
-> ROUTE_DISCOVERY
-> FULL_COST_CALCULATION
-> PAPER_EXECUTION
-> TRADE_CANDIDATE
-> POLICY_BOX
-> WORK_EVIDENCE
-> NEXT_HEARTBEAT
```

`AUTHORIZATION -> EXECUTION -> RECEIPT -> REALIZED_PNL` is intentionally disconnected in this phase.

### 13.1 Quote and market truth

- Quotes use integer numerator/denominator fields; floating-point market prices are not accepted as accounting truth.
- Every quote binds a market, pair, observed time, expiry and evidence reference.
- stale, future-dated or `NOT_AVAILABLE` market quotes fail closed.
- 11520, DEX/AMM, KGEN and KAIOS adapters may be added only when their real source evidence exists.
- KUFO and cross-chain routes remain unavailable until a formal market/adapter exists.
- quote normalization never implies custody, liquidity or executability.

### 13.2 CFO net-profit law

Every candidate records:

```text
GROSS_PROFIT
- AMM_FEE
- GAS_COST
- SLIPPAGE
- BRIDGE_COST
- TRANSPORT_COST
- KSHIP_COST
- MARKET_IMPACT
- RISK_RESERVE
= EXPECTED_NET_PROFIT
```

The Policy Box admits a candidate only when `EXPECTED_NET_PROFIT > REQUIRED_MINIMUM_PROFIT`; equality is insufficient. A price spread alone is not profit.

### 13.3 Capability registry

Known capabilities include `MARKET_OBSERVER`, `PRICE_ANALYST`, `PAPER_TRADER`, `TRADE_PROPOSER`, `REAL_TRADER`, `TREASURY_OPERATOR`, `CFO`, `AUDITOR`, `CODER`, `TESTER`, `REVIEWER` and `LOGISTICS_OPERATOR`.

An active employee grant defaults only to observation, analysis and paper trading. `REAL_TRADER` and `TREASURY_OPERATOR` always require explicit grants. Job titles — including CEO/CFO — never imply unlimited withdrawal, approval, transfer or governance bypass.

### 13.4 Trading Policy Box

The shared Policy Box checks market/token/route allowlists, trade and exposure caps, daily loss, slippage, minimum net profit, gas, quote freshness, oracle disagreement, inventory, fixed treasury, fixed beneficiary, allowance ceiling and candidate replay.

Any failed check is fail-closed. In V1 `real_trade_enabled=false`; candidates have `chain_write=false`, `payment=false`, and `authorization_status=REAL_EXECUTION_NOT_AUTHORIZED`.

### 13.5 Heartbeat, queue and handoff

Each heartbeat reads the Life/worker binding, active capability grant and durable queue, then deterministically chooses the lowest numeric priority and stable job ID. It records evidence without chain writes. Replaying a processed heartbeat is an `IDEMPOTENT_NOOP` and cannot duplicate evidence.

Handoffs bind a checkpoint and target worker. The prior worker cannot resume a target-bound job; a correctly granted replacement worker can continue from the durable checkpoint after restart.

### 13.6 Life projections

- 衡曜 / `LIFE-CODEX-GM-0001`: active manager/CEO/CFO projection. A Human-stated 2026-08-27 direction for company execution, KGEN/KAIOS/GPU trading, chain-56 signing and assigned-budget use is preserved as `UNBOUND_HUMAN_DIRECTION_REFERENCE`; this handbook cannot convert that statement into a capability grant. Until an immutable repository-bound decision resolves the subject, asset/account scope, limits, expiry/revocation, signer and fixed beneficiary, the implemented runtime remains observation, analysis and paper-candidate only. Technical execution also remains fail-closed until the bound signer, fixed company capital account, verified inventory, allowed market/route, settlement adapter, gas/risk caps and receipt reconciliation are all live and freshly verified.
- Digital Ant / `DIGITAL_ANT_0001`: active 12345 worker projection; current heartbeat entitlement remains exactly `1 KGEN / HOUR`; this runtime does not create a KAIOS payroll claim.
- 夢婆 / K4168: inactive role template only; `BIRTH_AND_LIFE_ID_REQUIRED`.
- Sol / 曜冊 / K1111: inactive role template only; `LIFE_ID_AND_REGISTRATION_REQUIRED`.

Templates are not births, workers, wallets, jobs or authority grants.

### 13.7 Remaining implementation queue

1. `DEPLOYMENT_BLOCKED`: freeze the immutable catalyst-bank production address and KUFO `halfLifeSeconds`; retain immediate-delivery and 130-day freshness semantics.
2. `OPEN_REVIEW`: specify/authenticate any future K1852 contribution-proof route against 18911/511111 without modifying historical V7.5.2 facts; the tax-credit route remains disabled.
3. `IMPLEMENTED_REVIEW_CANDIDATE`: real-market adapters, signer/budget readiness checks, settlement receipts and realized-PnL accounting now have Draft candidates, but no fixed funded trading capital, verified GPU inventory or production settlement connector is bound.
4. `HUMAN_OR_GOVERNANCE_FREEZE_REQUIRED`: catalyst bank, KUFO half-life, KAIOS liquidity policy, company receivable/escrow, K4168 reservoir and any production Mainnet release.

## 14. Required review checks before deployment discussion

- Solidity compile clean.
- Storage compatibility where upgradeable contracts are involved.
- ABI diff reviewed.
- EIP-170 checked.
- unit/integration/fuzz/invariant suites PASS.
- exact-head GitHub CI registered and PASS.
- secret scan PASS.
- JSON/JSONL/schema validation PASS.
- `git diff --check` PASS.
- Mainnet fork/rehearsal uses no production signing key.
- asset-flow conservation PASS.
- authorization-boundary review PASS.
- deployed-vs-design labels consistent.
- no stale PR status contradicts later evidence.

## 15. Forbidden shortcuts

- Do not merge #136 wholesale merely to preserve history.
- Do not represent #152 as deployed.
- Do not represent #158 as deployed.
- Do not send KGEN to `0xfc52...` merely because K1852 relay is proposed here.
- Do not send 5M KAIOS to 18911 based on this handbook.
- Do not activate Reserve Redemption.
- Do not change tax wallets/governance from this handbook.
- Do not use private keys from chat/source/logs/evidence.
- Do not infer payment authority from the word salary/work.
- Do not erase historical evidence when a rule is superseded.

## 16. Handoff checkpoint template

Every worker ending a shift, vacation, context window or assignment MUST leave a durable checkpoint:

```text
TASK_ID=
DATE_TIME_UTC=
DATE_TIME_ASIA_TAIPEI=
WORKER=
BASE_MAIN_SHA=
BRANCH=
HEAD_SHA=
PR=
FILES_CHANGED=
DEPLOYED_FACTS_TOUCHED=
DESIGN_CANON_CHANGED=
TESTS_PASS=
TESTS_FAIL=
CI_STATUS=
OPEN_P0=
OPEN_P1=
OPEN_P2=
NEXT_SAFE_ACTION=
HUMAN_DECISION_REQUIRED=
DEPLOYMENT=NO
PAYMENT=NO
GOVERNANCE_EXECUTION=NO
MAINNET_TRANSACTION_SENT=NO
PRIVATE_KEY_EXPOSED=NO
```

## 17. Continuity rule

A worker may disappear, go on vacation, hit a context limit, lose a local machine or be replaced. The work must still be resumable from GitHub evidence alone.

Therefore:

- no critical decision may exist only in chat;
- every semantic change gets a commit or review note;
- every deployment claim needs exact evidence;
- every handoff identifies exact base/head SHA;
- every unresolved question is explicit;
- `CURRENT` files must be cumulative and must not require archaeological reconstruction from old chat pages.

## 18. Current implementation checkpoint

```text
TASK_ID=KAIOS_AI_COMPANY_CROSS_MARKET_CIRCULATORY_AUTOPILOT_V1
DATE_TIME_UTC=2026-08-20
WORKER=codex-gm-01 / 衡曜
BASE_MAIN_SHA=5d539d237bf948011d234203e451aa980a7b7ce8
BRANCH=codex/kaios-ai-company-cross-market-circulatory-autopilot-v1
DEPLOYED_FACTS_TOUCHED=NO
DESIGN_CANON_CHANGED=SAFE_AUTOPILOT_V1_CUMULATIVE_UPDATE_AND_FRESH_CONTRIBUTION_RECONCILIATION
REAL_TRADE=NO
PAYMENT=NO
DEPLOYMENT=NO
GOVERNANCE_EXECUTION=NO
MAINNET_TRANSACTION_SENT=NO
PRIVATE_KEY_EXPOSED=NO
```

## 19. Master company and K11520 GPU execution checkpoint

Observed main at this checkpoint: `5d539d237bf948011d234203e451aa980a7b7ce8`.

Human-assigned company universe address and exchange coordinate:

- `COMPANY_REGISTERED_UNIVERSE_ADDRESS = 0.00011520`
- `COMPANY_K_COORDINATE = K11520`
- `COMPANY_LOCATION_NAME = 花果山交易所`
- `0.00011520` is both the Human-defined KGEN universe price coordinate and the company/exchange address.
- It is not an automatic native matched-trade CT. `nativeMatchedTradeCT` remains the latest valid matched trade or `null`.

Human-directed GPU pilot planning route (`REFERENCE_ONLY / NOT_MACHINE_VERIFIABLE_TRADING_AUTHORITY`):

```text
K12345 / 0.00012345
-> verified wish, heartbeat/breathing and fortune entitlement
-> verified NVIDIA supplier/model/serial/acquisition evidence
-> ownership and cargo receipt
-> 18,778.422548555 km reference logistics route
-> K11520 / 0.00011520 bonded warehouse
-> GPU/KGEN and GPU/KAIOS listing candidates
-> matched trade
-> settlement receipt
-> company revenue, cost, payroll and realized-profit accounting
```

No real GPU inventory, funded capital account or production 11520 settlement connector is currently bound, so real-trade readiness remains false and no trade may be reported.

### 19.1 Sixteen-workstream status matrix

Evidence rule: every SHA below is a checkpoint observation against the stated main, not durable CURRENT proof. Before using any row for review, integration or release ordering, fetch the live PR exact head, compare state, checks, reviews and threads again.

1. `P0_CURRENT_GENESIS_PHASE2_AND_27_PR_LINEAGE_RECONCILIATION` — PR #187, exact head `c16e630a27b152e6cdcf5060b4371b999de34608`, implemented candidate / CI PASS / Draft.
2. `P0_CURSOR_DEPARTURE_R2_CLAIM_CLOSEOUT_AND_REGISTRY_CLEANUP` — PR #176, exact head `8ff6ee1770837e472811eea73d2889e80e9f5387`, fail-closed departure and expired-claim reconciliation / CI PASS / Draft.
3. `P0_DISTINCT_REVIEWER_CAPABILITY` — PR #171 records `NO_ELIGIBLE_DISTINCT_T2_REVIEWER`; Sol/曜冊 PR #183 remains T1 onboarding hold. Reviewer capacity is still zero and must not be faked.
4. `P0_SYNC_CORRECT_AND_REVIEW_PR169_11520_NATIVE_MARKET` — PR #169, exact head `b600e59bd0a0b7bbf386886630a94a26df7fde0a`, dual-role 0.00011520 Canon plus authenticated native matching / CI PASS / Draft.
5. `P0_NVIDIA_GPU_11520_MARKET_PILOT_AND_REAL_TRADE_READINESS` — PR #178, exact head `1e659cd4af3d299dc2bb3aa01a580dd6e2db4524`, paper pilot / fail-closed real-readiness verifier / CI PASS / Draft.
6. `P1_KGEN_EXTERNAL_EXCHANGE_BRAND_AND_TOKEN_METADATA` — PR #179, exact head `f2208d5ba364efac54f6114f62d5d68523c280fb`, current owner/bank-wallet/supply reconciliation, fail-closed BSC wallet discovery and listing package / CI PASS / external submissions not performed.
7. `P1_KAIOS_MARKET_GENESIS_PAIR_AND_LIQUIDITY` — PR #180, exact head `f050395ddd162cc643b078f021179c71016ff4f7`, pair/liquidity readiness only / CI PASS / pair not created.
8. `P1_11520_UNIVERSAL_LISTING_REGISTRY` — PR #181, exact head `24608b43375c5a246ef414fd1d70862c8f0ce83e`, universal listing/physical inventory evidence / CI PASS / Draft.
9. `P1_11520_WAREHOUSE_ESCROW_SETTLEMENT_RECEIPT_ACCOUNTING` — PR #181 plus unsigned-payment PR #186; model/readiness implemented, custody and production execution unbound.
10. `P1_AUTONOMOUS_CLOCK_IN_WORKQUEUE_HANDOFF_AND_REPAIR_LOOP` — PR #170, exact head `7344450a21c11f26a4722ec18c15cc6e430569d2`, local durable cycle/read-only repo observer/repair loop / CI PASS; worker wake, background scheduler and distinct-review trigger remain disconnected.
11. `P1_CUSTOMER_GATEWAY_QUOTATION_PROJECT_DISPATCH_AND_DELIVERY_DASHBOARD` — PR #182, checkpoint head `54a17bd3f5377a2c1f35e93ec021b3e63bae361d`, deterministic Option-B project lifecycle / CI PASS / receivable and escrow unbound.
12. `P1_18888_8888_PAYROLL_AND_COMPANY_REVENUE_SEPARATION` — PR #154 exact head `c2ecfa03f5b18fefd15f020377385fe12a78067a` plus PR #186. Live scheduled 88 KAIOS payroll is unclaimed; further top-up/payment remains frozen.
13. `P1_LIFE_GENESIS_WORKER_EMPLOYMENT_TRUST_AND_PAYROLL_ELIGIBILITY` — PR #165 exact head `0645524aece309d0ed3b41b771b422612b599e94` and PR #183. State separation is implemented; Xuanyao and Sol are not auto-promoted, born, employed or paid.
14. `P2_18911_KUFO_AND_KSHIP_SUCCESSOR_SYSTEMS` — PR #158 exact head `0ea0bc02aa6f485fba825e6e7b54d1a683a8a626`, complete local/fork review candidate / exact-head CI PASS / deployment blocked by unfrozen catalyst bank and half-life seconds.
15. `P2_K4168_NAIHE_RESERVOIR_PUBLIC_GOOD_AND_MENGPO_SOUP` — PR #172 exact head `ddcfd01d18eff5438c827b2d26d0960b3e31aee0`, schema/simulator 31/31 and exact-head CI PASS / reservoir and Mengpo not deployed.
16. `P2_UNIVERSE_MAP_BRAND_MOBILE_FRONTEND_AND_WEBSITE_INTEGRATION` — brand PR #162, address-manifest PR #184 and mobile PR #185 exact head `b54b26223e9a9d2566b5d02b205747fa28c1d72a`. Mobile V4.0.2 passed 390px browser QA after excluding Node-only signer modules from the public dependency graph.

### 19.2 Current release order and blockers

The next integration order is:

1. obtain a genuinely distinct T2 reviewer or keep review-dependent PRs on HOLD;
2. reconcile overlapping 11520 CURRENT files in PRs #169, #181 and #185 without force push;
3. independently review PR #178 inventory/readiness gates before any real GPU acquisition or trade;
4. freeze a fixed company capital account, budget caps, settlement connector and beneficiary before enabling real trade;
5. create no KAIOS pair or liquidity transaction until its separate policy, asset amount and signer authorization are frozen;
6. keep 18911, K4168 and brand candidates undeployed/unpublished until their explicit blockers are resolved.

Safety checkpoint: `NO_MERGE / NO_DEPLOYMENT / NO_PAYMENT / NO_REAL_TRADE / NO_MAINNET_TRANSACTION / PRIVATE_KEY_EXPOSED=NO`.

END OF HANDBOOK V1.4
