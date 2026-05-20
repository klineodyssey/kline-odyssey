# KGEN 12345 ORGAN REGISTRY

VERSION: 12345-TEMPLE-V10.42.8-NERVE-CONVERGENCE  
BUILD: 20260520-V10.42.8-NERVE-CONVERGENCE  
STATUS: ACTIVE / NERVE CONVERGED  

## 核心規則

```text
視窗區塊 = 器官
檔案名稱 = 器官身分證
資料夾路徑 = 神經路徑
深層資料夾 = 神經末梢
```

深層神經若沒有總神經表管理，容易死亡、忘記、無法動作。因此 V10.42.8 正式收斂：

```text
禁止執行層依賴 /modules/organs/
器官檔案回收至 /modules 根層
```

## Active Organs

### ORGAN_12345_WUKONG_CONTROL_CONSOLE

```text
ORGAN_NAME: 五指山12345｜悟空財神殿控制台
VERSION: ORGAN-V1.1.0 / HOST-V10.42.8
BIRTH: 2026-05-20
DEATH: ACTIVE
SOURCE: SELF_CREATED_FROM_ORGAN_LIFECYCLE_RULES
TRANSPLANT: false
OLD_PATH: modules/organs/organ-12345-wukong-control-console.js
NEW_PATH: modules/kgen-12345-organ-wukong-control-console.js
DEPENDENCIES:
  - modules/kgen-12345-organ-system.js
  - modules/kgen-12345-organ-system.css
  - modules/kgen-12345-organ-registry.json
OFFICIAL_ASSETS:
  - bull-front.png
  - bear-rear.png
  - heart.png
  - warp-core.png
```

## Deprecated Nerve Paths

```text
modules/organs/
```

此資料夾若存在於舊 GitHub，請刪除或封存，不能再被 index.html 載入。


## V10.42.9 Death Cell Cleanup｜2026-05-20

- 建立死亡細胞治理：DEATH_CERTIFICATE.md。
- 建立倖存檔案清單：SURVIVOR_LIST.txt。
- 建立引用稽核：REFERENCE_AUDIT.md。
- DELETE_LIST.txt 升級為癌化神經切除清單。
- 不新增 /modules/organs/，所有器官神經集中於 /modules 根層。
- 程式開頭版本升為 12345-TEMPLE-V10.42.9-DEATH-CELL-CLEANUP。
