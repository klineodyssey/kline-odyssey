/* ============================================================
   steering.js
   廣寒宮方向盤模組｜V1.0.0
   - 負責角度正規化
   - 方向：多 / 空
   - 提供 K線宇宙引擎使用
============================================================ */
(function(global){
  function normalizeAngle(angle){
    let a = Number(angle || 0);
    if(!Number.isFinite(a)) a = 0;
    while(a > 180) a -= 360;
    while(a < -180) a += 360;
    return a;
  }

  function absInt(angle){
    return Math.round(Math.abs(normalizeAngle(angle)));
  }

  function directionZh(angle){
    const a = normalizeAngle(angle);
    return Math.abs(a) <= 90 ? "多" : "空";
  }

  function directionEn(angle){
    return directionZh(angle) === "多" ? "LONG" : "SHORT";
  }

  function toNormalizedCt(angle){
    const a = normalizeAngle(angle);
    const sign = Math.abs(a) <= 90 ? 1 : -1;
    const strength = Math.min(1, Math.abs(a) / 180);
    return sign * strength;
  }

  function getAngle(){
    const el = document.getElementById('steer-input-val');
    return normalizeAngle(el ? Number(el.value||0) : 0);
  }

  global.SteeringModule = {
    normalizeAngle,
    absInt,
    directionZh,
    directionEn,
    toNormalizedCt,
    getAngle,
    getDirectionLabel: ()=> directionZh(getAngle())
  };
})(window);
