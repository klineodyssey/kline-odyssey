# KSHIP 白皮書 — KUFO 年度轉化完整累積整合版

## 2026-11-14 現行完整規格：十二等整月輪換與持續煉丹

狀態：**本機原碼與測試已驗證，尚未部署**。本系列仙丹幣名稱與代號為 **KUFO**，本文件的載體幣代號為 **KSHIP**；V4／V5 等字樣只保留在既有檔名、來源、測試及工程沿革，不是另一種幣。此完整章節依本頁 Human 最新更正整理，讀者可直接由此理解現行協議；下方歷史全文保留，但其中農曆表、36年循環、13個月、2039停鑄、舊測試及舊LIVE均不構成本版規則或部署證據。

### 1. 產品與世界流程

既有流程為 **KAIOS → K18911 太上老君煉丹爐 → K168888 筋斗雲出料 → K511111 KUFO → KSHIP**。
18911、168888、511111 是世界功能點，不是鏈上地址。正式部署清單必須另記 chainId、合約地址、runtime code／immutable、Registry 及其角色綁定。
不另建代幣、平行產品、Runtime 或 bootstrap；既有已部署合約不原地覆寫。原工程仍為 [PR #637](https://github.com/klineodyssey/kline-odyssey/pull/637)。
規格來源含 Human 提供的[KUFO 白皮書](https://docs.google.com/document/d/1LgTiHx7yjE_nqgSFiDz5hCOBEXp5YDOo7h1P50Hbv_o/edit)與本頁後續更正；本頁已更正的規則優先適用。

### 2. 每年十二個月，每個月固定一等與一個星座

Human 已確認一年12個月、整月輪換；對真實日期交由工程判斷採台灣 UTC+8 公曆，並確認下表星座順序。
每月第一日00:00台灣時間為共同換月時刻，也就是前一個UTC日期16:00；同一月份內不再按20日、21日等傳統星座日期切換。
這是KAIOS自訂整月對照，不宣稱天文星座入宮日期；公曆閏年及各月實際長度按算法處理，不把每月硬設30日或365/12日。

| 台灣公曆整月 | 輪值等級 | 整月星座 | 內部星座ID |
| --- | --- | --- | --- |
| 1月 | 1 修練佛 | 摩羯 | 10 |
| 2月 | 2 魔王 | 水瓶 | 11 |
| 3月 | 3 凡人 | 雙魚 | 12 |
| 4月 | 4 龍 | 牡羊 | 1 |
| 5月 | 5 神仙 | 金牛 | 2 |
| 6月 | 6 神明 | 雙子 | 3 |
| 7月 | 7 神君（玉皇大帝） | 巨蟹 | 4 |
| 8月 | 8 外星人 | 獅子 | 5 |
| 9月 | 9 變形金剛 | 處女 | 6 |
| 10月 | 10 十三生肖 | 天秤 | 7 |
| 11月 | 11 人類 | 天蠍 | 8 |
| 12月 | 12 萬靈 | 射手 | 9 |

星座ID是本版內部編碼：牡羊1至雙魚12；月份映射固定為 [10,11,12,1,2,3,4,5,6,7,8,9]。等級ID與星座ID各有欄位，不混用。
第10等「十三生肖」包含鼠、牛、虎、兔、龍、蛇、馬、羊、猴、雞、狗、豬與AI類，共13個子類；**人類獨立為第11等，全年仍只有12個月**。
不以亂數、錢包雜湊或時間自動替個人指定子類，不因月份改寫玩家既有境界、物種、舊出生承諾或資產。
每年1月回第1等，12月為萬靈；500年只作相對紀元標記，不重置規則、不停機，也不在第501年改亂數。
「1天堂日＝365 K280日」另記為世界時間換算，不把一年公曆成熟改成天堂日或假定K280日的鏈上秒數；Physics CURRENT 未被本工作任意改寫。

### 3. 持續煉丹與不可變時間來源

同一KUFO候選以鏈上 block.timestamp、固定 UTC+8 及公曆算法按需計算年／月，不預先儲存一萬年曆表，也不依賴AI、母機或Owner每年送補表交易。
2039不再是終身停鑄期限；到2039年及更遠年份，仍按同一算法判定月份。持續煉丹仍須滿足有效啟用、供應額度、真銷毀、餘額資格、角色綁定與鏈本身可用。
只讀月份判定不需要定時簽署；**鑄造與轉化仍是持有人發起的交易**。時間到達不自行扣幣、不自動轉帳，也不讓AI取得錢包權限。
正式啟用時間 activationTime 尚須在部署前由本人確認，不能自動沿用2027年測試fixture或舊2039草案。
constructor 固定 version、activationTime、utcOffsetSeconds=28800 及上述12個星座映射，整體calendarHash不可回改；本候選沒有未來年曆append或改時區／星座setter。
公曆換算採有界整數算法，參考[作者的日期算法說明](https://howardhinnant.github.io/date_algorithms.html)；這是確定性民用曆法，不是精準萬年農曆或天文預測。

### 4. 鑄造、資格與供應

- 真實銷毀 **1 KAIOS，同筆即時產出1,000 KUFO**。同時核對持有人KAIOS餘額及KAIOS總供應量確實減少，不以送到任意地址或成功回傳tuple代替burn。
- KGEN只查持有人當下餘額，至少為投入KAIOS量÷1,000；**不扣除、不鎖定、不轉移KGEN**，不要求為此授權KGEN allowance。
- 原碼採18位精度。最小KAIOS投入1,000 wei，且投入wei須可被1,000整除，確保資格與產出整數精確；這不是最少投入1,000枚KAIOS。
- KUFO零創世、原生零稅；累計從煉丹發行上限72,000,000,000,000枚（72兆）。後續銷毀不恢復已用過的終身發行額度，不增加任意管理員鑄幣入口。
- KSHIP零創世、原生零稅，原供應上限72,000,000,000,000,000枚（72,000兆），每1 KUFO最終對應1,000 KSHIP。
- 「餐廳10 KAIOS／500 KUFO」是商家以自有庫存、補貼或利潤交付的討論例子，不改協議鑄造1:1,000；100萬維持量及生命活動力公式未定，不實作成強制資產規則。

### 5. 共同年度成熟、永久補結與轉讓守恆

年度成熟按台灣公曆1月1日00:00共同年界，**不是持有滿週年，也不是每過一個月成熟一批**。
出生年跨過第一個年界，原始份額累計可轉化50%；第二個年界75%；第三個年界100%。例如12月31日出生，可在次日年界取得50%資格，應在操作介面清楚說明。
實際轉化需由持有人或其明確授權的既有Converter流程發起；取得資格與執行交易分開。漏年可補結，第三年清掉剩餘餘額與尾差，不因舊發行期或曆表末端失效。
每筆出生數量分成 first=floor(amount/2)、second=floor(3amount/4)-first、terminal=amount-floor(3amount/4)，保留逐筆wei尾差。
轉讓按剩餘三段權利比例拆分，父子各段總和保持，既有出生年、月份、輪值等級、星座及來源hash不重設；年度aggregate只是同一批權利的衍生索引，不能重新計算或創造成熟額度。
普通transfer與burn單筆最多處理32個活躍分組；更多分組須用原selected-group入口分批，選組嚴格遞增、不重複，失配整筆回滾。查詢可用有界分頁，不掃描萬年歷史。
groupId為相對第一個出生年的月份編碼，沒有鑄造也可按需計算；虛擬月序上界不等於真實已鑄組數。實際權利只在真mint後記入持有人索引。
uint32分組／年度與uint64時間皆須在轉型前核邊界；新鑄範圍限制與既有份額永久補結分開處理，不能用未來新鑄上界取消既有結清權利。

### 6. 合約分工與持有人授權

唯一正式候選原碼在 KGEN-KAIOS/contracts/ 下：

| 合約 | 工作 |
| --- | --- |
| KUFO.sol | 固定時間規則、真burn proof、出生／三段權利、轉讓與授權轉化燒毀 |
| KAIOSAlchemyFurnace.sol | 當下KGEN資格、持有人KAIOS burn、同筆原子出料與精確增量核驗 |
| KUFOOutputJindouyun168888.sol | 沿Registry現任output路由消耗proof，保留受益人與數量 |
| KSHIP.sol | 驗證KUFO carrier burn record並防重鑄造KSHIP |
| KSHIPConverter.sol | 持有人授權轉化，核KUFO真burn、KSHIP proof／餘額／供應及累計鑄造精確增量 |

既有KAIOS、KGEN及KAIOSOrganRegistry是必須核對的依賴，不以world point替代地址。KUFO/Furnace本版MintOrigin新增明確 birthMonth／birthTierId；不得與舊birthZodiac ABI混接。
Registry owner依既有bootstrap狀態、minimumDelay及合法治理程序管理角色；delay不得繞過。修改路由不是修改原比例、供應cap或新時間常數的權限。
持有人只對實際核對過的Furnace／Converter設定必要allowance，核對受益人、數量與呼叫參數後本人確認。Output／Converter／getter均不應單靠名稱被信任；部署前須核實位元碼、immutable、Registry綁定及權限。
AI可撰寫、離線測試、準備操作與唯讀核回執，不能取得私鑰／助記詞、代簽、送部署／治理／真交易或解除具體HOLD。

本次固定程式／測試提交e483fa03d8a2b5dafe5fc27dd23f804274fa4236；36合約編譯0warnings，65/65完整矩陣＋4/4選取安全檢查，共69項分兩次suite通過。精確時間、hash、gas、部署前唯讀快照及未驗範圍見同包工程報告與manifest；不能將本機通過當成主網部署。

### 7. 上鏈部署準備與完成判準

依原工程流程準備同一候選，部署次序為KUFO → Furnace → Output → KSHIP → Converter，再由有權持有人按既有Registry流程核實與綁定；不得部署測試Mock、Harness、LegacyBaseline或研究候選。
若現有KAIOS／Registry不具備本版所需burn／output角色介面，先保留阻塞，不能假裝相容、另選舊地址、直接升級或越過治理。
原main歷史Furnace／KUFO的舊proof領取沿WORMHOLE key，不能在本版部署時任意換掉其原immutable路由。共享CONVERTER key則會影響舊KUFO／KSHIP後續轉化：新Converter只綁本版兩個token，若尚有舊權利／舊資產，直接切換會阻斷舊轉化。啟用前必須核當期route、舊proof與未結清資產；不能以歷史manifest的NOT_DEPLOYED推定沒有義務，也不能宣稱三個key一換即可無損啟用。
目前chain、既有Registry／KAIOS／KGEN正式地址、owner、delay、五個新地址、啟用時間、正式constructor、交易hash、receipt與executableAt均應依審核清單填入已核實值；未核實欄位保持null，不用舊LIVE補空。
編譯固定Solidity0.8.24、OpenZeppelin5.0.2、optimizer runs1、viaIR、paris、metadata.bytecodeHash=none。審核包須含精確原碼／lockfile／標準編譯輸入／五份ABI與creation bytecode／runtime模板及immutable參照／測試log／source與artifact雜湊／constructor與角色清單。
runtime模板含immutable位置，不能直接拿未綁定模板hash當正式鏈上runtime；部署後需重建實際immutable並比對explorer驗證與receipt。
實際費用依當時精確constructor、gas估算、gasPrice／fee上限及BNB／台幣匯率另核，不能拿8522舊曆表gas當本版費用；任何新支出仍須符合本人原限制。
完成程式／本機測試、發布PR／CI、主網部署、真錢包煉丹／轉化、UI／實體手機可玩與資金入帳各有獨立證據，不互相代替。
本章驗證與交付指紋以同包工程報告及manifest的最新固定結果為準；尚未產生的新結果不能提前寫為PASS。原失敗log、舊checkpoint、guardian、舊包及其hash保留。
本產品由Human稱為自有宇宙算法／專利構想；沒有申請或核准文件時，不宣稱取得專利認證。


---

## 歷史完整原文（保留來源，不作本版部署或現行參數證據）

# KSHIP Whitepaper — cumulative KUFO annual conversion edition

## 2026-11-14 權威接續：持續煉丹的分段年界（LOCAL_CODE_AND_TESTS_VERIFIED_NOT_DEPLOYED）

依 Human 最新持續煉丹及萬年航程要求，沿原 #637 修正 KUFO 曆法維護方式，KSHIP 沿用原核心與既有 Converter。
**舊 32 年終身停鑄設計已被取代，2039 停鑄草案未採用。** 下方完整保留的固定發行期、前輪 35 項通過及另 185 項歷史結果均不能充當本次候選的驗收。
持續煉丹不取消原供應 cap，也不增加任意鑄幣、轉帳或自動簽署權限。

KUFO 本機候選採用只能在末端追加的分段 calendar：初始 constructor 最多 32 年／512 個出生窗口，治理 append 每次最多 32 年／256 個窗口（MAX_APPEND_BIRTH_WINDOWS），均不再是終身上限。分段跨度須同時符合窗口數限制；32年／256窗／287交集分組的append實測propose428,852、execute7,555,818 gas，低於8M，沒有套用30M部署預算。
現任 Organ Registry owner 提案精確 payload hash，沿 Registry 的 minimumDelay（至少一小時）等待；任何帳戶到期執行仍須核對同一 owner、parent hash 與 payload，現任 owner 可取消。
追加段須完全匹配既有末三個年界，不得變更舊出生 group、年界或已取得的成熟權利。可以補齊未覆蓋的過期空窗，但新 mint 不得追溯到過去；缺當下正式覆蓋時暫拒新 mint，合法追加後可恢復，不能承諾無人維護仍永久出料。

初始 calendarHash／version 保留，latestCalendarHash 鏈接追加段，groupCalendarHash 固定出生來源；origin、轉讓與年度補結均不改寫出生年、生肖、星座或來源 hash。
年／cohort／group 採 uint32 候選範圍，活躍持有人有序 bitmap 與年度 aggregate 供有界查找。一般轉讓／burn 超過單筆 32 個分組時整筆拒絕，改走 selected-group 分批；claimableTotal 超過單批範圍則用 heldGroups／claimableForGroups 分頁讀取。
既有 KUFO → KSHIP 1:1,000、年度累計 50%／75%／100%、永久補結與尾差、供應 cap、持有人 allowance、真 burn／proof、實際產出增量及原子回滾防線保持。

萬年是資料延長、數值與操作活性的設計，不是已批准萬年曆表。香港天文台公開年曆對照為 1901–2100，遠期日界計算可能有日期差異，不能自行外推精確生肖／星座窗口。Human 已選生肖年界沿用**地球農曆新年**，不得改用元旦或宣稱精準萬年預測；正式生效時間、時區、財務年界、星座窗口及各期具體表仍須依原定案程序核定。
本輪純 policy suite **20/20 PASS**，0 failed/skipped/cancelled，7471.6809ms；原 bounded-policy log 已讀回，包含萬年合成分段與 constructor／append 的257窗口差異案例，不代表鏈上 gas 或正式年曆已驗收。
最終固定程式／測試提交 `0bf33c4b1ed61da5ddd08c4f426e3e6a5408fd9b`：36合約編譯、0 warnings，248620.5081ms；最終31/31 EVM PASS，0 failed/skipped/cancelled，625773.2286ms。前述純policy20項未重跑；第一輪4 ABI＋10 main lineage通過，34份未變artifact的creation/runtime/ABI及KUFO ABI一致，未重跑這14項。合計65項組合矩陣，不是一次65項全跑。
第一輪45項曾44 PASS／1 FAIL（718824.4665ms），唯一dust transfer未達原300k；保留原log／archive後，用六處global-zero bitmap祖先guard修復，不改門檻。最終dust transfer264,105<300k、settle340,037<500k；dormant32一般transfer／settle4,820,020／1,400,028，selected32 transfer／convert2,783,334／1,014,984 gas，仍在8M內。最大constructor18,216,737<30M gas，initcode40,242<49,152 bytes；完整編譯輸入、log雜湊及gas表見同一KUFO白皮書本輪接續段。
四層bitmap actor只驗uint32索引，不代表建立65,536個真鏈上cohort；10,000年／120,000分組是純資料測試，不是天文預測。獨立NO_BLOCKER是工程原碼複核，不是外部安全審計。
本版origin groupId由uint16改uint32、issuanceCohorts由uint8改uint32，Furnace新增groupCalendarHash依賴。需配套五合約候選／新ABI／地址及綁定核驗，不能與舊Furnace任意混綁、原地升級或覆寫既有LIVE合約。
狀態為 **LOCAL_CODE_AND_TESTS_VERIFIED_NOT_DEPLOYED**；正式參數、地址、綁定、授權與成本仍待核定，UI／實體手機／真錢包為 **NOT_VERIFIED**，沒有主網生效、部署或簽署。本輪未新增支出，不承諾未來續曆與治理上鏈免費；實際gas與成本仍由合法持有人依原限制確認。

## 2026-11-13 KUFO #637 工程接續

正式代號沿用 KSHIP，KUFO 的正式名稱及入口不附版本。
本文件完整保留前版於下方；其中「Converter unchanged」、V4 來源名及舊測試／gas 是歷史證據。
現行關係為：真銷毀 1 KAIOS 同筆即時產出 1,000 KUFO，KGEN 只作當下餘額資格；
共同年界第一年累計 50%、第二年75%、第三年100%，終局清餘額尾差。
每 1 KUFO 最終對應 1,000 KSHIP，漏年永久可補結，轉讓不重設出生年或已耗用權利。
年界不自動扣幣；由持有人發起 Converter，KUFO 消耗其授權並記 carrier proof，KSHIP 核 immutable KUFO proof 後鑄造。

KUFO 的 financial year 與出生生肖／星座窗口分別明確配置；現存權利依不可變出生 group 搬移。
大量歷史分組可用既有 Converter 新增的 `convertGroups` 分批處理；每批至多32個唯一升序group，未選權利保持。
任何 proof、路由、授權或輸出失配須原子回滾，不能將路由回傳 tuple 當實際 KUFO/KSHIP 產出。
Registry 現任 Converter 是受信任 spender，並不因此獲得未授權持有人的餘額。

KUFO 的 `carrierBurnRecord` 供 KSHIP 讀取的 ABI 保留；KSHIP 及 Converter 的 immutable KUFO／KSHIP 地址不可被 ABI 相容性改接。
舊部署與舊49 Epoch proof 保留，沒有隱含遷移或重複領取。當前主網 manifest 將 KUFO／KSHIP列為 NOT_DEPLOYED/FUTURE，Furnace V1 的 LIVE 歷史不能代表本版部署。
正式曆法、時區、生效時間、年界、生肖／星座窗口與發行期限尚待 Human 核准；工程合成 fixture 不作正式參數。
餐廳庫存交付及活動力討論例子不改協議比例，也不是本版已部署功能。

最終來源、固定提交測試、compiler設定、bytecode及地址／角色／合法持有人部署檢核，沿既有
`KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md` 累積記錄。
AI 未部署、未代簽或送治理交易。正式參數及合法授權完成後，才由有權持有人確認。

### Converter 實際鑄造驗證補強（2026-11-13，固定來源 86ee4e8e）

既有 `KSHIPConverter.sol` 的兩個地址 constructor 及 `convert`／`convertGroups` 入口不變，原 proof 公式保留。
constructor 核對兩個 token 地址均有合約程式碼、`KSHIP.kufo()` 等於所綁 KUFO，並要求兩者 Organ Registry 一致且非零。
兩個入口共用同一快照與完成驗證：在燒 KUFO 前確認 KSHIP proof 未用，保存總供應量、`totalMintedFromKufo` 及受益人餘額；其後讀取真 KUFO carrier burn record，核對 owner、beneficiary、converter、kufoBurned 及 `expectedKship = kufoBurned × 1,000`。
呼叫 KSHIP 後，除了原回傳 tuple 核對，還要求 proof 已使用與上述三個量的精確增量。缺少鑄造、錯誤收款人、錯誤數量、累計量或 proof 均不能只靠回傳數字通過。
任一步不一致，整筆同步回滾 KUFO、授權額度、分組權利、proof 與 Converter counter；這不是新的經濟規則或第二套付款流程。

getter 與狀態回讀不能認證能偽造所有回傳值的任意程式碼；canonical runtime、地址、immutable 與治理綁定仍由合法持有人依原審核包確認。
先前 `6bedaec3` 的 218 項通過結果（198 非 EVM＋20 EVM）未覆蓋本次 no-mint 缺口，僅保留為歷史；本輪受影響35/35 PASS（22 EVM＋10 legacy lineage＋3 ABI），0 failed/skipped/cancelled，482912.2407ms；另185項同指紋歷史通過未重跑，非本次單次220項全過。
固定來源與結果沿原工程報告保存。正式曆法及部署參數仍未核定，維持 `NOT_DEPLOYED`，沒有主網鑄造、部署或簽署。

## 前版完整正文（SUPERSEDED historical evidence）

# KSHIP V4 Whitepaper — cumulative annual-cohort compatibility edition

Status: REVIEW CANDIDATE DOCUMENTATION / NO LIVE ACTIVATION
KUFO candidate version: `4.1.0-candidate`
Solidity: `0.8.24`; OpenZeppelin Contracts: `5.0.2`
KSHIP source: existing main `KGEN-KAIOS/contracts/KSHIP.sol`, unchanged
Converter source: existing main `KGEN-KAIOS/contracts/KSHIPConverter.sol`, unchanged

This complete edition describes how the existing KSHIP interfaces accept the
annual-cohort KUFO candidate. It retains the original PR #201 edition below as
historical source. It does not relabel existing KSHIP bytecode as a new V4
deployment, assert deployed addresses, or modify deployed V1 or immutable KAIOS.
The reused source heads are PR #201
`8b4ccd8c008886f82853ba0f0c064b9217e73894` and PR #600
`2062b7b94959cf5e0d4aaf408677505bb4bcb6e1`.

## 1. Purpose and exact material relation

KSHIP is the milligram-scale carrier accounting token generated by eligible KUFO
conversion. In this product it has no native half-life, transfer tax or arbitrary
holder burn. KSHIP is neither a spacecraft nor a chip; later propulsion,
industrial use and K108000/KGOD consumption are separate product work.

```text
1 KUFO consumed by an accepted carrier proof → 1000 KSHIP
MAX_SUPPLY = 72,000,000,000,000,000 KSHIP
```

No independent discretionary mint is added. Existing main KSHIP retains its
non-upgradeable ERC-20/cap implementation, current-converter authorization,
immutable KUFO source address, replay map and beneficiary-bound proof validation.
No source-level `VERSION` or additional invariant helper is invented in that
unchanged contract; conservation is checked from its actual stored totals.

## 2. Upstream issuance and shared annual maturity

The reused immediate furnace accepts the holder's approved KAIOS, burns it through
existing KAIOS's allowance-checked alchemy method and releases exactly 1,000 KUFO
per KAIOS to the proof's beneficiary. It observes current KGEN balance of at least
`KAIOS input / 1000`; KGEN is not transferred, burned, locked or allowance-spent.
`0.001 KAIOS` plus at least `0.000001 KGEN` therefore produces `1 KUFO` immediately.

KUFO born in one configured year shares common maturity boundaries: first year
boundary makes 50% of original issuance eligible, second reaches 75%, third
reaches 100% and consumes all remaining integer dust. A year-end receipt can
reach its first boundary seconds after issuance. There is no per-receipt birthday
timer and no endless residual half-life in this candidate.

Eligibility does not settle itself. Ordinary transfers and mints do not calculate
or execute decay settlement. The holder explicitly calls
`KSHIPConverter.convert(kufoAmount, beneficiary)` when desired. Skipped years catch
up according to the configured boundaries; a repeated call can consume only
remaining eligible tranches. After the third boundary, settling the complete
remaining balance leaves zero KUFO and the exact final 1:1,000 accounting relation.

## 3. Holder authorization, proof and fixed beneficiary

The existing converter sets `owner = msg.sender` and creates its carrier proof
from chain ID, converter address, conversion number, owner, beneficiary and amount.
The synchronous path is:

1. Converter calls KUFO `burnForCarrier(owner, beneficiary, amount, proofId)`.
2. KUFO checks the current registry converter, consumes only mature remaining
   tranches, rejects proof replay and burns exactly `amount` KUFO.
3. KUFO records the unchanged interface tuple: `owner`, `beneficiary`, `converter`,
   `kufoBurned`, `expectedKship`.
4. KSHIP reads that record and requires its caller to be the current registry
   converter, nonzero owner/beneficiary/amount, matching recorded converter, and
   `expectedKship == kufoBurned × 1000`.
5. KSHIP rejects a reused carrier proof and mints to its recorded beneficiary.
6. Converter verifies returned beneficiary and amount before completion.

The beneficiary may be selected by the authorized holder for a new conversion;
it cannot be changed after the proof is recorded. A failed mint or lineage check
reverts the entire transaction, including KUFO consumption and proof state. This
does not authorize arbitrary third parties to settle someone else's holdings.

The external Organ Registry remains a trust boundary. A malicious registered
converter could violate the holder-authorization assumption, and a malicious
output could issue unauthorized proofs. Production needs audited bindings,
governance and role controls even though the token bytecode is not upgradeable.

## 4. Transfer lineage and integer conservation

KUFO holder balances coalesce by birth year into remaining `first`, `second` and
`terminal` tranches. Mint-proof rounding fixes the 50% and 75% cumulative targets
once; early settlement consumes those tranches rather than rewriting an original
amount. The genuine furnace issues KUFO in multiples of 1,000,000 wei, so those
mint targets divide exactly by four. Artificial minimum-unit proofs may round
early targets down, with every residual unit consumed at Autumn three.

For a partial transfer, the recipient's cumulative first and first-plus-second
tranches are floored proportionally to its live amount, the second is derived by
subtraction, and the final tranche receives the residual. The sender subtracts
exactly the recipient's amounts. Every tranche is conserved, year/age is unchanged,
and transferred mature material is neither settled nor made younger.

Same-year balances are fungible. Immutable proof origins retain original amount,
beneficiary, timestamp, birth year and birth zodiac, while constellation `0` means
`UNCONFIGURED`. A current active zodiac is an offchain calendar/year projection;
it does not alter birth zodiac. Coalescing does not promise cryptographic tracing
of every individual transferred token back to one particular mint proof.

## 5. Calendar, gas bounds and lifetime cap

KUFO requires an explicit immutable calendar version, hash inputs, first year and
twelve-zodiac anchor. No Gregorian, lunar or K280 calendar is inferred. For `N`
issuance intervals, `1 ≤ N ≤ 32`, there are `N+3` strictly increasing nonzero
timestamps. Mints close at index `N`; the last birth cohort becomes terminal at
index `N+2`, and all terminal conversion remains available forever. No calendar
setter, wraparound, slot reuse or post-construction extension exists.

The calendar hash is
`keccak256(abi.encode(version, firstYear, firstZodiac, uint64[] yearStarts))`;
registry address is excluded. Before activation the contract reports first year
and Autumn zero while rejecting minting; pure policy helpers reject that time.
After the final timestamp, settlement-year projections clamp to the final year.

This finite issuance horizon is a candidate engineering tradeoff that needs
explicit production approval. It prevents both receipt dust and accumulated old
years from growing a holder's traversed lineage beyond the fixed 32-year ceiling.
Transfers and conversion do not traverse immutable proof history. The previous
65-receipt full-transfer failure must be replaced with tests proving hostile dust
remains fully transferable and convertible within measured bounded gas.

KUFO limits lifetime issuance, not just circulating supply, to
`72,000,000,000,000 KUFO`. Burning mature KUFO does not reopen mint capacity.
This reserves enough space under KSHIP's fixed cap for the complete modeled
lineage and avoids a future cap-induced conversion lock.

The accounting checks are:

```text
KUFO totalSupply + totalDecayedForKship == totalMintedFromAlchemy
Each accepted proof: expectedKship == kufoBurned × 1000
Completed converter path: KSHIP totalMintedFromKufo == KUFO totalDecayedForKship × 1000
Product_05 KSHIP totalSupply == totalMintedFromKufo
```

## 6. Merchant pricing and downstream boundaries

Merchant quotes, inventory, margin and subsidy are independent of the protocol's
1,000 KUFO/KAIOS mint ratio. A restaurant may sell 100, 1,000 or 2,000 KUFO for
one KAIOS from its own stock or subsidy without changing protocol minting or the
terminal KUFO/KSHIP ratio. This edition implements no merchant UI or accounting.

K108000/KGOD, marriage/rings, KDNA, KRNA, reactor operation and UFO applications
are downstream products. PRs #211 and #212 remain downstream cases; they are not
duplicate alchemy work and are not closed by this integration. PR #158's catalyst
and continuous-decay mechanics are not imported. PR #600's unique research source
is preserved before any later supersession decision.

## 7. Deployment prerequisites and validation status

This edition asserts no live deployment, mint, burn, token/BNB movement, signer
use, registry change, governance action or main merge. Exact candidate test and
compile results belong in the product implementation report; old PR CI does not
prove this new core passed.

Production activation requires approved calendar boundaries/version/hash/anchor
and finite horizon; reconciliation of Physics CURRENT V3.8's continuous
three-year 12.5% illustration with the user's latest annual 50/75/100% instruction;
exact-source compilation and local EVM security/boundary/dust/gas/cap/conservation
tests; verified existing KAIOS compatibility; complete reviewed deployment
bindings and preserved V1 address/bytecode lineage; and separate action-specific
human authorization for any deployment or live asset/governance operation.
Physics CURRENT is unchanged by this candidate.

## Preserved historical source edition — superseded candidate descriptions

The original PR #201 whitepaper follows verbatim. Its V4 source metadata,
invariant-helper claim, prospective source replacement and historical independent
review flow are archival statements. The current integration retains main KSHIP
and converter sources and adds no historical review gate beyond current policy.

---

# KSHIP V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0-compatible lineage
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KUFO -> KSHIP -> K108000 -> KGOD

## 1. Purpose

KSHIP is the stable carrier material produced from terminally decaying KUFO. It is the downstream material used by the K108000 propulsion / transformation lineage.

KSHIP has NO HALF-LIFE in Product_05. Once valid KSHIP is minted from a verified KUFO carrier proof, this product does not automatically decay it.

## 2. Material relation

The exact conversion law is:

1 KUFO = 1000 KSHIP.

KSHIP does not create value independently. It can be minted only from an accepted KUFO carrier proof produced by the currently registered KSHIP converter.

## 3. Mint authorization

KSHIP has no owner mint and no arbitrary admin mint.

The mint path is:

1. Current KSHIPConverter calls KUFO burnForCarrier.
2. KUFO verifies the converter against KAIOS Organ Registry.
3. KUFO consumes only matured claimable KUFO under the Three-Autumn schedule.
4. KUFO records a carrier proof containing owner, beneficiary, converter, kufoBurned and expectedKship.
5. KSHIP reads that record.
6. KSHIP requires the caller to be the current registered KSHIP converter.
7. KSHIP verifies expectedKship == kufoBurned * 1000.
8. KSHIP marks the proof as used and mints to the recorded beneficiary.

## 4. Replay and beneficiary binding

Each carrier proof may be minted only once.

The proof includes the beneficiary through the KUFO carrier record. KSHIP does not accept an arbitrary caller-selected recipient after the fact. The KSHIPConverter also compares the KUFO expected amount and KSHIP returned amount before completing the conversion transaction.

## 5. Supply

MAX_SUPPLY = 72,000,000,000,000,000 KSHIP.

This ceiling corresponds to the current modeled KAIOS -> KUFO -> KSHIP civilization lineage and does not grant discretionary mint authority.

## 6. Conservation

KSHIP tracks totalMintedFromKufo and totalSupply.

Because Product_05 defines no native KSHIP burn or decay, the token exposes the conservation condition:

totalSupply == totalMintedFromKufo

Downstream consumption through K108000 is outside Product_05 and must be introduced only in the later Product_06 lineage with its own explicit conservation accounting.

## 7. Non-upgradeable core

KSHIP is intended as a non-upgradeable core material token.

It has no UUPS, Transparent Proxy, upgradeTo or upgradeToAndCall entry point. Future changes should be expressed as a separately deployed new version and explicit registry / product-line transition, not a silent replacement of already deployed KSHIP bytecode.

## 8. Administrative and risk surface

KSHIP has:

- no owner mint
- no admin mint
- no blacklist
- no seizure path
- no native transfer tax
- no half-life in Product_05
- no proxy upgrade path

The only privileged mint actor is the current KSHIPConverter resolved through the Organ Registry, and that actor still cannot mint without a valid KUFO burn record.

## 9. Downstream boundary

KSHIP is designated for later Product_06 use:

KSHIP -> K108000 -> KGOD.

Product_05 does not activate KGOD, marriage, KDNA or KRNA logic.

## 10. Verification requirements

Before deployment, GM review must verify:

- exact 1:1000 KUFO/KSHIP relation
- proof replay rejection
- converter authorization
- beneficiary binding
- KUFO maturity enforcement
- KUFO and KSHIP conservation invariants
- no unauthorized mint path
- no hidden upgrade path
- exact-head Solidity compile and EVM behavioral tests

## 11. Deployment boundary

This whitepaper describes a repository candidate only. It does not assert Mainnet deployment, activation, registry mutation, signer use, token movement or governance approval.

Required flow:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.

---

## Human 2026-11-14 最終更正：單一簡化年度轉化

記錄UTC 2026-11-14T05:40:20.735Z，台灣 2026-11-14T13:40:20.735+08:00；WORK_ID KUFO-637-SINGLE-ANNUAL-DECAY-20261114-01，Writer Codex衡曜/root，非原子人工派工。

本節依本頁 Human 明確指令「衰變沒有第二套，只有一套，就是簡化版，統一跨年後轉，三年完全轉換」定案。它取代較早連續指數半衰期、食用儲備另設連續衰變，以及要求 Human 在兩套算法間選擇的提案。這些舊內容只供歷史追溯，不再是本工程的可執行規則；不得由後續 heartbeat 恢復為待選方案。

唯一的 KUFO→KSHIP 規則：

- 沿既有台灣 UTC+8 公曆共同年界計算：首次跨年累計可轉50%，第二次75%，第三次100%，第三次結清餘額與最小單位尾差。
- 以最初1 KUFO且權利未移轉的例子，三階段累計可轉產物為500、750、1,000 KSHIP；每次只結算尚未轉過的差額，不能重複發放。
- 「三年」是三次共同跨年，不是每位持有人都必須持滿1,095日。年底出生的批次可很快跨第一次年界。
- 年界只增加可轉資格。持有人或明確授權流程仍需發起原轉化；日期到達不會自動扣款、簽署或送鏈上交易。
- 不設逐毫秒／每秒連續衰變 tick，不設食用儲備的第二套指數產出。按需查詢時才從年界計算階段，依同一份權利結算。
- 轉讓保留剩餘年度權利，漏年可補結；同一份 KUFO 不得再經另一條衰變路徑重發 KSHIP。對「1→0.5→0.25→0.125」的舊指數算例，不再用作 KUFO 執行政策。
- 食用量限制速度與載具耗料屬後續使用規則；不得藉此建立第二次 KUFO→KSHIP 產出。反物質速度的10%效率算例只是展示，未採為費率、效率、燃料定價或實際推力。

Human 聚寶盆交接仍保留，但其成本目前依 Human 指示不凍結。KGOD在本次配方代表正物質；KSHIP正／反通道的實際配給仍未配置。K108000基本KSHIP→KGOD不需要KGOD母版；聚寶盆配方則保留母版，n KGOD＋n KSHIP→2n KGOD，淨KGOD+n／KSHIP−n。指定反物質通道時需明記KSHIP−，不把未分類餘額直接當負通道。

觸媒僅KDNA（藍圖）＋KRNA（次序）＋KSTART（點火）；KLINE（畫線能力）另列。這些能力按本頁Human定義，不冒稱歷史分支已完整核實。其他物品X保留原物、淨增一份同規格X，但各項燃料、時間、費用、權限及觸媒持有／鎖定／消耗／回收方式未配置，不自行套1 KSHIP或燃燒代幣。配方點火前核條件，完成時輸入、輸出與證明原子結算並防重，使用固定精度整數及明定餘數保存；KUFO轉帳不自動鑄KGOD。

既有c428ac0d候選已採上述共同年界及按需計算，可保持程式不改。本節是既有CURRENT／白皮書／工程報告的完整累積澄清；舊原文全部保留。未執行新suite，原69項仍僅屬舊候選範圍；未宣稱聚寶盆／食用速度／正反通道實作或部署完成。合約、既有下載包、鏈上資產及角色未由本次文件更正改動。

---

## Human 2026-11-14 KUFO／KSHIP前後接續產物鏈與世界點位定稿

Human 本頁指定 KUFO 和 KSHIP 是同一條前後接續的產物鏈，按可理解的世界創作連接。此處「接續」沿用唯一共同跨年50%／75%／100%的簡化轉化，第三次結清；不恢復指數連續衰變或第二套產出。

| 世界功能點 | 本次正式角色 | 實作與地址綁定 |
|---|---|---|
| K18911 | 煉丹爐煉KUFO；KUFO幣的世界入口 | Furnace與KUFO ERC20是兩個合約，各有自己的0x地址；入口應展示並核對兩者，數字18911本身不是鏈上地址 |
| K168888 | 金斗雲／筋斗雲，KUFO產出地 | 原Output器官用同一真實KAIOS銷毀證明，向固定受益人產出KUFO |
| K511111 | 蟲洞，KSHIP出生地 | 沿原KSHIPConverter把可轉KUFO實際burn，再依同份carrier proof產出KSHIP；不新增第二個轉化器 |
| K108000 | 點石成金，KSHIP反物質石頭轉KGOD金塊 | 本頁Human世界配方；成本目前先不凍結，精確資產／通道／數量／權限／守恆未配置，尚未實作部署 |
| K111111 | 如來神掌，黃金水／黃金手掌的世界場景 | 敘事／玩法接續，尚未由本KUFO／KSHIP核心實作或驗收 |
| K12345 | 五指山，接續做空玩法 | 原場景／交易軟體範圍另核；本條敘事不觸發或授權真實做空交易 |

正式代幣名稱仍為KUFO；Human同段「KUFI」按原上下文沿用KUFO，不另造代幣。KGOD、K108000、111111與12345可以接續世界故事；本次可交付的五個合約仍只限 KUFO、Furnace、Output、KSHIP、Converter，不把全條故事宣稱為已完成主網系統。

### 原碼對齊與相容性

舊c428ac0d候選曾在KUFO／Furnace／Output把511111標為KUFO token point，與本頁定稿不符。本次沿原五個合約更正：

- KUFO：TOKEN_POINT_18911()＝18911，取代未部署候選的TOKEN_POINT_511111()；須更新ABI，外部新消費者不能再用舊getter。
- Furnace與Output：TOKEN_POINT()＝18911；Furnace仍是18911，Output仍是168888。
- Output constructor的KUFO參數中性命名為kufoToken，型別、順序與實際immutable綁定不變。
- KSHIP：TOKEN_POINT_511111()＝511111。
- 既有KSHIPConverter：WORMHOLE_POINT_511111()＝511111，作為同一產物鏈的出生蟲洞。

以上是世界點位標記，不把Furnace的實址當KUFO token實址，也不把點位當0x地址。Registry key、owner／角色、KAIOS真burn、鑄造比率、供應額度、三年規則、持有人授權及單一路徑防重保持原設計。歷史KUFOClaimWormhole.sol是舊KUFO成熟領取，沒有改名冒充新KSHIP蟲洞，其Registry key與舊LIVE保持歷史。

新增驗證只針對新原碼／ABI／出生鏈：原真實alchemy案例讀回各點位與immutable，核同一KAIOS burn、168888出料事件、KUFO出生及第三共同年界轉化、KSHIP carrier proof與受益人數量守恆。實際編譯／EVM結果與固定提交以本節後的交付證據及新審核manifest為準；舊69項與舊包不作本次新指紋通過證據。

### 部署狀態

此為上鏈前審核候選。尚無本版正式部署地址、constructor實參、簽署、交易回執、proposal或executableAt。舊LIVE與舊CI不證明新版部署。應先完成來源與Writer核對、相稱驗證、實址／角色／既有權利切換與原費用核驗，再由合法持有人本人既有錢包確認部署及原Registry啟用；AI不代簽、送部署或自行開真單。原身份核對兩次停止與其他具體HOLD不變。

### 本次固定程式與相稱驗證（世界點位對齊）

固定程式／測試提交：`b0823224273b3b7cadd421086284dcb86adc1ce1`。solc0.8.24、OZ5.0.2、optimizer runs1、viaIR、paris、metadataHash none；新36合約編譯PASS、0warnings，standard-input SHA256 `db9467bafa46902343481a4ec0eb6ce5d8b1926a50a3f9c5973f8309f76b5057`。compile log SHA256 `37342aad0a619bd2b34fbb561066fa4c9c84b4537575b6a9972ba9a8e6ad6353`。

一次受影響suite選取1項真實alchemy／KSHIP EVM與4項ABI，**5/5 PASS，0fail/skip/cancel，21784.8102ms**；本次實測UTC2026-11-14T06:09:16.431Z。原其餘30個EVM案例未選取，不稱全部重驗；舊69項仍按舊提交分列。Windows Ganache的µWS原生binary不匹配，原log保留NodeJS fallback，實際EVM案例執行成功，未改環境或依賴。測試log SHA256 `aa4ed57774af1d9e0bba9184eaddf8a41457f01442072f27dc7152cb495d6843`。獨立靜態diff審查NO_BLOCKER，非外部審計認證。

新getter／ABI須配套新artifact，不可套用c428舊ABI或舊gas估價。未新增RPC、runtime／immutable身份重試、簽署或公共交易；原身份核對兩次停止保持NOT_VERIFIED。正式constructor、activation timestamp、deployer／nonce、新合約地址、proposal、receipt、executableAt仍未配置／null。K108000／KGOD／111111／12345屬未實作世界接續。交付head與新包逐檔SHA由原工程窗口保存；仍是未部署候選。
