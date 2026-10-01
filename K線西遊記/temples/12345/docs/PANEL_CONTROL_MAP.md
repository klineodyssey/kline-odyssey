# PANEL CONTROL MAP
VERSION: V10.39.1_TEMPLE_ARCHITECTURE_MASTER

## Active entry reconciliation — 2026-10-02 candidate

The historical table below is retained as lineage, not a second active router.
See `RUNTIME_ARCHITECTURE.md` → `12345_LAYOUT_AUTHORITY_MAP` for the verified
entry load graph and Human-overridden #464/#465 visual QA result.

| Mobile entry | Existing authority / retained function |
| --- | --- |
| Heart / 錢包 | ActionRuntime toggles the same Heart console: wallet, Holy Cup, claims, wish, repay and diagnostics |
| 土地 | One LandRuntime dialog containing cadastral map, selected land and Owner / Universe / Area / Cells information |
| AI | Existing AI service toggle and dialog; no persistent service panel |
| 更多 · GA | LayoutRuntime disclosure of original universe navigation, GA, market engine, balances and all eight original footer buttons |
| MOVE / DRIVE / WARP | Existing MirrorRuntime + app shell bindings; only DOM placement changes |
| 許願 / 還願 | Existing Ritual shortcuts, unchanged explicit transaction confirmation |
| Audio / Portal | Shared Audio control and one canonical Portal destination |

LayoutRuntime retains original DOM identity/listeners and restores original
parents outside the mobile breakpoint. More relinquishes the native top layer
before opening an existing organ. Closed details never take space from Heart.

| 控制項 | 控制 panel | 規則 |
|---|---|---|
| 右上小總收合 | GA / Heart Engine / Heart Graph / Festival / Governance HUD | 不控制三聖盃 workflow |
| 三聖盃收合 | HolyCup workflow 本身 | 收合後保留「三聖盃檢查」tab |
| 右側神規 | TempleHeart / Brain 對齊規則 panel | 小面板，右下展開 |
| 左下悟空心臟 | Heart Engine panel | 不控制左上主控制台 |
| DRIVE | Warp level C 0~300 | 控制 warp-core.png 上下移動與 glow |


## V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE 補充

BUILD: 20260518-V10.40.5-MIRROR-CENTER-BULLBEAR-RESTORE

- 本版只做安全修復：正式資產回歸 `assets/heart.png`，不再要求 `wukong_heart_v10_4.png`。
- 左下 MOVE joystick 與 V9 recorder core 必須保留。
- 手機版只修排版與層級，不改合約地址、不改 wallet 流程。
- `12345.html` 與 `wallet-12345.html` 是根目錄橋接檔。
