# 12345 EXECUTION MAP

VERSION: KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH

## 入口
`K線西遊記/temples/12345/index.html`

## 本版新增執行檔
`modules/runtime-v10-40-6-stable-patch.js`

## 執行順序
index 原本 modules 先載入。  
最後載入 `runtime-v10-40-6-stable-patch.js` 作為穩定外掛修復層。

## 本版修復
- 舊跨年倒數隔離，新倒數獨立視窗。
- 三聖盃 panel 移到下方方向橫桿上方，縮寬，自己收合 / 再開。
- 中央主圖多空切換：多=bull-front，空=bear-rear，移動=heart。
- 右下 Warp 引擎綁定 `warp-core.png`，跟隨拉桿上下移動。
- 左下悟空心臟與右側神規補獨立視窗。
- 左上殘留小標籤遮擋清理。

## 不做
- 不退回單檔。
- 不重建主 DOM。
- 不新增 modules/runtime 深層資料夾。
