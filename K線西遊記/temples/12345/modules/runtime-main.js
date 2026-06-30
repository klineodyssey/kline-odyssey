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
  const VERSION_TAG = "12345-TEMPLE-V10.49.1-LAND-UI-V1.0.3";
  const VERSION_SHORT = "V10.49.1 / LAND V1.0 / BSC56";
  const BRAND_LINE1 = "KGEN 12345 五指山悟空財神殿";
  const UI_PATCH = "V1.0.3";
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
    const p = $("coord-panel") || document.querySelector(".coord-panel,#right-info-panel,.right-info-panel");
    document.body.classList.toggle("kgen-right-rule-closed", !closed);
    document.body.classList.toggle("kgen-v10-right-info-collapsed", !closed);
    document.body.classList.toggle("kgen-v920-right-info-collapsed", !closed);
    if(p){
      p.style.display = closed ? "block" : "none";
      p.style.visibility = closed ? "visible" : "hidden";
      p.style.pointerEvents = closed ? "auto" : "none";
    }
  }

  function bindRightRuleButton(){
    qa("button,.term-btn,.nav-btn").forEach(btn=>{
      const t = (btn.textContent || "").replace(/\s+/g,"");
      if(/右側神規|神規|客服導覽/.test(t)){
        btn.dataset.kgenCell = "right-rule-toggle-cell";
        btn.textContent = "🛡 右側神規";
        btn.onclick = function(e){
          e && e.preventDefault && e.preventDefault();
          e && e.stopPropagation && e.stopPropagation();
          toggleRightRule();
          return false;
        };
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
  function fmt(ms){
    ms=Math.max(0,ms||0);
    const total=Math.floor(ms/60000);
    const days=Math.floor(total/1440);
    const h=Math.floor((total%1440)/60);
    const m=total%60;
    return days + "天 " + pad(h) + "時" + pad(m) + "分";
  }

  const StableCountdown = {
    t:null,
    lastFestival:"",
    lastNy:"",
    tick(){
      const now=Date.now();
      const festText = "跨年 " + fmt(nextLocal(12,31,23,59,59)-now) +
        "｜520 " + fmt(nextLocal(5,20,0,0,0)-now) +
        "｜1111 " + fmt(nextLocal(11,11,0,0,0)-now);
      if(festText !== this.lastFestival){
        this.lastFestival = festText;
        const cd = $("kgen-v102-festival-countdown");
        if(cd) cd.textContent = festText;
      }
      const nyMs = Math.max(0, nextLocal(12,31,23,59,59)-now);
      const totalMin = Math.floor(nyMs / 60000);
      const nyD = Math.floor(totalMin / 1440);
      const nyH = Math.floor((totalMin % 1440) / 60);
      const nyM = totalMin % 60;
      const ny = "距跨年：" + pad(nyD) + "天 " + pad(nyH) + "時" + pad(nyM) + "分";
      if(ny !== this.lastNy){
        this.lastNy = ny;
        ["kh-ny-slot","kh-ny-countdown","cd-1231","kgen-ny-countdown"].forEach(id=>{
          const el=$(id);
          if(el) el.textContent = ny;
        });
      }
    },
    start(){
      if(this.t) clearInterval(this.t);
      this.tick();
      this.t = setInterval(()=>this.tick(), 1000);
    }
  };
  window.PULSAR_HEART_RUNTIME = StableCountdown;

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
    load(){
      const raw = Number(localStorage.getItem(CUP_KEY) || "0") || 0;
      this.count = Math.min(this.max, Math.max(0, raw));
    },
    save(){
      localStorage.setItem(CUP_KEY, String(this.count));
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
        const done = this.count >= n;
        const next = this.count === n - 1;
        btn.classList.toggle("done", done);
        btn.classList.toggle("kh-cup-next", next);
        btn.disabled = done;
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
      this.bindCupButtons();
      this.bindAmountInput();
      this.bindFortuneGuard();
      this.bindActionLogs();
      this.relabelButtons();
      this.fixWish();
      this.guardCupStatus();
      if(this.displayTimer) clearInterval(this.displayTimer);
      this.displayTimer = setInterval(()=>{
        this.updateHeartbeatDisplay();
        this.updateIgniteDisplay();
      }, 1000);
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
        ["kh-approve-unlimited", "Approve：無限授權"],
        ["kh-fortune", "發財金 fortuneClaim"],
        ["kh-heartbeat", "心跳 heartbeatClaim"],
        ["kh-ignite", "轉日 igniteAndClaim"],
        ["kh-vow", "還願 vowTo"],
        ["kh-lamp", "點燈 lightLamp"],
        ["kh-wishbtn", "許願 makeWish"]
      ];
      map.forEach(([id, label])=>{
        const btn = $(id);
        if(!btn || btn.dataset.kgenBusLog) return;
        btn.dataset.kgenBusLog = "1";
        btn.addEventListener("click", ()=>StatusBus.push("已按下：" + label), true);
      });
    },

    bindFortuneGuard(){
      const btn = $("kh-fortune");
      if(!btn || btn.dataset.kgenFortuneGuard) return;
      btn.dataset.kgenFortuneGuard = "1";
      btn.addEventListener("click", (e)=>{
        if(!HolyCup.isComplete()){
          e.preventDefault();
          e.stopImmediatePropagation();
          StatusBus.push("發財金：三聖盃未完成（" + HolyCup.count + "/3）");
          alert("請先完成三聖盃（目前 " + HolyCup.count + "/3）");
          return false;
        }
        const reasons = this.getFortuneBlockReasons().filter(r=>r !== "三聖盃未完成");
        if(reasons.length){
          StatusBus.push("發財金：鏈上條件 — " + reasons.join("；"));
          if(!confirm("鏈上可能無法領取：\n" + reasons.join("\n") + "\n\n仍要送出交易？")){
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
        }
      }, true);
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
      if(!this.state.heartData || this.state.readError){
        el.textContent = "心跳呼吸：等待鏈上資料";
        if(btn) btn.disabled = true;
        return;
      }
      if(!this.state.address){
        el.textContent = "心跳呼吸：未連錢包";
        if(btn) btn.disabled = true;
        return;
      }
      if(String(this.state.chainId).toLowerCase() !== CHAIN.BSC){
        el.textContent = "心跳呼吸：錢包不在 BSC";
        if(btn) btn.disabled = true;
        return;
      }
      const now = this.state.blockTs || Math.floor(Date.now() / 1000);
      const cd = this.state.heartData.heartbeatCooldown;
      const last = bnNum(this.state.heartData.user.lastHb);
      const next = last > 0 ? last + cd : now;
      if(now >= next){
        el.textContent = "心跳呼吸：可領";
        if(btn) btn.disabled = false;
      }else{
        el.textContent = "心跳呼吸：倒數 " + fmtCountdown(next - now);
        if(btn) btn.disabled = true;
      }
    },

    updateIgniteDisplay(){
      const el = $("kh-ignite-status");
      const openEl = $("kh-ignite-open");
      const btn = $("kh-ignite");
      if(!el) return;
      const hint = "鏈上重置：UTC 00:00｜台灣可領：每日 08:00";
      if(!this.state.heartData || this.state.readError){
        el.textContent = "轉日呼吸：等待鏈上資料";
        if(btn) btn.disabled = true;
        return;
      }
      const d = this.state.heartData;
      const now = this.state.blockTs || Math.floor(Date.now() / 1000);
      const inWindow = d.tod >= d.igniteStart && d.tod <= d.igniteEnd;
      if(openEl) openEl.textContent = inWindow ? "OPEN UTC 00:00–00:10" : "CLOSED";

      if(!this.state.address){
        el.textContent = "轉日呼吸：未連錢包｜" + hint;
        if(btn) btn.disabled = true;
        return;
      }
      if(String(this.state.chainId).toLowerCase() !== CHAIN.BSC){
        el.textContent = "轉日呼吸：錢包不在 BSC｜" + hint;
        if(btn) btn.disabled = true;
        return;
      }

      const lastDay = bnNum(d.user.lastIgniteDay);
      const alreadyToday = lastDay === d.dayIndex;
      if(inWindow && !alreadyToday){
        el.textContent = "轉日呼吸：可領｜" + hint;
        if(btn) btn.disabled = false;
      }else if(inWindow && alreadyToday){
        const nextDayStart = (d.dayIndex + 1) * 86400;
        el.textContent = "轉日呼吸：倒數 " + fmtCountdown(nextDayStart - now) + "｜" + hint;
        if(btn) btn.disabled = true;
      }else{
        const dayStart = d.dayIndex * 86400;
        const windowStart = dayStart + d.igniteStart;
        const target = now < windowStart ? windowStart : (d.dayIndex + 1) * 86400 + d.igniteStart;
        el.textContent = "轉日呼吸：倒數 " + fmtCountdown(target - now) + "｜" + hint;
        if(btn) btn.disabled = true;
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

      if(!HolyCup.isComplete()){
        HolyCup.load();
        el.textContent = "發財金：需要聖盃（" + HolyCup.count + "/3）";
        if(btn){ btn.disabled = true; btn.title = "三聖盃未完成"; }
        return;
      }

      if(!this.state.heartData || this.state.readError){
        el.textContent = "發財金：等待鏈上資料";
        if(btn){ btn.disabled = false; btn.title = "等待鏈上資料"; }
        return;
      }

      const reasons = this.getFortuneBlockReasons().filter(r=>r !== "三聖盃未完成");
      if(reasons.length === 0){
        el.textContent = "發財金：可領";
        if(btn){ btn.disabled = false; btn.title = ""; }
      }else{
        el.textContent = "發財金：鏈上條件 — " + reasons[0];
        if(btn){ btn.disabled = false; btn.title = reasons.join("；"); }
      }
    },

    bindCupButtons(){
      [1,2,3].forEach(n=>{
        const btn = $("kh-cup-" + n);
        if(btn && !btn.dataset.kgenBound){
          btn.dataset.kgenBound = "1";
          btn.onclick = ()=>HolyCup.cupPress(n);
        }
      });
      const resetBtn = $("kh-cup-reset");
      if(resetBtn && !resetBtn.dataset.kgenBound){
        resetBtn.dataset.kgenBound = "1";
        resetBtn.onclick = ()=>HolyCup.reset();
      }
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

  function boot(){
    HudGuard.init();
    StatusBus.hookExternal();
    closeRightRule();
    bindRightRuleButton();
    moveFestivalBelowAudio();
    bindHolyCup();
    HolyCup.load();
    HolyCup.render();
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
    bindHolyCup();
    HolyCup.render();
    ConsoleUI.bindCupButtons();
    ConsoleUI.bindAmountInput();
    ConsoleUI.bindFortuneGuard();
    tagCells();
  },3000);
})();
