# KGEN Changelog Standard

## Metadata

| Field | Value |
|---|---|
| VERSION | 1.0 |
| REVISION | 2026-07-11.1 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-07-11 |
| UPDATED_BY | Codex |
| REVIEWED_BY | Codex |
| SOURCE_COMMIT | e0acc39c6c1b5d5dead5b619ad48c85a85743262 |
| TASK_ID | KGEN-GOV-BIO-2026-0001 |
| CHANGE_REASON | Standardize changelog evidence for formal KGEN organs. |
| ANCESTOR | KGEN-KAIOS/VERSIONING_STANDARD.md |
| SOURCE_OF_TRUTH | TRUE |

## Required Entry Fields

Every changelog entry for a formal organ must record:

| Field | Meaning |
|---|---|
| Date | Date of change |
| Version / Revision | Version or revision after the change |
| Task ID | WorkOrder or human-request task ID |
| Actor | Human or AI author |
| Reviewer | Codex, Human, or approved reviewer |
| Files | Changed formal files |
| Reason | Why the change happened |
| Compatibility | Whether migration is required |
| Rollback | How to restore prior state |

## Minimal Format

```markdown
| Date | Version | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-07-11 | 1.0 | KGEN-GOV-BIO-2026-0001 | Codex | Codex | KGEN-KAIOS/... | Baseline | Compatible | Revert commit |
```

## Governance Rule

If a file is promoted to `SOURCE_OF_TRUTH`, the changelog must state what older file becomes `ANCESTOR`, `REFERENCE_ALIAS`, or `ARCHIVE`.
