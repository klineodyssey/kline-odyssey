# K11520｜一圖一生命：數位牛創生交易＋XYZ 會合 V2（獨立候選）

- Human 2026-10-18 最新玩法：買方在 K11520 的指定局部 `x,y,z` 開創造一隻牛的買單；萬獸生命公司或點位建造者提賣價、雙方決定成交價，賣方帶一份數位牛創生包抵達相同 Point ID 與局部 XYZ；先跟怪／反向打怪／硬幹、施工滿時間、買方驗貨驗收，再**只產生一隻**數位牛，出現在遊戲場景、走向牧草、吃草與更新體力。
- 正典點位來源：`docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`，123 筆不同 Point ID／108 個不同 K 值。K11520 花果山 ID `P_11520p0_花果山_R36`；`x,y,z` 為點位內局部公尺坐標，不把 K11520 當成世界 Z=11520。
- `index.html` 是自含 123 點位 ID 快照的可單檔執行玩法；`market.mjs`、`cow.mjs` 提供純函式、可回歸測試的隔離引擎。`cow.test.mjs` 是可直接執行的 Node 回歸案例。無需連線到錢包即可觀察，正式 K11520 遊戲尚未接線。
- 賣方運送的是**創生材料／設計包**而非先有一隻真實牛又重新造一隻；如果以後要賣既有數位牛，應使用 `EXISTING_COW_TRANSFER`，不可重複鑄造。出生後 `COW-COW_001` 等為本地遊戲 World Entity ID，正式 Life ID **未核發**。
- 報價 BID/ASK/DEAL 與 KX/KY/KZ 金融市場不同；跟怪/硬幹是遊戲對戰，不自動送 BTC/ETH/BNB 金融訂單。V1 K 間移動是遊戲時間步進與直線模擬，不是真實 GPS/路徑。場景本地會合證據目前也是明確標注的模擬，不可冒充真實到站。
- 可用本機 `localStorage` 保存牛的遊戲紀錄；無法作為真正鏈上資產、HR 身分或不可篡改所有權。牛尚未連到正式 WebGL 3D 骨架、草地資源與玩家生命伺服器。
- 真實 KAIOS/KGEN 付款需要先核對雙方已核准報價、可用資金、實際收款身分、託管（若存在）、鏈上收據與不可重放的結算；本候選一律顯示 `NO_ONCHAIN_SETTLEMENT`，沒有真實轉帳或生命核發。
- 禁止覆寫 #585 dot 三態 HUD、#607 GM 薪資工程、#523 HOLD；正式產品整合沿現有 #608/#570 與 `core/company` Owner，這個 Draft 不是主線部署／原 Writer 接管。

## 驗證

```bash
node --test KGEN-KAIOS/world-viewer/commerce/meeting-market-v2/cow.test.mjs
```

本輪隔離容器完整 V2 模組測試 **51/51 PASS**（含原 V1 22 個＋新 V2 29 個）。此 PR 內的 cow.test.mjs 是保留主要回歸案例的精簡版；不應將本地51件視為新 PR exact-head CI 的結果。真 Chromium 瀏覽器 390×844、844×390 導航測試 **BLOCKED_BY_ADMINISTRATOR**，未宣稱視覺 QA PASS。正式整合需要由具資格的原 Owner 進行 WebGL 和遊戲角色測試。

提交者：ChatGPT 本輪獨立有界候選，不代表衡曜 GM、dot 或數位螞蟻已 ACK／review。CRYPTOGRAPHIC_SIGNATURE=NOT_VERIFIED。
