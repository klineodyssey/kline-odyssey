/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-visual-semantic-control.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  if(window.__KGEN_VISUAL_SEMANTIC__) return;
  window.__KGEN_VISUAL_SEMANTIC__=true;
  window.KGEN_VISUAL_ROLE={
    "bull-front.png":"中央圖多方模式：+Z 多方宇宙",
    "bear-rear.png":"中央圖空方模式：-Z 空方宇宙",
    "heart.png":"移動模式：XY/XZ 移動中暫態，停止後回多空圖",
    "warp-core.png":"右下曲速電梯艙：跟隨 C=0~300 樓層移動"
  };
  window.KGEN_MARKET_VISUAL_STATE=window.KGEN_MARKET_VISUAL_STATE||{mode:"bull",moving:false};
  window.KGEN_SET_MARKET_MODE=function(mode){
    const st=window.KGEN_MARKET_VISUAL_STATE;
    if(mode==="heart"){st.moving=true;st.mode="heart";}
    else if(mode==="bear"){st.moving=false;st.mode="bear";if(window.KGEN_RUNTIME_STATE?.universe)window.KGEN_RUNTIME_STATE.universe.Z=-1;}
    else{st.moving=false;st.mode="bull";if(window.KGEN_RUNTIME_STATE?.universe)window.KGEN_RUNTIME_STATE.universe.Z=1;}
    document.documentElement.dataset.kgenMarketMode=st.mode;
  };
  window.KGEN_STOP_HEART_MOTION=function(){
    const z=window.KGEN_RUNTIME_STATE?.universe?.Z||1;
    window.KGEN_SET_MARKET_MODE(z<0?"bear":"bull");
  };
})();
