# TempleHeart V3.4.0 Human Canon Candidate

Status: REVIEW CANDIDATE — NOT MAINNET DEPLOYED
Human canon date: 2026-08-09
Executable source: `KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol`

## V3.3.2 baseline and upgrade rule

V3.4.0 is an append-only UUPS candidate over the V3.3.2 custom storage layout. The executable filename remains version-free under repository governance. Solidity is pinned to 0.8.24 and both OpenZeppelin packages are pinned to 5.0.2.

No mainnet deployment or proxy upgrade is authorized by this candidate.

## 1. Game Survival Gate

`gameSurvivalGateWhole = 1888` is the independent Heart-funded game survival threshold.

- If Heart balance is below 1,888 KGEN, Heart-funded game payout is closed.
- A payout may not move Heart below 1,888 KGEN.
- Replenishment to the threshold reopens the gate, although a payout still requires enough excess above the gate.
- The gate never freezes, deducts, seizes, or recovers KGEN already held by a player.

This parameter is intentionally distinct from:

- `baseFloorWhole = 20000`: operational reserve retained for review and used by Heart reward safety checks.
- `baseCapWhole = 108000`: normal Heart cap.
- `maxCapWhole = 7200000`: absolute maximum cap retained from the baseline.

## 2. Heartbeat claim

Formal function: `heartbeatClaim()`.

- Requires an existing `makeWish()` record.
- Wallet cooldown: at least one hour.
- Civilization ID cooldown: at least one hour.
- Reward: 1 KGEN.
- Global successful cap: 88 per UTC hour.
- The operational reserve safety check runs before payment.

On-chain accounting includes `heartbeatHourClaims[hourIndex]`, `heartbeatMaxClaimsPerHour = 88`, `totalHeartbeats`, and `totalHeartbeatPaid`.

The legacy `heartbeat()` selector is retained only for ABI compatibility and executes the exact same capped paid path.

## 3. Ignite / cross-day claim

Formal function: `igniteAndClaim()`.

- Requires an existing `makeWish()` record.
- Valid only from UTC 00:00:00 through 00:09:59.
- Wallet limit: once per UTC day.
- Civilization ID limit: once per UTC day.
- Reward: 8 KGEN.
- Global successful cap: 88 per UTC day.
- The operational reserve safety check runs before payment.

On-chain accounting includes `igniteDayClaims[dayIndex]`, `igniteMaxClaimsPerDay = 88`, `totalIgnites`, and `totalIgnitePaid`.

The legacy `crossDayBreath()` selector is retained only for ABI compatibility and executes the exact same UTC-windowed capped paid path.

## 4. Fortune Money

The retained claim system is:

- 1–8 KGEN, selected by civilization `blessingPower`.
- 30-day wallet and civilization cooldown.
- Maximum 500 successful claimants per 30-day epoch.
- Wish + Holy Cup + holder/beneficiary-bound KAIOS Alchemy proof.
- Proof replay protection.

After a valid `fortuneClaim`, the transferred KGEN belongs completely to the player. TempleHeart exposes no clawback, seizure, forced repayment, player-wallet admin pull, token blacklist, or player-KGEN freeze.

The per-wallet Fortune Ledger records only:

- total claimed;
- total voluntary repayment;
- last claim amount and time;
- last voluntary repayment amount and time;
- claim and repayment counts;
- whether repayment occurred after the previous claim;
- computed next-claim eligibility and cooldown end.

The first claim does not require repayment. After a claim, a later claim is ineligible until the player initiates a positive `voluntaryRepayFortune()` transfer. This does not create a debt, does not recover the prior reward, and does not force repayment. Any positive post-claim repayment restores only the repayment qualification; the next reward remains determined by civilization contribution and blessing power, never by a revolving repayment credit limit.

## 5. Normal Heart cap and current 11520 treasury

Normal Heart cap is 108,000 KGEN. Excess is returned to the current 11520 Exchange Treasury resolved dynamically from the governed `KAIOSOrganRegistry` under:

`keccak256("KAIOS.ORGAN.EXCHANGE_TREASURY.11520")`.

The legacy `brainVault` storage slot remains untouched for upgrade safety but is not authoritative in V3.4.0.

### Normalization design decision

Option A (normalize after every important operation) gives eager enforcement but adds an external token transfer and registry dependency to unrelated user operations, increasing gas cost and the number of ways a claim can fail.

Option B (permissionless `normalizeHeartBalance()`) permits any caller or keeper to enforce the cap, removes operator dependence, and keeps ordinary state transitions isolated.

V3.4.0 selects Option B and also normalizes after explicit Heart inflow functions such as governed treasury injection and voluntary repayment. Direct ERC-20 transfers cannot invoke a receiver hook, so the permissionless function is the canonical recovery path for those deposits. Every excess transfer resolves the current registry organ at execution time and rejects an unset or non-contract treasury.

## 6. Civilization contribution and mining boundary

Wish, Holy Cup, heartbeat, ignite, KAIOS offering, and Fortune repayment emit typed `CivilizationContribution` events. These events are integration inputs; TempleHeart does not implement a monolithic mining engine.

Life creation, housing, mall, supply chain, 500 deity seats, and other lawful civilization construction belong to a separate future Civilization Mining Organ. Civilization mining is not proof-of-work and never rewards electricity waste.

## 7. Customer and visitor accounting

BSC is the canonical financial and civilization ledger.

TempleHeart records unique customer wallets and daily new/active customer wallets. A wallet enters this accounting through `makeWish()` and is counted once globally and once per active UTC day.

Anonymous website visitors remain off-chain:

- GA4 for traffic analytics.
- Firebase/Firestore for an optional anonymous cumulative display or support cache.
- GitHub for source, documentation, releases, and audits—not a runtime customer database.

Firebase may mirror chain events but cannot override on-chain eligibility or ledger truth.

## 8. Required release gates

PR #131 remains Draft until all gates pass:

1. Solidity 0.8.24 compile.
2. OpenZeppelin 5.0.2 pinned.
3. V3.3.2 → V3.4.0 append-only UUPS storage-layout validation.
4. Heartbeat, UTC ignite boundary, hourly/day cap, and dual cooldown tests.
5. 1,888 game survival and 108,000 registry-routed normalization tests.
6. Fortune no-clawback and voluntary-repayment qualification tests.
7. Proof replay and beneficiary redirect tests.
8. Fuzz and invariant tests.
9. EIP-170 deployed bytecode check.
10. Testnet proxy upgrade rehearsal and independent review.

No mainnet deployment is authorized.
