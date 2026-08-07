# KGEN TempleHeart V3.3.0 Upgradeable — Codex Deploy Handoff

Status: REVIEW DRAFT ONLY. Not audited. Do not deploy to mainnet until compile/tests/review pass and human approval is explicit.

## 1. Purpose

This release starts the new canonical Proxy generation for 五指山 12345 / 悟空財神殿 Heart.

Legacy `KGEN_TempleHeart_V3_2_6.sol` remains immutable at its historical address. It is NOT upgradeable and cannot be converted in-place into a Proxy.

V3.3.0 uses OpenZeppelin UUPS / ERC1967 Proxy. After the one-time migration, the Proxy address becomes the canonical 12345 Heart address. Future implementation upgrades should preserve that Proxy address, Proxy-held KGEN balance, roles and storage.

## 2. Sources

- Legacy reference: `KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol`
- New implementation: `KGEN/contracts/KGEN_TempleHeart_V3_3_0_Upgradeable.sol`
- KAIOS source of truth: `KGEN-KAIOS/contracts/KAIOSV02_BurnProofGenesis.sol`

## 3. OpenZeppelin / Proxy rules

Use OpenZeppelin Upgradeable packages compatible with Solidity `^0.8.24`.

Required components include:

- `Initializable`
- `UUPSUpgradeable`
- `AccessControlUpgradeable`
- `PausableUpgradeable`
- `ReentrancyGuardUpgradeable`
- `EIP712Upgradeable`
- `ECDSA`
- `IERC20`, `IERC20Metadata`, `SafeERC20`

Use OpenZeppelin Hardhat Upgrades or Foundry Upgrades. Do not hand-roll a proxy.

Deploy implementation behind ERC1967/UUPS Proxy and call `initialize(...)` atomically. Frontend and Registry use the Proxy address only.

## 4. Production roles

- `DEFAULT_ADMIN_ROLE`: multisig/governance admin
- `UPGRADER_ROLE`: multisig/timelock upgrader
- `OPERATOR_ROLE`: pause + Heart/Brain maintenance
- `HOLY_CUP_SIGNER_ROLE`: signs completed 3/3 Holy Cup attestations

`OPERATOR_ROLE` must NOT manually approve KAIOS burn proofs. Burn truth is read directly from chain.

## 5. KAIOS direct on-chain verification — mandatory

TempleHeart calls `KAIOSV02_BurnProofGenesis` directly:

- `burnProofConsumed(burnProofId)` must be true
- `burnRecord(burnProofId)` is decoded on-chain
- source must be `VoluntaryPlayerOffering`
- burner must equal claimant/game player
- `civilizationId` must match active Wish
- `purposeCode` must match the relevant Heart action
- `wishHash` must match the active Wish
- burn amount must satisfy the configured minimum
- `kaiosMintAmount == kgenBurnAmount * 10_000`

Economic invariant remains:

`1 KGEN verified burn -> 10,000 KAIOS`

TempleHeart never mints KAIOS.

## 6. Pilgrim / 香客 registry

V3.3.0 adds an on-chain temple census based on `civilizationId`.

Canonical counters/state:

- `isPilgrim[civilizationId]`
- `pilgrimCivilizationByWallet[wallet]`
- `totalPilgrims`
- `dailyNewPilgrims[dayIndex]`
- `dailyActivePilgrims[dayIndex]`
- `totalWishers`
- `totalOfferers`
- `totalHolyCupPassed`
- `totalFortuneClaimants`

A new `civilizationId` is registered as a pilgrim when `makeWish(...)` succeeds. Activity is deduplicated per civilization per UTC day.

Frontend may display directly from chain:

- 今日新香客
- 今日活躍香客
- 累計香客
- 累計許願
- 累計三聖盃通關
- 累計領發財金

Backend analytics are optional and must not override these canonical on-chain counts.

## 7. Wish / Holy Cup / main Fortune flow

1. Wallet connects.
2. `makeWish(wishHash, civilizationId)` registers/activates pilgrim.
3. Optional `makeOffering(...)`.
4. Player burns KGEN through White Hole/KAIOS with matching civilization, purpose and wish.
5. Player completes Holy Cup 3/3.
6. EIP-712 proof is signed by `HOLY_CUP_SIGNER_ROLE`.
7. Player submits `submitHolyCupProof(...)`.
8. Player calls `fortuneClaim(burnProofId)`.
9. Heart reads the KAIOS Burn Proof directly.
10. Heart enforces proof uniqueness + wallet/civilization cooldown + epoch cap.

Default main Fortune rules:

- reward: 1..8 KGEN
- player cannot input reward amount
- wallet cooldown: 30 days
- civilization cooldown: 30 days
- epoch: 30 days
- max successful claims per epoch: 500
- minimum qualifying burn: 1 KGEN
- purpose: `keccak256("KGEN_12345_FORTUNE_GENESIS")`

Main Fortune reward is deterministic from `BlessingPower`; it is not a previewable monetary random draw.

## 8. Holy Cup 3/3

Use OpenZeppelin EIP-712 + ECDSA.

Typed payload:

`HolyCupProof(address claimant,bytes32 civilizationId,bytes32 wishHash,bytes32 proofId,uint256 deadline)`

Test expiry, replay, wrong signer, wrong wallet, wrong civilization, wrong wish and wrong domain/chain.

## 9. Hourly Heartbeat / 每小時心跳

V3.2.6 historically paid 1 KGEN per hourly heartbeat. DO NOT carry that direct faucet behavior into V3.3.0 because it can be Sybil-farmed.

V3.3.0 keeps the life rhythm but converts it to progression:

- function: `heartbeat()`
- default cooldown: 1 hour
- wallet cooldown AND civilization cooldown are both enforced
- default gain: `+1 BlessingPower`
- direct KGEN payout: `0`
- increments `heartbeatCountByCivilization`
- increments `totalHeartbeats`
- marks pilgrim active for current UTC day

Admin may adjust cooldown/power through `setRhythmRules`, but heartbeat must remain a progression signal unless a later audited economic version explicitly changes it.

## 10. Cross-day Breath / 跨日呼吸

V3.2.6 historically had `igniteAndClaim` in a narrow UTC 00:00-00:10 window and paid 8 KGEN. V3.3.0 deliberately removes the direct KGEN faucet and the narrow 10-minute requirement.

V3.3.0 behavior:

- function: `crossDayBreath()`
- one successful breath per UTC day per wallet AND civilization
- callable any time during that UTC day
- default gain: `+8 BlessingPower`
- direct KGEN payout: `0`
- increments `breathCountByCivilization`
- increments `totalBreaths`

This preserves the Heart/respiration world model without creating a daily 8 KGEN bot faucet.

## 11. BlessingPower -> 30-day Fortune tier

Default deterministic thresholds:

- base = 1 KGEN
- `BlessingPower >= 88` -> +1
- `>= 188` -> +1
- `>= 388` -> +1
- `>= 888` -> +1
- `>= 1888` -> +1
- `>= 3888` -> +1
- `>= 8888` -> +1
- hard cap = 8 KGEN

Heartbeat and breath therefore increase long-term Fortune tier without paying a free token each time.

## 12. Burn-first Fortune Game — may be played anytime

This is the anti-preview/anti-cancel design required for the game.

The game is NOT limited by hour/day cooldown. A player may open another round whenever they possess a NEW valid KAIOS burn proof for the game purpose.

Mandatory order:

1. Player first burns KGEN through White Hole/KAIOS.
2. Burn is final and produces an on-chain Burn Proof.
3. The Burn Proof must use:
   - source = `VoluntaryPlayerOffering`
   - purpose = `keccak256("KGEN_12345_FORTUNE_GAME")`
   - matching wallet, `civilizationId`, `wishHash`
4. Player calls `openFortuneGame(burnProofId)`.
5. Heart validates the proof and immediately marks that burn proof consumed for game use.
6. `openFortuneGame` stores `targetBlock = current block + 1`.
7. NO win/loss result is calculated or emitted in the open transaction.
8. Only after the target block exists can `settleFortuneGame(gameId)` calculate the result.
9. There is NO cancel/refund route after game open.
10. Anyone may call settle, but payout always goes to the original player.

This fixes the 16888-style bug class where UI displays win/loss before the economic action is irreversible and the user cancels losing transactions.

### Absolute frontend rule

12345 frontend MUST NOT:

- locally simulate and display the final win/loss before burn/open is mined
- expose a cancel button that refunds or un-consumes the burn proof
- treat an unsigned/unmined transaction as a completed game
- reveal a deterministic result before the required burn proof exists

Frontend should display states only:

`等待燒幣 -> Burn Proof 已確認 -> 本局已開啟 -> 等待目標區塊 -> 已結算`

## 13. Game default payout table

Current draft table uses the already-burned KGEN amount as the stake basis:

- roll 0..4999: payout `0x`
- 5000..8499: payout `0.5x`
- 8500..9899: payout `1x`
- 9900..9999: payout `8x`

Expected KGEN payout = `0.395x` the burned KGEN amount, before considering gas/fees. The separate 10,000 KAIOS per burned KGEN is not included in that KGEN EV.

This table is a DRAFT economic setting, not final legal/financial approval.

## 14. Randomness / settlement security

The current draft uses a FUTURE block hash (`targetBlock`) only after burn/open is final. This prevents simple UI preview-and-cancel behavior, but block hash is not ideal for high-value adversarial randomness.

Before enabling material-value production game payouts, Codex must implement ONE of these production paths:

A. preferred: verifiable randomness/VRF with request created only after burn proof consumption; or
B. low-value mode: retain future-block entropy with strict per-round payout cap and documented validator-manipulation risk.

Do not use current timestamp, current block hash, local JavaScript RNG, or a pre-open deterministic secret to decide a monetary result.

If VRF is added later, preserve the same invariant:

`burn proof consumed BEFORE randomness request/result`.

## 15. Game stale-block handling

Current future-block design uses EVM `blockhash`, available only for a limited historical window.

Codex must test and document stale rounds. Before production choose one policy:

- permissionless keeper settles rounds promptly; OR
- migrate to VRF; OR
- add an audited deterministic recovery process that never refunds the already-consumed burn based on revealed win/loss.

Do not add a player-controlled "cancel losing round" recovery.

## 16. Offerings

Offering types remain:

- `Incense`
- `JossPaper`
- `BlessingLamp`
- `FortuneCharm`
- `VowOffering`

`makeOffering(...)` transfers KGEN into Heart and records the offering. It does NOT mean White Hole burn.

White Hole/KAIOS burn and temple offering are separate accounting events.

## 17. Heart / Brain liquidity

Retained:

- `injectFromBrain`
- `autoRefillFromBrain`
- `sweepExcessToBrain`
- cap/floor calculations

Codex must configure any required Brain allowance for the NEW Proxy address. Legacy allowance does not migrate automatically.

## 18. Storage law

V3.3.0 is the genesis storage law of this Proxy generation.

From deployment onward:

- never reorder existing state variables
- never change existing state variable types
- never delete existing state variables
- append only
- preserve inherited base ordering
- run OpenZeppelin storage-layout validation for every upgrade

## 19. Required tests before mainnet

### Proxy/access
- initializer one-time
- implementation initializer disabled
- unauthorized upgrade rejected
- upgrade preserves Proxy/state/balance
- pause/unpause and roles

### KAIOS proof
- nonexistent/unconsumed proof rejected
- SystemAmmTax source rejected
- wrong burner/civilization/purpose/wish rejected
- minimum burn enforced
- 10,000x KAIOS invariant enforced
- burn proof cannot be reused for same action class

### Pilgrims
- first civilization registers once
- repeated Wish does not increase `totalPilgrims`
- daily active pilgrim deduplicates civilization
- new/active daily counters rollover at UTC day boundary

### Holy Cup
- EIP-712 valid path
- expiry/replay/wrong signer/domain/wallet/civilization/wish

### Heartbeat
- one per configured hour per wallet
- same civilization through another wallet cannot bypass cooldown
- transfers zero KGEN
- BlessingPower increases correctly

### Cross-day Breath
- one per UTC day per wallet/civilization
- callable outside old 00:00-00:10 window
- transfers zero KGEN
- +8 default BlessingPower

### Main Fortune
- no user-selected reward amount
- 1..8 cap
- 30-day wallet/civilization cooldown
- 500 epoch cap
- proof uniqueness
- insufficient Heart funds

### Burn-first game
- cannot open without already-consumed KAIOS Burn Proof
- wrong game purpose rejected
- same Burn Proof cannot open two rounds
- open transaction emits/stores no result
- target block must be in future at open
- cannot settle before target block
- settlement cannot be canceled/reopened
- anyone may settle but payout always goes to player
- payout table boundaries exactly tested at 4999/5000/8499/8500/9899/9900/9999
- losing payout is zero and burn remains consumed
- Heart insufficient funds behavior tested
- stale target block behavior tested
- no refund/cancel path exists

### Heart/Brain
- refill/cap/floor/sweep and permissions

### Upgrade regression
- V3.3.0 -> mock V3.3.1 storage preservation
- pilgrim counters, Wish, heartbeat/breath state, game rounds, consumed proofs, roles and KGEN balance survive

## 20. Codex tasks — complete before deployment request

1. Compile the Solidity file against repository toolchain.
2. Pin compatible OpenZeppelin versions.
3. Add UUPS deploy script.
4. Add UUPS upgrade script template.
5. Add all tests above.
6. Add storage-layout validation.
7. Confirm KAIOS ABI against `KAIOSV02_BurnProofGenesis.sol`.
8. Add local integration deployment of KAIOS + Heart Proxy.
9. Test token decimals and `1 KGEN -> 10,000 KAIOS` units.
10. Prepare Registry migration to new Proxy.
11. Update 12345 frontend ABI and remove legacy `fortuneClaim(amountWhole)`.
12. Add on-chain pilgrim dashboard fields.
13. Add heartbeat and cross-day breath controls/status.
14. Build burn-first game UI state machine. No result preview before burn/open confirmation.
15. Add settlement/keeper handling or production VRF plan.
16. Prepare BscScan verification commands.
17. Leave production addresses/migration amount blank until explicit human approval.
18. Do NOT deploy BSC mainnet automatically.

## 21. Mainnet blockers

No mainnet deployment until:

- compile clean
- automated tests clean
- storage validation clean
- KAIOS ABI/integration confirmed
- Proxy and implementation verified in test/local environment
- production admin/upgrader/operator/holyCup signer approved
- KGEN/Brain/KAIOS addresses confirmed
- Heart funding/migration amount approved
- game randomness mode approved (VRF strongly preferred for meaningful value)
- frontend burn-first flow reviewed against preview/cancel bug
- explicit human authorization to deploy BSC mainnet

## 22. Canonical identity

`12345 TempleHeart identity = UUPS Proxy address`

Implementation addresses are replaceable versions. The Proxy is the persistent public Heart identity unless emergency migration is required.
