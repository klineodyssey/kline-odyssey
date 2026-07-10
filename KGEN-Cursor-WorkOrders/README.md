# KGEN Cursor WorkOrders

> **SUPERSEDED — Not a live WorkQueue**  
> **Live queue:** [`KGEN-Organization/WorkOrders/WORK_QUEUE.md`](../KGEN-Organization/WorkOrders/WORK_QUEUE.md)  
> **Decision:** ORG-P2-003 D1 (MERGE). This folder remains as historical Cursor QA WorkOrders (CURSOR-001..010).

**Version:** V1.0  
**Status:** Superseded / Archaeology Only  
**Coordinator:** Codex  
**Worker:** Cursor

These work orders define Cursor's document QA role for KGEN Runtime Library, SDK Library, Machine-Readable Canon, GitHub Pages, and listing readiness.

| WorkOrder | Topic | Mission |
|---|---|---|
| `CURSOR-001_Check_Genesis_Library.md` | Genesis Library | 確認 GEN-001 至 GEN-012 的 Markdown、DOCX、PDF、README、assets/README 與索引一致。 |
| `CURSOR-002_Check_Runtime_Library.md` | Runtime Library | 確認 COS-001 至 COS-010 的 15 章、metadata、依賴、Canon 與出版格式完整。 |
| `CURSOR-003_Check_SDK_Schemas.md` | SDK Schemas | 確認 SDK-001 至 SDK-010 的 JSON Schema、example JSON 與 TypeScript interface 草案合法且互相對應。 |
| `CURSOR-004_Check_GitHub_Pages_Links.md` | GitHub Pages Links | 確認 README、主要 PDF、Markdown 與索引能在 GitHub Pages 讀取。 |
| `CURSOR-005_Check_No_Core_Damage.md` | Core Protection | 確認 contracts、12345、wallet、bridge、Boot、Runtime CURRENT、final-whitepaper 沒有被覆蓋或改動。 |
| `CURSOR-006_Check_Document_Consistency.md` | Document Consistency | 確認官方網址、Token facts、Document ID、Status、Level、Author 與 Maintainer 一致。 |
| `CURSOR-007_Check_JSON_Indexes.md` | JSON Indexes | 確認 KGEN-Canon 內所有 JSON 合法、可解析、路徑存在、依賴圖可讀。 |
| `CURSOR-008_Check_BscScan_CMC_Ready.md` | Listing Readiness | 確認 BscScan、CoinMarketCap、CoinGecko、GeckoTerminal 所需連結、Logo、白皮書、供應量與 Fair Launch 文字一致。 |
| `CURSOR-009_Check_App_Land_Temple_Economy_Loop.md` | Economy Loop | 確認 App、土地、神殿、民宅、商店、AI、DNA、11520 與 KGEN 閉環沒有斷點。 |
| `CURSOR-010_Final_QA_Report.md` | Final QA | 整合前九份檢查結果，輸出 PASS / WARN / BLOCKER 與給 Codex 的合併建議。 |
