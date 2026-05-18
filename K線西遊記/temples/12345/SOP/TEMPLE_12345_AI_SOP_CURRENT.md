# TEMPLE 12345 AI SOP CURRENT

VERSION: KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH
BUILD: 20260518-V10.40.6-MODULES-STABLE-PATCH

## 本頁最新天條

不走回頭路。此版以 `V10.40.5` modules 母版繼續，不退回單檔。

## 改版方式

只新增 / 修改必要 modules，不重建主 DOM，不再整包拆壞。

正式入口：
- `K線西遊記/temples/12345/index.html`

正式 patch：
- `modules/runtime-v10-40-6-stable-patch.js`

## 四圖規則

- `assets/bull-front.png`：多方靜止主圖。
- `assets/bear-rear.png`：空方靜止主圖。
- `assets/heart.png`：MOVE / WARP / 方向操作中暫態主圖。
- `assets/warp-core.png`：右下曲速引擎艙，跟隨 Warp 0~300 上下移動。

停止後回到多空圖：
- 角度 -90 到 90：多方圖。
- 角度 90 到 180 / -180 到 -90：空方圖。

## 跨年倒數

舊倒數若異常，不硬修。  
舊區塊只 hide / disable。  
新跨年倒數使用獨立視窗：
- 可收合
- 可再開
- 不共用心跳 / 節日 / festival timer

## 三聖盃

三聖盃檢查系統必須在下方方向橫桿上方安全區。  
寬度縮小。  
收合只控制自己。  
收合後保留 `三聖盃` tab 可再開。  
不得綁到右上總收合。

## 右側神規 / 左下悟空心臟

右側神規：控制 TempleHeart / Brain 規則視窗。  
左下悟空心臟：控制 Heart Motion 視窗。  
兩者不得混同左上主控制台。

## 結構

繼續 modules。  
不得退回單檔。  
不得新增深層 runtime 資料夾。  
patch module 放在 modules 單層。
