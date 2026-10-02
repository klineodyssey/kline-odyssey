# KGEN FortuneGame V1 Security Review

Status: internal implementation review / not an external audit

Scope: `KGEN/contracts/KGEN_FortuneGame_Upgradeable.sol` and its local tests

Deployment decision: NO MAINNET DEPLOY

## Review outcome

The implementation enforces the Human-approved TIME_ARROW_IMMUTABILITY model: a successful position is atomically written before any admissible result timestamp, cannot be modified or individually cancelled, and can be rewarded only after deterministic Oracle finalization. The legacy 16888 immediate pseudo-random method is explicitly excluded.

No critical or high-severity issue was left knowingly open for the approved CREDIT_ONLY/Testnet scope. This statement is not a substitute for an independent audit before a real-value economic mode.

## Threats and controls

| Threat | Control |
|---|---|
| Late bet after outcome | Solidity deadline, OPEN status, non-zero resolve delay, end timestamp after close and at/after resolve |
| Result-conditioned bet acceptance | Atomic storage/event on successful `placeBet`; no backend acceptance step; no bet mutation/delete/cancel API |
| Operator picks favorable historical end round | Candidate predecessor must be the same-phase round immediately before it and earlier than `resolveAt` |
| Invalid/stale Oracle | Positive answer, non-zero timestamp, `answeredInRound`, future-time rejection, deterministic end-delay bound |
| Feed identity/config substitution | Oracle address, description hash and decimals validated and snapshotted per Round |
| Admin changes an active Round | All relevant economic, Oracle and Heart values copied into the Round; setters update future defaults only |
| Admin manufactures winner | No price/result/winner setter; resolution derives result only by comparing validated prices |
| Selective losing-bet cancellation | No individual cancel path; cancellation changes the entire Round result and preserves every position |
| Double settlement | Only CLOSED may resolve; RESOLVED/CANCELLED are terminal |
| Double claim | Per-position flag plus `nonReentrant`; flag changes only after Heart success |
| Heart gate failure destroys entitlement | Failed external call reverts all state; `claimed` remains false and retry is permitted |
| Heart reentrancy | `nonReentrant` around claim; mock callback test confirms rollback |
| Reward overcommit | Direction-specific fixed-payout liability must remain under snapshotted `roundRewardCap` |
| Contract-wallet discrimination | No `tx.origin`, EOA-only check, bot blocklist or contract-wallet prohibition |
| UUPS takeover | Dedicated `UPGRADER_ROLE`; unauthorized upgrade test; constructor disables implementation initialization |

## Oracle review

V1 uses the first same-phase Oracle round at/after `resolveAt`. It verifies the immediately preceding round is earlier than `resolveAt`. This makes selection deterministic rather than operator discretionary.

The freshness bound is relative to the target time, not the later transaction time. A valid historical end proof remains resolvable if a caller is late, preventing a party from waiting until a valid answer becomes “stale” and then cancelling an unfavorable Round.

Feed phase transitions fail closed. Whole-Round cancellation additionally proves the supplied old-phase round is the last one (its successor reverts), that it is earlier than `resolveAt`, and that the new phase starts at/after `resolveAt`. This blocks result-conditioned cancellation when a valid old-phase end round exists.

## Cancellation review

There is no privileged arbitrary cancellation. Stale cancellation must prove that the deterministic first post-resolve round itself missed the permitted end window. Oracle-unavailable cancellation requires the snapshotted feed call to revert on-chain. Phase-transition cancellation requires an on-chain continuity-gap proof and is global. A paused game can still be closed/resolved, so an Operator cannot pause an unfavorable Round into cancellation.

In CREDIT_ONLY mode, cancellation does not transfer a refund because no token was debited. All bet records remain immutable audit evidence. Any future escrow mode requires a new review of token accounting, tax/fee-on-transfer behavior, refund solvency and claim ordering.

## Heart integration review

The contract imports no TempleHeart implementation and has no general Heart transfer authority. It can only request the formula-derived reward for `msg.sender`'s finalized winning position. TempleHeart independently authenticates the configured FortuneGame caller and enforces the 1888 KGEN floor.

The required order is deliberately interaction-before-success-flag. Reentrancy is blocked, and a reverted payout preserves retryability. Local integration against the real V3.4 implementation covers reject, refill, retry, success and double-claim rejection.

## Test coverage

The committed Node/Ganache suite covers lifecycle, UP, DOWN, DRAW, close/resolve boundaries, invalid/future/stale Oracle data, favorable historical selection, phase transition, multiple players, double bet, whole-Round cancellation, unavailable Oracle, unauthorized configuration, pause, reward cap, real TempleHeart 1888 retry, payout rejection, reentrancy, UUPS authorization, fuzzed amounts and state/liability invariants.

Exact commands and results are generated during the implementation closeout:

```text
cd KGEN-KAIOS
npm run compile
npm run test:fortune
npm test
```

## Known limitations and Human gates

1. CREDIT_ONLY credits are simulation weights, not scarce balances; Sybil resistance and credit issuance are outside V1.
2. Fixed Heart rewards are capped per Round but are not reserved in TempleHeart. A winner may need to retry after replenishment.
3. Operator may choose when to create a Round, though it cannot choose a historical start datum or any end datum.
4. Chainlink-compatible proxy governance remains an external trust assumption.
5. Phase-transition cancellation is conservative and may cancel a Round that could be reconstructed with feed-specific off-chain history; V1 prefers fail-closed proof rules.
6. `canResolve()` is a readiness hint, not proof that a caller supplied the correct Oracle round.
7. UUPS roles and operational roles must use reviewed multisig/timelock governance before any real-value deployment.
8. Testnet mock evidence must never be described as a reliable BSC mainnet price feed or a real-money game.
9. Mainnet payout, min/max credits, reward cap, timing, Oracle address and economic mode are all `HUMAN_DECISION_REQUIRED`.
10. Independent audit, BSC Testnet rehearsal and Human review are required before any mainnet consideration.

## BSC Testnet real-chain rehearsal

The chainId-97 rehearsal passed with a deterministic `TEST_ONLY_ORACLE`, a new ERC1967/UUPS proxy and the existing TempleHeart V3.4 rehearsal proxy. Normal winning claims used `REAL_TEMPLEHEART_TESTNET`. Because safely draining that Heart to its 1888 floor would damage the shared fixture, the failure/refill/retry sequence used a separately deployed `TEST_MOCK_HEART` and is labeled as such in every evidence file.

Sanitized receipts, block timestamps, gas, Round IDs and immutable losing-position snapshots are recorded in:

- `KGEN-KAIOS/reports/BSC_TESTNET_FORTUNE_GAME_V1_REHEARSAL.json`
- `KGEN-KAIOS/reports/BSC_TESTNET_FORTUNE_GAME_V1_REHEARSAL.md`

This evidence grants no Mainnet deployment authority. `MAINNET_DEPLOY = BLOCKED` remains in force.

## Explicit prohibited actions

- No mainnet FortuneGame deployment.
- No mainnet `TempleHeart.setFortuneGame()`.
- No legacy pseudo-random result generation.
- No arbitrary admin price/result/winner/cancel setter.
- No `tx.origin`, EOA-only filter or bot blocklist.
- No claim success flag before confirmed Heart payout.
