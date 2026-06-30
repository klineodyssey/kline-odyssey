/*
PRIMEFORGE_LIFE_HEADER_V1:
  CIVILIZATION_INFO:
    CIVILIZATION_ID: KGEN-PRIME-CIVILIZATION
    CIVILIZATION_NAME: KLINE ODYSSEY
    GALAXY: Internet
    PLANET: GitHub
    REPO: klineodyssey/kline-odyssey
    CHAIN_NETWORK: BNB Smart Chain
    SURVIVAL_RULE: 沒有質量，就沒有位置
  STRUCTURE_COORDINATE:
    ROOT_STRUCTURE: /K線西遊記
    CITY_STRUCTURE: /K線西遊記/temples/12345
    CURRENT_LIFE_COORDINATE: /modules/runtime-main.js
  FILE_CERTIFICATE:
    FILE: runtime-main.js
    PATH: /modules/runtime-main.js
    PRODUCT_ID: KGEN-12345-HEART-UI
    LIFE_LAYER: ORGAN
    LIFE_TYPE: JavaScript Organ Lifeform
    VERSION: 12345-TEMPLE-V10.48.0-LIFE-STANDARD-REGENERATION
    BUILD: 20260525-V10.48.0-LIFE-STANDARD-REGENERATION
    BIRTH: 2026-05-25
    BASE_FROM: KGEN_12345_V10_47_1_LAYOUT_REAL_FIX_FULL_GITHUB_READY.zip
    UPGRADE_FROM: 12345-TEMPLE-V10.47.1-LAYOUT-REAL-FIX
    DEATH: ACTIVE
    GROWTH_STAGE: IMMORTAL_REGENERATION_STANDARDIZATION
  TAXONOMY:
    DOMAIN: KGENVERSE
    KINGDOM: FinancialLifeform
    PHYLUM: RuntimeOrganism
    CLASS: OrganRuntime
    ORDER: JavaScriptOrgan
    FAMILY: PrimeForgeLife
    GENUS: KGEN12345
    SPECIES: runtime-main.js
    CELL: Function Cell Cluster
    ORGAN: Main Runtime Organ
    DNA: JS-ORGAN-DNA
  IMMUNE_SYSTEM:
    VIRUS_SCAN: ENABLED
    HASH_VALIDATION: REQUIRED
    UNKNOWN_ORGAN_BLOCK: TRUE
    PATCH_DRIFT_BLOCK: TRUE
    VERSION_FILENAME_BLOCK: TRUE
    SELF_HEALING: ENABLED
  REGENERATION:
    EMBRYO_MODE: GZIP_BASE64
    CAN_REBUILD_FROM_EMBRYO: TRUE
    REJUVENATION: ENABLED
    IMMORTALITY_CLASS: WUKONG_LONGEVITY
  SECURITY_FINGERPRINT:
    FINAL_SHA256: FILLED_IN_SHA256SUMS

*/

/*
FILE: modules/runtime-main.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: 12345-TEMPLE-V10.47.1-LAYOUT-REAL-FIX
BUILD: 20260520-V10.47.1-LAYOUT-REAL-FIX
BASE_FROM: V10.44.2
ANCESTOR_DNA: V10.42.6
STATUS: ACTIVE
PURPOSE: Permanent runtime-main. Version is DNA, not file name.
*/
(function(){
  "use strict";

  const VERSION = "V10.49.1";
  const VERSION_TAG = "12345-TEMPLE-V10.49.1-LAND-UI-V1.0.4";
  const VERSION_SHORT = "V10.49.1 / LAND V1.0 / BSC56";
  const BRAND_LINE1 = "KGEN 12345 五指山悟空財神殿";
  const UI_PATCH = "V1.0.4";
  const HEART_CONTRACT = "KGEN_TempleHeart_V3_2_6.sol";
  const CUP_KEY = "kgen12345_cup_count_v10492";
  const CHAIN = {
    KGEN: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
    HEART: "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972",
    BSC: "0x38",
    RPC: "https://bsc-dataseed.binance.org/"
  };
  const HEART_VIEW_ABI = [
    "function lastFortuneAt(address) view returns (uint256)",
    "function lastHeartbeatAt(address) view returns (uint256)",
    "function lastIgniteDay(address) view returns (uint256)",
    "function fortuneCooldownSeconds() view returns (uint256)",
    "function heartbeatCooldownSeconds() view returns (uint256)",
    "function igniteWindowStart() view returns (uint256)",
    "function igniteWindowEnd() view returns (uint256)",
    "function fortuneEpochClaims(uint256) view returns (uint256)",
    "function fortuneEpochMaxClaims() view returns (uint256)",
    "function fortuneCapEnabled() view returns (bool)",
    "function currentFortuneEpochIndex() view returns (uint256)",
    "function fortuneMin() view returns (uint256)",
    "function fortuneMax() view returns (uint256)",
    "function kgen() view returns (address)",
    "function timeOfDaySeconds() view returns (uint256)",
    "function currentDayIndex() view returns (uint256)"
  ];
  const ERC20_VIEW_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];
  /* KGEN_TempleHeart_V3_2_6.sol — canonical write ABI (frontend must match) */
  const HEART_ABI_V326 = [
    "function fortuneClaim(uint256 amountWhole) external",
    "function heartbeatClaim() external",
    "function igniteAndClaim() external",
    "function vowTo(uint8 option, uint256 amountWhole) external",
    "function lightLamp(uint256 daysToAdd) external",
    "function makeWish(bytes32 wishHash) external",
    "function festivalClaim(uint8 festivalId) external",
    "function newYearCountdownClaim() external"
  ];
  window.KGEN_HEART_ABI_V326 = HEART_ABI_V326;
  window.KGEN_HEART_CONTRACT = HEART_CONTRACT;
  const $ = (id)=>document.getElementById(id);
  const qa = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  window.RUNTIME_GENOME = Object.assign({}, window.RUNTIME_GENOME || {}, {
    species: "12345-WukongTemple",
    version: VERSION,
    tag: VERSION_TAG,
    ui_patch: UI_PATCH,
    heart_contract: HEART_CONTRACT,
    runtime_file: "modules/runtime-main.js",
    css_file: "modules/runtime-main.css",
    ancestor: "V10.42.6",
    base_from: "V10.44.2",
    evolution: "LAYOUT_REAL_FIX",
    taxonomy: {
      domain: "KGENVERSE",
      kingdom: "FinancialLifeform",
      phylum: "TempleRuntime",
      classis: "WukongSystem",
      order: "HeartEngine",
      family: "MorphDNA",
      genus: "RuntimeMain",
      species: "12345"
    }
  });

  function syncVersion(){
    document.title = "KGEN-12345-HEART-UI-" + VERSION_TAG;
    const brand = document.querySelector(".hud-top .brand-name");
    if(brand){
      brand.textContent = BRAND_LINE1;
      brand.dataset.kgenHudLock = "1";
    }
    const ver = $("ver-st");
    if(ver){
      ver.textContent = VERSION_SHORT;
      ver.setAttribute("data-version", VERSION_TAG);
      ver.dataset.kgenGenomeVersion = VERSION;
      ver.dataset.kgenUiPatch = UI_PATCH;
      ver.title = VERSION_TAG;
    }
  }

  const StatusBus = {
    lines: [],
    maxLines: 6,
    _mirror: "",
    targets: ["kgen-v902-left-status", "kh-log"],
    push(msg, opts){
      const text = String(msg || "").trim();
      if(!text || text === this._mirror) return;
      this._mirror = text;
      const stamp = formatTaipei(new Date()).slice(11);
      const line = stamp + " " + text;
      this.lines.unshift(line);
      if(this.lines.length > this.maxLines) this.lines.length = this.maxLines;
      const show = opts && opts.full ? this.lines.join(" | ") : text;
      this.targets.forEach(id=>{
        const el = $(id);
        if(el && !el.dataset.kgenBusMute){
          el.textContent = show;
        }
      });
    },
    hookExternal(){
      const self = this;
      [["kh-log", ""], ["kgen-land-msg", "[土地] "]].forEach(([id, prefix])=>{
        const el = $(id);
        if(!el || el.dataset.kgenBusHook) return;
        el.dataset.kgenBusHook = "1";
        new MutationObserver(()=>{
          const t = (el.textContent || "").trim();
          if(t && t !== self._mirror) self.push(prefix + t, {full:false});
        }).observe(el, {characterData:true, childList:true, subtree:true});
      });
      window.addEventListener("kgen-status", (e)=>{
        if(e.detail && e.detail.message) self.push(e.detail.message);
      });
    }
  };
  window.KGEN_STATUS_BUS = StatusBus;

  const HudGuard = {
    clockTimer: null,
    init(){
      syncVersion();
      this.guardNode("ver-st", ()=>VERSION_SHORT, (el)=>{
        el.setAttribute("data-version", VERSION_TAG);
        el.title = VERSION_TAG;
      });
      const brand = document.querySelector(".hud-top .brand-name");
      if(brand) this.guardNode(brand, ()=>BRAND_LINE1);
      this.guardClockRoot("sys-clock");
      this.guardClockRoot("kh-utc");
      this.startClock();
    },
    guardClockRoot(id){
      const root = $(id);
      if(!root) return;
      const fix = ()=>{
        this.setupClockShell(id);
        this.tickClock();
      };
      fix();
      if(root.dataset.kgenClockGuard) return;
      root.dataset.kgenClockGuard = "1";
      new MutationObserver(fix).observe(root, {childList:true, characterData:true, subtree:true});
    },
    guardNode(elOrId, getText, extra){
      const el = typeof elOrId === "string" ? $(elOrId) : elOrId;
      if(!el || el.dataset.kgenHudGuard) return;
      el.dataset.kgenHudGuard = "1";
      const fix = ()=>{
        const want = getText();
        if(el.textContent !== want) el.textContent = want;
        if(extra) extra(el);
      };
      fix();
      new MutationObserver(fix).observe(el, {characterData:true, childList:true, subtree:true});
    },
    setupClockShell(id){
      const root = $(id);
      if(!root || root.dataset.kgenHudOwned) return;
      root.dataset.kgenHudOwned = "1";
      root.classList.add(id === "sys-clock" ? "kgen-hud-clock" : "kh-v-time");
      if(!root.querySelector(".kgen-tw-main")){
        root.innerHTML = '<span class="kgen-tw-main">台灣時間：--</span><span class="kgen-utc-sub">UTC：--</span>';
      }
    },
    tickClock(){
      const now = new Date();
      const tw = "台灣時間：" + formatTaipei(now);
      const utc = "UTC：" + formatUTC(now);
      ["sys-clock", "kh-utc"].forEach(id=>{
        const root = $(id);
        if(!root) return;
        const twEl = root.querySelector(".kgen-tw-main");
        const utcEl = root.querySelector(".kgen-utc-sub");
        if(twEl && twEl.textContent !== tw) twEl.textContent = tw;
        if(utcEl && utcEl.textContent !== utc) utcEl.textContent = utc;
      });
    },
    startClock(){
      if(this.clockTimer) return;
      this.tickClock();
      this.clockTimer = setInterval(()=>this.tickClock(), 1000);
    }
  };
  window.KGEN_HUD_GUARD = HudGuard;

  function formatTaipei(date){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    }).formatToParts(date || new Date());
    const g = (t)=> (parts.find(p=>p.type===t)||{}).value || "00";
    return g("year") + "-" + g("month") + "-" + g("day") + " " + g("hour") + ":" + g("minute") + ":" + g("second");
  }

  function formatUTC(date){
    const d = date || new Date();
    return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
  }

  function fmtCountdown(sec){
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }

  function bnNum(v){
    if(v == null) return 0;
    if(typeof v === "number") return v;
    if(v.toNumber) return v.toNumber();
    return Number(v) || 0;
  }

  function closeRightRule(){
    document.body.classList.add("kgen-right-rule-closed");
    document.body.classList.add("kgen-v10-right-info-collapsed");
    document.body.classList.add("kgen-v920-right-info-collapsed");
    const p = $("coord-panel") || document.querySelector(".coord-panel,#right-info-panel,.right-info-panel");
    if(p){
      p.dataset.kgenRightRulePanel = "1";
      p.style.display = "none";
      p.style.visibility = "hidden";
      p.style.pointerEvents = "none";
    }
  }

  function toggleRightRule(){
    const closed = document.body.classList.contains("kgen-right-rule-closed");
    const willOpen = closed;
    const p = $("coord-panel") || document.querySelector(".coord-panel,#right-info-panel,.right-info-panel");
    document.body.classList.toggle("kgen-right-rule-closed", !willOpen);
    document.body.classList.toggle("kgen-v10-right-info-collapsed", !willOpen);
    document.body.classList.toggle("kgen-v920-right-info-collapsed", !willOpen);
    if(p){
      if(willOpen){
        p.style.removeProperty("display");
        p.style.removeProperty("visibility");
        p.style.removeProperty("pointer-events");
      }else{
        p.style.display = "none";
        p.style.visibility = "hidden";
        p.style.pointerEvents = "none";
      }
    }
  }

  function toggleRightRuleWithStatus(){
    toggleRightRule();
    const open = !document.body.classList.contains("kgen-right-rule-closed");
    StatusBus.push(open ? "右側神規已展開" : "右側神規已收合");
  }

  function openHeartPanel(){
    const p = $("kgen-heart-live-panel");
    if(!p){ StatusBus.push("找不到悟空控制台"); return; }
    const hidden = p.style.display === "none" || getComputedStyle(p).display === "none";
    p.style.display = hidden ? "block" : "none";
    StatusBus.push(hidden ? "悟空控制台已展開" : "悟空控制台已收合");
  }

  function openFestivalRules(){
    const p = $("kgen-v102-festival-panel");
    if(!p){ StatusBus.push("找不到規則活動面板"); return; }
    p.classList.toggle("kgen-festival-closed");
    const open = !p.classList.contains("kgen-festival-closed");
    StatusBus.push(open ? "規則活動已展開" : "規則活動已收合");
  }

  function bindRightRuleButton(){
    qa("button,.term-btn,.nav-btn").forEach(btn=>{
      const t = (btn.textContent || "").replace(/\s+/g,"");
      if(/右側神規|神規/.test(t) && !/客服導覽/.test(t)){
        btn.dataset.kgenCell = "right-rule-toggle-cell";
        if(!btn.dataset.kgenRightRuleBound){
          btn.dataset.kgenRightRuleBound = "1";
          btn.addEventListener("click", function(e){
            e.preventDefault();
            e.stopImmediatePropagation();
            toggleRightRuleWithStatus();
            return false;
          }, true);
        }
      }
    });
  }

  function pad(n){return String(n).padStart(2,"0");}
  function nextLocal(m,d,h=0,min=0,s=0){
    const now=new Date();
    let t=new Date(now.getFullYear(),m-1,d,h,min,s,0);
    if(t<=now) t=new Date(now.getFullYear()+1,m-1,d,h,min,s,0);
    return t;
  }
  function fmtSpan(ms){
    ms = Math.max(0, ms || 0);
    const sec = Math.floor(ms / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const clock = pad(h) + ":" + pad(m) + ":" + pad(s);
    return d > 0 ? (d + "天 " + clock) : clock;
  }
  function fmt(ms){
    return fmtSpan(ms);
  }

  const NY_SLOT_IDS = ["kh-ny-slot","kh-ny-countdown","cd-1231","kgen-ny-countdown","human-cd-1231","v714-ny-count"];

  function normalizeCountdownText(t){
    if(!t) return "";
    return String(t)
      .replace(/(\d+)時(\d+)分(\d+)秒/g, (_, h, m, s) => pad(h) + ":" + pad(m) + ":" + pad(s))
      .replace(/(\d+)時(\d+)分/g, (_, h, m) => pad(h) + ":" + pad(m) + ":00")
      .replace(/(\d+)分(\d+)秒/g, (_, m, s) => "00:" + pad(m) + ":" + pad(s));
  }

  const StableCountdown = {
    t:null,
    lastFestival:"",
    lastNy:"",
    tick(){
      const now = Date.now();
      const festText = "跨年 " + fmtSpan(nextLocal(12,31,23,59,59) - now) +
        "｜520 " + fmtSpan(nextLocal(5,20,0,0,0) - now) +
        "｜1111 " + fmtSpan(nextLocal(11,11,0,0,0) - now);
      if(festText !== this.lastFestival){
        this.lastFestival = festText;
        const cd = $("kgen-v102-festival-countdown");
        if(cd) cd.textContent = festText;
      }
      const ny = "距跨年：" + fmtSpan(nextLocal(12,31,23,59,59) - now);
      if(ny !== this.lastNy){
        this.lastNy = ny;
        NY_SLOT_IDS.forEach(id=>{
          const el = $(id);
          if(el) el.textContent = ny;
        });
        qa(".ny-countdown,.kgen-ny-countdown,.v714-ny-line,[class*='ny-count']").forEach(el=>{
          if(el && (el.id === "kgen-v102-festival-countdown")) return;
          if(/跨年|倒數|1231/.test(el.id || "") || /跨年|倒數/.test(el.className || "")){
            el.textContent = ny;
          }
        });
      }
    },
    guardNy(){
      const self = this;
      NY_SLOT_IDS.forEach(id=>{
        const el = $(id);
        if(!el || el.dataset.kgenNyGuard) return;
        el.dataset.kgenNyGuard = "1";
        new MutationObserver(()=>{
          const t = el.textContent || "";
          if(/時|分/.test(t) && self.lastNy){
            el.textContent = self.lastNy;
          }else if(/時|分/.test(t)){
            el.textContent = normalizeCountdownText(t);
          }
        }).observe(el, {characterData:true, childList:true, subtree:true});
      });
    },
    start(){
      if(this.t) clearInterval(this.t);
      this.tick();
      this.guardNy();
      this.t = setInterval(()=>this.tick(), 1000);
    }
  };
  window.PULSAR_HEART_RUNTIME = StableCountdown;

  const MirrorView = {
    mode:"heart",
    assets:{ heart:"./assets/heart.png", front:"./assets/bull-front.png", back:"./assets/bear-rear.png" },
    apply(mode){
      this.mode = mode;
      const img = $("fairy-img");
      const cam = $("cam-view");
      const app = window.app || {};
      try{
        if(app.stream) app.stream.getTracks().forEach(t=>t.stop());
        app.stream = null;
        app.isCam = false;
        app.camMode = null;
        app.kgenCamBusy = false;
      }catch(e){}
      if(cam){ cam.srcObject = null; cam.style.opacity = "0"; }
      if(img){
        img.src = this.assets[mode] || this.assets.heart;
        img.style.opacity = "1";
        img.style.visibility = "visible";
      }
      document.body.classList.remove("kgen-camera-on","kgen-camera-front","kgen-camera-back");
      document.body.classList.toggle("kgen-mirror-front", mode === "front");
      document.body.classList.toggle("kgen-mirror-back", mode === "back");
      const steer = $("steer-input-val");
      if(steer && mode !== "heart"){
        const deg = mode === "front" ? 45 : 135;
        steer.value = String(deg);
        steer.dispatchEvent(new Event("input", {bubbles:true}));
      }
      const cpNum = $("cp-deg-num");
      const cpSide = $("cp-side");
      const kcDir = $("kc-dir");
      const sliderSt = $("k12345-slider-status");
      if(mode === "front"){
        if(cpNum) cpNum.textContent = "45°｜多方";
        if(cpSide) cpSide.textContent = "方向：多方";
        if(kcDir) kcDir.textContent = "方向盤 → 多方K";
        if(sliderSt) sliderSt.textContent = "CORE 角度 45°｜多方｜縮放 100%";
      }else if(mode === "back"){
        if(cpNum) cpNum.textContent = "135°｜空方";
        if(cpSide) cpSide.textContent = "方向：空方";
        if(kcDir) kcDir.textContent = "方向盤 → 空方K";
        if(sliderSt) sliderSt.textContent = "CORE 角度 135°｜空方｜縮放 100%";
      }
      const label = $("wish-label");
      if(label){
        label.textContent = mode === "front" ? "悟空心臟｜前鏡多方" : mode === "back" ? "悟空心臟｜後鏡空方" : "悟空心臟，財氣覺醒";
      }
      StatusBus.push(mode === "front" ? "前鏡多方：已切換 bull-front" : mode === "back" ? "後鏡空方：已切換 bear-rear" : "已恢復心臟核心圖");
    },
    toggleFront(){ this.apply(this.mode === "front" ? "heart" : "front"); },
    toggleBack(){ this.apply(this.mode === "back" ? "heart" : "back"); }
  };
  window.KGEN_MIRROR_VIEW = MirrorView;

  const ScreenRec = {
    state:{ stream:null, recorder:null, chunks:[], active:false },
    openPanel(){
      const p = $("kgen-v902-rec-panel");
      if(p){
        p.classList.add("active");
        StatusBus.push("螢幕錄影面板已開啟");
        return true;
      }
      StatusBus.push("找不到錄影面板");
      return false;
    },
    async start(){
      if(this.state.active && this.state.recorder){
        try{ this.state.recorder.stop(); }catch(e){}
        return;
      }
      const md = navigator.mediaDevices;
      if(!md || !md.getDisplayMedia){
        StatusBus.push("瀏覽器不支援螢幕錄影");
        alert("瀏覽器不支援螢幕錄影");
        return;
      }
      if(!window.MediaRecorder){
        StatusBus.push("瀏覽器不支援 MediaRecorder");
        return;
      }
      try{
        StatusBus.push("螢幕錄影：等待瀏覽器授權…");
        this.state.stream = await md.getDisplayMedia({ video:true, audio:true });
        this.state.chunks = [];
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
        this.state.recorder = new MediaRecorder(this.state.stream, { mimeType:mime });
        this.state.recorder.ondataavailable = (e)=>{ if(e.data && e.data.size) this.state.chunks.push(e.data); };
        this.state.recorder.onstop = ()=>{
          const blob = new Blob(this.state.chunks, { type:"video/webm" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "KGEN-12345-" + Date.now() + ".webm";
          document.body.appendChild(a);
          a.click();
          a.remove();
          try{ this.state.stream && this.state.stream.getTracks().forEach(t=>t.stop()); }catch(e){}
          this.state.active = false;
          StatusBus.push("螢幕錄影已完成並下載");
        };
        this.state.recorder.start(1000);
        this.state.active = true;
        StatusBus.push("螢幕錄影進行中");
      }catch(e){
        StatusBus.push("螢幕錄影未啟動：" + (e && e.message ? e.message : e));
      }
    },
    wire(){
      const map = [
        ["kgen-v902-rec-start", ()=>this.start()],
        ["kgen-v902-rec-stop", ()=>{ if(this.state.recorder && this.state.active) this.state.recorder.stop(); else StatusBus.push("目前沒有正在錄影"); }],
        ["kgen-v902-rec-help", ()=>StatusBus.push("錄影說明：授權螢幕後錄製，停止自動下載 WebM")],
        ["kgen-v902-rec-close", ()=>{ const p=$("kgen-v902-rec-panel"); if(p) p.classList.remove("active"); }]
      ];
      map.forEach(([id, fn])=>{
        const el = $(id);
        if(!el || el.dataset.kgenRecBound) return;
        el.dataset.kgenRecBound = "1";
        el.addEventListener("click", (e)=>{ e.preventDefault(); fn(); }, true);
      });
    }
  };
  window.KGEN_SCREEN_REC = ScreenRec;

  const ActionRouter = {
    inited:false,
    init(){
      if(this.inited) return;
      this.inited = true;
      document.addEventListener("click", (e)=>this.route(e), true);
      ScreenRec.wire();
      this.seizeFooterButtons();
      this.seizeCupButtons();
      this.syncFooterLabels();
      setInterval(()=>{
        this.seizeFooterButtons();
        this.seizeCupButtons();
        this.syncFooterLabels();
        ConsoleUI.ensureButtonsEnabled();
      }, 2000);
    },
    syncFooterLabels(){
      const footer = document.querySelector(".footer-terminal");
      if(!footer) return;
      const btns = [...footer.querySelectorAll("button,.term-btn")].slice(0, 8);
      const labels = ["📸\n拍照","🎥\n錄影","🤳\n前鏡多方","🌌\n後鏡空方","🫀\n悟空心臟","🎬\n螢幕錄影","📜\n規則活動","🛡\n右側神規"];
      btns.forEach((b,i)=>{
        if(labels[i]) b.innerHTML = labels[i].replace("\n","<br>");
      });
    },
    seizeFooterButtons(){
      const footer = document.querySelector(".footer-terminal");
      if(!footer) return;
      [...footer.querySelectorAll("button,.term-btn")].slice(0, 8).forEach((b, idx)=>{
        if(b.dataset.kgenDockSeized === String(idx)) return;
        b.dataset.kgenDockSeized = String(idx);
        b.onclick = null;
        b.removeAttribute("onclick");
        b.addEventListener("click", (e)=>{
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.handleDock(idx);
          return false;
        }, true);
      });
    },
    seizeCupButtons(){
      ["kh-cup-1","kh-cup-2","kh-cup-3","kh-cup-reset"].forEach((id)=>{
        const btn = $(id);
        if(!btn || btn.dataset.kgenCupSeized === "1") return;
        const clone = btn.cloneNode(true);
        clone.id = id;
        clone.dataset.kgenCupSeized = "1";
        btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener("click", (e)=>{
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if(id === "kh-cup-reset") HolyCup.reset();
          else HolyCup.cupPress(Number(id.replace("kh-cup-","")));
          return false;
        }, true);
      });
    },
    route(e){
      const claimLabels = {
        "kh-fortune": "發財金 fortuneClaim",
        "kh-heartbeat": "心跳呼吸 heartbeatClaim",
        "kh-ignite": "轉日 igniteAndClaim",
        "kh-vow": "還願 vowTo",
        "kh-lamp": "點燈 lightLamp",
        "kh-wishbtn": "許願 makeWish"
      };
      const claimBtn = e.target.closest && e.target.closest(Object.keys(claimLabels).join(","));
      if(claimBtn && claimLabels[claimBtn.id]){
        StatusBus.push("已按下：" + claimLabels[claimBtn.id]);
        if(claimBtn.id === "kh-fortune" && !HolyCup.isComplete()){
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          StatusBus.push("發財金：三聖盃未完成（" + HolyCup.count + "/3）");
          return;
        }
        if(!window.ethereum){
          StatusBus.push(claimLabels[claimBtn.id] + "：未連錢包");
        }
      }
      const cupBtn = e.target.closest && e.target.closest("#kh-cup-1,#kh-cup-2,#kh-cup-3,#kh-cup-reset");
      if(cupBtn && cupBtn.dataset.kgenCupSeized !== "1"){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if(cupBtn.id === "kh-cup-reset") HolyCup.reset();
        else HolyCup.cupPress(Number(cupBtn.id.replace("kh-cup-","")));
        return;
      }
    },
    handleDock(idx){
      const actions = [
        ()=>{ try{ window.app && window.app.capture && window.app.capture(); StatusBus.push("拍照存證"); }catch(e){ StatusBus.push("拍照：執行失敗"); }},
        ()=>{ try{ window.app && window.app.toggleRec && window.app.toggleRec(); StatusBus.push("留影錄影切換"); }catch(e){ StatusBus.push("留影錄影：執行失敗"); }},
        ()=>MirrorView.toggleFront(),
        ()=>MirrorView.toggleBack(),
        ()=>openHeartPanel(),
        ()=>{ ScreenRec.openPanel(); ScreenRec.start(); },
        ()=>openFestivalRules(),
        ()=>toggleRightRuleWithStatus()
      ];
      if(actions[idx]) actions[idx]();
    }
  };
  window.KGEN_ACTION_ROUTER = ActionRouter;

  function moveFestivalBelowAudio(){
    const panel = $("kgen-v102-festival-panel");
    const nav = $("universe-nav");
    if(!panel || !nav) return;

    panel.classList.add("kgen-layout-fixed");
    panel.dataset.kgenOrgan = "festival-organ";

    const audio = qa("button,.nav-btn", nav).find(x=>/音效|說明/.test(x.textContent || ""));
    if(panel.parentElement !== nav){
      if(audio && audio.nextSibling) nav.insertBefore(panel, audio.nextSibling);
      else nav.appendChild(panel);
    }
    if(audio && panel.previousElementSibling !== audio){
      if(audio.nextSibling) nav.insertBefore(panel, audio.nextSibling);
      else nav.appendChild(panel);
    }

    const h = panel.querySelector("h3");
    if(h){
      h.innerHTML = '520 / 1111 / 跨年活動 <span style="float:right">展開</span>';
      h.onclick = function(){
        panel.classList.toggle("kgen-festival-closed");
        const span = h.querySelector("span");
        if(span) span.textContent = panel.classList.contains("kgen-festival-closed") ? "展開" : "收合";
      };
    }
    panel.classList.add("kgen-festival-closed");
    qa("button", panel).forEach(btn=>{
      btn.dataset.kgenCell = "festival-button-cell";
    });
  }

  const HolyCup = {
    count:0,
    max:3,
    legacyKeys:[CUP_KEY, "KGEN_12345_V907_CUP_COUNT", "KGEN_12345_V908_CUP_COUNT"],
    load(){
      let n = 0;
      this.legacyKeys.forEach(k=>{
        n = Math.max(n, Number(localStorage.getItem(k) || "0") || 0);
      });
      if(window.__templeCupCount != null) n = Math.max(n, Number(window.__templeCupCount) || 0);
      this.count = Math.min(this.max, Math.max(0, n));
    },
    save(){
      this.legacyKeys.forEach(k=>localStorage.setItem(k, String(this.count)));
      window.__templeCupCount = this.count;
    },
    isComplete(){
      this.load();
      return this.count >= this.max;
    },
    statusText(){
      this.load();
      if(this.count >= this.max) return "聖盃完成，可以領取";
      return this.count + "/3";
    },
    render(){
      this.load();
      const text = this.statusText();
      ["v57-cup-status","v714-cup-status","v715-cup-status","v715-cup-log","kh-cup-status"].forEach(id=>{
        const el=$(id);
        if(el){
          el.textContent = text;
          el.dataset.kgenOrgan = "holycup-organ";
          el.dataset.kgenCupCount = String(this.count);
        }
      });
      [1,2,3].forEach(n=>{
        const btn = $("kh-cup-" + n);
        if(!btn) return;
        btn.dataset.kgenCupOwned = "1";
        const done = this.count >= n;
        const next = this.count === n - 1;
        btn.classList.toggle("done", done);
        btn.classList.toggle("kh-cup-next", next);
        btn.disabled = false;
        btn.textContent = "聖盃" + (n===1?"一":n===2?"二":"三") + (done ? " ✓" : "");
      });
      if(ConsoleUI.refreshFortuneStatus) ConsoleUI.refreshFortuneStatus();
    },
    cupPress(n){
      this.load();
      if(this.count >= this.max){
        StatusBus.push("聖盃已完成，可以領取");
        return false;
      }
      if(this.count !== n - 1){
        StatusBus.push(this.count < n - 1 ? "請依序完成聖盃 " + (this.count + 1) + "/3" : "此聖盃已完成");
        this.render();
        return false;
      }
      this.count = n;
      this.save();
      StatusBus.push("聖盃進度 " + this.count + "/3");
      this.render();
      return false;
    },
    reset(){
      this.count = 0;
      this.save();
      StatusBus.push("聖盃已重置");
      this.render();
      return false;
    }
  };
  window.KGEN_HOLYCUP_RUNTIME = HolyCup;

  const ConsoleUI = {
    timer:null,
    chainTimer:null,
    state:{ blockTs:0, address:null, chainId:null, bnbBal:null, heartData:null, readError:null },

    start(){
      this.refreshChain();
      if(this.chainTimer) clearInterval(this.chainTimer);
      this.chainTimer = setInterval(()=>this.refreshChain(), 12000);
      this.bindAmountInput();
      this.bindActionLogs();
      this.relabelButtons();
      this.fixWish();
      this.guardCupStatus();
      this.ensureButtonsEnabled();
      if(this.displayTimer) clearInterval(this.displayTimer);
      this.displayTimer = setInterval(()=>{
        this.updateHeartbeatDisplay();
        this.updateIgniteDisplay();
        this.ensureButtonsEnabled();
      }, 1000);
    },

    ensureButtonsEnabled(){
      ["kh-fortune","kh-heartbeat","kh-ignite","kh-vow","kh-lamp","kh-wishbtn","kh-cup-1","kh-cup-2","kh-cup-3"].forEach(id=>{
        const el = $(id);
        if(!el) return;
        el.disabled = false;
        el.removeAttribute("disabled");
      });
    },

    guardCupStatus(){
      const el = $("kh-cup-status");
      if(!el || el.dataset.kgenCupGuard) return;
      el.dataset.kgenCupGuard = "1";
      const fix = ()=>{
        HolyCup.load();
        const want = HolyCup.statusText();
        if(el.textContent !== want) el.textContent = want;
        if(el.dataset.kgenCupCount !== String(HolyCup.count)){
          el.dataset.kgenCupCount = String(HolyCup.count);
        }
      };
      fix();
      new MutationObserver(fix).observe(el, {characterData:true, childList:true, subtree:true});
    },

    bindActionLogs(){
      const map = [
        ["kh-connect", "錢包：連線 / 切換 BSC"],
        ["kh-refresh", "錢包：刷新餘額"],
        ["kh-approve-current", "Approve：授權目前金額"],
        ["kh-approve-unlimited", "Approve：無限授權"]
      ];
      map.forEach(([id, label])=>{
        const btn = $(id);
        if(!btn || btn.dataset.kgenBusLog) return;
        btn.dataset.kgenBusLog = "1";
        btn.addEventListener("click", ()=>StatusBus.push("已按下：" + label), true);
      });
    },

    providerRO(){
      if(!window.ethers || !ethers.providers) return null;
      return new ethers.providers.JsonRpcProvider(CHAIN.RPC);
    },

    async refreshChain(){
      if(!window.ethers){
        this.state.readError = "no-ethers";
        this.setStatus("kh-heartbeat-status", "心跳呼吸：等待鏈上資料");
        this.setStatus("kh-fortune-status", "發財金：等待鏈上資料");
        this.setStatus("kh-ignite-status", "轉日呼吸：等待鏈上資料");
        return;
      }
      try{
        const provider = this.providerRO();
        if(!provider) throw new Error("provider");
        const block = await provider.getBlock("latest");
        this.state.blockTs = block?.timestamp || Math.floor(Date.now() / 1000);

        let address = null;
        let chainId = null;
        let bnbBal = null;
        if(window.ethereum){
          try{
            const accounts = await window.ethereum.request({ method:"eth_accounts" });
            if(accounts && accounts[0]) address = accounts[0];
            chainId = await window.ethereum.request({ method:"eth_chainId" });
            if(address && String(chainId).toLowerCase() === CHAIN.BSC){
              bnbBal = await provider.getBalance(address);
            }
          }catch(e){}
        }

        const heart = new ethers.Contract(CHAIN.HEART, HEART_VIEW_ABI, provider);
        const kgenAddr = await heart.kgen();
        const token = new ethers.Contract(kgenAddr || CHAIN.KGEN, ERC20_VIEW_ABI, provider);
        const dec = Number(await token.decimals().catch(()=>18));
        const heartBal = await token.balanceOf(CHAIN.HEART);

        const [
          heartbeatCooldown, fortuneCooldown, igniteStart, igniteEnd,
          fortuneMin, fortuneMax, fortuneCapEnabled, fortuneEpochMax,
          epochIndex, tod, dayIndex
        ] = await Promise.all([
          heart.heartbeatCooldownSeconds(),
          heart.fortuneCooldownSeconds(),
          heart.igniteWindowStart(),
          heart.igniteWindowEnd(),
          heart.fortuneMin(),
          heart.fortuneMax(),
          heart.fortuneCapEnabled(),
          heart.fortuneEpochMaxClaims(),
          heart.currentFortuneEpochIndex(),
          heart.timeOfDaySeconds(),
          heart.currentDayIndex()
        ]);

        const user = { lastHb:0, lastFortune:0, lastIgniteDay:0, epochClaims:0, allowance:null };
        if(address){
          user.lastHb = await heart.lastHeartbeatAt(address);
          user.lastFortune = await heart.lastFortuneAt(address);
          user.lastIgniteDay = await heart.lastIgniteDay(address);
          user.epochClaims = await heart.fortuneEpochClaims(epochIndex);
          user.allowance = await token.allowance(address, CHAIN.HEART);
        }

        this.state.address = address;
        this.state.chainId = chainId;
        this.state.bnbBal = bnbBal;
        this.state.readError = null;
        this.state.heartData = {
          heartbeatCooldown: bnNum(heartbeatCooldown),
          fortuneCooldown: bnNum(fortuneCooldown),
          igniteStart: bnNum(igniteStart),
          igniteEnd: bnNum(igniteEnd),
          fortuneMin: bnNum(fortuneMin),
          fortuneMax: bnNum(fortuneMax),
          fortuneCapEnabled: !!fortuneCapEnabled,
          fortuneEpochMax: bnNum(fortuneEpochMax),
          epochIndex: bnNum(epochIndex),
          tod: bnNum(tod),
          dayIndex: bnNum(dayIndex),
          heartBal,
          dec,
          user
        };

        this.refreshFortuneStatus();
        this.updateHeartbeatDisplay();
        this.updateIgniteDisplay();
      }catch(e){
        console.warn("[KGEN Console]", e);
        this.state.readError = e;
        this.setStatus("kh-heartbeat-status", "心跳呼吸：等待鏈上資料");
        this.setStatus("kh-fortune-status", "發財金：等待鏈上資料");
        this.setStatus("kh-ignite-status", "轉日呼吸：等待鏈上資料");
      }
    },

    setStatus(id, text){
      const el = $(id);
      if(el) el.textContent = text;
    },

    updateHeartbeatDisplay(){
      const el = $("kh-heartbeat-status");
      const btn = $("kh-heartbeat");
      if(!el) return;
      if(btn){ btn.disabled = false; btn.removeAttribute("disabled"); }
      if(!this.state.heartData || this.state.readError){
        el.textContent = "心跳呼吸：等待鏈上資料";
        return;
      }
      if(!this.state.address){
        el.textContent = "心跳呼吸：未連錢包";
        return;
      }
      if(String(this.state.chainId).toLowerCase() !== CHAIN.BSC){
        el.textContent = "心跳呼吸：錢包不在 BSC";
        return;
      }
      const now = this.state.blockTs || Math.floor(Date.now() / 1000);
      const cd = this.state.heartData.heartbeatCooldown;
      const last = bnNum(this.state.heartData.user.lastHb);
      const next = last > 0 ? last + cd : now;
      if(now >= next){
        el.textContent = "心跳呼吸：可領";
      }else{
        el.textContent = "心跳呼吸：倒數 " + fmtCountdown(next - now);
      }
    },

    updateIgniteDisplay(){
      const el = $("kh-ignite-status");
      const openEl = $("kh-ignite-open");
      const btn = $("kh-ignite");
      if(!el) return;
      if(btn){ btn.disabled = false; btn.removeAttribute("disabled"); }
      const hint = "鏈上重置：UTC 00:00｜台灣可領：每日 08:00";
      if(!this.state.heartData || this.state.readError){
        el.textContent = "轉日呼吸：等待鏈上資料";
        return;
      }
      const d = this.state.heartData;
      const now = this.state.blockTs || Math.floor(Date.now() / 1000);
      const inWindow = d.tod >= d.igniteStart && d.tod <= d.igniteEnd;
      if(openEl) openEl.textContent = inWindow ? "OPEN UTC 00:00–00:10" : "CLOSED";

      if(!this.state.address){
        el.textContent = "轉日呼吸：未連錢包｜" + hint;
        return;
      }
      if(String(this.state.chainId).toLowerCase() !== CHAIN.BSC){
        el.textContent = "轉日呼吸：錢包不在 BSC｜" + hint;
        return;
      }

      const lastDay = bnNum(d.user.lastIgniteDay);
      const alreadyToday = lastDay === d.dayIndex;
      if(inWindow && !alreadyToday){
        el.textContent = "轉日呼吸：可領｜" + hint;
      }else if(inWindow && alreadyToday){
        const nextDayStart = (d.dayIndex + 1) * 86400;
        el.textContent = "轉日呼吸：倒數 " + fmtCountdown(nextDayStart - now) + "｜" + hint;
      }else{
        const dayStart = d.dayIndex * 86400;
        const windowStart = dayStart + d.igniteStart;
        const target = now < windowStart ? windowStart : (d.dayIndex + 1) * 86400 + d.igniteStart;
        el.textContent = "轉日呼吸：倒數 " + fmtCountdown(target - now) + "｜" + hint;
      }
    },

    getFortuneAmount(){
      const v = ($("kh-amount")?.value || "8").trim();
      if(!/^\d+$/.test(v)) return null;
      return Number(v);
    },

    getFortuneBlockReasons(){
      const r = [];
      if(!this.state.address) return ["未連錢包"];
      if(String(this.state.chainId).toLowerCase() !== CHAIN.BSC) return ["錢包不在 BSC"];
      if(!HolyCup.isComplete()) return ["三聖盃未完成"];

      const minGas = ethers.utils.parseEther("0.0003");
      if(this.state.bnbBal != null && this.state.bnbBal.lt(minGas)) r.push("BNB gas 不足");

      if(!this.state.heartData) return ["等待鏈上資料"];
      const d = this.state.heartData;
      const now = this.state.blockTs || Math.floor(Date.now() / 1000);
      const lastF = bnNum(d.user.lastFortune);
      const nextF = lastF + d.fortuneCooldown;
      if(lastF > 0 && now < nextF) r.push("合約目前不可領（冷卻倒數 " + fmtCountdown(nextF - now) + "）");

      const amountWhole = this.getFortuneAmount();
      if(amountWhole == null) r.push("合約目前不可領（金額格式錯誤）");
      else if(amountWhole < d.fortuneMin || amountWhole > d.fortuneMax){
        r.push("合約目前不可領（金額須 " + d.fortuneMin + "–" + d.fortuneMax + "）");
      }

      if(d.fortuneCapEnabled){
        const claims = bnNum(d.user.epochClaims);
        if(claims >= d.fortuneEpochMax) r.push("已被領完 / 餘額不足");
      }

      if(amountWhole != null && d.heartBal){
        const need = ethers.utils.parseUnits(String(amountWhole), d.dec || 18);
        if(d.heartBal.lt(need)) r.push("已被領完 / 餘額不足");
      }

      return r;
    },

    refreshFortuneStatus(){
      const el = $("kh-fortune-status");
      const btn = $("kh-fortune");
      if(!el) return;
      if(btn){ btn.disabled = false; btn.removeAttribute("disabled"); }

      if(!HolyCup.isComplete()){
        HolyCup.load();
        el.textContent = "發財金：需要聖盃（" + HolyCup.count + "/3）";
        if(btn) btn.title = "三聖盃未完成（仍可點擊查看原因）";
        return;
      }

      if(!this.state.heartData || this.state.readError){
        el.textContent = "發財金：等待鏈上資料";
        if(btn) btn.title = "等待鏈上資料";
        return;
      }

      const reasons = this.getFortuneBlockReasons().filter(r=>r !== "三聖盃未完成");
      if(reasons.length === 0){
        el.textContent = "發財金：可領";
        if(btn) btn.title = "";
      }else{
        el.textContent = "發財金：鏈上條件 — " + reasons[0];
        if(btn) btn.title = reasons.join("；");
      }
    },

    bindCupButtons(){
      /* cup clicks owned by ActionRouter.seizeCupButtons */
    },

    bindAmountInput(){
      const amt = $("kh-amount");
      if(amt && !amt.dataset.kgenBound){
        amt.dataset.kgenBound = "1";
        amt.addEventListener("input", ()=>this.refreshFortuneStatus());
      }
    },

    relabelButtons(){
      qa("button").forEach(b=>{
        const t = (b.textContent || "").trim();
        if((t === "fortuneClaim" || t.includes("fortuneClaim")) && !t.includes("發財金")){
          b.textContent = "領發財金 fortuneClaim";
        }
        if((t === "heartbeatClaim" || t.includes("heartbeatClaim")) && !t.includes("心跳")){
          b.textContent = "呼吸 / 心跳 heartbeatClaim";
        }
        if((t === "igniteAndClaim" || t.includes("igniteAndClaim")) && !t.includes("轉日")){
          b.textContent = "轉日呼吸 igniteAndClaim";
        }
      });
    },

    fixWish(){
      const btn = qa("button").find(b=>(b.textContent||"").includes("makeWish"));
      if(!btn || btn.dataset.kgenWishFix) return;
      btn.dataset.kgenWishFix = "1";
      btn.addEventListener("click", function(e){
        const input = $("kh-wish");
        if(input && !(input.value || "").trim()){
          e.preventDefault();
          e.stopImmediatePropagation();
          alert("請先輸入願望文字；空願望會造成 HASH_ZERO。");
          return false;
        }
      }, true);
    }
  };
  window.KGEN_CONSOLE_UI = ConsoleUI;

  function bindHolyCup(){
    const old = window.templeOps || {};
    window.templeOps = Object.assign({}, old, {
      cup: ()=>{ HolyCup.load(); return HolyCup.cupPress(Math.min(3, HolyCup.count + 1)); },
      resetCup: ()=>HolyCup.reset()
    });
    [1,2,3].forEach(n=>{
      const btn = $("kh-cup-" + n);
      if(btn && !btn.dataset.kgenNavBound){
        btn.dataset.kgenNavBound = "1";
      }
    });
    qa("button,.term-btn,.nav-btn,.v714-cup").forEach(btn=>{
      const t=(btn.textContent||"").replace(/\s+/g,"");
      if(/三次聖盃|請示聖盃|聖盃一|聖盃二|聖盃三/.test(t) && !/重置/.test(t) && !btn.id.startsWith("kh-cup-")){
        btn.dataset.kgenCell = "holycup-button-cell";
        btn.onclick = function(e){
          e && e.preventDefault && e.preventDefault();
          e && e.stopPropagation && e.stopPropagation();
          return HolyCup.cupPress(Math.min(3, HolyCup.count + 1));
        };
      }
      if(/重置聖盃|重置/.test(t) && btn.closest && (btn.closest(".v714-cupbox") || btn.closest("#kgen-heart-live-panel"))){
        btn.onclick = function(e){
          e && e.preventDefault && e.preventDefault();
          e && e.stopPropagation && e.stopPropagation();
          return HolyCup.reset();
        };
      }
    });
  }

  function tagCells(){
    qa("button,.term-btn,.nav-btn,input,select").forEach((el,i)=>{
      if(!el.dataset.kgenCell) el.dataset.kgenCell = "cell-" + i;
    });
    qa("#kgen-heart-live-panel,#kgen-v102-festival-panel,#kgen-land-panel,#kgen-land-info-panel,#coord-panel,.panel,.hud-box,.bp-panel").forEach((el,i)=>{
      if(!el.dataset.kgenOrgan) el.dataset.kgenOrgan = "organ-" + i;
    });
  }

  let KgenLandRuntime = null;

  function bootLandEngine(){
    if(!window.KGEN_LAND_ENGINE){
      console.warn("[KGEN Land] engine script missing");
      return;
    }
    if(!KgenLandRuntime){
      KgenLandRuntime = window.KGEN_LAND_ENGINE.create({
        universeId: "12345",
        gridSize: 20,
        dataUrl: "data/kgen-land-demo.json",
        demoPlayer: "demo-player",
        landIdPrefix: "WUKONG"
      });
      window.KGEN_LAND_DEMO = KgenLandRuntime;
      window.KGEN_LAND_RUNTIME = KgenLandRuntime;
    }
    KgenLandRuntime.init().catch(err=>console.warn("[KGEN Land Engine]", err));
  }

  function ensureLandEngine(){
    if(KgenLandRuntime) KgenLandRuntime.ensure();
  }

  function dedupeCupUI(){
    const panel = $("kgen-heart-live-panel");
    const keep = panel && panel.querySelector(".kh-actions-cup");
    if(keep){
      qa("[id^='kh-cup-']", panel).forEach(el=>{
        if(!keep.contains(el)){
          el.id = el.id + "-legacy";
          el.style.display = "none";
          el.setAttribute("aria-hidden", "true");
          el.dataset.kgenCupLegacy = "1";
        }
      });
    }
    const injected = $("kh-cupbox");
    if(injected) injected.remove();
    qa("[id^='kh-cup-']").forEach(el=>{
      if(panel && !panel.contains(el)){
        el.id = el.id + "-legacy";
        el.style.display = "none";
        el.setAttribute("aria-hidden", "true");
        el.dataset.kgenCupLegacy = "1";
      }
    });
  }

  function boot(){
    HudGuard.init();
    StatusBus.hookExternal();
    closeRightRule();
    bindRightRuleButton();
    moveFestivalBelowAudio();
    dedupeCupUI();
    bindHolyCup();
    HolyCup.load();
    HolyCup.render();
    ActionRouter.init();
    ConsoleUI.start();
    StableCountdown.start();
    tagCells();
    bootLandEngine();
    StatusBus.push("悟空財神殿 Heart V3.2.6 控制台就緒");
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.addEventListener("load", ()=>{
    setTimeout(()=>{
      HudGuard.init();
      if(window.KGEN_CONSOLE_UI) window.KGEN_CONSOLE_UI.start();
      StatusBus.hookExternal();
    }, 900);
  });

  setTimeout(boot,500);
  setTimeout(boot,1800);
  setInterval(()=>{
    moveFestivalBelowAudio();
    ensureLandEngine();
    bindRightRuleButton();
    dedupeCupUI();
    bindHolyCup();
    HolyCup.render();
    ConsoleUI.ensureButtonsEnabled();
    ConsoleUI.refreshFortuneStatus();
    ActionRouter.seizeFooterButtons();
    ActionRouter.seizeCupButtons();
    tagCells();
  },3000);
})();
