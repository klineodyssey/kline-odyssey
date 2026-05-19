# KGEN 12345 V10.42.4 RUNTIME LOCKDOWN

## 目的
本版不再重寫整座神殿，只在現有 V10.42.3 基礎上加上最後執行鎖定層，修正中央核心、方向控制、Warp、底部按鍵與版面污染。

## 修改內容
1. 中央核心圖像狀態機：
   - 靜止：依 θY 顯示 bull-front / bear-rear。
   - 移動：顯示 heart。
2. 方向控制：
   - 中下方向橫桿與右下方向盤同步控制 θZ / θY。
   - 圖像跟著角度旋轉。
3. XY 遙桿：
   - 左下 MOVE 遙桿提高靈敏度。
   - 移動時切 heart，放開後回 bull / bear。
4. Warp：
   - C0~C300。
   - warp-core 作為宇宙電梯艙，跟隨滑塊。
   - 清除 300 跑入縱桿與右側藍線污染。
5. Panel Router：
   - 底部八鍵重建。
   - 悟空心臟與右側神規可展開 / 收合。
6. Layout：
   - 左上控制台下移。
   - 右上小標籤與無功能漂浮標籤收起。
   - 三聖盃壓縮到安全區。

## 本版更動檔案
- modules/kgen-12345-proto-stabilizer.js
- VERSION
- CHANGELOG.md
- docs/KGEN_12345_V10_42_4_RUNTIME_LOCKDOWN.md
- UPLOAD_LIST.txt
- SHA256SUMS.txt
