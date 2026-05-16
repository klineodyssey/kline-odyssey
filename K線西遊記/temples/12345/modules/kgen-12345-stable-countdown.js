// KGEN 12345 stable countdown core
(function(){
  "use strict";
  if (window.__KGEN_12345_SINGLE_COUNTDOWN_ENGINE__) return;
  window.__KGEN_12345_SINGLE_COUNTDOWN_ENGINE__ = true;

  function pad(n){ return String(n).padStart(2, "0"); }
  function nextTopHour(){
    const n = new Date();
    const t = new Date(n);
    t.setMinutes(0,0,0);
    t.setHours(t.getHours()+1);
    return t;
  }
  function nextUtcMidnight(){
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()+1, 0,0,0,0));
  }
  function nextNewYear(){
    const n = new Date();
    let t = new Date(n.getFullYear(), 11, 31, 23, 59, 59, 999);
    if (t <= n) t = new Date(n.getFullYear()+1, 11, 31, 23, 59, 59, 999);
    return t;
  }
  function diff(target){
    const ms = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(ms / 1000);
    return {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      sec: s % 60
    };
  }
  function hms(v){ return `${v.h}時${pad(v.m)}分${pad(v.sec)}秒`; }
  function dayhm(v){ return `${v.d}天 ${pad(v.h)}時${pad(v.m)}分`; }
  function setText(id, text){
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== text) el.textContent = text;
    el.style.animation = "none";
    el.style.transition = "none";
    el.style.opacity = "1";
  }
  function setByLabel(labelText, valueText){
    const panel = document.getElementById("kgen-heart-live-panel");
    if (!panel) return;
    panel.querySelectorAll(".kh-k").forEach(k => {
      if ((k.textContent || "").trim() === labelText) {
        const v = k.nextElementSibling;
        if (v) {
          v.textContent = valueText;
          v.style.animation = "none";
          v.style.transition = "none";
          v.style.opacity = "1";
        }
      }
    });
  }
  function cleanAmountInputs(){
    document.querySelectorAll("input").forEach(i => {
      if (i.value === "8") i.value = "";
      if ((i.placeholder || "").includes("1 到 888")) {
        i.placeholder = "請自行輸入 KGEN 金額 / 點燈天數";
      }
    });
  }
  function tick(){
    const heartbeat = "距下次整點 " + hms(diff(nextTopHour()));
    const ignite = "距 UTC 00:00 " + hms(diff(nextUtcMidnight()));
    const ny = dayhm(diff(nextNewYear()));

    setText("kh-heartbeat-countdown", heartbeat);
    setText("kh-ignite-countdown", ignite);
    setText("cd-1231", ny);
    setText("kh-ny-countdown", "三聖盃完成後，才可領發財金。金額欄由操作者自行輸入，不自動填數字。");

    setByLabel("心跳倒數", heartbeat);
    setByLabel("呼吸倒數", ignite);
    setByLabel("跨年倒數槽", "距跨年：" + ny);
    cleanAmountInputs();
  }
  tick();
  window.KGEN_12345_COUNTDOWN_TIMER = setInterval(tick, 1000);
})();
