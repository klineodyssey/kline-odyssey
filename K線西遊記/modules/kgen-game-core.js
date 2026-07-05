/*
KGEN Game Core JS V0.2 — Production Build
Shared runtime for all KGEN 5D temples and game UI.
*/
(function(global){
  'use strict';

  var KGEN_5D = {
    VERSION: 'V0.2',
    BUILD: 'PRODUCTION',
    CHAIN_ID: '0x38',
    CHAIN_NAME: 'BNB Smart Chain',
    CHAIN_RPC: 'https://bsc-dataseed.binance.org/',
    BSC_SCAN: 'https://bscscan.com',

    ADDR: {
      KGEN_TOKEN:    '0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',
      HEART_12345:   '0xB016D4d8f1aED1339101b30722cad6dbA9B8C972',
      BRAIN_11520:   '0xd0605F4EF10e5C1438F11AF9edc36926769239d6',
      MARS_108000:   '0x3529dbFbaD465C2269F8096879A1c298d5257298',
      TREASURY_8888: '0xB73D6716005B37BEC742D64482fA26033eE1A4E1',
      LP_PAIR:       '0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2',
      TAX_SPLITTER:  '0x0000000000000000000000000000000000000000',
    },

    NODES: {
      '12345':  { name: '悟空財神殿',   label: '五指山財神殿',   color: '#ffd778', url: '../12345/index.html', type: 'Temple', gameplay: 'Heart / 發財金 / 心跳' },
      '16888':  { name: '廣寒宮',        label: '飛碟控制中心',   color: '#ff8d35', url: '../16888/index.html', type: 'Temple', gameplay: 'K線引擎 / 空方基地' },
      '11520':  { name: '花果山交易所', label: 'Organ Exchange', color: '#00f2ff', url: '../11520/index.html', type: 'Exchange', gameplay: 'Swap / LP / Organ 上架' },
      '108000': { name: '火星齊天豪宅', label: '500席位系統',    color: '#ff5a1f', url: '../108000/index.html', type: 'SeatSystem', gameplay: 'NFT Seat / 分紅池' },
      '18888':  { name: '靈霄寶殿銀行', label: 'Divine Bank',    color: '#c084fc', url: '../18888/index.html', type: 'Bank', gameplay: 'Treasury / 抵押 / 清算' },
      '18921':  { name: '斬妖台 AutoLP', label: 'Auto LP Forge',  color: '#7cffc5', url: '../18921/index.html', type: 'AutoLP', gameplay: 'LP 淨化 / 斬妖' },
      '8888':   { name: '高老莊人民銀行', label: 'Underground Bank', color: '#e8b86d', url: '../8888/index.html', type: 'Bank', gameplay: '地下錢莊 / 借貸' },
      '8895':   { name: '八戒雲棧洞',   label: '雲棧洞',         color: '#f9a8d4', url: '../8895/index.html', type: 'Bank', gameplay: '八戒 NPC / 器官抵押' },
      '20888':  { name: '火焰山',       label: '風險清算場',     color: '#ff4500', url: '../20888/index.html', type: 'RiskArena', gameplay: '爆倉 / 燃燒教育' },
      '21319':  { name: '雷音寺',       label: '宇宙關卡',       color: '#fde047', url: '../21319/index.html', type: 'LevelNode', gameplay: '關卡節點 / 任務' },
      '21520':  { name: '大雄寶殿',     label: '宇宙關卡',       color: '#fbbf24', url: '../21520/index.html', type: 'LevelNode', gameplay: '關卡節點 / 任務' },
      '21666':  { name: '佛光普照',     label: '宇宙關卡',       color: '#fef08a', url: '../21666/index.html', type: 'LevelNode', gameplay: '關卡節點 / 任務' },
      '21888':  { name: '恐懼女鬼',     label: '宇宙關卡',       color: '#a78bfa', url: '../21888/index.html', type: 'LevelNode', gameplay: '恐懼試煉' },
      '22188':  { name: '貪婪魔影',     label: '宇宙關卡',       color: '#6b21a8', url: '../22188/index.html', type: 'LevelNode', gameplay: '貪婪試煉 / Boss' },
      '23333':  { name: '靈山',         label: '終極聖地',       color: '#fcd34d', url: '../23333/index.html', type: 'LevelNode', gameplay: '靈山終局' },
    },

    TAX: { TOTAL_BPS: 30, BURN_BPS: 10, BANK_BPS: 10, REWARD_BPS: 5, AUTOLP_BPS: 5, TOTAL_PCT: 0.30, IMMUTABLE: true },

    ORGAN: {
      APP: 'Organism',
      MODULE: 'Organ',
      DECOMPOSITION: 'Organ Decomposition',
      EXCHANGE_ID: '11520',
      BANK_ID: '18888',
      UNDERGROUND_ID: '8888',
    },
  };

  function StatusBus(elementId) {
    this.el = null;
    this.elId = elementId || 'kgen-status-text';
    this.history = [];
  }
  StatusBus.prototype.push = function(msg) {
    this.history.unshift(msg);
    if (this.history.length > 40) this.history.length = 40;
    if (!this.el) this.el = document.getElementById(this.elId);
    if (this.el) this.el.textContent = msg;
    var bottom = document.getElementById('kgen-status-bottom');
    if (bottom) bottom.textContent = msg;
    console.log('[KGEN]', msg);
  };

  var Wallet = {
    addr: null,
    demoMode: true,
    getEthereum: function() {
      var eth = window.ethereum || window.BinanceChain;
      if (eth && Array.isArray(eth.providers) && eth.providers.length) {
        return eth.providers.find(function(p){ return p.isMetaMask || p.isTrust || p.isOKXWallet; }) || eth.providers[0];
      }
      return eth || null;
    },
    formatAddr: function(a) { return !a ? '--' : a.slice(0,6) + '…' + a.slice(-4); },
    connect: async function(statusBus) {
      if (this.demoMode) {
        this.addr = '0xDemo00000000000000000000000000000001';
        if (statusBus) statusBus.push('Demo 模式 — 模擬錢包 0xDemo…0001');
        return this.addr;
      }
      var eth = this.getEthereum();
      if (!eth) { if (statusBus) statusBus.push('未偵測到錢包'); return null; }
      try {
        var accts = await eth.request({ method: 'eth_requestAccounts' });
        this.addr = accts && accts[0];
        if (statusBus) statusBus.push('錢包已連線：' + Wallet.formatAddr(this.addr));
        return this.addr;
      } catch(e) { if (statusBus) statusBus.push('連線失敗'); return null; }
    },
    readERC20Balance: async function(tokenAddr, userAddr) {
      if (this.demoMode) return '8888.0000';
      var eth = this.getEthereum();
      if (!eth || !userAddr) return null;
      try {
        var data = '0x70a08231' + '000000000000000000000000' + userAddr.replace('0x','');
        var res = await eth.request({ method: 'eth_call', params: [{ to: tokenAddr, data: data }, 'latest'] });
        return res && res !== '0x' ? (parseInt(res,16)/1e18).toFixed(4) : '0';
      } catch(e) { return null; }
    },
    readBNBBalance: async function(userAddr) {
      if (this.demoMode) return '1.2340';
      var eth = this.getEthereum();
      if (!eth || !userAddr) return null;
      try {
        var res = await eth.request({ method: 'eth_getBalance', params: [userAddr, 'latest'] });
        return res && res !== '0x' ? (parseInt(res,16)/1e18).toFixed(4) : '0';
      } catch(e) { return null; }
    },
  };

  var KlineFeed = {
    cache: {},
    fetch: async function(symbol) {
      symbol = symbol || 'BNBUSDT';
      try {
        var res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=' + symbol);
        if (!res.ok) throw new Error('HTTP');
        var d = await res.json();
        var data = { symbol: symbol, price: parseFloat(d.lastPrice), change: parseFloat(d.priceChangePercent),
          high: parseFloat(d.highPrice), low: parseFloat(d.lowPrice), vol: parseFloat(d.volume) };
        this.cache[symbol] = data;
        return data;
      } catch(e) {
        if (this.cache[symbol]) return this.cache[symbol];
        return { symbol: symbol, price: 600+Math.random()*50, change: (Math.random()-0.5)*4, high: 650, low: 580, vol: 1e6, demo: true };
      }
    },
    poll: function(symbol, callback, intervalMs) {
      var self = this;
      var run = function() { self.fetch(symbol).then(callback).catch(function(){}); };
      run();
      return setInterval(run, intervalMs || 15000);
    },
    fetchCandles: async function(symbol, interval, limit) {
      symbol = symbol || 'BNBUSDT'; interval = interval || '1d'; limit = limit || 30;
      try {
        var url = 'https://api.binance.com/api/v3/klines?symbol=' + symbol + '&interval=' + interval + '&limit=' + limit;
        var res = await fetch(url);
        var rows = await res.json();
        return rows.map(function(r){ return { open:+r[1], high:+r[2], low:+r[3], close:+r[4] }; });
      } catch(e) {
        var base = 600;
        return Array.from({length: limit||30}, function(_, i){
          var o = base + (Math.random()-0.5)*20;
          var c = base + (Math.random()-0.5)*20;
          return { open:o, close:c, high:Math.max(o,c)+5, low:Math.min(o,c)-5 };
        });
      }
    },
  };

  var UniverseMap = {
    nodes: KGEN_5D.NODES,
    getNode: function(id) { return this.nodes[String(id)] || null; },
    navLinks: function(currentId) {
      var html = '';
      Object.keys(this.nodes).forEach(function(id){
        if (id === String(currentId)) return;
        var n = UniverseMap.nodes[id];
        html += '<a href="' + n.url + '" style="border-color:' + n.color + '44;color:' + n.color + '">' + id + '</a>';
      });
      return html;
    },
  };

  function priceDir(change) {
    if (change > 0) return { text: '▲ ' + change.toFixed(2) + '%', color: '#7cffc5' };
    if (change < 0) return { text: '▼ ' + Math.abs(change).toFixed(2) + '%', color: '#ff4444' };
    return { text: '— 0.00%', color: '#aaa' };
  }

  function drawMiniCandles(canvas, candles) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!candles || !candles.length) return;
    var maxH = Math.max.apply(null, candles.map(function(c){ return c.high; }));
    var minL = Math.min.apply(null, candles.map(function(c){ return c.low; }));
    var range = maxH - minL || 1;
    var bw = Math.max(2, Math.floor(w / candles.length) - 1);
    var toY = function(v) { return h - ((v - minL) / range) * h; };
    candles.forEach(function(c, i) {
      var x = i * (bw + 1);
      var bull = c.close >= c.open;
      ctx.fillStyle = ctx.strokeStyle = bull ? '#7cffc5' : '#ff4444';
      ctx.beginPath(); ctx.moveTo(x+bw/2, toY(c.high)); ctx.lineTo(x+bw/2, toY(c.low)); ctx.stroke();
      ctx.fillRect(x, toY(Math.max(c.open,c.close)), bw, Math.max(1, toY(Math.min(c.open,c.close))-toY(Math.max(c.open,c.close))));
    });
  }

  function depthChart(canvas, bids, asks, mid) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    var maxQ = Math.max.apply(null, bids.concat(asks).map(function(x){ return x.q; })) || 1;
    bids.forEach(function(b, i){
      ctx.fillStyle = 'rgba(124,255,197,0.5)';
      ctx.fillRect(0, h - (b.q/maxQ)*h, w/2 - i*3, (b.q/maxQ)*h);
    });
    asks.forEach(function(a, i){
      ctx.fillStyle = 'rgba(255,68,68,0.5)';
      ctx.fillRect(w/2 + i*3, h - (a.q/maxQ)*h, w/2 - i*3, (a.q/maxQ)*h);
    });
    ctx.fillStyle = '#ffd778'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('$' + (mid||0).toFixed(2), w/2, 12);
  }

  global.KGEN_5D = KGEN_5D;
  global.KGEN_StatusBus = StatusBus;
  global.KGEN_Wallet = Wallet;
  global.KGEN_KlineFeed = KlineFeed;
  global.KGEN_UniverseMap = UniverseMap;
  global.KGEN_priceDir = priceDir;
  global.KGEN_drawMiniCandles = drawMiniCandles;
  global.KGEN_depthChart = depthChart;
})(window);
