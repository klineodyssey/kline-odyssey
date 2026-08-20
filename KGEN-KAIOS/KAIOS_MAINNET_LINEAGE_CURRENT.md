# KAIOS Mainnet Lineage Reconciliation V1

STATUS: REVIEW_CANDIDATE
DATE: 2026-08-20 Asia/Taipei
BASE: current main
PURPOSE: preserve exact deployed-source/evidence lineage from historical stacked PRs without restoring stale branches over current main.

## Historical lineage

1. PR #135 / `codex/templeheart-v34-mainnet` exact evidence head: `2d6d152e0d3c885822745c43d4d96a0836bf4e0e`.
   - Historical pre-deploy statements in the PR body are superseded by its later KAIOS Mainnet LIVE evidence.
   - KAIOS Mainnet Genesis is recorded as LIVE in the final evidence section.
   - This reconciliation does not replay or re-authorize any Mainnet transaction.
2. PR #136 / `codex/kaios-civilization-phase2` exact head: `00c79b380ce094c17d75697f360820c4d2035071`.
   - It inherits #135 exact head and adds Phase 2 source/evidence.
   - Deployed/live evidence and inactive/active module state must be read from its exact evidence; early pre-deploy wording is historical.
3. PR #152 / `codex/kaios-18888-divine-bank-v2-canon` exact head: `672ab4884e8cf6f9d07c176a862fb858cafe8161`.
   - DESIGN-ONLY Canon correction.
   - No Solidity or chain-state change is promoted as deployed by this reconciliation.

## Exact archived blobs from #135

The files under `archive/mainnet-lineage/pr135-genesis/` are Git-blob-preserving aliases of the exact #135 evidence head, not rewritten copies.

- `contracts/KAIOS.sol` blob `86f1111a51ac2ecd6b399f1928765e93cdbdf286`
- `contracts/LingxiaoCelestialBank18888_Upgradeable.sol` blob `20275dfa5ab8c7a83a115248319d29a1b7bb83f0`
- `KAIOS_GENESIS_MAINNET_RECORD.json` blob `f49e4949b1ddff66f73c4181c429af2a442162fb`
- `KAIOS_GENESIS_MAINNET_INSCRIPTION.md` blob `ad6e6e4fbeca07dad6c2da973012640fca0038db`
- `config/LINGXIAO_18888_MAINNET_DEPLOYMENT_MANIFEST.json` blob `09cc3a2e8799aa4fcbfd717d33592b75136e46db`
- `config/mainnet-economic-config.final-review.json` blob `f72e2893329a0b3b936de7d2630f37698b3a4455`

These are provenance artifacts. They do not override similarly named current-main files.

## Exact archived blobs from #136

The files under `archive/mainnet-lineage/pr136-phase2/` preserve the exact Phase 2 lineage head:

- `KAIOS_CIVILIZATION_PHASE2_CANON.md` blob `dc32863610121d74c770dcc1e0f792e26ce148d1`
- `contracts/CelestialEligibility_Upgradeable.sol` blob `50c037ee01c6746013dc5dfc92713f27ad4a4717`
- `contracts/KGENReserveRedemption_Upgradeable.sol` blob `5451f3e54798990edf482355b534820b61d67f90`
- `contracts/CelestialCapitalCommitment_Upgradeable.sol` blob `9857fef7056fde61bc0144f19471fef63182acc1`
- `reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE1_2026-08-14.json` blob `5c2faff5bb9f9f11d39924650113643e37be07f0`
- `reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_STAGE2C1_2026-08-15.json` blob `0a3f9933636059ed6cfd6cf382b4fc33906d7445`

The exact #136 commit remains the authoritative immutable source for every additional Phase 2 file not aliased here. This manifest intentionally records that commit so no evidence is lost or reconstructed from memory.

## Status supersession

The following #135 statements are HISTORICAL_PRE_DEPLOY_SNAPSHOT when encountered before the final LIVE section:

- `MAINNET_TRANSACTION = NOT_AUTHORIZED`
- `READY_FOR_HUMAN_MAINNET_AUTHORIZATION = NO`
- `GOVERNANCE_IDENTITY_BLOCKERS = 2`
- Genesis amounts/addresses marked preview-only
- assertion that no formal deployed-address manifest exists

They are not deleted from history; they are superseded by the final deployment/Genesis evidence at exact head `2d6d152...`.

The same rule applies to #136 pre-deploy wording where later exact evidence records deployed Phase 2 stages. Do not reinterpret historical NOT_AUTHORIZED text as the present deployed-state status.

## Current safety boundary

- `MERGE = NOT_PERFORMED`
- `DEPLOYMENT = NOT_PERFORMED`
- `PAYMENT = NOT_PERFORMED`
- `CHAIN_TRANSACTION = NOT_PERFORMED`
- `CURRENT_MAIN_ACTIVE_SOURCE_OVERWRITE = NO`
- `PR152_DESIGN_CORRECTION_PROMOTED_AS_DEPLOYED = NO`

## Closeout order

1. Review this reconciliation against current main.
2. Verify exact archived blob identities and downstream lineage.
3. Only after this reconciliation is accepted into main may #135 be closed as `SUPERSEDED_DEPLOYED_EVIDENCE_ARCHIVED` rather than merged.
4. #136 should then be reconciled/closed as Phase 2 deployed evidence, not merged wholesale as an old stacked branch.
5. #152 remains Draft design-only until its Canon correction receives separate implementation/review authorization.
