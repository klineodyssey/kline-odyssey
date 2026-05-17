# 12345 EXECUTION MAP｜執行地圖

VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE

## GitHub Pages 入口
`K線西遊記/temples/12345/index.html`

## 執行判斷
檔案存在不代表會執行。  
只有被 `index.html` `<script src="...">` 或 `<link href="...">` 載入的檔案才會執行。

## Runtime 執行中樞
- `modules/runtime/kgen-runtime-state.js`
- `modules/runtime/kgen-panel-registry.js`
- `modules/runtime/kgen-zlayer-engine.js`
- `modules/runtime/kgen-visibility-engine.js`
- `modules/runtime/kgen-router-engine.js`
- `modules/runtime/kgen-universe-axis.js`
- `modules/runtime/kgen-temple-layout.js`
- `modules/runtime/kgen-warp-elevator.js`
- `modules/runtime/kgen-visual-semantic-control.js`
- `modules/runtime/kgen-recording-runtime.js`
- `modules/runtime/kgen-festival-runtime.js`

## 右下曲速電梯
- 資產：`assets/warp-core.png`
- 程式：`modules/runtime/kgen-warp-elevator.js`
- 規則：C=0 在底部，C=300 在頂部。

## 右側神規
- 程式：`modules/runtime/kgen-temple-layout.js`
- 控制：TempleHeart / Brain 對齊規則 panel
- 不是 Warp panel。

## 三聖盃
- 程式：`modules/runtime/kgen-temple-layout.js`
- 位置：方向橫桿上方
- 不受右上總收合控制。
