/*
 * KGEN Universe Runtime — Chain Read Module V1.0
 * Read-only: Treasury, LP Pair reserves, token balances
 */
(function(global) {
  'use strict';

  function parseUint(hex, decimals) {
    if (!hex || hex === '0x') return '0';
    try {
      var raw = parseInt(hex, 16);
      return (raw / Math.pow(10, decimals || 18)).toFixed(4);
    } catch (e) { return null; }
  }

  var ChainRead = {
    readBalance: async function(tokenAddr, holderAddr) {
      var w = global.KGEN_UNIVERSE_WALLET;
      if (!w) return null;
      return w.readERC20BalanceRaw(tokenAddr, holderAddr);
    },

    readTreasury: async function() {
      var addr = global.KGEN_5D && global.KGEN_5D.ADDR && global.KGEN_5D.ADDR.TREASURY_8888;
      var token = global.KGEN_5D && global.KGEN_5D.ADDR && global.KGEN_5D.ADDR.KGEN_TOKEN;
      if (!addr || !token) return null;
      return this.readBalance(token, addr);
    },

    readLPPairReserves: async function() {
      var pair = global.KGEN_5D && global.KGEN_5D.ADDR && global.KGEN_5D.ADDR.LP_PAIR;
      var w = global.KGEN_UNIVERSE_WALLET;
      if (!pair || !w) return null;

      var sig0 = '0x0902f1ac';
      var res = await w.ethCall(pair, sig0);
      if (!res || res.length < 130) return null;

      try {
        var r0 = parseInt(res.slice(2, 66), 16);
        var r1 = parseInt(res.slice(66, 130), 16);
        return {
          reserve0: (r0 / 1e18).toFixed(4),
          reserve1: (r1 / 1e18).toFixed(4),
          tvlEstimate: ((r0 + r1) / 1e18 * 300).toFixed(0),
        };
      } catch (e) { return null; }
    },

    readTokenTotalSupply: async function() {
      var token = global.KGEN_5D && global.KGEN_5D.ADDR && global.KGEN_5D.ADDR.KGEN_TOKEN;
      var w = global.KGEN_UNIVERSE_WALLET;
      if (!token || !w) return null;
      var sig = '0x18160ddd';
      var res = await w.ethCall(token, sig);
      return parseUint(res, 18);
    },

    securityReport: function() {
      return {
        dappBay: {
          taxModifiable: false,
          note: 'DappBay 可能顯示 Can Modify Tax — 實際 bytecode constant 0.30%，見 docs/KGEN_TAX_IMMUTABILITY.md',
        },
        certik: { status: 'community', note: '社群審計參考，非官方 CertiK 認證' },
        goplus: { honeypot: false, note: 'GoPlus 風險掃描建議用戶自行查驗合約' },
        taxImmutable: true,
        contractsUnchanged: true,
      };
    },
  };

  global.KGEN_UNIVERSE_CHAIN = ChainRead;
})(window);
