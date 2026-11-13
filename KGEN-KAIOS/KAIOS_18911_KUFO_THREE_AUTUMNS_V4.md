# KUFO 工程接續與部署準備（2026-11-13）

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
