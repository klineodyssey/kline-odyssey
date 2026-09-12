# Codex Handoff — 2026-08-09 — KAIOS / KUFO / KSHIP / Physics Lineage Reconciliation

STATUS: HUMAN/CHATGPT HANDOFF — CODEX REVIEW REQUIRED

## First question to Codex

Before starting new integration, read `KAIOS_FrictionMirror_Multiverse_README.md` as the KAIOS monetary and point-identity single source of truth. Then report whether the previously assigned work is complete. In particular inspect PR #127 (`codex/templeheart-v3.3.0-uups`). It is still OPEN + DRAFT and contains obsolete KAIOS assumptions (`KAIOS_PER_KGEN = 10_000` and legacy `IKAIOSBurnProofGenesis`). Do NOT merge it as-is.

Return one of:

- `PREVIOUS_WORK_COMPLETE_AND_REVIEWED`, with exact PR/commit/test evidence; or
- `PREVIOUS_WORK_INCOMPLETE`, with blockers and next repair steps.

## New integration branch

Review branch: `codex/kaios-physics-lineage-20260809`

Goal: reconcile 2026-08-06 through 2026-08-09 KAIOS physics/monetary discussions into the repo without silently overwriting protected CURRENT law.

## Canonical decisions to preserve

- 1 KGEN = 1 metric ton = 1,000 kg.
- 1 KAIOS = 1 kg.
- 1 actually destroyed KGEN → 1,000 KAIOS.
- first-generation KAIOS ceiling = 72,000,000,000.
- KAIOS native transfer/buy/sell tax = 0%.
- KAIOS genesis starts at zero.
- KGEN→KAIOS uses Friction Mirror observation of canonical KGEN `totalSupply()` reduction; no admin-reported burn proof mint.
- first-generation KAIOS settlement recipient = 18888.
- 18911 = KAIOS voluntary alchemy burn.
- 49 Alchemy Epoch belongs to furnace/runtime, not token law.
- 511111 = matured KUFO claim/wormhole.
- 1 KAIOS burn → 1,000 KUFO; 1 KUFO = 1 g.
- KUFO native transfer/buy/sell tax = 0%.
- 1 KUFO burn → 1,000 KSHIP; 1 KSHIP = 1 mg.
- KSHIP native transfer/buy/sell tax = 0%.
- holder authorization required for child-scale burns.
- proof replay forbidden; beneficiary cannot be redirected by claimant/operator.
- no discretionary admin mint, seizure, blacklist, or automatic transaction burn in these token cores.
- market Pair/LP is external; token deploy does not require Pair.
- official pairs belong in external Pair Registry.

## Physics naming to reconcile

Keep separate axes:

1. Mass-accounting axis: KGEN → KAIOS → KUFO → KSHIP.
2. Taxonomy axis: Domain → Kingdom → Phylum → Class → Order → Family → Genus → Species → LifeID.
3. Composition axis: KLIFE → KCELL → KORGAN → KMOLECULE → KATOM → KPARTICLE → KQUANTUM.
4. Wave axis: KWAVE / KPHOTON.
5. KPLANCK = quantum-gravity/spacetime boundary concept, NOT smallest matter particle.

KORGAN is project-specific functional micro-organ/module terminology. Explicitly distinguish it from ordinary biology's `organelle` wording.

## Required code review

1. Compare `KGEN-KAIOS/contracts/KAIOS.sol` against the new branch contracts.
2. Resolve organ wiring. Preferred long-life architecture: immutable monetary laws + controlled `KAIOSOrganRegistry` for replaceable 18911/511111/converter organs. CREATE2 may be used for deterministic addresses but should not be the sole organ-upgrade mechanism.
3. Align interfaces exactly. No stale `IKAIOSBurnProofGenesis` usage after Friction Mirror migration.
4. Compile with Solidity 0.8.24 and the repository's pinned OpenZeppelin release.
5. Add tests for conversion ratios, caps, burn allowance, replay, beneficiary binding, 49-epoch boundary, registry permissions, and conservation invariants.
6. Add fuzz/invariant tests for multi-step KGEN→KAIOS→KUFO→KSHIP accounting.
7. Verify no Pair Registry function claims to stop third-party DEX trading.
8. Do not deploy to mainnet until independent audit.

## PR #127 repair requirement

PR #127 is stale relative to current KAIOS law. It must either be rebased/repaired or superseded. At minimum remove:

- `KAIOS_PER_KGEN = 10_000`,
- dependence on the obsolete `IKAIOSBurnProofGenesis` mint/burn record model,
- any 12345 fortune logic that assumes old KAIOS proof semantics.

12345 should integrate against the actual current KAIOS/Alchemy provenance interface only after that interface is finalized and tested.

## CURRENT document policy

Do not blindly overwrite `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`. Review the new companion document and merge only non-conflicting canon. Where old CURRENT says `1 KGEN = 1 kg`, treat that as stale against the 2026-08-08 SI mass decision and repair it to `1 KGEN = 1 metric ton = 1,000 kg` after full cross-document impact review.

Also search all repository docs/code for stale ratios/names:

- `10,000 KAIOS`
- `KAIOS_PER_KGEN = 10_000`
- `1 KGEN = 1 kg`
- `BurnProofGenesis`
- direct `Species → Cell → Organ` ordering where it conflicts with the new separated taxonomy/composition axes.

Report every hit and classify: CURRENT-CONFLICT / HISTORICAL-ARCHIVE / TEST-FIXTURE / SAFE.

## Merge gate

Only merge after:

- previous work status is reported,
- stale PR #127 is repaired/superseded,
- compilation + tests + fuzz/invariants pass,
- CURRENT conflicts are explicitly reconciled,
- no obsolete 1:10000 semantics remain in active code/docs,
- no accidental mainnet/deployment action occurs.
