# Recovery Point - Full KAIOS World Viewer Official Website

Status: `MERGED_DEPLOYED_PRODUCTION_VERIFIED`

Task ID: `KAIOS-FULL-WORLD-VIEWER-OFFICIAL-WEBSITE-001`

Created At: `2026-07-31T15:45:56+08:00`

## Repository State

- Previous main: `515a926ec190ea2ae19a84980ffad2b1c148d3cc`
- Branch: `codex/restore-full-kaios-world-viewer-official-route`
- Pull request: `#61`
- Reviewed head: `4aa7a9ce475d839e0707c33486fa4c7c7c0af329`
- Merge method: `MERGE_COMMIT`
- Merge commit: `af2bf7f4e28a6cf5436b46b1d435a9064b82614a`
- Pages workflow: `30613821994 / SUCCESS`

## Recovered Capability

- Canonical app: `KGEN-KAIOS/world-viewer/index.html`
- Stable route: `world-viewer/index.html`
- Homepage, desktop navigation, mobile navigation, and footer expose the
  complete Viewer while preserving K280 as a separate child application.
- The complete Viewer links to the official homepage and K280.
- The building catalog exposes audited, honest simulation states.

## Production URLs

- https://klineodyssey.github.io/kline-odyssey/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/k280/

All three returned `HTTP 200`. The four-viewport production matrix passed with
zero fatal console errors, broken required links, or missing assets.

## Rollback

Revert merge commit `af2bf7f4e28a6cf5436b46b1d435a9064b82614a` with a normal reviewed
revert PR. Do not reset shared history. The canonical app remains available at
`KGEN-KAIOS/world-viewer/index.html` if the public adapter is reverted.

## Known Limitations

- `FISHPOND`, `SHOPPING_MALL`, and `TECHNOLOGY_BUILDING` are not implemented.
- Farm, house, factory, AI Company, K11520, and civilization systems remain
  bounded synthetic simulations.
- Persistence is local simulation only.

## Security Boundaries

- Wallet: `NONE`
- Real KGEN: `DISABLED`
- K11520 settlement: `INACTIVE`
- Legal land title: `false`
- Production Runtime authority: `false`
- Protected-path violations: `0`

