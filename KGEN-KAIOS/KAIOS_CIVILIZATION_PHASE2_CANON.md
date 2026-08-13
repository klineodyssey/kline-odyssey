# KAIOS Civilization Phase 2 Canon

Status: implementation candidate; no Mainnet transaction authorized.

## Live systems preserved

Phase 2 does not modify or replace the formal KGEN, KAIOS Token Core, 18888 Bank Core, 18911 Furnace, Genesis Inscription, CelestialSeat500 or Legacy Heart. Formal KGEN remains `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`. Formal KAIOS remains `0xD4E67B3a69e41524c424150E6b6e921b01D036db`.

The existing KGEN AMM tax remains 0.30%: 0.10% true burn, 0.10% bank receiver, 0.05% Reward and 0.05% AutoLP. Wallet-to-wallet transfers remain untaxed. Phase 2 does not call `setTaxWallets`; a future, separately authorized transaction may redirect only the existing 0.10% bank receiver to the deployed Reserve Redemption proxy.

## Six mechanisms that must remain separate

1. White Hole physics: permanent KGEN total-supply reduction is recognized by KAIOS at 1 KGEN to 1,000 KAIOS. This is irreversible monetary physics, not a market quote.
2. Reserve redemption: 1,000 KAIOS deposited into the formal 18888 accounting path permits at most 1 existing reserve KGEN to be paid. No KGEN is minted and no KAIOS is burned.
3. Market price: 8888, 11520, future 8895 or external markets may discover prices independently. The reserve reference is not a guaranteed exchange rate.
4. Alchemy: the formal 18911 Furnace performs holder-authorized KAIOS burn and creates a unique proof for future 511111/KUFO lineage.
5. Capital commitment: KAIOS is locked as an accounted liability in the Capital Commitment module. It is not burned and is not spendable Bank equity.
6. Celestial eligibility: mass, capital, Life identity, constitution history, contribution and formal review are evidence. Money alone never assigns a Celestial seat.

## KGEN Reserve Redemption

`KGENReserveRedemption_Upgradeable` is a UUPS 18888 module and future KGEN bank-tax reserve custodian. Its reference calculation is proportional at 18 decimals: `kaiosIn / 1000`, so 999 KAIOS permits at most 0.999 KGEN, 1,000 permits 1 KGEN, and 1,001 permits 1.001 KGEN. The result is always bounded by existing KGEN, the reserve floor, per-transaction caps and UTC-day caps.

A request fixes `lifeId`, payer, canonical beneficiary, KAIOS input, maximum/actual KGEN output, timestamps and final status. KAIOS must arrive exactly in the formal 18888 Bank and is accounted through `synchronizeAccounting()`. Existing KGEN leaves only to the canonical Life beneficiary. There is no reserve mint, owner sweep or arbitrary beneficiary field.

Redemption is initially disabled in the deployment template. Activation, risk limits and the later KGEN tax receiver change require separate Human/governance authorization.

## Single-burn mass eligibility

`CelestialEligibility_Upgradeable` reads the existing formal 18911 proof. One proof must burn at least 5,000,000 KAIOS, bind the exact Life ID and canonical beneficiary, use the governed special destination code, and have internally consistent burn/maturity/KUFO-scale fields. Multiple smaller proofs cannot aggregate.

The threshold creates only `MASS_THRESHOLD_PASSED`. Constitution history and an active, extensible contribution record are independently required before review can advance. The contract is species-neutral and does not call CelestialSeat500.

## Non-burn capital commitment

`CelestialCapitalCommitment_Upgradeable` accepts a single commitment of at least 5,000,000 KAIOS from the canonical Life beneficiary. Principal stays in module custody and is included in `totalCommittedPrincipal`; the Bank cannot spend it. V1 has no forfeiture. After the checkpointed lock expires, release can be triggered by anyone but transfers only to the fixed beneficiary.

Capital plus civilization evidence creates only eligibility for Wormhole-seat review. It does not create, transfer or assign a seat.

## Governance and future scope

Module governance uses Mother proposal, distinct Jade Emperor approval, a 3,600-second delay and execution through formal BankGovernance. Guanyin has emergency pause only. The deployment signer receives no permanent governance role. UUPS upgrade authority is separated from asset movement; the V1 implementations expose no sweep or arbitrary withdrawal.

511111, KUFO, Pair Registry, 8895, AMM pair and any new KGEN Token remain future work. Formal 18911 remains unchanged.
