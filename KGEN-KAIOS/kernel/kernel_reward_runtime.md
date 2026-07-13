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
CHANGE_REASON: "Define review-gated prototype rewards for the single-Agent Kernel."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelRewardRuntime
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_reward_runtime.md"
---

# Kernel Reward Runtime

## 1. Boundary

Reward Runtime 只在獨立 Review 通過後記錄 Prototype / Internal Ledger reward。它不發送 KGEN、不連接真實 Wallet、不執行銀行付款，也不保證任何法幣或市場價值。

## 2. Entry and Exit

| Item | Requirement |
|---|---|
| Entry State | `REVIEW` |
| Entry Event | `APPROVED` |
| Active State | `REWARD` |
| Exit Event | `REWARD_RECORDED` |
| Exit State | `SLEEP` |

若 Review 結果不是 `APPROVED`，不得進入 REWARD。

## 3. Allowed Units

| Unit | Purpose | Real-World Value Claim |
|---|---|---|
| `MERIT_POINT` | 紀錄任務品質與文明功勳 | None |
| `TEMPLE_ENERGY` | 模擬神殿活動能量 | None |
| `GAME_CREDIT` | 模擬遊戲任務額度 | None |

`KGEN_TOKEN`、`FIAT`、真實 bank balance 與鏈上 asset 在 Kernel V1 一律禁止。

## 4. Reward Record

- `reward_event_id`
- `kernel_day_id`
- `agent_id`
- `mission_id`
- `review_id`
- `review_result`
- `reward_unit`
- `gross_amount`
- `quality_factor`
- `risk_factor`
- `penalty_or_withhold`
- `net_amount`
- `basis`
- `approved_by`
- `recorded_at`
- `ledger_mode`
- `claimable`
- `next_state`

在本階段，`ledger_mode` 固定為 `PROTOTYPE_INTERNAL_LEDGER`，`claimable` 固定為 `false`。

## 5. Calculation Principles

- 沒有 Review Evidence：reward = 0。
- APPROVED Mission：可依品質、風險、測試與證據完整度提出 reward。
- NEEDS_REVISION：暫不記錄完成 reward。
- REJECTED / BLOCKED：不得記錄完成 reward。
- 重複 evidence、重複 commit 或相同 Mission 不得重複 reward。
- Agent 自報工時不能單獨作為 reward 依據。

Kernel V1 不固定金額公式，避免在 Architecture 階段假造經濟參數。任何公式需由 Human 另行核准。

## 6. Separation from Payroll

Reward event 是 Kernel lifecycle evidence，不等於 Workforce salary。未來若要與 8888 People Bank 或 Payroll 對接，必須另經：

1. Human-approved interface design。
2. Unit mapping。
3. Duplicate-payment protection。
4. Audit reconciliation。
5. Legal / security review。

## 7. Failure Handling

Reward record 驗證失敗時：

- 不得重跑 Mission 以取得新的 reward。
- 保存 review approval。
- 將 reward 狀態標記為 `WITHHELD_FOR_RECORD_REPAIR`。
- 進入 `SLEEP` 前記錄 unresolved item。
- 由 Codex / Human 決定後續處置。

## 8. Security

- Reward Runtime 無 private key、signing、transfer 或 withdrawal interface。
- 不可從其他 Agent、Payroll Reserve 或 Temple asset 扣款。
- 不可把未來薪資、Token 價格或投資收益當作 reward 抵押。
- 所有 correction 以 reversal / superseding event 表示，不刪除歷史。

## 9. Human Review Questions

- Allowed units 是否與真實資產充分分離？
- Review gate 是否不能被 Agent 繞過？
- 是否應在下一階段定義 reward formula，或繼續由 Human 個案核准？
- Payroll integration 是否確實保持 out of scope？
