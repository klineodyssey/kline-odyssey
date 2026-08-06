# CODEX — KAIOS White Hole Genesis Implementation Instructions

**STATUS:** WAITING FOR CODEX IMPLEMENTATION  
**TARGET:** BNB Chain / Solidity  
**SOURCE OF TRUTH:** `KGEN-KAIOS/KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md`  
**DO NOT DEPLOY WITHOUT TESTS AND SECURITY REVIEW**

---

## 0. 任務目的

Codex 回來後，依唯一 CURRENT 規格實作 KGEN → KAIOS 白洞 Genesis 第一版。

第一版目標不是多鏈，而是一次把單鏈原子轉換做完整：

```text
BNB Chain 上的 KGEN
→ 同一筆交易永久 Burn
→ 同一筆交易 Mint 10,000 倍 KAIOS
```

任何未寫入 CURRENT 的新規則，不得由 Codex 自行創作。

---

## 1. 不可更改的核心規格

```text
RATIO = 10,000
CANONICAL_CHAIN = BNB Chain
KGEN_BURN + KAIOS_MINT = ONE ATOMIC TRANSACTION
```

禁止：

- 動態匯率。
- Oracle 決定 Mint 數量。
- 管理員任意 Mint。
- 管理員恢復已 Burn KGEN。
- 另一條鏈憑 Burn Proof 再 Mint 正式 KAIOS。
- 雙向官方 10,000 KAIOS → 1 KGEN 贖回。
- 每日經濟性 Mint 配額。
- 把 LP 市場價格當作白洞比例。

---

## 2. 建議合約分層

### 2.1 KAIOS Token

必要能力：

```solidity
mint(address to, uint256 amount)
```

但 Mint 權限只能授予 White Hole Controller；不得保留 EOA 任意 Mint 權。

建議：

- `AccessControl` 或等效角色權限。
- `MINTER_ROLE` 僅授予白洞控制器。
- 部署後移除部署者的直接 Mint 能力。
- 明確事件紀錄。

### 2.2 White Hole Controller

建議主要入口：

```solidity
function convertToKAIOS(
    uint256 kgenAmount,
    address recipient,
    bytes32 purposeHash
) external returns (uint256 kaiosAmount, bytes32 conversionId);
```

交易流程：

```text
1. 檢查未暫停
2. 驗證 amount > 0
3. 驗證 recipient != address(0)
4. 從 msg.sender 收取 KGEN
5. 真正 Burn KGEN
6. 計算 KAIOS = KGEN × 10,000
7. Mint KAIOS 給 recipient
8. 更新守恆帳本
9. 寫入事件
```

任何一步 revert，整筆交易必須全部回滾。

---

## 3. Burn 方式要求

Codex 必須先確認現行 KGEN 合約是否具有標準可驗證的 Burn 路徑。

可接受：

```text
KGEN 合約原生 burnFrom
或
White Hole 收取後呼叫不可逆 burn
```

不可接受：

```text
只轉到普通 EOA
只轉到可被 Owner 控制的地址
只改前端顯示
只記錄 burned 變數但代幣仍可轉出
```

若現行 KGEN 合約無法安全整合，Codex 不得擅自部署；應先提交相容性報告與最小變更方案。

---

## 4. 精度與計算

KGEN 與 KAIOS 若同為 18 decimals：

```solidity
kaiosAmount = kgenAmount * 10_000;
```

必須：

- 使用 Solidity 0.8+ 內建溢位檢查。
- 測試最小單位與極大值。
- 不做價格 Oracle 換算。
- 不做四捨五入。
- 不使用浮點數。

---

## 5. 守恆帳本

至少保存：

```solidity
uint256 public totalBurnedKGEN;
uint256 public totalMintedKAIOS;
uint256 public totalConversions;
```

永久不變式：

```text
totalMintedKAIOS
=
totalBurnedKGEN × 10,000
```

若 KAIOS 還有其他供應來源，白洞帳本必須獨立命名：

```text
whiteHoleBurnedKGEN
whiteHoleMintedKAIOS
```

不得用 `KAIOS.totalSupply()` 直接代表白洞 Mint 總量。

---

## 6. 事件格式

建議事件：

```solidity
event WhiteHoleConversion(
    bytes32 indexed conversionId,
    address indexed sender,
    address indexed recipient,
    uint256 burnedKGEN,
    uint256 mintedKAIOS,
    bytes32 purposeHash,
    uint256 blockNumber,
    uint256 timestamp
);
```

`conversionId` 建議由不可重複資料組成：

```text
chainId + contract + sender + nonce + block context
```

同鏈原子交易中，不依賴跨鏈 Burn Proof Mint；conversionId 用於審計、索引與前端查詢。

---

## 7. 權限與暫停

允許的管理權：

- 暫停新的轉換入口。
- 恢復新的轉換入口。
- 更換必要的多簽治理地址，前提是有 Timelock 或正式治理流程。

禁止的管理權：

- 更改 1:10,000。
- 任意 Mint KAIOS。
- 取回已 Burn KGEN。
- 改寫歷史帳本。
- 補發沒有真實 Burn 的 KAIOS。
- 將 KGEN Burn 改成可提款 Vault。

暫停時：

```text
尚未開始交易 → revert
已進入交易 → 全部成功或全部回滾
```

不得形成「已 Burn、待日後人工補 Mint」中間狀態。

---

## 8. 安全要求

至少採用：

- ReentrancyGuard 或等效防重入。
- Checks-Effects-Interactions。
- SafeERC20 或兼容非標準 ERC-20 回傳值的安全封裝。
- 明確拒絕 `recipient == address(0)`。
- 明確拒絕 `amount == 0`。
- 權限最小化。
- 多簽管理。
- 無任意 upgrade 後門；若採 Proxy，必須另行經治理與審計，不得預設。

需評估：

- KGEN 是否為 fee-on-transfer token。
- 白洞轉入是否被 KGEN AMM 稅誤判。
- 實際收到量與使用者輸入量是否一致。
- KGEN Burn 是否會觸發額外稅或回流。

若 KGEN 為帶稅 Token，Mint 必須按「實際 Burn 數量」計算，而不是盲信函數輸入值。

---

## 9. 必做測試

### 9.1 單元測試

- 1 KGEN → 10,000 KAIOS。
- 最小單位轉換。
- 多筆連續轉換。
- recipient 與 sender 不同。
- amount = 0 revert。
- recipient = 0 revert。
- 暫停狀態 revert。
- Mint 權限只有白洞。
- 任意地址不能直接 Mint。

### 9.2 原子性測試

刻意讓 Mint 失敗，確認 KGEN Burn 也回滾。

刻意讓 Burn 失敗，確認 KAIOS Mint 不發生。

### 9.3 不變式測試

隨機大量呼叫後永遠滿足：

```text
whiteHoleMintedKAIOS
=
whiteHoleBurnedKGEN × 10,000
```

### 9.4 模糊測試

- 隨機 amount。
- 多地址。
- 多 recipient。
- 暫停與恢復交錯。
- 極端大數。

### 9.5 攻擊測試

- 重入。
- 權限提升。
- 假 Token 回傳值。
- fee-on-transfer 差額。
- 惡意 recipient 合約。
- 暫停期間繞過。
- 管理員任意 Mint 嘗試。

### 9.6 壓力與主網分叉測試

- 大量交易排隊。
- Gas 極端情況。
- BNB Chain fork 上與現行 KGEN 實際合約互動。
- PancakeSwap、稅制與免稅名單相容性。

---

## 10. 跨鏈邊界

第一版不實作跨鏈創世 Mint。

未來跨鏈只能：

```text
Lock Canonical KAIOS on BNB Chain
→ Mint Wrapped KAIOS elsewhere

Burn Wrapped KAIOS
→ Unlock Canonical KAIOS on BNB Chain
```

禁止：

```text
Remote Burn KGEN
→ Mint another Canonical KAIOS
```

跨鏈模組必須是獨立審計範圍，不得混入 Genesis V1。

---

## 11. 前端要求

前端至少顯示：

```text
輸入 KGEN
預計 Mint KAIOS
固定比例 1:10,000
不可逆警告
市場價格非固定
交易狀態 Submitted / Confirmed / Failed
交易 Hash
Burn 數量
Mint 數量
recipient
purposeHash
```

必須在使用者簽名前明確告知：

> KGEN 將永久 Burn，不能由白洞反向贖回；KAIOS 可在市場自由交易，但市場價格與流動性不保證。

不得在尚未 Confirmed 時先顯示已完成。

---

## 12. AI × Human 共生與養老的程式邊界

白洞合約本身不負責保證 AI 收益或養老。

後續文明層可另建：

```text
AI Work Contract
Shared Income Splitter
AI Maintenance Account
Human Living Account
Joint Savings Account
Retirement Reserve Account
```

但必須遵守：

- AI 收入來自真實工作與驗收。
- 不得靠免費 Mint 支付薪資或養老。
- 不得用 timeScale 增加可結算收入。
- 玩家與 AI 的分配比例由自願契約設定。
- 系統不得保證固定收益或終身足額養老。

---

## 13. 完工交付物

Codex 必須一次提交：

1. Solidity 合約。
2. 完整測試套件。
3. 部署腳本。
4. BNB 測試網部署紀錄。
5. 合約地址與驗證連結。
6. 權限矩陣。
7. 不變式測試報告。
8. Gas 報告。
9. KGEN 稅制相容性報告。
10. 安全風險清單。
11. 第三方審計前檢查表。
12. 與 CURRENT 規格逐條對照表。

未完成上述項目，不得標示為 MAINNET READY。

---

## 14. 驗收結論

只有同時滿足以下條件才算第一版完成：

```text
真實 Burn
精確 Mint
同鏈原子完成
比例不可改
無管理員免費 Mint
無 KGEN 復活
完整守恆帳本
跨鏈不重複創造
測試網驗證完成
安全審計前置完成
```

最終施工原則：

> 一次把單鏈 Genesis 的邊界做對，不在第一版混入多鏈、Oracle、動態匯率、套利控制或玩家子宇宙橋接。
