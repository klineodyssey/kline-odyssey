/*
KGEN Land Engine V1.0
Shared land cadastre engine for all temple universes.
Frontend-only. No wallet / contract / NFT mint in this phase.
*/
(function(global){
  "use strict";

  const ENGINE_VERSION = "1.0";
  const DEFAULT_CELL_AREA = 5.18;

  const FUTURE_HOOKS = {
    nftMetadata: { enabled: false, schema: "KGEN-LAND-NFT-V1", fields: ["universeId", "landId", "cells", "areaM2"] },
    exchange11520: { enabled: false, universeId: "11520", label: "花果山交易所" },
    temple13145: { enabled: false, universeId: "13145", label: "羊神殿" },
    otherUniverses: ["11520", "13145", "16888"]
  };

  function cellKey(x, y){ return x + "," + y; }

  function parseCellKey(key){
    const p = String(key).split(",");
    return { x: parseInt(p[0], 10), y: parseInt(p[1], 10) };
  }

  function rectCells(x1, y1, x2, y2){
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const out = [];
    for(let y = minY; y <= maxY; y++){
      for(let x = minX; x <= maxX; x++){
        out.push({ x, y });
      }
    }
    return out;
  }

  function normalizeLand(raw, universeId, cellAreaM2){
    const cells = (raw.cells || []).map(c=>({ x: +c.x, y: +c.y }));
    const areaM2 = raw.areaM2 != null ? +raw.areaM2 : +(cells.length * cellAreaM2).toFixed(2);
    return {
      landId: raw.landId,
      universeId: raw.universeId || universeId,
      owner: raw.owner || "—",
      cells,
      areaM2,
      status: raw.status || "occupied",
      reserved: !!(raw.reserved || raw.status === "reserved"),
      nft: Object.assign({
        metadataUri: null,
        tokenId: null,
        contract: null,
        reserved: true
      }, raw.nft || {})
    };
  }

  function createEngine(config){
    const cfg = Object.assign({
      universeId: "12345",
      gridSize: 20,
      dataUrl: "data/kgen-land-demo.json",
      demoPlayer: "demo-player",
      landIdPrefix: "WUKONG",
      selectors: {}
    }, config || {});

    const $ = (id)=>document.getElementById(id);

    const engine = {
      version: ENGINE_VERSION,
      config: cfg,
      hooks: FUTURE_HOOKS,
      data: null,
      occupancy: new Map(),
      landById: new Map(),
      nextSeq: 1,
      selection: [],
      viewLand: null,
      drag: null,
      inited: false,
      collapseInit: false,

      async load(){
        if(this.data) return this.data;
        try{
          const res = await fetch(cfg.dataUrl, { cache: "no-store" });
          if(!res.ok) throw new Error("HTTP " + res.status);
          this.data = await res.json();
        }catch(err){
          console.warn("[KGEN Land Engine] load failed", err);
          this.data = {
            engineVersion: ENGINE_VERSION,
            universeId: cfg.universeId,
            cellSizePoint: 0.0001,
            cellSizeMeter: 2.276,
            cellAreaM2: DEFAULT_CELL_AREA,
            lands: [],
            nft: { enabled: false },
            futureUniverses: FUTURE_HOOKS.otherUniverses
          };
        }
        this.data.engineVersion = this.data.engineVersion || ENGINE_VERSION;
        this.data.universeId = this.data.universeId || cfg.universeId;
        this.rebuildIndex();
        return this.data;
      },

      rebuildIndex(){
        this.occupancy = new Map();
        this.landById = new Map();
        let maxSeq = 0;
        const cellArea = this.data.cellAreaM2 || DEFAULT_CELL_AREA;
        (this.data.lands || []).forEach(raw=>{
          const land = normalizeLand(raw, this.data.universeId, cellArea);
          this.landById.set(land.landId, land);
          const m = /L(\d+)$/.exec(land.landId || "");
          if(m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
          land.cells.forEach(c=>{
            this.occupancy.set(cellKey(c.x, c.y), land.landId);
          });
        });
        this.nextSeq = Math.max(this.nextSeq, maxSeq + 1);
      },

      isOccupied(x, y){
        return this.occupancy.has(cellKey(x, y));
      },

      landAt(x, y){
        const id = this.occupancy.get(cellKey(x, y));
        return id ? this.landById.get(id) : null;
      },

      cellAreaM2(){
        return this.data.cellAreaM2 || DEFAULT_CELL_AREA;
      },

      selectionArea(){
        return +(this.selection.length * this.cellAreaM2()).toFixed(2);
      },

      fmtCells(cells){
        return (cells || []).map(c=>"(" + c.x + "," + c.y + ")").join(" ");
      },

      pendingLandId(){
        const uid = this.data.universeId;
        const seq = String(this.nextSeq).padStart(6, "0");
        return cfg.landIdPrefix + "-" + uid + "-L" + seq;
      },

      isCellSelected(x, y){
        return this.selection.some(c=>c.x === x && c.y === y);
      },

      setSelection(cells){
        this.selection = (cells || []).map(c=>({ x: +c.x, y: +c.y }));
        this.viewLand = null;
        this.render();
      },

      clearSelection(){
        this.selection = [];
        this.viewLand = null;
        this.drag = null;
        this.setMsg("");
        this.render();
      },

      clearBox(){
        this.clearSelection();
      },

      reselect(){
        this.clearSelection();
        this.setMsg("請拖曳或點選格子重新框選");
      },

      cancelSelection(){
        this.clearSelection();
        this.setMsg("已取消選取");
      },

      selectRect(x1, y1, x2, y2){
        const cells = rectCells(x1, y1, x2, y2).filter(c=>{
          return c.x >= 1 && c.y >= 1 && c.x <= cfg.gridSize && c.y <= cfg.gridSize;
        });
        const vacant = cells.filter(c=>!this.isOccupied(c.x, c.y));
        const blocked = cells.length - vacant.length;
        if(vacant.length === 0){
          this.setMsg(blocked ? "土地已被占用" : "框選範圍無有效格子");
          return;
        }
        this.selection = vacant;
        this.viewLand = null;
        if(blocked > 0) this.setMsg("已框選 " + vacant.length + " 格；略過 " + blocked + " 格已占用");
        else this.setMsg("");
        this.render();
      },

      onCellPointerDown(x, y, ev){
        if(ev && ev.button > 0) return;
        this.drag = { x1: x, y1: y, x2: x, y2: y, active: true };
        const land = this.landAt(x, y);
        if(land){
          this.viewLand = land;
          this.selection = [];
          this.setMsg("土地已被占用");
          this.render();
          return;
        }
        this.viewLand = null;
        this.selection = [{ x, y }];
        this.render();
      },

      onCellPointerEnter(x, y){
        if(!this.drag || !this.drag.active) return;
        this.drag.x2 = x;
        this.drag.y2 = y;
        this.selectRect(this.drag.x1, this.drag.y1, this.drag.x2, this.drag.y2);
      },

      onCellPointerUp(){
        if(!this.drag) return;
        this.drag.active = false;
        this.render();
      },

      onCellClick(x, y){
        const land = this.landAt(x, y);
        if(land){
          this.viewLand = land;
          this.selection = [];
          this.setMsg("土地已被占用");
        }else if(this.selection.length <= 1){
          this.viewLand = null;
          this.selection = [{ x, y }];
          this.setMsg("");
        }
        this.render();
      },

      renderInfoPanel(){
        const uid = $("kgen-land-info-universe");
        const lid = $("kgen-land-info-landid");
        const area = $("kgen-land-info-area");
        const owner = $("kgen-land-info-owner");
        const status = $("kgen-land-info-status");
        if(!uid) return;

        const land = this.viewLand;
        const hasSel = this.selection.length > 0;

        if(land){
          uid.textContent = land.universeId;
          lid.textContent = land.landId;
          area.textContent = land.areaM2 + " m²（" + land.cells.length + " 格）";
          owner.textContent = land.owner;
          status.textContent = land.status + (land.reserved ? " / reserved" : "");
          return;
        }

        if(hasSel){
          uid.textContent = this.data.universeId;
          lid.textContent = this.pendingLandId() + "（待購買）";
          area.textContent = this.selectionArea() + " m²（" + this.selection.length + " 格）";
          owner.textContent = "—";
          status.textContent = "vacant";
          return;
        }

        uid.textContent = this.data.universeId;
        lid.textContent = "—";
        area.textContent = "—";
        owner.textContent = "—";
        status.textContent = "—";
      },

      renderSummary(){
        const el = $("kgen-land-selection-summary");
        if(!el) return;
        if(this.viewLand){
          el.innerHTML =
            "<div><b>格數</b>：" + this.viewLand.cells.length + "</div>" +
            "<div><b>面積</b>：" + this.viewLand.areaM2 + " m²</div>" +
            "<div><b>土地編號</b>：" + this.viewLand.landId + "</div>" +
            "<div><b>UniverseID</b>：" + this.viewLand.universeId + "</div>";
          return;
        }
        if(this.selection.length){
          el.innerHTML =
            "<div><b>格數</b>：" + this.selection.length + "</div>" +
            "<div><b>面積</b>：" + this.selectionArea() + " m²</div>" +
            "<div><b>土地編號</b>：" + this.pendingLandId() + "</div>" +
            "<div><b>UniverseID</b>：" + this.data.universeId + "</div>";
          return;
        }
        el.textContent = "拖曳框選或點選格子";
      },

      renderDetail(){
        const detail = $("kgen-land-detail");
        const buy = $("kgen-land-buy");
        if(!detail || !buy) return;

        const land = this.viewLand;
        if(land){
          detail.innerHTML =
            "<div><b>universeId</b>：" + land.universeId + "</div>" +
            "<div><b>landId</b>：" + land.landId + "</div>" +
            "<div><b>cells</b>：" + this.fmtCells(land.cells) + "</div>" +
            "<div><b>areaM2</b>：" + land.areaM2 + " m²</div>" +
            "<div><b>owner</b>：" + land.owner + "</div>" +
            "<div><b>status</b>：" + land.status + "</div>" +
            "<div><b>reserved</b>：" + (land.reserved ? "yes" : "no") + "</div>" +
            "<div><b>nft</b>：reserved（" + (land.nft.tokenId || "—") + "）</div>";
          buy.disabled = true;
          return;
        }

        if(this.selection.length){
          detail.innerHTML =
            "<div><b>universeId</b>：" + this.data.universeId + "</div>" +
            "<div><b>landId</b>：" + this.pendingLandId() + "（待購買）</div>" +
            "<div><b>cells</b>：" + this.fmtCells(this.selection) + "</div>" +
            "<div><b>areaM2</b>：" + this.selectionArea() + " m²</div>" +
            "<div><b>owner</b>：—</div>" +
            "<div><b>status</b>：vacant</div>";
          buy.disabled = false;
          return;
        }

        detail.textContent = "點選空地或已占用格子查看地籍";
        buy.disabled = true;
      },

      renderGrid(){
        const grid = $("kgen-land-grid");
        if(!grid || !this.data) return;
        grid.innerHTML = "";
        const frag = document.createDocumentFragment();

        for(let y = 1; y <= cfg.gridSize; y++){
          for(let x = 1; x <= cfg.gridSize; x++){
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "kgen-land-cell";
            btn.dataset.x = String(x);
            btn.dataset.y = String(y);
            btn.title = x + "," + y;
            btn.setAttribute("aria-label", "格子 " + x + "," + y);

            const land = this.landAt(x, y);
            if(land){
              if(land.status === "owned-by-demo-player") btn.classList.add("owned");
              else if(land.status === "reserved" || land.reserved) btn.classList.add("reserved");
              else btn.classList.add("occupied");
            }else{
              btn.classList.add("empty");
            }

            if(this.isCellSelected(x, y)) btn.classList.add("selected");
            if(this.viewLand && land && land.landId === this.viewLand.landId) btn.classList.add("viewing");

            btn.addEventListener("mousedown", (e)=>{ e.preventDefault(); this.onCellPointerDown(x, y, e); });
            btn.addEventListener("mouseenter", ()=>this.onCellPointerEnter(x, y));
            btn.addEventListener("mouseup", ()=>this.onCellPointerUp());
            btn.addEventListener("click", ()=>this.onCellClick(x, y));
            btn.addEventListener("touchstart", (e)=>{ e.preventDefault(); this.onCellPointerDown(x, y, e); }, { passive: false });
            btn.addEventListener("touchmove", (e)=>{
              const t = e.touches[0];
              const hit = document.elementFromPoint(t.clientX, t.clientY);
              if(hit && hit.dataset.x) this.onCellPointerEnter(+hit.dataset.x, +hit.dataset.y);
            }, { passive: true });
            btn.addEventListener("touchend", ()=>this.onCellPointerUp());

            frag.appendChild(btn);
          }
        }
        grid.appendChild(frag);
      },

      setMsg(text){
        const msg = $("kgen-land-msg");
        if(msg) msg.textContent = text || "";
      },

      render(){
        this.renderGrid();
        this.renderDetail();
        this.renderSummary();
        this.renderInfoPanel();
      },

      simulateBuy(){
        if(this.viewLand){
          this.setMsg("土地已被占用");
          return;
        }
        if(!this.selection.length){
          this.setMsg("請先框選或點選空地");
          return;
        }
        for(const c of this.selection){
          if(this.isOccupied(c.x, c.y)){
            this.setMsg("土地已被占用");
            this.viewLand = this.landAt(c.x, c.y);
            this.selection = [];
            this.render();
            return;
          }
        }

        const landId = this.pendingLandId();
        this.nextSeq += 1;
        const land = normalizeLand({
          landId,
          universeId: this.data.universeId,
          owner: cfg.demoPlayer,
          status: "owned-by-demo-player",
          reserved: false,
          cells: this.selection.slice(),
          nft: { metadataUri: null, tokenId: null, contract: null, reserved: true }
        }, this.data.universeId, this.cellAreaM2());

        this.data.lands.push(land);
        this.rebuildIndex();
        this.viewLand = land;
        this.selection = [];
        this.setMsg("模擬購買成功：" + landId);
        this.render();
      },

      bindControls(){
        const map = [
          ["kgen-land-buy", ()=>this.simulateBuy()],
          ["kgen-land-cancel-sel", ()=>this.cancelSelection()],
          ["kgen-land-clear-box", ()=>this.clearBox()],
          ["kgen-land-reselect", ()=>this.reselect()]
        ];
        map.forEach(([id, fn])=>{
          const el = $(id);
          if(!el || el.dataset.kgenLandBound) return;
          el.dataset.kgenLandBound = "1";
          el.addEventListener("click", (e)=>{ e.preventDefault(); fn(); });
        });

        if(!this._docUpBound){
          this._docUpBound = true;
          document.addEventListener("mouseup", ()=>this.onCellPointerUp());
          document.addEventListener("touchend", ()=>this.onCellPointerUp());
        }
      },

      bindPanelToggle(headSel, panelSel, closedClass, verOpen, verClosed){
        const panel = $(panelSel.replace("#","")) || document.querySelector(panelSel);
        const head = panel && panel.querySelector(headSel);
        if(!panel || !head || head.dataset.kgenLandToggle) return;
        head.dataset.kgenLandToggle = "1";
        head.style.cursor = "pointer";
        head.addEventListener("click", ()=>{
          panel.classList.toggle(closedClass);
          const ver = head.querySelector(".kgen-land-ver, .kgen-land-info-ver");
          if(ver) ver.textContent = panel.classList.contains(closedClass) ? verClosed : verOpen;
        });
      },

      ensurePanelsInNav(){
        const nav = $("universe-nav");
        if(!nav) return;

        ["kgen-land-panel", "kgen-land-info-panel"].forEach(id=>{
          const panel = $(id);
          if(!panel) return;
          panel.classList.add("kgen-layout-fixed");
          panel.dataset.kgenOrgan = id === "kgen-land-panel" ? "land-registry-organ" : "land-info-organ";
          if(panel.parentElement !== nav){
            const festival = $("kgen-v102-festival-panel");
            if(id === "kgen-land-panel"){
              if(festival && festival.nextSibling) nav.insertBefore(panel, festival.nextSibling);
              else nav.appendChild(panel);
            }else{
              const land = $("kgen-land-panel");
              if(land && land.nextSibling) nav.insertBefore(panel, land.nextSibling);
              else nav.appendChild(panel);
            }
          }
        });

        this.bindPanelToggle(".kgen-land-head", "kgen-land-panel", "kgen-land-closed", "V1.0", "展開");
        this.bindPanelToggle(".kgen-land-info-head", "kgen-land-info-panel", "kgen-land-info-closed", "即時", "展開");

        const panel = $("kgen-land-panel");
        if(panel && !this.collapseInit){
          panel.classList.add("kgen-land-closed");
          this.collapseInit = true;
        }
        const info = $("kgen-land-info-panel");
        if(info && !this.infoCollapseInit){
          info.classList.add("kgen-land-info-closed");
          this.infoCollapseInit = true;
        }
      },

      async init(){
        if(this.inited) return;
        await this.load();
        this.ensurePanelsInNav();
        this.bindControls();
        this.render();
        this.inited = true;
      },

      ensure(){
        this.ensurePanelsInNav();
      }
    };

    return engine;
  }

  global.KGEN_LAND_ENGINE = {
    version: ENGINE_VERSION,
    hooks: FUTURE_HOOKS,
    create: createEngine
  };
})(typeof window !== "undefined" ? window : globalThis);
