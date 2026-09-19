# K18921 斬妖台 — KAIOS Liquidity Forge

Status: DRAFT PRODUCT CANDIDATE

## Purpose
K18921 is the KAIOS liquidity manager. It is not a second exchange and it does not modify the locked KGEN/WBNB Genesis LP.

## Funding lineage
K18888 Civilization Treasury -> reviewed Market/Liquidity Development Allocation -> K18921 Liquidity Vault -> eligible KAIOS LP pools.

The planner never grants payment authority. A real add-liquidity action requires a bound treasury allocation, verified pair, K18921 vault, secure signer, receipt verifier and action-specific authorization.

## Pools and staged priority
1. KAIOS/WBNB — 60% candidate allocation; primary external price/depth pool.
2. KAIOS/USDT — 35% candidate allocation; stable quote and cross-check pool.
3. KAIOS/KGEN — 5% candidate allocation; civilization exchange pool.

The 60/35/5 split is a Genesis pilot policy candidate, not a permanent market law. Pools activate only when their individual gates pass. KGEN/WBNB remains DO_NOT_TOUCH.

## Auto-LP
K18921 measures verified depth against a target. If depth is sufficient, it does nothing. If depth is deficient, it may propose an add-liquidity amount capped by the daily budget. Price impact above 300 bps, self-match, wash trading, missing pair evidence, missing vault/signer/receipt verification or missing K18888 authorization fail closed.

## Profit and loss
LP performance is accounted as:

NET_LP_PNL = LP_FEE_REVENUE - IMPERMANENT_LOSS - GAS_COST - FUNDING_COST

Only realized, verified values may become accounting evidence. Token appreciation is not fee revenue. A candidate profit policy reinvests 70% and proposes 30% for return to K18888; no transfer occurs from this module.

## Ownership
K18888 is the civilization funding source. K18921 is the dedicated manager/vault domain. Signer addresses are operators, not personal economic owners. LP positions must not default to a Human or employee personal wallet.

## Safety boundary
No pair creation, LP deposit, withdrawal, swap, token transfer, Mainnet transaction, signer use, treasury payment or chain write is performed by this candidate module.
