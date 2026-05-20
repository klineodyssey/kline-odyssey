## V10.43 FINAL Asset Governance

本版沒有新增圖片資產名。正式圖片仍只允許：

```text
assets/bull-front.png
assets/bear-rear.png
assets/heart.png
assets/warp-core.png
```

Runtime 新增檔案是程式細胞，不是圖片資產；仍須列入 MANIFEST.json 與死亡管理。


# KGEN 12345 Asset Manifest｜V10.42.6

## 正式資產名

```text
assets/bull-front.png
assets/bear-rear.png
assets/heart.png
assets/warp-core.png
```

## 禁止資產漂移

```text
wukong_heart_core.jpg
wukong_caishen.png
heart-drive.png
warp-universe.png
*-patch.*
*-temp.*
*-hotfix.*
```

## 規則

檔名也是資產。程式只讀正式檔名；換圖只能覆蓋正式檔名，不新增舊名、不新增臨時名。


## V10.42.7 Organ Asset Governance

- Organ System 不新增圖片檔名。
- 所有器官若需視覺核心，必須引用正式資產：
  - `assets/bull-front.png`
  - `assets/bear-rear.png`
  - `assets/heart.png`
  - `assets/warp-core.png`
- 檔名本身也是資產，禁止新增 `final`、`patch`、`temp`、`new`、`old`、`v2` 等漂移命名。


## V10.42.8 Nerve Path Governance

```text
檔名是資產。
資料夾是資產。
路徑是神經。
```

正式執行層不再使用：

```text
modules/organs/
```

器官相關檔案統一置於：

```text
modules/kgen-12345-organ-system.js
modules/kgen-12345-organ-system.css
modules/kgen-12345-organ-wukong-control-console.js
modules/kgen-12345-organ-registry.json
```


## V10.42.9 Death Cell Cleanup｜2026-05-20

- 建立死亡細胞治理：DEATH_CERTIFICATE.md。
- 建立倖存檔案清單：SURVIVOR_LIST.txt。
- 建立引用稽核：REFERENCE_AUDIT.md。
- DELETE_LIST.txt 升級為癌化神經切除清單。
- 不新增 /modules/organs/，所有器官神經集中於 /modules 根層。
- 程式開頭版本升為 12345-TEMPLE-V10.42.9-DEATH-CELL-CLEANUP。
