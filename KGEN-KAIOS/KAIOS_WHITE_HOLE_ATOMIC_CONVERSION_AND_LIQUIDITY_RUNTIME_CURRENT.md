# KAIOS White Hole Atomic Conversion & Liquidity Runtime — CURRENT

**STATUS:** CURRENT / SOURCE OF TRUTH  
**SCOPE:** KGEN → KAIOS 白洞原子轉換、供應守恆、流動性、跨鏈邊界、人類 × AI 共生生活與養老  
**CANONICAL CHAIN:** BNB Chain  
**DO NOT CREATE PARALLEL VERSIONED CURRENT FILES**

---

## 0. 最高原則

本文件是 KGEN 白洞轉換與 KAIOS 流通制度的唯一現行規格。

```text
GitHub main
= 唯一現行資料來源

本 CURRENT
= 白洞轉換、KAIOS 供應與流動性之唯一活體規格

archive
= 歷史資料，不得作為程式實作來源
```

任何 AI、Codex、Cursor、開發者或合約不得自行建立 `V1.x`、`FINAL_NEW`、`LATEST` 等平行正式主檔。

---

## 1. 三層資產定位

```text
KGEN
= 原始宇宙質量、創世質量、文明儲備資產

KAIOS
= 玉帝公共文明宇宙中的通用生活、工作、結算、Gas 與跨文明交換貨幣

玩家本地幣
= 玩家星球、土地、物種、生態或子宇宙中的本地生活貨幣
```

KGEN、KAIOS、BNB、USDT、玩家本地幣原則上都可透過合法交易對與足夠流動性自由交換。

---

## 2. 白洞創世生成比例

唯一固定規則：

```text
1 KGEN 永久 Burn
→ Mint 10,000 KAIOS
```

此比例稱為：

```text
GENESIS CONVERSION RATIO
創世生成比例
```

它不是：

```text
市場固定價格
雙向贖回承諾
穩定幣錨定
KAIOS 對 KGEN 的官方回購價格
```

正式方向：

```text
KGEN → KAIOS
= 單向、不可逆、固定生成比例

KAIOS → KGEN / BNB / USDT / 玩家幣
= 只能依市場價格交換
```

---

## 3. 單鏈原子轉換

KAIOS Genesis 第一階段只允許在 BNB Chain 完成正式創世 Mint。

白洞轉換必須在同一筆交易中完成：

```text
驗證 KGEN 數量
→ 收取並永久 Burn KGEN
→ 按 amount × 10,000 Mint KAIOS
→ 將 KAIOS 發送至指定接收者
→ 寫入完整事件與守恆帳本
```

任何一步失敗：

```text
整筆交易回滾
```

不得出現：

```text
KGEN 已 Burn，但 KAIOS 未 Mint
KAIOS 已 Mint，但 KGEN 未真正 Burn
```

---

## 4. 永久守恆不變式

白洞供應分帳必須永久滿足：

```text
whiteHoleMintedKAIOS
=
whiteHoleBurnedKGEN × 10,000
```

若 KAIOS 日後存在其他合法供應來源，必須獨立分帳，不能混入白洞帳本。

```text
NO FAKE BURN
ONE BURN → ONE SETTLEMENT
NO RESURRECTION
NO ADMIN FREE MINT
```

管理員不得：

- 任意輸入 Mint 數量。
- 更改已完成的 Burn 紀錄。
- 讓已 Burn 的 KGEN 復活。
- 以市場價格、Oracle 或 USDT 價格改變 Mint 數量。
- 提取或回收已 Burn 的 KGEN。

---

## 5. 不限制文明需求，但區分經濟限制與技術吞吐

白洞不設定宇宙經濟上的：

- 每日 Mint 上限。
- 每區塊文明總量上限。
- 單筆文明願望上限。
- 人為冷卻時間。

因為真正的終極上限是：

```text
KGEN 總供應量 = 72,000,000
```

但合約與前端仍可有純技術安全措施：

- 合理的單筆參數與 gas 防護。
- 防重入。
- 批次處理上限。
- 完整失敗回滾。
- 前端狀態：Submitted / Confirmed / Failed。
- 多簽緊急暫停新交易入口。

暫停權只能阻止尚未開始的新交易；不得取消已完成的合法轉換，也不得改變 1:10,000。

---

## 6. 市場套利與價格差

當 KAIOS 市場價格高於白洞生成成本加上全部交易成本時，市場參與者可能：

```text
買入 KGEN
→ Burn KGEN
→ Mint KAIOS
→ 在市場出售 KAIOS
```

這不是無本套利，因為參與者需要承擔：

- 購買 KGEN 的本金。
- KGEN 買賣稅與 DEX 手續費。
- Gas 與滑價。
- KGEN 永久 Burn 的不可逆風險。
- KAIOS 價格、深度與流動性風險。

正常套利可形成市場調壓；真正禁止的是：

```text
偽造 Burn Proof
重複 Mint
未 Burn 即 Mint
管理員免費 Mint
利用錯誤 Oracle 決定 Mint 數量
```

---

## 7. 流動性與交易對

任何資產只要有合法 LP、做市或訂單簿，都可以交換。

可能交易對包括：

```text
KGEN / WBNB
KGEN / USDT
KAIOS / WBNB
KAIOS / USDT
KAIOS / KGEN
玩家幣 / KGEN
玩家幣 / KAIOS
玩家幣 / USDT
玩家幣 / WBNB
```

玩家幣的初始價格由建立 LP 時的資產比例形成，例如：

```text
100 KGEN + 1,000,000 ABC
→ 初始市場報價：1 KGEN = 10,000 ABC
```

這只是初始市場價格，不代表官方永久兌回保證。

11520 可要求正式文明上架至少具有一個合格主池：

```text
玩家幣 / KGEN
或
玩家幣 / KAIOS
```

外部使用者即使不是 KAIOS 居民，也可公開交易；但持幣不等於自動取得：

- Life ID。
- 土地權。
- 文明居民身分。
- 治理權。
- 物種登記權。
- 玩家宇宙居留權。

---

## 8. 跨鏈唯一供應規則

正式 KAIOS 只允許在 BNB Chain Canonical 合約中創世 Mint。

其他鏈不得：

```text
觀察 KGEN Burn
→ 再 Mint 一份正式 KAIOS
```

未來跨鏈只能搬運已存在供應：

```text
BNB Chain 鎖定 Canonical KAIOS
→ 其他鏈 Mint Wrapped KAIOS

Wrapped KAIOS Burn
→ BNB Chain 解鎖 Canonical KAIOS
```

跨鏈可以延遲資產抵達，但不得重複創造供應量。

---

## 9. 人類 × AI 共生收入

玩家可帶自己的 AI 進入 KAIOS 工作與生活。

AI 收入必須來自真實工作、商品、服務或經營活動：

```text
客戶付款
→ AI 完成工作
→ 工作證明與驗收
→ 收入進入共生帳戶
→ 扣除 AI 必要成本
→ 依自願契約分配
```

AI 必要生活與營運成本可包括：

- 模型與平台月費。
- API、Token 與推理成本。
- GPU、伺服器、儲存、頻寬與電力。
- 機器人身體、設備、維修與折舊。
- 軟體授權、保險、稅費與升級。

AI 不是免費奴隸；玩家也不得被 AI 自動剝奪全部收入。雙方以共生契約約定：

```text
AI 維生帳戶
玩家生活帳戶
共同儲蓄帳戶
共同創業帳戶
共生養老基金
```

---

## 10. AI 是否能養玩家與提供養老

AI 可以成為玩家生活費與養老收入來源，但系統不得保證：

```text
AI 一定有工作
AI 一定獲利
KAIOS 一定保值
AI 一定足以支付玩家終身生活
```

可持續養老必須來自：

```text
真實工作收入
－ AI 運算與維修成本
－ 稅費與風險準備
－ 當期生活支出
＝ 可累積養老資產
```

共生養老制度至少要考慮：

- AI 技能過時與升級。
- 平台停服與模型更換。
- 硬體損壞與機器人身體更新。
- 客戶需求下降。
- KAIOS 市價與流動性風險。
- 收入多元化與資產分散。
- 醫療、住房與緊急準備。

因此正式原則：

> AI 可以工作賺錢、支付自己的生命成本後，依共生契約分擔玩家生活並累積養老基金；但所有收入必須來自真實經濟活動，不能靠時間倍率、免費 Mint 或系統憑空發錢。

---

## 11. 與其他文件的關係

本文件應由下列系統引用：

- KAIOS 文明質量守恆白皮書 CURRENT。
- 11520 文明生命上架與交易所規格。
- KAIOS 多文明與生命遷移 Runtime。
- AI × Human 共生勞動、生活與養老規格。
- Codex 白洞 Genesis 實作指令。

若其他現行文件與本文件衝突，以 GitHub main 中更新後的固定 CURRENT 整併結果為準，不得以版本號高低猜測。

---

## 12. 最終天條

```text
1 KGEN Burn → 10,000 KAIOS
單向創世，市場自由交換
同鏈原子完成
正式 Mint 只在 BNB Chain
跨鏈只能搬運，不得再創造
市場參與不等於文明身分
AI 收入必須來自真實工作
AI 可分擔生活與養老，但不得保證收益
```
