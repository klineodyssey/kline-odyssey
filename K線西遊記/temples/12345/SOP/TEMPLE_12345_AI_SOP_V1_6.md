# TEMPLE 12345 AI SOP V1.6｜XYZ 後鏡多方規則定稿

## 固定路徑
根目錄：`/12345.html`、`/wallet-12345.html`

神殿主檔：`/K線西遊記/temples/12345/index.html`

模組：`/K線西遊記/temples/12345/modules/`

資產：`/K線西遊記/temples/12345/assets/`

## Modules 主目錄固定名
- `kgen-12345-core.css`
- `kgen-12345-version.js`
- `kgen-12345-panel-router.js`
- `kgen-12345-holy-cup.js`
- `kgen-12345-stable-countdown.js`
- `kgen-12345-xyz-state-engine.js`
- `kgen-12345-xyz-state-engine.css`

帶版本號舊檔只能放：`/K線西遊記/temples/12345/modules/archive/`

## 固定圖片檔名
- `bull-front.png`：多方世界線圖。
- `bear-rear.png`：空方世界線圖。
- `warp-universe.png`：曲速宇宙圖。

## XYZ 定義
- X：左右位移，只由左下 MOVE 控制。
- Y：上下位移與曲速同步，只由左下 MOVE 與右側 WARP 控制。
- Z：多空方向，只由右下 DRIVE 與中下 CORE 方向橫桿控制。

## 多空與鏡頭定義
0 度為 12 點鐘方向。
- `-90° ～ +90°`：多方 = 後鏡看前方 = `bull-front.png`。
- 其餘角度：空方 = 前鏡迎市場 = `bear-rear.png`。

## 禁止事項
- DRIVE / CORE 方向橫桿不得改變 X/Y 位置。
- 方向盤轉動不得讓圖片自動回中央。
- MOVE 放手後圖片不得自動回中央；只有搖桿鈕可回中心。
- 不准新增帶版本號模組到 modules 主目錄。
- 不准改合約。
