# BSC Token Brand Verification Working V1

Status: `DRAFT / HOLD P0 AUTHORITY_AND_EXTERNAL_EVIDENCE_PROVENANCE / NO_EXTERNAL_SUBMISSION`

Execution branch: `gm/bsc-token-brand-verification-v1`

## Evidence boundary

- Latest `origin/main` synchronized into this branch: `3d2ba9160a69049979c4afd195c70bbf8618306f`.
- PR #196 pre-update head: `d333ab6c97148b8d596e587df9a21b213fd9ec2b`.
- PR #162 exact brand head reused: `f403a27d78acef85a599ec712fcb2a168c771409`.
- PR #179 exact KGEN submission-package head reused: `d88ed1bfbee8b495b3bfb776b865cbb061384309`.
- The branch author reports a public explorer and asset observation time of `2026-08-31T07:52:47Z`; this dispatcher did not independently reproduce that external state.
- `SUBMITTED` means an external form actually produced acceptance evidence. `PUBLISHED` means the public token page was re-read and displays the expected metadata and logo. Neither word is inferred from repository readiness.
- The triggering update reported read-only chain calls, signer checks and asset checks. This dispatcher does not adopt those assertions as authority, ownership or deployment evidence.
- All mutable explorer, deployment, ownership, publication and local-package values below are `UNVERIFIED_PUBLIC_OBSERVATION` or branch-reported candidates unless an exact repository artifact independently binds them.
- Credential access performed by this dispatcher: `NO`. No signing, transaction, transfer, approval, deployment, upgrade, governance execution or external submission was performed.

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
| BscScan source | `NOT_VERIFIED`; public Contract tab offers `Verify and Publish` and displays bytecode only |
| Token information | `NOT_PUBLISHED` |
| Logo | `NOT_PUBLISHED` |
| Reputation | `UNKNOWN` |

### Branch-reported KAIOS source-reproduction candidate

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
- Branch-reported creation-bytecode plus constructor-argument comparison: `PASS_CLAIM / NOT_INDEPENDENTLY_REPRODUCED_BY_DISPATCHER`.
- Branch-reported local Standard-JSON path/hash: `LOCAL_PATH_REFERENCE_ONLY / NOT_FETCHED_OR_VERIFIED_BY_DISPATCHER`.

The branch claims that the current `main` copy of `KAIOS.sol` differs from its deployment lineage. That claim and the proposed package remain review candidates; they are not independent deployment or external-submission evidence.

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

The branch reports HTTP `200` observations for the website and social URLs reused from PR #179. This dispatcher did not independently reproduce those mutable external observations; they remain `UNVERIFIED_PUBLIC_OBSERVATION`. No new URL or publication fact is authorized here.

## Ownership and submission readiness

- No repository evidence on exact main binds this dispatcher, ChatGPT, 玄曜 or any other actor to the creator/deployer address.
- No credential, environment variable, signer, derived address or offline signature was accessed or verified by this dispatcher.
- GitHub authorship and a claimed address match do not establish Human identity, Life status, employment, controller status, signer authority or ownership.
- BscScan authentication, ownership messages, source verification and token-info submissions remain Human-controlled external actions and were not performed.

## External status and exact blocker

| Item | Status |
|---|---|
| KGEN source | `VERIFIED_EXACT_MATCH` |
| KGEN ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KGEN token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |
| KAIOS source | `PACKAGE_READY_NOT_SUBMITTED` |
| KAIOS ownership claim | `NOT_SUBMITTED_BSCSCAN_SIGN_IN_REQUIRED` |
| KAIOS token info / logo | `NOT_SUBMITTED_NOT_PUBLISHED` |

`EXACT_HUMAN_GATE`: any BscScan authentication, CAPTCHA, ownership claim, source submission or token-info submission requires an independently authorized Human-controlled session. This dispatcher will not access credentials, sign ownership messages or submit external forms.

## Safety and classification

- Secret scan: `PASS`; no private key, seed phrase, API token, auth token, password or raw signer credential is present in this report or its branch diff.
- IP classification: `PASS_PUBLIC_METADATA_ONLY`; this branch contains explorer facts, public addresses, public brand hashes and public asset URLs only. No protected engine, private quant model, alpha strategy or secret signal logic is published.
- Private key material present in this branch diff: `NO`.
- Credential or signer access performed by dispatcher: `NO`.
- Token transfer executed: `NO`.
- BNB transfer executed: `NO`.
- Contract redeployed: `NO`.
- Governance executed: `NO`.
