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
