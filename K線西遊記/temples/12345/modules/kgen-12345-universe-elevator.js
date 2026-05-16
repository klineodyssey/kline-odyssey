// KGEN 12345 official universe elevator
(function(){
  "use strict";
  window.KGEN_WARP = window.KGEN_WARP || {c:0};
  window.KGEN_SET_WARP_C = function(v){
    v = Math.max(0, Math.min(300, Number(v) || 0));
    window.KGEN_WARP.c = v;
    const txt = document.getElementById("warp-txt");
    if (txt) txt.textContent = v === 0 ? "C 0｜觀望" : `C ${v}｜第 ${v} 層宇宙`;
    const img = document.getElementById("fairy-img");
    if (img) {
      const fallback = "./assets/heart.png";
      if (v === 0) {
        img.src = fallback;
      } else {
        const n = String(Math.round(v)).padStart(3, "0");
        img.onerror = function(){ this.onerror = null; this.src = fallback; };
        img.src = `./scenes/floor_${n}.png`;
      }
    }
  };
})();
