# KAIOS Civilization Circulatory Runtime — Multi-Worker Handoff Handbook

STATUS: CURRENT_HANDOFF_AUTHORITY / MIXED_DEPLOYED_HISTORY_AND_UNDEPLOYED_CANDIDATES
VERSION: V1.1
DATE: 2026-08-20 Asia/Taipei
PURPOSE: durable handoff source so Human, AI, Codex, ChatGPT pages, workers, reviewers and future digital lives can resume work without reconstructing decisions from chat history.

> This handbook records deployed facts, current design Canon, implementation candidates, superseded history and open review items separately. It does not authorize deployment, governance execution, payment, burn, token transfer or any chain transaction.

## 0. Resume protocol

Every worker taking over this task MUST:

1. Read this file before coding.
2. Fetch latest `main`; never assume a remembered SHA is current.
3. Read PR #136 exact Phase 2 deployed-evidence lineage at `00c79b380ce094c17d75697f360820c4d2035071`.
4. Read PR #152 exact design-only Canon correction at `672ab4884e8cf6f9d07c176a862fb858cafe8161`.
5. Query PR #158 and read its exact current head; do not reuse an earlier review SHA or CI run.
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

In the V3 review candidate, KGEN is a fresh civilization contribution, not KUFO feedstock. It is not
burned and is not converted into KUFO. The exact required KGEN moves directly to the immutable
catalyst bank and remains there as civilization capital; 18911 never escrows it and therefore has no
catalyst-return liability. Earlier escrow-and-return wording is historical and superseded.

## 3. 18911 alchemy chronology and compatibility

`DEPLOYED_V1_HISTORY`: KAIOS and old 18911 are live. The old Furnace at
`0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1` implements a 49-Epoch maturity runtime. It remains
the Organ Registry active body until a separately authorized timelocked update. Its history is not
rewritten.

`CURRENT_DESIGN_CANON`: the V3 successor uses a 130-human-day contribution freshness window, not a
delivery delay. A direct exact KGEN bank contribution is fresh at transaction time, so the same
atomic transaction transfers KGEN to the immutable catalyst bank, burns KAIOS through the deployed
five-argument KAIOS ABI, consumes the Furnace proof at 511111 and mints KUFO to the fixed beneficiary.

```text
DELIVERY_DELAY = 0
REJECTION = ATOMIC_REVERT
CANCELLATION_AFTER_SUCCESS = NOT_APPLICABLE
REFUND_AFTER_SUCCESS = NOT_APPLICABLE_NO_ESCROW
KGEN_FURNACE_CUSTODY = 0
```

The previous `49 + 81 = 130 Epoch delayed delivery` proposal is
`HISTORICAL_SUPERSEDED_BY_HUMAN_FRESHNESS_CANON`. It must not be implemented by changing one wait
constant. The 130-day tax-credit route remains `DESIGN_ONLY_DISABLED` until its indexer, attester,
budget and production catalyst bank are frozen.

PR #158 V3 is an `IMPLEMENTED_REVIEW_CANDIDATE`, not deployed. `KAIOS.sol` must remain identical to
latest main; catalyst bank fields belong to the successor Furnace proof. The latest committed
read-only BSC compatibility report records `alchemyBurnCount=0`, `totalKaiosBurnedForAlchemy=0`, and
no pending Furnace proposal, so no legacy proof migration is required at that snapshot.

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

## 6. Proposed K1852 Catalyst Relay

Do NOT modify historical V7.5.2 deployment and pretend new methods already exist there.

Possible future architecture: separately reviewed `K1852CatalystRelay` adapter/organ. It is not part
of the executable direct V3 candidate and remains `DESIGN_ONLY_UNFROZEN`.

Minimum ticket fields:

```text
catalystTicketId
lifeId
catalystOwner
beneficiary
kaiosAmount
requiredKgenCatalyst
sourcePoint
furnacePoint=18911
sourceEventBlock
sourceEventTimestamp
freshnessExpiresAt
alchemyProofId
status
consumedAmount
```

Mandatory invariants:

- ticket replay impossible;
- exact KGEN balance delta checked;
- no fee-on-transfer ambiguity;
- no arbitrary beneficiary replacement;
- no admin sweep or owner-withdraw dependency;
- original contributor and fixed beneficiary preserved;
- KGEN total supply unchanged by catalysis;
- 18888 cannot fund or spend the ticket;
- 18911 cannot consume another Life/proof ticket;
- completion cannot mark a credit consumed without a deterministic bank-tax source and actual amount.

The direct V3 path does not use this ticket: it transfers KGEN straight to an immutable bank, verifies
the exact bank balance delta and retains no KGEN in 18911.

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
7. `KGEN_CATALYST_BANK_CONTRIBUTION` — successful direct contribution; never payroll/equity or refundable Furnace escrow.
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

## 13. Multi-worker work queue

### A — Canon reconciliation
Status: COMPLETE FOR V3 REVIEW CANDIDATE.

- preserve 49-Epoch old 18911 as deployed V1 history;
- define 130 human days only as contribution freshness;
- define immediate delivery and atomic revert/no escrow;
- keep production catalyst bank and KUFO half-life seconds as deployment blockers.

### B — K1852 relay specification
Status: READY FOR DESIGN / NOT DEPLOYMENT.

- define relay adapter vs immutable V7.5.2 GalacticBank;
- define future tax-credit ticket and attester boundaries;
- remove owner/manual sweep dependency;
- keep K1852 compatibility `DESIGN_ONLY_UNFROZEN`.

### C — Circulatory registry
Status: DESIGN REQUIRED.

- machine-readable Life/workpoint/organ registry;
- fixed beneficiary and duty schema;
- heartbeat/evidence linkage;
- append-only role history.

### D — KAIOS blood-flow ledger
Status: DESIGN REQUIRED.

- event schema;
- liability/funding classification;
- route/ticket IDs;
- replay prevention;
- deterministic settlement-candidate generation;
- receipt-gated completion.

### E — Tests
Status: IMPLEMENTED FOR DIRECT V3 REVIEW PATH.

Minimum tests include deployed KAIOS ABI compatibility, exact 1 KAIOS/0.001 KGEN direct contribution,
bank receipt delta, atomic rollback, replay protection, beneficiary substitution block, 130-day
tax-credit reference boundaries, KUFO/KSHIP conservation, lot-fragmentation gas bounds and
unauthorized propulsion block.

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

END OF HANDBOOK V1.1
