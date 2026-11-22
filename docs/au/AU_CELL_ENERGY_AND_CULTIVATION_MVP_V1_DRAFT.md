# KAIOS AU｜真實算力觀測與離線修煉 R0 原型

STATUS: DRAFT / PURE SIMULATION / NOT CONNECTED TO LIVE PLAYER LOGIN OR WALLET

設計發起：樂天帝｜KAIOS AU。程式起草：觀衍 Guanyan。TEXT_SIGNATURE=Guanyan; CRYPTOGRAPHIC_SIGNATURE=NOT_VERIFIED。

## 先收集，後定價

每個 AI 細胞工作艙提供 runId/cellId/poolId、WAKE_AT_UTC、SLEEP_AT_UTC、兩次 5H/7D 官方額度百分比、週期 reset_at、證據來源與 checkpoint URL。來源沒有提供則 null。DOT 接收時依 runId 去重與彙整活動秒數。只有同一額度池、相同 reset 週期且數值沒有反向增加時，才顯示共享池百分點變化；共享池可能同時有多細胞，因此個體精確耗用永遠標 NOT_ATTRIBUTABLE。百分比取整，不可當成精確 token/美元/焦耳/KUFO。

## 遊戲：能源與獎勵帳分離

HP=角色生命狀態，另有 KUFO 遊戲仙丹儲備、KSHIP 衰變產物、XP 修煉經驗、KGEN/KAIOS 遊戲經濟。當前不授權因登出/登入就產生真 KGEN/KAIOS 或鏈上轉帳。玩家離線的 XP 是遊戲平衡參數，與 AI 額度消耗無必然兌換。KUFO 自然衰變按 Physics CURRENT 半衰期，衰變 1 KUFO 在質量尺度上最多對應 1000 KSHIP；尚未確認可用燃料/效率與實際衰變帳務時不能 mint。蟠桃園肥料須經可回收質量機制，現階段設為 0，防重複計質。

## W=F×d 的單位

物理作功 W=F d cos(theta)，力 N、距離 m、功 J；若平行則 W=F*d。Physics CURRENT 的金融 K 軸 W=F×ΔK 使用抽象市場定義，不能直接等同 SI 焦耳。文明知識可作獨立知識點/技能與研究任務獎勵，不應宣稱精確等於金錢、KGEN 或真實能量。

## MVP 與待辦

已提供 core/au/au-cell-energy-runtime.mjs 純函式：recordCellRun、aggregateRuns、simulateOfflineCultivation、calculatePhysicalWork。tests/au-cell-energy-runtime.test.mjs 驗證 UTC 倒退、跨重置、錯誤百分比、共享池歸屬、重複 Run、XP/衰變分帳與基本作功。上一個本機等價設計獨立副本 11/11 測試通過；此 GitHub HEAD 的 CI/完整 repo 測試尚未驗證。

下一步由既有 DOT/GM WorkQueue 派原 Player Life/存檔 owner，安裝玩家登入/登出的持久 eventId、server/reload 防重複結算與遊戲 HUD，完成 390×844、844×390 Chromium 實測，才可稱 PLAYABLE。不要與 #506/#523 HOLD/#576 同一 writer 衝突。不能未經授權上 Mainnet/Signer/Treasury。

母機/商務流程有可靠 UTC 與署名/數位簽章分離規則；目前是開發候選，尚未建立官方用量自動 API、真實燃料計量或發獎功能。