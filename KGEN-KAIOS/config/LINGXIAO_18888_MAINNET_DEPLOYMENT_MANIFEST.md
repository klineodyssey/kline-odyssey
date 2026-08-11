# Lingxiao 18888 Mainnet Deployment Manifest

Status: pre-sign freeze review complete; Mainnet transaction is not authorized.

- Fork block: 115300367
- Formal KGEN: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- Formal 11520: `0xd0605F4EF10e5C1438F11AF9edc36926769239d6`
- Legacy Heart: `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972` — DO NOT TOUCH
- Formal governance: `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`
- Deployment signer candidate: `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`
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

## Human-governed economic parameters

| Parameter | Mainnet value | Status | Fork-only value / behavior |
|---|---|---|---|
| 500 Seat salary base/rate | unset | HUMAN_CONFIRM_REQUIRED | 10/100 KAIOS per 60-second test epoch |
| 500 Seat epoch definition | MONTHLY_DAY_5_00_00_UTC_PLUS_8 | FROZEN_IMPLEMENTATION_MISMATCH_BLOCKER | 60 seconds (duration-only frozen module) |
| 18911 Alchemy epoch definition | unset | HUMAN_CONFIRM_REQUIRED | 86400 seconds |
| Reserve minimum | unset | HUMAN_CONFIRM_REQUIRED | dynamic balance lock for retry test only |
| Salary exposure cap | unset | HUMAN_CONFIRM_REQUIRED | 10000.0 per transaction / 100000.0 per UTC day |
| Allocation exposure cap | unset | HUMAN_CONFIRM_REQUIRED | 10000.0 per transaction / 100000.0 per UTC day |
| 8888 route cap | unset | HUMAN_CONFIRM_REQUIRED | 10000.0 per transaction / 100000.0 per UTC day |
| 11520 settlement cap | unset | HUMAN_CONFIRM_REQUIRED | 10000.0 per transaction / 100000.0 per UTC day |
| 8888 deposit interest rate | unset | HUMAN_CONFIRM_REQUIRED | unset; future-only checkpoint architecture tested locally |
| Governance delay | 3600 seconds | HUMAN_FINAL_CANON_TECHNICAL_MINIMUM | 3600 seconds |
| Distinct BankGovernance approver | unset | HUMAN_CONFIRM_REQUIRED | 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 |
| Pause authority | unset | HUMAN_CONFIRM_REQUIRED | Final BankGovernance and bootstrap governance PAUSER remain; pause cannot spend or unpause |
| Initial module enable/disable state | six active; BankMigration registered but inactive | HUMAN_FINAL_CANON | matches Mainnet candidate |

## Blocking conditions

- FROZEN_CELESTIAL_SEAT_500_CALENDAR_MONTH_MISMATCH_REQUIRES_HUMAN_FREEZE_DECISION
- DEPLOYMENT_SIGNER_CONTROL_RECONFIRMATION_REQUIRED
- HUMAN_CONFIRM_REQUIRED:500 Seat salary base/rate
- HUMAN_CONFIRM_REQUIRED:18911 Alchemy epoch definition
- HUMAN_CONFIRM_REQUIRED:Reserve minimum
- HUMAN_CONFIRM_REQUIRED:Salary exposure cap
- HUMAN_CONFIRM_REQUIRED:Allocation exposure cap
- HUMAN_CONFIRM_REQUIRED:8888 route cap
- HUMAN_CONFIRM_REQUIRED:11520 settlement cap
- HUMAN_CONFIRM_REQUIRED:8888 deposit interest rate
- HUMAN_CONFIRM_REQUIRED:Distinct BankGovernance approver
- HUMAN_CONFIRM_REQUIRED:Pause authority
- MAINNET_DEPLOY_APPROVED_NOT_RECEIVED

No line in this manifest authorizes a transaction.
