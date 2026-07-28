# RECOVERY-PR55-KGEN-CMC-SUPPLY-VERIFICATION

Status: `RECOVERY_POINT_CREATED`

Created At: `2026-07-28T13:45:44+08:00`

Scope: PR #55 KGEN CoinMarketCap circulating supply verification and public
pure-number supply endpoints.

## Anchors

- Rollback target: `cd34042580256118a21c6b8eb44ecbdfa879f5f7`
- PR head: `f44eb53f7ab8812e2fbddda69234435be51ff47f`
- Merge commit: `3fc2c6c6c0959d4f9fffe0382a73eec1470b6659`
- Merge method: `MERGE_COMMIT`
- Pages run: `30332505511`
- Model: `gpt-5.6-sol`
- Reasoning level: `medium`
- Agent: `codex-gm-01`

## Verified State

- Frozen BSC block: `112570686`
- Nominal max supply: `72000000`
- Current total supply: `71980505.786117825703641`
- Excluded current balances: `69083994.413478552101529489`
- Conservative circulating supply: `2896511.372639273602111511`
- Public total-supply API: `HTTP 200 / pure number`
- Public circulating-supply API: `HTTP 200 / pure number`
- Supply reconciliation: `PASS`
- Secrets: `0`
- Protected-path violations: `0`

## Recovery

Revert the closeout commit to remove recovery evidence only. Revert merge
commit `3fc2c6c6c0959d4f9fffe0382a73eec1470b6659` through the governed
rollback process if the public snapshot or endpoints must be withdrawn. Do not
rewrite history. A later balance change should normally be handled by a new
frozen snapshot rather than by altering this historical record.

## Non-Actions

- CoinMarketCap external submission: `false`
- Token transfer: `false`
- Wallet / private-key access: `false`
- Contract or token-configuration change: `false`
- Genesis or Runtime change: `false`
