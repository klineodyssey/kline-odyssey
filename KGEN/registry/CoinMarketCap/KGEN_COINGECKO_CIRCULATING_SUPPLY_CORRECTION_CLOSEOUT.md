# KGEN CoinGecko Circulating Supply Correction - PR #57 Closeout

Status: `MERGED_DEPLOYED_AND_VERIFIED`

Closed At: `2026-07-29T00:16:35+08:00`

## Merge Record

- PR: `#57`
- Risk: `MEDIUM_RISK`
- Previous main: `238659658f6538ae36768036191777c7fc285e44`
- Reviewed head: `8a658a620f9f131105413b78bc47fe4bb47d0054`
- Merge commit: `5ee75aec8864860a3f99e8e981b40095fc0098e3`
- Merge method: `MERGE_COMMIT`
- Pages run: `30377364648 / SUCCESS`
- Provider / model: `OpenAI / NOT_DISCLOSED`
- Reasoning level: `NOT_RECORDED`
- Agent: `current Codex task`

## Corrected Supply

- Max supply: `72000000`
- Total supply: `71980505.786117825703641`
- Excluded supply: `67613626.800181525642423578`
- Circulating supply: `4366878.985936300061217422`
- Arithmetic:
  `4366878.985936300061217422 + 67613626.800181525642423578 = 71980505.786117825703641`

The two ownership-unverified major holders are now
`PUBLIC_CIRCULATING / OWNERSHIP_UNVERIFIED`. They are not represented as
vested, locked, team, treasury, bank, or reward wallets. The CoinGecko
submission package contains only the five evidenced project-controlled
non-circulating wallets.

## Public APIs

- Total supply:
  `https://klineodyssey.github.io/kline-odyssey/api/kgen/total-supply.txt`
- Total response: `71980505.786117825703641`
- Circulating supply:
  `https://klineodyssey.github.io/kline-odyssey/api/kgen/circulating-supply.txt`
- Circulating response: `4366878.985936300061217422`
- HTTP status: `200 / 200`
- Content-Type: `text/plain / text/plain`
- Response format: `PURE_NUMBER / PURE_NUMBER`

## Validation

- Supply and listing package tests: `20 / 20 PASS`
- Organism tests: `46 / 46 PASS`
- Identity tests: `86 / 86 PASS`
- Company Boot tests: `74 / 74 PASS`
- Total relevant tests: `226 / 226 PASS`
- Repository JSON: `505 / 505 PASS`
- Changed-file Markdown links: `29 / 29 PASS`
- Changed-file UTF-8: `12 / 12 PASS`
- BOM hits: `0`
- Corruption hits: `0`
- Secret hits: `0`
- Protected-path violations: `0`
- Git diff check: `PASS`
- P0 findings: `0`
- Resolved P1 findings: `2` (synchronize API variants; normalize CSV checksum
  validation across LF/CRLF worktrees)
- Unresolved P1 findings: `0`
- P2 findings: `0`

## Non-Actions

- External CoinGecko submission: `false`
- Token transfer: `false`
- Wallet or private-key access: `false`
- Contract, tokenomics, tax, or on-chain configuration change: `false`
- Genesis or Runtime change: `false`
