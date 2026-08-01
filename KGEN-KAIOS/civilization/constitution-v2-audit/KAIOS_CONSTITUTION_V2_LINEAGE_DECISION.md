# KAIOS Constitution V2 Lineage Decision

Task: `KAIOS-CONSTITUTION-V2-LINEAGE-RESOLUTION-001`

Status: `LINEAGE_REGISTERED / NO_CANONICAL_SELECTION / NO_IMPORT`

## Decision

Two independent read-only lineages are registered:

| Source ID | Classification | Authority | Canonical | Import |
| --- | --- | --- | --- | --- |
| `LOCAL_V2_0` | `SOURCE_ORIGINAL_V2_0` | `READ_ONLY_SOURCE` | `NOT_CANONICAL` | `NOT_IMPORTED` |
| `REPOSITORY_V2_1` | `DERIVED_REPOSITORY_V2_1` | `READ_ONLY_REFERENCE` | `NOT_CANONICAL` | `NOT_IMPORTED` |

`canonical_lineage` is deliberately null. Overwrite is forbidden in both directions.

## Why Two Lineages Exist

The local collection is the primary audit source and contains 144 files under a V2.0 directory. Seven contained filenames and VERSION fields identify V2.1 drafts even though their first heading still says V2.0.

The repository contains seven same-named repaired copies introduced by commit `e3a68db4300a08a909b04f026d0b2e1bd3d985ba` and repaired by `4cf73bfd47880cafc9643333e14f8e5346e6b534`. The repository versions change the first heading to V2.1, revise navigation metadata, and add a signature footer.

## Conflicting Files

- Chapter 000.
- Chapters 133, 134, 135, 136, 137, and 138.

Every pair has a different SHA-256. Chapter 133 also changes its PREVIOUS link from detailed Chapter 000 V2.1 to Chapter 132, creating a navigation-lineage conflict.

## Why Neither Is Canonical

- The latest Human instruction explicitly classifies both lineages as non-Canonical.
- Local documents remain draft source evidence.
- Repository documents are derived repaired references, not active Constitution authority.
- No independent promotion review has reconciled Canonical Life, Physics CURRENT, rights, wallet, KGEN, Runtime, and governance boundaries.
- Runtime tests or prior source repair do not constitute Constitution promotion.

## Why Overwrite Is Forbidden

Overwriting would destroy source provenance, conceal SHA divergence, and make later comparison non-reproducible. Both lineages must remain addressable by source ID and immutable hash.

## Future Promotion Gates

1. Human selects a lineage or approves an explicit reconciled derivative.
2. All 41 Markdown structural defects are repaired in copies and reviewed.
3. Each chapter receives exclusive classification and a normative authority map.
4. Conflicts with CURRENT and PR #64-#70 are resolved without rewriting protected sources.
5. Rights, wallet, KGEN, production, autonomous authority, and legal-effect claims receive separate review.
6. Independent P0/P1/P2 review passes.
7. A dedicated promotion PR receives explicit Human approval.

Until all gates pass, the next workline remains `KAIOS_CONSTITUTION_V2_CHAPTER_PROMOTION_REVIEW / HOLD_NOT_STARTED`.
