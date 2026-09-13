# BSC Token Brand Verification Working V1

Status: `DRAFT / HOLD_P0_EXTERNAL_SUBMISSION_AND_SIGNER_PROVENANCE / KAIOS_PUBLIC_EXACT_MATCH_OBSERVED`

Execution branch: `gm/bsc-token-brand-verification-v1`

## Evidence boundary

- Latest `origin/main` evaluated by exact-head CI: `ffd207165dafd729cc5b302948d6ee413a51789c`; branch relation before this correction was ahead `14` / behind `1`, with zero path overlap in the main-only evidence update.
- PR #196 pre-update head: `d333ab6c97148b8d596e587df9a21b213fd9ec2b`.
- PR #162 exact brand head reused: `f403a27d78acef85a599ec712fcb2a168c771409`.
- PR #179 exact KGEN submission-package head reused: `d88ed1bfbee8b495b3bfb776b865cbb061384309`.
- Public explorer and asset observations were independently reproduced at `2026-08-31T13:07:59Z` (`2026-08-31T21:07:59+08:00`).
- `SUBMITTED` means an external form actually produced acceptance evidence. `PUBLISHED` means the public token page was re-read and displays the expected metadata and logo. Neither word is inferred from repository readiness.
- The public BscScan Contract tab was branch-reported as `Source Code Verified / Exact Match`. Repository evidence does not establish who submitted the verification, which authenticated session was used, or whether the actor held Company authority.
- This branch must not claim access to, possession of, derivation from, or use of any signer secret. Public addresses and GitHub authorship do not establish controller, signer, ownership, employment or Company authority.
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
| Token information | `NOT_PUBLISHED` |
| Logo | `NOT_PUBLISHED`; BscScan renders `empty-token.svg` |
| Reputation | `UNKNOWN` |
| DEX price reference | `BRANCH_REPORTED_PUBLIC_OBSERVATION`; time-sensitive and non-canonical |

The KGEN `Info` tab contains only the BscScan update link. No existing token-info ticket or accepted ownership claim was found in repository evidence or the signed-out public surface. PR #179 remains the single KGEN submission-package lineage and supplies the official links, description and asset URLs.

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

- Branch-reported pair: `KGEN/WBNB` on PancakeSwap V2 (BSC), address `0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`.
- Public reference: `https://www.geckoterminal.com/bsc/pools/0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2`.
- The branch reported a non-zero price and liquidity observation at `2026-08-31T18:36:19Z`. This is not repository-owned price, liquidity, revenue, settlement or deployment evidence and must not be frozen as Canon.
- CoinMarketCap and CoinGecko listing fields remain unverified; absence of a verified listing URL must not be converted into a listing claim.

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
| Token information | `NOT_PUBLISHED` |
| Logo | `NOT_PUBLISHED` |
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
- Branch-reported local Standard-JSON candidate: `C:\Desktop\KAIOS_BSCSCAN_STANDARD_INPUT.json`, SHA-256 `D986A085BEF7EBADFD0A3409B036C104C6E4B7EFCB6E33FF68436203974BBD05`, `8` literal source entries.
- Branch-reported BscScan response text: `Successfully generated matching Bytecode and ABI for Contract Address [0xD4E67B3a69e41524c424150E6b6e921b01D036db]`; actor, session and authorization remain unverified.
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

- Repository evidence does not establish that any private-key environment was present or used, and this dispatcher did not access credentials or perform signing.
- Public address `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` is branch-reported as matching explorer creator fields; this does not establish controller, signer, ownership, employment, Life identity or Company authority.
- No KAIOS source-submission actor or authorization is repository-bound. Only the branch-reported public exact-match state may be retained as an unverified external observation.
- Both available BscScan browser sessions are signed out. Ownership claim and token-info/logo forms require a Human-authenticated BscScan session before their final messages and fields can be generated and submitted.

## External status and exact blocker

| Item | Status |
|---|---|
| KGEN source | `VERIFIED_EXACT_MATCH` |
| KGEN ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KGEN token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |
| KAIOS source | `VERIFIED_EXACT_MATCH` |
| KAIOS ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KAIOS token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |

`EXACT_HUMAN_GATE`: an authorized Human-controlled BscScan session, repository-bound authority, and separate action-time confirmation are required before any ownership or token-info submission. This dispatcher does not sign in, access credentials, generate signatures or submit external forms.

## Safety and classification

- Secret scan: `PASS`; no private key, seed phrase, API token, auth token, password or raw signer credential is present in this report or its branch diff.
- IP classification: `PASS_PUBLIC_METADATA_ONLY`; this branch contains explorer facts, public addresses, public brand hashes and public asset URLs only. No protected engine, private quant model, alpha strategy or secret signal logic is published.
- Private key material present in this branch diff: `NO`.
- Credential or signer access: `NONE_PERFORMED_OR_REPOSITORY_VERIFIED`.
- External source-verification submission: `ACTOR_AND_AUTHORIZATION_UNVERIFIED / PUBLIC_EXACT_MATCH_BRANCH_OBSERVED`.
- Token transfer executed: `NO`.
- BNB transfer executed: `NO`.
- Contract redeployed: `NO`.
- Governance executed: `NO`.
