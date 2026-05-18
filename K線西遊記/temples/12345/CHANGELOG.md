# CHANGELOG

## V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
- 一次整合本輪要求，不逐項拆修。
- 螢幕錄影改為 Android Chrome 可用的 canvas 合成錄影 fallback，不再呼叫手機不支援的 getDisplayMedia。
- 一般錄影保留 V9 正常核心。
- 中央圖語意：多方靜止用 bull-front.png，空方靜止用 bear-rear.png，MOVE / WARP 移動中用 heart.png，停止後回多空圖。
- warp-core.png 綁到右側既有 WARP 引擎軌道，跟隨 C=0~300 上下移動，不另做假 panel。
- 三聖盃檢查系統縮寬並固定在下方方向橫桿上方安全區，收合只控制自己，保留 tab 可再開。
- 左上遮住 VERSION 的小標籤清理。
- modules 維持單層，不恢復 /modules/runtime/。
