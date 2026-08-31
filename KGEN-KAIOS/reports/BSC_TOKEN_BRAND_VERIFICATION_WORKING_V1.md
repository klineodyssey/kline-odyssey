# BSC Token Brand Verification Working V1

Status: `EXACT_PUBLIC_STATE_VERIFIED / SOURCE_PACKAGE_READY / EXTERNAL_SUBMISSION_BLOCKED_BY_BSCSCAN_SIGN_IN`

Execution branch: `gm/bsc-token-brand-verification-v1`

## Evidence boundary

- Latest `origin/main` synchronized into this branch: `3d2ba9160a69049979c4afd195c70bbf8618306f`.
- PR #196 pre-update head: `d333ab6c97148b8d596e587df9a21b213fd9ec2b`.
- PR #162 exact brand head reused: `f403a27d78acef85a599ec712fcb2a168c771409`.
- PR #179 exact KGEN submission-package head reused: `d88ed1bfbee8b495b3bfb776b865cbb061384309`.
- Public explorer and asset observations were refreshed on `2026-08-31T07:52:47Z`.
- `SUBMITTED` means an external form actually produced acceptance evidence. `PUBLISHED` means the public token page was re-read and displays the expected metadata and logo. Neither word is inferred from repository readiness.
- This work performed read-only chain calls, offline signing verification, asset checks and repository work only. It performed no token transfer, BNB transfer, approval, contract call, deployment, upgrade or governance execution.

## KGEN current public state

| Field | Verified value |
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

## KAIOS current public and deployment state

| Field | Verified value |
|---|---|
| Network | BNB Smart Chain Mainnet, chainId `56` |
| Contract | `0xD4E67B3a69e41524c424150E6b6e921b01D036db` |
| Name / symbol / decimals | `KAIOS Civilization Credit` / `KAIOS` / `18` |
| Deployment transaction | `0x731bccd9d1116831d9b43966672cb27d9017c75b6806c32109c5c210d2c3be9c`, receipt status `1`, block `115628625` |
| Creator / deployer | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` |
| Proxy / implementation / admin | `NO` / `NOT_APPLICABLE` / `NOT_APPLICABLE` |
| Ownable owner | `NOT_APPLICABLE`; deployed contract has no `owner()` surface |
| Runtime bytecode | `5776` bytes; keccak256 `0x3a036ce95ac0929b247b40c9a303c2c4bfaf9aeb9bc171c009ad3532316df023` |
| BscScan source | `NOT_VERIFIED`; public Contract tab offers `Verify and Publish` and displays bytecode only |
| Token information | `NOT_PUBLISHED` |
| Logo | `NOT_PUBLISHED` |
| Reputation | `UNKNOWN` |

### Exact KAIOS source-reproduction evidence

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
- Recompiled creation bytecode plus constructor arguments equals the actual deployment transaction input byte-for-byte: `PASS`.
- Prepared Standard-JSON input: `C:\Desktop\KAIOS_BSCSCAN_STANDARD_INPUT.json`, `37071` bytes, SHA-256 `D986A085BEF7EBADFD0A3409B036C104C6E4B7EFCB6E33FF68436203974BBD05`.

The current `main` copy of `KAIOS.sol` is not the source used for this submission because its inscription text differs from the deployed lineage. The package above is bound to the actual deployment bytecode and prevents an incorrect-source submission.

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

The official website, GitHub, Telegram, YouTube, TikTok, Facebook and Instagram URLs reused from PR #179 each returned HTTP `200` during this pass. The official website is `https://klineodyssey.github.io/kline-odyssey/`; the public contact email remains `klineodyssey.io@gmail.com`. No unverified URL was invented.

## Ownership and submission readiness

- `BSC_MAINNET_PRIVATE_KEY` exists in the local environment; its value was never printed, logged or written.
- Its derived public address is `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`.
- Offline sign/recover verification using a fixed, non-transaction message: `PASS`.
- That address exactly matches the KGEN creator and KAIOS deployment creator: `PASS`.
- Both the in-app browser and connected Chrome BscScan sessions are signed out.
- No `BSCSCAN_API_KEY`, `BSC_API_KEY` or `ETHERSCAN_API_KEY` is configured.
- The KAIOS verification form has been configured for Standard-JSON, compiler `v0.8.24+commit.e11b9ed9`, MIT license, with the exact upload package prepared. No external submit button was pressed.
- BscScan ownership messages are generated only after authenticated claim setup. Therefore no ownership message has been signed yet and no token-info form has been submitted.

## External status and exact blocker

| Item | Status |
|---|---|
| KGEN source | `VERIFIED_EXACT_MATCH` |
| KGEN ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KGEN token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |
| KAIOS source | `PACKAGE_READY_NOT_SUBMITTED` |
| KAIOS ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KAIOS token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |

`ONE_EXACT_HUMAN_ACTION`: sign in to BscScan in the connected Chrome window (complete any BscScan CAPTCHA personally) and then return to this task with `BSCSCAN_SIGNED_IN = YES`. After that, the prepared KAIOS source submission, the two creator-bound ownership messages and the two token-info submissions can proceed without exposing signer secrets.

## Safety and classification

- Secret scan: `PASS`; no private key, seed phrase, API token, auth token, password or raw signer credential is present in this report or its branch diff.
- IP classification: `PASS_PUBLIC_METADATA_ONLY`; this branch contains explorer facts, public addresses, public brand hashes and public asset URLs only. No protected engine, private quant model, alpha strategy or secret signal logic is published.
- Private key exposed: `NO`.
- Token transfer executed: `NO`.
- BNB transfer executed: `NO`.
- Contract redeployed: `NO`.
- Governance executed: `NO`.
