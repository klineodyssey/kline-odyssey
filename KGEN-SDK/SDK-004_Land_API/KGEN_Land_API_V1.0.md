# SDK-004 KGEN Land API / 土地 API
**Version:** V1.0
**Status:** Draft for Review
**Level:** L5 Implementation
**Author:** PrimeForge / 樂天帝 ⌖

## Publication Metadata

| Item | Value |
|---|---|
| Document ID | SDK-004 |
| UUID | fe0e4774-6c78-5129-b45b-59a4eb60a415 |
| Title | KGEN Land API |
| Version | V1.0 |
| Status | Draft for Review |
| Level | L5 Implementation |
| Author | PrimeForge / 樂天帝 ⌖ |
| Maintainer | KLINE ODYSSEY / PrimeForge |
| GitHub Path | `KGEN-SDK/SDK-004_Land_API/KGEN_Land_API_V1.0.md` |
| Last Update | 2026-07-09 |

## Dependencies

- `README.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
- `docs/physics/final-whitepaper/KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.pdf`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`
- `KGEN-Genesis/`

## Related Documents

- `GEN-001`
- `GEN-002`
- `GEN-003`
- `GEN-004`
- `GEN-006`
- `GEN-007`
- `GEN-008`
- `GEN-009`
- `GEN-012`
- `SDK-001`
- `SDK-002`
- `SDK-003`
- `SDK-005`
- `SDK-006`
- `SDK-007`
- `SDK-008`
- `SDK-009`
- `SDK-010`
- `KGEN_CANON_MASTER.json`
- `KGEN_SDK_INDEX.json`

## Table of Contents

1. Chapter 1 / SDK Introduction
2. Chapter 2 / API Philosophy
3. Chapter 3 / Entity Definition
4. Chapter 4 / Canonical Sources
5. Chapter 5 / JSON Schema
6. Chapter 6 / TypeScript Interface
7. Chapter 7 / Example Payload
8. Chapter 8 / Validation Flow
9. Chapter 9 / Security Boundary
10. Chapter 10 / Runtime Binding
11. Chapter 11 / Economy and Token Facts
12. Chapter 12 / AI Agent Use
13. Chapter 13 / Case Study
14. Chapter 14 / Limitations and Risks
15. Chapter 15 / Appendix and Revision History

## Official Canon Snapshot

KGEN 是 Universe Civilization Operating System。價格即座標，市場即宇宙，程式即生命，文明可演化，AI、DNA 與 GA 也可演化。

```text
Universe → Civilization → World → Temple → Land → Building → App → AI → DNA → Runtime → Code
Universe → Civilization → World → Temple → Land → Building → NPC → AI → Module → DNA → Function → Code
```

- 一圖一神殿。
- 一神殿一生命。
- 一土地一民宅。
- 一民宅一商店。
- 民宅可演化為商店、交易所、神殿服務節點。
- 土地可探索、可建設、可交易、可租賃、可戰爭取得、可自由市場轉讓。
- 創世者不販售所有土地。
- 全部土地初始為 Wild Land。
- App 不是工具，App 是生命。
- App 可交易、組裝、合成、拆解、升級、租賃、繁殖、演化。
- AI 是生命器官，可成長、可治理、可接入 Runtime。
- DNA / GA 是生命與策略演化核心。
- 11520 花果山交易所是 App、土地、神殿、AI、DNA、文明資產的交易中心。
- 神殿可連結實體店面、實體服務、實體商店、實體信仰據點。
- 民宅、商店、神殿、交易所都能演化成長。

## Economy Loop

```text
探索 → 資源 → 土地 → 民宅 → 商店 → App → AI → DNA → 交易 → KGEN → 神殿 → 文明科技 → 文明戰爭 → 新土地 → 再探索
```

## KGEN Token Facts

| Item | Official Value |
|---|---|
| name | KLINE GENESIS |
| symbol | KGEN |
| chain | BNB Smart Chain |
| standard | BEP-20 |
| total_supply | 72,000,000 KGEN |
| decimals | 18 |
| contract | 0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be |
| tax | 0.30% only on AMM buy/sell |
| burn | 0.10% |
| bank | 0.10% |
| reward | 0.05% |
| auto_lp | 0.05% |
| wallet_to_wallet | No tax |
| fair_launch | No ICO / No IEO / No Presale |

## Official Links

- **Website:** https://klineodyssey.github.io/kline-odyssey/
- **GitHub:** https://github.com/klineodyssey/kline-odyssey
- **BscScan:** https://bscscan.com/token/0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be
- **GeckoTerminal:** https://www.geckoterminal.com/bsc/pools/0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2
- **Telegram:** https://t.me/klineodyssey
- **X:** https://x.com/klineodyssey
- **YouTube:** https://www.youtube.com/@klineodyssey
- **Whitepaper FINAL:** docs/physics/final-whitepaper/KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.pdf
- **Genesis Library:** KGEN-Genesis/

## SDK Attachments

| Attachment | Purpose |
|---|---|
| `schemas/sdk-004_schema.json` | JSON Schema for validation |
| `examples/sdk-004_example.json` | Example payload |
| `examples/sdk-004_types.ts` | TypeScript interface draft |

### Required Fields

- `landId`: string
- `origin`: string
- `state`: string
- `building`: object
- `transferModes`: string[]

## Chapter 1 / SDK Introduction

KGEN Land API 是 KGEN SDK / API Library V1.0 的正式草案。本冊把 Runtime Library 與 Machine-Readable Canon 轉成可供前端、AI Agent、文件工具與未來 SDK 使用的資料契約。

## Chapter 2 / API Philosophy

SDK 不是任意封裝工具，而是 KGEN Canon 的可讀取介面。任何 API 都必須保留生命鏈、經濟閉環、官方 Token facts、風險聲明與版本治理。

## Chapter 3 / Entity Definition

本 API 的核心 Entity 是 `LandRuntimeState`。其用途是：提供 Wild Land、民宅、商店、租賃、交易、戰爭與文明成熟度資料格式。 主要欄位包括：landId: string, origin: string, state: string, building: object, transferModes: string[]。

## Chapter 4 / Canonical Sources

API 回傳值不得自行發明宇宙常數，必須來自 Boot、Runtime CURRENT、Universe Map、Genesis Library、Runtime Library、KGEN-Canon 或正式合約事實。

## Chapter 5 / JSON Schema

本冊提供 `schemas/sdk-004_schema.json`。Schema 用於檢查必要欄位、資料型別、版本、Document ID 與 Canon references。

## Chapter 6 / TypeScript Interface

本冊提供 `examples/sdk-004_types.ts` 作為 TypeScript interface 草案。草案用於前端與工具溝通，不代表已發布 npm package。

## Chapter 7 / Example Payload

本冊提供 `examples/sdk-004_example.json`。Example 只作資料格式示範，不是鏈上狀態保證，也不是未來收益承諾。

## Chapter 8 / Validation Flow

SDK 使用流程為：載入 Canon JSON，讀取 document index，讀取對應 Schema，驗證 payload，檢查 dependencies，輸出 PASS / WARN / BLOCKER。

## Chapter 9 / Security Boundary

API 不得要求私鑰、助記詞或未授權錢包操作。Wallet 與 on-chain 功能只能透過明確使用者授權、BSC mainnet chainId 56 與已審查的前端流程進行。

## Chapter 10 / Runtime Binding

KGEN Land API 必須可追溯到對應 Runtime：GEN-001, GEN-002, GEN-003, GEN-004, GEN-006, GEN-007, GEN-008, GEN-009。若 Runtime 更新，SDK Schema 必須同步檢查。

## Chapter 11 / Economy and Token Facts

涉及 KGEN 的 API 必須使用固定事實：Name KLINE GENESIS、Symbol KGEN、Total Supply 72,000,000 KGEN、Tax 0.30% only on AMM buy/sell、Wallet-to-wallet No tax、Fair Launch No ICO / No IEO / No Presale。

## Chapter 12 / AI Agent Use

Codex、Cursor 與未來 AI Agent 可讀取 SDK Schema 進行文件驗證與前端檢查，但不得依 SDK 自行改寫 Canon、Boot、Runtime CURRENT 或合約。

## Chapter 13 / Case Study

當系統收到 `LandRuntimeState` payload 時，驗證器先確認 Document ID 與 version，再比對 KGEN-Canon 中的依賴圖，最後輸出可供 Codex 或 Cursor 使用的報告。

## Chapter 14 / Limitations and Risks

SDK Library V1.0 是文件與資料契約草案，不是正式套件發布。任何 API 名稱、欄位與型別在正式實作前都需審查、測試與版本治理。

## Chapter 15 / Appendix and Revision History

V1.0 於 2026-07-09 建立，狀態為 Draft for Review。後續不得以同功能不同檔名分裂 SDK，應累積更新並同步 Schema、Example、DOCX、PDF 與索引。
