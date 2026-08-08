# Recovery - KAIOS Token Lineage Integration - 2026-08-09

## Recovery Point

- Base main: `5c1d06fed031dc12b65100c05fd5eb99387644bc`
- Source documentation: PR #128 head `75a1f768f46e558278651d9105b1249b099169ce`
- Rejected implementation source: PR #127 head `434cf29afeb4c7138a8976759f10537bac3bfb76`
- Integration branch: `codex/kaios-token-lineage-integration-20260809`

## Rollback

No contract was deployed and no chain state was mutated. Recovery is a normal
Git revert of the integration commits or closure of the integration PR. Do not
restore PR #127's 1:10,000 or administrator-reported proof model.

Generated `node_modules/` and `artifacts/` are ignored and may be regenerated
with `npm ci` and `npm run compile` from `KGEN-KAIOS/`.

## Safety State

`NO_MAINNET_DEPLOY`, `NO_REAL_WALLET`, `NO_REAL_KGEN_ACTIVATION`,
`NO_ONCHAIN_TRANSFER`, `NO_PRIVATE_KEY_ACCESS`.
