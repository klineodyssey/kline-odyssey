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

## KGEN-12345-V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY

- 以 V10.40.5 為母版，不再拆屋重排。
- 12345 定位改為「悟空財神殿開張版」：畫面好看、位置正確、基本功能入口清楚。
- 中央主圖治理：預設多方悟空門面；角度進入空方區間切換 `bear-rear.png`；MOVE / 儀式動作切換 `heart.png`。
- 右下 Warp：新增 `warp-core.png` 跟隨曲速縱桿發光點上下移動。
- 三聖盃檢查系統移到中央圖與方向橫桿之間，縮小寬度，避免碰到右下曲速引擎。
- 小標籤與工程 debug 預設收起，避免破廟感。
- K線 / 戰鬥 / XY / Z / C / T / CT 大型變化暫收，後續放入遊戲戰鬥模式或其他殿。
