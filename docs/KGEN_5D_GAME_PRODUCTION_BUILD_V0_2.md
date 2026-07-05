# KGEN 5D Game Production Build V0.2

**Build:** PRODUCTION V0.2  
**Date:** 2026-07-05  
**Author:** PrimeForge / 樂天帝 ⌖

## 概述

KGEN 5D Universe Game Production Build V0.2 是 KLINE Odyssey 的大型前端遊戲成品施工，涵蓋：

- K線5D峽谷推塔戰完整版
- 6 個升級神殿（11520 / 18888 / 18921 / 108000 + 既有 12345 / 16888）
- 9 個新神殿（8888 / 8895 / 20888 / 21319 / 21520 / 21666 / 21888 / 22188 / 23333）
- 共用 `universe-runtime` 模組
- Portal V3.0 全入口整合

**本版本未修改：** contracts · 12345 wallet/bridge/Heart · Boot V1.4 · Runtime CURRENT

## 檔案清單

### 共用核心

| 路徑 | 用途 |
|------|------|
| `K線西遊記/modules/kgen-game-core.js` | V0.2 共用 JS（16 節點、Demo 錢包、Depth） |
| `K線西遊記/modules/kgen-game-core.css` | V0.2 設計系統（器官分解、手機 HUD） |
| `K線西遊記/modules/universe-runtime/organ-economy.js` | Organ 經濟 / 保證金 / 分解 |
| `K線西遊記/modules/universe-runtime/temple-hub.js` | 神殿 HUD / NPC / 任務 |
| `K線西遊記/modules/universe-runtime/temple-shell.js` | 關卡神殿 bootstrap |
| `K線西遊記/modules/universe-runtime/kline-5d-engine.js` | 5D 遊戲引擎 |
| `K線西遊記/data/kgen-5d-world-map.json` | 世界地圖 V0.2 |

### 遊戲

| 路徑 | 功能 |
|------|------|
| `K線西遊記/game/kline-5d/index.html` | 5D 完整版：峽谷、塔、波、Boss、技能、裝備、任務、Warp、手機操作 |

### 神殿

| ID | 路徑 | 角色 |
|----|------|------|
| 11520 | `temples/11520/` | Organ Exchange |
| 18888 | `temples/18888/` | Divine Bank |
| 18921 | `temples/18921/` | Auto LP Forge |
| 108000 | `temples/108000/` | Mars Seats + 5D 入口 |
| 8888 | `temples/8888/` | Underground Bank |
| 8895 | `temples/8895/` | 八戒雲棧洞 |
| 20888 | `temples/20888/` | 火焰山風險場 |
| 21319–23333 | `temples/{id}/` | 宇宙關卡節點 |

## 核心概念

- **App = Organism**（完整生命體應用）
- **Module = Organ**（可拆卸器官模組）
- **11520 = Organ Exchange**（器官/App 上架交易所）
- **18888 = Divine Bank**（神明銀行 / 清算）
- **18921 = Auto LP Forge**（斬妖台流動性鍛造）
- **8888 = Underground Bank**（地下錢莊）
- **保證金不足 = Organ Decomposition**（器官分解動畫 → 回流 11520）

## 怎麼玩（Demo）

1. 從 Portal 進入任意神殿或 5D Game
2. 所有頁面為 **Demo 模式**，模擬 KGEN/BNB/USDT，不接真合約
3. 5D Game：做多/做空、技能、佔領節點、打 Boss
4. 11520：模擬 Swap、Order Book、Depth、Organ 上架
5. 18888/8888/8895：抵押借貸，觸發「保證金不足」看分解動畫
6. 18921：投入 KGEN/BNB 鍛造 LP，斬妖淨化
7. 20888：模擬爆倉清算
8. 關卡節點：點「開始試煉」完成任務

## 未來接鏈上

| 功能 | 接鏈方式 |
|------|----------|
| 11520 Swap | PancakeSwap Router read + Wallet tx |
| 18888 Treasury | `KGEN_GalacticBank` / Treasury read-only |
| 18921 Auto LP | `ZhanyaoTaxSplitter` events |
| 108000 Seats | 已有 `MarsSeats` mint/claim |
| Organ 上架 | Brain Exchange + NFT metadata |
| 5D Game | KGEN staking + WebSocket 多人 |

## 驗收要點

- 全部 URL 可 HTTP 200 開啟
- 390×844 無右側超出（`overflow-x:hidden` + `max-width:100vw`）
- 未改 contracts / 12345 wallet / Boot / Runtime CURRENT
