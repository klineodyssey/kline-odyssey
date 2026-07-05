/*
KGEN Universe Runtime — Temple Hub V0.2
Shared HUD, navigation, quests, NPC for all temple shells.
*/
(function(global){
  'use strict';

  var ROOT = '../../';
  var NAV_IDS = ['12345','16888','11520','108000','18888','18921','8888','8895','20888','21319','21520','21666','21888','22188','23333'];

  function navLinks(currentId, depth) {
    depth = depth || 2;
    var prefix = depth === 2 ? '../' : '../../';
    var html = '<a href="' + ROOT + 'index.html">🌌 星系</a>';
    html += '<a href="' + prefix + '12345/index.html">⚡ 12345</a>';
    html += '<a href="' + ROOT + 'game/kline-5d/index.html">🎮 5D</a>';
    if (global.KGEN_5D && KGEN_5D.NODES) {
      Object.keys(KGEN_5D.NODES).forEach(function(id){
        if (id === String(currentId)) return;
        var n = KGEN_5D.NODES[id];
        if (!n || !n.url) return;
        var href = n.url.indexOf('/') === 0 ? n.url : (depth === 2 ? '../' : '../../') + n.url.replace(/^\.\.\//, '');
        html += '<a href="' + href + '" style="border-color:' + (n.color||'#fff') + '44">' + id + '</a>';
      });
    }
    return html;
  }

  function renderEntryCards(container, excludeId) {
    if (!container || !global.KGEN_5D) return;
    var html = '';
    Object.keys(KGEN_5D.NODES).forEach(function(id){
      if (id === String(excludeId)) return;
      var n = KGEN_5D.NODES[id];
      html += '<a href="' + n.url + '" class="kgen-card kgen-entry-card" style="border-color:' + n.color + '55">' +
        '<div class="kgen-entry-id" style="color:' + n.color + '">' + id + '</div>' +
        '<div class="kgen-entry-name">' + n.name + '</div>' +
        '<div class="kgen-entry-sub">' + (n.label || n.gameplay || '') + '</div></a>';
    });
    container.innerHTML = html;
  }

  function renderQuestPanel(container, quests) {
    if (!container) return;
    var html = '<div class="kgen-quest-list">';
    (quests || []).forEach(function(q, i){
      var done = q.done ? 'done' : '';
      html += '<div class="kgen-quest ' + done + '"><div class="kgen-quest-title">' + (q.done ? '✅ ' : '📜 ') + q.title + '</div>' +
        '<div class="kgen-quest-desc">' + q.desc + '</div>' +
        (q.reward ? '<div class="kgen-quest-reward">獎勵：' + q.reward + '</div>' : '') + '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderNpc(container, npc) {
    if (!container || !npc) return;
    container.innerHTML =
      '<div class="kgen-npc">' +
        '<div class="kgen-npc-avatar">' + (npc.avatar || '🧙') + '</div>' +
        '<div class="kgen-npc-body">' +
          '<div class="kgen-npc-name">' + npc.name + '</div>' +
          '<div class="kgen-npc-role">' + (npc.role || '') + '</div>' +
          '<div class="kgen-npc-dialog">' + npc.dialog + '</div>' +
        '</div></div>';
  }

  function loadWorldMap() {
    var path = ROOT + 'data/kgen-5d-world-map.json';
    return fetch(path).then(function(r){ return r.json(); }).catch(function(){ return null; });
  }

  function initDemoWallet(statusBus, balanceEl) {
    if (!global.KGEN_Wallet) return;
    var demo = { kgen: 8888, bnb: 1.234, usdt: 500 };
    if (balanceEl) {
      balanceEl.innerHTML = '<span class="kgen-pill gold">Demo KGEN ' + demo.kgen + '</span> ' +
        '<span class="kgen-pill cyan">BNB ' + demo.bnb + '</span>';
    }
    if (statusBus) statusBus.push('Demo 模式 — 不接真錢包交易');
    return demo;
  }

  function showDecompositionOverlay(msg) {
    var el = document.getElementById('kgen-decomp-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kgen-decomp-overlay';
      el.className = 'kgen-decomp-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = '<div class="kgen-decomp-box"><div class="kgen-decomp-flash">💀</div><div class="kgen-decomp-text">' + msg + '</div></div>';
    el.classList.add('active');
    setTimeout(function(){ el.classList.remove('active'); }, 3200);
  }

  global.KGEN_TempleHub = {
    VERSION: 'V0.2',
    navLinks: navLinks,
    renderEntryCards: renderEntryCards,
    renderQuestPanel: renderQuestPanel,
    renderNpc: renderNpc,
    loadWorldMap: loadWorldMap,
    initDemoWallet: initDemoWallet,
    showDecompositionOverlay: showDecompositionOverlay,
    NAV_IDS: NAV_IDS,
  };
})(window);
