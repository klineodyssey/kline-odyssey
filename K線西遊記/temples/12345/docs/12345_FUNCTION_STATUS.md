# 12345 神殿功能盤點（V3.0）

> 盤點基準：`index.html` + 已載入腳本鏈（`runtime-main.js` V3.0）  
> 日期：2026-06-29

## 圖例

| 代碼 | 意義 |
|------|------|
| ✅ | 可正常使用 |
| 🟡 | 有 UI 但無作用（或僅示範） |
| ❌ | 已失效 |
| 🔵 | 已被 Runtime V2/V3 接管 |
| ⚫ | Dead Code（無程式呼叫） |

---

## 1. 可正常使用 ✅

| 功能 | DOM / 入口 | 執行模組 |
|------|-----------|----------|
| Heart 控制台展開/收合 | `#kgen-heart-toggle` | `ActionRuntime` |
| 錢包連線 / 切 BSC | `#kh-connect`, `#w3-connect-btn`, `web3.smartConnect` | `WalletRuntime` |
| MetaMask App deeplink | `#kh-metamask-open`, walletHub | `WalletRuntime` |
| 刷新餘額 | `#kh-refresh` | `WalletRuntime` → `HeartRuntime.refreshChainData` |
| 切換錢包 / 下載收藏 | `#kh-switch`, `#kh-download` | `WalletRuntime` |
| Allowance 分流顯示 | `#kh-allowance-status` | `ApproveRuntime` |
| Approve 發財金 / 無限授權 | `#kh-approve-current`, `#kh-unlimited` | `ApproveRuntime` |
| 三聖盃 0/3→3/3 | `#kh-cup-1~3`, `#kh-cup-reset` | `HolyCupRuntime` |
| fortuneClaim | `#kh-fortune`, `templeOps.fortune` | `HeartRuntime` |
| heartbeatClaim | `#kh-heartbeat`, `templeOps.heartbeat` | `HeartRuntime` |
| igniteAndClaim | `#kh-ignite`, `templeOps.ignite` | `HeartRuntime` |
| festivalClaim | `#kh-festival1/2`, `#kgen-v102-festival-*` | `HeartRuntime` |
| newYearCountdownClaim | `#kh-newyear`, `#kgen-v102-newyear` | `HeartRuntime` |
| vowTo | `#kh-vow` + `#kh-vow-amount` | `HeartRuntime` |
| lightLamp | `#kh-lamp` + `#kh-lamp-days` | `HeartRuntime` |
| makeWish | `#kh-wishbtn` + `#kh-wish-text` | `HeartRuntime` |
| 前鏡多方 / 後鏡空方 | Footer 鍵 3–4 | `MirrorRuntime` |
| 拍照 / 錄影 | Footer 鍵 1–2, `app.capture/toggleRec` | `app` + `divine-regeneration` |
| 螢幕錄影 | Footer 鍵 6, `#kgen-v902-rec-*` | `ScreenRecorderRuntime` |
| 右側神規 / 規則活動 | Footer 鍵 7–8 | `LayoutRuntime` / `ActionRuntime` |
| 跨年倒數 | `#kh-ny-slot`, `#kgen-v102-festival-countdown` | `CountdownRuntime` |
| 台灣/UTC 時鐘 | `#sys-clock`, `#kh-utc` | `HudRuntime` |
| StatusBus / kh-log | `#kgen-v902-left-status`, `#kh-log` | `StatusRuntime` |
| 土地地籍 Demo | `#kgen-land-panel` | `LandRuntime` + `kgen-land-engine.js` |
| 客服導覽 | `#guideUnifiedBtn`, `app.openUnifiedGuide` | `app-shell` |
| 五指山音響 | `#music-panel`, `app.openMusic` | `app-shell` |
| Three.js 星場 | `#galaxy-bg` | `app.initThree` |
| DRIVE 方向盤 | `#wheel` | `MirrorRuntime` → `app.applySteer` |
| 方向橫桿 | `#steer-input-val` | `MirrorRuntime` |
| MOVE 搖桿 | `#move-joystick-wrap` | `MirrorRuntime` |
| WalletConnect QR | walletHub | `web3.connectWalletConnect` |
| 多錢包 deeplink | walletHub 各按鈕 | `WalletRuntime.deepLink` |

---

## 2. 有 UI 但沒作用 🟡

| 功能 | 原因 | V3.0 處理 |
|------|------|-----------|
| GA Evolution 數值 | 純展示動畫 | 保留示範 HUD |
| K線引擎面板 | 無鏈上 K 線 feed | 保留 UI 殼 |
| 席位格 g1/g2 | 靜態/demo 格 | 保留展示 |
| WARP 曲速桿 | 只影響粒子動畫 | 保留 `app` 綁定 |
| 排行榜 `#board-panel` | 無後端 | 隱藏 + stub 提示 |
| 名額紀錄 `#round-history-modal` | 16888 輪次模型 | 隱藏 + 導向 Heart |
| Chain Live Pool 欄位 | `web3` 用舊 Universe ABI | 隱藏；改讀 HeartRuntime |
| 許願還願 modal `#kgen-v860-*` | 與 Heart 控制台重複 | 保留殼，按鈕導向 Heart |

---

## 3. 已失效 ❌ → V3.0 修復/隱藏

| 功能 | 原 onclick | V3.0 |
|------|-----------|------|
| `templeAudio.*` | 未定義 global | `LegacyBridgeRuntime` → `app.music*` |
| `templeSingleModal.*` | 未定義 | stub → 開 Heart 控制台 |
| `betPanel.buy/sell` | 未定義 | stub → Heart claim 按鈕 |
| `chainLive.refresh` pool | 錯誤 ABI | stub → `HeartRuntime.refreshChainData` |
| `leaderboard.refresh` | 未定義 | stub 示範提示 |
| `app.openCoordModal` 等 | 未實作 | `MirrorRuntime` / StatusBus 提示 |
| `#k12345-move-pad` 方形移動 | 無 JS | **已移除 DOM** |

---

## 4. 已被 Runtime V2/V3 接管 🔵

| 領域 | 模組 |
|------|------|
| 啟動 / 定時器 | `KGEN_RUNTIME_CORE.boot`, `TimerRegistry` |
| 狀態列 | `StatusRuntime` |
| 錢包全流程 | `WalletRuntime` |
| Allowance | `ApproveRuntime`（V3 新增） |
| Heart 讀寫 | `HeartRuntime` |
| 聖盃 | `HolyCupRuntime` |
| 鏡像 / 方向 | `MirrorRuntime`（V3 統一） |
| Footer 8 鍵 | `ActionRuntime`（覆寫 inline onclick） |
| `templeOps.*` | `ActionRuntime.exposeLegacyActions` |
| 土地 | `LandRuntime` |
| 佈局修復 | `LayoutRuntime` |
| 錄影面板 | `ScreenRecorderRuntime` |
| 跨年倒數 | `CountdownRuntime` |
| Dead panel 隱藏 | `LegacyBridgeRuntime` |

---

## 5. Dead Code ⚫（V3.0 已處理）

| 項目 | 位置 | 處理 |
|------|------|------|
| `runtime-legacy.js` | `modules/` | 未載入，保留 archive |
| `kgen-12345-transformer-runtime.js` | `modules/` | 未載入 |
| `kgen-12345-world-axis.js` 等搖桿 | `modules/` | 未載入；邏輯併入 `MirrorRuntime` |
| `#k12345-move-pad` | `index.html` | **已刪除** |
| 16888 bet-live 重複按鈕列 | `#bet-live-panel` | 隱藏 `kgen-v3-dead` |
| `temple-audio-console` 重複音樂 UI | 頂部 | 隱藏；用 `#music-panel` |
| `web3` 10s polling Universe pool | `web3-shell` | V3 改為委派 Heart 刷新 |
| 重複 inline footer onclick | `index.html` | `ActionRuntime` 覆寫 |

---

## 事件綁定摘要（Part 2）

### 權威綁定：`Events.bindOnce`（runtime-main）

- Heart 交易鍵：`HeartRuntime.bindButtons`
- 聖盃：`HolyCupRuntime.bindButtons`
- 錢包：`WalletRuntime.bindWalletButton`
- Footer：`ActionRuntime.bindFooterButtons`（**覆寫** HTML onclick）
- 錄影：`ScreenRecorderRuntime.init`
- Allowance 欄位 input：`ApproveRuntime.bindFields`

### 重複綁定（已知、可接受）

| 按鈕 | 綁定 1 | 綁定 2 |
|------|--------|--------|
| `#kh-festival1` | HeartRuntime | 與 `#kgen-v102-festival-520` 同函式 |
| `web3.smartConnect` | web3-shell | WalletRuntime.patch |
| `templeOps.fortune` | exposeLegacyActions | → `clickAction('kh-fortune')` |

### 未綁定 → V3 stub

`toggleChainLive`, `toggleBetPanel`, `toggleBoardPanel`, `roundHistory.*`, `betPanel.*`, `leaderboard.*`, `templeSingleModal.*`, `templeAudio.*`

### 綁錯 function（已修）

| 原問題 | 修復 |
|--------|------|
| MetaMask deeplink 用 `location.host` | 固定 GitHub Pages 正式 URL |
| Footer 前鏡呼叫 `app.cam` | 改 `MirrorRuntime.toggleFront` |
| `web3.refresh` 讀 Universe pool | 委派 `HeartRuntime.refreshChainData` |

---

## Heart 函式一致性（Part 4）

| 合約函式 | UI | ABI | 參數來源 | StatusBus |
|----------|----|----|----------|-----------|
| `fortuneClaim(uint256)` | `#kh-fortune` | ✅ HEART_ABI_V326 | `#kh-fortune-amount` 1–888 | ✅ |
| `heartbeatClaim()` | `#kh-heartbeat` | ✅ | 無 | ✅ |
| `igniteAndClaim()` | `#kh-ignite` | ✅ | 無 | ✅ |
| `festivalClaim(uint8)` | `#kh-festival1/2` | ✅ | id 1 / 2 | ✅ |
| `newYearCountdownClaim()` | `#kh-newyear` | ✅ | 無 | ✅ |
| `makeWish(bytes32)` | `#kh-wishbtn` | ✅ | `#kh-wish-text` keccak | ✅ |
| `vowTo(uint8,uint256)` | `#kh-vow` | ✅ | `#kh-vow-option`, `#kh-vow-amount` | ✅ |
| `lightLamp(uint256)` | `#kh-lamp` | ✅ | `#kh-lamp-days` | ✅ |

---

## Runtime 共用性（Part 8 預評）

| 神殿 | 可共用模組 | 需替換 |
|------|-----------|--------|
| **12345** | StatusRuntime, WalletRuntime, ApproveRuntime, HudRuntime, CountdownRuntime, ScreenRecorderRuntime, ActionRuntime 骨架 | Heart ABI、資產路徑、CUP_KEYS |
| **13145** | 同上 | 合約地址、主題 CSS、無聖盃邏輯 |
| **11520** | WalletRuntime, StatusRuntime, MirrorRuntime | Brain 合約 ABI |
| **16888** | WalletRuntime, StatusRuntime, LandRuntime | Universe/bet ABI、Binance kline |
| **18888** | 全骨架 | 待部署合約與面板 registry |

`KGEN_RUNTIME_CORE` V3 已模組化；各神殿只需 `CONFIG.chain` + 專屬 ABI 片段 + `index.html` 面板。
