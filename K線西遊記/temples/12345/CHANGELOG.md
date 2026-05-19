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
