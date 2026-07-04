/*
 * KGEN Universe Runtime — Universe Map Module V1.0
 * Single source: kgen-5d-world-map.json
 */
(function(global) {
  'use strict';

  var DEFAULT_MAP_URL = '../../data/kgen-5d-world-map.json';

  var UniverseMapRuntime = {
    data: null,
    loaded: false,
    nodes: {},
    game5d: null,
    landData: null,

    resolveMapUrl: function(customUrl) {
      if (customUrl) return customUrl;
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || '';
        if (src.indexOf('universe-runtime') >= 0 || src.indexOf('kgen-game-core') >= 0) {
          var base = src.replace(/\/modules\/.*$/, '');
          return base + '/data/kgen-5d-world-map.json';
        }
      }
      return DEFAULT_MAP_URL;
    },

    load: async function(url) {
      var mapUrl = this.resolveMapUrl(url);
      try {
        var res = await fetch(mapUrl);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        this.data = await res.json();
        this.hydrate();
        this.loaded = true;
        if (global.KGEN_UNIVERSE_STATUS_BUS) {
          global.KGEN_UNIVERSE_STATUS_BUS.emit('map:loaded', { version: this.data.version });
        }
        return this.data;
      } catch (e) {
        console.warn('[UniverseMap] load failed, using KGEN_5D fallback', e);
        this.hydrateFromCore();
        this.loaded = true;
        return null;
      }
    },

    hydrate: function() {
      if (!this.data) return;
      var nodes = this.data.nodes || {};
      this.nodes = nodes;
      this.game5d = this.data.game5d || null;
      this.landData = this.data.landData || {};
      this.syncToKGEN5D();
    },

    hydrateFromCore: function() {
      if (!global.KGEN_5D) return;
      this.nodes = {};
      var coreNodes = global.KGEN_5D.NODES || {};
      Object.keys(coreNodes).forEach(function(id) {
        var n = coreNodes[id];
        this.nodes[id] = {
          id: id,
          name: n.name,
          color: n.color,
          url: n.url,
          status: 'UNKNOWN',
        };
      }.bind(this));
    },

    syncToKGEN5D: function() {
      if (!global.KGEN_5D || !this.data) return;
      var u = this.data.universe || {};
      if (u.kgenToken) global.KGEN_5D.ADDR.KGEN_TOKEN = u.kgenToken;
      if (u.lpPair) global.KGEN_5D.ADDR.LP_PAIR = u.lpPair;
      var kp = this.data.kPhysics || {};
      if (kp.taxBpsTotal) global.KGEN_5D.TAX.TOTAL_BPS = kp.taxBpsTotal;

      Object.keys(this.nodes).forEach(function(id) {
        var n = this.nodes[id];
        var relUrl = n.url;
        if (relUrl && relUrl.indexOf('temples/') >= 0) {
          relUrl = '../' + relUrl.split('temples/')[1];
        }
        global.KGEN_5D.NODES[id] = {
          name: n.name,
          label: n.subtitle || n.role || n.name,
          color: n.color,
          url: relUrl || global.KGEN_5D.NODES[id] && global.KGEN_5D.NODES[id].url,
        };
        if (n.contracts) {
          if (n.contracts.heart) global.KGEN_5D.ADDR.HEART_12345 = n.contracts.heart;
          if (n.contracts.brain) global.KGEN_5D.ADDR.BRAIN_11520 = n.contracts.brain;
          if (n.contracts.mars) global.KGEN_5D.ADDR.MARS_108000 = n.contracts.mars;
          if (n.contracts.treasury) global.KGEN_5D.ADDR.TREASURY_8888 = n.contracts.treasury;
          if (n.contracts.taxSplitter) global.KGEN_5D.ADDR.TAX_SPLITTER = n.contracts.taxSplitter;
        }
      }.bind(this));
    },

    getNode: function(id) {
      return this.nodes[String(id)] || null;
    },

    navLinksHTML: function(currentId) {
      if (global.KGEN_UniverseMap && global.KGEN_UniverseMap.navLinks) {
        return global.KGEN_UniverseMap.navLinks(currentId);
      }
      var html = '';
      Object.keys(this.nodes).forEach(function(id) {
        if (id === String(currentId)) return;
        var n = this.nodes[id];
        var href = n.url || '#';
        if (href.indexOf('K線西遊記/') === 0) href = '../../' + href.replace('K線西遊記/', '');
        html += '<a href="' + href + '" style="border-color:' + n.color + '44;color:' + n.color + '">' + id + ' ' + n.name + '</a>';
      }.bind(this));
      return html;
    },

    renderDock: function(containerId, currentId) {
      var el = document.getElementById(containerId);
      if (!el) return;
      el.className = 'kgen-universe-dock';
      var ids = Object.keys(this.nodes);
      var html = '<a href="../../index.html" class="kgen-dock-galaxy">🌌 星系</a>';
      ids.forEach(function(id) {
        var n = this.nodes[id];
        var coreNode = global.KGEN_5D && global.KGEN_5D.NODES && global.KGEN_5D.NODES[id];
        var href = (coreNode && coreNode.url) || n.url || '#';
        if (href.indexOf('K線西遊記/') === 0) {
          href = '../../' + href.replace('K線西遊記/', '');
        }
        if (/\/game\//.test(location.pathname) && href.indexOf('../') === 0 && href.indexOf('temples') < 0) {
          href = '../../temples/' + href.replace(/^\.\.\//, '');
        }
        var active = id === String(currentId) ? ' kgen-dock-active' : '';
        html += '<a href="' + href + '" class="kgen-dock-node' + active + '" style="--node-color:' + n.color + '">' + id + '</a>';
      }.bind(this));
      html += '<a href="../../game/kline-5d/index.html" class="kgen-dock-game">🎮 5D</a>';
      el.innerHTML = html;
    },

    drawCosmicMap: function(canvas, opts) {
      opts = opts || {};
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var w = canvas.width = canvas.offsetWidth || 600;
      var h = canvas.height = opts.height || 220;
      ctx.clearRect(0, 0, w, h);

      var bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#050810');
      bg.addColorStop(1, '#0a0510');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      var nodeList = Object.keys(this.nodes).map(function(id) {
        var n = this.nodes[id];
        var k = (n.coords && n.coords.k) || Number(id) || 0;
        return { id: id, n: n, k: k };
      }.bind(this));

      var ks = nodeList.map(function(x) { return x.k; });
      var minK = Math.min.apply(null, ks.concat([0]));
      var maxK = Math.max.apply(null, ks.concat([1]));
      var range = maxK - minK || 1;

      nodeList.forEach(function(item) {
        var x = 40 + ((item.k - minK) / range) * (w - 80);
        var y = h / 2 + (item.id === '16888' ? 30 : item.id === '11520' ? -25 : 0);
        var col = item.n.color || '#ffd778';

        ctx.strokeStyle = col + '44';
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, item.id === String(opts.highlight) ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.id, x, y + 22);
      });

      ctx.fillStyle = 'rgba(255,215,120,.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KGEN 宇宙航道 · PrimeForge', w / 2, h - 8);
    },
  };

  global.KGEN_UNIVERSE_MAP = UniverseMapRuntime;
})(window);
