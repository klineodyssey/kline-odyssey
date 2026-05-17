# modules｜正式執行模組層

VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE

## 這層是什麼
這層放 `index.html` 會載入的正式模組。

## 子資料夾
- `runtime/`：正在執行的神殿中樞，詳見 `runtime/README.md`
- `archive/`：不用執行的舊檔或漂移檔
- `reference_v10_30/`：參考用，不自動執行

## 執行判斷
只有被 `index.html` 的 `<script src="...">` 或 `<link href="...">` 載入的檔案才會執行。
