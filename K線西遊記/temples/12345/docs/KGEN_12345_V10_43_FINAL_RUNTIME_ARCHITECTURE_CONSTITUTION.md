# KGEN 12345 V10.43 FINAL｜Runtime Architecture Constitution

VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
DATE: 2026-05-20

## 本版目的

本版將啟動自檢從說明文件變成實際 Runtime。

## 新增 Runtime

```text
modules/kgen-12345-boot-runtime.js
modules/kgen-12345-manifest-runtime.js
modules/kgen-12345-immune-runtime.js
modules/kgen-12345-watchdog-runtime.js
modules/kgen-12345-recursive-verify.js
modules/kgen-12345-organ-lifecycle.js
modules/kgen-12345-death-manager.js
modules/kgen-12345-layout-runtime.js
modules/kgen-12345-sphere-runtime.js
modules/kgen-12345-warp-runtime.js
```

## 啟動流程

```text
index.html
→ manifest-runtime
→ immune-runtime
→ death-manager
→ watchdog-runtime
→ recursive-verify
→ boot-runtime
→ SYSTEM PASS / FAIL HUD
```

## 自檢內容

```text
missing files
forbidden names
deep organ folder
asset drift
dead still alive
duplicate scripts
required runtime cells
FILE_CERTIFICATE missing
```

## 操作方式

GitHub 上傳後直接開 `K線西遊記/temples/12345/index.html`。
右上角會顯示 SYSTEM PASS 或 SYSTEM FAIL。
本地可執行：

```bash
node verify_manifest.js
```
