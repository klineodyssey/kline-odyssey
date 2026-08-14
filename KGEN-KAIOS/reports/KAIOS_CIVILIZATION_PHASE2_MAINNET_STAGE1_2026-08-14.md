# KAIOS Civilization Phase 2 Mainnet Stage 1 Evidence

Status: **COMPLETE / LIVE INACTIVE**

- Network: BSC Mainnet (chainId 56)
- Frozen source HEAD: `ed69c2bf911cae40f889e94803ba33f432d25c55`
- Phase 2 config SHA-256: `c327745a66f1aee0f5c0d23ee7ec2e950efecb1ff0dec5bd35390e8713f430eb`
- Completion block: `115888742`
- Completion timestamp: `1786710610`
- KGEN tax redirect: **NOT EXECUTED**
- KGEN ownership transfer: **NOT EXECUTED**
- All three modules: **REGISTERED INACTIVE**

## Deployments

| Identity | Address | Transaction | Block | Gas used |
|---|---|---|---:|---:|
| CELESTIAL_ELIGIBILITY_IMPLEMENTATION | 0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779 | 0x039c28a90b5a87be6826c8f9323f9489eee67474b1de9fdd8c2377bc4464b93b | 115864643 | 2840550 |
| CELESTIAL_ELIGIBILITY_PROXY | 0xA50743fd0fe022714831482355A27559027368F9 | 0xaf88e43bf9d90d10c1d095c27fbe02fd202b30f1550cb764c8e1137e92fa7640 | 115880531 | 387946 |
| KGEN_RESERVE_REDEMPTION_IMPLEMENTATION | 0x8D4a697549Ee45e9973041d0f1c0d0394B1A1034 | 0xc8fcff9e3c2713ffd8071814b6a3fbb6f64d3bbd72dae20e504f04fba93ad724 | 115880542 | 2424248 |
| KGEN_RESERVE_REDEMPTION_PROXY | 0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE | 0x9125511c8d0b55f4e4553fe538a1d1eb68d9052a0f858820a5ec2bf23cd9adab | 115880553 | 537046 |
| CELESTIAL_CAPITAL_COMMITMENT_IMPLEMENTATION | 0x09b4371B071d8957622DD640dbd0F713897Db167 | 0x2b1119f15649ef041fb7107f19945195818e6e7cf98bd12262e4b457266780a1 | 115880564 | 2218099 |
| CELESTIAL_CAPITAL_COMMITMENT_PROXY | 0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c | 0xf4e640168349b37680bee969bfe34ffde5f379a830a9dcb70b561a23ca2590b2 | 115880574 | 391313 |

## Delayed module registrations

Each action used Mother proposal, distinct Jade Emperor approval, and the formal 3600-second BankGovernance delay.

| Action | Proposal transaction | Approval transaction | Execution transaction |
|---|---|---|---|
| REGISTER_ELIGIBILITY | 0x02bd696f7a19d22f67ff0d11e9924354fc0507f43f2fb4d8370b544696865481 | 0x4431f3d7462f72c4c8d7cb1df514cd4cc5e59f6eb7b38376b9931b6b3b4207d6 | 0x2b01a31dea9094a12609e6ef4b6d03e2a3bd3ee814da3d2b38e067276d4b6899 |
| REGISTER_RESERVE_REDEMPTION | 0x6223ddfb2f8e1962260d5b99f71dba8db131b6426e6216fa6594ed2310d3336c | 0xc898e25f568728b65df4b548e32700760ac702dbe321699b39f6c2200ad3f1e0 | 0x5a5b071cf76627d4a059f26b8ad2fbdabda444b21e01581763262c274110123d |
| REGISTER_CAPITAL_COMMITMENT | 0xf4488975f992f69a3f4c8165d633aa942cfc40922fe65274afea46273b449963 | 0x54a047194d75a4f773dbc72d359f034c67437ae4779d7dcfd01184b01d1734ac | 0x8ae93238ca8ba0075ca015e1bd1cd56c9eae1fa615bf4b41d3c38991bc16d5a4 |

## Governance finalization

| Module | Finalization transaction | Block |
|---|---|---:|
| FINALIZE_ELIGIBILITY_GOVERNANCE | 0xd48b849b6eb5cd994267c0994957c418b3eccdd83895c8bc70f1f0232a619ce8 | 115888688 |
| FINALIZE_RESERVE_REDEMPTION_GOVERNANCE | 0x0545e3a1adf652e691160538ca53505c891ddf189d7f8820b79097dd2e3f906a | 115888699 |
| FINALIZE_CAPITAL_COMMITMENT_GOVERNANCE | 0x4da88336b5603ef62f7a56e53db2108bec10938e649ba9b2f21cf59a83a74c0e | 115888709 |

Contribution verifier configuration used proposal `0x5558685636aafd8a21913045386cd4c122ee7b0ec65f819bc42f745307e94af3`, approval `0xdd1f08937734e0a62bff48d0d19dddf0225a24dd070c6ee9f7b4006479e32923`, and execution `0xc253f686a6ba62a0a4c49f5d7a48e405ccbb3b7e8b73aa657d31b0d59c9f326c`.

## Final controls

- BankGovernance holds DEFAULT_ADMIN, GOVERNANCE and UPGRADER on every Phase 2 proxy.
- Mother and the deployment signer hold none of those permanent module roles.
- Guanyin retains PAUSER only.
- CelestialEligibility, KGENReserveRedemption and CelestialCapitalCommitment remain inactive.
- Redemption remains disabled. No redemption, capital commitment, 18911 eligibility submission, Seat500 assignment, KGEN tax change or KGEN ownership transfer occurred.
- Formal KGEN/KAIOS supplies and all relevant Phase 2 token balances were unchanged across governance execution.
- The 18888 implementation remained `0x8125045039Fe969490d57185233B7d64A494A829`.

## Gas

- Transactions recorded: `21`
- Total gas used: `10391831`
- Total BNB spent: `0.00051959155`

Machine-readable evidence: `KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE1_2026-08-14.json`.
