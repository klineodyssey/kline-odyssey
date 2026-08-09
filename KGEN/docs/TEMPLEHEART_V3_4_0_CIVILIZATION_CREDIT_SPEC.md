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

## 9. BSC Testnet rehearsal runbook

Status: EXECUTED — PASS ON BSC TESTNET CHAINID 97

This runbook governs BSC Testnet chainId 97 only. The real rehearsal returned `TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS`; sanitized evidence is stored in `KGEN-KAIOS/reports/BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.md` and `.json`. Mainnet deployment remains blocked.

The fresh-proxy executable path has passed an isolated local Ganache chainId 97 harness. That result validates the tool flow only and is not BSC Testnet evidence.

The executable mode extends the existing canonical storage tool instead of creating a parallel deployment bootstrap:

```powershell
cd KGEN-KAIOS
npm ci
npm run compile
npm run storage:validate
npm run testnet:templeheart:preflight
npm run testnet:templeheart:rehearse
```

The legacy `KGEN/scripts/deploy_all.js` is not the V3.4 rehearsal entrypoint. It targets an older TempleHeart generation and expects a Hardhat project that is not scaffolded in this repository.

### Human confirmations required

The tool never invents an address. The Human must supply or confirm:

| Environment variable | Required confirmation |
|---|---|
| `BSC_TESTNET_RPC_URL` | BSC Testnet RPC endpoint. Authenticated URLs remain outside the repository. |
| `BSC_TESTNET_SIGNER_ADDRESS` | Funded testnet signer address. |
| `BSC_TESTNET_SIGNER_ROLE` | Signer role and authority basis. On-chain Admin, Upgrader, Operator, and Holy Cup roles are also verified before execution. |
| `BSC_TESTNET_PROXY_ADDRESS` | Existing disposable TempleHeart proxy, or exact value `NEW` for a clean rehearsal. |
| `BSC_TESTNET_KGEN_ADDRESS` | Testnet KGEN contract. |
| `BSC_TESTNET_TREASURY_11520_ADDRESS` | Testnet 11520 Brain / Exchange Treasury contract. |
| `BSC_TESTNET_ALCHEMY_PROOF_SOURCE_ADDRESS` | Testnet KAIOS Alchemy proof source. |
| `BSC_TESTNET_ORGAN_REGISTRY_ADDRESS` | Testnet Organ Registry. |
| `BSC_TESTNET_FORTUNE_GAME_ADDRESS` | Testnet Fortune Game caller. |
| `BSC_TESTNET_UNAUTHORIZED_ADDRESS` | Confirmed unprivileged address used only for read-only rejection calls. |

The Human must also acknowledge the test resources and execution boundary:

| Environment variable | Required value or rule |
|---|---|
| `BSC_TESTNET_HEART_FUND_WHOLE` | Whole testnet KGEN allocated to the isolated Heart; must exceed 108000. A clean run may use 108009, but the Human must set it. |
| `BSC_TESTNET_FORTUNE_KAIOS_WHOLE` | Whole testnet KAIOS available for valid and redirect proofs; at least 2. |
| `BSC_TESTNET_CONFIRMATIONS` | Positive confirmation count; defaults to 3. |
| `BSC_TESTNET_PRIVATE_KEY` | Runtime-only signer secret deriving exactly to the confirmed signer address. Never place it in a file, shell history, PR, issue, report, or repository. |
| `BSC_TESTNET_EXECUTE` | Exact acknowledgement `BSC_TESTNET_REHEARSAL_ONLY`. |
| `BSC_TESTNET_PROXY_DISPOSITION` | Existing proxy only: exact acknowledgement `DISPOSABLE_REHEARSAL_PROXY`. |

Use process-scoped environment variables or an approved secret manager. Do not create a repository `.env` file. The tool never prints the RPC URL or private key.

### Read-only preflight

`npm run testnet:templeheart:preflight` does not read a private key and cannot send a transaction. It verifies:

1. The RPC reports chainId 97.
2. Confirmed addresses are non-zero and required contracts contain code.
3. Organ Registry point 11520 equals the confirmed Treasury.
4. Organ Registry point 18911 resolves to a Furnace whose KAIOS equals the confirmed proof source.
5. KGEN and KAIOS both use 18 decimals.
6. The confirmed signer has testnet BNB, acknowledged KGEN funding, and at least two KAIOS proof units.
7. Existing proxy bytecode is present when a proxy address is supplied.

### Clean rehearsal

`BSC_TESTNET_PROXY_ADDRESS=NEW` is the preferred isolated path. The executable mode performs:

1. Use the exact V3.3.2 source at Git ref `7344d231837d40b504622c8c8b4376ed25110e20`.
2. Deploy the V3.3.2 implementation and ERC1967 proxy, then initialize V3.3.2.
3. Bind the confirmed Fortune Game and create pre-upgrade Wish state.
4. Snapshot legacy storage slots 0 through 57.
5. Mask only compiler-declared immutable references and verify exact V3.3.2 runtime bytecode, then deploy V3.4.0 and verify its runtime bytecode the same way.
6. Prove an unprivileged upgrade call is rejected.
7. Execute `upgradeToAndCall(candidate, initializeV340(organRegistry))`.
8. Compare all old 58 slots and read appended slots 58 through 72.
9. Verify preserved Wish state, version, independent 1888 gate, both 88 caps, and current 11520 wiring.
10. Roll back to V3.3.2, then restore V3.4.0 without replaying the initializer.
11. Fund the isolated Heart and verify permissionless normalization sends only excess over 108000 to the registry-governed 11520 Treasury.
12. Execute one paid Heartbeat and one paid Ignite.
13. Simulate accepted and rejected Fortune Game payouts across the 1888 survival gate.
14. Create holder-bound KAIOS and Holy Cup proofs, claim 1–8 KGEN, reject replay, and record voluntary repayment.
15. Create a beneficiary-redirect proof and verify Fortune rejection.

The tool refuses to begin execution unless the latest BSC Testnet block is within UTC 00:00:00 through 00:09:59, so Ignite cannot be silently skipped.

### Existing proxy path

An existing proxy is accepted only after the Human marks it disposable with `BSC_TESTNET_PROXY_DISPOSITION=DISPOSABLE_REHEARSAL_PROXY`. The tool reads its EIP-1967 implementation slot, requires `version()` to report 3.3.2, verifies required roles, and then performs the same state-changing rehearsal. Never point this mode at Mainnet or a proxy containing valuable state.

### PASS evidence

PASS requires one uninterrupted executable run demonstrating chainId 97, 58 preserved slots, 15 appended slots, upgrade, unauthorized-upgrade rejection, rollback and restoration, Heartbeat, UTC Ignite, normalization to the confirmed current 11520 Treasury, game-gate acceptance/rejection, Fortune claim, replay rejection, voluntary repayment qualification, and beneficiary-redirect rejection.

Record the proxy, baseline implementation, candidate implementation, transaction hashes, block numbers, chainId, UTC timestamps, and final JSON summary in PR #131. Never record secrets or authenticated RPC URLs.

Until that evidence exists:

```text
PR_131 = READY_FOR_REVIEW_AFTER_RELEASE_GATES
TEMPLEHEART_V3_4_TESTNET_REHEARSAL = PASS
MAINNET_DEPLOY = BLOCKED
```
