const web3 = {
  provider: null,
  signer: null,
  addr: null,
  demo: false,

  pollTimer: null,
  lastRefreshAt: 0,
// ==== chain guard (BSC) ====
  BSC_CHAIN_ID_DEC: 56,
  BSC_CHAIN_ID_HEX: "0x38",
  ROOT_ENTRY: "https://klineodyssey.github.io/kline-odyssey/12345.html",
  OFFICIAL_DAPP: "https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html",
  BRIDGE_PAGE: "https://klineodyssey.github.io/kline-odyssey/wallet-12345.html",
  METAMASK_DAPP_PATH: "klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html",
  METAMASK_DEEPLINK: "https://metamask.app.link/dapp/klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html",
  async ensureBSC(){
    if(!window.ethereum) return true;
    try{
      const cid = await window.ethereum.request({ method:"eth_chainId" });
      const el = document.getElementById("w3-chain");
      if(el) el.innerText = cid;
      if(cid && cid.toLowerCase() === this.BSC_CHAIN_ID_HEX) return true;

      // Try switch to BSC
      try{
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: this.BSC_CHAIN_ID_HEX }]
        });
      }catch(swErr){
        // If not added, try add chain then switch
        if(swErr && (swErr.code === 4902 || String(swErr.message||"").includes("Unrecognized chain"))){
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: this.BSC_CHAIN_ID_HEX,
              chainName: "BNB Smart Chain",
              nativeCurrency: { name:"BNB", symbol:"BNB", decimals:18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/","https://bsc-dataseed1.defibit.io/","https://bsc-dataseed1.ninicoin.io/"],
              blockExplorerUrls: ["https://bscscan.com"]
            }]
          });
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: this.BSC_CHAIN_ID_HEX }]
          });
        }else{
          throw swErr;
        }
      }
      const cid2 = await window.ethereum.request({ method:"eth_chainId" });
      const el2 = document.getElementById("w3-chain");
      if(el2) el2.innerText = cid2;
      return (cid2 && cid2.toLowerCase() === this.BSC_CHAIN_ID_HEX);
    }catch(e){
      console.warn("ensureBSC failed", e);
      return false;
    }
  },


  // 固定 Token（你給的）
  KGEN: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",

  // 你部署後填上（會自動記到 localStorage）
  UNIVERSE: "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972", // LIVE KGEN_16888_Universe_V5_2_0

  TREASURY: "0xB73D6716005B37BEC742D64482fA26033eE1A4E1",
  LP_PAIR: "0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2",

  // 鏈上資訊（唯一正確）
  TOKEN_SCAN_URL: "https://bscscan.com/token/0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
  PANCAKE_SWAP_URL: "https://pancakeswap.finance/swap?outputCurrency=0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
  PAIR_SCAN_URL: "https://bscscan.com/address/0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2",
  LP_LOCK_URL: "https://www.pinksale.finance/pinklock/bsc/record/1427003",
  LP_LOCK_UNTIL_UTC: "2027-01-01T00:00:00Z",

  // 高老莊（8888）地址：可在頁面設定，會自動記到 localStorage
  GAOLAO: "0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9",

  // 最小 ABI（對齊 Universe V5.2.0：入池 + 下單 + 查詢 + 事件）
  abiERC20: [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address a) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ],
  abiUniverse: [
    "function ritualDeposit(uint256 amount, bytes32 tag) external",
    "function placeOrder(uint8 side, uint256 amountIn) external",
    "function poolBalance() external view returns (uint256)",
    "function canTriggerRound() external view returns (bool)",
    "function minOrder() external view returns (uint256)",
    "function maxOrder() external view returns (uint256)",
    "function vowWindowSec() external view returns (uint32)",
    "function loveWindowSec() external view returns (uint32)",
    "function treasury8888() external view returns (address)",
    "function kgen() external view returns (address)",
    "function TRIGGER() external view returns (uint256)",
    "function MIN_FLOOR() external view returns (uint256)",
    "function ROUND_TOTAL() external view returns (uint256)",
    "function configLocked() external view returns (bool)",
    "function roundId() external view returns (uint256)",
    "function rounds(uint256) external view returns (address a,address b,uint40 settledAt,uint40 vowDeadlineAt,uint40 loveDeadlineAt,uint256 escrowA,uint256 escrowB,bool aVowed,bool bVowed,bool aClaimed,bool bClaimed,bool settled)",
    "event OrderPlaced(address indexed user,uint8 side,uint256 amountIn,uint256 feeTotal,uint256 feeToTreasury,uint256 feeToPool,uint256 stake)",
    "event OrderResolved(address indexed user,uint8 side,uint8 outcome,bool win,uint256 payout)",
    "event RoundTriggered(uint256 indexed roundId,address indexed playerA,address indexed playerB,uint256 poolBefore)",
    "event RoundSettled(uint256 indexed roundId,address indexed playerA,address indexed playerB,uint256 toAInstant,uint256 toBInstant,uint256 escrowA,uint256 escrowB,uint40 settledAt,uint40 vowDeadlineAt,uint40 loveDeadlineAt)",
    "event RitualDeposit(address indexed from,uint256 amount,bytes32 indexed tag)"
  ],

  // ===== helpers =====
  cKGEN(){ return new ethers.Contract(this.KGEN, this.abiERC20, this.signer); },
  cUNI(){ return new ethers.Contract(this.UNIVERSE, this.abiUniverse, this.signer); },

  load(){
  try{
    const u = localStorage.getItem("KGEN_16888_UNIVERSE_ADDR") || "";
    if(u && ethers.utils.isAddress(u)) this.UNIVERSE = u;
  }catch(_){}
  try{
    const g = localStorage.getItem("KGEN_16888_GAOLAO_ADDR") || "";
    if(g && ethers.utils.isAddress(g)) this.GAOLAO = g;
  }catch(_){}
  this.ui();
},

ui(){
const uel=document.getElementById('w3-uni'); if(uel) uel.innerText = this.UNIVERSE ? this.UNIVERSE : '待部署（可先 Demo）';
    const ga=document.getElementById('cp-gaolao-addr'); if(ga) ga.value = (this.GAOLAO && ethers.utils.isAddress(this.GAOLAO)) ? this.GAOLAO : ''; 
    const gs=document.getElementById('cp-gaolao-status'); if(gs) gs.innerText = (this.GAOLAO && ethers.utils.isAddress(this.GAOLAO)) ? '已設定' : '待部署';
    (()=>{const el=document.getElementById("w3-mode"); if(el) el.innerText=this.demo ? "DEMO MODE" : "LIVE MODE";})();
  },

setGaolaoAddr(){
  const v = prompt("輸入 Heart 合約地址（12345 / 待部署後貼上）", this.GAOLAO || "");
  if(v===null) return;
  const vv = (v||"").trim();
  if(vv && !ethers.utils.isAddress(vv)) return alert("地址格式錯誤");
  this.GAOLAO = vv;
  try{ localStorage.setItem("KGEN_16888_GAOLAO_ADDR", vv); }catch(_){}
  this.ui();
  this.refreshGaolao();
  app.speak("高老莊地址已設定。");
},

async copyGaolaoAddr(){
  const v = this.GAOLAO || "";
  if(!v) return alert("尚待部署高老莊地址");
  navigator.clipboard?.writeText(v).then(()=>app.toast?.("已複製")).catch(()=>{});
},

async refreshGaolao(){
  const st = document.getElementById('cp-gaolao-status');
  const vb = document.getElementById('cp-gaolao-kgen');
  if(!this.GAOLAO || !ethers.utils.isAddress(this.GAOLAO)){
    if(st) st.innerText = "待部署";
    if(vb) vb.innerText = "--";
    return;
  }
  if(this.demo){
    if(st) st.innerText = "DEMO";
    if(vb) vb.innerText = "DEMO";
    return;
  }
  if(!this.provider){
    if(st) st.innerText = "尚未連線";
    if(vb) vb.innerText = "--";
    return;
  }
  try{
    if(st) st.innerText = "讀取中…";
    const kgenR = new ethers.Contract(this.KGEN, this.abiERC20, this.provider);
    let dec = 18; try{ dec = await kgenR.decimals(); }catch(_){}
    const bal = await kgenR.balanceOf(this.GAOLAO);
    const txt = `${parseFloat(ethers.utils.formatUnits(bal, dec)).toFixed(4)} KGEN`;
    if(vb) vb.innerText = txt;
    // BNB
    try{
      const bnb = await this.provider.getBalance(this.GAOLAO);
      const bnbTxt = `${parseFloat(ethers.utils.formatEther(bnb)).toFixed(4)} BNB`;
      const gb=document.getElementById("cp-gaolao-bnb"); if(gb) gb.innerText = bnbTxt;
    }catch(_){ const gb=document.getElementById("cp-gaolao-bnb"); if(gb) gb.innerText="--"; }
    if(st) st.innerText = "OK";
  }catch(e){
    console.warn("refreshGaolao failed", e);
    if(st) st.innerText = "讀取失敗";
    if(vb) vb.innerText = "--";
  }
},

async refreshTreasury(){
  const vk = document.getElementById('cp-treasury-kgen');
  if(this.demo){ if(vk) vk.innerText = 'DEMO'; return; }
  if(!this.provider) { if(vk) vk.innerText='--'; return; }
  try{
    const kgenR = new ethers.Contract(this.KGEN, this.abiERC20, this.provider);
    let dec = 18; try{ dec = await kgenR.decimals(); }catch(_){}
    const bal = await kgenR.balanceOf(this.TREASURY);
    if(vk) vk.innerText = `${parseFloat(ethers.utils.formatUnits(bal, dec)).toFixed(4)} KGEN`;
  }catch(e){
    console.warn('refreshTreasury failed', e);
    if(vk) vk.innerText='--';
  }
},
async setUniverseAddr(){
    const v = (document.getElementById("uni-addr-input").value || "").trim();
    if(!ethers.utils.isAddress(v)) return alert("合約地址格式錯誤");
    this.UNIVERSE = v;
    try{ localStorage.setItem("KGEN_16888_UNIVERSE_ADDR", v); }catch(_){}
    this.ui();
    this.refresh();
    app.speak("Universe 合約地址已設定。");
  },


startPolling(){
  try{ if(this.pollTimer) clearInterval(this.pollTimer); }catch(_){}
  this.pollTimer = setInterval(async ()=>{
    // avoid overlapping refresh storms
    const now = Date.now();
    if(now - (this.lastRefreshAt||0) < 2000) return;
    this.lastRefreshAt = now;
    try{ await this.refreshUser(); }catch(_){}
    try{ await this.refresh(); }catch(_){}
    try{ await this.refreshGaolao(); }catch(_){}
    try{ await this.refreshTreasury(); }catch(_){}
  }, 10000);
},
stopPolling(){
  try{ if(this.pollTimer) clearInterval(this.pollTimer); }catch(_){}
  this.pollTimer = null;
},
async autoDetect(){
  // cannot fully auto-connect without user gesture, but we can prepare the best path
  const btn = document.getElementById("w3-connect-btn");
  if(!window.ethereum){
    if(btn){
      btn.disabled = false;
      btn.textContent = "🔌 連結錢包（未偵測到時自動開多錢包）";
    }
    return;
  }
  try{
    const cid = await window.ethereum.request({ method:"eth_chainId" });
    const el = document.getElementById("w3-chain");
    if(el) el.innerText = cid || "--";
    const accts = await window.ethereum.request({ method:"eth_accounts" });
    if(accts && accts.length){
      const wa=document.getElementById('w3-addr'); if(wa) wa.innerText = accts[0];
      if(btn){ btn.textContent = "✅ 已授權，點我啟動同步"; }
    }else{
      if(btn){ btn.textContent = "🔌 連結錢包（自動）"; }
    }
  }catch(e){
    console.warn("autoDetect failed", e);
  }
},

  async smartConnect(){
    try{
      if(window.ethereum || window.BinanceChain){
        return await this.connect();
      }
      this.openWalletHub();
      try{ this.toast && this.toast('未偵測到注入錢包，已開啟多錢包入口'); }catch(_){}
      try{ app && app.speak && app.speak('未偵測到錢包，已開啟多錢包入口。請用錢包內建瀏覽器開啟本頁後再按連結錢包。'); }catch(_){}
      return;
    }catch(e){
      console.warn('smartConnect failed', e);
      try{ this.openWalletHub(); }catch(_){}
    }
  },


  async connect(){
    try{
      this.stopPolling();
      if(!window.ethereum){
        this.openWalletHub();
        this.demo = true;
        this.ui();
        if(app && app.speak) app.speak("未偵測到錢包，已開啟多錢包入口。");
        return;
      }
      await window.ethereum.request({ method:"eth_requestAccounts" });
      const okChain = await this.ensureBSC();
      if(!okChain){
        alert("請切到 BNB Smart Chain (BSC)。目前錢包在 Ethereum 或其他鏈，會導致顯示 ethereum 並無法續玩。");
        this.demo = true;
        this.ui();
        this.demoRefresh();
        return;
      }
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      try{ const net = await this.provider.getNetwork(); const ch = document.getElementById("w3-chain"); if(ch) ch.innerText = (net && (net.name||"") ? (net.name + " (" + net.chainId + ")") : ("chain " + (net?net.chainId:"--"))); }catch(_){ }
      this.signer = this.provider.getSigner();
      this.addr = await this.signer.getAddress();
const wa=document.getElementById('w3-addr'); if(wa) wa.innerText = this.addr;
      this.demo = false;
            try{ await this.refreshGaolao();
      await this.refreshTreasury(); }catch(_){ }
this.ui();
      await this.refresh();
      await this.refreshUser();
            try{ await this.refreshGaolao();
      await this.refreshTreasury(); }catch(_){ }
await this.bindEvents();
      this.startPolling();
      app.speak("錢包已連線。五指山誓約引擎已啟動。");
    }catch(e){
      console.error(e);
      this.demo = true;
      this.ui();
      alert("錢包連線失敗，已切回 Demo 模式");
    }
  },


  async refreshUser(){
    try{
      // Demo 模式：不讀鏈上
      if(this.demo){
        const ub=document.getElementById('userBal'); if(ub) ub.innerText = 'DEMO';
        const ua=document.getElementById('userAllowance'); if(ua) ua.innerText = 'DEMO';
        return;
      }
      if(!this.provider || !this.addr || !this.UNIVERSE) return;

      const kgenR = new ethers.Contract(this.KGEN, this.abiERC20, this.provider);
      let dec = 18;
      try{ dec = await kgenR.decimals(); }catch(_){}

      const [bal, alw] = await Promise.all([
        kgenR.balanceOf(this.addr),
        kgenR.allowance(this.addr, this.UNIVERSE),
      ]);

      const balTxt = `${parseFloat(ethers.utils.formatUnits(bal, dec)).toFixed(4)} KGEN`;
      const alwTxt = `${parseFloat(ethers.utils.formatUnits(alw, dec)).toFixed(4)} KGEN`;

      const ub=document.getElementById('userBal'); if(ub) ub.innerText = balTxt;
      const ua=document.getElementById('userAllowance'); if(ua) ua.innerText = alwTxt;

      // BNB 餘額
      try{
        const bnb = await this.provider.getBalance(this.addr);
        const bnbTxt = `${parseFloat(ethers.utils.formatEther(bnb)).toFixed(4)} BNB`;
        const bn=document.getElementById('userBNB'); if(bn) bn.innerText = bnbTxt;
      }catch(_){ const bn=document.getElementById('userBNB'); if(bn) bn.innerText='--'; }
      // Resource bars (top-left)
      try{
        const bnb = await this.provider.getBalance(this.addr);
        const bnbVal = parseFloat(ethers.utils.formatEther(bnb));
        const kgenVal = parseFloat(ethers.utils.formatUnits(bal, dec));
        const bnbTxt2 = `${bnbVal.toFixed(4)} BNB`;
        const kgenTxt2 = `${kgenVal.toFixed(4)} KGEN`;
        const bt = document.getElementById("rb-bnb-txt"); if(bt) bt.textContent = bnbTxt2;
        const kt = document.getElementById("rb-kgen-txt"); if(kt) kt.textContent = kgenTxt2;

        // simple normalization (no max supply known): BNB capped at 1.0 for bar, KGEN capped at 10,000
        const bFill = document.getElementById("rb-bnb-fill"); 
        const kFill = document.getElementById("rb-kgen-fill");
        if(bFill) bFill.style.width = `${Math.min(100, (bnbVal/1.0)*100)}%`;
        if(kFill) kFill.style.width = `${Math.min(100, (kgenVal/10000.0)*100)}%`;
      }catch(_){}



            // 同步更新高老莊（8888）地址餘額
      await this.refreshGaolao();
      await this.refreshTreasury();
}catch(e){
      console.warn("refreshUser failed", e);
      const ub=document.getElementById('userBal'); if(ub) ub.innerText = '讀取失敗';
      const ua=document.getElementById('userAllowance'); if(ua) ua.innerText = '讀取失敗';
    }
  },

  parseAmt(){
    const v = (document.getElementById("amt-in").value || "").trim();
    if(!v) throw new Error("請輸入金額");
    if(!/^\d+(\.\d+)?$/.test(v)) throw new Error("金額格式錯誤");
    return ethers.utils.parseUnits(v, 18);
  },

  // ===== DEMO (no wallet) =====
  demoState: { pool: 8888, target: 16888, base: 8888 },
  demoRefresh(){
    const b = this.demoState.pool;
    const t = this.demoState.target;
    const pct = Math.max(0, Math.min(100, (b/t)*100));
const wb=document.getElementById('w3-bal'); if(wb) wb.innerText = `${b.toFixed(2)} KGEN (demo)`;
const ub=document.getElementById('userBal'); if(ub) ub.innerText = 'DEMO';
const ua=document.getElementById('userAllowance'); if(ua) ua.innerText = 'DEMO';
    (()=>{const el=document.getElementById("prog-txt"); if(el) el.innerText=`${b.toFixed(2)} / ${t} (${pct.toFixed(2)}%)`;})();
const w3b=document.getElementById('prog-fill'); if(w3b) w3b.style.width = pct.toFixed(2) + '%';
    app.setProgress(pct/100);
  },

  demoDeposit(amt){
    const a = parseFloat(ethers.utils.formatUnits(amt,18));
    this.demoState.pool += a;
    this.demoRefresh();
    app.logEvent(`DEMO 入池 +${a.toFixed(2)} KGEN`);
  },

  demoOrder(side, amt){
    const a = parseFloat(ethers.utils.formatUnits(amt,18));
    // 簡化：直接 50/50
    const win = Math.random() < 0.5;
    const payout = win ? a*2 : 0;
    if(win){
      // pool pay profit portion only in demo
      this.demoState.pool = Math.max(this.demoState.base, this.demoState.pool - a);
    }else{
      this.demoState.pool += a;
    }
    this.demoRefresh();
    app.logEvent(`DEMO 下單 ${side===0?"漲":"跌"}｜${a.toFixed(2)}｜${win?"WIN":"LOSE"}｜payout ${payout.toFixed(2)}`);
  },

  // ===== LIVE =====
  async approve(){
    if(this.demo) return alert("Demo 模式不需要 Approve");
    if(!this.UNIVERSE) return alert("請先設定 Universe 合約地址");
    try{
      const amt = this.parseAmt();
      const c = this.cKGEN();
      const tx = await c.approve(this.UNIVERSE, amt);
      app.speak("Approve 已送出。");
      await tx.wait();
      app.speak("Approve 完成。");
    }catch(e){
      console.error(e);
      alert(e.message || "Approve 失敗");
    }
  },

  async ritualDeposit(){
    try{
      const amt = this.parseAmt();
      if(this.demo){
        this.demoDeposit(amt);
        app.speak("Demo 入池完成。");
        return;
      }
      const okChain = await this.ensureBSC();
      if(!okChain) return alert("請切到 BNB Smart Chain (BSC) 再操作。");
      if(!this.UNIVERSE) return alert("請先設定 Universe 合約地址");
      const uni = this.cUNI();
      const tx = await uni.ritualDeposit(amt, ethers.utils.formatBytes32String("RITUAL"));
app.speak("點燈已入池。");
      await tx.wait();
      await this.refresh();
      app.speak("入池成功。");
    }catch(e){
      console.error(e);
      alert(e.message || "入池失敗");
    }
  },

  async place(side){
    try{
      const amt = this.parseAmt();
      if(this.demo){
        this.demoOrder(side, amt);
        return;
      }
      if(!this.UNIVERSE) return alert("請先設定 Universe 合約地址");
      const uni = this.cUNI();
      const tx = await uni.placeOrder(side, amt);
      app.speak("下單已送出，等待鏈上結算。");
      await tx.wait();
      await this.refresh();
      app.speak("本次對賭已結算。");
    }catch(e){
      console.error(e);
      alert(e.message || "下單失敗");
    }
  },

  async refresh(){
    try{
      if(this.demo){
        this.demoRefresh();
        return;
      }
      if(!this.UNIVERSE || !this.provider){
const wb2=document.getElementById('w3-bal'); if(wb2) wb2.innerText = '--';
        return;
      }
      try{ const net = await this.provider.getNetwork(); const ch = document.getElementById("w3-chain"); if(ch) ch.innerText = (net && (net.name||"") ? (net.name + " (" + net.chainId + ")") : ("chain " + (net?net.chainId:"--"))); }catch(_){ }
      const uniR = new ethers.Contract(this.UNIVERSE, this.abiUniverse, this.provider);

      const [bal, can, minO, maxO, vowW, loveW, tre, trig, floor, roundT] = await Promise.all([
        uniR.poolBalance(),
        uniR.canTriggerRound(),
        uniR.minOrder(),
        uniR.maxOrder(),
        uniR.vowWindowSec(),
        uniR.loveWindowSec(),
        uniR.treasury8888(),
        uniR.TRIGGER(),
        uniR.MIN_FLOOR(),
        uniR.ROUND_TOTAL()
      ]);
const b = parseFloat(ethers.utils.formatUnits(bal, 18));
      const minK = parseFloat(ethers.utils.formatUnits(minO, 18));
      const maxK = parseFloat(ethers.utils.formatUnits(maxO, 18));
      const trigK = parseFloat(ethers.utils.formatUnits(trig, 18));
      const floorK = parseFloat(ethers.utils.formatUnits(floor, 18));
      const roundK = parseFloat(ethers.utils.formatUnits(roundT, 18));
const t = parseFloat(trigK.toFixed(2));
      const baseF = parseFloat(floorK.toFixed(2));

const wb3=document.getElementById('w3-bal'); if(wb3) wb3.innerText = `${b.toFixed(4)} KGEN`;
      const pct = (t>0) ? Math.max(0, Math.min(100, (b/t)*100)) : 0;

      (()=>{const el=document.getElementById("prog-txt"); if(el) el.innerText=`${b.toFixed(2)} / ${t.toFixed(0)}  (Base ${baseF.toFixed(0)})  ${pct.toFixed(2)}%`;})();

const w3b2=document.getElementById('prog-fill'); if(w3b2) w3b2.style.width = pct.toFixed(2) + '%';
      // ===== CT 同步（重要） =====
      // 本頁定義：CT = 鏈上 Universe.poolBalance()（KGEN）
      // 直接把 CT/CT+1 對齊鏈上池子狀態。
      this._ct = b;
      this.updateCoordPanel();
      app.setProgress(pct/100);
      await this.refreshUser();
    }catch(e){
      console.warn(e);
    }
  },

  async bindEvents(){
    try{
      if(this.demo) return;
      if(!this.UNIVERSE || !this.provider) return;

      // prevent double bind
      if(this._bound) return;
      this._bound = true;

      const uniR = new ethers.Contract(this.UNIVERSE, this.abiUniverse, this.provider);

      uniR.on("OrderResolved", (user, side, outcome, win, payout) => {
        const p = parseFloat(ethers.utils.formatUnits(payout, 18));
        app.logEvent(`鏈上結算｜${user.slice(0,6)}…｜${side==0?"漲":"跌"}｜${win?"WIN":"LOSE"}｜payout ${p.toFixed(4)} KGEN`);
        this.refresh();
      });

      uniR.on("RoundSettled", (roundId, a, b, distributable) => {
        app.logEvent(`下凡投胎 Round #${roundId.toString()}｜A ${a.slice(0,6)}…｜B ${b.slice(0,6)}…｜${ethers.utils.formatUnits(distributable,18)} KGEN`);
        this.refresh();
      });
    }catch(e){
      console.warn(e);
    }
  }

    ,
    openWalletHub(){
      const hub = document.getElementById('walletHub');
      const inp = document.getElementById('walletHubUrl');
      if(inp) inp.value = location.href;
      if(hub){ hub.style.display='flex'; }
    },
    closeWalletHub(){
      const hub = document.getElementById('walletHub');
      if(hub){ hub.style.display='none'; }
    },
    deepLink(kind){
      const url = location.href;
      let link = url;
      if(kind==='metamask'){
        link = this.METAMASK_DEEPLINK || ('https://metamask.app.link/dapp/' + (this.METAMASK_DAPP_PATH || (location.host + location.pathname + location.search + location.hash)));
      } else if(kind==='trust'){
        link = 'https://link.trustwallet.com/open_url?url=' + encodeURIComponent(url);
      } else if(kind==='okx'){
        link = 'okx://wallet/dapp/url?dappUrl=' + encodeURIComponent(url);
      } else if(kind==='bitget'){
        link = 'bitget://openDapp?url=' + encodeURIComponent(url);
      } else if(kind==='binance'){
        link = 'https://www.binance.com/en/download';
      }
      window.location.href = link;
    },
    async copyDappUrl(){
      const url = location.href;
      try{
        await navigator.clipboard.writeText(url);
        this.toast && this.toast('已複製連結');
      }catch(e){
        const inp = document.getElementById('walletHubUrl');
        if(inp){ inp.focus(); inp.select(); }
      }
    },
    // ===== WalletConnect v2 (Project ID) =====
    wcProjectId: "ed256d3118a9c971d550ed5ee522b4d9",
    wcProvider: null,
    async connectWalletConnect(){
      try{
        if(!window.WalletConnectEthereumProvider){
          this.toast && this.toast('WalletConnect 載入失敗');
          return;
        }
        const provider = await window.WalletConnectEthereumProvider.init({
          projectId: this.wcProjectId,
          chains: [56],
          optionalChains: [1],
          showQrModal: true,
          qrModalOptions: {
            themeMode: 'dark',
          }
        });
        await provider.enable();
        this.wcProvider = provider;
        await this.setProvider(provider, 'WalletConnect');
      }catch(e){
        console.warn(e);
        this.toast && this.toast('WalletConnect 連線取消或失敗');
      }
    },
    async connectBinance(){
      // Binance Web3 Wallet / Binance Chain Wallet injects window.BinanceChain or window.ethereum (same as injected)
      const p = window.BinanceChain || window.ethereum;
      if(!p){
        this.toast && this.toast('未偵測到幣安錢包。請用幣安 App 內建 DApp 瀏覽器開啟此頁，或安裝 Binance Wallet。');
        return;
      }
      try{
        await this.setProvider(p, 'Binance');
      }catch(e){
        console.warn(e);
        this.toast && this.toast('幣安錢包連線失敗');
      }
    },
    async setProvider(provider, label){
      // unify with existing ethers flow
      try{
        this.provider = provider;
        this.providerLabel = label || 'Injected';
        if(provider.request){
          await provider.request({ method:'eth_requestAccounts' });
        }
        // prefer existing init sequence
        if(window.ethers){
          this.ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
          this.signer = this.ethersProvider.getSigner();
          const addr = await this.signer.getAddress();
          const net = await this.ethersProvider.getNetwork();
          document.getElementById('w3-addr').textContent = addr;
          document.getElementById('w3-chain').textContent = (net && net.chainId) ? ('bsc ('+net.chainId+')') : '--';
          // hook events
          if(provider.on){
            provider.on('accountsChanged', ()=>this.refreshAll());
            provider.on('chainChanged', ()=>this.refreshAll());
            provider.on('disconnect', ()=>this.onDisconnect && this.onDisconnect());
          }
          this.closeWalletHub();
          // start refresh loop
          this.refreshAll();
          if(!this._refreshTimer){
            this._refreshTimer = setInterval(()=>this.refreshAll(), 6000);
          }
        }
      }catch(e){
        console.warn(e);
        throw e;
      }
    },
    async refreshAll(){
      // refresh wallet BNB + KGEN + allowance + pool/progress if available
      try{
        if(!this.ethersProvider || !this.signer) return;
        const addr = await this.signer.getAddress();
        // native balance
        const bnb = await this.ethersProvider.getBalance(addr);
        const bnbFmt = ethers.utils.formatEther(bnb);
        const elBNB = document.getElementById('userBNB'); if(elBNB) elBNB.textContent = (+bnbFmt).toFixed(6)+' BNB';
        // top left bars
        if(window.app && app.updateEnergyBars) app.updateEnergyBars(bnbFmt, null);
        if(window.app && app.refreshUserToken) await app.refreshUserToken(); // updates userBal/userAllowance + KGEN bar
        if(window.app && app.refreshPool) await app.refreshPool(); // pool balance + progress
      }catch(e){
        // keep silent to avoid spam
      }
    }
};
window.web3 = web3;
