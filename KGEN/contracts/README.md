# KGEN Contracts (V7.5.2)
## 合約定位與使用說明（給工程/審計/合作方）

---

## 0. 一句話總結
KGEN V7.5.2 由三個核心合約構成：
- Token：KGEN 主幣
- Bank：Galactic Bank（五指山制度中樞）
- Genesis：Genesis Inscription（創世權利系統）

---

## 1. 合約清單（Repo 內）
- /KGEN/contracts/KGEN_Token_V7_5_2.sol
- /KGEN/contracts/KGEN_GalacticBank_V7_5_2.sol
- /KGEN/contracts/KGEN_Genesis_Inscription_V7_5_2.sol

---

## 2. 各合約角色（務必分清）
### A) KGEN_Token_V7_5_2.sol
主幣合約（KGEN）
- 定義供給、轉帳、基礎權限
- 與回流 / 稅制 / 交易限制等機制對接（依實際合約為準）

### B) KGEN_GalacticBank_V7_5_2.sol
Galactic Bank（五指山）
- 制度金庫與分配中樞
- 用途：建設支出、獎勵分配、制度回流承接
- 所有資金流以鏈上事件與交易紀錄可查驗

### C) KGEN_Genesis_Inscription_V7_5_2.sol
Genesis Inscription（創世銘文/權利）
- 創世權利的識別與規則載體
- 可作為分潤/治理/App 權限的根基（依實際合約功能為準）

---

## 3. 「五指山收租」在技術上代表什麼？
「收租」不是鎖死，也不是不可動用。
技術上等同：
- 交易回流（fee / tax / energy reflux）導入銀行
- 銀行依制度規則進行：支出、分配、燃燒、獎勵

注意：
本 Repo 文字描述只做制度定位。
實際比例、白名單、權限、事件名稱與限制，請以合約程式碼為準。

---

## 4. 版本策略（不可覆蓋舊文明）
- 新版本一律新增檔案，不覆蓋舊檔
- 版本命名沿用：V7_5_2、V7_5_3…
- 若升級合約，需補：
  - upgrade note
  - migration note
  - 新舊地址對照（若有）

---

## 5. 參考文件
- 白皮書：
  /KGEN/whitepaper/KGEN_Whitepaper_GalacticBank_500Y_Epoch_V7.5.2.md
- 500Y Epoch：
  /KGEN/timeline/500Y_Epoch.md
