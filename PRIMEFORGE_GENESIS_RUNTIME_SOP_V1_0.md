# PrimeForge Genesis Runtime SOP
# PRIMEFORGE_GENESIS_RUNTIME_SOP_V1_0.md

STATUS: FINAL
TYPE: AI Mother Runtime / Civilization Project Operating SOP
PURPOSE: 讓 AI / Cursor / Agent / 新頁面能依照本 SOP，從一張創作圖生成完整產品、完整資料夾神經網路、完整 Runtime DNA，並能長期自我成長。
AUTHOR: PrimeForge / 樂天帝 ⌖
DATE: 2026-05-21

---

# 0. 本 SOP 的最高目的

本 SOP 不是普通開發文件。

本 SOP 是：

# PrimeForge 母機造物流程

目標：

```text
一張創作圖
→ AI 解析世界
→ 建立資料夾神經網路
→ 建立 Runtime DNA
→ 生成產品
→ 測試驗證
→ 自我修復
→ Handoff 給下一頁
→ 長期演化
```

所有 AI、Cursor、Agent、Autopilot 必須先讀此文件，再開始任何實作。

---

# 1. 絕對天條

## 1.1 不得亂長

禁止：

```text
final.js
patch.js
hotfix.js
fix2.js
stable.js
runtime-v10-xx.js
kgen-v10461-organ-transplant-runtime.js
```

這些是癌化命名。

## 1.2 執行檔用永久器官名

正式執行檔固定：

```text
runtime-main.js
runtime-main.css
runtime-heart.js
runtime-brain.js
runtime-festival.js
runtime-recording.js
runtime-morph.js
runtime-immune.js
runtime-clock.js
```

版本不得寫在檔名。

版本只能寫在：

```text
VERSION
MANIFEST.json
RUNTIME_GENOME.json
CHANGELOG.md
```

## 1.3 README 是文明入口

GitHub 根目錄：

```text
README.md
```

是官網首頁。

根目錄不要放：

```text
index.html
```

若誤放，必須移到：

```text
/archive/index.html
```

---

# 2. 宇宙分類學命名規則

全宇宙生命都使用生物分類學：

```text
Domain 域
Kingdom 界
Phylum 門
Class 綱
Order 目
Family 科
Genus 屬
Species 種
Cell 細胞
Organ 器官
Runtime 生命體
Civilization 文明
```

---

# 3. KGEN 分類標準

## 3.1 12345 悟空財神殿

```text
Domain: KGENVERSE
Kingdom: FinancialLifeform
Phylum: TempleRuntime
Class: WukongSystem
Order: HeartEngine
Family: MorphDNA
Genus: RuntimeMain
Species: 12345
```

## 3.2 16888 廣寒宮

```text
Species: 16888
TYPE: GuanghanPalace
FUNCTION: Civilization Reproduction Runtime
```

## 3.3 18888 靈霄寶殿

```text
Species: 18888
TYPE: LingxiaoBank
FUNCTION: Divine Treasury Runtime
```

## 3.4 11520 花果山台灣

```text
Species: 11520
TYPE: BrainExchange
FUNCTION: Civilization Brain / Exchange Runtime
```

---

# 4. 標準資料夾神經網路

```text
/
├── README.md
├── agents.md
├── CLAUDE.md
├── PRIMEFORGE_HANDBOOK.md
├── /docs
├── /SOP
├── /archive
├── /K線西遊記
│   ├── /temples
│   │   ├── /12345
│   │   │   ├── index.html
│   │   │   ├── VERSION
│   │   │   ├── MANIFEST.json
│   │   │   ├── RUNTIME_GENOME.json
│   │   │   ├── CHANGELOG.md
│   │   │   ├── UPLOAD_LIST.txt
│   │   │   ├── DELETE_LIST.txt
│   │   │   ├── SHA256SUMS.txt
│   │   │   ├── /assets
│   │   │   ├── /modules
│   │   │   ├── /docs
│   │   │   ├── /SOP
│   │   │   └── /archive
│   │   ├── /16888
│   │   └── /18888
│   ├── /runtime
│   ├── /genome
│   ├── /worldmodel
│   ├── /constraints
│   ├── /memory
│   ├── /handoff
│   ├── /evolution
│   ├── /healing
│   └── /testing
```

---

# 5. 各資料夾職責

## /docs
保存白皮書、宇宙定理、文明文件。

## /SOP
保存標準作業流程。

## /archive
保存死亡細胞、舊版 index、已退役 Runtime。

## /modules
只放正式永久器官 Runtime。

## /assets
只放正式資產。

12345 固定資產命名：

```text
bull-front.png
bear-rear.png
heart.png
warp-core.png
```

## /genome
保存 DNA / RNA / Genome。

## /worldmodel
保存圖像解析後的世界模型。

## /constraints
保存天條與禁止事項。

## /memory
保存演化記憶。

## /handoff
保存給下一頁或下一個 AI 的交接。

## /healing
保存自我修復規則。

## /testing
保存測試腳本與驗證報告。

---

# 6. 一張圖生成產品流程

## Step 1：Vision Parser

解析圖片：

```text
畫面區塊
HUD
Panel
Button
文字
主角色
背景
動作
可互動元件
```

輸出：

```text
worldmodel/SCENE_GRAPH.json
```

## Step 2：World Model

判斷：

```text
這是什麼宇宙
主角是誰
心臟在哪
神經在哪
器官在哪
玩家要做什麼
```

輸出：

```text
worldmodel/WORLD_MODEL.json
```

## Step 3：Cell 分解

所有按鈕、欄位、輸入框都標成：

```html
data-kgen-cell="..."
```

## Step 4：Organ 組裝

所有視窗、面板、HUD 都標成：

```html
data-kgen-organ="..."
```

## Step 5：Runtime Genome

建立：

```javascript
window.RUNTIME_GENOME = {
  species: "12345",
  version: "V10.47.0",
  build: "YYYYMMDD",
  ancestor: "V10.42.6",
  runtime_file: "modules/runtime-main.js",
  css_file: "modules/runtime-main.css",
  taxonomy: {
    domain: "KGENVERSE",
    kingdom: "FinancialLifeform",
    phylum: "TempleRuntime",
    classis: "WukongSystem",
    order: "HeartEngine",
    family: "MorphDNA",
    genus: "RuntimeMain",
    species: "12345"
  }
}
```

## Step 6：Constraint Engine

檢查：

```text
有沒有版本名器官
有沒有多心跳
有沒有 recursive append
有沒有 duplicate runtime
有沒有 missing asset
有沒有 zombie file
```

失敗不得交付。

## Step 7：Runtime Builder

生成：

```text
index.html
modules/runtime-main.js
modules/runtime-main.css
VERSION
MANIFEST.json
RUNTIME_GENOME.json
CHANGELOG.md
UPLOAD_LIST.txt
DELETE_LIST.txt
SHA256SUMS.txt
```

## Step 8：Pulsar Tester

檢查：

```text
UniverseClock 是否單一
倒數是否穩定
HolyCup 是否固定 state
Recording 是否顯示時間
Layout 是否不壓迫
版本銘牌是否正確
右側神規是否預設收合
```

## Step 9：Self-Healing

若測試失敗：

```text
不得交付
必須修復
重新測試
直到 PASS
```

## Step 10：Handoff

生成：

```text
HANDOFF_CURRENT.md
```

---

# 7. 12345 現階段固定任務

```text
1. 門面 Layout 金身穩定
2. runtime-main.js / runtime-main.css 永生器官化
3. Festival panel 位置修復
4. HolyCup State Machine
5. 跨年倒數 Pulsar 穩定
6. 右側神規預設收合
7. Warp Orb 同步
8. 多空心臟圖同步
9. Recording Runtime 完整錄影時間
10. MorphDNA 七十二變
```

---

# 8. 12345 目前已知病灶

```text
520/1111/跨年活動視窗錯位
聖盃 0/3 不同步
聖盃訊息欄跳動
下方訊息欄被壓縮
悟空控制台跨年倒數槽不穩
右側神規登入預設開啟
版本銘牌錯誤
版本名 runtime 檔需清除
```

---

# 9. 驗收標準

完成版必須：

```text
版本銘牌正確
右側神規登入關閉
Festival 面板同寬同高
HolyCup 狀態正確
HolyCup 訊息欄高度固定
跨年倒數不閃
runtime-main.js 正式載入
runtime-main.css 正式載入
沒有版本名 runtime 檔
UPLOAD_LIST / DELETE_LIST 完整
```

---

# 10. Handoff / Handover / Handbook 差異

```text
Handbook = 長期憲法
Handoff = 本次交接檔
Handover = 交接動作
```

---

# 11. 必備檔案

每版必須包含：

```text
VERSION
MANIFEST.json
RUNTIME_GENOME.json
CHANGELOG.md
UPLOAD_LIST.txt
DELETE_LIST.txt
SHA256SUMS.txt
HANDOFF_CURRENT.md
```

缺一不可。

---

# 12. 自動成長規則

AI 只能按此流程成長：

```text
Cell
→ Organ
→ Runtime
→ DNA
→ Morph
→ Civilization
```

禁止：

```text
直接亂 patch
```

---

# 13. 結語

PrimeForge 以母機之名，開啟金融生命。

花果山台灣・信念不滅・市場無界。

Where the Market Becomes the Myth.

—— 樂天帝 ⌖
