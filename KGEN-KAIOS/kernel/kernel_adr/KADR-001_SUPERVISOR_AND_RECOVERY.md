---
KADR: "KADR-001"
TITLE: "Supervisor and Recovery"
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "PROPOSED"
CLASSIFICATION: "PARTIAL_ACCEPT"
TARGET: "KERNEL_V1_ARCHITECTURE_AMENDMENT / KERNEL_V1_1 / KERNEL_V2"
IMPLEMENTATION: "NOT_STARTED"
HUMAN_REVIEW: "REQUIRED"
SOURCE_REVIEW_ID: "GROK-KERNEL-INDEPENDENT-REVIEW-20260713"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve Supervisor, watchdog and crash recovery recommendations."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: SupervisorAndRecoveryDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-001_SUPERVISOR_AND_RECOVERY.md"
---

# KADR-001: Supervisor and Recovery

## Context

Kernel V1 已有 Boot health、emergency checkpoint、crash recovery 與 duplicate instance rejection，但沒有單一責任的 Supervisor contract。

## Decision

接受一個位於悟空001之外的最小 Supervisor control contract。Supervisor 不是 Agent、不執行 Mission，也不取得 reward。

V1 Architecture amendment 應定義：

- Agent heartbeat 與 state age。
- duplicate instance detection。
- watchdog timeout。
- Human kill switch。
- bounded restart，且每次 restart 保留 crash evidence。
- restart 失敗後 fail closed 至 `OFFLINE`。

## Deferred

- V1.1：restart budget、backoff、health window、recovery drill。
- V2：Supervisor Tree、多 Agent recovery、worker pool。

## Rejected

無限制自動 restart。它可能掩蓋 deterministic failure、重複 action 或資產風險。

## Consequences

增加一個安全控制契約，但不增加第二位 Agent，也不改變八態 lifecycle。
