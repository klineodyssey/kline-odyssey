---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent Plugin Framework comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR004PluginFramework"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-004_PLUGIN_FRAMEWORK.md"
---

# ADR-004: Plugin Framework Coverage

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Implementation: **NOT_STARTED**

## Context

V11 already defines provider-neutral adapters, capability manifests, API and schema versions, compatibility ranges, sandbox profiles, permission review, integrity, health, fallback and rollback.

## Decision

Keep the existing Plugin Framework. Do not create a second SDK or manifest. After Human approval, add conformance fixtures, integrity/signature policy and compatibility tests.

## Consequences

Provider-specific implementations remain adapters behind a stable KAIOS contract. `ENABLED` never implies unrestricted authority.

## Evidence

- `PLUGIN_FRAMEWORK.md`
- `PLUGIN_API_DRAFT.md`
- `PLUGIN_MANIFEST_STANDARD.md`
