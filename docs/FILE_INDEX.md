KLINE ODYSSEY — FILE INDEX V1.0

---

一、核心控制層

- MASTER_CONTROL.md
  主腦規則與宇宙設定（所有 AI 任務必讀）

---

二、系統文件

- docs/FILE_INDEX.md
  專案結構說明（本文件）

- docs/AUTOPILOT.md
  AI 執行流程與任務規則

---

三、核心模組（現實 repo 結構）

1. K線西遊記（主宇宙 / 前端 / 資料流程）

- K線西遊記/index.html
  宇宙入口頁

- K線西遊記/temples/12345/
  五指山・悟空財神殿（主要 MVP）

- K線西遊記/temples/16888/
  廣寒宮 UI

- K線西遊記/tools/
  TX / BTC 資料轉換與流程控制

- K線西遊記/kline-taifex/
  台指期資料系統

- K線西遊記/kline-btc/
  BTC 資料系統

---

2. KGEN（鏈上系統）

- KGEN/contracts/
  Token / Temple / Bank 合約

- KGEN/scripts/
  部署與初始化腳本

- KGEN/runtime/
  鏈上運作與機制文件

---

3. 自動化系統（Autopilot）

- .github/workflows/
  CI / 自動執行流程

- .github/scripts/
  自動更新與工具腳本

---

4. 白皮書與內容

- whitepaper/
  制度與經濟模型文件

---

四、目前 MVP 目標（鎖定）

👉 ONLY focus:

- K線西遊記/temples/12345/

目標：
完成「悟空財神殿 TempleHeart MVP」

---

五、AI 操作規則

1. 必須先讀 MASTER_CONTROL.md
2. 再讀 FILE_INDEX.md
3. 不得推測不存在的資料夾
4. 僅可在現有結構內操作
5. 所有修改需符合 MVP 目標

---

六、版本規則

- V1.0 初版
- V1.1 小更新
- V2.0 結構變更

---

七、未來擴展

- 不得刪除既有結構
- 新模組需加入本文件
- 保持向下相容

---

END
