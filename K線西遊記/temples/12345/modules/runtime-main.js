(function(){
  "use strict";

  const VERSION = "V2.0.2";
  const VERSION_TAG = "12345-TEMPLE-RUNTIME-CORE-V2.0.2";
  const UI_PATCH = "V2.0.2";
  const HEART_CONTRACT = "KGEN_TempleHeart_V3_2_6.sol";
  const CONFIG = window.KGEN_12345_CONFIG || {};
  const CHAIN = Object.assign({
    KGEN: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
    HEART: "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972",
    BRAIN: "0xd0605F4EF10e5C1438F11AF9edc36926769239d6",
    MARS: "0x3529dbFbaD465C2269F8096879A1c298d5257298",
    BSC: "0x38",
    RPC: "https://bsc-dataseed.binance.org/"
  }, CONFIG.chain || {});
  const ASSETS = Object.assign({
    heart: "./assets/heart.png",
    front: "./assets/bull-front.png",
    back: "./assets/bear-rear.png",
    core: "./assets/warp-core.png"
  }, CONFIG.assets || {});
  const CUP_KEYS = Array.isArray(CONFIG.cupKeys) && CONFIG.cupKeys.length ? CONFIG.cupKeys.slice() : [
    "kgen12345_cup_count_v10492",
    "KGEN_12345_V907_CUP_COUNT",
    "KGEN_12345_V908_CUP_COUNT"
  ];

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

  const NY_SLOT_IDS = ["kh-ny-slot", "kh-ny-countdown", "cd-1231", "kgen-ny-countdown", "human-cd-1231", "v714-ny-count"];
  const FESTIVAL_LABELS = {
    1: "5/20 悟空生日",
    2: "11/11 孤勇日"
  };

  const $ = function(id){ return document.getElementById(id); };
  const qa = function(selector, root){ return Array.from((root || document).querySelectorAll(selector)); };

  function pad(value){
    return String(value).padStart(2, "0");
  }

  function short(address){
    if(!address) return "未連線";
    return String(address).slice(0, 6) + "..." + String(address).slice(-4);
  }

  function bnNum(value){
    if(value == null) return 0;
    if(typeof value === "number") return value;
    if(typeof value === "string") return Number(value) || 0;
    if(value && typeof value.toNumber === "function"){
      try{ return value.toNumber(); }catch(_){ }
    }
    if(value && typeof value.toString === "function"){
      return Number(value.toString()) || 0;
    }
    return 0;
  }

  function asErrorMessage(error){
    if(!error) return "未知錯誤";
    return error.data && error.data.message || error.error && error.error.message || error.reason || error.message || String(error);
  }

  function hasEthers5(){
    return !!(window.ethers && ethers.providers && ethers.utils);
  }

  function formatTaipei(date){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date || new Date());
    const pick = function(type){
      const part = parts.find(function(entry){ return entry.type === type; });
      return part ? part.value : "00";
    };
    return pick("year") + "-" + pick("month") + "-" + pick("day") + " " + pick("hour") + ":" + pick("minute") + ":" + pick("second");
  }

  function formatUTC(date){
    return (date || new Date()).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
  }

  function formatHMS(ms){
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  }

  function formatSpan(ms){
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const clock = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    return days > 0 ? days + "天 " + clock : clock;
  }

  function nextLocal(month, day, hour, minute, second){
    const now = new Date();
    let target = new Date(now.getFullYear(), month - 1, day, hour || 0, minute || 0, second || 0, 0);
    if(target <= now){
      target = new Date(now.getFullYear() + 1, month - 1, day, hour || 0, minute || 0, second || 0, 0);
    }
    return target;
  }

  function setText(ids, text){
    ids.forEach(function(id){
      const el = $(id);
      if(el) el.textContent = text;
    });
  }

  function setNodeText(el, text){
    if(el) el.textContent = text;
  }

  function nyDiffParts(ms){
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: pad(Math.floor((totalSeconds % 86400) / 3600)),
      minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
      seconds: pad(totalSeconds % 60)
    };
  }

  function ensureNyShell(root, useGlobalIds){
    if(!root || root.dataset.kgenNyShell === "1") return root;
    root.dataset.kgenNyShell = "1";
    root.classList.add("kgen-ny-countdown-shell");
    const dayId = useGlobalIds ? ' id="ny-days"' : "";
    const hourId = useGlobalIds ? ' id="ny-hours"' : "";
    const minuteId = useGlobalIds ? ' id="ny-minutes"' : "";
    const secondId = useGlobalIds ? ' id="ny-seconds"' : "";
    root.innerHTML = '<span class="kgen-ny-prefix">距跨年：</span><span class="kgen-ny-body"><span class="ny-days"' + dayId + '>0</span> 天 <span class="ny-hours"' + hourId + '>00</span>:<span class="ny-minutes"' + minuteId + '>00</span>:<span class="ny-seconds"' + secondId + '>00</span></span>';
    root.style.animation = "none";
    root.style.transition = "none";
    root.style.opacity = "1";
    return root;
  }

  function updateNyShell(root, parts){
    if(!root || !parts) return;
    const days = root.querySelector(".ny-days");
    const hours = root.querySelector(".ny-hours");
    const minutes = root.querySelector(".ny-minutes");
    const seconds = root.querySelector(".ny-seconds");
    const dayText = String(parts.days);
    if(days && days.textContent !== dayText) days.textContent = dayText;
    if(hours && hours.textContent !== parts.hours) hours.textContent = parts.hours;
    if(minutes && minutes.textContent !== parts.minutes) minutes.textContent = parts.minutes;
    if(seconds && seconds.textContent !== parts.seconds) seconds.textContent = parts.seconds;
  }

  function getFestivalWindowLabel(date){
    const now = date || new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const tod = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    if(month === 5 && day === 20 && tod >= 0 && tod <= 600) return "OPEN 5/20";
    if(month === 11 && day === 11 && tod >= 0 && tod <= 600) return "OPEN 11/11";
    if(month === 12 && day === 31 && tod >= 85800 && tod <= 86399) return "OPEN 12/31";
    return "CLOSED";
  }

  const Events = {
    bindOnce: function(el, type, handler, options){
      if(!el || !type || typeof handler !== "function") return false;
      const current = (el.dataset && el.dataset.kgenBound ? el.dataset.kgenBound : "").split("|").filter(Boolean);
      if(current.indexOf(type) >= 0) return false;
      current.push(type);
      if(el.dataset) el.dataset.kgenBound = current.join("|");
      el.addEventListener(type, handler, options === undefined ? false : options);
      return true;
    }
  };

  const TimerRegistry = {
    timers: {},
    register: function(name, task, ms){
      if(this.timers[name] || typeof task !== "function") return;
      task();
      this.timers[name] = window.setInterval(task, ms);
    }
  };

  const StatusRuntime = {
    inited: false,
    lines: [],
    maxLines: 6,
    targets: ["kgen-v902-left-status", "kh-log"],
    externalLand: "",
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_STATUS_BUS = this;
      window.addEventListener("kgen-status", function(event){
        if(event && event.detail && event.detail.message){
          StatusRuntime.push(event.detail.message);
        }
      });
    },
    push: function(message, options){
      const text = String(message || "").trim();
      if(!text) return;
      const line = formatTaipei(new Date()).slice(11) + " " + text;
      if(this.lines[0] !== line){
        this.lines.unshift(line);
        if(this.lines.length > this.maxLines) this.lines.length = this.maxLines;
      }
      const rendered = options && options.full ? this.lines.join(" | ") : text;
      this.targets.forEach(function(id){
        const el = $(id);
        if(el && !el.dataset.kgenBusMute) el.textContent = rendered;
      });
    },
    tick: function(){
      const land = $("kgen-land-msg");
      const text = land ? String(land.textContent || "").trim() : "";
      if(text && text !== this.externalLand){
        this.externalLand = text;
        this.push("[土地] " + text);
      }
    }
  };

  const HudRuntime = {
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.syncVersion();
      this.setupClockShell("sys-clock");
      this.setupClockShell("kh-utc");
    },
    syncVersion: function(){
      document.title = "KGEN-12345-HEART-UI-" + VERSION_TAG;
      const brand = document.querySelector(".hud-top .brand-name");
      if(brand){
        brand.textContent = "KGEN 12345 五指山悟空財神殿";
        brand.dataset.kgenHudLock = "1";
      }
      const versionNode = $("ver-st");
      if(versionNode){
        versionNode.textContent = VERSION;
        versionNode.setAttribute("data-version", VERSION_TAG);
        versionNode.dataset.kgenGenomeVersion = VERSION;
        versionNode.dataset.kgenUiPatch = UI_PATCH;
        versionNode.title = VERSION_TAG;
      }
    },
    setupClockShell: function(id){
      const root = $(id);
      if(!root || root.dataset.kgenClockShell) return;
      root.dataset.kgenClockShell = "1";
      root.classList.add(id === "sys-clock" ? "kgen-hud-clock" : "kh-v-time");
      root.innerHTML = '<span class="kgen-tw-main">台灣時間：--</span><span class="kgen-utc-sub">UTC：--</span>';
    },
    tick: function(){
      const now = new Date();
      const taiwan = "台灣時間：" + formatTaipei(now);
      const utc = "UTC：" + formatUTC(now);
      ["sys-clock", "kh-utc"].forEach(function(id){
        const root = $(id);
        if(!root) return;
        const tw = root.querySelector(".kgen-tw-main");
        const utcNode = root.querySelector(".kgen-utc-sub");
        if(tw && tw.textContent !== taiwan) tw.textContent = taiwan;
        if(utcNode && utcNode.textContent !== utc) utcNode.textContent = utc;
      });
    }
  };

  const CountdownRuntime = {
    inited: false,
    shells: [],
    init: function(){
      if(this.inited) return;
      this.inited = true;
      const shells = [];
      NY_SLOT_IDS.forEach(function(id){
        const el = $(id);
        if(!el) return;
        shells.push(ensureNyShell(el, id === "kh-ny-slot"));
      });
      qa(".ny-countdown,.kgen-ny-countdown,.v714-ny-line,[class*='ny-count']").forEach(function(el){
        if(!el || el.id === "kgen-v102-festival-countdown" || el.dataset.kgenNyShell === "1") return;
        shells.push(ensureNyShell(el, false));
      });
      this.shells = shells;
      this.tick();
    },
    tick: function(){
      const nowMs = Date.now();
      const parts = nyDiffParts(nextLocal(12, 31, 23, 59, 59) - nowMs);
      this.shells.forEach(function(root){
        updateNyShell(root, parts);
      });
      setNodeText($("kgen-v102-festival-countdown"), [
        "跨年 " + formatSpan(nextLocal(12, 31, 23, 59, 59) - nowMs),
        "520 " + formatSpan(nextLocal(5, 20, 0, 0, 0) - nowMs),
        "1111 " + formatSpan(nextLocal(11, 11, 0, 0, 0) - nowMs)
      ].join("｜"));
      setNodeText($("kh-festival-open"), getFestivalWindowLabel(new Date()));
    }
  };

  const HolyCupRuntime = {
    inited: false,
    count: 0,
    max: 3,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_HOLYCUP_RUNTIME = this;
      this.load();
      this.bindButtons();
      this.render();
    },
    load: function(){
      let nextCount = 0;
      CUP_KEYS.forEach(function(key){
        nextCount = Math.max(nextCount, Number(localStorage.getItem(key) || "0") || 0);
      });
      if(window.__templeCupCount != null){
        nextCount = Math.max(nextCount, Number(window.__templeCupCount) || 0);
      }
      this.count = Math.min(this.max, Math.max(0, nextCount));
      return this.count;
    },
    save: function(){
      CUP_KEYS.forEach(function(key){
        localStorage.setItem(key, String(HolyCupRuntime.count));
      });
      window.__templeCupCount = this.count;
    },
    isComplete: function(){
      this.load();
      return this.count >= this.max;
    },
    cupLabels: ["一", "二", "三"],
    cupMarks: ["①", "②", "③"],
    statusText: function(){
      this.load();
      const count = this.count;
      if(count >= this.max){
        return "聖盃狀態：3/3\n✅ 聖盃完成，可以領取發財金";
      }
      const lines = ["聖盃狀態：" + count + "/3"];
      for(let index = 1; index <= this.max; index++){
        const done = count >= index;
        lines.push(this.cupMarks[index - 1] + " 聖盃" + this.cupLabels[index - 1] + "：" + (done ? "完成" : "未完成"));
      }
      return lines.join("\n");
    },
    render: function(){
      this.load();
      const text = this.statusText();
      ["v57-cup-status", "v714-cup-status", "v715-cup-status", "v715-cup-log", "kh-cup-status"].forEach(function(id){
        const el = $(id);
        if(!el) return;
        if(el.textContent !== text) el.textContent = text;
        el.dataset.kgenCupCount = String(HolyCupRuntime.count);
      });
      [1, 2, 3].forEach(function(index){
        const button = $("kh-cup-" + index);
        if(!button) return;
        const done = HolyCupRuntime.count >= index;
        const next = HolyCupRuntime.count === index - 1;
        button.classList.toggle("done", done);
        button.classList.toggle("kh-cup-next", next);
        button.disabled = false;
        button.textContent = "聖盃" + (index === 1 ? "一" : index === 2 ? "二" : "三") + (done ? " ✓" : "");
      });
      HeartRuntime.updateFortuneStatus();
    },
    cupPress: function(index){
      this.load();
      if(this.count >= this.max){
        StatusRuntime.push("聖盃已完成，可以領取");
        return false;
      }
      if(index !== this.count + 1){
        const needLabel = "聖盃" + this.cupLabels[this.count];
        StatusRuntime.push(this.count < index - 1 ? "請先完成" + needLabel : "此聖盃已完成");
        this.render();
        return false;
      }
      this.count = index;
      this.save();
      this.render();
      StatusRuntime.push("聖盃狀態：" + this.count + "/3");
      return false;
    },
    reset: function(){
      this.count = 0;
      this.save();
      this.render();
      StatusRuntime.push("聖盃已重置");
      return false;
    },
    bindButtons: function(){
      const actions = {
        "kh-cup-1": function(){ HolyCupRuntime.cupPress(1); },
        "kh-cup-2": function(){ HolyCupRuntime.cupPress(2); },
        "kh-cup-3": function(){ HolyCupRuntime.cupPress(3); },
        "kh-cup-reset": function(){ HolyCupRuntime.reset(); }
      };
      Object.keys(actions).forEach(function(id){
        const button = $(id);
        if(!button) return;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          actions[id]();
        }, true);
      });
    }
  };

  const MirrorRuntime = {
    inited: false,
    mode: "heart",
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_MIRROR_VIEW = this;
    },
    apply: function(mode){
      this.mode = mode || "heart";
      const image = $("fairy-img");
      const video = $("cam-view");
      const app = window.app || {};
      try{
        if(app.stream) app.stream.getTracks().forEach(function(track){ track.stop(); });
        app.stream = null;
        app.isCam = false;
        app.camMode = null;
        app.kgenCamBusy = false;
      }catch(_){ }
      if(video){
        video.srcObject = null;
        video.style.opacity = "0";
      }
      if(image){
        image.src = this.mode === "front" ? ASSETS.front : this.mode === "back" ? ASSETS.back : ASSETS.heart;
        image.style.opacity = "1";
        image.style.visibility = "visible";
      }
      document.body.classList.remove("kgen-camera-on", "kgen-camera-front", "kgen-camera-back");
      document.body.classList.toggle("kgen-mirror-front", this.mode === "front");
      document.body.classList.toggle("kgen-mirror-back", this.mode === "back");
      const steer = $("steer-input-val");
      if(steer && this.mode !== "heart"){
        const degree = this.mode === "front" ? 45 : 135;
        steer.value = String(degree);
        steer.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setNodeText($("cp-deg-num"), this.mode === "front" ? "45°｜多方" : this.mode === "back" ? "135°｜空方" : "待部署");
      setNodeText($("cp-side"), this.mode === "front" ? "方向：多方" : this.mode === "back" ? "方向：空方" : "循環：Heart ↔ Brain");
      setNodeText($("kc-dir"), this.mode === "front" ? "方向盤 → 多方K" : this.mode === "back" ? "方向盤 → 空方K" : "方向盤 → --方K");
      setNodeText($("k12345-slider-status"), this.mode === "front" ? "CORE 角度 45°｜多方｜縮放 100%" : this.mode === "back" ? "CORE 角度 135°｜空方｜縮放 100%" : "CORE 角度 0°｜縮放 100%");
      setNodeText($("wish-label"), this.mode === "front" ? "悟空心臟｜前鏡多方" : this.mode === "back" ? "悟空心臟｜後鏡空方" : "悟空心臟，財氣覺醒");
      StatusRuntime.push(this.mode === "front" ? "前鏡多方：已切換 bull-front" : this.mode === "back" ? "後鏡空方：已切換 bear-rear" : "已恢復心臟核心圖");
    },
    toggleFront: function(){
      this.apply(this.mode === "front" ? "heart" : "front");
    },
    toggleBack: function(){
      this.apply(this.mode === "back" ? "heart" : "back");
    }
  };

  const ScreenRecorderRuntime = {
    inited: false,
    state: {
      stream: null,
      recorder: null,
      chunks: [],
      active: false
    },
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_SCREEN_REC = this;
      const self = this;
      [["kgen-v902-rec-start", function(){ self.start(); }], ["kgen-v902-rec-stop", function(){ self.stop(); }], ["kgen-v902-rec-help", function(){ self.help(); }], ["kgen-v902-rec-close", function(){ self.closePanel(); }]].forEach(function(entry){
        const button = $(entry[0]);
        if(!button) return;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          entry[1]();
        }, true);
      });
    },
    openPanel: function(){
      const panel = $("kgen-v902-rec-panel");
      if(!panel){
        StatusRuntime.push("找不到錄影面板");
        return false;
      }
      panel.classList.add("active");
      StatusRuntime.push("螢幕錄影面板已開啟");
      return true;
    },
    closePanel: function(){
      const panel = $("kgen-v902-rec-panel");
      if(panel) panel.classList.remove("active");
      StatusRuntime.push("螢幕錄影面板已關閉");
    },
    help: function(){
      const text = "錄影說明：授權螢幕後開始錄製，停止後會自動下載 WebM。";
      setNodeText($("kgen-v902-rec-text"), text);
      StatusRuntime.push(text);
    },
    stopTracks: function(){
      try{
        if(this.state.stream) this.state.stream.getTracks().forEach(function(track){ track.stop(); });
      }catch(_){ }
      this.state.stream = null;
    },
    stop: function(){
      if(this.state.recorder && this.state.recorder.state !== "inactive"){
        this.state.recorder.stop();
        return;
      }
      StatusRuntime.push("目前沒有正在錄影");
    },
    start: async function(){
      if(this.state.active){
        this.stop();
        return;
      }
      if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
        StatusRuntime.push("瀏覽器不支援螢幕錄影");
        return;
      }
      if(!window.MediaRecorder){
        StatusRuntime.push("瀏覽器不支援 MediaRecorder");
        return;
      }
      try{
        StatusRuntime.push("螢幕錄影：等待瀏覽器授權");
        this.state.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        this.state.chunks = [];
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
        this.state.recorder = new MediaRecorder(this.state.stream, { mimeType: mimeType });
        this.state.recorder.ondataavailable = function(event){
          if(event.data && event.data.size) ScreenRecorderRuntime.state.chunks.push(event.data);
        };
        this.state.recorder.onstop = function(){
          try{
            const blob = new Blob(ScreenRecorderRuntime.state.chunks, { type: "video/webm" });
            const anchor = document.createElement("a");
            anchor.href = URL.createObjectURL(blob);
            anchor.download = "KGEN-12345-SCREEN-" + Date.now() + ".webm";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
          }catch(_){ }
          ScreenRecorderRuntime.stopTracks();
          ScreenRecorderRuntime.state.active = false;
          StatusRuntime.push("螢幕錄影已完成並下載");
        };
        this.state.stream.getVideoTracks().forEach(function(track){
          track.addEventListener("ended", function(){
            if(ScreenRecorderRuntime.state.recorder && ScreenRecorderRuntime.state.recorder.state !== "inactive"){
              ScreenRecorderRuntime.state.recorder.stop();
            }
          }, { once: true });
        });
        this.state.recorder.start(1000);
        this.state.active = true;
        StatusRuntime.push("螢幕錄影進行中");
      }catch(error){
        this.stopTracks();
        this.state.active = false;
        StatusRuntime.push("螢幕錄影未啟動：" + asErrorMessage(error));
      }
    }
  };

  const LayoutRuntime = {
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.dedupeCupUI();
      this.moveFestivalBelowAudio();
      this.closeRightRule();
    },
    dedupeCupUI: function(){
      const panel = $("kgen-heart-live-panel");
      const keep = panel ? panel.querySelector(".kh-actions-cup") : null;
      if(keep && panel){
        qa("button[id^='kh-cup-']", panel).forEach(function(node){
          if(keep.contains(node)) return;
          node.id = node.id + "-legacy";
          node.style.display = "none";
          node.setAttribute("aria-hidden", "true");
          node.dataset.kgenCupLegacy = "1";
        });
      }
      const injected = $("kh-cupbox");
      if(injected) injected.remove();
      qa("button[id^='kh-cup-']").forEach(function(node){
        if(panel && panel.contains(node)) return;
        node.id = node.id + "-legacy";
        node.style.display = "none";
        node.setAttribute("aria-hidden", "true");
        node.dataset.kgenCupLegacy = "1";
      });
    },
    moveFestivalBelowAudio: function(){
      const panel = $("kgen-v102-festival-panel");
      const nav = $("universe-nav");
      if(!panel || !nav) return;
      panel.classList.add("kgen-layout-fixed");
      panel.dataset.kgenOrgan = "festival-organ";
      const audio = qa("button,.nav-btn", nav).find(function(node){
        return /音效|說明/.test(node.textContent || "");
      });
      if(audio && audio.nextSibling){
        nav.insertBefore(panel, audio.nextSibling);
      }else if(panel.parentElement !== nav){
        nav.appendChild(panel);
      }
      const heading = panel.querySelector("h3");
      if(heading){
        heading.innerHTML = '520 / 1111 / 跨年活動 <span style="float:right">展開</span>';
        Events.bindOnce(heading, "click", function(){
          LayoutRuntime.toggleFestivalPanel();
        });
      }
      panel.classList.add("kgen-festival-closed");
      qa("button", panel).forEach(function(button){
        button.dataset.kgenCell = "festival-button-cell";
      });
    },
    closeRightRule: function(){
      document.body.classList.add("kgen-right-rule-closed", "kgen-v10-right-info-collapsed", "kgen-v920-right-info-collapsed");
      const panel = $("coord-panel") || document.querySelector(".coord-panel,#right-info-panel,.right-info-panel");
      if(panel){
        panel.style.display = "none";
        panel.style.visibility = "hidden";
        panel.style.pointerEvents = "none";
      }
    },
    toggleRightRule: function(){
      const panel = $("coord-panel") || document.querySelector(".coord-panel,#right-info-panel,.right-info-panel");
      const willOpen = document.body.classList.contains("kgen-right-rule-closed");
      document.body.classList.toggle("kgen-right-rule-closed", !willOpen);
      document.body.classList.toggle("kgen-v10-right-info-collapsed", !willOpen);
      document.body.classList.toggle("kgen-v920-right-info-collapsed", !willOpen);
      if(panel){
        if(willOpen){
          panel.style.removeProperty("display");
          panel.style.removeProperty("visibility");
          panel.style.removeProperty("pointer-events");
        }else{
          panel.style.display = "none";
          panel.style.visibility = "hidden";
          panel.style.pointerEvents = "none";
        }
      }
      return willOpen;
    },
    toggleRightRuleWithStatus: function(){
      const open = this.toggleRightRule();
      StatusRuntime.push(open ? "右側神規已展開" : "右側神規已收合");
    },
    toggleFestivalPanel: function(){
      const panel = $("kgen-v102-festival-panel");
      if(!panel){
        StatusRuntime.push("找不到規則活動面板");
        return;
      }
      panel.classList.toggle("kgen-festival-closed");
      const isOpen = !panel.classList.contains("kgen-festival-closed");
      const toggle = panel.querySelector("h3 span");
      if(toggle) toggle.textContent = isOpen ? "收合" : "展開";
      StatusRuntime.push(isOpen ? "規則活動已展開" : "規則活動已收合");
    }
  };

  const HeartRuntime = {
    inited: false,
    readPromise: null,
    roProvider: null,
    state: {
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      tokenAddress: CHAIN.KGEN,
      tokenDecimals: 18,
      kgenBal: null,
      heartBal: null,
      allowance: null,
      bnbBal: null,
      blockTs: 0,
      readAtMs: 0,
      heartData: null,
      readError: null
    },
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.bindButtons();
      this.bindFields();
    },
    getEthereum: function(){
      let provider = window.ethereum || window.BinanceChain || null;
      try{
        if(provider && Array.isArray(provider.providers) && provider.providers.length){
          provider = provider.providers.find(function(entry){
            return entry && (entry.isBinance || entry.isMetaMask || entry.isTrust || entry.isOKXWallet);
          }) || provider.providers[0];
        }
      }catch(_){ }
      return provider || null;
    },
    providerRO: function(){
      if(!hasEthers5()) return null;
      if(!this.roProvider) this.roProvider = new ethers.providers.JsonRpcProvider(CHAIN.RPC);
      return this.roProvider;
    },
    syncLegacyWeb3Bridge: function(){
      try{
        if(window.web3){
          window.web3.KGEN = CHAIN.KGEN;
          window.web3.UNIVERSE = CHAIN.HEART;
          window.web3.provider = this.state.provider;
          window.web3.signer = this.state.signer;
          window.web3.addr = this.state.address;
          window.web3.address = this.state.address;
        }
      }catch(_){ }
    },
    syncFromWeb3: function(){
      const w3 = window.web3;
      if(!w3) return false;
      if(w3.provider) this.state.provider = w3.provider;
      if(w3.signer) this.state.signer = w3.signer;
      if(w3.addr) this.state.address = w3.addr;
      if(w3.provider && typeof w3.provider.getNetwork === "function"){
        w3.provider.getNetwork().then(function(net){
          if(net && net.chainId != null){
            HeartRuntime.state.chainId = "0x" + Number(net.chainId).toString(16);
            HeartRuntime.updateWalletDom();
          }
        }).catch(function(){ });
      }
      this.syncLegacyWeb3Bridge();
      this.updateWalletDom();
      return !!(this.state.address || w3.addr);
    },
    hasInjectedWallet: function(){
      return !!(this.getEthereum());
    },
    isOnBSC: function(){
      return String(this.state.chainId || "").toLowerCase() === String(CHAIN.BSC).toLowerCase();
    },
    ensureEthers: function(){
      if(!hasEthers5()) throw new Error("ethers.js 尚未載入");
    },
    ensureBSC: async function(){
      const ethereum = this.getEthereum();
      if(!ethereum) throw new Error("未偵測到 EVM 錢包");
      const currentChain = await ethereum.request({ method: "eth_chainId" });
      this.state.chainId = currentChain;
      if(String(currentChain).toLowerCase() === String(CHAIN.BSC).toLowerCase()) return currentChain;
      try{
        await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.BSC }] });
      }catch(error){
        if(error && error.code === 4902){
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: CHAIN.BSC,
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [CHAIN.RPC],
              blockExplorerUrls: ["https://bscscan.com"]
            }]
          });
          await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.BSC }] });
        }else{
          throw error;
        }
      }
      this.state.chainId = await ethereum.request({ method: "eth_chainId" });
      return this.state.chainId;
    },
    ensureConnected: async function(){
      this.ensureEthers();
      const ethereum = this.getEthereum();
      if(!ethereum) throw new Error("未偵測到 EVM 錢包");
      await this.ensureBSC();
      await ethereum.request({ method: "eth_requestAccounts" });
      this.state.provider = new ethers.providers.Web3Provider(ethereum);
      this.state.signer = this.state.provider.getSigner();
      this.state.address = await this.state.signer.getAddress();
      this.state.chainId = await ethereum.request({ method: "eth_chainId" });
      this.syncLegacyWeb3Bridge();
      this.updateWalletDom();
      return this.state.signer;
    },
    connectWallet: async function(){
      return WalletRuntime.connect();
    },
    heartContract: async function(){
      await this.ensureConnected();
      return new ethers.Contract(CHAIN.HEART, HEART_ABI_V326, this.state.signer);
    },
    currentBlockTs: function(){
      if(!this.state.blockTs) return Math.floor(Date.now() / 1000);
      return this.state.blockTs + Math.max(0, Math.floor((Date.now() - this.state.readAtMs) / 1000));
    },
    formatToken: function(value){
      if(value == null || !hasEthers5()) return "--";
      return Number(ethers.utils.formatUnits(value, this.state.tokenDecimals || 18)).toFixed(4) + " KGEN";
    },
    getAmountWhole: function(defaultValue){
      const value = String($('kh-amount') && $('kh-amount').value || defaultValue || '8').trim();
      if(!/^\d+$/.test(value)) throw new Error("請輸入整數金額 / 天數");
      return String(Math.floor(Number(value)));
    },
    getWishHash: function(){
      this.ensureEthers();
      const raw = String($('kh-wish') && $('kh-wish').value || '').trim();
      if(/^0x[0-9a-fA-F]{64}$/.test(raw)) return raw;
      if(!raw) throw new Error("請輸入許願文字或 bytes32 hash");
      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(raw));
    },
    updateWalletDom: function(){
      setNodeText($("kh-wallet"), this.state.address ? short(this.state.address) + "｜" + this.state.address : "未連線");
      setNodeText($("kh-chain"), String(this.state.chainId || "").toLowerCase() === String(CHAIN.BSC).toLowerCase() ? "BSC 56" : this.state.chainId || "BSC 56");
      if(this.state.heartBal != null) setNodeText($("kh-heart-bal"), this.formatToken(this.state.heartBal));
      if(this.state.address && this.state.kgenBal != null) setNodeText($("kh-kgen-bal"), this.formatToken(this.state.kgenBal));
      else if(!this.state.address) setNodeText($("kh-kgen-bal"), "--");
    },
    refreshChainData: async function(verbose){
      if(this.readPromise) return this.readPromise;
      if(!hasEthers5()){
        this.state.readError = new Error("ethers.js 尚未載入");
        this.statusTick();
        return;
      }
      const self = this;
      this.readPromise = (async function(){
        try{
          const provider = self.providerRO();
          if(!provider) throw new Error("無法建立唯讀節點");
          const latest = await provider.getBlock("latest");
          self.state.blockTs = latest && latest.timestamp ? Number(latest.timestamp) : Math.floor(Date.now() / 1000);
          self.state.readAtMs = Date.now();

          const ethereum = self.getEthereum();
          if(ethereum){
            try{
              const accounts = await ethereum.request({ method: "eth_accounts" });
              self.state.address = accounts && accounts[0] ? accounts[0] : null;
              self.state.chainId = await ethereum.request({ method: "eth_chainId" });
            }catch(_){ }
          }

          const heartView = new ethers.Contract(CHAIN.HEART, HEART_VIEW_ABI, provider);
          let tokenAddress = CHAIN.KGEN;
          try{
            tokenAddress = await heartView.kgen();
          }catch(_){ }
          self.state.tokenAddress = tokenAddress || CHAIN.KGEN;
          const tokenView = new ethers.Contract(self.state.tokenAddress, ERC20_VIEW_ABI, provider);
          self.state.tokenDecimals = Number(await tokenView.decimals().catch(function(){ return 18; }));
          self.state.heartBal = await tokenView.balanceOf(CHAIN.HEART);

          const chainReads = await Promise.all([
            heartView.heartbeatCooldownSeconds(),
            heartView.fortuneCooldownSeconds(),
            heartView.igniteWindowStart(),
            heartView.igniteWindowEnd(),
            heartView.fortuneMin(),
            heartView.fortuneMax(),
            heartView.fortuneCapEnabled(),
            heartView.fortuneEpochMaxClaims(),
            heartView.currentFortuneEpochIndex(),
            heartView.timeOfDaySeconds(),
            heartView.currentDayIndex()
          ]);

          const user = {
            lastHb: 0,
            lastFortune: 0,
            lastIgniteDay: 0,
            epochClaims: 0,
            allowance: null
          };

          self.state.kgenBal = null;
          self.state.allowance = null;
          self.state.bnbBal = null;
          if(self.state.address){
            try{
              const walletReads = await Promise.all([
                tokenView.balanceOf(self.state.address),
                tokenView.allowance(self.state.address, CHAIN.HEART),
                provider.getBalance(self.state.address),
                heartView.lastHeartbeatAt(self.state.address),
                heartView.lastFortuneAt(self.state.address),
                heartView.lastIgniteDay(self.state.address),
                heartView.fortuneEpochClaims(chainReads[8])
              ]);
              self.state.kgenBal = walletReads[0];
              self.state.allowance = walletReads[1];
              self.state.bnbBal = walletReads[2];
              user.lastHb = walletReads[3];
              user.lastFortune = walletReads[4];
              user.lastIgniteDay = walletReads[5];
              user.epochClaims = walletReads[6];
              user.allowance = walletReads[1];
            }catch(error){
              console.warn("[KGEN Runtime] wallet reads failed", error);
            }
          }

          self.state.heartData = {
            heartbeatCooldown: bnNum(chainReads[0]),
            fortuneCooldown: bnNum(chainReads[1]),
            igniteStart: bnNum(chainReads[2]),
            igniteEnd: bnNum(chainReads[3]),
            fortuneMin: bnNum(chainReads[4]),
            fortuneMax: bnNum(chainReads[5]),
            fortuneCapEnabled: !!chainReads[6],
            fortuneEpochMax: bnNum(chainReads[7]),
            epochIndex: bnNum(chainReads[8]),
            tod: bnNum(chainReads[9]),
            dayIndex: bnNum(chainReads[10]),
            heartBal: self.state.heartBal,
            dec: self.state.tokenDecimals,
            user: user
          };
          self.state.readError = null;
          self.updateWalletDom();
          self.statusTick();
          if(verbose) StatusRuntime.push("鏈上資料已刷新");
        }catch(error){
          self.state.readError = error;
          self.statusTick();
          if(verbose) StatusRuntime.push("鏈上資料刷新失敗：" + asErrorMessage(error));
          console.warn("[KGEN Runtime]", error);
        }finally{
          self.readPromise = null;
        }
      })();
      return this.readPromise;
    },
    getFortuneBlockReasons: function(){
      const reasons = [];
      if(!this.state.address) return ["未連錢包"];
      if(String(this.state.chainId || '').toLowerCase() !== String(CHAIN.BSC).toLowerCase()) return ["錢包不在 BSC"];
      if(!HolyCupRuntime.isComplete()) return ["三聖盃未完成"];
      if(this.state.bnbBal != null && hasEthers5()){
        const minGas = ethers.utils.parseEther("0.0003");
        if(this.state.bnbBal.lt(minGas)) reasons.push("BNB gas 不足");
      }
      if(!this.state.heartData) return ["等待鏈上資料"];
      const data = this.state.heartData;
      const now = this.currentBlockTs();
      let amountWhole = null;
      try{
        amountWhole = Number(this.getAmountWhole('8'));
      }catch(_){
        amountWhole = null;
      }
      const nextFortune = bnNum(data.user.lastFortune) + data.fortuneCooldown;
      if(bnNum(data.user.lastFortune) > 0 && now < nextFortune){
        reasons.push("合約目前不可領（冷卻倒數 " + formatHMS((nextFortune - now) * 1000) + "）");
      }
      if(!Number.isFinite(amountWhole)) reasons.push("合約目前不可領（金額格式錯誤）");
      else if(amountWhole < data.fortuneMin || amountWhole > data.fortuneMax) reasons.push("合約目前不可領（金額須 " + data.fortuneMin + "–" + data.fortuneMax + "）");
      if(data.fortuneCapEnabled && bnNum(data.user.epochClaims) >= data.fortuneEpochMax) reasons.push("已被領完 / 餘額不足");
      if(hasEthers5() && data.heartBal != null && Number.isFinite(amountWhole)){
        const need = ethers.utils.parseUnits(String(amountWhole), data.dec || 18);
        if(data.heartBal.lt(need)) reasons.push("已被領完 / 餘額不足");
      }
      return reasons;
    },
    updateHeartbeatStatus: function(){
      const status = $("kh-heartbeat-status");
      if(!status) return;
      if(!this.state.heartData || this.state.readError){
        status.textContent = "心跳呼吸：等待鏈上資料";
        return;
      }
      if(!this.state.address){
        status.textContent = "心跳呼吸：未連錢包";
        return;
      }
      if(String(this.state.chainId || '').toLowerCase() !== String(CHAIN.BSC).toLowerCase()){
        status.textContent = "心跳呼吸：錢包不在 BSC";
        return;
      }
      const now = this.currentBlockTs();
      const last = bnNum(this.state.heartData.user.lastHb);
      const next = last > 0 ? last + this.state.heartData.heartbeatCooldown : now;
      status.textContent = now >= next ? "心跳呼吸：可領" : "心跳呼吸：倒數 " + formatHMS((next - now) * 1000);
    },
    updateIgniteStatus: function(){
      const status = $("kh-ignite-status");
      if(!status) return;
      if(!this.state.heartData || this.state.readError){
        status.textContent = "轉日呼吸：等待鏈上資料";
        return;
      }
      const data = this.state.heartData;
      const hint = "鏈上重置：UTC 00:00｜台灣可領：每日 08:00";
      const now = this.currentBlockTs();
      const inWindow = data.tod >= data.igniteStart && data.tod <= data.igniteEnd;
      setNodeText($("kh-ignite-open"), inWindow ? "OPEN UTC 00:00–00:10" : "CLOSED");
      if(!this.state.address){
        status.textContent = "轉日呼吸：未連錢包｜" + hint;
        return;
      }
      if(String(this.state.chainId || '').toLowerCase() !== String(CHAIN.BSC).toLowerCase()){
        status.textContent = "轉日呼吸：錢包不在 BSC｜" + hint;
        return;
      }
      const alreadyToday = bnNum(data.user.lastIgniteDay) === data.dayIndex;
      if(inWindow && !alreadyToday){
        status.textContent = "轉日呼吸：可領｜" + hint;
        return;
      }
      if(inWindow && alreadyToday){
        const nextDayStart = (data.dayIndex + 1) * 86400;
        status.textContent = "轉日呼吸：倒數 " + formatHMS((nextDayStart - now) * 1000) + "｜" + hint;
        return;
      }
      const dayStart = data.dayIndex * 86400;
      const windowStart = dayStart + data.igniteStart;
      const target = now < windowStart ? windowStart : (data.dayIndex + 1) * 86400 + data.igniteStart;
      status.textContent = "轉日呼吸：倒數 " + formatHMS((target - now) * 1000) + "｜" + hint;
    },
    updateFortuneStatus: function(){
      const status = $("kh-fortune-status");
      if(!status) return;
      if(!HolyCupRuntime.isComplete()){
        status.textContent = "發財金：需要聖盃（" + HolyCupRuntime.count + "/3）";
        return;
      }
      if(!this.state.heartData || this.state.readError){
        status.textContent = "發財金：等待鏈上資料";
        return;
      }
      const reasons = this.getFortuneBlockReasons().filter(function(reason){
        return reason !== "三聖盃未完成";
      });
      status.textContent = reasons.length ? "發財金：鏈上條件 — " + reasons[0] : "發財金：可領";
    },
    statusTick: function(){
      this.updateWalletDom();
      this.updateHeartbeatStatus();
      this.updateIgniteStatus();
      this.updateFortuneStatus();
    },
    sendHeart: async function(label, runner){
      try{
        if(/fortuneClaim/.test(label) && !HolyCupRuntime.isComplete()){
          StatusRuntime.push("發財金：三聖盃未完成（" + HolyCupRuntime.count + "/3）");
          return;
        }
        if(!this.hasInjectedWallet() && !this.state.address){
          StatusRuntime.push(label + "：未連錢包");
          if(window.web3 && typeof window.web3.openWalletHub === "function") window.web3.openWalletHub();
          return;
        }
        if(!this.state.heartData && this.state.readError){
          StatusRuntime.push(label + "：功能等待鏈上資料");
        }
        await this.ensureConnected();
        if(!this.isOnBSC()){
          StatusRuntime.push(label + "：請切換至 BSC（鏈 ID 56）");
          return;
        }
        if(!window.confirm("確認送出交易：" + label + "\n\n會花 BNB gas，鏈上交易不可逆。")){
          StatusRuntime.push("已取消：" + label);
          return;
        }
        const contract = await this.heartContract();
        StatusRuntime.push("送出中：" + label);
        const tx = await runner(contract);
        StatusRuntime.push("Tx sent：" + tx.hash);
        const receipt = await tx.wait();
        StatusRuntime.push("成功：" + label + "｜Block " + receipt.blockNumber);
        await this.refreshChainData(false);
      }catch(error){
        StatusRuntime.push("失敗：" + label + "｜" + asErrorMessage(error));
      }
    },
    approveCurrent: async function(){
      try{
        if(!this.hasInjectedWallet() && !this.state.address){
          StatusRuntime.push("Approve 目前金額：未連錢包");
          return;
        }
        await this.ensureConnected();
        await this.refreshChainData(false);
        const amountWhole = this.getAmountWhole('8');
        const amount = ethers.utils.parseUnits(String(amountWhole), this.state.tokenDecimals || 18);
        if(!window.confirm("確認授權目前金額：" + amountWhole + " KGEN")){
          StatusRuntime.push("已取消：Approve 目前金額");
          return;
        }
        const token = new ethers.Contract(this.state.tokenAddress || CHAIN.KGEN, ERC20_VIEW_ABI, this.state.signer);
        StatusRuntime.push("送出中：Approve 目前金額 " + amountWhole + " KGEN");
        const tx = await token.approve(CHAIN.HEART, amount);
        StatusRuntime.push("Tx sent：" + tx.hash);
        await tx.wait();
        StatusRuntime.push("成功：Approve 目前金額");
        await this.refreshChainData(false);
      }catch(error){
        StatusRuntime.push("Approve 失敗：" + asErrorMessage(error));
      }
    },
    approveUnlimited: async function(){
      try{
        if(!this.hasInjectedWallet() && !this.state.address){
          StatusRuntime.push("無限授權：未連錢包");
          return;
        }
        await this.ensureConnected();
        if(!window.confirm("確認送出無限授權給 Heart 合約？")){
          StatusRuntime.push("已取消：Approve 無限授權");
          return;
        }
        const token = new ethers.Contract(this.state.tokenAddress || CHAIN.KGEN, ERC20_VIEW_ABI, this.state.signer);
        StatusRuntime.push("送出中：Approve 無限授權");
        const tx = await token.approve(CHAIN.HEART, ethers.constants.MaxUint256);
        StatusRuntime.push("Tx sent：" + tx.hash);
        await tx.wait();
        StatusRuntime.push("成功：Approve 無限授權");
        await this.refreshChainData(false);
      }catch(error){
        StatusRuntime.push("Approve 失敗：" + asErrorMessage(error));
      }
    },
    bindFields: function(){
      const amount = $("kh-amount");
      if(amount) Events.bindOnce(amount, "input", function(){ HeartRuntime.updateFortuneStatus(); });
    },
    bindButtons: function(){
      const self = this;
      const actions = {
        "kh-fortune": function(){ self.sendHeart("fortuneClaim 發財金 " + self.getAmountWhole('8'), function(contract){ return contract.fortuneClaim(self.getAmountWhole('8')); }); },
        "kh-heartbeat": function(){ self.sendHeart("heartbeatClaim 整點心跳", function(contract){ return contract.heartbeatClaim(); }); },
        "kh-ignite": function(){ self.sendHeart("igniteAndClaim 轉日呼吸", function(contract){ return contract.igniteAndClaim(); }); },
        "kh-vow": function(){ self.sendHeart("vowTo 還願", function(contract){ return contract.vowTo(Number($('kh-vow-option') && $('kh-vow-option').value || 1), self.getAmountWhole('8')); }); },
        "kh-lamp": function(){ self.sendHeart("lightLamp 點燈", function(contract){ return contract.lightLamp(self.getAmountWhole('8')); }); },
        "kh-wishbtn": function(){ self.sendHeart("makeWish 許願", function(contract){ return contract.makeWish(self.getWishHash()); }); },
        "kh-festival1": function(){ self.sendHeart("festivalClaim " + FESTIVAL_LABELS[1], function(contract){ return contract.festivalClaim(1); }); },
        "kh-festival2": function(){ self.sendHeart("festivalClaim " + FESTIVAL_LABELS[2], function(contract){ return contract.festivalClaim(2); }); },
        "kh-newyear": function(){ self.sendHeart("newYearCountdownClaim 跨年倒數", function(contract){ return contract.newYearCountdownClaim(); }); },
        "kgen-v102-festival-520": function(){ self.sendHeart("festivalClaim " + FESTIVAL_LABELS[1], function(contract){ return contract.festivalClaim(1); }); },
        "kgen-v102-festival-1111": function(){ self.sendHeart("festivalClaim " + FESTIVAL_LABELS[2], function(contract){ return contract.festivalClaim(2); }); },
        "kgen-v102-newyear": function(){ self.sendHeart("newYearCountdownClaim 跨年倒數", function(contract){ return contract.newYearCountdownClaim(); }); }
      };
      Object.keys(actions).forEach(function(id){
        const button = $(id);
        if(!button) return;
        button.disabled = false;
        button.removeAttribute("disabled");
        button.onclick = null;
        delete button.dataset.kgenBound;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          try{
            actions[id]();
          }catch(error){
            StatusRuntime.push("執行失敗：" + asErrorMessage(error));
          }
        }, true);
      });
    },
    clickAction: function(id){
      const button = $(id);
      if(!button){
        StatusRuntime.push("找不到按鈕：" + id);
        return false;
      }
      button.click();
      return true;
    }
  };

  const WalletRuntime = {
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.primeWeb3Shell();
      const bindings = {
        "kh-connect": function(){ WalletRuntime.connect(); },
        "kh-refresh": function(){ WalletRuntime.refresh(); },
        "kh-approve-current": function(){ WalletRuntime.approveCurrent(); },
        "kh-approve-unlimited": function(){ WalletRuntime.approveUnlimited(); },
        "kh-unlimited": function(){ WalletRuntime.approveUnlimited(); },
        "kh-switch": function(){ WalletRuntime.switchWallet(); },
        "kh-download": function(){ WalletRuntime.downloadBookmark(); }
      };
      Object.keys(bindings).forEach(function(id){
        WalletRuntime.bindWalletButton(id, bindings[id]);
      });
    },
    primeWeb3Shell: function(){
      try{
        if(window.web3){
          window.web3.KGEN = CHAIN.KGEN;
          window.web3.UNIVERSE = CHAIN.HEART;
          if(typeof window.web3.load === "function") window.web3.load();
        }
      }catch(_){ }
    },
    bindWalletButton: function(id, handler){
      const button = $(id);
      if(!button || typeof handler !== "function") return;
      button.disabled = false;
      button.removeAttribute("disabled");
      button.onclick = null;
      delete button.dataset.kgenBound;
      Events.bindOnce(button, "click", function(event){
        event.preventDefault();
        event.stopPropagation();
        try{
          const result = handler();
          if(result && typeof result.then === "function"){
            result.catch(function(error){
              StatusRuntime.push(asErrorMessage(error));
            });
          }
        }catch(error){
          StatusRuntime.push(asErrorMessage(error));
        }
      }, true);
    },
    connect: async function(){
      if(!HeartRuntime.hasInjectedWallet()){
        StatusRuntime.push("未偵測到錢包");
        if(window.web3 && typeof window.web3.openWalletHub === "function") window.web3.openWalletHub();
        return false;
      }
      StatusRuntime.push("準備連結錢包 / 切 BSC，請在錢包視窗確認");
      try{
        if(window.web3 && typeof window.web3.ensureBSC === "function"){
          const onBsc = await window.web3.ensureBSC();
          if(!onBsc){
            StatusRuntime.push("請切換至 BSC（鏈 ID 56）");
            return false;
          }
        }
        if(window.web3 && typeof window.web3.smartConnect === "function"){
          await window.web3.smartConnect();
          if(window.web3.demo){
            StatusRuntime.push("未偵測到錢包，已開啟多錢包入口");
            return false;
          }
          if(!HeartRuntime.syncFromWeb3()){
            await HeartRuntime.ensureConnected();
          }
        }else{
          await HeartRuntime.ensureConnected();
        }
        if(!HeartRuntime.state.address){
          StatusRuntime.push("未偵測到錢包");
          return false;
        }
        if(!HeartRuntime.isOnBSC()){
          StatusRuntime.push("請切換至 BSC（鏈 ID 56）");
          return false;
        }
        StatusRuntime.push("錢包已連線：" + short(HeartRuntime.state.address));
        await HeartRuntime.refreshChainData(true);
        return true;
      }catch(error){
        StatusRuntime.push("錢包連線失敗：" + asErrorMessage(error));
        return false;
      }
    },
    refresh: async function(){
      StatusRuntime.push("刷新餘額中…");
      try{
        if(window.web3 && typeof window.web3.refreshUser === "function"){
          await window.web3.refreshUser();
          HeartRuntime.syncFromWeb3();
        }
        await HeartRuntime.refreshChainData(true);
        StatusRuntime.push(HeartRuntime.state.address ? "餘額已刷新" : "未連錢包：請先連結錢包");
      }catch(error){
        StatusRuntime.push("刷新餘額失敗：" + asErrorMessage(error));
      }
    },
    approveCurrent: function(){
      StatusRuntime.push("Approve 目前金額：準備中…");
      return HeartRuntime.approveCurrent();
    },
    approveUnlimited: function(){
      StatusRuntime.push("無限授權：準備中…");
      return HeartRuntime.approveUnlimited();
    },
    switchWallet: function(){
      if(!HeartRuntime.hasInjectedWallet()){
        StatusRuntime.push("未偵測到錢包");
        if(window.web3 && typeof window.web3.openWalletHub === "function") window.web3.openWalletHub();
        return;
      }
      if(window.web3 && typeof window.web3.openWalletHub === "function"){
        window.web3.openWalletHub();
        StatusRuntime.push("已開啟多錢包 / 切換錢包入口");
        return;
      }
      StatusRuntime.push("請在錢包中切換帳戶後，再按刷新餘額");
    },
    downloadBookmark: function(){
      const done = function(){
        StatusRuntime.push("已複製頁面連結，可加入書籤收藏");
      };
      if(window.web3 && typeof window.web3.copyDappUrl === "function"){
        Promise.resolve(window.web3.copyDappUrl()).then(done).catch(function(){
          StatusRuntime.push("請手動將此頁加入書籤收藏");
        });
        return;
      }
      const url = String(location.href || "");
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(done).catch(function(){
          StatusRuntime.push("請手動將此頁加入書籤收藏");
        });
        return;
      }
      StatusRuntime.push("請手動將此頁加入書籤收藏");
    }
  };

  const ActionRuntime = {
    inited: false,
    footerLabels: ["拍照", "錄影", "前鏡多方", "後鏡空方", "悟空心臟", "螢幕錄影", "規則活動", "右側神規"],
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.setupHeartPanel();
      this.bindFooterButtons();
      this.bindRightRuleButtons();
      this.bindGuideButton();
      this.bindPanelButtons();
      this.bindConsoleButtons();
      this.exposeLegacyActions();
    },
    isHeartPanelOpen: function(){
      return !document.body.classList.contains("k12345-heart-collapsed");
    },
    setupHeartPanel: function(){
      const panel = $("kgen-heart-live-panel");
      const toggle = $("kgen-heart-toggle");
      if(panel){
        panel.classList.add("kgen-v909-open");
        panel.removeAttribute("style");
      }
      if(toggle){
        if(!toggle.querySelector(".kgen-heart-title")){
          toggle.innerHTML = '<span class="kgen-heart-copy"><span class="kgen-heart-title">五指山悟空財神殿</span><span class="kgen-heart-sub">12345 Heart 控制台</span></span><span class="kgen-heart-state">展開</span>';
        }
        toggle.setAttribute("type", "button");
        toggle.setAttribute("aria-controls", "kgen-heart-live-panel");
      }
      document.body.classList.add("k12345-heart-collapsed");
      this.setHeartPanelOpen(false, true);
    },
    setHeartPanelOpen: function(open, silent){
      const panel = $("kgen-heart-live-panel");
      const toggle = $("kgen-heart-toggle");
      if(!panel) return;
      document.body.classList.toggle("k12345-heart-collapsed", !open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if(toggle){
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        const state = toggle.querySelector(".kgen-heart-state");
        if(state) state.textContent = open ? "收合" : "展開";
      }
      if(!silent){
        StatusRuntime.push(open ? "悟空財神殿控制台已展開" : "悟空財神殿控制台已收合");
      }
    },
    toggleHeartPanel: function(forceOpen){
      if(!$("kgen-heart-live-panel")){
        StatusRuntime.push("找不到悟空控制台");
        return;
      }
      const willOpen = typeof forceOpen === "boolean" ? forceOpen : !this.isHeartPanelOpen();
      this.setHeartPanelOpen(willOpen, false);
    },
    bindPanelButtons: function(){
      const toggle = $("kgen-heart-toggle");
      if(toggle){
        toggle.onclick = null;
        toggle.removeAttribute("onclick");
        delete toggle.dataset.kgenBound;
        Events.bindOnce(toggle, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          ActionRuntime.toggleHeartPanel();
        }, true);
      }
      const voice = $("kgen-v102-festival-voice");
      if(voice){
        Events.bindOnce(voice, "click", function(event){
          event.preventDefault();
          StatusRuntime.push("活動規則：5/20、11/11、12/31 皆需手動確認交易");
        }, true);
      }
    },
    bindGuideButton: function(){
      const guide = $("guideUnifiedBtn");
      if(!guide) return;
      guide.onclick = null;
      guide.removeAttribute("onclick");
      delete guide.dataset.kgenBound;
      Events.bindOnce(guide, "click", function(event){
        event.preventDefault();
        event.stopPropagation();
        try{
          if(window.app && typeof window.app.openUnifiedGuide === "function"){
            window.app.openUnifiedGuide();
            StatusRuntime.push("已開啟客服 / 悟空財神殿導覽");
          }else{
            StatusRuntime.push("客服導覽：功能等待鏈上資料");
          }
        }catch(error){
          StatusRuntime.push("客服導覽開啟失敗：" + asErrorMessage(error));
        }
      }, true);
    },
    bindConsoleButtons: function(){
      const claimIds = ["kh-fortune", "kh-heartbeat", "kh-ignite", "kh-vow", "kh-lamp", "kh-wishbtn", "kh-festival1", "kh-festival2", "kh-newyear"];
      claimIds.forEach(function(id){
        const button = $(id);
        if(!button) return;
        button.disabled = false;
        button.removeAttribute("disabled");
      });
    },
    bindFooterButtons: function(){
      const footer = document.querySelector(".footer-terminal");
      if(!footer) return;
      const buttons = Array.from(footer.querySelectorAll("button,.term-btn")).slice(0, 8);
      const actions = [
        function(){
          try{
            if(window.app && typeof window.app.capture === "function") window.app.capture();
            StatusRuntime.push("拍照存證");
          }catch(error){
            StatusRuntime.push("拍照：執行失敗");
          }
        },
        function(){
          try{
            if(window.app && typeof window.app.toggleRec === "function") window.app.toggleRec();
            StatusRuntime.push("留影錄影切換");
          }catch(error){
            StatusRuntime.push("錄影：執行失敗");
          }
        },
        function(){ MirrorRuntime.toggleFront(); },
        function(){ MirrorRuntime.toggleBack(); },
        function(){ ActionRuntime.toggleHeartPanel(); },
        function(){ ScreenRecorderRuntime.openPanel(); ScreenRecorderRuntime.start(); },
        function(){ LayoutRuntime.toggleFestivalPanel(); },
        function(){ LayoutRuntime.toggleRightRuleWithStatus(); }
      ];
      buttons.forEach(function(button, index){
        button.textContent = ActionRuntime.footerLabels[index] || button.textContent;
        button.onclick = null;
        button.removeAttribute("onclick");
        button.disabled = false;
        button.removeAttribute("disabled");
        delete button.dataset.kgenBound;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if(actions[index]) actions[index]();
        }, true);
      });
    },
    bindRightRuleButtons: function(){
      qa("button,.term-btn,.nav-btn").forEach(function(button){
        const text = String(button.textContent || "").replace(/\s+/g, "");
        if(!/右側神規|神規/.test(text) || /客服導覽/.test(text)) return;
        button.onclick = null;
        button.removeAttribute("onclick");
        delete button.dataset.kgenBound;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          LayoutRuntime.toggleRightRuleWithStatus();
        }, true);
      });
    },
    exposeLegacyActions: function(){
      const old = window.templeOps || {};
      window.templeOps = Object.assign({}, old, {
        approve: function(){ return WalletRuntime.approveCurrent(); },
        cup: function(){ HolyCupRuntime.load(); return HolyCupRuntime.cupPress(Math.min(HolyCupRuntime.max, HolyCupRuntime.count + 1)); },
        resetCup: function(){ return HolyCupRuntime.reset(); },
        fortune: function(){ return HeartRuntime.clickAction("kh-fortune"); },
        heartbeat: function(){ return HeartRuntime.clickAction("kh-heartbeat"); },
        ignite: function(){ return HeartRuntime.clickAction("kh-ignite"); },
        vow: function(){ return HeartRuntime.clickAction("kh-vow"); },
        lamp: function(){ return HeartRuntime.clickAction("kh-lamp"); },
        wish: function(){ return HeartRuntime.clickAction("kh-wishbtn"); },
        festival: function(id){ return HeartRuntime.clickAction(Number(id) === 2 ? "kh-festival2" : "kh-festival1"); },
        newyear: function(){ return HeartRuntime.clickAction("kh-newyear"); },
        closeTempleModal: function(){ ActionRuntime.toggleHeartPanel(false); },
        toggleHeartPanel: function(open){ ActionRuntime.toggleHeartPanel(open); }
      });
      window.connectWallet = function(){ return WalletRuntime.connect(); };
      if(window.web3){
        window.web3.smartConnect = window.web3.smartConnect || function(){ return WalletRuntime.connect(); };
        window.web3.connect = window.web3.connect || function(){ return WalletRuntime.connect(); };
      }
    }
  };

  const LandRuntime = {
    inited: false,
    instance: null,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      if(!window.KGEN_LAND_ENGINE || typeof window.KGEN_LAND_ENGINE.create !== "function") return;
      this.instance = window.KGEN_LAND_ENGINE.create({
        universeId: "12345",
        gridSize: 20,
        dataUrl: "data/kgen-land-demo.json",
        demoPlayer: "demo-player",
        landIdPrefix: "WUKONG"
      });
      window.KGEN_LAND_DEMO = this.instance;
      window.KGEN_LAND_RUNTIME = this.instance;
      Promise.resolve(this.instance.init()).catch(function(error){
        console.warn("[KGEN Land Engine]", error);
      });
    }
  };

  const modules = {
    StatusRuntime: StatusRuntime,
    HudRuntime: HudRuntime,
    CountdownRuntime: CountdownRuntime,
    HolyCupRuntime: HolyCupRuntime,
    HeartRuntime: HeartRuntime,
    WalletRuntime: WalletRuntime,
    MirrorRuntime: MirrorRuntime,
    ScreenRecorderRuntime: ScreenRecorderRuntime,
    ActionRuntime: ActionRuntime,
    LandRuntime: LandRuntime,
    LayoutRuntime: LayoutRuntime
  };

  const KGEN_RUNTIME_CORE = {
    version: VERSION,
    modules: modules,
    booted: false,
    boot: function(){
      if(this.booted) return this;
      this.booted = true;
      StatusRuntime.init();
      LayoutRuntime.init();
      HudRuntime.init();
      CountdownRuntime.init();
      HolyCupRuntime.init();
      MirrorRuntime.init();
      ScreenRecorderRuntime.init();
      WalletRuntime.init();
      HeartRuntime.init();
      ActionRuntime.init();
      LandRuntime.init();
      TimerRegistry.register("clock", function(){ HudRuntime.tick(); }, 1000);
      TimerRegistry.register("countdown", function(){ CountdownRuntime.tick(); }, 1000);
      TimerRegistry.register("heart", function(){ HeartRuntime.refreshChainData(false); }, 12000);
      TimerRegistry.register("status", function(){ StatusRuntime.tick(); HeartRuntime.statusTick(); }, 1000);
      StatusRuntime.push("KGEN_RUNTIME_CORE V2.0.2 ready");
      return this;
    }
  };

  window.KGEN_RUNTIME_CORE = KGEN_RUNTIME_CORE;
  window.KGEN_STATUS_BUS = StatusRuntime;
  window.KGEN_HOLYCUP_RUNTIME = HolyCupRuntime;
  window.KGEN_MIRROR_VIEW = MirrorRuntime;
  window.KGEN_SCREEN_REC = ScreenRecorderRuntime;
  window.KGEN_HEART_ABI_V326 = HEART_ABI_V326;
  window.KGEN_HEART_CONTRACT = HEART_CONTRACT;
  window.RUNTIME_GENOME = Object.assign({}, window.RUNTIME_GENOME || {}, {
    species: "12345-WukongTemple",
    version: VERSION,
    tag: VERSION_TAG,
    ui_patch: UI_PATCH,
    runtime_file: "modules/runtime-main.js",
    css_file: "modules/runtime-main.css",
    heart_contract: HEART_CONTRACT,
    chain: CHAIN
  });

  document.addEventListener("DOMContentLoaded", function(){
    KGEN_RUNTIME_CORE.boot();
  }, { once: true });
})();
