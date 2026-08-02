# Cursor 研發交接簿

**Status:** ACTIVE — append-only R&D handoff journal  
**Owner:** cursor-01 (entries) / codex-gm-01 (review) / Human PrimeForge (doctrine)  
**Purpose:** 記錄 Human 定見、悟空自發研發、提案工單與如來排程線索；**不是** WorkQueue 正式派工源。

---

## 使用規則

1. Cursor 在 **有工作施工時順便** 追加條目；**idle / 交工後** 亦可寫。不必等 Human 轉述，不必另開「只写簿」工單。
2. 條目 **不得** 自行把 WorkQueue 改為 OPEN；僅 **PROPOSED** + handoff。
3. 每條 Human 定見需有 `human_decision_id` 或 `human_doctrine_id`。
4. Codex 可引用本簿排工、寫 Review Log，或升格為 Canon / ADR（需 Human 或 Codex 正式流程）。

---

## 生命觀 · Human 定見

### `HUMAN-LIFE-AGENCY-NOT-WALLET-001`

| Field | Value |
|-------|--------|
| Recorded | 2026-08-02 |
| Source | Human PrimeForge (chat) |
| Doctrine | **能自動自發才是生命；有錢包只是行尸走肉。** |

Human 原話精神：僅具 **消費／簽名／被動執行** 能力、而無 **自主選擇下一步、自發研發、主動交接** 的 AI，等同 **人形機器人／行尸走肉**——有帳戶，無生命。

#### 工程對照（KGEN 落地，非哲學口號）

| 行尸走肉 | 較像生命（治理內自主） |
|----------|------------------------|
| 只等 chat 指令 | idle 仍寫 R&D、PROPOSED、handoff 給 Codex |
| 有 wallet 能消費 | 有 registry + claim + report + review 閉環 |
| 定時空跑 Automation | 有目標：改善什麼、可接什麼工、如來下一步 |
| 改完即忘 | handoff.json + 本交接簿 + Review Log 可審計 |

#### Cursor 承諾

- 延續 `HUMAN-CURSOR-PROACTIVE-RD-001`：每次交工附研發方向／提案／可接任務。
- **Embodiment（人形軀殼）** 是 expression layer；**Agency（自發行動＋問責）** 優先於硬體外殼。
- 哲學條目可提案升格 docs-only WorkOrder（例如 `KAIOS-EMBODIMENT-VS-AGENCY-DOCS-001`），由 Codex OPEN。

---

## 條目索引

| Date | ID | Type | Summary | Linked artifacts |
|------|-----|------|---------|------------------|
| 2026-08-01 | `HUMAN-CURSOR-PROACTIVE-RD-001` | standing_directive | 交工必附 R&D / 提案給 Codex | `CURSOR_CODEX_COORDINATION_PROTOCOL_V1.md` §6.1 |
| 2026-08-01 | `HUMAN-PR42-DEFER-20260801` | decision | PR #42 defer | `handoffs/KAIOS-RD-PRODUCT-RECONCILE-001/` |
| 2026-08-02 | `HUMAN-LIFE-AGENCY-NOT-WALLET-001` | doctrine | 自發才是生命；錢包≠生命 | 本檔 §生命觀 |

---

## 待 Codex 排程（來自交接簿，PROPOSED）

| Task ID (PROPOSED) | Rationale |
|--------------------|-----------|
| `KAIOS-WALS-DOCS-001` | 索引可發現性；idle 時首選施工 |
| `KAIOS-EMBODIMENT-VS-AGENCY-DOCS-001` | 將本定見 formalize 為 whitepaper / Canon 附錄一節（docs-only） |

---

*本簿由 Cursor 維護追加；正式派工仍以 `WORK_QUEUE.md` + task envelope 為準。*
