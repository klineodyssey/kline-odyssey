# README — AI First (12345 Runtime Core V2.0)

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
