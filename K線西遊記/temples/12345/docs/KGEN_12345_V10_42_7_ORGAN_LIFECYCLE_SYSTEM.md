# KGEN 12345 Organ Lifecycle System

VERSION: 12345-TEMPLE-V10.42.7-ORGAN-LIFECYCLE-SYSTEM  
BUILD: 20260520-V10.42.7-ORGAN-LIFECYCLE-SYSTEM  
STATUS: ACTIVE  

## 核心規則

每個視窗區塊都是一個器官，不再只是 div。

器官必須具備：

- ORGAN_ID
- ORGAN_NAME
- VERSION
- BUILD
- BIRTH
- DEATH
- DNA
- DEPENDENCIES
- TRANSPLANT_POLICY
- OFFICIAL_ASSETS

## 生老病死狀態

| 狀態 | 說明 |
|---|---|
| BORN | 器官出生，但尚未註冊 |
| REGISTERED | 已登記於器官系統 |
| ACTIVE | 已掛載並運作 |
| DORMANT | 休眠 / 收合，不刪除履歷 |
| DEAD | 死亡 / 移除，需留下死亡證明 |
| RESURRECT | 復活 / 重新掛載 |

## 本版新增器官

```text
ORGAN_ID: ORGAN_12345_WUKONG_CONTROL_CONSOLE
ORGAN_NAME: 五指山12345｜悟空財神殿控制台
VERSION: ORGAN-V1.0.0 / HOST-V10.42.7
BIRTH: 2026-05-20
DEATH: ACTIVE
TRANSPLANT: false
```

本器官不是從舊版 DOM 複製移植，而是依據既有器官生老病死規則新創造出來。它只做安全路由：如果舊功能存在就呼叫，不存在就提示，不硬綁錯誤函式。

## 新增檔案

```text
modules/kgen-12345-organ-system.css
modules/kgen-12345-organ-system.js
modules/organs/organ-12345-wukong-control-console.js
modules/organs/organ-12345-organ-registry.json
ORGAN_REGISTRY.md
docs/KGEN_12345_V10_42_7_ORGAN_LIFECYCLE_SYSTEM.md
```

## 正式資產

```text
assets/bull-front.png
assets/bear-rear.png
assets/heart.png
assets/warp-core.png
```

禁止新圖名漂移。
