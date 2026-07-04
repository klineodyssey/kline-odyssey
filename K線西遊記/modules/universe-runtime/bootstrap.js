/*
 * KGEN Universe Runtime — Bootstrap V1.0
 * Single entry: window.KGEN_UNIVERSE_RUNTIME
 *
 * Load order (before this file):
 *   kgen-game-core.js
 *   physics.js, status-bus.js, wallet.js, camera.js,
 *   audio.js, animation.js, universe-map.js, npc.js,
 *   civilization.js, chain-read.js
 */
(function(global) {
  'use strict';

  var Runtime = {
    VERSION: 'V1.0',
    BUILD: '20260704-UNIVERSE-RUNTIME-V1.0',
    booted: false,
    pageNodeId: null,

    Physics: function() { return global.KGEN_UNIVERSE_PHYSICS; },
    Wallet: function() { return global.KGEN_UNIVERSE_WALLET; },
    Camera: global.KGEN_UNIVERSE_CAMERA,
    UniverseMap: function() { return global.KGEN_UNIVERSE_MAP; },
    StatusBus: function() { return global.KGEN_UNIVERSE_STATUS_BUS; },
    Audio: function() { return global.KGEN_UNIVERSE_AUDIO; },
    Animation: function() { return global.KGEN_UNIVERSE_ANIMATION; },
    NPC: function() { return global.KGEN_UNIVERSE_NPC; },
    Civilization: function() { return global.KGEN_UNIVERSE_CIVILIZATION; },
    Chain: function() { return global.KGEN_UNIVERSE_CHAIN; },

    boot: async function(opts) {
      opts = opts || {};
      this.pageNodeId = opts.nodeId || null;

      var bus = global.KGEN_UNIVERSE_STATUS_BUS;
      if (opts.statusElementId) bus.bindDOM(opts.statusElementId);

      await global.KGEN_UNIVERSE_MAP.load(opts.mapUrl);

      if (opts.nodeId) {
        global.KGEN_UNIVERSE_CIVILIZATION.visitNode(opts.nodeId);
      }

      if (opts.npcContainerId && opts.nodeId) {
        global.KGEN_UNIVERSE_NPC.renderPanel(opts.npcContainerId, opts.nodeId);
      }

      if (opts.civContainerId) {
        global.KGEN_UNIVERSE_CIVILIZATION.renderHUD(opts.civContainerId);
      }

      if (opts.universeDockId) {
        global.KGEN_UNIVERSE_MAP.renderDock(opts.universeDockId, opts.nodeId);
      }

      if (opts.cosmicMapCanvasId) {
        var canvas = document.getElementById(opts.cosmicMapCanvasId);
        if (canvas) {
          global.KGEN_UNIVERSE_MAP.drawCosmicMap(canvas, { highlight: opts.nodeId });
          global.KGEN_UNIVERSE_ANIMATION.add(function() {
            /* static map — redraw on resize only */
          });
        }
      }

      if (opts.walletButtonId) {
        var btn = document.getElementById(opts.walletButtonId);
        if (btn) {
          btn.addEventListener('click', async function() {
            try {
              await global.KGEN_UNIVERSE_WALLET.connect(bus);
              global.KGEN_UNIVERSE_CIVILIZATION.onWalletConnected();
              if (opts.onWalletConnected) opts.onWalletConnected();
            } catch (e) {
              bus.emit('wallet:error', { msg: e.message || e });
            }
          });
        }
      }

      bus.on('civ:levelup', function(p) {
        bus.emit('status', { msg: '🎉 文明升級 Lv.' + p.level });
      });

      bus.on('civ:quest', function(p) {
        if (p.quest) bus.emit('status', { msg: '✅ 任務完成：' + p.quest.name });
        if (opts.civContainerId) global.KGEN_UNIVERSE_CIVILIZATION.renderHUD(opts.civContainerId);
      });

      this.booted = true;
      bus.emit('runtime:boot', { version: this.VERSION, nodeId: opts.nodeId });
      bus.emit('status', { msg: 'Universe Runtime ' + this.VERSION + ' 已啟動 · 節點 ' + (opts.nodeId || '—') });

      return this;
    },

    /** Standard script URLs relative to temples/ */
    SCRIPT_TAGS: [
      '../../modules/kgen-game-core.js',
      '../../modules/universe-runtime/physics.js',
      '../../modules/universe-runtime/status-bus.js',
      '../../modules/universe-runtime/wallet.js',
      '../../modules/universe-runtime/camera.js',
      '../../modules/universe-runtime/audio.js',
      '../../modules/universe-runtime/animation.js',
      '../../modules/universe-runtime/universe-map.js',
      '../../modules/universe-runtime/npc.js',
      '../../modules/universe-runtime/civilization.js',
      '../../modules/universe-runtime/chain-read.js',
      '../../modules/universe-runtime/bootstrap.js',
    ],

    GAME_SCRIPT_TAGS: [
      '../../modules/kgen-game-core.js',
      '../../modules/universe-runtime/physics.js',
      '../../modules/universe-runtime/status-bus.js',
      '../../modules/universe-runtime/wallet.js',
      '../../modules/universe-runtime/camera.js',
      '../../modules/universe-runtime/audio.js',
      '../../modules/universe-runtime/animation.js',
      '../../modules/universe-runtime/universe-map.js',
      '../../modules/universe-runtime/npc.js',
      '../../modules/universe-runtime/civilization.js',
      '../../modules/universe-runtime/chain-read.js',
      '../../modules/universe-runtime/bootstrap.js',
      'kline-5d-game-engine.js',
    ],
  };

  global.KGEN_UNIVERSE_RUNTIME = Runtime;
})(window);
