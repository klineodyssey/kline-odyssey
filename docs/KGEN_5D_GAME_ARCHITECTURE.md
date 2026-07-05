# KGEN 5D 遊戲工程架構文件 V1.0

## 概述

KGEN 5D 遊戲工程以 **Universe Runtime V1.0** 為唯一共用執行時，連結所有神殿節點。

## 系統架構

```
K線西遊記/
├── modules/
│   ├── kgen-game-core.js          ← 共用底層（錢包、行情）
│   ├── kgen-game-core.css
│   └── universe-runtime/          ← Universe Runtime V1.0（唯一 Runtime）
│       ├── bootstrap.js           ← KGEN_UNIVERSE_RUNTIME
│       ├── physics.js, wallet.js, camera.js, ...
│       └── universe-runtime.css
├── data/
│   └── kgen-5d-world-map.json     ← 單一世界地圖資料源 V1.0
├── game/
│   └── kline-5d/
│       ├── index.html
│       └── kline-5d-game-engine.js ← 5D 遊戲引擎 V1.0
└── temples/
    ├── 12345/  ← LIVE（runtime-main 不動）
    ├── 11520/  ← V1.0 + Universe Runtime
    ...
```

## 宇宙節點清單

| 節點 ID | 名稱 | 類型 | 狀態 | 路徑 |
|---------|------|------|------|------|
| 12345 | 悟空財神殿 | Temple / 主基地 | LIVE | temples/12345/ |
| 11520 | 花果山悟空交易所 | Exchange | PROTOTYPE | temples/11520/ |
| 108000 | 火星齊天豪宅 | SeatSystem | PROTOTYPE | temples/108000/ |
| 18888 | 靈霄寶殿神明銀行 | Bank | PROTOTYPE | temples/18888/ |
| 18921 | 斬妖台 Auto LP | AutoLP | PROTOTYPE | temples/18921/ |
| 16888 | 廣寒宮 | Temple | LIVE | temples/16888/ |

## 共用核心模組

### `kgen-game-core.js`

```
KGEN_5D          — 宇宙常數（合約地址、稅率、節點表）
KGEN_StatusBus   — 狀態匯流排（DOM 狀態顯示）
KGEN_Wallet      — 錢包操作（連線、BSC 切換、ERC20 餘額）
KGEN_KlineFeed   — K 線行情（Binance API，15s 刷新）
KGEN_UniverseMap — 宇宙節點導覽
KGEN_priceDir    — 漲跌方向 helper
KGEN_drawMiniCandles — Canvas K 線繪製
```

### `kgen-game-core.css`

- CSS 變數系統（品牌色盤、間距、字型）
- HUD bar（頂部 + 底部）
- Card、KPI grid、Progress bar、Table、Button
- Mobile first — 390×844 安全

## KGEN 宇宙物理對應

| 物理概念 | 遊戲對應 |
|---------|---------|
| K 軸作功 | K 線漲跌 = 戰場推進方向 |
| vK 正負 = 多空 | 漲 → 多方推進；跌 → 空方推進 |
| M_engine > 0 | 押注 KGEN 不可為負 |
| 11520 宇宙交易所 | 峽谷中路節點 |
| 12345 財神殿 | 多方基地 |
| 16888 廣寒宮 | 空方基地 |
| 108000 火星席位 | 玩家 NFT 席位（未來） |
| 18888 銀行 | 中路資源節點 |
| 18921 斬妖台 | 中路資源節點 |

## 稅率不可變性

KGEN Token 稅率固定 0.30%（bytecode constant），不可改。
詳見 `docs/KGEN_TAX_IMMUTABILITY.md`。
18888 神明銀行與 18921 斬妖台頁面均包含完整說明。

## 技術規格

- 純 HTML / CSS / JS — 無 build 流程
- 無外部 CDN（除 Binance API 行情）
- 手機 390×844 優先
- GitHub Pages 相容

## 開發規則

1. 不改 contracts（不重新部署）
2. 不刪 12345 功能
3. 不破壞現有 GitHub Pages 結構
4. 所有新頁面包含返回導覽
5. 版本號格式：V0.x (Prototype)

## 下一步

- [ ] 補完 108000 席位可視化（500 席格子 + owner 展示）
- [ ] 11520 接入真實 PancakeSwap LP 數據
- [ ] 18888 接入 Treasury 合約 read-only 數據
- [ ] 5D 遊戲加入多玩家對戰（WebSocket）
- [ ] 所有頁面加入 WalletConnect QR
- [ ] 建立 KGEN Land NFT Prototype（11520 土地掛單）
