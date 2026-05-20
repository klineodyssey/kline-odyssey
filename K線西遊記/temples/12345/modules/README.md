## V10.43 FINAL Runtime Architecture

新增正式啟動與健康檢查 Runtime。所有新增檔案都含 FILE_CERTIFICATE，且不得移入深層 organs 資料夾。


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


## V10.42.9 Death Cell Cleanup

正式規則：

```text
/modules = 存活神經根層
/modules/organs = 死亡神經，禁止作為正式 runtime
```

若需要新增器官，先在 `/modules/kgen-12345-organ-registry.json` 登記，再建立根層檔案：

```text
modules/kgen-12345-organ-<name>.js
```

不可再新增深層資料夾。
