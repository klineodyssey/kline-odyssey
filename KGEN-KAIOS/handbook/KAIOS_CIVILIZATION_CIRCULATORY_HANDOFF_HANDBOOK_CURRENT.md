# KAIOS Civilization Circulatory Runtime — Multi-Worker Handoff Handbook

STATUS: DESIGN_AND_HANDOFF_AUTHORITY / NOT_DEPLOYED
VERSION: V1.0
DATE: 2026-08-20 Asia/Taipei
PURPOSE: one durable handoff source so Human, AI, Codex, ChatGPT pages, workers, reviewers and future lives can resume work without reconstructing decisions from chat history.

> This handbook records design decisions, deployed historical facts, review candidates and unresolved questions separately. It does not authorize deployment, governance execution, payment, burn, token transfer or any chain transaction.

## 0. Resume protocol — read this first

Every worker taking over this task MUST:

1. Read this file before coding.
2. Fetch latest `main`; never assume a remembered SHA is current.
3. Read PR #136 exact Phase 2 deployed evidence lineage at `00c79b380ce094c17d75697f360820c4d2035071`.
4. Read PR #152 exact design-only Canon correction at `672ab4884e8cf6f9d07c176a862fb858cafe8161`.
5. Read PR #158 exact catalyst/KUFO/KSHIP implementation candidate at `e679a71a0b9ed42d601a739740bf8d59de96f322`.
6. Read PR #160 Mainnet provenance reconciliation before attempting closeout of #135/#136.
7. Preserve deployed evidence as history. Never rewrite a later design correction as if it had already been deployed.
8. Re-run exact-head CI after every semantic change.
9. Stop on ambiguity involving asset custody, governance authority, beneficiary routing, mass conservation or chain-time conversion.

## 1. Authority labels

Every rule MUST carry one of these meanings:

- `DEPLOYED_FACT`: proven by exact source/evidence and chain record.
- `CURRENT_DESIGN_CANON`: Human-approved design direction, not necessarily deployed.
- `IMPLEMENTED_REVIEW_CANDIDATE`: code exists on a Draft branch but is not deployed/current.
- `HISTORICAL_SUPERSEDED`: preserved history, not active design law.
- `OPEN_REVIEW`: unresolved and must fail closed.

Do not collapse these categories.

## 2. Civilization mass ladder

Current design mass scale:

- 1 KGEN = 1000 kg.
- 1 KAIOS = 1 kg.
- 1 KUFO = 1 g.
- 1 KSHIP = 1 mg.

For exactly representable amounts:

- KGEN catalyst = KAIOS / 1000.
- KUFO entitlement lineage = KAIOS × 1000.
- KSHIP lifetime ceiling = KUFO × 1000.

Example for the 5M alchemy rail:

- 5,000,000 KAIOS = 5,000,000 kg feedstock.
- equal-mass catalyst requirement = 5,000 KGEN = 5,000,000 kg.
- proposed KUFO lineage amount = 5,000,000,000 KUFO.

KGEN is catalyst in the #158 candidate. It is not burned and is not converted into KUFO. Exact catalyst must ultimately return to the original catalyst owner.

## 3. 18911 alchemy chronology — CURRENT DESIGN CHANGE

Historical deployed/repository V1 furnace semantics use a 49-Epoch maturity proof.

PR #158 review candidate adds KGEN catalyst escrow but still uses 49 Alchemy Epochs before proof consumption.

Human decision on 2026-08-20 introduces a new two-stage design chronology:

```text
49 Epoch REVIEW
+81 Epoch CATALYSIS
=130 Epoch TOTAL
```

This 130-Epoch chronology is `CURRENT_DESIGN_CANON` for the next implementation, but it is NOT yet deployed and NOT yet implemented in PR #158.

Required future state machine:

```text
SUBMITTED
-> REVIEWING (49 Epoch)
-> REVIEW_PASSED
-> CATALYZING (81 Epoch)
-> MATURED (total 130 Epoch)
-> PROOF_CONSUMED
-> KUFO_LINEAGE_ESTABLISHED
-> CATALYST_RETURNED
```

Failure during review must not silently burn or strand catalyst. Exact cancellation/refund semantics remain `OPEN_REVIEW` and must be frozen before implementation.

## 4. 18888 service and 18911 alchemy MUST remain separate

PR #136 deployed V1 history includes CelestialEligibility requiring a single formal 18911 burn proof >= 5M KAIOS.

PR #152 is the newer design correction:

- 18888 celestial-service path uses a non-burning 5M KAIOS Civilization Performance Bond plus evidence/review/governance.
- 18911 is a separate voluntary permanent KAIOS alchemy burn path.
- A 18911 proof must not satisfy 18888 celestial-service eligibility in the future corrected design.
- A 18888 performance bond must not substitute for 18911 alchemy.

Therefore preserve #136 behavior as `DEPLOYED_V1_HISTORY`, while future product semantics follow the #152 separation unless Human supersedes it again.

## 5. K1852 Galactic Bank / communication satellite candidate

Existing deployed contract identity supplied by Genesis history:

`KGEN_GalacticBank_V7_5_2 = 0xfc522243e988a837700CaD600D6f030f5932681F`

Existing Solidity capability is limited to:

- ERC-20 deposit via `depositToken`;
- native deposit via `receive`;
- Deposit events;
- owner-only ERC-20 withdrawal;
- owner-only native withdrawal.

It does NOT currently implement automatic 18911 routing, 18888 routing, Life binding, catalyst tickets, proof binding, automatic catalyst return or satellite communication semantics.

Human design direction on 2026-08-20:

- civilization point K1852 = artificial-satellite / white-hole communication-relay role;
- investigate using the Galactic Bank identity as the KGEN catalyst communication/intermediary organ;
- catalyst may be staged/represented through K1852 before/while 18911 processing;
- final architecture must remove arbitrary manual owner dependence from normal autonomous life operation.

This is `CURRENT_DESIGN_CANON / IMPLEMENTATION_PENDING`, not a statement of deployed functionality.

## 6. Proposed K1852 Catalyst Relay safety model

Do NOT modify the immutable historical V7.5.2 deployment and pretend new methods exist there.

Preferred future architecture is a separately reviewed organ/adapter such as `K1852CatalystRelay`, registered through an explicit organ registry or other frozen authority.

Minimum ticket fields:

```text
catalystTicketId
lifeId
catalystOwner
beneficiary
kaiosAmount
requiredKgenCatalyst
sourcePoint
furnacePoint = 18911
submittedAt
reviewEndsAt
catalysisEndsAt
alchemyProofId
status
catalystReturned
```

Mandatory invariants:

- ticket replay = impossible;
- exact KGEN balance delta checked;
- no fee-on-transfer ambiguity accepted;
- no arbitrary beneficiary replacement;
- no admin sweep of active catalyst;
- catalyst returned only to recorded catalyst owner;
- KGEN total supply unchanged by catalysis;
- 18888 cannot spend catalyst escrow merely because it is a Bank organ;
- 18911 cannot consume a ticket for another Life/proof;
- failed atomic completion cannot mark catalyst as returned without actual balance delta;
- no Mainnet transaction is authorized by this handbook.

## 7. KGEN Genesis organs and addresses

Historical Genesis identities supplied by deployment record / Human record:

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

Do not infer present ownership or authority from an address label alone; verify current chain/source evidence before any future transaction design.

## 8. Genesis physics interpretation

Project Canon direction:

- Genesis / Big Bang initial state records mass, addresses, allocations and time.
- It does NOT imply that physical space/distance already existed as a derived linear mapping between contract addresses or point IDs.
- A later civilization map may assign point identities such as K1852, K18888 or K18911.
- Point identity is not automatically SI distance.
- Never derive kilometers from an address or point number without a separately frozen distance function.

## 9. Historical KGEN tax blood vessel

Genesis historical bank receiver was `0xFA4d...`.

Phase 2 Stage 2C-1 evidence records a later authorized KGEN `setTaxWallets` execution that changed only the existing 0.10% bank receiver to the Reserve Redemption proxy `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE`; Reward and AutoLP destinations and tax rates remained unchanged.

This redirect does NOT mean reserve redemption is enabled. Stage 2C-1 evidence records Reserve Redemption as LIVE_INACTIVE / redemption disabled / zero redemptions at that snapshot.

## 10. Civilization circulatory runtime — target architecture

Every autonomous Life/person/organ must eventually have an explicit work identity:

```text
LifeID
species/class
pointId
wallet/beneficiary
organ or workplace
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

KAIOS is the civilization blood metaphor and accounting/mass asset. The metaphor must not bypass ERC-20 ownership, allowance, governance, budget or beneficiary controls.

## 11. Active flow classes that MUST NOT be mixed

Maintain separate ledgers/routes for:

1. `REFUNDABLE_PRINCIPAL` — 18888 performance bonds.
2. `CLAIMABLE_SALARY` — matured service salary.
3. `FUNDED_SALARY_BUDGET` — approved payroll funding.
4. `CLAIMABLE_RESOURCE_REWARD` — verified resource/contribution reward.
5. `FUNDED_RESOURCE_REWARD_POOL` — funded reward capital.
6. `KGEN_RESERVE` — existing KGEN reserve / tax accumulation.
7. `KGEN_CATALYST_ESCROW` — temporary catalyst custody; never payroll/equity.
8. `ALCHEMY_BURNED_KAIOS` — permanently destroyed KAIOS; never refundable principal.
9. `KUFO_LINEAGE` — post-alchemy entitlement/mass lineage.
10. `KSHIP_PROPULSION` — decay-derived transport fuel lineage.

Cross-spending between these buckets is prohibited unless a future explicit Canon and implementation says otherwise.

## 12. Autonomous work / circulation safety boundary

"Proactive blood flow" does NOT mean an AI may freely transfer assets.

A future autonomous worker may only cause a settlement when all are true:

- duty/work event is independently verifiable;
- policy is already authorized;
- funded budget exists;
- amount is deterministic from frozen policy;
- beneficiary is pre-bound;
- replay protection exists;
- cap/rate/epoch checks pass;
- signer/contract authority is explicit;
- transaction simulation/fork checks pass where required;
- no Human-only approval boundary is crossed.

If any condition is missing, worker emits a candidate/request/evidence record and does not transfer.

## 13. Multi-worker work queue

### Workstream A — Canon reconciliation
Owner: any reviewer/AI worker.
Status: READY.

- reconcile 49+81=130 into #152/#158 successor design;
- preserve #136 V1 deployed history;
- define cancellation/refund behavior during 49 review and 81 catalysis;
- freeze chain-seconds meaning of one Alchemy Epoch before deployment.

### Workstream B — K1852 relay specification
Status: READY FOR DESIGN, NOT DEPLOYMENT.

- define relay adapter vs immutable V7.5.2 GalacticBank;
- define CatalystTicket state machine;
- prove no owner/manual sweep dependency for active tickets;
- define 18911/511111 authentication and return path.

### Workstream C — Circulatory registry
Status: DESIGN REQUIRED.

- machine-readable Life/workpoint/organ registry;
- fixed beneficiary and duty schema;
- heartbeat/evidence linkage;
- role change history; no destructive overwrite.

### Workstream D — KAIOS blood-flow ledger
Status: DESIGN REQUIRED.

- event schema;
- liability/funding classification;
- route/ticket IDs;
- replay prevention;
- deterministic settlement candidate generation;
- receipt-gated completion.

### Workstream E — Tests
Status: BLOCKED UNTIL A-D interfaces freeze.

Minimum tests:

- 130-Epoch boundary tests;
- 5M KAIOS / 5000 KGEN exact catalyst test;
- inexact ratio fail-closed;
- review rejection/refund;
- catalyst cannot become salary/reserve equity;
- ticket/proof replay blocked;
- beneficiary substitution blocked;
- 18888/18911 separation regression;
- KUFO half-life and KSHIP conservation regression;
- unauthorized autonomous transfer blocked;
- stale worker cannot execute after role/policy change.

## 14. Required review checks before any deployment discussion

- Solidity compile clean.
- Storage compatibility where upgradeable contracts are involved.
- ABI diff reviewed.
- EIP-170 checked.
- Unit/integration/fuzz/invariant suites PASS.
- Exact-head GitHub CI registered and PASS.
- Secret scan PASS.
- JSON/JSONL/schema validation PASS.
- `git diff --check` PASS.
- Mainnet fork/rehearsal uses no production signing key.
- asset-flow conservation proof PASS.
- authorization-boundary review PASS.
- deployed-vs-design labels consistent.
- no stale PR status contradicts later evidence.

## 15. Forbidden shortcuts

- Do not merge #136 wholesale merely to preserve history.
- Do not represent #152 design correction as deployed.
- Do not represent #158 catalyst code as deployed.
- Do not send KGEN to `0xfc52...` merely because K1852 relay is proposed here.
- Do not send 5M KAIOS to 18911 based on this handbook.
- Do not activate Reserve Redemption.
- Do not change tax wallets/governance.
- Do not use a private key from chat, source, logs or evidence.
- Do not let an AI worker infer payment authority from the word "salary" or "work".
- Do not erase historical evidence when a rule is superseded.

## 16. Handoff checkpoint template

Every worker ending a shift or reaching a context limit MUST append/update a durable checkpoint with:

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
DEPLOYMENT=