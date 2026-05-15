# 五指山・悟空財神殿 12345（Temple UI V10.23 TRUE LINK MODE）

本頁是《K線西遊記》GitHub Pages 的「五指山 12345」神殿入口。  
定位：悟空財神殿（Heart 發財金 / 呼吸 / 心跳 / 還願 / XYZ 宇宙控制台）

---

# 本版身份

VERSION：V10.23 TRUE LINK MODE  
BASE_FROM：KGEN_12345_V10_12_MOTION_CONTROL_PATCH_FULL_bundle  
PATCH_TYPE：只新增圖片連動，不改原本旋轉邏輯

本版不是退回 V10.2，也不是重寫旋轉。  
V10.12 已確認為 12345 最後正常旋轉母版，本版只在 V10.12 正常 motion-control 上增加 texture linkage。

---

# 核心天條

禁止修改：

- rotation math
- wheel sync
- core sync
- steer angle calculation
- MOVE 原本 X/Y 位移邏輯
- WARP 原本 Y 位移邏輯

允許新增：

- 圖片 src 切換
- bull / bear / heart 圖層連動
- warp-core 獨立顯示
- README / SOP / 版本註記

---

# 專案位置

```text
/K線西遊記/temples/12345/
```

---

# 專案結構

```text
index.html
wallet-12345.html
README.md
VERSION_INFO.txt

/assets/
/modules/
/archive/
/SOP/
```

---

# 已部署正式鏈上地址（BSC Mainnet）

## KGEN Token

```text
0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be
```

## Galactic Bank

```text
0xfc522243e988a837700CaD600D6f030f5932681F
```

## Genesis Inscription

```text
0x15fb2A5463F7873EC328BF6f2E85A115adcC3457
```

## Brain（花果山台灣）

```text
0xd0605F4EF10e5C1438F11AF9edc36926769239d6
```

## MarsSeats

```text
0x3529dbFbaD465C2269F8096879A1c298d5257298
```

## Heart（12345 悟空財神殿）

```text
0xB016D4d8f1aED1339101b30722cad6dbA9B8C972
```

## KUFO

```text
0xef83804c264B47378FCf150086943B53fB90A90b
```

## LP Pair

```text
0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2
```

## Public Good Treasury（花果山台灣）

```text
0xB73D6716005B37BEC742D64482fA26033eE1A4E1
```

---

# 固定資產（禁止亂改名）

放置路徑：

```text
/K線西遊記/temples/12345/assets/
```

必備檔名：

```text
bull-front.png
bear-rear.png
heart.png
warp-core.png
```

說明：

- `bull-front.png`：多方靜止主圖
- `bear-rear.png`：空方靜止主圖
- `heart.png`：MOVE / WARP 操作中顯示的悟空心臟推進圖
- `warp-core.png`：右下曲速引擎槽獨立顯示，不取代主圖

禁止再新增或改名成：

```text
warp-universe.png
heart-final.png
bull-v2-final.png
new.png
fix.png
final.png
```

---

# 固定 Modules

```text
/modules/kgen-12345-motion-control.js
/modules/kgen-12345-core.css
/modules/kgen-12345-version.js
/modules/kgen-12345-panel-router.js
/modules/kgen-12345-holy-cup.js
/modules/kgen-12345-stable-countdown.js
```

主 modules 禁止放版本號檔名。舊檔一律放 `/modules/archive/`。

---

# V10.23 控制邏輯

## 原旋轉邏輯保留

V10.12 原本正常旋轉邏輯保留，不重寫。

```text
方向盤角度 = 圖片角度 = 橫桿角度
1 : 1
```

禁止：

```text
rotate(zDeg * 2)
normalize360()
autoCenter()
springReset()
```

---

# 多空圖規則

## 多方

```text
-90° ～ +90°
```

顯示：

```text
bull-front.png
```

## 空方

```text
超過 ±90°
```

顯示：

```text
bear-rear.png
```

---

# MOVE / WARP 心臟圖規則

當 MOVE 左下方向盤正在操作，或右側 WARP / Y 軸正在操作：

```text
顯示 heart.png
```

停止操作後：

```text
依照目前 Z 角度恢復 bull-front.png 或 bear-rear.png
```

---

# Warp Core 規則

`warp-core.png` 只存在於右下曲速引擎槽。

規則：

- 只上下漂移
- 不左右移動
- 不取代主圖
- 不控制多空
- 不改主圖 rotation

---

# 版本治理

每次升版必須先寫清楚：

```text
VERSION
BASE_FROM
PATCH_TYPE
DO_NOT_MODIFY
```

版本升級原則：

```text
內容 > 檔名
```

禁止舊內容貼新版本號，禁止過期品貼新標籤。

---

# STATUS

目前主版本：

```text
V10.23 TRUE LINK MODE
```

旋轉母版：

```text
V10.12 MOTION CONTROL PATCH
```


# V10.23 Install Check

新增：`modules/kgen-12345-install-check.js`。開頁會檢查必要 modules 與 assets，缺檔時顯示 INSTALL CHECK FAILED 並語音提醒。


---

# V10.23 FIX NOTES

- BASE_FROM remains V10.12_MOTION_CONTROL_PATCH.
- Do not rewrite rotation math.
- Static state must show bull-front.png or bear-rear.png.
- Any active rotation or MOVE/WARP movement temporarily shows heart.png.
- Left MOVE Y links the right WARP vertical rail display.
- WARP 0x = bottom floor, 20x = neutral aesthetic floor, 300x = ceiling / highest parallel universe floor.
- warp-core.png stays inside the right WARP engine rail and never replaces the main image.
- Right-side rule panel size is matched to the Wukong Heart panel.
- Countdown flicker is guarded by stable minute-only updates and no animation.
- Holy Cup remains front-end ritual gate: press three Holy Cup buttons to pass; actual fortuneClaim still depends on Heart contract rules.


---

# V10.24 TRUE SYNC STRUCTURE

BASE_FROM: KGEN_12345_V10_12_MOTION_CONTROL_PATCH_FULL_bundle

本版不重寫旋轉系統。方向盤、橫桿、主圖旋轉仍繼承 V10.12 TRUE ROTATION DNA。

新增與修正：

- 右側神規改為 drawer：長寬對齊左側悟空心臟視窗，內容內部捲動，收合按鈕固定在右上角。
- 共用 amount-input：Approve、fortuneClaim、vowTo、lightLamp 共用同一個 KGEN 數量輸入。
- MOVE Y = WARP Y = 主圖 Y = warp-core Y：左下前後、右下曲速縱桿、主圖上下、曲速小圖上下，使用同一同步源。
- 操作中顯示 heart.png；停止後依角度回 bull-front.png 或 bear-rear.png。
- warp-core.png 僅為右下曲速小圖，不額外發光，不取代主圖。
- install-check 檢查固定資產與 modules，缺檔要顯示警告與語音提示。


---

# V10.27_UNIVERSE_ELEVATOR_CONTROL_PANEL_FIX

BASE_FROM: V10.24_UI_STRUCTURE_SYNC + V10.12_TRUE_ROTATION_DNA

核心規則：

```text
MOVE Y = Universe Elevator = WARP 0~300 = 主圖 Y = warp-core Y
```

右側曲速縱桿正式命名為「宇宙電梯 / UNIVERSE ELEVATOR」。
0 = 地表宇宙；20 = 正常市場層；100 = 高槓桿層；300 = 神級宇宙層。

新增：
- `modules/kgen-12345-universe-elevator.js`
- 右上「總收合」按鈕
- 右側神規 drawer scroll + 右上收合按鈕
- 左上悟空控制台右上收合按鈕
- 共用 KGEN 金額輸入說明

禁止：
- 不得改 rotation math
- 不得改 V10.12 方向盤 1:1 DNA
- 不得新增未登記資產名


# V10.27 Universe Elevator Control Panel Fix

- 宇宙電梯正式控制主圖上下位移。
- 左下 MOVE Y 與右側宇宙電梯同步。
- 右側神規按鈕穩定開合，視窗 header 縮小並可內部捲動。
- 宇宙地圖提升到最上層，不被 panel 壓住。
- 悟空心臟控制台右上新增收合 X。
- 底部八個主按鈕不被面板蓋住。
- 重複跨年倒數改為宇宙節點冷卻訊息。

BASE_FROM: V10.25_UNIVERSE_ELEVATOR_SYNC + V10.12_TRUE_ROTATION_DNA

- `modules/kgen-12345-v10.27-stable-organ-check.js`：V10.27 穩定器官自檢；修正金額輸入、宇宙電梯同步、Panel 層級與底部按鈕保護。


---

# V10.27.1 標準模組命名修正版

本版修正：正式載入模組不得使用版本號檔名。

正式規則：

```text
modules/ 根目錄只放標準名
版本號只寫在檔案內部 VERSION / BUILD / CHANGELOG
舊版檔案放 modules/archive/
index.html 不引用 archive
```

V10.26 與 V10.27 的功能已合併到：

```text
/K線西遊記/temples/12345/modules/kgen-12345-universe-elevator.js
```

目前 index.html 正式引用：

```html
<link rel="stylesheet" href="./modules/kgen-12345-core.css">
<script src="./modules/kgen-12345-version.js"></script>
<script src="./modules/kgen-12345-panel-router.js"></script>
<script src="./modules/kgen-12345-holy-cup.js"></script>
<script src="./modules/kgen-12345-stable-countdown.js"></script>
<script src="./modules/kgen-12345-motion-control.js"></script>
<script src="./modules/kgen-12345-install-check.js"></script>
<script src="./modules/kgen-12345-universe-elevator.js"></script>
```
