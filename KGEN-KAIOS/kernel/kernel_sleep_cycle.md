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
CHANGE_REASON: "Define mandatory checkpoint, shutdown and next-day recovery behavior."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelSleepCycle
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_sleep_cycle.md"
---

# Kernel Sleep Cycle

## 1. Purpose

Sleep 是 Kernel V1 的強制安全階段，不是裝飾性狀態。它結束悟空001當日的執行權、封存可追溯記憶、釋放 Mission 資源並確保下一日必須重新 Boot。

## 2. Entry Conditions

可從以下情況進入 `SLEEP`：

- `READY + NO_MISSION`
- `REVIEW + REJECTED_OR_BLOCKED`
- `REWARD + REWARD_RECORDED`
- Human / Codex 要求安全收工，且已建立 checkpoint

不得從 `WORKING` 直接進入正常 Sleep。工作中止時必須先停止 actions、建立 evidence，再進入 `WAITING`、`REVIEW` 或 emergency checkpoint。

## 3. Sleep Procedure

1. 停止接受新 Mission。
2. 關閉 filesystem write、network mutation、Git write 與 external action permissions。
3. 驗證沒有 running tool session。
4. 封存 Mission outcome 與 Review / Reward reference。
5. 將 working memory 轉為 reviewed summary 或清除。
6. 建立 checkpoint 與 hash。
7. 釋放 claim、file lock、branch lock 與 temporary resource。
8. 記錄 unresolved dependency、risk 與 next-day instruction。
9. 產生 Daily Closeout Evidence。
10. 發出 `CHECKPOINT_COMPLETE` 並進入 `OFFLINE`。

## 4. Sleep Checkpoint

- `checkpoint_id`
- `kernel_day_id`
- `agent_id`
- `mission_id`
- `state_before_sleep`
- `mission_outcome`
- `review_id`
- `reward_event_id`
- `memory_manifest_id`
- `retained_memory_refs`
- `discarded_ephemeral_classes`
- `open_risks`
- `open_dependencies`
- `claim_released`
- `tools_stopped`
- `workspace_health`
- `checkpoint_hash`
- `completed_at`
- `next_state`

## 5. Sleep Invariants

完成 Sleep 時必須成立：

- Active Agent execution = 0。
- Active Mission execution = 0。
- Active mutable memory = 0。
- Active write tool = 0。
- Claim / lock 已釋放或明確標記 incident。
- Checkpoint hash 有效。
- next state = `OFFLINE`。

若任一條件失敗，Sleep status 為 `INCOMPLETE`，下一次 Boot 必須 fail closed。

## 6. Next-Day Rule

下一日不得從 checkpoint 直接進入 `READY` 或 `WORKING`。唯一合法順序：

`OFFLINE -> WAKE_REQUESTED -> BOOT -> BOOT_PASSED -> READY`

前一日 Mission 若未完成，必須重新驗證：

- Mission 是否仍有效。
- Base commit / state 是否過舊。
- Dependencies 是否改變。
- Human Pause 是否出現。
- Risk 是否升級。
- Branch / workspace 是否健康。

## 7. No Background Work

`SLEEP` 與 `OFFLINE` 禁止：

- 背景輪詢 WorkQueue。
- 繼續執行 tool。
- 自動 claim 新 Mission。
- 自動 commit / push。
- 自動產生 Reward。
- 自動更新記憶來源。

未來若需要排程器，只能發出 `WAKE_REQUESTED`，不能代表 Agent 執行。

## 8. Emergency Sleep

Runtime crash、network loss 或 Human kill switch 觸發時：

1. 立即停止新增 action。
2. 儘可能保存 emergency checkpoint。
3. 將未完成 output 標記 unreviewed。
4. 不產生 Reward。
5. state 轉為 `OFFLINE`。
6. 次日 Boot 必須先處理 incident。

## 9. Retention and Deletion

Sleep 可清除 ephemeral cache，但不得刪除 Human decision、Mission source、Evidence、Review、Reward、incident 或 checkpoint history。敏感 transient data 應安全丟棄，只保留必要 metadata。

## 10. Human Review Questions

- Sleep 是否能證明 Agent 已停止，而不只是狀態標籤？
- checkpoint 是否足以恢復，但不會恢復過期權限？
- emergency flow 是否會保留未審輸出而不把它當成正式成果？
- 是否應要求外部 watchdog 驗證 active tools = 0？
