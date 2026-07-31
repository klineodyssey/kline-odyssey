# Full World Viewer Official Route Report

Task: `KAIOS-FULL-WORLD-VIEWER-OFFICIAL-WEBSITE-001`  
Risk: `LOW_RISK`  
Status: `IMPLEMENTED_AWAITING_PRODUCTION_VERIFICATION`

## Route Architecture

- Canonical application: `KGEN-KAIOS/world-viewer/index.html`
- Stable public adapter: `world-viewer/index.html`
- Public route: `https://klineodyssey.github.io/kline-odyssey/world-viewer/`
- K280 child: `https://klineodyssey.github.io/kline-odyssey/world-viewer/k280/`

The adapter fetches the canonical HTML shell and loads the canonical CSS and
JavaScript modules. It does not copy the runtime, fixtures, or module tree.
Loading and retry states fail visibly if the canonical shell is unavailable.

## Public Navigation

The one official homepage exposes separate Full World and K280 entries in:

- the main feature area;
- desktop navigation;
- mobile navigation;
- the footer.

The Full Viewer links back to the official homepage and to the stable K280
child route. The two applications remain distinct.

## GitHub Pages Safety

All new homepage targets are relative to the `/kline-odyssey/` deployment
root. The public adapter resolves canonical assets using `../KGEN-KAIOS/`.
Canonical and Open Graph URLs use verified production URLs.

## Product Boundary

This integration is `STATIC_WEB_INTEGRATION`, `CAPABILITY_AUDIT`, and
`SIMULATION_ONLY`. It creates no wallet, settlement, ownership record,
Production Runtime authority, real biological claim, or external autonomous
agent.

