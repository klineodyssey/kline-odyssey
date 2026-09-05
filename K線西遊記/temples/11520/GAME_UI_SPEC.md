# 11520 花果山 5D K 線西遊記｜遊戲畫面與器官施工規格

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-03.2
- STATUS: ACTIVE / SOURCE_OF_TRUTH
- HUMAN_AUTHORITY: 沈英明
- FORMAL_RULE: 正式檔名固定不帶版本；版本與 revision 寫在文件內。
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 正式入口與正典
- PRODUCT_ID: `KGEN_11520_UNIVERSAL_EXCHANGE`
- PLACE_ID: `11520`
- FORMAL_ENTRYPOINT: `index.html`
- PLAYABLE_5D_ROUTE: `game-5d.html`
- GAMEPLAY_RUNTIME: `runtime/world-runtime.mjs`
- TRADING_CANON: `KGEN_TRADING_SPEC.md`
- VEHICLE_C_CANON: `VEHICLE_C_SPEC.md`
- HANDOFF: `JIEYAO_HANDOFF_CURRENT.md`

程式與正典衝突時，程式判定為 regression；不得偷偷修改正典來配合錯誤程式。

## 2. 生命／器官施工法
- 後續施工不得靜默刪除已存在器官。
- 角色、怪物、建築、載具、導航、地圖、遙測、記憶、眼睛等持久功能可作為 Life/organ 管理。
- 每個 runtime organ 應有 identity、input、output、state、persistence、error/failure state。
- 移除功能必須有明確 deprecation/archival evidence 與 CHANGELOG。

## 3. 5D 世界與角色控制
- 中央畫面是真正第三人稱 3D 世界，不是平面地圖或 wallpaper。
- XZ = 地面移動；Y = 高度。
- 左下搖桿採已存在的 MOBA 式雙區控制：**內圈控制 XZ 移動；外圈沿圓周拖曳控制角色 heading/旋轉**。
- 左搖桿角色旋轉不得強迫鏡頭同步旋轉。
- 右手在 3D 世界拖曳 = 第三人稱鏡頭 orbit/rotation。
- Pointer/touch cancel、resize/orientation change 必須回復安全輸入狀態。
- 普通步行不得因 C=0 而被鎖死；玩家失去載具仍可走路取經。
- C 的曲速／載具能力依 `VEHICLE_C_SPEC.md`，不得拿 C 取代 XZ 普通步行。

## 4. 3D 人物與資源管線
- 必須保留可替換 GLB/GLTF skeleton-ready 人物管線。
- 歷史已存在 KayKit Adventurers CC0 Knight GLB + `GLTFLoader` + `AnimationMixer` 路線；不得無理由永久降級成 primitive/capsule 人物。
- 至少支援 idle / walk / run / attack；hit/death 依資產可用動畫或正式 fallback state 補足。
- GLB 載入失敗時才允許 primitive fallback，且 UI/log 必須可辨識 fallback 狀態。
- 樹、花草、岩石、建築、怪物同樣應逐步進入有 license/provenance 的正式 3D 資源 manifest。

## 5. KX / KY / KZ 三軸
- KX、KY、KZ 是三個獨立 K-market axes，不是 XYZ 移動軸。
- 每軸保留自己的 market、side、lots、C、order/position state。
- 調整一軸不得洗掉其他兩軸設定。
- 下單幾口 = 幾 KGEN 本金／保證金；完整公式以 `KGEN_TRADING_SPEC.md` 為唯一正典。
- C 是損益威力／曲速倍率；不得再使用 `lots / leverage` 或 `lots / C` 計算本金。
- 下單流程永遠是 adjust -> preview -> confirm/cancel -> submit；交易劍只展開交易控制，不能直接成交。

## 6. KGEN / KAIOS / KUFO 分離
- KX/KY/KZ 交易使用 KGEN。
- XYZ 打怪、生活、任務等使用 KAIOS。
- KUFO 維持獨立長效能源／燃料類。
- KGEN wallet balance 不等於全部 margin；至少分 Wallet/Free/Locked Principal/Reserved/UPnL/RPnL。
- verified chain balance 與 local/simulation accounting 必須清楚分開。

## 7. 固定功能器官
桌面左側或手機可達的快捷器官不得消失：
1. 主城世界(5D)
2. K 場交易
3. 持倉
4. 委託掛單
5. 歷史成交
6. 資產總覽
7. 交易紀錄/統計
8. 市場資訊
9. 背包/道具
10. 角色狀態
11. 世界地圖
12. ATM/換鈔
13. 系統設定
14. AI/幫助／客服
15. 下單確認窗
16. 右下收合快捷器官列
17. 左側完整器官列（desktop）
18. XZ 內圈移動／外圈旋轉、Y、高 C/載具、攻擊、技能、閃避、平倉、下單控制

每一器官必須可開/關，有實際 handler/runtime/state；不得以 decorative button 或 `alert()` 冒充完成。

## 8. 下單確認與語音客服
確認窗至少顯示：axis、market、side、lots、C、本金 KGEN、每點損益、反向歸零距離/風險、reference price、market-data age、Free KGEN、Cancel、Confirm。

- Preview/Cancel 不得改 balance/position/order。
- 語音可播報 Preview、Confirm、Filled、Rejected、Liquidated、Closed。
- 語音不能代替使用者 Confirm 或 wallet signature。
- AI/客服必須能詳細說明「為什麼能/不能下單」、本金、C、每點損益、錢包狀態、simulation/real-chain boundary。
- 必須有文字說明書 fallback。

## 9. 真錢包／真交易邊界
- 可連線 EVM wallet、查 chain/account/native balance/ERC-20 `balanceOf`。
- 真實 settlement 下單只有在正式 contract address + ABI + chain + custody + receipt 全部驗證後才能啟用。
- 未驗證前必須 fail-closed 或清楚標示 simulation/off-chain；不得把 local FILLED 冒充真成交。
- GitHub Pages 是 static frontend，不是 persistent multiplayer/trading backend。

## 10. 載具與超光速
- 一般角色／一般物體不得任意超光速。
- 超光速需要有對應能力的變形載具／飛碟等；詳細依 `VEHICLE_C_SPEC.md`。
- 載具器官可包含導航、地圖、音響/通訊、遙測、記憶、眼睛、曲速、結構等。
- 器官失能應只影響對應能力；載具解體不刪玩家生命，玩家返回普通步行模式。
- 額外 `100×` 燃料/能力儲備門檻目前 `UNRESOLVED`，不得自行寫死。

## 11. 世界 runtime
- 世界邊界、HOME/ATM/SHOP/其他建築碰撞必須由 runtime 判定。
- 怪物具有 Life ID、HP、aggro、追擊、攻擊距離、cooldown、死亡與 deterministic respawn。
- 玩家只有真正擊殺怪物才能取得對應 KAIOS reward；UI animation 不等於 settlement/reward。
- Google/OSM 只作地址/導航錨點，不是戰鬥 geometry。

## 12. Regression acceptance
以下任何一項出現即不可稱完成：
- 3D Knight/GLB 動畫管線被無故刪除，只剩 primitive；
- 左下外圈角色旋轉被刪除；
- 0C 導致普通步行完全不能動；
- KX/KY/KZ 被合併成共用狀態；
- 使用 `margin = lots / leverage` 或 `margin = lots / C`；
- KGEN wallet 全額被標成 margin；
- 任一正式器官變 decorative/alert-only；
- 下單可繞過確認；
- local simulation 被稱為鏈上真成交；
- 載具失效把玩家生命一起刪除；
- GAME_UI_SPEC、KGEN_TRADING_SPEC、VEHICLE_C_SPEC、CHANGELOG 與 runtime 互相矛盾。

## 13. Change control
行為規格變更必須先更新正典並記錄 Human Decision，再修改 runtime/tests。錯誤程式不得成為修改正典的理由。