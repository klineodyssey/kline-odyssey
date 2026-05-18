# 12345 EXECUTION MAP

VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL

## 入口
`index.html`

## 新增 / 覆寫執行模組
- `modules/runtime-canvas-screen-recorder.js`：螢幕錄影 canvas fallback，window capture 優先攔截舊 getDisplayMedia handler。
- `modules/runtime-visual-semantic-control.js`：中央多空 / 心臟移動圖切換。
- `modules/runtime-warp-elevator.js`：warp-core.png 綁定既有右側 WARP 引擎軌道。
- `modules/runtime-layout-fix.js`：三聖盃位置、收合、左上標籤清理。

## 不可恢復
- `/modules/runtime/`
- 舊版 getDisplayMedia 手機硬叫流程
- 三聖盃控制總收合
