# KAIOS Civilization Phase 2 Runbook

Status: unsigned candidate. No Mainnet transaction is authorized by this document.

## Immutable prerequisites

Verify chainId 56 and code at formal KGEN, KAIOS, 18888, 18911 and BankGovernance. Verify the candidate commit, clean tree, compiler evidence, ABI hashes, storage report, tests and fork block. Stop on any mismatch.

Do not modify KGEN, KAIOS Token Core, 18888 Bank Core, 18911, Genesis Inscription, CelestialSeat500 or Legacy Heart. Do not call `setTaxWallets` as part of module deployment.

## Human inputs still required

- deployment signer and live nonce;
- minimum KGEN reserve;
- per-transaction and per-UTC-day KGEN/KAIOS redemption caps;
- special 18911 destination code;
- minimum capital lock period;
- initial module registration/activation decision;
- separate future authorization for the KGEN bank-tax receiver.

Generate an unsigned six-CREATE plan with `npm run phase2:deployment-plan`. The script accepts public values only and never uses a signer key or RPC write.

## Candidate deployment order

1. CelestialEligibility implementation and ERC1967 proxy.
2. KGENReserveRedemption implementation and ERC1967 proxy, initialized disabled.
3. CelestialCapitalCommitment implementation and ERC1967 proxy.
4. Verify code, implementation slots, versions, formal dependencies, roles, PAUSER and zero asset balances.
5. Through formal BankGovernance: Mother proposes each Bank `configureModule`, Jade Emperor approves, wait at least 3,600 seconds, then execute. Register inactive unless the new Human authorization states otherwise.
6. Finalize module governance to formal BankGovernance and verify deployment signer/bootstrap authority is absent.

## Separate future tax-routing change

Only after the Reserve proxy is deployed, funded policy is approved, formal modules are verified and a fresh fork rehearsal passes may Human consider KGEN `setTaxWallets(reserveProxy,currentReward,currentAutoLP)`. Re-read current live receivers immediately before proposing. Expected taxable 100 KGEN flow after that future change: 0.10 KGEN true burn, 0.10 KGEN reserve, 0.05 KGEN Reward, 0.05 KGEN AutoLP; recipient receives 99.70 KGEN. Wallet-to-wallet remains 0%.

## Stop conditions

Stop for unexpected nonce/address/codehash, role mismatch, formal address mismatch, cap/floor mismatch, KGEN or KAIOS supply change during redemption, incorrect 18888 receipt, proof ambiguity, liability deficit, failed governance delay/distinct approval, or any Mainnet transaction not explicitly authorized.

511111, KUFO, Pair Registry, 8895 and new KGEN remain outside this runbook.
