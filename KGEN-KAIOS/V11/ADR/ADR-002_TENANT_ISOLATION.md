---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent tenant-isolation comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR002TenantIsolation"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-002_TENANT_ISOLATION.md"
---

# ADR-002: Tenant Isolation

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Target: **V11.1 CONFORMANCE**
- Implementation: **NOT_STARTED**

## Context

V11 records are tenant- and civilization-scoped. Cross-tenant access is denied by default, foreign keys include tenant scope, and plugins receive scoped grants with quotas.

## Decision

Retain the existing model. V11.1 should add a conformance matrix for row-level isolation, RBAC, quota enforcement, data-region policy, cross-tenant negative tests and incident evidence.

## Consequences

No parallel Tenant subsystem is created. Any implementation must prove isolation rather than merely carry a `tenant_id` field.

## Evidence

- `SYSTEM_ARCHITECTURE.md`: tenant-scoped records and foreign keys.
- `PLUGIN_API_DRAFT.md`: authenticated tenant context and role checks.
- `PLUGIN_MANIFEST_STANDARD.md`: scoped grants and data-region metadata.
