# V10.42.4 RUNTIME LOCKDOWN｜2026-05-20

## 修改重點
- 修正中央圖 Runtime：靜止顯示 bull/bear，移動顯示 heart。
- 修正中下方向橫桿與右下方向盤：同步控制核心旋轉角度與多空相位。
- 修正左下 XY 遙桿：提高靈敏度，移動時觸發 heart，放開後回到多空相位圖。
- 修正 Warp 宇宙電梯：C0~C300、warp-core 圓圖跟隨滑塊，清理 300 文字跑位。
- 修正底部八鍵：重建按鈕與左下悟空心臟 / 右下右側神規 panel 開合。
- 修正版面：移除右側藍色垂直線與漂浮小標籤，左上控制台下移，避免壓到版本與時間。

## 更動檔案
- modules/kgen-12345-proto-stabilizer.js
- VERSION
- CHANGELOG.md
- docs/KGEN_12345_V10_42_4_RUNTIME_LOCKDOWN.md
- UPLOAD_LIST.txt
- SHA256SUMS.txt

---

# CHANGELOG

## V10.42.2_PROTO_RUNTIME_STABILIZER
- 補齊正式 assets：bull-front.png / bear-rear.png / heart.png / warp-core.png。
- 強制中央核心三態：靜止 bull/bear，移動 heart。
- 修正方向盤與方向橫桿：角度直接驅動核心 rotateZ 與多空判定。
- 底部八顆按鈕改為可展開 / 收合 panel，並接回悟空心臟與右側神規。
- Warp 文字清理，隱藏錯位 C0/300 與 300 污染，warp-core 跟隨縱桿滑塊。
- 左上控制台下移，版本號保持可見。

# CHANGELOG

## V10.42.0_PROTO_STABILIZATION
- Restored bottom eight-button router: photo, record, front camera, back camera, Wukong Heart, dual recording, rules/events, right-side deity rules.
- Added official runtime file `modules/kgen-12345-ui-runtime.js`.
- Central 2D Anti-Gravity prototype state machine:
  - Static state uses `bull-front.png` or `bear-rear.png` by theta phase.
  - Moving state uses `heart.png`.
- Direction controls drive theta rotation and image state.
- Joystick drives XY movement and forces heart state while moving.
- Warp elevator maps C0-C300 and keeps `warp-core.png` inside the elevator thumb.
- Added independent left Heart panel and right Rules panel with collapse/open behavior.
- Kept lower control skeleton; no demolition of existing temple layout.

## V10.42.1_PROTO_RUNTIME_FIX
- 強制恢復中央核心狀態機：靜止 bull/bear、移動 heart。
- 方向橫桿與右下方向盤統一控制核心 rotateZ 與多空相位。
- 底部八按鍵改為資料屬性路由，避免舊版文字捕捉事件干擾，恢復展開/收合。
- Warp Elevator 改為 C0~C300，warp-core 圓圖跟隨滑塊上下移動。
- 左上控制台下移，避免版本號與品牌被瀏覽器列遮擋。
- 修正 Warp 300 文字跑入縱桿的視覺污染。

## V10.42.3_PROTO_INTERACTION_LOCK
- 強制修復中央核心三態：靜止 bull/bear，移動 heart。
- 強制接回方向橫桿 / 右下方向盤控制核心圓心旋轉與多空判定。
- 強制接回左下 XY 遙桿，限制位移靈敏度，移動時切 heart，停止回 bull/bear。
- 強制接回 Warp C0~C300 與 warp-core 電梯艙跟隨，清理右側藍色垂直污染線。
- 底部八鍵重整為可按面板：悟空心臟、右側神規、規則活動、前鏡多方、後鏡空方。
- 左上控制台下移，右上漂浮小標籤治理，三聖盃維持安全區。
