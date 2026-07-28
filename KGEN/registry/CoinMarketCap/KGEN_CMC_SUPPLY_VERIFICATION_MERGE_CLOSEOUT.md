# KGEN CoinMarketCap Supply Verification - PR #55 Closeout

Status: `MERGED_DEPLOYED_AND_VERIFIED`

Closed At: `2026-07-28T13:45:44+08:00`

## Merge Record

- PR: `#55`
- Risk: `MEDIUM_RISK`
- Previous main: `cd34042580256118a21c6b8eb44ecbdfa879f5f7`
- Reviewed head: `f44eb53f7ab8812e2fbddda69234435be51ff47f`
- Merge commit: `3fc2c6c6c0959d4f9fffe0382a73eec1470b6659`
- Merge method: `MERGE_COMMIT`
- Agent: `codex-gm-01`
- Provider / model: `OpenAI / gpt-5.6-sol`
- Reasoning level: `medium`

## Supply Snapshot

- Contract: `0xba3d3810e58735cb6813bc1cdc5458c0d71432be`
- Network: `BNB Smart Chain`
- Frozen block: `112570686`
- Nominal max supply: `72000000`
- Current total supply: `71980505.786117825703641`
- Burned supply: `19494.213882174296359`
- Excluded current balances: `69083994.413478552101529489`
- Conservative circulating supply: `2896511.372639273602111511`
- Reconciliation: `circulating + excluded = totalSupply / PASS`
- Max reconciliation: `totalSupply + burned = 72000000 / PASS`

## Public Endpoints

- Total supply:
  `https://klineodyssey.github.io/kline-odyssey/api/kgen/total-supply`
- Circulating supply:
  `https://klineodyssey.github.io/kline-odyssey/api/kgen/circulating-supply`
- Pages workflow: `30332505511 / SUCCESS`
- HTTP status: `200 / 200`
- Response format: `PURE_NUMBER / PURE_NUMBER`
- Content-Type: `application/octet-stream`

## Validation

- Supply tests: `8 / 8 PASS`
- Organism tests: `46 / 46 PASS`
- Identity tests: `86 / 86 PASS`
- Company Boot tests: `74 / 74 PASS`
- Repository JSON: `531 / 531 PASS`
- World Viewer acceptance: `76 files / 89 JSON / 103 references PASS`
- Markdown local links: `10 / 10 PASS`
- UTF-8: `7 / 7 PASS`
- BOM hits: `0`
- Corruption hits: `0`
- Secret hits: `0`
- Protected-path violations: `0`
- Git diff check: `PASS`
- P0 findings: `0`
- Resolved P1 findings: `1`
- Unresolved P1 findings: `0`

## Explicit Non-Actions

- CoinMarketCap submitted: `false`
- Token transferred: `false`
- Wallet connected or created: `false`
- Private key accessed: `false`
- Contract modified: `false`
- Token configuration modified: `false`
- Runtime modified or activated: `false`

The public figures are a frozen read-only snapshot. They should be refreshed
from a new single-block chain snapshot before a later external submission if
classified balances have changed.
