/*
 * KGEN Universe Runtime — NPC Module V1.0
 * Temple NPCs: 神猴交易員, 銀行使者, 斬妖台守衛, etc.
 */
(function(global) {
  'use strict';

  var NPC_REGISTRY = {
    '11520': {
      id: 'wukong-trader',
      name: '神猴交易員',
      emoji: '🐵',
      greetings: [
        '花果山交易所開市！K 軸作功，vK 定多空。',
        '土地 NFT 掛單中，0.0001K 地籍單位起。',
        '今日 BNB 行情決定宇宙航道方向。',
      ],
      actions: ['quote', 'land', 'swap'],
    },
    '18888': {
      id: 'divine-banker',
      name: '靈霄銀行使者',
      emoji: '🏦',
      greetings: [
        '神明銀行 Treasury 只讀，稅率 0.30% 永久鎖定。',
        'Reward Pool 由 KGEN 稅收 5bps 注入。',
        'DappBay 顯示可改稅是誤判，bytecode 已鎖死。',
      ],
      actions: ['treasury', 'reward', 'security'],
    },
    '18921': {
      id: 'zhanyao-guard',
      name: '斬妖台守衛',
      emoji: '🗡️',
      greetings: [
        'Auto LP 路由啟動，稅收 5bps 自動加池。',
        'LP Burn 儀式每週執行，Pair Reserve 即時監控。',
        '斬妖台只路由，不改稅率。',
      ],
      actions: ['lp', 'burn', 'apr'],
    },
    '108000': {
      id: 'mars-host',
      name: '火星管家',
      emoji: '🔴',
      greetings: [
        '齊天豪宅 500 席位，θ 108000 座標。',
        '購屋需 5000 KGEN，NFT Seat 鏈上鑄造。',
        'Warp Gate 通往五指山與廣寒宮。',
      ],
      actions: ['view', 'mint', 'warp'],
    },
    'game': {
      id: 'primeforge-guide',
      name: 'PrimeForge 導航員',
      emoji: '⌖',
      greetings: [
        'K線5D峽谷：多方從 12345，空方從 16888。',
        '佔領中路節點獲得文明加成。',
        '完成任務升級神兵與宇宙飛船。',
      ],
      actions: ['quest', 'boss', 'warp'],
    },
  };

  var NPCRuntime = {
    registry: NPC_REGISTRY,

    get: function(nodeId) {
      return NPC_REGISTRY[String(nodeId)] || null;
    },

    randomGreeting: function(nodeId) {
      var npc = this.get(nodeId);
      if (!npc || !npc.greetings.length) return 'KGEN Universe 歡迎你。';
      return npc.greetings[Math.floor(Math.random() * npc.greetings.length)];
    },

    renderPanel: function(containerId, nodeId) {
      var el = document.getElementById(containerId);
      var npc = this.get(nodeId);
      if (!el || !npc) return;
      el.innerHTML =
        '<div class="kgen-npc-card">' +
        '<div class="kgen-npc-avatar">' + npc.emoji + '</div>' +
        '<div class="kgen-npc-body">' +
        '<div class="kgen-npc-name">' + npc.name + '</div>' +
        '<div class="kgen-npc-msg" id="npc-msg-' + nodeId + '">' + this.randomGreeting(nodeId) + '</div>' +
        '<button type="button" class="kgen-btn kgen-btn-sm" onclick="KGEN_UNIVERSE_NPC.talk(\'' + nodeId + '\')">對話</button>' +
        '</div></div>';
    },

    talk: function(nodeId) {
      var msg = this.randomGreeting(nodeId);
      var el = document.getElementById('npc-msg-' + nodeId);
      if (el) el.textContent = msg;
      if (global.KGEN_UNIVERSE_STATUS_BUS) {
        global.KGEN_UNIVERSE_STATUS_BUS.emit('npc:talk', { nodeId: nodeId, msg: msg });
      }
      return msg;
    },
  };

  global.KGEN_UNIVERSE_NPC = NPCRuntime;
})(window);
