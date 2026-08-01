# KAIOS Constitution V2 Classification

Task: `KAIOS-CONSTITUTION-V2-FULL-AUDIT-001`

Classification is exclusive. Every source artifact has exactly one category in `KAIOS_CONSTITUTION_V2_FILE_MANIFEST.json`.

## Classification Counts

| Category | Count | Scope |
| --- | ---: | --- |
| `DRAFT` | 142 | All numbered Markdown sources except the V1.0 file. This includes every V2.0 and V2.1 chapter source. |
| `REFERENCE` | 1 | `KAIOS_Genesis_Charter_V2.0_Ch0.pdf`. |
| `SUPERSEDED` | 1 | `KAIOS_Genesis_Constitution_V1.0.md`. |
| `CONSTITUTION` | 0 | No local source has completed Canonical promotion. |
| `WHITEPAPER` | 0 | No document is explicitly governed as a cumulative whitepaper. |
| `CANONICAL_SPECIFICATION` | 0 | Merged GitHub specifications remain authoritative; local drafts do not inherit that class. |
| `RUNTIME_SPECIFICATION` | 0 | Files describe runtimes, but their declared status is Draft and they are not active Runtime authority. |
| `ARCHIVE` | 0 | Archive is a migration destination decision, not the current source classification. |
| `UNKNOWN` | 0 | Every artifact could be classified. |

## Exhaustive Chapter Assignment

- Chapter 000 original, V2.1, Charter Markdown: `DRAFT`.
- Chapter 000 PDF: `REFERENCE`.
- Chapters 001-132: `DRAFT`.
- Chapter 133 original and V2.1: `DRAFT`.
- Chapters 134-138 V2.1: `DRAFT`.
- Unnumbered `KAIOS_Genesis_Constitution_V1.0.md`: `SUPERSEDED`.

The word `Runtime` in a filename is descriptive and does not grant Runtime authority. The word `Constitution` in a title does not make a draft Canonical.

## Classification Rule

`CURRENT`, merged Canonical schemas, and merged specifications remain authoritative. A local chapter may become `CONSTITUTION`, `CANONICAL_SPECIFICATION`, or `RUNTIME_SPECIFICATION` only through a separate Human-approved migration and promotion review.
