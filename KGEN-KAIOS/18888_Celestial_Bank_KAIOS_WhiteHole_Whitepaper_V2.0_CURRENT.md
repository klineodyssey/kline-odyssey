# 18888 靈霄寶殿銀行 — KAIOS White-Hole Civilization Bank

## V2.0 CURRENT — Modular Civilization Banking Runtime

Status: CURRENT ARCHITECTURE / IMPLEMENTATION BASIS
Human Canon date: 2026-08-10

## Fixed monetary physics

- 1 KGEN = 1 metric ton = 1,000 kg.
- 1 KAIOS = 1 kg.
- 1 permanently destroyed KGEN creates exactly 1,000 KAIOS.
- KGEN Genesis supply is 72,000,000 KGEN.
- First-generation KAIOS maximum is 72,000,000,000 KAIOS.
- 33333 is Gold & Silver Island, the KAIOS token deployment point. It is not an EVM address.
- 36000 is the White Hole that recognizes real KGEN total-supply reduction.
- 18888 is Lingxiao Celestial Bank, the only first-generation KAIOS settlement bank.

`KAIOS.sol` is the monetary core. It reads formal KGEN `totalSupply()`, calculates the unsettled permanent reduction with integer arithmetic, and mints only to the fixed 18888 proxy. There is no owner mint, manual amount, arbitrary recipient, blacklist or seizure path.

## Bank identity and lineage

The lineage is preserved:

1. `GalacticBank_V7_5_2` — historical Genesis Galactic Bank.
2. `LingxiaoDeityBank_V1_0_1` — Generation 1 design for the historical KGEN Bank 0.10% rail.
3. `LingxiaoCelestialBank18888_Upgradeable` — current KAIOS white-hole settlement and civilization bank.

The current bank is one stable ERC1967/UUPS proxy. KAIOS binds the proxy, never an implementation address. Future reviewed implementations may evolve the bank without changing public 18888 identity. The V1 KGEN 0.10% purpose remains future-governance evolution and is not activated in this release.

## Modular system

The Bank Core owns KAIOS custody, settlement binding, Genesis Epoch, accounting, reserve, module registry, pause state, public health and UUPS authorization. It has no arbitrary owner withdrawal.

Reviewed modules are separate UUPS organs:

- `CelestialSeat500_Upgradeable`: at most 500 formal salary seats; fixed beneficiary; permissionless claim trigger.
- `CivilizationAllocation_Upgradeable`: replay-safe, purpose-bound public-infrastructure allocation.
- `EconomicRouter8888_Upgradeable`: fixed route to the formal 8888 commercial/economic bank.
- `ExchangeSettlement11520_Upgradeable`: fixed route to the formal 11520 Universal Civilization Exchange.
- `BankRiskController_Upgradeable`: reserve floor, alert threshold and public assessments.
- `BankGovernance_Upgradeable`: one-hour minimum delay, distinct proposer/approver and public execution evidence.
- `BankMigration_Upgradeable`: successor/chain/state-root evidence only; it cannot move bank assets.

The Bank Core pays only when the caller is an active registered module and the payment is unique, under both per-transaction and daily module limits, and leaves the required reserve intact. The caller never supplies a replacement beneficiary through a public claim path.

## Money must flow lawfully

18888 is not a receive-only vault. KAIOS may flow through reviewed rails to 500 Celestial salaries, Civilization Allocation, formal 8888 capital and formal 11520 exchange settlement. The rule is 防偷、不防花；防亂花、不防合法流動.

The following remain prohibited: unrestricted owner withdrawal, sweep, rescue-to-owner, player `transferFrom`, clawback, freeze, blacklist, loan, dividend, AMM, swap and LP logic inside Bank Core.

## Governance finalization

Deployment uses temporary bootstrap governance solely to bind KAIOS, register reviewed modules and set the Risk Controller. Every module executes `finalizeModuleGovernance()` and Bank Core executes `finalizeGovernance()`: Bank/module Admin, Governance and Upgrader roles transfer to the delayed governance contract and are revoked from bootstrap accounts. After finalization an implementation change is itself a delayed, two-party governance proposal. `UPGRADER_ROLE` never grants payment, module-policy or beneficiary authority. A pause role can stop flows but cannot unpause or spend.

Every module change emits `ModuleConfigured`; every implementation change emits the ERC1967 `Upgraded` event. Module address, version hash, limits, Bank implementation, Bank version and health are public views.

## Civilization boundaries

- 18888: celestial salaries and central civilization capital.
- 8888: general salary, commerce, AI companies, player/AI accounts, deposits and supply-chain economy. Its monthly day-5 payroll belongs to the 8888 runtime.
- 11520: Universal Civilization Exchange and formal price discovery for listed Life/Asset formats. PancakeSwap pairs are optional external DeFi channels, not prerequisites.
- 8895: independent shadow-bank/real-economy role; never a KAIOS minter.

## Genesis chain reaction

```text
KGEN permanent supply destruction
→ 36000 White Hole
→ 33333 KAIOS Token Core
→ settleWhiteHoleMass()
→ 18888 Bank Proxy receives KAIOS
→ Genesis Epoch starts
→ 500 Seats and bank accounting become active
→ 8888 / 11520 / civilization modules become available
```

Every step must retain transaction hash, block, event, address, version and post-state evidence. The Mainnet Genesis amount is derived from chain state after settlement; it is never copied from chat or entered as a floating-point/manual mint amount.

## Release gate

No Mainnet transaction is authorized by this document. Compile, storage diff, unit/integration/fuzz/invariant tests, malicious-upgrade rehearsal, fork rehearsal, role verification, deployment-address verification and Human `MAINNET_DEPLOY_APPROVED` are mandatory before signing.

## Formal 8888 code-bearing Bank wiring

`GaolaozhuangCommercialBank8888_Upgradeable` is the new normal-civilization commercial Bank. Its ERC1967 proxy, not the historical EOA, is the only valid `EconomicRouter8888_Upgradeable` target. The legacy address `0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9` remains `8888_LEGACY_TREASURY_ADDRESS`: preserved lineage and asset identity, no code, no authority over the new proxy and no unrestricted withdrawal rail.

The new 8888 Bank applies Asia/Taipei civilization time deterministically. Each calendar month is a payroll epoch and salary becomes claimable at day 5, 00:00 UTC+8. Unclaimed entries remain liabilities. Claims can pay the fixed beneficiary wallet or credit a beneficiary-owned 8888 account. Deposits and separately funded interest checkpoints never convert customer principal into Bank equity. Registered commerce is replay-safe, purpose-labelled and controller-authorized; its beneficiary is fixed before permissionless execution.

This wiring does not move 8895 lending, OTC exchange or high-risk finance into 8888. It also does not authorize Mainnet deployment. The frozen CelestialSeat500 V1 remains duration-epoch based and cannot express the newly confirmed calendar-month day-5 rule without a separately approved future implementation change; deployment evidence must keep that mismatch visible.
