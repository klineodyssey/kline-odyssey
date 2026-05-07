# 12345 Autopilot Handoff｜V8.1 Version-Governed Build

## Current Canonical File

- Product: `KGEN-12345-HEART-UI`
- Version: `12345-TEMPLE-V8.1`
- Build: `2026-05-07T00:00:00+08:00`
- File: `index_12345_Heart_UI_V8_1_version_governed.html`
- Output SHA256: `37121aa60dbaa016169263d40b8061c0cfab6e32e2c95d98d7968d12f4d99171`

## Base Content

- Base file: `index_12345_Heart_UI_V8_0_mobile_stabilized.html`
- Base SHA256: `2c3e977799aa39d9fd8e50db09a4afe978d717daff269f9e843ac3454d6f61b6`

## Version Governance Rule

從本版開始，12345、16888、Portal 與相關前端/合約程式不得只靠檔名判斷先後。
同一版號若有多個不同內容，必須以內容 hash 與內部版本欄位比對。

寫程式前必須先建立並更新：

1. `PRODUCT_ID`
2. `VERSION`
3. `BUILD`
4. `CHANGELOG / CHANGESET`
5. `BASE_FROM`
6. `BASE_SHA256`

禁止做法：

- 同版只改檔名。
- 舊內容貼新版本號。
- 只看檔名大小或日期就判斷母版。
- 先改完程式最後才補版本。

## What V8.1 Did

- 將 V8.0 內容正式升為內容治理版 V8.1。
- 先建立產品編號與版本識別，再做程式修補。
- 將畫面與 runtime 中可能殘留的 `V5.8 / V7.x / V8.0` 顯示文字統一鎖為 `12345-TEMPLE-V8.1`。
- 新增 `window.KGEN12345_BUILD` 與 `window.KGEN12345_VERSION_GOVERNANCE`，方便手機或瀏覽器 console 查驗。

## Next Autopilot Step

下一步不是降版，也不是重新創作。
正確流程是：

1. 若要救 V7.21，可先上傳「內容最穩的 V7.21 母檔」，用內容 hash 比對，而不是看檔名。
2. 若要繼續走 V8 線，直接以 `index_12345_Heart_UI_V8_1_version_governed.html` 為唯一母版。
3. 下一版必須升 `V8.2`，且先改本檔內部版本資訊再改功能。

## Quick Visual Check

手機開啟後，畫面頂部或標題若仍看到 `V7.19 / V7.21 / V7.23 / V8.0`，代表 GitHub Pages 快取或上傳檔案不是此 V8.1。
此時不要重寫程式，先清快取與確認 `index.html` 是否真的被替換成 `index_12345_Heart_UI_V8_1_version_governed.html` 內容。
