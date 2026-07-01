(function(){
  "use strict";

  const VERSION = "V2.2.0 / RECOVERY";
  const VERSION_TAG = "12345-TEMPLE-RUNTIME-CORE-V2.2.0-RECOVERY";
  const UI_PATCH = "V2.2.0";
  const MUSIC_PLAYLIST_URL = "./music/playlist.json";
  const KLINE_CACHE_KEY = "kgen12345_kline_cache_v205";
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
  const WALLET_BRIDGE = {
    ROOT_ENTRY: "https://klineodyssey.github.io/kline-odyssey/12345.html",
    OFFICIAL_DAPP: "https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html",
    TEMPLE_REL: "K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html",
    BRIDGE_PAGE: "https://klineodyssey.github.io/kline-odyssey/wallet-12345.html",
    METAMASK_DAPP_PATH: "klineodyssey.github.io/kline-odyssey/12345.html?open=temple",
    METAMASK_DEEPLINK: "https://metamask.app.link/dapp/klineodyssey.github.io/kline-odyssey/12345.html?open=temple",
    TRUST_DEEPLINK: "https://link.trustwallet.com/open_url?coin_id=20000714&url=" + encodeURIComponent("https://klineodyssey.github.io/kline-odyssey/wallet-12345.html"),
    OKX_DEEPLINK: "okx://wallet/dapp/url?dappUrl=" + encodeURIComponent("https://klineodyssey.github.io/kline-odyssey/wallet-12345.html"),
    BITGET_DEEPLINK: "bitget://openDapp?url=" + encodeURIComponent("https://klineodyssey.github.io/kline-odyssey/wallet-12345.html"),
    BINANCE_DEEPLINK: "bnc://app.binance.com/cedefi/dapp?url=" + encodeURIComponent("https://klineodyssey.github.io/kline-odyssey/wallet-12345.html")
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

  const MediaRuntime = {
    inited: false,
    open: false,
    state: {
      filesMissing: false,
      playlistLoaded: false
    },
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_MEDIA_RUNTIME = this;
      this.patchOpenMusic();
      this.patchMusicPlayback();
      this.patchMusicLoadBuiltIn();
      this.patchMusicRenderList();
      this.patchMusicSetIndex();
      this.bindAudioDiagnostics();
      this.bindPanelControls();
      window.addEventListener("resize", function(){
        if(MediaRuntime.open) MediaRuntime.positionPanel();
      }, { passive: true });
      try{
        if(window.app && typeof window.app.musicInit === "function") window.app.musicInit();
      }catch(_){ }
      this.loadDefaultPlaylist();
    },
    logAudio: function(label, payload){
      try{
        if(typeof payload === "undefined"){
          console.log("[KGEN_AUDIO] " + label);
        }else{
          console.log("[KGEN_AUDIO] " + label, payload);
        }
      }catch(_){ }
    },
    logAudioState: function(stage){
      const audio = (window.app && window.app._music && window.app._music.audio) || $("music-audio");
      const err = audio && audio.error;
      this.logAudio("Audio.src", audio ? audio.src : null);
      this.logAudio("Audio.error", err || null);
      this.logAudio("error code", err ? err.code : null);
      if(stage) this.logAudio(stage, { src: audio ? audio.src : null, code: err ? err.code : null });
    },
    bindAudioDiagnostics: function(){
      const audio = $("music-audio");
      if(!audio || audio.dataset.kgenAudioDiag) return;
      audio.dataset.kgenAudioDiag = "1";
      const self = this;
      audio.addEventListener("loadedmetadata", function(){
        self.logAudio("loadedmetadata", { src: audio.src, duration: audio.duration });
        self.logAudioState("loadedmetadata");
      });
      audio.addEventListener("canplay", function(){
        self.logAudio("canplay", { src: audio.src, readyState: audio.readyState });
        self.logAudioState("canplay");
      });
      audio.addEventListener("error", function(){
        const err = audio.error;
        self.logAudio("Audio.error", err || null);
        self.logAudio("error code", err ? err.code : null);
        self.logAudioState("audio-error-event");
      });
    },
    normalizeTrackUrl: function(url){
      const raw = String(url || "").trim();
      if(!raw) return "";
      if(/^https?:\/\//i.test(raw)) return raw;
      let fname = "";
      if(raw.indexOf("./music/") === 0){
        fname = raw.slice("./music/".length);
      }else if(raw.indexOf("music/") === 0){
        fname = raw.slice("music/".length);
      }else{
        const parts = raw.split("/");
        fname = parts[parts.length - 1];
      }
      try{
        fname = decodeURIComponent(fname);
      }catch(_){ }
      return "./music/" + encodeURI(fname);
    },
    checkAudioExists: async function(url){
      const target = this.normalizeTrackUrl(url);
      try{
        const res = await fetch(target, { method: "GET", cache: "no-store", headers: { Range: "bytes=0-1" } });
        const ok = res.ok || res.status === 206;
        if(!ok){
          this.logAudio("check fail", {
            url: target,
            status: res.status,
            statusText: res.statusText,
            reason: "HTTP " + res.status
          });
        }
        return ok;
      }catch(error){
        this.logAudio("check fail", {
          url: target,
          status: null,
          reason: String(error && error.message ? error.message : error)
        });
        return false;
      }
    },
    loadDefaultPlaylist: async function(){
      const playlistUrl = MUSIC_PLAYLIST_URL;
      try{
        const res = await fetch(playlistUrl, { cache: "no-store" });
        if(!res.ok){
          this.logAudio("playlist fetch fail", {
            url: playlistUrl,
            status: res.status,
            statusText: res.statusText,
            reason: "HTTP " + res.status
          });
          return false;
        }
        const json = await res.json();
        this.logAudio("playlist", json);
        const arr = Array.isArray(json) ? json : (Array.isArray(json.tracks) ? json.tracks : []);
        const tracks = [];
        for(let i = 0; i < arr.length; i++){
          const entry = arr[i] || {};
          const url = this.normalizeTrackUrl(entry.url || entry.file || "");
          if(!url) continue;
          const fileOk = await this.checkAudioExists(url);
          tracks.push({
            name: entry.name || entry.title || ("曲目 " + (i + 1)),
            url: url,
            fileOk: fileOk
          });
        }
        this.logAudio("songs", tracks);
        if(!tracks.length){
          this.logAudio("playlist empty", { url: playlistUrl, reason: "no tracks in playlist.json" });
          return false;
        }
        window.app = window.app || {};
        window.app._music = window.app._music || {};
        const m = window.app._music;
        m.list = tracks;
        m.index = 0;
        if(!m.audio) m.audio = $("music-audio");
        this.bindAudioDiagnostics();
        this.state.filesMissing = tracks.every(function(t){ return !t.fileOk; });
        this.state.playlistLoaded = true;
        if(typeof window.app.musicSetIndex === "function") window.app.musicSetIndex(0);
        if(typeof window.app.musicRenderList === "function") window.app.musicRenderList();
        this.logAudioState("after playlist load");
        this.updateMusicStatus();
        if(this.state.filesMissing){
          const bad = tracks.filter(function(t){ return !t.fileOk; });
          StatusRuntime.push("歌單載入失敗：" + (bad[0] ? bad[0].url : playlistUrl));
        }else{
          StatusRuntime.push("已載入歌單（" + tracks.length + " 首）");
        }
        return !this.state.filesMissing;
      }catch(error){
        this.logAudio("playlist fetch fail", {
          url: playlistUrl,
          status: null,
          reason: String(error && error.message ? error.message : error)
        });
        return false;
      }
    },
    patchMusicLoadBuiltIn: function(){
      const self = this;
      const patch = function(){
        if(!window.app) return;
        window.app.musicLoadBuiltIn = function(){
          return self.loadDefaultPlaylist();
        };
        window.app.musicLoadBuiltin = window.app.musicLoadBuiltIn;
      };
      patch();
      if(!window.app) document.addEventListener("DOMContentLoaded", patch, { once: true });
    },
    patchMusicRenderList: function(){
      const patch = function(){
        if(!window.app || window.app.__kgenMusicRenderPatched) return;
        window.app.__kgenMusicRenderPatched = true;
        const legacy = window.app.musicRenderList && window.app.musicRenderList.bind(window.app);
        if(!legacy) return;
        window.app.musicRenderList = function(){
          const result = legacy.apply(window.app, arguments);
          MediaRuntime.updateMusicStatus();
          return result;
        };
      };
      patch();
      if(!window.app) document.addEventListener("DOMContentLoaded", patch, { once: true });
    },
    patchMusicSetIndex: function(){
      const patch = function(){
        if(!window.app || window.app.__kgenMusicSetIndexPatched) return;
        window.app.__kgenMusicSetIndexPatched = true;
        const legacy = window.app.musicSetIndex && window.app.musicSetIndex.bind(window.app);
        if(!legacy) return;
        window.app.musicSetIndex = function(i){
          const m = window.app._music;
          if(m && Array.isArray(m.list)){
            m.list = m.list.map(function(track){
              if(!track || !track.url) return track;
              return Object.assign({}, track, { url: MediaRuntime.normalizeTrackUrl(track.url) });
            });
          }
          const result = legacy(i);
          const audio = (m && m.audio) || $("music-audio");
          if(audio){
            MediaRuntime.logAudio("Audio.src", audio.src);
            MediaRuntime.logAudioState("musicSetIndex");
          }
          return result;
        };
      };
      patch();
      if(!window.app) document.addEventListener("DOMContentLoaded", patch, { once: true });
    },
    getAnchorButton: function(){
      return document.querySelector(".nav-btn.nav-music");
    },
    positionPanel: function(){
      const panel = $("music-panel");
      const anchor = this.getAnchorButton();
      if(!panel || !anchor) return;
      if(panel.parentElement !== document.body) document.body.appendChild(panel);
      const rect = anchor.getBoundingClientRect();
      const viewportW = window.innerWidth || document.documentElement.clientWidth || 390;
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 844;
      const panelW = Math.min(340, viewportW - 24);
      const belowTop = Math.max(8, rect.bottom + 8);
      const maxH = Math.max(160, viewportH - belowTop - 12);
      let right = Math.max(8, viewportW - rect.right);
      const leftEdge = viewportW - right - panelW;
      if(leftEdge < 8){
        right = Math.max(8, viewportW - panelW - 8);
      }
      panel.classList.remove("kgen-music-top", "kgen-music-modal");
      panel.classList.add("kgen-music-docked");
      panel.style.setProperty("position", "fixed", "important");
      panel.style.setProperty("top", belowTop + "px", "important");
      panel.style.setProperty("right", right + "px", "important");
      panel.style.setProperty("left", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      panel.style.setProperty("transform", "none", "important");
      panel.style.setProperty("width", panelW + "px", "important");
      panel.style.setProperty("max-width", "calc(100vw - 24px)", "important");
      panel.style.setProperty("max-height", maxH + "px", "important");
      panel.style.setProperty("z-index", "2147483647", "important");
      panel.style.setProperty("overflow-y", "auto", "important");
      panel.style.setProperty("pointer-events", "auto", "important");
    },
    updateMusicStatus: function(){
      const m = window.app && window.app._music;
      const list = m && m.list ? m.list : [];
      const idx = m && m.index != null ? m.index : 0;
      const track = list[idx];
      const name = $("music-name");
      const status = $("music-status");
      const now = $("music-now");
      const playBtn = $("music-play-btn");
      if(!list.length){
        if(name) name.textContent = "尚未載入音樂";
        if(status) status.textContent = "尚未載入清單";
        if(now) now.textContent = "（未選曲）";
        if(playBtn){ playBtn.textContent = "播放"; playBtn.disabled = true; }
        return;
      }
      const currentMissing = !track || track.fileOk === false;
      const allMissing = this.state.filesMissing || list.every(function(t){ return t.fileOk === false; });
      if(status){
        status.textContent = allMissing
          ? ("載入失敗（" + list.length + " 首）")
          : ("已載入歌單（" + list.length + " 首）");
      }
      if(now && track) now.textContent = "目前歌曲：" + track.name;
      if(name && track) name.textContent = track.name;
      if(playBtn){
        playBtn.textContent = "播放";
        playBtn.disabled = !!(allMissing || currentMissing);
      }
    },
    setOpen: function(open, silent){
      const panel = $("music-panel");
      if(!panel) return;
      this.open = !!open;
      document.body.classList.toggle("k21-audio-open", this.open);
      document.body.classList.toggle("k20-audio-open", this.open);
      document.body.classList.toggle("kgen-audio-open", this.open);
      panel.setAttribute("aria-hidden", this.open ? "false" : "true");
      if(this.open){
        this.positionPanel();
        this.updateMusicStatus();
        panel.style.setProperty("display", "block", "important");
      }else{
        panel.style.setProperty("display", "none", "important");
      }
      qa(".nav-btn.nav-music").forEach(function(button){
        button.classList.toggle("kgen-music-active", MediaRuntime.open);
        button.setAttribute("aria-expanded", MediaRuntime.open ? "true" : "false");
      });
      if(!silent) StatusRuntime.push(this.open ? "音響面板已展開" : "音響面板已收合");
    },
    toggle: function(force){
      const next = typeof force === "boolean" ? force : !this.open;
      if(next){
        try{
          if(window.app && typeof window.app.musicInit === "function") window.app.musicInit();
        }catch(_){ }
      }
      this.setOpen(next, typeof force !== "boolean");
    },
    patchOpenMusic: function(){
      const self = this;
      const patch = function(){
        if(!window.app || window.app.__kgenMusicPatched) return;
        window.app.__kgenMusicPatched = true;
        window.app.openMusic = function(force){
          if(typeof force === "boolean") self.setOpen(force, false);
          else self.toggle();
        };
      };
      patch();
      if(!window.app){
        document.addEventListener("DOMContentLoaded", patch, { once: true });
      }
    },
    patchMusicPlayback: function(){
      const patch = function(){
        if(!window.app || window.app.__kgenMusicPlayPatched) return;
        window.app.__kgenMusicPlayPatched = true;
        const legacyPlay = window.app.musicPlay && window.app.musicPlay.bind(window.app);
        if(!legacyPlay) return;
        window.app.musicPlay = function(){
          try{
            const audio = window.app._music && window.app._music.audio;
            const list = window.app._music && window.app._music.list;
            const idx = window.app._music && window.app._music.index != null ? window.app._music.index : 0;
            const track = list && list[idx];
            if(MediaRuntime.state.filesMissing || (track && track.fileOk === false)){
              const badUrl = track && track.url ? track.url : MUSIC_PLAYLIST_URL;
              MediaRuntime.logAudio("play blocked", { url: badUrl, filesMissing: MediaRuntime.state.filesMissing });
              StatusRuntime.push("播放失敗：" + badUrl);
              MediaRuntime.updateMusicStatus();
              return;
            }
            if(!audio || !audio.src){
              StatusRuntime.push("尚未載入音樂");
              return legacyPlay();
            }
            const promise = audio.play();
            if(promise && typeof promise.then === "function"){
              promise.then(function(){
                StatusRuntime.push("播放中｜" + (track ? track.name : ""));
                MediaRuntime.updateMusicStatus();
              }).catch(function(){
                StatusRuntime.push("請手動播放音效（瀏覽器封鎖自動播放）");
              });
              return promise;
            }
            return legacyPlay();
          }catch(_){
            StatusRuntime.push("請手動播放音效");
            return legacyPlay();
          }
        };
      };
      patch();
      if(!window.app){
        document.addEventListener("DOMContentLoaded", patch, { once: true });
      }
    },
    bindPanelControls: function(){
      qa(".nav-btn.nav-music").forEach(function(button){
        button.onclick = null;
        button.removeAttribute("onclick");
        delete button.dataset.kgenBound;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          MediaRuntime.toggle();
        }, true);
      });
      const closeBtn = $("music-panel") && $("music-panel").querySelector(".tiny-btn");
      if(closeBtn){
        closeBtn.onclick = null;
        closeBtn.removeAttribute("onclick");
        delete closeBtn.dataset.kgenBound;
        Events.bindOnce(closeBtn, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          MediaRuntime.setOpen(false, false);
        }, true);
      }
      const musicActions = [
        ["musicPrev", "musicPrev"],
        ["musicPlay", "musicPlay"],
        ["musicPause", "musicPause"],
        ["musicStop", "musicStop"],
        ["musicNext", "musicNext"],
        ["musicLoadBuiltIn", "musicLoadBuiltIn"]
      ];
      qa("#music-panel .nav-music-ctl").forEach(function(button, index){
        button.onclick = null;
        button.removeAttribute("onclick");
        delete button.dataset.kgenBound;
        Events.bindOnce(button, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          const app = window.app;
          if(!app) return;
          if(index === 5 && typeof app.musicLoadBuiltIn === "function"){
            try{
              app.musicLoadBuiltIn(true).then(function(){
                MediaRuntime.updateMusicStatus();
                StatusRuntime.push("內建歌單已重新載入");
              });
            }catch(_){ }
            return;
          }
          const fnName = musicActions[index] ? musicActions[index][1] : null;
          if(fnName && typeof app[fnName] === "function"){
            try{
              app[fnName]();
              if(fnName === "musicPrev" || fnName === "musicNext" || fnName === "musicPause" || fnName === "musicStop"){
                setTimeout(function(){ MediaRuntime.updateMusicStatus(); }, 80);
              }
            }catch(_){ }
          }
        }, true);
      });
      const fileInput = $("music-file");
      if(fileInput){
        Events.bindOnce(fileInput, "change", function(){
          setTimeout(function(){ MediaRuntime.updateMusicStatus(); }, 120);
        });
      }
    }
  };

  const KlineRuntime = {
    inited: false,
    state: {
      symbol: "BNBUSDT",
      interval: "1m",
      limit: 12,
      source: "Demo"
    },
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_KLINE_RUNTIME = this;
      this.bindSymbolSelect();
      this.renderFallback();
      this.refresh();
      TimerRegistry.register("kline", function(){ KlineRuntime.refresh(); }, 15000);
    },
    bindSymbolSelect: function(){
      const sel = $("ke-symbol");
      if(!sel) return;
      Events.bindOnce(sel, "change", function(event){
        KlineRuntime.state.symbol = String(event.target.value || "BNBUSDT");
        KlineRuntime.refresh();
      });
    },
    demoCandles: function(){
      const base = 612.5;
      const now = Date.now();
      return Array.from({ length: 12 }, function(_, index){
        const open = base + (index - 6) * 0.85;
        const close = open + Math.sin(index * 0.9) * 1.35;
        const high = Math.max(open, close) + 0.55;
        const low = Math.min(open, close) - 0.55;
        return {
          openTime: now - (12 - index) * 60000,
          open: open,
          high: high,
          low: low,
          close: close,
          closeTime: now - (11 - index) * 60000
        };
      });
    },
    loadCache: function(){
      try{
        const raw = localStorage.getItem(KLINE_CACHE_KEY);
        if(!raw) return null;
        const parsed = JSON.parse(raw);
        if(!parsed || !Array.isArray(parsed.data) || !parsed.data.length) return null;
        return parsed;
      }catch(_){
        return null;
      }
    },
    saveCache: function(data, live){
      try{
        localStorage.setItem(KLINE_CACHE_KEY, JSON.stringify({
          symbol: this.state.symbol,
          data: data,
          live: live,
          at: Date.now()
        }));
      }catch(_){ }
    },
    renderFallback: function(){
      const cached = this.loadCache();
      if(cached && cached.data && cached.data.length){
        this.state.source = "Cache";
        this.updatePanel(cached.data, cached.live || cached.data[cached.data.length - 1].close);
        return;
      }
      this.state.source = "Demo";
      const demo = this.demoCandles();
      this.updatePanel(demo, demo[demo.length - 1].close);
    },
    fmt: function(value){
      const n = Number(value || 0);
      if(this.state.symbol === "BNBUSDT") return n.toFixed(3);
      if(this.state.symbol === "KGENLP") return n.toFixed(6);
      if(this.state.symbol === "KGEN16888") return n.toFixed(2);
      return n.toFixed(2);
    },
    getDeg: function(){
      const steer = $("steer-input-val");
      return steer ? Number(steer.value || 0) : 0;
    },
    sideZh: function(deg){
      return deg >= -90 && deg <= 90 ? "多" : "空";
    },
    predict: function(last){
      const deg = this.getDeg();
      const side = this.sideZh(deg);
      const angle = Math.round(Math.abs(deg));
      const range = Math.max(0.000001, last.high - last.low);
      const body = Math.abs(last.close - last.open);
      const wick = Math.max(0.000001, range - body);
      let hit = 62 + Math.min(14, angle * 0.09) + Math.min(7, (body / range) * 7) - Math.min(12, (wick / range) * 8);
      hit = Math.max(63.5, Math.min(91.5, hit));
      return { side: side, angle: angle, range: range, wick: wick, hit: hit };
    },
    draw: function(data){
      const canvas = $("kline-canvas");
      if(!canvas || !data || !data.length) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const padX = 12;
      const padY = 10;
      const maxH = Math.max.apply(null, data.map(function(d){ return d.high; }));
      const minL = Math.min.apply(null, data.map(function(d){ return d.low; }));
      const span = (maxH - minL) || 1;
      const mapY = function(v){ return padY + (maxH - v) / span * (h - padY * 2); };
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 1;
      for(let gx = 0; gx < data.length; gx++){
        const x = padX + gx * ((w - padX * 2) / data.length);
        ctx.beginPath();
        ctx.moveTo(x, padY);
        ctx.lineTo(x, h - padY);
        ctx.stroke();
      }
      const spacing = (w - padX * 2) / data.length;
      const candleW = Math.min(18, spacing * 0.58);
      data.forEach(function(d, index){
        const x = padX + index * spacing + spacing / 2;
        const yH = mapY(d.high);
        const yL = mapY(d.low);
        const yO = mapY(d.open);
        const yC = mapY(d.close);
        const up = d.close >= d.open;
        ctx.strokeStyle = up ? "rgba(120,245,255,.96)" : "rgba(255,210,120,.96)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yH);
        ctx.lineTo(x, yL);
        ctx.stroke();
        ctx.fillStyle = up ? "rgba(120,245,255,.35)" : "rgba(255,210,120,.28)";
        const top = Math.min(yO, yC);
        const bh = Math.max(3, Math.abs(yC - yO));
        ctx.fillRect(x - candleW / 2, top, candleW, bh);
        ctx.strokeRect(x - candleW / 2, top, candleW, bh);
      });
    },
    updatePanel: function(data, live){
      if(!data || !data.length) return;
      const last = data[data.length - 1];
      const p = this.predict(last);
      const sourceLabel = this.state.source === "Live" ? "Live" : this.state.source === "Cache" ? "Cache" : "Demo";
      setNodeText($("ke-side"), p.side);
      setNodeText($("ke-angle"), String(p.angle));
      setNodeText($("ke-open"), this.fmt(last.open));
      setNodeText($("ke-high"), this.fmt(last.high));
      setNodeText($("ke-low"), this.fmt(last.low));
      setNodeText($("ke-close"), this.fmt(last.close));
      setNodeText($("ke-range"), this.fmt(p.range));
      setNodeText($("ke-wick"), this.fmt(p.wick));
      setNodeText($("ke-mode"), sourceLabel + "｜" + (this.state.symbol === "KGENLP" ? "真 LP 價" : this.state.symbol === "KGEN16888" ? "宇宙基準價" : "真市場"));
      setNodeText($("ke-live-symbol"), this.state.symbol + " / " + this.state.interval);
      setNodeText($("ke-live-price"), this.fmt(live));
      setNodeText($("kc-predict"), "預測：" + p.side);
      setNodeText($("kc-dir"), this.state.symbol + " → " + p.side + "方K");
      setNodeText($("kc-hit"), "命中率：" + p.hit.toFixed(1) + "%");
      const timeA = new Date(last.openTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
      const timeB = new Date(last.closeTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
      setNodeText($("moon-a"), timeA);
      setNodeText($("moon-b"), timeB);
      this.draw(data);
    },
    fetchBinanceKlines: async function(symbol){
      const url = "https://api.binance.com/api/v3/klines?symbol=" + symbol + "&interval=" + this.state.interval + "&limit=" + this.state.limit;
      const res = await fetch(url, { cache: "no-store" });
      if(!res.ok) throw new Error("Binance klines " + res.status);
      const arr = await res.json();
      return arr.map(function(k){
        return {
          openTime: Number(k[0]),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          closeTime: Number(k[6])
        };
      });
    },
    fetchBinanceTicker: async function(symbol){
      const url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol;
      const res = await fetch(url, { cache: "no-store" });
      if(!res.ok) throw new Error("Binance ticker " + res.status);
      const json = await res.json();
      return Number(json.price);
    },
    refresh: async function(){
      const symbol = this.state.symbol;
      try{
        if(symbol === "KGEN16888"){
          const base = 16888;
          const now = Date.now();
          const data = Array.from({ length: 12 }, function(_, index){
            return {
              openTime: now - (12 - index) * 60000,
              open: base,
              high: base,
              low: base,
              close: base,
              closeTime: now - (11 - index) * 60000
            };
          });
          this.state.source = "Demo";
          this.updatePanel(data, base);
          return;
        }
        if(symbol === "KGENLP"){
          this.renderFallback();
          setNodeText($("ke-mode"), "Demo｜真 LP 價");
          return;
        }
        const data = await this.fetchBinanceKlines(symbol);
        const live = await this.fetchBinanceTicker(symbol);
        this.state.source = "Live";
        this.saveCache(data, live);
        this.updatePanel(data, live);
      }catch(error){
        console.warn("[KGEN Kline]", error);
        const cached = this.loadCache();
        if(cached && cached.data && cached.data.length){
          this.state.source = "Cache";
          this.updatePanel(cached.data, cached.live || cached.data[cached.data.length - 1].close);
        }else{
          this.state.source = "Demo";
          const demo = this.demoCandles();
          this.updatePanel(demo, demo[demo.length - 1].close);
        }
      }
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
      const festLabel = getFestivalWindowLabel(new Date());
      const festEl = $("kh-festival-open");
      if(festEl){
        if(festLabel === "CLOSED"){
          const nextFest = Math.min(
            nextLocal(5, 20, 0, 0, 0).getTime() - nowMs,
            nextLocal(11, 11, 0, 0, 0).getTime() - nowMs,
            nextLocal(12, 31, 23, 59, 59).getTime() - nowMs
          );
          festEl.textContent = "倒數 " + formatSpan(nextFest);
        }else{
          festEl.textContent = festLabel;
        }
      }
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
    move: { x: 0, y: 0, z: 100 },
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_MIRROR_VIEW = this;
      this.patchAppSteer();
      this.bindControls();
    },
    syncCoreTransform: function(){
      const rotate = $("steer-input-val") ? Number($("steer-input-val").value || 0) : 0;
      const scale = (this.move.z || 100) / 100;
      const x = this.move.x || 0;
      const y = this.move.y || 0;
      const tf = "translate(" + x + "px," + y + "px) rotate(" + rotate + "deg) scale(" + scale + ")";
      const core = $("core-window");
      const figure = $("fairy-img");
      const cam = $("cam-view");
      if(core){
        core.style.setProperty("--kgen-steer-deg", rotate + "deg");
        core.style.setProperty("--kgen-tx", x + "px");
        core.style.setProperty("--kgen-ty", y + "px");
        core.style.setProperty("--kgen-scale", String(scale));
        core.style.setProperty("transform", tf, "important");
        core.style.setProperty("transform-origin", "50% 50%", "important");
        core.dataset.kgenSteerDeg = String(rotate);
      }
      if(figure){
        figure.classList.add("kgen-steer-live");
        figure.style.setProperty("animation", "none", "important");
        figure.style.setProperty("transform", "none", "important");
      }
      if(cam && (!window.app || !window.app.isCam)){
        cam.style.setProperty("transform", "none", "important");
      }else if(cam && window.app && window.app.camMode === "user"){
        cam.style.setProperty("transform", "scaleX(-1)", "important");
      }
      const wheel = $("wheel");
      if(wheel) wheel.style.transform = "rotate(" + rotate + "deg)";
    },
    resolveMainFigure: function(){
      return $("fairy-img") || $("core-window") || $("core-anchor");
    },
    patchAppSteer: function(){
      const self = this;
      const patch = function(){
        const app = window.app;
        if(!app || app.__kgenSteerPatched) return;
        app.__kgenSteerPatched = true;
        app.applySteer = function(v, silent){
          const ang = Math.max(-180, Math.min(180, Number(v) || 0));
          setNodeText($("ang-val"), ang + "°");
          const steer = $("steer-input-val");
          if(steer) steer.value = String(ang);
          self.syncCoreTransform();
          const modeLabel = ang >= -45 && ang <= 45 ? "多方" : ang >= 135 || ang <= -135 ? "空方" : "中性";
          setNodeText($("k12345-slider-status"), "CORE 角度 " + ang + "°｜" + modeLabel + "｜縮放 " + self.move.z + "%");
          try{
            if(typeof app.updateCoordPanel === "function") app.updateCoordPanel();
            if(typeof app.syncSideUI === "function") app.syncSideUI(ang);
          }catch(_){ }
          if(!silent) StatusRuntime.push("方向盤角度 " + ang + "°｜" + modeLabel);
        };
        if(typeof app.bindWheel === "function" && !app.__kgenWheelBound){
          app.bindWheel();
          app.__kgenWheelBound = true;
        }
      };
      patch();
      if(!window.app) document.addEventListener("DOMContentLoaded", patch, { once: true });
    },
    applySteer: function(deg, silent){
      if(window.app && typeof window.app.applySteer === "function"){
        window.app.applySteer(deg, !!silent);
        return;
      }
      const ang = Math.max(-180, Math.min(180, Number(deg) || 0));
      const steer = $("steer-input-val");
      if(steer) steer.value = String(ang);
      this.syncCoreTransform();
      if(!silent) StatusRuntime.push("方向盤角度 " + ang + "°");
    },
    bindControls: function(){
      const steer = $("steer-input-val");
      if(steer){
        Events.bindOnce(steer, "input", function(event){
          MirrorRuntime.applySteer(event.target.value, true);
        });
      }
      this.bindJoystick();
      this.bindMovePad();
      this.patchAppCoord();
    },
    bindJoystick: function(){
      const base = $("move-joystick-base");
      const knob = $("move-joystick-knob");
      const target = $("core-window") || $("fairy-img");
      if(!base || !knob || !target) return;
      const max = 42;
      const self = this;
      const setKnob = function(dx, dy){
        knob.style.transform = "translate(" + dx + "px," + dy + "px)";
      };
      const applyMove = function(dx, dy){
        self.move.x = Math.round(dx);
        self.move.y = Math.round(dy);
        self.syncCoreTransform();
        const status = $("k12345-move-status") || $("k12345-slider-status");
        setNodeText(status, "X " + self.move.x + " / Y " + self.move.y + " / Z " + self.move.z + "%");
      };
      const pointerToDelta = function(clientX, clientY){
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if(dist > max){
          dx = dx / dist * max;
          dy = dy / dist * max;
        }
        return { dx: dx, dy: dy };
      };
      let dragging = false;
      const onStart = function(x, y){
        dragging = true;
        const delta = pointerToDelta(x, y);
        setKnob(delta.dx, delta.dy);
        applyMove(self.move.x + delta.dx, self.move.y + delta.dy);
      };
      const onDrag = function(x, y){
        if(!dragging) return;
        const delta = pointerToDelta(x, y);
        setKnob(delta.dx, delta.dy);
        applyMove(self.move.x + delta.dx, self.move.y + delta.dy);
      };
      const onEnd = function(){
        dragging = false;
        setKnob(0, 0);
      };
      Events.bindOnce(base, "mousedown", function(e){ e.preventDefault(); onStart(e.clientX, e.clientY); });
      Events.bindOnce(base, "touchstart", function(e){ e.preventDefault(); const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: false });
      window.addEventListener("mousemove", function(e){ onDrag(e.clientX, e.clientY); });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", function(e){ const t = e.touches[0]; if(t) onDrag(t.clientX, t.clientY); }, { passive: true });
      window.addEventListener("touchend", onEnd, { passive: true });
      const zoomIn = $("k12345-zoom-in");
      const zoomOut = $("k12345-zoom-out");
      const home = $("k12345-move-home");
      if(zoomIn) Events.bindOnce(zoomIn, "click", function(){ self.move.z = Math.min(160, self.move.z + 10); applyMove(self.move.x, self.move.y); });
      if(zoomOut) Events.bindOnce(zoomOut, "click", function(){ self.move.z = Math.max(60, self.move.z - 10); applyMove(self.move.x, self.move.y); });
      if(home) Events.bindOnce(home, "click", function(){ self.move = { x: 0, y: 0, z: 100 }; applyMove(0, 0); StatusRuntime.push("悟空位置已歸中"); });
    },
    bindMovePad: function(){
      qa("[data-kmove]", document).forEach(function(button){
        Events.bindOnce(button, "click", function(){
          const parts = String(button.getAttribute("data-kmove") || "0,0").split(",");
          const dx = Number(parts[0] || 0);
          const dy = Number(parts[1] || 0);
          MirrorRuntime.move.x += dx;
          MirrorRuntime.move.y += dy;
          MirrorRuntime.syncCoreTransform();
          setNodeText($("k12345-move-status"), "X " + MirrorRuntime.move.x + " / Y " + MirrorRuntime.move.y + " / Z " + MirrorRuntime.move.z + "%");
        });
      });
    },
    patchAppCoord: function(){
      const app = window.app;
      if(!app) return;
      app.openCoordModal = function(){
        LayoutRuntime.toggleRightRuleWithStatus();
      };
      app.closeCoordModal = function(){
        if(!document.body.classList.contains("kgen-right-rule-closed")){
          LayoutRuntime.toggleRightRuleWithStatus();
        }
      };
      app.syncFromWheel = function(){
        const steer = $("steer-input-val");
        const ang = steer ? Number(steer.value || 0) : 0;
        if(ang >= -45 && ang <= 45) MirrorRuntime.apply("front");
        else if(ang >= 135 || ang <= -135) MirrorRuntime.apply("back");
        else StatusRuntime.push("方向盤角度 " + ang + "°（未達多/空閾值）");
      };
    },
    apply: async function(mode){
      this.mode = mode || "heart";
      const image = $("fairy-img");
      const video = $("cam-view");
      const app = window.app || {};
      const self = this;

      const stopCamera = function(){
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
        if(image) image.style.opacity = "1";
        document.body.classList.remove("kgen-camera-on", "kgen-camera-front", "kgen-camera-back");
      };

      const startCamera = async function(facing){
        if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
          StatusRuntime.push("瀏覽器不支援鏡頭，改顯示靜態圖");
          if(image) image.style.opacity = "1";
          if(video) video.style.opacity = "0";
          return false;
        }
        try{
          if(app.stream) app.stream.getTracks().forEach(function(track){ track.stop(); });
          app.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
          if(video){
            video.srcObject = app.stream;
            video.style.opacity = "1";
            video.style.transform = facing === "user" ? "scaleX(-1)" : "scaleX(1)";
          }
          if(image) image.style.opacity = "0";
          app.isCam = true;
          app.camMode = facing;
          document.body.classList.add("kgen-camera-on");
          document.body.classList.toggle("kgen-camera-front", facing === "user");
          document.body.classList.toggle("kgen-camera-back", facing === "environment");
          return true;
        }catch(error){
          StatusRuntime.push("鏡頭未授權：" + asErrorMessage(error) + "（改顯示靜態圖）");
          if(image) image.style.opacity = "1";
          if(video) video.style.opacity = "0";
          return false;
        }
      };

      document.body.classList.remove("kgen-mirror-front", "kgen-mirror-back");

      if(this.mode === "front"){
        if(image) image.src = ASSETS.front;
        document.body.classList.add("kgen-mirror-front");
        await startCamera("user");
        this.applySteer(45, true);
        setNodeText($("cp-deg-num"), "45°｜多方");
        setNodeText($("cp-side"), "方向：多方｜前鏡");
        setNodeText($("kc-dir"), "方向盤 → 多方K");
        setNodeText($("wish-label"), "悟空心臟｜前鏡多方");
        StatusRuntime.push("前鏡多方：前鏡頭已開啟｜bull-front｜角度 45°");
      }else if(this.mode === "back"){
        if(image) image.src = ASSETS.back;
        document.body.classList.add("kgen-mirror-back");
        await startCamera("environment");
        this.applySteer(135, true);
        setNodeText($("cp-deg-num"), "135°｜空方");
        setNodeText($("cp-side"), "方向：空方｜後鏡");
        setNodeText($("kc-dir"), "方向盤 → 空方K");
        setNodeText($("wish-label"), "悟空心臟｜後鏡空方");
        StatusRuntime.push("後鏡空方：後鏡頭已開啟｜bear-rear｜角度 135°");
      }else{
        stopCamera();
        if(image){
          image.src = ASSETS.heart;
          image.style.opacity = "1";
          image.style.visibility = "visible";
        }
        setNodeText($("cp-deg-num"), "待部署");
        setNodeText($("cp-side"), "循環：Heart ↔ Brain");
        setNodeText($("kc-dir"), "方向盤 → --方K");
        setNodeText($("wish-label"), "悟空心臟，財氣覺醒");
        StatusRuntime.push("已恢復心臟核心圖｜鏡頭已關閉");
      }
      self.syncCoreTransform();
    },
    toggleFront: function(){
      this.apply(this.mode === "front" ? "heart" : "front");
    },
    toggleBack: function(){
      this.apply(this.mode === "back" ? "heart" : "back");
    },
    syncFromWheel: function(){
      this.patchAppCoord();
      if(window.app && typeof window.app.syncFromWheel === "function") window.app.syncFromWheel();
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
      this.hideDeadPanels();
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
    },
    hideDeadPanels: function(){
      ["temple-audio-console", "chain-live-panel", "bet-live-panel", "board-panel", "round-history-modal", "temple-single-modal"].forEach(function(id){
        const el = $(id);
        if(el){
          el.classList.add("kgen-v3-dead");
          el.setAttribute("aria-hidden", "true");
        }
      });
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
    readWholeAmount: function(id, defaultValue, label){
      const value = String($(id) && $(id).value || defaultValue || "8").trim();
      if(!/^\d+$/.test(value)) throw new Error((label || "金額") + "請輸入整數");
      return String(Math.floor(Number(value)));
    },
    getFortuneAmount: function(){
      const amount = Number(this.readWholeAmount("kh-fortune-amount", "8", "發財金"));
      if(amount < 1 || amount > 888) throw new Error("發財金須 1–888");
      return String(amount);
    },
    getVowAmount: function(){
      return this.readWholeAmount("kh-vow-amount", "8", "還願");
    },
    getLampDays: function(){
      return this.readWholeAmount("kh-lamp-days", "8", "點燈");
    },
    getWishAmount: function(){
      return this.readWholeAmount("kh-wish-amount", "1", "許願");
    },
    getAmountWhole: function(defaultValue){
      return this.getFortuneAmount();
    },
    getWishHash: function(){
      this.ensureEthers();
      const raw = String(($("kh-wish-text") && $("kh-wish-text").value) || ($("kh-wish") && $("kh-wish").value) || "").trim();
      if(/^0x[0-9a-fA-F]{64}$/.test(raw)) return raw;
      if(!raw) throw new Error("請輸入許願文字或 bytes32 hash");
      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(raw));
    },
    updateWalletDom: function(){
      const waiting = "等待鏈上資料";
      const hasAddr = !!this.state.address;
      setNodeText($("kh-wallet"), hasAddr ? short(this.state.address) + "｜" + this.state.address : "未連線");
      setNodeText($("kh-chain"), String(this.state.chainId || "").toLowerCase() === String(CHAIN.BSC).toLowerCase() ? "BSC 56" : this.state.chainId || "BSC 56");

      if(this.state.heartBal != null){
        const heartText = this.formatToken(this.state.heartBal);
        setNodeText($("kh-heart-bal"), heartText);
        setNodeText($("w3-bal"), heartText);
      }else{
        setNodeText($("kh-heart-bal"), waiting);
        setNodeText($("w3-bal"), waiting);
      }

      if(hasAddr && this.state.kgenBal != null){
        const kgenText = this.formatToken(this.state.kgenBal);
        setNodeText($("kh-kgen-bal"), kgenText);
        setNodeText($("rb-kgen-txt"), kgenText);
        if(hasEthers5()){
          const kNum = Number(ethers.utils.formatUnits(this.state.kgenBal, this.state.tokenDecimals || 18));
          const kFill = $("rb-kgen-fill");
          if(kFill) kFill.style.width = Math.min(100, Math.max(4, kNum / 1000 * 100)) + "%";
        }
      }else{
        setNodeText($("kh-kgen-bal"), hasAddr ? waiting : "--");
        setNodeText($("rb-kgen-txt"), waiting);
        const kFill = $("rb-kgen-fill");
        if(kFill && !kFill.style.width) kFill.style.width = "8%";
      }

      if(hasAddr && this.state.bnbBal != null && hasEthers5()){
        const bnbNum = Number(ethers.utils.formatEther(this.state.bnbBal));
        const bnbText = bnbNum.toFixed(4) + " BNB";
        setNodeText($("rb-bnb-txt"), bnbText);
        setNodeText($("userBNB"), bnbText);
        const bFill = $("rb-bnb-fill");
        if(bFill) bFill.style.width = Math.min(100, Math.max(4, bnbNum * 100)) + "%";
      }else{
        setNodeText($("rb-bnb-txt"), waiting);
        setNodeText($("userBNB"), hasAddr ? waiting : waiting);
        const bFill = $("rb-bnb-fill");
        if(bFill && !bFill.style.width) bFill.style.width = "8%";
      }

      const prog = $("w3-prog");
      if(prog){
        if(!hasAddr) prog.textContent = waiting;
        else if(this.state.readError) prog.textContent = waiting;
        else if(this.state.allowance != null && hasEthers5()){
          const allowNum = Number(ethers.utils.formatUnits(this.state.allowance, this.state.tokenDecimals || 18)).toFixed(2);
          prog.textContent = "Allowance " + allowNum + " KGEN｜BNB gas 已同步";
        }else prog.textContent = "Heart 血庫已同步";
      }
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
        amountWhole = Number(this.getFortuneAmount());
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
        const cd = Math.max(1, bnNum(this.state.heartData.heartbeatCooldown) || 3600);
        const rem = cd - (bnNum(this.state.heartData.tod) % cd);
        status.textContent = "心跳呼吸：倒數 " + formatHMS(rem * 1000);
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
      const dayStart = data.dayIndex * 86400;
      const windowStart = dayStart + data.igniteStart;
      const igniteTarget = now < windowStart ? windowStart : (data.dayIndex + 1) * 86400 + data.igniteStart;
      setNodeText($("kh-ignite-open"), inWindow ? "OPEN UTC 00:00–00:10" : "倒數 " + formatHMS((igniteTarget - now) * 1000));
      if(!this.state.address){
        status.textContent = "轉日呼吸：倒數 " + formatHMS((igniteTarget - now) * 1000) + "｜" + hint;
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
      status.textContent = "轉日呼吸：倒數 " + formatHMS((igniteTarget - now) * 1000) + "｜" + hint;
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
      ApproveRuntime.renderStatus();
      this.updateHeartbeatStatus();
      this.updateIgniteStatus();
      this.updateFortuneStatus();
      this.updateWishOnchainStatus();
    },
    updateWishOnchainStatus: function(){
      const status = $("kh-wish-onchain-status");
      if(!status) return;
      status.textContent = "許願原文是否上鏈：只有 hash｜合約 makeWish(bytes32) 不收 KGEN、不需 approve｜鏈上事件 WishMade(user,wishHash)｜BscScan → Contract → Events → WishMade 可查 wishHash；原文請本地保存或上 IPFS";
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
    bindFields: function(){
      ApproveRuntime.bindFields();
    },
    bindButtons: function(){
      const self = this;
      const actions = {
        "kh-fortune": function(){ self.sendHeart("fortuneClaim 發財金 " + self.getFortuneAmount(), function(contract){ return contract.fortuneClaim(self.getFortuneAmount()); }); },
        "kh-heartbeat": function(){ self.sendHeart("heartbeatClaim 整點心跳", function(contract){ return contract.heartbeatClaim(); }); },
        "kh-ignite": function(){ self.sendHeart("igniteAndClaim 轉日呼吸", function(contract){ return contract.igniteAndClaim(); }); },
        "kh-vow": function(){ self.sendHeart("vowTo 還願", function(contract){ return contract.vowTo(Number($("kh-vow-option") && $("kh-vow-option").value || 1), self.getVowAmount()); }); },
        "kh-lamp": function(){ self.sendHeart("lightLamp 點燈", function(contract){ return contract.lightLamp(self.getLampDays()); }); },
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

  const ApproveRuntime = {
    inited: false,
    slots: [
      { key: "fortune", label: "發財金", getter: function(){ return HeartRuntime.getFortuneAmount(); } },
      { key: "vow", label: "還願", getter: function(){ return HeartRuntime.getVowAmount(); } },
      { key: "lamp", label: "點燈", getter: function(){ return HeartRuntime.getLampDays(); } }
    ],
    init: function(){
      if(this.inited) return;
      this.inited = true;
      window.KGEN_APPROVE_RUNTIME = this;
      this.bindFields();
      this.bindApproveTarget();
      this.updateApproveButtonLabel();
    },
    currentAllowance: function(){
      if(HeartRuntime.state.allowance == null || !hasEthers5()) return null;
      return Number(ethers.utils.formatUnits(HeartRuntime.state.allowance, HeartRuntime.state.tokenDecimals || 18));
    },
    getNeedAmount: function(key){
      const slot = this.slots.find(function(entry){ return entry.key === key; });
      if(!slot) return null;
      return slot.getter();
    },
    getNeeds: function(){
      const self = this;
      return this.slots.map(function(slot){
        let need = "--";
        let ok = false;
        const current = self.currentAllowance();
        try{
          need = slot.getter();
          ok = current != null && Number(current) >= Number(need);
        }catch(_){ }
        return { key: slot.key, label: slot.label, need: need, ok: ok };
      });
    },
    isEnough: function(key){
      const current = this.currentAllowance();
      if(current == null) return false;
      try{
        return Number(current) >= Number(this.getNeedAmount(key));
      }catch(_){
        return false;
      }
    },
    renderStatus: function(){
      const status = $("kh-allowance-status");
      if(!status) return;
      if(!HeartRuntime.state.address){
        status.textContent = "Allowance：未連錢包";
        return;
      }
      const current = this.currentAllowance();
      const currentText = current == null ? "--" : String(current);
      const rows = ["Allowance 目前：" + currentText + " KGEN", ""];
      const fieldMap = {
        fortune: "kh-fortune-amount",
        vow: "kh-vow-amount",
        lamp: "kh-lamp-days"
      };
      this.getNeeds().forEach(function(entry){
        const fieldId = fieldMap[entry.key] || "";
        const suffix = entry.ok ? " ✓足夠" : current == null ? "" : " ✗不足";
        rows.push("【" + entry.label + "】" + entry.need + " KGEN" + suffix + (fieldId ? "（#" + fieldId + "）" : ""));
      });
      const insufficient = this.getNeeds().filter(function(entry){ return !entry.ok && current != null; });
      if(insufficient.length){
        rows.push("", "不足項目：" + insufficient.map(function(entry){ return entry.label; }).join("、"));
      }
      status.textContent = rows.join("\n");
    },
    getSelectedKey: function(){
      const sel = $("kh-approve-target");
      return sel && sel.value ? sel.value : "fortune";
    },
    updateApproveButtonLabel: function(){
      const btn = $("kh-approve-current");
      const slot = this.slots.find(function(entry){ return entry.key === ApproveRuntime.getSelectedKey(); });
      if(btn && slot) btn.textContent = "Approve " + slot.label + "金額";
    },
    bindApproveTarget: function(){
      const sel = $("kh-approve-target");
      if(!sel) return;
      Events.bindOnce(sel, "change", function(){
        ApproveRuntime.updateApproveButtonLabel();
        ApproveRuntime.renderStatus();
      });
    },
    bindFields: function(){
      const self = this;
      ["kh-fortune-amount", "kh-vow-amount", "kh-lamp-days", "kh-wish-text", "kh-wish"].forEach(function(id){
        const field = $(id);
        if(!field) return;
        Events.bindOnce(field, "input", function(){
          HeartRuntime.updateFortuneStatus();
          self.renderStatus();
        });
      });
    },
    refresh: function(){
      return HeartRuntime.refreshChainData(true);
    },
    approveFortune: async function(){
      return this.approveSlot("fortune");
    },
    approveSlot: async function(key){
      const slot = this.slots.find(function(entry){ return entry.key === key; });
      if(!slot){
        StatusRuntime.push("Approve：未知功能 " + key);
        return;
      }
      try{
        if(!HeartRuntime.hasInjectedWallet() && !HeartRuntime.state.address){
          StatusRuntime.push("Approve " + slot.label + "：未連錢包");
          return;
        }
        await HeartRuntime.ensureConnected();
        await HeartRuntime.refreshChainData(false);
        const amountWhole = slot.getter();
        const amount = ethers.utils.parseUnits(String(amountWhole), HeartRuntime.state.tokenDecimals || 18);
        if(!window.confirm("確認授權【" + slot.label + "】金額：" + amountWhole + " KGEN")){
          StatusRuntime.push("已取消：Approve " + slot.label);
          return;
        }
        const token = new ethers.Contract(HeartRuntime.state.tokenAddress || CHAIN.KGEN, ERC20_VIEW_ABI, HeartRuntime.state.signer);
        StatusRuntime.push("送出中：Approve " + slot.label + " " + amountWhole + " KGEN");
        const tx = await token.approve(CHAIN.HEART, amount);
        StatusRuntime.push("Tx sent：" + tx.hash);
        await tx.wait();
        StatusRuntime.push("成功：Approve " + slot.label + " " + amountWhole + " KGEN");
        await HeartRuntime.refreshChainData(false);
      }catch(error){
        StatusRuntime.push("Approve 失敗：" + asErrorMessage(error));
      }
    },
    approveSelected: async function(){
      return this.approveSlot(this.getSelectedKey());
    },
    approveUnlimited: async function(){
      try{
        if(!HeartRuntime.hasInjectedWallet() && !HeartRuntime.state.address){
          StatusRuntime.push("無限授權：未連錢包");
          return;
        }
        await HeartRuntime.ensureConnected();
        if(!window.confirm("確認送出無限授權給 Heart 合約？")){
          StatusRuntime.push("已取消：Approve 無限授權");
          return;
        }
        const token = new ethers.Contract(HeartRuntime.state.tokenAddress || CHAIN.KGEN, ERC20_VIEW_ABI, HeartRuntime.state.signer);
        StatusRuntime.push("送出中：Approve 無限授權");
        const tx = await token.approve(CHAIN.HEART, ethers.constants.MaxUint256);
        StatusRuntime.push("Tx sent：" + tx.hash);
        await tx.wait();
        StatusRuntime.push("成功：Approve 無限授權");
        await HeartRuntime.refreshChainData(false);
      }catch(error){
        StatusRuntime.push("Approve 失敗：" + asErrorMessage(error));
      }
    }
  };

  const WalletRuntime = {
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.primeWeb3Shell();
      const bindings = {
        "kh-connect": function(){
          if(window.web3 && typeof window.web3.smartConnect === "function"){
            return window.web3.smartConnect();
          }
          return WalletRuntime.connect();
        },
        "kh-refresh": function(){ return WalletRuntime.refresh(); },
        "kh-approve-current": function(){ return WalletRuntime.approveCurrent(); },
        "kh-approve-unlimited": function(){ return WalletRuntime.approveUnlimited(); },
        "kh-unlimited": function(){ return WalletRuntime.approveUnlimited(); },
        "kh-switch": function(){
          if(window.web3 && typeof window.web3.switchWallet === "function"){
            return window.web3.switchWallet();
          }
          return WalletRuntime.switchWallet();
        },
        "kh-download": function(){ WalletRuntime.downloadBookmark(); },
        "kh-metamask-open": function(){
          if(window.web3 && typeof window.web3.deepLink === "function"){
            return window.web3.deepLink("metamask");
          }
          return WalletRuntime.openMetaMaskDeepLink();
        }
      };
      Object.keys(bindings).forEach(function(id){
        WalletRuntime.bindWalletButton(id, bindings[id]);
      });
    },
    walletDeepLink: function(kind){
      const labels = {
        metamask: "MetaMask",
        trust: "Trust Wallet",
        okx: "OKX Wallet",
        bitget: "Bitget Wallet"
      };
      const links = {
        metamask: WALLET_BRIDGE.METAMASK_DEEPLINK,
        trust: WALLET_BRIDGE.TRUST_DEEPLINK,
        okx: WALLET_BRIDGE.OKX_DEEPLINK,
        bitget: WALLET_BRIDGE.BITGET_DEEPLINK
      };
      const label = labels[kind] || kind;
      const link = links[kind] || WALLET_BRIDGE.BRIDGE_PAGE;
      if(this.isSocialInAppBrowser()){
        this.openWalletHub("請按「" + label + "」按鈕，用該錢包 App 開啟橋接頁");
        return false;
      }
      StatusRuntime.push("正在用 " + label + " 開啟 wallet-12345 橋接頁");
      try{
        window.location.href = link;
      }catch(_){
        try{
          window.open(link, "_blank", "noopener");
        }catch(__){
          this.copyBridgeUrl("deeplink 失敗，已改為複製橋接連結");
        }
      }
      return false;
    },
    bindWalletHubButtons: function(){
      const self = this;
      const map = {
        walletHubMetaMaskBtn: "metamask",
        walletHubTrustBtn: "trust",
        walletHubOkxBtn: "okx",
        walletHubBitgetBtn: "bitget"
      };
      Object.keys(map).forEach(function(id){
        const el = $(id);
        if(!el) return;
        if(el.tagName === "A"){
          const links = {
            metamask: WALLET_BRIDGE.METAMASK_DEEPLINK,
            trust: WALLET_BRIDGE.TRUST_DEEPLINK,
            okx: WALLET_BRIDGE.OKX_DEEPLINK,
            bitget: WALLET_BRIDGE.BITGET_DEEPLINK
          };
          el.href = links[map[id]] || WALLET_BRIDGE.BRIDGE_PAGE;
        }
        el.onclick = null;
        delete el.dataset.kgenBound;
        Events.bindOnce(el, "click", function(event){
          event.preventDefault();
          event.stopPropagation();
          self.walletDeepLink(map[id]);
        }, true);
      });
      const copyBridge = $("walletHubCopyBridge");
      if(copyBridge){
        Events.bindOnce(copyBridge, "click", function(event){
          event.preventDefault();
          self.copyBridgeUrl();
        }, true);
      }
      const closeHub = $("walletHubClose");
      if(closeHub){
        Events.bindOnce(closeHub, "click", function(event){
          event.preventDefault();
          self.closeWalletHub();
        }, true);
      }
    },
    copyBridgeUrl: function(message){
      const done = function(){
        StatusRuntime.push(message || "已複製 wallet-12345 橋接連結");
      };
      return navigator.clipboard.writeText(WALLET_BRIDGE.BRIDGE_PAGE).then(done).catch(function(){
        const inp = $("walletHubUrl");
        if(inp){
          inp.value = WALLET_BRIDGE.BRIDGE_PAGE;
          inp.focus();
          inp.select();
        }
        StatusRuntime.push(message || "請手動複製 wallet-12345 橋接連結");
      });
    },
    maybeAutoConnectFromBridge: function(){
      try{
        if(!HeartRuntime.getEthereum()) return;
        const params = new URLSearchParams(location.search);
        const fromBridge = params.get("bridge") === "1";
        const fromReferrer = /wallet-12345\.html/i.test(document.referrer || "");
        if(!fromBridge && !fromReferrer && !this.isMobileBrowser()) return;
        StatusRuntime.push("錢包瀏覽器已就緒，準備 eth_requestAccounts");
        setTimeout(function(){
          WalletRuntime.connect();
        }, fromBridge ? 600 : 1000);
      }catch(_){ }
    },
    isMobileBrowser: function(){
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    },
    isSocialInAppBrowser: function(){
      return /FBAN|FBAV|Facebook|Instagram|Line\//i.test(navigator.userAgent || "");
    },
    isDesktopBrowser: function(){
      return !this.isMobileBrowser();
    },
    patchWalletHub: function(){
      const inp = $("walletHubUrl");
      if(inp) inp.value = WALLET_BRIDGE.BRIDGE_PAGE;
      const mmAnchor = $("walletHubMetaMaskBtn");
      if(mmAnchor){
        mmAnchor.href = WALLET_BRIDGE.METAMASK_DEEPLINK;
        mmAnchor.textContent = "用 MetaMask 開啟";
      }
      [["walletHubTrustBtn", WALLET_BRIDGE.TRUST_DEEPLINK, "Trust Wallet 開啟"],
       ["walletHubOkxBtn", WALLET_BRIDGE.OKX_DEEPLINK, "OKX Wallet 開啟"],
       ["walletHubBitgetBtn", WALLET_BRIDGE.BITGET_DEEPLINK, "Bitget Wallet 開啟"]].forEach(function(entry){
        const btn = $(entry[0]);
        if(!btn) return;
        if(btn.tagName === "A") btn.href = entry[1];
        btn.textContent = entry[2];
      });
      const hint = $("walletHubInAppHint");
      if(hint && this.isSocialInAppBrowser()){
        hint.textContent = "目前在 Facebook/LINE 內建瀏覽器，請按下方按鈕用 MetaMask App 開啟。";
        hint.style.display = "block";
      }
      try{
        if(window.web3){
          window.web3.OFFICIAL_DAPP = WALLET_BRIDGE.OFFICIAL_DAPP;
          window.web3.BRIDGE_PAGE = WALLET_BRIDGE.BRIDGE_PAGE;
          window.web3.METAMASK_DEEPLINK = WALLET_BRIDGE.METAMASK_DEEPLINK;
          window.web3.METAMASK_DAPP_PATH = WALLET_BRIDGE.METAMASK_DAPP_PATH;
          window.web3.openWalletHub = this.openWalletHub.bind(this);
          window.web3.deepLink = this.deepLink.bind(this);
          window.web3.copyDappUrl = this.copyOfficialUrl.bind(this);
        }
      }catch(_){ }
    },
    openWalletHub: function(message){
      const hub = $("walletHub");
      const inp = $("walletHubUrl");
      if(inp) inp.value = WALLET_BRIDGE.BRIDGE_PAGE;
      const mmAnchor = $("walletHubMetaMaskBtn");
      if(mmAnchor) mmAnchor.href = WALLET_BRIDGE.METAMASK_DEEPLINK;
      const hint = $("walletHubInAppHint");
      if(hint){
        if(this.isSocialInAppBrowser()){
          hint.textContent = "目前在 Facebook/LINE 內建瀏覽器，請按下方按鈕用 MetaMask App 開啟。";
          hint.style.display = "block";
        }else{
          hint.style.display = "none";
        }
      }
      if(hub){
        hub.style.display = "flex";
        hub.style.alignItems = "center";
        hub.style.justifyContent = "center";
      }
      StatusRuntime.push(message || "已開啟多錢包入口");
      return false;
    },
    closeWalletHub: function(){
      const hub = $("walletHub");
      if(hub) hub.style.display = "none";
    },
    deepLink: function(kind){
      if(kind === "metamask" && this.isSocialInAppBrowser()){
        this.openWalletHub("請按「用 MetaMask 開啟」按鈕（勿在此內建瀏覽器直接跳轉）");
        return false;
      }
      return this.walletDeepLink(kind || "metamask");
    },
    openMetaMaskDeepLink: function(){
      if(HeartRuntime.hasInjectedWallet()){
        return WalletRuntime.connect();
      }
      if(this.isSocialInAppBrowser()){
        this.openWalletHub("請按「用 MetaMask 開啟」按鈕");
        return false;
      }
      StatusRuntime.push("請用 MetaMask App 開啟");
      return this.deepLink("metamask");
    },
    copyOfficialUrl: function(){
      const done = function(){
        StatusRuntime.push("已複製官方神殿網址");
      };
      return navigator.clipboard.writeText(WALLET_BRIDGE.OFFICIAL_DAPP).then(done).catch(function(){
        const inp = $("walletHubUrl");
        if(inp){
          inp.value = WALLET_BRIDGE.OFFICIAL_DAPP;
          inp.focus();
          inp.select();
        }
        StatusRuntime.push("請手動複製官方神殿網址");
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
      const ethereum = HeartRuntime.getEthereum();
      if(ethereum){
        StatusRuntime.push("準備連結錢包 / 切 BSC，請在錢包視窗確認");
        try{
          if(window.web3 && typeof window.web3.connect === "function"){
            await window.web3.connect();
            WalletRuntime.closeWalletHub();
            return true;
          }
          await ethereum.request({ method: "eth_requestAccounts" });
          if(window.web3 && typeof window.web3.ensureBSC === "function"){
            const onBsc = await window.web3.ensureBSC();
            if(!onBsc){
              StatusRuntime.push("請切換至 BSC（鏈 ID 56）");
              return false;
            }
          }else{
            await HeartRuntime.ensureBSC();
          }
          if(window.web3 && window.web3.provider && window.web3.signer && window.web3.addr){
            HeartRuntime.syncFromWeb3();
          }else{
            await HeartRuntime.ensureConnected();
          }
          if(!HeartRuntime.state.address){
            StatusRuntime.push("錢包連線失敗：未取得帳戶");
            return false;
          }
          if(!HeartRuntime.isOnBSC()){
            StatusRuntime.push("請切換至 BSC（鏈 ID 56）");
            return false;
          }
          WalletRuntime.closeWalletHub();
          StatusRuntime.push("錢包已連線：" + short(HeartRuntime.state.address));
          await HeartRuntime.refreshChainData(true);
          return true;
        }catch(error){
          StatusRuntime.push("錢包連線失敗：" + asErrorMessage(error));
          return false;
        }
      }
      if(this.isSocialInAppBrowser() || this.isMobileBrowser() || !HeartRuntime.hasInjectedWallet()){
        if(window.web3 && typeof window.web3.deepLink === "function"){
          StatusRuntime.push("正在用 MetaMask 開啟 12345 神殿");
          return window.web3.deepLink("metamask");
        }
      }
      this.openWalletHub("桌機未偵測到錢包：請安裝 MetaMask");
      return false;
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
      const key = ApproveRuntime.getSelectedKey();
      const slot = ApproveRuntime.slots.find(function(entry){ return entry.key === key; });
      StatusRuntime.push("Approve " + (slot ? slot.label : key) + "：準備中…");
      return ApproveRuntime.approveSelected();
    },
    approveUnlimited: function(){
      StatusRuntime.push("無限授權：準備中…");
      return ApproveRuntime.approveUnlimited();
    },
    switchWallet: async function(){
      if(window.web3 && typeof window.web3.switchWallet === "function"){
        return window.web3.switchWallet();
      }
      const eth = HeartRuntime.getEthereum();
      if(!eth){
        if(window.web3 && typeof window.web3.deepLink === "function"){
          return window.web3.deepLink("metamask");
        }
        StatusRuntime.push("請用 MetaMask App 開啟 12345 神殿");
        return false;
      }
      try{
        try{
          await eth.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }]
          });
        }catch(_){
          StatusRuntime.push("請在 MetaMask 右上角帳號切換");
          return false;
        }
        await eth.request({ method: "eth_requestAccounts" });
        if(window.web3 && typeof window.web3.connect === "function"){
          await window.web3.connect();
        }else{
          await HeartRuntime.ensureConnected();
        }
        HeartRuntime.syncFromWeb3();
        await HeartRuntime.refreshChainData(true);
        StatusRuntime.push("已切換錢包帳號");
        return true;
      }catch(error){
        StatusRuntime.push("切換錢包失敗：" + asErrorMessage(error));
        return false;
      }
    },
    downloadBookmark: function(){
      return this.copyOfficialUrl().then(function(){
        StatusRuntime.push("已複製頁面連結，可加入書籤收藏");
      }).catch(function(){
        StatusRuntime.push("請手動將此頁加入書籤收藏");
      });
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
      window.connectWallet = function(){
        if(window.web3 && typeof window.web3.smartConnect === "function"){
          return window.web3.smartConnect();
        }
        return WalletRuntime.connect();
      };
    }
  };

  const LegacyBridgeRuntime = {
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.installStubs();
      this.patchWeb3Refresh();
    },
    installStubs: function(){
      const openHeart = function(tab){
        ActionRuntime.toggleHeartPanel(true);
        StatusRuntime.push("已開啟 Heart 控制台" + (tab ? "：" + tab : ""));
      };
      window.templeAudio = {
        toggleMini: function(){
          MediaRuntime.toggle();
        },
        playBgm: function(){ if(window.app && window.app.musicPlay) window.app.musicPlay(); },
        stopBgm: function(){ if(window.app && window.app.musicStop) window.app.musicStop(); },
        setVolume: function(v){
          const vol = $("music-vol") || $("ta-volume");
          if(vol) vol.value = v;
          if(window.app && window.app.musicSetVolume) window.app.musicSetVolume(v);
        }
      };
      window.templeSingleModal = {
        openTab: function(tab){ openHeart(tab); },
        close: function(){ ActionRuntime.toggleHeartPanel(false); }
      };
      window.roundHistory = {
        open: function(){ openHeart("claim"); },
        close: function(){},
        loadInput: function(){ StatusRuntime.push("名額紀錄已整合至 Heart 狀態列"); },
        loadLatest: function(){ HeartRuntime.refreshChainData(true); },
        prev: function(){ StatusRuntime.push("名額紀錄：示範模式"); },
        next: function(){ StatusRuntime.push("名額紀錄：示範模式"); }
      };
      window.betPanel = {
        approve: function(){ return WalletRuntime.approveCurrent(); },
        buy: function(){ return HeartRuntime.clickAction("kh-fortune"); },
        sell: function(){ return HeartRuntime.clickAction("kh-heartbeat"); }
      };
      window.chainLive = {
        refresh: function(){ return HeartRuntime.refreshChainData(true); }
      };
      window.leaderboard = {
        refresh: function(){ StatusRuntime.push("排行榜：示範模式（無後端）"); }
      };
      window.toggleChainLive = function(){
        const panel = $("chain-live-panel");
        if(panel){
          panel.classList.toggle("kgen-v3-dead");
          StatusRuntime.push(panel.classList.contains("kgen-v3-dead") ? "Chain Live 已隱藏" : "Chain Live 已顯示（示範）");
        }
      };
      window.toggleBetPanel = function(){
        ActionRuntime.toggleHeartPanel(true);
        StatusRuntime.push("操作已整合至 Heart 控制台");
      };
      window.toggleBoardPanel = function(){
        const panel = $("board-panel");
        if(panel){
          panel.classList.toggle("kgen-v3-dead");
          StatusRuntime.push(panel.classList.contains("kgen-v3-dead") ? "排行榜已隱藏" : "排行榜已顯示（示範）");
        }
      };
    },
    patchWeb3Refresh: function(){
      if(!window.web3) return;
      const heartRefresh = function(){
        return HeartRuntime.refreshChainData(true);
      };
      window.web3.refresh = heartRefresh;
      window.web3.refreshUser = heartRefresh;
      if(typeof window.web3.approve === "function"){
        const oldApprove = window.web3.approve;
        window.web3.approve = function(){
          return ApproveRuntime.approveFortune().catch(function(){
            return oldApprove.apply(window.web3, arguments);
          });
        };
      }else{
        window.web3.approve = function(){ return ApproveRuntime.approveSelected(); };
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
    MediaRuntime: MediaRuntime,
    KlineRuntime: KlineRuntime,
    CountdownRuntime: CountdownRuntime,
    HolyCupRuntime: HolyCupRuntime,
    HeartRuntime: HeartRuntime,
    ApproveRuntime: ApproveRuntime,
    WalletRuntime: WalletRuntime,
    MirrorRuntime: MirrorRuntime,
    ScreenRecorderRuntime: ScreenRecorderRuntime,
    ActionRuntime: ActionRuntime,
    LandRuntime: LandRuntime,
    LayoutRuntime: LayoutRuntime,
    LegacyBridgeRuntime: LegacyBridgeRuntime
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
      LegacyBridgeRuntime.init();
      HudRuntime.init();
      MediaRuntime.init();
      KlineRuntime.init();
      CountdownRuntime.init();
      HolyCupRuntime.init();
      MirrorRuntime.init();
      ScreenRecorderRuntime.init();
      ApproveRuntime.init();
      WalletRuntime.init();
      HeartRuntime.init();
      ActionRuntime.init();
      LandRuntime.init();
      TimerRegistry.register("clock", function(){ HudRuntime.tick(); }, 1000);
      TimerRegistry.register("countdown", function(){ CountdownRuntime.tick(); }, 1000);
      TimerRegistry.register("heart", function(){ HeartRuntime.refreshChainData(false); }, 12000);
      TimerRegistry.register("status", function(){ StatusRuntime.tick(); HeartRuntime.statusTick(); }, 1000);
      StatusRuntime.push("KGEN_RUNTIME_CORE V2.2.0 RECOVERY ready");
      return this;
    }
  };

  window.KGEN_RUNTIME_CORE = KGEN_RUNTIME_CORE;
  window.KGEN_WALLET_BRIDGE = WALLET_BRIDGE;
  window.KGEN_STATUS_BUS = StatusRuntime;
  window.KGEN_HOLYCUP_RUNTIME = HolyCupRuntime;
  window.KGEN_MIRROR_VIEW = MirrorRuntime;
  window.KGEN_SCREEN_REC = ScreenRecorderRuntime;
  window.KGEN_APPROVE_RUNTIME = ApproveRuntime;
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
