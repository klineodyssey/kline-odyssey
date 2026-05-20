/*
FILE: modules/kgen-12345-morph-dna-organ-transplant.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: 12345-TEMPLE-V10.46.2-MORPH-DNA-ORGAN-TRANSPLANT
BUILD: 20260520-V10.46.2-MORPH-DNA-ORGAN-TRANSPLANT
BASE_FROM: KGEN_12345_V10_44_2_FESTIVAL_HEART_CLOCK_RECORDING_SYNC_FULL_GITHUB_READY.zip
ANCESTOR_DNA: V10.42.6
STATUS: ACTIVE
PURPOSE:
  1. 接管原 V10.44.2 宇宙器官，不另造空白頁。
  2. 修復左上版本銘牌、右側神規初始收合、Festival 節日細胞同寬同高。
  3. 以單一 UniverseClock 穩定跨年 / 520 / 1111 倒數，壓制幽靈倒數閃爍。
  4. 重建 HolyCup State Machine，防止訊息行數 1~3 行跳動與 recursive append 癌化。
  5. 建立 MorphDNA Runtime，將按鍵視為 Cell、視窗視為 Organ，作為悟空七十二變 DNA 層。
DEATH: NONE
*/
(function(){
  "use strict";

  const VERSION = "12345-TEMPLE-V10.46.2-MORPH-DNA-ORGAN-TRANSPLANT";
  const SHORT_VERSION = "V10.46.2";
  const BUILD = "20260520-V10.46.2-MORPH-DNA-ORGAN-TRANSPLANT";
  const $ = (id)=>document.getElementById(id);
  const qa = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  window.RUNTIME_GENOME = Object.assign({}, window.RUNTIME_GENOME || {}, {
    universe: SHORT_VERSION,
    version: VERSION,
    build: BUILD,
    base_from: "V10.42.6",
    timeline: "V10.44.2",
    evolution: "MORPH_DNA_ORGAN_TRANSPLANT",
    immortal: true,
    organs: {
      versionHUD: "ACTIVE",
      festivalOrgan: "ACTIVE_SINGLE_HEART",
      holyCupOrgan: "ACTIVE_STATE_MACHINE",
      recordingOrgan: "ACTIVE_FROM_DIVINE_REGENERATION",
      rightRulePanel: "INITIAL_COLLAPSED",
      morphDNA: "ACTIVE"
    }
  });

  function say(msg){
    try{
      if(window.app && typeof window.app.speak === "function") return window.app.speak(msg);
      if("speechSynthesis" in window){
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = "zh-TW";
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    }catch(_){}
  }

  function log(msg){
    try{ console.log("[KGEN V10.46.2]", msg); }catch(_){}
    try{
      const st = $("kgen-v902-left-status") || $("bp-status") || $("v57-cup-status");
      if(st) st.textContent = msg;
    }catch(_){}
  }

  /* 1. 左上版本銘牌：強制與宇宙版本同步 */
  function syncVersionHUD(){
    document.title = "KGEN-12345-HEART-UI-" + SHORT_VERSION;
    const ver = $("ver-st");
    if(ver){
      ver.textContent = "VERSION " + VERSION;
      ver.dataset.runtimeGenome = SHORT_VERSION;
    }
    qa(".sys-st,.version-hud,#versionHUD,[class*='version']").forEach(el=>{
      const t = (el.textContent || "");
      if(/VERSION|V10\.42\.6|V10\.44\.2|V10\.45|V10\.46/.test(t)){
        el.textContent = t
          .replace(/12345-TEMPLE-V10\.[0-9.]+[A-Z0-9_\-]*/g, VERSION)
          .replace(/KGEN-12345-HEART-UI-V10\.[0-9.]+/g, "KGEN-12345-HEART-UI-" + SHORT_VERSION)
          .replace(/UNIVERSE VERSION V10\.[0-9.]+/g, "UNIVERSE VERSION " + SHORT_VERSION);
      }
    });
  }

  /* 2. 右側神規：登入初始收合，按右側神規再展開 */
  function findRightInfoPanel(){
    const direct = $("coord-panel") || $(".right-info-panel") || $(".coord-panel") || $("right-info-panel");
    if(direct) return direct;
    return qa("div").find(el=>{
      try{
        const txt = (el.textContent || "").replace(/\s+/g," ");
        const r = el.getBoundingClientRect();
        return r && r.width > 120 && r.height > 70 && r.left > window.innerWidth * 0.40 &&
          /TempleHeart|Heart\s*\/\s*Brain|悟空心臟規則|神殿規則|11520|18888|LP Pair|合約規則/.test(txt);
      }catch(_){ return false; }
    }) || null;
  }

  function setRightRule(open, silent){
    document.body.classList.toggle("kgen-v10462-right-rule-collapsed", !open);
    const p = findRightInfoPanel();
    if(p){
      p.dataset.kgenRightRule = open ? "open" : "closed";
      p.style.display = open ? "block" : "none";
      p.style.visibility = open ? "visible" : "hidden";
      p.style.pointerEvents = open ? "auto" : "none";
    }
    if(!silent) say(open ? "右側神規已展開。" : "右側神規已收合。");
  }

  function bindRightRuleButton(){
    let target = null;
    qa(".footer-terminal button,.footer-terminal .term-btn,button.term-btn").forEach(b=>{
      const t = (b.textContent || "").replace(/\s+/g,"");
      if(/右側神規|客服導覽|語音客服/.test(t)) target = b;
    });
    if(target){
      target.innerHTML = "🛡<br>右側神規";
      target.dataset.kgenCell = "right-rule-toggle-cell";
      target.onclick = function(e){
        e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        const open = document.body.classList.contains("kgen-v10462-right-rule-collapsed");
        setRightRule(open, false);
        return false;
      };
    }
  }

  /* 3. UniverseClock：單一心跳，壓制跨年倒數心律不整 */
  function pad(n){ return String(n).padStart(2,"0"); }
  function nextLocal(month, day, hour=0, min=0, sec=0){
    const now = new Date();
    let d = new Date(now.getFullYear(), month-1, day, hour, min, sec, 0);
    if(d.getTime() <= now.getTime()) d = new Date(now.getFullYear()+1, month-1, day, hour, min, sec, 0);
    return d;
  }
  function fmt(ms){
    ms = Math.max(0, Number(ms)||0);
    const totalMin = Math.floor(ms/60000);
    const d = Math.floor(totalMin/1440);
    const h = Math.floor((totalMin%1440)/60);
    const m = totalMin%60;
    return d > 0 ? (d + "天 " + pad(h) + "時" + pad(m) + "分") : (pad(h) + "時" + pad(m) + "分");
  }

  const UniverseClock = {
    timer: null,
    lastText: "",
    tick(){
      const now = Date.now();
      const text = "跨年 " + fmt(nextLocal(12,31,23,59,59)-now) +
        "｜520 " + fmt(nextLocal(5,20,0,0,0)-now) +
        "｜1111 " + fmt(nextLocal(11,11,0,0,0)-now);
      if(text === this.lastText) return;
      this.lastText = text;
      const targets = [
        $("kgen-v102-festival-countdown"),
        $("kh-ny-slot"), $("cd-1231"), $("kgen-ny-countdown"), $("v714-ny-count"), $("kh-ny-countdown")
      ].filter(Boolean);
      qa("[id*='countdown'],[class*='countdown'],[id*='ny'],[class*='ny-count']").forEach(el=>{
        const tx = (el.textContent || "");
        if(/跨年|520|1111|距跨年/.test(tx)) targets.push(el);
      });
      Array.from(new Set(targets)).forEach(el=>{
        if(el.closest && el.closest("#kgen-v102-festival-panel")){
          el.textContent = text;
        }else if(/跨年|距跨年/.test(el.textContent || "")){
          el.textContent = text.split("｜")[0];
        }
        el.style.animation = "none";
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.whiteSpace = "nowrap";
        el.style.overflow = "hidden";
        el.style.minHeight = "22px";
        el.style.lineHeight = "22px";
      });
    },
    start(){
      if(this.timer) clearInterval(this.timer);
      this.tick();
      this.timer = setInterval(()=>this.tick(), 1000);
    }
  };
  window.KGEN_UNIVERSE_CLOCK = UniverseClock;

  /* 4. Festival Organ：放回右側導覽細胞序列，同寬同高，可收合 */
  function normalizeFestivalOrgan(){
    const panel = $("kgen-v102-festival-panel");
    if(!panel) return;

    panel.dataset.kgenOrgan = "festival-organ";
    panel.classList.add("kgen-v10462-festival-organ");

    const nav = $("universe-nav");
    const audio = nav && nav.querySelector(".nav-audio");
    if(nav && panel.parentElement !== nav){
      if(audio && audio.nextSibling) nav.insertBefore(panel, audio.nextSibling);
      else nav.appendChild(panel);
    }

    const head = panel.querySelector("h3");
    if(head && !head.dataset.kgenCellBound){
      head.dataset.kgenCellBound = "1";
      head.onclick = function(){
        panel.classList.toggle("collapsed");
      };
    }

    qa("button", panel).forEach(btn=>{
      btn.classList.add("festival-cell-button");
      btn.dataset.kgenCell = "festival-button-cell";
    });

    const voice = $("kgen-v102-festival-voice");
    if(voice){
      voice.textContent = "語音解說";
    }
  }

  /* 5. HolyCup Runtime：單例狀態機，防止訊息 1~3 行亂跳 */
  const HolyCup = {
    count: 0,
    max: 3,
    history: [],
    outcomes: ["正反","反正","正正","反反"],
    isSuccess(x){ return x === "正反" || x === "反正"; },
    line(result){
      const desc = result ? (this.isSuccess(result) ? "聖盃成功" : (result === "正正" ? "笑杯" : "陰杯")) : "尚未請示";
      return `本次：${result || "--"}｜${desc}｜成功：${this.count} / ${this.max}`;
    },
    render(result){
      const line = this.line(result);
      const targets = [
        $("v715-cup-log"),
        $("v714-cup-status"),
        $("v57-cup-status"),
        $("holyCupState")
      ].filter(Boolean);
      targets.forEach(el=>{
        el.innerHTML = line + "<br>紀錄：" + (this.history.join("、") || "尚未請示");
        el.style.minHeight = "44px";
        el.style.maxHeight = "50px";
        el.style.overflow = "hidden";
        el.dataset.kgenHolyCupStable = "1";
      });
    },
    cup(){
      const r = this.outcomes[Math.floor(Math.random()*this.outcomes.length)];
      this.history.push(r);
      if(this.history.length > 6) this.history.shift();
      if(this.isSuccess(r)) this.count = Math.min(this.max, this.count + 1);
      this.render(r);
      say(this.isSuccess(r) ? `本次${r}，聖盃成功，目前 ${this.count} / 3。` : `本次${r}，未成聖盃，請重新請示。`);
      return false;
    },
    reset(){
      this.count = 0; this.history = []; this.render(null); say("聖盃已重置。");
    }
  };
  window.KGEN_HOLYCUP_RUNTIME = HolyCup;

  function transplantTempleOps(){
    const old = window.templeOps || {};
    window.templeOps = Object.assign({}, old, {
      cup: function(){ return HolyCup.cup(); },
      resetCup: function(){ return HolyCup.reset(); }
    });
    qa("button,.term-btn,.nav-btn").forEach(btn=>{
      const t = (btn.textContent || "").replace(/\s+/g,"");
      if(/三次聖盃|請示聖盃|聖盃/.test(t) && !/重置/.test(t)){
        btn.dataset.kgenCell = "holycup-button-cell";
        btn.onclick = function(e){
          e.preventDefault(); e.stopPropagation();
          return HolyCup.cup();
        };
      }
      if(/重置聖盃/.test(t)){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); return HolyCup.reset(); };
      }
    });
    HolyCup.render(null);
  }

  /* 6. Recording HUD：保留原 divine 錄影功能，只補時間顯示守護 */
  function normalizeRecordingHUD(){
    const rec = $("rec-ind");
    if(rec){
      rec.dataset.kgenOrgan = "recording-organ";
      if(!/REC\s+\d{2}:\d{2}/.test(rec.textContent || "")) rec.textContent = "REC 00:00";
    }
    qa("#rec-btn,.btn-rec").forEach(btn=>{
      btn.dataset.kgenCell = "recording-button-cell";
    });
  }

  /* 7. MorphDNA：先建立幹細胞層，不改壞原本畫面 */
  const MorphDNA = {
    forms: ["human","tree","bird","beast","temple","ufo","dragon","flame"],
    current: "human",
    morph(next){
      if(!this.forms.includes(next)) return false;
      this.current = next;
      document.body.dataset.kgenMorph = next;
      log("MorphDNA 轉換：" + next);
      return true;
    }
  };
  window.KGEN_MORPH_DNA_RUNTIME = MorphDNA;

  function tagCells(){
    qa("button,.term-btn,.nav-btn,input,select").forEach((el, idx)=>{
      if(!el.dataset.kgenCell){
        el.dataset.kgenCell = "cell-" + idx;
      }
    });
    qa(".hud-box,.panel,.bp-panel,#kgen-v102-festival-panel,#music-panel,#universe-nav").forEach((el, idx)=>{
      if(!el.dataset.kgenOrgan){
        el.dataset.kgenOrgan = "organ-" + idx;
      }
    });
  }

  function boot(){
    syncVersionHUD();
    normalizeFestivalOrgan();
    bindRightRuleButton();
    setRightRule(false, true);
    UniverseClock.start();
    transplantTempleOps();
    normalizeRecordingHUD();
    tagCells();
    log("V10.46.2 MorphDNA Organ Transplant Runtime 已啟動。");
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setTimeout(boot, 500);
  setTimeout(boot, 1800);
  setInterval(()=>{
    syncVersionHUD();
    normalizeFestivalOrgan();
    bindRightRuleButton();
    transplantTempleOps();
    normalizeRecordingHUD();
    tagCells();
  }, 2500);
})();
