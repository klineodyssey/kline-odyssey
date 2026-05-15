# KGEN 12345 FILE MANIFEST
# VERSION: V10.24
# BASE_FROM: V10.12_MOTION_CONTROL_PATCH

## Active HTML
- /12345.html — 根目錄橋接入口，導向神殿主頁。
- /K線西遊記/temples/12345/index.html — 悟空財神殿主頁。
- /wallet-12345.html — 錢包橋接入口。

## Active modules
- /K線西遊記/temples/12345/modules/kgen-12345-core.css — UI 樣式、drawer、amount box、warp scale。
- /K線西遊記/temples/12345/modules/kgen-12345-version.js — 版本顯示。
- /K線西遊記/temples/12345/modules/kgen-12345-panel-router.js — 左右視窗展開收合、客服導覽、右側神規 drawer。
- /K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js — 三聖盃、共用 amount-input、跨年倒數資訊。
- /K線西遊記/temples/12345/modules/kgen-12345-stable-countdown.js — 跨年倒數防閃爍。
- /K線西遊記/temples/12345/modules/kgen-12345-motion-control.js — V10.12 旋轉 DNA + V10.24 TRUE SYNC。
- /K線西遊記/temples/12345/modules/kgen-12345-install-check.js — 缺檔檢查與語音提示。

## Rule
Do not add versioned module filenames to /modules/. Old files go to /modules/archive/.
