# KAIOS Civilization Phase 2 Mainnet Stage 2C-1 Evidence

Status: **PASS**. The Human-authorized delayed-governance flow changed only the formal KGEN 0.10% Bank-tax receiver from the former Bank wallet to `KGENReserveRedemption`. Reward and AutoLP remained unchanged, all tax rates remained unchanged, the Reserve module remained registry-inactive, and redemption remained disabled.

## Governed tax redirect

- Network: BSC Mainnet (`chainId = 56`)
- Frozen source Head: `811bbe2e7a2979bb0ae317642bc13efc24253f36`
- Formal KGEN: `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`
- KGEN owner: BankGovernance `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166`
- Proposal ID: `0x8dd91246c88280a82c39126e10f6275058eb0654b5157915c69e85734da05f25`
- Target: KGEN
- Function: `setTaxWallets(address,address,address)`
- Calldata hash: `0x52a85f0854d7e57ab42821880c4e76731be9ad569cc3f83fd92c84f08de94320`
- Governance delay: 3,600 seconds
- Earliest execution timestamp: `1786787727`
- Actual execution timestamp: `1786787745`

| Step | Transaction | Block | UTC time | Gas | BNB spent |
|---|---|---:|---|---:|---:|
| Mother proposal | `0x625f39ab8ea2a5c3a6d68623b9f79122ab2aeaccece9ab32e913b231134c3a16` | 116052064 | 2026-08-15T08:55:27Z | 110,666 | 0.0000055333 |
| Jade approval | `0xa7ba5e2fd6dce3e7291cc0ba7026cfbf6d92fbac535c5c27b5b2e3ca7c84f713` | 116052107 | 2026-08-15T08:55:46Z | 57,667 | 0.00000288335 |
| Delayed execution | `0x7d6be56b14133941991a1d22928603d82446bdcf80472fef9068ee0623d7bfdc` | 116060103 | 2026-08-15T09:55:45Z | 94,110 | 0.0000047055 |

Total gas was `262,443`; total cost was `0.00001312215 BNB` at `0.05 gwei`.

## State transition and invariants

| State | Before | After |
|---|---|---|
| KGEN owner | BankGovernance | BankGovernance |
| Bank receiver | `0xFA4d34c46e86058e672936fa03cfd79F4C7A4b3c` | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` |
| Reward receiver | `0x0Fd21cf643211d067A18A416DA219827dA26E288` | unchanged |
| AutoLP receiver | `0xE87F6975Fa3d4F3D56Dce49fc978884285A3eD85` | unchanged |
| Fixed tax split | 0.10% burn / 0.10% Bank / 0.05% Reward / 0.05% AutoLP | unchanged |
| Wallet-to-wallet tax | 0% | 0% |
| Reserve registry active | false | false |
| Redemption enabled | false | false |
| Reserve KGEN balance at validation | 0 KGEN | 0 KGEN |

`setTaxWallets` applied KGEN's existing behavior of marking the three configured receivers tax-exempt. The contract emitted its existing `SetTaxExempt` events during the one governed execution; these were not separate calls or transactions. The old Bank receiver and former KGEN owner remain tax-exempt because exemption cleanup was outside this authorization.

No Mainnet KGEN trade was generated. The Reserve can passively accumulate the 0.10% Bank-tax allocation from future natural taxable activity while its module remains inactive and redemption remains disabled. The frontend/read model therefore reports `RESERVE_ACCUMULATING`, a 100 KGEN hard floor, `HUMAN_DECISION_REQUIRED` operational margin, and a disabled redemption action.

## Observability and authority

The indexer reconstructed `GovernanceProposalCreated`, `GovernanceProposalApproved`, `SetTaxWallets`, and `GovernanceProposalExecuted`, then persisted the new Bank receiver while preserving the owner, Reward, and AutoLP state. Incoming Reserve KGEN transfers without deterministic provenance remain `UNCLASSIFIED_KGEN_INFLOW`.

Read-only simulations confirmed that the former owner, Mother, and Jade Emperor cannot directly call KGEN owner-only functions. BankGovernance retains the owner authority surface, and owner-only changes require the formal delayed-governance flow.

No exemption cleanup, Reserve activation, redemption enable, redemption, Stage 2C-2 operation, Solidity change, private key, mnemonic, RPC credential, or environment secret is included in this evidence.
