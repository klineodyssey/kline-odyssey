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
  const VERSION_TAG = "12345-TEMPLE-V10.49.1-LAND-UI-V1.0.2";
  const VERSION_SHORT = "V10.49.1 / LAND V1.0 / BSC56";
  const BRAND_LINE1 = "KGEN 12345 五指山悟空財神殿";
  const UI_PATCH = "V1.0.2";
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
    "function decimals() view returns (uint8)"
  ];
  const $ = (id)=>document.getElementById(id);
  const qa = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  window.RUNTIME_GENOME = Object.assign({}, window.RUNTIME_GENOME || {}, {
    species: "12345-WukongTemple",
    version: VERSION,
    tag: VERSION_TAG,
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
    if(brand) brand.textContent = BRAND_LINE1;
    const ver = $("ver-st");
    if(ver){
      ver.textContent = VERSION_SHORT;
      ver.setAttribute("data-version", VERSION_TAG);
      ver.dataset.kgenGenomeVersion = VERSION;
      ver.dataset.kgenUiPatch = UI_PATCH;
      ver.title = VERSION_TAG;
    }
  }

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

  const Clock = {
    t:null,
    last:"",
    tick(){
      const now=Date.now();
      const text = "跨年 " + fmt(nextLocal(12,31,23,59,59)-now) +
        "｜520 " + fmt(nextLocal(5,20,0,0,0)-now) +
        "｜1111 " + fmt(nextLocal(11,11,0,0,0)-now);
      if(text !== this.last){
        this.last = text;
        const cd = $("kgen-v102-festival-countdown");
        if(cd) cd.textContent = text;
      }
      const ny = "距跨年：" + fmt(nextLocal(12,31,23,59,59)-now);
      ["kh-ny-slot","kh-ny-countdown","cd-1231","kgen-ny-countdown"].forEach(id=>{
        const el=$(id);
        if(el) el.textContent = ny;
      });
    },
    start(){
      if(this.t) clearInterval(this.t);
      this.tick();
      this.t = setInterval(()=>this.tick(), 1000);
    }
  };
  window.PULSAR_HEART_RUNTIME = Clock;

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
    labels:["聖盃一","聖盃二","聖盃三"],
    load(){
      this.count = Math.min(this.max, Number(localStorage.getItem(CUP_KEY) || "0") || 0);
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
      if(this.count >= this.max) return "聖盃完成，可以領取。";
      return this.count + "/3";
    },
    render(msg){
      this.load();
      const text = this.statusText() + (msg ? "｜" + msg : "");
      ["v57-cup-status","v714-cup-status","v715-cup-status","v715-cup-log","kh-cup-status"].forEach(id=>{
        const el=$(id);
        if(el){
          el.textContent = text;
          el.dataset.kgenOrgan = "holycup-organ";
        }
      });
      qa("button,.v714-cup").forEach(btn=>{
        const t=(btn.textContent||"").replace(/\s+/g,"");
        if(/聖盃一|聖盃二|聖盃三/.test(t)){
          const n = t.includes("一") ? 1 : t.includes("二") ? 2 : 3;
          btn.classList.toggle("done", n <= this.count);
          btn.innerHTML = "聖盃" + (n===1?"一":n===2?"二":"三") + "<br>" + (n <= this.count ? "已擲杯" : "尚未擲杯");
        }
      });
      if(ConsoleUI.refreshFortuneStatus) ConsoleUI.refreshFortuneStatus();
    },
    cup(){
      this.load();
      if(this.count < this.max){
        this.count++;
        this.save();
      }
      this.render(this.count >= this.max ? "" : "");
      return false;
    },
    reset(){
      this.count = 0;
      this.save();
      this.render("已重置");
      return false;
    }
  };
  window.KGEN_HOLYCUP_RUNTIME = HolyCup;

  const ConsoleUI = {
    timer:null,
    chainTimer:null,
    state:{ blockTs:0, address:null, chainId:null, bnbBal:null, heartData:null, readError:null },

    start(){
      this.lockUtc = false;
      this.watchUtc();
      this.tickClock();
      if(this.timer) clearInterval(this.timer);
      this.timer = setInterval(()=>this.tickClock(), 250);
      this.refreshChain();
      if(this.chainTimer) clearInterval(this.chainTimer);
      this.chainTimer = setInterval(()=>this.refreshChain(), 12000);
      this.bindCupButtons();
      this.bindAmountInput();
      this.relabelButtons();
      this.fixWish();
    },

    watchUtc(){
      const utcEl = $("kh-utc");
      if(!utcEl || utcEl.dataset.kgenTwWatch) return;
      utcEl.dataset.kgenTwWatch = "1";
      const obs = new MutationObserver(()=>{
        if(this.lockUtc) return;
        const html = utcEl.innerHTML || "";
        const text = utcEl.textContent || "";
        if(!html.includes("台灣時間") && !text.includes("台灣時間")){
          this.tickClock();
        }
      });
      obs.observe(utcEl, { childList:true, characterData:true, subtree:true, characterDataOldValue:false });
    },

    tickClock(){
      syncVersion();
      const now = new Date();
      const tw = "台灣時間：" + formatTaipei(now);
      const utcEl = $("kh-utc");
      if(utcEl){
        this.lockUtc = true;
        utcEl.innerHTML = tw + '<br><span class="kh-utc-sub">UTC：' + formatUTC(now) + "</span>";
        this.lockUtc = false;
      }
      const sys = $("sys-clock");
      if(sys) sys.textContent = tw;
      this.updateHeartbeatDisplay();
      this.updateIgniteDisplay();
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
        if(btn) btn.disabled = true;
        return;
      }

      const reasons = this.getFortuneBlockReasons();
      if(reasons.length === 0){
        el.textContent = "發財金：可領";
        if(btn){ btn.disabled = false; btn.title = ""; }
      }else{
        el.textContent = "發財金：不可領 — " + reasons[0];
        if(btn){ btn.disabled = true; btn.title = reasons.join("；"); }
      }
    },

    bindCupButtons(){
      const throwBtn = $("kh-cup-throw");
      const resetBtn = $("kh-cup-reset");
      if(throwBtn && !throwBtn.dataset.kgenBound){
        throwBtn.dataset.kgenBound = "1";
        throwBtn.onclick = ()=>HolyCup.cup();
      }
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
      cup: ()=>HolyCup.cup(),
      resetCup: ()=>HolyCup.reset()
    });
    qa("button,.term-btn,.nav-btn,.v714-cup").forEach(btn=>{
      const t=(btn.textContent||"").replace(/\s+/g,"");
      if(/三次聖盃|請示聖盃|聖盃一|聖盃二|聖盃三/.test(t) && !/重置/.test(t)){
        btn.dataset.kgenCell = "holycup-button-cell";
        btn.onclick = function(e){
          e && e.preventDefault && e.preventDefault();
          e && e.stopPropagation && e.stopPropagation();
          return HolyCup.cup();
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
    syncVersion();
    closeRightRule();
    bindRightRuleButton();
    moveFestivalBelowAudio();
    bindHolyCup();
    HolyCup.load();
    HolyCup.render();
    ConsoleUI.start();
    Clock.start();
    tagCells();
    bootLandEngine();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.addEventListener("load", ()=>{
    setTimeout(()=>{
      if(window.KGEN_CONSOLE_UI) window.KGEN_CONSOLE_UI.start();
    }, 900);
  });

  setTimeout(boot,500);
  setTimeout(boot,1800);
  setInterval(()=>{
    syncVersion();
    moveFestivalBelowAudio();
    ensureLandEngine();
    bindHolyCup();
    ConsoleUI.bindCupButtons();
    ConsoleUI.bindAmountInput();
    ConsoleUI.relabelButtons();
    tagCells();
  },3000);
})();
