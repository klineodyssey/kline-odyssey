# KGEN 12345 AI SOP V1.2

## 固定部署路徑

根目錄：
- `/12345.html`
- `/wallet-12345.html`

神殿主檔：
- `/K線西遊記/temples/12345/index.html`

12345 專屬模組：
- `/K線西遊記/temples/12345/modules/kgen-12345-v10.11-core.css`
- `/K線西遊記/temples/12345/modules/kgen-12345-v10.11-version.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-v10.11-panel-router.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-v10.11-holy-cup-simple.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-v10.11-stable-countdown.js`

## 禁止事項

1. 不可把 modules 放到根目錄 `/js/`。
2. 不可新增第二個右側神規面板；只能控制原本 `#coord-panel`。
3. 不可刪除跨年倒數槽；只能穩定更新文字。
4. 不可修改 Solidity 合約。
5. 不可只改檔名升版；必須同步 `VERSION / BUILD / README / SHA256`。

## 本版三聖盃規則

三聖盃是前端儀式 gate，不改合約。
- 不顯示 `0/3`、`1/3`、`2/3`、`3/3`。
- 使用者按三次聖盃後顯示「已通過，可進行 fortuneClaim 發財金」。

## 右側神規規則

右下「右側神規」按鈕只能控制原本長面板：
- 目標：`#coord-panel`
- 右上必須有「收合」按鈕。
- 不准新增小型神規面板。

## 節日活動規則

右上節日活動按鈕控制原本：
- `#kgen-v102-festival-panel`
- 面板右上必須有「收合」。
- 語音按鈕不得造成頁面錯誤。
