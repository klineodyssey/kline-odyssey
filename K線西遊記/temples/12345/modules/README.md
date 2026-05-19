# KGEN 12345 Modules｜V10.42.6

本版將 `index_12345_Heart_UI_V10_2_FESTIVAL_RUNTIME_LOCK.html` 直接升級成 modules 結構。

## 正式模組

- `kgen-12345-core.css`：由 V10.2 全部 inline style 拆出。
- `kgen-12345-runtime.js`：由 V10.2 全部 inline script 拆出。

## 資產治理

只允許正式資產名：

```text
assets/bull-front.png
assets/bear-rear.png
assets/heart.png
assets/warp-core.png
```

禁止新增舊名或臨時名。換圖只覆蓋同名正式資產。
