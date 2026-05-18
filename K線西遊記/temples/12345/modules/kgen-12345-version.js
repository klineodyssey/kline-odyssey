/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-version.js
VERSION: KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH
BUILD: 20260518-V10.40.6-MODULES-STABLE-PATCH
BASE_FROM: KGEN_12345_V10_40_5_MIRROR_CENTER_BULLBEAR_RESTORE_FULL.zip
RULE: continue modules; do not rebuild main DOM; patch only by module.
*/

window.KGEN_12345_VERSION = {
  PRODUCT_ID: "KGEN-12345-HEART-UI",
  VERSION: "KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH",
  BUILD: "20260518-V10.40.6-MODULES-STABLE-PATCH",
  BASE_FROM: "KGEN_12345_V10_40_5_MIRROR_CENTER_BULLBEAR_RESTORE_FULL.zip",
  MAIN_FILE: "K線西遊記/temples/12345/index.html",
  STRUCTURE: "modules continue; patch-only; no single-file rollback",
  ACTIVE_PATCH: "modules/runtime-v10-40-6-stable-patch.js",
  RULES: [
    "不走回頭路，保留 modules 架構",
    "不重建主 DOM，只以 patch module 修復",
    "舊跨年倒數 hide，新倒數獨立視窗",
    "三聖盃只控制自己，收合後可再開",
    "中央圖：多=bull-front，空=bear-rear，移動=heart",
    "warp-core 固定綁右下曲速引擎"
  ],
  ASSETS: {
    bull: "./assets/bull-front.png",
    bear: "./assets/bear-rear.png",
    heart: "./assets/heart.png",
    warp: "./assets/warp-core.png"
  }
};
console.log("[KGEN 12345 VERSION]", window.KGEN_12345_VERSION);
