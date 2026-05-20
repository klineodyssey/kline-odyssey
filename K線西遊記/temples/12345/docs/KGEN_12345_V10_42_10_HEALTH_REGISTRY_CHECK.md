# KGEN 12345 V10.42.10｜Health Registry Check

VERSION: 12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK
BUILD: 20260520-V10.42.10-HEALTH-REGISTRY-CHECK
STATUS: HEALTH CHECK / HOUSEHOLD REGISTRY

## 本版目的

本版不是新增神殿功能，而是建立檔案戶口與安裝體檢制度。

## 新增治理

- MANIFEST.json：正式戶口名冊。
- verify_manifest.js：本地自動體檢腳本。
- INSTALL_CHECKLIST.md：安裝檢查步驟。
- ORPHAN_REPORT.md：多出來的孤兒檔案 / 癌細胞檢查。
- MISSING_REPORT.md：失蹤人口檢查。
- HEALTH_REPORT.md：本版生成時體檢結果。

## 使用方式

在 `K線西遊記/temples/12345/` 目錄執行：

```bash
node verify_manifest.js
```

或在 GitHub 根目錄執行：

```bash
node K線西遊記/temples/12345/verify_manifest.js
```

## 判定規則

- MANIFEST 有但磁碟沒有：失蹤人口。
- 磁碟有但 MANIFEST 沒有：孤兒檔案 / 癌細胞候選。
- index.html 或 modules 引用不存在：斷神經。
- DELETE_LIST 仍存在：死亡細胞殘留。

## 正式原則

出生要登記，死亡要註銷，安裝要體檢。
