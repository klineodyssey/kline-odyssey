# KAIOS V8.0 Asset Lifecycle

**Purpose:** 定義土地、民宅、神殿、商業與文明節點的正式演化階層。

## Lifecycle

```text
Wild Land
→ Claimed Land
→ Developed Land
→ Residence
→ Store
→ Market
→ Bank
→ Exchange
→ Temple Service Node
→ City Node
→ Civilization Node
→ Cross-Universe Node
```

## Stage Matrix

| Stage | Entry Conditions | Required Assets | Required WorkOrders | Upgrade Cost Model | Runtime Modules | AI Capabilities | Economic Rights | Governance Rights | Trading Rights | Rental Rights | Real-World Link | Exit / Recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wild Land | 未開發座標或探索結果 | coordinate, map reference | V8-P4 Land Runtime | 探索成本、時間成本 | land schema | 推薦分區 | 無或低 | 無 | 可探索後轉讓 | 無 | 無 | 回到探索池 |
| Claimed Land | 玩家取得建設權 | land_id, owner | zoning, permission | KGEN 模擬建設成本 | land runtime | 分區建議 | 基礎使用權 | 土地治理申請 | 可交易/轉讓 | 可出租 | 可建立地址映射 | 爭議回復/凍結 |
| Developed Land | 完成開發許可 | land + zoning | residence plan | 建設資源、時間 | building runtime | 建築建議 | 建設收益權 | 分區投票 | 可出售 | 可租 | 可接門牌 | 降級為 Claimed Land |
| Residence | 一土地一民宅 | building_id, residence_id | residence/store choice | 裝修、功能器官 | residence schema | 用途分類 | 居住/服務收益 | 居民治理 | 可交易 | 可租 | 可成虛擬據點 | 拆除/重建 |
| Store | 民宅演化商店 | catalog, payment boundary | business adapter | 庫存、貨架、服務 | business runtime | 商品推薦 | 商業收益 | 商圈治理 | 商品/服務交易 | 店面租賃 | 可接實體商家 | 回到 Residence |
| Market | 多商店聚合 | stores, listings | marketplace rules | listing fee | listing runtime | 價格輔助 | 市場手續費 | 審核權 | 上市買賣 | 攤位租賃 | 可接商場 | 暫停上市 |
| Bank | 金庫與信用模擬 | treasury, account | bank runtime | 準備金、風控成本 | bank runtime | 風險評分 | 模擬存貸收益 | 風控治理 | 金融商品需合規 | 不適用 | 需合法機構 | 風險凍結 |
| Exchange | 花果山交易所節點 | order, settlement | 11520 runtime | 撮合、清算成本 | exchange runtime | 反詐與推薦 | 交易費 | 上市治理 | 資產交易 | 資產租賃 | RWA 需合規 | 下架/爭議 |
| Temple Service Node | 商業服務神殿化 | temple, service organs | temple runtime | 香火/維運成本 | temple + AI | 祭祀/客服/治理 | 服務收益 | 神殿治理 | 神殿服務交易 | 場域租賃 | 可接實體信仰/服務 | 降級為 Store |
| City Node | 多節點治理 | bank, exchange, temple | city governance | 公共建設 | governance runtime | 城市規劃 | 稅收/公共收益 | 城市投票 | 城市市場 | 土地租賃 | 城市商圈 | 災害恢復 |
| Civilization Node | 完整文明核心 | city nodes, tech | civilization upgrade | 科技與防禦成本 | COS governance | 科技路線 | 文明收益 | 文明治理 | 跨城交易 | 領土租賃 | 跨域商業 | 戰後重建 |
| Cross-Universe Node | 文明可跨域 | portal, universe map | portal expansion | 傳送與安全成本 | cosmic OS | 跨宇宙導航 | 跨域收益 | 宇宙治理 | 跨宇宙交易 | 跨域租賃 | 國際/跨域合規 | 回到文明節點 |

## Upgrade Principles

- 每次升級都要產生可審核 WorkOrder。
- 涉及真實金流、金融、品牌或證券時，必須加入 Legal Review Required。
- 降級、凍結、爭議、災害恢復都不得刪除歷史紀錄。
- 交易權與治理權分開定義，不能因持有外觀圖像而自動獲得受監管權利。