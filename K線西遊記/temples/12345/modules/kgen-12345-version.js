/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-version.js
VERSION: V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
RULE: Active JS/CSS stays in modules single layer. V9 recorder core restored.
*/

window.KGEN_12345_VERSION={
  PRODUCT_ID:'KGEN-12345-HEART-UI',
  VERSION:'V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX',
  BUILD:'20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX',
  BASE_FROM:'KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip',
  RECORDER_CORE:'V9.0.0 canvas captureStream flow restored; V10.40.3 mobile layout safe asset fix',
  SCREEN_RECORDING_POLICY:'Disabled as primary path; recording button uses stable canvas recorder.',
  ASSET_BINDING:{'bull-front.png':'多方靜止','bear-rear.png':'空方靜止','heart.png':'移動暫態','warp-core.png':'右下曲速電梯'}
};
console.log('[KGEN 12345 VERSION]', window.KGEN_12345_VERSION);
