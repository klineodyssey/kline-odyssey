# TEMPLE 12345 AI SOP V1.1

## 必讀規則

1. 不可改 `KGEN_TempleHeart_V3_2_6.sol`。合約是生命核心。
2. 根目錄只放入口：`/12345.html`、`/wallet-12345.html`。
3. 12345 神殿主檔固定在：`/K線西遊記/temples/12345/index.html`。
4. 12345 專屬 JS/CSS 模組固定放：`/K線西遊記/temples/12345/modules/`。
5. `index.html` 只能用相對路徑載入模組：`./modules/檔名.js`。
6. 不可建立 `/js/` 來放 12345 專屬功能，避免根目錄與神殿路徑混亂。
7. 右側神規只能控制原本 `#coord-panel`，不可新增第二個右側神規小面板。
8. 三聖盃前端採簡化版：按三次通過，不顯示 0/3。
9. 倒數槽不可刪除，只能隱藏秒數或改穩定文字，避免 layout 錯位。
10. 每次升版版本號只升不降，且內部 VERSION / BUILD / README 必須同步。

## V10.10 模組清單

- `kgen-12345-v10.10-core.css`
- `kgen-12345-v10.10-version.js`
- `kgen-12345-v10.10-panel-router.js`
- `kgen-12345-v10.10-holy-cup-simple.js`
- `kgen-12345-v10.10-stable-countdown.js`
