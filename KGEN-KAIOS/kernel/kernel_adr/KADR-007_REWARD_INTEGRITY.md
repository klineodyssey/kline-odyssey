---
KADR: "KADR-007"
TITLE: "Reward Integrity"
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "PROPOSED"
CLASSIFICATION: "PARTIAL_ACCEPT"
TARGET: "KERNEL_V1_ARCHITECTURE_AMENDMENT / KERNEL_V2"
IMPLEMENTATION: "NOT_STARTED"
HUMAN_REVIEW: "REQUIRED"
SOURCE_REVIEW_ID: "GROK-KERNEL-INDEPENDENT-REVIEW-20260713"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Require immutable idempotent outcome rewards and anti-gaming."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: RewardIntegrityDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-007_REWARD_INTEGRITY.md"
---

# KADR-007: Reward Integrity

## Context

V1 有 Review-gated Outcome Reward 與 prototype units，但需要明確 idempotency 與 anti-gaming。

## Decision

Reward event 應：

- append-only。
- 使用 `mission_id + review_id + reward_type` 唯一鍵。
- 可由 reversal / superseding event 更正。
- 檢查 duplicate evidence、duplicate commit、人工拆單、無效 activity、循環 revision 與自報工時。
- 保持 `claimable=false`，不進行真實 KGEN 或 Wallet transfer。

## Rejected

V1 不採細粒度 Process Reward。步驟數量不等於價值，可能鼓勵冗長或假 activity。

## Deferred

Process Reward 只在 V2 Sandbox、benchmark 與 adversarial testing 下研究。

## Consequences

Reward 維持簡單、可稽核且不會重複計算。
