# TEMPLE 12345 AI SOP CURRENT

VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
BUILD: 20260518-V10.40.3-CANVAS-SCREEN-VISUAL-WARP-FULL

## 本版任務範圍
這版一次處理：螢幕錄影 fallback、中央四圖語意、warp-core 右側引擎綁定、三聖盃位置與收合、左上遮擋清理。

## 四圖語意
- `bull-front.png`：多方靜止主圖。角度 -90 到 +90。
- `bear-rear.png`：空方靜止主圖。角度超出 ±90。
- `heart.png`：MOVE / WARP 移動中暫態圖。停止後回多空圖。
- `warp-core.png`：右側既有 WARP 引擎艙，跟隨 C=0 到 300 上下移動，不取代中央主圖。

## 錄影規則
- 一般錄影：保留 V9 canvas captureStream 核心。
- 螢幕錄影：Android Chrome 不使用 getDisplayMedia，改用 canvas 合成錄影 `runtime-canvas-screen-recorder.js`。
- PC Chrome 如未來要真螢幕錄影，必須與 canvas fallback 分離，不得互相覆蓋。

## 三聖盃
- Panel 位置：下方方向橫桿上方安全區。
- 寬度：手機不得滿版，避免壓住中間宇宙視覺。
- 收合：只控制自己，不控制總收合，不控制其他 panel。
- 收合後：必須保留 `三聖盃檢查` tab 可再開。

## 檔案治理
- 主程式旁只開一層資料夾。
- modules 單層。
- 禁止 `/modules/runtime/`。
- 版本寫在 header / VERSION / CHANGELOG / VERSION_GOVERNANCE，不改正式檔名。
