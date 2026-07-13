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
CHANGE_REASON: "Define one-mission execution, evidence and stop boundaries for 悟空001."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelTaskRuntime
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_task_runtime.md"
---

# Kernel Task Runtime

## 1. Mission Contract

悟空001每天最多接受一個 Mission。Mission 必須由 Human 或經授權的 Codex 指派；悟空001不得自行把 AI 建議、聊天要求或未核准 WorkOrder 轉為 active Mission。

## 2. Mission Envelope

每個 Mission 至少包含：

- `mission_id`
- `task_id`
- `task_source_type`
- `task_source_id`
- `task_source_actor`
- `task_source_file`
- `task_source_commit`
- `reason`
- `owner_agent_id`
- `reviewer`
- `priority`
- `risk_level`
- `dependencies`
- `input_files`
- `allowed_outputs`
- `acceptance_criteria`
- `protected_paths`
- `allowed_tools`
- `base_commit`
- `branch`
- `report_path`
- `deadline_or_runtime_window`
- `status`

缺少來源、owner、reviewer、risk、acceptance criteria 或 protected paths 時不得進入 `WORKING`。

## 3. Admission Validation

Task controller 檢查：

1. Agent ID 是悟空001。
2. 目前沒有其他 active Mission。
3. Mission source 可追溯。
4. Risk 未超出 Agent authority。
5. Dependencies 已滿足。
6. Base state 未過舊。
7. Branch 與 workspace 合法。
8. Output / report path 無衝突。
9. Protected path 不在修改範圍。
10. Human Pause、BLOCK 或 suspension 不存在。

任何一項失敗，Mission 保持未開始，Kernel 進入 `WAITING` 或 `SLEEP`。

## 4. Execute Loop

每一 action 都遵循：

`Observe -> Validate -> Act -> Record -> Check Stop Condition`

Action record 至少包含：

- `action_id`
- `mission_id`
- `timestamp`
- `state_before`
- `intent`
- `tool`
- `input_reference`
- `output_reference`
- `files_touched`
- `test_result`
- `risk_change`
- `state_after`

Runtime 不要求記錄不可公開的 chain-of-thought；它要求記錄足以稽核的 observations、decision basis、actions 與 evidence。

## 5. Tool Boundary

| Tool Class | Default |
|---|---|
| Filesystem Read | Mission-scoped |
| Filesystem Write | Explicit path allowlist |
| Git Read | Allowed when required |
| Git Commit | Human / Codex authorization required |
| Git Push Handoff | Explicit authorization required |
| Git Push Main | Denied |
| Browser / Network | Mission-scoped and logged |
| Contracts / Wallet / Bridge | Denied |
| Secrets | Denied |
| Production Deployment | Denied |

## 6. Stop Conditions

立即停止施工並進入 `WAITING`：

- Protected path 可能受影響。
- Mission scope 不足以判定合法行為。
- Dependency 改變或 base 失效。
- Secret、private key 或 personal data 出現。
- Risk 升級超出 authority。
- Human Pause / Re-Hold / Reject。
- Tool 輸出與預期矛盾。
- 第二個 Agent 或 Mission 嘗試進入 Kernel。

## 7. Evidence Package

Mission 完成前必須產生：

- Task Result
- Files Read
- Files Modified
- Tests Run
- Problems Found
- Risks
- Technical Debt
- Evolution Opportunities
- Research Direction
- Suggested WorkOrders，狀態只能是 `PROPOSED`
- Do Not Do
- Need Human Decision
- Need Codex Review
- Base commit
- Branch / commit，若獲准產生
- Protected path result
- Final state request

沒有 Evidence package 不得進入 `REVIEW`。

## 8. Mission Outcomes

| Outcome | Next State |
|---|---|
| Output and evidence complete | `REVIEW` |
| Waiting for recoverable input | `WAITING` |
| Scope invalid before work | `SLEEP` |
| Emergency with checkpoint | `OFFLINE` |

Task controller 不決定 Reward，也不把自己標記為 `DONE`。正式完成由 Review result 與後續 closeout 決定。

## 9. No-Mission Day

悟空001若沒有合法 Mission：

1. 記錄 `NO_MISSION`。
2. 不掃描 OPEN Queue 自行 claim。
3. 不創造 filler work。
4. 從 `READY` 進入 `SLEEP`。

## 10. Human Review Questions

- Mission envelope 是否提供足夠來源與安全資訊？
- 單一 Mission 限制是否可以由 machine invariant 驗證？
- Tool boundary 是否有任何隱含 main / production 權限？
- Evidence 是否足以讓 Reviewer 不依賴聊天記憶？
