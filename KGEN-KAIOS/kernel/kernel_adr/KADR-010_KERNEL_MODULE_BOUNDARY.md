---
KADR: "KADR-010"
TITLE: "Kernel Module Boundary"
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
CHANGE_REASON: "Define minimal cross-cutting contracts without creating services."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: KernelModuleBoundaryDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-010_KERNEL_MODULE_BOUNDARY.md"
---

# KADR-010: Kernel Module Boundary

## Context

V1 已有 Boot、Memory、Task、Evidence、Review、Reward、Sleep。Checkpoint 屬於 Sleep，Sandbox 與 Telemetry rules 分散於多份規格。

## Decision

在不建立 executable services 的前提下，V1 Architecture 應確認：

| Contract | Decision |
|---|---|
| Supervisor | Minimal heartbeat、stop、duplicate detection、bounded restart |
| Checkpoint | 保持 Sleep-owned，避免雙重 authority |
| Memory | 保持 source-priority、retention與write boundary |
| Sandbox | 集中 deny-by-default tool / path permission contract |
| Telemetry | 集中 trace、metric、audit與redaction contract |

## Deferred

V2 才研究 Supervisor Tree、distributed checkpoint、provider sandbox farm與telemetry platform。

## Consequences

責任邊界更清楚，但現階段只形成 contract，不新增 service、process、database 或 deployment。
