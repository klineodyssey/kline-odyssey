# K線西遊記｜kline-app-game

本資料夾提供 `KLINE-APP-GAME-BTC-4D-V0.1A` 作為 KLINE App Game 的目前公開入口與 BTC 4D Cockpit runtime 基準版本。

## 入口檔案

- `index.html`：已不是純 12345 母版複製，而是套用 KLINE App Game V0.1A patch 的 GitHub Pages / 靜態站入口。
- `index_kline_app_game_btc_4d_runtime_v0_1A_from_12345.html`：套用同樣 KLINE App Game V0.1A patch 的 BTC 4D Cockpit runtime v0.1A 基準副本。
- `index_12345_Heart_UI_V8_5_1_audio_version_hotfix.html`：12345 Heart UI V8.5.1 audio hotfix 母版，仍保留原始版本、build 與 hotfix 記錄。

## V0.1A runtime patch

`index.html` 與 `index_kline_app_game_btc_4d_runtime_v0_1A_from_12345.html` 皆已加入 KLINE App Game V0.1A 版本區、`window.playerState` guest trial 狀態，並將 12345 母版文字轉換為 BTC 4D Cockpit runtime 用語。

## 同步規則

若母版 `index_12345_Heart_UI_V8_5_1_audio_version_hotfix.html` 後續更新，請不要直接覆蓋 `index.html` 或 runtime 副本；必須先重新套用 KLINE App Game V0.1A patch，確保公開入口仍是 KLINE App Game runtime，而不是純母版複製。
