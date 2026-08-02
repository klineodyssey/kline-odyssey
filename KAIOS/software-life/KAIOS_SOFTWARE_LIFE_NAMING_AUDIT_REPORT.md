# KAIOS Software Life Naming Audit Report

Generated: `2026-08-02T09:35:00Z`

Source commit: `4f0c6f05c85a3d39adb9ac8d4ce335f207fe42eb`

Mode: `AUDIT_ONLY_NO_RENAME`

## Result

The audit read all 3381 Git-tracked repository files. It found
1190 version-bearing path records and 37
version-bearing JSON identity records. No path, import, public URL, Runtime,
CURRENT, Wallet, KGEN or Constitution source was changed by the audit.

| Classification | Count |
|---|---:|
| `DOCUMENT_VERSION_ALLOWED` | 284 |
| `SCHEMA_METADATA_ALLOWED` | 0 |
| `RELEASE_RECORD_ALLOWED` | 38 |
| `ARCHIVE_NAME_ALLOWED` | 79 |
| `LEGACY_ROUTE_ALLOWED` | 0 |
| `EXECUTABLE_CANONICAL_NAME_VIOLATION` | 22 |
| `MODULE_CANONICAL_NAME_VIOLATION` | 623 |
| `PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION` | 52 |
| `LIFE_IDENTITY_VIOLATION` | 119 |
| `AMBIGUOUS_REVIEW_REQUIRED` | 10 |

Violation items: **816**

Canonical collision groups requiring owner review: **29**

## Decision Rules

- Versioned specifications, reports, release records and immutable archives
  remain valid historical records.
- Protected or deployed KGEN and Wallet artifacts are held; this program does
  not rename or execute them.
- A versioned executable, module identity, public route or Life identity is a
  migration candidate, not permission for a blind rename.
- Public migration creates an unversioned canonical route first. The old route
  remains a generated `LEGACY_ALIAS / NOT_CANONICAL / DEPRECATION_PENDING`.
- One generator or implementation owns both canonical and compatibility
  projections.
- JSON identity changes require lineage aliases and owner review; string
  replacement is forbidden.

## Controlled Batches

1. AI Company executable and API generators.
2. Life Runtime and Ecology modules.
3. Fishpond and Agriculture modules.
4. World Viewer and public applications.
5. Schemas and API routes.
6. Remaining software-life organisms.

Each batch must update imports, links, tests, manifests, hashes, Recovery and
Closeout together. The complete item inventory and references are in
`KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json`; the executable migration contract is
in `KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json`.

## Boundaries

`SIMULATION_ONLY`, `NO_REAL_WALLET`, `NO_REAL_KGEN`,
`NO_ONCHAIN_TRANSFER`, `NO_PRODUCTION_AUTHORITY`,
`NO_CONSTITUTION_SOURCE_MODIFICATION`, and
`NO_PROTECTED_CURRENT_MODIFICATION` remain in force.
