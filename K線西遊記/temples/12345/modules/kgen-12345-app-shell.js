const APP_VERSION = "12345-TEMPLE-V10.42.6-V10.2-MODULAR-ASSET-GOVERNANCE";

/* =========================
   UFO Music: track URL resolver (fix)
   - Accepts string or {url/src}
   - Works with relative paths like "music/song.mp3"
========================= */
function resolveTrackUrl(track){
  try{
    const raw = (typeof track === 'string')
      ? track
      : (track && (track.url || track.src || track.href)) || '';
    if(!raw) return '';
    // Prefer ROOT if exists; else fall back to current directory
    let base;
    if(typeof ROOT !== 'undefined' && ROOT){
      base = ROOT;
    }else{
      const u = new URL(window.location.href);
      u.hash = '';
      u.search = '';
      // ensure dir
      if(!u.pathname.endsWith('/')){
        u.pathname = u.pathname.substring(0, u.pathname.lastIndexOf('/') + 1);
      }
      base = u;
    }
    return new URL(raw, base).toString();
  }catch(e){
    // last resort: return as-is
    return (typeof track === 'string') ? track : ((track && (track.url||track.src)) || '');
  }
}


const app = {
  // UI helpers (safe in demo/no-wallet mode)
  setProgress(p){
    try{
      const v = Math.max(0, Math.min(100, Number(p)||0));
      const fill = document.getElementById('prog-fill');
      const txt  = document.getElementById('prog-txt');
      if(fill) fill.style.width = v + '%';
      if(txt)  txt.innerText = v.toFixed(1) + '%';
    }catch(e){}
  },
  logEvent(title, detail){
    try{
      const t = String(title||'Event');
      const d = detail==null? '' : String(detail);
      const ev = { t: Date.now(), title: t, detail: d };
      // persist small history
      const key = 'kgen16888_events';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift(ev);
      if(arr.length>50) arr.length=50;
      localStorage.setItem(key, JSON.stringify(arr));
      // update on-screen last event if exists
      const el = document.getElementById('last-event');
      if(el) el.innerText = d ? (t + '｜' + d) : t;
    }catch(e){}
  },

    isCam: false, camMode: 'user', gaLevel: 600, recorder: null, chunks: [], recStartTs: null, recMMSS: "00:00",
    stream: null, tInt: null, drawInt: null, bbSampleInt: null,

    // blackbox
    blackbox: { sessionId:null, startedAt:null, endedAt:null, events:[], samples:[], counts:{}, last:{ angle:0, warp:0, ga:600 } },

    init() {
        this.initThree(); this.buildUI(); this.bind();
        setInterval(() => this.tick(), 1000);
        web3.load();
                web3.autoDetect();
this.updateWarp(33);
        this.applySteer(76, true);
        this.speak("KGEN 16888 五指山啟動。V3.2.1 完整玩法客服已上線。先連結錢包，先 Approve，再下單 UP 或 DOWN；名額紀錄與托管規則都可直接查。");
        window.addEventListener('resize', ()=>this.onResize(), {passive:true});
        this.onResize();
    },

    tick() {
const sc=document.getElementById('sys-clock'); if(sc) sc.innerText = `SYSTEM ONLINE | ${new Date().toLocaleString()}`;
        const vs=document.getElementById("ver-st"); if(vs) vs.innerText = "VERSION " + APP_VERSION;
        document.querySelectorAll('.dot').forEach(d => { if(Math.random() > 0.9) d.classList.toggle('on'); });
        const fit = 0.9 + Math.random() * 0.1;
const fv=document.getElementById('f-val'); if(fv) fv.innerText = fit.toFixed(3);
const fb=document.getElementById('f-bar'); if(fb) fb.style.width = (fit * 100) + '%';
const mb=document.getElementById('m-bar'); if(mb) mb.style.width = (Math.random() * 100) + '%';
    },

    // ---- Safety helpers (avoid popup errors in demo) ----
    logEvent(name, data){
        try{ console.log('[event]', name, data||''); }catch(_){ }
    },

    setProgress(pct){
        try{
            const bar = document.getElementById('progress-bar');
            const txt = document.getElementById('progress-text');
            const v = Math.max(0, Math.min(100, Number(pct)||0));
            if(bar) bar.style.width = v + '%';
            if(txt) txt.innerText = v.toFixed(1) + '%';
        }catch(_){ }
    },

    // ---- Guided concierge (story + how to play) ----
    openGuide(section){
        const modal = document.getElementById('guide-modal');
        const body = document.getElementById('guide-body');
        if(!modal || !body) return;
        const s = (section||'intro').toLowerCase();
        const blocks = this.getGuideBlocks();
        body.innerHTML = blocks[s] || blocks['intro'];
        modal.classList.add('show');

        const summary = (s==='wallet') ? '如果你找不到 KGEN，記得用錢包的 Custom 匯入合約地址。' :
                       (s==='rules')  ? '規則重點：一到一千為單筆範圍，八八八八是基底，累積到一六八八八觸發下凡事件。' :
                       (s==='qa')     ? '你可以按麥克風提問，轉文字後會直接送出並回答。' :
                                        '歡迎來到五指山一二三四五。你可以先看介面，再接上神殿操作。';
        this.speak(summary);
    },

    closeGuide(){
        const modal=document.getElementById('guide-modal');
        if(modal) modal.classList.remove('show');
    },

    getGuideBlocks(){
        const intro = `
          <h3>五指山 12345｜悟空財神殿入口</h3>
          <p>這裡是 <b>財神儀式操作版</b>，不是複雜交易所。玩法核心只有三步：<b>連錢包 → Approve → 下 UP / DOWN</b>。</p>
          <p><b>所有下單、入池、發獎、托管</b> 都走鏈上合約，不是前端假動畫。</p>
          <hr/>
          <h4>最快開始</h4>
          <ol>
            <li>先連結錢包，並切到 <b>BNB Smart Chain</b></li>
            <li>輸入你要操作的 <b>KGEN 金額</b></li>
            <li>先按 <b>Approve</b> 授權</li>
            <li>再按 <b>下單 UP</b> 或 <b>下單 DOWN</b></li>
          </ol>
          <p class='muted'>重點：Approve 是授權，不是下單。沒有 Approve，就不能正式下單。</p>
        `;

        const rules = `
          <h3>規則與下凡</h3>
          <ul>
            <li><b>單筆範圍：</b>由合約限制決定，頁面是輸入 KGEN 後直接下單。</li>
            <li><b>心臟血庫：</b>還願、點燈、許願 hash 與補血動作都會回流到悟空心臟血庫。</li>
            <li><b>觸發點：</b>池子累積到 <b>16888 KGEN</b> 時，會觸發一輪下凡投胎。</li>
          </ul>
          <h4>16888 觸發後會發生什麼？</h4>
          <p>合約會從玩家池中選出 <b>A / B 兩個地址</b>，也就是你說的五指山神殿 1 / 五指山神殿 2。</p>
          <p>該輪固定分配 <b>10000 KGEN</b>：A 即時 4000、B 即時 4000、A 托管 1000、B 托管 1000。</p>
          <p class='muted'>不是把整池一次發光，而是固定配額，避免超額池餘造成連續觸發。</p>
        `;

        const wallet = `
          <h3>錢包與找幣</h3>
          <p>很多錢包搜尋不到新幣時，要改用 <b>Custom</b> 匯入，不要只打幣名。</p>
          <ol>
            <li>切到 <b>BNB Chain</b></li>
            <li>點 <b>Custom</b></li>
            <li>貼上 <b>KGEN 合約地址</b><br><code>0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be</code></li>
            <li>確認 Symbol / Decimals 後加入</li>
          </ol>
          <p><b>安全提醒：</b>只認官方合約地址，不要認同名假幣。</p>
        `;

        const approve = `
          <h3>Approve 教學｜先授權，再下單</h3>
          <p><b>Approve</b> 的意思，是先授權五指山 Universe 合約可以使用你指定數量的 KGEN。</p>
          <ol>
            <li>輸入 KGEN 金額</li>
            <li>按 <b>Approve</b></li>
            <li>等待錢包確認與鏈上完成</li>
            <li>完成後，再按 <b>下單 UP</b> 或 <b>下單 DOWN</b></li>
          </ol>
          <p><b>UP</b> 代表押漲，<b>DOWN</b> 代表押跌。</p>
          <p class='muted'>如果你只是要點燈、許願、還願，就直接走神殿儀式，不必進交易所。</p>
        `;

        const playbook = `
          <h3>完整發放規則</h3>
          <h4>零、下注怎麼看數字？</h4><p>以 <b>下注 100 KGEN</b> 為例：1 進高老莊、4 留池、95 為有效部位。猜中時 <b>總回收 190、淨利 +90</b>；猜錯時 <b>-100</b>，其中 99 實際留在池內。</p><h4>一、漲跌遊戲怎麼結算？</h4>
          <p>玩家下單後，KGEN 會 <b>真的 transferFrom 進合約</b>。合約扣除手續費後，立刻用鏈上規則判定本次輸贏。</p>
          <p>贏了：合約會 <b>真的把 payout 轉回玩家地址</b>。輸了：stake 留在池內，成為心臟血庫的一部分。</p>
          <h4>二、心臟血庫會不會真的發獎？</h4>
          <p>會。當池子達到 <b>16888</b>，合約會真的發出 A / B 的即時獎金，托管部分則留在合約內等待後續 claim。</p>
          <h4>三、托管會不會真的執行？</h4>
          <p>會。托管不是前端記帳，而是鏈上 round 內的 <b>escrowA / escrowB</b>。雙方都表態後，才能各自呼叫 <b>claimWeddingEscrow</b> 領取。</p>
          <h4>四、什麼是表態？</h4>
          <p>表態期內，A / B 要真的轉 <b>1 到 2 KGEN</b> 給對方。雙方都表態，才算完成婚配條件。</p>
          <h4>五、逾期怎麼辦？</h4>
          <p>若托管逾期未領，任何人都可執行回收，托管資金就回到池內，不再屬於個人。</p>
          <h4>六、神殿 1 / 神殿 2 怎麼查？</h4>
          <p>本頁已內建 <b>名額紀錄</b> 面板，可查最新 round、指定 round、A / B 地址、表態狀態與托管狀態。</p>
          <hr/>
          <p><b>合約：</b><code>0xB016D4d8f1aED1339101b30722cad6dbA9B8C972</code></p>
          <p><b>KGEN：</b><code>0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be</code></p>
        `;

        const qa = `
          <h3>語音客服（Q&A）</h3>
          <p>按麥克風說出問題，系統會轉文字後直接送出並回答。</p>
          <div style='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0 12px 0;'>
            <button class='qa-btn' id='btn-voice-qa' style='max-width:220px;'>🎤 語音提問</button>
            <div id='qa-voice-status' class='muted' style='font-size:12px;'>待命中</div>
          </div>
          <div class='qa-grid'>
            <button class='qa-btn' data-q='沒有錢包也能玩嗎？'>沒有錢包也能玩嗎？</button>
            <button class='qa-btn' data-q='為什麼要用 Custom 找幣？'>為什麼要用 Custom 找幣？</button>
            <button class='qa-btn' data-q='怎麼 Approve？'>怎麼 Approve？</button>
            <button class='qa-btn' data-q='輸贏怎麼判定？'>輸贏怎麼判定？</button>
            <button class='qa-btn' data-q='心臟血庫會真的發獎嗎？'>心臟血庫會真的發獎嗎？</button>
            <button class='qa-btn' data-q='托管會真的執行嗎？'>托管會真的執行嗎？</button>
            <button class='qa-btn' data-q='到了 16888 會發生什麼事？'>到了 16888 會發生什麼事？</button>
            <button class='qa-btn' data-q='五指山神殿 2 地址怎麼查？'>五指山神殿 2 地址怎麼查？</button>
          </div>
          <div style='margin-top:12px;opacity:.92'>
            <div id='qa-last' style='margin-top:8px'></div>
            <div id='qa-last-a' style='margin-top:6px'></div>
          </div>
        `;

        return { intro, rules, wallet, approve, playbook, qa };
    },

    handleQuestion(q){
        const question = String(q||'').trim();
        if(!question) return;
        const qaBox = document.getElementById('qa-last');
        const aBox = document.getElementById('qa-last-a');
        if(qaBox) qaBox.innerText = 'Q: ' + question;

        const lower = question.toLowerCase();
        let ans = '';
        const has = (s)=> lower.indexOf(s) >= 0;

        if(question.includes('沒有錢包') || has('no wallet') || has('without wallet')){
            ans = '可以。沒有錢包時可以先看介面、看客服、看歷史與規則；真正要鏈上互動時，請用錢包內建瀏覽器開啟本頁並連結錢包。';
        }else if(question.includes('custom') || question.includes('找不到') || has('search')){
            ans = '因為很多錢包的預設搜尋清單不會即時收錄新幣。找不到 KGEN 時，請切到 BNB Chain，用 Custom 貼上 KGEN 合約地址，再加入代幣。';
        }else if(question.includes('approve') || question.includes('授權')){
            ans = '先輸入你要操作的 KGEN 金額，再按 Approve。Approve 只是授權，不是下單。授權成功後，才能按下單 UP 或下單 DOWN。';
        }else if(question.includes('心臟血庫') || question.includes('發獎')){
            ans = '會。心臟血庫內的 KGEN 都是真的在合約裡。到 16888 後，合約會真的把 A 與 B 的即時獎金轉出去，這不是前端假動畫。';
        }else if(question.includes('托管') || question.includes('escrow') || question.includes('拖管')){
            ans = '會。托管是鏈上 round 內的 escrowA 與 escrowB。雙方都完成表態後，A 與 B 才能各自呼叫 claimWeddingEscrow 領取。如果逾期未領，托管會回收到池裡。';
        }else if(question.includes('五指山神殿') || question.includes('神殿') || question.includes('地址')){
            ans = '神殿一和神殿二就是每一輪 round 的 A 和 B。你可以打開右上角的名額紀錄，查最新輪次或指定 roundId，直接看到 A / B 地址、表態狀態與托管狀態。';
        }else if((question.includes('1') && question.includes('1000')) || question.includes('一到一千')){
            ans = '頁面上的輸入金額就是你要操作的 KGEN。五指山是簡單漲跌版，不是複雜交易所，重點是先 Approve，再選 UP 或 DOWN。';
        }else if(question.includes('8888') || question.includes('八八八八')){
            ans = '八八八八在敘事上是早期底池節點；這版真正的鏈上觸發點是 16888。當池子到 16888，才會觸發一輪下凡感應。';
        }else if(question.includes('16888') || question.includes('一六八八八') || question.includes('下凡')){
            ans = '當心臟血庫達到 16888 KGEN，就會觸發一輪下凡投胎。合約會選出 A / B 兩個地址，A 即時 4000、B 即時 4000、A 托管 1000、B 托管 1000，之後進入表態期與戀愛期。';
        }else if(question.includes('表態') || question.includes('誓約') || question.includes('1~2') || question.includes('一到二')){
            ans = '表態是指雙方在表態期內，真的轉一到二 KGEN 給對方。雙方都完成表態後，才可以在後續時間內各自領出自己的一千 KGEN 托管紅包。';
        }else if(question.includes('輸贏') || question.includes('怎麼判定') || question.includes('上') || question.includes('下')){
            ans = '你選 UP 或 DOWN 後，合約會把 KGEN 真轉入合約，然後用鏈上 pseudo-random 規則立即決定本次結果。贏了拿兩倍 stake，輸了 stake 留在池裡。';
        }else{
            ans = '你可以直接問：怎麼 Approve、怎麼下注、心臟血庫會不會發獎、托管會不會執行、到了 16888 會發生什麼、神殿地址怎麼查。';
        }

        if(aBox) aBox.innerText = 'A: ' + ans;
        this.speak(ans);
    },

    startVoiceQA(){
        try{
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            const st = document.getElementById('qa-voice-status');
            if(!SR){
                if(st) st.textContent = '此瀏覽器不支援語音辨識';
                this.speak('此瀏覽器不支援語音辨識。');
                return;
            }
            const rec = new SR();
            rec.lang = 'zh-TW';
            rec.interimResults = false;
            rec.maxAlternatives = 1;
            if(st) st.textContent = '正在聆聽...';
            rec.onresult = (e)=>{
                const text = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript || '').trim();
                if(st) st.textContent = text ? ('已辨識：' + text) : '沒有辨識到內容';
                if(text) this.handleQuestion(text);
            };
            rec.onerror = ()=>{
                if(st) st.textContent = '語音辨識失敗，請再試一次';
                this.speak('語音辨識失敗，請再試一次。');
            };
            rec.onend = ()=>{
                if(st && st.textContent === '正在聆聽...') st.textContent = '待命中';
            };
            rec.start();
        }catch(e){
            const st = document.getElementById('qa-voice-status');
            if(st) st.textContent = '語音啟動失敗';
        }
    },


    buildUI() {
        ['g1', 'g2'].forEach(id => {
            const container = document.getElementById(id);
            container.innerHTML = "";
            for(let i=0; i<100; i++) { // 保持原始版：100格（畫面剛好）
                const d = document.createElement('div');
                d.className = 'dot' + (Math.random() > 0.5 ? ' on' : '');
                container.appendChild(d);
            }
        });
        const rail = document.getElementById('warp-rail-body');
        for(let i=0; i<25; i++) {
            const step = document.createElement('div');
            step.className = 'rail-step';
            step.style.bottom = (i * 4) + '%';
            rail.appendChild(step);
        }
    },

    updateWarp(val) {
const ef=document.getElementById('energy-fill'); if(ef) ef.style.height = val + '%';
const wt=document.getElementById('warp-thumb'); if(wt) wt.style.bottom = `calc(${val}% - 17px)`;
const wtx=document.getElementById('warp-txt'); if(wtx) wtx.innerText = `WARP ${val * 3}x`;
        this.bbEvent("warp", { warp: parseFloat(val) });
    },

    applySteer(v, silent=false){
        const ang = Math.max(-180, Math.min(180, Number(v)||0));
const av=document.getElementById('ang-val'); if(av) av.innerText = ang + '°';
const cw=document.getElementById('core-window'); if(cw) cw.style.transform = `rotate(${ang}deg)`;
        document.getElementById('steer-input-val').value = ang;
        // wheel sync
        const wheel = document.getElementById('wheel');
        if(wheel) wheel.style.transform = `rotate(${ang}deg)`;
        try{
          if(window.app && typeof window.app.updateCoordPanel === 'function') window.app.updateCoordPanel();
          if(window.app && typeof window.app.syncSideUI === 'function') window.app.syncSideUI(ang);
        }catch(_){ }
        if(!silent) this.bbEvent("steer", { angle: ang });
    },

    boost() {
        if(this.gaLevel < 1000) {
            this.gaLevel += 50;
const gr=document.getElementById('ga-rank'); if(gr) gr.innerText = `RANK: GA-${this.gaLevel}`;
            this.bbEvent("boost", { ga: this.gaLevel });
            this.speak(`KGEN 注入能量，演化等級升至 ${this.gaLevel}`);
        }
    },

    autoHunt() {
        this.bbEvent("auto_hunt", {});
        this.speak("啟動 GA 自動打怪模式，績效演化中。");
const wl=document.getElementById('wish-label'); const old = wl ? wl.innerText : '';
const wl2=document.getElementById('wish-label'); if(wl2) wl2.innerText = '⚔️ KGEN 自動打怪中...';
setTimeout(() => {
  // ============================================================
  // 【中文註解｜重要】本頁為「KGEN 16888 五指山」前端單頁（純前端）
  // - 不改合約、不改池子：此檔只做 UI/動畫/WalletConnect 連線與外部入口
  // - 方向盤（DEG）只代表「多空方向」：水平線上方＝多；下方＝空（與倍槓無關）
  // - 曲速引擎（WARP）代表「倍槓/速度」：WARP=0 表示息火（觀望），畫面/粒子/流向應靜止
  // - 自動巡航打怪（AUTO）會依 DEG（方向）+ WARP（速度）去模擬多空節奏，並同步更新：
  //   ① 左下狀態（AUTO: /）② 中央角度讀數 ③ 星球/流向/粒子動畫
  // - CT（現價）若能讀到鏈上池子報價就同步；讀不到則回退到本機模擬值（不會阻斷 UI）
  // ============================================================
 const w=document.getElementById('wish-label'); if(w) w.innerText = old; }, 3000);
    },

    async cam(mode) {
        const v = document.getElementById('cam-view'), f = document.getElementById('fairy-img'), m = document.getElementById('mini-thumb');
        if (this.isCam && this.camMode === mode) {
            this.stream && this.stream.getTracks().forEach(t => t.stop());
            v.style.opacity = 0; f.style.opacity = 1; m.style.display = 'none';
            this.isCam = false;
            this.bbEvent("cam_off", {});
            return;
        }
        try {
            if(this.stream) this.stream.getTracks().forEach(t => t.stop());
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio:false });
            v.srcObject = this.stream; v.style.opacity = 1; f.style.opacity = 0; m.style.display = 'block';
            v.style.transform = mode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
            this.isCam = true; this.camMode = mode;
            this.bbEvent("cam_on", { mode });
        } catch(e) { alert("攝像頭硬體未響應 / 權限被拒絕"); }
    },

    capture() {
        const canvas = document.getElementById('snap-canvas'), ctx = canvas.getContext('2d');
        canvas.width = 1000; canvas.height = 1000;
        const v = document.getElementById('cam-view'), f = document.getElementById('fairy-img');
        if(this.isCam) {
            if(this.camMode === 'user') { ctx.translate(1000,0); ctx.scale(-1,1); }
            ctx.drawImage(v, 0, 0, 1000, 1000);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.drawImage(f, 750, 50, 200, 200);
        } else ctx.drawImage(f, 0, 0, 1000, 1000);

        ctx.fillStyle = "#ffd778"; ctx.font = "bold 40px Noto Sans TC";
        ctx.fillText("KGEN 12345 五指山悟空財神殿", 50, 80);
        ctx.fillStyle = "#ffcc00"; ctx.font = "24px Orbitron";
        ctx.fillText(`EVO RANK: GA-${this.gaLevel} | ${new Date().toLocaleString()}`, 50, 120);
        ctx.fillStyle = "#fff"; ctx.font = "bold 45px Noto Sans TC";
        ctx.shadowBlur = 10; ctx.shadowColor = "#000";
        ctx.fillText((document.getElementById('wish-label')?document.getElementById('wish-label').innerText:''), 70, 930);

        this.bbEvent("capture", {});

        const link = document.createElement('a'); link.download = `KGEN_12345_WUKONG_TEMPLE_CAPTURE.png`;
        link.href = canvas.toDataURL(); link.click();
    },

    setWish() {
        const m = prompt("大聖請開金口：", (document.getElementById('wish-label')?document.getElementById('wish-label').innerText:''));
if(m){ const wl=document.getElementById('wish-label'); if(wl) wl.innerText = m; }
this.bbEvent('wish', { text: (document.getElementById('wish-label')?document.getElementById('wish-label').innerText:'') });
    },

    toggleWheel(){
        const wrap = document.getElementById('wheel-wrap');
        if(!wrap) return;
        const on = (wrap.style.display === 'block');
        wrap.style.display = on ? 'none' : 'block';
        this.bbEvent("wheel_toggle", { on: !on });
    },


    playNewbieGuide(){
        this.openGuide('approve');
        this.speak('神殿玩法開始。先連結錢包，輸入 KGEN 金額，先按 Approve 授權，再按下單 UP 或下單 DOWN。Approve 是授權，不是下單。');
    },

    openUnifiedGuide(){
        this.openGuide('playbook');
        this.speak('客服與新手導覽已合併。你可以在這裡查看完整玩法、Approve 教學、心臟血庫規則、托管規則與名額紀錄。');
    },

    showOrderFx(title, sub){
        const box = document.getElementById('order-fx');
        const t = document.getElementById('order-fx-title');
        const s = document.getElementById('order-fx-sub');
        if(t) t.textContent = title || 'WARP LOCKED';
        if(s) s.textContent = sub || 'Position Opened';
        if(!box) return;
        box.classList.remove('show');
        void box.offsetWidth;
        box.classList.add('show');
        setTimeout(()=>box.classList.remove('show'), 900);
    },

    bind() {
        document.getElementById('steer-input-val').oninput = (e) => this.applySteer(e.target.value);
        document.getElementById('warp-input-val').oninput = (e) => this.updateWarp(e.target.value);
        this.bindWheel();

        // Guide modal
        const bg = document.getElementById('btn-guide');
        if(bg) bg.addEventListener('click', ()=> this.openGuide('intro'));
        const gc = document.getElementById('btn-guide-close');
        if(gc) gc.addEventListener('click', ()=> this.closeGuide());
        const gm = document.getElementById('guide-modal');
        if(gm) gm.addEventListener('click', (e)=>{ if(e.target===gm) this.closeGuide(); });
        document.querySelectorAll('.guide-tab').forEach(btn=>{
            btn.addEventListener('click', ()=> this.openGuide(btn.getAttribute('data-sec')));
        });
  
        // Swap buttons (PancakeSwap)
        const sb = document.getElementById('btn-swap-bnb');
        if(sb) sb.addEventListener('click', ()=>{ this.openPancake(); });
        const su = document.getElementById('btn-swap-usdt');
        if(su) su.addEventListener('click', ()=>{ this.openPancake(); this.toast('提示：在 PancakeSwap 可用 WBNB 交換；若用 USDT 請先換成 WBNB 或走路由。'); });

      document.addEventListener('click', (e)=>{
            const b = e.target && e.target.closest && e.target.closest('.qa-btn');
            if(!b) return;
            if(b.id === 'btn-voice-qa'){
                this.startVoiceQA();
                return;
            }
            const q = b.getAttribute('data-q');
            if(q) this.handleQuestion(q);
        });

    },

    // ===== Blackbox core =====
    bbCount(type){ this.blackbox.counts[type] = (this.blackbox.counts[type] || 0) + 1; },
    bbEvent(type, payload={}){ this.bbCount(type); this.blackbox.events.push({ t: Date.now(), type, ...payload }); },
    bbStart(){
        const sid = `BBX-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.blackbox.sessionId = sid;
        this.blackbox.startedAt = new Date().toISOString();
        this.blackbox.endedAt = null;
        this.blackbox.events = [];
        this.blackbox.samples = [];
        this.blackbox.counts = {};
        this.blackbox.last = {
            angle: parseFloat(document.getElementById('steer-input-val').value || 0),
            warp:  parseFloat(document.getElementById('warp-input-val').value || 0),
            ga: this.gaLevel
        };
        this.bbEvent("rec_start", { ga:this.gaLevel, angle:this.blackbox.last.angle, warp:this.blackbox.last.warp });
    },
    bbStop(){ this.blackbox.endedAt = new Date().toISOString(); this.bbEvent("rec_stop", {}); },
    bbSample(){
        const angle = parseFloat(document.getElementById('steer-input-val').value || 0);
        const warp  = parseFloat(document.getElementById('warp-input-val').value || 0);
        this.blackbox.last = { angle, warp, ga:this.gaLevel };
        this.blackbox.samples.push({ t: Date.now(), angle, warp, ga: this.gaLevel });
    },
    bbStats(list, key){
        if(!list.length) return {min:null, max:null, avg:null};
        let min=Infinity, max=-Infinity, sum=0, n=0;
        for(const it of list){
            const v = Number(it[key]);
            if(!Number.isFinite(v)) continue;
            if(v<min) min=v; if(v>max) max=v;
            sum+=v; n++;
        }
        if(!n) return {min:null, max:null, avg:null};
        return { min, max, avg: +(sum/n).toFixed(4) };
    },
    async bbHashSHA256(text){
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
        return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    },
    async bbExportJSON(){
        const started = this.blackbox.startedAt ? new Date(this.blackbox.startedAt).getTime() : null;
        const ended   = this.blackbox.endedAt ? new Date(this.blackbox.endedAt).getTime() : null;
        const durationSec = (started && ended) ? Math.max(0, Math.round((ended-started)/1000)) : null;

        const payload = {
            schema: "kgen.12345.wukong.temple.v1",
            sessionId: this.blackbox.sessionId,
            startedAt: this.blackbox.startedAt,
            endedAt: this.blackbox.endedAt,
            durationSec,
            last: this.blackbox.last,
            stats: {
                angle: this.bbStats(this.blackbox.samples, "angle"),
                warp:  this.bbStats(this.blackbox.samples, "warp")
            },
            eventCounts: this.blackbox.counts,
            timeline: this.blackbox.events,
            samples: this.blackbox.samples
        };

        let json = JSON.stringify(payload, null, 2);
        const hash = await this.bbHashSHA256(json);
        payload.hashes = { sha256: hash };
        json = JSON.stringify(payload, null, 2);

        const blob = new Blob([json], { type:"application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KGEN_12345_WUKONG_TEMPLE_${this.blackbox.sessionId}.json`;
        a.click();

        try { localStorage.setItem(`KGEN_12345_WUKONG_TEMPLE_${this.blackbox.sessionId}`, json); } catch(e) {}
    },

    startRecTimer(){
        this.recStartTs = performance.now();
        const recInd = document.getElementById('rec-ind');
        recInd.style.display = 'block';

        this.tInt = setInterval(()=>{
            const elapsed = performance.now() - this.recStartTs;
            const sec = Math.floor(elapsed/1000);
            const m = String(Math.floor(sec/60)).padStart(2,'0');
            const s = String(sec%60).padStart(2,'0');
            this.recMMSS = `${m}:${s}`;
            recInd.innerText = `REC ${this.recMMSS}`;
        }, 200);

        this.drawInt = setInterval(()=>this.syncExportCanvas(), 33);
    },
    stopRecTimer(){
        clearInterval(this.tInt);
        clearInterval(this.drawInt);
const ri=document.getElementById('rec-ind'); if(ri) ri.style.display = 'none';
    },

    syncExportCanvas(){
        const cvs = document.getElementById('export-canvas'), ctx = cvs.getContext('2d');
        cvs.width = 720; cvs.height = 720;

        const v = document.getElementById('cam-view'), f = document.getElementById('fairy-img');

        if(this.isCam){
            try{
                if(this.camMode === 'user'){ ctx.translate(720,0); ctx.scale(-1,1); }
                ctx.drawImage(v, 0, 0, 720, 720);
                ctx.setTransform(1,0,0,1,0,0);
            }catch(e){ ctx.fillStyle="#000"; ctx.fillRect(0,0,720,720); }
        }else{
            try{ ctx.drawImage(f, 0, 0, 720, 720); }
            catch(e){ ctx.fillStyle="#000"; ctx.fillRect(0,0,720,720); }
        }

        const angle = document.getElementById('steer-input-val').value;
        const warp  = document.getElementById('warp-input-val').value;

        ctx.fillStyle = "#ffd778"; ctx.font = "bold 30px Noto Sans TC";
        ctx.fillText("KGEN 12345 WUKONG-TEMPLE-LOG", 30, 50);

        ctx.fillStyle = "#00f2ff"; ctx.font = "bold 22px Orbitron";
        ctx.fillText(`ANGLE ${angle}°`, 30, 85);
        ctx.fillText(`WARP ${Math.round(warp*3)}x`, 30, 115);
        ctx.fillText(`GA ${this.gaLevel}`, 30, 145);

        ctx.fillStyle = "#ff4444"; ctx.font = "bold 26px Orbitron";
        ctx.fillText(`REC ${this.recMMSS || "00:00"}`, 30, 185);

        ctx.fillStyle = "#fff"; ctx.font = "bold 26px Noto Sans TC";
        ctx.shadowBlur = 10; ctx.shadowColor = "#000";
        ctx.fillText((document.getElementById('wish-label')?document.getElementById('wish-label').innerText:''), 30, 690);
        ctx.shadowBlur = 0;
    },

    async toggleRec(){
        const btn = document.getElementById('rec-btn');

        if (this.recorder && this.recorder.state === "recording") {
            this.recorder.stop();
            this.stopRecTimer();

            clearInterval(this.bbSampleInt);
            this.bbStop();
            await this.bbExportJSON();

            btn.innerText = "🎥 五指山神殿留影錄影";
            this.speak("錄影結束，五指山神殿留影數據已封裝。");
            return;
        }

        const stream = document.getElementById('export-canvas').captureStream(30);
        if(!window.MediaRecorder){
            alert("此瀏覽器不支援 MediaRecorder，請用 Chrome/Android 測試。");
            return;
        }

        let mime = "video/webm;codecs=vp9";
        if(!MediaRecorder.isTypeSupported(mime)) mime = "video/webm;codecs=vp8";
        if(!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";

        this.recorder = new MediaRecorder(stream, { mimeType: mime });
        this.chunks = [];

        this.recorder.ondataavailable = e => { if(e.data && e.data.size) this.chunks.push(e.data); };
        this.recorder.onstop = () => {
            const blob = new Blob(this.chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'KGEN_12345_WUKONG_TEMPLE_RECORD.webm'; a.click();
        };

        this.bbStart();
        this.bbSample();
        this.bbSampleInt = setInterval(()=>this.bbSample(), 1000);

        this.startRecTimer();
        this.syncExportCanvas();
        this.recorder.start();

        btn.innerText = "⏹️ 停止五指山誓約留影";
        this.speak("五指山神殿留影錄影開始，記錄演化數據。");
    },

    bindWheel(){
        const wheel = document.getElementById('wheel');
        if(!wheel) return;

        const getAngleFromPointer = (clientX, clientY) => {
            const rect = wheel.getBoundingClientRect();
            const cx = rect.left + rect.width/2;
            const cy = rect.top + rect.height/2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            let deg = Math.atan2(dy, dx) * 180 / Math.PI;
            deg = deg + 90;
            if(deg > 180) deg -= 360;
            return Math.max(-180, Math.min(180, deg));
        };

        let dragging = false;
        const onDown = (x,y)=>{ dragging=true; this.applySteer(getAngleFromPointer(x,y)); };
        const onMove = (x,y)=>{ if(!dragging) return; this.applySteer(getAngleFromPointer(x,y)); };
        const onUp = ()=>{ dragging=false; };

        wheel.addEventListener('mousedown', (e)=>{ e.preventDefault(); onDown(e.clientX, e.clientY); });
        window.addEventListener('mousemove', (e)=>onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onUp);

        wheel.addEventListener('touchstart', (e)=>{ e.preventDefault(); const t=e.touches[0]; onDown(t.clientX, t.clientY); }, {passive:false});
        window.addEventListener('touchmove', (e)=>{ const t=e.touches[0]; if(!t) return; onMove(t.clientX, t.clientY); }, {passive:true});
        window.addEventListener('touchend', onUp, {passive:true});
    },

    initThree() {
        const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        const rd = new THREE.WebGLRenderer({ canvas: document.getElementById('galaxy-bg'), antialias: true, alpha: true });
        rd.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        rd.setSize(window.innerWidth, window.innerHeight);
        const geo = new THREE.BufferGeometry(), pos = new Float32Array(5000 * 3);
        for(let i=0; i<15000; i++) pos[i] = (Math.random() - 0.5) * 160;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x00f2ff, size: 0.18 }));
        sc.add(pts); cam.position.z = 50;
        const anim = () => {
            requestAnimationFrame(anim);
            const w = document.getElementById('warp-input-val').value / 40;
            if(w > 0) {
                const r = (parseFloat(document.getElementById('steer-input-val').value) * Math.PI) / 180;
                const p = pts.geometry.attributes.position.array;
                for(let i=0; i<p.length; i+=3) {
                    p[i] -= Math.sin(r) * w; p[i+1] -= Math.cos(r) * w;
                    if(p[i]>80) p[i]=-80; if(p[i]<-80) p[i]=80;
                    if(p[i+1]>80) p[i+1]=-80; if(p[i+1]<-80) p[i+1]=80;
                }
                pts.geometry.attributes.position.needsUpdate = true;
            }
            rd.render(sc, cam);
        };
        anim();
        this._rd = rd; this._cam = cam;
    },

    onResize(){
        if(!this._rd || !this._cam) return;
        this._cam.aspect = window.innerWidth / window.innerHeight;
        this._cam.updateProjectionMatrix();
        this._rd.setSize(window.innerWidth, window.innerHeight);
    },

    
    // ===== Audio / Voice (mobile needs user gesture) =====
    audioOn:false, audioCtx:null, audioNodes:[],
    enableAudio(){
        try{
            const btn = document.querySelector('.nav-audio');
            if(this.audioOn){
                this.audioOn=false;
                btn && btn.classList.remove('on');
                this._stopAudio();
                return;
            }
            this.audioOn=true;
            btn && btn.classList.add('on');

            // WebAudio ambient pad
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = this.audioCtx || new AC();
            this.audioCtx.resume && this.audioCtx.resume();

            const ctx = this.audioCtx;
            const master = ctx.createGain();
            master.gain.value = 0.02;
            master.connect(ctx.destination);

            const osc1 = ctx.createOscillator(); osc1.type="sine"; osc1.frequency.value=220;
            const osc2 = ctx.createOscillator(); osc2.type="sine"; osc2.frequency.value=329.63;
            const lfo  = ctx.createOscillator(); lfo.type="sine"; lfo.frequency.value=0.08;
            const lfoGain = ctx.createGain(); lfoGain.gain.value=6;

            const filter = ctx.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=700; filter.Q.value=0.8;
            const gain = ctx.createGain(); gain.gain.value=0.0;

            lfo.connect(lfoGain); lfoGain.connect(osc2.frequency);

            osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(master);

            // fade in
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(1.0, now + 1.2);

            osc1.start(); osc2.start(); lfo.start();

            this.audioNodes = [osc1,osc2,lfo,filter,gain,master];

            // Voice guide (first time)
            this.speak("五指山悟空財神殿已開啟。請先連接錢包，打開操作介面，完成三次聖盃，再領發財金。");
        }catch(e){
            alert("音效啟用失敗：請用 Chrome / Android，並允許音訊播放。");
        }
    },
    _stopAudio(){
        try{
            if(!this.audioCtx) return;
            const ctx=this.audioCtx;
            const nodes=this.audioNodes||[];
            // fade out quickly
            const gain = nodes.find(n=>n && n.gain && n.gain.setValueAtTime);
            if(gain){
                const t=ctx.currentTime;
                gain.gain.cancelScheduledValues(t);
                gain.gain.setValueAtTime(gain.gain.value, t);
                gain.gain.linearRampToValueAtTime(0.0, t+0.4);
            }
            setTimeout(()=>{
                try{
                    for(const n of nodes){
                        if(n && typeof n.stop==="function") try{ n.stop(); }catch(_){}
                        if(n && typeof n.disconnect==="function") try{ n.disconnect(); }catch(_){}
                    }
                    this.audioNodes=[];
                }catch(_){}
            }, 500);
        }catch(_){}
    },
speak(m){
      try{
        if(!m) return;
        const u = new SpeechSynthesisUtterance(ui.sanitize(m));
        u.lang = 'zh-TW';
        u.rate = 1.0;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }catch(e){}
    },

    // Progress helper (fix: app.setProgress is not a function)
    // ratio: 0..1
    setProgress(ratio){
      const el = document.getElementById('w3-prog');
      if(!el) return;
      let r = Number(ratio);
      if(!Number.isFinite(r)) r = 0;
      r = Math.max(0, Math.min(1, r));
      const pct = Math.round(r * 1000) / 10; // 0.1%
      el.innerText = `${pct}%`;
    }
  ,
  // ===== Chain info quick links =====
  openTokenScan(){
    try{ window.open(web3.TOKEN_SCAN_URL, "_blank", "noopener"); web3.toast("已開啟：KGEN Token（BscScan）"); }catch(e){}
  },
  openPairScan(){
    try{ window.open(web3.PAIR_SCAN_URL, "_blank", "noopener"); web3.toast("已開啟：LP Pair（BscScan）"); }catch(e){}
  },
  openLpLock(){
    try{ window.open(web3.LP_LOCK_URL, "_blank", "noopener"); web3.toast("已開啟：7744 流沙河"); }catch(e){}
  },
  openPancake(){
    try{ window.open(web3.PANCAKE_SWAP_URL, "_blank", "noopener"); web3.toast("已開啟：PancakeSwap 交易頁"); }catch(e){}
  }


  ,
  /* =========================
     UFO Music System (MP3)
  ========================= */
  openMusic(force){
    try{
      const p=document.getElementById('music-panel');
      if(!p) return;
      const show = (typeof force==='boolean') ? force : (p.style.display==='none' || !p.style.display);
      p.style.display = show ? 'block' : 'none';
      if(show) this.speak('五指山神殿音響已開啟。你可以載入音樂並播放。');
    }catch(_){}
  },
  musicInit(){
    try{
      this._music = this._music || {};
      const audio=document.getElementById('music-audio');
      const file=document.getElementById('music-file');
      const vol=document.getElementById('music-vol');
      const volTxt=document.getElementById('music-vol-txt');
      const name=document.getElementById('music-name');
      if(!audio || !file || !vol) return;

      this._music.audio = audio;
      // default volume
      audio.volume = (Number(vol.value)||60)/100;
      if(volTxt) volTxt.textContent = (Number(vol.value)||60) + '%';

      vol.addEventListener('input', ()=>{
        const v = Math.max(0, Math.min(100, Number(vol.value)||0));
        audio.volume = v/100;
        if(volTxt) volTxt.textContent = v + '%';
      });

      file.addEventListener('change', ()=>{
        const files = Array.from((file.files || []));
        if(!files.length){ if(name) name.textContent='未載入音檔'; return; }

        this._music = this._music || {};
        const m = this._music;
        m.list = Array.isArray(m.list) ? m.list : [];

        // append selected files to playlist (do NOT replace existing)
        const added = [];
        for(const f of files){
          if(!f) continue;
          const url = URL.createObjectURL(f);
          added.push({ name: f.name || 'audio', url, _blob:true });
        }
        m.list = m.list.concat(added);

        // set index to first newly-added track if nothing was playing
        if(typeof m.index !== 'number') m.index = 0;
        if(!m.audio || !m.audio.src){
          m.index = Math.max(0, m.list.length - added.length);
        }

        // update UI list
        try{ this.musicRenderList && this.musicRenderList(); }catch(_){ }

        // load current track
        this.musicSetIndex(m.index);
        if(name) name.textContent = '已加入：' + added.length + ' 首（共 ' + m.list.length + ' 首）';
        this.speak('音樂已加入歌單。');
      });

    }catch(_){}
  },

  musicSetIndex(i){
    const m = this._music;
    if(!m || !m.list || !m.list.length) return;
    // clamp / wrap
    const n = m.list.length;
    m.index = ((i % n) + n) % n;

    const tr = m.list[m.index] || {};
    const raw = String(tr.url || '').trim();
    const name = String(tr.name || tr.title || `Track ${m.index+1}`);

    // resolve: absolute stays, relative gets normalized to ./music/<file>
    const resolved = (typeof resolveTrackUrl === 'function') ? resolveTrackUrl(raw) : raw;

    if(m.audio){
      m.audio.src = resolved;
      // ensure reload on mobile
      try{ m.audio.load(); }catch(e){}
    }
    if(m.nameEl) m.nameEl.textContent = name;
    if(m.statusEl) m.statusEl.textContent = `已載入：${name}`;
  },

  musicPrev(){
    try{
      this._music=this._music||{};
      const m=this._music;
      const list=m.list||[];
      if(!list.length) return;
      const shuffle = !!document.getElementById('music-shuffle')?.checked;
      if(shuffle){
        let ni = Math.floor(Math.random()*list.length);
        if(list.length>1 && ni===m.index) ni = (ni+1)%list.length;
        this.musicSetIndex(ni);
      }else{
        this.musicSetIndex((Number(m.index)||0)-1);
      }
      this.musicPlay();
    }catch(_){}
  },

  // --- v2.48.0 music fixes: ensure next/prev/index/render/builtin work ---
  musicSetIndex(i){
    try{
      this._music=this._music||{};
      const m=this._music;
      const list=m.list||[];
      if(!list.length) return;
      let idx = Number(i);
      if(!Number.isFinite(idx)) idx = 0;
      idx = ((idx % list.length) + list.length) % list.length;
      m.index = idx;
      const track = list[idx];
      if(m.audio){
        m.audio.src = track && track.url ? track.url : '';
      }
      // UI
      const status=document.getElementById('music-status');
      const now=document.getElementById('music-now');
      if(status) status.textContent = `已載入：${list.length} 首`;
      if(now) now.textContent = track ? `目前：${track.name || track.title || track.url || '—'}` : '（未選曲）';
      try{ this.musicRenderList && this.musicRenderList(); }catch(_){}
    }catch(_){}
  },

  musicNext(){
    try{
      this._music=this._music||{};
      const m=this._music;
      const list=m.list||[];
      if(!list.length) return;
      const shuffle = !!document.getElementById('music-shuffle')?.checked;
      if(shuffle){
        let ni = Math.floor(Math.random()*list.length);
        if(list.length>1 && ni===m.index) ni = (ni+1)%list.length;
        this.musicSetIndex(ni);
      }else{
        this.musicSetIndex((Number(m.index)||0)+1);
      }
      this.musicPlay();
    }catch(_){}
  },

  musicRenderList(){
    try{
      this._music=this._music||{};
      const m=this._music;
      const list=m.list||[];
      const status=document.getElementById('music-status');
      const now=document.getElementById('music-now');
      const items=document.getElementById('music-items');

      if(status) status.textContent = list.length ? `已載入：${list.length} 首` : '尚未載入清單';

      const idx = Number.isFinite(Number(m.index)) ? Number(m.index) : 0;
      const track = list[idx];
      if(now) now.textContent = (list.length && track) ? `目前：${track.name || track.title || track.url}` : '（未選曲）';

      if(!items) return;
      if(!list.length){
        items.innerHTML = '';
        return;
      }

      // clickable playlist (tap to play)
      items.innerHTML = list.map((t,i)=>{
        const title = String(t?.name || t?.title || t?.url || `Track ${i+1}`);
        const active = (i===idx);
        return `<button type="button" class="music-item-btn" data-i="${i}"
          style="width:100%; text-align:left; margin:4px 0; padding:8px 10px; border-radius:10px;
                 border:1px solid rgba(255,215,0,0.25);
                 background:${active ? 'rgba(255,215,120,0.20)' : 'rgba(0,0,0,0.25)'};
                 color:${active ? '#ffd778' : '#fff'};
                 font-weight:${active ? '900' : '800'};
                 cursor:pointer;">
          ${active ? '▶ ' : ''}${title}
        </button>`;
      }).join('');

      items.querySelectorAll('.music-item-btn').forEach(btn=>{
        btn.onclick = ()=>{
          const i = Number(btn.getAttribute('data-i'));
          if(!Number.isFinite(i)) return;
          this.musicSetIndex(i);
          this.musicPlay();
          this.musicRenderList(); // refresh highlight
        };
      });

    }catch(_){}
  },

  async musicLoadBuiltIn(force){
    try{
      const base = location.href.split('#')[0].split('?')[0];
      const dir = base.substring(0, base.lastIndexOf('/')+1);
      const candidates = [
        dir + 'music/playlist.json',
        dir + 'playlist.json'
      ];
      for(const url of candidates){
        try{
          const r = await fetch(url, {cache:'no-store'});
          if(!r.ok) continue;
          const json = await r.json();
          let arr = Array.isArray(json) ? json : (Array.isArray(json.tracks) ? json.tracks : []);
          if(!arr.length) continue;
          const norm = arr.map(x=>({
            name: x.name || x.title || x.file || x.url || 'track',
            url:  x.url  || x.file  || ''
          })).filter(x=>x.url);
          if(!norm.length) continue;
          this._music=this._music||{};
          const m=this._music;
          if(force || !Array.isArray(m.list) || !m.list.length){
            m.list = norm;
            m.index = 0;
          }else{
            // append without duplicates by url
            const existing = new Set((m.list||[]).map(t=>t.url));
            for(const t of norm){
              if(!existing.has(t.url)) m.list.push(t);
            }
          }
          this.musicSetIndex(Number(m.index)||0);
          this.musicRenderList();
          return true;
        }catch(_){}
      }
      return false;
    }catch(_){ return false; }
  },

  musicPlay(){
    try{
      const a=this._music && this._music.audio;
      if(!a || !a.src){ this.speak('請先載入音檔。'); return; }
      a.play();
      this.speak('開始播放。');
    }catch(_){}
  },
  musicPause(){
    try{
      const a=this._music && this._music.audio;
      if(!a) return;
      a.pause();
      this.speak('已暫停。');
    }catch(_){}
  },
  musicStop(){
    try{
      const a=this._music && this._music.audio;
      if(!a) return;
      a.pause();
      a.currentTime = 0;
      this.speak('已停止。');
    }catch(_){}
  }
};
window.app = app;
