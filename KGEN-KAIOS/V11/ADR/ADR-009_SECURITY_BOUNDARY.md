---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent security-boundary comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR009SecurityBoundary"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-009_SECURITY_BOUNDARY.md"
---

# ADR-009: Security Boundary

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Implementation: **NOT_STARTED**

## Context

V11 already excludes secrets from state, uses opaque references and short-lived grants, requires sandboxing and least privilege, denies high-risk capabilities, supports Human override and blocks protected actions.

## Decision

Treat capability grant, sandbox, risk gate and Codex/Human review together as the V11 Execution Guard. Add a threat model and negative test matrix in V11.1 instead of creating a parallel authority layer.

## Never Delegated

Secrets export, private keys, wallet signing, contract deployment, protected path write, main merge, production deploy and R4 execution remain denied to ordinary Agents.

## Consequences

Security policy remains centralized in auditable grants and review evidence while provider adapters remain replaceable.
