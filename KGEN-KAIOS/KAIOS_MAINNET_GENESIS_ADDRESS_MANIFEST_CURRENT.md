# KAIOS Mainnet Genesis — Current Address Manifest

STATUS: ACTIVE / MAINNET_GENESIS_LIVE  
NETWORK: BNB Smart Chain Mainnet  
CHAIN_ID: 56  
GENESIS_TIME: 2026-08-13 13:05:37 UTC+8  
GENESIS_BLOCK: 115637581  
EVIDENCE_COMMIT: `2d6d152e0d3c885822745c43d4d96a0836bf4e0e`  
FROZEN_SOURCE_HEAD: `9492d73aaac7a9cee2cf9b813aa78468719aadcd`

This CURRENT manifest is a deployment/state index. It does not authorize new deployment, migration, upgrade, settlement, asset transfer, or chain write.

## 1. Pre-existing formal universe contracts reused by KAIOS Genesis

| Identity | Address | Status | Notes |
|---|---|---|---|
| KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` | LIVE | Canonical KGEN token / mass lineage root |
| 11520 Brain | `0xd0605F4EF10e5C1438F11AF9edc36926769239d6` | LIVE | Pre-existing 11520 Brain; NOT the KAIOS Exchange Settlement proxy |
| Legacy 12345 TempleHeart V3.2.6 | `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972` | LEGACY / DO_NOT_TOUCH | Reused as legacy Heart lineage; Genesis evidence records `legacyHeartTouched = NO` |

## 2. KAIOS Genesis new Mainnet deployments

| # | Identity | Address | Deployment transaction | Block |
|---:|---|---|---|---:|
| 1 | KAIOS_ORGAN_REGISTRY | `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D` | `0x3a08b751152d9861aafd6c4d98a0f2da6fe24657359e4927915de57c2e26f766` | 115628496 |
| 2 | LINGXIAO_18888_BANK_IMPLEMENTATION | `0x8125045039Fe969490d57185233B7d64A494A829` | `0x6213d21f9463e01d5d4dd0fe8422da9354cdb19c612b3eaf413bab88bb1315cb` | 115628499 |
| 3 | LINGXIAO_18888_BANK_PROXY | `0x11d34c0F723aCd334B8F95076f73F07f06202aab` | `0x6bc60d0dbf1a1d1e62f8fe62f203239a126d597c5f44a0e44ac9def54679d8c3` | 115628510 |
| 4 | GAOLAOZHUANG_8888_COMMERCIAL_BANK_IMPLEMENTATION | `0x94341fB340cF8Bd0069cD1Fcaf5bA0866B15c923` | `0xc434af43195b1edfea0bf083ec1adad3c606317ac2ee565c31e671c4ae6ba698` | 115628522 |
| 5 | GAOLAOZHUANG_8888_COMMERCIAL_BANK_PROXY | `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C` | `0xebe5688a6abec93883d1949d2d5dd6daaa76b10116f2af4090dbffe2cb8a8e24` | 115628524 |
| 6 | CELESTIAL_SEAT_500_IMPLEMENTATION | `0x8E48643030826c9121Cd2E086B811b9083E9f862` | `0xca8d6873d26530308710c1576bb356ec9852689e3c4460353daf3929a12121c0` | 115628527 |
| 7 | CELESTIAL_SEAT_500_PROXY | `0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe` | `0xeac9e86049a4523b7a17a25e838b6bf62ade95994de93f28cb337394c53ae3cf` | 115628538 |
| 8 | CIVILIZATION_ALLOCATION_IMPLEMENTATION | `0x216d69a413354CBab7ddDdC4fCfe2B3E0468197d` | `0x7659f72a65c70efdda6b779b65de61c958dbfbbee4c4f1105505687d3bd7d220` | 115628549 |
| 9 | CIVILIZATION_ALLOCATION_PROXY | `0x75A55Af6967932C4A1c896dB81Dd6F31e531c299` | `0xd30d485f55ed2af6afff82d752b39c615e12dc3b385952c68e4f095439a910e0` | 115628553 |
| 10 | ECONOMIC_ROUTER_8888_IMPLEMENTATION | `0x3ebc0A39F7981AAB3995AC828dc79A8B0753A05b` | `0x7ef6be94b298fdd917152ee06323f96198203f3b5aa6f6b74a69779e3991ebaf` | 115628556 |
| 11 | ECONOMIC_ROUTER_8888_PROXY | `0xC49f989c6ff0d22824df8D993Ce82207165C1428` | `0xc1904c2fef2a539182262618c441e6fa451aa4147e66272381a7078301691b6e` | 115628561 |
| 12 | EXCHANGE_SETTLEMENT_11520_IMPLEMENTATION | `0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363` | `0xc64f00332edd4a7adf23ec5028b579d0a145eac5acece46dcef29096d2793b68` | 115628572 |
| 13 | EXCHANGE_SETTLEMENT_11520_PROXY | `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df` | `0x71832f0a0bd85066d45347f521d5fee9dfd0b717ba2e40b87ef7f9960035a908` | 115628583 |
| 14 | BANK_RISK_CONTROLLER_IMPLEMENTATION | `0x8D231C82513cdfa978A7C157618Ff198b0a5d3E9` | `0xa871163c208f06981ae680f07b50493e00f509ec03cf6c88542bb0cd49936359` | 115628594 |
| 15 | BANK_RISK_CONTROLLER_PROXY | `0x61573a93a88c58DAa5066A0aA319f88cE34d88FC` | `0x6ead47598ff45521ec92a51073303c897bdc300f9ac9e93105d5b053fd5a8ecc` | 115628604 |
| 16 | BANK_GOVERNANCE_IMPLEMENTATION | `0x9d919E66AE2746D41D978e3d51DF594B2E5F5582` | `0x75634c96256af7fcc404a7ee58a0da9bc7f7ae7698781b6deec32a5ced97ea0a` | 115628610 |
| 17 | BANK_GOVERNANCE_PROXY | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | `0xe47a9761a3ad3dcb612cdd1dda2bd36e0606c836175870093b66f8e3ee550192` | 115628618 |
| 18 | BANK_MIGRATION_IMPLEMENTATION | `0xff281a821dBbA44EEc7b57475E3c28A916fcDAE7` | `0xb5d2735d66b2c0e1446882b8063d2ca348750d4078dcabe96099630a4760a2fe` | 115628620 |
| 19 | BANK_MIGRATION_PROXY | `0x72c14f5D2fa748C1579295A7E34c16453a3a17aB` | `0x4e069e7cc25b73c6c1d3ac66b4ee779075cfe58496bdfaac0df69146bfb05763` | 115628622 |
| 20 | KAIOS_TOKEN_CORE | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` | `0x731bccd9d1116831d9b43966672cb27d9017c75b6806c32109c5c210d2c3be9c` | 115628625 |
| 21 | ALCHEMY_FURNACE_18911 | `0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1` | `0x4dae645b4b40348fc06bd65f08d238919c20011924bf54da82c3d7e5f0fd6343` | 115628629 |
| 22 | KAIOS_GENESIS_INSCRIPTION | `0xb02CBc7698646653D541F494F510Fe18638AC7ae` | `0xb2ff08d1779229cc72904818ee5b342b2134ae247253c16156dd899f6bece336` | 115637610 |

## 3. Canonical public entry addresses

Use these public addresses for normal integration. Implementations are not public bank endpoints.

```text
KGEN
0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be

KAIOS / 33333 Gold & Silver Island
0xD4E67B3a69e41524c424150E6b6e921b01D036db

11520 Brain
0xd0605F4EF10e5C1438F11AF9edc36926769239d6

11520 KAIOS Exchange Settlement Proxy
0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df

18888 Lingxiao Celestial Bank Proxy
0x11d34c0F723aCd334B8F95076f73F07f06202aab

8888 Gaolaozhuang Commercial Bank Proxy
0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C

500 Celestial Seats Proxy
0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe

18911 Alchemy Furnace
0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1

KAIOS Organ Registry
0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D

KAIOS Genesis Inscription
0xb02CBc7698646653D541F494F510Fe18638AC7ae

Legacy 12345 TempleHeart V3.2.6 — DO NOT TOUCH
0xB016D4d8f1aED1339101b30722cad6dbA9B8C972
```

## 4. Genesis settlement accounting

```text
KGEN genesis supply:
72,000,000 KGEN

KGEN supply at Genesis settlement:
71,977,786.091069583125268765 KGEN

Recognized permanently destroyed KGEN:
22,213.908930416874731235 KGEN

Canonical scale:
1 KGEN = 1 metric ton = 1,000 kg
1 permanently destroyed KGEN = 1,000 KAIOS
1 KAIOS = 1 kg

Actual Genesis KAIOS:
22,213,908.930416874731235 KAIOS

18888 Genesis KAIOS balance:
22,213,908.930416874731235 KAIOS
```

Genesis settlement transaction:
`0xc9fab344cc0055cab2e8dad1105f0a913fa94c15b39c76a241d3f190eb18767a`

Genesis Epoch transaction:
`0xe2aad950d33214d05f44274d76d71f72a6d1f9a3192df8682d3a10913f0996be`

## 5. Governance identities

These are governance addresses, not additional deployed-contract counts unless independently proven to contain contract code.

```text
Deployment Signer
0xb3C54ca96De0dED4Ca0151F629ff9781506ba261
Role: DEPLOYMENT ONLY / NO PERMANENT GOVERNANCE

Mother / Primary Governance
0xCd60BF474e691F2484950a0276Eaf507616Ca4b9

Jade Emperor / Distinct Approver
0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756

Guanyin / Final Emergency Pauser
0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE

Governance delay
3600 seconds
```

## 6. Deployment counts

```text
KAIOS Genesis new deployment addresses = 22
Pre-existing formal contracts reused = 3
Manifest formal contract addresses = 25
Successful Genesis/Mainnet transactions = 57
```

`57 transactions != 57 contracts`.

The legacy 8888 treasury lineage address `0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9` is not counted as the new 8888 Bank and must not be used as its proxy address.

## 7. Future / not deployed at Genesis

As recorded by the Genesis evidence:

```text
511111 / KUFO = FUTURE_NOT_DEPLOYED
KAIOS Pair Registry = FUTURE_NOT_DEPLOYED
```

GitHub source existence is not Mainnet deployment proof. `KUFO.sol`, `KUFOClaimWormhole.sol`, `KSHIP.sol`, and `KSHIPConverter.sol` must remain source/architecture status until a later independent deployment record proves otherwise.

## 8. Current truth precedence

For deployment-state questions, use this order:

1. successful Mainnet receipts / verified chain state;
2. Genesis evidence commit `2d6d152e0d3c885822745c43d4d96a0836bf4e0e`;
3. this CURRENT manifest;
4. frozen source and Solidity source;
5. historical PR text and pre-deployment previews.

Historical `MAINNET_TRANSACTION = NOT_AUTHORIZED`, `PREVIEW_NOT_FINAL`, or `Review candidate` statements describe pre-Genesis stages and must not override later verified `KAIOS_MAINNET_GENESIS_COMPLETE` evidence.

## 9. Safety boundary

This manifest performs no chain write and grants no authority to:

- redeploy any Genesis contract;
- replay Genesis settlement;
- transfer KGEN or KAIOS;
- change governance;
- upgrade proxies;
- touch Legacy 12345 TempleHeart;
- claim future KUFO/KSHIP deployment.

Any later deployment must receive a new independent deployment evidence record and must not rewrite Genesis history.
