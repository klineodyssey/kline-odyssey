/*
KGEN Game Core JS V1.0
Shared runtime utilities for all KGEN 5D temples and game UI.
Pure vanilla JS — no dependencies, no build required.
Used by Universe Runtime V1.0 (see modules/universe-runtime/)
*/
(function(global){
  'use strict';

  // ===== Constants =====
  var KGEN_5D = {
    VERSION: 'V1.0',
    CHAIN_ID: '0x38',
    CHAIN_NAME: 'BNB Smart Chain',
    CHAIN_RPC: 'https://bsc-dataseed.binance.org/',
    BSC_SCAN: 'https://bscscan.com',

    // Contract addresses (on-chain, read-only in prototype)
    ADDR: {
      KGEN_TOKEN:    '0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',
      HEART_12345:   '0xB016D4d8f1aED1339101b30722cad6dbA9B8C972',
      BRAIN_11520:   '0xd0605F4EF10e5C1438F11AF9edc36926769239d6',
      MARS_108000:   '0x3529dbFbaD465C2269F8096879A1c298d5257298',
      TREASURY_8888: '0xB73D6716005B37BEC742D64482fA26033eE1A4E1',
      LP_PAIR:       '0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2',
      TAX_SPLITTER:  '0x0000000000000000000000000000000000000000', // placeholder
    },

    // Universe node registry
    NODES: {
      '12345':  { name: '悟空財神殿',   label: '五指山財神殿',   color: '#ffd778', url: '../12345/index.html' },
      '11520':  { name: '花果山交易所', label: '宇宙交易所',     color: '#00f2ff', url: '../11520/index.html' },
      '108000': { name: '火星齊天豪宅', label: '500席位系統',    color: '#ff5a1f', url: '../108000/index.html' },
      '18888':  { name: '靈霄寶殿銀行', label: '神明銀行',       color: '#c084fc', url: '../18888/index.html' },
      '18921':  { name: '斬妖台 AutoLP', label: 'Auto LP 儀表板', color: '#7cffc5', url: '../18921/index.html' },
      '16888':  { name: '廣寒宮',        label: '飛碟控制中心',   color: '#ff8d35', url: '../16888/index.html' },
    },

    // Tax rate (immutable on-chain)
    TAX: {
      TOTAL_BPS: 30,
      BURN_BPS:  10,
      BANK_BPS:  10,
      REWARD_BPS: 5,
      AUTOLP_BPS: 5,
      TOTAL_PCT: 0.30,
    },
  };

  // ===== Status Bus =====
  function StatusBus(elementId) {
    this.el = null;
    this.elId = elementId || 'kgen-status-text';
    this.history = [];
  }
  StatusBus.prototype.push = function(msg) {
    this.history.unshift(msg);
    if(this.history.length > 30) this.history.length = 30;
    if(!this.el) this.el = document.getElementById(this.elId);
    if(this.el) this.el.textContent = msg;
    console.log('[KGEN]', msg);
  };

  // ===== Wallet helpers =====
  var Wallet = {
    addr: null,
    provider: null,

    getEthereum: function() {
      var eth = window.ethereum || window.BinanceChain;
      if(eth && Array.isArray(eth.providers) && eth.providers.length) {
        return eth.providers.find(function(p){ return p.isMetaMask || p.isTrust || p.isOKXWallet; }) || eth.providers[0];
      }
      return eth || null;
    },

    formatAddr: function(a) {
      if(!a) return '--';
      return a.slice(0,6) + '…' + a.slice(-4);
    },

    connect: async function(statusBus) {
      var eth = this.getEthereum();
      if(!eth) {
        if(statusBus) statusBus.push('未偵測到錢包，請用 MetaMask / Trust Wallet 開啟');
        return null;
      }
      try {
        var accts = await eth.request({ method: 'eth_requestAccounts' });
        this.addr = accts && accts[0];
        // Switch to BSC
        try {
          var cid = await eth.request({ method: 'eth_chainId' });
          if(cid !== KGEN_5D.CHAIN_ID) {
            await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: KGEN_5D.CHAIN_ID }] });
          }
        } catch(e) {
          if(e.code === 4902) {
            await eth.request({ method: 'wallet_addEthereumChain', params: [{
              chainId: KGEN_5D.CHAIN_ID,
              chainName: KGEN_5D.CHAIN_NAME,
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: [KGEN_5D.CHAIN_RPC],
              blockExplorerUrls: [KGEN_5D.BSC_SCAN]
            }]});
          }
        }
        if(statusBus) statusBus.push('錢包已連線：' + Wallet.formatAddr(this.addr));
        return this.addr;
      } catch(e) {
        if(statusBus) statusBus.push('錢包連線失敗：' + (e.message || e));
        return null;
      }
    },

    readERC20Balance: async function(tokenAddr, userAddr) {
      var eth = this.getEthereum();
      if(!eth || !userAddr) return null;
      try {
        var sig = '0x70a08231';
        var padded = '000000000000000000000000' + userAddr.replace('0x','');
        var data = sig + padded;
        var res = await eth.request({ method: 'eth_call', params: [{ to: tokenAddr, data: data }, 'latest'] });
        if(!res || res === '0x') return '0';
        var raw = parseInt(res, 16);
        return (raw / 1e18).toFixed(4);
      } catch(e) { return null; }
    },

    readBNBBalance: async function(userAddr) {
      var eth = this.getEthereum();
      if(!eth || !userAddr) return null;
      try {
        var res = await eth.request({ method: 'eth_getBalance', params: [userAddr, 'latest'] });
        if(!res || res === '0x') return '0';
        var raw = parseInt(res, 16);
        return (raw / 1e18).toFixed(4);
      } catch(e) { return null; }
    },
  };

  // ===== Kline Live Feed (Binance public) =====
  var KlineFeed = {
    SYMBOLS: ['BNBUSDT', 'BTCUSDT', 'ETHUSDT'],
    cache: {},

    fetch: async function(symbol) {
      symbol = symbol || 'BNBUSDT';
      var url = 'https://api.binance.com/api/v3/ticker/24hr?symbol=' + symbol;
      try {
        var res = await fetch(url);
        if(!res.ok) throw new Error('HTTP ' + res.status);
        var d = await res.json();
        var price = parseFloat(d.lastPrice);
        var change = parseFloat(d.priceChangePercent);
        var data = { symbol: symbol, price: price, change: change, high: parseFloat(d.highPrice), low: parseFloat(d.lowPrice), vol: parseFloat(d.volume) };
        this.cache[symbol] = data;
        return data;
      } catch(e) {
        // Return cached or demo data
        if(this.cache[symbol]) return this.cache[symbol];
        return { symbol: symbol, price: 600 + Math.random()*50, change: (Math.random()-0.5)*4, high: 650, low: 580, vol: 1e6, demo: true };
      }
    },

    poll: function(symbol, callback, intervalMs) {
      var self = this;
      var run = function() {
        self.fetch(symbol).then(callback).catch(function(){});
      };
      run();
      return setInterval(run, intervalMs || 15000);
    },
  };

  // ===== Universe Map helpers =====
  var UniverseMap = {
    nodes: KGEN_5D.NODES,

    getNode: function(id) {
      return this.nodes[String(id)] || null;
    },

    navLinks: function(currentId) {
      var html = '';
      var ids = Object.keys(this.nodes);
      for(var i = 0; i < ids.length; i++) {
        var id = ids[i];
        if(id === String(currentId)) continue;
        var n = this.nodes[id];
        html += '<a href="' + n.url + '" style="border-color:' + n.color + '44; color:' + n.color + '">' + id + ' ' + n.name + '</a>';
      }
      return html;
    },
  };

  // ===== Price direction helper =====
  function priceDir(change) {
    if(change > 0) return { text: '▲ ' + change.toFixed(2) + '%', color: '#7cffc5' };
    if(change < 0) return { text: '▼ ' + Math.abs(change).toFixed(2) + '%', color: '#ff4444' };
    return { text: '— 0.00%', color: '#aaa' };
  }

  // ===== Mini candlestick canvas ===== 
  function drawMiniCandles(canvas, candles) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if(!candles || !candles.length) return;

    var highs = candles.map(function(c){ return c.high; });
    var lows = candles.map(function(c){ return c.low; });
    var maxH = Math.max.apply(null, highs);
    var minL = Math.min.apply(null, lows);
    var range = maxH - minL || 1;

    var bw = Math.max(2, Math.floor(w / candles.length) - 1);
    var toY = function(v) { return h - ((v - minL) / range) * h; };

    candles.forEach(function(c, i) {
      var x = i * (bw + 1);
      var bull = c.close >= c.open;
      ctx.fillStyle = bull ? '#7cffc5' : '#ff4444';
      ctx.strokeStyle = bull ? '#7cffc5' : '#ff4444';

      // Wick
      ctx.beginPath();
      ctx.moveTo(x + bw/2, toY(c.high));
      ctx.lineTo(x + bw/2, toY(c.low));
      ctx.lineWidth = 1;
      ctx.stroke();

      // Body
      var yTop = toY(Math.max(c.open, c.close));
      var yBot = toY(Math.min(c.open, c.close));
      ctx.fillRect(x, yTop, bw, Math.max(1, yBot - yTop));
    });
  }

  // ===== Expose globals =====
  global.KGEN_5D = KGEN_5D;
  global.KGEN_StatusBus = StatusBus;
  global.KGEN_Wallet = Wallet;
  global.KGEN_KlineFeed = KlineFeed;
  global.KGEN_UniverseMap = UniverseMap;
  global.KGEN_priceDir = priceDir;
  global.KGEN_drawMiniCandles = drawMiniCandles;

})(window);
