# CHANGELOG

## V10.42.6｜V10.2 Modular Asset Governance

- 將 V10.2 單檔 `index_12345_Heart_UI_V10_2_FESTIVAL_RUNTIME_LOCK.html` 升成 modules 結構。
- 新增 `modules/kgen-12345-core.css`。
- 新增 `modules/kgen-12345-runtime.js`。
- `index.html` 改為載入正式 module，不再把全部 CSS/JS 塞在單檔。
- 程式改綁正式定版資產：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
- 移除對 `wukong_heart_core.jpg`、`wukong_caishen.png` 的依賴。
- 每個新增/更動程式檔皆加入 FILE_CERTIFICATE，記錄出生、來源、版本、狀態。
