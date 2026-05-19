# KGEN 12345 V10.42.6｜V10.2 單檔升 Modules 執行說明

## 本版目標

使用 V10.2 單檔 `index.html` 作為畫面母版，直接升級成 modules，不再讓舊 modules / runtime patch 疊加搶版位。

## 變更原則

```text
檔名也是資產。
所有檔案必須有履歷。
程式只讀正式定版資產名。
圖片更換只覆蓋同名正式檔。
```

## 正式資產名

```text
assets/bull-front.png
assets/bear-rear.png
assets/heart.png
assets/warp-core.png
```

## 新 modules

```text
modules/kgen-12345-core.css
modules/kgen-12345-runtime.js
```

## 上傳方式

若只更新 GitHub，可上傳 changed-only zip 內的檔案。完整包則可直接覆蓋同路徑。
