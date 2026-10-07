# KAIOS DOT ENGINEERING HANDBOOK CURRENT

STATUS: REVIEW CANDIDATE
OWNER: dot — Human-authorized temporary external engineering maintainer
SNAPSHOT_UTC: 2026-10-06T05:13:25Z
OBSERVED_MAIN: `e26f3a76ef0be7f43058225f46def3fbe123371e`
SCOPE: 工程參考、狀態與接續工作；不是 Physics、身份、資產或執行權限來源。

## 1 目的與身份邊界

本手冊回應 Human 2026-10-06 05:05:53 UTC 的明確要求，讓後續工程能從 GitHub 證據接續，而不是重建聊天記憶。它彙整 dot 的工作狀態、Boot 順序、單一既有器官、測試與驗收、二十個固定工作包、權限邊界與下一步。KAIOS 的產品方向是「客戶／玩家願望 → KGEN AI Company 專案 → 可驗證成果」。願景不等於已部署功能。

- `dot` 是本次 Human 授權的臨時外部工程維護者；本文件不建立或繼承 GM、Life、Worker、Employee、Reviewer、T5 身份，不修改登記。
- 運作基礎是 Human 已授權的安全工程範圍與當前任務；不是本手冊文字自行授權。沒有持續運算服務、常駐 daemon 或真正接收者 ACK 的證據時，不宣稱存在。
- 同名 `CURRENT` 表示固定參考檔名，不使本手冊成為 Physics Runtime CURRENT。若來源衝突，以既有 CURRENT／Human 決定及適用權限邊界處理；不得從摘要創造物理法則。
- 既有 [11520 頁面交接手冊](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-Organization/Handbooks/KAIOS_11520_PAGE_HANDOFF_HANDBOOK_CURRENT.md) 提供歷史產品交接，[文明循環手冊](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/handbook/KAIOS_CIVILIZATION_CIRCULATORY_HANDOFF_HANDBOOK_CURRENT.md) 處理特定金融／文明來源。本手冊連結它們，不複製其 authority 或建立第二個 runtime。

## 2 每個工作週期的 Boot 與新鮮度

依此次 Human 順序先讀 [Boot V1.4 祖先](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md)，接著讀 [正式 Boot CURRENT](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md)。CURRENT 的固定入口／祖先規則仍有效；V1.4 不取代 CURRENT。之後：

1. 取得最新 `origin/main` 和目標 PR exact head；記錄 branch、workspace、觀測時間，保留他人工作樹。
2. 讀 [Company OS Boot](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md) 與 [Company manifest](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/governance/autopilot/company_boot_manifest.json)；其標記是 `ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE`。十四層架構不是已證明的自動 admission／背景服務。
3. 讀 [AGENTS](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/AGENTS.md)、[工作區隔離](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-AI-Company/WORKSPACE_POLICY.md)、[受保護路徑](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-Agent-Office/DO_NOT_TOUCH.md)、[Human-owner merge policy](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md)，以及目標目錄的更細規則。
4. 依任務读 [Physics CURRENT](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md)、[機器 Canon](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-Canon/KGEN_CANON_MASTER.json)、[地圖 CURRENT selector](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/README.md)、既有器官／ownership／活動 PR。機器 Canon 的 Draft 標記不授予新 activation。
5. 正式員工流程仍須核對 [Worker registry](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/worker_registry.json)／正式 WorkQueue；外部 dot 例外不等於可自行 claim、重派員工或偽造註冊。
6. 先維持已開工作，再把新工作加到現有工作包／子項；不可默默取消。來源、作用域或 main 改變時做增量重核，不以舊 CI 覆蓋新 head。

本手冊快照不是每次執行的現況。過時 PR 描述、歷史 `PASS`、未發布 local commit、目前 main 與公網 source 必須分開。不要把「準備／排隊／獲配資源」寫成「正在執行／已通過」。

## 3 目前 main 與发布證據

- 觀測 main：`e26f3a76ef0be7f43058225f46def3fbe123371e`，合併 [515](https://github.com/klineodyssey/kline-odyssey/pull/515) 的 test-only source-bound HTML encoding proof／診斷。產品仍 V2.9.5，沒有因 QA 修正升版。
- [513](https://github.com/klineodyssey/kline-odyssey/pull/513) 已於 03:37:59 UTC 合併 `1e2bed7eb5429d788c9d547fc7e079a1dbc75dcf`；早先 merge 確認 blocker 已解除，不得重新當成現況。
- [515](https://github.com/klineodyssey/kline-odyssey/pull/515) reviewed head `91ad249d866f069bb75bda154e9454da54ce34fa`，八個候選 CI 與 49 張候選圖通過，04:51 合併至 main。早期 `578af860` Trading／Responsive 失敗原因未完整定案，保留為歷史，不改寫綠燈。
- e26 scoped M1 release於05:13:25 UTC由協調者完成closeout：main五個QA families、Pages及公網 workflow [37415708746](https://github.com/klineodyssey/kline-odyssey/actions/runs/37415708746)均成功。Exact build/source前後15個assets、六份browser proof、49張直接審閱screenshots、24×23 read snapshots，以及A/B/reload labels與balances均通過。原始[evidence artifact11391107155](https://github.com/klineodyssey/kline-odyssey/actions/runs/37415708746/artifacts/11391107155)保留。這是M1只讀scope完成，不是M2–M5或實體MetaMask驗收。
- 先前 1e2 公網 strict HTML hash 失敗，測得 Chromium response 比 raw source 少一個 UTF-8 BOM；515 的有限、source-bound encoding proof 是受審 QA 修正，不是允許忽略任意 byte mismatch。
- 實體 MetaMask／真手機硬體仍 `NOT_VERIFIED`。M1 只讀、合成 EIP-1193 + 真實 BSC97 讀取的證據不建立簽名／M2–M5／Mainnet 權限。

## 4 Canon 與單位參考矩陣

以下每列都限定域、來源及未證明部分。`Git blob` 是 SHA-1，不是 SHA-256；數學可算不代表 live binding 已成立。

| 主題 | 已有來源與可以使用的事實 | 工程邊界與尚未成立部分 |
|---|---|---|
| 質量尺度 | [Physics CURRENT §235](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#L6048-L6066)：1 KGEN=1000 kg、1 KAIOS=1 kg、1 KUFO=1 g、1 KSHIP=1 mg；舊1 KGEN=1 kg明確 superseded。 | 1 lot 的1000 kg等值是尺度表示，不是 Player 身體／載貨質量證據。[Scale companion](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md) 全篇仍帶 review-candidate標記；只用 CURRENT已明示採用部分，不整包提升為部署事實。 |
| Signed Universe | [CURRENT §§151–153](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#L3824-L3896)：非零 x，k=floor(log10(abs(x)))、alpha=abs(x)/10^k、theta=0或pi；零為 ORIGIN。 | scalar address，不是全域 XYZ transform，不授權任意×10^8 decimal放大。負局部XYZ不自動成為金融SHORT。 |
| 距離與局部單位 | [CURRENT §161](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#L4097-L4129)：1K=384400/16888 km；[spatial-coordinate owner](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/spatial-coordinate-runtime.mjs)：1 local game unit=1m。 | 量綱換算有效；市場normalized tick不等於一米。`marketToPhysicalK`要求明示transform，`composePhysicalK`要求typed PHYSICAL_K origin。 |
| 共用地圖 | [maps selector](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/README.md) 選ACTIVE [V10.3 manifest](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/UniverseMap_V10_3_COMPLETE_ALL_POINTS.json)，繼承 [V10.2完整底圖](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json)，按ID套override，保留123點。 | 不因相同座標去重；地图是點位來源，不是金融法律。歷史 profit_axis文句不能推翻 CURRENT 金融／物理分離。 |
| C、速度、ETA | [Logistics §4.1](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/LOGISTICS_UNIVERSE_SPEC.md#L77-L98)：speed=abs(C)×0.001 K/s，ETA=distance/speed，路線向量由ΔXYZ決定。 | Human03:23共享Player C／C0停止要求正由local Navigator實作；main旧玩家cMode仍含LOCAL_WALK／LIGHT_SPEED等歷史語義。不能宣稱已統一上線。[11520旧whitepaper §6](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md#L84-L98) 仍有c_earth/13180K/s解釋，需保留域與版本衝突。 |
| 動量、能量 | [CURRENT §§245–246](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#L6267-L6296) 定義E_equivalent=mc²、E_usable=eta mc²及完整motion state；[Logistics §6.3](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/LOGISTICS_UNIVERSE_SPEC.md#L155-L170) 的classical/relativistic/drag規則是指定遊戲物件模擬域。 | 不把M_engine交易資本當Player身體質量，不把lot-equivalent p/KE診斷當通用Player Canon。Generic Player p/KE在此明確分類為`CLASSICAL_REFERENCE_NOT_CANONICAL_PLAYER_ENERGY`，僅供display-only參考，不是尚待選一個公式的執行路徑；不得直接變fuel扣款、傷害、餘額或PnL。 |
| 金融／物理分離 | [CURRENT §236](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#L6068-L6080)：financial direction != physical navigation direction。 | 移動、相位、PnL、槓桿、oracle及settlement不是同一個authority。合法運動/距離计算不建立真實交易。 |
| Global placement／LIVE CT | 主main [spatial owner](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/spatial-coordinate-runtime.mjs) 不提供implicit normalized-market→physical映射。 | signed math、index distance、Gate計算可做；generic decimal codec／typed global origin／frame／timestamp／evidence binding仍缺，不能宣稱全Universe都不可算，也不能填造Temple全域XYZ。 |
| 載具 | CURRENT motion/propulsion明示質量、payload、frame、timestamp等；既有[Logistics owner](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/logistics-universe-runtime.mjs)有路線／任務域。 | Navigator只有基礎body／可見模型，不是已驗證載具能力。不得捏造車輛、飛船、teleport、Custody或真實收益。 |

### 可重算但不代表已接線的例子

依Logistics距離／WarpRate域，abs(0.00011520 − 0.00025790)=0.00014270 K；1K=384400/16888 km，故距離約3.248098057793 m。C=1的速度為0.001 K/s，ETA=0.14270 s；C=0.1時1.427 s，C=0.001時142.7 s。Human指定共享Player域中C=0暫停。這些是數學計算，不證明Player已擁有該origin/frame、可走route、vehicle capability或LIVE CT；也不是交易回報。

### 不可混用的載具與金融來源

- [VEHICLE_C_SPEC](../K線西遊記/temples/11520/VEHICLE_C_SPEC.md)要求宣告maxC，不能從文明層級或模型外观猜上限；100×reserve規則仍未解決。
- CURRENT的GA0…1000階層不是PlayerLevel1…10。Lmax範例是conversion-capacity ceiling，不是maxC/speed tier表。Life/Body/Vehicle/Fuel仍須分開證據。
- [World Viewer vehicle-runtime](../KGEN-KAIOS/world-viewer/technology/vehicle-runtime.js)與[synthetic-world catalog](../KGEN-KAIOS/world-viewer/data/synthetic-world.json)确有synthetic Alpha fleet／recipes；不能說載具source不存在，也不能當作11520 Player已擁有或已裝備的capability。Digital Ant的ATM UFO也不等於Player的載具。
- [KGEN_TRADING_SPEC](../K線西遊記/temples/11520/KGEN_TRADING_SPEC.md)定義principal=abs(lots)，PnL=(markIndex−entryIndex)×signedC×lots，並區分歷史deployed模型。共享input不得改寫pending order／filled position的C snapshot；movement p/KE不進入PnL。
- 已發布main的spatial conversion與lotMass可重用。local e300新增的`linearKDistance`、`directKNavigationMetrics`、`advanceLocalMotionClock`、`integrateLocalMotion`、`readCanonicalDriveState`及presentation方法尚未發布；不要把它們寫成現在main的API。

### Pinned file authority matrix

本表全部取自 main `e26f3a76ef0be7f43058225f46def3fbe123371e`。BLOB一律是Git blob SHA-1；不是SHA-256、版本號或已部署認證。VERSION／STATUS／SOURCE_OF_TRUTH按檔內實際宣告填寫，缺欄位就明示未宣告；不把候選升格為ACTIVE。

| FILE | VERSION / REVISION | BLOB SHA-1 | STATUS | SOURCE_OF_TRUTH / scope |
|---|---|---|---|---|
| [PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md) | V1.4 | `4286d1aede181f45eb274196a6799ac18ced42ec` | ACTIVE in preserved ancestor | TRUE declaration; ancestor/compatibility, not replacement CURRENT |
| [PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md) | CURRENT; rev2026-08-02.AI_COMPANY_SPEC_SOIL_RELEASE_FERTILIZER_DISPATCH_INDEX | `b85c9a34a81810e0063480092025a9ef02d456cc` | ACTIVE | TRUE; formal fixed Boot entry |
| [KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md) | 0.1.0; rev2026-07-16.1 | `c58eddb13da0a3ee520202f253290f560f368f04` | ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE | true; operator protocol, not background execution |
| [KGEN-KAIOS/governance/autopilot/company_boot_manifest.json](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN-KAIOS/governance/autopilot/company_boot_manifest.json) | 0.3.0; rev2026-07-16.1 | `18a1b5fc3fd9d8bdcc9a3c8a3725a13221a49d65` | ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE | metadata.source_of_truth=true; no new identity/action grant |
| [docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md) | CURRENT / V3.8 | `6eaa6d14d19f4f6d06d9172f1bd1a5cd55b35fcc` | ACTIVE | TRUE; current Physics incl explicit supersede table |
| [KGEN/whitepaper/math/KGEN_SignedUniverse_MathLaw_V7.5-GENESIS-01.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KGEN/whitepaper/math/KGEN_SignedUniverse_MathLaw_V7.5-GENESIS-01.md) | V7.5-GENESIS-01 | `da1d89de66157cbbf5e259d2f07f21f446b41195` | No explicit STATUS field; mapping-only text | No explicit field; integrated CURRENT law governs |
| [docs/maps/README.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/README.md) | No version field | `8d534fc6132d0e1f2127cd74571f3cd2e56e8e29` | ACTIVE | SOURCE_OF_TRUTH_SCOPE=Cross-universe shared maps; selector only |
| [docs/maps/UniverseMap_V10_3_COMPLETE_ALL_POINTS.json](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/UniverseMap_V10_3_COMPLETE_ALL_POINTS.json) | KLINE_UNIVERSE_MAP_V10_3_COMPLETE_ALL_POINTS | `dd46de65788c266b4992bfa06c5a83a52da2f14c` | ACTIVE | No boolean field; selected shared map manifest, not Physics |
| [docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json) | KLINE_UNIVERSE_MAP_V10_2_DISTANCE_COMPLETE_ALL_POINTS | `0f97fc7e723fc97cd8366a10f0c9eb7892df4605` | No explicit STATUS field; inherited base | No explicit field; complete base retained by V10.3 |
| [K線西遊記/temples/11520/HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md) | 1.1.0; rev2026-09-08.1 | `0ea5093608495a77a958ccb41a8f1fa7c00408c0` | ACTIVE PRODUCT WHITEPAPER | No explicit boolean field; defers to canonical Physics/dependencies |
| [K線西遊記/temples/11520/LOGISTICS_UNIVERSE_SPEC.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/LOGISTICS_UNIVERSE_SPEC.md) | 1.4.0; rev2026-10-03.3 | `c660c692ff1a1a04e9f6c1c721c146f868471868` | ACTIVE / PRODUCT CONCEPT | No explicit boolean field; scoped product concept, not generic Player law |
| [docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md) | CURRENT filename; date2026-08-09 | `760228b706ebec2b88831d09a9d91a829c7bba4a` | REVIEW CANDIDATE FOR CURRENT MERGE | No explicit boolean field; mass adoption uses CURRENT §235, not whole-candidate promotion |
| [K線西遊記/temples/11520/runtime/combat-mass-scale-runtime.mjs](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/combat-mass-scale-runtime.mjs) | 1.2.1 | `26138cd74cc9aac9cdbe3d19849ca9ea101502f7` | PROTOTYPE | No explicit SOURCE_OF_TRUTH field; existing implementation/lotMass, legacy C labels |
| [K線西遊記/temples/11520/KGEN_TRADING_SPEC.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/KGEN_TRADING_SPEC.md) | No VERSION field; rev2026-09-30.1 | `178fd703c0e9a436a1414b24b98800a54c01ecdb` | ACTIVE / SOURCE_OF_TRUTH | Declared in STATUS; trading domain only |
| [K線西遊記/temples/11520/VEHICLE_C_SPEC.md](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/VEHICLE_C_SPEC.md) | No VERSION field; rev2026-09-03.1 | `ef78ab36df5bbdb0a77fbfd6386b6a6ec265c010` | ACTIVE / SOURCE_OF_TRUTH | Declared in STATUS; require evidenced maxC/ownership, no guessed tiers |

## 5 單一既有器官與接線

| 範圍 | 現有 owner | 不可另建／需補證據 |
|---|---|---|
| Player signed C與lot | [mobile signed C](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/mobile-signed-c-immersive-runtime.mjs) → [combat drive adapter](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/combat-drive-adapter.mjs) → [combat mass scale](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/combat-mass-scale-runtime.mjs) | 不另外做NAV C owner。最新共享C服務為local候選；比較exact main與local來源。 |
| 物理運動／導航 | [spatial calibration](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/spatial-coordinate-runtime.mjs)、[main](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/game-5d-main.mjs)、[XYZ navigation](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/xyz-map-navigation-runtime.mjs) | main elapsed clock是locomotion owner；導航輸出走既有XYZ control，不繞collision/Player。Dodge與explicit death recovery有獨立action界線。 |
| HUD／Wallet foreground／Camera | [utility layout](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/market-origin-wallet-layout-runtime.mjs)、[mobile control layout](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/mobile-control-layout.mjs)及main既有Camera owner | 不再加CSS救火owner／第二套相機。hidden/inert/focus/cancel/repeatedopen要測真正runtime。 |
| Player／物品／恢復 | [Player Life](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/player-life-runtime.mjs)、[backpack](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/backpack-runtime.mjs)、[backend](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KAIOS/backend/README.md) | 508 inert adapter不等於live writers已切換；所有schema/migration/conflict/backup/restore/isolation需完整接受。 |
| Courier／物流 | [Logistics runtime](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/logistics-universe-runtime.mjs)、[Digital Ant](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/digital-ant-logistics-runtime.mjs) | 跨owner lock／receipt／存檔一致性不能靠本手冊grant；503仍HOLD。抵達不等於可驗證交付。 |
| Wallet／金融 | [existing wallet adapter](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/evm-wallet-runtime.mjs)、[preflight UI](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/real-trading-preflight-ui.mjs) | M1讀取、legacy EXIT-ONLY、M2 inert前置及real financial execution分開；不得自行另立balance/ledger或簽名。 |
| Company／handoff／customer | [company core](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/core/company/index.mjs)、[backend SQLite seam](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KAIOS/backend/src/adapters/local.mjs) | Customer background模型與automated-handoff研究是不同產品語義；共用既有owner不是第二個dispatcher/公司權限。 |
| 音訊 | [shared audio](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/assets/kaios-audio.mjs)、[provenance](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/docs/KAIOS_AUDIO_PROVENANCE.md) | 只用原創／有明確權利素材；歷史檔存在不等於license。 |

## 6 六條工程線与本地未發布來源

- A：[508](https://github.com/klineodyssey/kline-odyssey/pull/508) remote `4d511f6d0c814123ef612890d0f38cb3f1316468`，adapter/native18 evidence不是whole-Life cutover。local結構／admission工作維持P0 release HOLD。
- B：[505](https://github.com/klineodyssey/kline-odyssey/pull/505) remote `cc2358101a99d11c369fb22c47d203c2e17c8e4e` 尚open Draft；P2 explanation copy與Navigator相容重用不使505成為merged。
- C：[509](https://github.com/klineodyssey/kline-odyssey/pull/509) M1只讀已合併／部署，[513](https://github.com/klineodyssey/kline-odyssey/pull/513)/[515](https://github.com/klineodyssey/kline-odyssey/pull/515)公網QA修正已合併；本快照public M1 source/screens/network evidence已完成scoped closeout。M2與legacy金融生命周期不因此啟用。
- D：[500](https://github.com/klineodyssey/kline-odyssey/pull/500)研究、[501](https://github.com/klineodyssey/kline-odyssey/pull/501)offline模型及Customer background產品分別列證據。沒有真auth／ACK／closed-loop就標未知。
- E：[現有 backend](https://github.com/klineodyssey/kline-odyssey/blob/e26f3a76ef0be7f43058225f46def3fbe123371e/KAIOS/backend/README.md)由既有公司安排。澄序[原 assignment](https://github.com/klineodyssey/kline-odyssey/issues/491#issuecomment-5986249329)存在；本次沒有新的ACK／active branch證據，不複製實作或自行重派。
- F：Navigator/local World Radar與main已完成HUD分開。local `e3002866` / tree `19b92987` 已source-reviewed／459root+419temple測試，但沒有Chromium或global placement／LIVE CT／verified vehicles。

以下完整SHA只表示本地來源，**不是GitHub已發布source**；不可產生看似可開啟的GitHub blob連結：

- A_STRUCTURAL: `57afd528c29a928176fc43c6302c11a64acd97fd`，tree `7d84434ad8c5f959c181b9d3d0c6e23ce4b895b9`；LOCAL_ONLY_UNPUBLISHED_HOLD。Latest verified structural bounded-visual-start candidate,220 local model tests; no public/canonical admission or cutover.
- A_ADMISSION_MAP: `0d658baacc268e70afdea0be52ec681fb7304bd2`，tree `13b086b1099753c5eb820f4a9bd153ec0ee89cc3`；LOCAL_ONLY_UNPUBLISHED_DOCUMENTATION。Separate older admission/dependency map; not the latest structural source candidate.
- C_M2: `a5aab593fe18862dc77119e724b04ff454338b7f`，tree `0c8e9ed2406f0647032a561f2fe277069fd53083`；LOCAL_ONLY_UNPUBLISHED_INERT。71 focused/469 root/51 UI reported; no dispatch/signing/durability.
- C_LEGACY: `e90e34d620eb0df235741da026b293408f4a81a2`，tree `e5192c7ee35f616ab4f3d311f5f5f0744d9feeae`；LOCAL_ONLY_UNPUBLISHED_FINANCIAL_HOLD。Separate legacy lifecycle; not activation of principal recovery or real transactions.
- D_CUSTOMER: `0bbfa5cc5c6f4f391743a50f4b42f208ca397b4e`，tree `1995b5ea2a3c09235852af6ad8f06eb2b3820e6b`；LOCAL_ONLY_UNPUBLISHED_BACKGROUND_PRODUCT。56+30 scoped tests; limited simulated subplan, acceptance pending; no complete house/durable execution/revenue.
- F_NAVIGATOR: `e30028669f328f6c30b2d7cb2e1432b535c40558`，tree `19b929879c56db3fbd347531598075f2e54c192d`；LOCAL_ONLY_UNPUBLISHED_CANDIDATE。Main e26 integrated; runtime same reviewed e0aac,459 root/419 temple PASS; browser/hardware/global placement/LIVE CT/vehicles not established.

### Later local Navigator checkpoint

Publication preflight05:18 UTC directly verified clean local `2642c430882c18795f63fc99c3b3fb05346f3c37`, tree `97fabd701245d184ced9648bfa19f9408a7bc512`, titled “Reuse shared WarpRate arithmetic and scope classical energy diagnostics”. Owner confirmed exact2642 root459/459, temple421/421, three standalone drive scripts and syntax/workflow/diff checks PASS; narrow source review cleared at05:16:51. No native-browser acceptance or remote publication is claimed at this checkpoint. Earlier e300 results remain historical.

## 7 二十個固定工作包

ID保持Q01–Q20；新需求先放入相應子項，不創造第21個parent，也不因新增任務取消舊案。P0/P1代表有證據的release／產品風險，不代表所有工作都在同時跑。來源時間不同時，以exact head／最新readback為準。

| ID | Priority / Status | 工作與下一步 |
|---|---|---|
| Q01 | P1 / COMPLETE | **HUD V2.9.5 release scope** — Retain evidence; do not re-open completed work without a new defect. |
| Q02 | P0 / BLOCKED | **Whole Player Life integrity / held Courier recovery** — Review structural57afd and separate admission-map0d658; retain canonical admission, legacy, restore, migration and whole-Life native gates. |
| Q03 | P1 / READY_FOR_REVIEW | **Input QA lineage** — Use current-main evidence; root decides obsolete branch disposition. |
| Q04 | P1 / IN_PROGRESS | **M1 read-only wallet / M2 prerequisites** — Preserve completed M1 evidence; review local M2/legacy prerequisites separately without signing/activation. |
| Q05 | P2 / BLOCKED | **Financial activation** — Require specific Human action packet and applicable technical gates; do not infer authority from M1. |
| Q06 | P2 / READY_FOR_REVIEW | **Automated Handoff V2 design** — Review design without claiming real delivery. |
| Q07 | P2 / READY_FOR_REVIEW | **Offline Handoff V2 model** — Preserve fake-fixture/offline limits; no real recipient ACK. |
| Q08 | P2 / READY_FOR_REVIEW | **Separate customer-project background model** — Review against existing company owner, without merging its semantics into automated handoff. |
| Q09 | P2 / BLOCKED | **Real handoff identity / ACK** — Resolve actual approved endpoints/identity requirements before any live demo. |
| Q10 | P2 / QUEUED | **Universal Market ownership / lineage** — Reconcile assigned owner and181/188/200 lineage; no duplicate implementation. |
| Q11 | P2 / QUEUED | **Common Life/organ application / market design** — Reuse canonical Asset/Market/Settlement owners; no stock-like equity or dividend rights. |
| Q12 | P2 / QUEUED | **Reservation / matching / concurrency** — Audit existing price-time/replay/ownership behavior before implementation. |
| Q13 | P2 / QUEUED | **Existing Logistics integration** — Resolve typed physical routes and evidence without treating arrival as delivery/receipt. |
| Q14 | P2 / QUEUED | **Multiplayer foundation** — Define scoped game synchronization/acceptance before infrastructure. |
| Q15 | P1 / IN_PROGRESS | **Navigator / World Radar / retained P2 UX** — Complete Canon/domain audit and bounded tests; keep extra P2 controls scoped and separate. |
| Q16 | P2 / QUEUED | **First-party / licensed audio** — Audit concrete effect gaps without copying unlicensed recordings. |
| Q17 | P2 / QUEUED | **Recovery / authentication hardening** — Retain explicit identity, privacy, migration and recovery gates. |
| Q18 | P1 / COMPLETE | **Exact-main / public release proof** — Retain scoped evidence and accepted P2s; future product/version changes need fresh gates. |
| Q19 | P2 / READY_FOR_REVIEW | **Observability / cost budgets** — Review bounded improvement plans; distinguish planned, implemented and measured. |
| Q20 | P2 / IN_PROGRESS | **Durable queue / engineering handbook** — Review this docs-only successor and registration gap before any publication lane. |

## 8 測試與資源紀律

- 獨立research／code／小型model tests可並行；一次僅一個**新heavy batch**獲協調lane。workflow的多個既定push/PR jobs仍是一批，不能冒稱同時二十或二十九個工程worker。
- 共用檔案一個write owner；main merge及public release序列化。時間標記pending、running、terminal、artifact-reviewed、public-verified分開。
- 每次變更驗證exact head/tree；舊head PASS不替新head背書。Functional PASS加Visual FAIL仍未完成。候選CI、native模擬、合成provider、實體裝置、真public dispatch各自列coverage。
- 先調查失敗logs／sources／artifact；不得blind rerun、降低assertion、擴scope或把timeout當產品經濟故障。CI中斷時做已授權local工作；不杜撰永久背景運算。
- 每次release顯示產品版本；test-only改動不需假升runtime版本。已發布版本、本地候選版本和真公網source SHA分開。
- Source snapshot／receipt／CI state必須有timestamp、實際來源及scope；缺證據就`NOT_VERIFIED`／`NOT_RUN`。不用request送出代替ACK，也不用第三方宣稱代替Human授權。

## 9 授權與安全邊界

Human先前授予的safe engineering continuity範圍允許read/research/edit/test/commit/push/Draft PR/update PR以及適用已批准普通release流程。每小時唯讀回報是reporting範圍，不取消另行授予的工程權限；但回報本身不能擴張authority。具體任務仍服從最新範圍、檔案保護、資源lane與當前review要求。

本手冊為**docs-only review candidate**。發布狀態由所在commit與PR的實際readback判定；即使已成為Draft，也不表示已merge、完成Boot inventory或取得repository adoption。不因前述一般權限而自行發布。被拒絕或權限含糊的具體動作須停在該target，保留原始錯誤，請求精確授權證據；不能換工具／路徑繞過。新的範圍／敏感data／persistent access／financial execution要其適用獨立確認。

沒有任何此處文字授權Mainnet/Testnet交易、真實token/BNB/treasury/payroll/LP變動、signer/secret使用、KYC、account ownership、治理admin或production oracle activation。不得把未出資收益、local KAIOS、fixture receipt、wallet address標籤當真實settlement／營收。不要在handbook放private keys、token、密碼或非必要個資。

## 10 手冊維護與接續格式

一個固定檔名，累積維護；每次只更新有新证据部分，保留舊錯誤與合併來源，勿把歷史PENDING原地說成當時PASS。更新前讀main/PR/local ownership；更新後檢查link、JSON、20 IDs、scope、protected paths。完整內容本地驗證後再依已批准lane發布，並核對remote bytes/HEAD/Draft狀態。新main進入時重核candidate的base差異，不整包cherry-pick過時branch。

下方JSON是工程checkpoint，**不是正式WorkQueue／dispatch API**。文件所在commit／PR才是這份packet的exact HEAD；不能在同一份提交內容中捏造自我hash。每件工作維持WORK_ID、owner、base、branch、PR/head、完成與blocker、tests/CI/screens、security、next action、Human decision與timestamp。沒有來源的新任務先做proposal，不授予employee claim。

## 11 Index 與review packet

本檔唯一位置：`docs/KAIOS_DOT_ENGINEERING_HANDBOOK_CURRENT.md`。既有README、repo master sub-index及Company README加入口；既有`handoff/HANDOFF_CURRENT.md`只加pointer，所有原main內容保留。沒有另建Runtime、queue service或source authority。

AGENTS同時要求new-file Boot登錄與禁止未明確授權修改protected Boot。本packet不改兩個Boot／Physics／maps／registry。最小待review登錄建議只有一列：本路徑 →「dot跨專案工程參考及20-work-package checkpoint；不啟動runtime／身份／財務權限」。在適用Boot登錄決定未解決前，不宣稱此新檔已完整canonical inventory closeout。文件索引不等於protected registration。

## 12 下一個安全步驟

1. 保留e26 M1 scoped closeout（main/Pages/public/source/49圖/零簽名）與accepted P2；下一個工程成果仍需自己的exact-head與公開驗收，不重跑已完成M1來製造進度。
2. review此handbook與canonical矩陣／20 IDs／ownership，明確處理Boot inventory邊界；publication/CI狀態以所在commit/PR查驗，沒有結果不等於PASS。
3. A完成current local validation與admission/cutover依賴對照；F保持CLASSICAL_REFERENCE_NOT_CANONICAL_PLAYER_ENERGY display-only界線並排定native QA；C/M2與legacy保持financial HOLD。
4. Customer只接續受界定的background model驗收；Market先核對既定owner回覆，不平行替代。
5. 發布後以remote exact bytes、PR及CI實際trigger覆蓋核對，不因docs-only沒觸發CI而聲稱CI PASS。

## Machine readable checkpoint

```json
{
  "WORK_ID": "DOT-ENGINEERING-HANDBOOK-20261006",
  "OWNER": "dot",
  "PROJECT": "KAIOS cross-project engineering reference",
  "BASE": "e26f3a76ef0be7f43058225f46def3fbe123371e",
  "BRANCH": "dot/engineering-handbook-20261006",
  "PR": null,
  "HEAD": null,
  "HEAD_BINDING": "Exact source HEAD and PR resolve from containing commit/PR externally; no self-hash or implicit merge/adoption",
  "STATUS": "REVIEW_CANDIDATE",
  "COMPLETED": [
    "Boot V1.4 then CURRENT/Company/policy read",
    "Current main and relevant PR/source reads",
    "One indexed handbook with20 stable IDs and six tracks prepared as review candidate"
  ],
  "BLOCKED": [
    "Root review and publication lane",
    "Protected Boot inventory registration not edited; decision pending"
  ],
  "TESTS": "PASS:20 unique IDs,six tracks,68 source/local links,15 exact pinned blob rows,five Markdown scope,handoff-prefix preservation,protected/runtime unchanged,diff-check",
  "CI": "CI_NOT_CONFIGURED for these five Markdown candidate push/PR paths; no heavy CI run or PASS claimed",
  "SCREENSHOTS": "NOT_APPLICABLE_DOCS_ONLY; product evidence has per-work scope",
  "SECURITY": "No runtime/Physics/identity/registry/financial action or live-user-data change",
  "NEXT_ACTION": "Review packet, resolve registration scope, refresh evidence, then authorized publication only",
  "NEEDS_HUMAN_DECISION": "Protected Boot inventory addition if required; no new financial authorization requested",
  "TIMESTAMP": "2026-10-06T05:13:25Z",
  "formal_identity": "TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER_NO_LIFE_WORKER_EMPLOYEE_OR_T5_GRANT",
  "parent_count": 20,
  "queue": [
    {
      "id": "Q01",
      "priority": "P1",
      "status": "COMPLETE",
      "title": "HUD V2.9.5 release scope",
      "evidence": "510/511 merged; c99 scoped HUD/public closeout retained. New e26 gates are separate.",
      "next_action": "Retain evidence; do not re-open completed work without a new defect.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/510",
        "https://github.com/klineodyssey/kline-odyssey/pull/511"
      ]
    },
    {
      "id": "Q02",
      "priority": "P0",
      "status": "BLOCKED",
      "title": "Whole Player Life integrity / held Courier recovery",
      "evidence": "5084d511 all7 exact CI/native18 PASS within adapter scope; no live-writer/cutover acceptance. Local structural57afd220 model tests and separate admission-map0d658 are distinct unpublished work.503 recovery HOLD.",
      "next_action": "Review structural57afd and separate admission-map0d658; retain canonical admission, legacy, restore, migration and whole-Life native gates.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/503",
        "https://github.com/klineodyssey/kline-odyssey/pull/506",
        "https://github.com/klineodyssey/kline-odyssey/pull/508"
      ]
    },
    {
      "id": "Q03",
      "priority": "P1",
      "status": "READY_FOR_REVIEW",
      "title": "Input QA lineage",
      "evidence": "504 closed/merged;507 retained historical Draft;511 merged test-only entry correction.",
      "next_action": "Use current-main evidence; root decides obsolete branch disposition.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/504",
        "https://github.com/klineodyssey/kline-odyssey/pull/507",
        "https://github.com/klineodyssey/kline-odyssey/pull/511"
      ]
    },
    {
      "id": "Q04",
      "priority": "P1",
      "status": "IN_PROGRESS",
      "title": "M1 read-only wallet / M2 prerequisites",
      "evidence": "509 M1 and513/515 QA merged. e26 scoped M1 closeout COMPLETE05:13:25:five main QA families+Pages+publicPASS,15 source assets/six browser proofs/49 direct images/24x23 read snapshots. Physical MetaMask not verified; M2/legacy remain local inert/held.",
      "next_action": "Preserve completed M1 evidence; review local M2/legacy prerequisites separately without signing/activation.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/509",
        "https://github.com/klineodyssey/kline-odyssey/pull/513",
        "https://github.com/klineodyssey/kline-odyssey/pull/515",
        "https://github.com/klineodyssey/kline-odyssey/pull/488",
        "https://github.com/klineodyssey/kline-odyssey/actions/runs/37415708746/artifacts/11391107155"
      ]
    },
    {
      "id": "Q05",
      "priority": "P2",
      "status": "BLOCKED",
      "title": "Financial activation",
      "evidence": "M2-M5, signing, Mainnet and other protected execution remain held.",
      "next_action": "Require specific Human action packet and applicable technical gates; do not infer authority from M1.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/488",
        "https://github.com/klineodyssey/kline-odyssey/pull/509"
      ]
    },
    {
      "id": "Q06",
      "priority": "P2",
      "status": "READY_FOR_REVIEW",
      "title": "Automated Handoff V2 design",
      "evidence": "500acb4276e research Draft; real identity/endpoints and protected inventory gap unresolved.",
      "next_action": "Review design without claiming real delivery.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/500"
      ]
    },
    {
      "id": "Q07",
      "priority": "P2",
      "status": "READY_FOR_REVIEW",
      "title": "Offline Handoff V2 model",
      "evidence": "501012acd95 exact CI PASS;21 offline V2 tests, Node24 total442, Node20 421+21 skips.",
      "next_action": "Preserve fake-fixture/offline limits; no real recipient ACK.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/501"
      ]
    },
    {
      "id": "Q08",
      "priority": "P2",
      "status": "READY_FOR_REVIEW",
      "title": "Separate customer-project background model",
      "evidence": "Local0bbfa5cc,56+30 scoped tests; limited simulated subplan pending acceptance. Not a completed house, durable execution or revenue.",
      "next_action": "Review against existing company owner, without merging its semantics into automated handoff.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/492",
        "https://github.com/klineodyssey/kline-odyssey/pull/500",
        "https://github.com/klineodyssey/kline-odyssey/pull/501"
      ]
    },
    {
      "id": "Q09",
      "priority": "P2",
      "status": "BLOCKED",
      "title": "Real handoff identity / ACK",
      "evidence": "Real authentication, independently bound controllers, recipient ACK and closed loop NOT_VERIFIED.",
      "next_action": "Resolve actual approved endpoints/identity requirements before any live demo.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/500",
        "https://github.com/klineodyssey/kline-odyssey/pull/501"
      ]
    },
    {
      "id": "Q10",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Universal Market ownership / lineage",
      "evidence": "澄序 assignment recorded at491 comment5986249329; new ACK/active branch not established.",
      "next_action": "Reconcile assigned owner and181/188/200 lineage; no duplicate implementation.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/181",
        "https://github.com/klineodyssey/kline-odyssey/pull/188",
        "https://github.com/klineodyssey/kline-odyssey/pull/200",
        "https://github.com/klineodyssey/kline-odyssey/pull/491"
      ]
    },
    {
      "id": "Q11",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Common Life/organ application / market design",
      "evidence": "Install/composition/transplant, version/dependency/permission/compatibility and bid/ask are design goals.",
      "next_action": "Reuse canonical Asset/Market/Settlement owners; no stock-like equity or dividend rights.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/181",
        "https://github.com/klineodyssey/kline-odyssey/pull/200"
      ]
    },
    {
      "id": "Q12",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Reservation / matching / concurrency",
      "evidence": "Existing historical market and receipt boundaries remain prerequisites.",
      "next_action": "Audit existing price-time/replay/ownership behavior before implementation.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/181",
        "https://github.com/klineodyssey/kline-odyssey/pull/188",
        "https://github.com/klineodyssey/kline-odyssey/pull/200"
      ]
    },
    {
      "id": "Q13",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Existing Logistics integration",
      "evidence": "Reuse logistics-universe and Digital Ant; no second route, inventory or ledger.",
      "next_action": "Resolve typed physical routes and evidence without treating arrival as delivery/receipt.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/489"
      ]
    },
    {
      "id": "Q14",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Multiplayer foundation",
      "evidence": "Backend room/queue seams exist; deployed multiplayer/provider proof not established.",
      "next_action": "Define scoped game synchronization/acceptance before infrastructure.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/489"
      ]
    },
    {
      "id": "Q15",
      "priority": "P1",
      "status": "IN_PROGRESS",
      "title": "Navigator / World Radar / retained P2 UX",
      "evidence": "Local e300 on e26, runtime source-clear;459 root/419 temple PASS. No Chromium, global placement, LIVE binding or verified vehicles.",
      "next_action": "Complete Canon/domain audit and bounded tests; keep extra P2 controls scoped and separate.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/510",
        "https://github.com/klineodyssey/kline-odyssey/pull/511"
      ]
    },
    {
      "id": "Q16",
      "priority": "P2",
      "status": "QUEUED",
      "title": "First-party / licensed audio",
      "evidence": "Existing shared audio owner and provenance remain governing sources.",
      "next_action": "Audit concrete effect gaps without copying unlicensed recordings.",
      "sources": []
    },
    {
      "id": "Q17",
      "priority": "P2",
      "status": "QUEUED",
      "title": "Recovery / authentication hardening",
      "evidence": "489 merged candidate; production identity/provider and broader recovery authority not implied.",
      "next_action": "Retain explicit identity, privacy, migration and recovery gates.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/489"
      ]
    },
    {
      "id": "Q18",
      "priority": "P1",
      "status": "COMPLETE",
      "title": "Exact-main / public release proof",
      "evidence": "e26 exact-main five QA families/Pages/actual public37415708746 PASS; source before/after15 assets,six browser proofs,49 images directly reviewed,24x23 reads; scoped M1 closeout05:13:25.",
      "next_action": "Retain scoped evidence and accepted P2s; future product/version changes need fresh gates.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/515",
        "https://github.com/klineodyssey/kline-odyssey/actions/runs/37415708746/artifacts/11391107155"
      ]
    },
    {
      "id": "Q19",
      "priority": "P2",
      "status": "READY_FOR_REVIEW",
      "title": "Observability / cost budgets",
      "evidence": "Prior45m08s of95m26s runner-time opportunity is scoped/non-billing; overlapping30m28s is not additive.",
      "next_action": "Review bounded improvement plans; distinguish planned, implemented and measured.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/513",
        "https://github.com/klineodyssey/kline-odyssey/pull/510"
      ]
    },
    {
      "id": "Q20",
      "priority": "P2",
      "status": "IN_PROGRESS",
      "title": "Durable queue / engineering handbook",
      "evidence": "Human handbook request05:05:53; indexed engineering REVIEW_CANDIDATE, not runtime or identity authority. Containing commit/PR determines publication; protected Boot registration pending.",
      "next_action": "Review this docs-only successor and registration gap before any publication lane.",
      "sources": [
        "https://github.com/klineodyssey/kline-odyssey/pull/502",
        "https://github.com/klineodyssey/kline-odyssey/pull/514"
      ]
    }
  ],
  "tracks": {
    "A": [
      "Q02"
    ],
    "B": [
      "Q02"
    ],
    "C": [
      "Q04",
      "Q05",
      "Q18"
    ],
    "D": [
      "Q06",
      "Q07",
      "Q08",
      "Q09"
    ],
    "E": [
      "Q10",
      "Q11",
      "Q12",
      "Q13"
    ],
    "F": [
      "Q01",
      "Q03",
      "Q15",
      "Q18"
    ]
  },
  "local_only_sources": [
    {
      "track": "A_STRUCTURAL",
      "kind": "LOCAL_ONLY_UNPUBLISHED_HOLD",
      "head": "57afd528c29a928176fc43c6302c11a64acd97fd",
      "tree": "7d84434ad8c5f959c181b9d3d0c6e23ce4b895b9",
      "scope": "Latest verified structural bounded-visual-start candidate,220 local model tests; no public/canonical admission or cutover."
    },
    {
      "track": "A_ADMISSION_MAP",
      "kind": "LOCAL_ONLY_UNPUBLISHED_DOCUMENTATION",
      "head": "0d658baacc268e70afdea0be52ec681fb7304bd2",
      "tree": "13b086b1099753c5eb820f4a9bd153ec0ee89cc3",
      "scope": "Separate older admission/dependency map; not the latest structural source candidate."
    },
    {
      "track": "C_M2",
      "kind": "LOCAL_ONLY_UNPUBLISHED_INERT",
      "head": "a5aab593fe18862dc77119e724b04ff454338b7f",
      "tree": "0c8e9ed2406f0647032a561f2fe277069fd53083",
      "scope": "71 focused/469 root/51 UI reported; no dispatch/signing/durability."
    },
    {
      "track": "C_LEGACY",
      "kind": "LOCAL_ONLY_UNPUBLISHED_FINANCIAL_HOLD",
      "head": "e90e34d620eb0df235741da026b293408f4a81a2",
      "tree": "e5192c7ee35f616ab4f3d311f5f5f0744d9feeae",
      "scope": "Separate legacy lifecycle; not activation of principal recovery or real transactions."
    },
    {
      "track": "D_CUSTOMER",
      "kind": "LOCAL_ONLY_UNPUBLISHED_BACKGROUND_PRODUCT",
      "head": "0bbfa5cc5c6f4f391743a50f4b42f208ca397b4e",
      "tree": "1995b5ea2a3c09235852af6ad8f06eb2b3820e6b",
      "scope": "56+30 scoped tests; limited simulated subplan, acceptance pending; no complete house/durable execution/revenue."
    },
    {
      "track": "F_NAVIGATOR",
      "kind": "LOCAL_ONLY_UNPUBLISHED_CANDIDATE",
      "head": "e30028669f328f6c30b2d7cb2e1432b535c40558",
      "tree": "19b929879c56db3fbd347531598075f2e54c192d",
      "scope": "Main e26 integrated; runtime same reviewed e0aac,459 root/419 temple PASS; browser/hardware/global placement/LIVE CT/vehicles not established.",
      "latest_observed_head": "2642c430882c18795f63fc99c3b3fb05346f3c37",
      "latest_observed_tree": "97fabd701245d184ced9648bfa19f9408a7bc512",
      "latest_observed_at": "2026-10-06T05:18:38Z",
      "latest_validation": "Owner-confirmed exact2642:459 root/421 temple,three standalone drive scripts,syntax/workflow/diff PASS; source-clear05:16:51; native-browser acceptance NOT_RUN; publication not yet verified"
    }
  ]
}
```

## Boot source acknowledgement checkpoint

Human06:20:21要求的工程讀取紀錄，記錄本次實際read-only refresh，不能回填舊週期或證明認知閱讀／authenticated authorship。正式main Boot仍是`b85c9a34`；同一PR516的未合併candidate `9c852793`只有路徑／用途入口append，Boot blob為`0796d36c`。兩者不得混寫為同一個CURRENT已部署狀態。

格式只參考[Draft514](https://github.com/klineodyssey/kline-odyssey/pull/514)的path/blob與COMPANY_SYNC receipt概念；本段是有限projection，不宣稱符合其完整schema、執行validator或validator已在main。COMPANY_SYNC列出實際讀取範圍，未完成的全公司／身份／claim驗證不標PASS。既有二十工作包與Canon矩陣保持原樣。

```json
{
  "BOOT_ACK": {"status":"SELF_REPORTED_RELEVANT_SOURCE_READ","read_started_at":"2026-10-06T06:21:25Z","read_completed_at":"2026-10-06T06:22:13Z","recorded_at":"2026-10-06T06:23:15Z","authenticated_authorship":false},
  "BOOT_FILE": "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md",
  "BOOT_BLOB": "4286d1aede181f45eb274196a6799ac18ced42ec",
  "MAIN_SHA": "e26f3a76ef0be7f43058225f46def3fbe123371e",
  "BOOT_CURRENT": {"path":"PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md","main_blob":"b85c9a34a81810e0063480092025a9ef02d456cc","candidate_head":"9c852793d359d878d89ed9b336776c797dc43aac","candidate_blob":"0796d36c38ddeff48235f9739e832432a4ea6a01","candidate_status":"DRAFT_UNMERGED_PATH_PURPOSE_APPEND_ONLY"},
  "COMPANY_SYNC": {"observed_at":"2026-10-06T06:22:13Z","scope":"BOUNDED_READ_ONLY_SOURCE_REFRESH_NOT_FORMAL_COMPANY_ADMISSION","checks":[{"path":"KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md","blob":"c58eddb13da0a3ee520202f253290f560f368f04","read_scope":"Metadata and layer/authority sections"},{"path":"KGEN-KAIOS/worker_registry.json","blob":"d016a1d0a9dec94aa756de8b3ccfee9e7a88f62c","read_scope":"Metadata header only; no Worker identity validated or changed"},{"path":"KGEN-Organization/WorkOrders/WORK_QUEUE.md","blob":"1bc7a3bbed2f83bf6e28066dbfc5c0b92071fb4c","read_scope":"Opening work-item context only; no claim or complete queue audit"}],"prs":["514 Draft08204119 not merged","516 Draft9c852793 not merged"]},
  "DOMAIN_CANON": [{"path":"docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md","blob":"6eaa6d14d19f4f6d06d9172f1bd1a5cd55b35fcc","sections":"235,236,245,246: mass/direction/energy/motion"},{"path":"docs/maps/README.md","blob":"8d534fc6132d0e1f2127cd74571f3cd2e56e8e29","sections":"Current Shared Map selector"},{"path":"K線西遊記/temples/11520/LOGISTICS_UNIVERSE_SPEC.md","blob":"c660c692ff1a1a04e9f6c1c721c146f868471868","sections":"4.1 route/C calibration"}],
  "CANON_CONFLICT": [{"source":"Main Bootb85 versus candidate Boot0796","disposition":"DISTINCT_REFS_NOT_AUTHORITY_CONFLICT","reason":"Candidate adds only handbook path/purpose; not merged into main. Earlier handbook inventory-pending language is historical main/adoption status."},{"source":"Legacy C0 walking / map profit-axis prose versus scoped current engineering direction","disposition":"RECORDED_OUTSIDE_THIS_DOCUMENTATION_CHANGE","reason":"Existing handbook domain distinctions remain; no Physics, map, runtime or financial rule is amended."}],
  "FORMAT_REFERENCE": {"pr":514,"head":"08204119d78f3cf9ac0620dfab12e60cbd641011","schema_path":"KGEN-KAIOS/governance/agents/runtime-v0.1/KAIOS_COMPANY_BOOT_RUNTIME_V0_1_SCHEMA.json","reference":"Self-reported path/blob and bounded COMPANY_SYNC receipt fields","conformance_claim":false,"validator_executed":false,"validator_on_main_claim":false},
  "AUTHORITY": "Documentation receipt only; no authenticated identity, cognitive-reading proof, action grant, dispatch, financial authority or cutover."
}
```

## 13 Durable engineering checkpoint rule — 2026-10-06

Human 2026-10-06 13:28:54 UTC 的新指示：**WORKSPACE IS TEMPORARY / GIT HISTORY IS DURABLE**。本節累積補充既有 §8–10 的保存與交接流程，適用於已獲准施工的 dot、Codex、Codex Cloud、Cursor 及其他 engineering agents；不建立新 policy owner、正式 claim、Worker 身份或執行權限。

### 及早保存，不以完成度阻擋

- 已形成可編譯／可執行程式、有意義 diff、部分 tests、重要 bug repro、待 QA 修補或可供接手的半成品時，即建立 durable checkpoint；不等整項工作 100% 完成才第一次 push。
- 優先沿用該任務合法的 dedicated branch：檢查來源與安全內容 → commit → push GitHub → 讀回 branch HEAD、tree／必要 blob。Cursor 保留 `cursor-handoff/<Task-ID>`，其他 workers 遵循既有 allowed branch pattern；不另派 owner、不複製 claim。**不得把 main 當備份分支**，不得 force push、清理／覆盖他人的未提交工作。
- 本地 commit、上傳的孤立 blob、chat summary、未驗證 push 回覆都不等於可恢復來源。只有遠端 ref 可達且 exact HEAD/tree/必要 source bytes 已讀回，才標 `REMOTE_VERIFIED`；缺 ref／bytes 就如實標 `LOCAL_ONLY`、`BLOCKED` 或 `RECOVERY_REQUIRED`。
- 長測試／昂貴 QA 前先保存可用工作；測試結束或失敗後，再保存已知結果、精簡 redacted log、失敗位置及下一步。不要為等待全部綠燈而延後第一次保存，也不要因保存而啟動未獲准 heavy batch。
- WIP / candidate 先保存 branch；適用時使用既有 Draft PR 交接。完成且符合既有 merge policy 才進入相應 PR／CI／QA／main release 流程；checkpoint 不等於 merge、部署、發布或財務權限。

### 狀態、證據與安全內容

明示可並存的工程標記：`WIP`、`DRAFT`、`NOT_RELEASEABLE`；實際失敗加 `TEST_FAILURE`，阻塞加 `BLOCKED`，來源未能恢復加 `RECOVERY_REQUIRED`。這些是 checkpoint 資料欄位，不自行建立 GitHub labels 或改寫正式 WorkQueue 狀態。失敗的 WIP 可以保存，但不得寫成 production-ready。

每次 checkpoint 在既有 handoff／報告／PR 中保留 machine-readable 欄位：
`WORK_ID`、`OWNER`、`TIMESTAMP`、`BASE`、`BRANCH`、`HEAD`、`TREE`、`PR`、`STATUS`、`LABELS`、`COMPLETED`、`TESTS_PASSED`、`TESTS_FAILED`、`TESTS_NOT_RUN`、`CI`、`EVIDENCE_LINKS`、`BLOCKERS`、`NEXT_ACTION`、`SECRET_SCAN`。每項 test/CI/log 證據綁定實際 tested HEAD、時間與 scope。未知欄位用 null 或明確未知，不能從舊 PASS 補值。

提交內的報告不能自我寫入其尚未產生的 commit hash：保留 `SOURCE_HEAD`／`HEAD_BINDING`，在 push 後以既有 PR body 或外部 handoff envelope 補上讀回的 exact `HEAD`、`TREE`、commit link 及驗證時間。歷史錯誤保留，後續 append superseding evidence，不追改成當時已成功。

- Git 只保留適量可審閱 source、diff、repro、machine-readable evidence、log 摘要與 artifact manifest。大型截圖／影片／build output／資料集使用已批准的有界 artifact 儲存；記錄 run/artifact link、SHA-256、大小及保留／到期資訊，未查到就標未知。CI artifact 會到期，不能單獨取代 source checkpoint；不得無限制提交 binaries、cache、node_modules 或整個 workspace。
- commit/push 前檢查 exact diff 與待發布內容，排除 private keys、seed phrases、API/access tokens、cookies、密碼、環境 secret、認證檔及非必要個資。先 redaction 再保存；secret scan 的 scope、結果／限制必須列明，不能把未掃描當 PASS。
- 網路、權限或來源失敗時立即記錄 exact action／target／error，保留安全的本地 diff／repro 並回報；不換身份、工具或分支繞過拒絕。缺失資料不能從記憶重造為原版；partial artifact 或 422/404 只證明本次查詢結果，不證明全域永久遺失。
- 本規則不授權 financial execution、signer/secret 使用、Mainnet/Testnet 交易、真實資產移動、protected Boot／Physics／registry／permissions 修改、重寫歷史或自動 merge。既有 approval、安全與資源限制保持適用。

### 本次 documentation checkpoint envelope

```json
{
  "WORK_ID": "DOT-ENGINEERING-HANDBOOK-20261006",
  "PARENT_ID": "Q20",
  "OWNER": "dot",
  "ROLE": "TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER",
  "TIMESTAMP": "2026-10-06T13:32:20Z",
  "BASE": "e26f3a76ef0be7f43058225f46def3fbe123371e",
  "SOURCE_HEAD": "f44a4a8b06e095096ddf6c151c7eec2c5d5a020a",
  "BRANCH": "dot/engineering-handbook-20261006",
  "HEAD": null,
  "TREE": null,
  "HEAD_BINDING": "Containing commit; exact published HEAD/tree/readback added to PR516 body after non-force compare-and-swap push",
  "PR": 516,
  "STATUS": "DOCUMENTATION_REVIEW_CANDIDATE",
  "LABELS": ["WIP", "DRAFT", "NOT_RELEASEABLE"],
  "COMPLETED": ["Read formal Boot CURRENT, Company Boot, AGENTS and existing handbook/worker workflow", "Reuse existing Q20 handbook and handoff owners", "Define early durable checkpoint, long-test boundaries and secret exclusion"],
  "TESTS_PASSED": [],
  "TESTS_FAILED": [],
  "TESTS_NOT_RUN": ["Runtime tests", "Browser QA", "Heavy tests"],
  "CI": "Candidate paths match none of 19 active push/PR workflow definitions at base; CI_NOT_CONFIGURED, not PASS",
  "EVIDENCE_LINKS": ["https://github.com/klineodyssey/kline-odyssey/pull/516", "https://github.com/klineodyssey/kline-odyssey/pull/502"],
  "BLOCKERS": ["Documentation validation and remote readback must be recorded outside the containing commit", "Recovery audit is partial; existing product release holds remain"],
  "NEXT_ACTION": "Validate exact two-file append, publish checkpoint on existing branch, verify remote bytes and append audit results when available",
  "SECRET_SCAN": "Required before publication; exact result belongs to verified external envelope",
  "AUTHORITY": "Documentation-only checkpoint; no registration, formal claim, runtime, protected-path, workflow, merge, deploy or financial grant"
}
```


## 14 Continuous portfolio superseding checkpoint — 2026-10-07

Human instruction at 2026-10-07 03:47:23 UTC (`Sentinel_75d1fd2116188191adc3cb71fa99f287`) sets continuous authorized engineering, at least 20 executable backlog items, 5–7 active projects, 2–4 heavy parallel batches and one production merge lane. This later direction supersedes only the older §8 statement limiting new heavy work to one batch. It does not change Canon, identity, financial or protected-action boundaries. An hourly status report is not a stop-work event or new authorization gate.

The append-only [portfolio checkpoint in the existing handoff](../handoff/HANDOFF_CURRENT.md#continuous-portfolio-and-bounded-ready-backlog--2026-10-07) records current evidence, bounded work items, dependencies, owner overlap and actual counts. Its READY count is below target at the early snapshot; pending/blocked/active tasks are not padded into READY. Session owner labels do not establish formal Worker identity, authenticated ACK, employee capability or payroll. Actual 3D work shares Navigator ownership until a non-overlapping lane is established. No second Dispatcher or formal queue is created.

Preserve early COMMIT → PUSH → RECORD SHA, exact remote readback, prior Q01–Q20, #502 history and the #516 recovery ledger. Continue safe independent work while only the precise unsupported or protected action is held. This entry remains a documentation review candidate; no main merge or deployment is performed by this checkpoint.
