# Lingxiao 18888 Full Bank Runbook

## Stop conditions

Stop if chain ID is not 56, any formal address lacks expected code/lineage, predicted deployment nonce changed, module limits are unapproved, signer control or BNB is unconfirmed, storage/fuzz/invariant/fork checks fail, or `MAINNET_DEPLOY_APPROVED` has not been issued. Never use the BSC Testnet QA key.

## Pre-deployment

1. Rebuild ABIs and evidence with `npm run test:all`.
2. Run `npm run bank:simulate` and review the sanitized local Genesis report.
3. Run `npm run bank:mainnet-fork-rehearse`. It must fork chainId 56, match the frozen Bank codehashes and regenerate the manifest/evidence without a Mainnet transaction.
4. Verify the predicted new 8888 proxy and formal 11520 address by codehash/lineage checks. The legacy no-code 8888 EOA is never a valid Router target.
5. Verify `mainnet-economic-config.final-review.json`: economic and governance identity blockers must both be zero. Mother is `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9`, Jade Emperor is `0xc15e08834fca9f2d3462a3f8f0bc30524d6dd756`, and Guanyin is `0xebeeac6d09d2d28db8010b0923442c9eb2b702fe`.
6. Generate the unsigned package with `npm run bank:deployment-plan`. The command deliberately fails unless every public economic parameter, formal address, module state and nonce is supplied.
7. Confirm signer control, current nonce, BNB balance, predicted addresses and every creation/runtime codehash immediately before signature. If nonce is not the manifest nonce, discard every prediction and regenerate the package.
8. Repeat the chainId 56 fork rehearsal from the final candidate and preserve its fixed fork block.

## Ordered deployment

1. Formal KAIOS Organ Registry (if not already verified).
2. 18888 Bank implementation and ERC1967 proxy.
3. 8888 Commercial Bank implementation and ERC1967 proxy, initialized with formal KGEN, the 18888 proxy and the lineage-only legacy 8888 EOA.
4. Seven module implementations and ERC1967 proxies; initialize `EconomicRouter8888` directly to the new 8888 proxy.
5. Formal KAIOS Token Core with formal KGEN, Registry and 18888 proxy.
6. Bind KAIOS once in both 18888 and 8888.
7. Register all reviewed modules and limits; set Risk Controller. Six modules are active; BankMigration is registered but inactive.
8. Deploy/register 18911 and remaining verified organs according to the broader KAIOS runbook.
9. Grant Jade Emperor only `APPROVER_ROLE`, revoke Mother's `APPROVER_ROLE`, grant Guanyin only the required Pauser roles, and execute `finalizeModuleGovernance(BankGovernanceProxy)` on all seven module proxies, 18888 `finalizeGovernance(BankGovernanceProxy)`, and 8888 `finalizeGovernance(BankGovernanceProxy, Guanyin)`. Through Mother proposal → Jade Emperor approval → 3600-second delay → execution, revoke the Governance proxy's transient direct 18888 Pauser role. Verify bootstrap and deployment accounts lost every direct Bank/module Admin, Governance, Upgrader and Pauser role.
10. Verify all bytecode hashes, roles, versions, proxy implementations and address bindings.
11. Only after the real KGEN burn state is confirmed, call KAIOS `settleWhiteHoleMass()` and then Bank `startGenesisEpoch()`.
12. Generate the chain-derived Genesis record and inscription. Never type the mint amount manually.

## Upgrade

Generate unsigned calldata with `npm run bank:upgrade-plan`. Mother alone proposes, Jade Emperor alone approves, at least 3600 seconds elapse, then anyone may execute. Before execution require compile, append-only storage diff, fuzz/invariant, malicious-implementation rejection, fork rehearsal and governance approval. After execution verify `Upgraded`, implementation, version, all roles, module configs, reserve, accounting and representative historical records.

## Emergency

Guanyin's pause role may stop Bank Core and 8888 payments. It cannot transfer KAIOS, mint, unpause, upgrade, create allocations or redirect salary/beneficiaries. Governance diagnoses and executes the reviewed recovery. A failed module may be disabled through delayed governance; its historical payment IDs and events remain. Migration module records successor/state evidence but does not move assets.

The 2026-08-12 governance-final fork rehearsal passed Genesis accounting, lawful circulation, the code-bearing 8888 route/payroll/savings/commerce rails, Celestial Gregorian `YYYYMM` maturity at day 5 00:00 UTC+8, insufficient-balance retry, Mother/Jade Emperor delayed UUPS upgrades and rollbacks, and Guanyin pause-only security checks. Economic and governance identity blockers are zero. `MAINNET_DEPLOY_APPROVED` remains the sole authorization gate; no runbook step authorizes Mainnet by itself.
