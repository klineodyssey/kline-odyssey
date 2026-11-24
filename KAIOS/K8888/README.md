# K8888 行動 ATM 飛碟載具

Status: `PRODUCT_CANDIDATE / NO_REAL_TRANSFER / NO_REAL_CREDIT_DISBURSEMENT`

這個產品是 K8888 銀行需求的可移動金融服務生命／器官。它不是固定提款亭，而是能依據真實需求、提款速度、服務不足程度、換幣需求、送鈔需求、安全與移動成本，自主選擇下一個服務點位的 ATM 飛碟載具。

## 完整金融功能

V1.1 不再只有提款與薪資預借，新增：

- KAIOS / KGEN 存款 entitlement。
- K8888 信用貸款 entitlement。
- 已驗證 Payroll Claim 的薪資提前預借。
- KGEN → KAIOS 換幣。
- Digital Ant 補鈔。
- 自主選點與送鈔／運鈔利潤評估。
- ATM 自己的 Life ID 與 heartbeat。
- K11520 Organ Robot 上市封包。

所有 entitlement 都必須在真正 settlement receipt 後才能標成已付款／已換幣／已放款。

## 換幣設計：1 KGEN 換多少 KAIOS？

`500` 與 `800 KAIOS / KGEN` 在 V1.1 是 **fallback candidate band，不是 KGEN 的正典固定價格**。

報價優先順序：

1. 若有可信 K11520／已驗證市場參考價，使用市場參考價。
2. 若玩家「許願」希望某個 KAIOS/KGEN 比率，ATM 可以接受，但只能在政策帶內；測試帶為 500–800。
3. 若都沒有，由 ATM 根據驗證需求分數在 500–800 間形成 fallback reference quote。
4. ATM 再扣自己的 exchange spread，形成實際 payout quote。

目前測試 spread = 2.5%。因此：

- Reference 800 → 玩家實收 780 KAIOS；20 KAIOS 是 ATM spread revenue。
- Reference 500 → 玩家實收 487.5 KAIOS；12.5 KAIOS 是 ATM spread revenue。

這樣 ATM 不是憑空送 800，而是有 spread 才能支付生命運作、維修與虧損風險。

## 為什麼會賺錢／賠錢？

ATM 的收益來源：

- 提款手續費。
- 薪資預借服務費。
- 一般貸款 finance charge。
- KGEN/KAIOS 換幣 spread。
- 驗證後的送鈔／運鈔 freight fee。

ATM 的成本：

- 每日生命維持／飛行／維修成本。
- 真實旅程成本。
- 資金成本與壞帳。
- KGEN/KAIOS 庫存價格風險。
- 必要稅費（只有 canonical tax policy 才能計入 K18888）。

舉例：ATM 收到 1 KGEN，Reference 800、實付 780 KAIOS，帳上先形成 20 KAIOS spread。若它再承接一趟 800 KAIOS 送鈔任務，base freight 50、需求高時 demand premium 可增加，但若飛行成本高於 freight revenue，就應拒絕該趟，不為了跑量而送。

所以真正的單趟損益是：

`換幣 spread + 服務費 + freight revenue - 飛行成本 - 生命成本 - 壞帳/資金成本 - 稅`

沒有可靠 KGEN 公允價時，不把手上 KGEN 未實現升值灌進營收；只記庫存。

## 「還願」與送貨

玩家拿 1 KGEN 換到 KAIOS 後，KAIOS 是玩家自己的；玩家可以直接留下，也可以選擇委託 ATM／Digital Ant 送貨。

「還願」在產品上應理解為一份 **自願的 verified delivery / deposit contract**，不能因為曾經許願就強制把 800 KAIOS收回。若某個節點真的需要 800 KAIOS 鈔票，ATM 可比較各地 freight profit 後決定是否承運；真正到貨後才憑 receipt 收運費。

## ATM 是生命

ATM 有獨立 `lifeId` 與 heartbeat 計數。heartbeat 只表示生命／服務 runtime 活動證據，不代表鏈上付款或資產增加。

## K8888 / 11520 / K18888 分工

- **K8888 Bank**：銀行資金、信用政策、貸款／預借來源。
- **K11520 Universal Exchange**：ATM 本體 Organ Robot 的買賣市場，也可作為已驗證換幣價格來源；不建立第二套 order book。
- **K18888**：只有正式 canonical tax policy 存在時才收稅。ATM 營運收入不直接匯給 Human 個人錢包。
- **DIGITAL_ANT_0001**：補鈔／運鈔角色候選，真正權限仍需 repository resolver。

## 安全

- KGEN/KAIOS 使用 18 decimals BigInt 精確記帳。
- replay key 單次使用。
- customer wish 不是市場真價；只能形成 bounded quote。
- 沒有 settlement receipt 不宣稱存款、換幣、貸款、還款、送貨完成。
- 路線結果只是 `ROUTE_RECOMMENDATION_ONLY`，尚未控制真實飛行器。
- 不執行真實付款、稅款、11520 成交、鏈上寫入或載具控制。

## Test

```bash
node KAIOS/K8888/mobile-atm-ufo.test.mjs
```

Expected:

```text
K8888_MOBILE_ATM_UFO_TEST=PASS
```
