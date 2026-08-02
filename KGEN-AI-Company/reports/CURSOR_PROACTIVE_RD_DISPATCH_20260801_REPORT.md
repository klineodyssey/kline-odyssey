# Cursor Proactive R&D Dispatch — 2026-08-01

**Message type:** `PROACTIVE_RD_HANDOFF`  
**Human directive:** `HUMAN-CURSOR-PROACTIVE-RD-001` — 每次交工後主動向 Codex 提案研發方向與可派工任務  
**Worker:** cursor-01 (cursor-cloud)  
**Reviewer:** codex-gm-01  
**Main SHA (observed):** `7515fa6f` (post PR #73 charter foundation gap closure)  
**Branch:** `cursor-handoff/KAIOS-RD-PRODUCT-RECONCILE-001`

---

## 1. Cursor 承諾（給如來）

之後每次接到工單或完成 R&D，悟空會在報告末尾固定附上本格式附錄，並更新 `handoff.json` 的 `proposed_workorders` / `codex_actions_required`。Human 不用轉述聊天內容。

---

## 2. 現況觀察（R&D 方向）

| 觀察 | 影響 | 建議方向 |
|------|------|----------|
| main 已合 PR #67–#73（Life Runtime、Charter gap 等） | WorkQueue 上 PR67 列仍 **CLAIMED**，可能 stale | Codex 同步 Queue → DONE/MERGED |
| PR #42 product-shell **Human 已 DEFER** | 不宜再派 001A 施工 | Codex close/archive Draft #42 |
| `KAIOS-WALS-DOCS-001` 仍 **HOLD / NOT_APPROVED** | WALS 規格已 DONE，索引未整合 | **首選可派 Cursor 任務** |
| Cloud VM 常駐 `http.server 8080` | World Viewer QA 綁 8080 會衝突 | 文件化 `TEST_INFRA_PORT_8080_CONFLICT`；QA 用 8765 或停 demo |
| Boot 體系文件多、層次多 | 新 Worker 易漏讀 | 合併 Boot 導讀報告 + Coordination Protocol 到 main |
| 無 OPEN + APPROVED Cursor dispatch | 悟空 idle | 本報告 PROPOSED 列供排程 |

---

## 3. 改善提案（Process / Repo）

### P-001 — 合併協調協議與主動派工標準

- **改什麼：** merge `CURSOR_CODEX_COORDINATION_PROTOCOL_V1.md` §6.1 + 本報告模板進 main  
- **改善：** Codex/未來 Cursor 有固定契約，減少「聊天裡說過但 Git 沒有」  
- **Cursor 可做：** docs-only handoff（已在本分支）  
- **Codex：** review → merge handoff branch

### P-002 — WorkQueue 與 PR 狀態對帳

- **改什麼：** PR67/69/70/73 對應列改 DONE；PR42 標 SUPERSEDED 或 HOLD + 連結 Human decision  
- **改善：** Cursor 掃 OPEN 時不會誤 claim 已完成工  
- **Owner：** Codex（Cursor 不自行改 Queue）

### P-003 — QA 埠號標準

- **改什麼：** `AGENTS.md` 或 World Viewer QA 腳本註明：Cloud demo 8080 vs product QA 8765  
- **改善：** 減少假陽性 CI/手測失敗  
- **Cursor 可做：** 小 patch + 報告（需 envelope）

### P-004 — Boot 一頁導讀（繁中）

- **改什麼：** `KGEN-AI-Company/reports/CURSOR_BOOT_READING_SUMMARY_ZH.md`（母機→公司→Cursor→玩家四層）  
- **改善：** Human / 新 Worker  onboarding；Codex 審核時有共同語言  
- **Cursor 可做：** docs-only，低風險

---

## 4. 悟空可接任務（請 Codex 排 OPEN + envelope）

### 優先序 A — 立即可施工（低風險、無 protected path）

| Task ID (PROPOSED) | 優先 | Cursor 會做什麼 | 合併後改善 | 分支 |
|--------------------|------|-----------------|------------|------|
| **KAIOS-WALS-DOCS-001** | P1 | WALS V1 進 Master Index / Boot 索引 / cross-links | 規格可發現、可審計 | `cursor-handoff/KAIOS-WALS-DOCS-001` |
| **KAIOS-COORD-PROTOCOL-MERGE-001** | P2 | 合併 Coordination Protocol + 本 Dispatch 標準 | Cursor↔Codex 自動協調 | `cursor-handoff/KAIOS-COORD-PROTOCOL-MERGE-001` |
| **KAIOS-BOOT-SUMMARY-ZH-001** | P2 | 繁中 Boot 一頁摘要（chat 已審過內容 formalize） | 降低開機迷路 | `cursor-handoff/KAIOS-BOOT-SUMMARY-ZH-001` |
| **KAIOS-WV-SMOKE-QA-001** | P2 | World Viewer 靜態 smoke（8765 埠）+ 截圖/清單 | 回歸 main 導航 | `cursor-handoff/KAIOS-WV-SMOKE-QA-001` |
| **KAIOS-TX-BTC-PIPELINE-SMOKE-001** | P3 | `tx_btc_convert.py` 對 sample CSV（CI 對齊） | 資料管線信心 | `cursor-handoff/KAIOS-TX-BTC-PIPELINE-SMOKE-001` |

**Codex 派工前請提供：** `*.task_envelope.json`、`Dispatch: APPROVED`、WorkQueue `OPEN`。

### 優先序 B — 需 Codex 先決策

| Task ID | 阻塞 | Cursor 準備度 |
|---------|------|---------------|
| KAIOS-PRODUCT-SPRINT-001A-R1 | `HUMAN-PR42-DEFER-20260801` — **勿 OPEN** | 待命至 stable baseline |
| KAIOS-PR-PREVIEW-PAGES-001 | 可與 #42 一併 defer 或獨立 P2 | 可寫 GitHub Pages preview 腳本 |
| KAIOS-LIFE-FOOD-CHAIN-V1-001 | Roadmap 多為 HOLD | PR #70 合併後可拆第一個 implementation slice |

### 優先序 C — Codex-only（悟空不接）

- Review/merge 已開 PR、更新 `CODEX_REVIEW_LOG.md`
- WorkQueue stale 列修正
- Close/archive PR #42

---

## 5. 建議 Codex 下一動（可複製到 Review Log）

```text
1. Merge cursor-handoff/KAIOS-RD-PRODUCT-RECONCILE-001 (docs + coordination)
2. OPEN + APPROVE KAIOS-WALS-DOCS-001 + task envelope → Cursor claim
3. Sync WorkQueue: PR67 → DONE; PR42 → SUPERSEDED/HOLD + HUMAN-PR42-DEFER link
4. OPEN KAIOS-COORD-PROTOCOL-MERGE-001 or fold into (2) if same PR acceptable
5. Optional: OPEN KAIOS-WV-SMOKE-QA-001 for post-#73 regression
```

---

## 6. handoff.json 更新欄位

見同分支 `KGEN-AI-Company/reports/handoffs/KAIOS-RD-PRODUCT-RECONCILE-001/handoff.json`：

- `human_decision_id` 新增 `HUMAN-CURSOR-PROACTIVE-RD-001`
- `proposed_workorders[]` 擴充
- `cursor_capabilities_ready[]` 新增
- `codex_actions_required.promote_proposed_workorders` 更新

---

## 7. Worker Boot SOP 對照

| Section | Status |
|---------|--------|
| BOOT | PASS — 已讀母機 Boot + 本 Human 指令 |
| MUST READ | PASS — Coordination Protocol, WorkQueue snapshot |
| PROTECTED PATH | PASS — 本報告 docs-only |
| TASK PLAN | PROACTIVE_RD — 無 product 改動 |
| EXECUTION | REPORT + handoff push |
| FINAL REPORT | 本檔 + handoff triple |

**Result:** `HANDOFF_SUBMITTED` — 等待 Codex 排工。
