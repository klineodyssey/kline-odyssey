# KGEN Provenance Registry

This directory stores machine-readable authorship, file ownership, contribution, and evolution-event evidence for KAIOS.

## Files

| File | Purpose |
|---|---|
| `AUTHOR_REGISTRY.json` | Human and AI author identities allowed in provenance records |
| `FILE_OWNERSHIP_REGISTRY.json` | Formal file owners, reviewers, and protected status |
| `AGENT_CONTRIBUTION_LOG.json` | AI contribution evidence log |
| `HUMAN_CONTRIBUTION_LOG.json` | Human contribution evidence log |
| `CHANGE_PROVENANCE_SCHEMA.json` | Schema for formal change provenance entries |
| `WORKORDER_PROVENANCE_SCHEMA.json` | Schema for task source fields required on WorkOrders |
| `CURSOR_REPORT_RND_SCHEMA.json` | Schema for Cursor R&D suggestion report blocks |
| `FILE_HEADER_METADATA_SCHEMA.json` | Schema for required formal file metadata |
| `ORGANISM_MANIFEST_SCHEMA.json` | Canonical versioned organism schema; legacy 1.0 plus Species, Runtime, behavior, release, ownership, and authority bindings in 2.0 |
| `EVOLUTION_EVENT_SCHEMA.json` | Schema for governed evolution events |

## Rule

No WorkOrder, report, or formal organ update is complete unless its source, author, reviewer, branch, commit visibility, report path, and changed files can be traced.
