---
KADR: "KADR-004"
TITLE: "Mission Inbox Boundary"
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "PROPOSED"
CLASSIFICATION: "DEFER_KERNEL_V1_1"
TARGET: "KERNEL_V1_1 / KERNEL_V2"
IMPLEMENTATION: "NOT_STARTED"
HUMAN_REVIEW: "REQUIRED"
SOURCE_REVIEW_ID: "GROK-KERNEL-INDEPENDENT-REVIEW-20260713"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Keep V1 single-Mission and phase queue durability safely."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureGovernance
CLASS: KernelADR
ORDER: SingleAgentKernel
FAMILY: KAIOS
GENUS: KernelADR
SPECIES: MissionInboxBoundaryDecision
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_adr/KADR-004_MISSION_INBOX_BOUNDARY.md"
---

# KADR-004: Mission Inbox Boundary

## Context

Kernel V1 只允許一位 Agent與一個 Mission，已具備 priority、deadline、dependency 與 WAITING。

## Decision

V1 不建立 Persistent Queue、Priority Queue、Backpressure 或 DLQ。Mission 仍由 Human / Codex 明確指派。

## V1.1 Candidate

- 一筆 active Mission。
- 最多一筆 pending Mission。
- persistent inbox record。
- bounded retry count。
- expired / invalid Mission quarantine。
- 不允許 Agent 自行排序或 promote。

## V2 Candidate

Multi-mission priority queue、backpressure、worker pool、sharding 與 dead letter queue。

## Consequences

V1 不承擔 scheduler 複雜度；V1.1 可測試重啟後 Mission durability。
