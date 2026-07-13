---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent review-layer bottleneck comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR001ReviewLayer"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-001_REVIEW_LAYER.md"
---

# ADR-001: Distributed Review Layer

- Status: **UNDER_REVIEW**
- Classification: **PARTIAL_ACCEPT**
- Target: **V11.1**
- Implementation: **NOT_STARTED**
- Human Review: **REQUIRED**

## Context

V11 requires Codex/Human review before formal effects and already identifies an over-centralized Codex bottleneck. It does not define reviewer pools, review leases, quorum or reviewer conflict handling.

## Decision

Accept a V11.1 design for domain reviewer pools, exclusive review leases, risk-based quorum, reviewer eligibility, evidence bundles, timeout recovery and disagreement escalation.

Codex remains the only default main merge authority. Human remains mandatory for R3 and protected high-risk decisions. R4 remains blocked.

## Rejected Alternative

Reject fully autonomous distributed approval and any majority vote that bypasses Codex/Human authority.

## Consequences

Low-risk review throughput can scale without weakening protected boundaries. Reviewer health, independence and conflict-of-interest rules become required design inputs.

## Evidence

- `SYSTEM_ARCHITECTURE.md`: Review Service and review-before-effect principles.
- `V11_MASTER_INDEX.md`: over-centralized Codex bottleneck risk.
- `MULTI_AGENT_RUNTIME.md`: one primary owner and review route.
