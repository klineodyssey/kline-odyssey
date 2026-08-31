# BSC Token Brand Verification Working V1

Status: `DRAFT / KGEN_AND_KAIOS_TOKEN_INFO_SUBMITTED_PENDING_BSCSCAN / OWNERSHIP_VERIFIED`

Execution branch: `gm/bsc-token-brand-verification-v1`

## Evidence boundary

- Latest `origin/main` synchronized into this branch: `3ccb764ca8c8067e6a8827d7d37941d1a3457107`.
- PR #196 pre-update head: `d333ab6c97148b8d596e587df9a21b213fd9ec2b`.
- PR #162 exact brand head reused: `f403a27d78acef85a599ec712fcb2a168c771409`.
- PR #179 exact KGEN submission-package head reused: `d88ed1bfbee8b495b3bfb776b865cbb061384309`.
- Public explorer and asset observations were independently reproduced at `2026-08-31T13:07:59Z` (`2026-08-31T21:07:59+08:00`).
- `SUBMITTED` means an external form actually produced acceptance evidence. `PUBLISHED` means the public token page was re-read and displays the expected metadata and logo. Neither word is inferred from repository readiness.
- The public BscScan Contract tab was re-read as `Source Code Verified / Exact Match` after the user explicitly confirmed the source-verification submission.
- The user separately confirmed the KAIOS ownership submission and then the KAIOS token-information application. A locally configured signer was used only to sign and recover the BscScan ownership challenge offline. No signer secret value was displayed, logged, committed or transmitted.
- The authenticated BscScan account accepted the ownership proof and lists the KAIOS contract under `My Verified Addresses`. The token-information form then returned its explicit submission-accepted message at the observation time recorded below.
- No transaction, transfer, token approval, deployment, upgrade or governance execution was performed.

## KGEN current public state

| Field | Branch-reported candidate value |
|---|---|
| Network | BNB Smart Chain Mainnet, chainId `56` |
| Contract | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` |
| Name / symbol / decimals | `KLINE GENESIS` / `KGEN` / `18` |
| BscScan source | `EXACT_MATCH_VERIFIED` (`KGEN_Token_V7_5_2`) |
| Proxy | `NO` |
| Current owner | `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` (BankGovernance contract) |
| Token information | `SUBMITTED_PENDING_BSCSCAN`; not yet published |
| Logo | `SUBMITTED_PENDING_BSCSCAN`; public token page publication not yet confirmed |
| Reputation | `UNKNOWN` |
| DEX price reference | `LIVE_PUBLIC_REFERENCE`; GeckoTerminal KGEN/WBNB on PancakeSwap V2 |

Before submission, the KGEN public page had no official website or published logo. PR #179 remained the single KGEN submission-package lineage and supplied the official links, description and asset URLs. After explicit user confirmation, the authenticated BscScan form accepted a first-time KGEN token-information application. Publication is still pending BscScan review.

### KGEN canonical public assets

| Asset | SHA-256 | Public result |
|---|---|---|
| `assets/kgen/kgen-logo-64.png` | `36a57aa629115c78ca98a98f16e8f473c20e4e4414a5dd40e354c7ad6c5b4886` | `64x64 RGBA`, HTTP `200`, `image/png` |
| `assets/kgen/kgen-logo-256.png` | `955afb35b65e7e5c106d774fe6b624d3aee75c6048b311604d35563e97c39e68` | `256x256 RGBA`, HTTP `200`, `image/png` |
| `assets/kgen/kgen-logo.svg` | `cfc59dd3268dcac166a35ed92036106dc0a28760da13b7b5204df1620cc9285b` | HTTP `200`, `image/svg+xml` |

Public URLs:

- `https://klineodyssey.github.io/kline-odyssey/assets/kgen/kgen-logo-64.png`
- `https://klineodyssey.github.io/kline-odyssey/assets/kgen/kgen-logo-256.png`
- `https://klineodyssey.github.io/kline-odyssey/assets/kgen/kgen-logo.svg`

### KGEN live market reference

- Pair: `KGEN/WBNB` on PancakeSwap V2 (BSC).
- Pair address: `0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`.
- KGEN token: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`.
- WBNB token: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`.
- Public reference: `https://www.geckoterminal.com/bsc/pools/0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`.
- GeckoTerminal displayed a non-zero KGEN price and pool liquidity when re-read at `2026-08-31T18:36:19Z`; both values are time-sensitive and must not be frozen as a canonical price.
- The BscScan application exposed only CoinMarketCap and CoinGecko coin-ticker fields. No matching KGEN coin page was found on those two providers, so those fields were correctly left blank rather than populated with a GeckoTerminal pool URL. This does not mean KGEN lacks a live DEX price.

## KAIOS current public and deployment state

| Field | Branch-reported candidate value |
|---|---|
| Network | BNB Smart Chain Mainnet, chainId `56` |
| Contract | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` |
| Name / symbol / decimals | `KAIOS Civilization Credit` / `KAIOS` / `18` |
| Deployment transaction | `0x731bccd9d1116831d9b43966672cb27d9017c75b6806c32109c5c210d2c3be9c`, receipt status `1`, block `115628625` |
| Creator / deployer | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` |
| Proxy / implementation / admin | `NO` / `NOT_APPLICABLE` / `NOT_APPLICABLE` |
| Ownable owner | `NOT_APPLICABLE`; deployed contract has no `owner()` surface |
| Runtime bytecode | `5776` bytes; keccak256 `0x3a036ce95ac0929b247b40c9a303c2c4bfaf9aeb9bc171c009ad3532316df023` |
| BscScan source | `VERIFIED_EXACT_MATCH`; public Contract tab displays `Source Code Verified`, contract name `KAIOS`, compiler `v0.8.24+commit.e11b9ed9`, optimizer `1`, EVM `paris`, license `MIT` |
| Token information | `SUBMITTED_PENDING_BSCSCAN`; not yet published |
| Logo | `SUBMITTED_PENDING_BSCSCAN`; public token page publication not yet confirmed |
| Reputation | `UNKNOWN` |

### KAIOS exact source reproduction and public observation

- Exact deployed source lineage: `codex/templeheart-v34-mainnet`, file `KGEN-KAIOS/contracts/KAIOS.sol`.
- Compiler: `0.8.24+commit.e11b9ed9`.
- Optimizer: enabled, runs `1`.
- `viaIR`: `true`.
- EVM version: `paris`.
- Metadata bytecode hash: `none`.
- Constructor arguments: canonical KGEN `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`, treasury 18888 `0x11d34c0F723aCd334B8F95076f73F07f06202aab`, organ registry `0xA9e7CbF161e39E556f4B5B8E41397aC4b87a932D`.
- Recompiled creation bytecode: `7131` bytes.
- ABI-encoded constructor arguments: `96` bytes.
- Actual deployment input: `7227` bytes.
- Creation-bytecode plus constructor-argument comparison: `PASS_EXACT_BYTE_FOR_BYTE`.
- Submitted Standard-JSON package: `C:\Desktop\KAIOS_BSCSCAN_STANDARD_INPUT.json`, SHA-256 `D986A085BEF7EBADFD0A3409B036C104C6E4B7EFCB6E33FF68436203974BBD05`, `8` literal source entries.
- BscScan source-verification response text: `Successfully generated matching Bytecode and ABI for Contract Address [0xD4E67B3a69e41524c424150E6b6e921b01D036db]`.
- Branch-reported public observation time: `2026-08-31T13:07:59Z`.
- Public verification URL: `https://bscscan.com/address/0xD4E67B3a69e41524c424150E6b6e921b01D036db#code`.

The current `main` copy of `KAIOS.sol` differs from the deployed source lineage. The successful exact-match verification used the deployed `codex/templeheart-v34-mainnet` lineage and did not redeploy or modify the Mainnet contract.

## Shared brand canon and KAIOS assets

PR #162 remains the existing KAIOS brand lineage. Its validator reports:

`KAIOS_BRAND_ASSET_VALIDATION=PASS assets=16 shared_mark=PASS`

The rule is `SAME_KGEN_MASTER_MARK_DIFFERENT_SYMBOL_NAMES`. No new logo or third brand lineage was created. The master-mark proof includes the exact shared 256-pixel raster hash:

- KGEN `assets/kgen/kgen-logo-256.png`: `955afb35b65e7e5c106d774fe6b624d3aee75c6048b311604d35563e97c39e68`.
- KAIOS `assets/kaios/kaios-logo-256.png`: `955afb35b65e7e5c106d774fe6b624d3aee75c6048b311604d35563e97c39e68`.

Submission-sized KAIOS assets:

| Asset | SHA-256 | Public result |
|---|---|---|
| `assets/kaios/kaios-logo-64.png` | `593cb8933cdd698a3e553b713a1c7b4fbb87127397a706e252fd1e23424cb6a6` | `64x64 RGBA`, HTTP `200`, `image/png` |
| `assets/kaios/kaios-logo.svg` | `12a9735fbaf0f0056a85c890986f23d39720c8ac01f7908c7a5af8290fb5f33e` | HTTP `200`, `image/svg+xml` |
| `assets/kaios/kaios-token-512.png` | `a0d6821bf03136e4d0a80bbc54f0a64263a91f7fcca5c1f6dc70e3ccc82f4056` | `512x512 RGBA` |
| `assets/kaios/kaios-og-1200x630.png` | `a3e99c03d3df36498991ea826af875329a1cf132ed23b7c51170fe40238bb2b2` | `1200x630 RGB` |

The PR #162 exact-head raw URLs are publicly accessible without login:

- `https://raw.githubusercontent.com/klineodyssey/kline-odyssey/f403a27d78acef85a599ec712fcb2a168c771409/assets/kaios/kaios-logo-64.png`
- `https://raw.githubusercontent.com/klineodyssey/kline-odyssey/f403a27d78acef85a599ec712fcb2a168c771409/assets/kaios/kaios-logo.svg`

## Official metadata checks

The website, GitHub, Telegram, YouTube, TikTok, Facebook and Instagram metadata URLs reused from PR #179 were independently checked and returned HTTP `200`. No unverified URL was invented.

## Ownership and authenticated submission readiness

- The BscScan session was authenticated as the `Klineodyssey` account when the user issued the action-time confirmations.
- The BscScan ownership challenge was signed offline and recovered to `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`, matching the explorer creator/deployer address. The secret value was not exposed or stored in repository evidence.
- BscScan returned: `Congratulations, the address ownership for [0xD4E67B3a69e41524c424150E6b6e921b01D036db] is verified.`
- `My Verified Addresses` was re-read and contained the KAIOS contract with verified date `2026-08-31`.
- The KAIOS first-time token-information application used the canonical shared 32x32 SVG mark at `https://klineodyssey.github.io/kline-odyssey/assets/kgen/kgen-logo.svg`, official public metadata, and no fabricated price listing.
- BscScan returned: `Thank you for your submission. You will receive an email containing further instructions shortly.` The acceptance page exposed no ticket identifier.
- Submission observation: `2026-08-31T18:21:23Z` (`2026-09-01T02:21:23+08:00`). Publication remains pending BscScan review; no duplicate submission should be made during the stated review window.
- The user then explicitly confirmed completing KGEN in the same workflow. The KGEN application reused PR #179 metadata and the same canonical 32x32 SVG mark, kept CoinMarketCap and CoinGecko price fields blank because no current listing URL was verified, and received the same BscScan submission-accepted message.
- KGEN submission observation: `2026-08-31T18:33:05Z` (`2026-09-01T02:33:05+08:00`). The acceptance page exposed no ticket identifier. KGEN publication also remains pending BscScan review and must not be resubmitted during the review window.

## External status and exact blocker

| Item | Status |
|---|---|
| KGEN source | `VERIFIED_EXACT_MATCH` |
| KGEN ownership claim | `VERIFIED_BSCSCAN_ACCOUNT`; verified-address date `2026-04-20` |
| KGEN token info / logo | `SUBMITTED_PENDING_BSCSCAN`; `NOT_YET_PUBLISHED` |
| KAIOS source | `VERIFIED_EXACT_MATCH` |
| KAIOS ownership claim | `VERIFIED_BSCSCAN_ACCOUNT`; verified-address date `2026-08-31` |
| KAIOS token info / logo | `SUBMITTED_PENDING_BSCSCAN`; `NOT_YET_PUBLISHED` |

`NEXT_EXTERNAL_GATE`: wait for the BscScan review email or public-page update. Do not file a duplicate application. `PUBLISHED` remains forbidden until the public token page displays the submitted metadata and logo.

## Safety and classification

- Secret scan: `PASS`; no private key, seed phrase, API token, auth token, password or raw signer credential is present in this report or its branch diff.
- IP classification: `PASS_PUBLIC_METADATA_ONLY`; this branch contains explorer facts, public addresses, public brand hashes and public asset URLs only. No protected engine, private quant model, alpha strategy or secret signal logic is published.
- Private key material present in this branch diff: `NO`.
- Credential or signer access: `LOCAL_OFFLINE_OWNERSHIP_SIGN_ONLY / SECRET_NOT_EXPOSED`.
- External source-verification submission: `EXECUTED_AFTER_USER_CONFIRMATION / PUBLIC_EXACT_MATCH_VERIFIED`.
- External KAIOS ownership submission: `EXECUTED_AND_VERIFIED`.
- External KAIOS token-information submission: `SUBMITTED_PENDING_BSCSCAN`.
- External KGEN token-information submission: `SUBMITTED_PENDING_BSCSCAN`.
- Token transfer executed: `NO`.
- BNB transfer executed: `NO`.
- Contract redeployed: `NO`.
- Governance executed: `NO`.
