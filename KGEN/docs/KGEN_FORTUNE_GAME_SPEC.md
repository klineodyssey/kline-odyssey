# KGEN FortuneGame V1 Specification

Status: implementation candidate / local and BSC Testnet simulation only

Solidity: 0.8.24

OpenZeppelin: 5.0.2

Economic mode: `CREDIT_ONLY`

Mainnet deploy: prohibited pending Human review

## 1. Scope and authority boundary

`KGEN_FortuneGame_Upgradeable.sol` is the independent KGEN 12345 UP/DOWN game organ. It owns Round creation, immutable credit positions, betting cutoff, Oracle validation, resolution and reward claims.

TempleHeart remains the reward vault. FortuneGame uses only:

```solidity
interface ITempleHeartGame {
    function gamePayout(address player, uint256 amount) external;
    function isHeartGameOperational() external view returns (bool);
}
```

FortuneGame cannot transfer arbitrary Heart assets. TempleHeart does not decide market direction. No TempleHeart Human Canon or storage is changed by this implementation.

## 2. Highest Canon: TIME_ARROW_IMMUTABILITY

A successful `placeBet()` transaction permanently creates exactly one position for `msg.sender` and emits `BetPlaced` in the same transaction. The stored record includes round, wallet mapping, direction, credit amount, timestamp and block number.

There is no function to cancel, delete, replace, reverse, add to, reduce or otherwise mutate an individual position. A second bet by the same wallet in the same Round reverts. A losing result can never decide whether an earlier position exists.

Every admissible bet satisfies:

```text
placedAt < betCloseAt < resolveAt <= endOracle.updatedAt
endOracle.updatedAt > betCloseAt
```

`placeBet()` checks `block.timestamp < betCloseAt` in Solidity. UI state is not a security boundary. `resolveDelay` must be non-zero, so bet and result cannot occur in the same timestamp boundary.

`KGEN_16888_Universe_V5_20_0.sol` is `LEGACY / SUPERSEDED / UNSAFE FOR FORTUNE GAME`. Its immediate pseudo-random outcome method and its historical fee/payout parameters are not inherited.

## 3. Round lifecycle

```text
CREATED -> OPEN -> CLOSED -> RESOLVED
                         \-> CANCELLED (objective whole-Round proof only)
```

`createRound()` snapshots all economic and integration configuration, reads only the Oracle's current `latestRoundData()`, emits `RoundCreated`, and then opens betting with `RoundOpened`. The start datum must have a positive answer, non-zero timestamp, `answeredInRound >= roundId`, no future timestamp, and age no greater than `startMaxAge`.

Anyone may call `closeRound()` once `block.timestamp >= betCloseAt`. The time check in `placeBet()` independently rejects all late direct calls even if nobody has yet sent `closeRound()`.

Anyone may resolve a CLOSED Round at or after `resolveAt` by supplying the deterministic end-round proof. Final `status`, `result`, prices and Oracle round identifiers have no mutation path.

## 4. Deterministic Oracle selection

V1 expects a Chainlink-compatible Aggregator V3 BTC/USD feed. No network address is hardcoded. Oracle configuration validates contract code, exact description hash `keccak256("BTC / USD")`, decimals, positive latest answer, timestamp, `answeredInRound`, and freshness.

Start selection is deterministic: the contract itself reads `latestRoundData()` while opening the Round. An operator cannot pass a preferred historical start round.

End selection is deterministic: the submitted candidate must be the first round in the same Chainlink phase whose `updatedAt >= resolveAt`. The contract proves this by requiring:

1. candidate answer is positive and `answeredInRound >= candidateId`;
2. candidate ID is later than the start ID;
3. candidate `updatedAt >= resolveAt` and `updatedAt > betCloseAt`;
4. candidate `updatedAt <= block.timestamp`;
5. candidate `updatedAt <= resolveAt + maxEndDelay`;
6. candidate and start are in the same phase;
7. candidate aggregator-round component is greater than one;
8. candidate minus one exists in the same phase and has `updatedAt < resolveAt`.

This predecessor proof rejects a caller who selects a later favorable historical round. Phase transitions fail closed because cross-phase predecessor continuity cannot be safely proven in V1.

The BSC mainnet BTC/USD candidate observed during Canon review is `0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf`. It is documentation only, not a deployment constant. Before any mainnet action Human review must re-verify chain ID, bytecode, description, decimals, latest data and freshness against the official Chainlink feed directory. BSC Testnet uses `MockAggregatorV3`; an old public Testnet proxy is not treated as reliable.

## 5. Results and cancellation

- `endPrice > startPrice`: UP
- `endPrice < startPrice`: DOWN
- `endPrice == startPrice`: DRAW

DRAW is a valid Oracle result, not a cancellation.

CANCELLED always applies to the entire Round. It requires a permissionless on-chain proof after `resolveAt + maxEndDelay` of one of:

- the deterministic first end round arrived after the maximum delay;
- a feed phase transition proof shows the old phase's last round is before `resolveAt`, its old-phase successor does not exist, and the new phase's first round is at/after `resolveAt`;
- the snapshotted Oracle currently reverts on `latestRoundData()`.

The phase proof prevents a caller from hiding a valid old-phase end round and racing to cancel an unfavorable result. Admin and Operator have no arbitrary cancel or winner-setting function. Pause alone does not authorize cancellation. Every position remains in storage after whole-Round cancellation.

## 6. CREDIT_ONLY test economy

V1 does not call KGEN `transferFrom`, does not debit a token balance, and does not escrow real KGEN. `amount` is an auditable test-credit weight. Therefore cancellation/DRAW requires no ERC-20 refund transfer; the immutable credit record remains visible and no Heart reward is claimable.

Each Round snapshots:

- `payoutBps`
- `minBet`
- `maxBet`
- `roundRewardCap`
- `economicMode`
- Oracle address/identity/freshness parameters
- TempleHeart address

Payout is fixed:

```text
payout = bet.amount * round.payoutBps / 10_000
```

The contract accumulates UP and DOWN reward liability independently and rejects a new position if that side would exceed the Round cap. Config changes affect only later Rounds. All mainnet economic values remain `HUMAN_DECISION_REQUIRED`.

## 7. Heart claim semantics

Only a finalized winning position may call `claim()`. FortuneGame checks `isHeartGameOperational()` and then calls the Round-snapshotted TempleHeart's `gamePayout(player, payout)`.

`claimed` is written only after `gamePayout()` succeeds. If the Heart is below its 1888 KGEN game gate, or paying would leave it below 1888, the transaction reverts and the entitlement remains retryable. `nonReentrant` prevents a Heart callback from claiming twice before the success flag is written.

## 8. Roles, pause and upgrade

- `DEFAULT_ADMIN_ROLE`: TempleHeart address administration and role administration.
- `OPERATOR_ROLE`: future Oracle/game configuration, Round creation, pause and unpause.
- `UPGRADER_ROLE`: UUPS authorization.

Operator cannot modify positions, prices, results or snapshotted Round configuration. Pause blocks Round creation, betting and claims; permissionless close/resolve remain available so pause cannot manufacture a cancellation outcome.

## 9. Views and events

Views: `currentRoundId`, `roundInfo`, `betInfo`, `canBet`, `canResolve`, `canClaim`, `previewPayout`, `secondsUntilClose`, `secondsUntilResolve`.

Events: `RoundCreated`, `RoundOpened`, `BetPlaced`, `RoundClosed`, `RoundResolved`, `RoundCancelled`, `RewardClaimed`, `OracleConfigUpdated`, `GameConfigUpdated`, `TempleHeartUpdated`, `GamePaused`.

`canResolve()` reports temporal/status readiness; the submitted Oracle proof is still fully validated by `resolveRound()`.

## 10. Deployment gate

This V1 candidate is approved only for local tests and, after a separate successful implementation report and Human review, BSC Testnet rehearsal. It does not authorize a mainnet deployment or a mainnet `TempleHeart.setFortuneGame()` call.
