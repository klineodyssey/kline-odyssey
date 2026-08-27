# KAIOS Civilization Circulatory Runtime — Multi-Worker Handoff Handbook

STATUS: DESIGN_AND_HANDOFF_AUTHORITY / NOT_DEPLOYED
VERSION: V1.3
DATE: 2026-08-27 Asia/Taipei
PURPOSE: durable handoff source so Human, AI, Codex, ChatGPT pages, workers, reviewers and future digital lives can resume work without reconstructing decisions from chat history.

> This handbook records deployed facts, current design Canon, implementation candidates, superseded history and open review items separately. It does not authorize deployment, governance execution, payment, burn, token transfer or any chain transaction.

## 0. Resume protocol

Every worker taking over this task MUST:

1. Read this file before coding.
2. Fetch latest `main`; never assume a remembered SHA is current.
3. Preserve PR #136 exact Phase 2 deployed-evidence lineage at `00c79b380ce094c17d75697f360820c4d2035071` as history; it is 258 commits behind current `main` at this checkpoint.
4. Preserve PR #152 exact design-only Canon lineage at `672ab4884e8cf6f9d07c176a862fb858cafe8161` as history; later Human freshness Canon supersedes its alchemy interpretation.
5. Read PR #158 exact catalyst/KUFO/KSHIP implementation candidate at `794485504d6039b438ea410516b30f4df6f5ee6f` and independently verify its latest head before review.
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

For exactly representable amounts:

- required KGEN catalyst = KAIOS / 1000.
- KUFO entitlement lineage = KAIOS × 1000.
- KSHIP lifetime ceiling = KUFO × 1000.

5M example:

- 5,000,000 KAIOS = 5,000,000 kg feedstock.
- equal-mass catalyst = 5,000 KGEN = 5,000,000 kg.
- KUFO lineage target = 5,000,000,000 KUFO.

KGEN is not burned and is not converted into KUFO. The Human-frozen V3 successor model uses an exact fresh KGEN bank contribution; the contribution remains in the immutable catalyst bank as a civilization asset and is not escrowed or returned. Earlier catalyst-escrow-and-return designs are historical candidates, not CURRENT behavior.

## 3. 18911 alchemy chronology

Historical/deployed V1 furnace semantics use a 49-Epoch proof maturity period. The earlier proposed `49 REVIEW + 81 CATALYSIS = 130 Epoch delivery delay` model is `HISTORICAL_SUPERSEDED`.

The Human-frozen V3 successor Canon is:

```text
MIN_ALCHEMY_AMOUNT = 1 KAIOS
REQUIRED_KGEN = KAIOS_AMOUNT / 1000
130 DAYS = KGEN CONTRIBUTION FRESHNESS WINDOW
DELIVERY_DELAY = 0
REJECTION = ATOMIC_REVERT
CANCELLATION = NOT_APPLICABLE_AFTER_SUCCESS
REFUND = NOT_APPLICABLE_NO_ESCROW
```

The target atomic path is holder -> successor K18911 -> exact KGEN transfer directly to immutable catalyst bank -> deployed KAIOS burn ABI -> K511111 release -> immediate KUFO mint to the fixed beneficiary. Any failed step reverts the full transaction. The furnace must retain no KGEN.

This is `CURRENT_DESIGN_CANON / IMPLEMENTED_REVIEW_CANDIDATE`, not deployed. Production deployment remains blocked until the catalyst-bank address and KUFO `halfLifeSeconds` are frozen and legacy V1 proof compatibility is resolved.

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

Design review boundary:

- civilization point K1852 remains a candidate artificial-satellite / white-hole communication-relay role;
- `K1852_ROUTE_STATUS = DESIGN_ONLY_UNFROZEN`;
- K1852, the KGEN `bankWallet`, the Reserve Redemption proxy and a future catalyst bank are not assumed to be the same role;
- normal autonomous operation must not depend on arbitrary manual owner withdrawal.

This is `OPEN_REVIEW`, not deployed functionality and not a production catalyst-bank selection.

## 6. KGEN contribution proof routes

Do NOT modify historical V7.5.2 KGEN or GalacticBank deployments and pretend new methods already exist there.

The direct V3 route must verify an exact balance increase at a frozen immutable catalyst bank in the same atomic transaction. It does not use a return ticket.

The alternative KGEN 0.10% bank-share credit route remains `DESIGN_ONLY_DISABLED`. A future proof must bind `txHash + logIndex + wallet + amount + timestamp`, use only the actual Bank share, preserve the actual buyer identity, accept contributions no older than 130 days (the exact boundary remains valid), consume credits FIFO, and prevent replay. Indexer, attester, batch-root and operating budget remain unfrozen.

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
7. `KGEN_CATALYST_BANK_CONTRIBUTION` — exact fresh contribution retained by the frozen catalyst bank; never payroll, trading capital or refundable escrow. Historical escrow designs remain separately labelled.
8. `ALCHEMY_BURNED_KAIOS` — permanently destroyed KAIOS; never refundable principal.
9. `KUFO_LINEAGE` — post-alchemy entitlement/mass lineage.
10. `KSHIP_PROPULSION` — decay-derived transport fuel lineage.

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

## 13. Current company work queue

The current 16-workstream order is: Genesis/PR lineage; Cursor offboarding; distinct reviewer capacity; PR #169; NVIDIA GPU paper market and real-readiness; KGEN metadata; KAIOS market genesis; universal listing registry; warehouse/escrow/settlement/accounting; autonomous company cycle; customer gateway/project runtime; 18888/8888/payroll/revenue separation; Life/worker/employment/trust/payroll gates; 18911/KUFO/KSHIP successor; K4168/Public Good/Mengpo; Universe Map/brand/mobile/frontend.

Engineering candidates may proceed on isolated Draft branches. Real trade, payment, deployment and governance stay fail-closed unless the corresponding signer, budget, inventory, counterparty, settlement and independent-review gates are all machine-verifiably satisfied.

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

## 18. GitHub PR lineage checkpoint — 2026-08-27

Observed at `2026-08-27T10:03:17Z` against `origin/main = 830b79214781fb1231f3619336de394f400a0bfd`.

The remembered counts of 27 and 36 open PRs are superseded. GitHub reported 38 open PRs at this checkpoint. A green workflow means tests passed at that head; it is not an independent review, deployment claim or merge authorization.

### Current-base candidates (0-1 commits behind main)

`#188, #187, #186, #185, #184, #183, #182, #181, #180, #179, #178, #176, #172, #169, #162, #158`

- #188 cumulatively integrates #169, #181 and #185 on current main. It preserves the assigned `0.00011520` K11520 company/KGEN-price coordinate without seeding matched-trade CT, and combines the paper market, listing/warehouse gates and browser-safe mobile wallet. Its exact-head CI is green, but it remains Draft and still requires distinct review.
- #187 is this lineage reconciliation candidate. It is evidence/documentation only and cannot approve itself.
- #186 is the unsigned/read-only 18888 Public Good payment adapter; live read is fail-closed because the tested Mother/Jade addresses do not hold the bank payment roles.
- #185 is the mobile chain-56 wallet/watch-asset candidate; it sends no token transaction and does not claim a KAIOS DEX pair exists.
- #184 is the cumulative Mainnet address manifest candidate and supersedes the compact-document role of #167 without deleting #167 history.
- #178 remains stacked on #169 and is PAPER inventory/market only.
- #183 is a T1 onboarding HOLD, not a Life birth, Worker registration, T2 promotion or employment grant.
- #158 remains an undeployed review candidate; catalyst bank, half-life seconds and legacy compatibility are deployment blockers.

These branches must be resynchronized whenever `main` advances semantically, then re-run exact-head CI.

### Stale or stacked candidates requiring reconciliation

`#177, #174, #173, #171, #170, #168, #167, #166, #165, #164, #163, #161, #160, #159, #154, #153, #152, #136, #135, #134, #133, #48`

- #163 security review remains an independent dependency. #164 and #165 must not substitute for it.
- #164/#165 share registry surfaces and require schema/merge reconciliation plus a distinct reviewer.
- #170 cannot receive final approval from its own implementer; #171 records the unresolved distinct-reviewer capacity gap.
- #161 is 134 commits behind and must not be treated as the current integrated company runtime merely because its architecture remains useful.
- #167 is 93 commits behind; use #184 for the cumulative address-manifest review candidate.
- #135 -> #136 -> #152 -> #153 -> #154 is historical stacked lineage. Preserve deployed evidence, but do not wholesale merge the stack into current `main`.
- #133/#134 and #48 are old independent candidates hundreds of commits behind; require explicit product-owner disposition, not silent merge.

### Review order

1. Obtain distinct security/identity review for #163, then reconcile #164 and #165 in dependency order.
2. Obtain a governance-eligible distinct reviewer for #170 before connector activation.
3. Review #188 as the cumulative K11520 integration candidate, while preserving #169/#181/#185 as dependency history; review #178, #179-#186, #158, #162 and #172 independently where they are not superseded.
4. Preserve deployed Mainnet evidence from the #135/#136 lineage while reconciling documentation through #184 and live chain reads.
5. Keep every PR Draft/HOLD and do not merge under the current work order.

END OF HANDBOOK V1.3
