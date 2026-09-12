# Lingxiao 18888 Mainnet Fork Rehearsal

Forked BSC Mainnet chainId 56 at block 115460801. No Mainnet transaction was sent.

## Results

- postFinalizationUpgradePath: PASS
- genesisAccountingExact: PASS
- realMoneyFlowPaths: PASS
- celestialSalary500: PASS
- celestialMonthlyDay5Utc8: PASS
- noThirtyDayApproximation: PASS
- routing8888: PASS
- monthlyPayroll8888: PASS
- savingsAccount8888: PASS
- settlement11520: PASS
- arbitraryDrain: BLOCKED
- entitlementRetryAfterRefill: PASS
- storageRollbackRestore: PASS
- storage8888RollbackRestore: PASS
- frozenBankCreationCodehash: PASS
- frozenBankRuntimeCodehash: PASS
- legacyHeartUntouched: PASS
- motherPrimaryGovernance: PASS
- jadeEmperorDistinctApprover: PASS
- guanyinFinalPauser: PASS
- pauserWithdraw: BLOCKED
- pauserMint: BLOCKED
- pauserUpgrade: BLOCKED
- deployerPermanentGovernance: NONE

Mother `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` proposed; Jade Emperor `0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756` approved; execution waited at least 3600 seconds.
Guanyin `0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE` passed pause-only validation; withdraw, mint and upgrade attempts reverted.
All three governance identities are EOA/EOA/EOA classifications respectively; EOA no-code status is valid and was not treated as absence.

The 8888 rail passed through the new code-bearing Gaolaozhuang Commercial Bank proxy, including UTC+8 monthly day-5 payroll, savings credit, commercial payment and delayed UUPS rollback.
CelestialSeat500 enforces Gregorian YYYYMM salary maturity exactly at day 5 00:00 UTC+8; no 30-day approximation or monthly admin advancement exists.

KGEN totalSupply preview: 71977798.091069583125268765 KGEN.
Historical burn preview: 22201.908930416874731235 KGEN.
Genesis KAIOS preview: 22201908.930416874731235 KAIOS.
Deployment signer nonce: 34.
Deployment signer balance: 0.00556736894145793 BNB.
Buffered deployment/rehearsal estimate: 37401808 gas at 50000000 wei = 0.0018700904 BNB.

See the JSON evidence for transaction hashes, gas, complete roles, modules, state and blockers.
