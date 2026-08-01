# KAIOS Constitution V2 Conflict Matrix

Task: `KAIOS-CONSTITUTION-V2-FULL-AUDIT-001`

This matrix identifies overlap and conflict risk. It does not resolve authority by modifying either source.

## Source-Level Conflict

| Finding | Scope | Result | Required treatment |
| --- | --- | --- | --- |
| Same filename, different SHA | Local and repository V2.1 Chapters 000, 133-138 | `SOURCE_DIVERGENCE` | `DO_NOT_IMPORT` until Human selects metadata lineage. |
| V2.1 title mismatch | Local first heading says V2.0; repository says V2.1 | `METADATA_CONFLICT` | Preserve both hashes; do not silently normalize. |
| Navigation mismatch | Local PREVIOUS/NEXT text differs from repository | `METADATA_CONFLICT` | Reconcile in a migration PR only. |
| Signature footer | Present only in repository V2.1 copies | `METADATA_CONFLICT` | Do not infer which source is preferred. |
| V1 same-name copy | Byte SHA differs; normalized text is equal | `LINE_ENDING_ONLY` | Preserve one normalized comparison record; V1 remains superseded. |

The V2.1 body differences reported by `git diff --no-index` are limited to the heading, navigation metadata, blank lines, and repository signature footer. Byte identity nevertheless fails.

## Canonical and PR Comparison

| Existing authority | Constitution chapters or topics | Conflict type | Decision |
| --- | --- | --- | --- |
| PR #64 Physical Labor and Construction | 027, 038-039, 046, 051, 082, 086, 093, 118, 124, 128 | Labor accounting, workforce, construction causality, transport prerequisites | Merged PR #64 specifications govern. Chapters are `REFERENCE_ONLY`. |
| PR #65 Supply Chain Economy | 016, 020, 038-044, 071-077, 085-093, 116-117, 129-130, 136 | Supply chain, inventory, cash flow, banking, insolvency, court, KGEN anchor | Merged PR #65 specifications govern. Real legal or settlement effects are prohibited. |
| PR #66 Canonical Life V1 | 000, 006, 022-024, 031-032, 034-037, 047, 049, 054, 114, 133-135 | Shared core, taxonomy, physics, economy, rights, lifecycle, replication | PR #66 schema governs. Constitution drafts cannot redefine Canonical Life. |
| PR #67 Worker Registry | 021, 035, 065-070, 094, 098-104, 133-138 | Worker authority, autonomy, review, deployment, governance | Merged registry and branch policy govern. No autonomous dispatch is inferred. |
| PR #68 Cursor Dispatch | 021, 035, 094, 100, 133-138 | Dispatch permissions and work envelopes | Task envelope remains authoritative; Constitution language grants no worker permission. |
| PR #69 Foundational Candidates | 023-024, 047, 049, 080, 084, 107, 114, 121-122, 132, 135 | Grass, tree, fish, shrimp, mountain, soil, water, river definitions | Packages remain candidate/runtime-validated, not promoted by Constitution text. |
| PR #70 Life Runtime V1 | 022-024, 037, 047, 049, 080-086, 105-107, 114, 121-123, 132, 135 | Deterministic lifecycle, water, terrain, ecology, event system | Merged simulation Runtime governs its bounded scope. Production authority remains false. |

## Protected Authority Conflicts

| Domain | Representative chapters | Finding |
| --- | --- | --- |
| Physics CURRENT | 002-004, 022, 024, 034-039, 046-052, 081-086, 104-109, 114-115, 137 | Draft equations, hard-coded constants, interfaces, and reset clauses cannot override Physics CURRENT. |
| Economy | 005, 016, 020, 027, 038-044, 071-077, 086-093, 116-130, 136 | Wallet, bank, KGEN, monetary, and settlement language conflicts with simulation-only boundaries if activated. |
| Rights | 006-014, 030-032, 045, 054-070, 097-104, 133-138 | Legal personhood, sovereignty, ownership, governance, and control claims require separate rights review. |
| Taxonomy | 006, 023-024, 031, 054, 114, 119, 133-135 | Any taxonomy assertions must map to the PR #66 Canonical Life taxonomy and the existing 19-layer extension. |
| API and Runtime | Chapter 000 Charter and most files named Runtime | Embedded TypeScript and reset/deployment instructions are specifications only, never executable authority. |
| Wallet/KGEN | 005, 008, 016, 020, 040-044, 071-076, 117, 130, 136, 138 | No wallet, token, supply, settlement, or on-chain behavior may be imported from these drafts. |

## Duplicate Specification Families

- `Housing/Land`: 045, 052, 077, 108, 120, 131.
- `Food/Agriculture`: 047, 080, 107, 121, 132.
- `Water`: 047, 080, 106, 122.
- `Energy`: 037, 048, 081, 105, 123.
- `Transport`: 039, 046, 082, 109, 124.
- `Education`: 015, 026, 078, 111, 126.
- `Labor`: 018, 027, 118, 128.
- `Economy/Finance`: 016, 020, 038-044, 071-076, 086-092, 116-117, 129-130, 136.

No duplicated family is safe for direct import as a single Canonical source.

## Severity

- P0 security findings: 0.
- P1 source-lineage conflicts: 7 V2.1 files.
- P1 Markdown structural failures: 41 files.
- P2 conceptual duplication: multiple topic families listed above.
- Protected-file modifications: 0.
