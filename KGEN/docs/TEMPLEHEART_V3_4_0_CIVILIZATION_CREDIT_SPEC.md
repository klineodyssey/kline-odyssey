# TempleHeart V3.4.0 — 發財金文明信用 / 客戶與訪客統計

Status: REVIEW CANDIDATE — NOT MAINNET DEPLOYED

## V3.3.2 baseline

Current mainline V3.3.2 already has fortuneClaim(bytes32 proofId), 30-day cooldown, 500 claims per epoch, Holy Cup proof, KAIOS Alchemy proof, civilizationId, blessingPower, 1–8 KGEN reward tiers, totalPilgrims and daily pilgrim activity.

## V3.4.0 canonical fortune rule

A successful fortune claim transfers KGEN to the player. From that moment, the claimed KGEN is the player's property.

TempleHeart must NOT expose admin clawback, seizure, user-wallet freeze, forced transferFrom, blacklist-based token restriction, or operator recovery from a player wallet.

The temple records only claim/repayment history and NEXT-claim eligibility.

A voluntary repayment must be initiated by the player. If the player never repays, already-claimed KGEN is never recovered; only a later fortune claim is restricted.

Proposed next-eligibility rule: after a prior claim, a positive voluntary repayment record is required before the next claim. The next reward remains civilization-contribution based; it is not a revolving credit-card limit.

## Fortune ledger fields

Per wallet: totalBorrowed, totalRepaid, repaidSinceLastClaim, lastClaimAt, lastRepayAt, claimCount, repayCount, repaymentRequiredForNextClaim, nextCooldownAt.

## Customer counts

On-chain wallet customer counters should be distinct from anonymous website visitors:

- isCustomerWallet(address)
- totalCustomerWallets
- dailyNewCustomerWallets(day)
- dailyActiveCustomerWallets(day)

A wallet becomes a customer when it first enters the real TempleHeart civilization flow (for example makeWish registration).

## Visitor counts / backend

Anonymous GitHub Pages visits do not submit BSC transactions, so Solidity cannot reliably count them.

Recommended architecture:

- BSC TempleHeart = canonical fortune/customer ledger
- Google Analytics 4 = traffic analytics
- Firebase/Firestore = optional cumulative visitor display and customer-service cache/index
- GitHub = source code, documentation, version history, releases and audits; NOT a runtime customer database

Customer support must treat on-chain TempleHeart views/events as the source of truth for wallet claim/repayment eligibility. Firebase may mirror/index those events but must not override chain truth.

## Required tests before UUPS mainnet upgrade

1. Validate V3.4.0 storage is append-only from production V3.3.2.
2. Compile Solidity 0.8.24 with pinned OpenZeppelin 5.0.2.
3. First claim does not require repayment.
4. Later claim without repayment reverts.
5. Voluntary positive repayment restores eligibility subject to cooldown/civilization rules.
6. Admin/operator cannot pull KGEN from player wallets.
7. Customer wallet counted once only.
8. Fuzz/invariant tests.
9. Production-equivalent proxy upgrade rehearsal.
10. Human signer performs any real BSC UUPS upgrade.
