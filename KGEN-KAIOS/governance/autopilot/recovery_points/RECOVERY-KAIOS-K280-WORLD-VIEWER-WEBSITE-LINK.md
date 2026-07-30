# Recovery Point - K280 World Viewer Website Link

- Task ID: `KAIOS-K280-WORLD-VIEWER-WEBSITE-LINK-001`
- Previous main: `8a6a21e55f88f020f318483961b7651ee6420cbc`
- Branch: `codex/link-k280-world-viewer-to-official-site`
- PR: `#60`
- Reviewed head: `80c93366f5ba8acfb49bd428b5f8233e70d51c21`
- Merge commit: `d5468ff113ed90eeaa7064c1a8646a5127f317dd`
- Final main for the feature merge: `d5468ff113ed90eeaa7064c1a8646a5127f317dd`
- Pages workflow: `Deploy Pages Static`
- Pages run: `30584198753 / SUCCESS`
- Status: `MERGED_DEPLOYED_PRODUCTION_VERIFIED`

## Changed Paths

- Official homepage and public project index: `index.html`, `README.md`
- Canonical public route: `world-viewer/k280/index.html`
- Shared Viewer: `KGEN-KAIOS/world-viewer/k280/`
- Public data index: `api/kaios/k280/index.html`
- KAIOS and World Viewer indexes: `KAIOS/README.md`,
  `KGEN-KAIOS/world-viewer/README.md`
- Automated coverage and deployment:
  `KAIOS/K280/tests/k280-site-integration.test.mjs`,
  `.github/workflows/world-viewer-product-qa.yml`,
  `.github/workflows/deploy-pages-static.yml`

## Navigation And Viewer Recovery

- Homepage includes a visible K280 feature entry, desktop navigation, mobile
  navigation, project content, footer link, and public-data link.
- The canonical Viewer route reuses the PR #59 CSS, JavaScript, avatar, Runtime,
  and API records; it does not duplicate simulation logic.
- The Viewer includes verified return-home and public-data navigation.
- Loading, partial failure reporting, and retry are fail-visible.

## Production

- Homepage: https://klineodyssey.github.io/kline-odyssey/
- Viewer: https://klineodyssey.github.io/kline-odyssey/world-viewer/k280/
- API index: https://klineodyssey.github.io/kline-odyssey/api/kaios/k280/
- Homepage, Viewer, API index, and eight JSON records: `HTTP 200`
- Responsive verification: `360x800`, `390x844`, `768x1024`, `1440x900`
- Browser console errors: `0`

## Rollback

Create a reviewed revert PR for merge commit
`d5468ff113ed90eeaa7064c1a8646a5127f317dd`, deploy Pages, and verify that the
previous PR #59 implementation route and APIs remain available. Do not rewrite
history or delete this recovery record.

## Known Limitations

- This is a static GitHub Pages interface.
- K280 remains a deterministic software simulation.
- `K280_POPULATION_OBSERVATORY_AND_SPECIES_BRANCH_REVIEW` remains
  `HOLD_NOT_STARTED`.

## Security Boundaries

No token contract, supply, wallet, private key, real KGEN, K11520 settlement,
Production Runtime, Genesis law, Universe Law, Universe Map CURRENT, or Runtime
CURRENT was modified or activated.
