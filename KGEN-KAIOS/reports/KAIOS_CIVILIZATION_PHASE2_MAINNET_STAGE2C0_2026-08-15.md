# KAIOS Civilization Phase 2 Mainnet Stage 2C-0 Evidence

Status: **PASS**. Formal KGEN ownership moved through the single Human-authorized Mainnet transaction from the current deployer EOA to formal BankGovernance. No tax wallet, exemption, AMM-pair, Reserve, redemption, Eligibility, or Capital state-changing call was sent.

## Ownership migration

- Network: BSC Mainnet (`chainId = 56`)
- Frozen source Head: `57478af6237f4f75a6a4d95723c2a984e910f66c`
- KGEN: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- Previous owner: `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`
- New owner: `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166`
- Transaction: `0xaca082ab94175bc1eba95685cc5095bb6fea8f01d03517aecd4e0948f818e9f9`
- Block: `116012988`
- Block hash: `0x6765f6fa66bc2bf4484b6d8b1053352203cf9f84daca129dbf52e19de526b395`
- Time: `2026-08-15T04:02:17Z` / `2026-08-15T12:02:17+08:00`
- Gas: `28,656` at `0.05 gwei`
- BNB spent: `0.0000014328`
- Deployment signer nonce: `62 -> 63`

The exact calldata was `0xf2fde38b000000000000000000000000a2792fbdcc8a8aac364053431d44e0a8d335e166`; its Keccak-256 hash was `0xf8b9bcd780c92e7e21231aceca59ec452973c953782fb0690eb6d7f12ac62857`.

The receipt emitted `OwnershipTransferred(0xb3C54ca96De0dED4Ca0151F629ff9781506ba261, 0xa2792fBDCc8A8AaC364053431D44E0a8D335E166)`. The canonical reducer updated its indexed owner to BankGovernance, and the independent RPC `owner()` read returned the same address.

## Authority and unchanged state

Read-only `eth_call` simulations proved that the former owner can no longer call `setTaxWallets`, `setTaxExempt`, `setMarketMakerPair`, or `transferOwnership`. Simulations from BankGovernance confirmed the owner-only surface remains available to formal governance. Mother retains the proposer role, Jade Emperor retains the approver role, and the delay remains 3,600 seconds.

| State | Before | After |
|---|---|---|
| KGEN Bank receiver | `0xFA4d34c46e86058e672936fa03cfd79F4C7A4b3c` | unchanged |
| KGEN Reward | `0x0Fd21cf643211d067A18A416DA219827dA26E288` | unchanged |
| KGEN AutoLP | `0xE87F6975Fa3d4F3D56Dce49fc978884285A3eD85` | unchanged |
| CelestialEligibility | LIVE_ACTIVE | LIVE_ACTIVE |
| CelestialCapitalCommitment | LIVE_ACTIVE | LIVE_ACTIVE |
| KGENReserveRedemption | LIVE_INACTIVE | LIVE_INACTIVE |
| Redemption enabled | false | false |

The fixed tax split remains 0.10% true burn, 0.10% Bank, 0.05% Reward, and 0.05% AutoLP. `setTaxWallets` was not executed. The old Bank receiver and former owner both remain tax-exempt; no exemption cleanup was authorized or performed.

No private key, mnemonic, RPC credential, or environment value is present in this evidence.
