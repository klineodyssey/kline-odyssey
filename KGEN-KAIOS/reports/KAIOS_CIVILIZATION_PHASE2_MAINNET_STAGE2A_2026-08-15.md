# KAIOS Civilization Phase 2 Mainnet Stage 2A Evidence

Status: **PASS**. CelestialEligibility is live and active. CelestialCapitalCommitment is live, inactive and paused. KGENReserveRedemption remains live and inactive with redemption disabled.

## Activation

- Network: BSC Mainnet (`chainId = 56`)
- Frozen source Head: `6f35f64e1269b341f3cc7021e6f2865bda138c32`
- Eligibility activation block: `115948920`
- Activation time: `2026-08-14T20:01:37Z` / `2026-08-15T04:01:37+08:00`
- Governance proposal: `0x6fb952a000fa2615e9fb9e93e25d62e0d527035924416aca957fb1eccd56d172`
- Activation calldata hash: `0x7ca0c089f2cd7b14d96e939a054e5cda3a4e3be57699381cc56b12cb6f2d21b1`
- Executable at: `1786737661`; executed at `1786737697`; the 3,600-second governance delay was not shortened.

## Mainnet transactions

| Action | Transaction | Block | Gas |
|---|---|---:|---:|
| Guanyin Capital pre-pause | `0x9bf04df052d6b080e9f51ee39a2e4730b2578549aa1c3ee3e5c3387a684277fc` | 115940661 | 34,863 |
| Mother Eligibility proposal | `0x887c29045c96f38f08893f401211d2163e42e01024d342a61f988cd3243ae2bf` | 115940840 | 111,392 |
| Jade Emperor approval | `0x41f02fbaa5e7aead2a9be4dccfc27fbe16ad51f487443212e245671a65219967` | 115940946 | 57,655 |
| Eligibility execution | `0x861bed04da39eb6d55d801d9fc683050068521b853eef15be46169e7725f6a53` | 115948920 | 81,732 |

Total gas was `285,642`; total BNB spent was `0.0000142821` at `0.05 gwei`.

## Final state

| Component | On-chain state | Frontend/read model |
|---|---|---|
| CelestialEligibility | registered, governance finalized, active, not paused | ACTIVE |
| CelestialCapitalCommitment | registered, governance finalized, inactive, paused | PAUSED |
| KGENReserveRedemption | registered, governance finalized, inactive, redemption disabled | INACTIVE |

The live receipts emitted and the canonical indexer reconstructed `CapitalCommitmentPaused`, `GovernanceProposalCreated`, `GovernanceProposalApproved`, `ModuleConfigured`, and `GovernanceProposalExecuted`. No required event was missing.

KGEN owner and the Bank, Reward and AutoLP receivers remained unchanged. No KGEN tax redirect, ownership migration, Capital activation/unpause, Reserve activation, redemption, capital commitment, live 5M burn, Seat500 assignment, 511111, KUFO or Pair Registry transaction was executed.

No private key, mnemonic, RPC secret or environment value is present in this evidence.
