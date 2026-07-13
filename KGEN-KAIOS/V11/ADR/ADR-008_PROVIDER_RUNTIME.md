---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent Provider Runtime comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR008ProviderRuntime"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-008_PROVIDER_RUNTIME.md"
---

# ADR-008: Provider Runtime

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Target: **V11.1 ROUTING POLICY**
- Implementation: **NOT_STARTED**

## Context

V11 already defines provider-neutral adapters, capability discovery, health checks, fallback, normalized errors and routing based on capability, health, latency and cost metadata.

## Decision

Keep the existing Provider Runtime. V11.1 should formalize deterministic route scoring, budget ceilings, health windows, fallback chains, provider terms flags and route evidence.

## Consequences

Provider names remain adapter targets, not trust signals or partnership claims. A fallback cannot silently change mission acceptance criteria or permission scope.

## Evidence

- `PLUGIN_FRAMEWORK.md`
- `PLUGIN_API_DRAFT.md`
- `PLUGIN_MANIFEST_STANDARD.md`
