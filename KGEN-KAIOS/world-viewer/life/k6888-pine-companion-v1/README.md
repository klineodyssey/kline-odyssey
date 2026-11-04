# K6888 松樹國・萬獸伴侶生命 R0 候選

狀態：獨立可玩候選（未併入 K11520、尚未在正式網站啟用）；非 Mainnet、非完整 Life Runtime。

來源：UniverseMap V10.2 既有 `P_6888p0_松樹國_R26`；V10.3 canonical_overrides 與合併 PR #574 的 AU 劇情。原著《西遊記》第二回只說孫悟空在師兄要求下變松樹、炫技而遭菩提祖師遣回花果山；「插樹為旗／自立松樹國」是 KAIOS AU 改編，不代表真實土地權狀。

本候選包含：插松樹旗一次、鵝雞狗虎豹象魚遊戲生命候選、觸控選取、FOLLOW/GUARD/HARD_FIGHT/ROAM/STAY 5 行為、簡單 deterministic local XY 移動、三種地球人語言風格解析、記憶事件及本機刷新恢復、賣/放生/繁殖/宰殺的**非真實**產品資格預覽。

重要限制：沒有正式 Life ID、照片章、真實物種認證、語音辨識／麥克風、K300/K5 數字語轉譯、遠端多人同步、經濟結算、實際攻擊受傷、正式土地登記，也沒有 BTC/ETH/BNB 真正交易。K300/K5 沒有已整合版本字典會拒絕解析。animalTradePreview 不會改變真實資產、交易、生命出生或死亡。現有 K11520 `life-visual-factory.mjs` 有 CHICKEN/DUCK/FISH/TREE 等外形，`monster-aggression-runtime.mjs` 只有敵方 chase/contact damage，未證實已有主人點選→跨次保存的寵物自主行為。

測試：在 Node >=18 執行 `node --test runtime.test.mjs`。HTML 用 `index.html` 搭配同目錄的 `runtime.mjs`，在支援 JS module 的網頁伺服器開啟；不能直接把模擬畫面視為真瀏覽器 QA。

工程邊界：本候選 isolated scope，不修改 #585 dot 的三態 HUD 分支或舊 K6888 點位 ID。原地圖主權是 AU 劇情；動物生命身份、遊戲財產、管理權、繁殖／放生／宰售權及金融交易資格分離。
