# KUFO 仙丹白皮書

## 2026-11-13 累積工程接續：共同年界與正式入口

文件沿原 #637 與 Human 提供的 V5.0 年度批次定案累積更新。正式名稱／代號為 **KUFO**；
V4/V5 僅是本文件及來源沿革，不加入代幣名稱或合約入口。
本節是現行工程規格；下方前版正文完整保留，其「三秋」、未配置星座、V4 檔名及歷史測試數量均須依本節修正解讀，不構成新版已驗收或部署。

### 完整協議規格

世界流程為 KAIOS → K18911 太上老君煉丹爐 → K168888 筋斗雲出料 → K511111 KUFO → KSHIP。
點位是世界功能識別；實際合約、收款／受益人地址與鏈別必須另外核實，不能以數字點位送款。
持有人授權 Furnace 銷毀 KAIOS，同一筆成功交易按 1 KAIOS = 1,000 KUFO 即時出料至指定受益人。
KGEN 只查當下餘額，至少為 KAIOS 投入量 / 1,000；不扣除、不鎖定、不要求 KGEN 授權。
Furnace 須證明 KAIOS 餘額與總供應量實際下降；路由回傳數值不能代替 canonical KUFO 的實際鑄幣證據。
任一步出錯，包含關閉發行期、額度不足或錯誤／惡意出料路由，整筆回滾。

跨共同年界後，第一年累計可轉化原發行額 50%，第二年 75%，第三年 100%，第三年結清所有餘額與尾差。
共同年界不是各筆持有滿週年；年末出生也依共同邊界計算。每 1 KUFO 最終對應 1,000 KSHIP。
到期只產生可轉化資格；候選由持有人或明確授權流程送出轉化交易，年界不自動掃描、扣幣或代簽。
漏年可永久補結；發行期結束不取消補結權。轉讓同時搬移剩餘第一／第二／終局三段權利，不能重設出生年或重算已耗用額。
每段以整數精度計算，終局吸收全部尾差；轉讓以累計比例切分後相減，父子分組守恆。
KUFO 終身發行候選上限為 72,000,000,000,000 枚；轉化銷毀不恢復可重發額度。KSHIP 比例固定為其 1,000 倍，不新增稅率或任意鑄幣權。

### 出生標識、曆法與有界操作

每筆鑄造不可變記錄 bornAt、共同出生年、出生生肖、出生星座及 calendarHash。
financial yearStarts 與生肖／星座精確窗口分開提交；不得默認財務年界等於生肖年界，不以每月一星座代替精確窗口。
窗口必須連續、無重疊、完整覆蓋發行區間，且生肖與星座均已配置。calendarHash 綁定全部時間與窗口資料。
轉讓權利按共同年與出生窗口交集分組；同分組可合併，不能為每次收款無界新增 lot，也不能只靠歷史事件宣稱當前持有人出生屬性完整。
出生時間是每筆原始證據；現存份額保留其出生分組／生肖／星座與剩餘年度權利。

工程候選限制最多 32 個發行年、512 個出生窗口，每筆批次處理最多 32 個選定 group。
這些是待驗證的複雜度上限，不是 Human 已核定的正式發行期限、曆法或經濟參數。
一般轉讓／轉化若需要超過單次限額會整筆拒絕，持有人可用升序唯一 group IDs 分批轉讓或轉化，未處理份額的權利保留。
這種明確批次是同一核心的操作入口，不是第二個代幣或獨立帳冊。

### 餐廳與生命活動力

商家可以用自有 KUFO 庫存、補貼及利潤提供不同數量，不改變協議 1:1,000 鑄造比例。
「餐廳收 10 KAIOS，吃後給 500 KUFO」只描述待研究的庫存交付流程；不等於以 10 KAIOS 協議鑄出 500 KUFO。
「100 萬維持量」尚不是已核定活動力門檻。付款、交付、退款、庫存來源與活動力依持有量變動的公式均待需求定案，不能在本輪偷渡為合約參數或已部署功能。
候選到年界只增加可轉化資格，持有人送出轉化前實際KUFO餘額不下降；活動力若僅依實際持有量，年界本身也不會降低活動力。這項需求差異仍須Human明定，不能自行改成自動扣除或代送交易。

### 正式來源與部署關卡

唯一正式來源為 `KGEN-KAIOS/contracts/KUFO.sol`、`KAIOSAlchemyFurnace.sol`、
`KUFOOutputJindouyun168888.sol` 與既有 KSHIP／Converter；純投影為 `KGEN-KAIOS/runtime/kufo-policy.mjs`。
版本／SHA 留在原始碼與工程證據。main 舊制與候選安全案例都必須保留並驗證固定最終提交。
Registry 更新不是安全認證：真 burn proof、canonical mint 後置條件與 holder allowance 不能因路由是「現任」就略過。
合法 holder 仍須核准精確 Converter 地址與相稱 allowance，不能向未知 spender 無限授權。

生效時間、正式曆法／時區、N 年發行期限、N+3 年界、生肖邊界及星座精確窗口全部尚待 Human 核定。
曆法未定前 constructor 編碼、正式 creation bytecode、含 immutable 的 runtime hash、部署地址與治理 executableAt 留空，不用合成測試值冒充。
原部署 Furnace V1 保留為歷史，舊 proof 不自動移入年度 KUFO。ABI 相容不能改寫舊 KSHIP／Converter 的 immutable 綁定。
最終編譯、測試、安全審查與參數核准通過後，由有實際權限的合法持有人按原流程使用本人錢包確認部署／治理；AI 只準備與唯讀核對，不持有秘密、不簽署、不送交易。
完整地址盤點、constructor／角色／編譯設定／位元碼驗證清單及本輪證據，累積保存於 `KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md`。

## 前版完整正文（SUPERSEDED 工程沿革，保留不刪）

共用年界三秋轉化制 · 完整規格與工程交接

文件版 V5.0 · 2026-11-06｜候選核心 4.1.0-candidate｜狀態：工程審查候選，尚未部署。

### 一、定位與主流程

KUFO 仙丹是由 KAIOS 煉化產生的新候選代幣，承載文明世界中的質量與能量敘事。它與既有 KAIOS 分工不同；本版完整定義即時煉丹、出生標識、年度轉化及 KSHIP 接續關係。遊戲中的仙丹、反物質與能量均為系統表徵，不構成真實物質生成、健康或延壽功效。

仙丹的公開幣名與代號固定為 KUFO，不加版本尾碼。正式合約、檔案、模組及 ABI／產品入口也使用無版本的穩定名稱，如 KUFO.sol、KAIOSAlchemyFurnace.sol；不得以 V4、V5 另開正式產品。版本資訊只留在來源標頭、Git 提交、文件修訂及稽核沿革。既有帶版本的檔案是候選歷史來源，不是最終正式入口。若 main 已有同名舊制檔案，先盤點依賴、相容性及歷史保存，再遷移到唯一正式入口，不可直接覆蓋或讓兩套同時自稱 CURRENT。

> KAIOS → K18911 煉丹爐 → K168888 筋斗雲出料 → K511111 KUFO → KSHIP

K18911、K168888 與 K511111 是世界座標與功能點，正式部署時另綁定實際鏈上合約地址。KSHIP 沿用程式庫中的正式代號；口語中的反物質或其他音譯，不構成另發新幣或更名決議。

| 項目 | 本版規則 |
| --- | --- |
| 協議產出 | 銷毀 1 KAIOS，產出 1,000 KUFO |
| KGEN 條件 | 當下錢包餘額至少為 KAIOS 投入量 ÷ 1,000 |
| KGEN 的處理 | 僅查核餘額，不移轉、不銷毀、不鎖定 |
| 出料時間 | 成功交易中即時出料，沒有 49 Epoch 等待 |
| 三秋轉化 | 共用年界後，累計可轉化 50%／75%／100% |
| 終局比例 | 每 1 KUFO 最終對應 1,000 KSHIP |

年度轉化規則已確定；正式曆法、時區、年界與出生生肖錨點等參數仍需在部署清單中定值。白皮書確立的完整產品要求與候選程式目前完成的範圍，於第八節分別列明。

## 二、即時煉丹與來源證明

### 2.1 固定協議公式

> 設投入量為 A KAIOS：
> 所需 KGEN 餘額 G ≥ A ÷ 1,000
> 銷毀 KAIOS = A；即時鑄造 KUFO = 1,000 × A

投入者授權既有 KAIOS 核心使用指定額度，再由目前登錄的煉丹爐提交煉化。KGEN 只做同次執行中的餘額觀察；它不是另外一筆成本、抵押品或催化劑存款，也沒有持有天數與稅額累積條件。餘額查核不代表已證明長期持有或排除借入資金。

### 2.2 以 3 KAIOS 為例

| 步驟 | 數量與結果 |
| --- | --- |
| 投入 | 3 KAIOS |
| 餘額資格 | 錢包至少持有 0.003 KGEN |
| 煉化 | 銷毀 3 KAIOS；KGEN 餘額不因本步驟扣減 |
| 出料 | 同筆成功交易向指定受益人產出 3,000 KUFO |

小額範例同樣成立：0.001 KAIOS 搭配至少 0.000001 KGEN 的當下餘額，可產出 1 KUFO。數量按代幣最小單位運算；候選爐目前要求 KAIOS 原子單位投入至少 1,000，且為 1,000 的整數倍，並非要求最少投入 1,000 枚 KAIOS。

### 2.3 一次證明、固定受益人、原子完成

KAIOS 銷毀紀錄是上游依據。煉丹爐建立 proofId，出料器只能消耗該證明一次，並依既定受益人與數量發料；KUFO 鑄造端再次拒絕重用 proofId。出料器不得更換受益人或額度。

若驗證、出料、曆法開放狀態或供給上限任一環節失敗，整筆同步交易回復，包含上游 KAIOS 銷毀。不得形成「已付 KAIOS，卻因下游失敗沒有 KUFO」的半完成狀態。

## 三、共用年界與三秋轉化

同一已設定出生年度內鑄造的 KUFO 使用共同年界。年齡由出生年度與共用邊界計算，並非從每筆收款時間另外倒數一年。年末出生者可能很快到第一個年界；同年度的較早出生者也在該邊界取得第一秋資格。

| 跨越的共同年界 | 本次新增資格 | 累計資格 | 全額結算後 KUFO |
| --- | --- | --- | --- |
| 尚未跨越 | 0% | 0% | 原始量 100% |
| 第一年界 | 原始量 50% | 50% | 原始量 50% |
| 第二年界 | 原始量 25% | 75% | 原始量 25% |
| 第三年界及以後 | 全部剩餘，含尾差 | 100% | 0 |

> 沒有 10 秒、10 分鐘或 10 小時的強制轉化倒數，也不做逐秒、逐分轉化。每次年界到達後，當年應到期的整份額立即具備結算資格。

### 3.1 資格到期與實際交易

時間經過會改變可結算額；鏈上仍需持有人或其明確授權的流程送出交易。協議不會自行逐一掃描全球錢包。一般轉帳、買賣及新鑄造均不會偷偷替持有人結算。候選核心目前由持有人呼叫既有 KSHIPConverter.convert(amount, beneficiary) 結算。

### 3.2 漏年補結與重複操作

以尚未拆分的出生量 M 示意：累計目標依序為 floor(M÷2)、floor(3M÷4)、M；本次可結算量為累計目標減去已轉化量。跳過第一年、第二年再操作，可補結累計 75%；第三年才操作，可一次處理全部剩餘。相同資格不會重複給付。拆分或轉讓後則必須依持有人實際承接的剩餘分期帳結算，不可重用原始量重新領取。

### 3.3 3,000 KUFO 的完整結果

第一秋 1,500 KUFO → 1,500,000 KSHIP；第二秋再 750 → 750,000；第三秋結清剩餘 750 → 750,000。總計 3,000,000 KSHIP，該批 KUFO 歸零。最小單位尾差一律歸入最後一期，第三秋結清時不得留下永久殘值。

## 四、出生生肖、星座與轉讓

### 4.1 出生標識應永久固定

每次 KUFO 鑄造均應記錄出生時間、出生年度、出生生肖與十二星座標識，並綁定不可變的曆法版本。生肖按正式出生年份及錨點推導；星座按正式出生日期與時間窗判定。所有持有人共用相同定義，不因國籍、所在地或介面語言改變。

| 欄位 | 規則 |
| --- | --- |
| bornAt | 實際鑄造區塊時間；轉讓不重置 |
| birthYear | 按已核定年界取得；轉讓保留 |
| birthZodiac | 按已核定生肖年曆及首年錨點取得 |
| birthConstellation | 依已核定十二星座精確時間窗取得 |
| calendarVersion／Hash | 可重現計算的規格版本與完整設定摘要 |
| proofId／amount／beneficiary | 不可變的原始鑄造來源紀錄 |

十二星座不得簡化成「一個月份固定一個星座」。日期界線、時間精度、時區、跨年窗口、閏日及邊界瞬間的歸屬，都要有明確、可測試的共同表。財務年界可與生肖年曆分別定義，但必須明載兩者的對應，不得暗中把不同曆法混成同一個年份。

### 4.2 轉讓保留權利與年齡

買賣、拆分、送禮、跨錢包及同年度合併，均不得讓 KUFO 變年輕、重新產生已消耗的轉化額，或改寫出生生肖與星座。成熟但未領取的分期權利隨所轉讓份額移轉。出生屬性與依現在年份顯示的當年生肖是兩種資料，後者不得覆寫前者。

### 4.3 候選程式目前的缺口

現有核心已有不可變 mintOrigin，生肖依 firstBirthZodiac 與年份偏移取得；birthConstellation 仍為 0／UNCONFIGURED。按年合併的可替代餘額也無法證明後來每一枚幣來自哪筆鑄造。僅補寫來源事件，不足以宣稱轉讓後的每枚星座均可追蹤。工程須補齊可保留出生星座的有界餘額／轉讓模型及測試，再宣告本節完整實現。

## 五、有界帳本、尾差與守恆

### 5.1 三份剩餘權利

候選核心對每個持有人、出生年度存放 first、second、terminal 三份剩餘量。每次鑄造 M，增加 floor(M÷2)、floor(3M÷4)−floor(M÷2)、M−floor(3M÷4)。同年收到多筆直接累加，已消耗的份額不重新計算。

部分轉讓以完整精度比例分配既存分期，先算累計，再用相減求各期份額；寄件人扣除的每一個原子單位，必須恰好等於收件人增加量。實際煉丹爐輸出的 KUFO 原子量可被四整除；人造最小單位測試仍需驗證第三期能清除所有尾差。

### 5.2 交易成本必須有上界

不得讓每次小額收款新增必須永久遍歷的獨立批號。候選 4.1.0 目前採最多 32 個發行年度槽位，且使用 N+3 個明確邊界，讓最後一個發行年度仍能走完三秋。槽位不循環重用；發行窗口關閉後，已到期權利仍可永久結算。

> 32 年是目前候選程式的複雜度設計，不是已經同意的永久宇宙規則。是否採納此發行期限，必須在部署參數中明確決定；不得把它包裝成無限期發行。

加入星座後，工程可沿用既有核心設計有界的出生年×星座分組，並提供持有人授權的分批結算／移轉入口。具體資料結構必須以最壞歷史與最壞分組實測證明活性；不能因星座細分而恢復灰塵攻擊，也不能僅用「超過上限就失敗」令合法餘額永久無法移動。

### 5.3 供給與來源守恆

> KUFO 流通量 + 已轉化銷毀量 = 累計煉丹鑄造量
> 每份已完成承載證明：KSHIP 產出 = KUFO 銷毀量 × 1,000

候選核心的 KUFO 上限為 72,000,000,000,000，且同時限制終身累計鑄造量；轉化銷毀不會釋放重新鑄造額度。其對應 KSHIP 上限為 72,000,000,000,000,000。此產品不新增 KSHIP 半衰期。供給常數仍應與最終部署清單及下游承載上限逐項一致。

## 六、市場使用與信任邊界

### 6.1 協議鑄造與餐廳報價分帳

協議始終按 1 KAIOS → 1,000 KUFO 鑄造。餐廳或其他商家可依自有庫存、利潤及補貼，報價 1 KAIOS 兌 100、1,000 或 2,000 KUFO；商家必須自己備妥應付數量並記錄補貼來源。報價不是修改協議產出倍率的權限。

| 帳目 | 必須辨認的內容 |
| --- | --- |
| 協議發行 | KAIOS 銷毀證明、固定產出比率、KUFO 鑄造 |
| 商家庫存 | 取得來源、實際交付數量、出生分期 |
| 商業差額 | 收入、成本、補貼與利潤分別記錄 |
| 持有人畫面 | 可用餘額、已到期額、出生年／生肖／星座 |

### 6.2 不可變代幣與可更換路由

候選 KUFO 沒有任意管理員鑄造、黑名單、沒收、原生轉帳稅或代理升級入口。但授權出料器與轉換器仍由外部 Organ Registry 決定。代幣位元碼不變，不等於登錄路由沒有管理信任；部署包必須列明治理者、角色、延遲機制與目前綁定地址。

### 6.3 必測的濫用情境

重放鑄造或轉換證明、未授權呼叫、受益人替換、投入與產出比率偏差、到期前搶領、轉讓重置年齡、反覆拆分重複領取、同年灰塵轟炸、長期休眠後一次結算、最小單位尾差、終身供給耗盡與下游上限，均須有會實際失敗的對抗測試。

### 6.4 未來自願活動的界線

未來可另設人工發起、持有人自願參加的短秒數煉丹活動，例如 10 秒活動提示；本版不實作該功能。活動參加條件、資金來源及使用者授權需獨立定義，不能取代、延後或提前扣除本白皮書的強制年度分期，也不能偷偷改變協議鑄造比率。

## 七、衡曜工程改版交接

沿用既有 Product 05 與 review/kufo-annual-cohort-core-20261106 候選核心，確認原負責者與工作權限後續作。保留既有 V1、原 PR 與研究歷史，不重開同功能產品，不覆蓋舊分支，也不將下游 #211／#212 當作重複案件關閉。

| 正式穩定位置 | 需完成的改動 |
| --- | --- |
| contracts/KUFO.sol | 來源 contracts/KUFOV4.sol；保留年界三分期、終身上限與證明守恆，補精確星座及可轉讓的有界帳。 |
| contracts/KAIOSAlchemyFurnace.sol | 來源 KAIOSAlchemyFurnaceV4.sol；維持 KGEN 餘額證明、1:1000 即時產出及失敗原子回復。 |
| contracts/KUFOOutputJindouyun168888.sol | 來源 KUFOOutputJindouyun168888V4.sol；維持固定受益人、數量與一次 proof，驗證登錄綁定。 |
| runtime/kufo-policy.mjs | 來源 runtime/kufo-v4-policy.mjs；共用年界／生肖／星座規格，僅做投影，不另建權威帳本。 |
| 既有 KSHIP／Converter | 沿用正式代號與 proof ABI；驗證新增分組或分批入口仍只轉換已到期份額。 |
| tests 與 reports | 擴充既有年度、轉讓、星座、尾差、灰塵、長期休眠、gas 與來源相容性測試。 |

以上相對路徑均以 KGEN-KAIOS/ 為根。既有周年生日、逐秒連續半衰、49 Epoch、催化劑銀行及 64 獨立批號限制只保留為歷史；不得再接回新產品執行路徑。候選共用年界已完成的部分應保留並重測，不必重寫。

### 7.1 必交付的可審查成果

交付同一產品的精確差異、完整曆法設定與 hash、出生欄位與分組設計、轉讓／補結演算法、最壞 gas 上界、測試輸出，以及確切來源提交 SHA。UI 如有變動，另附實際瀏覽器功能與畫面驗證。文件須明確標示已完成與仍待補實作的條目。

### 7.2 從確認到上鏈準備

改版完成後重跑該提交的編譯、EVM、安全與既有回歸；備妥鏈別、地址、建構參數、角色、路由延遲、供給上限、位元碼摘要、驗證指令及部署順序，交由已授權簽署者審查執行。沒有曆法與星座定值、部署沿革和精確測試證據，不得標記為可上鏈。本文及文件推送本身不代表已完成部署。

## 八、部署參數與證據狀態

| 項目 | 目前狀態／部署前工作 |
| --- | --- |
| 財務年界 | 年度整份到期已確定；正式曆法、時區、邊界時間與版本待定值。 |
| 出生生肖 | 候選有年份偏移；須核定生肖曆法、12生肖順序與首年錨點。 |
| 十二星座 | 候選為 UNCONFIGURED；須核定時間窗並補實作及轉讓保存。 |
| 發行期限 | 最多32年度是候選設計；採納或修改後須重新驗證成本與活性。 |
| 正式部署 | 尚無本版已核定地址、建構參數或鏈上收據；不得宣稱已啟用。 |
| CURRENT 對齊 | Physics CURRENT V3.8 的舊連續半衰敘述須依正式變更程序調和。 |

### 8.1 已知工程證據

候選核心來源提交：3c92efd72a12404f95d95c573e428434d8c26e55。既有工程報告記錄：33 個合約編譯、14 項 EVM 行為測試、20 項策略／介面／研究測試，以及 91 項既有回歸均通過。這是該來源報告的結果；本白皮書編製並未重新執行上述程式測試，也未宣稱目前 main 或新增星座實作已通過。

報告中的灰塵後轉讓為 118,590 gas、32 年度全部轉讓為 2,331,812 gas。這些數字只適用於既有候選資料結構；加入星座分組後必須重新量測，不能沿用為新結構的通過證據。文件本身經可編輯檔產出與逐頁版面驗證。

### 8.2 正式來源與沿革

[S1] KGEN-KAIOS/contracts/KUFOV4.sol：年度分期、來源欄位、上限與轉讓。
[S2] KGEN-KAIOS/contracts/KAIOSAlchemyFurnaceV4.sol：餘額證明、比率及即時輸出。
[S3] KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md：候選整合與驗證報告。
[S4] KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md：累積式候選規格及保留的舊版。
[S5] docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md：既有物理 CURRENT。

S1～S4 以本頁來源提交固定版本查核；S5 仍為目前 CURRENT，本文沒有修改它。#201 是原產品工程沿革；#600 的獨有研究須保留後整合；#158 是舊設計留存。既有下游與部署歷史應維持可追溯。


### 固定來源連結
- [S1](https://github.com/klineodyssey/kline-odyssey/blob/3c92efd72a12404f95d95c573e428434d8c26e55/KGEN-KAIOS/contracts/KUFOV4.sol)
- [S2](https://github.com/klineodyssey/kline-odyssey/blob/3c92efd72a12404f95d95c573e428434d8c26e55/KGEN-KAIOS/contracts/KAIOSAlchemyFurnaceV4.sol)
- [S3](https://github.com/klineodyssey/kline-odyssey/blob/3c92efd72a12404f95d95c573e428434d8c26e55/KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md)
- [S4](https://github.com/klineodyssey/kline-odyssey/blob/3c92efd72a12404f95d95c573e428434d8c26e55/KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md)
- [S5](https://github.com/klineodyssey/kline-odyssey/blob/main/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md)


---

## 完整保留：4.1.0 候選技術版及其歷史附錄

以下來源全文原樣保留，供技術細節與歷史追溯。V5.0 的共用年界、完整出生生肖／星座要求及本文件的狀態說明優先。下文關於星座未設定不阻擋候選核心的敘述，只描述當時完成範圍；不代表 V5.0 完整產品已實作或已具部署條件。舊周年生日與64批次設計仍僅屬歷史。文件V5.0不變更程式版本4.1.0-candidate。

# KUFO V4 Whitepaper — cumulative annual-cohort candidate

Status: REVIEW CANDIDATE / NOT DEPLOYED / NO LIVE ACTIVATION
Current candidate core version: `4.1.0-candidate`
Solidity: `0.8.24`; OpenZeppelin Contracts: `5.0.2`
Architecture: non-upgradeable token; no proxy or calendar setter
Primary lineage: KAIOS → K18911 furnace → K168888 outlet → K511111 KUFO → KSHIP

This is a complete current description followed by the preserved historical edition.
It integrates the existing PR #201 candidate at
`8b4ccd8c008886f82853ba0f0c064b9217e73894` and the calendar/zodiac research from
PR #600 at `2062b7b94959cf5e0d4aaf408677505bb4bcb6e1`. It does not replace a
deployed V1 contract, rewrite historical KAIOS, or assert that candidate addresses
are live. The current main `KAIOS.sol`, `KSHIP.sol` and `KSHIPConverter.sol` sources
are retained. K511111 and K168888 are world coordinates, not literal EVM addresses.

## 1. Immediate protocol issuance

The holder supplies KAIOS and authorizes the current furnace through a KAIOS
allowance. KAIOS verifies that furnace, spends that allowance, burns the holder's
authorized KAIOS and records its alchemy proof. The V4 furnace requires the
holder's current KGEN balance to be at least `KAIOS input / 1000` and immediately
outputs `KAIOS input × 1000` KUFO to the beneficiary chosen for that proof.

For example, `0.001 KAIOS` plus a current balance of at least `0.000001 KGEN`
produces `1 KUFO`. KGEN is observed only: no KGEN transfer, burn, lock, allowance,
holding-age or tax-history requirement is introduced. There is no 49-epoch or
130-day delivery wait. Current-balance observation proves neither durable
ownership nor that the balance was not borrowed.

The K168888 output consumes the furnace's proof once. Its release API cannot
substitute another beneficiary or amount. KUFO separately rejects a reused mint
proof. Reverts anywhere in the synchronous furnace/output/mint path roll back
the KAIOS burn and all associated state, including a closed-calendar or cap failure.

The furnace accepts at least 1,000 KAIOS wei in multiples of 1,000. Consequently
protocol-issued KUFO amounts are multiples of 1,000,000 wei and divisible by four.

## 2. Shared annual cohorts and terminal Three-Autumn rule

Every issuance within the same configured birth-year interval belongs to the
same annual cohort. Birth-year boundaries are common calendar timestamps, not
the anniversary of each receipt. Conversion becomes eligible as follows:

| Configured boundary crossed since birth year | Cumulative original KUFO eligible | Remaining after full eligible conversion |
|---|---:|---:|
| None | 0% | 100% |
| First | 50% | 50% |
| Second | 75% | 25% |
| Third or later | 100% | 0, including every integer remainder |

A receipt issued one second before a year boundary reaches its first Autumn one
second later. A receipt issued earlier in the same birth year reaches that same
Autumn. This consequence is intentional in the candidate and must be understood
before production approval.

Time passing changes eligibility only. Ordinary transfers, purchases, sales and
new mints do not burn KUFO or mint KSHIP. The holder explicitly calls the existing
`KSHIPConverter.convert(amount, beneficiary)` to settle eligible material; the
converter binds the KUFO owner to its caller. A holder may convert partially,
repeat with newly eligible amounts later, or skip a year and catch up. After the
third boundary, converting the full remaining balance leaves zero KUFO. Previously
consumed tranches cannot be consumed again.

## 3. Explicit immutable calendar and bounded issuance horizon

The constructor takes the registry address plus these calendar inputs:

| Input | Meaning |
|---|---|
| `calendarVersion` | Nonzero version identifier chosen for the reviewed configuration |
| `firstBirthYear` | First year label; year labels increase consecutively |
| `firstBirthZodiac` | Explicit zodiac anchor index in the shared twelve-zodiac order |
| `yearStarts` | Strictly increasing, nonzero `uint64` timestamps |

For `N` issuance years, `1 ≤ N ≤ 32`, the array contains `N + 3` timestamps.
Issuance year `i` uses `[yearStarts[i], yearStarts[i+1])`; its three maturity
boundaries are indices `i+1`, `i+2`, `i+3`. New issuance closes permanently at
`yearStarts[N]`. The last issuance year, index `N-1`, becomes terminal at
`yearStarts[N+2]`. Final conversion remains available forever after that timestamp.
No year index wraps, no old cohort slot is reused, and no calendar can be appended
or changed after construction.

The source fixes a complexity ceiling, not an approved economic duration.
**This finite issuance horizon is a candidate design choice requiring explicit
production approval.** It is how this implementation bounds dormant historical
cohorts as well as currently active ones. It must not be silently presented as
perpetual issuance or an already approved universe rule.

`calendarHash = keccak256(abi.encode(calendarVersion, firstBirthYear,
firstBirthZodiac, yearStarts))`; the registry address is excluded from that calendar
hash. Reviewers can reproduce it from the complete configuration. No Gregorian,
lunar or fixed K280 year boundary is selected by this source. Test calendar dates
and accelerated clocks are fixtures, not canon. Formal production configuration
is absent and deployment remains blocked until it is approved and verified.

Before calendar activation, contract `currentYear()` reports the first year and
`currentAutumn()` reports zero; minting still rejects. Pure policy helpers instead
reject times before their calendar with `TIME_BEFORE_CALENDAR`. After the final
boundary, the contract and policy projections clamp their settlement year to the
final configured year so expired issuance never expires the conversion right.

## 4. One cohort balance, exact tranches and transfer behavior

Each holder/year stores only three remaining integer tranches: `first`, `second`
and `terminal`. A mint of amount `A` adds `floor(A/2)`,
`floor(3A/4)-floor(A/2)`, and `A-floor(3A/4)` respectively. Same-year receipts merge
by addition. Already settled state and incoming unsettled state can therefore
merge without recalculating old targets or recreating consumed entitlement.

Rounding is fixed per mint proof and never recomputed from a merged balance.
For real furnace outputs, divisibility by four makes the 50% and 75% targets exact.
Artificial smallest-unit test mints can round early targets down, and all remaining
units still belong to the third tranche. For example, a one-wei proof becomes
fully convertible at the third boundary rather than persisting forever.

For a partial transfer of `x` from live balance `L`, let remaining tranches be
`F`, `S`, `T`, with `L = F+S+T`. The recipient receives:

```text
childFirst = floor(F × x / L)
childFirstPlusSecond = floor((F+S) × x / L)
childSecond = childFirstPlusSecond - childFirst
childTerminal = x - childFirstPlusSecond
```

The sender subtracts exactly those amounts. `Math.mulDiv` handles intermediate
products safely. Every child tranche stays within the corresponding parent
tranche, every tranche total is conserved, and the child balance sums to `x`.
Transfers keep the birth-year key, never settle decay, and never reset age. The
receiver's same-year balance coalesces by addition, including partial or mature
receipts. Self-transfers and zero-value ERC-20 transfers create no extra cohort.

No operation walks a receipt list. A transfer or carrier burn examines at most
the immutable `N ≤ 32` issuance-year slots, even after malicious repeated dusting
or decades of skipped settlement. More than 64 receipts therefore cannot create
the old 64-lot lock. Repeated receipts increase immutable proof history, but proof
history is not traversed by transfer or conversion.

## 5. Birth metadata and provenance limits

Each mint proof permanently records its original beneficiary, amount, timestamp,
birth year, birth zodiac and birth constellation. The birth zodiac follows the
configured anchor and remains source information. An active zodiac can be derived
offchain from the configured anchor and `currentYear()` reference; it does not
rewrite birth zodiac. After the configured horizon that reference is clamped,
not a claim that the real-world calendar stopped.

`birthConstellation = 0` means **UNCONFIGURED**, not a guessed star sign. Missing
precise constellation boundaries does not block this candidate token core.

The immutable proof origin and emitted events preserve issuance provenance.
Balances are fungible within birth-year cohorts: coalescing does not provide a
cryptographic per-coin trail from each later recipient back to one particular
mint proof. No such tracing guarantee is claimed.

`threeAutumnState` in the pure policy module projects an unsplit origin proof.
Actual holder entitlement after transfers or coalescing is calculated from
remaining tranches (`claimableTranches` offchain, `claimableDecay` or
`claimableTotal` on the contract), not by projecting the original proof again.

## 6. Carrier conversion, conservation and supply

The existing holder-authorized converter creates a unique carrier proof and asks
KUFO to consume only eligible tranches. KUFO verifies the current registered
converter, rejects replay and records `owner`, `beneficiary`, `converter`,
`kufoBurned`, `expectedKship`. Existing main KSHIP independently reads that record,
checks the current converter and exact `expectedKship = kufoBurned × 1000`, and
marks the carrier proof consumed before minting to its recorded beneficiary.
The converter checks the returned beneficiary and amount in the same transaction.

The accounting laws are:

```text
KUFO totalSupply + totalDecayedForKship = totalMintedFromAlchemy
Every accepted carrier proof: KSHIP minted = KUFO burned × 1000
Completed converter path: KSHIP totalMintedFromKufo = KUFO totalDecayedForKship × 1000
Terminal lineage: 1 KUFO → 1000 KSHIP
```

`MAX_SUPPLY = 72,000,000,000,000 KUFO`. This candidate also limits **lifetime**
`totalMintedFromAlchemy` to that amount. Decay does not free new issuance capacity;
otherwise repeated burning and reminting could exhaust KSHIP's fixed cap and lock
future conversion. The corresponding KSHIP maximum is
`72,000,000,000,000,000 KSHIP`. Product_05 introduces no KSHIP half-life.

## 7. Protocol ratio, merchant prices and trust boundary

The protocol furnace ratio is fixed at 1,000 KUFO per KAIOS. A restaurant or other
merchant may quote 100, 1,000 or 2,000 KUFO for 1 KAIOS using its own inventory,
margin or subsidy. Such a quote does not modify protocol minting. Inventory
acquisition, profit, subsidy and protocol issuance must be accounted separately.
This candidate adds no restaurant UI or merchant settlement mechanism.

The KUFO token has no owner/admin mint API, blacklist, seizure function, native
transfer tax or proxy upgrade mechanism. Its authorized output and converter are
still resolved through a **mutable external Organ Registry**. Registering a
malicious output or converter can violate issuance or holder-authorization
assumptions. Bytecode immutability does not remove that registry trust. Production
requires reviewed bindings, roles, governance delays and receipt evidence.

## 8. Deployment prerequisites and verification status

No deployment, asset movement, signer use, registry change, real mint/burn,
governance action or main merge is asserted by this edition. Exact candidate
compile and local EVM results are recorded in the product implementation report;
historical CI is not evidence that this candidate passed.

Before production activation, require:

1. Approved calendar, version/hash, zodiac anchor and finite issuance horizon.
2. Reconciliation of Physics CURRENT V3.8 §238, whose continuous decay illustration
   leaves 12.5% after three years, with the user's latest annual 50/75/100% rule.
   This candidate follows the latest explicit engineering instruction; CURRENT
   has not been edited or silently superseded as a deployed constitution.
3. Exact-source compilation and local EVM tests covering boundaries, replay,
   allowance burn, beneficiary binding, partial transfers, dormant years, hostile
   dust, bounded gas, lifetime cap and terminal smallest-unit cleanup.
4. Verified existing KAIOS compatibility and complete KUFO/output/converter/KSHIP
   deployment bindings, with immutable V1 history and deployment lineage retained.
5. Action-specific human authorization and technical checks for deployment,
   registry/governance changes or any live asset operation.

PR #600's unique research files remain preserved. PR #158's old catalyst and
continuous-decay design is not reinstated. PRs #211 and #212 are downstream
products, not duplicate alchemy cases. This edition closes none of them.

## Preserved historical source edition — superseded candidate mechanics

The original PR #201 whitepaper follows verbatim. Its per-receipt anniversary,
31,556,926-second year, linked-list lots, 64-lot traversal behavior, source-overwrite
implications and historical review flow are archival descriptions, not the current
candidate's behavior or additional mandatory approval gates.

---

# KUFO V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KAIOS -> K18911 -> K168888 -> K511111 KUFO -> KSHIP

## 1. Purpose

KUFO is the KAIOS civilization mass produced by the K18911 alchemy product and delivered through the K168888 output organ to the K511111 KUFO world coordinate. K511111 is a KAIOS world coordinate and must not be interpreted as a literal EVM address.

KUFO V4 is designed as a non-upgradeable ERC-20 capped material token whose physical law is fixed at deployment. Organ routing remains replaceable through the KAIOS Organ Registry, but the deployed KUFO token implementation itself has no proxy upgrade path.

## 2. Immediate alchemy rule

The current Product_05 rule is:

- INPUT = KAIOS
- KGEN role = current wallet BALANCE PROOF ONLY
- required KGEN balance = KAIOS input / 1000
- KGEN transfer = NO
- KGEN burn = NO
- KGEN lock = NO
- KGEN holding days = 0
- KUFO output = KAIOS input * 1000

Example:

0.001 KAIOS input + wallet balance >= 0.000001 KGEN -> immediate 1 KUFO.

Old tax-proof, 49-epoch wait and 130-day hold requirements are superseded in this Product_05 lineage.

## 3. Three-Autumn decay law

KUFO V4 does not use an infinite exponential half-life. Each lineage lot has a terminal three-autumn schedule.

K280_YEAR_SECONDS = 31,556,926.

For each original KUFO lot:

- Before Year 1: 0% converted.
- First Autumn: cumulative 50% of the original lot converts to KSHIP.
- Second Autumn: cumulative 75% of the original lot converts to KSHIP.
- Third Autumn: 100% cumulative conversion; every remaining smallest unit is terminally consumed.

Final material relation:

1 KUFO -> 1000 KSHIP total.

No nine-autumn KUFO dust is permitted.

## 4. Transfer and market behavior

KUFO is transferable. Transfer does not reset decay age.

Each mint creates a lineage lot recording:

- owner
- initialAmount
- convertedAmount
- firstAutumnTarget
- secondAutumnTarget
- bornAt
- sourceProof

When a holder transfers or sells only part of a lot, the contract partitions the lot. The child lot inherits the original bornAt timestamp. First- and second-autumn cumulative targets are partitioned from the already committed original targets instead of being recomputed from scratch.

This is required so repeated buying, selling, splitting, or wallet movement cannot make KUFO younger and cannot defer its required decay.

Core invariant:

TRANSFER MUST NOT RESET DECAY AGE.

## 5. KSHIP conversion lineage

Matured KUFO can be burned only through the current Organ Registry KSHIP converter.

The converter creates a unique carrier proof. KUFO records:

- owner
- beneficiary
- converter
- kufoBurned
- expectedKship

KSHIP then independently reads that KUFO carrier record and mints only when the proof lineage matches the current converter and the exact 1:1000 relation.

Proof reuse is rejected.

## 6. Conservation

KUFO V4 tracks:

- totalMintedFromAlchemy
- totalDecayedForKship
- current totalSupply

The token exposes the invariant:

totalSupply + totalDecayedForKship == totalMintedFromAlchemy

A normal holder cannot arbitrarily burn KUFO outside the controlled decay path.

## 7. Supply and administrative surface

MAX_SUPPLY = 72,000,000,000,000 KUFO.

KUFO V4 has no owner mint, no arbitrary admin mint, no native transfer tax, no blacklist, no seizure function and no upgradeTo/upgradeToAndCall proxy mechanism.

The Organ Registry can change which external organ is authorized as the current output or KSHIP converter. This changes routing authority; it does not replace the KUFO token bytecode.

## 8. Bounded lineage traversal

One transfer or decay operation traverses at most 64 lots.

MAX_LOTS_PER_OPERATION = 64.

If the required operation would exceed that traversal bound, the operation fails closed instead of silently omitting lineage or decay accounting. High-frequency market use may therefore require future organ-level batching or safe lot-consolidation design, but no consolidation mechanism may reset bornAt or alter already committed decay targets.

## 9. Security boundaries

The V4 candidate requires review for:

- immediate proof replay protection
- current-output authorization
- current-KSHIP-converter authorization
- beneficiary binding
- partial-lot conservation
- Year 1 / Year 2 rounding preservation
- Year 3 terminal dust removal
- 64-lot fail-closed behavior
- KUFO/KSHIP exact conservation
- transfer-age preservation

## 10. Deployment boundary

This whitepaper describes a repository candidate. It does not assert deployment, Mainnet activation, registry mutation, signer execution, token transfer, governance approval or chain write.

The required flow is:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
