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

  const VERSION = "V10.47.1";
  const VERSION_TAG = "12345-TEMPLE-V10.47.1-LAYOUT-REAL-FIX";
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
    document.title = "KGEN-12345-HEART-UI-" + VERSION;
    const ver = $("ver-st");
    if(ver){
      ver.textContent = "VERSION " + VERSION_TAG;
      ver.dataset.kgenGenomeVersion = VERSION;
    }
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
    render(msg){
      const text = (msg || "尚未驗證") + "｜聖盃狀態：" + this.count + " / " + this.max + "。正反、反正才算聖盃。";
      ["v57-cup-status","v714-cup-status","v715-cup-status","v715-cup-log","kh-cup-status"].forEach(id=>{
        const el=$(id);
        if(el){
          el.innerHTML = text;
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
    },
    cup(){
      this.count = Math.min(this.max, this.count + 1);
      this.render("本次驗證成功");
      return false;
    },
    reset(){
      this.count = 0;
      this.render("已重置");
      return false;
    }
  };
  window.KGEN_HOLYCUP_RUNTIME = HolyCup;

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
    qa("#kgen-heart-live-panel,#kgen-v102-festival-panel,#kgen-land-panel,#coord-panel,.panel,.hud-box,.bp-panel").forEach((el,i)=>{
      if(!el.dataset.kgenOrgan) el.dataset.kgenOrgan = "organ-" + i;
    });
  }

  const KgenLandDemo = {
    GRID: 20,
    DEMO_PLAYER: "demo-player",
    data: null,
    occupancy: new Map(),
    landById: new Map(),
    selected: null,
    nextSeq: 3,
    inited: false,

    cellKey(x, y){ return x + "," + y; },

    async load(){
      if(this.data) return this.data;
      try{
        const res = await fetch("data/kgen-land-demo.json", {cache:"no-store"});
        if(!res.ok) throw new Error("HTTP " + res.status);
        this.data = await res.json();
      }catch(err){
        console.warn("[KGEN Land Demo] load failed", err);
        this.data = {
          universeId: "12345",
          cellSizePoint: 0.0001,
          cellSizeMeter: 2.276,
          cellAreaM2: 5.18,
          lands: []
        };
      }
      this.rebuildIndex();
      return this.data;
    },

    rebuildIndex(){
      this.occupancy = new Map();
      this.landById = new Map();
      let maxSeq = 0;
      (this.data.lands || []).forEach(land=>{
        this.landById.set(land.landId, land);
        const m = /L(\d+)$/.exec(land.landId || "");
        if(m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
        (land.cells || []).forEach(c=>{
          this.occupancy.set(this.cellKey(c.x, c.y), land.landId);
        });
      });
      this.nextSeq = Math.max(this.nextSeq, maxSeq + 1);
    },

    areaM2(land){
      const n = (land && land.cells) ? land.cells.length : 0;
      return +(n * (this.data.cellAreaM2 || 5.18)).toFixed(2);
    },

    isOccupied(x, y){
      return this.occupancy.has(this.cellKey(x, y));
    },

    landAt(x, y){
      const id = this.occupancy.get(this.cellKey(x, y));
      return id ? this.landById.get(id) : null;
    },

    fmtCells(cells){
      return (cells || []).map(c=>"(" + c.x + "," + c.y + ")").join(" ");
    },

    renderDetail(land, x, y){
      const detail = $("kgen-land-detail");
      const buy = $("kgen-land-buy");
      const msg = $("kgen-land-msg");
      if(!detail || !buy) return;

      if(land){
        detail.innerHTML =
          "<div><b>universeId</b>：" + this.data.universeId + "</div>" +
          "<div><b>landId</b>：" + land.landId + "</div>" +
          "<div><b>cells</b>：" + this.fmtCells(land.cells) + "</div>" +
          "<div><b>areaM2</b>：" + this.areaM2(land) + " m²</div>" +
          "<div><b>owner</b>：" + land.owner + "</div>" +
          "<div><b>status</b>：" + land.status + "</div>";
        buy.disabled = true;
        if(msg) msg.textContent = "";
        return;
      }

      detail.innerHTML =
        "<div><b>universeId</b>：" + this.data.universeId + "</div>" +
        "<div><b>landId</b>：—（待購買）</div>" +
        "<div><b>cells</b>：(" + x + "," + y + ")</div>" +
        "<div><b>areaM2</b>：" + (this.data.cellAreaM2 || 5.18) + " m²</div>" +
        "<div><b>owner</b>：—</div>" +
        "<div><b>status</b>：vacant</div>";
      buy.disabled = false;
      if(msg) msg.textContent = "";
    },

    renderGrid(){
      const grid = $("kgen-land-grid");
      if(!grid || !this.data) return;
      grid.innerHTML = "";
      const frag = document.createDocumentFragment();

      for(let y = 1; y <= this.GRID; y++){
        for(let x = 1; x <= this.GRID; x++){
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "kgen-land-cell";
          btn.dataset.x = String(x);
          btn.dataset.y = String(y);
          btn.title = x + "," + y;
          btn.setAttribute("aria-label", "格子 " + x + "," + y);

          const land = this.landAt(x, y);
          if(land){
            if(land.status === "owned-by-demo-player"){
              btn.classList.add("owned");
            }else if(land.status === "reserved"){
              btn.classList.add("reserved");
            }else{
              btn.classList.add("occupied");
            }
          }else{
            btn.classList.add("empty");
          }

          if(this.selected && this.selected.x === x && this.selected.y === y){
            btn.classList.add("selected");
          }

          btn.addEventListener("click", ()=>this.onCellClick(x, y));
          frag.appendChild(btn);
        }
      }
      grid.appendChild(frag);
    },

    onCellClick(x, y){
      this.selected = {x, y};
      const land = this.landAt(x, y);
      const msg = $("kgen-land-msg");
      this.renderDetail(land, x, y);
      if(land && msg) msg.textContent = "土地已被占用";
      this.renderGrid();
    },

    simulateBuy(){
      const msg = $("kgen-land-msg");
      const buy = $("kgen-land-buy");
      if(!this.selected){
        if(msg) msg.textContent = "請先點選空地";
        return;
      }
      const {x, y} = this.selected;
      if(this.isOccupied(x, y)){
        if(msg) msg.textContent = "土地已被占用";
        const land = this.landAt(x, y);
        this.renderDetail(land, x, y);
        if(buy) buy.disabled = true;
        return;
      }

      const landId = "WUKONG-12345-L" + String(this.nextSeq).padStart(6, "0");
      this.nextSeq += 1;
      const land = {
        landId,
        owner: this.DEMO_PLAYER,
        status: "owned-by-demo-player",
        cells: [{x, y}]
      };
      this.data.lands.push(land);
      this.rebuildIndex();
      this.renderGrid();
      this.renderDetail(land, x, y);
      if(msg) msg.textContent = "模擬購買成功：" + landId;
    },

    bindBuy(){
      const buy = $("kgen-land-buy");
      if(!buy || buy.dataset.kgenLandBound) return;
      buy.dataset.kgenLandBound = "1";
      buy.addEventListener("click", (e)=>{
        e.preventDefault();
        this.simulateBuy();
      });
    },

    movePanelToNav(){
      const panel = $("kgen-land-panel");
      const nav = $("universe-nav");
      if(!panel || !nav) return;

      panel.classList.add("kgen-layout-fixed");
      panel.dataset.kgenOrgan = "land-registry-organ";

      const festival = $("kgen-v102-festival-panel");
      if(panel.parentElement !== nav){
        if(festival && festival.nextSibling) nav.insertBefore(panel, festival.nextSibling);
        else nav.appendChild(panel);
      }

      const head = panel.querySelector(".kgen-land-head");
      if(head && !head.dataset.kgenLandToggle){
        head.dataset.kgenLandToggle = "1";
        head.style.cursor = "pointer";
        head.addEventListener("click", ()=>{
          panel.classList.toggle("kgen-land-closed");
          const ver = head.querySelector(".kgen-land-ver");
          if(ver) ver.textContent = panel.classList.contains("kgen-land-closed") ? "展開" : "Demo V0.1";
        });
      }
      panel.classList.add("kgen-land-closed");
    },

    async init(){
      if(this.inited) return;
      await this.load();
      this.movePanelToNav();
      this.bindBuy();
      this.renderGrid();
      this.inited = true;
    }
  };
  window.KGEN_LAND_DEMO = KgenLandDemo;

  function bootLandDemo(){
    KgenLandDemo.init().catch(err=>console.warn("[KGEN Land Demo]", err));
  }

  function boot(){
    syncVersion();
    closeRightRule();
    bindRightRuleButton();
    moveFestivalBelowAudio();
    bindHolyCup();
    HolyCup.render();
    Clock.start();
    tagCells();
    bootLandDemo();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setTimeout(boot,500);
  setTimeout(boot,1800);
  setInterval(()=>{
    syncVersion();
    moveFestivalBelowAudio();
    KgenLandDemo.movePanelToNav();
    bindHolyCup();
    tagCells();
  },3000);
})();
