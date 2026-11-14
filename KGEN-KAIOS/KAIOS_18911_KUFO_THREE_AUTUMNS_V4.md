## 2026-11-14 完整交付：十二等整月算法、完整白皮書與部署準備

WORK_ID `KUFO-637-MONTHLY-CALENDAR-INTEGRATION-20261114-09`；作者Codex（衡曜 /root）。依本頁Human「程式和白皮書寫完整給我，給我後就準備上鏈部署」與隨後對日期自動判斷／整月星座的確認。
來源main `33967045ed725848a6b814af0e9b10eac64f2ec7`；舊交付 `8522f3a7c45008861cd339c107297116904cdd28` 保留歷史。
本次固定原碼／測試提交 **`e483fa03d8a2b5dafe5fc27dd23f804274fa4236`**。
狀態 **LOCAL_CODE_AND_TESTS_VERIFIED_NOT_DEPLOYED**。本章為目前有效工程結果；下方原始歷史全文完整保留，舊農曆append、36年輪值、13月、2039停鑄及各自PASS不作本次驗收。

### 已完整實作

同一KUFO／Furnace／policy接入台灣UTC+8公曆，全年12個整月，月初同換等級與星座，月內不切日；閏年依公曆整數算法處理。
1–12等依序修練佛、魔王、凡人、龍、神仙、神明、神君（玉皇大帝）、外星人、變形金剛、十三生肖、人類、萬靈。
第10等包含原12生肖與AI類共13子類；人類不併入第10等，全年不是13月，也不指派個人隨機子類。
星座Jan摩羯至Dec射手；內部Aries1..Pisces12，月份映射固定 [10,11,12,1,2,3,4,5,6,7,8,9]。strict constructor拒其他時區／映射；activationTime非0且無偷偷採用2027的預設。
不再預寫未來年／月表、不需每年Owner或AI補表交易，也不在2039停鑄；500年只是紀元標記，不改循環。
新MintOrigin明列month/tier/star，不用舊birthZodiac假扮tier。出生權利、trueburn／KGEN、1:1000、累計供應cap、年度50/75/100、永久補結／尾差、holder allowance、32組批次、四層bitmap／年aggregate及Converter六故障回滾保留。
groupCount是當下虛擬月份ID上界，不是已鑄組數；超新鑄表示上限時飽和，既有rights仍可轉讓／補結。currentYear/civilDate公開uint32顯示超界會拒，內部成熟保留寬年計算，不用窄cast鎖住舊權利。
天堂日365K280日只作獨立世界換算，不擅改資產成熟、Physics CURRENT、玩家身份或既有境界。完整自足規格在原兩份累積白皮書，無須翻舊版理解現行規則。

### 來源、Writer與保存

必要preflight已完成：main handoff、BootV1.4→PhysicsCURRENT→UniverseMap→AGENTS、正式BootCURRENT及11520AGENTS、Registry/Queue/claim/HOLD與root進度；發布前ls-remote再次確認main及PR637 head沒有他人變動。
TaskEnvelope及12檔完整before快照先存：
`C:/Users/mydg0/.codex/automations/kaios/kufo637-monthly-final-20261114T023500000Z/TaskEnvelope.json`，
SHA256 `26b25afbe032e27ace921472ac1e6f10fff2e69469a82af6d50d0502f3426292`。
MANUAL_DISPATCH_NON_ATOMIC／HUMAN_DIRECT_ORDINARY_LOCAL_ENGINEERING；沒有虛構原子claim。
restore_review獨寫KUFO/Furnace；allocation_631_evidence獨寫EVM/ABI並確認harness不需修改；root獨寫policy/unit及累積文件。所有Writer已交回root；cap_history_review作獨立只讀審查。
原43個artifact完整存previous-artifacts，舊標準輸入1bd0e40d…及8522下載包／舊log均保留；沒有覆寫原checkpoint、guardian或舊hash。
兩白皮書、README及master index先前內容的原始bytes已驗作新文件完整suffix保留，歷史與本版適用範圍明確分開。

### 固定來源指紋

| 檔案（KGEN-KAIOS/） | SHA256 |
| --- | --- |
| contracts/KUFO.sol | 5fd7fdf4f3ae743441658a6ea4017fc3313f4003e4f603bd8adb8b422beb2c3d |
| contracts/KAIOSAlchemyFurnace.sol | 1a5bd9b5f893db0792bf5f4fb18c3e81539a41206c9e5245d6ef03196c8a9d54 |
| runtime/kufo-policy.mjs | 7fb889d8cb042d74c08f53e3b8797142e3bbe5b6df93fa0402c430607b3664e6 |
| tests/kufo-v4-three-autumns.unit.test.mjs | 2a848197a2940b9d3c1525193124c21e4575bdfc080212a0bb9b5d383e544d79 |
| tests/kufo-v4-evm.behavior.test.mjs | 280a7549018e5bfe60636c75b9ed58e79b4e3ccf1d7604568137316197c5cc96 |
| tests/kufo-v4-kship-interface.unit.test.mjs | 39ee9d9060f75256cd9a0d260efb14872e12a01dbb0b4355fc469cf20ce2594a |
| tests/contracts/KUFOV4EvmHarness.sol（未改） | 7a1c33d2df2e1bb7f98f9bcc353b81842b96a3d95c5436f6a3602d18e414a1cc |

### 本次驗證（不借舊PASS）

36合約編譯成功、**0 warnings**；Solidity0.8.24/OZ5.0.2/runs1/viaIR/paris/metadataHashnone，
UTC2026-11-14T02:48:48.7581016Z至02:52:47.6009203Z，238842.8187ms。
標準輸入SHA256 `79eefdc336b5c24491de368ac77706f26b037d6007b1db249c8cccfda0339f90`；
compile-first.log SHA256 `37342aad0a619bd2b34fbb561066fa4c9c84b4537575b6a9972ba9a8e6ad6353`。

完整一次矩陣 **65/65 PASS**（31 EVM＋4 ABI＋18 policy＋原main10 unit＋2 fuzz），failed/skipped/cancelled0，
UTC02:54:48.1220742Z至03:10:05.0638856Z，**916135.7938ms**。
matrix-first65.log SHA256 `0002cf194ad0a01c207cb22810c00cbe88db08321814fcc5c04b767c84622545`。
另選取原token-surface4項安全檢查一次，**4/4 PASS**，31332.6107ms，UTC02:58:49.4803577Z至02:59:21.9984089Z；
security-surface4.log SHA256 `56b26304251ea7bb2a8b200709cf7d7205c514cf3e83fdcd3041ec5c363303e8`。
因此為**69項範圍矩陣、兩次suite**，不是一次69全跑。先前兩次18項policy在較早指紋的結果另存，不累加成新case或借作最終驗收。
原Ganache缺Node137原生uws binary，沿既有NodeJS fallback；未改環境、HOLD或資源。測試未使用真錢包、真RPC交易或真資產。

新驗證含完整12月、UTC+8月／年界前一秒與當秒、2100/2400/10000獨立Date oracle、120000個實際公曆月份、2039與12027真Ganache mint、永久補結、月內不成熟、oldorigin不變、33真月份分批、32沉睡年、高uint32 bitmap、真年aggregate、真burn／KGEN不扣除、allowance、防重、終身cap、no-mint及六故障雙入口原子回滾。
獨立靜態全路徑NO_BLOCKER，非外部審計；policy複核發現publiccivilDate窄域與futureID選組兩處差異，已修、由最終65矩陣驗過，保留內部wide永久補結。
本輪未新增動態callback重入攻擊case，不宣稱專項重入覆蓋；UI／大樓分機／實體手機／真錢包／主網煉丹與轉化仍NOT_VERIFIED。

### 實測gas與大小

| 項目 | 本機實測gas |
| --- | ---: |
| KUFO部署（含test constructor） | 3,953,523 |
| Furnace部署 | 1,363,626 |
| Output部署 | 261,800 |
| dust全額轉讓／第三年補結 | 259,871／331,806 |
| 32沉睡年轉讓／補結 | 4,793,998／1,304,063 |
| selected32轉讓／轉化 | 2,851,376／947,620 |
| 2027／2039／12027月份查詢 | 29,110／28,788／28,800 |

未放寬原300k／500k／8M操作或30M部署測試界限。KUFOcreation/runtime20764/17469bytes，含constructor的initcode21308<49152；五份正式runtime都低於24576bytes。
上述不是正式鏈上扣費；KSHIP／Converter及完整治理操作沒有在本表逐項加總。
費用試算另附gas-cost-illustration.json：本次RPC gasPrice0.05gwei、Binance BNBUSDT624.85（UTC03:06:17.100）、[台銀美元即期賣出32.91](https://rate.bot.com.tw/xrt?redirect=true)（台灣01:42），明示USDT≈USD假設。
若整包以**假設1,000萬gas**試算，0.05／0.1／1gwei約NT$10.28／20.56／205.64；這不是實測完整總量、鎖價、購幣手續費、支出核准或資源上限調整。正式錢包仍須當時estimate與原費用限制。

### 已做的主網唯讀準備

官方公開RPC共16請求，**0交易、0簽署、0密鑰、0費用扣款**。
BSC56 block `0x7f4906f`，hash `0xc3cf47d1ce6e5f62eceeca83bea89a1b4164ecd88d66168b74c5ec977dcdc49f`，
UTC2026-11-14T03:02:19Z／台灣11:02:19，gasLimit70M。
dependency-readonly.json SHA256 `8a5fa15440c6c49df02a2839935a741c0e643710d777ced4c21dc08358f0f41a`。

| 依賴 | 讀回地址／資料 |
| --- | --- |
| KGEN | 0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be；3905bytes；codehash251cff271c2c754743f9eb3bc11982163fd7ca756e0b0378cb0358418ffeecc1 |
| KAIOS | 0xD4E67B3a69e41524c424150E6b6e921b01D036db；5776bytes；codehash3a036ce95ac0929b247b40c9a303c2c4bfaf9aeb9bc171c009ad3532316df023 |
| Registry | 0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D；2543bytes；codehash92dc6b31cec75b3064cf5eb2bc3261acb980f4ac55559823cac23af4937739f9 |
| Registry owner | 0xCd60BF474e691F2484950a0276Eaf507616Ca4b9 |
| minimumDelay／bootstrap | 3600秒／false |
| 原Furnace | 0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1 |
| OUTPUT／CONVERTER／WORMHOLE | 此快照均零地址 |
| KAIOS.alchemyBurnCount | 此合約回報0 |

KAIOS.KGEN／ORGAN_REGISTRY與上述依賴匹配。歷史exact Genesis原碼具備相同burnForAlchemy／九欄AlchemyBurnRecord、真allowance與burn；其inscription常數與當前source不同，不能拿當前KAIOS artifact冒作Genesis runtime。
本輪已觀察codehash並核getters／routes，不等同完成所有歷史runtime來源／immutable重建；窄核結果另存審核包，尚未通過的身份項不得標PASS。
窄核實際結果：第一次只選兩份歷史runtime的編譯成功（16.543秒，0errors/0warnings），其後因把codeKeccak256欄位誤讀為codeKeccak而失敗，未保留該compiler output；第二次在compile前誤查metadata.code欄位而停止。原dependency-readonly.json其實已在calls[].result保存eth_getCode原始回應，不能說原資料不存在。兩次後處理錯誤與log原樣保存，本輪不第三次嘗試、不改編譯設定、不另走端點；這不是鏈上權限拒絕。來源與immutable身份仍NOT_VERIFIED。部署前仍須依原流程完成此項機械對照、固定constructor／帳戶／費用並由合法持有人本人確認；不能用本機69PASS代替它。
零route和回報burnCount0只描述此快照，不推斷全鏈零舊資產。原WORMHOLE舊proof路徑保留；共享CONVERTER若另有舊KUFO／KSHIP，需先核cutover對既有轉化權的影響。

### 下載與部署清單

新下載為 `KUFO_十二等整月_合約原始碼_<deliverySHA8>.zip`，另附KUFO與KSHIP完整累積白皮書。包內manifest／SHA256SUMS記精確交付head、原碼／artifact／每檔hash、編譯輸入、ABI、creation/runtime模板、immutable位置、原log及唯讀快照。舊8522ZIP及原白皮書不覆寫。
五份正式候選只限KUFO、Furnace、Output、KSHIP、Converter；Mock／Legacy／Harness不可部署為正式產品。
clock及星座已定，不再等待重問。啟用方案為部署時立即生效：最終審核時由合法持有人選用當時已核區塊timestamp填activationTime；此處不預填失效的舊測試日期。
正式constructor、deploying account、exactnonce、五新地址、signedtransaction、proposal／receipt／executableAt仍未產生，維持null。
下一步在本人最終錢包審核前補齊當時code／immutable身份及角色／未完舊權利核對，固定constructor與最新gas/費用；本人部署配套候選後，再依現任Registry owner原proposeOrgan→等待3600秒→executeOrgan流程啟用，保留當次proposal／receipt／executableAt雙時區證據。不能走已封閉bootstrap，不由AI代簽或送單。
原#19／#523、停用瀏覽器、成本／權限／資源／停機、Human本人處理用量與免費重置全部保留。未宣稱已上鏈、已可玩、已付款或自動循環主機驗收。

---

## 歷史工程原文（逐版證據保留，與上方現行結果分開）

## 2026-11-14 最新名錄：第10等十三生肖、第11等人類、第12等萬靈

WORK_ID `KUFO-637-MONTHLY-TIERS-10-12-20261114-08`。依本頁Human明確更正「10是13生肖，12生肖加AI類，11是人類12是萬靈」，作者Codex（衡曜 /root）；本輪驗證完成UTC2026-11-14T02:15:13.414Z／台灣10:15:13.414。沿同一#637及原worktree，最新三等取代下方舊候選的第10十二生肖／第12AI、AI第10／人類併生肖，以及萬聖節／幽靈等推測。

| 等級／月份 | 正式採用本頁名稱 | 類別內容 |
| --- | --- | --- |
| 10 | 十三生肖 | 原鼠牛虎兔龍蛇馬羊猴雞狗豬十二生肖＋AI類，共13類 |
| 11 | 人類 | 人類獨立，不併入第10等 |
| 12 | 萬靈 | 使用Human指定原名，不自行改成萬聖節或幽靈 |

前九等、全年12個月、等級與星座整月同步輪值、下一年重新從第1等循環均保持；第10等內13個類別不代表13個月。新增凍結 `THIRTEEN_ZODIAC` 名錄，原 `ZODIAC` 陣列保持12種供既有合約模型使用；新月度tier和原mint zodiac ID不混用。

root是原policy／test／report唯一Writer，TaskEnvelope及三原檔before快照先保存。policy只新增第10等子名錄並修兩個等級名稱，`universeMonth` 算式、型別範圍、月份／紀元輸出及原成熟函式未改。原unit既有4項monthly cases同步更正期望與第10月邊界，增加13類exact/freeze/不含人類檢查；原20個未受影響的測試bodies不改、不重跑。

本輪只選取4個受影響monthly cases執行一次：**4/4 PASS**，fail/skipped/cancelled0，987.4957ms；UTC2026-11-14T02:15:12.0994243+00:00至2026-11-14T02:15:13.4135873+00:00。包含精確12等/13子類、月10／月12／跨年／500年標記、120000月獨立游標及uint32域。這是4項選取驗證，不宣稱本輪重跑24項；前輪24/24及192394.9537ms保留為其原指紋歷史結果。
- policy SHA256 `2d104d34fe1b56cab1114dd6bb0bc960338fede36a76f09890cf636c5e212508`
- test SHA256 `427ad84091ec4d8cceddf9a2157e5cc32d04d9ee9eb43f0993ce4b704be1b165`
- 原始log `C:/Users/mydg0/.codex/automations/kaios/kufo637-tierlabels-monthly4-20261114T021310000Z.log`，SHA256 `c6917eec9a997e6d5dc95d4e9c79c7958c23fde1237b70b638dcb9b38415536c`

沒有改合約／ABI／PhysicsCURRENT／白皮書／舊下載包，也未編譯、重跑舊EVM、公開commit／push／merge或部署。實際月界、時鐘起點與星座名稱順序仍待接續；不從本次名錄修訂推導時間常數、玩家自動升級或真實資產授權。原#19/#523、停用瀏覽器、成本／權限／資源及Human手動用量政策保留。

唯一下一步：沿本頁最新名錄與已確認12月整月規則，核定實際月界／時鐘起點及星座名序後，接原樓層分機／KUFO模組並驗收；不重新套用被更正的分類。

---

## 2026-11-14 最新定案：每層12等按整月輪值，一年12個月（本機月序已驗）

WORK_ID `KUFO-637-TWELVE-TIERS-MONTHLY-20261114-07`。作者Codex（衡曜 /root）；來源main `33967045ed725848a6b814af0e9b10eac64f2ec7`、原PR637交付 `8522f3a7c45008861cd339c107297116904cdd28`。Human否決36年輪換太久，改「12等每個月換」，更正13為筆誤，並明確回覆「對，一年12個月」。最新補充：「1月到12月就這12等在換，星座一樣跟著換，用整月就好不用切到日」。

### 本頁最新規則

| 月份（整月不變） | 輪值等級 | 星座對應 |
| --- | --- | --- |
| 1月 | 1 修練佛 | 月位1 |
| 2月 | 2 魔王 | 月位2 |
| 3月 | 3 凡人 | 月位3 |
| 4月 | 4 龍 | 月位4 |
| 5月 | 5 神仙 | 月位5 |
| 6月 | 6 神明 | 月位6 |
| 7月 | 7 神君（玉皇大帝） | 月位7 |
| 8月 | 8 外星人 | 月位8 |
| 9月 | 9 變形金剛 | 月位9 |
| 10月 | 10 十二生肖 | 月位10 |
| 11月 | 11 人類 | 月位11 |
| 12月 | 12 AI | 月位12 |

每月只在月界一起換等級與星座，月內不按20日／21日等傳統星座日期再切換；下一年1月重新用第1等與星座月位1。第10等是「十二生肖」這個類別，不再拆成十二個額外等級。星座目前只保存1–12月位，具體名稱順序未由本輪核定，不猜哪月應配牡羊或摩羯。月序不會自動改玩家既有境界、真實物種、出生承諾或資產。

下方36名錄、年度輪換與相關測試均為已撤回的歷史候選；13月／新增蛇夫座提案亦因Human筆誤更正撤回，沒有實作。不得因保留累積全文而把這些舊提案重新當成最新規格。

### 同一模組替換與驗證

已先保存TaskEnvelope及原policy／test／report完整before快照，沿原檔替換未提交的36年度helper，不新增Runtime、bootstrap或平行產品：
- `runtime/kufo-policy.mjs`：移除 `UNIVERSE_ZODIAC/universeZodiacYear`，改為凍結的 `UNIVERSE_TIERS/universeMonth`。嚴格接受bigint相對連續月序1..0xffffffff，回傳相對年、年內月、輪值等級、星座月位及原500年紀元標記。
- 月12為第1年12月AI，下一月為第2年1月修練佛；月6000為第500年12月、月6001為第501年1月。這些是連續月序，不是額外曆月；500年標記不改月輪換。
- 原 `ZODIAC` 十二生肖陣列、packed birth窗口驗證、KUFO成熟／比率／資格與合約ABI未改；輪值tierId不是原mint的zodiacId，不作混綁。
- root只寫policy／report／continuity；allocation_631_evidence只替換原unit test最後4項與import，原20項bodies保留；restore_review對指定before的實際policy差異獨立只讀NO_BLOCKER，非外部審計。
- 本輪唯一一次pure suite **24/24 PASS**，failed/skipped/cancelled0，**192394.9537ms**；UTC2026-11-14T01:49:55.617至01:53:09.686／台灣09:49:55.617至09:53:09.686。驗精確12等與freeze、12月跨年／500年紀元、120000個月（10000個12月年）獨立逐月游標、uint32邊界及原20項policy回歸。耗時按本輪原log保存，不借用前輪8秒結果。
- policy SHA256 `717f2bee8f25b6741b26623c6454f95ee63517ebc45d95e4252a3c6d26962432`；test SHA256 `48a4f75bbb3a8469e682cb9570d63df41b5392dd2b1b5c2439a7e5f123fe5a80`
- 原始log `C:/Users/mydg0/.codex/automations/kaios/kufo637-monthly12-policy-20261114T013927000Z.log`，SHA256 `596367905d9f3556faaebb8342463ce7e7242f84ef6b0555d1f10a946ec1bedc`

### 尚未接通與唯一下一步

上述只驗相對月序；各月實際天數、K280日秒數、哪層時鐘及起點尚未定，不能擅自補成每月30日或365/12日。星座名稱／圖示對照、實際月界到鏈上時間、樓層分機／玩家UI及合約尚未由此helper驗收；未操作被停用瀏覽器。新輪值不自動把原KUFO年度50/75/100成熟改成按月結算。

原8522合約、Furnace／ABI、白皮書及舊下載ZIP保持不變，不含此新helper；無編譯、EVM、gas、真錢包或部署驗收。本輪沒有公開commit／push／merge／部署，原3tracked本機檔仍未提交。先前31EVM和各次36名錄PASS不作此新整合驗收。

原kaios僅用原管理工具同步同一prompt末段；原前8985字、排程／thread／狀態／權限／成本／資源保留，舊TOML與差異另存，最新欄位讀回相等。原#19/#523、停用瀏覽器、Human手動用量／免費重置與合法持有人本人錢包邊界全部保留。

唯一下一步：核定實際月界時鐘／起點與12星座名稱順序後，沿既有樓層入口及KUFO模組整合、相稱驗證；目前不以24項離線PASS宣稱已可玩、已上鏈或日期映射已完成。

---

## 2026-11-14 Human 時間換算接續：天堂日與K280日（年序尺度待選）

WORK_ID `KUFO-637-TIME-SCALE-CLARIFICATION-20261114-06`。本頁Human原話：「你創作是一年多少天，365天嗎，一天堂日是1heavent day=365K280日」。作者Codex（衡曜 /root），首次核對UTC2026-11-14T00:11:19Z／台灣08:11:19；正式保存時間依原checkpoint。

### 新來源與既有定義

Human這次明確提出 `1 Heaven Day = 365 K280 Days` 的整數換算；工程顯示統一用 Heaven Day，不改寫原文。已有 `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md:6087–6098` 將K280定為地球／下界物理時間、K18888為天堂／凌霄時鐘，舊換算是 `1 K18888 Heaven Day = 1 K280 Year ≈ 365.2422 K280 Days`。本輪只在原KUFO工程紀錄保存新口徑及差異，沒有把正式CURRENT全文或鏈上參數默改為365。

`CURRENT:6683–6685` 另明示K6888境界時鐘未與K280/K18888建立換算；不能把神君日等角色時間直接當成天堂日。先前「宇宙年／年長未定」指本輪新36生肖所用的年序模式／起點／一年天數未定，不是宣稱K280/天堂歷史文件沒有任何換算。

### 提案表（不把不同層的年混用）

| 單位 | 本頁整數制提案 | 來源狀態 |
| --- | --- | --- |
| 1 K280日 | K280的一日；本段不另核定幾個真實秒 | 沿用名稱，未新增秒數 |
| 1 天堂日 | 365 K280日 | Human本頁指定整數換算；正式CURRENT仍記舊近似值 |
| 1 K280年 | 建議365 K280日，因而等於1天堂日 | 結合既有年/天堂日關係的工程建議，待年序尺度選擇 |
| 1 天堂年 | 若也採每年365個當地日，則365天堂日＝133225 K280日＝365個上述K280年 | 只有條件式提案，Human未指定天堂一年有多少天堂日 |

建議36生肖每1 K280年換一位、500 K280年標一個紀元；依這份整數制，500 K280年＝182500 K280日＝500天堂日。若改為每1天堂年換生肖，並採上表條件式天堂年定義，時間尺度會放大365倍，不能沿用相同名稱暗中改KUFO成熟時間。

已以本頁文字題目向Human詢問「生肖與500年紀元按K280年或天堂年」；目前未收到選擇。此次沒有新的時間到年序轉換程式，也沒有把相對第一年鼠綁成公曆2027、改KUFO原50/75/100比例、年界權利或真實交易／治理權限。

### 本輪驗證與接續

本輪只讀CURRENT適用章節及既有工程資料，並做單位算術示例；無suite/編譯/EVM/程式/ABI修改，先前24項relative-year PASS不驗此新時間尺度。原13–36名錄與24鳥、36輪換、500紀元保持前輪狀態。合約仍未接入36身份或免補表算法。

唯一下一步：先取得36生肖／500紀元使用哪一層年的選擇，再明確保存該層一年天數與實際起算點，沿原KUFO整合與相稱驗證；未定前不寫入時間常數或改正式Physics CURRENT。真部署仍由合法持有人本人錢包確認，原#19/#523、成本／資源／權限／停用瀏覽器與Human手動用量政策保留。

---

## 2026-11-14 最新名錄修訂：第24位「鷹」改為「鳥」

WORK_ID `KUFO-637-UNIVERSE-ZODIAC24-BIRD-20261114-05`；依本頁Human「24鷹要改成鳥比較容意找到要嗎」及既有選用名錄授權，採用較通用的「鳥」。ID24、其餘35名稱、36年輪換、500年紀元及原年度公式完全不變；第35鴨與第36鵝保留。下方舊名「鷹」只屬歷史名錄。

root為原policy及既有unit test唯一Writer，只改各一個字；restore_review逐檔對原before快照確認 `after === before.replace("鷹","鳥")`，NO_BLOCKER（非外部審計）。本輪在新指紋上執行一次原pure suite：**24/24 PASS**，fail/skip/cancel0，7386.7289ms，UTC2026-11-14T00:06:42.966Z至00:06:50.510Z／台灣08:06:42.966至08:06:50.510。
- policy SHA256 `8b395b741c82c5e01a17d86a506a9b4deb7e341bbc32360c4dd0b99ea0b375a9`
- test SHA256 `a72bb092b8592b0adf98ee1c4e1d905ec904dbe58bf2665fadb405f2e6d6ed1a`
- 原始log `C:/Users/mydg0/.codex/automations/kaios/kufo637-bird24-policy-20261114T000536000Z.log`，SHA256 `70e0b0118fe70bfe1b0f4d626311cdf9a59e2331db396f078fa4b012a7973289`

僅更新本機未提交的離線名錄、既有測試與本工程紀錄，沒有改合約／ABI／白皮書／8522下載包，沒有編譯、重跑舊EVM或公開部署。Human先前詢問的「宇宙年」只是KAIOS一年之暫稱；「年長」指一年多少天／秒，不是另一種長年。提問不等於核定年長、起點或年界；此三項仍未定。原36身份鏈上整合／免補表功能仍待實作驗收，不把本輪24項PASS當鏈上完成。

唯一下一步：核定宇宙年界模式、起點及一年長度後，沿原KUFO工程整合與驗證。原權限／錢包／成本／HOLD與用量限制不變。

---

## 2026-11-14 最新採用方向：36 宇宙生肖持續輪值與500年紀元（離線算法已驗，合約未整合）

WORK_ID `KUFO-637-UNIVERSE-36-CYCLE-20261114-04`。實際作者 Codex（衡曜 /root）；本輪測試完成 UTC 2026-11-13T23:57:00.762Z／台灣 2026-11-14T07:57:00.762+08:00。Human 指示「你如認爲可以就用這去輪500年，之後要怎樣會亂數編碼嗎」，沿同一 #637 選用目前名錄，以下以固定規則接續，不採年度亂數。下方先前「名錄尚未封版」、鳳凰／麒麟／矽基生命／能量生命等候選與十二年循環草案保留為歷史；與本段衝突時以本段為準。

固定名錄（ID 1–36）：鼠、牛、虎、兔、龍、蛇、馬、羊、猴、雞、狗、豬、人類、AI、外星人、變形金剛、螞蟻、蟑螂、魚、豹、象、鯨、海豚、鷹、狼、熊、龜、蜜蜂、蝴蝶、章魚、貓、鹿、蝦、蟹、鴨、鵝。

### 500年後如何接續

- 相對第1年從鼠開始，36年一輪；500年只作紀元標記，不是截止、清零、重新抽籤或更換名錄。
- 第499年貓、第500年鹿；第501年為第二紀元第1年、生肖蝦；第504年鵝、第505年鼠。36年與500年兩種週期每4,500年共同完成，4,501年為第10紀元第1年、生肖鼠。
- 年度對應是確定性整數算法，同一輸入永遠同一結果，不使用時間讀取、網路或亂數。生肖固定ID和實際出生proof／交易識別是不同欄位，不將年度循環當成唯一出生識別碼。
- 宇宙年界模式、實際起點及一年長度尚未核定。相對第1年鼠不等於已定公曆2027鼠年；不把舊2027羊／365日／農曆草案當成新正式值。

### 原模組實作與實測

在既有 `runtime/kufo-policy.mjs` 增加不可變 `UNIVERSE_ZODIAC` 及 `universeZodiacYear(universeYear)`；嚴格接受 bigint 1..0xffffffff，回傳固定生肖ID／名稱、生肖輪次、500年紀元及紀元內年序。保留原 `ZODIAC` 12項與舊窗口驗證，沒有將36身份誤送進只容1–12的既有合約ABI。

root為policy唯一Writer；allocation_631_evidence僅改原 `tests/kufo-v4-three-autumns.unit.test.mjs` 的import並新增4項，原20項test bodies保留。restore_review獨立只讀檢查實際22行policy差異 NO_BLOCKER，非外部審計。

本輪唯一一次原pure suite實跑 **24/24 PASS**，0 failed/skipped/cancelled，8007.2998ms；UTC23:56:52.593至23:57:00.762。包含精確36名錄與freeze、36/500/4500邊界、1..10000年獨立逐年游標、舊回傳記錄不可變及uint32型別／範圍。這是離線年度映射和原20項policy回歸，不是36生肖鏈上mint、合約編譯、gas或UI驗收。
- policy SHA256 `669e26d20dbcf046d2d524b0c267b5c47a41606c79894e7ecd69b211f3ffc569`
- test SHA256 `cd02adbd76bf56a99c8be1e763a6f1b55d0a95b0de6c03cd44e35100078f718e`
- 原始log `C:/Users/mydg0/.codex/automations/kaios/kufo637-universe36-policy-20261113T235228000Z.log`，SHA256 `4c80f473953a8ebbd61e6ab1cf65464aa6a18be8262d844af120ee8aeedffa71`

現有 `KUFO.sol`、Furnace與ABI未修改，也未編譯或重跑舊31EVM；8522下載包與白皮書未改，不含本輪新算法。新增helper不會使原合約缺表後自動繼續煉丹。未公開／commit／push／merge／部署；新算法仍為原worktree未提交本機候選，先前合約gas報價不作新整合驗收。

唯一下一步：核定宇宙年界／起點／年長後，沿原KUFO／policy／Furnace／測試整合36身份及免補表算法，完成相稱合約、安全與gas驗證再更新交付；真實部署或交易仍由合法持有人本人錢包確認。原 #19／#523、停用瀏覽器、成本／資源／權限與Human手動用量政策保留。

---

## 2026-11-14 Human 最新接續：擴充宇宙生命生肖（名錄未封版）

本頁最新 Human 回覆後附記（實際保存 UTC／台灣時間以本輪 checkpoint 為準），沿同一 WORK_ID `KUFO-637-UNIVERSE-CALENDAR-PROPOSAL-20261114-03`。本頁 Human 回覆：「13生肖，13生肖是人類，14是AI，15是外星人，16是變形金鋼，17是螞蟻，18是蟑螂，19魚，20豹，21象……說來看吧」。工程文字統一將「變形金鋼」顯示為「變形金剛」，保留原文來源。

因此下方本輪先前「12 年循環／模 12」草案**不適用最新擴充方向，僅保留歷史提案，不得直接實作或冒稱已採納**。Human 指定第 13–21 個名錄；第 1–12 沿原傳統序列。宇宙生肖的總數、輪值規則、共同年界、年長及起點仍未封版，亦未完成先前「地球農曆新年是否改用宇宙年界」的明確選擇。

| 編號 | 名錄 | 來源 |
| --- | --- | --- |
| 1–12 | 鼠、牛、虎、兔、龍、蛇、馬、羊、猴、雞、狗、豬 | 原有序列 |
| 13–21 | 人類、AI、外星人、變形金剛、螞蟻、蟑螂、魚、豹、象 | 本頁 Human 指定 |
| 22–30 | 鯨、海豚、鷹、狼、熊、龜、蜜蜂、蝴蝶、章魚 | Codex 候選，未採納 |
| 31–36 | 鳳凰、麒麟、矽基生命、能量生命、星球生命、宇宙意識 | Codex 候選，未採納 |

若最終採 36 個年度輪值標記，可設計同一宇宙年一生肖、36 年一循環；這只是配合名錄的建議，不是已定經濟或生命規則。生肖作出生標記，不應自動重寫角色本身是人類或 AI 的生命類型。若 Human 希望生肖本身就是種族而非年度標記，須另明確定義兩者關係，不由例子推定。

既有 `KUFO.sol` 與 policy 的正式候選仍限制生肖 ID 1–12，新增名錄不等於合約已接受 ID 13–36。此輪尚未修改程式、ABI、測試、白皮書或下載包；沒有合約驗收、專利核准、公開發布或部署聲明。待名錄與年界封版後，才評估原有 uint8 欄位、窗口驗證、UI／ABI 及承諾資料的相容性，沿同一工程修改與驗證。

唯一下一步：先向 Human 展示名錄並收斂總數、年度輪值或生命類型的語義，再定宇宙年界／年長／起點；未封版前不將 12 或 36 週期寫入合約。

---

## 2026-11-14 待審提案：KAIOS 宇宙年自動計算（未採納、未實作、未部署）

WORK_ID `KUFO-637-UNIVERSE-CALENDAR-PROPOSAL-20261114-03`。實際作者 Codex（衡曜 /root），UTC 2026-11-13T23:38:22Z／台灣 2026-11-14T07:38:22+08:00。依本頁 Human「怎麼做要自動化，還是用萬年曆，同一年都同一生肖比較簡單，這是 KAIOS 的宇宙算法」整理，沿同一 #637；來源 main `33967045ed725848a6b814af0e9b10eac64f2ec7`、交付 `8522f3a7c45008861cd339c107297116904cdd28`。本段只是一份本機工程提案，沒有修改下列已交付合約、白皮書或下載包；未改原合法持有人部署／交易權限。

### 建議方案與待決事項

**建議用可直接計算的 KAIOS 宇宙曆，不先把一萬年年表寫入鏈上。** 固定定義一個宇宙年的起點與長度，每年只分配一個生肖、十二年循環；同一年所有新出生的 KUFO 使用同一生肖。出生生肖永久保留，畫面「當年生肖」可另顯示，不能因跨年改寫舊出生承諾。

下列數值供 Human 審閱，不是從既有宇宙 Runtime 推導的正式規則：

| 欄位 | 提議值／語義 | 採納狀態 |
| --- | --- | --- |
| 曆法模式 | KAIOS 固定長度宇宙年，依鏈上時間計算 | 待確認是否取代先前地球農曆新年選擇 |
| 起點 E | 2027-01-01 00:00:00，固定 UTC+8，即 2026-12-31T16:00:00Z | 待採納 |
| 一年 L | 固定 365 日，即 31,536,000 秒；不用夏令時間或地球閏日改變長度 | 待採納；非地球農曆／公曆 |
| 第一年生肖 | 羊，沿既有鼠牛虎兔龍蛇馬羊猴雞狗豬序列逐年循環 | 待採納 |
| 星座 | 建議每宇宙年均分十二個區間，使用十二個明確標籤；標籤順序另定 | 待採納；非天文入宮，亦非既有民用日期窗口 |
| 年度成熟 | 若採此模式，僅新制度的成熟共同年界與宇宙年對齊，仍累計 50%／75%／100% | 會改變原草案的時間語義，須連同年長明確採納 |
| 發行與轉化 | 原比率、KGEN 只讀資格、真 burn、供應上限、尾差及永久補結保留 | 不由本提案更改 |

對 `t >= E`：`n = floor((t - E) / L)`，`r = (t - E) mod L`。宇宙年序號為 `n + 1`；沿既有零基 ZODIAC 陣列，生肖為 `ZODIAC[(7 + n) mod 12]`。星座建議序號為 `floor(12 * r / L)`，範圍 0–11。所有區間採左閉右開；`t < E` 不應鑄造。用整數秒與足夠寬度整數計算，避免浮點、乘法溢位或年 9999 字串限制。

以提議值示例：第一宇宙年全為羊，第二年猴、第三年雞，第十三年再次為羊。固定 365 日宇宙年會與地球含閏日的公曆逐漸錯開，這是待選設計，不應顯示為地球農曆。萬年是至少 10,000 宇宙年的驗證範圍，不是到期即停止的期限。

### 自動化的實際意思

- 合約在有人呼叫煉丹／查詢／轉化時，直接依 `block.timestamp` 計算；不必在跨年那一秒送維護交易，不必每年補曆表，也不必由 AI 或母機持續在線。
- 沒有交易時，鏈上不會主動執行或自行扣除餘額；下次呼叫依當時時間得出正確年度與累計可轉化額。持有人仍須自行授權原煉丹與轉化交易。
- 這是固定算法取代未來年表依賴，不是授予 AI 新簽署者、無限 keeper、費用預算或 Registry 權限。
- 若 Human 保留地球農曆新年選擇，不能以此固定 365 日方案冒充農曆；仍須使用核定曆表或另審有明確適用範圍的農曆計算方式，不能承諾精準萬年天文資料。

### 現有實作與接續界線

既有 `runtime/kufo-policy.mjs:4,48–67` 已有生肖循環順序與同年年度輸入驗證；舊研究 `research/kufo-zodiac-cohort-v0.mjs:13–47` 有同年生肖預覽，僅作來源參考，不能升格為另一個產品。現有 `KUFO.sol` 仍依已存 yearStarts／出生窗口與 append-only 治理；僅在畫面或 helper 加公式，不能取消鏈上的缺表停鑄行為。

若採納宇宙曆，沿既有 KUFO／policy／Furnace／測試整合，以固定算法、按需分組與永久出生配置承諾替換對未來年表的依賴，保留有界轉讓／結算；不新建 Runtime、bootstrap 或平行合約產品，不覆蓋既有 LIVE。發布前重驗改動來源的跨年、星座邊界、首年前拒絕、12年循環、萬年範圍、成熟權利、轉讓、尾差、真 burn／資格／供應、安全和實際 gas。先前 8522 的 31 EVM／20 policy 與部署 gas 不能作為新算法已通過的證據。

已核 `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md:6670–6671` 明示 365 日換算不自動核定其他境界曆法，凡人年／修佛年未與地球年綁定；`KGEN/timeline/500Y_Epoch.md` 是制度週期說明，不能當成已定年的秒數。本提案沒有改動這些正式文件。

Human 稱此為 KAIOS 宇宙算法／專利；本輪只記錄來源說法，未取得專利申請或核准證據，不編造號碼或宣稱審查已通過。本段未公開發文、push、merge 或部署。

唯一下一步：由 Human 確認是否以此 KAIOS 宇宙年取代先前地球農曆新年，並審閱上表具體數值；收到明確採納或修正後，才沿同一候選實作、驗證並更新交付。原 #19／#523、成本／資源／權限／停用瀏覽器與 Human 手動用量政策保留。

---

# KUFO 持續煉丹與農曆生肖長程接續（2026-11-14）

狀態：`LOCAL_CODE_AND_TESTS_VERIFIED / NOT_DEPLOYED / PRODUCTION_PARAMETERS_PENDING`。
固定程式/測試提交：`0bf33c4b1ed61da5ddd08c4f426e3e6a5408fd9b`；KUFO來源SHA256 `7226aac7ec0f48405a33f3ab17f64eb57bf1cc5d8c390d1d89dd9cd7f220d415`。後續工程交付只更新文件與審核證據，不能當成鏈上部署。
WORK_ID `KUFO-637-CONTINUOUS-ALCHEMY-20261114-01`。Human明確要求「好改到好，星座和生肖能配合到1萬年航程嗎」，並於本頁選擇「沿用地球農曆新年」。來源main `33967045ed725848a6b814af0e9b10eac64f2ec7`、原PR637交付 `e85a5fef1e1157df7e42ab6a0fdef846c6a2ddb8`；沿同一程式/工單/保存位置施工。舊2039停鑄是未採納草案，舊32年度終身發行期是被本施工令修正的候選限制；下方原文完整保留為歷史。

## 本輪施工與邊界

- 在原KUFO增加只能接末端的calendar segment，不另建代幣、Runtime、bootstrap或發薪/治理排程。每段最多32年度；constructor最多512出生窗，之後append另限256窗以維持8M操作驗證界，不能套用30M部署block預算。這些是單段工作上限，並非整個航程的停鑄年份；原累計發行總額上限仍有效。
- 原Registry當時實際`owner()`提出精確payload hash，沿`minimumDelay()`（不得少於一小時）等待，再由任何人執行；執行重核提案者仍為現任owner、parent與完整payload。owner可取消；沒有新role/organ，也不代持有人操作治理。
- 新段首三年界必須逐值等於舊末三年界，舊group/日期永不回改。缺表期間未覆蓋的空窗可逐段補齊以恢復現在的煉丹；出生時間仍是當下block，不能倒填鑄造。尚無核定的未來表時新煉丹會拒絕且整筆回滾，故不宣稱無人維護也永不停。
- `calendarHash`/`calendarVersion`保留初始承諾；`latestCalendarHash = keccak256(abi.encode(parentHash,dataHash))`。每個segment只保存終止group索引與承諾，`groupCalendarHash(id)`二分查其永久出生承諾；後續追加不改舊origin。Furnace改核該group承諾。
- `MintOrigin.groupId`與累積`issuanceCohorts`擴為uint32；這是候選ABI變更，須使用新ABI及配套Furnace，不宣稱能與已部署舊Furnace直接混綁或原地升級。舊LIVE合約不覆蓋。
- 持有人四層有序bitmap按活躍group找下一筆，年度aggregate與索引同步更新。一般轉讓/轉化每次最多檢視32個活躍group，selected入口同樣最多32；`claimableTotal`超過32個活躍group改用`heldGroups(owner,afterId,limit)`及`claimableForGroups(owner,ids)`分頁。零額/自身/部分轉讓/轉化與失敗回滾都須維持索引、年度與總額一致。
- 真KAIOS銷毀、只讀KGEN資格、1:1000鑄造、50/75/100%年度權利、1:1000轉化、尾差/補結/allowance、72兆KUFO累計上限與原安全防線全部保留；本輪未新增支出、費用設定、稅率、錢包或秘密操作。未來每次合法曆表送鏈仍須由持有人核當時gas與原成本限制，不宣稱免費。

## 本輪已實測與尚未驗證

原policy擴充後初輪18/18；加入Human已選地球農曆新年的真日期fixture後19/19 PASS（5995.0741ms），最後加入constructor512/append256工作界限及257窗拒絕案後20/20 PASS（7471.6809ms）。三輪不是相加為57項。實際生成2027起10000個發行年度、10003年界、120000個分組，檢查每組起訖、groupId120000、舊出生承諾/轉讓/終局尾差、ISO extended year +010000、公曆2100/2400/10000閏年與400年146097日週期。這是離線資料/邏輯驗證，並非部署萬年資料或每年逐筆EVM實驗。

生肖fixture核HKO 2027-02-06、2028-01-26當地UTC+8農曆新年，與公曆財務年界、固定民用日期星座分開；人類已選農曆語義，不代表其他正式部署值已採納。HKO公開對照表涵蓋1901..2100，且明列遠期月相/節氣接近午夜可能有一日差；不能宣稱已有精準10000年農曆或天文星座表。來源：[HKO對照表](https://www.hko.gov.hk/tc/gts/time/conversion.htm)。

最終20項原log `kufo637-continuous-policy-bounded-20261113T2100.log` SHA256 `69ffb5ac41aedd7e6e62313df661256ed98bf26eb429836189f5e03f31abea71`保存在原kaios接續目錄；前19項log `ef3cc4649857f30fb982a3530dc04696bf63bdc5f93951d585afb292b80095f6`也保留。原artifacts/reports已83檔完整封存`kufo637-before-continuous-20261113T204519Z.zip`、SHA256 `053519737f9a4862e09191a3014f8a652b4928854f176524f59f1c6baba9977e`並逐項讀回。

### 固定來源最終驗證

- 首次36合約編譯PASS、0warnings，256831.5979ms；首次真EVM/ABI/main回歸45項為44PASS/1FAIL（718824.4665ms，未skip/cancel），唯一失敗為原dust單組完整transfer的300000gas門檻。這個失敗不是改寫成全過；62檔原輸入/artifacts/log封存`kufo637-continuous-first-red-20261113T2118.zip`，SHA256 `95317f8594ade09052ba663bef85a827bdc1e0615f37a022a6b4307f00478857`。
- 最小修復只在`_setHeld/_clearHeld`六處略去exclusive successor永不經由的global zero祖先寫入；leaf與所有非零tier不省略，`_nextHeld`逐字未變，不做型別/ABI/供應/權利變更，也未調高原300k/500k/8M/30M門檻。獨立實際差異複查NO_BLOCKER；這不是外部audit認證。
- 最終36合約再次編譯PASS、0warnings、248620.5081ms；solc0.8.24/OZ5.0.2/runs1/viaIR/paris/metadata hash none，EIP170無超限。KUFOcreation22450/runtime18692bytes，自足`solidity-standard-input.json` SHA256 `1bd0e40d4ec2bacb6c00abc08322e0b4625604c54b1ad3874ea0053130a43df0`。
- 最終受影響真EVM **31/31 PASS**，625773.2286ms，fail/skip/cancel0；UTC2026-11-13T21:25:41.8189383Z至21:36:07.8460147Z。原log `kufo637-continuous-evm-final-20261113.log` SHA256 `4acb192b8c4a44f43584b4f97f2c11d62b973f204a6918f194904abadc13ec02`。
- 34個未改合約creation/runtime/ABI逐項與首次編譯一致，KUFO ABI也一致，見`artifacts/kufo637-continuous-equivalence.json`。原4項ABI及10項main lineage在首次45項內已通過；連同同指紋純20項與最終EVM31項形成65項驗證矩陣，**不是一次65項單次全過**。其他套件未重跑，不能借舊35+185聲稱本次全repo通過。

| 最終實際案例 | gas/結果 | 保留界限 |
| --- | --- | --- |
| 256 dust後完整transfer / terminal settlement | 264105 / 340037 | <300000 / <500000 |
| 32 dormant年度普通transfer / settlement | 4820020 / 1400028 | 每次<8000000 |
| 32 selected groups transfer / conversion | 2783334 / 1014984 | 每次<8000000 |
| 32年512窗/543交集constructor | 18216737gas；40242bytes initcode | <30000000；<=49152bytes |
| 32年256窗/287交集append提案 / 執行 | 428852 / 7555818 | 每次<8000000 |
| 100/1000/10000年延遲後單組transfer | 264105 / 264105 / 264105 | 不掃經過年度；<8000000 |

31EVM保留原22安全/權利案例，新增9項覆蓋完整payload/延遲/owner更替/取消/錯overlap、真Furnace跨32及64年新鑄、過期補表不追溯、萬年延遲補結、年12027時間戳、全uint32 bitmap與真holder group/year aggregate、append最大工作量。BitmapHarness僅測內部索引，沒有假裝建立65536個真鏈上group；10000年/120000組是純資料驗證。手機/真錢包/真農曆萬年表及真部署均未由此驗收。

## 正式部署前仍需完成

最終固定來源編譯、EVM與有界gas、獨立原碼審查、具體初始與接續曆表/正式時區/生效與財務年界/星座窗口定案，以及當時鏈、canonical runtime/地址、Registry owner/minimumDelay/角色與原成本限制核對。只有真正有權的持有人用本人既有錢包確認部署/啟用/曆表治理。AI本輪0真鏈讀取、0簽署、0送單、0主網或測試網部署；無新正式constructor/地址/proposal/receipt/executableAt，保持未定。UI/手機/真錢包/真轉化也未由此源碼候選驗收。

---

# 前輪KUFO工程接續與部署準備（2026-11-13，完整歷史）

狀態：`CONVERTER_HARDENING_VERIFIED / NOT_DEPLOYED / FORMAL_CALENDAR_PENDING`。
本檔沿原 #637 累積維護；檔名是工程沿革，正式產品、代幣及合約入口均為 KUFO。
下方完整保留前輪工程紀錄；其中舊版本、測試數量、gas、未配置星座及「主線檔不變」均為歷史證據，不是本輪完成或部署聲明。

## Human「繼續」：Converter 實際產出檢查（2026-11-13）

WORK_ID `KUFO-637-CONVERTER-ATOMIC-OUTPUT-20261113-01`；來源仍為main33967045與原#637交付6bedaec3，Owner／claim／HOLD核對無新衝突。沿既有Converter、harness與EVM測試修一件實際缺口，不增加產品、曆法或經濟規則。
獨立複查發現Converter只核非零依賴及KSHIP回傳tuple：錯綁的KSHIP可讀真KUFO carrierBurnRecord，回正確受益人／金額卻不實際mint，令持有人正常授權的KUFO被燒而無產出。原KSHIP自身proof防線只保護真的傳入該core的路徑，不能代替Converter的固定綁定與完成檢查。
已先核舊Converter creation template hash `0xe472cf3be3404c0754ad7a44217190bd0a5f76ca4f5ee7265ddb70aa422c0bc2`，只編譯新增的本機adversarial測試actor後，針對唯一no-mint反例執行：1 test、1預期FAIL，7484.9142ms，原因`Missing expected rejection`。此為舊行為反例，不算修復通過。
原18項審核ZIP保持原hash，先於compiler清理artifacts前另存`C:/Users/mydg0/.codex/automations/kaios/kufo637-review-6bedaec3.zip`；red原log另存同目錄`kufo637-converter-red-6bedaec3.log`。既有218項與6bedaec3的驗收範圍不含此新增故障模式，不能以舊PASS取代新驗證。
本次最小修法為constructor核token／Registry綁定，兩入口共用burn前KSHIP快照、真KUFO burn record及mint後proof／供應量／累計鑄造／受益人餘額精確增量；失配整筆回滾。正式runtime來源核對仍由合法持有人完成，getter吻合不能認證任意會說謊的bytecode。
上述施工計畫已完成固定原碼、受影響22項EVM＋10項主線lineage＋3項ABI驗證及獨立審查，結果見下節；原#637與新審核包沿同一工程交付，未重跑無關未變指紋套件。

### 本次固定原碼與實測結果

記錄 UTC 2026-11-13T15:54:54.242Z；台灣 2026-11-13T23:54:54.244+08:00。固定程式及測試提交 86ee4e8ec93a458b607d162a80342a462ccc72f0；下列結果不是舊 CI 或舊 LIVE。
- Converter SHA256 84312dc5b92669ffd4db02e0cc63c2cb044093633876ad61c1702221c3a296c4；harness bcc4bda1f835c150032f78fe13625db3a7e36cae73cb1c66eda18b9c2ccd3971；EVM test 516599b3ffe6fb3cee392feea4c3d415de650c03ea56101029e4bdd07feebefc。
- solc0.8.24／OZ5.0.2／optimizer1／viaIR／paris：35合約、0warnings、無EIP-170超限。新Converter creation/runtime template為3714／2881 bytes；standard-input SHA256 35d77f244ec99bf4dab6a9a46703c927e89f2f3a9b5932a3442c1471c71eca32。
- 受影響驗證：35/35 PASS（22 EVM＋10 legacy lineage＋3 ABI），0 failed/skipped/cancelled，482912.2407ms。命令：node --test --test-isolation=none --test-concurrency=1 --test-reporter=spec tests/kufo-v4-evm.behavior.test.mjs tests/token-lineage.unit.test.mjs tests/kufo-v4-kship-interface.unit.test.mjs；cwd KGEN-KAIOS。
- 原始log artifacts/kufo637-converter-final.log，SHA256 941c9f057c03c5cee483146a276a73a84d9147b9d8cbc6e44a9c5c0aa4289ef6。兩新增案驗no-mint、wrong recipient、short amount、wrong counter、proof not marked、tuple mismatch；兩入口皆做明確錯誤staticCall與實際reverting tx、完整狀態相等。
- 原20 EVM斷言保留。前輪非EVM198中13項本次重驗，其餘185保留相同來源指紋的既有PASS；矩陣為185歷史未變＋35本次＝220獨立項目，不宣稱本輪重跑220項或單次220全過。
- 最大32年／512窗口／543交集分組：initcode 34047 bytes、constructor 16692221 gas；selected32 transfer 2370476、conversion 913044 gas。Shanghai／30M block／8M操作上限未放寬，未開unlimited size。
- 獨立read-only審查 restore_review 對固定原碼、測試差異、constructor ABI及編譯來源 NO_BLOCKER；不是外部安全審計認證。持有人仍須核canonical runtime，getter吻合不能認證任意惡意bytecode。

新審核JSON／ZIP沿原artifacts目錄以最終交付提交前8碼命名：KUFO.deployment-review-<deliverySHA8>.json、kufo-deployment-review-<deliverySHA8>.zip。保存五個正式artifact、新standard-input、新red/green與歷史log、報告／完整白皮書／README／handoff及來源指紋；生成後逐項讀回SHA。舊kufo-deployment-review.zip保持6bedaec3歷史包與原hash，不作新Converter通過證據。

未定事項仍為正式曆法、時區、生效時間、共同年界、生肖／星座窗口及發行期限；新部署地址／constructor實參／含immutable runtime／角色授權／治理proposal與回執均待核。本次0真鏈查／簽署／送單／部署，手機與真錢包NOT_VERIFIED。
唯一下一步：Human核定完整參數後，合法持有人以原清單核當時鏈、canonical code／地址、角色及原成本限制，使用本人錢包確認原部署流程。未核定前保留原PR637 Draft與NOT_DEPLOYED。

以下保留6bedaec3及更早完整交付紀錄；其中「本輪」、34合約、218項及舊位元碼／gas均指各自歷史階段。

## 本輪來源、Writer 與唯一實作

Human 在本頁透過知蘭於 2026-11-13 交付「KUFO V5 白皮書工程接續定稿」。
規格為 [KUFO 仙丹幣白皮書 V5.0 年度批次定案](https://docs.google.com/document/d/1LgTiHx7yjE_nqgSFiDz5hCOBEXp5YDOo7h1P50Hbv_o/edit)，
讀取 revision `AHj4eMSleS8eBWYL8tN8ZJqzRkvSjnMrx4-JGENTG8OlsKr6Rrbr16FV3tkg_Gqcr2t6X5xEpTqpzTEgdGh_I1h4Xq4MeGKRrqlAGJ0lND0`，166 段；Drive 修改時間為 `2026-11-05T22:07:14.047Z`。
來源 main `33967045ed725848a6b814af0e9b10eac64f2ec7`，原 #637 head `9dc0260543005597d2d02f9b3b8c9dbe5a6be0a6`，其年度核心 `3c92efd72a12404f95d95c573e428434d8c26e55`。
純整合提交 `82dea461` 保留兩邊歷史及 main 後續安全測試；未將舊候選整棵覆蓋 main。
WORK_ID `KUFO-637-ANNUAL-FINALIZATION-20261113`；單一整合 Writer 衡曜 `/root`，分離的合約、policy、EVM 測試 Writer 在本輪宣告檔案範圍內工作；不是原子 claim 或新排程。

| 正式路徑 | 用途 |
|---|---|
| `KGEN-KAIOS/contracts/KUFO.sol` | 唯一年度 KUFO 核心，真實 burn proof、不可變出生分組及持有人授權轉化 |
| `KGEN-KAIOS/contracts/KAIOSAlchemyFurnace.sol` | K18911 真銷毀與即時鑄幣原子流程；KGEN 只讀當下餘額 |
| `KGEN-KAIOS/contracts/KUFOOutputJindouyun168888.sol` | K168888 固定受益人出料，綁定 Furnace 與 KUFO |
| `KGEN-KAIOS/contracts/KSHIP.sol` | 原有 KSHIP proof-bound core，immutable KUFO 綁定不變 |
| `KGEN-KAIOS/contracts/KSHIPConverter.sol` | 持有人發起一般或指定分組轉化 |
| `KGEN-KAIOS/runtime/kufo-policy.mjs` | 既有純投影，無第二帳冊或自動交易 |

候選同功能 `KUFOV4.sol`、`KAIOSAlchemyFurnaceV4.sol`、`KUFOOutputJindouyun168888V4.sol` 與 `kufo-v4-policy.mjs` 透過 Git 遷移到上述唯一入口；歷史提交仍可追溯。
原 main 的 KUFO／Furnace 49 Epoch 完整回歸來源由既有 compiler 以固定 main SHA 讀取，只改編譯時合約識別字為 `KUFOLegacyBaseline`／`KAIOSAlchemyFurnaceLegacyBaseline`，不建立可部署的第二產品檔案。
原 `tests/token-lineage.unit.test.mjs` 的行為與安全斷言保留；該套件證明歷史相容性，新的 `tests/kufo-v4-evm.behavior.test.mjs` 才驗收年度入口。測試檔版本字樣僅屬工程沿革。

## 部署前安全修正與規格驗收

候選獨立審查找到三項必修：output 可提供虛構 proof 鑄幣、Furnace 只核 output 回傳 tuple 可能燒幣無出料、現任 Converter 可在未核 holder allowance 時燒別人餘額。
接續複查另補跨 KUFO 實例重用同一真 burn proof 的防線：KUFO 必須核記錄 Furnace 的 immutable `canonicalKufo()` 為自己，並核其 KAIOS／Registry 綁定；各實例的 proofMinted 獨立，不能單靠它防跨代幣重放。
Furnace 的 KGEN 地址亦須等於 canonical KAIOS 的 `KGEN()`，KUFO／Furnace Registry 必須等於 KAIOS 的 `ORGAN_REGISTRY()`；避免錯傳另一個代幣作資格或接入不相干路由域。
本輪驗收須分別證明 immutable KAIOS burn record 與消耗後 Furnace proof 一致、canonical KUFO 實際 proof／mint／受益人餘額增量一致，以及 Converter 必須消耗 holder 授權。
Registry 的 `code.length` 與治理延遲並不認證路由邏輯；授權 Converter 仍是受信任 spender，持有人只應向核定 canonical Converter 給相稱 allowance。

協議固定為投入並銷毀 1 KAIOS，在同筆成功交易產出 1,000 KUFO；KGEN 餘額至少投入量 / 1,000，不扣、不鎖、不需 KGEN allowance。
鏈上最小精度沿既有候選：KAIOS wei 至少 1,000 且為 1,000 的整數倍，避免資格除法截尾；不是最低投入 1,000 枚 KAIOS。
共同年界累計可轉化第一年 50%、第二年 75%、第三年 100%；第三年清餘額尾差，漏年永久可補結。
到年界只增加資格，不自動扣餘額或送交易。轉讓搬移剩餘三段權利，不重算出生年、不重設年齡。

曆法 constructor 明確提交 financial yearStarts 與獨立的精確出生窗口（start/end/zodiac/constellation）；窗口須連續、無重疊並完整覆蓋發行期。兩種曆法不默認相同。
出生 group 為共同年與窗口的交集，mintOrigin 保留 bornAt、出生年、生肖、星座與 calendarHash；轉讓保留 group 權利。不能只用事件推定持有人分組。
32 發行年、512 出生窗口及每批 32 group 是待驗證工程上限，不代表 Human 已採納任何發行期限。
一般轉讓／轉化若需觸及過多分組，整筆拒絕並改由 `transferGroups`／`transferFromGroups`／`convertGroups` 明確分批；分批不取消尚未轉化的權利。
一次批次須選唯一升序 group IDs，任何失敗原子回滾，不可留下半筆轉讓或 burn。

商家用自有 KUFO 庫存、補貼及利潤報價，不改協議鑄造比例。「10 KAIOS 購餐後交付 500 KUFO」及「100 萬維持量」只屬討論例子；本輪不把它們寫入合約或活動力規則。
餐廳付款、庫存交付、退款／交付證據及活動力投影仍需獨立需求與授權，不能以本次合約測試宣稱已可使用。
可對齊的流程是顧客將KAIOS付給餐廳，餐廳從已持有的KUFO庫存交付議定數量，該次購餐不呼叫協議鑄幣。若商家另用自己的KAIOS補庫存，仍須本人授權銷毀並滿足KGEN資格，固定10 KAIOS會鑄出10,000 KUFO；交付500與保留其餘庫存是另一步庫存分配，不能把協議比例改為10:500。交付時仍搬移原出生分組與年度權利。
活動力可在既有生命功能中讀取核定鏈／角色地址於明確區塊的實際KUFO持有量作輸入；持有量如何換算活動力、更新頻率、門檻及付款後交付保障尚未核定，本輪未新增公式、庫存帳冊或餐廳合約。
差異必須保留：候選到共同年界只增加可轉化資格，實際KUFO持有量在本人轉化前不下降。因此活動力若只依實際持有量，年界本身也不會自動降低活動力；是否另以其他已核定量作投影，須由Human明確定義，不能藉活動力需求偷改為自動扣幣。

## 可審核部署清單（尚不能送部署交易）

| 項目 | 本輪準備／必須確認 |
|---|---|
| 目標鏈 | 原站 BNB Smart Chain mainnet chainId 56；部署當時由合法持有人核實 chainId、RPC、gas 及原成本上限 |
| 既有 KGEN | 原 manifest `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`；不重發、不改 tax |
| 既有 KAIOS | 原 manifest `0xD4E67B3a69e41524c424150E6b6e921b01D036db`；須核 `alchemyBurnRecord` ABI、runtime code 及 immutable Registry |
| 既有 Registry | 原 Genesis 記錄 `0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D`；須以當時 code、owner、bootstrap、minimumDelay、pending 與實際權限核對，不能當已授權可改 |
| 已部署 Furnace V1 | `0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1`，tx `0x4dae645b4b40348fc06bd65f08d238919c20011924bf54da82c3d7e5f0fd6343`，block115628629；保留歷史，不原址覆蓋、不稱新 KUFO |
| 新 KUFO／Furnace／Output／KSHIP／Converter | 地址全部待部署回執，不以 18911／168888／511111 世界點位代替；原 manifest 將 KUFO／KSHIP 標為 NOT_DEPLOYED/FUTURE |
| 曆法參數 | effective timestamp、正式曆法名稱／版本與時區、N 年發行期限、N+3 年界、生肖邊界、星座精確窗口、生肖／星座ID1..12對應名稱、跨年／閏年解釋，全部待 Human 定值與完整校驗 |
| KUFO constructor | `(registry, kaiosToken, CalendarConfig)`；cfg 包含 version、firstFinancialYear、yearStarts、packedBirthWindows |
| Furnace constructor | `(kaiosToken, kgenToken, registry, canonicalKufo)` |
| Output constructor | `(furnace, kufo)`，讀回 immutable 綁定 |
| KSHIP／Converter constructor | KSHIP `(registry, kufo)`；Converter `(kufo, kship)`；舊版 immutable 地址不能靠 ABI 相容性改接 |
| 編譯 | solc 0.8.24、OZ 5.0.2、optimizer enabled/runs1、viaIR true、EVM paris、metadata bytecodeHash none；固定最後 source commit 後重建 |
| 位元碼與驗證 | 保存 ABI、creation bytecode、runtime template、immutable references、來源 SHA256、constructor 編碼；部署後以實參重建含 immutable 的 runtime 再比對 code/hash，不能只比較零填充 template |
| 角色／啟用 | Holder 個別核定 Registry FURNACE18911、OUTPUT168888、KSHIP_CONVERTER 路由、owner/延遲與 pending；先核所有 immutable/code/授權再依既有治理流程啟用；bootstrap 若已封不嘗試重開 |
| 舊 proof 相容性 | 舊 49 Epoch proof 不自動匯入年度 KUFO；舊 Furnace 銷毀紀錄不能重複產出，需另有明確遷移方案才處理；本輪不代做遷移 |
| 交易邊界 | AI 不取得秘密、不簽署、不送主網／測試網部署、治理或真交易；由合法持有人核定並用本人既有錢包確認 |

上述地址為原站已保存證據，並非本輪新的鏈查或部署回執。新正式時間尚未核定，因此 final constructor encoding、含實參的 creation bytecode／部署地址／runtime hash／治理 proposalId／executableAt 全部保持空白待決。
窗口編碼為每個 uint256：`start | (end << 64) | (zodiac << 128) | (constellation << 136)`；start/end 為 uint64 UTC 秒，生肖／星座各1..12，高於 bit143 的資料拒絕。完整calendarHash為 `keccak256(abi.encode(bytes32 version,uint32 firstFinancialYear,uint64[] yearStarts,uint256[] packedBirthWindows))`。
此編碼避免512個四欄ABI tuple超出初始化大小；仍須以實際完整constructor交易資料核 [EIP-3860](https://eips.ethereum.org/EIPS/eip-3860) 的49,152 bytes及 [EIP-170](https://eips.ethereum.org/EIPS/eip-170) 的24,576 bytes runtime上限。測試不能開unlimited size或放寬blockgas冒充可部署。
既有compiler另輸出自足的 `KGEN-KAIOS/artifacts/solidity-standard-input.json` 與其SHA256，含精確依賴來源；這是忽略的編譯產物，不是新Runtime。`artifacts/*LegacyBaseline.json` 只用歷史回歸，不能列入部署包。
最終固定提交的測試與獨立審查結果會累積於本節後，不將舊 LIVE、舊 CI 或舊 gas 數字充作新驗收。

## 2026-11-13 固定原碼驗證紀錄

程式固定提交 `e03ef59e1e5981ea2dcd6f6657fd18d877be1be4`。34合約／21顯式來源編譯PASS，0 warnings；既有optimizer等設定不變。
自足standard-input SHA256為 `0fa10cc351d86377ae5f58e7250cd18a1ec4623cf09174bdeb2667b1bd6b65a7`。
來源內的legacy baseline只為保留原main安全回歸，未列為新部署合約。

| 合約 | creation template bytes（未附實參） | runtime template bytes |
|---|---:|---:|
| KUFO | 16255 | 12753 |
| KAIOSAlchemyFurnace | 6847 | 5826 |
| KUFOOutputJindouyun168888 | 1089 | 849 |
| KSHIP | 4153 | 3118 |
| KSHIPConverter | 1663 | 1379 |

以上均為編譯template，不是主網含immutable的code hash。正式calendar與地址未定前不填正式交易位元碼。
原main archive KAIOS來源另作ABI核對，KGEN／ORGAN_REGISTRY／burnForAlchemy／alchemyBurnRecord／totalSupply／balanceOf／allowance七項均相容；這不是新的主網runtime證明。
`node tools/validate-templeheart-storage.mjs` PASS（58 preserved、15 appended）、`verify-current-lineage.mjs` PASS、`validate-integration-artifacts.mjs` PASS；未使用任何testnet旗標。

第一輪執行原七套`tests/*.test.mjs`及原research：218 tests，216 PASS、2 FAIL、0 skipped/cancelled，671020.3528ms。
兩個失敗均為新測試將ethers Result代理直接作deepStrictEqual；stack確認實值相同，跨代幣proof拒絕斷言已通過。
修復只將兩案例全部原始Result比較轉成實值陣列，所有欄位及安全斷言保留（[ethers Result文件](https://docs.ethers.org/v6/api/abi/#Result-toArray)）；另補精度及KGEN資格exact門檻。
原始首輪log SHA256 `25ad335cbe0189e239728fb7b35525c7678edaaac629b184c0e596397edf0968` 保留於 `artifacts/kufo637-test.log`，不覆寫為成功紀錄。
原首輪最大512窗口案例的31個年界恰好重合，只有512groups，constructor15,960,735gas、initcode34047bytes；這項只算對齊案例，不冒稱最大交集。
唯一修復重跑改用不重合內界：最多32年×512窗口交集為543groups，保持首尾、內窗口界各加1秒並精確核543。測試仍使用Shanghai限制、30M本機blockgas及8M單批操作上限。
第一輪結束時最終EVM重跑待執行；第一輪本身不能寫成整體PASS。非EVM198項來源未變且本輪已通過，後續只重跑已修改的20項EVM，不為未變指紋重跑其他套件。

### 最終收斂（UTC 2026-11-13T14:55:18Z／台灣22:55:18）

測試固定提交 `cc466c58d2dde5c124dfbb917159f29d28d03897`，EVM測試SHA256 `b2ddb4821cf45bcbed9fbcdd821c960c002b77694a78c345d50d41f47f851cb5`。
此提交與程式固定提交e03之間，合約、policy、compiler、harness、helper及其餘測試均0差異。
唯一修復重跑 `node --test --test-isolation=none --test-concurrency=1 --test-reporter=spec tests/kufo-v4-evm.behavior.test.mjs`：**20/20 PASS、0 FAIL、0 skipped/cancelled，368864.2668ms**。
最終驗證矩陣為未變指紋的非EVM **198/198** 加本次EVM **20/20**，共218項；不是宣稱第一次單一suite全過。兩份原始log分別保留。

| 最終實測 | 結果 |
|---|---:|
| 32發行年／512精確窗口交集 | **543 groups** |
| 包含合成constructor實參的initcode | **34047 bytes**，小於49152 |
| 543groups constructor | **16692221 gas**，小於30M本機blockgas |
| 最大設定selected32 transferFrom | **2370476 gas** |
| 最大設定selected32 conversion | **903884 gas** |
| 33groups standard transfer／conversion | 兩者整筆拒絕且餘額／tranches／allowance／proof計數回滾；selected32+1可完成 |
| 真Furnace資格 | KGEN為0或差1wei拒絕、正好門檻成功；KGEN不扣不鎖，KAIOS holder與totalSupply真減少 |
| 惡意路由 | 無真burn／未consumed／跨KUFO／正確tuple未mint／未授權converter均拒絕或原子回滾 |

gas為合成本機Ganache Shanghai測量，不是當時BSC費率、鏈上回執或已核准支出。Ganache因本機Node24缺nativeµWS使用原套件NodeJS fallback，未安裝額外依賴、未放寬限制。
獨立Reviewer `restore_review`對e03完整source／最後constructor及e03..cc測試差異均回報NO_BLOCKER；這是本輪獨立工程審查，不冒稱外部審計認證。

### 合法持有人部署順序與審核包

先核定完整calendar與ID名稱表，再以固定source及實參重建：KUFO → Furnace → Output，另部署綁KUFO的KSHIP，最後部署Converter。
逐項讀回immutable與精確runtime/code，再由實際Registry Owner按當時bootstrap封存／治理延遲處理FURNACE18911、OUTPUT168888與KSHIP_CONVERTER；不假定某帳戶現在仍有權限，不重開bootstrap。
只有Furnace能呼叫固定Output；KUFO mint還核Registry當值Output與真burn proof；KUFO burn核當值Converter和holder allowance；KSHIP核immutable KUFO的carrierBurnRecord。
核對所有地址、code、綁定與角色後才啟用原站操作；舊V1及舊proof另存原歷史，不移植、不原址覆蓋。

本機審核產物沿編譯器既有`artifacts/`保存：`KUFO.deployment-review.json`、`kufo-deployment-review.zip`。
ZIP只列KUFO／Furnace／Output／KSHIP／Converter五份正式artifact、自足standard-input、編譯證據、兩份實測log與本工程／白皮書；不列Mock或LegacyBaseline部署artifact，不含密鑰或交易送出腳本。
creation/runtime template的keccak256、來源與artifact SHA256、constructor ABI及immutable參照在審核JSON中；所有新主網地址、正式constructor值、含實參位元碼／runtime hash、proposal／receipt與executableAt保持null。
未新增CI workflow；既有舊CI／LIVE不被當新版驗證。未改UI，手機、真錢包、實際部署、真轉化與餐廳交付仍未驗收。

**未完成與唯一下一步：** Human核定正式calendar／時區／生效年界／生肖星座窗口及發行期限後，合法持有人依本清單核當時鏈、地址、角色與原成本限制，完成原流程的部署確認。AI本輪0鏈查、0簽署、0鏈寫入、0主網或測試網部署；原#19／#523與其他具體HOLD未解除。

## 前版完整工程紀錄（SUPERSEDED historical evidence）

# K18911 KUFO annual-cohort integration review

STATUS: REVIEW_CANDIDATE / NOT_DEPLOYED
SOURCE_MAIN: c5cc66e5d2dc7e193bb21a57b9a4e5b7dc70fde3
CORE_VERSION: 4.1.0-candidate
AUTHORITY: Direct Human task instruction for bounded source engineering and review-branch preservation only.

This is the continuation of Product 05 from PR #201 using the unique research of
PR #600. It is not another product, Runtime, ledger, deployment or task claim.
The historical PR #201 specification is preserved below as superseded source
history. The complete candidate specification is in the cumulative
`KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md` and `KGEN-KAIOS/docs/KSHIP_V4_WHITEPAPER.md`.

## Source merge and preservation plan

| Source | Exact head | Disposition |
|---|---|---|
| main | `c5cc66e5d2dc7e193bb21a57b9a4e5b7dc70fde3` | Sole integration base. |
| #201 `gm/k18911-kufo-three-autumn-final-v4` | `8b4ccd8c008886f82853ba0f0c064b9217e73894` | Selectively reuse existing Product 05 paths; 620 commits behind main and 36 ahead. No whole-branch overlay. |
| #600 `review/kufo-zodiac-cohort-offchain-20261016` | `2062b7b94959cf5e0d4aaf408677505bb4bcb6e1` | Preserve all three research files byte-for-byte; policy reuses its calendar parser and zodiac ordering. |

Reused #201 source paths, with annual-cohort changes in place:

- `KGEN-KAIOS/contracts/KUFOV4.sol`: shared annual cohorts, immutable bounded calendar, remaining tranches, proof provenance and lifetime cap.
- `KGEN-KAIOS/contracts/KAIOSAlchemyFurnaceV4.sol`: existing immediate KAIOS burn and current KGEN balance proof.
- `KGEN-KAIOS/contracts/KUFOOutputJindouyun168888V4.sol`: existing fixed-beneficiary output.
- `KGEN-KAIOS/runtime/kufo-v4-policy.mjs`: pure versioned-calendar and tranche projections; no execution or second ledger.
- `KGEN-KAIOS/tests/contracts/KUFOV4EvmHarness.sol`: in-memory EVM-only adversarial test actors.
- `KGEN-KAIOS/tests/kufo-v4-evm.behavior.test.mjs`: annual, authorization, conservation, gas and dust regressions.
- `KGEN-KAIOS/tests/kufo-v4-kship-interface.unit.test.mjs`: unchanged main KSHIP proof ABI compatibility.
- `KGEN-KAIOS/tests/kufo-v4-three-autumns.unit.test.mjs`: annual policy and exhaustive integer split properties.
- `KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md`, `KGEN-KAIOS/docs/KSHIP_V4_WHITEPAPER.md`, and this file: full cumulative editions, with predecessor text retained as historical material.

Main's `KGEN-KAIOS/contracts/KAIOS.sol`, `KUFO.sol`, `KSHIP.sol`,
`KSHIPConverter.sol`, deployed V1 archive and `tools/compile-contracts.mjs` stay
unchanged. The compiler still loads the git-bound TempleHeart V3.3.2 baseline
from `7344d231837d40b504622c8c8b4376ed25110e20`.
The old workflow and all three 11520 HUD/browser paths are excluded.

## Preserved unique research and audit evidence

| Path | Original Git blob |
|---|---|
| `KGEN-KAIOS/research/kufo-zodiac-cohort-v0.mjs` | `c8fb59c2c1122140acd47f4e7b7aa4226afe4404` |
| `KGEN-KAIOS/research/kufo-zodiac-cohort-v0.test.mjs` | `b0c050ad099c7dc2d61e0d1240acd840eb52ed07` |
| `KGEN-KAIOS/research/README-kufo-zodiac-cohort-v0.md` | `f9a9f6df904963e3cda8fac8e786668c1fd0bb3e` |

All three research files, including `sameRuntimeLatency`, are retained unchanged.
The research file has nine tests; its old PR body reported eight. Its January 1
fixtures are explicitly noncanonical and its simulation-only restrictions remain
part of the preserved source, not deployment authority for this candidate.

The PR201 audit branch head `3a227d4b73ce792ee012e848daae16c1a0febe1f`
preserves `KGEN-Organization/WorkOrders/KAIOS_PR201_KUFO_KSHIP_LINEAGE_SECURITY_AUDIT_R0_20260920.json`
blob `a2201cebac164d994802408da01801af41d0dff1`, already identical to main.
The PR158 audit branch head `dac29f2a459cde9ec725355e9e9190423e4cc6fe`
preserves `KGEN-Organization/WorkOrders/KAIOS_PR158_ALCHEMY_KUFO_KSHIP_LINEAGE_AUDIT_R0_20260921.json`
blob `36f0addbe0bcc76eb8c9bac8109814385275b00a`, also already identical to main.
Those records are preserved as audit history and are not rewritten as current
execution permission.

## Implemented rules and gas bound

Same configured birth year means the same cohort. At the first shared boundary,
50% of original mint amount is eligible; at the second, 75% cumulatively; at the
third, all outstanding KUFO and integer residual are eligible. Eligibility is not
an automatic on-chain transaction: the holder calls the existing converter to
settle. No ordinary transfer or mint performs settlement. A year-end birth can
reach its first boundary seconds later. Transfers preserve the birth year and
all remaining tranche amounts, including already-matured unclaimed rights.

The calendar constructor takes a nonzero version hash, first year, zodiac anchor
and strictly increasing explicit timestamps. N issuance years require N+3
boundary timestamps, with 1<=N<=32. Minting ends at boundary[N]; the last cohort
reaches its third boundary at boundary[N+2]. Settlement remains available forever
after that timestamp. No cohort index is wrapped, reused or dynamically appended.
Thus all transfer/settlement loops visit at most 32 slots, even for dormant
accounts and arbitrarily many unsolicited receipts. This finite issuance horizon
is a candidate design choice requiring approval before production.

Remaining first/second/terminal tranches coalesce by addition. Partial transfer
partitions cumulative tranche targets by full-precision proportional floor, then
subtracts the child from the parent. Targets are never recomputed on receipt.
Mint rounding is per proof; actual furnace outputs are multiples of 1,000,000
KUFO wei and divide exactly by four. Artificial one-wei test mints demonstrate
terminal cleanup. Lifetime KUFO issuance is capped as well as circulating supply,
so prior conversion cannot create room for KSHIP entitlements above its cap.

Immutable origin records retain proof beneficiary, amount, timestamp, birth year
and zodiac. Constellation is explicitly `0 / UNCONFIGURED`; no astrological
boundaries are guessed. Shared balances are fungible within a birth year; origin
events and records do not claim a unique per-coin ancestry after merging.

Protocol minting remains 0.001 KAIOS plus current balance >=0.000001 KGEN for
1 KUFO. KGEN is observed only: no transfer, burn, lock or allowance. KAIOS holder
allowance is spent by the unchanged KAIOS core. Merchant quotes, inventory,
profit and subsidy are separate commercial accounting; a restaurant quote of
100/1000/2000 KUFO per KAIOS does not alter protocol minting.

## Validation evidence

Local validation used Node `v24.12.0`, npm `11.6.2`, Solidity
`0.8.24+commit.e11b9ed9.Emscripten.clang`, OpenZeppelin Contracts and
Contracts Upgradeable `5.0.2`, ethers `6.13.4`, and Ganache `7.9.2`.
The existing package and lock files are unchanged. Windows installation required
`npm ci --ignore-scripts --force --omit=optional --offline=false` because the
existing Ganache lock includes a Darwin-only fsevents entry. No lifecycle scripts
ran. Ganache used its JavaScript fallback because its optional native uWS binary
does not support this Node build.

| Check | Local result |
|---|---|
| `node tools/compile-contracts.mjs` | PASS: 33 contracts, zero warnings, no EIP-170 oversize; KUFO deployed bytecode 9,501 bytes; baseline retained. |
| `node --test --test-isolation=none --test-reporter=spec tests/kufo-v4-evm.behavior.test.mjs` | PASS: 14/14, fail 0, skip 0; 106,466.8125 ms. |
| policy + KSHIP interface + preserved #600 research tests | PASS: 20/20, fail 0, skip 0. |
| existing TempleHeart, token-lineage unit/fuzz/invariant and surface-security suites | PASS: 91/91 including nested imported security regressions; fail 0, skip 0; 305,734.7293 ms. |
| `node tools/validate-templeheart-storage.mjs` | PASS: 58 preserved, 15 appended. |
| `node tools/verify-current-lineage.mjs` | PASS. |
| `node tools/validate-integration-artifacts.mjs` | PASS: complete 18-file scope, UTF-8/JSON/links/secret-pattern checks clean. |
| independent integer tranche enumeration | PASS: 185,193 vectors over each tranche 0..18 and every valid transfer size. |
| `git diff --check` and exact #600/audit blob preservation | PASS. |

Commands run from `KGEN-KAIOS/`. Policy/interface/research command:

```text
node --test --test-isolation=none --test-reporter=spec tests/kufo-v4-kship-interface.unit.test.mjs tests/kufo-v4-three-autumns.unit.test.mjs research/kufo-zodiac-cohort-v0.test.mjs
```

Existing regression command (local in-memory providers/mocks only):

```text
node --test --test-concurrency=1 --test-reporter=spec tests/templeheart.integration.test.mjs tests/token-lineage.fuzz-invariant.test.mjs tests/token-lineage.unit.test.mjs tests/token-surface.security.test.mjs
```

The EVM fixture uses explicit artificial timestamps, chain ID 1337 and in-memory
Ganache. Boundary tests verify the mined block timestamp at each before/exact/after
point. No external RPC, real token, wallet credential or production signer is used.
The local compiler's JSON result is
`KGEN-KAIOS/reports/SOLIDITY_COMPILE_EVIDENCE.json`.

| Adversarial case | Measured gas | Asserted ceiling |
|---|---:|---:|
| Full transfer after 256 unsolicited one-wei receipts into a legitimate 1,003-wei holding | 118,590 | 300,000 |
| Terminal settlement of that complete 1,259-wei holding | 308,311 | 500,000 |
| Full transfer of all 32 dormant year-cohorts | 2,331,812 | 8,000,000 |
| Full terminal settlement of those 32 cohorts | 808,184 | 8,000,000 |

The dust test compares 128 against 256 receipts to prove transfer cost does not
grow with receipt count; both coalesce into one birth-year slot. The worst-history
case advances far beyond the final calendar boundary without prior settlement,
then transfers and converts every unit. This proves the bound also covers dormant
historical balances, rather than only the latest three calendar years.

The EVM test blob is `ea72c4eeba4c8783ee044f4e00b308e7efc588af` and its harness
blob is `f585cb3d5f384622e505d8efde9b6e5ee59bc0b1`. Historical CI for #201 is
source history only; it is not counted as this candidate's validation. No claim
of GitHub exact-head CI is made for this new source branch.
The tested core blob is `f597188daeca6bd9e23f90a6190f0349e88408de` and policy
blob is `875f8a5411eb3162779382baf58487479e486577`; those program/test sources
were not modified after the successful runs.

## Review continuation and unperformed actions

The original KUFO owner/lease and this session's registered worker identity are
not verified. `codex-gm-01` is an ACTIVE/T5 registry entry, but that fact does not
identify this session. No original claim, lease, Registry or WorkQueue entry is
modified and no employee identity is asserted. `.agents/skills` was absent in
both the isolated checkout and shared source workspace.

This session is a direct Human-authorized engineering candidate. Preserve it on
the isolated review branch; do not force-push #201. Safe continuation is for the
verified #201 owner to adopt this exact latest-main candidate by a coordinated
branch update after reviewing its diff. The sole blocker to updating #201 itself
is unverified original writer/lease authority. No parallel product PR is needed.

#600 may be marked superseded only after confirming its three exact blobs are
preserved in the accepted continuation; it stays open this round. #158's old
catalyst/continuous-decay behavior is historical, not a rule source. #211
(reactor/KGOD) and #212 (UFO App) are downstream products and remain open.
No PR close, branch delete, merge, deployment or live transaction is performed.
The original mobile-environment HOLD is neither bypassed nor treated as a ban
on these independent offline tests. No UI files change; browser QA is not
applicable to this source-only candidate.

## Deployment prerequisites

1. Approve the formal Gregorian/lunar/K280 boundary calendar, version hash,
   zodiac anchor and finite issuance horizon. Test clocks are not canon.
2. Reconcile Physics CURRENT V3.8's continuous-half-life wording with the latest
   Human-directed shared-boundary 50/75/100% terminal law. CURRENT is unchanged.
3. Bind reviewed KAIOS, KUFO, KSHIP, furnace, output, converter and delayed Organ
   Registry governance addresses to an explicit deployment-lineage manifest.
   Registry controllers remain trusted routing authorities.
4. Review the current-balance-only KGEN proof economics, including borrowed or
   same-transaction balances; no holding-history claim is made.
5. Complete required candidate CI/security review and obtain action-specific
   deployment/signing/asset authority. Source approval is not transaction authority.
6. Preserve immutable V1 history and choose an explicit new-deployment transition;
   this undeployed candidate cannot silently upgrade an existing token.

---

## Preserved PR #201 source specification (superseded anniversary/64-lot mechanics)

# K18911 → KUFO Three-Autumn V4 Candidate

Status: DRAFT SUCCESSOR CANDIDATE / NOT DEPLOYED

This is the current Product 5 review candidate. It preserves deployed history but supersedes earlier candidate mechanics that depended on KGEN tax accumulation, KGEN holding age, catalyst-bank transfer, 49-Epoch waiting, 130-day freshness, or continuous residual half-life dust.

## Point roles

- K18911 = 煉丹爐; KAIOS alchemy entry.
- K511111 = 齊天大聖宮 / KUFO 蟲洞與幣世界座標. `511111` is a civilization point, not an EVM hexadecimal address.
- K168888 = 筋斗雲; fixed-beneficiary KUFO output organ.
- K108000 = future KSHIP fuel-consumption → KGOD transformation point; outside this product.
- K16888 = future marriage / KGOD ring point; outside this product.

## Immediate alchemy

- `1 KGEN = 1,000 KAIOS`.
- required current KGEN wallet balance = `KAIOS input / 1,000`.
- KUFO output = `KAIOS input * 1,000`.
- KGEN is balance proof only: no transfer, burn, lock, escrow, allowance, holding-age or tax-history requirement.
- KAIOS alchemy burn record remains the upstream settlement evidence.
- after successful KAIOS burn proof, K18911 calls the registered K168888 output organ in the same transaction.
- K168888 cannot redirect beneficiary or amount.

Example: `0.001 KAIOS` + current wallet balance `>= 0.000001 KGEN` → immediate `1 KUFO`.

## KUFO Three-Autumn decay

`K280_YEAR_SECONDS = 31,556,926` and one K18888 Heaven day equals one K280 Earth year in this project time scale.

For each original KUFO lot:

- before Year 1: 0% converted.
- Year 1 / First Autumn: cumulative 50% KUFO converted to KSHIP.
- Year 2 / Second Autumn: cumulative 75% converted.
- Year 3 / Third Autumn: 100% converted; all remaining smallest-unit dust is terminally consumed.
- exact lineage: `1 KUFO` eventually produces `1,000 KSHIP`.
- KSHIP does not half-life in this product.

For an original `1 KUFO`: First Autumn produces 500 KSHIP, Second Autumn adds 250 KSHIP, Third Autumn adds the final 250 KSHIP, and KUFO remaining becomes exactly zero.

Transfers preserve lot age. Partial transfers split lineage lots without resetting the original birth timestamp. The implementation caps one transfer traversal at 64 lots to fail closed rather than permit unbounded gas growth.

## Downstream boundary

KSHIP is future UFO antimatter fuel. Its later fuel consumption at K108000 may produce KGOD. KGOD, K16888 marriage, KDNA and KRNA are intentionally not implemented by this Product 5 candidate.

## Safety

Repository candidate only. No deployment, Mainnet transaction, KGEN/KAIOS/KUFO/KSHIP transfer, burn, mint, signer use, Organ Registry update, governance action or chain write is performed by this PR.
