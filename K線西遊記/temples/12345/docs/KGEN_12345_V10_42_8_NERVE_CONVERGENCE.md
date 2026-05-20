# KGEN 12345 V10.42.8 NERVE CONVERGENCE

VERSION: 12345-TEMPLE-V10.42.8-NERVE-CONVERGENCE  
BUILD: 20260520-V10.42.8-NERVE-CONVERGENCE  
STATUS: OFFICIAL ROOT-MODULE ORGAN NERVE GOVERNANCE  

## 本版目的

V10.42.7 已建立器官生命週期，但新增 `/modules/organs/` 深層資料夾。深層資料夾若沒有總神經表長期管理，容易變成被遺忘的神經末梢，造成 UI 奇形異形、半身不遂、按鍵失聯。

V10.42.8 正式將器官神經收斂回 `/modules` 根層。

## 本版規則

```text
資料夾也是資產。
檔名也是資產。
路徑也是神經。
深層路徑若無管理，即視為高死亡風險。
```

## 本版移動

```text
OLD: modules/organs/organ-12345-wukong-control-console.js
NEW: modules/kgen-12345-organ-wukong-control-console.js

OLD: modules/organs/organ-12345-organ-registry.json
NEW: modules/kgen-12345-organ-registry.json
```

## 執行層允許路徑

```text
modules/kgen-12345-organ-system.js
modules/kgen-12345-organ-system.css
modules/kgen-12345-organ-wukong-control-console.js
modules/kgen-12345-organ-registry.json
```

## 廢止路徑

```text
modules/organs/
```

此路徑不再被 index.html 載入。

## 後續天條

除非器官數量超過十個，且同時建立並維護 `ORGAN_NERVE_MAP.json`，否則不得新增深層器官資料夾。
