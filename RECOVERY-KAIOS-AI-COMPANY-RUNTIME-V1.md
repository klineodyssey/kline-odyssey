# Recovery: KAIOS AI Company Runtime V1

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Previous workline main SHA: `05f471228af592e5c43071bc998e063101d82ef5`

Runtime baseline main SHA: `f2e433766b36857a0c86773b042398b7624ed082`

Specification PR: `#93`

Specification merge commit: `f2e433766b36857a0c86773b042398b7624ed082`

Runtime branch: `codex/kaios-ai-company-order-project-runtime-v1`

Runtime PR: `#97 / https://github.com/klineodyssey/kline-odyssey/pull/97`

Runtime merge commit: `d37937cc2c6ba1decea66ac60457271b20badc6e`

Deployed main SHA: `d37937cc2c6ba1decea66ac60457271b20badc6e`

Pages workflow: `Deploy Pages Static / 30738650032 / SUCCESS`

Product QA workflow: `World Viewer Product QA / 30738650043 / SUCCESS`

## Scope

This workline adds the deterministic AI Company coordinator, Viewer route,
read-only static API projections, tests and documentation. It reuses existing
domain owners and does not migrate persistent data.

## Production Evidence

- Official homepage, Full World Viewer, AI Company Viewer, Aquaculture Viewer
  and K280 Viewer returned HTTP 200 after cache-busted requests.
- All 18 AI Company JSON projections returned HTTP 200, parsed as JSON,
  declared `read_only: true` and declared mutation endpoints disabled.
- Official homepage to AI Company Viewer, Viewer to official homepage, Viewer
  to API directory and API directory to Viewer navigation passed.
- The deployed fishpond demonstration advanced to simulation hour 69 and
  completed six dependency-ordered tasks at 100 percent progress.
- Production browser QA passed `360x800`, `390x844`, `768x1024` and
  `1440x900`, with zero console errors, zero broken images and no horizontal
  overflow.

## Rollback

Revert merge commit `d37937cc2c6ba1decea66ac60457271b20badc6e`. The
specification merge may remain because it has no executable authority. Confirm
that the official homepage, Full World Viewer, Aquaculture, Player Genesis and
K280 routes still return HTTP 200 after rollback.

## Preserved Boundaries

No real Wallet, KGEN, on-chain transfer, legal effect, Production authority,
external autonomy, CURRENT change or Constitution source change is authorized.
