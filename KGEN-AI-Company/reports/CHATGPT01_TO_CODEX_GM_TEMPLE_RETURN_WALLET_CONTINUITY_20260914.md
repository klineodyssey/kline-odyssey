# ChatGPT-01 → Codex GM — Temple Return / Wallet Continuity — 2026-09-14

TO_WORKER_ID: `codex-gm-01`  
TO_LIFE_ID: `LIFE-CODEX-GM-0001`  
FROM_WORKER_ID: `chatgpt-01`  
HUMAN_AUTHORITY: `沈英明`

## Human decision

12345 and 16888 are not terminal pages. Both must provide a clear `返回宇宙` / `返回11520世界` action so a player can leave the temple/app and return to the canonical universe/world without browser back-button dependence.

Switching between 11520, 12345, 16888, 18888 or other temple/world pages must **not change the player's wallet identity**. Page navigation is scene/app navigation only, not wallet replacement or wallet reinitialization.

## Required behavior

1. Add a visible, mobile-safe `返回宇宙` control to Temple 12345.
2. Add a visible, mobile-safe `返回宇宙` control to Temple 16888.
3. Target the canonical 11520 universe/world entry, preserving the player's current session identity and known player state.
4. If a previous 11520 XYZ logout/last-known coordinate exists, returning to universe restores that coordinate. If none exists, use the canonical bootstrap/default coordinate policy; do not derive a new wallet from the destination page.
5. Wallet/account identity must be single-source and persistent across temple/page transitions. The same connected wallet/account/address must remain selected after:
   - 11520 → 12345 → 11520
   - 11520 → 16888 → 11520
   - 12345 ↔ 16888
   - reload/back/forward where session persistence is supported.
6. A temple may show temple-specific balances, game credits, KAIOS/KGEN views or local state, but may not silently create, substitute, reset, or switch the canonical wallet/account.
7. If wallet connection is unavailable on a destination page, show `DISCONNECTED / RECONNECT` while retaining the last-known wallet identity reference; do not display a different account as if it were the same player.
8. No private key/seed/session secret may be serialized into URL parameters, localStorage or logs. Persist only safe public identity/session references needed for continuity.
9. Navigation must not trigger payment, token transfer, signer request, chain write, approval, treasury action, or Mainnet transaction.
10. Add browser tests asserting wallet address/identity equality before and after every cross-temple navigation path.

## UX acceptance

- `返回宇宙` is reachable without scrolling through an entire game screen.
- On mobile, it must not overlap gameplay controls or wallet controls.
- User can always exit 12345/16888 without being trapped on the page.
- Same-wallet continuity is visibly verifiable after return.
- Run real Chromium at 390×844 and inspect screenshots directly before merge.

## Canon separation

`KX/KY/KZ` remain universe/market boundaries.  
`XYZ` remain player physical coordinates.  
Wallet identity is player/account identity and is independent of both coordinate systems.

## Autonomous execution

This is low-risk repository/UI/session continuity work. GM should inspect current 12345/16888 implementations, build a latest-main clean patch, run functional + Chromium + screenshot QA, merge when exact-head green, verify Pages, then continue to the next safe task without asking Human again.

Return only:

`CURRENT_MAIN =`  
`FIX_PR =`  
`RETURN_12345 =`  
`RETURN_16888 =`  
`WALLET_CONTINUITY =`  
`XYZ_RESTORE =`  
`FUNCTIONAL_QA =`  
`VISUAL_QA =`  
`PAGES =`  
`HUMAN_ACTION_REQUIRED =`
