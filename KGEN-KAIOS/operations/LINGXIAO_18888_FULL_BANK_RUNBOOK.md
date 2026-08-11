# Lingxiao 18888 Full Bank Runbook

## Stop conditions

Stop if chain ID is not 56, any formal address lacks expected code/lineage, predicted deployment nonce changed, module limits are unapproved, signer control or BNB is unconfirmed, storage/fuzz/invariant/fork checks fail, or `MAINNET_DEPLOY_APPROVED` has not been issued. Never use the BSC Testnet QA key.

## Pre-deployment

1. Rebuild ABIs and evidence with `npm run test:all`.
2. Run `npm run bank:simulate` and review the sanitized local Genesis report.
3. Run `npm run bank:mainnet-fork-rehearse`. It must fork chainId 56, match the frozen Bank codehashes and regenerate the manifest/evidence without a Mainnet transaction.
4. Verify the predicted new 8888 proxy and formal 11520 address by codehash/lineage checks. The legacy no-code 8888 EOA is never a valid Router target.
5. Obtain explicit Human values for every field listed `HUMAN_CONFIRM_REQUIRED` in the manifest. Fork-only values are never production defaults.
6. Generate the unsigned package with `npm run bank:deployment-plan`. The command deliberately fails unless every public economic parameter, formal address, module state and nonce is supplied.
7. Confirm signer control, current nonce, BNB balance, predicted addresses and every creation/runtime codehash immediately before signature.
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
9. Execute `finalizeModuleGovernance(BankGovernanceProxy)` on all seven module proxies, 18888 `finalizeGovernance(BankGovernanceProxy)`, and 8888 `finalizeGovernance(BankGovernanceProxy, HumanPauser)`. Verify bootstrap accounts lost every Bank/module Admin, Governance and Upgrader role.
10. Verify all bytecode hashes, roles, versions, proxy implementations and address bindings.
11. Only after the real KGEN burn state is confirmed, call KAIOS `settleWhiteHoleMass()` and then Bank `startGenesisEpoch()`.
12. Generate the chain-derived Genesis record and inscription. Never type the mint amount manually.

## Upgrade

Generate unsigned calldata with `npm run bank:upgrade-plan`. Before execution require compile, append-only storage diff, fuzz/invariant, malicious-implementation rejection, fork rehearsal and governance approval. After execution verify `Upgraded`, implementation, version, all roles, module configs, reserve, accounting and representative historical records.

## Emergency

The pause role may stop Bank Core payments. It cannot transfer KAIOS or unpause. Governance diagnoses and executes the reviewed recovery. A failed module may be disabled through delayed governance; its historical payment IDs and events remain. Migration module records successor/state evidence but does not move assets.

The 2026-08-11 pre-sign rehearsal passed Genesis accounting, lawful circulation, the new code-bearing 8888 route/payroll/savings/commerce rails, insufficient-balance retry, delayed UUPS upgrades and rollbacks. Signature remains blocked until every Human-governed parameter is confirmed and the frozen CelestialSeat500 calendar mismatch is resolved by an explicit Human freeze decision. No runbook step authorizes Mainnet by itself.
