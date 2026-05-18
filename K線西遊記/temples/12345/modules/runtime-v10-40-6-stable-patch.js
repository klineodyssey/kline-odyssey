/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-v10-40-6-stable-patch.js
VERSION: KGEN-12345-HEART-UI-V10.40.6-MODULES-STABLE-PATCH
BUILD: 20260518-V10.40.6-MODULES-STABLE-PATCH
BASE_FROM: KGEN_12345_V10_40_5_MIRROR_CENTER_BULLBEAR_RESTORE_FULL.zip
RULE: continue modules; do not rebuild main DOM; patch only by module.
*/

(function(){
  "use strict";
  if (window.__KGEN_V10406_STABLE_PATCH__) return;
  window.__KGEN_V10406_STABLE_PATCH__ = true;

  const ASSET = {
    bull: "./assets/bull-front.png",
    bear: "./assets/bear-rear.png",
    heart: "./assets/heart.png",
    warp: "./assets/warp-core.png"
  };

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const text = el => (el && el.textContent || "").replace(/\s+/g," ").trim();

  let motionTimer = 0;
  let currentSide = "bull";

  function angleValue(){
    const el = $("#steer-input-val") || $("#angle-input") || $("[type='range'].steer-slider");
    const v = el ? Number(el.value) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  function sideFromAngle(a){
    // KGEN official: -90~0~90 = 多；90~180 / -180~-90 = 空
    return (a >= -90 && a <= 90) ? "bull" : "bear";
  }

  function centralImg(){
    return $("#fairy-img") || $("#core-window img") || $("#core-anchor img");
  }

  function setCentralImage(kind, reason){
    const img = centralImg();
    if (!img) return;
    const src = ASSET[kind] || ASSET.heart;
    if (!img.dataset.kgenOriginalSrc) img.dataset.kgenOriginalSrc = img.getAttribute("src") || "";
    if (!img.src.includes(src.replace("./",""))) img.setAttribute("src", src);
    img.dataset.kgenImageState = kind;
    img.dataset.kgenImageReason = reason || "";
  }

  function settleImage(){
    const a = angleValue();
    currentSide = sideFromAngle(a);
    setCentralImage(currentSide, "settle-angle");
  }

  function markMoving(reason){
    setCentralImage("heart", reason || "moving");
    clearTimeout(motionTimer);
    motionTimer = setTimeout(settleImage, 850);
  }

  function bindMotion(){
    const steer = $("#steer-input-val") || $("[type='range'].steer-slider");
    if (steer && !steer.dataset.kgenV10406Bound) {
      steer.dataset.kgenV10406Bound = "1";
      steer.addEventListener("input", () => { markMoving("steer"); }, true);
      steer.addEventListener("change", () => { setTimeout(settleImage, 220); }, true);
    }

    const joy = $("#move-joystick-wrap") || $("#move-joystick-knob") || $(".move-joystick") || $(".joystick");
    if (joy && !joy.dataset.kgenV10406Bound) {
      joy.dataset.kgenV10406Bound = "1";
      ["pointerdown","pointermove","touchstart","touchmove","mousedown","mousemove"].forEach(ev=>{
        joy.addEventListener(ev, () => markMoving("move-joystick"), {passive:true, capture:true});
      });
      ["pointerup","touchend","mouseup"].forEach(ev=>{
        window.addEventListener(ev, () => setTimeout(settleImage, 220), {passive:true, capture:true});
      });
    }

    const warp = $("#warp-input-val") || $(".warp-range");
    if (warp && !warp.dataset.kgenV10406Bound) {
      warp.dataset.kgenV10406Bound = "1";
      warp.addEventListener("input", () => {
        markMoving("warp");
        moveWarpCore();
      }, true);
      warp.addEventListener("change", () => {
        moveWarpCore();
        setTimeout(settleImage, 260);
      }, true);
    }
  }

  function ensureWarpCore(){
    const rail = $("#warp-rail-body") || $(".warp-rail") || $(".warp-engine");
    if (!rail) return;
    let core = $("#kgen-warp-core-cabin");
    if (!core) {
      core = document.createElement("img");
      core.id = "kgen-warp-core-cabin";
      core.src = ASSET.warp;
      core.alt = "warp-core";
      core.onerror = () => { core.style.display = "none"; };
      rail.appendChild(core);
    }
    moveWarpCore();
  }

  function moveWarpCore(){
    const rail = $("#warp-rail-body") || $(".warp-rail") || $(".warp-engine");
    const core = $("#kgen-warp-core-cabin");
    const input = $("#warp-input-val") || $(".warp-range");
    if (!rail || !core) return;
    const raw = input ? Number(input.value) : 0;
    const max = input ? Number(input.max || 100) : 100;
    const pct = Math.max(0, Math.min(1, raw / (max || 100)));
    core.style.bottom = `calc(${pct * 100}% - 18px)`;
  }

  function hideOldCountdown(){
    const keys = ["跨年", "12/31", "12／31", "新年倒數"];
    $$("body *").forEach(el => {
      if (!el || el.closest("#kgen-newyear-countdown-widget") || el.id === "kgen-newyear-countdown-tab") return;
      const idc = ((el.id||"") + " " + (el.className||"")).toLowerCase();
      const t = text(el);
      const named = idc.includes("newyear") || idc.includes("new-year") || idc.includes("countdown") || idc.includes("ny-");
      const badText = keys.some(k => t.includes(k)) && t.length < 180;
      if (named || badText) {
        el.classList.add("kgen-old-countdown-hidden");
      }
    });
  }

  function nextNY(now){
    const y = now.getFullYear();
    let target = new Date(y, 11, 31, 23, 59, 59);
    if (now > target) target = new Date(y + 1, 11, 31, 23, 59, 59);
    return target;
  }

  function fmt(ms){
    ms = Math.max(0, ms);
    let s = Math.floor(ms/1000);
    const d = Math.floor(s/86400); s %= 86400;
    const h = Math.floor(s/3600); s %= 3600;
    const m = Math.floor(s/60); s %= 60;
    return `${d}天 ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function ensureCountdown(){
    let w = $("#kgen-newyear-countdown-widget");
    if (!w) {
      w = document.createElement("section");
      w.id = "kgen-newyear-countdown-widget";
      w.innerHTML = `
        <div class="kgen-ny-head">
          <b>跨年倒數</b>
          <button type="button" id="kgen-ny-close">收合</button>
        </div>
        <div class="kgen-ny-body">
          <div id="kgen-ny-time">--天 --:--:--</div>
          <div class="kgen-ny-note">獨立視窗，不共用舊倒數、心跳或節日 timer。</div>
        </div>`;
      document.body.appendChild(w);
    }
    let tab = $("#kgen-newyear-countdown-tab");
    if (!tab) {
      tab = document.createElement("button");
      tab.id = "kgen-newyear-countdown-tab";
      tab.type = "button";
      tab.textContent = "跨年";
      document.body.appendChild(tab);
    }
    const close = $("#kgen-ny-close");
    if (close && !close.dataset.bound) {
      close.dataset.bound = "1";
      close.addEventListener("click", ev => {
        ev.preventDefault(); ev.stopPropagation();
        w.style.display = "none"; tab.style.display = "block";
      }, true);
    }
    if (!tab.dataset.bound) {
      tab.dataset.bound = "1";
      tab.addEventListener("click", ev => {
        ev.preventDefault(); ev.stopPropagation();
        w.style.display = "block"; tab.style.display = "none";
      }, true);
    }
    const time = $("#kgen-ny-time");
    if (time) time.textContent = fmt(nextNY(new Date()) - new Date());
  }

  function ensureHolyCup(){
    // Do not route to global collapse. Force its own panel and keep reopen tab.
    let p = $("#kgen-holy-cup-panel-v10406");
    if (!p) {
      p = document.createElement("section");
      p.id = "kgen-holy-cup-panel-v10406";
      p.innerHTML = `
        <div class="kgen-cup-head">
          <b>三聖盃檢查系統</b>
          <button type="button" id="kgen-cup-close-v10406">收合</button>
        </div>
        <div class="kgen-cup-body">
          <span>STEP 1 Wallet</span>
          <span>STEP 2 BSC</span>
          <span>STEP 3 Approve</span>
        </div>`;
      document.body.appendChild(p);
    }
    let tab = $("#kgen-cup-tab-v10406");
    if (!tab) {
      tab = document.createElement("button");
      tab.id = "kgen-cup-tab-v10406";
      tab.type = "button";
      tab.textContent = "三聖盃";
      document.body.appendChild(tab);
    }
    const close = $("#kgen-cup-close-v10406");
    if (close && !close.dataset.bound) {
      close.dataset.bound = "1";
      close.addEventListener("click", ev => {
        ev.preventDefault(); ev.stopPropagation();
        p.style.display = "none"; tab.style.display = "block";
      }, true);
    }
    if (!tab.dataset.bound) {
      tab.dataset.bound = "1";
      tab.addEventListener("click", ev => {
        ev.preventDefault(); ev.stopPropagation();
        p.style.display = "block"; tab.style.display = "none";
      }, true);
    }

    // Bind existing holy-cup buttons to open this panel without hijacking global collapse.
    $$("button,a,[role='button'],.btn,.term-btn").forEach(btn => {
      if (btn.dataset.kgenCupOpenV10406) return;
      if (text(btn).includes("三聖盃") || text(btn).includes("聖盃")) {
        btn.dataset.kgenCupOpenV10406 = "1";
        btn.addEventListener("click", ev => {
          if (text(btn).includes("收合")) return;
          p.style.display = "block"; tab.style.display = "none";
        }, true);
      }
    });
  }

  function bindLeftRightPanels(){
    // Re-open placeholders only if original hidden windows are missing.
    $$("button,a,[role='button'],.term-btn,.btn").forEach(btn => {
      const t = text(btn);
      if (!btn.dataset.kgenPanelV10406 && (t.includes("悟空心臟") || t.includes("悟空之心"))) {
        btn.dataset.kgenPanelV10406 = "heart";
        btn.addEventListener("click", () => openMiniPanel("left-heart", "悟空心臟", "左下心臟視窗：MOVE 用 heart.png，停止回多空圖。"), true);
      }
      if (!btn.dataset.kgenPanelV10406 && (t.includes("右側神規") || t.includes("神規"))) {
        btn.dataset.kgenPanelV10406 = "rule";
        btn.addEventListener("click", () => openMiniPanel("right-rule", "右側神規", "TempleHeart / Brain 對齊規則，不是 Warp panel。"), true);
      }
    });
  }

  function openMiniPanel(id, title, body){
    let p = $("#kgen-mini-panel-" + id);
    if (!p) {
      p = document.createElement("section");
      p.id = "kgen-mini-panel-" + id;
      p.className = "kgen-mini-panel " + id;
      p.innerHTML = `<div class="kgen-mini-head"><b>${title}</b><button type="button">收合</button></div><div class="kgen-mini-body">${body}</div>`;
      p.querySelector("button").addEventListener("click", () => { p.style.display = "none"; });
      document.body.appendChild(p);
    }
    p.style.display = "block";
  }

  function cleanTopStrays(){
    $$("body *").forEach(el => {
      if (el.children.length) return;
      const r = el.getBoundingClientRect();
      if (r.top > 0 && r.top < 130 && r.left < 260) {
        const t = text(el);
        if (t === "C |" || t.startsWith("C |") || t.startsWith("CT |") || t.includes("未偵測到")) {
          el.classList.add("kgen-top-stray-hidden");
        }
      }
    });
  }

  function boot(){
    hideOldCountdown();
    ensureCountdown();
    bindMotion();
    settleImage();
    ensureWarpCore();
    ensureHolyCup();
    bindLeftRightPanels();
    cleanTopStrays();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setInterval(() => {
    ensureCountdown();
    ensureWarpCore();
    bindMotion();
    ensureHolyCup();
    bindLeftRightPanels();
    cleanTopStrays();
  }, 1500);
  setInterval(hideOldCountdown, 3000);
})();
