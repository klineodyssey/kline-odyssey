# 《18888 靈霄寶殿神明銀行 × KAIOS 白洞文明銀行白皮書》
## Lingxiao Celestial Bank 18888 × KAIOS White-Hole Civilization Bank
### V2.0 CURRENT — Circulating Celestial Payroll Edition

**狀態：** CURRENT ARCHITECTURE / IMPLEMENTATION BASIS
**日期：** 2026-08-09

## 1. Fixed Physics

```text
1 KGEN = 1 metric ton = 1,000 kg
1 KAIOS = 1 kg
1 permanently destroyed KGEN = 1,000 KAIOS
KGEN genesis supply = 72,000,000 KGEN
first-generation KAIOS ceiling = 72,000,000,000 KAIOS
33333 = Gold & Silver Island / KAIOS token deployment point
36000 = White Hole
18888 = Lingxiao Celestial Bank / first-generation settlement destination
```

33333 是宇宙座標與 KAIOS Token deployment point，不是 EVM wallet、Treasury 或銀行。KAIOS 部署後另有正式 `0x...` Token contract address。

## 2. White-Hole Settlement

KAIOS 第一代生成只認正式 KGEN `totalSupply()` 的永久減少。任何人可觸發 `settleWhiteHoleMass()`，但不能輸入 burn amount、mint amount 或 recipient。首次 settlement 必須一次認列從 72,000,000 KGEN 創世供應到實際 settlement block 的全部尚未認列永久燃燒；後續只認新增 delta。所有第一代 KAIOS 直接 mint 到正式 18888 Proxy。

## 3. Bank Identity

18888 是天庭中央神明銀行，不是只進不出的保險箱，也不是 Owner 可以任意提款的普通 Vault。其核心原則：

> MONEY MUST CIRCULATE. 防偷，不防合法花錢；防亂花，不防流通。

## 4. 500 Celestial Salary Seats

18888 固定最多 500 個神職／公共功能薪俸席。每席分離 `seatId / lifeId / templeId / beneficiary / salaryRule or weight / status / checkpoints / totalClaimed`。角色名稱可包含如來、南極仙翁、廣寒宮、高老莊、火焰山、白骨洞、閻王殿、奈何橋等，但角色名稱屬 Registry 資料，不 hardcode 在銀行核心。

薪俸按 Epoch / checkpoint 形成 entitlement。合法薪俸可由 beneficiary 自領，也可由任何 keeper / AI permissionlessly 觸發，但資金只能到正式 beneficiary。銀行餘額不足時 entitlement 必須保留，待新 KAIOS settlement 進入後重試。歷史薪俸不可因未來改 rate 而追溯重寫。

## 5. Civilization Allocation Ledger

除薪俸外，18888 可依治理建立用途受限、一次性或分期的文明撥款帳本。用途至少可涵蓋 Temple operation、celestial project、life genesis、public infrastructure、economic capital to 8888。合法 allocation 的 beneficiary、amount、purpose、timing 一旦成立不得由執行者改寫，且不得 replay。

## 6. 8888 Boundary

8888 高老莊是商業大本營：公司、一般工作薪資、買賣、供應鏈、生產、消費與日常商業循環。18888 是天庭神職薪俸與文明資本層，可向正式 8888 器官配置流動資本，但不應把所有商業邏輯塞進 18888。

## 7. Governance and Safety

18888 應採 NEW ERC1967/UUPS Proxy lineage。治理可升級制度、管理 Seat、設定未來 rate / reserve / allocation policy、pause 緊急入口；但 V2 不得提供 `withdrawToken(anyToken, anyTo, anyAmount)`、`withdrawAll()` 或任意 KAIOS sweep 之 unrestricted owner withdrawal。正式出金必須經 Salary Ledger、Allocation Ledger 或未來 Human Canon 明確新增的受限模組。

## 8. Genesis Record

正式 KAIOS Genesis 數量禁止手填。部署/settlement script 必須在實際 block 讀 KGEN supply、計算歷史 burned delta、呼叫 settlement，並從 receipt/state 自動產生 KAIOS Genesis record/inscription；碑文數量必須與實際 KAIOS mint、18888 balance delta、KAIOS totalSupply delta 完全一致。

## 9. Separate Alchemy Line

KGEN→KAIOS 固定為 1:1,000。KAIOS→KUFO 是另一條獨立鍊丹尺度：目前定義為 `1 KAIOS burn → expected 1,000 KUFO`。兩者不得混淆。

## 10. Mainnet Gate

本文件本身不授權 Mainnet transaction。正式部署前仍須 compile、unit/integration/fuzz/invariant、UUPS、role、ledger、double-claim/replay、beneficiary redirect、insufficient-funds retry、KAIOS genesis exact-accounting 等測試全部通過。
