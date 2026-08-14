# KAIOS Civilization Phase 2 Runbook

Status: unsigned candidate. No Mainnet transaction is authorized by this document.

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

## Candidate deployment order

1. CelestialEligibility implementation and ERC1967 proxy.
2. KGENReserveRedemption implementation and ERC1967 proxy, initialized disabled.
3. CelestialCapitalCommitment implementation and ERC1967 proxy.
4. Guanyin pauses all three modules. Verify code, implementation slots, versions, formal dependencies, roles, disabled redemption, paused state and zero asset balances.
5. Through formal BankGovernance: Mother proposes each Bank `configureModule`, Jade Emperor approves, wait at least 3,600 seconds, then execute. Register all three inactive.
6. Finalize module governance to formal BankGovernance and verify deployment signer/bootstrap authority is absent.
7. Configure Mother as contribution verifier through the same delayed governance path. This role provides no withdrawal, sweep, upgrade bypass or seat authority.
8. Stop after read-only validation. Enabling or unpausing any module requires separate Human authorization.

## Separate future tax-routing change

Only after the Reserve proxy is deployed, funded policy is approved, formal modules are verified and a fresh fork rehearsal passes may Human consider KGEN `setTaxWallets(reserveProxy,currentReward,currentAutoLP)`. Re-read current live receivers immediately before proposing. Expected taxable 100 KGEN flow after that future change: 0.10 KGEN true burn, 0.10 KGEN reserve, 0.05 KGEN Reward, 0.05 KGEN AutoLP; recipient receives 99.70 KGEN. Wallet-to-wallet remains 0%.

## Stop conditions

Stop for unexpected nonce/address/codehash, role mismatch, formal address mismatch, config hash or encoded-value mismatch, non-inactive initial registration, an unpaused write surface before validation, KGEN or KAIOS supply change during redemption, incorrect 18888 receipt, proof ambiguity, liability deficit, failed governance delay/distinct approval, indexer-to-ABI mismatch, or any Mainnet transaction not explicitly authorized.

511111, KUFO, Pair Registry, 8895 and new KGEN remain outside this runbook.
