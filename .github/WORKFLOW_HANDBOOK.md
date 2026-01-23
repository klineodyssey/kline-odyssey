# 📘 PrimeForge Autopilot｜Workflow Handbook  
**Version 1.0｜Single Source of Truth**

---

## 🎯 目的（必讀）

本 Handbook 用於規範 **KLINE Odyssey / PrimeForge Autopilot**  
在 GitHub Actions 中的 **唯一正確作業方式**。

核心目標只有一個：

> **避免多個 workflow 同時「做事」，造成衝突、覆蓋或不可預期結果。**

---

## 🧠 核心設計原則（不可違反）

### 原則一  
**系統中只能有一個 workflow 真正執行任務**

所謂「執行任務」包含：

- 跑 pipeline / script  
- 產生或更新檔案  
- git commit / push  

👉 全部集中在「核心 workflow」

---

### 原則二  
**其他 workflow 只能作為觸發器（Trigger）**

可做的事：

- 定時觸發（schedule）  
- 手動觸發（workflow_dispatch）  
- 事件觸發（push / main）  

❌ 不得直接跑 pipeline  
❌ 不得 commit  
❌ 不得產生資料  

---

### 原則三  
**Autopilot 結構不可私自拆分或複製**

禁止行為：

- 複製 core workflow 自行修改  
- 在 trigger workflow 內加入實際 pipeline  
- 繞過 concurrency 設定  

---

## 📂 標準檔案結構（最終定案）

```text
.github/
└─ workflows/
   ├─ _autopilot_core.yml        ← 唯一會「做事」的核心
   ├─ autopilot_all.yml          ← 定時 / 手動觸發
   └─ autopilot-on-main.yml      ← main branch 觸發
