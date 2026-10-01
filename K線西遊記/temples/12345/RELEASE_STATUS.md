# 12345 悟空財神殿 Release Status

STATUS: LIVE FRONTEND RELEASE CANDIDATE
RELEASE: V10.50.0
DATE: 2026-08-09 (UTC+8)

## Integrated mainline

### Mobile presentation build 20261002-MOBILE-LAND-UTILITY

- Responsive viewport with stable closed HUD; existing Land organ views move into one bounded, internally scrolling native dialog (no cloned land ledger).
- One canonical Portal icon plus shared audio control, each 44px. AI and Festival details use native modal layers; Heart remains bounded and closable after rotation.
- Existing diagnostic/chart content remains accessible inside Heart. No Heart/Land/Warp/Wallet transaction authority changes.
- Browser regression is part of `tests/kaios-world-audio-browser.mjs`: 360/390/412/432/480 portrait, 844×390 landscape, repeated modal/rotation cycles, actual pointer reachability and screenshots.
- Known pre-existing optional WalletConnect 2.12.2 CDN bundle error: `process is not defined`. This UI release does not certify WalletConnect or Mainnet upgrade readiness; injected-wallet and chain transaction paths are not rewritten.
- V3.4 source/testnet evidence does not activate Mainnet behavior. The V3.2.6-compatible frontend boundary below remains unchanged.

- PR #129 merged to `main` at `66088f3a09e3a68df3027a877e122514ab829d52`.
- Canonical lineage: `1 KGEN burn -> 1000 KAIOS -> 1000 KUFO per KAIOS burn -> 1000 KSHIP per KUFO burn`.
- TempleHeart implementation target: `KGEN_TempleHeart_Upgradeable` V3.3.2.
- 12345 frontend release: V10.50.0.

## Important chain boundary

The GitHub Pages frontend release and the BSC UUPS proxy upgrade are separate operations.

This release does **not** pretend that the existing 12345 Heart proxy has already been upgraded on-chain. The frontend keeps the existing V3.2.6-compatible transaction path until a separately signed, verified BSC UUPS upgrade transaction is completed. The bootstrap displays/probes the live Heart status and clearly distinguishes frontend readiness from chain activation.

## Preserved

- Current 12345 layout and existing UI repairs.
- Existing BSC Heart proxy address.
- Existing wallet bridge and V3.2.6-compatible write path until chain upgrade.
- `bull-front.png`, `bear-rear.png`, `heart.png`, `warp-core.png` asset paths.

## Next on-chain gate

Before activating V3.3.2 write behavior in production: production-equivalent proxy rehearsal, final implementation address verification, upgrader/governance signer verification, BSC transaction signing, post-upgrade `version()`/storage checks, and transaction-function smoke tests.
