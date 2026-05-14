# KGEN 12345 悟空財神殿｜AI / Cursor 開發 SOP V1

## 0. 本檔案放置路徑

本 SOP 必須放在 GitHub Repo 內以下路徑：

```text
/K線西遊記/temples/12345/SOP/TEMPLE_12345_AI_SOP_V1.md
```

Cursor、Copilot、Autopilot、ChatGPT 或任何 AI 接手 12345 前端時，必須先閱讀本檔。

---

## 1. 12345 正式部署路徑

### 根目錄檔案

以下檔案放在 repo 根目錄：

```text
/12345.html
/wallet-12345.html
```

用途：

```text
/12345.html
```

為 GitHub Pages 英文路徑入口，可導向或承接 12345 神殿主頁。

```text
/wallet-12345.html
```

為錢包橋接入口，用於 MetaMask / DApp Browser 開啟 12345 神殿。

---

### 12345 神殿主檔

真正的 12345 悟空財神殿主頁放在：

```text
/K線西遊記/temples/12345/index.html
```

所有 12345 神殿 UI、HUD、操作面板、角色面板、按鈕群，皆以此檔為主。

---

## 2. 12345 modules 放置路徑

12345 專屬 JavaScript 模組必須放在：

```text
/K線西遊記/temples/12345/modules/
```

不可放在：

```text
/js/
/modules/
/assets/js/
```

除非該模組是全站共用模組，否則不得放到根目錄或 shared。

---

## 3. 建議模組命名規則

每個模組都必須帶版本號：

```text
holy-cup.v2.js
right-rule-panel.v1.js
festival-panel.v1.js
stable-countdown.v3.js
heart-panel.v1.js
message-log-lock.v1.js
```

禁止使用無版本檔名：

```text
holy-cup.js
festival-panel.js
stable-countdown.js
```

原因：未來 12345、16888、11520、108000 等神殿可能共用或分支使用不同版本。無版本檔名會造成覆蓋、誤用、回退混亂。

---

## 4. index.html 載入模組方式

因為 modules 位於：

```text
/K線西遊記/temples/12345/modules/
```

所以 `index.html` 內必須用相對路徑：

```html
<script src="./modules/holy-cup.v2.js"></script>
<script src="./modules/right-rule-panel.v1.js"></script>
<script src="./modules/festival-panel.v1.js"></script>
<script src="./modules/stable-countdown.v3.js"></script>
<script src="./modules/heart-panel.v1.js"></script>
<script src="./modules/message-log-lock.v1.js"></script>
```

禁止寫成：

```html
<script src="/js/holy-cup.v2.js"></script>
<script src="./js/holy-cup.v2.js"></script>
<script src="/modules/holy-cup.v2.js"></script>
```

這會造成 GitHub Pages 找不到檔案。

---

## 5. 版本治理規則

12345 版本只能升版，不能降版。

正確：

```text
V10.2 → V10.9 → V10.9.1 → V10.10
```

錯誤：

```text
V10.8 → V10.2.1
V10.9 → V10.8.7
```

即使使用舊版 V10.2 內容作為母版重修，輸出版本也必須繼續升版。

---

## 6. 嚴禁事項

AI / Cursor 不得做以下事情：

```text
1. 不得整個重寫 index.html。
2. 不得打掉原 12345 神殿 UI。
3. 不得刪右側按鈕群。
4. 不得刪悟空心臟區塊。
5. 不得刪右側神規區塊。
6. 不得刪節日活動槽位，避免版面錯位。
7. 不得刪跨年倒數槽位，若要修閃爍，只能修 timer，不可刪 DOM。
8. 不得改 Solidity 合約。
9. 不得改 KGEN_TempleHeart_V3_2_6.sol。
10. 不得把 12345 專屬 modules 放到根目錄 /js。
```

---

## 7. 合約生命規則

合約等於生命，前端等於神殿建築。

```text
KGEN_TempleHeart_V3_2_6.sol
```

為既有生命核心，不得因 UI 問題修改合約。

若需要新合約、新功能生命體，應另開新角色、新神殿、新寶塔、新地圖點位，不得回頭改 12345 Heart 生命核心。

---

## 8. 目前 12345 需要優先修的功能

### A. 右側神規

需求：

```text
右下「右側神規」按鈕必須能展開 / 收合右側神規面板。
面板右上角必須有收合按鈕。
不得登入後自動彈出。
不得蓋住右側按鈕群。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/right-rule-panel.v1.js
```

---

### B. 悟空心臟

需求：

```text
左下「悟空心臟」按鈕必須只控制悟空心臟區塊。
不得控制左上悟空財神殿控制台。
展開後文字不得溢出區塊外。
區塊底部要有足夠 padding。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/heart-panel.v1.js
```

---

### C. 節日活動

需求：

```text
右上節日活動按鍵保留。
位置放在右上訊息區下方或右側按鈕列最下方，不能擋其他按鈕。
點擊後展開原本節日活動面板。
面板右上角必須有收合按鈕。
不可刪除節日活動槽位，避免下方位置遞補造成錯位。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/festival-panel.v1.js
```

---

### D. 三聖盃

目前規則已簡化。

需求：

```text
不要再顯示 0/3、1/3、2/3、3/3。
改成使用者按三次「聖盃」或指定按鈕，即視為聖盃通過。
通過後顯示「聖盃已通過，可進行發財金流程」。
不得造成使用者以為是詐騙驗證或複雜檢查。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/holy-cup.v2.js
```

狀態可用 localStorage 保存：

```javascript
localStorage.setItem('kgen_12345_holy_cup_passed', 'true')
```

---

### E. 跨年倒數 / 倒數閃爍

需求：

```text
不得刪除跨年倒數槽位。
不得每秒 innerHTML 重建整個倒數區塊。
只能更新 textContent。
不得重複 setInterval。
只允許單一 Timer Manager。
若手機閃爍，優先改成每分鐘更新，不顯示秒數。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/stable-countdown.v3.js
```

錯誤寫法：

```javascript
setInterval(() => {
  box.innerHTML = `<div>${new Date()}</div>`;
}, 1000);
```

正確寫法：

```javascript
const target = document.querySelector('[data-countdown-text]');
if (target) target.textContent = nextText;
```

---

### F. 訊息欄跳動

需求：

```text
訊息欄固定高度。
內容超出時，內部滾動。
不得一直增加高度推擠下方區塊。
不得蓋住 8 大按鍵操作盤。
```

建議模組：

```text
/K線西遊記/temples/12345/modules/message-log-lock.v1.js
```

建議 CSS：

```css
.kgen-message-log,
#messageLog,
#systemLog {
  max-height: 160px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

---

## 9. GitHub Pages 路徑注意事項

GitHub Pages 網址：

```text
https://klineodyssey.github.io/kline-odyssey/12345.html
```

Temple 主體相對位置：

```text
/K線西遊記/temples/12345/index.html
```

若 `12345.html` 是橋接頁，應導向：

```text
./K線西遊記/temples/12345/index.html
```

或使用 repo 實際相對路徑，不得寫死錯誤 `/js/`。

---

## 10. 每次交付必須附路徑表

每次 AI 產出 zip 或程式修改，都必須附：

```text
根目錄：
/12345.html
/wallet-12345.html

神殿主檔：
/K線西遊記/temples/12345/index.html

12345 專屬 modules：
/K線西遊記/temples/12345/modules/xxx.vN.js

SOP：
/K線西遊記/temples/12345/SOP/TEMPLE_12345_AI_SOP_V1.md
```

沒有路徑表的交付視為不完整。

---

## 11. Cursor / AI 開工前必讀檢查表

開工前先確認：

```text
1. 目前母版是哪一版？
2. 是否保留原 12345 神殿 UI？
3. 是否不動合約？
4. 是否保留右側按鈕群？
5. 是否保留跨年倒數槽位？
6. 是否保留節日活動槽位？
7. modules 是否放在 /K線西遊記/temples/12345/modules/？
8. script src 是否使用 ./modules/xxx.vN.js？
9. 版本號是否只升不降？
10. 修改後是否手機測試右側神規、悟空心臟、節日活動、聖盃、倒數、訊息欄？
```

---

## 12. 12345 正確開發原則

```text
不要再補丁疊補丁。
不要再整廟打掉重蓋。
不要再只改檔名升版。
不要再刪槽位造成錯位。
不要再用同名 function 覆蓋原功能。
```

正確方式：

```text
保留原神殿。
新增版本化 module。
精準接線。
小範圍修復。
每次附路徑。
每次驗證手機畫面。
```

---

## 13. 最新建議下一版

下一版建議版本：

```text
KGEN_12345_V10_9_1_ORIGINAL_TEMPLE_MODULE_PATH_FIX
```

目標：

```text
從 V10.2 母版重修，不沿用 V10.3 ~ V10.8 污染補丁。
建立 modules 資料夾。
補上本 SOP。
只修五大問題：右側神規、悟空心臟、節日活動、三聖盃、倒數與訊息欄。
```
