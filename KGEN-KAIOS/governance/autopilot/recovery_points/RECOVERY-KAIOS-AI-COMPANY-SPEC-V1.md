# Recovery: KAIOS AI Company Specification V1

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Previous main: `6b8654995cf04a5227b7980d74a113ffb83c3adc`

Branch: `codex/kaios-ai-company-order-project-spec-v1`

PR: `PENDING_DRAFT_CREATION`

## Scope

This recovery point covers the source crosswalk, cumulative specification,
twelve schemas, specification validator, test plan, specification tests,
compatibility pointer, documentation indexes and Company Status. It contains no
authoritative Runtime implementation, public mutation API or production
authority.

## Rollback

Use a merge-preserving revert of the dedicated specification PR. Do not reset
main and do not modify existing Player Genesis, Causal World, Aquaculture,
Physical Labor, Supply Chain, enterprise organism, CURRENT, Wallet, KGEN or
Constitution source files.

## Boundaries

`SIMULATION_ONLY / NO_REAL_WALLET / NO_REAL_KGEN / NO_ONCHAIN_TRANSFER /
NO_REAL_LEGAL_EFFECT / NO_PRODUCTION_AUTHORITY / NO_EXTERNAL_AUTONOMY`.
