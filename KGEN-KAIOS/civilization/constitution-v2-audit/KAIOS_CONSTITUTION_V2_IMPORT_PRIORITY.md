# KAIOS Constitution V2 Import Priority

Task: `KAIOS-CONSTITUTION-V2-FULL-AUDIT-001`

Global status: `HOLD_FOR_HUMAN_SOURCE_DECISION`

## Canonical Decision Counts

| Decision | Count | Meaning |
| --- | ---: | --- |
| `REFERENCE_ONLY` | 134 | Retain for audit and future reconciliation; do not import as authority. |
| `DO_NOT_IMPORT` | 7 | Same-named V2.1 repository copy has a different SHA. |
| `SUPERSEDED` | 3 | V1.0, original Chapter 000, and original Chapter 133. |
| `KEEP` | 0 | No source was approved as active Canonical. |
| `MERGE` | 0 | Audit does not authorize merging. |
| `ARCHIVE` | 0 | Archive placement is proposed, not executed. |

The complete per-file decision and reason are stored in `KAIOS_CONSTITUTION_V2_FILE_MANIFEST.json`.

## Priority Queue

### Priority 0 - Resolve Before Any Import

- V2.1 Chapters 000 and 133-138.
- Choose local or repository metadata lineage.
- Status: `DO_NOT_IMPORT`.

### Priority 1 - Preserve and Repair as Copies

- Chapters 093-132 and `KAIOS_Genesis_Charter_V2.0_Ch0.md`.
- Reason: 41 unbalanced code-fence findings.
- Status: `REFERENCE_ONLY / STRUCTURAL_REPAIR_REQUIRED`.

### Priority 2 - Foundational Reconciliation

- Chapters 001-019.
- Compare physics, time, identity, wallet, land, governance, education, economy, work, and enterprise assertions to active repository authority.
- Status: `REFERENCE_ONLY`.

### Priority 3 - Topic-Bundle Reconciliation

- Chapters 020-092.
- Reconcile rights, infrastructure, economy, public systems, and governance in topic bundles.
- Status: `REFERENCE_ONLY`.

### Priority 4 - Resilience and Government Restatements

- Chapters 093-132 after structural repair.
- Consolidate repeated food, water, energy, housing, transport, communications, labor, and economy families.
- Status: `REFERENCE_ONLY`.

### Priority 5 - Superseded and Rendered Evidence

- `KAIOS_Genesis_Constitution_V1.0.md`: `SUPERSEDED`.
- Original Chapter 000 and original Chapter 133: `SUPERSEDED`.
- Chapter 0 PDF: `REFERENCE_ONLY`.

## Human Decisions Required

1. Select V2.1 source lineage.
2. Approve a migration branch and destination structure.
3. Approve whether any chapter may advance beyond `DRAFT`.
4. Approve each later Canonical or Constitution promotion separately.

No file is import-ready under the present gate.
