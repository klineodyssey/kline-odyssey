# KGEN TempleHeart V3.3.0 Upgradeable — Codex Deploy Handoff

Status: REVIEW DRAFT ONLY. Not audited. Do not deploy to mainnet until compile/tests/review pass and human approval is explicit.

## 1. Purpose

This release starts the new canonical Proxy generation for 五指山 12345 / 悟空財神殿 Heart.

Legacy `KGEN_TempleHeart_V3_2_6.sol` remains immutable at its historical address. It is NOT upgradeable and cannot be converted in-place into a Proxy.

V3.3.0 uses OpenZeppelin UUPS / ERC1967 Proxy. After the one-time migration, the Proxy address becomes the canonical 12345 Heart address. Future implementation upgrades should preserve that Proxy address, Proxy-held KGEN balance, roles and storage.

## 2. Source

- Legacy reference: `KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol`
- New implementation: `KGEN/contracts/KGEN_TempleHeart_V3_3_0_Upgradeable.sol`
- KAIOS source of truth: `KGEN-KAIOS/contracts/KAIOSV02_BurnProofGenesis.sol`

## 3. OpenZeppelin dependencies

Use OpenZeppelin Upgradeable packages compatible with Solidity `^0.8.24`.

Required imports include:

- `Initializable`
- `UUPSUpgradeable`
- `AccessControlUpgradeable`
- `PausableUpgradeable`
- `ReentrancyGuardUpgradeable`
- `EIP712Upgradeable`
- `ECDSA`
- `IERC20`, `IERC20Metadata`, `SafeERC20`

Use OpenZeppelin Hardhat Upgrades or Foundry Upgrades tooling. Do not hand-roll a proxy.

## 4. Deployment model

Deploy implementation behind an ERC1967/UUPS Proxy and call `initialize(...)` atomically.

Initializer arguments:

1. `admin`
2. `upgrader`
3. `operator`
4. `holyCupSigner`
5. `kgenToken`
6. `brainVault`
7. `kaiosBurnProofGenesis`

Frontend and Registry must point to the Proxy address, never the implementation address.

## 5. Role separation

Production recommendation:

- `DEFAULT_ADMIN_ROLE`: multisig/governance admin
- `UPGRADER_ROLE`: multisig/timelock-controlled upgrader
- `OPERATOR_ROLE`: pause + Heart/Brain maintenance only
- `HOLY_CUP_SIGNER_ROLE`: signer that attests completion of the 3/3 Holy Cup task

IMPORTANT: `OPERATOR_ROLE` does NOT register or approve KAIOS burn proofs. Burn proof eligibility is read directly on-chain.

## 6. Canonical fortune rules

Defaults:

- Fortune reward configured range: 1 to 8 KGEN
- Player cannot supply reward amount
- Wallet cooldown: 30 days
- Civilization ID cooldown: 30 days
- Epoch: 30 days
- Epoch maximum successful claims: 500
- Minimum voluntary KGEN burn: 1 KGEN
- Required KAIOS burn source: `VoluntaryPlayerOffering`
- Required purpose code: `keccak256("KGEN_12345_FORTUNE_GENESIS")`
- One KAIOS burn proof can unlock Fortune only once

## 7. KAIOS integration — DIRECT ON-CHAIN ONLY

This is now mandatory, not optional.

TempleHeart calls the deployed `KAIOSV02_BurnProofGenesis` contract directly:

- `burnProofConsumed(burnProofId)` must be true
- `burnRecord(burnProofId)` is decoded on-chain
- `source` must equal `VoluntaryPlayerOffering`
- `burner` must equal `msg.sender`
- `civilizationId` must match active Wish
- `purposeCode` must match `KGEN_12345_FORTUNE_GENESIS`
- `wishHash` must match active Wish
- `kgenBurnAmount` must satisfy the minimum burn threshold
- `kaiosMintAmount` must equal `kgenBurnAmount * 10_000`

There is no `registerVerifiedBurnProof(...)` operator path in the canonical V3.3.0 design.

KAIOS remains responsible for minting. TempleHeart never mints KAIOS.

Economic invariant remains:

`1 KGEN verified burn -> 10,000 KAIOS`

## 8. Wish / Holy Cup / Fortune state flow

Target flow:

1. Player connects wallet.
2. Player creates a Wish: `makeWish(wishHash, civilizationId)`.
3. Optional temple offering: `makeOffering(...)`.
4. Player performs the White Hole KGEN burn through KAIOS BurnProofGenesis using matching `civilizationId`, `purposeCode`, and `wishHash`.
5. Player completes Holy Cup 3/3 task.
6. Authorized signer issues an EIP-712 Holy Cup proof.
7. Player submits `submitHolyCupProof(...)` on-chain.
8. Player may play daily blessing progression once per UTC day.
9. Player calls `fortuneClaim(burnProofId)`.
10. Heart reads KAIOS Burn Proof directly and enforces wallet/civilization/proof/epoch rules.

## 9. Holy Cup proof

V3.3.0 uses OpenZeppelin EIP-712 + ECDSA.

Typed payload:

`HolyCupProof(address claimant,bytes32 civilizationId,bytes32 wishHash,bytes32 proofId,uint256 deadline)`

The EIP-712 domain binds signature validity to the chain and Proxy contract domain. `proofId` is one-time and `deadline` is mandatory.

Codex tests must include:

- expired proof
- replayed proof
- wrong wallet
- wrong civilization
- wrong wish
- wrong signer
- wrong chain/domain

## 10. Daily game design — playable every day, NOT a daily KGEN faucet

The canonical daily game is `playDailyBlessing()`.

Rules:

- once per UTC day per wallet
- once per UTC day per `civilizationId`
- requires an active unfulfilled Wish
- records `blessingDaysByCivilization`
- pays no KGEN directly
- creates daily engagement and quest progression without recreating a Sybil faucet

Default deterministic reward progression:

- base Fortune reward: 1 KGEN
- 7 blessing days: +1
- 14 blessing days: +1
- 21 blessing days: +1
- hard cap: configured `fortuneMaxWhole`, default 8 KGEN

This is intentionally deterministic. Do NOT use `block.timestamp`, `block.prevrandao`, block hash or miner/validator-influenced values as monetary randomness.

If a future version wants a true chance-based prize, use verifiable randomness and conduct a separate legal/economic review before enabling any wager-like mechanism.

## 11. Game design terminology

Frontend may present the daily interaction as temple gameplay such as:

- 上香
- 擲聖盃
- 祈福任務
- 每日參拜
- 累積福氣/祈福日

But the canonical V3.3.0 economic model is NOT "pay KGEN to gamble for more KGEN".

Do not market or implement a guaranteed positive-return loop such as:

- burn 1 KGEN -> guaranteed 8 KGEN
- buy incense for X KGEN -> guaranteed Y>X KGEN

Temple offerings and White Hole burns are separate accounting events.

## 12. Offering model

Offering types:

- `Incense`
- `JossPaper`
- `BlessingLamp`
- `FortuneCharm`
- `VowOffering`

Current `makeOffering(...)` transfers KGEN into Heart and records the offering. It does NOT burn KGEN and does not directly increase reward in V3.3.0.

Reason: first establish a safe accounting boundary.

Future upgrades may add configurable offering utility such as cosmetics, quest access, Blessing Power, temple rank, or a separately reviewed burn routing module. Do not couple "amount paid" directly to guaranteed KGEN profit.

## 13. Heart / Brain behavior

V3.3.0 retains the core Heart liquidity skeleton:

- `injectFromBrain`
- `autoRefillFromBrain`
- `sweepExcessToBrain`
- cap/floor calculations

Codex must confirm the production Brain allowance model for the NEW Proxy address. Any allowance granted to the legacy V3.2.6 address does not automatically transfer to the Proxy.

## 14. Migration from V3.2.6

Migration checklist:

- disable frontend fortune claims against legacy V3.2.6
- stop refills to old Heart
- compile/test V3.3.0
- deploy implementation + UUPS Proxy
- initialize roles/addresses atomically
- verify implementation and Proxy on BscScan
- configure Brain allowance for the Proxy
- transfer/fund KGEN only through valid legacy admin paths after review
- update shared/root Registry to new Proxy address
- update `/K線西遊記/temples/12345/` ABI and Heart address
- retain old address as `LEGACY_HEART_V3_2_6`

Historical records must never be overwritten.

## 15. Storage upgrade law

From this Proxy generation onward:

- never reorder existing storage variables
- never change existing storage variable types
- never delete existing storage variables
- append state only in later versions
- preserve inherited upgradeable base ordering
- run OpenZeppelin storage-layout validation before every upgrade

The V3.3.0 layout is the genesis storage law for this Proxy generation.

## 16. Required automated tests before any mainnet deployment

Codex must implement at least:

### Proxy / access
- initialize cannot run twice
- implementation initializer disabled
- unauthorized UUPS upgrade fails
- authorized upgrade preserves Proxy address and state
- role boundaries are enforced
- pause/unpause works

### KAIOS direct proof
- registry zero address rejected
- nonexistent proof rejected
- unconsumed KAIOS proof rejected
- non-voluntary/SystemAmmTax source rejected
- wrong burner rejected
- wrong civilization rejected
- wrong purpose rejected
- wrong wish rejected
- burn below minimum rejected
- KAIOS mint amount mismatch rejected
- same proof cannot unlock Fortune twice

### Holy Cup
- valid EIP-712 proof passes
- expired proof rejected
- replay rejected
- wrong signer rejected
- wrong wallet/civilization/wish rejected

### Fortune
- player cannot choose arbitrary amount
- reward remains within 1..8 configured range
- wallet cooldown enforced
- civilization cooldown enforced
- 500-claim epoch cap enforced
- insufficient Heart balance rejected
- successful claim marks Wish fulfilled

### Daily blessing
- one play per wallet per UTC day
- one play per civilization per UTC day
- second wallet cannot farm same civilization same day
- blessing day progression persists
- reward preview follows deterministic milestone rules
- daily play transfers zero KGEN

### Heart / Brain
- refill calculations
- cap/floor behavior
- sweep excess
- permissions

### Upgrade regression
- V3.3.0 -> mock V3.3.1 storage compatibility
- Wish, cooldown, blessing progress, proof-consumed state and KGEN balance survive upgrade

## 17. Codex implementation tasks — do all before requesting deployment approval

1. Compile `KGEN_TempleHeart_V3_3_0_Upgradeable.sol` against the repository toolchain.
2. Pin compatible OpenZeppelin package versions.
3. Add UUPS deploy script.
4. Add UUPS upgrade script template.
5. Add full automated tests from section 16.
6. Add storage-layout validation.
7. Confirm `KAIOSV02_BurnProofGenesis.sol` ABI exactly matches the interface in TempleHeart.
8. Add integration test deploying both KAIOS BurnProofGenesis and TempleHeart Proxy locally.
9. Verify the `1 KGEN -> 10,000 KAIOS` unit/decimals invariant using real token decimals.
10. Inspect root/shared Registry and prepare the new canonical Proxy entry.
11. Inspect 12345 frontend and replace the old `fortuneClaim(amountWhole)` flow.
12. Frontend must implement Wish -> Burn -> HolyCup -> Daily Blessing -> Fortune state display.
13. Frontend must never expose manual reward amount input.
14. Prepare BscScan verification commands.
15. Produce exact deployment parameter checklist with addresses left blank until human approval.
16. Do NOT deploy mainnet automatically.

## 18. Mainnet deployment blockers

No mainnet deployment until all are true:

- compile clean
- unit/integration tests clean
- storage validation clean
- KAIOS ABI confirmed
- Proxy + implementation verified on local/test environment
- admin/upgrader/operator/holyCupSigner production addresses approved
- KGEN token address confirmed
- Brain address/allowance confirmed
- KAIOS BurnProofGenesis deployed address confirmed
- migration amount from legacy Heart approved
- frontend/Registry migration reviewed
- explicit human authorization to deploy BSC mainnet

## 19. Canonical identity after migration

`12345 TempleHeart identity = UUPS Proxy address`

Implementation addresses are replaceable versions. Proxy address is the persistent public Heart identity unless an emergency migration is required.
