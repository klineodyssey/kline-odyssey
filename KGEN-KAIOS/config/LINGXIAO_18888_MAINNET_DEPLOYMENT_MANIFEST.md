# Lingxiao 18888 Mainnet Deployment Manifest

Status: MAINNET_PRE_SIGN_READY_FOR_HUMAN_AUTHORIZATION; Mainnet transaction is not authorized.

- Fork block: 115460801
- Formal KGEN: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- Formal 11520: `0xd0605F4EF10e5C1438F11AF9edc36926769239d6`
- Legacy Heart: `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972` — DO NOT TOUCH
- Formal governance: `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`
- Distinct governance approver (Jade Emperor): `0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756`
- Final emergency pauser (Guanyin): `0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE`
- Deployment signer candidate: `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`
- Economic config SHA-256: `5e2fc57df2bae4778d5e405dfa07f8e3e78fe72a7de3dd9889aad4e6d86b8bd4`
- Deployment signer nonce: 34
- Deployment signer balance: 0.00556736894145793 BNB
- Buffered gas estimate: 37401808 gas at 50000000 wei = 0.0018700904 BNB
- Unsigned Genesis deployment package: PASS (21 deployments, 29 post-deploy calls, zero configuration blockers)
- Bank creation codehash: `0xff5594efa2cd283aed2cab9f27634c06a4da3d2737c645addfdc54f53757d43b`
- Bank runtime codehash: `0xcfe00d93cf874129e6d01003f2fb265128d469dd350e5a5cab79beafb518f00c`
- 8888 creation codehash: `0x6db0a450065b47d3b12ea695afbc8db6f1a02e98f94e97a78518b4c17f2387e9`
- 8888 runtime codehash: `0x63a418103df4396a8d6cb944c4d0c1ce46d8a942f4e6d3d03f6c88686e0998f9`

## Deployment order and predicted addresses

Predictions use the deployment signer nonce at the frozen fork block. Every address remains preview-only until a successful authorized receipt is codehash-verified and automatically backfilled.

| Order | Identity | Nonce | Predicted address | Mainnet actual |
|---:|---|---:|---|---|
| 1 | KAIOS_ORGAN_REGISTRY | 34 | `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D` | pending |
| 2 | LINGXIAO_18888_BANK_IMPLEMENTATION | 35 | `0x8125045039Fe969490d57185233B7d64A494A829` | pending |
| 3 | LINGXIAO_18888_BANK_PROXY | 36 | `0x11d34c0F723aCd334B8F95076f73F07f06202aab` | pending |
| 4 | GAOLAOZHUANG_8888_COMMERCIAL_BANK_IMPLEMENTATION | 37 | `0x94341fB340cF8Bd0069cD1Fcaf5bA0866B15c923` | pending |
| 5 | GAOLAOZHUANG_8888_COMMERCIAL_BANK_PROXY | 38 | `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C` | pending |
| 6 | CELESTIAL_SEAT_500_IMPLEMENTATION | 39 | `0x8E48643030826c9121Cd2E086B811b9083E9f862` | pending |
| 7 | CELESTIAL_SEAT_500_PROXY | 40 | `0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe` | pending |
| 8 | CIVILIZATION_ALLOCATION_IMPLEMENTATION | 41 | `0x216d69a413354CBab7ddDdC4fCfe2B3E0468197d` | pending |
| 9 | CIVILIZATION_ALLOCATION_PROXY | 42 | `0x75A55Af6967932C4A1c896dB81Dd6F31e531c299` | pending |
| 10 | ECONOMIC_ROUTER_8888_IMPLEMENTATION | 43 | `0x3ebc0A39F7981AAB3995AC828dc79A8B0753A05b` | pending |
| 11 | ECONOMIC_ROUTER_8888_PROXY | 44 | `0xC49f989c6ff0d22824df8D993Ce82207165C1428` | pending |
| 12 | EXCHANGE_SETTLEMENT_11520_IMPLEMENTATION | 45 | `0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363` | pending |
| 13 | EXCHANGE_SETTLEMENT_11520_PROXY | 46 | `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df` | pending |
| 14 | BANK_RISK_CONTROLLER_IMPLEMENTATION | 47 | `0x8D231C82513cdfa978A7C157618Ff198b0a5d3E9` | pending |
| 15 | BANK_RISK_CONTROLLER_PROXY | 48 | `0x61573a93a88c58DAa5066A0aA319f88cE34d88FC` | pending |
| 16 | BANK_GOVERNANCE_IMPLEMENTATION | 49 | `0x9d919E66AE2746D41D978e3d51DF594B2E5F5582` | pending |
| 17 | BANK_GOVERNANCE_PROXY | 50 | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | pending |
| 18 | BANK_MIGRATION_IMPLEMENTATION | 51 | `0xff281a821dBbA44EEc7b57475E3c28A916fcDAE7` | pending |
| 19 | BANK_MIGRATION_PROXY | 52 | `0x72c14f5D2fa748C1579295A7E34c16453a3a17aB` | pending |
| 20 | KAIOS_TOKEN_CORE | 53 | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` | pending |
| 21 | ALCHEMY_FURNACE_18911 | 54 | `0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1` | pending |

## Post-Genesis immutable inscription

The existing 21 deployments remain frozen and unchanged. After a successful Genesis settlement and exact receipt/chain-state validation, the evidence generator prepares an unsigned `KAIOSGenesisInscription` deployment as deployment action 22.

- Sequence: frozen deployments 1-21 -> Genesis settlement -> evidence validation -> inscription deployment 22
- Full inscription Keccak-256: `0xbc89db0915e1fd0e978ae0cfe194f4b46db22534febab35563de2802935b3704`
- Full inscription SHA-256: `add44b79083a20a6d9f240a99c5fd47658f191ce8b3fa81da6f60c97e8b4470f`
- Expected deployment-signer nonce: 55, provided the settlement transaction does not consume that signer's nonce
- Predicted inscription address at nonce 55: `0xb02CBc7698646653D541F494F510Fe18638AC7ae` (`PREDICTED_ONLY_NOT_DEPLOYED`)
- First 21 predicted-address impact: NONE
- Stop if the deployment signer's pending nonce is not 55; never shift or insert the inscription into actions 1-21
- Amount parameters are forbidden. The generator derives the KGEN supply, recognized burn, actual KAIOS mint, settlement hash and settlement block from one successful Genesis receipt and verified chain state.

## Human-governed economic parameters

| Parameter | Mainnet value | Status | Fork-only value / behavior |
|---|---|---|---|
| 500 Seat salary base/rate | 88 KAIOS monthly base; 1x default; governance policy 1x-5x | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| 500 Seat epoch definition | MONTHLY_DAY_5_00_00_UTC_PLUS_8 | HUMAN_FINAL_CANON_IMPLEMENTED | deterministic Gregorian YYYYMM maturity enforced on-chain |
| 18911 Alchemy epoch definition | 86400 seconds | FROZEN_DEPLOYMENT_CONFIGURATION_NOT_ECONOMIC_POLICY | matches Mainnet candidate |
| Reserve minimum | 11000000.0 KAIOS | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| Salary exposure cap | 3005464480874316939890 wei per transaction / 3005464480874316939890 wei per UTC day | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| Allocation exposure cap | 6010928961748633879781 wei per transaction / 6010928961748633879781 wei per UTC day | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| 8888 route cap | 12021857923497267759562 wei per transaction / 12021857923497267759562 wei per UTC day | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| 11520 settlement cap | 6010928961748633879781 wei per transaction / 6010928961748633879781 wei per UTC day | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| 8888 deposit interest rate | 833 ppm per Gregorian monthly epoch | HUMAN_FINAL_ECONOMIC_POLICY_ENCODED | matches Mainnet candidate |
| Governance delay | 3600 seconds | HUMAN_FINAL_CANON_TECHNICAL_MINIMUM | 3600 seconds |
| Distinct BankGovernance approver | 0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756 | HUMAN_FINAL_JADE_EMPEROR | formal public identity used in fork |
| Pause authority | 0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE | HUMAN_FINAL_GUANYIN | pause only; cannot unpause, spend, mint, upgrade, allocate or redirect |
| Initial module enable/disable state | six active; BankMigration registered but inactive | HUMAN_FINAL_CANON | matches Mainnet candidate |

## Final governance role matrix

- Mother `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`: PROPOSER only; no direct Bank/module Admin, Upgrader or Pauser role after finalization.
- Jade Emperor `0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756`: APPROVER only; no direct Bank/module Admin, Upgrader, Pauser, payment or beneficiary authority.
- Guanyin `0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE`: PAUSER only on 18888/8888; withdraw, mint, upgrade, allocation and salary redirect are blocked.
- Deployment signer `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`: no permanent Bank/module governance role.
- Governance flow: Mother proposal -> Jade Emperor approval -> wait at least 3600 seconds -> permissionless execution.

## Blocking conditions

- NONE

Authorization gate: MAINNET_DEPLOY_APPROVED_NOT_RECEIVED.

No line in this manifest authorizes a transaction.
