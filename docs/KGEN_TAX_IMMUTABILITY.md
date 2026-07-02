# KGEN Token 稅率不可變性說明

> **合約：** `KGEN_Token_V7_5_2`（`KGEN/contracts/KGEN_Token_V7_5_2.sol`）  
> **鏈上地址（BSC）：** `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`  
> **政策：** 稅率（bps）在部署後永久固定；**不得**為通過 DappBay 等掃描器而重新加入 tax setter 或重新部署。

---

## 結論

| 項目 | 狀態 |
|------|------|
| 稅率（% / bps）是否可改 | **否 — 編譯期 `constant`，鏈上無 setter** |
| `setTax` / `updateTax` / `setFees` / `updateFees` | **不存在** |
| Owner 能否調高/調低買賣稅率 | **否** |
| Owner 能否改稅收「去向錢包」 | 是（`setTaxWallets`，不影響 bps） |
| Owner 能否改免稅名單 / AMM 對 | 是（`setTaxExempt` / `setMarketMakerPair`） |

---

## 固定稅率（Immutable Constants）

下列變數在合約中宣告為 `uint16 public constant`，寫入 bytecode 後**無法**被任何函式（含 `onlyOwner`）修改：

| 常數 | 值 (bps) | 比例 |
|------|----------|------|
| `TAX_BPS_TOTAL` | 30 | 0.30% |
| `TAX_BPS_BURN` | 10 | 0.10%（銷毀至 `address(0)`） |
| `TAX_BPS_BANK` | 10 | 0.10% |
| `TAX_BPS_REWARD` | 5 | 0.05% |
| `TAX_BPS_AUTOLP` | 5 | 0.05% |

建構子僅驗證四項子稅之和等於總稅（`TaxBpsMismatch`），**不**接受外部傳入稅率參數。

實際扣稅邏輯在 `_update()` 中一律使用上述常數計算：

```solidity
uint256 taxTotal = (value * TAX_BPS_TOTAL) / 10_000;
uint256 taxBurn   = (value * TAX_BPS_BURN)   / 10_000;
// ...
```

---

## 稅率相關函數清單

### 不存在（設計上無 tax rate setter）

- `setTax` — **無**
- `updateTax` — **無**
- `setFees` — **無**
- `updateFees` — **無**
- 任何可寫入 `TAX_BPS_*` 的函式 — **無**（常數不可指派）

### 存在但**不改變稅率**的 Owner 函式

| 函式 | 修飾 | 作用 | 對稅率的影響 |
|------|------|------|----------------|
| `setTaxWallets(address,address,address)` | `onlyOwner` | 更新 bank / reward / autoLP **收款地址**；新地址自動設為免稅 | **無** — bps 不變 |
| `setTaxExempt(address,bool)` | `onlyOwner` | 設定地址是否免稅 | **無** — 僅影響「誰被收稅」，不影響 0.30% 比例 |
| `setMarketMakerPair(address,bool)` | `onlyOwner` | 標記哪個 LP 對在買賣時觸發稅 | **無** — 僅影響「哪條路徑收稅」 |

### 唯讀 / 內部

| 名稱 | 類型 | 說明 |
|------|------|------|
| `TAX_BPS_*` | `public constant` | 稅率唯讀 |
| `isTaxExempt` | `mapping` public getter | 免稅名單 |
| `isMarketMakerPair` | `mapping` public getter | AMM 對標記 |
| `bankWallet` / `rewardWallet` / `autoLPWallet` | `public` 狀態變數 | 稅收分配目的地（可經 `setTaxWallets` 更換地址） |
| `_update()` | `internal override` | 轉帳時依常數扣稅；錢包↔錢包、免稅地址、非 AMM 對不課稅 |

### 事件（名稱含 Tax，易被掃描器誤判）

- `SetTaxWallets(address indexed bank, address indexed reward, address indexed autolp)`
- `SetTaxExempt(address indexed account, bool exempt)`
- `SetMarketMakerPair(address indexed pair, bool enabled)`

---

## 課稅規則（設計意圖）

1. **錢包 → 錢包**：不收稅。  
2. **僅在與已登記 AMM pair 互動時**（`isMarketMakerPair`）且雙方皆非免稅時，才依固定 0.30% 扣稅。  
3. 稅款依固定比例拆分：Burn / Bank / Reward / AutoLP。

---

## 為什麼 DappBay 可能顯示「Can Modify Tax」

DappBay 與多數靜態掃描器採用**啟發式規則**，常見觸發原因如下（**不代表鏈上稅率可改**）：

1. **函式名稱關鍵字**  
   合約含有 `setTaxWallets`、`setTaxExempt` 及 `SetTax*` 事件；掃描器將名稱含 `Tax` 的 `onlyOwner` 函式歸類為「可修改稅務相關設定」。

2. **存在 `Ownable`**  
   Token 繼承 OpenZeppelin `Ownable`；掃描器預設「有 owner + 稅務相關 admin 函式 ⇒ 風險：可改稅」。

3. **`setTaxExempt` 改變實際課稅對象**  
   雖不變 bps，但可讓特定地址永遠免稅；部分工具將此視為「稅務政策可變」。

4. **`setMarketMakerPair` 控制課稅路徑**  
   Owner 可登記/取消 LP 對是否觸發稅；掃描器可能解讀為「可開關交易稅」。

5. **未區分「稅率」與「稅務配置」**  
   本合約的 admin 能力僅限**收款錢包、免稅名單、AMM 對標記**；**沒有任何函式可修改 `TAX_BPS_*` 常數**。

### 建議對外說明

- 向審核方提供本文件與 BscScan 上 `TAX_BPS_TOTAL` 等常數的 Read Contract 截圖。  
- 明確區分：**稅率固定 0.30%** vs **稅收路由/免稅/交易對標記可由 owner 維護**。  
- **不要**為消除 DappBay 警示而重新部署或新增 `setTax` 類函式 — 那會實際引入可變稅率風險，與專案承諾相反。

---

## 鏈上驗證步驟

1. 開啟 [BscScan Token](https://bscscan.com/token/0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be#readContract)。  
2. 確認 `TAX_BPS_TOTAL` = `30`，其餘 `TAX_BPS_*` 與上表一致。  
3. 在 Contract → Code 搜尋：不應出現 `setTax`、`updateTax`、`setFees`、`updateFees`。  
4. 應僅見 `setTaxWallets`、`setTaxExempt`、`setMarketMakerPair` 三個 owner 管理函式。

---

## 維護政策

- **不修改**已部署之 `KGEN_Token_V7_5_2` 稅率邏輯。  
- **不重新部署** token 以「討好」掃描器。  
- 文件與對外溝通以本檔為準：`docs/KGEN_TAX_IMMUTABILITY.md`。
