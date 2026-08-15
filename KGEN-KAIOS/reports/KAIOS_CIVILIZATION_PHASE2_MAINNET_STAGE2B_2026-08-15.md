# KAIOS Civilization Phase 2 Mainnet Stage 2B Evidence

Status: **PASS**. CelestialCapitalCommitment was activated through delayed, distinct-approver governance, remained paused through the intermediate safety gate, and was then unpaused through a new and independently delayed governance proposal.

## Governance sequence

- Network: BSC Mainnet (`chainId = 56`)
- Frozen source Head: `cad5a0016694064720828114dad9dd72b4c6d3f4`
- Capital activation block: `115965212`
- Activation time: `2026-08-14T22:03:50Z` / `2026-08-15T06:03:50+08:00`
- Capital unpause block: `115973222`
- Unpause time: `2026-08-14T23:03:54Z` / `2026-08-15T07:03:54+08:00`

The activation proposal used calldata hash `0x49972fba9a4f1dbbb0009823ae6b9904f19dc4077d466ae601a04da4b4bf42e7`. Its ETA was `1786745028`, and it executed at `1786745030`.

After activation, Mainnet read-back proved Capital was active and still paused. The frontend read model returned `PAUSED`, and a read-only commitment simulation reverted. Only after this gate passed was the independent unpause proposal created. It used calldata hash `0x2e0b3eaf0cdee5e3edb3587a639f993dc24c3ed89ce7321ef60ccd2d17df98b1`; its ETA was `1786748633`, and it executed at `1786748634`.

## Mainnet transactions

| Action | Transaction | Block | Gas |
|---|---|---:|---:|
| Mother Capital activation proposal | `0x8872f2b63a5b85d656412e738fc64d36bcce965149fcbd8e2f7f33e78020fe80` | 115957209 | 111,392 |
| Jade Emperor activation approval | `0x4f046dc310b46196d71ce9eae63529560d769ddf8f119029549cdfae40aee389` | 115957215 | 57,655 |
| Capital activation execution | `0x62e2c339c6e5b973dd1922e1be847bc6d51399d7bdd46c2b5dbe072149069641` | 115965212 | 81,732 |
| Mother Capital unpause proposal | `0x577e30b8d4165c44b5a70d103aa57dfe663fe9967a355a4fea91ba3a383f2a3b` | 115965219 | 109,508 |
| Jade Emperor unpause approval | `0x9e46edc8b4421086d65b797e05aac2b16a34a595141fbd8a63b4bf21ffd49e08` | 115965225 | 57,667 |
| Capital unpause execution | `0x428c384bd3fa60a18bb898e97f06dc65f9553de72456da2318569771bf023156` | 115973222 | 61,101 |

Total gas was `479,055`; total BNB spent was `0.00002395275` at `0.05 gwei`.

## Final state

| Component | On-chain state | Frontend/read model |
|---|---|---|
| CelestialEligibility | registered, governance finalized, active, not paused | ACTIVE |
| CelestialCapitalCommitment | registered, governance finalized, active, not paused | ACTIVE |
| KGENReserveRedemption | registered, governance finalized, inactive, redemption disabled | INACTIVE |

Capital retains its frozen 5,000,000 KAIOS single-commitment threshold and 2,592,000-second minimum lock. No live commitment was made. Current committed liability and Capital KAIOS balance are both zero, and the liability invariant holds.

The indexer reconstructed both proposal/approval/execution lifecycles, `ModuleConfigured`, and `CapitalCommitmentUnpaused`. No required event was missing.

KGEN owner and the Bank, Reward and AutoLP receivers remained unchanged. No KGEN tax redirect, ownership migration, Reserve activation, redemption, live 5M commitment, KAIOS burn, KGEN movement, Seat500 assignment, 511111, KUFO or Pair Registry transaction was executed.

No private key, mnemonic, RPC secret or environment value is present in this evidence.
