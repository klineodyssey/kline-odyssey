# CHANGELOG

## V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip

- 修正 active runtime 殘留舊測試圖 `wukong_heart_v10_4.png` 造成缺檔提示的問題。
- 正式資產路徑統一回 `assets/heart.png`；不新增漂移命名。
- `kgen-12345-install-check.js` 改檢查 `assets/heart.png`。
- 保留 V10.40.2 已恢復的 V9 recorder core。
- 保留左下 MOVE 平面遙桿，不刪 `#move-joystick-wrap` / `#move-joystick-knob`。
- 新增手機版安全排版修正：左上面板限高可捲動、中央悟空核心縮放、底部 HUD / 遙桿 / 宇宙電梯層級保護。
- 根目錄 `12345.html` 改為橋接檔；正式程式只在 `K線西遊記/temples/12345/index.html`。
- 根目錄 `wallet-12345.html` 更新為 V10.40.3 橋接入口。

## V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
- 研究 V9.0.0 正常錄影版，恢復 `export-canvas.captureStream(30)` + `MediaRecorder` 主流程。
- 主錄影不再用 `getDisplayMedia()` 覆蓋，避免新版螢幕錄影干擾原始留影錄影。
- 三聖盃檢查系統移到下方方向橫桿上方，縮小寬度，收合只控制自己，保留 tab 再開。
- 修復左下悟空心臟與右側神規視窗可展開。
- 左上殘留小標籤遮擋版本文字時自動隱藏。
