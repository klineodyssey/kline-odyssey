---
KADR: "KADR-005"
TITLE: "Evidence Validation"
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "PROPOSED"
CLASSIFICATION: "ACCEPT"
TARGET: "KERNEL_V1_ARCHITECTURE_AMENDMENT"
IMPLEMENTATION: "NOT_STARTED"
HUMAN_REVIEW: "REQUIRED"
SOURCE_REVIEW_ID: "GROK-KERNEL-INDEPENDENT-REVIEW-20260713"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Require schema, grounding, confidence separation and evidence validation."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: EvidenceValidationDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-005_EVIDENCE_VALIDATION.md"
---

# KADR-005: Evidence Validation

## Context

V1 有完整欄位清單，但沒有單一 machine-readable Evidence Envelope Schema 與 validator result。

## Decision

在任何 Implementation Planning 前，V1 Architecture 必須要求：

- Evidence Envelope JSON Schema。
- source reference 與 content hash。
- producer identity、time、mission、state與sensitivity。
- grounding references。
- confidence score，並明確標示它不是事實證明。
- validator checks：schema、hash、source visibility、permission、protected path、test status。

## Boundary

Validator 只確認結構與可驗證條件，不做高風險 final semantic approval，不讀取 chain-of-thought。

## Consequences

Review 可以依一致格式驗證 evidence；沒有 validator PASS 的 Mission 不得進入 APPROVED / REWARD。
