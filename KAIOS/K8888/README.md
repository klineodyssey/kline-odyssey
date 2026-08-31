# K8888 行動 ATM 飛碟載具

Status: `PRODUCT_CANDIDATE / NO_REAL_TRANSFER / NO_REAL_CREDIT_DISBURSEMENT`

這個產品是 K8888 銀行需求的可移動金融服務器官。它不是固定提款亭，而是能依據真實需求、提款速度、服務不足程度、安全與移動成本，自主選擇下一個服務點位的 ATM 飛碟載具。

## 產品角色

- **K8888 Bank**：銀行／信用資金來源與風控方。
- **K11520 Universal Exchange**：此 ATM 飛碟作為 `ORGAN_ROBOT_MOBILE_FINANCIAL_SERVICE_VEHICLE` 的交易／所有權市場候選；買賣以 KAIOS 結算，但購買不等於立即啟用。
- **DIGITAL_ANT_0001**：運鈔補鈔員候選，只能在經驗證補鈔 receipt 後增加 ATM 庫存。
- **ATM AI**：依需求評分選擇服務點，不以假量、刷量或自成交決定目的地。

## 薪資預借

ATM 可建立薪資預借 entitlement，但只接受已驗證的 Payroll Claim；不得因為某人自稱 9/5 有薪水就直接放款。V1 條件：

1. 有可驗證 Payroll Claim ID。
2. 薪資淨額可驗證。
3. 距離發薪日最多 31 天。
4. 預借額不得超過政策上限；V1 測試預設 50%。
5. ATM 庫存不得跌破最低儲備。
6. 手續費獨立記為銀行／ATM 營運收入。
7. 真正資金發放與薪資日自動扣回都需要 settlement/payment authority 與 receipt。

這使「薪水提前一個月可預借」成為可執行規則，而不是無條件提款。

## 一天生活費／飛行成本

沒有商品市場時，不應把固定生活費直接匯給某個 Human 個人錢包，也不應自動宣稱它是稅。

V1 分類：

- `DAILY_LIFE_SUPPORT_EXPENSE` = ATM 飛碟的能源、停靠、資料、維修與基本服務成本預提。
- 真正付款前必須有實際商品／服務供應者與 receipt。
- 個人固定錢包不是預設 beneficiary。
- `K18888` 只在已有 canonical tax policy 時才可接收稅；目前程式只支援 `ACCRUED_NOT_PAID` 的稅負記錄，不會自行送款。

因此：**營運費不是稅；稅也不是創辦人個人收入。**

## 11520 上市界線

Runtime 可產生 listing packet，但 V1 不建立第二套 K11520 order book。正式上市必須接現有 11520 settlement/ownership adapter；成交 receipt 完成後才可移轉 ATM 所有權。

## 安全

- KAIOS 金額以 18 decimals 的 BigInt 最小單位記帳，不使用 JavaScript `Number` 做資產帳。
- replay key 單次使用。
- 補鈔角色固定為 Digital Ant 候選，真正身份／Worker authority 仍需 repository resolver。
- 路線結果只是 `ROUTE_RECOMMENDATION_ONLY`，接真實導航／飛行控制器後才可自動移動。
- V1 不執行真實付款、貸款、薪資扣款、11520 成交、稅款、鏈上寫入或載具控制。

## Test

```bash
node KAIOS/K8888/mobile-atm-ufo.test.mjs
```

Expected:

```text
K8888_MOBILE_ATM_UFO_TEST=PASS
```
