# RECOVERY-PR57-KGEN-COINGECKO-CIRCULATING-SUPPLY-CORRECTION

Status: `RECOVERY_POINT_CREATED`

Created At: `2026-07-29T00:16:35+08:00`

Scope: PR #57 KGEN CoinGecko circulating-supply classification correction,
Annex A reconciliation, submission evidence, and public plain-text API.

## Anchors

- Rollback target: `238659658f6538ae36768036191777c7fc285e44`
- PR head: `8a658a620f9f131105413b78bc47fe4bb47d0054`
- Merge commit: `5ee75aec8864860a3f99e8e981b40095fc0098e3`
- Merge method: `MERGE_COMMIT`
- Pages run: `30377364648`
- Provider / model: `OpenAI / NOT_DISCLOSED`
- Reasoning level: `NOT_RECORDED`
- Agent: `current Codex task`

## Verified State

- Snapshot block: `112570686`
- Snapshot block hash:
  `0x0f2c4a7d148cf7737535c6e8113ea97857991041728ec86bec76d781e870532d`
- Max supply: `72000000`
- Total supply: `71980505.786117825703641`
- Circulating supply: `4366878.985936300061217422`
- Excluded current balances: `67613626.800181525642423578`
- Ownership-unverified major holders moved to circulation: `2`
- Evidenced project-controlled non-circulating wallets: `5`
- Total API: `HTTP 200 / text/plain / pure number`
- Circulating API: `HTTP 200 / text/plain / pure number`
- Tests: `226 / 226 PASS`
- Repository JSON: `505 / 505 PASS`
- Secrets: `0`
- Protected-path violations: `0`

## Recovery

Revert the closeout commit to remove recovery evidence only. Revert merge commit
`5ee75aec8864860a3f99e8e981b40095fc0098e3` through the governed rollback
process if the supply correction must be withdrawn. Do not rewrite history or
alter on-chain state.

## Non-Actions

- Token transfer: `false`
- Wallet / private-key access: `false`
- Contract or token configuration change: `false`
- External CoinGecko submission: `false`
