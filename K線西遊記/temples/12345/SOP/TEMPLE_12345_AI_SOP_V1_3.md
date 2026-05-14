# TEMPLE 12345 AI SOP V1.3

## 目標

避免 AI / Cursor / Autopilot 後續亂放檔案、亂改版本、亂建 `/js/`，導致 12345 神殿功能互相覆蓋。

## 固定 GitHub 路徑

根目錄只放入口：

```text
/12345.html
/wallet-12345.html
```

12345 神殿主體：

```text
/K線西遊記/temples/12345/index.html
```

12345 專屬模組：

```text
/K線西遊記/temples/12345/modules/
```

SOP：

```text
/K線西遊記/temples/12345/SOP/
```

## Modules 主目錄命名規則

主目錄只放統一名，不放每版累積檔名：

```text
kgen-12345-core.css
kgen-12345-version.js
kgen-12345-panel-router.js
kgen-12345-holy-cup.js
kgen-12345-stable-countdown.js
kgen-12345-motion-control.js
```

版本寫在檔案內容，不寫在主檔名。

舊檔放：

```text
/K線西遊記/temples/12345/modules/archive/
```

## index.html 引用方式

必須使用相對路徑：

```html
<link rel="stylesheet" href="./modules/kgen-12345-core.css">
<script src="./modules/kgen-12345-version.js"></script>
<script src="./modules/kgen-12345-panel-router.js"></script>
<script src="./modules/kgen-12345-holy-cup.js"></script>
<script src="./modules/kgen-12345-stable-countdown.js"></script>
<script src="./modules/kgen-12345-motion-control.js"></script>
```

禁止使用：

```text
/js/
/assets/js/
/modules at root
```

## 方向控制規則

1. 左下 MOVE 方向盤：左右移中央圖左右，上下移中央圖上下。
2. 左下 MOVE 方向盤上下同時帶動右下 WARP 曲速引擎上下。
3. 右下 WARP 曲速引擎只能控制中央圖上下，不控制左右。
4. 前鏡 = 多方；後鏡 = 空方。
5. 前鏡 / 後鏡必須同步中間方向橫桿與右下 DRIVE 方向盤。
6. 中央小圖狀態：多顯示「多」，空顯示「空」。

## 版本治理

- 內容沒改，不升該模組內部版本。
- 內容有改，只改模組內部 VERSION，不改統一檔名。
- 發布包版本可升 V10.12、V10.13。
- 合約不改。

