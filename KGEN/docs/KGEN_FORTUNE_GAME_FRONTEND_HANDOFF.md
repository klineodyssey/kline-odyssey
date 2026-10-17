# FORTUNE_GAME_FRONTEND_HANDOFF

Status: **TESTNET READY — HUMAN REVIEW REQUIRED**

- TESTNET_FORTUNE_GAME_PROXY: `0x2385cf595285F256026311C94a5CA0E38f30fe61`
- TESTNET_ORACLE: `0x4C693399C63Af61183583BBf8E57893A22916FAF` (**TEST_ONLY_ORACLE**)
- ABI: `KGEN/abi/KGEN_FortuneGame_Upgradeable.json` (`abi` field; compiler-generated)
- version: `1.0.0`
- network: BSC Testnet, chainId `97`
- economy: `CREDIT_ONLY / TEST`

## Required views

`currentRoundId()`, `roundInfo(uint256)`, `betInfo(uint256,address)`,
`canBet(uint256,address)`, `canResolve(uint256)`, `canClaim(uint256,address)`,
`previewPayout(uint256,address)`, `secondsUntilClose(uint256)`,
`secondsUntilResolve(uint256)`, `version()`.

## Enums

- `Direction`: `NONE=0`, `UP=1`, `DOWN=2`
- `RoundStatus`: `NONE=0`, `CREATED=1`, `OPEN=2`, `CLOSED=3`, `RESOLVED=4`, `CANCELLED=5`
- `RoundResult`: `UNRESOLVED=0`, `UP=1`, `DOWN=2`, `DRAW=3`, `CANCELLED=4`
- `EconomicMode`: `UNSET=0`, `CREDIT_ONLY=1`

## Transactions

- `placeBet(uint256 roundId, Direction direction, uint128 amount)`
- `claim(uint256 roundId)`

The UI must display **BET CONFIRMED** only after a successful transaction receipt.
This address and Oracle are **TESTNET_REHEARSAL_ONLY**. `MAINNET_DEPLOY = BLOCKED`.
