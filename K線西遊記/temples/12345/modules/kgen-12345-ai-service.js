/*
FILE: modules/kgen-12345-ai-service.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: V2.3.3-AI-SERVICE
PURPOSE: Frontend AI customer service (FAQ + Web Speech + button voice delegate).
*/
(function(){
  "use strict";

  const VERSION = "V3.0-AI-SERVICE";
  const WELCOME_KEY = "kgen12345_ai_welcome_v30";
  const AVATAR_SRC = "./assets/heart.png";
  const VOICE_DEBOUNCE_MS = 500;

  const FAQ = [
    {
      keys: ["連錢包", "連接錢包", "錢包", "metamask", "trust"],
      answer: "請按「連結錢包」，在 LINE / Facebook 內建瀏覽器請選 MetaMask 或 Trust Wallet，進入 12345.html 橋接後再按「連結錢包 / 切 BSC」。",
      voice: "連結錢包請先開啟多錢包入口。若在 LINE 或 Facebook，請用 MetaMask 或 Trust Wallet 開啟一二三四五英文橋接頁，進入神殿後再連結錢包並切換到 B S C。"
    },
    {
      keys: ["發財金", "領發財金", "fortune"],
      answer: "發財金流程：連錢包 → Approve → 連續三次聖盃 → fortuneClaim。金額 1–888 KGEN，30 天冷卻，每 epoch 最多 500 名。",
      voice: "發財金要先連錢包、授權、完成三次聖盃，再送出 fortuneClaim。金額一到八百八十八，冷卻三十天。"
    },
    {
      keys: ["不能領", "為什麼不能", "冷卻", "領不了"],
      answer: "常見原因：三聖盃未完成、30 天冷卻未到、epoch 名額已滿、Heart 血庫不足、或 BNB gas 不足。請看發財金狀態列與 Claim Debug。",
      voice: "不能領發財金，常見原因是聖盃未完成、冷卻時間未到、名額已滿、血庫不足，或 B N B gas 不足。"
    },
    {
      keys: ["heart", "血庫", "heart 血庫"],
      answer: "Heart 血庫是 TempleHeart 合約持有的 KGEN 池，發財金與還願都從這裡流出或回流，與 11520 Brain 形成循環血庫。",
      voice: "Heart 血庫是神殿合約持有的 K G E N 資金池，發財金與還願都與這個血庫循環。"
    },
    {
      keys: ["bsc", "鏈", "切換", "切 bsc", "bnb"],
      answer: "本神殿鎖定 BNB Smart Chain（chainId 56）。請在錢包內切換到 BSC 主網，再按「連結錢包 / 切 BSC」。",
      voice: "本神殿使用 B N B Smart Chain，鏈編號五十六。請在錢包切到 B S C 主網後再連結。"
    },
    {
      keys: ["切換錢包", "換錢包", "另一個錢包"],
      answer: "請先斷開目前錢包或換用錢包 App 內建瀏覽器，重新開啟 12345.html?autoconnect=1&bridge=1 再連結。",
      voice: "若要切換錢包，請用目標錢包 App 重新開啟一二三四五橋接頁，再按連結錢包。"
    }
  ];

  const BUTTON_VOICE = {
    "kh-connect": "連結錢包並切換到 B S C 主網。若在 LINE 或 Facebook，請先開啟多錢包入口。",
    "walletHubMetaMaskBtn": "MetaMask 開啟一二三四五英文橋接頁，進入神殿後再連結錢包。",
    "walletHubMeta2Btn": "MetaMask 備用連結，若主要入口未跳轉請使用此按鈕。",
    "walletHubTrustBtn": "Trust Wallet 會先嘗試開啟內建瀏覽器。若未自動開啟，請複製一二三四五英文橋接頁到 Trust Wallet 瀏覽器。",
    "walletHubOkxBtn": "OKX Wallet 開啟一二三四五英文橋接頁。",
    "walletHubBitgetBtn": "Bitget Wallet 開啟一二三四五英文橋接頁。",
    "walletHubBinanceBtn": "Binance Wallet 開啟錢包橋接頁。",
    "kh-fortune": "領發財金。需先完成三次聖盃、通過冷卻並確認 B N B gas。",
    "kh-heartbeat": "心跳呼吸領取。整點心跳獎勵，請確認鏈上條件。",
    "kh-ignite": "轉日呼吸領取。請在轉日窗口內送出交易。",
    "kh-cup-1": "聖盃一。完成第一次聖盃確認。",
    "kh-cup-2": "聖盃二。完成第二次聖盃確認。",
    "kh-cup-3": "聖盃三。完成第三次聖盃後可領發財金。",
    "kh-cup-reset": "重置聖盃。將清除本機聖盃進度。",
    "guideUnifiedBtn": "客服導覽。解說錢包、發財金與悟空控制台操作。",
    "boardToggleBtn": "排行榜。開啟五指山排行榜面板。",
    "kgen-heart-toggle": "悟空控制台。展開或收合 Heart 資產與 Claim 面板。"
  };

  const WALLET_ACTION_VOICE = {
    metamask: "MetaMask 開啟一二三四五英文橋接頁。",
    "metamask-backup": "MetaMask 備用連結。",
    trust: "Trust Wallet 若未自動開啟，請複製一二三四五英文橋接頁到 Trust Wallet 瀏覽器。",
    okx: "OKX Wallet 開啟神殿橋接頁。",
    bitget: "Bitget Wallet 開啟神殿橋接頁。",
    binance: "Binance Wallet 開啟錢包橋接頁。"
  };

  const FOOTER_VOICE = [
    "拍照存證。擷取目前神殿畫面。",
    "錄影。切換五指山神殿留影錄影。",
    "前鏡多方。開啟前鏡頭，多方角度四十五度。",
    "後鏡空方。開啟後鏡頭，空方角度一百三十五度。",
    "悟空心臟。展開或收合 Heart 控制台。",
    "螢幕錄影。使用瀏覽器螢幕錄影功能。",
    "規則活動。展開或收合節慶活動面板。",
    "右側神規。展開或收合右側神殿規則面板。"
  ];

  const GUIDE_VOICE = "歡迎來到 KGEN 12345 五指山悟空財神殿。請先連結錢包，完成三次聖盃，再領發財金。左下 AI 客服可問常見問題，悟空控制台可看 KGEN、Allowance 與鏈上狀態。";

  function $(id){ return document.getElementById(id); }

  function supportsSpeech(){
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }

  function matchFaq(text){
    const q = String(text || "").toLowerCase();
    for(let i = 0; i < FAQ.length; i++){
      const item = FAQ[i];
      for(let j = 0; j < item.keys.length; j++){
        if(q.indexOf(item.keys[j].toLowerCase()) >= 0) return item;
      }
    }
    return null;
  }

  function cleanLabel(text){
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function navVoiceFromText(text){
    const t = cleanLabel(text);
    if(/返回.*K線西遊記|銀河宇宙入口/.test(t)) return "返回 K線西遊記銀河宇宙入口。";
    if(/官方宇宙首頁/.test(t)) return "官方宇宙首頁入口。";
    if(/五指山神殿音響/.test(t)) return "五指山神殿音響。可播放內建或自選 M P 3 歌單。";
    if(/名額紀錄/.test(t)) return "名額紀錄。目前顯示 Coming Soon，不會開啟其它視窗。";
    if(/排行榜/.test(t)) return "排行榜。示範模式排行榜面板。";
    if(/客服|導覽/.test(t)) return "客服導覽。解說神殿功能與錢包流程。";
    if(/土地資訊/.test(t)) return "土地資訊。查看選取格子的地籍與狀態。";
    if(/悟空土地|土地地籍/.test(t)) return "悟空土地地籍。可框選與查看土地格子。";
    if(/訊息紀錄/.test(t)) return "訊息紀錄。查看系統與鏈上訊息。";
    return "";
  }

  const AiService = {
    voiceOn: true,
    inited: false,
    lastVoiceKey: "",
    lastVoiceAt: 0,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.ensurePanel();
      this.bindControls();
      this.hookGuideButtons();
      this.bindButtonVoiceDelegate();
      this.welcomeOnce();
      window.KGEN_AI_SERVICE = this;
      window.KGEN_AI_SPEAK = this.speakAnnounce.bind(this);
    },
    ensurePanel: function(){
      if($("kgen-ai-service-panel")) return;
      const panel = document.createElement("div");
      panel.id = "kgen-ai-service-panel";
      panel.innerHTML = [
        '<div class="kgen-ai-head">',
        '  <div class="kgen-ai-avatar-wrap"><img class="kgen-ai-avatar" src="' + AVATAR_SRC + '" alt="悟空客服"></div>',
        '  <div class="kgen-ai-head-text">',
        '    <div class="kgen-ai-title">AI客服</div>',
        '    <div class="kgen-ai-sub">前端版｜常見問題</div>',
        '  </div>',
        '  <button type="button" id="kgen-ai-toggle" class="kgen-ai-toggle">收合</button>',
        '</div>',
        '<div class="kgen-ai-body" id="kgen-ai-body">',
        '  <div class="kgen-ai-log" id="kgen-ai-log"></div>',
        '  <div class="kgen-ai-tools">',
        '    <label class="kgen-ai-voice-label"><input type="checkbox" id="kgen-ai-voice" checked> 語音開關</label>',
        '    <button type="button" id="kgen-ai-guide" class="kgen-ai-btn">導覽解說</button>',
        '  </div>',
        '  <div class="kgen-ai-input-row">',
        '    <input id="kgen-ai-input" placeholder="輸入問題，例如：如何連錢包" />',
        '    <button type="button" id="kgen-ai-send" class="kgen-ai-btn primary">送出</button>',
        '  </div>',
        '</div>'
      ].join("");
      document.body.appendChild(panel);
    },
    bindControls: function(){
      const self = this;
      const toggle = $("kgen-ai-toggle");
      const body = $("kgen-ai-body");
      const voice = $("kgen-ai-voice");
      const send = $("kgen-ai-send");
      const input = $("kgen-ai-input");
      const guide = $("kgen-ai-guide");
      if(toggle && body){
        toggle.addEventListener("click", function(){
          const open = body.style.display !== "none";
          body.style.display = open ? "none" : "block";
          toggle.textContent = open ? "展開" : "收合";
        });
      }
      if(voice){
        voice.addEventListener("change", function(){
          self.voiceOn = !!voice.checked;
        });
      }
      if(send && input){
        send.addEventListener("click", function(){ self.ask(input.value); input.value = ""; });
        input.addEventListener("keydown", function(e){
          if(e.key === "Enter"){ e.preventDefault(); self.ask(input.value); input.value = ""; }
        });
      }
      if(guide){
        guide.addEventListener("click", function(){ self.explainGuide(); });
      }
    },
    hookGuideButtons: function(){
      const self = this;
      ["guideUnifiedBtn", "auto-battle-btn"].forEach(function(id){
        const btn = $(id);
        if(!btn || btn.dataset.kgenAiHooked) return;
        btn.dataset.kgenAiHooked = "1";
        btn.addEventListener("click", function(){
          setTimeout(function(){ self.explainGuide(); }, 250);
        }, true);
      });
      if(window.app && !window.app.__kgenAiGuidePatched){
        window.app.__kgenAiGuidePatched = true;
        const legacy = window.app.openUnifiedGuide;
        if(typeof legacy === "function"){
          window.app.openUnifiedGuide = function(){
            const r = legacy.apply(window.app, arguments);
            setTimeout(function(){ AiService.explainGuide(); }, 250);
            return r;
          };
        }
      }
    },
    appendLog: function(role, text){
      const log = $("kgen-ai-log");
      if(!log) return;
      const row = document.createElement("div");
      row.className = "kgen-ai-msg " + (role === "user" ? "is-user" : "is-bot");
      row.textContent = (role === "user" ? "你：" : "客服：") + String(text || "");
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    },
    speakRaw: function(text){
      if(!this.voiceOn || !supportsSpeech() || !text) return false;
      try{
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = "zh-TW";
        u.rate = 0.95;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
        return true;
      }catch(_){
        return false;
      }
    },
    speakAnnounce: function(text, options){
      options = options || {};
      const msg = cleanLabel(text);
      if(!msg) return;
      if(!options.skipStatus){
        try{
          if(window.KGEN_STATUS_BUS && typeof window.KGEN_STATUS_BUS.push === "function"){
            window.KGEN_STATUS_BUS.push(msg);
          }
        }catch(_){ }
      }
      this.appendLog("bot", msg);
      if(!this.speakRaw(msg) && !supportsSpeech()){
        this.appendLog("bot", "（此瀏覽器不支援語音，僅文字客服）");
      }
    },
    shouldVoiceForButton: function(key){
      const now = Date.now();
      if(key && key === this.lastVoiceKey) return false;
      if(now - this.lastVoiceAt < VOICE_DEBOUNCE_MS) return false;
      this.lastVoiceKey = key || "";
      this.lastVoiceAt = now;
      return true;
    },
    resolveButtonVoice: function(btn){
      if(!btn) return "";
      if(btn.dataset && btn.dataset.voice) return cleanLabel(btn.dataset.voice);
      if(btn.id && BUTTON_VOICE[btn.id]) return BUTTON_VOICE[btn.id];
      const action = btn.getAttribute && btn.getAttribute("data-wallet-action");
      if(action && WALLET_ACTION_VOICE[action]) return WALLET_ACTION_VOICE[action];
      if(btn.closest && btn.closest(".kgen-land-info-head")) return "土地資訊。查看選取格子的地籍與狀態。";
      if(btn.closest && btn.closest(".kgen-land-head")) return "悟空土地地籍。可框選與查看土地格子。";
      const footer = btn.closest && btn.closest(".footer-terminal");
      if(footer){
        const buttons = Array.from(footer.querySelectorAll("button,.term-btn"));
        const idx = buttons.indexOf(btn);
        if(idx >= 0 && FOOTER_VOICE[idx]) return FOOTER_VOICE[idx];
      }
      const navText = navVoiceFromText(btn.textContent || btn.innerText || "");
      if(navText) return navText;
      const label = cleanLabel(btn.textContent || btn.innerText || btn.getAttribute("aria-label") || "");
      if(label.length >= 2 && label.length <= 80) return label + "。";
      return "";
    },
    isVoiceTarget: function(node){
      if(!node || node.nodeType !== 1) return null;
      if(node.closest && (
        node.closest("#kgen-ai-service-panel") ||
        node.closest("#wallet-debug-body") ||
        node.closest("#claim-debug-body") ||
        node.closest("input, textarea, select, label")
      )) return null;
      const selectors = [
        "button",
        ".nav-btn",
        ".term-btn",
        ".kh-btn-lg",
        ".kgen-land-head",
        ".kgen-land-info-head",
        "[data-wallet-action]",
        "a.nav-btn"
      ];
      for(let i = 0; i < selectors.length; i++){
        const hit = node.closest ? node.closest(selectors[i]) : null;
        if(hit) return hit;
      }
      return null;
    },
    bindButtonVoiceDelegate: function(){
      const self = this;
      document.addEventListener("click", function(event){
        const btn = self.isVoiceTarget(event.target);
        if(!btn) return;
        const voice = self.resolveButtonVoice(btn);
        if(!voice) return;
        const key = btn.id || btn.getAttribute("data-wallet-action") || cleanLabel(btn.textContent || "");
        if(!self.shouldVoiceForButton(key)) return;
        self.speakAnnounce(voice, { skipStatus: true });
        try{
          if(window.KGEN_STATUS_BUS && typeof window.KGEN_STATUS_BUS.push === "function"){
            window.KGEN_STATUS_BUS.push(voice);
          }
        }catch(_){ }
      }, true);
    },
    welcomeOnce: function(){
      try{
        if(localStorage.getItem(WELCOME_KEY)) return;
        const self = this;
        setTimeout(function(){
          self.speakAnnounce("歡迎進入 KGEN 12345 五指山悟空財神殿");
          localStorage.setItem(WELCOME_KEY, "1");
        }, 1400);
      }catch(_){ }
    },
    explainGuide: function(){
      this.speakAnnounce("已為你解說 KGEN 12345 五指山悟空財神殿：連錢包、聖盃、發財金、還願與許願都在悟空控制台。");
      this.speakRaw(GUIDE_VOICE);
    },
    ask: function(question){
      const q = String(question || "").trim();
      if(!q){
        this.speakAnnounce("請輸入問題，例如：如何連錢包、如何領發財金。");
        return;
      }
      this.appendLog("user", q);
      const hit = matchFaq(q);
      if(hit){
        this.speakAnnounce(hit.answer);
        this.speakRaw(hit.voice);
        return;
      }
      const fallback = "我是前端 AI 客服。可問：如何連錢包、如何領發財金、為什麼不能領、什麼是 Heart 血庫、什麼是 BSC、如何切換錢包。";
      this.speakAnnounce(fallback);
      if(supportsSpeech()){
        this.speakRaw("我是前端 AI 客服，請輸入關鍵字查詢常見問題。");
      }
    }
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ AiService.init(); });
  }else{
    AiService.init();
  }
})();
