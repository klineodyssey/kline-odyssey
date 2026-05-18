# CHANGELOG

## KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH
- Continue modules from V10.40.5; no rollback to single-file.
- Add `modules/runtime-v10-40-6-stable-patch.js`.
- Isolate broken old countdown and install independent New Year countdown widget.
- Holy Cup panel moved to lower safe zone above direction bar; self-collapse and reopen tab.
- Central image semantic control: bull / bear / heart.
- Warp core image attached to right warp elevator.
- Left heart and right rule mini-panels restored as independent windows.
- Top stray labels hidden.


# CHANGELOG

## V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE
- 修復中央圖旋轉圓心：鎖定 `#core-window` 不再被舊腳本二次旋轉，統一由 `#core-anchor` 以 50%/50% 圓心旋轉。
- 恢復多空圖切換：方向角 `-90° ~ +90°` 顯示 `bull-front.png`，其餘角度顯示 `bear-rear.png`。
- 清除殘留文字：隱藏 `modules` 與 `wukong_heart_v10_4.png` 等舊 debug 顯示。
- 保留 V10.40.4 已完成項目：重作小倒數、三聖盃縮小、左下 MOVE 遙桿、右側宇宙電梯、合約與錢包綁定不變。
- 只需補傳最少檔案即可測試：根目錄橋接檔與 12345/index.html；文件檔可同步上傳做版本治理。


## V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE
- 停止重調早期倒數區塊：舊倒數整塊隱藏。
- 重作一條不閃爍的 compact countdown strip，放在方向橫桿上方。
- 三聖盃檢查系統縮小為中央 HUD，不再壓住主畫面。
- 左上品牌 / VERSION / SYSTEM ONLINE 往下移，避開手機上方遮擋。
- 小標籤 / debug 面板預設收起。
- 清除 `wukong_heart_v10_4.png` 壞圖文字外露。
- 保留左下 MOVE 平面遙桿、中央悟空可移動、V9 recorder core、合約地址與 wallet 接線。

## V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
- 修正 active runtime 殘留舊測試圖。
