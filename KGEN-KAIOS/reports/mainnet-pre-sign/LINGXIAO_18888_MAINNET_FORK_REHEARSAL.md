# Lingxiao 18888 Mainnet Fork Rehearsal

Forked BSC Mainnet chainId 56 at block 115291417. No Mainnet transaction was sent.

## Results

- postFinalizationUpgradePath: PASS
- genesisAccountingExact: PASS
- realMoneyFlowPaths: PASS
- celestialSalary500: PASS
- routing8888: PASS_WITH_FORK_ONLY_FIXTURE_MAINNET_ADDRESS_UNRESOLVED
- settlement11520: PASS
- arbitraryDrain: BLOCKED
- entitlementRetryAfterRefill: PASS
- storageRollbackRestore: PASS
- frozenBankCreationCodehash: PASS
- frozenBankRuntimeCodehash: PASS
- legacyHeartUntouched: PASS

The 8888 rail passed against an explicitly labeled fork-only contract fixture. No formal code-bearing Mainnet 8888 Bank address is currently established, so this is not a wiring PASS for signature.

KGEN totalSupply preview: 71977906.887000601442227077 KGEN.
Historical burn preview: 22093.112999398557772923 KGEN.
Genesis KAIOS preview: 22093112.999398557772923 KAIOS.

See the JSON evidence for transaction hashes, gas, complete roles, modules, state and blockers.
