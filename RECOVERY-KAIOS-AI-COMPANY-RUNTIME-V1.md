# Recovery: KAIOS AI Company Runtime V1

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Previous main SHA: `f2e433766b36857a0c86773b042398b7624ed082`

Specification PR: `#93`

Specification merge commit: `f2e433766b36857a0c86773b042398b7624ed082`

Runtime branch: `codex/kaios-ai-company-order-project-runtime-v1`

Runtime PR: `PENDING`

Runtime merge commit: `PENDING`

## Scope

This workline adds the deterministic AI Company coordinator, Viewer route,
read-only static API projections, tests and documentation. It reuses existing
domain owners and does not migrate persistent data.

## Rollback

Revert the Runtime merge commit after recording the deployed main SHA. The
specification merge may remain because it has no executable authority. Confirm
that the official homepage, Full World Viewer, Aquaculture, Player Genesis and
K280 routes still return HTTP 200 after rollback.

## Preserved Boundaries

No real Wallet, KGEN, on-chain transfer, legal effect, Production authority,
external autonomy, CURRENT change or Constitution source change is authorized.
