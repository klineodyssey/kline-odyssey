/*
 * KGEN Universe Runtime — Physics Module V1.0
 * K-axis work, vK direction, M_engine > 0 axioms from Physics Runtime CURRENT
 */
(function(global) {
  'use strict';

  var Physics = {
    VERSION: 'V1.0',
    KGEN_MASS_CONSTANT: 1,
    TAX_BPS_TOTAL: 30,

    /** vK sign → bull/bear faction */
    vkDirection: function(changePct) {
      if (changePct > 0) return { side: 'bull', label: '+K 多方', color: '#7cffc5' };
      if (changePct < 0) return { side: 'bear', label: '-K 空方', color: '#ff4444' };
      return { side: 'neutral', label: 'K=0 平衡', color: '#ffd778' };
    },

    /** Engine mass must stay positive */
    validateEngineMass: function(m) {
      var n = Number(m);
      return Number.isFinite(n) && n > 0;
    },

    /** K-distance between two universe nodes */
    kDistance: function(a, b) {
      if (!a || !b) return 0;
      var ak = (a.coords && a.coords.k) || Number(a.id) || 0;
      var bk = (b.coords && b.coords.k) || Number(b.id) || 0;
      return Math.abs(ak - bk);
    },

    /** Warp cost estimate (demo formula) */
    warpCost: function(fromId, toId, nodes) {
      var a = nodes && nodes[String(fromId)];
      var b = nodes && nodes[String(toId)];
      return this.kDistance(a, b) * 0.001;
    },

    /** Tax split breakdown (immutable 0.30%) */
    taxSplit: function(amount) {
      var amt = Number(amount) || 0;
      return {
        total: amt * 0.003,
        burn: amt * 0.001,
        bank: amt * 0.001,
        reward: amt * 0.0005,
        autolp: amt * 0.0005,
      };
    },
  };

  global.KGEN_UNIVERSE_PHYSICS = Physics;
})(window);
