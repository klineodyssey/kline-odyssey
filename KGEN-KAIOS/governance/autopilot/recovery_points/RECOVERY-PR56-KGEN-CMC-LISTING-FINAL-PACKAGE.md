# RECOVERY-PR56-KGEN-CMC-LISTING-FINAL-PACKAGE

Status: `RECOVERY_POINT_CREATED`

Created At: `2026-07-28T15:40:51+08:00`

Scope: PR #56 KGEN CoinMarketCap final listing package, canonical plain-text
supply endpoints, Annex A, emission schedule, and copy-ready submission record.

## Anchors

- Rollback target: `d1a3968d13a68d16a88765312620dbfb7e982463`
- PR head: `f47281e977fe6d2570d55d003b89031f1c89e909`
- Merge commit: `be607be4bf7f956fb67fba414e47bfda890e43d3`
- Merge method: `MERGE_COMMIT`
- Pages run: `30339337493`
- Provider / model: `OpenAI / NOT_DISCLOSED`
- Reasoning level: `NOT_RECORDED`
- Agent: `current Codex task`

## Verified State

- Max supply: `72000000`
- Total supply: `71980505.786117825703641`
- Circulating supply: `2896511.372639273602111511`
- Excluded current balances: `69083994.413478552101529489`
- Total API: `HTTP 200 / text/plain / pure number`
- Circulating API: `HTTP 200 / text/plain / pure number`
- Annex A: `HTTP 200 / checksums match`
- Emission schedule: `HTTP 200 / checksums match`
- CMC 200px logo: `HTTP 200 / image/png / 200x200`
- Tests: `223 / 223 PASS`
- Repository JSON: `531 / 531 PASS`
- Secrets: `0`
- Protected-path violations: `0`

## Recovery

Revert the closeout commit to remove recovery evidence only. Revert merge commit
`be607be4bf7f956fb67fba414e47bfda890e43d3` through the governed rollback
process if the listing package must be withdrawn. Do not rewrite history.

## Non-Actions

- CoinMarketCap external submission: `false`
- Ticket number created: `false`
- Verification post published: `false`
- Token transfer: `false`
- Wallet / private-key access: `false`
- Contract, tokenomics, Genesis, or Runtime change: `false`
