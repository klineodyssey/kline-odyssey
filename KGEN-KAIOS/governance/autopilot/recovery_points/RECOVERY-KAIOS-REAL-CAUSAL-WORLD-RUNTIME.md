# Recovery Point - KAIOS Real Causal World Runtime

Status: `MERGED_DEPLOYED_PRODUCTION_VERIFIED`

Task ID: `KAIOS-REAL-CAUSAL-WORLD-RUNTIME-001`

Created At: `2026-08-01T05:17:42+08:00`

## Repository State

- Previous main: `8adb723013ebf414e1a1c7afc9942e8b94881138`
- Branch: `codex/kaios-real-causal-world-runtime`
- Pull request: `#63`
- Reviewed head: `9267446056aae322acd973bd74e1c61ce36d77a1`
- Merge method: `MERGE_COMMIT`
- Merge commit: `826c8486e656de13fa578abfbe54bbd98c259883`
- Pages workflow: `30665780716 / SUCCESS`
- Product QA workflow: `30665780749 / SUCCESS`

## Recovered Capability

- Stable route: `world-viewer/causal-runtime/index.html`
- Canonical implementation: `KGEN-KAIOS/world-viewer/causal-runtime/`
- Terrain, road, river, bridge, route, transport-time, fuel, electrical
  energy, gravity, cargo-mass, wear and maintenance causality.
- Required workers, tools, materials, energy, access and technology gates.
- Ordered `BASIC_HOUSE_FOUNDATION` construction.
- Separate Player and AI work costs and simulated payroll.
- Balanced delivery and construction ledgers.
- Deterministic state, event hashes, save, resume, replay, export, import and
  reset.

## Production URLs

- https://klineodyssey.github.io/kline-odyssey/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/causal-runtime/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/player-genesis/
- https://klineodyssey.github.io/kline-odyssey/world-viewer/k280/

All routes returned `HTTP 200`. The causal runtime passed production browser
checks at 360x800, 390x844, 768x1024 and 1440x900 with no horizontal overflow,
failed required assets, page exceptions or runtime console errors.

## Rollback

Revert merge commit `826c8486e656de13fa578abfbe54bbd98c259883`
through a normal reviewed revert PR. Do not reset shared history. Full Viewer,
Player Genesis and K280 remain independent routes.

## Known Limitations

- Physics and cost calculations are bounded deterministic approximations.
- Geography is a labeled synthetic demonstration and stores no GPS history.
- Persistence and currency are local, simulated and non-authoritative.
- The runtime is not a production logistics, construction or settlement
  system.
- The official homepage may request the domain-root `/favicon.ico`, which is
  outside the project base path and can return a non-fatal 404; all required
  project assets and route-specific favicons pass.

## Security Boundaries

- Real wallet: `NONE`
- Private key: `NOT_PRESENT`
- Real KGEN: `DISABLED`
- Blockchain settlement: `DISABLED`
- Exact GPS history: `NOT_STORED`
- External autonomy: `DISABLED`
- Production Runtime authority: `false`
- Protected-path violations: `0`
