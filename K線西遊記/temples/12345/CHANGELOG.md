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
