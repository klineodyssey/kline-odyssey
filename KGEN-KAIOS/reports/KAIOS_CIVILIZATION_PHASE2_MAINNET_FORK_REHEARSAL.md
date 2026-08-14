# KAIOS Civilization Phase 2 Mainnet Fork Rehearsal

Status: PASS. Environment: BSC Mainnet fork only. No Mainnet transaction was sent.

- Fork block: 115926157
- Frozen V1 parameters: 100 KGEN reserve floor; 10 KGEN / 10,000 KAIOS per transaction; 100 KGEN / 100,000 KAIOS per UTC day; redemption initially disabled; capital lock 2,592,000 seconds.
- Destination source: KAIOS.CIVILIZATION.RESERVE_REDEMPTION.18888; bytes32: 0x55395831e30b8252c7921d7cd972d13c19b60c88750e075f89c94de80e0e0d24.
- Staged replay: Guanyin pre-paused Capital; Eligibility activated first; Capital activated and unpaused second; KGEN ownership migrated to delayed BankGovernance on the fork; tax redirect accumulated reserve while redemption stayed disabled; Reserve activation and redemption enable occurred only after the balance exceeded the hard floor.
- Future 110,000 KGEN taxable trade: 110 KGEN true burn, 110 KGEN reserve, 55 KGEN Reward, 55 KGEN AutoLP, 109670 KGEN recipient.
- Reserve redemption: 999 / 1,000 / 1,001 KAIOS produced maximum payouts of 0.999 / 1 / 1.001 existing KGEN; neither supply changed; the 100 KGEN floor remained.
- Alchemy eligibility: one formal 18911 proof burned exactly 5,000,000 KAIOS and passed only the mass threshold/review ledger; no seat was assigned.
- Capital commitment: 5,000,000 KAIOS remained in module custody as principal liability; no burn and no seat assignment.
- Frontend/read model replay covered INACTIVE, PAUSED, ACTIVE, RESERVE_ACCUMULATING and REDEMPTION_READY states. Indexed receipts reconstructed ModuleConfigured, governance lifecycle, KGEN receiver change and Phase 2 runtime events. KGEN transfers into Reserve are deliberately classified UNCLASSIFIED_KGEN_INFLOW.

Machine-readable receipts, indexed state and temporary fork addresses are in `reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_FORK_REHEARSAL.json`.
