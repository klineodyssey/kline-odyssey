# K4168 奈何橋 / 孟婆生命啟動系統

Status: `PRODUCT_CANDIDATE / NO_REAL_TRANSFER`

K4168 **奈何橋是通行與判定節點，不是水庫**。水庫為獨立 `K4168-RESERVOIR`。孟婆是 Vault Keeper / Life Activation Gatekeeper。

## 核心資產角色

- **BNB = 孟婆湯**：只補足生命錢包的最低可運作 Gas，不是救濟金、致富金或地主資本。
- **KGEN / KAIOS = 文明身份與經濟證據**：可作為 Civilization Membership Evidence，但不能單獨取代 Life ID 與 Wallet Signature。
- **工作 / 創作 / 服務 = 取得財富的主要道路**：沒有資產不等於失敗；可以搬磚、派廣告、工作、創作與經營後自行賺取 KAIOS/KGEN。

## 流程

`花果山 BNB 資金源 → K4168-RESERVOIR → 孟婆 → 奈何橋身份/前世記憶 Gate → 計算 Gas 缺口 → 最小 BNB entitlement → verified settlement receipt → Life wallet 可活動`

若錢包已達最低 Gas 目標，孟婆不再給湯。

## 身份與「前世記憶」

身份判定使用多訊號：

`Life ID + Wallet Control Proof + KGEN/KAIOS Holding History + Civilization Activity + Previous-Life Memory`

大量領取獎勵後快速賣出、沒有文明活動並消失，可標記為 `EXTERNAL_EXTRACTIVE_VISITOR_RISK` 並進入 `QUARANTINE`，但不得只因一次正常賣出就永久黑名單。正式 `DENY` 需要 evidence-bound blacklist reason。

## 安全規則

1. 孟婆湯資產只有 `BNB`。
2. 水庫與奈何橋分離。
3. Deposit 必須有 verified receipt 與 replay key。
4. 配湯不得突破最低水位與每日 BNB outflow cap。
5. Replay key 單次使用。
6. `MENG_PO_SOUP` 只產生 `ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT`，沒有 receipt 不得標成已付款。
7. Employer 可以另行 sponsor Gas，但仍需獨立來源與帳務目的 `EMPLOYER_SPONSORED_GAS`。
8. 孟婆的 Matter → Dark Matter 能力仍是 fail-closed entitlement；沒有 conversion receipt 不宣稱暗物質已完成。
9. 真實花果山放水需要已驗證 signer/payment rail/receipt；本 PR 不送 Mainnet 交易。

## 世界題詞

> 君不見，黃河之水天上來，奔流到海不復回。

## Test

```bash
node KAIOS/K4168/naihe-vault.test.mjs
```

Expected:

```text
K4168_NAIHE_VAULT_TEST=PASS
```
