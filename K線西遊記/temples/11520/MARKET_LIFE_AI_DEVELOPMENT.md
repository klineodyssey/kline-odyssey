# 11520 Market Life AI｜正式開發項目

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-04.2
- STATUS: ACTIVE DEVELOPMENT BACKLOG
- HUMAN_AUTHORITY: 沈英明
- CANON: `MARKET_LIFE_AI_SPEC.md`
- RULE: AI 怪物就是生命，就是市場本身。

## P0｜生命核心
- [x] Market Life identity：Life ID、species、intelligence、market dimensions、capital、vitality、memory、fear、profit drive、positions、state。
- [x] Market perception：只讀產品允許的玩家 KX/KY/KZ 部位與行情。
- [x] Autonomous decision actions：HOLD / FOLLOW / OPPOSE / HEDGE / REALLOCATE / REDUCE / RETREAT / REENTER。
- [x] Survival pressure：怕死、資本不足、生命低落時可撤退/降風險，不准固定送死。
- [x] Market result -> capital / vitality 分層，不把 KGEN balance 直接當 HP。
- [x] Growth：經驗累積後可解鎖更多 market dimensions，越聰明能跨越越多維市場。
- [x] Naihe / Mengpo lifecycle runtime skeleton：DEAD -> NAIHE -> MENGPO_RECOVERY -> REBIRTH -> ALIVE。
- [x] 正式 `world-runtime.mjs` monster instance 持有 Market Life state。
- [x] KX/KY/KZ 多軸關係 runtime：ALIGNED / OPPOSED / NEUTRAL / MIXED。
- [x] 動畫意圖 runtime：同行、對戰等待市場結算、多維張力、觀察；動畫不得自行發明勝負。
- [ ] game-5d HUD 顯示怪物市場身份、策略、資本、生命、目前維度與「怕死/撤退」狀態。
- [ ] game-5d 將多軸關係真正接到 Knight/怪物 3D AnimationMixer clips。

## P0｜市場對作
- [ ] 把玩家 KX/KY/KZ current positions 轉成 Market Life perception input。
- [ ] 把 Market Life positions 同步成 KX+/KX-/KX0、KY+/KY-/KY0、KZ+/KZ-/KZ0。
- [x] 關係判定：同軸同號 = ALIGNED（順作/同行）；同軸異號 = OPPOSED（對作/戰鬥）；任一無部位 = NEUTRAL。
- [x] MIXED 關係：允許 KX 同行、KY 對戰、KZ 中立同時存在。
- [ ] 小怪限制單一 market；大怪依 intelligence 可跨 KX/KY/KZ 多維市場。
- [ ] FOLLOW：與玩家順向並建立/調整 Market Life position。
- [ ] OPPOSE：與玩家反向建立/調整 Market Life position。
- [ ] HEDGE：跨市場/同市場降低風險。
- [ ] REALLOCATE：高階怪把其他市場的風險/部位配置調到目標市場。
- [ ] REDUCE / RETREAT：資本或 vitality 危急時保命並改變 position。
- [ ] 禁止固定 `player long => monster short`。
- [ ] 每次 AI 決策留 decision trace，能在客服/除錯器官解釋「為什麼這樣做」。

## P0｜動畫＝市場生命關係可視化
- [x] Runtime 原則：動畫只表現市場關係與已結算結果，不能用動畫本身決定輸贏。
- [x] ALIGNED：`TRAVEL_TOGETHER / COMPANION_TRAVEL`，兩生命可並肩旅行、同行。
- [x] OPPOSED：`MARKET_DUEL_WAIT_SETTLEMENT`，雙方進對戰/鎖定姿態，等待市場 settlement。
- [x] MARKET settlement 輸入後才可切 PLAYER_WIN / LIFE_WIN / DRAW 動畫結果。
- [x] MIXED：`MULTI_DIMENSION_TENSION`，不同 K 軸可以同時有同行與戰鬥關係。
- [ ] 實際 3D：雙方朝向、距離、combat idle、attack/hit、walk/side-by-side clips 接線。
- [ ] 市場尚未 settlement 前禁止播放「已擊敗/死亡」結果動畫。
- [ ] 玩家/怪物開倉、加減倉、平倉、翻向時即時刷新動畫關係。

## P0｜戰鬥與經濟邊界
- [ ] 拆掉「攻擊鍵直接扣怪 HP」作為完整正式戰鬥的錯誤概念；保留為 nuclear-test fallback only。
- [ ] 建立 MARKET ACTION -> KGEN PnL/Risk -> Life Impact -> KAIOS Result 四層 settlement pipeline。
- [ ] 玩家只有符合正式世界事件/擊殺/任務規則才取得 KAIOS。
- [ ] 怪物不因玩家按鍵就無條件給 reward。
- [ ] Market Life 的 KGEN 帳務與玩家 KGEN 帳務完全分離。
- [ ] static GitHub Pages 僅 simulation/off-chain；未驗證真 settlement 時 fail-closed。

## P0｜108 原子運算引擎接口
- [ ] `CANONICAL_108_ATOMS_REQUIRED`：正式 108 原子名稱、輸入、公式、權重、8 軌域聚合與版本證據尚未在本段工程取得，不得杜撰。
- [ ] 建立 `atomic-108-adapter` fail-closed interface；只有 canonical 108 source 可餵入 Market Life strategy/settlement。
- [ ] 108 engine output 與 KX/KY/KZ relation、Market Life decision、settlement 保持可追蹤 lineage。
- [ ] 在 canonical 108 未接入前，產品只能標示 simulation/test signal，不得宣稱 108 正式決勝。

## P1｜牛魔王級跨維 AI
- [ ] Bull Demon King class：多 market perception。
- [ ] 跨 KX/KY/KZ exposure map。
- [ ] 可將其他市場 risk budget / position allocation 調度到玩家主要曝險市場。
- [ ] 能根據 correlation / PnL / survival 選擇同向加成、反向攻擊、對沖或撤退。
- [ ] intelligence / experience / capital 越高，可操作 market dimensions 越多。
- [ ] 大怪成長不是只把 3D 模型放大；需有 state/evidence。

## P1｜奈何橋／孟婆湯
- [ ] 死亡事件寫入 life-event evidence。
- [ ] DEAD -> NAIHE gate。
- [ ] NAIHE -> MENGPO_RECOVERY gate。
- [ ] 孟婆湯恢復規則：HP/vitality、capital、memory 各自規範。
- [ ] 重生後保留/清除哪些記憶需獨立 human decision；未定義前不可自行清空全部記憶。
- [ ] 8 秒 respawn 僅核爆測試參數，不能冒充完整生命循環。

## P1｜可交易／可飼養生命
- [ ] TAMABLE / TRADABLE LIFE 類型。
- [ ] 魚、牛、鴨等 Life ID 與 species schema。
- [ ] 玩家可在正式規則下取得並帶回飼養；生命不得降格成普通 inventory item。
- [ ] 照護、成長、繁殖、死亡、交易、所有權另立規格。
- [ ] 未驗證真資產 settlement 前不得送鏈或做不可逆所有權轉移。

## P1｜UI / 世界產品化
- [ ] 怪物上方顯示 market/life badge，而不是只有紅色幾何體。
- [ ] 小怪與大怪 3D 資產 manifest。
- [ ] 怪物策略狀態可視化：順作、反作、對沖、撤退、重配。
- [ ] 怪物資本、生命、market dimensions 放入「生命」器官，不擋主 3D 畫面。
- [ ] AI 客服可解釋怪物最近 decision trace。
- [ ] 世界聊天後端另接；目前 local chat 不冒充多人。

## P2｜資料、學習與長期生命
- [ ] deterministic simulation seed。
- [ ] memory persistence schema。
- [ ] experience / intelligence growth rules。
- [ ] market-dimension unlock audit trail。
- [ ] life save/load/replay。
- [ ] 多生命同時市場互動。
- [ ] 玩家、Market Life、tamable Life 的文明關係與社會系統。

## Acceptance
產品不得稱 Market Life AI 完成，除非至少做到：
1. monster instance 具有獨立 Market Life identity；
2. 可以感知允許的玩家市場部位；
3. 至少 FOLLOW / OPPOSE / RETREAT 三種自主決策能實際改變 state；
4. AI 可保命，不是固定送死；
5. KGEN capital、Life vitality、KAIOS reward 分離；
6. 高 intelligence life 能解鎖多市場維度；
7. 死亡進生命循環，不把 8 秒 timer 當完整孟婆湯；
8. KX/KY/KZ 同向/反向關係能驅動角色動畫意圖，但動畫不能決定市場輸贏；
9. 所有決策可測、可追版本、可回放/解釋；
10. 108 原子正式資料缺失時 fail-closed，不得自行偽造 canonical engine。

## 2026-10-06 · LivingMarketZone archaeological design and local prototype

STATUS: LOCAL_LOGIC_PROTOTYPE / INTEGRATION_NOT_COMPLETE
TASK_ID: K11520-LIVING-MARKET-ZONE-20261006
SOURCE: Human Living 3D Market World request, 2026-10-06 08:09 UTC,
`Sentinel_f1d4bab65fe081919548aa892aee510c`
BASE_MAIN: `e26f3a76ef0be7f43058225f46def3fbe123371e`
BRANCH: `codex/living-market-zone-prototype-20261006`
AUTHOR: dot, temporary Human-authorized engineering maintainer; no new Worker,
Life, employee, registry admission or financial authority
REVIEW: Root review and subsequent integration acceptance remain required.

### Boot / sources / precedence

Boot V1.4 was read first (Git blob
`4286d1aede181f45eb274196a6799ac18ced42ec`), then formal Boot CURRENT
(`b85c9a34a81810e0063480092025a9ef02d456cc`), Company policies/registry/work,
CURRENT Physics (`6eaa6d14d19f4f6d06d9172f1bd1a5cd55b35fcc`), Signed Math
(`05f1e7cad7247bedee5e7930a44c06f949668059`), Universe Map
(`0f97fc7e723fc97cd8366a10f0c9eb7892df4605`), Neural indexes and target owners.
These identifiers are Git blob SHA-1 values, not SHA-256 integrity claims.

The Boot whitepaper path has a case mismatch: the existing file is
`docs/Whitepaper/PRIMEFORGE_MULTIVERSE_WHITEPAPER_V2_0_GENESIS.md`.
Neural indexes retain historical V1.6 references; they do not override the
formal CURRENT gateway. The old UFO text's angle-based long/short and the
Map's legacy Z-KZ PnL mapping are superseded by the current domain rules.
No protected source, Boot, Physics, Signed Math or Universe Map was edited.

Read target sources include `MARKET_LIFE_AI_SPEC.md`,
`MARKET_LIFE_SOURCE_INTERFACE.md`, `LIVING_WORLD_ECOSYSTEM_SPEC.md`,
`KGEN_TRADING_SPEC.md`, `docs/K11520_PLAYER_LIFE.md`, local/root `AGENTS.md`,
the target manifest/genome/version/handoff, existing navigation and source code.
The current Human order governs the gameplay priority:

`OBSERVE -> ANALYZE -> CHOOSE -> FOLLOW -> NAVIGATE -> LEARN / TRADE`

Combat is secondary. Observation and Follow do not authorize trading.
P0 simulation order repair, Player Life P1 and wallet M2 remain higher-priority
work. Their worktrees and runtime owners were not modified or imported.

### Existing owner map and confirmed gaps

| Concern | Reused owner | Exact-main finding / integration constraint |
|---|---|---|
| Market source | `runtime/public-market-quotes.mjs`, `world-runtime.mjs` | Existing accepted reference batches and host `receivedAt`; never an execution Oracle. |
| Life identity / decisions / memory | `runtime/market-life-runtime.mjs` | Existing deterministic local momentum/countertrend observer, 60-second horizon and growth; extended here rather than replaced. |
| Source lifecycle / NPC slots | `runtime/market-life-source-runtime.mjs`, `world-runtime.mjs` | Existing SPAWN/UPDATE/DESPAWN and hidden slots; preserve source class/reason and stable Life ID. |
| Scene / instancing / selection | `runtime/game-5d-main.mjs`, `life-visual-runtime.mjs` | Flat ground and individually created trees exist. No terrain/instancing rewrite in this slice. |
| Home | `runtime/player-life-runtime.mjs`, `player-life-ui.mjs`, `game-5d-main.mjs` | Use the active player's actual `loadHomePlot()` and existing Home mesh. Generic `HOME-11520-001` is a separate public building, not the player's home. |
| ATM | `world-runtime.mjs` `WORLD_OBJECTS`, existing ATM/wallet organs | Reuse `ATM-11520-001`; no new bank, custody, wallet or transfer service. |
| Inspect / Follow | Existing canonical sheet and `appendMarketLifeDetails` in `game-5d-main.mjs` | Current Follow chip explicitly says `controlsPlayer:false`; it selects an observation subject but does not follow a moving entity. |
| Navigation / collision | `xyz-map-navigation-runtime.mjs`, `xyz-input-authority-runtime.mjs`, `game-5d-main.moveManual` | Current main player motion is fixed-step. Shared-C / moving-target Navigator work is a dependency, not imported here. |
| Captured/owned life | `wild-ecology-source-runtime.mjs`, `living-world-inventory-runtime.mjs`, backpack | Existing ownership/capture semantics remain untouched. New NPC interaction fixtures cannot include owned life or cargo. |
| Trading / financial safety | Existing order, margin, wallet and source-provenance organs | No calls or modifications; simulated score is neither KGEN PnL nor wallet balance. |
| Text / voice entry | Existing concierge / speech owners and navigation service | Later text/voice adapters must submit the same reviewed navigation request; voice cannot become a separate movement loop. |

All 54 open PR changed-file lists were checked before implementation. No open
PR changed `market-life-runtime.mjs` or this development document.
`tests/11520-runtime.test.mjs` overlaps #503 (HOLD), #506 and #508. Their exact
patches do not alter the training functions. This candidate appends tests and
preserves the complete original test file bytes; no pending PR was imported.
Fresh overlap/source reconciliation is required before later publication.

### Minimal single-zone integration design

1. Select one bounded flower-fruit market area in the existing local XYZ world.
   Reuse the actual Player Home and ATM, existing paths/collision and world
   bounds. Do not redefine global K, territory, LandNFT ownership or the map.
2. Project terrain, grass and trees through original low-poly geometry and
   shared materials. Instance repeated grass/tree geometry in bounded sectors;
   keep selectable Life ID to instance mappings and existing ecology ownership.
   Decorative instance counts must not silently mint Life identities or assets.
3. Admit three local market lives plus one Boss through an explicit local
   WORLD_EVENT or WILD_ECOLOGY seed with stable source-event IDs and spawn reason.
   This is an opt-in local zone fixture, not fabricated Exchange Brain demand,
   Digital Ant dispatch, formal Life birth or always-on hardcoded market actors.
   Existing STONE_APE, FIRE_WISP and BULL_DEMON species suffice for the prototype.
4. Profiles provide momentum, countertrend, cautious observation and adaptive
   Boss behavior. All consume the same accepted observation seam. Market choice,
   LONG/SHORT/WAIT, confidence, goal and requested speed factor follow observations
   and recorded outcomes; neutral/stale states request zero motion rather than
   a new fixed patrol. No new exact-main movement integration is claimed.
5. Tap a Life to open the existing inspect sheet. Make Follow its primary action,
   with observe/analyze details, freshness, audit counts and cancel nearby.
   Actual Follow must pass a stable entity ID to the sole navigation owner,
   re-resolve its latest XYZ while moving, and stop on despawn/death, manual
   control, target switch, player switch or explicit cancel. Both maps and 3D
   taps must share that service. No second follow timer or player-position writer.
6. AI character text and optional voice expose the same request and status.
   Text remains usable when microphone permission, speech recognition, audio,
   network or model service is unavailable. No LLM may directly write XYZ/C,
   falsify a navigation completion, or place a trade from a Follow request.

The new decision projection reports `NAVIGATION_DEPENDENCY_REQUIRED`,
`advisoryOnly:true`, `controlsPlayer:false` and `movesCoordinates:false`.
Its dimensionless requested speed factor is not C, km/s, fuel or a capability.
The requested shared rate remains `abs(C) * 0.001 K/s`, not physical light
speed. Rate calculation and actual displacement must be implemented by the
reviewed shared owner; this prototype does not transplant the unpublished
Navigator candidate or create a parallel movement authority. Existing neutral
patrol and constant-step movement therefore remain known integration gaps.

Vehicle eligibility, thresholds, ownership, fuel and attainable motion must
come from Canon and valid capability evidence. This prototype invents no
numeric vehicle thresholds and unlocks no vehicle.

### Implemented observer and auditable performance contract

`observeTrainingMarket` is the existing observer; its new validation applies
when that existing function is called. New zone configuration, interaction and
decision-projection functions have no live scene callers in this slice.
This changes existing intention, confidence, scoring and growth behavior when
loaded by `world-runtime.mjs`; the whole patch is not inert. Affected real-browser
regressions remain a release gate even without adding a scene UI in this slice.

- Existing serialized growth records stay unchanged and backward compatible.
  New prediction traces and calibration are session-only, never restored as
  invented evidence after reload. Restored growth is explicitly separated from
  current-session counts and confidence.
- A valid batch requires safe timestamps, allowed axes, finite positive prices,
  unique market rows and every market this Life observes. Symbol/axis identity
  must match the existing pure `getRealTradingBinding` owner in
  `runtime/real-trading-market-binding.mjs`; no mapping is duplicated here.
  Current `world-runtime.mjs` `KSPACE_REFERENCE` / `kMarketSnapshot` already
  conform, but direct public observer calls also fail closed for wrong pairs.
  This lookup grants no trading eligibility, chain, wallet or execution access.
  Malformed, missing,
  future or expired data is not LIVE. Last-good quotes are retained as evidence,
  but quarantined from subsequent signals until fresh warmup completes.
- The observer uses the established host `receivedAt` semantics. It reports
  `timeBasis:HOST_RECEIVED_AT`, `sourceTimestamp:null`, and the source label.
  This is not authenticated exchange time, an Oracle, historical feed quality
  certification or proof that the caller supplied every real market tick.
- Source or axis-binding changes, observation gaps, conflicting/reversed
  timestamps and unavailable states invalidate pending predictions. No invalid
  horizon becomes a win. Identical replay cannot issue or settle twice.
- Issuance freezes Life/prediction IDs, source, market/axis, direction, entry,
  issue time, horizon, confidence sample count and policy generation. Settlement
  uses the first accepted complete observation at or after the 60-second
  horizon. A delayed observation records actual delay; no deadline price is
  interpolated or invented. The source must remain continuous within 15 seconds.
- Outcome history distinguishes CORRECT, WRONG, FLAT and INVALIDATED.
  Streak resets on wrong/flat. Local score is +1/-1/0 points, peak and drawdown
  are in those same points. It is not trading return, PnL, a token or a reward.
- Confidence is prior current-session non-flat empirical accuracy, not an
  asserted forecast probability. The Brier diagnostic and five confidence bins
  use the frozen issuance value with explicit sample counts. Flat outcomes and
  predictions with no prior measured confidence are excluded from calibration.
- The audit is bounded at 128 events. Monotonic event sequence, dropped count
  and `completeSessionWindow:false` expose truncation. Local records are
  untrusted and mutable through developer tools; they are not tamperproof proof.
- The Boss changes momentum/countertrend policy after two settled consecutive
  errors and records the causal prediction ID. Evidence stage is a local
  teaching projection of settled samples, not GA600, profit or vehicle power.
  `fullGA600:NOT_INTEGRATED` remains explicit.

### Game-only interactions and safety boundary

`configureLivingMarketLife` explicitly admits only fresh, unowned local monster
fixtures of existing species. Player-owned life, source-managed cargo lives,
ordinary animals/plants and Digital Ant cannot be converted into game loot.
Admission requires the host's original world-entity wrapper referencing the
exact Life, matching Life/source-event IDs, explicit local-game fixture scope,
`sourceManaged:false` and no mission, cargo or player/land ownership. Both
`sourceType` and existing `sourceClass` aliases, including wrapper metadata,
must agree. A module-local weak reference retains that host context without
copying an ownership registry or creating cycles in serialized Life snapshots.
Every interaction rechecks the same current wrapper. Serialized/cloned lives
are not admitted; a future preview must validate host context and construct
fresh isolated fixtures, rather than treating a clone as approved ownership.

`interactLivingMarketLives` offers FOLLOW, ALLY, COMPETE, FLEE and ABSORB inside
that same Life owner. A pair/source-event-bound, action/expiry/unit-limited
local game capability plus matching revisions and monotonic actor sequence is
required. The capability binds that exact pair of revisions and sequence, so
its limits cover one transition and cannot be reused with a new sequence.
Non-transfer actions change relation evidence only. ABSORB also
requires the target's explicit game-pool capability, sufficient abstract integer
units and overflow-safe accounting; the pair's mass/energy units are conserved.
This never changes positions, financial capital, HP, source cargo, ownership,
Player Life XP, backpack rewards, orders, wallet balances or market prices.
This is a host-permitted game-unit transfer primitive, not autonomous predator
AI. High-level-versus-weaker-prey eligibility, autonomous choice to absorb and
actual NPC interaction wiring are NOT_IMPLEMENTED. No level threshold is
invented, and an ABSORB conservation test does not complete the predator mechanic.

These capabilities are reviewed local-game-rule inputs, not authenticated
economic permissions or protection against a user modifying their own browser.
They do not persist across reload, mint actual tokens, authorize a takeover or
replace the existing capture/ownership service. Boss field behavior may affect
only later simulated NPC relations; it must never control real prices, liquidity,
orders, wallet assets, reserve pools or external market participants.

### Rendering budgets and visual gates: proposed, not measured

No third-party asset was downloaded. Original procedural geometry is the first
route. Any later asset needs exact-file license verification; neither a pack
name nor an old blanket CC0 statement is sufficient redistribution evidence.

| Proposed profile | LOW | MED | HIGH |
|---|---:|---:|---:|
| DPR cap | 1.0 | 1.25 | 1.5 |
| Total draw-call target | 60 | 100 | 150 |
| Visible triangle target | 80k | 160k | 300k |
| Nearby animated people ceiling | 8 | 16 | 24 |
| Pooled weather particles | 128 | 384 | 768 |
| Simultaneous audio voices | 4 | 8 | 12 |
| Shadows | blob only | one 512² map | one 1024² map |

These are starting budgets for review, not measured performance or required
population. The four requested market lives remain the only new active NPCs
for the initial zone. Prefer shared materials, bounded instance sectors,
frustum/distance culling, three LOD bands with hysteresis, near-only simulation,
pooled effects and GPU resource disposal. Start conservatively and downgrade
on sustained slow frames without removing the meaning of market signals.
Profile selection and terrain/instancing are a later existing-renderer change.

World-first UI uses the existing compact sheet; no extra always-on analytics
wall covers the world. Release requires 390x844 and 844x390 real-browser
screenshots, direct visual inspection, reachable controls and measured frame,
draw-call, triangle and memory evidence on the exact integrated source.

### Local validation / unresolved completion gates

The three-file local scope is this document, `runtime/market-life-runtime.mjs`
and appended `tests/11520-runtime.test.mjs`. No new runtime, bootstrap, loop,
file owner, scene entry, protected policy or deployment was created.
The runtime's 1.2.0 metadata is a Market Life component revision only. No game
release version, manifest, public version badge or deployment version is changed.

- Local focused CPU check at root binding-review freeze: 99/99 tests, including
  69 unchanged tests and 30 new LivingMarket cases.
- FUNCTIONAL_QA: LOCAL_LOGIC_PASS only; live zone / moving Follow not verified.
- VISUAL_QA: NOT_RUN, as requested before root review; the Living Zone is
  NOT_COMPLETE and NOT_READY_FOR_HUMAN_PLAYTEST.
- Exact-head CI, heavy browser, push, PR, merge and deployment: NOT_PERFORMED.
- Terrain/instancing, actual Home/ATM integration, four scene lives, moving-target
  Follow, shared-C displacement, text/voice navigation and mobile profiling:
  DEPENDENCIES / NOT_INTEGRATED.
- No profit promise, investment-performance claim, full GA600 claim, external
  account, paid asset, wallet identity or actual financial action is included.

The next step is root source review, then a separately scoped integration in
existing world/renderer/navigation owners after higher-priority work stabilizes.
Unit PASS does not close the full LivingMarketZone request.
