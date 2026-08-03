# KAIOS Life Energy, Economy and Payroll V0 Report

Task ID: `KAIOS-24H-LIFE-ENERGY-ECONOMY-PAYROLL-001`

Status: `RUNTIME_VALIDATED_PENDING_PR`

## Implementation

The canonical runtime owner is
`KGEN-KAIOS/world-viewer/economy/life-energy-payroll-runtime.js`. It composes
with the existing Economy and AI Company contracts and introduces no currency,
physics, life, rights or project authority replacement.

The runtime provides:

- independent life-existence, agency and economic-capability projections;
- fixed-supply `KAIOS_CREDIT` accounts and balanced transfers;
- project budget reservation, escrow, rejection refund and rework hold;
- review-gated AI payroll with a unique claim key;
- AI-wallet-first pay and contract-gated household transfer;
- finite electricity and compute consumption for candidate work;
- ant food collection, contribution credit, ration and starvation risk;
- bee nectar/pollen collection, causal honey processing, allocation and shortage;
- deterministic events, hash chain, pause/resume, export/import/reset and replay.

## Failure Scenarios

Tests cover insufficient budget, rejected work, rework, duplicate payroll,
inactive worker, missing wallet, time conflict and predicted ledger imbalance.
A missing wallet returns `PAYROLL_BLOCKED_MISSING_WALLET` while
`worker.life_exists` remains true.

## Accounting

All credit entries debit one account and credit another by the same positive
amount. Runtime integrity verifies the fixed credit supply, unique payroll
claims, nonnegative balances and resource conservation. Resource credits never
alter food, nectar, honey, electricity or compute inventories.

## APIs

`api/kaios/economy/` is the canonical unversioned read-only projection.
`api/kaios/economy/v0/` is generated from the same implementation and marked
`LEGACY_ALIAS / DEPRECATION_PENDING` to satisfy the requested V0 URLs without
creating a second canonical API organism. No mutation endpoint exists.

## Safety

`SIMULATION_ONLY / NO_REAL_WALLET / NO_REAL_KGEN / NO_CHAIN /
NO_ISSUANCE / NO_PRODUCTION_AUTHORITY`.

## Local Validation

- Focused runtime and public integration: `22 PASS / 0 FAIL`.
- Full World Viewer Node suite: `272 PASS / 0 FAIL`.
- Browser Product QA after repair: `181 PASS / 0 FAIL / 8 baseline skips`.
- Worker Registry: `16 PASS / 0 FAIL`.
- Viewports `360x800`, `390x844`, `768x1024`, `1440x900`: HTTP 200,
  integrity pass, console errors 0, page errors 0, horizontal overflow 0.
- JSON, UTF-8, BOM, NUL, secrets, protected paths and diff check: pass.

Independent review repaired two P1 UI issues: a hidden error panel overridden
by author CSS and a duplicate fixed-height mode-rail link. Final local review is
`P0=0 / unresolved P1=0 / unresolved P2=0`.

The final contract pass also repaired one P1 by binding each payroll projection
to the same simulation time and previous/next hashes as its causal release
event.

The legacy Python foundational-candidate validator still rejects the already
merged `forest-agriculture-v1` and `aquaculture-v1` directories. This preexisting
allowlist drift is outside this workline; the current Canonical Life and
aquaculture Node contracts pass in the 272-test suite.
