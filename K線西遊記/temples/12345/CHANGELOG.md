# CHANGELOG

## V10.44.0｜PrimeForge Mother Runtime Growth

- 以 V10.42.6 穩定母體為基礎，開始宇宙細胞培養。
- 新增 `modules/kgen-12345-mother-runtime.js`，作為 AI 母機導行層。
- 新增 `modules/kgen-12345-cell-registry.json`，管理核心細胞與正式資產戶口。
- 新增 `modules/kgen-12345-growth-policy.json`，定義一萬年航程生長法則。
- 新增 `MOTHER_RUNTIME.md`、`CELL_REGISTRY.md`、`GROWTH_LAW.md`。
- Mother Runtime 採 observer-only，不接管 UI 主神經、不破壞 V10.42.6 版面。
- 正式宣告 V10.43 方向為過重自檢器官，不作為本次生長母體。


## V10.42.6｜V10.2 Modular Asset Governance

- 將 V10.2 單檔 `index_12345_Heart_UI_V10_2_FESTIVAL_RUNTIME_LOCK.html` 升成 modules 結構。
- 新增 `modules/kgen-12345-core.css`。
- 新增 `modules/kgen-12345-runtime.js`。
- `index.html` 改為載入正式 module，不再把全部 CSS/JS 塞在單檔。
- 程式改綁正式定版資產：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
- 移除對 `wukong_heart_core.jpg`、`wukong_caishen.png` 的依賴。
- 每個新增/更動程式檔皆加入 FILE_CERTIFICATE，記錄出生、來源、版本、狀態。
