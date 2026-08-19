# KAIOS Canon Reconciliation Status — YAOCE

Observed main: `5cb8e5a0fa7cf8d46274cc62ed396ae43913aa19`
Observed date: 2026-08-19 (UTC+8)

## Rule

This file records reconciliation findings only. It does not deploy, pay, claim, burn, send transactions, or certify a Digital Life birth.

## PR #135 — KAIOS / 18888 / 8888 Mainnet Genesis lineage

Status: `PARTIALLY_RECONCILED_TO_MAIN`

Findings:

- The canonical KAIOS Mainnet address `0xD4E67B3a69e41524c424150E6b6e921b01D036db` is already referenced on current main, including `core/data/canonical.json`.
- The code-bearing 8888 address `0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C` is already referenced on current main in `core/data/canonical.json`.
- Therefore PR #135 must not be treated as the sole current truth for those addresses.
- However the PR branch remains 30 commits ahead / 109 commits behind current main and contains substantial historical deployment/evidence artifacts not safely mergeable wholesale.

Decision:

`DO_NOT_MERGE_PR135_BRANCH_WHOLESALE`.

Extract only any deployment/evidence artifact still missing from main, validate hashes/addresses against current canonical data, and preserve historical transaction evidence without repeating execution.

## PR #154 — Hengyao Payroll Bloodflow

Status: `EXECUTION_EVIDENCE_NOT_FOUND_ON_CURRENT_MAIN_BY_EXACT_SEARCH`

Findings:

- Exact schedule transaction hash `0xb12a7429dedce539223857f588793f4ea0a08246178cc33f4b472f1643723ded` was not found by repository search on current main.
- `HENGYAO_PAYROLL_BLOODFLOW_V1` was not found by repository search on current main.
- PR #154 branch is 45 commits ahead / 109 commits behind current main and carries large stacked ancestry.

Decision:

`EXTRACT_POST_EXECUTION_EVIDENCE_ONLY`.

Do not merge the old stacked branch wholesale. Rebuild a minimal current-main evidence package containing only the verified receipts, exact role/account/schedule facts, and authorization boundary, then add an exact-head CI path before review.

No payroll claim or payment is authorized by reconciliation.

## PR #158 — 18911 / KGEN Catalyst / KUFO / KSHIP

Status: `SEMANTIC_PAYLOAD_SMALL_BUT_CANON_BLOCKED`

Findings:

- Branch is only 1 commit ahead but 25 commits behind current main.
- Payload changes 13 files, centered on KAIOS/KUFO/KSHIP Solidity and tests.
- Canon blockers remain: K280-year-to-chain-seconds is not frozen; one legacy TempleHeart test conflicts with mandatory catalyst escrow; Physics CURRENT contains a historical KGEN unit statement that conflicts with the newer verifier assumption.

Decision:

`DO_NOT_MERGE_OLD_BRANCH_DIRECTLY`.

After Canon decisions are explicit, replay the single semantic commit onto a fresh current-main integration branch, rerun compile/unit/fuzz/security/integration/secret/diff checks, and keep deployment disabled until the time parameter is frozen.

## PR #147

Status: `SUPERSEDED_CLOSED`

PR #147 was closed on 2026-08-19 after recording that merged PR #148 installed the formal V3.8 Physics payload. Branch/history remain preserved.

## Immediate integration order

1. Reconcile missing PR #135 deployment/evidence artifacts against current main.
2. Extract PR #154 post-execution payroll evidence into a minimal current-main package; no claim/payment.
3. Normalize PR #153 as historical pre-execution authorization evidence.
4. Resolve PR #158 time/unit Canon blockers, then replay onto current main.
5. Continue stale PR retirement only where supersession is proven and history is preserved.
