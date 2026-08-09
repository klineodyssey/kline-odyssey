# Codex 任務：KGEN 宇宙物理單一資料來源整併與時間守恆升級

**狀態：待 Codex 執行／不得由 AI 自行建立另一條版本主線**  
**目標儲存庫：** `klineodyssey/kline-odyssey`  
**唯一資料來源：** GitHub 儲存庫目前 `main` 分支  
**本文件用途：** 施工指令草案；不是新的宇宙物理憲章  
**建立時間：** 2026-08-06 17:11 UTC+8  
**預定 Codex 恢復施工日：** 2026-08-09  

---

## 1. 最高原則：GitHub 是唯一現行資料來源

所有 AI、Codex、Cursor、ChatGPT 與開發工具，處理 KGEN 專案時必須以 GitHub `main` 分支的實際檔案為準。

本機上傳檔、對話附件、舊 ZIP、下載副本、歷史白皮書與 `/mnt/data` 工作檔，不得自動視為現行正式版本。

```text
CANONICAL_SOURCE = GitHub main
LOCAL_UPLOAD = reference only
CHAT_ATTACHMENT = reference only
ARCHIVE = historical evidence only
```

如 GitHub 與本機檔內容衝突：

```text
GitHub main wins
```

除非 Father／樂天帝明確指定某個歷史檔要回灌。

---

## 2. 宇宙物理唯一活體檔名不得改名

KGEN 宇宙物理內部實作憲章只能使用固定檔名：

```text
docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
```

這是唯一：

```text
SOURCE_OF_TRUTH = TRUE
ACTIVE_RUNTIME = TRUE
CANONICAL_FILENAME = TRUE
```

不得另創以下類型的平行現行主檔：

```text
KGEN_Universe_Physics_Runtime_V4.1.md
KGEN_Universe_Physics_Runtime_V5.0.md
KGEN_Universe_Physics_Runtime_NEW.md
KGEN_Universe_Physics_Runtime_FINAL_FINAL.md
KGEN_Universe_Physics_Runtime_LATEST.md
```

版本只能寫在 `CURRENT` 檔案內的 metadata、版本紀錄與 changelog，不得靠更換主檔名表示現行版本。

固定檔名的目的：任何不知道版本歷史的 AI，只要讀取 `CURRENT`，就能找到唯一現行憲章，不必考古猜測 V3.7、V4.0、V5.0 哪一份較新。

---

## 3. V4.0 FINAL 現況問題

目前存在：

```text
docs/physics/final-whitepaper/
KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.md
```

該檔聲稱來源是：

```text
../KGEN_Universe_Physics_Runtime_CURRENT.md
```

但它包含 Codex 編輯、整理或新增的公開說明；若這些內容沒有先寫回 `CURRENT`，就形成兩套事實來源：

```text
CURRENT = 內部規則 A
V4.0 FINAL = 公開規則 A + Codex 新增 B
```

這是不允許的。

對外白皮書只能是 `CURRENT` 的出版投影，不得成為另一個自行演化的宇宙憲章。

---

## 4. Codex 必須執行的整併順序

### 4.1 逐段比較

比較：

```text
docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
```

與：

```text
docs/physics/final-whitepaper/
KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.md
```

將 V4.0 內容分成：

```text
A. CURRENT 已存在的重新編排
B. CURRENT 沒有，但屬於正式宇宙規則的新增內容
C. 純公開介紹、行銷、平台揭露、法律風險文字
D. 與 CURRENT 衝突或 Codex 自行推論的內容
```

### 4.2 回灌正式規則

只有 B 類內容，經檢查沒有違反 Father 已定義規則後，才回灌至：

```text
docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
```

C 類只留在公開文件，不得偽裝成物理公理。

D 類不得直接採用，必須列在 reconciliation report，交由 Father 判定。

### 4.3 封存 V4.0

完成回灌後，V4.0 不再作為現行物理來源。應移入同層 archive，例如：

```text
docs/physics/final-whitepaper/archive/
KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.md
```

保留原內容、原日期、原 Git 歷史，不刪除歷史證據。

### 4.4 對外文件固定入口

如仍需公開白皮書，應使用固定入口檔名，而不是每次建立新的主入口：

```text
docs/physics/final-whitepaper/
KGEN_Universe_Physics_Runtime_OFFICIAL_WHITEPAPER_CURRENT.md
```

該檔必須標明：

```text
DERIVED_FROM = ../KGEN_Universe_Physics_Runtime_CURRENT.md
SOURCE_OF_TRUTH = FALSE
PUBLICATION_VIEW = TRUE
```

公開入口可以重新編排及加入法律聲明，但不能新增未存在於 CURRENT 的正式物理規則。

---

## 5. 本次必須寫入 CURRENT 的新規則

### 5.1 KGEN → KAIOS 創世順序

```text
KGEN Big Bang
→ 72,000,000 KGEN 質量瞬間生成與地址分布
→ 地址有質量，但地址間尚無公尺距離

Official KGEN White-Hole Burn
→ KAIOS 文明質量生成

KAIOS Map Universe
→ 地址綁定土地、生命與宇宙座標
→ 可測量距離、交通、文明與時間流程成立
```

地址不等於物理座標：

```text
Mass Known / Position Unknown
```

只有完成 KAIOS 地圖登錄後，才成為：

```text
Mass Known / Position Known
```

### 5.2 XYZKC 與 T

```text
XYZKC = 5D civilization/navigation state space
T = Time Flow / state evolution parameter
```

正式狀態表示：

```text
UniverseState(T) = {X, Y, Z, K, C, Mass, Life, Information}
```

不得把 T 當成可任意複製、增加或像空間軸自由移動的普通座標。

可稱：

```text
5D + Time
```

不應讓程式誤解為「加入 T 就能自由使用第六空間維度」。

### 5.3 時間守恆與因果守恆

KGEN/KAIOS Runtime 必須新增：

```text
Temporal Conservation
Causality Conservation
Production-Time Invariant
No Free Civilization
```

核心規則：

```text
Simulation speed ≠ Economic settlement speed
Compute acceleration ≠ Biological time creation
Tick acceleration ≠ Material creation
```

Codex 可以加快：

```text
測試
模擬
畫面播放
回測
編譯
離線推演
```

但不得因 `timeScale`、`tickRate`、區塊速度或動畫倍率，直接增加：

```text
KAIOS
KGEN
薪資
可結算工時
農作物
工業產品
房屋
土地
人口
能源
生命
```

所有可結算產量必須能追溯至：

```text
時間
+ 獨立生命或設備
+ 能源
+ 原料
+ 土地／空間
+ 工作證明
+ 因果事件
```

### 5.4 人類每日時間

單一 Human Life ID 在一個地球日的主體時間：

```text
MAX_HUMAN_SUBJECTIVE_TIME_PER_EARTH_DAY = 24 hours
```

同一真人不能在重疊時間，對互斥的現實職缺重複請領薪資。

系統需區分：

```text
REAL_TIME
SIMULATION_TIME
COMPUTE_TIME
BIOLOGICAL_TIME
ECONOMIC_SETTLEMENT_TIME
```

### 5.5 猴毛分身

猴毛分身不代表同一人一天活成 240 小時。

每個可產生獨立產量的分身必須具有：

```text
AgentLifeID
energyAccount
computeOrBodyResource
workLedger
locationOrRuntimeSlot
causalProof
productionLimit
```

十個分身可形成十個代理生命的並行工時，但不得記成一個 Human Life ID 的時間增殖。

若分身只是軟體執行緒，產量仍受到運算、能源、設備、權限與服務需求限制。

### 5.6 曲速 C 不創造時間

```text
C = movement / warp capability
```

提高 C 代表同一段時間能移動更遠，不能使一天由 24 小時變成 240 小時，也不能直接使生產量無成本增加十倍。

---

## 6. Boot 必讀規則

Boot 不應內嵌整份物理內容，但必須固定指向唯一入口：

```text
docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
```

並加入最低禁止規則：

```text
All AI/Codex/Cursor agents MUST read CURRENT before editing physics,
map, time, production, labor, civilization, KAIOS, or KGEN systems.

No agent may create a competing version-named canonical physics file.

No timeScale, tickRate, simulation speed, parallel agent, or clone may
create settlement-valid mass, currency, labor, goods, land, energy, or
population without traceable causal inputs.
```

Boot 可列出公開白皮書，但必須標記：

```text
PUBLICATION_VIEW_ONLY
NOT_SOURCE_OF_TRUTH
```

---

## 7. 機器可讀規格

Codex 應新增固定機器規格：

```text
docs/physics/runtime-schema/
KGEN_TEMPORAL_CONSERVATION_SCHEMA.json
```

至少包含：

```json
{
  "canonicalRuntime": "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
  "dimensions": {
    "stateSpace": ["X", "Y", "Z", "K", "C"],
    "evolutionParameter": "T"
  },
  "timeDomains": [
    "REAL_TIME",
    "SIMULATION_TIME",
    "COMPUTE_TIME",
    "BIOLOGICAL_TIME",
    "ECONOMIC_SETTLEMENT_TIME"
  ],
  "humanDayHours": 24,
  "simulationCreatesSettlementAssets": false,
  "cloneRequiresIndependentLifeId": true,
  "causalInputsRequired": true
}
```

JSON 只是機器執行摘要；正式語義仍以 CURRENT 為準。

---

## 8. Archive 原則

舊資料不直接刪除，而是退出現行讀取路徑：

```text
archive = historical evidence
current = operational truth
```

任何 Archive 文件首頁都要標記：

```text
STATUS: ARCHIVED
SOURCE_OF_TRUTH: FALSE
DO_NOT_USE_FOR_IMPLEMENTATION: TRUE
SUPERSEDED_BY: <canonical current path>
```

AI 開機索引預設不得把 archive 納入主讀取清單；只有考古、差異比較或 Father 指定時才讀取。

---

## 9. 驗收條件

Codex 完工後必須提供：

1. `CURRENT` 的更新 diff。
2. V4.0 → CURRENT 的逐段來源對照表。
3. 未回灌內容及原因。
4. V4.0 archive 移動紀錄。
5. 固定公開入口檔案。
6. Boot 唯一入口更新。
7. Temporal schema。
8. 全儲存庫搜尋結果，證明沒有其他檔案宣稱 `SOURCE_OF_TRUTH: TRUE` 的物理主憲章。
9. 全儲存庫搜尋結果，列出仍引用 V4.0 版本檔名的地方並修正。
10. 不得修改 KGEN 已部署 Token 合約規則，除非另有獨立明確任務。

---

## 10. 2026-08-09 Codex 回班施工順序

```text
1. 先讀本文件
2. 再讀 CURRENT
3. 比對 V4.0 FINAL
4. 產生 reconciliation report
5. 回灌正式規則至 CURRENT
6. 封存 V4.0
7. 建立固定公開 CURRENT 白皮書入口
8. 更新 Boot 索引
9. 建立 Temporal schema
10. 提交完整 diff 與衝突搜尋結果
```

在 2026-08-09 之前，ChatGPT 與 Father 只負責研究、定義、撰寫文件及寫入 GitHub；不得假裝 Codex 已完成程式施工。

---

## 11. 最終天條

```text
GitHub main is the only live project source.
CURRENT is the only live KGEN physics constitution.
Version numbers belong inside CURRENT, not in competing canonical filenames.
Public whitepapers derive from CURRENT and never outrank it.
Archive preserves history but never controls implementation.
Time acceleration may accelerate computation, not create free civilization.
```
