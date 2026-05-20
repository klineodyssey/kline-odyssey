## V10.43 FINAL Death Governance

本版新增的免疫與啟動細胞也受死亡規則管理。若未來替換以下檔案，必須將被替換檔案列入 DEATH_CERTIFICATE 與 DELETE_LIST，不得讓免疫細胞癌化：

```text
modules/kgen-12345-boot-runtime.js
modules/kgen-12345-immune-runtime.js
modules/kgen-12345-watchdog-runtime.js
modules/kgen-12345-manifest-runtime.js
modules/kgen-12345-recursive-verify.js
modules/kgen-12345-organ-lifecycle.js
modules/kgen-12345-death-manager.js
modules/kgen-12345-layout-runtime.js
modules/kgen-12345-sphere-runtime.js
modules/kgen-12345-warp-runtime.js
```


# KGEN 12345 Death Certificate

VERSION: 12345-TEMPLE-V10.42.9-DEATH-CELL-CLEANUP
BUILD: 20260520-V10.42.9-DEATH-CELL-CLEANUP
DATE: 2026-05-20

## 死亡細胞治理原則

本版開始，五指山 12345 不只管理出生，也管理死亡。

死亡細胞定義：

```text
舊路徑
舊 CSS
舊 JS
舊 Registry
深層神經資料夾
未被 index.html 引用的執行檔
patch / hotfix / temp / fix2 等執行層污染檔
```

若不清除，會形成：

```text
癌細胞
奇形異形
半身不遂
按鍵失效
畫面亂長
下一頁 AI 誤抓舊神經
```

## 本版死亡宣告

```text
/modules/organs/ = DECEASED / FORBIDDEN
所有器官執行檔回收至 /modules 根層
深層神經不再作為正式 runtime 入口
```

## 死亡原因

```text
深層資料夾不易被手機上傳管理
不易被下一頁 AI 看見
容易被舊 index 或舊 modules 誤引用
容易變成無人維護的癌化神經
```

## 本包掃描結果

```text
FORBIDDEN_FILES_FOUND = 0
```

未發現正式包內仍含 forbidden 執行檔。

## GitHub 操作

若 GitHub 既有倉庫仍存在以下路徑，請刪除：

```text
K線西遊記/temples/12345/modules/organs/
```

刪除後再上傳本版 changed-only 或 full package。
