# GEN-009 《KGEN AI Runtime》

**中文題名：** KGEN AI Runtime 規範  
**KGEN Genesis Library:** V1.0 Official Collection  
**Status:** Draft for Review  
**Level:** L4 Runtime  

## Publication Metadata

| Item | Value |
|---|---|
| Document ID | GEN-009 |
| UUID | f4cb4892-9ed9-583d-87dc-444e6c62efd3 |
| Title | KGEN AI Runtime / KGEN AI Runtime 規範 |
| Version | V1.0 |
| Status | Draft for Review |
| Level | L4 Runtime |
| Author | PrimeForge / 樂天帝 ⌖ |
| Maintainer | KLINE ODYSSEY / PrimeForge |
| GitHub Path | KGEN-Genesis/GEN-009_AI_Runtime/KGEN_AI_Runtime_V1.0.md |
| Last Update | 2026-07-09 |

## Dependencies

- [Root Master README](../../README.md)
- [PrimeForge Genesis Boot Sequence V1.4](../../PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md)
- [Runtime CURRENT](../../docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md)
- [Official V4.0 Final Whitepaper](../../docs/physics/final-whitepaper/KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.md)
- [Universe Map V10.2](../../docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json)
- [PrimeForge Multiverse Whitepaper V2.0](../../docs/Whitepaper/PRIMEFORGE_MULTIVERSE_WHITEPAPER_V2_0_GENESIS.md)
- [KGEN Token V7.5.2 Contract](../../KGEN/contracts/KGEN_Token_V7_5_2.sol)
- [KGEN Whitepaper V7.5.2](../../KGEN/whitepaper/KGEN_Whitepaper_GalacticBank_500Y_Epoch_V7.5.2.md)

## Related Documents

| Document ID | Title | Level | Link |
|---|---|---|---|
| GEN-001 | KGEN Genesis Bible / KGEN 創世聖典 | L0 Genesis | [KGEN_Genesis_Bible_V1.0.md](../GEN-001_Genesis_Bible/KGEN_Genesis_Bible_V1.0.md) |
| GEN-002 | KGEN Canon / KGEN 官方正典 | L1 Canon | [KGEN_Canon_V1.0.md](../GEN-002_Canon/KGEN_Canon_V1.0.md) |
| GEN-003 | KGEN Universe Design / KGEN 宇宙設計書 | L3 Design Bible | [KGEN_Universe_Design_V1.0.md](../GEN-003_Universe_Design/KGEN_Universe_Design_V1.0.md) |
| GEN-004 | KGEN Civilization Constitution / KGEN 文明憲章 | L2 Constitution | [KGEN_Civilization_Constitution_V1.0.md](../GEN-004_Civilization_Constitution/KGEN_Civilization_Constitution_V1.0.md) |
| GEN-005 | KGEN Official Homepage / KGEN 官方首頁規格 | L5 Implementation | [KGEN_Official_Homepage_V1.0.md](../GEN-005_Official_Homepage/KGEN_Official_Homepage_V1.0.md) |
| GEN-006 | KGEN Game Design / KGEN 遊戲設計聖典 | L3 Design Bible | [KGEN_Game_Design_V1.0.md](../GEN-006_Game_Design/KGEN_Game_Design_V1.0.md) |
| GEN-007 | KGEN DNA Evolution / KGEN DNA 與 GA 演化 | L4 Runtime | [KGEN_DNA_Evolution_V1.0.md](../GEN-007_DNA_Evolution/KGEN_DNA_Evolution_V1.0.md) |
| GEN-008 | KGEN Finance / KGEN 金融系統 | L3 Design Bible | [KGEN_Finance_V1.0.md](../GEN-008_Finance/KGEN_Finance_V1.0.md) |
| GEN-009 | KGEN AI Runtime / KGEN AI Runtime 規範 | L4 Runtime | [KGEN_AI_Runtime_V1.0.md](./KGEN_AI_Runtime_V1.0.md) |
| GEN-010 | KGEN Design System / KGEN 設計系統 | L3 Design Bible | [KGEN_Design_System_V1.0.md](../GEN-010_Design_System/KGEN_Design_System_V1.0.md) |
| GEN-011 | KGEN Exchange Listing / KGEN 交易所與資料平台登錄規格 | L5 Implementation | [KGEN_Exchange_Listing_V1.0.md](../GEN-011_Exchange_Listing/KGEN_Exchange_Listing_V1.0.md) |
| GEN-012 | KGEN Developer SDK / KGEN 開發者 SDK 規範 | L5 Implementation | [KGEN_Developer_SDK_V1.0.md](../GEN-012_Developer_SDK/KGEN_Developer_SDK_V1.0.md) |

## Table of Contents

1. Chapter 1 / 第1章 Introduction
2. Chapter 2 / 第2章 Core Philosophy
3. Chapter 3 / 第3章 Definitions
4. Chapter 4 / 第4章 Architecture
5. Chapter 5 / 第5章 Universe
6. Chapter 6 / 第6章 Civilization
7. Chapter 7 / 第7章 Finance
8. Chapter 8 / 第8章 Game
9. Chapter 9 / 第9章 AI
10. Chapter 10 / 第10章 Runtime
11. Chapter 11 / 第11章 Implementation
12. Chapter 12 / 第12章 Roadmap
13. Chapter 13 / 第13章 Governance
14. Chapter 14 / 第14章 Appendix
15. Chapter 15 / 第15章 Revision History

## Official Canon Snapshot

KGEN 不是一般區塊鏈專案，而是一個宇宙文明生命系統（Universe Civilization Operating System）。一切都具有生命，可演化。

```text
Universe → Civilization → World → Temple → Land → Building → App → AI → DNA → Runtime → Code
```

官方 Canon：

- 一宇宙一法則。
- 一文明一文明核心。
- 一世界一文明。
- 一圖一神殿。
- 一神殿一生命。
- 一土地一民宅。
- 一民宅一商店。
- 一商店一經濟。
- 一生命一 DNA。
- 一 AI 一 Runtime。
- 所有生命皆可演化。

文件層級制度：

| Level | Meaning |
|---|---|
| L0 Genesis | 創世層。定義宇宙起點與最高精神，不得由一般 AI 任意修改。 |
| L1 Canon | 正典層。定義不可違反的世界觀、公理與生命鏈。 |
| L2 Constitution | 憲章層。定義治理、權限與修改流程。 |
| L3 Design Bible | 設計聖典層。可累積擴充，但不得推翻 L0-L2。 |
| L4 Runtime | Runtime 層。以 CURRENT 為正式版本，更新必須累積。 |
| L5 Implementation | 實作層。可依需求更新，但必須保留正式路徑與引用。 |
| L6 Experimental | 實驗層。不得冒充正式版本。 |
| L7 Archive | 典藏層。保留歷史，不直接作為最新正式規格。 |

---

## Chapter 1 / 第1章 Introduction

GEN-009《KGEN AI Runtime 規範》是 KGEN Genesis Library V1.0 的正式出版文件。本文件狀態為 **Draft for Review**，層級為 **L4 Runtime**，目的在於：規範 AI 讀取順序、可擴充範圍、不得修改 Canon 的原則、Runtime CURRENT 與文件治理。
本書規定 AI 必須先讀 Boot V1.4、Runtime CURRENT、Universe Map、AGENTS.md，再開始修改。
本文件可以被官網、GitHub、AI、SDK、Whitepaper、CMC、CoinGecko、BscScan 與社群資料引用；引用時必須保留 Document ID、Version、Status、Level 與 GitHub Path。

## Chapter 2 / 第2章 Core Philosophy

KGEN 的核心理念以四個句子為底層語法：價格即座標，市場即宇宙，程式即生命，文明可演化。這些句子不是宣傳語，而是設計規則。
價格即座標，代表價格不是孤立數字，而是玩家、資源、風險、時間與文明位置的共同投影。市場即宇宙，代表市場具有邊界、重力、方向、速度、歷史與未知領域。
程式即生命，代表資料夾、檔案、函式、Runtime、README、白皮書與索引都是文明器官。文明可演化，代表玩家、AI、App、DNA、GA、土地與神殿都可以在規則內成長。

## Chapter 3 / 第3章 Definitions

本章固定官方 Canon 與基本定義。任何新文件、新神殿、新 SDK、新 AI 工作流或新遊戲規格，都不得與以下 Canon 衝突。
- 一宇宙一法則。
- 一文明一文明核心。
- 一世界一文明。
- 一圖一神殿。
- 一神殿一生命。
- 一土地一民宅。
- 一民宅一商店。
- 一商店一經濟。
- 一生命一 DNA。
- 一 AI 一 Runtime。
- 所有生命皆可演化。
生命鏈：`Universe → Civilization → World → Temple → Land → Building → App → AI → DNA → Runtime → Code`。完整工程生命鏈：`Universe → Civilization → World → Temple → Land → House → NPC → Player → AI → DNA → Gene → Runtime → Module → Function → Code`。
若未來新增設定，只能擴充既有生命鏈、文明循環與 Runtime，不得推翻創世公理。

## Chapter 4 / 第4章 Architecture

KGEN AI Runtime 的架構與整體 KGEN 宇宙架構一致：Universe 產生 Civilization，Civilization 展開 World，World 形成 Temple 群，Temple 連接 Land、Building、App、AI、DNA、Runtime 與 Code。
正式架構不允許以重複資料夾、重複 Runtime、版本號正式器官、patch/fix/hotfix/stable/final 類正式檔名來替代既有器官。若相同功能已存在，必須先閱讀與合併，而不是新增平行世界。
本書特定焦點為：AI Runtime、Boot 讀取順序、CURRENT、禁止重複 Runtime。這些焦點必須回到同一套 Universe Runtime，而不能成為互相衝突的系統。

## Chapter 5 / 第5章 Universe

Universe Map V10.2 是本套文件的世界觀來源之一，記錄 123 個座標概念，並以 16888 = 384,400 km 作為距離參考。
12345 五指山悟空財神殿是 Heart、wallet、玩家入口與 fortune temple；11520 花果山交易所是文明金融中心、App Marketplace、土地交易中心、神殿交易中心、AI Marketplace 與 DNA Marketplace；18888 神明銀行是銀行、抵押、財庫與清算概念。
Universe 設計不要求一次完成完整互動地圖，但所有神殿、Portal、交易所與文明地點都必須能回到 Universe Map 與 Runtime 的座標語言。

## Chapter 6 / 第6章 Civilization

文明循環由土地、神殿、民宅、商店、NPC、玩家、AI、DNA、交易與科技構成。民宅不是裝飾，民宅就是商店；Building 可販售商品、App、AI、DNA、土地、裝備、材料與文明科技。
- 土地不是創世者販售商品。
- 所有土地初始皆為 Wild Land。
- 土地由探索、建設、文明戰爭與自由市場交易取得。
- 所有土地皆可探索、建設、交易與戰爭。
文明規模由 Wild Land 展開為 Temple、Village、City、Kingdom、Civilization、Planet、Universe。每一層都需要可追溯的來源、治理與交易紀錄。

## Chapter 7 / 第7章 Finance

KGEN 金融系統以合約與文明循環共同約束。KGEN Token 名稱為 KLINE GENESIS，符號 KGEN，部署於 BNB Smart Chain，標準為 BEP-20，總供應量 72,000,000 KGEN，decimals 為 18。
KGEN_Token_V7_5_2.sol 固定 AMM buy/sell 稅率為 0.30%，其中 Burn 0.10%、Bank 0.10%、Reward 0.05%、AutoLP 0.05%。Wallet-to-wallet transfers 無稅。合約沒有 setTax / updateTax / setFees / updateFees 類稅率 setter。
金融閉環：`探索 → 取得資源 → 建設 → NPC → 交易 → 市場 → KGEN → Temple → 文明 → 科技 → 演化 → 再次探索`。此閉環描述文明資源流，不構成投資建議、收益承諾或價格保證。

## Chapter 8 / 第8章 Game

遊戲核心閉環必須完整，不能只做單一介面或單一任務。KGEN Game 以玩家行動推動文明：`探索 → 採集 → 建造 → 生產 → 交易 → 金融 → 任務 → 修行 → 打怪 → 升級 → DNA 演化 → GA 演化 → 文明科技 → 神殿建設 → 土地占領 → 文明戰爭 → 宇宙邊界探索 → Portal 傳送 → 治理`。
打怪練等等於 DNA 升級，GA100 → GA1000 代表策略、模型、績效與文明技能的可評估演化。回測歷史績效、多空精準度、賺錢升等、銀行聘請基金操盤手與績效分紅都是設計語言，但對外呈現時必須保留風險邊界。
遊戲產物不能脫離 Canon。探索取得資源，資源推動建設，建設生成交易，交易流通 KGEN，KGEN 支持神殿與文明科技，再引導新探索。

## Chapter 9 / 第9章 AI

AI 治理規則：AI 不得修改 Canon；AI 必須遵守 Genesis；AI 必須遵守 Constitution；AI 可擴充，但不可推翻官方設定。
任何 AI 修改前必須依序讀取 Boot V1.4、Runtime CURRENT、Universe Map、AGENTS.md、README 與目標文件。AI 不得任意建立新版 Runtime，不得建立 patch/fix/hotfix/stable 正式檔，不得新增 bootstrap 來取代既有 bootstrap。
AI 的正確角色是整理、驗證、生成文件、協助 SDK 與實作，而不是把個別修補變成新的宇宙法則。

## Chapter 10 / 第10章 Runtime

Runtime CURRENT 是正式版本；歷史 Runtime 是脈絡與 archive，不得被誤認為最新指令。Boot V1.4 是 AI 開機入口，Universe Map 是世界座標來源，AGENTS.md 是本地工作守則。
文件、程式與資產都屬於生命系統：Folder = Body，File = Organ，Function = Cell，DNA = Civilization Gene，RNA = Runtime Instruction，README = Civilization Memory。
本書不得建立新的 Runtime CURRENT_v2，不得複製 Boot，不得新增同功能不同版本檔。若需要更新，必須使用完整版累積更新，保留舊內容與引用脈絡。

## Chapter 11 / 第11章 Implementation

本文件正式路徑為 `KGEN-Genesis/GEN-009_AI_Runtime/KGEN_AI_Runtime_V1.0.md`。同目錄同步提供 DOCX、PDF、README 與 assets/README.md。
所有新文件必須登錄於 KGEN-Genesis/000_INDEX/README.md 與 KGEN-Genesis/KGEN_MASTER_INDEX.md，並保持 Document ID、UUID、Version、Status、Level、Dependencies、Related Documents、Last Update、Maintainer 可查。
Implementation 層文件可以調整呈現方式，但不得改變 L0 Genesis、L1 Canon、L2 Constitution 與 Runtime CURRENT 的正式含義。

## Chapter 12 / 第12章 Roadmap

V1.0 的目標是建立完整可引用的 Genesis Library 基礎版。V1.1 可以補充圖表、封面與平台審核版摘要；V2.0 可以在不推翻 V1.0 的基礎上加入更多實作案例。
後續 GEN-013 以後若開放，必須先在 000_INDEX 中取得 Document ID，再建立目錄與完整出版格式。CIV、TEM、FIN、AI、WEB、SDK、MAP 系列文件亦遵循同一規格。
任何 Roadmap 只能描述計畫與方向，不得描述保證收益、保證價格或外部平台一定通過審核。

## Chapter 13 / 第13章 Governance

Governance 的核心是累積而非覆蓋。白皮書、Runtime、Boot、Constitution 更新，一律採用完整版累積更新，不得刪除舊內容，不得只保留差異版，不得要求讀者回頭查舊版。
Document Level 控制修改權限：L0-L2 需要人工明確批准；L3-L5 可在任務授權下更新；L6 必須標為 experimental；L7 只能 archive，不得冒充 CURRENT。
任何提交都必須確認未誤改 contracts、12345 神殿、wallet、bridge、Runtime CURRENT、Boot 或已完成 final-whitepaper。

## Chapter 14 / 第14章 Appendix

官方名詞：KGEN = KLINE GENESIS；KLINE ODYSSEY = 專案宇宙；PrimeForge Mother Engine = 創世母機；Universe Runtime = 宇宙執行法則；Temple = 生命神殿；App = 可演化生命。
App 生命規則：
- App 不是工具，App 是生命。
- 每個 App 具有 DNA、生命週期、AI、等級與技能。
- App 可組裝、拆解、融合、演化、繁殖、交易、租賃與升級。
- 每個 App 都可以成為新的生命。
官方連結：
- Website: https://klineodyssey.github.io/kline-odyssey/
- GitHub: https://github.com/klineodyssey/kline-odyssey
- BscScan: https://bscscan.com/token/0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be
- GeckoTerminal: https://www.geckoterminal.com/bsc/pools/0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2
- Telegram: https://t.me/klineodyssey
- X: https://x.com/klineodyssey
- YouTube: https://www.youtube.com/@klineodyssey

## Chapter 15 / 第15章 Revision History

| Version | Date | Status | Notes |
|---|---|---|---|
| V1.0 | 2026-07-09 | Draft for Review | Genesis Library V1.0 official draft edition. |
未來版本必須在此章累積記錄，不得刪除 V1.0 的歷史。

## Cross-Reference Policy

本文件屬於 KGEN Genesis Library V1.0。所有引用必須保留 Document ID、Version、Status、Level、GitHub Path 與 UUID。外部文件若需要摘要本文件，應引用本 Markdown、DOCX 或 PDF，而不是轉述未登錄的片段。

## Legal and Risk Notice

本文件為 KGEN 宇宙文明、文件治理、遊戲設計、AI Runtime 與金融系統的官方出版草案。它不是投資建議，不承諾收益，不保證價格，不構成證券發行或募資邀約。KGEN token 相關資訊以鏈上合約、BscScan 與官方白皮書為準。
