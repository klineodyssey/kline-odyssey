# KGEN TempleHeart V3.3.0 Upgradeable — Codex Deploy Handoff

Status: REVIEW DRAFT ONLY. Not audited. Do not deploy to mainnet until tests and review pass.

## 1. Purpose

This release starts a new canonical Proxy generation for 五指山 12345 / 悟空財神殿 Heart.

Old deployed Heart V3.2.6 remains immutable at its historical address. It is NOT upgradeable and cannot be converted in place into a Proxy.

V3.3.0 introduces a new UUPS / ERC1967 Proxy. After the one-time migration, the Proxy address becomes the canonical 12345 Heart address. Future V3.3.x / V3.4.x / V4.x upgrades should replace only the implementation while keeping the Proxy address and Proxy-held state/balances unchanged.

## 2. Source

- Legacy reference: `KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol`
- New implementation: `KGEN/contracts/KGEN_TempleHeart_V3_3_0_Upgradeable.sol`

## 3. OpenZeppelin dependencies

Use OpenZeppelin Upgradeable packages compatible with Solidity `^0.8.24`.

Required imports:

- `@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol`
- `@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol`
- `@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol`
- `@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol`
- `@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol`
- `@openzeppelin/contracts/token/ERC20/IERC20.sol`
- `@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol`
- `@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`

Use OpenZeppelin Hardhat Upgrades or Foundry Upgrades tooling. Do not hand-roll a custom proxy.

## 4. Deployment model

Deploy the implementation behind an ERC1967/UUPS Proxy and call `initialize(...)` atomically.

Initializer arguments:

1. `admin`
2. `upgrader`
3. `operator`
4. `holyCupSigner`
5. `kgenToken`
6. `brainVault`
7. `kaiosBurnProofRegistry`

Do not use the implementation address as the public 12345 address. Frontend/Registry must point to the Proxy address.

## 5. Role separation

Recommended production ownership:

- `DEFAULT_ADMIN_ROLE`: multisig / governance admin
- `UPGRADER_ROLE`: multisig or timelock-controlled upgrader; do not use an ordinary hot wallet
- `OPERATOR_ROLE`: operational signer/backend for validated burn proofs and Heart maintenance
- `HOLY_CUP_SIGNER_ROLE`: signer used to authorize completed 3/3 Holy Cup proofs

For initial test deployment these may temporarily share a test wallet, but production should separate them.

## 6. V3.3.0 fortune rules

Default rules initialized on-chain:

- Fortune range: 1 to 8 KGEN
- Wallet cooldown: 30 days
- Civilization ID cooldown: 30 days
- Epoch duration: 30 days
- Epoch cap: 500 successful claims
- Minimum verified voluntary KGEN burn: 1 KGEN
- Purpose code: `keccak256("KGEN_12345_FORTUNE_GENESIS")`

The player no longer supplies an arbitrary reward amount. `fortuneClaim(bytes32 burnProofId)` computes the reward under contract rules.

## 7. Claim state machine

Target flow:

1. Player connects wallet.
2. `makeWish(wishHash, civilizationId)`.
3. Optional temple offering via `makeOffering(...)`.
4. KGEN is voluntarily burned through the White Hole / KAIOS BurnProof system.
5. Authorized operator verifies the KAIOS/KGEN burn proof and calls `registerVerifiedBurnProof(...)`.
6. Player completes Holy Cup 3/3 off-chain/UI task.
7. Authorized Holy Cup signer signs the proof payload.
8. Player calls `submitHolyCupProof(...)`.
9. Player calls `fortuneClaim(burnProofId)`.
10. Heart checks wallet cooldown + civilization cooldown + burn proof uniqueness + purpose + wish + epoch cap.

## 8. KAIOS integration

KAIOS minting remains outside TempleHeart.

Canonical economic rule remains:

`1 KGEN verified burn -> 10,000 KAIOS`

TempleHeart must not mint KAIOS.

V3.3.0 currently caches validated burn proof data via an authorized operator. Before mainnet, Codex should inspect the actual deployed KAIOS BurnProofGenesis interface and decide whether to replace this operator registration with direct on-chain `burnRecord(burnProofId)` validation. Direct verification is preferred if the deployed KAIOS interface is stable and available.

## 9. Holy Cup proof format

Current V3.3.0 signed digest contains:

- literal `KGEN_12345_HOLY_CUP_3_OF_3`
- Proxy address (`address(this)` under delegatecall)
- `block.chainid`
- claimant wallet
- `civilizationId`
- `wishHash`
- unique `proofId`
- expiry `deadline`

A proof ID may only be consumed once.

Before mainnet, Codex should consider replacing the manual ECDSA helper with OpenZeppelin ECDSA / MessageHashUtils or EIP-712 typed data. EIP-712 is recommended for production signer clarity and replay safety.

## 10. Offering model

V3.3.0 defines offering types:

- Incense
- JossPaper
- BlessingLamp
- FortuneCharm
- VowOffering

Current `makeOffering` transfers KGEN into Heart and records the offering; it does NOT burn that KGEN.

Do not describe every offering as a burn. White Hole burning and Heart offerings are different accounting events.

Future upgrades may route a configurable portion of an offering to White Hole burn and/or Bank, but that behavior is not enabled in this release.

## 11. Reward randomness warning

The current 1-8 reward calculation uses `block.prevrandao`, timestamp, and claim state as a lightweight bounded selection mechanism. It is NOT suitable for high-value or adversarial randomness.

For production where randomness materially affects value, replace with a commit-reveal flow or a verifiable randomness source. If 1-8 KGEN remains low-value and deterministic tiers are preferred, remove pseudo-randomness entirely and calculate reward from Blessing/Civilization tiers.

## 12. Migration from V3.2.6

Historical Heart address remains on-chain and should be retained in documentation as legacy.

Migration checklist:

- Pause/disable new frontend claims against V3.2.6.
- Stop automatic refills to old Heart.
- Deploy V3.3.0 implementation + Proxy.
- Initialize Proxy with production roles and addresses.
- Verify implementation and Proxy on BscScan.
- Transfer/fund required KGEN from old Heart only using valid legacy owner/admin functions and only after confirming permissions.
- Update root/shared Registry to the new Proxy address.
- Update `/K線西遊記/temples/12345/` frontend ABI and canonical Heart address.
- Keep V3.2.6 address visible as `LEGACY_HEART_V3_2_6` for history/audit.

Do not overwrite historical transaction records.

## 13. Storage upgrade law

From V3.3.0 onward:

- Never reorder existing storage variables.
- Never change the type of an existing storage variable.
- Never delete an existing storage variable.
- Append new state only in later versions.
- Run OpenZeppelin storage-layout validation before every upgrade.
- Preserve inherited upgradeable base contract ordering.

The `__gap` is reserved for future storage evolution; Codex must still run layout validation.

## 14. Mainnet blockers / tests required

Before deployment to BSC mainnet, Codex must add automated tests for at least:

- initialize cannot be called twice
- implementation initializer is disabled
- unauthorized upgrade fails
- authorized UUPS upgrade preserves Proxy address and state
- pause blocks claims
- fortune reward stays in configured range
- wallet 30-day cooldown
- civilization 30-day cooldown
- 500 claim epoch cap
- same burn proof cannot be reused
- wrong burner fails
- wrong civilizationId fails
- wrong purposeCode fails
- wrong wishHash fails
- burn amount below threshold fails
- expired Holy Cup signature fails
- replayed Holy Cup proof fails
- wrong-chain/wrong-Proxy signed proof fails
- insufficient Heart balance fails
- Brain refill and excess sweep behavior
- upgrade V3.3.0 -> mock V3.3.1 storage preservation

## 15. Security review items

Before mainnet:

1. Replace or review custom `_recover` with OpenZeppelin ECDSA/EIP-712.
2. Decide direct KAIOS burn-record validation vs OPERATOR_ROLE proof caching.
3. Review reward selection strategy.
4. Confirm KGEN token decimals and fee behavior when Heart sends/transfers KGEN.
5. Confirm old Brain allowances and new Proxy allowance requirements.
6. Use multisig/timelock for upgrade authority.
7. Confirm emergency pause operational process.
8. Verify no role is accidentally granted to zero address.
9. Run static analysis, compilation, unit tests, and upgrade-storage validation.

## 16. Codex deployment instruction

Codex should treat this branch as a review/deployment preparation branch, not as authorization to deploy mainnet automatically.

Tasks:

1. Compile the new implementation using the repository's existing Solidity toolchain.
2. Add missing OpenZeppelin upgrade dependencies/config if necessary.
3. Add UUPS deployment script.
4. Add upgrade script template.
5. Add unit and storage-layout tests listed above.
6. Inspect the actual KAIOS BurnProofGenesis contract/interface in this repository and wire direct proof verification if practical.
7. Inspect the 12345 frontend/Registry and prepare the ABI/address migration to the Proxy.
8. Open a PR with compile/test output and exact BSC deployment parameters still left as placeholders.
9. Do NOT deploy to BSC mainnet until human approval provides final admin/upgrader/operator/signer addresses and explicit deployment authorization.

## 17. Canonical rule after migration

`12345 TempleHeart identity = Proxy address`

Implementation addresses are versioned organs and may change. The Proxy address is the persistent public Heart identity unless emergency migration is required.
