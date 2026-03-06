/* ============================================================
   candle_sim.js
   廣寒宮 K線模擬器｜V1.0.0
   - 使用 UniverseEngine 生成宇宙K線
   - 將方向盤角度 / 曲速轉成 ct / flow / vol
============================================================ */
(function(global){
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

  function flowFromWarp(warp, sign){
    const w = clamp(Number(warp||0), 0, 100);
    const dir = sign >= 0 ? 1 : -1;
    return dir * clamp(w / 100, 0, 1);
  }

  function volFromAngleWarp(absDeg, warp){
    const a = clamp(Number(absDeg||0), 0, 180);
    const w = clamp(Number(warp||0), 0, 100);
    return clamp(0.18 + (a / 180) * 0.42 + (w / 100) * 0.40, 0, 1);
  }

  function next(engine, input){
    return engine.nextCandle(input);
  }

  function fmt(n){
    const v = Number(n);
    if(!Number.isFinite(v)) return '--';
    return Math.round(v).toString();
  }

  global.CandleSimModule = {
    flowFromWarp,
    volFromAngleWarp,
    next,
    fmt
  };
})(window);
