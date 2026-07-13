---
KADR: "KADR-006"
TITLE: "Risk-Based Review"
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "PROPOSED"
CLASSIFICATION: "PARTIAL_ACCEPT"
TARGET: "KERNEL_V1_ARCHITECTURE_AMENDMENT / KERNEL_V1_1"
IMPLEMENTATION: "NOT_STARTED"
HUMAN_REVIEW: "REQUIRED"
SOURCE_REVIEW_ID: "GROK-KERNEL-INDEPENDENT-REVIEW-20260713"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Adopt risk routing while rejecting autonomous final review."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: RiskBasedReviewDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-006_RISK_BASED_REVIEW.md"
---

# KADR-006: Risk-Based Review

## Context

V1 已有 Codex、Human 與 external advisory review，但 routing 尚未明確連結 risk level，asynchronous review 也未定義。

## Decision

- R0 / R1：Codex Review，Human 可抽查。
- R2：Codex full Review。
- R3：Codex + Human Review。
- R4：BLOCK，僅能報警與保存 evidence。
- Auto Review 只做 schema、test、secret、protected path 與 policy checks。

## Rejected

Auto Review 不得擔任 Architecture、安全、法律、財務、protected Runtime 或正式 Reward 的 final approver。

## Deferred

V1.1 定義 async review ticket、timeout、escalation、revision limit 與 wake-up resumption。

## Consequences

低風險檢查可以機械化，但 Human Final Authority 與 Codex review boundary 不被繞過。
