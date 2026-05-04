KLINE ODYSSEY — FILE INDEX V1.0

一、核心控制層

- MASTER_CONTROL.md
  主腦規則與宇宙設定（所有 AI 任務必讀）

---

二、系統文件

- docs/FILE_INDEX.md
  專案結構與檔案說明

- docs/AUTOPILOT.md
  Cursor 執行流程與 AI 操作規則

---

三、資料系統

- data/kline/
  K線歷史資料（台指 / BTC / NASDAQ）

- data/events/
  重大事件與時間共振資料庫

---

四、模型系統

- models/Tplus1/
  T+1 多空運算系統

- models/ga/
  GA 演化模型（未來擴充）

---

五、前端系統

- frontend/
  網站與 UI 系統

- temples/12345/
  悟空財神殿 UI

- temples/16888/
  廣寒宮 UI

---

六、合約系統

- contracts/
  KGEN Token、Temple、Bank 等智能合約

---

七、內容系統

- content/scripts/
  影片腳本（K線西遊記）

- content/posts/
  社群貼文

---

八、開發規則

AI 在執行任務時：

1. 必須先讀 MASTER_CONTROL.md
2. 再讀 FILE_INDEX.md
3. 判斷檔案位置後才可修改
4. 不得任意新增結構外檔案
5. 所有新增需更新本索引

---

九、版本規則

所有檔案需標記版本：

V1.0 → 初版
V1.1 → 小更新
V2.0 → 結構變更

---

十、未來擴展

本索引為動態文件：

- 新模組需加入
- 不得刪除舊結構
- 必須保持向下相容

---

END
