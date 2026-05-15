# 12345 悟空財神殿 AI SOP V1.5

## 版本治理

modules 主目錄使用統一檔名，不用每版新增一堆 v10.xx 檔名。
檔名固定，版本寫在檔案內容註解。
舊檔如要保留，放 `modules/archive/`。

## 固定資產

```text
/K線西遊記/temples/12345/assets/bull-front.png
/K線西遊記/temples/12345/assets/bear-rear.png
/K線西遊記/temples/12345/assets/warp-universe.png
```

不得在程式內改成其他名稱。
若換圖，覆蓋同檔名，不改 JS。

## XYZ

X：左右。
Y：上下 / 曲速同步。
Z：多空方向，0 度為 12 點鐘方向。-90 到 +90 為多，其餘為空。

## 模組

```text
/K線西遊記/temples/12345/modules/kgen-12345-xyz-state-engine.js
/K線西遊記/temples/12345/modules/kgen-12345-xyz-state-engine.css
```

index.html 引用必須是相對路徑：

```html
<link rel="stylesheet" href="./modules/kgen-12345-xyz-state-engine.css">
<script src="./modules/kgen-12345-xyz-state-engine.js"></script>
```
