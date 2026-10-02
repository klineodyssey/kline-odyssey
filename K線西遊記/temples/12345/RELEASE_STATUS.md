# 12345 悟空財神殿 Release Status

STATUS: LIVE FRONTEND RELEASE CANDIDATE
RELEASE: V10.50.0
DATE: 2026-08-09 (UTC+8)

## Integrated mainline

### Android MetaMask round-trip recovery candidate (2026-10-02)

- Human physical Android failure overrides earlier wallet-gate-only QA. No claim of real-device recovery until Human tests this candidate. PR #468 remains Draft; no 16888 edits are included.
- Active ownership: `modules/runtime-main.js` WalletRuntime handles the delegated hub buttons and autoconnect; `modules/kgen-12345-web3-shell.js` retains the original provider/signer/BSC/refresh path; existing HeartRuntime owns Heart balances and Wish/Repay. No new wallet, ABI or transaction authority.
- History: `cfdd9ed82` had direct encoded Temple URLs. `85d73a6f2c0c891f711d4e2b211cff6911b2a99e` changed this to the ASCII root bridge plus `metamask://`, 900ms app-link and 1800ms link.metamask fallback. Each fallback could additionally open an iframe, anchor and window. `5bac0138` preserved that route; `d6c6354b` updated the root bridge label. Recent #467 did not change this routing. These are verified source changes, **not proof of the exact installed MetaMask failure or of a last-known-good physical-device commit**. LAST_KNOWN_GOOD_REAL_DEVICE_COMMIT = UNVERIFIED.
- Candidate: one user-gesture HTTPS `link.metamask.io/dapp/<canonical Temple>?wallet=metamask&autoconnect=1` navigation; a second `metamask.app.link` attempt is explicit/manual only. No timed navigation fan-out. Safe bounded `source/from/bridge` context is preserved; external return URLs are not accepted. Old `12345.html` and `wallet-12345.html` bookmarks remain compatible and preserve their allowlisted query parameters; they are no longer the MetaMask destination.
- Official sources checked 2026-10-02: [MetaMask mobile parser](https://github.com/MetaMask/metamask-mobile/blob/main/app/core/DeeplinkManager/utils/parseDeeplink.ts), [Dapp destination handler](https://github.com/MetaMask/metamask-mobile/blob/main/app/core/DeeplinkManager/handlers/intent/handleDappUrl.ts), [official generator](https://github.com/MetaMask/metamask-deeplinks/blob/master/js/index.js). The current mobile handler supports the dapp route and retains the path/query. This does not prove Android app-association settings or a particular installed app version.
- Original connect now returns explicit success/failure and coalesces simultaneous requests. WalletRuntime verifies success, account and BSC56 before reporting connected. Rejection/wrong-chain cannot become false-positive success. `pageshow`/foreground resume reads only already-authorized accounts and refreshes via the original path without a permission or switch-chain prompt. Late provider initialization reuses autoconnect. No layout remount.
- WalletConnect 2.12.2's `process is not defined` is a **separate QR bundle defect**. The real browser reproduces that error while the MetaMask route and injected fixture succeed. No QR certification and no SDK migration in this bounded recovery.
- `node tests/kaios-world-audio-browser.mjs --wallet-only`: Android UA/no injected wallet; actual click→one intercepted canonical URL; preserved context; original injected EIP-1193/ethers/Heart code against deterministic RPC fixtures; switch from chain 1→56; address, BNB, KGEN, Heart; original Wish/Repay forms without submission; passive resume; rejection; wrong chain; bridge compatibility; 390×844/844×390 geometry and screenshots. **Fixture balances are not live account evidence.** CI runs these checks in the existing Portal Product QA and retains screenshots.
- Physical review: Chrome Android → Connect → MetaMask → see the original Temple (inside MetaMask is acceptable) → approve connection → BSC56/address/balances → foreground/reload → original Wish/Repay forms. Do not submit Wish/Repay/approve/transfer during this review. Chrome and MetaMask have separate browser storage; this patch does not transfer private saves between browsers or promise to synchronize an uninjected Chrome tab.
- MAINNET_TX_SENT = NO. No deploy, UUPS call, token approval, transaction signature, KGEN transfer or paid service.

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
