/*
FILE: modules/kgen-12345-ui.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: V3.0-OVERLAY-GAMEPLAY
PURPOSE: 12345 Temple UI V3.0 — overlays, leaderboard, quota, guide, ritual
*/
(function(){
  "use strict";

  const VERSION = "3.0";
  const INTRO_SPEECH = "歡迎來到 KGEN 12345 五指山悟空財神殿。請先連結錢包，完成三次聖盃，再領發財金。心跳、轉日呼吸、還願、點燈與許願都在悟空控制台。";
  const TEMPLE_IMAGE_SRC = "./assets/wukong_heart_core.jpg";

  const DEMO_RANKS = {
    player: [
      { name: "0xWuk0ng…1234", score: "128,400 KGEN" },
      { name: "0xJinGu…5678", score: "96,200 KGEN" },
      { name: "0xMaHa…9abc", score: "72,880 KGEN" },
      { name: "0xShaHe…def0", score: "51,300 KGEN" },
      { name: "0xBaiGu…2468", score: "38,900 KGEN" }
    ],
    kgen: [
      { name: "KGEN 總質量", score: "1.24B" },
      { name: "Heart 血庫", score: "888,888" },
      { name: "Brain 11520", score: "456,120" },
      { name: "Mars Seats", score: "108,000" },
      { name: "今日流通", score: "12,345" }
    ],
    temple: [
      { name: "KGEN 12345 五指山", score: "★★★★★" },
      { name: "靈霄神明銀行席位", score: "312 / 500" },
      { name: "齊天豪宅分紅席位", score: "287 / 500" },
      { name: "本 epoch 發財金", score: "186 / 500" },
      { name: "活躍許願", score: "Demo 42" }
    ],
    tx: [
      { name: "fortuneClaim", score: "1,204 tx" },
      { name: "heartbeatClaim", score: "8,912 tx" },
      { name: "vowTo 還願", score: "642 tx" },
      { name: "makeWish 許願", score: "318 tx" },
      { name: "lightLamp 點燈", score: "205 tx" }
    ]
  };

  function $(id){ return document.getElementById(id); }

  function safeRun(label, fn){
    try{
      if(typeof fn === "function") fn();
    }catch(err){
      try{ console.warn("[KGEN12345 UI " + VERSION + "] " + label, err); }catch(_){ }
    }
  }

  function pushStatus(msg){
    try{
      if(window.StatusRuntime && typeof window.StatusRuntime.push === "function"){
        window.StatusRuntime.push(msg);
      }
    }catch(_){ }
  }

  function speak(text){
    try{
      if(window.KGEN_AI_SERVICE && typeof window.KGEN_AI_SERVICE.speak === "function"){
        window.KGEN_AI_SERVICE.speak(text);
        return;
      }
      if(window.app && typeof window.app.speak === "function"){
        window.app.speak(text);
      }
    }catch(_){ }
  }

  function openHeartWish(){
    if(window.ActionRuntime && typeof window.ActionRuntime.toggleHeartPanel === "function"){
      window.ActionRuntime.toggleHeartPanel(true);
      setTimeout(function(){
        const card = document.querySelector('#kgen-heart-live-panel [data-kh-card="wish"]');
        if(card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
      pushStatus("已開啟悟空控制台 — 許願");
      return true;
    }
    return false;
  }

  function openHeartVow(){
    if(window.ActionRuntime && typeof window.ActionRuntime.toggleHeartPanel === "function"){
      window.ActionRuntime.toggleHeartPanel(true);
      setTimeout(function(){
        const card = document.querySelector('#kgen-heart-live-panel [data-kh-card="vow"]');
        if(card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
      pushStatus("已開啟悟空控制台 — 還願");
      return true;
    }
    return false;
  }

  const Overlay = {
    ensureQuota: function(){
      if($("kgen-v30-quota-overlay")) return;
      const el = document.createElement("div");
      el.id = "kgen-v30-quota-overlay";
      el.innerHTML = [
        '<div class="kgen-v30-modal" role="dialog" aria-label="名額紀錄">',
        '  <div class="kgen-v30-modal-head">',
        '    <div class="kgen-v30-modal-title">五指山名額紀錄</div>',
        '    <button type="button" class="kgen-v30-modal-close" data-close="quota">關閉</button>',
        '  </div>',
        '  <div class="kgen-v30-coming">Coming Soon</div>',
        '  <div class="kgen-v30-note">12345 TempleHeart epoch 名額與輪次紀錄即將上線。目前不會開啟其它視窗。</div>',
        '</div>'
      ].join("");
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        if(e.target === el || e.target.closest("[data-close]")) this.classList.remove("is-open");
      }.bind(el));
    },
    openQuota: function(){
      this.ensureQuota();
      $("kgen-v30-quota-overlay").classList.add("is-open");
      pushStatus("名額紀錄：Coming Soon");
    },
    closeQuota: function(){
      const el = $("kgen-v30-quota-overlay");
      if(el) el.classList.remove("is-open");
    },
    ensureLeaderboard: function(){
      if($("kgen-v30-leaderboard-overlay")) return;
      const el = document.createElement("div");
      el.id = "kgen-v30-leaderboard-overlay";
      el.innerHTML = [
        '<div class="kgen-v30-modal" role="dialog" aria-label="排行榜">',
        '  <div class="kgen-v30-modal-head">',
        '    <div class="kgen-v30-modal-title">五指山悟空財神殿排行榜</div>',
        '    <button type="button" class="kgen-v30-modal-close" data-close="board">關閉</button>',
        '  </div>',
        '  <div class="kgen-v30-tabs">',
        '    <button type="button" class="kgen-v30-tab is-active" data-lb="player">玩家排行</button>',
        '    <button type="button" class="kgen-v30-tab" data-lb="kgen">KGEN排行</button>',
        '    <button type="button" class="kgen-v30-tab" data-lb="temple">Temple排行</button>',
        '    <button type="button" class="kgen-v30-tab" data-lb="tx">交易排行</button>',
        '  </div>',
        '  <div class="kgen-v30-rank-list" id="kgen-v30-rank-list"></div>',
        '  <div class="kgen-v30-note">排行榜鏈上資料尚未接入；目前顯示 Coming Soon，不使用示範排行。</div>',
        '</div>'
      ].join("");
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        if(e.target === el || e.target.closest("[data-close]")) this.classList.remove("is-open");
      }.bind(el));
      el.querySelectorAll(".kgen-v30-tab").forEach(function(tab){
        tab.addEventListener("click", function(){
          el.querySelectorAll(".kgen-v30-tab").forEach(function(t){ t.classList.remove("is-active"); });
          tab.classList.add("is-active");
          Leaderboard.render(tab.getAttribute("data-lb"));
        });
      });
    },
    openLeaderboard: function(tab){
      this.ensureLeaderboard();
      const el = $("kgen-v30-leaderboard-overlay");
      el.classList.add("is-open");
      Leaderboard.render(tab || "player");
      pushStatus("排行榜已開啟（示範資料）");
    },
    closeLeaderboard: function(){
      const el = $("kgen-v30-leaderboard-overlay");
      if(el) el.classList.remove("is-open");
    },
    ensureWish: function(){
      if($("kgen-v30-wish-overlay")) return;
      const el = document.createElement("div");
      el.id = "kgen-v30-wish-overlay";
      el.innerHTML = [
        '<div class="kgen-v30-modal" role="dialog" aria-label="許願">',
        '  <div class="kgen-v30-modal-head">',
        '    <div class="kgen-v30-modal-title">✨ 五指山許願</div>',
        '    <button type="button" class="kgen-v30-modal-close" data-close="wish">關閉</button>',
        '  </div>',
        '  <div class="kgen-v30-note" style="margin-bottom:10px;">許願只上鏈 hash，不公開明文。請在下方輸入願望，或前往悟空控制台送出 makeWish。</div>',
        '  <textarea id="kgen-v30-wish-text" rows="3" placeholder="輸入願望文字或 0x bytes32 hash" style="width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(255,215,120,.35);background:#05070b;color:#fff;padding:10px;font-size:13px;"></textarea>',
        '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">',
        '    <button type="button" id="kgen-v30-wish-send" style="border-radius:12px;border:1px solid rgba(255,215,120,.55);background:rgba(255,215,120,.2);color:#ffe9b8;font-weight:900;padding:10px;cursor:pointer;">送出許願</button>',
        '    <button type="button" id="kgen-v30-wish-console" style="border-radius:12px;border:1px solid rgba(0,242,255,.35);background:rgba(0,242,255,.12);color:#dff;font-weight:900;padding:10px;cursor:pointer;">開控制台</button>',
        '  </div>',
        '</div>'
      ].join("");
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        if(e.target === el || e.target.closest("[data-close]")) this.classList.remove("is-open");
      }.bind(el));
      $("kgen-v30-wish-send").addEventListener("click", function(){
        const text = ($("kgen-v30-wish-text").value || "").trim();
        const target = $("kh-wish-text");
        if(target && text) target.value = text;
        el.classList.remove("is-open");
        if(window.templeOps && typeof window.templeOps.wish === "function"){
          window.templeOps.wish();
        }else if(openHeartWish()){
          setTimeout(function(){
            const btn = $("kh-wishbtn");
            if(btn) btn.click();
          }, 200);
        }else{
          Overlay.openStatus("許願 Coming Soon", "許願功能正在等待悟空控制台載入。請確認頁面完成啟動後再試一次。");
        }
      });
      $("kgen-v30-wish-console").addEventListener("click", function(){
        el.classList.remove("is-open");
        openHeartWish();
      });
    },
    openWish: function(){
      this.ensureWish();
      $("kgen-v30-wish-overlay").classList.add("is-open");
    },
    ensureStatus: function(){
      if($("kgen-v30-status-overlay")) return;
      const el = document.createElement("div");
      el.id = "kgen-v30-status-overlay";
      el.innerHTML = [
        '<div class="kgen-v30-modal" role="dialog" aria-label="功能狀態">',
        '  <div class="kgen-v30-modal-head">',
        '    <div class="kgen-v30-modal-title" id="kgen-v30-status-title">功能狀態</div>',
        '    <button type="button" class="kgen-v30-modal-close" data-close="status">關閉</button>',
        '  </div>',
        '  <div class="kgen-v30-coming kgen-v30-coming-compact" id="kgen-v30-status-main">Coming Soon</div>',
        '  <div class="kgen-v30-note" id="kgen-v30-status-copy"></div>',
        '</div>'
      ].join("");
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        if(e.target === el || e.target.closest("[data-close]")) this.classList.remove("is-open");
      }.bind(el));
    },
    openStatus: function(title, copy){
      this.ensureStatus();
      const el = $("kgen-v30-status-overlay");
      const titleNode = $("kgen-v30-status-title");
      const mainNode = $("kgen-v30-status-main");
      const copyNode = $("kgen-v30-status-copy");
      if(titleNode) titleNode.textContent = title || "功能狀態";
      if(mainNode) mainNode.textContent = /Coming Soon/i.test(title || "") ? "Coming Soon" : "已收到";
      if(copyNode) copyNode.textContent = copy || "目前狀態已更新。";
      if(el) el.classList.add("is-open");
      pushStatus((title || "功能狀態") + "：" + (copy || "目前狀態已更新。"));
    }
  };

  const Leaderboard = {
    render: function(kind){
      const list = $("kgen-v30-rank-list");
      if(!list) return;
      list.innerHTML = [
        '<div class="kgen-v30-coming kgen-v30-coming-compact">Coming Soon</div>',
        '<div class="kgen-v30-note">排行榜資料尚未接入正式鏈上 API。為避免誤導玩家，本版不顯示示範排行。</div>'
      ].join("");
    },
    refresh: function(){
      const active = document.querySelector("#kgen-v30-leaderboard-overlay .kgen-v30-tab.is-active");
      this.render(active ? active.getAttribute("data-lb") : "player");
      pushStatus("排行榜已重新計算（示範）");
    }
  };

  const GuidePatch = {
    blocks: function(){
      return {
        intro: [
          "<h3>KGEN 12345 五指山悟空財神殿</h3>",
          "<p>這裡是 <b>12345 五指山悟空財神殿操作版</b>。核心流程：<b>連錢包 → Approve → 三次聖盃 → 領發財金</b>。</p>",
          "<p>心跳、轉日呼吸、還願、點燈、許願都在 <b>悟空控制台</b> 與 TempleHeart V3.2.6 合約。</p>",
          "<ol><li>連結錢包並切到 BSC 主網</li><li>輸入 KGEN 金額並 Approve</li><li>完成三次聖盃</li><li>fortuneClaim 領發財金</li></ol>"
        ].join(""),
        rules: [
          "<h3>12345 發放規則</h3>",
          "<ul>",
          "<li><b>fortuneClaim：</b>1–888 KGEN，30 天冷卻，每 epoch 500 名</li>",
          "<li><b>heartbeatClaim：</b>每小時一次</li>",
          "<li><b>igniteAndClaim：</b>UTC 00:00–00:10 每日一次</li>",
          "<li><b>vowTo / lightLamp / makeWish：</b>還願、點燈、許願儀式</li>",
          "</ul>",
          "<p>Heart ↔ 11520 Brain 形成循環血庫。本頁只服務五指山 12345。</p>"
        ].join(""),
        wallet: [
          "<h3>錢包與找幣</h3>",
          "<p>找不到 KGEN 時，請在 BNB Chain 用 <b>Custom</b> 貼上合約地址：</p>",
          "<p><code>0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be</code></p>",
          "<p>LINE / Facebook 請用 MetaMask 或 Trust 開啟 <b>12345.html</b> 橋接後再連結。</p>"
        ].join(""),
        approve: [
          "<h3>Approve 教學</h3>",
          "<ol><li>輸入 KGEN 金額</li><li>按 Approve 授權 TempleHeart</li><li>完成三次聖盃</li><li>再送 fortuneClaim / vowTo / lightLamp</li></ol>",
          "<p class='muted'>makeWish 許願只需 BNB gas，不需 approve。</p>"
        ].join(""),
        playbook: [
          "<h3>五指山完整玩法</h3>",
          "<p>1. fortuneClaim 發財金｜2. heartbeatClaim 心跳｜3. igniteAndClaim 轉日呼吸</p>",
          "<p>4. vowTo 還願補血｜5. lightLamp 點燈｜6. makeWish 許願 hash</p>",
          "<p><b>Heart：</b><code>0xB016D4d8f1aED1339101b30722cad6dbA9B8C972</code></p>"
        ].join(""),
        qa: [
          "<h3>悟空客服問答</h3>",
          "<p>可問：如何連錢包、如何領發財金、為什麼不能領、什麼是 Heart 血庫。</p>",
          "<div class='qa-grid'>",
          "<button class='qa-btn' data-q='如何連錢包？'>如何連錢包？</button>",
          "<button class='qa-btn' data-q='如何領發財金？'>如何領發財金？</button>",
          "<button class='qa-btn' data-q='為什麼不能領發財金？'>為什麼不能領？</button>",
          "<button class='qa-btn' data-q='什麼是 Heart 血庫？'>Heart 血庫？</button>",
          "</div>",
          "<div id='qa-last' style='margin-top:10px'></div>",
          "<div id='qa-last-a' style='margin-top:6px'></div>"
        ].join("")
      };
    },
    answer: function(question){
      const q = String(question || "").trim();
      const lower = q.toLowerCase();
      if(q.includes("連錢包") || lower.includes("wallet") || lower.includes("metamask")){
        return "請按連結錢包。若在 LINE 或 Facebook，請用 MetaMask 或 Trust 開啟 12345.html 橋接，進入神殿後切 BSC 再連結。";
      }
      if(q.includes("發財金") || lower.includes("fortune")){
        return "發財金流程：連錢包 → Approve → 三次聖盃 → fortuneClaim。金額 1 到 888，冷卻 30 天，每 epoch 500 名。";
      }
      if(q.includes("不能領") || q.includes("領不了")){
        return "常見原因：聖盃未完成、冷卻未到、名額已滿、血庫不足或 BNB gas 不足。請看 Claim Debug。";
      }
      if(q.includes("血庫") || lower.includes("heart")){
        return "Heart 血庫是 12345 TempleHeart 合約持有的 KGEN 池，發財金與還願都與這個血庫循環。";
      }
      return "我是五指山悟空客服。可問：如何連錢包、如何領發財金、為什麼不能領、什麼是 Heart 血庫。";
    },
    apply: function(){
      if(!window.app || window.app.__kgenV30GuidePatched) return;
      window.app.__kgenV30GuidePatched = true;
      const self = this;
      window.app.getGuideBlocks = function(){ return self.blocks(); };
      const oldHandle = window.app.handleQuestion;
      window.app.handleQuestion = function(q){
        const ans = self.answer(q);
        const qaBox = $("qa-last");
        const aBox = $("qa-last-a");
        if(qaBox) qaBox.textContent = "Q: " + String(q || "").trim();
        if(aBox) aBox.textContent = "A: " + ans;
        speak(ans);
        if(typeof oldHandle === "function"){ try{ oldHandle.call(window.app, q); }catch(_){ } }
      };
      window.app.openUnifiedGuide = function(section){
        window.app.openGuide(section || "intro");
        speak("歡迎使用 KGEN 12345 五指山悟空財神殿導覽。這裡只介紹 12345 五指山悟空財神殿。");
      };
      window.app.playTempleIntro = function(){
        window.app.openGuide("intro");
        speak(INTRO_SPEECH);
      };
      const oldOpen = window.app.openGuide;
      window.app.openGuide = function(section){
        if(typeof oldOpen === "function") oldOpen.call(window.app, section);
        else {
          const modal = $("guide-modal");
          const body = $("guide-body");
          if(modal && body){
            const blocks = self.blocks();
            body.innerHTML = blocks[(section || "intro").toLowerCase()] || blocks.intro;
            modal.classList.add("show");
          }
        }
      };
    }
  };

  const Ritual = {
    tab: "wish",
    init: function(){
      this.ensureDock();
      this.wireV860();
    },
    ensureDock: function(){
      if($("kgen-v30-ritual-dock")) return;
      const dock = document.createElement("div");
      dock.id = "kgen-v30-ritual-dock";
      dock.innerHTML = '<button type="button" id="kgen-v30-wish-btn">✨ 許願</button><button type="button" id="kgen-v30-vow-btn">🙏 還願</button>';
      document.body.appendChild(dock);
      $("kgen-v30-wish-btn").addEventListener("click", function(){
        if(window.templeOps && typeof window.templeOps.wish === "function"){
          Overlay.openWish();
        }else{
          openHeartWish() || Overlay.openWish();
        }
      });
      $("kgen-v30-vow-btn").addEventListener("click", function(){
        if(!openHeartVow()){
          Overlay.openStatus("還願 Coming Soon", "還願功能正在等待悟空控制台載入。請確認頁面完成啟動後再試一次。");
        }
      });
    },
    wireV860: function(){
      const openBtn = $("kgen-v860-ritual-open");
      const modal = $("kgen-v860-ritual-modal");
      if(!modal) return;
      const self = this;
      function render(){
        const content = $("v860-content");
        if(!content) return;
        if(self.tab === "wish"){
          content.innerHTML = '<div class="v860-card"><h3>✨ 許願上鏈</h3><p>鏈上只存 hash。請在悟空控制台輸入願望後按 makeWish。</p><button class="v860-btn v860-action" type="button" id="v860-go-wish">開啟許願</button></div>';
          $("v860-go-wish").onclick = function(){ modal.classList.remove("v860-show"); Overlay.openWish(); };
        }else if(self.tab === "vow"){
          content.innerHTML = '<div class="v860-card"><h3>🙏 還願補血</h3><p>還願會 transferFrom KGEN 回補 Heart 血庫。</p><button class="v860-btn v860-action" type="button" id="v860-go-vow">開啟還願</button></div>';
          $("v860-go-vow").onclick = function(){ modal.classList.remove("v860-show"); openHeartVow(); };
        }else{
          content.innerHTML = '<div class="v860-card"><h3>🪔 點燈續命</h3><p>點燈在悟空控制台 Vow &amp; Lamp 區。</p><button class="v860-btn v860-action" type="button" id="v860-go-lamp">開啟點燈</button></div>';
          $("v860-go-lamp").onclick = function(){
            modal.classList.remove("v860-show");
            if(window.ActionRuntime) window.ActionRuntime.toggleHeartPanel(true);
            if(window.templeOps && window.templeOps.lamp) window.templeOps.lamp();
          };
        }
      }
      function open(tab){
        self.tab = tab || "wish";
        modal.classList.add("v860-show");
        render();
      }
      function close(){ modal.classList.remove("v860-show"); }
      if(openBtn) openBtn.onclick = function(){ open("wish"); };
      const closeBtn = $("v860-close");
      if(closeBtn) closeBtn.onclick = close;
      modal.querySelectorAll(".v860-tab").forEach(function(tabBtn){
        tabBtn.addEventListener("click", function(){
          modal.querySelectorAll(".v860-tab").forEach(function(t){ t.classList.remove("v860-active"); });
          tabBtn.classList.add("v860-active");
          self.tab = tabBtn.getAttribute("data-tab") || "wish";
          render();
        });
      });
      modal.addEventListener("click", function(e){ if(e.target === modal) close(); });
    }
  };

  const HeartOverlay = {
    init: function(){
      const toggle = $("kgen-heart-toggle");
      if(!toggle || toggle.dataset.kgenV30Heart) return;
      toggle.dataset.kgenV30Heart = "1";
      const sync = function(){
        const open = !document.body.classList.contains("k12345-heart-collapsed");
        document.body.classList.toggle("k12345-heart-open", open);
      };
      toggle.addEventListener("click", function(){ setTimeout(sync, 0); }, true);
      sync();
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  };

  const PanelOverlay = {
    panelIds: ["music-panel", "bet-live-panel", "chain-live-panel", "board-panel"],
    scrimId: "kgen-v30-panel-scrim",
    ensureScrim: function(){
      let scrim = $(this.scrimId);
      if(!scrim){
        scrim = document.createElement("div");
        scrim.id = this.scrimId;
        scrim.className = "kgen-v30-overlay-scrim";
        document.body.appendChild(scrim);
        scrim.addEventListener("click", function(){ PanelOverlay.closeAll(); });
      }
      return scrim;
    },
    anyOpen: function(){
      return this.panelIds.some(function(id){
        const panel = $(id);
        return panel && panel.classList.contains("kgen-v30-overlay-open");
      });
    },
    syncScrim: function(){
      const scrim = $(this.scrimId);
      if(scrim) scrim.classList.toggle("is-open", this.anyOpen());
    },
    open: function(id){
      const panel = $(id);
      if(!panel) return;
      this.ensureScrim().classList.add("is-open");
      panel.classList.remove("kgen-v3-dead", "kgen-music-docked", "kgen-music-top", "kgen-music-modal");
      panel.classList.add("kgen-v30-overlay-open");
      panel.setAttribute("aria-hidden", "false");
      panel.style.removeProperty("top");
      panel.style.removeProperty("right");
      panel.style.removeProperty("left");
      panel.style.removeProperty("bottom");
      panel.style.display = "block";
    },
    close: function(id){
      const panel = $(id);
      if(!panel) return;
      panel.classList.remove("kgen-v30-overlay-open");
      panel.classList.add("kgen-v3-dead");
      panel.setAttribute("aria-hidden", "true");
      panel.style.display = "none";
      this.syncScrim();
    },
    closeAll: function(){
      const self = this;
      this.panelIds.forEach(function(id){ self.close(id); });
      const scrim = $(this.scrimId);
      if(scrim) scrim.classList.remove("is-open");
    },
    init: function(){
      const self = this;
      this.panelIds.forEach(function(id){
        const panel = $(id);
        if(!panel) return;
        panel.addEventListener("click", function(e){ e.stopPropagation(); });
      });
    }
  };

  function patchGlobals(){
    window.roundHistory = {
      open: function(){ Overlay.openQuota(); },
      close: function(){ Overlay.closeQuota(); },
      loadInput: function(){ pushStatus("名額紀錄：Coming Soon"); },
      loadLatest: function(){ pushStatus("名額紀錄：Coming Soon"); },
      prev: function(){ pushStatus("名額紀錄：Coming Soon"); },
      next: function(){ pushStatus("名額紀錄：Coming Soon"); }
    };
    window.toggleBoardPanel = function(){
      const el = $("kgen-v30-leaderboard-overlay");
      if(el && el.classList.contains("is-open")) Overlay.closeLeaderboard();
      else Overlay.openLeaderboard("player");
    };
    window.leaderboard = {
      refresh: function(){ Leaderboard.refresh(); }
    };
    window.toggleBetPanel = function(){
      const panel = $("bet-live-panel");
      if(panel && panel.classList.contains("kgen-v30-overlay-open")) PanelOverlay.close("bet-live-panel");
      else PanelOverlay.open("bet-live-panel");
    };
    window.toggleChainLive = function(){
      const panel = $("chain-live-panel");
      if(panel && panel.classList.contains("kgen-v30-overlay-open")) PanelOverlay.close("chain-live-panel");
      else PanelOverlay.open("chain-live-panel");
    };
    if(window.app && typeof window.app.openMusic === "function" && !window.app.__kgenV30MusicPatched){
      window.app.__kgenV30MusicPatched = true;
      const oldMusic = window.app.openMusic;
      window.app.openMusic = function(force){
        if(force === false){
          PanelOverlay.close("music-panel");
          return;
        }
        const panel = $("music-panel");
        if(panel && panel.classList.contains("kgen-v30-overlay-open")){
          PanelOverlay.close("music-panel");
          return;
        }
        PanelOverlay.open("music-panel");
        try{ oldMusic.call(window.app, true); }catch(_){ }
      };
    }
  }

  function patchFaqInDom(){
    const retiredTempleCode = ["16", "888"].join("");
    const retiredSymbol = ["KGEN", retiredTempleCode].join("");
    document.querySelectorAll(".faq-q, .faq-a, .history-note, .board-note").forEach(function(node){
      const html = node.innerHTML || "";
      if(html.indexOf(retiredTempleCode) >= 0){
        if(node.classList.contains("faq-q")){
          node.textContent = "Q：五指山悟空財神殿怎麼開始？";
        }else if(node.classList.contains("faq-a")){
          node.innerHTML = "先連結錢包並切到 BSC，再 Approve、完成三次聖盃，之後可領發財金、心跳、轉日呼吸、還願、點燈與許願。詳見悟空控制台。";
        }
      }
    });
    const hist = document.querySelector("#round-history-modal .history-note");
    if(hist){
      hist.innerHTML = "12345 TempleHeart 每輪 A / B 名額紀錄即將上線。<b>神殿1 = rounds(id).a</b>，<b>神殿2 = rounds(id).b</b>。目前請使用「名額紀錄」查看 Coming Soon。";
    }
    const sel = $("ke-symbol");
    if(sel){
      Array.from(sel.options).forEach(function(opt){
        if(opt.value === retiredSymbol) opt.remove();
      });
    }
    const ver = $("ver-st");
    if(ver){
      ver.setAttribute("data-version", "12345-TEMPLE-RUNTIME-CORE-V3.0");
      ver.setAttribute("title", "12345-TEMPLE-RUNTIME-CORE-V3.0");
      ver.textContent = "V3.0 / OVERLAY MOBILE FIX";
    }
    const heartTitle = document.querySelector("#kgen-heart-toggle .kgen-heart-title");
    if(heartTitle) heartTitle.textContent = "KGEN12345 五指山悟空財神殿";
    const brandName = document.querySelector(".hud-top .brand-name");
    if(brandName) brandName.textContent = "KGEN12345 五指山悟空財神殿";
    const chainNote = document.querySelector("#chain-live-panel .cl-note");
    if(chainNote){
      chainNote.innerHTML = "這裡讀的是 <b>12345 TempleHeart 合約</b>：Heart 血庫、KGEN 餘額、Allowance、發財金、心跳、點火與還願狀態。<br/>本頁只顯示 12345 五指山悟空財神殿狀態。";
    }
  }

  function bindDirectButtons(){
    const boardBtn = $("boardToggleBtn");
    if(boardBtn && !boardBtn.dataset.kgenV30Direct){
      boardBtn.dataset.kgenV30Direct = "1";
      boardBtn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        Overlay.openLeaderboard("player");
      }, true);
    }
    document.querySelectorAll('[onclick*="roundHistory.open"]').forEach(function(btn){
      if(btn.dataset.kgenV30QuotaDirect) return;
      btn.dataset.kgenV30QuotaDirect = "1";
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        Overlay.openQuota();
      }, true);
    });
  }

  function publishRuntimeHandles(){
    window.KGEN_12345_UI_V3 = { VERSION: VERSION, Overlay: Overlay, Leaderboard: Leaderboard };
    patchGlobals();
    bindDirectButtons();
  }

  function startRuntimeHandleGuard(){
    if(window.__kgen12345RuntimeHandleGuard) return;
    window.__kgen12345RuntimeHandleGuard = true;
    publishRuntimeHandles();
    setInterval(publishRuntimeHandles, 1000);
  }

  function patchTempleImages(){
    const main = $("fairy-img");
    if(main){
      if(!main.getAttribute("src") || main.getAttribute("src") !== TEMPLE_IMAGE_SRC) main.src = TEMPLE_IMAGE_SRC;
      main.alt = "12345 五指山悟空財神殿";
    }
    document.querySelectorAll(".kgen-ai-avatar").forEach(function(img){
      if(!img.getAttribute("src") || img.getAttribute("src") !== TEMPLE_IMAGE_SRC) img.src = TEMPLE_IMAGE_SRC;
      img.alt = "12345 五指山悟空客服";
    });
  }

  function startTempleImageGuard(){
    if(window.__kgen12345ImageGuard) return;
    window.__kgen12345ImageGuard = true;
    patchTempleImages();
    const main = $("fairy-img");
    if(main){
      new MutationObserver(patchTempleImages).observe(main, { attributes: true, attributeFilter: ["src"] });
    }
    setInterval(patchTempleImages, 1200);
  }

  function patchAiServiceStatus(){
    const panel = $("kgen-ai-service-panel");
    if(!panel) return;
    const sub = panel.querySelector(".kgen-ai-sub");
    if(sub) sub.textContent = "前端 FAQ 已接通｜鏈上 AI 尚未接入";
    const input = $("kgen-ai-input");
    if(input) input.placeholder = "輸入 12345 問題，例如：如何連錢包";
    const log = $("kgen-ai-log");
    if(log && !log.dataset.kgenV30Status){
      log.dataset.kgenV30Status = "1";
      const row = document.createElement("div");
      row.className = "kgen-ai-msg is-bot";
      row.textContent = "客服：目前為 12345 五指山悟空財神殿前端 FAQ 狀態，可正常送出問題並收到本機回覆；鏈上 AI 尚未接入。";
      log.appendChild(row);
    }
  }

  function init(){
    document.documentElement.classList.add("kgen-v30");
    safeRun("patchFaqInDom", patchFaqInDom);
    safeRun("startTempleImageGuard", startTempleImageGuard);
    safeRun("patchAiServiceStatus", patchAiServiceStatus);
    safeRun("GuidePatch.apply", function(){ GuidePatch.apply(); });
    safeRun("HeartOverlay.init", function(){ HeartOverlay.init(); });
    safeRun("PanelOverlay.init", function(){ PanelOverlay.init(); });
    safeRun("Ritual.init", function(){ Ritual.init(); });
    safeRun("Overlay.ensureQuota", function(){ Overlay.ensureQuota(); });
    safeRun("Overlay.ensureLeaderboard", function(){ Overlay.ensureLeaderboard(); });
    safeRun("startRuntimeHandleGuard", startRuntimeHandleGuard);
    pushStatus("KGEN 12345 UI " + VERSION + " 已載入");
  }

  function boot(){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", function(){
        setTimeout(init, 80);
        setTimeout(startRuntimeHandleGuard, 400);
      });
    }else{
      setTimeout(init, 80);
      setTimeout(startRuntimeHandleGuard, 400);
    }
    window.addEventListener("load", function(){
      startRuntimeHandleGuard();
      GuidePatch.apply();
      startTempleImageGuard();
      patchAiServiceStatus();
    });
    window.addEventListener("kgen-life-boot", function(){
      setTimeout(function(){
        startRuntimeHandleGuard();
        GuidePatch.apply();
        startTempleImageGuard();
        patchAiServiceStatus();
      }, 60);
    });
  }

  window.KGEN_12345_UI_V3 = { VERSION: VERSION, Overlay: Overlay, Leaderboard: Leaderboard };
  try{
    boot();
  }catch(err){
    safeRun("boot fallback", function(){
      setTimeout(function(){
        init();
        startRuntimeHandleGuard();
      }, 120);
    });
  }
})();
