# KGEN 12345 FILE MANIFEST｜V10.27.1 STABLE STANDARD MODULES

BASE_FROM: V10.27_STABLE_ORGAN_CHECK_FULL
VERSION: 12345-TEMPLE-V10.27.1-STABLE-STANDARD-MODULES
BUILD: 20260516-V10.27.1-STANDARD-MODULES

## GitHub Pages 主路徑

- `/12345.html`：根目錄快捷入口
- `/wallet-12345.html`：錢包橋接入口
- `/K線西遊記/temples/12345/index.html`：12345 悟空財神殿主頁

## 正式 modules 根目錄檔案

以下檔名為永久標準名。改版只改檔案內 VERSION / BUILD / CHANGELOG，不在檔名加版本號。

- `/K線西遊記/temples/12345/modules/kgen-12345-core.css`
- `/K線西遊記/temples/12345/modules/kgen-12345-version.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-panel-router.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-stable-countdown.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-motion-control.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-install-check.js`
- `/K線西遊記/temples/12345/modules/kgen-12345-universe-elevator.js`

## 禁止事項

- 禁止在 `modules/` 根目錄放正式載入的 `kgen-12345-v10.xx-*.js`。
- 舊版保存一律放 `modules/archive/`。
- `index.html` 不可引用 archive 內檔案。
- 若要新增檔案，必須先更新本 MANIFEST 與 install-check。

## 已封存

- `modules/archive/kgen-12345-v10.26-autopilot-fix.js`
- `modules/archive/kgen-12345-v10.27-stable-organ-check.js`

功能已合併到：

- `modules/kgen-12345-universe-elevator.js`
