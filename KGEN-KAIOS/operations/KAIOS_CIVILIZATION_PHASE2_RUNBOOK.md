# KAIOS Civilization Phase 2 Runbook

Status: Mainnet Stage 1 complete; all three modules are LIVE_INACTIVE. Stage 2 activation and KGEN tax redirect are not authorized by this document.

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
