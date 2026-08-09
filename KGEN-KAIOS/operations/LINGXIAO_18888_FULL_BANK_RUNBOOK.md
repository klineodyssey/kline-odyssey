# Lingxiao 18888 Full Bank Runbook

## Stop conditions

Stop if chain ID is not 56, any formal address lacks expected code/lineage, predicted deployment nonce changed, module limits are unapproved, signer control or BNB is unconfirmed, storage/fuzz/invariant/fork checks fail, or `MAINNET_DEPLOY_APPROVED` has not been issued. Never use the BSC Testnet QA key.

## Pre-deployment

1. Rebuild ABIs and evidence with `npm run test:all`.
2. Run `npm run bank:simulate` and review the sanitized local Genesis report.
3. Verify formal Registry, 8888 and 11520 addresses by read-only Mainnet calls.
4. Generate unsigned predicted-address package with `npm run bank:deployment-plan` using only public address/nonce environment variables.
5. Confirm deployment signer nonce, BNB estimate and Human-approved module per-transaction/daily limits.
6. Perform a chain-56 fork rehearsal of the exact ordered calldata.

## Ordered deployment

1. Formal KAIOS Organ Registry (if not already verified).
2. 18888 Bank implementation and ERC1967 proxy.
3. Seven module implementations and ERC1967 proxies.
4. Formal KAIOS Token Core with formal KGEN, Registry and 18888 proxy.
5. Bank `bindKAIOS(KAIOS)`.
6. Register all reviewed modules and limits; set Risk Controller.
7. Deploy/register 18911 and remaining verified organs according to the broader KAIOS runbook.
8. Execute `finalizeModuleGovernance(BankGovernanceProxy)` on all seven module proxies, then Bank `finalizeGovernance(BankGovernanceProxy)`. Verify bootstrap governance lost every module Admin/Governance role and Bank Admin/Module Admin.
9. Verify all bytecode hashes, roles, versions, proxy implementations and address bindings.
10. Only after the real KGEN burn state is confirmed, call KAIOS `settleWhiteHoleMass()` and then Bank `startGenesisEpoch()`.
11. Generate the chain-derived Genesis record and inscription. Never type the mint amount manually.

## Upgrade

Generate unsigned calldata with `npm run bank:upgrade-plan`. Before execution require compile, append-only storage diff, fuzz/invariant, malicious-implementation rejection, fork rehearsal and governance approval. After execution verify `Upgraded`, implementation, version, all roles, module configs, reserve, accounting and representative historical records.

## Emergency

The pause role may stop Bank Core payments. It cannot transfer KAIOS or unpause. Governance diagnoses and executes the reviewed recovery. A failed module may be disabled through delayed governance; its historical payment IDs and events remain. Migration module records successor/state evidence but does not move assets.

No runbook step authorizes Mainnet by itself.
