# README — AI First (12345 Runtime Core V2.0 + 5D System V1.0)

## 5D Universe Runtime V1.0（2026-07-04）

| 項目 | 路徑 |
|------|------|
| **Universe Runtime** | `K線西遊記/modules/universe-runtime/` |
| 11520 花果山交易所 | `K線西遊記/temples/11520/index.html` |
| 18888 靈霄寶殿神明銀行 | `K線西遊記/temples/18888/index.html` |
| 18921 斬妖台 Auto LP | `K線西遊記/temples/18921/index.html` |
| K線5D峽谷推塔戰 V1.0 | `K線西遊記/game/kline-5d/` + `kline-5d-game-engine.js` |
| 共用 JS 核心 | `K線西遊記/modules/kgen-game-core.js` V1.0 |
| 世界地圖資料 | `K線西遊記/data/kgen-5d-world-map.json` V1.0 |
| Runtime 架構文件 | `docs/KGEN_UNIVERSE_RUNTIME_V1_0.md` |

**12345 神殿 `runtime-main.js` 未改動。** 僅 `index.html` 新增 5D 宇宙導覽連結。

## Start Here

1. Read `docs/RUNTIME_ARCHITECTURE.md`
2. Read `RUNTIME_GENOME.json` and `LIFE_MANIFEST.json`
3. Edit **only** `modules/runtime-main.js` for UI/runtime behavior
4. Do **not** re-enable `modules/archive/kgen-12345-runtime.legacy.js`

## Golden Rules

| Rule | Detail |
|------|--------|
| Single owner | `window.KGEN_RUNTIME_CORE` in `runtime-main.js` |
| Boot only legacy | `kgen-12345-runtime.js` = config + `app.init` patch |
| Four timers | clock, countdown, heart, status — no more |
| Bind once | `Events.bindOnce` — never rebind on interval |
| No fighting | No `MutationObserver` guards, no `seize`, no `dedupe` loops |

## Script Load Order (`index.html`)

```
kgen-land-engine.js
kgen-12345-app-shell.js
kgen-12345-web3-shell.js
kgen-12345-runtime.js
kgen-12345-mother-runtime.js
kgen-12345-divine-regeneration.js
runtime-main.js
runtime-bootstrap.js
```

## Key Globals

- `KGEN_RUNTIME_CORE` — boot + modules
- `KGEN_12345_CONFIG` — chain, assets, cup keys
- `KGEN_STATUS_BUS` — left status bar
- `KGEN_HOLYCUP_RUNTIME` — cup state
- `app` — game shell (steer, capture, guide)
- `web3` — wallet panel helpers

## Contract

Heart: `KGEN_TempleHeart_V3_2_6.sol` @ `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972`

Do not change contracts from frontend work.

## Local Dev

```bash
python3 -m http.server 8080
# http://localhost:8080/K線西遊記/temples/12345/index.html?v=V2.0
```

## Regression Checklist

- [ ] `#ver-st` shows V2.0
- [ ] Taiwan time + NY countdown `HH:MM:SS`
- [ ] HolyCup 0/3→3/3
- [ ] Heart claim buttons respond + StatusBus
- [ ] Footer 8 buttons
- [ ] Right rule toggle
- [ ] Screen record prompt / unsupported message
- [ ] Mirror front/back PNG
- [ ] Land grid select + info panel
- [ ] Console: no new Heart/UI errors
