# KAIOS MAINNET GENESIS — FORMAL ADDRESS MANIFEST

> Canonical cumulative address manifest for KAIOS on BNB Smart Chain Mainnet.
>
> This edition preserves the Genesis deployment record and adds the later Phase 2 contracts, KGEN ownership-governance migration, and the current KGEN Bank Wallet distinction. It does not rewrite deployment history and does not claim that an unmerged source branch is already part of `main`.

## Document control

| Field | Value |
|---|---|
| Network | BNB Smart Chain Mainnet |
| Chain ID | `56` |
| Genesis time | `2026-08-13T05:05:37Z` / `2026-08-13T13:05:37+08:00` |
| Genesis block | `115637581` |
| Genesis frozen source HEAD | `9492d73aaac7a9cee2cf9b813aa78468719aadcd` |
| Genesis final evidence commit | `2d6d152e0d3c885822745c43d4d96a0836bf4e0e` |
| Genesis PR | `#135` — Draft / open at Genesis completion |
| Phase 2 evidence lineage | PR `#136`, source head `00c79b380ce094c17d75697f360820c4d2035071` |
| Phase 2 source status | Draft / open / unmerged; deployment facts are independently on-chain |
| Current document classification | `CURRENT_CUMULATIVE_MANIFEST` |
| Repository `origin/main` observed during this revision | `8db13871928a482a6a6719d93a240c52d58fa644` |
| KGEN owner / Bank Wallet live verification block | `118333481` |
| Last on-chain reserve observation used here | BSC block `118333481`, `2026-08-27T06:12:04Z` / `2026-08-27T14:12:04+08:00` |

## 1. Current headline status

| System | Status | Canonical address |
|---|---|---|
| KGEN mother-universe token | `LIVE` | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` |
| KAIOS token core / K33333 | `LIVE` | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` |
| 18888 Lingxiao Celestial Bank | `LIVE` | `0x11d34c0F723aCd334B8F95076f73F07f06202aab` |
| 8888 Gaolaozhuang Commercial Bank | `LIVE` | `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C` |
| CelestialSeat500 | `LIVE` | `0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe` |
| 11520 Exchange Settlement | `LIVE` | `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df` |
| 18911 Alchemy Furnace V1 | `LIVE_DEPLOYED_V1_HISTORY` | `0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1` |
| KAIOS Genesis Inscription | `LIVE` | `0xb02CBc7698646653D541F494F510Fe18638AC7ae` |
| Celestial Eligibility V1 | `LIVE_ACTIVE_CONTRACT / PUBLIC_APPLICATION_DISABLED` | `0xA50743fd0fe022714831482355A27559027368F9` |
| Celestial Capital Commitment | `LIVE_ACTIVE` | `0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c` |
| KGEN Reserve Redemption | `LIVE_INACTIVE_RESERVE_ACCUMULATING` | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` |

`LIVE` means code is deployed at the stated BSC Mainnet address. It does not by itself mean every UI, application path, redemption path, market, or successor design is enabled.

## 2. Original universe contracts reused by KAIOS

These contracts predate the KAIOS Genesis deployment and were reused rather than redeployed.

| Organ | Address | Status / boundary |
|---|---|---|
| KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` | Existing formal KGEN token; must not be redeployed or modified through this manifest |
| K11520 Brain / Huaguoshan Taiwan Universal Exchange | `0xd0605F4EF10e5C1438F11AF9edc36926769239d6` | Existing 11520 runtime address; distinct from the later KAIOS settlement proxy |
| Legacy TempleHeart V3.2.6 | `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972` | `LEGACY_V3_2_6 / DO_NOT_TOUCH` |

Legacy 8888 Treasury lineage:

- Address: `0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9`
- Status: `LEGACY_8888_TREASURY_LINEAGE`
- Boundary: this is **not** the new 8888 Commercial Bank proxy.

## 3. KAIOS Genesis deployments

### 3.1 Organ Registry

| Item | Value |
|---|---|
| Address | `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D` |
| Deployment transaction | `0x3a08b751152d9861aafd6c4d98a0f2da6fe24657359e4927915de57c2e26f766` |
| Deployment block | `115628496` |

### 3.2 K18888 Lingxiao Celestial Bank

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x8125045039Fe969490d57185233B7d64A494A829` | `0x6213d21f9463e01d5d4dd0fe8422da9354cdb19c612b3eaf413bab88bb1315cb` | `115628499` |
| Canonical proxy | `0x11d34c0F723aCd334B8F95076f73F07f06202aab` | `0x6bc60d0dbf1a1d1e62f8fe62f203239a126d597c5f44a0e44ac9def54679d8c3` | `115628510` |

External systems must use the proxy address. The implementation address is deployment lineage, not the bank account endpoint.

### 3.3 K8888 Gaolaozhuang Commercial Bank

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x94341fB340cF8Bd0069cD1Fcaf5bA0866B15c923` | `0xc434af43195b1edfea0bf083ec1adad3c606317ac2ee565c31e671c4ae6ba698` | `115628522` |
| Canonical proxy | `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C` | `0xebe5688a6abec93883d1949d2d5dd6daaa76b10116f2af4090dbffe2cb8a8e24` | `115628524` |

### 3.4 CelestialSeat500

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x8E48643030826c9121Cd2E086B811b9083E9f862` | `0xca8d6873d26530308710c1576bb356ec9852689e3c4460353daf3929a12121c0` | `115628527` |
| Canonical proxy | `0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe` | `0xeac9e86049a4523b7a17a25e838b6bf62ade95994de93f28cb337394c53ae3cf` | `115628538` |

Frozen salary cross-check baseline: `88 KAIOS / active seat / Gregorian month`, maturing on the fifth day of each month at `00:00 UTC+8`. Seat assignment and salary authorization remain separate governance facts.

### 3.5 Civilization Allocation

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x216d69a413354CBab7ddDdC4fCfe2B3E0468197d` | `0x7659f72a65c70efdda6b779b65de61c958dbfbbee4c4f1105505687d3bd7d220` | `115628549` |
| Canonical proxy | `0x75A55Af6967932C4A1c896dB81Dd6F31e531c299` | `0xd30d485f55ed2af6afff82d752b39c615e12dc3b385952c68e4f095439a910e0` | `115628553` |

### 3.6 18888 → 8888 Economic Router

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x3ebc0A39F7981AAB3995AC828dc79A8B0753A05b` | `0x7ef6be94b298fdd917152ee06323f96198203f3b5aa6f6b74a69779e3991ebaf` | `115628556` |
| Canonical proxy | `0xC49f989c6ff0d22824df8D993Ce82207165C1428` | `0xc1904c2fef2a539182262618c441e6fa451aa4147e66272381a7078301691b6e` | `115628561` |

### 3.7 11520 Exchange Settlement

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363` | `0xc64f00332edd4a7adf23ec5028b579d0a145eac5acece46dcef29096d2793b68` | `115628572` |
| Canonical proxy | `0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df` | `0x71832f0a0bd85066d45347f521d5fee9dfd0b717ba2e40b87ef7f9960035a908` | `115628583` |

### 3.8 Bank Risk Controller

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x8D231C82513cdfa978A7C157618Ff198b0a5d3E9` | `0xa871163c208f06981ae680f07b50493e00f509ec03cf6c88542bb0cd49936359` | `115628594` |
| Canonical proxy | `0x61573a93a88c58DAa5066A0aA319f88cE34d88FC` | `0x6ead47598ff45521ec92a51073303c897bdc300f9ac9e93105d5b053fd5a8ecc` | `115628604` |

### 3.9 Bank Governance

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0x9d919E66AE2746D41D978e3d51DF594B2E5F5582` | `0x75634c96256af7fcc404a7ee58a0da9bc7f7ae7698781b6deec32a5ced97ea0a` | `115628610` |
| Canonical proxy | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | `0xe47a9761a3ad3dcb612cdd1dda2bd36e0606c836175870093b66f8e3ee550192` | `115628618` |

### 3.10 Bank Migration

| Component | Address | Deployment transaction | Block |
|---|---|---|---:|
| Implementation | `0xff281a821dBbA44EEc7b57475E3c28A916fcDAE7` | `0xb5d2735d66b2c0e1446882b8063d2ca348750d4078dcabe96099630a4760a2fe` | `115628620` |
| Canonical proxy | `0x72c14f5D2fa748C1579295A7E34c16453a3a17aB` | `0x4e069e7cc25b73c6c1d3ac66b4ee779075cfe58496bdfaac0df69146bfb05763` | `115628622` |

Initial state: `REGISTERED_BUT_INACTIVE`.

### 3.11 K33333 KAIOS Token Core

| Item | Value |
|---|---|
| Address | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` |
| Deployment transaction | `0x731bccd9d1116831d9b43966672cb27d9017c75b6806c32109c5c210d2c3be9c` |
| Deployment block | `115628625` |
| Formal Genesis conversion | `1 permanently burned KGEN = 1,000 KAIOS` |
| Mass scale | `1 KGEN = 1 metric ton`; `1 KAIOS = 1 kilogram` |

### 3.12 K18911 Taishang Laojun Alchemy Furnace V1

| Item | Value |
|---|---|
| Address | `0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1` |
| Deployment transaction | `0x4dae645b4b40348fc06bd65f08d238919c20011924bf54da82c3d7e5f0fd6343` |
| Deployment block | `115628629` |
| Classification | `DEPLOYED_V1_HISTORY` |

The deployed V1 provides holder-authorized KAIOS burn, Alchemy proof, and replay protection for future lineage. It must not be represented as an undeployed successor design, KUFO deployment, or a completed K1852 relay.

### 3.13 KAIOS Genesis Inscription

| Item | Value |
|---|---|
| Address | `0xb02CBc7698646653D541F494F510Fe18638AC7ae` |
| Inscription transaction | `0xb2ff08d1779229cc72904818ee5b342b2134ae247253c16156dd899f6bece336` |
| Deployment block | `115637610` |
| Canonical Markdown Keccak-256 | `0xbc89db0915e1fd0e978ae0cfe194f4b46db22534febab35563de2802935b3704` |
| Canonical Markdown SHA-256 | `add44b79083a20a6d9f240a99c5fd47658f191ce8b3fa81da6f60c97e8b4470f` |

## 4. Phase 2 contracts deployed after Genesis

These six contracts were deployed after the Genesis manifest was frozen. Their deployment facts are on-chain; their detailed source and evidence lineage remains on Draft PR `#136` and must not be described as merged into `main` until that occurs.

| Organ | Component | Address | Deployment transaction | Block | Runtime status |
|---|---|---|---|---:|---|
| Celestial Eligibility V1 | Implementation | `0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779` | `0x039c28a90b5a87be6826c8f9323f9489eee67474b1de9fdd8c2377bc4464b93b` | `115864643` | Deployed |
| Celestial Eligibility V1 | Proxy | `0xA50743fd0fe022714831482355A27559027368F9` | `0xaf88e43bf9d90d10c1d095c27fbe02fd202b30f1550cb764c8e1137e92fa7640` | `115880531` | `LIVE_ACTIVE`; public burn application disabled by later Canon conflict |
| KGEN Reserve Redemption | Implementation | `0x8D4a697549Ee45e9973041d0f1c0d0394B1A1034` | `0xc8fcff9e3c2713ffd8071814b6a3fbb6f64d3bbd72dae20e504f04fba93ad724` | `115880542` | Deployed |
| KGEN Reserve Redemption | Proxy / KGEN Bank Wallet | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` | `0x9125511c8d0b55f4e4553fe538a1d1eb68d9052a0f858820a5ec2bf23cd9adab` | `115880553` | `LIVE_INACTIVE_RESERVE_ACCUMULATING` |
| Celestial Capital Commitment | Implementation | `0x09b4371B071d8957622DD640dbd0F713897Db167` | `0x2b1119f15649ef041fb7107f19945195818e6e7cf98bd12262e4b457266780a1` | `115880564` | Deployed |
| Celestial Capital Commitment | Proxy | `0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c` | `0xf4e640168349b37680bee969bfe34ffde5f379a830a9dcb70b561a23ca2590b2` | `115880574` | `LIVE_ACTIVE`; commitment alone does not assign a seat |

Safety status for Celestial Eligibility V1:

- `PUBLIC_CELESTIAL_BURN_APPLICATION = DISABLED`
- `UI_PROMOTION = BLOCKED`
- `NO_5M_BURN_REQUEST`
- `NO_5M_COMMITMENT_REQUEST`
- `NO_SEAT_ASSIGNMENT`

Reason: the deployed V1 eligibility path treats a 5M KAIOS 18911 burn proof as a candidate requirement, while the later Human Final Canon separates the non-burning 18888 performance-bond path from the independent 18911 burn/alchemy path.

## 5. KGEN owner, Mother governance, and Bank Wallet — corrected classification

### 5.1 The three addresses are different roles

| Role | Address | Address type | Meaning |
|---|---|---|---|
| Mother / primary governance proposer | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | Governance signer address | Creates authorized governance proposals; not the current KGEN token owner |
| BankGovernance proxy / current KGEN owner | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | Smart-contract proxy | Current `owner()` of KGEN; executes only through the governed proposal, approval, delay, and execution path |
| KGEN Bank Wallet / Reserve Redemption proxy | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` | Smart-contract proxy | Receives the KGEN `0.10% Bank` tax rail after the wallet update; not the KGEN owner and not the 18888 KAIOS bank |

Therefore:

- `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` is **not** a personal wallet.
- `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` is **not** the KGEN owner.
- `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` is **not** 18888.
- `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` is the governance/timelock smart-contract owner of KGEN.
- `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` is the Mother governance proposer, not a substitute for `owner()`.

Fresh BSC read-only verification at block `118333481` returned:

```text
KGEN.owner()
= 0xa2792fBDCc8A8AaC364053431D44E0a8D335E166

KGEN.bankWallet()
= 0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE

eth_getCode(0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE)
= NON_EMPTY_CONTRACT_CODE
```

### 5.2 KGEN ownership migration

Immediately before the migration, the KGEN owner was the deployment signer:

`0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`

It was **not** Mother `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`.

| Field | Value |
|---|---|
| Transaction | `0xaca082ab94175bc1eba95685cc5095bb6fea8f01d03517aecd4e0948f818e9f9` |
| Block | `116012988` |
| Time | `2026-08-15T04:02:17Z` / `2026-08-15T12:02:17+08:00` |
| Previous owner | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` |
| New owner | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` |
| Operation | KGEN `transferOwnership(BankGovernance proxy)` |

This moved KGEN administrative ownership from a deployment signer to the formal BankGovernance proxy. It did not mint KGEN, transfer reserve balances, or convert KGEN into KAIOS.

### 5.3 KGEN Bank Wallet update

| Field | Historical value | Current value |
|---|---|---|
| KGEN Bank Wallet | `0xFA4d34c46e86058e672936fa03cfd79F4C7A4b3c` | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` |
| Role | Historical receiver | KGEN Reserve Redemption proxy / current future Bank-tax receiver |

Governed Stage 2C1 sequence:

| Step | Actor | Transaction | Time Asia/Taipei |
|---|---|---|---|
| Proposal | Mother | `0x625f39ab8ea2a5c3a6d68623b9f79122ab2aeaccece9ab32e913b231134c3a16` | `2026-08-15T16:55:27+08:00` |
| Approval | Jade Emperor | `0xa7ba5e2fd6dce3e7291cc0ba7026cfbf6d92fbac535c5c27b5b2e3ca7c84f713` | `2026-08-15T16:55:46+08:00` |
| Delayed execution trigger | Mother | `0x7d6be56b14133941991a1d22928603d82446bdcf80472fef9068ee0623d7bfdc` | `2026-08-15T17:55:45+08:00` |
| KGEN-level caller | BankGovernance proxy | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | Contract execution |

Only the configured future `bankWallet` receiver changed. Existing KGEN already held by the historical Bank Wallet did not move automatically. Reward Wallet, AutoLP Wallet, tax exemptions, market-maker pairs, and fixed tax rates were not changed by this operation.

### 5.4 KGEN fixed tax surface remains unchanged

| Rail | Rate |
|---|---:|
| Total qualifying tax | `0.30%` |
| Burn | `0.10%` |
| Bank | `0.10%` |
| Reward | `0.05%` |
| AutoLP | `0.05%` |
| Ordinary wallet-to-wallet transfer | `0%` |

The KGEN owner surface remains limited to the deployed contract's existing administrative functions, including tax-wallet, exemption, and market-maker-pair configuration plus ownership transfer/renunciation. This manifest does not add mint, seizure, blacklist, or tax-rate setter authority.

### 5.5 Current Reserve Redemption observation

At BSC block `118333481` (`2026-08-27T06:12:04Z` / `2026-08-27T14:12:04+08:00`):

| Field | Observed value |
|---|---|
| Proxy code | Present |
| KGEN balance | `20 KGEN` |
| Minimum reserve | `100 KGEN` |
| Paused | `false` |
| Redemption enabled | `false` |
| Request count | `0` |
| Total KGEN redeemed | `0` |
| Classification | `LIVE_INACTIVE_RESERVE_ACCUMULATING` |

Receiving KGEN at a normal address or reserve contract is not proof of burn. A KGEN→KAIOS claim remains valid only when the formal KGEN `totalSupply` decrease and required lineage evidence are verified.

## 6. KAIOS Genesis settlement and inscription

| Item | Value |
|---|---|
| KGEN total supply at original Genesis reference | `72,000,000 KGEN` |
| KGEN total supply at KAIOS Genesis settlement | `71,977,786.091069583125268765 KGEN` |
| Recognized permanently burned KGEN | `22,213.908930416874731235 KGEN` |
| Actual Genesis KAIOS | `22,213,908.930416874731235 KAIOS` |
| 18888 Genesis KAIOS balance | `22,213,908.930416874731235 KAIOS` |
| Settlement transaction | `0xc9fab344cc0055cab2e8dad1105f0a913fa94c15b39c76a241d3f190eb18767a` |
| Genesis epoch transaction | `0xe2aad950d33214d05f44274d76d71f72a6d1f9a3192df8682d3a10913f0996be` |

Genesis conversion invariant:

```text
Recognized permanently burned KGEN × 1,000
= Actual Genesis KAIOS
= 22,213,908.930416874731235 KAIOS
```

No address balance, tax routing, or transfer to a general wallet may substitute for a verified KGEN total-supply decrease.

## 7. Governance identities and security boundary

| Identity | Address | Formal role |
|---|---|---|
| Deployment signer | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` | Deployment only; no permanent governance |
| Mother | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | Primary governance proposer |
| Jade Emperor | `0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756` | Distinct governance approver |
| Guanyin | `0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE` | Final emergency pauser only |
| BankGovernance proxy | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` | Timelocked governed executor; current KGEN owner |

Normal high-risk path:

```text
Mother proposal
→ Jade Emperor approval
→ wait at least 3,600 seconds
→ permissionless/governed execution
```

Genesis governance evidence:

| Action | Transaction |
|---|---|
| Proposal | `0x9b9ffb38f607a4a7d19a12bfe21cd56c6f7ed40c126b146e2ec0ed9f31dce70b` |
| Approval | `0xa54cc8e64c542ff715604450458e43b72a2c25a935216457df297d3e840cdfe8` |
| Delayed execution | `0xd525cba81a7f742d4b9152a642e1a42feaaa21fd0ff4e6f52418a88b5f8a05d3` |

Governance delay: `3600 seconds`.

## 8. Canonical public addresses — quick copy

```text
KGEN
0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be

KAIOS / K33333
0xD4E67B3a69e41524c424150E6b6e921b01D036db

K11520 Brain
0xd0605F4EF10e5C1438F11AF9edc36926769239d6

KAIOS 11520 Settlement Proxy
0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df

K18888 Lingxiao Celestial Bank Proxy
0x11d34c0F723aCd334B8F95076f73F07f06202aab

K8888 Gaolaozhuang Commercial Bank Proxy
0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C

CelestialSeat500 Proxy
0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe

K18911 Alchemy Furnace V1
0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1

Organ Registry
0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D

Economic Router Proxy
0xC49f989c6ff0d22824df8D993Ce82207165C1428

Bank Risk Controller Proxy
0x61573a93a88c58DAa5066A0aA319f88cE34d88FC

Bank Governance Proxy / KGEN owner
0xa2792fBDCc8A8AaC364053431D44E0a8D335E166

KGEN Reserve Redemption Proxy / KGEN Bank Wallet
0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE

KAIOS Genesis Inscription
0xb02CBc7698646653D541F494F510Fe18638AC7ae

Mother
0xCd60BF474e691F2484950a0276Eaf507616Ca4b9

Jade Emperor
0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756

Guanyin
0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE
```

## 9. Address-type rules

1. A proxy address is the public runtime endpoint; its implementation address is lineage evidence.
2. A token `owner()` address is an authority controller, not necessarily a treasury, bank, or personal wallet.
3. The KGEN Bank Wallet is a tax-receiving destination, not KGEN ownership.
4. The 18888 KAIOS Bank and KGEN Reserve Redemption are different contracts, assets, ledgers, and duties.
5. Mother, Jade Emperor, and Guanyin are governance roles; none should be substituted for a contract address.
6. An address receiving KGEN does not prove burn or KAIOS creation.
7. Historical addresses remain evidence but must not replace current canonical proxy endpoints.

## 10. Deployment and transaction accounting

| Category | Count |
|---|---:|
| Pre-existing reused formal contracts | `3` |
| New contracts deployed in the KAIOS Genesis sequence | `22` |
| Phase 2 contracts added after Genesis | `6` |
| Formal contracts covered by this cumulative manifest | `31` |
| Successful Genesis Mainnet transactions | `57 / 57` |
| Genesis gas used | `27,604,633` |
| Genesis BNB spent | `0.00138023165 BNB` |
| Genesis full regression | `68 / 68 PASS` |

`57 / 57` is the Genesis transaction count, not the number of contracts.

## 11. Not deployed or not production-active

The following must not be represented as live solely because they appear in designs, Draft PRs, tests, or future Canon:

| System | Current classification |
|---|---|
| 511111 / KUFO production system | `NOT_DEPLOYED / FUTURE` |
| KSHIP production system | `NOT_DEPLOYED / FUTURE` |
| KAIOS market / pair registry | `NOT_DEPLOYED / FUTURE` |
| K1852 Catalyst Relay | `DESIGN_ONLY_UNFROZEN` |
| 18911 V3 fresh-catalyst successor | `IMPLEMENTED_REVIEW_CANDIDATE / NOT_DEPLOYED` |
| KGEN Reserve redemption | Contract deployed, redemption `DISABLED` |
| Public Celestial burn application | `DISABLED` |

## 12. Security assertions

| Assertion | Status |
|---|---|
| KAIOS arbitrary mint | `NONE` |
| Arbitrary bank drain | `BLOCKED_BY_FORMAL_ROLES_AND_GOVERNANCE` |
| Deployment signer permanent governance | `NONE` |
| Legacy Heart modified by KAIOS Genesis | `NO` |
| KGEN tax-rate setter introduced | `NO` |
| KGEN burn converted from balance transfer alone | `NO` |
| Private key included in this manifest | `NO` |
| Transaction sent by this documentation update | `NO` |

## 13. Source and evidence crosswalk

| Evidence | Purpose |
|---|---|
| `KGEN-KAIOS/KAIOS_MAINNET_GENESIS_ADDRESS_MANIFEST_CURRENT.md` | This cumulative address and status manifest |
| `KGEN-KAIOS/handbook/KAIOS_CIVILIZATION_CIRCULATORY_HANDOFF_HANDBOOK_CURRENT.md` | Current cross-system handoff and live-state classification |
| PR `#135` / commit `2d6d152e0d3c885822745c43d4d96a0836bf4e0e` | Genesis deployment and final evidence lineage |
| PR `#136` / head `00c79b380ce094c17d75697f360820c4d2035071` | Phase 2 deployment source and evidence lineage |
| `KGEN-KAIOS/reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE2C0_2026-08-15.json` | Phase 2 C0 deployment receipts |
| `KGEN-KAIOS/reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE2C1_2026-08-15.json` | KGEN ownership and Bank Wallet governed migration evidence |
| BSC receipts and runtime `eth_call` observations | Independent Mainnet facts |

Precedence:

```text
BSC receipt and runtime state
→ merged CURRENT Canon and handbook
→ frozen Genesis evidence
→ exact Draft PR deployment evidence
→ historical reports
→ chat snapshots
```

An on-chain deployment can be real even when its source PR is still Draft. The correct statement must record both facts: `DEPLOYED_ONCHAIN = YES` and `SOURCE_MERGED_TO_MAIN = NO` where applicable.

## 14. Publication checklist

Before using this manifest in a wallet, frontend, explorer submission, governance proposal, or deployment script:

1. Re-read chain ID `56` and the target contract code.
2. Use canonical proxy addresses for runtime calls.
3. Re-read `owner()`, roles, paused status, and implementation slots where relevant.
4. Re-read the current KGEN `bankWallet` rather than copying a historical receiver.
5. Do not enable Celestial burn applications, reserve redemption, KUFO/KSHIP, or a V3 furnace based only on this address list.
6. Never request, print, or store a private key in Markdown, Git, chat, CI, or terminal output.

## 15. Final canonical distinctions

```text
KGEN owner
= BankGovernance proxy
= 0xa2792fBDCc8A8AaC364053431D44E0a8D335E166

KGEN Bank Wallet
= KGEN Reserve Redemption proxy
= 0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE

KAIOS 18888 Bank
= Lingxiao Celestial Bank proxy
= 0x11d34c0F723aCd334B8F95076f73F07f06202aab

Mother
= primary governance proposer
= 0xCd60BF474e691F2484950a0276Eaf507616Ca4b9
```

These are four different roles. They must not be collapsed into one “bank,” “owner,” or personal-wallet identity.
