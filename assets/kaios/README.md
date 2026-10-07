# KAIOS / KUFO / KSHIP shared brand review candidate

Status: `REVIEW_CANDIDATE_NOT_CURRENT`; shared visual direction: `HUMAN_APPROVED`.

The Human-approved visual direction is `SAME_KGEN_MASTER_MARK_DIFFERENT_SYMBOL_NAMES`, recorded by decision ID `KAIOS_HENGYAO_MASTER_COMPANY_AND_11520_GPU_REAL_MARKET_WORK_ORDER_V3_FINAL`. The canonical black-gold KGEN mark in `assets/kgen/kgen-logo.svg` is the visual master. KAIOS, KUFO and KSHIP reuse the same graphic; their symbol, contract address, lineage and deployment status remain separate metadata fields.

KAIOS is live on BSC chain 56 at `0xD4E67B3a69e41524c424150E6b6e921b01D036db`, but the latest fixed-endpoint observation found no verified KAIOS/WBNB, KAIOS/KGEN or KAIOS/USDT pair. Therefore `TOKEN_LIVE`, `MARKET_NOT_LIVE` and `PRICE_UNAVAILABLE` are separate states. The identical mark does not imply identical contracts, fungibility, conversion, deployment, price or authority.

This Draft does not replace the website or submit token metadata to BscScan, MetaMask, Trust Wallet, PancakeSwap, CoinMarketCap or CoinGecko. External submissions remain gated by the relevant authenticated account, ownership proof and platform review.

All PNG token marks have transparent backgrounds. The 512-pixel KAIOS, KUFO and KSHIP token images are pixel-identical by design. Recommended alt text is token-specific even when the graphic is shared.

## Dated external identity readiness

The market/discovery statements above retain the manifest's 2026-08-27
observation date; they are not a fresh live-market or submission-status check.
See the [2026-10-07 KGEN / KAIOS readiness matrix](../../KGEN/registry/BscScan/KGEN_BSCSCAN_TOKEN_INFO_SUBMISSION_V1.md#kgen--kaios-external-identity-readiness-2026-10-07)
for canonical-source crosswalks, measured asset hashes, current official
BscScan / Trust Wallet / CoinGecko requirements, and remaining owner gates.
The existing 256px PNG is 28,387 bytes; the 512px token mark is 159,979 bytes
and exceeds Trust Wallet's currently documented 100kB limit. No asset or
manifest status is changed by that readiness review.

## Local circular-mask readability QA (2026-10-07)

Scope: local format/readability only, bound to PR #526 source HEAD
`c9ac7cf155ae7324a950c262175b930e9a2367b6`. Both unchanged
`assets/kgen/kgen-logo-256.png` and `assets/kaios/kaios-logo-256.png`
are 256×256 RGBA, 28,387 bytes, with Git blob
`5adee9a01ffdb7cd71488b43547d8881a5d264f3` and SHA-256
`955afb35b65e7e5c106d774fe6b624d3aee75c6048b311604d35563e97c39e68`.
Source bytes and existing documentation were matched to the exact-HEAD tree.

Method: embed each unchanged PNG in SVG at 32, 64 and 256px, against
`#ffffff` and `#101114`, with square controls and a centered circular
`clipPath` of radius display-size/2; export at 1:1 pixels using Inkscape
1.4 (e7c3feb100, 2024-10-09), then inspect the contact sheet. Chromium
could not launch because socket creation was prohibited; this is static
rendering evidence, not a real-browser or destination-app pass.

- No identifying geometry is cropped; the K and hexagon remain recognizable
  at all tested sizes/backgrounds.
- Alpha bounds are (7, 7, 249, 249), with exclusive right/bottom; zero
  nontransparent source pixel centers lie outside the full circle and
  minimum radial margin is approximately 6.94px.
- Square/circle renders are pixel-identical at 64/256px. At 32px, only
  peripheral antialiasing differs: 12 pixels on white, 20 on dark per token,
  with maximum per-channel difference 1/255.
- White-background caveat: pale outer gold `#fff1a8` has approximately
  1.14:1 contrast against white, making its outward edge faint. The dark
  backing preserves the silhouette; primary internal geometry remains clear.
- At 32px, fine orbit strokes, nodes and sparkle lose separation; they are
  clearer at 64/256px. These are readability qualifications, not a new-art
  request or a whole-image accessibility certification.

Result: `LOCAL_MASK_CORE_READABILITY_PASS_WITH_CAVEATS`.
Public served bytes: `NOT_VERIFIED`. Actual destination-specific
resizing/masking, listing eligibility and platform acceptance:
`NOT_VERIFIED`. No asset, manifest status, application or external listing
state was changed. The destination-specific pre-submission checklist remains
open; this local check alone does not close it.
