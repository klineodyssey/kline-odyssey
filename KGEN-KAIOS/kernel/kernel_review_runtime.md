---
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "DRAFT_FOR_HUMAN_REVIEW"
ARCHITECTURE: "RESEARCH_ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-DESIGN-20260713"
HUMAN_DECISION_ID: "HUMAN-KERNEL-V1-001"
CHANGE_REASON: "Define independent review before reward and sleep."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelReviewRuntime
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_review_runtime.md"
---

# Kernel Review Runtime

## 1. Constitutional Rule

Review Before Merge 與 Evidence First 適用於 Kernel 的每個 Mission。悟空001不得 review 自己的成果，不得自行把 `REVIEW` 改為 `REWARD`，也不得用 Reward 反向證明工作合格。

## 2. Review Roles

| Role | Authority |
|---|---|
| 悟空001 | 提交 Evidence；回應 findings；不得核准 |
| Codex | 一般 Mission 技術 Review、scope、evidence、risk |
| Human PrimeForge | 高風險、Architecture、protected boundary、不可逆決策 |
| External Reviewer | 可提供建議；沒有 merge / reward authority |

## 3. Review Inputs

Reviewer 必須取得：

- Mission envelope。
- Boot evidence。
- Memory manifest references。
- Action log。
- Output artifacts。
- Tests 與 validation。
- Diff / changed files，若有。
- Problems、risks、technical debt。
- Protected path check。
- Provenance。
- Suggested WorkOrders。
- Sleep readiness。

任一必要來源不可見時，結果不能是 `APPROVED`。

## 4. Review Gates

1. **Identity:** Agent、Mission、branch、workspace 一致。
2. **Scope:** 只完成一個 Mission。
3. **Constitution:** 不違反 Human authority、Review、Evidence 與 Security。
4. **Canon:** 不推翻 KGEN Canon。
5. **Protected Runtime:** 變更數必須為 0，除非另有明確 Human 授權。
6. **Evidence:** Files、tests、risks、result 可追溯。
7. **State:** transition 合法。
8. **Security:** 無 secret、越權工具或外洩。
9. **Quality:** Acceptance criteria 可驗收且結果符合。
10. **Reward Eligibility:** 只有通過後才可提出 reward event。

## 5. Review Outcomes

| Outcome | Meaning | Next State |
|---|---|---|
| `APPROVED` | 所有必要 gate 通過 | `REWARD` |
| `NEEDS_REVISION` | 有限且安全的修正可執行 | `WORKING` |
| `REJECTED` | 結果不應採用 | `SLEEP` |
| `BLOCKED` | 需要 Human / dependency / security decision | `SLEEP` 或保持 `WAITING` |

NEEDS_REVISION 必須列出 revision scope、acceptance criteria 與是否允許重用原 Evidence。不得用無限 review loop 讓 Agent 永不 Sleep。

## 6. Review Record

- `review_id`
- `mission_id`
- `agent_id`
- `reviewer_id`
- `reviewer_role`
- `started_at`
- `completed_at`
- `inputs_verified`
- `findings`
- `risk_result`
- `constitution_result`
- `canon_result`
- `protected_path_result`
- `test_result`
- `decision`
- `revision_scope`
- `reward_eligible`
- `next_state`

Review 更正必須建立新的 superseding record，不得覆寫原 decision。

## 7. Reward Gate

`reward_eligible=true` 的必要條件：

- decision = `APPROVED`
- Evidence 完整
- Protected path result = PASS
- No unresolved critical risk
- No Human Pause
- Agent 未被 suspended

Review 只核准 reward eligibility，不執行真實支付。

## 8. Architecture Boundary

Kernel V1 Design 的 Human Review 由 PrimeForge 決定。Codex 可驗證格式與一致性，但不得自行把本設計提升為 Implementation 或建立 executable WorkQueue。

## 9. Human Review Questions

- Codex 與 Human gate 是否分工清楚？
- APPROVED 是否有 machine-verifiable 前置條件？
- Revision 是否可能導致無限執行？
- Reward controller 是否無法繞過 Review？
