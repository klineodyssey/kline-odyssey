# KAIOS Civilization Phase 2 Runbook

Status: Mainnet Stage 2B complete. Eligibility and Capital are LIVE_ACTIVE; Reserve is LIVE_INACTIVE with redemption disabled. KGEN tax redirect and all Stage 2C actions remain unauthorized by this document.

## Mainnet Stage-1 result

Nonce 56 successfully deployed the reviewed `CelestialEligibility_Upgradeable` implementation at `0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779` in transaction `0x039c28a90b5a87be6826c8f9323f9489eee67474b1de9fdd8c2377bc4464b93b`. It was reused; the remaining five contracts were deployed at nonces 57-61 and the deployment signer finished at nonce 62.

The formal proxies are:

- CelestialEligibility: `0xA50743fd0fe022714831482355A27559027368F9`;
- KGENReserveRedemption: `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE`;
- CelestialCapitalCommitment: `0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c`.

Mother proposed and Jade Emperor approved all three inactive registrations and the contribution-verifier configuration. The 3,600-second delay matured before execution. Formal BankGovernance now holds module admin, governance, and upgrader roles; Mother and the deployment signer retain none of those permanent module roles. Guanyin retains pauser. No module was enabled or used.

OpenZeppelin UUPS implementations contain the address-valued `__self` immutable. Never compare raw `keccak256(artifact.deployedBytecode)` directly to `keccak256(eth_getCode)`. Use `tools/uups-runtime-verifier.mjs`: patch the compiler `immutableReferences` with the actual implementation address and compare exact runtime, then independently normalize those ranges in artifact and chain runtime and compare again. Both comparisons must pass.

Generate the unsigned five-CREATE resume plan with public inputs only:

```powershell
$env:PHASE2_DEPLOYMENT_SIGNER_ADDRESS='0xb3C54ca96De0dED4Ca0151F629ff9781506ba261'
$env:PHASE2_DEPLOYMENT_SIGNER_NONCE='57'
$env:PHASE2_EXISTING_ELIGIBILITY_IMPLEMENTATION_ADDRESS='0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779'
npm.cmd run phase2:deployment-plan
```

Before any separately authorized resume, run `npm.cmd run phase2:uups-runtime-verify`. The read-only verifier checks creation lineage, patched and normalized runtime, version, UUPS UUID, initializer lock, blank implementation roles, nonce, remaining address vacancy, gas, and balances.

## Immutable prerequisites

Verify chainId 56 and code at formal KGEN, KAIOS, 18888, 18911 and BankGovernance. Verify the candidate commit, clean tree, compiler evidence, ABI hashes, storage report, tests and fork block. Stop on any mismatch.

Do not modify KGEN, KAIOS Token Core, 18888 Bank Core, 18911, Genesis Inscription, CelestialSeat500 or Legacy Heart. Do not call `setTaxWallets` as part of module deployment.

## Frozen V1 configuration

- minimum KGEN reserve: 100 KGEN (`100000000000000000000` wei);
- transaction caps: 10 KGEN (`10000000000000000000`) and 10,000 KAIOS (`10000000000000000000000`);
- UTC-day caps: 100 KGEN (`100000000000000000000`) and 100,000 KAIOS (`100000000000000000000000`);
- redemption initially enabled: false;
- destination source: `KAIOS.CIVILIZATION.RESERVE_REDEMPTION.18888`;
- destination bytes32: `0x55395831e30b8252c7921d7cd972d13c19b60c88750e075f89c94de80e0e0d24`;
- capital minimum lock: 2,592,000 seconds;
- contribution verifier: Mother, `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`;
- all three modules: inactive at registration, paused before read-only live validation.

Only the deployment signer public address and live nonce remain pre-sign inputs. Generate an unsigned six-CREATE plan with `npm run phase2:deployment-plan`. The planner reads `config/phase2-mainnet-config.final-review.json`, accepts no economic override, uses no signer key and sends no transaction.

## Completed Stage-1 order

1. CelestialEligibility implementation and ERC1967 proxy.
2. KGENReserveRedemption implementation and ERC1967 proxy, initialized disabled.
3. CelestialCapitalCommitment implementation and ERC1967 proxy.
4. Verify code, implementation slots, versions, formal dependencies, roles, disabled redemption and zero asset balances.
5. Through formal BankGovernance: Mother proposes each Bank `configureModule`, Jade Emperor approves, waits at least 3,600 seconds, then executes. Register all three inactive.
6. Finalize module governance to formal BankGovernance and verify deployment signer/bootstrap authority is absent.
7. Configure Mother as contribution verifier through the same delayed governance path. This role provides no withdrawal, sweep, upgrade bypass or seat authority.
8. Stop after read-only validation. Enabling, pausing/unpausing, KGEN tax redirect, redemption, capital commitment, or eligibility writes require separate Human authorization.

Public receipts and exact final state are recorded in `reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE1_2026-08-14.json` and its Markdown companion.

## Separate future tax-routing change

Only after the Reserve proxy is deployed, funded policy is approved, formal modules are verified and a fresh fork rehearsal passes may Human consider KGEN `setTaxWallets(reserveProxy,currentReward,currentAutoLP)`. Re-read current live receivers immediately before proposing. Expected taxable 100 KGEN flow after that future change: 0.10 KGEN true burn, 0.10 KGEN reserve, 0.05 KGEN Reward, 0.05 KGEN AutoLP; recipient receives 99.70 KGEN. Wallet-to-wallet remains 0%.

## Stop conditions

Stop for unexpected nonce/address/codehash, role mismatch, formal address mismatch, config hash or encoded-value mismatch, non-inactive initial registration, an unpaused write surface before validation, KGEN or KAIOS supply change during redemption, incorrect 18888 receipt, proof ambiguity, liability deficit, failed governance delay/distinct approval, indexer-to-ABI mismatch, or any Mainnet transaction not explicitly authorized.

511111, KUFO, Pair Registry, 8895 and new KGEN remain outside this runbook.

## Stage-2 frontend/indexer safety gate

Stage 2 remains unauthorised on Mainnet. The frontend adapter fails closed on chain, formal-address, code, ABI, version, registration, governance-finalization, pause, Human-activation or unknown-state mismatch. Frontend gating is UX protection only; the contracts remain authoritative.

Canonical UI states are `BUILDING`, `INACTIVE`, `PAUSED`, `ACTIVE`, `RESERVE_ACCUMULATING`, `REDEMPTION_DISABLED`, `REDEMPTION_READY` and `ERROR_MISMATCH`. Registry `active=false` is not a direct-call runtime gate for Eligibility or Capital. Therefore Guanyin must pause Capital before any Stage-2A Life binding. Stage 2B activates the registry entry and then uses delayed governance to unpause Capital.

The reserve UI must say **18888 Reserve Redemption Reference** and **1000 KAIOS -> up to 1 existing KGEN**. It must also state that the path is subject to existing reserve, the 100 KGEN floor, caps, Life eligibility, pause and availability; KAIOS is not burned; KGEN is not minted; and market price is independent. At exactly 100 KGEN the excess and redeemable capacity are both zero. The operational activation margin remains `HUMAN_DECISION_REQUIRED`.

The eligibility view uses the exact statuses `NONE`, `MASS_THRESHOLD_PASSED`, `CIVILIZATION_REVIEW`, `ELIGIBLE_FOR_REVIEW`, `APPROVED`, `REJECTED`, and `REVOKED`. It calls the 5,000,000 KAIOS condition **Mass Threshold Qualification**, never an automatic deity purchase. The capital view shows the stored beneficiary, 5,000,000 KAIOS principal, timestamps, 2,592,000-second lock, remaining time and status. V1 does not burn or forfeit principal and does not redirect the matured release.

The reorg-aware index covers the original module ABI events plus formal 18888 `ModuleConfigured`, BankGovernance `GovernanceProposalCreated`, `GovernanceProposalApproved`, `GovernanceProposalExecuted`, `GovernanceProposalCancelled`, and KGEN `SetTaxWallets`, `OwnershipTransferred`, and `Transfer`. A KGEN `Transfer` into ReserveRedemption is recorded as `UNCLASSIFIED_KGEN_INFLOW` unless separate deterministic evidence establishes attribution; it must not be mislabeled as tax merely because of its recipient.

### Frozen staged activation package

Every governance action below is a separate BankGovernance proposal: Mother proposes, Jade Emperor approves, at least 3,600 seconds elapse, then any account may execute the exact calldata. Re-read live state before proposing.

| Stage | Target/action | Calldata hash | Fork gas |
|---|---|---|---:|
| Precondition | Capital `pause()` by Guanyin | `0x7c85f13cbc00e94f65b56843fd4599d9ebf4603adcd733a14a54c28d66dd332e` | 34,863 |
| 2A | 18888 `configureModule(Eligibility,...,true)` | `0x7ca0c089f2cd7b14d96e939a054e5cda3a4e3be57699381cc56b12cb6f2d21b1` | 111,404 propose + 57,667 approve + 81,744 execute |
| 2B | 18888 `configureModule(Capital,...,true)` | `0x49972fba9a4f1dbbb0009823ae6b9904f19dc4077d466ae601a04da4b4bf42e7` | 111,404 + 57,667 + 81,744 |
| 2B | Capital `unpause()` | `0x2e0b3eaf0cdee5e3edb3587a639f993dc24c3ed89ce7321ef60ccd2d17df98b1` | 109,508 + 57,667 + 61,101 |
| 2C-0 | KGEN `transferOwnership(BankGovernance)` by current owner | `0xf8b9bcd780c92e7e21231aceca59ec452973c953782fb0690eb6d7f12ac62857` | 28,656 |
| 2C-1 | KGEN `setTaxWallets(Reserve,currentReward,currentAutoLP)` through BankGovernance | `0x52a85f0854d7e57ab42821880c4e76731be9ad569cc3f83fd92c84f08de94320` | 110,666 + 57,667 + 71,410 |
| 2C-2 | 18888 `configureModule(Reserve,...,true)` | `0x746c99290ea159b70d9824230898246227c53ae4eedad07325e94192d6b40eb5` | 111,404 + 57,667 + 81,744 |
| 2C-2 | Reserve `setRedemptionEnabled(true)` | `0xd2c5493d70c2f5fab5a6a49a95ad5cbe7ba837f8eb150be8e613b20e06890f5b` | 109,666 + 57,667 + 78,699 |

Formal order: Capital pre-pause; Eligibility activation and live validation; Capital activation/unpause and live validation; KGEN ownership migration to BankGovernance; delayed tax redirect while redemption stays disabled; natural reserve accumulation; Human confirmation of an operational margin above 100 KGEN; then Reserve activation and `setRedemptionEnabled(true)`. Never call `renounceOwnership`.
