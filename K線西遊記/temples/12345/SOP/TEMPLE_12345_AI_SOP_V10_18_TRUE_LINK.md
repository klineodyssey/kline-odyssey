# 五指山・悟空財神殿 12345（Temple UI V10.18 TRUE LINK MODE）

本頁是《K線西遊記》GitHub Pages 的「五指山 12345」神殿入口。  
定位：悟空財神殿（Heart 發財金 / 呼吸 / 心跳 / 還願 / XYZ 宇宙控制台）

---

# 本版身份

VERSION：V10.18 TRUE LINK MODE  
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
heart-drive.png
warp-core.png
```

說明：

- `bull-front.png`：多方靜止主圖
- `bear-rear.png`：空方靜止主圖
- `heart-drive.png`：MOVE / WARP 操作中顯示的悟空心臟推進圖
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

# V10.18 控制邏輯

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
顯示 heart-drive.png
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
V10.18 TRUE LINK MODE
```

旋轉母版：

```text
V10.12 MOTION CONTROL PATCH
```
