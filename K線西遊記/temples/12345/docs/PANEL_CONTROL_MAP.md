# PANEL CONTROL MAP
VERSION: V10.39.1_TEMPLE_ARCHITECTURE_MASTER

## Active entry reconciliation — 2026-10-02 candidate

### Original-function recovery audit — 2026-10-02 (Draft, no merge)

Source baseline: `e1de5dcf62d05b274f702f7edd5cc3e81ef497ad`.
History `159c4bc2` already contains the broken outer Ritual bridge; #466
relocated the original dock but did not introduce this missing global.
Real Chromium reproduction: `window.ActionRuntime === undefined`, while
`KGEN_RUNTIME_CORE.modules.ActionRuntime` exists. Outer Repay displays
`還願 Coming Soon` instead of opening the existing vow form. Outer Wish has
a duplicate textarea/submit overlay, bypassing the visible canonical form.

Canonical route: outer shortcut -> existing ActionRuntime -> same Heart card
(`wish` / `vow`) -> explicit `kh-wishbtn` / `kh-vow` -> HeartRuntime.sendHeart
-> existing WalletRuntime. No shortcut may submit a transaction. Keep original
amount, option, hash, allowance and wallet confirmation semantics. Scroll only
the Heart console, not its fixed ancestors/document. PanelOverlay previously
removed original inset styles without restoring them; preserve the exact inline
position through repeated disclosure cycles. LayoutRuntime remains placement
authority; no Heart/MOVE/DRIVE/WARP geometry or CSS redesign is authorized.

### K16888 original architecture / read-only comparison

`K線西遊記/temples/16888/index.html` is the original active monolithic runtime
(OG Engine V3.7.12), not the 12345 module graph. Its inline CSS/media queries
own portrait placement; `app` owns world/navigation/Warp and original audio;
`web3` and later inline compatibility wrappers own wallet; inline panel toggle
functions own panel disclosure. `#universe-nav` / `#return-to-11520` plus the
wallet-continuity bridge own the existing return control.

Before Portal baseline: `a6e65af31b7070425d44cdf08862ab26e26e0a9f`.
Portal commit `ae9fc085` changed 12 index lines: shared-audio flag/guards,
existing return destination to canonical Portal, removed duplicate homepage
link, and shared bridge import. Original gameplay, Warp, wallet and inline
portrait CSS are unchanged. No 12345 composition engine is loaded by 16888.

Intentional safety changes: disable legacy playlist/autoplay/commercial music,
reuse one AudioContext and first-party synthesis, one canonical return URL.
Presentation regression against Human preservation policy: shared
`assets/kaios-world-audio.mjs` reparents `.nav-music` out of `#universe-nav`,
renames it, hides `#music-panel` and `.nav-audio`, replaces the old audio controls
and resizes/repositions the return control. Original `app.openMusic`,
musicPlay/Pause/Stop/Prev/Next and volume no longer present the original console.
This is a verified behavior change, not evidence that Warp/wallet broke.

Disposition: KEEP_ORIGINAL / audit only. Do not edit 16888 or the shared bridge
in this recovery PR. Human confirmation is required before a minimal
presentation restoration; commercial playlist playback must stay disabled.
16888 release QA is portrait (390 primary; 360/412/432/480 compatibility).
Landscape gameplay composition is explicitly not a release requirement.

Recovery QA scope: real Chromium 360/390/412/432/480 x 844 and 844x390,
three Wish/Repay cycles, original form hash/option/amount dispatch, actual
disconnected Wallet gate, original secondary-panel insets, Land/AI/More/
Festival and MOVE/DRIVE/WARP regressions. Final transaction boundary is stubbed
only for dispatch tests: this is NOT on-chain transaction or signed-wallet QA.
Known pre-existing limitation: WalletConnect 2.12.2 CDN UMD emits
`ReferenceError: process is not defined`; QR-wallet connection is not certified
by this repair. No wallet library or Mainnet execution is changed here.

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
