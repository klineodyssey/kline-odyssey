# KGEN 12345 CHANGELOG

## V10.44.2｜FESTIVAL HEART CLOCK + RECORDING SYNC
- 修復錄影器官：REC 秒數與 app.recMMSS 同步，錄影 HUD / 按鈕 / export-canvas 均顯示實際錄影時間。
- 建立節日單心跳：520 / 1111 / 跨年共用 Festival Heart Clock，跨年倒數改為分鐘級穩定顯示，避免秒級抽搐閃爍。
- 隔離舊倒數神經：自動隱藏舊版重複 countdown / ny-countdown / cd-1231 節點，避免多重心臟同時跳。
- 節日細胞右側停靠：固定為 360px 寬，收合後只保留可按標題，不再壓住 USDT / KGEN 兌換區。
- 不新增深層資料夾；不改正式資產名；維持 V10.42.6 母體可繼續生長。

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

## V10.44.1｜DIVINE REGENERATION RECORDING CELL

- 新增神級再生器官：`modules/kgen-12345-divine-regeneration.js`。
- 新增神級再生樣式：`modules/kgen-12345-divine-regeneration.css`。
- 修復錄影/拍照身份誤顯示 16888 的問題，改為 12345 五指山悟空財神殿。
- 修復底部錄影按鍵接到舊版殘廢器官的問題，統一接到 `KGEN_12345_RECORDING`。
- 520 / 1111 / 跨年活動改成可收合 Festival Organ Cell。
- 跨年倒數改成穩定顯示，避免每秒閃爍抽搐。
- 不新增深層資料夾，不更改正式資產檔名。
