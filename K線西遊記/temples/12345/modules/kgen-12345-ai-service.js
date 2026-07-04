/*
FILE: modules/kgen-12345-ai-service.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: V2.3.2-AI-SERVICE
PURPOSE: Frontend AI customer service (FAQ + Web Speech), no external API.
*/
(function(){
  "use strict";

  const VERSION = "V2.3.2-AI-SERVICE";
  const WELCOME_KEY = "kgen12345_ai_welcome_v232";
  const AVATAR_SRC = "./assets/heart.png";

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

  const GUIDE_VOICE = "歡迎使用悟空財神殿導覽。右側可連結錢包、領發財金與查看規則。左下 Heart 控制台可查看 KGEN、Allowance 與鏈上狀態。若有問題可在 AI 客服輸入關鍵字。";

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

  const AiService = {
    voiceOn: true,
    inited: false,
    init: function(){
      if(this.inited) return;
      this.inited = true;
      this.ensurePanel();
      this.bindControls();
      this.hookGuideButtons();
      this.welcomeOnce();
      window.KGEN_AI_SERVICE = this;
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
    speak: function(text){
      if(!this.voiceOn || !supportsSpeech() || !text) return;
      try{
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = "zh-TW";
        u.rate = 0.95;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
      }catch(_){ }
    },
    welcomeOnce: function(){
      try{
        if(localStorage.getItem(WELCOME_KEY)) return;
        const self = this;
        setTimeout(function(){
          self.appendLog("bot", "歡迎進入 KGEN 12345 五指山悟空財神殿");
          self.speak("歡迎進入 KGEN 12345 五指山悟空財神殿");
          localStorage.setItem(WELCOME_KEY, "1");
        }, 1400);
      }catch(_){ }
    },
    explainGuide: function(){
      this.appendLog("bot", "已為你解說目前頁面：右側連錢包與發財金，左下 Heart 控制台可看餘額與 Claim 狀態。");
      this.speak(GUIDE_VOICE);
    },
    ask: function(question){
      const q = String(question || "").trim();
      if(!q){
        this.appendLog("bot", "請輸入問題，例如：如何連錢包、如何領發財金。");
        return;
      }
      this.appendLog("user", q);
      const hit = matchFaq(q);
      if(hit){
        this.appendLog("bot", hit.answer);
        this.speak(hit.voice);
        return;
      }
      const fallback = "我是前端 AI 客服。可問：如何連錢包、如何領發財金、為什麼不能領、什麼是 Heart 血庫、什麼是 BSC、如何切換錢包。";
      this.appendLog("bot", fallback);
      if(!supportsSpeech()){
        this.appendLog("bot", "（此瀏覽器不支援語音，僅文字客服）");
      }else{
        this.speak("我是前端 AI 客服，請輸入關鍵字查詢常見問題。");
      }
    }
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ AiService.init(); });
  }else{
    AiService.init();
  }
})();
