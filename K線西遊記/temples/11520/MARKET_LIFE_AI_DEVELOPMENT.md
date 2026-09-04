# 11520 Market Life AI｜正式開發項目

## Metadata
- VERSION: 1.0.0
- REVISION: 2026-09-04.1
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
- [ ] 將上述核心接入 `world-runtime.mjs`，讓正式世界 monster instance 持有 Market Life state。
- [ ] game-5d HUD 顯示怪物市場身份、策略、資本、生命、目前維度與「怕死/撤退」狀態。

## P0｜市場對作
- [ ] 把玩家 KX/KY/KZ current positions 轉成 Market Life perception input。
- [ ] 小怪限制單一 market；大怪依 intelligence 可跨 KX/KY/KZ 多維市場。
- [ ] FOLLOW：與玩家順向。
- [ ] OPPOSE：與玩家反向對作。
- [ ] HEDGE：跨市場/同市場降低風險。
- [ ] REALLOCATE：高階怪把其他市場的風險/部位配置調到目標市場。
- [ ] REDUCE / RETREAT：資本或 vitality 危急時保命。
- [ ] 禁止固定 `player long => monster short`。
- [ ] 每次 AI 決策留 decision trace，能在客服/除錯器官解釋「為什麼這樣做」。

## P0｜戰鬥與經濟邊界
- [ ] 拆掉「攻擊鍵直接扣怪 HP」作為完整正式戰鬥的錯誤概念；保留為 nuclear-test fallback only。
- [ ] 建立 MARKET ACTION -> KGEN PnL/Risk -> Life Impact -> KAIOS Result 四層 settlement pipeline。
- [ ] 玩家只有符合正式世界事件/擊殺/任務規則才取得 KAIOS。
- [ ] 怪物不因玩家按鍵就無條件給 reward。
- [ ] Market Life 的 KGEN 帳務與玩家 KGEN 帳務完全分離。
- [ ] static GitHub Pages 僅 simulation/off-chain；未驗證真 settlement 時 fail-closed。

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
8. 所有決策可測、可追版本、可回放/解釋。
